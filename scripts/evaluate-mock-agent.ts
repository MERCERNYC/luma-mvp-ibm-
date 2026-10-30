#!/usr/bin/env tsx
/* ═══════════════════════════════════════════════════════════════
   WatsonxAgent Evaluation Harness
   ───────────────────────────────────────────────────────────────
   Runs evaluation emails through the active agent and scores
   classification accuracy against the hand-labeled ground truth
   in emailEvaluationDataset.ts.

   Run:
     npx tsx scripts/evaluate-mock-agent.ts

   Output:
     Per-email result table, then summary metrics.
   ═══════════════════════════════════════════════════════════════ */

import { WatsonxAgent }        from "../src/services/agent/WatsonxAgent";
import { WATSON_EVAL_EMAILS }  from "../src/data/emailEvaluationDataset";

// ─── Config ──────────────────────────────────────────────────────
// Change LIMIT to run more emails. Set to WATSON_EVAL_EMAILS.length for all 50.
const LIMIT = WATSON_EVAL_EMAILS.length;

// ─── Types ───────────────────────────────────────────────────────

interface Row {
  emailId:           string;
  // ground-truth
  expPriority:       string;
  expEmailType:      string;
  expRequiresAction: boolean;
  // agent result (agent's own priority values: urgent|action|later|news)
  gotPriority:       string;
  gotEmailType:      string;
  gotRequiresAction: boolean;
  // display fields
  reason:            string;
  recommendedAction: string | null;
  confidence:        number;
  // per-field verdicts
  priorityPass:       boolean;
  emailTypePass:      boolean;
  requiresActionPass: boolean;
  // overall
  pass: boolean;
}

// coercePriority in WatsonxAgent maps urgent/action → action-needed,
// later → for-later, news → news-updates before returning result.priority.
// So result.priority already matches the ground-truth TaskPriority values.
// Direct equality comparison is correct.

// ─── Run ─────────────────────────────────────────────────────────

async function run() {
  const agent = new WatsonxAgent();
  const emails = WATSON_EVAL_EMAILS.slice(0, LIMIT);
  const rows: Row[] = [];

  for (const email of emails) {
    process.stdout.write(`  Running ${email.id}…`);
    const result = await agent.classifyEmail({
      id:          email.id,
      subject:     email.subject,
      preview:     email.preview,
      body:        email.body,
      sender:      email.sender,
      senderEmail: email.senderEmail,
    });

    const priorityPass      = result.priority === email.expectedPriority;
    const emailTypePass     = result.emailType     === email.expectedEmailType;
    const requiresActionPass = result.requiresAction === email.expectedRequiresAction;
    const pass              = priorityPass && emailTypePass && requiresActionPass;

    process.stdout.write(pass ? " ✓\n" : " ✗\n");

    rows.push({
      emailId:            email.id,
      expPriority:        email.expectedPriority,
      expEmailType:       email.expectedEmailType,
      expRequiresAction:  email.expectedRequiresAction,
      gotPriority:        String(result.priority),
      gotEmailType:       result.emailType,
      gotRequiresAction:  result.requiresAction,
      reason:             result.reason,
      recommendedAction:  result.recommendedAction,
      confidence:         result.confidence,
      priorityPass,
      emailTypePass,
      requiresActionPass,
      pass,
    });
  }

  // ─── Per-email table ─────────────────────────────────────────

  const W = (s: string, w: number) => s.slice(0, w).padEnd(w);
  const SEP = "─".repeat(130);

  console.log("\n" + SEP);
  console.log(
    W("emailId",    10) + W("priority(got)",  14) + W("priority(exp)",  14) +
    W("emailType(got)", 18) + W("emailType(exp)", 18) +
    W("reqAct(got)", 12) + W("reqAct(exp)", 11) +
    W("conf",  6) + W("reason",  30) + "PASS"
  );
  console.log(SEP);

  for (const r of rows) {
    const pMark  = r.priorityPass       ? " " : "!";
    const tMark  = r.emailTypePass      ? " " : "!";
    const aMark  = r.requiresActionPass ? " " : "!";
    console.log(
      W(r.emailId,                          10) +
      W(pMark + r.gotPriority,              14) + W(r.expPriority,        14) +
      W(tMark + r.gotEmailType,             18) + W(r.expEmailType,       18) +
      W(aMark + String(r.gotRequiresAction), 12) + W(String(r.expRequiresAction), 11) +
      W(r.confidence.toFixed(2),             6) +
      W(r.reason.slice(0, 28),              30) +
      (r.pass ? "✓" : "✗")
    );
    if (r.recommendedAction) {
      console.log(" ".repeat(10) + "→ " + r.recommendedAction.slice(0, 100));
    }
  }

  // ─── Summary ─────────────────────────────────────────────────

  const n               = rows.length;
  const passed          = rows.filter(r => r.pass).length;
  const priPass         = rows.filter(r => r.priorityPass).length;
  const typePass        = rows.filter(r => r.emailTypePass).length;
  const reqPass         = rows.filter(r => r.requiresActionPass).length;
  const urgentRows      = rows.filter(r => r.expPriority === "action-needed");
  const urgentRecall    = urgentRows.length > 0
    ? (urgentRows.filter(r => r.priorityPass).length / urgentRows.length * 100).toFixed(0)
    : "—";

  const pct = (k: number) => `${(k / n * 100).toFixed(0)}%`;

  console.log("\n" + SEP);
  console.log(`Tests passed:              ${passed}/${n}`);
  console.log(`Priority accuracy:         ${pct(priPass)}`);
  console.log(`Email-type accuracy:       ${pct(typePass)}`);
  console.log(`Requires-action accuracy:  ${pct(reqPass)}`);
  console.log(`Urgent recall:             ${urgentRecall}%`);
  console.log(SEP + "\n");
}

run().catch((err) => { console.error(err); process.exit(1); });
