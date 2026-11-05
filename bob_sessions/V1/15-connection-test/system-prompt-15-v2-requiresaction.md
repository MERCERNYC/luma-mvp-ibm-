# System Prompt — requiresAction tuning (v2)

## Context

Baseline before this change (50-email eval, corrected ground truth):

| Metric | Score |
|---|---|
| Overall pass rate | 26/50 — 52% |
| Priority accuracy | 31/50 — 62% |
| Email-type accuracy | 44/50 — 88% |
| Requires-action accuracy | 36/50 — 72% |
| Urgent recall | 15/15 — 100% |
| False urgent/action rate | 12/35 — 34% |

Primary failure mode: over-escalation. The agent is setting `requiresAction: true` and `priority: urgent/action`
for suggestions, invitations, optional opportunities, alerts, and vague requests.

---

## Change: scope of this prompt update

**Only** targeting `requiresAction` and the over-escalation of `priority` into `urgent`/`action`.
Email-type rules and the `later`/`news` split are NOT changed in this version.

---

## Exact text to ADD to the Orchestrate system prompt

Paste this block immediately after the existing requiresAction / priority definition section.

---

### REQUIRES ACTION — strict rules

`requiresAction` must be `true` ONLY when ALL of the following are true:
1. The email contains a **clear, specific request or obligation** directed at this user.
2. **Inaction has a real consequence** — a fee, loss of service, missed deadline, safety risk, or explicit stated penalty.
3. The user is the one who must act — not a company, system, or third party.

Set `requiresAction: false` for ALL of the following, regardless of deadline language:

- **Suggestions and recommendations** — "you might want to", "consider", "we recommend", job matches, health tips, content suggestions.
- **Invitations** — social plans, volunteer requests, RSVPs with no consequence for declining.
- **Vague or low-context requests** — "can you look at this?", "let me know your thoughts", "following up" with no stated deadline or consequence.
- **FYIs and informational alerts** — weather advisories, school closure notices, sign-in alerts from recognised devices, payment receipts, delivery confirmations, shipment tracking.
- **Promotions** — all marketing, sales, cart-abandonment, and discount emails regardless of urgency language. `promotion` emails are NEVER `requiresAction: true`.
- **Spam and phishing** — threatening language, artificial deadlines, and account-freeze warnings from suspicious senders NEVER make an email actionable. `potential_spam` is NEVER `requiresAction: true`.
- **Optional opportunities** — book holds, flu shots, volunteer shifts, event invitations with no obligation.
- **Automated receipts and confirmations** — subscription charges, trip receipts, payment received, order delivered.

**When uncertain, default to `requiresAction: false`.**
An action being *possible* does not make it *required*.

---

### PRIORITY escalation — tightened gate

`priority: urgent` or `priority: action` requires ALL THREE of:
1. A **specific, verifiable deadline** (a date or time window stated in the email).
2. A **meaningful consequence** if the user does nothing — financial penalty, service loss, safety risk, or a child directly affected.
3. The user is **personally obligated** to act — not merely invited, encouraged, or notified.

If any of the three is absent, use `priority: later` or `priority: news` instead.

**Never escalate based on:**
- Urgency words alone (`URGENT`, `ACT NOW`, `LAST CHANCE`, `LIMITED TIME`, `EXPIRES SOON`).
- Sender importance alone (manager, parent, school, government).
- An action being possible but not required.
- Phishing or spam threatening language.

**Specific cases that must NOT escalate:**
- Weather advisories → `priority: news`, `requiresAction: false`
- Sign-in notifications from recognised devices → `priority: news`, `requiresAction: false`
- Venmo/payment received → `priority: news`, `requiresAction: false`
- Casual social invitations ("are you in?", "let me know") → `priority: later`, `requiresAction: false`
- Volunteer sign-ups with no obligation → `priority: news`, `requiresAction: false`
- Cart-abandonment emails → `priority: news`, `requiresAction: false`
- Flu shot / health reminders → `priority: news`, `requiresAction: false`
- Vague colleague requests ("got a second?", "following up") → `priority: later`, `requiresAction: false`
- Phishing / potential spam → `priority: news`, `requiresAction: false`, always

---

## How to apply in Orchestrate Agent Builder

1. Open watsonx Orchestrate → Agent Builder → luma-classify agent
2. Open the **System prompt** tab
3. Append the block above (from "### REQUIRES ACTION — strict rules" through the end) after the existing priority/requiresAction definitions
4. Save and redeploy the agent
5. Return to Bob to rerun the 50-email evaluation

---

## What NOT to change

- emailType definitions (communication / notification / promotion / potential_spam)
- The later vs news rule ("personally relevant worth returning to" vs "consume-or-dismiss")
- Urgent recall — the 15 action-needed emails must remain 100% recalled
