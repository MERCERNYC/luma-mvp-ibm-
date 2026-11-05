# Session 13 — Prioritize & Sort

## Goal

Make the LUMA inbox list reflect the agent's priority judgements by sorting classified emails before they reach the UI — highest-urgency bucket first, and within each bucket the agent's own confidence score as the tiebreaker. No changes to the `IAgent` interface, API routes, or `AgentService`.

---

## What changed

| File | Change |
|---|---|
| `src/hooks/useClassifiedEmails.ts` | **Updated** — `sortByPriority()` helper + sort step between merge and brief |
| `src/app/page.tsx` | **Updated** — footer label reflects sorted order |

`MockAgent`, `types.ts`, `AgentService`, and all API routes are **unchanged**.

---

## Architecture

The sort lives entirely in `useClassifiedEmails`, after classification and before the daily brief call:

```
DEMO_TASKS (inbox order)
      ↓
POST /api/agent/classify
      ↓
results: ClassifyResult[]   ← priority + confidence per email
      ↓
mergedTasks: Task[]         ← priority written back onto each Task
      ↓
sortByPriority()            ← NEW: sort by bucket rank + confidence
      ↓
classifiedTasks: Task[]     ← ordered list the UI renders
      ↓
POST /api/agent/daily-brief
      ↓
{ status, tasks, briefText }
```

---

## Sort logic

### Bucket rank

```ts
const PRIORITY_RANK: Record<TaskPriority, number> = {
  "action-needed": 0,
  "for-later":     1,
  "news-updates":  2,
};
```

### Tiebreaker — confidence descending

Within each bucket, emails with a higher `confidence` score surface first. This means the agent's most-certain `action-needed` judgements appear at the very top.

### Implementation

```ts
function sortByPriority(
  tasks:   Task[],
  results: ClassifyResult[],
): Task[] {
  return tasks
    .map((task, i) => ({ task, result: results[i] }))
    .sort((a, b) => {
      const rankDiff =
        PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority];
      if (rankDiff !== 0) return rankDiff;
      return b.result.confidence - a.result.confidence;
    })
    .map(({ task }) => task);
}
```

`results[i]` is aligned with `tasks[i]` because both arrays are built from `DEMO_TASKS` in the same map order, and the sort is done before the alignment is broken. The `Task` objects themselves carry no `confidence` field — it stays inside `ClassifyResult` and is only used during the sort, keeping the `Task` type clean.

---

## Why this placement

The sort runs in the hook, not in the page component or in MockAgent:

- **Not MockAgent / classifySync** — the agent classifies; it doesn't determine display order. Ordering is a presentation concern.
- **Not page.tsx** — the page renders whatever the hook returns. Putting sort logic in the page would couple UI rendering to classification internals.
- **Hook** — the hook owns the data pipeline between the API and the UI. Sorting here means every consumer of `useClassifiedEmails` gets ordered results automatically.

---

## Confidence values (MockAgent baseline)

| Bucket | Confidence |
|---|---|
| `action-needed` | 0.90 (all 18 emails) |
| `for-later` | 0.78 or 0.85 (17 emails) |
| `news-updates` | 0.92 (all 15 emails) |

Within `for-later`, emails at 0.85 confidence (promotions with explicit hold-expiry) sort above the 0.78 fallback emails. When WatsonxAgent returns variable per-email confidence scores, the tiebreaker will produce a richer ordering automatically.

---

## No regressions

The `IAgent` contract, `ClassifyResult`, `Task`, `AgentService`, and all API routes are unchanged. The evaluation harness (`scripts/evaluate-mock-agent.ts`) still passes 50/50 — classification accuracy is unaffected because sorting is a post-classification step.

---

## Next session

Session 14 — WatsonxAgent: implement `IAgent` against IBM watsonx.ai Agents API, set `AGENT_PROVIDER=watsonx` in `.env.local`, and run `evaluate-mock-agent.ts` to compare LLM accuracy against the 100% MockAgent baseline.
