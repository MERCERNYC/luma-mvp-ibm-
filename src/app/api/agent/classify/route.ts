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
    // ── Concurrency-limited classification ───────────────────────
    // Promise.all over 50 emails fires 50 simultaneous Orchestrate
    // SSE connections, which triggers rate-limiting and makes the
    // slowest call gate the entire batch.
    // Running CONCURRENCY emails at a time keeps throughput high
    // while staying well within Orchestrate's per-instance limits.
    const CONCURRENCY = 6;
    const results: Awaited<ReturnType<typeof agentService.classifyEmail>>[] = [];

    for (let i = 0; i < body.emails.length; i += CONCURRENCY) {
      const chunk = body.emails.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(
        chunk.map((email) => agentService.classifyEmail(email)),
      );
      results.push(...chunkResults);
    }

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
