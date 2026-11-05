# Session 14 — watsonx Orchestrate

## Goal

Design the architecture for replacing `MockAgent` with a real IBM watsonx Orchestrate agent that implements the UNDERSTAND → PRIORITIZE → RECOMMEND pipeline. No code written this session — decisions and prerequisites established.

---

## What changed

Nothing in the codebase. This was a planning and design session.

---

## Architecture decision

LUMA's agent layer is already swap-ready. The `IAgent` interface, `AgentService`, and both API routes are unchanged. The only new file needed is `WatsonxAgent.ts` — a new `IAgent` implementation that calls watsonx Orchestrate instead of running keyword logic locally.

### Platform

**watsonx Orchestrate** (separately provisioned IBM product) — not watsonx.ai Agent Lab.

- The user has a provisioned Orchestrate instance with URL and API key.
- watsonx.ai Agent Lab is being retired (13 Aug 2026); Orchestrate Agent Builder is the forward path.

### Two agents in Orchestrate Agent Builder

One agent per `IAgent` method:

| Agent name | Implements | Tools |
|---|---|---|
| `luma-classify` | `classifyEmail()` | None — all inputs are in the email payload |
| `luma-daily-brief` | `generateDailyBrief()` | None — all inputs are provided |

**No tools are registered at v1.** Tools are only warranted when external information is genuinely required (calendar, contacts, threat intel). The email body, subject, sender, and preview contain everything needed for classification. Adding tools to look agentic when they serve no function was explicitly rejected.

### Why this is still agentic

The agent runs ReAct (Reason + Act) reasoning through the three stages before producing output — even without tool calls. The architecture supports tools being added later (calendar lookup, domain reputation, contact enrichment) without any changes to LUMA's code. That extensibility is the agentic property that matters here.

---

## The UNDERSTAND → PRIORITIZE → RECOMMEND pipeline

This pipeline is already encoded in `MockAgent.ts` (lines 6–41). The Orchestrate agent implements the same three stages with genuine LLM reasoning:

### UNDERSTAND → `emailType`

What kind of thing is this email?

```
communication | notification | promotion | potential_spam
```

The email type gates the entire rest of the decision. A `promotion` can never become `action-needed` regardless of urgency language. `potential_spam` is never escalated.

### PRIORITIZE → `priority` + `urgencyScore`

Three-part test. **All three must be true** for `action-needed`:
1. A real deadline or closing window
2. A meaningful consequence — fee, service loss, safety, child affected
3. Sofia must actually do something

Marketing urgency words (`LAST CHANCE`, `ACT NOW`, `ENDS TODAY`) never independently qualify. Sender importance alone never qualifies.

`urgencyScore` tiers within `action-needed`:

| Score | Meaning |
|---|---|
| 1.0 | Fraud alert or same-day deadline |
| 0.9 | Tomorrow or end of day |
| 0.85 | This week (~5 days) |
| 0.75 | Within 10 days |
| 0.6 | Within 30 days |
| 0.5 | No deadline (default) |
| 0.4 | Overdue/expired, no longer actionable |
| 0.5 | `for-later` (always) |
| 0.3 | `news-updates` (always) |

### Optional tool call

Only if the email content is insufficient to answer one of the PRIORITIZE questions. No such case exists in the current 50-email dataset. The hook is architectural — real tool calls come when LUMA gains capabilities that genuinely need external data.

### RECOMMEND → `reason` + `recommendedAction`

- `reason` — one sentence Sofia reads in the UI
- `recommendedAction` — one concrete next step, or `null`

---

## `WatsonxAgent.ts` structure (to be implemented next session)

```
WatsonxAgent
  ├── constructor()         — reads env vars, validates they exist
  ├── getToken()            — IAM token fetch + cache (expires 3600s, refresh at <5 min)
  ├── callAgent()           — POST to Orchestrate endpoint, returns response text
  ├── classifyEmail()       — serialises email → user message, calls luma-classify, JSON.parse()
  └── generateDailyBrief()  — serialises inbox → user message, calls luma-daily-brief, JSON.parse()
```

### Authentication

IBM Cloud IAM bearer token, fetched at runtime from:
```
POST https://iam.cloud.ibm.com/identity/token
Content-Type: application/x-www-form-urlencoded
Body: grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=YOUR_KEY
```

Token is cached with its expiry time and refreshed before it expires. One token cache per server process.

### Env vars (`.env.local`)

```
AGENT_PROVIDER=watsonx
WATSONX_API_KEY=...
ORCHESTRATE_CLASSIFY_URL=...
ORCHESTRATE_BRIEF_URL=...
```

The `ORCHESTRATE_*` URLs come from the Orchestrate Agent Builder → deployed agent → API details panel.

---

## AgentService swap

One line in `AgentService.ts` (already stubbed at line 50):

```ts
if (provider === "watsonx") { return new WatsonxAgent(); }
```

No changes to routes, hook, page, or any component.

---

## Prerequisites before implementation

- [ ] `luma-classify` agent created in Orchestrate Agent Builder with system prompt encoding the three-stage pipeline
- [ ] `luma-daily-brief` agent created in Orchestrate Agent Builder
- [ ] Both agents deployed; endpoint URLs retrieved from API details panel
- [ ] Authentication header format confirmed from API details panel
- [ ] `WATSONX_API_KEY` (IBM Cloud IAM key) ready
- [ ] Endpoint URLs noted for `.env.local`

---

## Next session

Session 15 — Implement `WatsonxAgent.ts`: build the IAM token cache, `callAgent()`, `classifyEmail()`, and `generateDailyBrief()`; update `AgentService.ts` and `index.ts`; create `.env.local.example`; run `evaluate-mock-agent.ts` to compare LLM accuracy against the 50-email ground truth.
