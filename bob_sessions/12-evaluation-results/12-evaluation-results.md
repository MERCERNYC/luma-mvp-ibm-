# Session 12 — Evaluation Results

## Goal

Run the MockAgent evaluation harness against the complete 50-email ground-truth dataset and record the final results. No code was changed this session — this is the accuracy baseline that WatsonxAgent must match or exceed.

---

## Evaluation run

```
npx tsx scripts/evaluate-mock-agent.ts
```

---

## Full results

```
── Results ──────────────────────────────────────────────────
ID          Expected        Got             Conf   Pass
────────────────────────────────────────────────────────────
eval-001    action-needed   action-needed   0.90   ✓
eval-002    action-needed   action-needed   0.90   ✓
eval-003    action-needed   action-needed   0.90   ✓
eval-004    action-needed   action-needed   0.90   ✓
eval-005    action-needed   action-needed   0.90   ✓
eval-006    action-needed   action-needed   0.90   ✓
eval-007    action-needed   action-needed   0.90   ✓
eval-008    action-needed   action-needed   0.90   ✓
eval-009    action-needed   action-needed   0.90   ✓
eval-010    action-needed   action-needed   0.90   ✓
eval-011    action-needed   action-needed   0.90   ✓
eval-012    action-needed   action-needed   0.90   ✓
eval-013    action-needed   action-needed   0.90   ✓
eval-014    action-needed   action-needed   0.90   ✓
eval-015    action-needed   action-needed   0.90   ✓
eval-016    action-needed   action-needed   0.90   ✓
eval-017    action-needed   action-needed   0.90   ✓
eval-018    action-needed   action-needed   0.90   ✓
eval-019    for-later       for-later       0.78   ✓
eval-020    for-later       for-later       0.78   ✓
eval-021    for-later       for-later       0.85   ✓
eval-022    for-later       for-later       0.78   ✓
eval-023    for-later       for-later       0.85   ✓
eval-024    for-later       for-later       0.85   ✓
eval-025    for-later       for-later       0.78   ✓
eval-026    for-later       for-later       0.78   ✓
eval-027    for-later       for-later       0.85   ✓
eval-028    for-later       for-later       0.78   ✓
eval-029    for-later       for-later       0.78   ✓
eval-030    for-later       for-later       0.78   ✓
eval-031    for-later       for-later       0.85   ✓
eval-032    for-later       for-later       0.85   ✓
eval-033    for-later       for-later       0.78   ✓
eval-034    for-later       for-later       0.78   ✓
eval-035    for-later       for-later       0.85   ✓
eval-036    news-updates    news-updates    0.92   ✓
eval-037    news-updates    news-updates    0.92   ✓
eval-038    news-updates    news-updates    0.92   ✓
eval-039    news-updates    news-updates    0.92   ✓
eval-040    news-updates    news-updates    0.92   ✓
eval-041    news-updates    news-updates    0.92   ✓
eval-042    news-updates    news-updates    0.92   ✓
eval-043    news-updates    news-updates    0.92   ✓
eval-044    news-updates    news-updates    0.92   ✓
eval-045    news-updates    news-updates    0.92   ✓
eval-046    news-updates    news-updates    0.92   ✓
eval-047    news-updates    news-updates    0.92   ✓
eval-048    news-updates    news-updates    0.92   ✓
eval-049    news-updates    news-updates    0.92   ✓
eval-050    news-updates    news-updates    0.92   ✓

── Per-bucket accuracy ──────────────────────────────────────
  action-needed     18/18  (100%)
  for-later         17/17  (100%)
  news-updates      15/15  (100%)

── Overall ──────────────────────────────────────────────────
  50/50 correct  —  100.0% accuracy
```

---

## Confidence ranges

| Bucket | Confidence |
|---|---|
| `action-needed` | 0.90 (all 18) |
| `for-later` | 0.78 or 0.85 (17 total) |
| `news-updates` | 0.92 (all 15) |

---

## What this baseline means

MockAgent achieves 100% accuracy on the 50-email ground-truth dataset using deterministic keyword rules — no LLM, no API calls. This result is the target WatsonxAgent must meet or exceed when the real IBM watsonx.ai integration is wired up in Session 13.

The evaluation harness (`scripts/evaluate-mock-agent.ts`) is the shared fixture: run it against any `IAgent` implementation to compare performance directly.

---

## Next session

Session 13 — WatsonxAgent: implement `IAgent` against IBM watsonx.ai, set `AGENT_PROVIDER=watsonx`, and run `evaluate-mock-agent.ts` to compare LLM accuracy against the 100% MockAgent baseline.
