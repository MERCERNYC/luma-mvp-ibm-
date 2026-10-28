/* ═══════════════════════════════════════════════════════════════
   POST /api/agent/daily-brief
   ───────────────────────────────────────────────────────────────
   Generates the one-sentence daily brief via the active provider.

   Request body (JSON):
     { emails: Pick<Task, "subject" | "priority" | "sender">[], userName: string }

   Response body (JSON):
     { text: string }

   Errors:
     400  — missing or malformed body
     500  — provider threw an unexpected error
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse }  from "next/server";
import { agentService }  from "@/services/agent";
import type { DailyBriefInput } from "@/services/agent";

export async function POST(request: Request) {
  let body: DailyBriefInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body?.emails) || !body?.userName) {
    return NextResponse.json(
      { error: "Request body must include `emails` array and `userName` string." },
      { status: 400 },
    );
  }

  try {
    const result = await agentService.generateDailyBrief(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
