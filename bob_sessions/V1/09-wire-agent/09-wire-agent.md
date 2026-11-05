# Session 09 — Wire agent.classifyEmail() into the Dashboard

## Goal
Replace hard-coded priority badges and daily brief text with live output from `agent.classifyEmail()` and `agent.generateDailyBrief()`. The dashboard now runs the full classification pipeline on every load, with a skeleton loading state while the agent works.

---

## Files changed

| File | Change |
|---|---|
| `src/hooks/useClassifiedEmails.ts` | **New** — React hook that drives the entire classification pipeline |
| `src/app/page.tsx` | **Updated** — consumes the hook; adds skeleton loading state |

---

## Data flow

```
page.tsx mounts
  └── useClassifiedEmails()
        ├── Promise.all → agent.classifyEmail() × 3  (120 ms each, parallel)
        │     └── returns Task[] with priority set by agent
        └── agent.generateDailyBrief()               (80 ms)
              └── returns one-sentence briefText

status: "loading" → show SkeletonRow × 3, placeholder brief text
status: "ready"   → render EmailRow per task (agent priority badges), live briefText
status: "error"   → show error message + "refresh" prompt
```

---

## Hook design: `useClassifiedEmails`

```ts
const { status, tasks, briefText } = useClassifiedEmails();
// status:    "loading" | "ready" | "error"
// tasks:     Task[]  — agent-assigned priority on each item
// briefText: string  — agent-generated brief sentence
```

- All `agent.classifyEmail()` calls run **in parallel** via `Promise.all` — total latency is one round-trip, not N serial ones
- Cleanup via `cancelled` flag — safe if the component unmounts during the async run
- `selected` state is `Task | null`; falls back to `tasks[0]` once ready — no flash of empty pane

---

## Skeleton loading state

Three `<SkeletonRow />` components with `animate-pulse` fill the email list while the agent runs (~120 ms with MockAgent). The brief card shows `"Summarising your inbox…"` and the subtitle shows `"Checking your inbox…"`.

---

## Swap story

The `agent` singleton lives in `src/services/agent/index.ts`. To move to watsonx:

```ts
// src/services/agent/index.ts — one line change
export const agent: IAgent = new WatsonxAgent(config);
```

No changes to `useClassifiedEmails`, `page.tsx`, or any component.

---

## Build output

```
✓ Compiled successfully in 445ms
✓ TypeScript clean (tsc --noEmit, no errors)
✓ Production build passes (next build)
Route (app): / ○  (Static)
```

---

## Next session
Session 10 — Connect to watsonx.ai: implement `WatsonxAgent` and replace the MockAgent singleton.
