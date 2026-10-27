/* ═══════════════════════════════════════════════════════════════
   Agent service — shared types
   ───────────────────────────────────────────────────────────────
   IAgent is the contract every agent implementation must satisfy.
   MockAgent fulfils it locally; WatsonxAgent will fulfil it via
   the IBM watsonx.ai Agents API when we're ready.
   ═══════════════════════════════════════════════════════════════ */

import type { Task, TaskPriority } from "@/types/dashboard";

// ─── Classification ──────────────────────────────────────────────

/**
 * Input to the classify call — the raw fields the agent needs to
 * decide which priority bucket an email belongs in.
 */
export interface ClassifyInput {
  subject: string;
  preview: string;
  body: string;
  sender: string;
}

/**
 * Output of a single classify call.
 * `confidence` is 0–1; `reasoning` is a short human-readable note
 * explaining the decision (shown in dev/debug mode; hidden in prod).
 */
export interface ClassifyResult {
  priority: TaskPriority;
  confidence: number;
  reasoning: string;
}

// ─── Daily Brief ─────────────────────────────────────────────────

/**
 * Input to the daily-brief call — the list of emails the agent
 * should summarise into a single orienting sentence.
 */
export interface DailyBriefInput {
  emails: Pick<Task, "subject" | "priority" | "sender">[];
  userName: string;
}

/**
 * Output of the daily-brief call.
 * `text` is the one-sentence brief shown at the top of the dashboard.
 */
export interface DailyBriefResult {
  text: string;
}

// ─── IAgent contract ─────────────────────────────────────────────

/**
 * Every agent implementation (Mock, Watsonx, …) must satisfy this
 * interface.  All methods return Promises so the UI can treat them
 * identically regardless of whether they are synchronous stubs or
 * real async network calls.
 */
export interface IAgent {
  /**
   * Classify a single email into an Action Needed / For Later /
   * News & Updates priority bucket.
   */
  classifyEmail(input: ClassifyInput): Promise<ClassifyResult>;

  /**
   * Generate the one-sentence daily brief from the current inbox.
   */
  generateDailyBrief(input: DailyBriefInput): Promise<DailyBriefResult>;
}
