/* ═══════════════════════════════════════════════════════════════
   POST /api/agent/compose-reply
   ───────────────────────────────────────────────────────────────
   Generates a polished reply draft using the same watsonx /
   mock agent infrastructure already in place, without touching
   IAgent, AgentService, WatsonxAgent, or MockAgent.

   Request body (JSON):
     {
       subject:     string   — email subject
       body:        string   — email body text
       sender:      string   — display name of the sender
       instruction: string   — user's rough description / intent
     }

   Response body (JSON):
     { draft: string }   — the generated reply text

   Errors:
     400  — missing required fields
     500  — generation error

   Provider selection mirrors the rest of the agent routes:
     AGENT_PROVIDER=watsonx → calls IBM Orchestrate
     anything else          → uses the local mock
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";

// ── Request / response types ─────────────────────────────────────

interface ComposeReplyRequest {
  subject:     string;
  body:        string;
  sender:      string;
  instruction: string;
}

interface ComposeReplyResponse {
  draft: string;
}

// ── Mock fallback ────────────────────────────────────────────────

function mockDraft(req: ComposeReplyRequest): string {
  const lines = [
    `Hi ${req.sender.split(" ")[0]},`,
    "",
    req.instruction
      ? `Thank you for your email about "${req.subject}". ${req.instruction}`
      : `Thank you for your email about "${req.subject}". I'll follow up shortly.`,
    "",
    "Best,",
    "Sofia",
  ];
  return lines.join("\n");
}

// ── Watsonx compose ──────────────────────────────────────────────
// Orchestrate returns a Server-Sent Events stream, not plain JSON.
// Each line is prefixed with "data: ".  The final event has
// object === "thread.message.completed" and carries the reply text.

interface OrchestrateSSEEvent {
  object?: string;
  data?: {
    message?: {
      content?: Array<{ text?: string }>;
    };
  };
}

async function watsonxDraft(req: ComposeReplyRequest): Promise<string> {
  const apiKey      = process.env.WATSONX_API_KEY            ?? "";
  const instanceUrl = (process.env.ORCHESTRATE_INSTANCE_URL  ?? "").replace(/\/$/, "");
  const agentId     = process.env.ORCHESTRATE_AGENT_ID       ?? "";

  const prompt = [
    "You are a professional email assistant. Write a polished, concise reply to the following email.",
    "",
    `Original email from: ${req.sender}`,
    `Subject: ${req.subject}`,
    `Body:\n${req.body}`,
    "",
    `User's reply intent: ${req.instruction || "Write a polite, professional acknowledgement."}`,
    "",
    "Return ONLY the reply text — no subject line, no extra explanation.",
    "Sign off as: Sofia",
  ].join("\n");

  const res = await fetch(
    `${instanceUrl}/v2/orchestrate/${agentId}/chat/completions`,
    {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "IAM-API_KEY":  apiKey,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Orchestrate error ${res.status}: ${text}`);
  }

  // Read full SSE stream as text, scan for the completed event.
  const raw = await res.text();

  for (const line of raw.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    try {
      const event = JSON.parse(line.slice(6)) as OrchestrateSSEEvent;
      if (event.object === "thread.message.completed") {
        const text = event.data?.message?.content?.[0]?.text;
        if (typeof text === "string" && text.trim() !== "") {
          return text.trim();
        }
      }
    } catch {
      // non-JSON SSE line — skip
    }
  }

  throw new Error(`No completed message in SSE stream. Raw: ${raw.slice(0, 300)}`);
}

// ── Route handler ────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: ComposeReplyRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

  if (!body?.subject || !body?.sender) {
    return NextResponse.json(
      { error: "Request body must include `subject` and `sender`." },
      { status: 400 },
    );
  }

  const provider = process.env.AGENT_PROVIDER ?? "mock";

  try {
    const draft: string =
      provider === "watsonx"
        ? await watsonxDraft(body)
        : mockDraft(body);

    if (!draft) throw new Error("Empty draft returned.");

    return NextResponse.json({ draft } satisfies ComposeReplyResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("[compose-reply]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
