/* ═══════════════════════════════════════════════════════════════
   Agent service — shared types
   ───────────────────────────────────────────────────────────────
   IAgent is the contract every agent implementation must satisfy.
   MockAgent fulfils it locally; WatsonxAgent will fulfil it via
   the IBM watsonx.ai Agents API when we're ready.
   ═══════════════════════════════════════════════════════════════ */

import type { Task, TaskPriority } from "@/types/dashboard";

// ─── Email type ──────────────────────────────────────────────────

/**
 * Semantic category of the email, independent of priority.
 *
 * communication   — person-to-person or organisation-to-person requiring
 *                   awareness or a reply (school, employer, government).
 * notification    — automated status update (shipment, receipt, sign-in).
 * promotion       — marketing, offers, rewards, recommendations.
 * potential_spam  — suspicious, unsolicited, or deceptive content.
 */
export type EmailType =
  | "communication"
  | "notification"
  | "promotion"
  | "potential_spam";

// ─── Classification ──────────────────────────────────────────────

/**
 * Input to the classify call — the raw fields the agent needs to
 * decide which priority bucket an email belongs in.
 */
export interface ClassifyInput {
  subject:     string;
  preview:     string;
  body:        string;
  /** Display name, e.g. "Dani (Teacher)" */
  sender:      string;
  /** Raw address, e.g. "dani@lincolnelem.edu" */
  senderEmail: string;
}

/**
 * Output of a single classify call.
 *
 * `priority`          — bucket used by the dashboard (maps to TaskPriority).
 * `emailType`         — semantic category of the email.
 * `requiresAction`    — whether the user must do something.
 * `reason`            — short human-readable explanation (shown in the UI as
 *                       "Why LUMA surfaced this").
 * `recommendedAction` — one clear next step, or null when none is needed.
 * `confidence`        — 0–1; high ≥ 0.85, medium 0.60–0.84, low < 0.60.
 * `urgencyScore`      — 0–1 within-bucket sort key.
 *                       1.0 = immediate/fraud  0.9 = today/tomorrow
 *                       0.85 = this week       0.75 = within 10 days
 *                       0.6  = within 30 days  0.5  = no deadline
 *                       0.4  = overdue but no longer actionable (suppressed)
 *                       for-later always 0.5, news-updates always 0.3.
 * `reasoning`         — internal dev/debug note (not shown in production UI).
 */
export interface ClassifyResult {
  priority:          TaskPriority;
  emailType:         EmailType;
  requiresAction:    boolean;
  reason:            string;
  recommendedAction: string | null;
  confidence:        number;
  urgencyScore:      number;
  reasoning:         string;
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
