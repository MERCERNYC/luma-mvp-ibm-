#!/usr/bin/env tsx
/* ═══════════════════════════════════════════════════════════════
   MockAgent Evaluation Harness
   ───────────────────────────────────────────────────────────────
   Runs all 50 evaluation emails through MockAgent and scores
   classification accuracy against the hand-labeled ground truth
   in emailDataset.ts.

   Run:
     npx tsx scripts/evaluate-mock-agent.ts

   Output:
     Per-email pass/fail, per-bucket accuracy, overall accuracy.
   ═══════════════════════════════════════════════════════════════ */

import { MockAgent }   from "../src/services/agent/MockAgent";
import { EVAL_EMAILS } from "../src/data/emailDataset";
import type { TaskPriority } from "../src/types/dashboard";

// ─── Types ───────────────────────────────────────────────────────

interface Row {
  id:         string;
  expected:   TaskPriority;
  got:        TaskPriority;
  pass:       boolean;
  confidence: number;
  reason:     string;
}

// ─── Run ─────────────────────────────────────────────────────────

async function run() {
  const agent = new MockAgent();
  const rows: Row[] = [];

  for (const email of EVAL_EMAILS) {
    const result = await agent.classifyEmail({
      subject:     email.subject,
      preview:     email.preview,
      body:        email.body,
      sender:      email.sender,
      senderEmail: email.senderEmail,
    });

    rows.push({
      id:         email.id,
      expected:   email.priority,
      got:        result.priority,
      pass:       result.priority === email.priority,
      confidence: result.confidence,
      reason:     result.reason,
    });
  }

  // ─── Per-email table ─────────────────────────────────────────

  console.log("\n── Results ──────────────────────────────────────────────────");
  console.log(
    "ID".padEnd(12) +
    "Expected".padEnd(16) +
    "Got".padEnd(16) +
    "Conf".padEnd(7) +
    "Pass"
  );
  console.log("─".repeat(60));

  for (const r of rows) {
    const mark = r.pass ? "✓" : "✗";
    console.log(
      r.id.padEnd(12) +
      r.expected.padEnd(16) +
      r.got.padEnd(16) +
      r.confidence.toFixed(2).padEnd(7) +
      mark
    );
  }

  // ─── Per-bucket accuracy ─────────────────────────────────────

  const buckets: TaskPriority[] = ["action-needed", "for-later", "news-updates"];
  console.log("\n── Per-bucket accuracy ──────────────────────────────────────");

  for (const bucket of buckets) {
    const total   = rows.filter(r => r.expected === bucket).length;
    const correct = rows.filter(r => r.expected === bucket && r.pass).length;
    const pct     = total > 0 ? ((correct / total) * 100).toFixed(0) : "—";
    console.log(`  ${bucket.padEnd(16)}  ${correct}/${total}  (${pct}%)`);
  }

  // ─── Overall ─────────────────────────────────────────────────

  const total   = rows.length;
  const correct = rows.filter(r => r.pass).length;
  const pct     = ((correct / total) * 100).toFixed(1);

  console.log("\n── Overall ──────────────────────────────────────────────────");
  console.log(`  ${correct}/${total} correct  —  ${pct}% accuracy`);

  // ─── Failures ────────────────────────────────────────────────

  const failures = rows.filter(r => !r.pass);
  if (failures.length > 0) {
    console.log("\n── Failures ─────────────────────────────────────────────────");
    for (const f of failures) {
      console.log(`  ${f.id}  expected=${f.expected}  got=${f.got}`);
      console.log(`    reason: ${f.reason}`);
    }
  }

  console.log();
}

run().catch((err) => { console.error(err); process.exit(1); });
