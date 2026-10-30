/* ═══════════════════════════════════════════════════════════════
   WatsonxAgent
   ───────────────────────────────────────────────────────────────
   IAgent implementation that calls a deployed watsonx Orchestrate
   agent via the Orchestrate Agent Builder chat API.

   AUTHENTICATION
   ──────────────
   Orchestrate accepts the IBM Cloud API key directly in a request
   header — no IAM token exchange is required:

     IAM-API_KEY: <your-ibm-cloud-api-key>

   ENDPOINT CONTRACT
   ─────────────────
   POST {ORCHESTRATE_INSTANCE_URL}/v2/orchestrate/{ORCHESTRATE_AGENT_ID}/chat/completions
   Headers:
     Content-Type: application/json
     IAM-API_KEY:  <key>
   Body:
     { "messages": [{ "role": "user", "content": "<prompt>" }] }

   The agent's reply arrives as:
     choices[0].message.content

   The agent returns a JSON object in this shape:
     {
       "emailId":          "<string>",
       "emailType":        "communication|notification|promotion|potential_spam",
       "priority":         "urgent|action|later|news",
       "requiresAction":   true|false,
       "reason":           "<short user-facing explanation>",
       "recommendedAction":"<short next step>",
       "confidence":       0.0–1.0
     }
   The parser strips any ```json fence and JSON.parses the object.
   priority is mapped to LUMA's internal TaskPriority:
     urgent → action-needed   action → action-needed
     later  → for-later       news   → news-updates

   ENV VARS  (all required when AGENT_PROVIDER=watsonx)
   ──────────────────────────────────────────────────────
   WATSONX_API_KEY              IBM Cloud API key (IAM-API_KEY auth)
   ORCHESTRATE_INSTANCE_URL     Orchestrate instance base URL, e.g.
                                https://api.jp-tok.watson-orchestrate.cloud.ibm.com/instances/<id>
   ORCHESTRATE_AGENT_ID         Agent ID from Orchestrate Agent Builder
   ═══════════════════════════════════════════════════════════════ */

import type {
  IAgent,
  ClassifyInput,
  ClassifyResult,
  DailyBriefInput,
  DailyBriefResult,
  EmailType,
} from "./types";
import type { TaskPriority } from "@/types/dashboard";

// ─── Raw Orchestrate call ─────────────────────────────────────────
// The /v2/orchestrate/{id}/chat/completions endpoint returns a
// Server-Sent Events stream.  The final event is:
//   { "object": "thread.message.completed",
//     "data": { "message": { "content": [{ "text": "..." }] } } }
// We read the full stream text and extract that event.

interface CompletedEvent {
  object: string;
  data?: {
    message?: {
      content?: Array<{ text?: string }>;
    };
  };
}

