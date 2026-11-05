# Session 15 — Connection Test & Agent Evaluation

## Goal

Verify the live watsonx Orchestrate agent connection end-to-end, run the full 50-email evaluation against the corrected ground truth, tune the agent's classification rules, and establish a frozen MVP baseline.

---

## What was built

### `GET /api/agent/connection-test`
**File:** `src/app/api/agent/connection-test/route.ts`

A lightweight endpoint that fires one `classifyEmail` call through the active `AgentService` and returns a structured pass/fail result — used to verify the live Orchestrate connection without running the full eval.

```bash
curl http://localhost:3000/api/agent/connection-test | jq
```

```json
{ "ok": true, "provider": "watsonx", "durationMs": 842, "result": { ... } }
```

---

## Ground truth corrections (emailEvaluationDataset.ts)

During this session the label definitions were clarified and several ground-truth labels were corrected. The canonical rules are now recorded in the dataset header comment.

### Label definitions (canonical)

**EMAIL TYPE** — origin and nature of the message, independent of priority:
- `communication` = primarily person-to-person correspondence
- `notification` = automated/system/organizational alert, reminder, status or account message
- `promotion` = marketing or commercial content
- `potential_spam` = suspicious, potentially unwanted, or deceptive content

**IMPORTANT:** emailType does NOT determine requiresAction or priority. A notification can be urgent. A notification can require action. A communication can require no action.

**PRIORITY** — post-mapped internal TaskPriority (agent outputs urgent/action/later/news → mapped here):
- `action-needed` = attention needed soon + meaningful consequence
- `for-later` = personally relevant and worth returning to
- `news-updates` = informational, transactional, promotional, or general content that can be consumed and dismissed

### Relabeled emails

| ID | Field | Old label | New label | Rule applied |
|---|---|---|---|---|
| wx-003 | emailType | `communication` | `notification` | Automated appointments system address |
| wx-004 | emailType | `communication` | `notification` | Automated HR system sending deadline reminder |
| wx-005 | emailType | `communication` | `notification` | Automated billing system |
| wx-007 | emailType | `communication` | `notification` | Automated government renewal system |
| wx-010 | emailType | `communication` | `notification` | Automated claims system address |
| wx-013 | emailType | `communication` | `notification` | Automated government notice (noreply@irs.gov) |
| wx-014 | emailType | `communication` | `notification` | Automated renewal system (renewal@aaa.com) |
| wx-015 | emailType | `communication` | `notification` | Automated government system (noreply@benefitscal.com) |
| wx-029 | priority | `for-later` | `news-updates` | Promotional, consume-or-dismiss |
| wx-030 | priority | `for-later` | `news-updates` | Cart-abandonment is promotional regardless of personal relevance |
| wx-031 | priority | `for-later` | `news-updates` | Promotional, consume-or-dismiss |
| wx-032 | priority | `for-later` | `news-updates` | Promotional, consume-or-dismiss |

**Institutional-message rule:** automated/system/organizational messages = `notification`, even when action is required and consequences are real.

**Later vs news rule:** `for-later` = personally relevant and worth returning to because it may affect plans, responsibilities, interests, or future decisions. `news-updates` = informational, transactional, promotional, or general content that can be consumed and dismissed.

---

## Agent tuning — Orchestrate system prompt iterations

All tuning was applied to the **luma-classify** agent's Instructions in Orchestrate Agent Builder. No code changes.

### v1 baseline (pre-tuning, corrected ground truth)

| Metric | Score |
|---|---|
| Overall pass rate | 26/50 — 52% |
| Priority accuracy | 31/50 — 62% |
| Email-type accuracy | 44/50 — 88% |
| Requires-action accuracy | 36/50 — 72% |
| Urgent recall | 15/15 — 100% |
| False urgent/action rate | 12/35 — 34% |

Primary failure: over-escalation. Agent set `requiresAction: true` and `priority: urgent/action` for suggestions, invitations, alerts, vague requests, and friendly messages.

### v2 — requiresAction + priority escalation gate

