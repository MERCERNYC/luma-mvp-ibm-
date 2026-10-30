/* ═══════════════════════════════════════════════════════════════
   GET /api/agent/connection-test
   ───────────────────────────────────────────────────────────────
   Fires a minimal classify call against the active agent provider
   and returns a pass/fail verdict plus timing and raw output.

   Intended for development and deployment verification only —
   not called by the production UI.

   Response body (JSON):
     { ok: true,  provider: string, durationMs: number, result: ClassifyResult }
     { ok: false, provider: string, durationMs: number, error:  string         }
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse }  from "next/server";
import { agentService }  from "@/services/agent";
import type { ClassifyInput } from "@/services/agent";

// Minimal email fixture — simple enough that any reasonable agent
// should classify it as "communication" / "action-needed".
const TEST_EMAIL: ClassifyInput = {
  id:          "connection-test-001",
  subject:     "Connection test — please ignore",
  preview:     "This is an automated connectivity check.",
  body:        "This email was sent by an automated test to verify the agent connection is working. Please ignore it.",
  sender:      "Test Runner",
  senderEmail: "test@luma-mvp.internal",
};

export async function GET() {
  const provider = process.env.AGENT_PROVIDER ?? "mock";
  const start    = Date.now();

  try {
    const result     = await agentService.classifyEmail(TEST_EMAIL);
    const durationMs = Date.now() - start;

    return NextResponse.json({
      ok:         true,
      provider,
      durationMs,
      result,
    });
  } catch (err) {
    const durationMs = Date.now() - start;
    const error      = err instanceof Error ? err.message : String(err);

    return NextResponse.json(
      { ok: false, provider, durationMs, error },
      { status: 500 },
    );
  }
}
