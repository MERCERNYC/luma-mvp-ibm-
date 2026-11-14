/* ═══════════════════════════════════════════════════════════════
   POST /api/agent/classify
   ───────────────────────────────────────────────────────────────
   Classifies a batch of emails via the active AgentService provider.

   Request body (JSON):
     { emails: ClassifyInput[] }

   Response body (JSON):
     { results: ClassifyResult[] }

   Errors:
     400  — missing or malformed body
     500  — provider threw an unexpected error
   ═══════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { agentService }              from "@/services/agent";
import type { ClassifyInput }        from "@/services/agent";
import { aiRouteLimiter }            from "@/lib/rateLimit";

// Max emails per classify call — matches the Gmail route's maxResults cap.
const MAX_EMAILS = 50;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!aiRouteLimiter.check(ip)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: { emails?: ClassifyInput[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body?.emails) || body.emails.length === 0) {
    return NextResponse.json(
      { error: "Request body must include a non-empty `emails` array." },
      { status: 400 },
    );
  }

  // Silently cap oversized batches — prevents runaway parallelism/quota burn.
  if (body.emails.length > MAX_EMAILS) {
    body.emails = body.emails.slice(0, MAX_EMAILS);
  }

  try {
    const results = await Promise.all(
      body.emails.map((email) => agentService.classifyEmail(email)),
    );
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