Added strict `requiresAction` rules: true only when all three hold (clear specific request, real consequence for inaction, user is the one obligated). Explicit `false` list for suggestions, invitations, FYIs, alerts, promos, spam, receipts. Tightened priority escalation gate with explicit never-escalate list.

| Metric | v1 | v2 | Δ |
|---|---|---|---|
| Overall | 52% | 78% | +26pp |
| Priority | 62% | 88% | +26pp |
| Email-type | 88% | 90% | +2pp |
| RequiresAction | 72% | 100% | +28pp |
| Urgent recall | 100% | 100% | → |
| False action | 34% | 0% | −34pp |

### v3 — later vs news distinction

Added explicit `for-later` vs `news-updates` rule with examples. Resolved 6 priority mismatches but introduced two regressions (wx-039, wx-047 over-escalated by parking example).

### v4 — spam override + later ≠ required action

Added: spam/phishing override (potential_spam → always news + requiresAction: false); clarified that `for-later` does not imply `requiresAction: true`. Fixed both v3 regressions but spam override was too broad — Chase (wx-002) and IRS (wx-013) incorrectly demoted.

### v5 — tighten spam override to sender domain

Spam classification must be based on suspicious sender domain, not threatening content tone. Legitimate senders (chase.com, irs.gov, etc.) must never be potential_spam.

### v6 — prescription vs library hold distinction

Library hold for discretionary item → `for-later`. Prescription/medication with hold expiry → `action` (health consequence). Fixed wx-012 but shifted wx-011 (conference sign-up) to for-later.

### v7 — school sign-up escalation rule (FROZEN)

Added: school event sign-up with closing deadline and limited slots → `action` + `requiresAction: true`.

---

## ✅ MVP Baseline — LUMA v7 (FROZEN)

**50-email evaluation — corrected ground truth**

| Metric | Score |
|---|---|
| **Overall pass rate** | 46/50 — **92%** |
| **Priority accuracy** | 48/50 — **96%** |
| **Email-type accuracy** | 48/50 — **96%** |
| **RequiresAction accuracy** | 50/50 — **100%** |
| **Urgent recall** | 15/15 — **100%** |
| **False urgent/action rate** | 0/35 — **0%** |

---

## Known edge cases (4 remaining failures — do not tune)

These four emails sit at genuine labeling boundaries. The agent's answers are reasonable; the disagreements reflect ambiguous cases where the correct label depends on interpretation. Deferred to future evaluation.

| ID | Sender | Subject | Failure | Agent | Ground truth | Notes |
|---|---|---|---|---|---|---|
| **wx-003** | Dr. Kim (Pediatrician) | Ethan's Appointment Changed to Tomorrow — Confirm Today | emailType | `communication` | `notification` | Borderline: sent from automated appointments system but requests a human reply. Agent and ground-truth labels have traded places across tuning iterations. |
| **wx-004** | HR — Crestline Health | Open Enrollment Closes at Midnight Tonight | emailType | `communication` | `notification` | Same boundary: HR system sending deadline reminder. Agent reads it as person-to-person; ground truth says automated channel. |
| **wx-040** | LAUSD Communications | Schools Closed Monday — Veterans Day Observance | priority | `for-later` | `news-updates` | Agent treats school closures as personally relevant to a parent (later). Ground truth says broadcast informational (news). Both defensible. |
| **wx-042** | Madison Elementary PTA | Book Fair Volunteer Sign-Ups Open — December 2–6 | priority | `for-later` | `news-updates` | Agent treats PTA volunteer opportunity as personally relevant (later). Ground truth says no obligation → news. Both defensible. |

**Rule for future review:** if LUMA's UI treats `for-later` and `news-updates` identically for a user in practice, wx-040 and wx-042 are not user-facing failures. If the distinction matters in the UI, revisit the broadcast-vs-personal-relevance boundary for school/community content.

---

## Dataset coverage (final)

| Priority | Count | % |
|---|---|---|
| action-needed | 15 | 30% |
| for-later | 12 | 24% |
| news-updates | 23 | 46% |
| **Total** | **50** | **100%** |

| requiresAction | Count |
|---|---|
| true | 15 |
| false | 35 |
