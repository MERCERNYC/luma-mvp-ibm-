# Session 11 — MockAgent: Deterministic Development Provider

## Goal

Define MockAgent's role as the deterministic development and demo provider that lets the complete LUMA workflow run without IBM watsonx, Gmail, or any paid AI API. Fix the `senderEmail` gap in `ClassifyInput`, write an evaluation harness, and achieve 100% classification accuracy on the 50-email ground-truth dataset.

---

## Architecture

```
50 evaluation emails  (src/data/emailDataset.ts)
        ↓
  toClassifyInput()   (src/types/email.ts)
        ↓
    MockAgent         (src/services/agent/MockAgent.ts)
        ↓
   1. UNDERSTAND      detectEmailType()
        ↓
   2. PRIORITIZE      prioritize()
        ↓
   3. RECOMMEND       recommend()
        ↓
   AgentService       (src/services/agent/AgentService.ts)
        ↓
  POST /api/agent/classify
  POST /api/agent/daily-brief
        ↓
  useClassifiedEmails (src/hooks/useClassifiedEmails.ts)
        ↓
  LUMA dashboard      (src/app/page.tsx)
```

The entire pipeline runs with zero external calls. `AGENT_PROVIDER` is unset or `"mock"` — `AgentService` resolves `MockAgent` by default.

---

## Files changed

| File | Change |
|---|---|
| `src/services/agent/types.ts` | **Updated** — `senderEmail: string` added to `ClassifyInput` |
| `src/types/email.ts` | **Updated** — `toClassifyInput` now includes `senderEmail` |
| `src/services/agent/MockAgent.ts` | **Updated** — three signal fixes (see below) |
| `scripts/evaluate-mock-agent.ts` | **New** — evaluation harness |

---

## Problem from Session 10

`ClassifyInput` was missing the `senderEmail` field. `detectEmailType` was written to match against raw addresses (e.g. `noreply@spotify.com`) but `toClassifyInput` silently dropped the field before it ever reached MockAgent — sender pattern matching was running on display names only.

---

## MockAgent responsibilities

MockAgent is the **deterministic development and demo provider**. It simulates the structured reasoning WatsonxAgent will perform via real inference, using keyword rules instead of an LLM. Same inputs, same output contract, no API cost.

### Three-stage pipeline

#### Stage 1 — UNDERSTAND: `detectEmailType()`

Reads `sender`, `senderEmail`, and content signals to assign a semantic category:

| Type | Meaning |
|---|---|
| `communication` | Person-to-person or org-to-person requiring awareness or reply |
| `notification` | Automated transactional status update |
| `promotion` | Marketing, loyalty, recommendations |
| `potential_spam` | Suspicious, unsolicited, or deceptive content |

#### Stage 2 — PRIORITIZE: `prioritize()`

Applies the **three-part urgency test** to communications:

1. **Time sensitivity** — a deadline or window that closes
2. **Meaningful consequence** — fee, loss, service interruption, safety
3. **User must act** — the email requires something from the user

All three must be present for `action-needed`. Marketing urgency words (`LAST CHANCE`, `ACT NOW`, `ENDS TODAY`) never independently trigger `action-needed`.

Output: `priority`, `requiresAction`, `confidence`.

#### Stage 3 — RECOMMEND: `recommend()`

Maps the decision to human-readable output shown in the dashboard:

- `reason` — "Why LUMA surfaced this"
- `recommendedAction` — one clear next step, or `null` when none is needed

### `generateDailyBrief()`

Counts `action-needed` and `for-later` items from the already-classified inbox and returns a single orienting sentence — the same contract WatsonxAgent will satisfy when it writes the brief using an LLM.

---

## Signal fixes in this session

Three bugs found and fixed via the evaluation harness:

### eval-008 — IRS CP2000 (action-needed → was for-later)

**Root cause:** `"respond by"` correctly fired the action block, but the softener check then saw `"december 1st"` in the body and demoted to `for-later`. Government response notices with explicit deadlines should never be softened.

**Fix:** Added `"response required"`, `"respond by"`, `"sign and return"` to the softener exclusion list in `prioritize()`.

### eval-010 — AAA Auto Insurance (action-needed → was for-later)

**Root cause:** `"aaa"` matched `PROMOTION_SENDER_PATTERNS`. The promotion exclusion guard didn't include `"lapse in coverage"` or `"avoid a lapse"` so the email was typed as `promotion`, which can never reach `action-needed`.

**Fix:** Added `"lapse in coverage"` and `"avoid a lapse"` to the promotion exclusion guard in `detectEmailType()`.

### eval-040 — Netflix recommendation digest (news-updates → was for-later)

**Root cause:** `"shows we think"` was not in the notification content signals, so the Netflix recommendation digest fell through to `promotion` → `for-later`. It is a notification (automated digest), not a promotional offer.

**Fix:** Added `"shows we think"` and `"titles we think"` to the notification content signals in `detectEmailType()`.

---

## Evaluation results

Run: `npx tsx scripts/evaluate-mock-agent.ts`

```
── Per-bucket accuracy ──────────────────────────────────────
  action-needed     18/18  (100%)
  for-later         17/17  (100%)
  news-updates      15/15  (100%)

── Overall ──────────────────────────────────────────────────
  50/50 correct  —  100.0% accuracy
```

---

## ClassifyInput after this session

```ts
export interface ClassifyInput {
  subject:     string;
  preview:     string;
  body:        string;
  sender:      string;      // display name, e.g. "Dani (Teacher)"
  senderEmail: string;      // raw address, e.g. "dani@lincolnelem.edu"
}
```

`senderEmail` feeds `detectEmailType` — the sender pattern lists match against both the display name and the raw address.

---

## Swap story

MockAgent is the default. When WatsonxAgent is ready:

1. Create `src/services/agent/WatsonxAgent.ts` implementing `IAgent`
2. Add the branch in `AgentService.resolveProvider()`:
   ```ts
   if (provider === "watsonx") { return new WatsonxAgent(); }
   ```
3. Set `AGENT_PROVIDER=watsonx` in `.env.local`
4. No changes to `MockAgent`, routes, hooks, or any component

---

## Next session

Session 12 — WatsonxAgent: connect to IBM watsonx.ai, implement `IAgent`, set `AGENT_PROVIDER=watsonx`, and run the evaluation harness against the real model.
