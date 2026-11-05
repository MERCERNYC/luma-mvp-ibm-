# Session 08 — 50-Email Evaluation Dataset

## Goal
Build `src/data/emails.ts`: a typed `EvaluationEmail[]` fixture of 50 emails that covers every combination the classifier will face, with hand-labeled ground truth on every item.

The dataset serves two purposes:
1. **MockAgent development** — real, varied inputs to run against
2. **Evaluation** — `expectedClassification` on each email lets you score MockAgent and watsonx accuracy

---

## Files created / modified

| File | What changed |
|---|---|
| `src/types/email.ts` | New — `Email`, `EvaluationEmail`, `EmailAttachment` types + `toClassifyInput()` helper |
| `src/data/emails.ts` | New — 50 `EvaluationEmail` fixtures, derived stats exports |
| `src/services/agent/types.ts` | New — `IAgent`, `ClassifyInput`, `ClassifyResult`, `DailyBriefInput`, `DailyBriefResult` |
| `src/services/agent/MockAgent.ts` | New — deterministic keyword-rule classifier + brief generator |
| `src/services/agent/index.ts` | New — barrel export + `agent` singleton (currently `MockAgent`) |

---

## Type design

```
Email                      — pure domain shape (subject, body, sender…)
  └── EvaluationEmail      — Email + expectedClassification + optional labelNote
        used in: src/data/emails.ts

IAgent                     — contract both Mock and Watsonx must satisfy
  classifyEmail(ClassifyInput) → Promise<ClassifyResult>
  generateDailyBrief(DailyBriefInput) → Promise<DailyBriefResult>
```

`Task` (dashboard UI type) and `Email` (agent domain type) are kept separate intentionally — the agent never needs avatar colours or initials.

### `toClassifyInput()` helper

Converts any `Email` or `EvaluationEmail` into the exact shape `IAgent.classifyEmail()` expects:

```ts
const result = await agent.classifyEmail(toClassifyInput(email));
```

---

## Dataset coverage

| Bucket | Count | % |
|---|---|---|
| `action-needed` | 18 | 36 % |
| `for-later` | 17 | 34 % |
| `news-updates` | 15 | 30 % |
| **Total** | **50** | |

**12 emails** include an attachment.

### Edge cases labeled explicitly

| ID | Edge case |
|---|---|
| e-005 | Transactional-but-urgent (bank fraud alert → `action-needed`) |
| e-025 | "Call me when you get a chance" (soft/social → `for-later`) |
| e-028 | Same sender as e-001 (teacher) but newsletter, not form (→ `for-later`) |
| e-047 | Sign-in notification from known device (→ `news-updates` unless user doesn't recognise it) |

---

## How to run the evaluation

```ts
import { EMAILS, toClassifyInput } from "@/data/emails";
import { agent } from "@/services/agent";

let correct = 0;
for (const email of EMAILS) {
  const { priority } = await agent.classifyEmail(toClassifyInput(email));
  if (priority === email.expectedClassification) correct++;
}
console.log(`Accuracy: ${(correct / EMAILS.length * 100).toFixed(1)}%`);
// MockAgent target: ≥ 85 %
// WatsonxAgent target: ≥ 95 %
```

---

## Swapping in the real watsonx agent

1. Create `src/services/agent/WatsonxAgent.ts` implementing `IAgent`
2. In `src/services/agent/index.ts` replace:
   ```ts
   export const agent: IAgent = new MockAgent();
   ```
   with:
   ```ts
   export const agent: IAgent = new WatsonxAgent(config);
   ```
3. No component or dataset code changes needed.

---

## Next session
Session 09 — wire `agent.classifyEmail()` into the dashboard so emails are classified at load time and the priority badges are driven by agent output rather than the hard-coded fixture values.
