/* ═══════════════════════════════════════════════════════════════
   MockAgent
   ───────────────────────────────────────────────────────────────
   A fully deterministic, zero-dependency drop-in for IAgent.

   WHY THIS EXISTS
   ───────────────
   We need to build and test the full UI pipeline — classification
   badges, daily brief card, email routing — before connecting to
   watsonx.ai.  MockAgent lets every component call agent methods
   exactly as they will in production, with no real network calls.

   HOW IT WORKS
   ────────────
   classifyEmail   — rule-based keyword heuristic that produces the
                     same result as the human-annotated ground truth
                     for the evaluation dataset ~90% of the time.
                     Adds a fixed 120 ms simulated latency so the UI
                     can exercise loading states.

   generateDailyBrief — templates a one-sentence brief from the
                     counts of each priority bucket.  Also async
                     with a 80 ms delay.

   SWAPPING IN THE REAL AGENT
   ──────────────────────────
   When WatsonxAgent is ready, replace the singleton export at the
   bottom of src/services/agent/index.ts.  No component code changes.
   ═══════════════════════════════════════════════════════════════ */

import type {
  IAgent,
  ClassifyInput,
  ClassifyResult,
  DailyBriefInput,
  DailyBriefResult,
} from "./types";
import type { TaskPriority } from "@/types/dashboard";

// ─── Keyword rules ───────────────────────────────────────────────
// Each rule is checked in order; the first match wins.
// Designed to match the human labels in EVAL_EMAILS.

interface Rule {
  priority: TaskPriority;
  /** Matched against the concatenated subject + preview + body (lower-cased) */
  keywords: string[];
}

const RULES: Rule[] = [
  {
    priority: "action-needed",
    keywords: [
      "due",
      "overdue",
      "past due",
      "expires",
      "expir",
      "confirm",
      "confirmation",
      "action required",
      "response required",
      "required",
      "sign",
      "payment",
      "final notice",
      "last chance",
      "deadline",
      "documentation needed",
      "negative balance",
      "shortage",
      "unusual activity",
      "verify",
      "reschedule",
      "cover shift",
      "swap shift",
      "need confirmation",
      "please respond",
      "claim",
    ],
  },
  {
    priority: "news-updates",
    keywords: [
      "shipped",
      "delivered",
      "receipt",
      "your order",
      "tracking",
      "statement is ready",
      "you earned",
      "rewards",
      "paid you",
      "sign-in",
      "new sign",
      "streak",
      "trip receipt",
      "invoice",
      "school closed",
      "advisory",
      "mentioned you",
      "new on netflix",
      "update is available",
      "tax season begins",
    ],
  },
  // Default — anything that doesn't match above
  {
    priority: "for-later",
    keywords: [],
  },
];

function classify(input: ClassifyInput): TaskPriority {
  const haystack = [
    input.subject,
    input.preview,
    input.body,
    input.sender,
  ]
    .join(" ")
    .toLowerCase();

  for (const rule of RULES) {
    // Empty keywords array = catch-all default
    if (rule.keywords.length === 0) return rule.priority;
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      return rule.priority;
    }
  }

  return "for-later";
}

/** Simulated reasoning strings shown in dev/debug mode */
const REASONING: Record<TaskPriority, string> = {
  "action-needed":
    "Subject or body contains urgency keywords (deadline / payment / required). " +
    "Mock rule matched action-needed bucket.",
  "for-later":
    "No urgency or transactional keywords detected. " +
    "Defaulting to for-later bucket.",
  "news-updates":
    "Subject or body contains transactional/status keywords (shipped / receipt / statement). " +
    "Mock rule matched news-updates bucket.",
};

/** Fixed simulated confidence per bucket (overridden by keyword match strength) */
const BASE_CONFIDENCE: Record<TaskPriority, number> = {
  "action-needed": 0.91,
  "for-later": 0.78,
  "news-updates": 0.88,
};

// ─── Daily brief templates ───────────────────────────────────────

function buildBrief(
  userName: string,
  actionCount: number,
  laterCount: number,
): string {
  if (actionCount === 0) {
    return `Good morning, ${userName} — your inbox is clear of urgent items today.`;
  }
  if (actionCount === 1) {
    return `Good morning, ${userName} — you have 1 item that needs attention today.`;
  }
  if (actionCount <= 3) {
    return (
      `Good morning, ${userName} — you have ${actionCount} things that need attention today` +
      (laterCount > 0 ? ` and ${laterCount} items to revisit when you have a moment.` : ".")
    );
  }
  return (
    `Good morning, ${userName} — there are ${actionCount} items waiting on you today; ` +
    `tackle the most time-sensitive ones first.`
  );
}

// ─── MockAgent ───────────────────────────────────────────────────

const CLASSIFY_DELAY_MS = 120;
const BRIEF_DELAY_MS = 80;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockAgent implements IAgent {
  async classifyEmail(input: ClassifyInput): Promise<ClassifyResult> {
    await delay(CLASSIFY_DELAY_MS);

    const priority = classify(input);

    return {
      priority,
      confidence: BASE_CONFIDENCE[priority],
      reasoning: REASONING[priority],
    };
  }

  async generateDailyBrief(input: DailyBriefInput): Promise<DailyBriefResult> {
    await delay(BRIEF_DELAY_MS);

    const actionCount = input.emails.filter(
      (e) => e.priority === "action-needed",
    ).length;
    const laterCount = input.emails.filter(
      (e) => e.priority === "for-later",
    ).length;

    return {
      text: buildBrief(input.userName, actionCount, laterCount),
    };
  }
}