async function callAgent(
  instanceUrl: string,
  agentId:     string,
  apiKey:      string,
  prompt:      string,
): Promise<string> {
  const url = `${instanceUrl}/v2/orchestrate/${agentId}/chat/completions`;

  const res = await fetch(url, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "IAM-API_KEY":  apiKey,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[WatsonxAgent] Agent call failed ${res.status}: ${text}`);
  }

  // Read the full SSE stream as text, then find the completed event.
  const raw = await res.text();

  for (const line of raw.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    try {
      const event = JSON.parse(line.slice(6)) as CompletedEvent;
      if (event.object === "thread.message.completed") {
        const content = event.data?.message?.content?.[0]?.text;
        if (typeof content === "string" && content.trim() !== "") {
          return content;
        }
      }
    } catch {
      // non-JSON line — skip
    }
  }

  throw new Error(
    `[WatsonxAgent] No completed message found in SSE stream: ${raw.slice(0, 300)}`,
  );
}

// ─── JSON extraction ──────────────────────────────────────────────
// The agent is prompted to wrap its output in a ```json … ``` fence.
// This parser accepts both fenced and bare JSON objects.

function extractJSON(raw: string): unknown {
  // Try ```json ... ``` fence first.
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate  = fenceMatch ? fenceMatch[1].trim() : raw.trim();

  // Find the outermost { … } in case there is surrounding prose.
  const start = candidate.indexOf("{");
  const end   = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`[WatsonxAgent] No JSON object found in response: ${raw.slice(0, 200)}`);
  }

  return JSON.parse(candidate.slice(start, end + 1));
}

// ─── Field validators (safe coercion with fallbacks) ──────────────

// Agent priority values → LUMA internal TaskPriority
const PRIORITY_MAP: Record<string, TaskPriority> = {
  urgent: "action-needed",
  action: "action-needed",
  later:  "for-later",
  news:   "news-updates",
};

const VALID_EMAIL_TYPES: EmailType[] = ["communication", "notification", "promotion", "potential_spam"];

function coercePriority(v: unknown): TaskPriority {
  if (typeof v === "string") {
    const mapped = PRIORITY_MAP[v.toLowerCase().trim()];
    if (mapped) return mapped;
  }
  return "for-later";
}

function coerceEmailType(v: unknown): EmailType {
  return VALID_EMAIL_TYPES.includes(v as EmailType)
    ? (v as EmailType)
    : "notification";
}

function coerceNumber(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function coerceBoolean(v: unknown): boolean {
  return v === true || v === "true";
}

function coerceString(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : fallback;
}

// ─── Prompt builders ──────────────────────────────────────────────

function buildClassifyPrompt(input: ClassifyInput): string {
  return [
    `emailId: ${input.id}`,
    `From: ${input.sender} <${input.senderEmail}>`,
    `Subject: ${input.subject}`,
    `Preview: ${input.preview}`,
    `Body: ${input.body}`,
  ].join("\n");
}

function buildBriefPrompt(input: DailyBriefInput): string {
  const lines = input.emails.map(
    (e) => `  [${e.priority}] ${e.sender} — ${e.subject}`,
  );
  return [
    `Write a one-sentence daily brief for ${input.userName} based on their inbox.`,
    "",
    "Inbox summary:",
    ...lines,
    "",
    "Reply with ONLY a JSON code-fence in this exact shape:",
    "```json",
    '{ "text": "<one sentence brief>" }',
    "```",
  ].join("\n");
}

// ─── WatsonxAgent ─────────────────────────────────────────────────

export class WatsonxAgent implements IAgent {
  private readonly apiKey:      string;
  private readonly instanceUrl: string;
  private readonly agentId:     string;

  constructor() {
    const apiKey      = process.env.WATSONX_API_KEY;
    const instanceUrl = process.env.ORCHESTRATE_INSTANCE_URL;
    const agentId     = process.env.ORCHESTRATE_AGENT_ID;

    if (!apiKey)      throw new Error("[WatsonxAgent] WATSONX_API_KEY is not set");
    if (!instanceUrl) throw new Error("[WatsonxAgent] ORCHESTRATE_INSTANCE_URL is not set");
    if (!agentId)     throw new Error("[WatsonxAgent] ORCHESTRATE_AGENT_ID is not set");

    this.apiKey      = apiKey;
    this.instanceUrl = instanceUrl.replace(/\/$/, ""); // strip trailing slash
    this.agentId     = agentId;
  }

  // ── classifyEmail ───────────────────────────────────────────────

  async classifyEmail(input: ClassifyInput): Promise<ClassifyResult> {
    const prompt = buildClassifyPrompt(input);
    const raw    = await callAgent(this.instanceUrl, this.agentId, this.apiKey, prompt);
    const obj    = extractJSON(raw) as Record<string, unknown>;

    return {
      priority:          coercePriority(obj.priority),
      emailType:         coerceEmailType(obj.emailType),
      requiresAction:    coerceBoolean(obj.requiresAction),
      reason:            coerceString(obj.reason,            "No reason provided."),
      recommendedAction: typeof obj.recommendedAction === "string"
                           ? obj.recommendedAction
                           : null,
      confidence:        coerceNumber(obj.confidence,    0.5),
      urgencyScore:      0.5,
      reasoning:         "",
    };
  }

  // ── generateDailyBrief ──────────────────────────────────────────

  async generateDailyBrief(input: DailyBriefInput): Promise<DailyBriefResult> {
    const prompt = buildBriefPrompt(input);
    const raw    = await callAgent(this.instanceUrl, this.agentId, this.apiKey, prompt);
    const obj    = extractJSON(raw) as Record<string, unknown>;

    return {
      text: coerceString(obj.text, `Good morning, ${input.userName}.`),
    };
  }
}
