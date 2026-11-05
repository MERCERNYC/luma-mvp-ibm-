# Session 10 — Agent Service: Single Entry Point

## Goal

Enforce the architecture rule that agent code never runs in the browser. Introduce `AgentService` as the single server-side entry point between the application and whichever AI provider is active. Move all agent calls behind Next.js API routes so API keys and provider logic are permanently isolated from the client bundle.

---

## Problem with Session 09

Session 09 wired the agent into the dashboard — but the `agent` singleton was imported directly into `useClassifiedEmails`, a client-side hook. This meant `MockAgent` (and eventually `WatsonxAgent` with real credentials) ran inside the browser bundle. The architecture doc explicitly forbids this:

> *Components and pages never import from `services/agent` directly — they go through API routes in `src/app/`.*

---

## Files changed

| File | Change |
|---|---|
| `src/services/agent/AgentService.ts` | **New** — server-only wrapper; resolves active provider from `AGENT_PROVIDER` env var |
| `src/services/agent/index.ts` | **Updated** — exports `agentService` singleton and `AgentService` class; marked `server-only` |
| `src/app/api/agent/classify/route.ts` | **New** — `POST /api/agent/classify` |
| `src/app/api/agent/daily-brief/route.ts` | **New** — `POST /api/agent/daily-brief` |
| `src/hooks/useClassifiedEmails.ts` | **Updated** — fetches API routes instead of importing `agent` |
| `src/app/page.tsx` | **Updated** — footer text reflects AgentService |

---

## Architecture after this session

```
Page (app/)
  └── useClassifiedEmails (client hook)
        ├── POST /api/agent/classify        ← server boundary
        │     └── AgentService
        │           └── MockAgent (or WatsonxAgent)
        └── POST /api/agent/daily-brief     ← server boundary
              └── AgentService
                    └── MockAgent (or WatsonxAgent)
```

The server boundary means:
- **API keys never reach the browser** — even when WatsonxAgent is wired in
- **Provider logic is isolated** — `useClassifiedEmails` only speaks HTTP
- **Swap story is a one-line env var change** — no hook or component code changes

---

## AgentService design

```ts
class AgentService {
  // Reads AGENT_PROVIDER at module load (server-only)
  // "mock"    → MockAgent   (default)
  // "watsonx" → WatsonxAgent (to be added)

  classifyEmail(input: ClassifyInput): Promise<ClassifyResult>
  generateDailyBrief(input: DailyBriefInput): Promise<DailyBriefResult>
}
```

The constructor accepts an optional injected `IAgent` for testing — tests can pass a stub without touching env vars.

---

## API routes

### `POST /api/agent/classify`

```
Request:  { emails: ClassifyInput[] }
Response: { results: ClassifyResult[] }
Errors:   400 (bad body) | 500 (provider error)
```

Fans out `agentService.classifyEmail()` in parallel via `Promise.all` — same latency profile as Session 09.

### `POST /api/agent/daily-brief`

```
Request:  { emails: { subject, priority, sender }[], userName: string }
Response: { text: string }
Errors:   400 (bad body) | 500 (provider error)
```

---

## Hook changes: `useClassifiedEmails`

The external signature is **identical** — `{ status, tasks, briefText }` — so no page or component code required changes. Internally, direct `agent.*` calls are replaced with `fetch()` to the two API routes. The `cancelled` flag and error handling work identically.

The only import removed was:
```ts
// before
import { agent } from "@/services/agent";

// after — no agent import; services/agent is server-only
```

---

## Swap story

To connect IBM watsonx.ai:
1. Create `src/services/agent/WatsonxAgent.ts` implementing `IAgent`
2. Add the branch in `AgentService.resolveProvider()`:
   ```ts
   if (provider === "watsonx") { return new WatsonxAgent(); }
   ```
3. Set `AGENT_PROVIDER=watsonx` in `.env.local`
4. No changes to routes, hooks, or any component

---

## Build output

```
✓ Compiled successfully in 711ms
✓ TypeScript clean (tsc --noEmit, no errors)
✓ Production build passes (next build)

Route (app)
  ○ /
  ○ /design
  ƒ /api/agent/classify        ← new
  ƒ /api/agent/daily-brief     ← new
```

---

## Next session

Session 11 — Implement `WatsonxAgent`: connect to IBM watsonx.ai, set `AGENT_PROVIDER=watsonx`, and replace MockAgent in production.
