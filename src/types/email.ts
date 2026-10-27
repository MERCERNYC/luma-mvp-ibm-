/* ═══════════════════════════════════════════════════════════════
   Email domain types
   ───────────────────────────────────────────────────────────────
   Separation of concerns
   ──────────────────────
   Task  (src/types/dashboard.ts)  — UI shape: avatar colours,
         initials, preview truncation.  Used by components.

   Email (here)                    — Domain shape: the raw data
         an agent or classifier actually needs.  No UI fields.

   EvaluationEmail (here)          — Email + hand-labeled ground
         truth.  Used in src/data/emails.ts and by the evaluator.
   ═══════════════════════════════════════════════════════════════ */

import type { TaskPriority } from "./dashboard";

// ─── Core email type ─────────────────────────────────────────────

/**
 * A single inbox email stripped of all UI-specific fields.
 * This is the shape every agent method receives and returns.
 */
export interface Email {
  /** Stable unique identifier, e.g. "e-001" */
  id: string;

  // ── Sender ────────────────────────────────────────────────────
  /** Display name shown to the user, e.g. "Dani (Teacher)" */
  sender: string;
  /** Raw address, e.g. "dani@lincolnelem.edu" */
  senderEmail: string;

  // ── Content ───────────────────────────────────────────────────
  /** Email subject line */
  subject: string;
  /**
   * Short preview (~80 chars).
   * Shown in list rows; also fed to the classifier as a fast signal
   * before the full body is needed.
   */
  preview: string;
  /** Full email body (plain text, paragraphs separated by \n\n) */
  body: string;

  // ── Meta ──────────────────────────────────────────────────────
  /** Human-readable timestamp shown in the UI, e.g. "9:24 AM" */
  time: string;
  /** Optional attachment metadata */
  attachment?: EmailAttachment;
}

/** Attachment metadata — same shape as the UI type for easy mapping */
export interface EmailAttachment {
  name: string;
  /** Display string, e.g. "PDF · 248 KB" */
  meta: string;
}

// ─── Evaluation type ─────────────────────────────────────────────

/**
 * An Email extended with a hand-labeled ground-truth classification.
 *
 * Used in two ways:
 *   1. As the `emails` array fed to MockAgent / WatsonxAgent during
 *      development — the agent sees only the Email fields.
 *   2. As the ground-truth reference when scoring agent accuracy —
 *      compare agent output against `expectedClassification`.
 */
export interface EvaluationEmail extends Email {
  /**
   * Hand-labeled correct priority bucket.
   * This is the ground truth; never derived from agent output.
   */
  expectedClassification: TaskPriority;
  /**
   * Optional free-text note explaining the labeling decision.
   * Useful for edge cases and for writing the evaluation report.
   */
  labelNote?: string;
}

// ─── Helper ──────────────────────────────────────────────────────

/**
 * Extract the fields MockAgent / WatsonxAgent need for a classify
 * call from any Email (or EvaluationEmail).
 *
 * Usage:
 *   const result = await agent.classifyEmail(toClassifyInput(email));
 */
export function toClassifyInput(email: Email) {
  return {
    subject: email.subject,
    preview: email.preview,
    body:    email.body,
    sender:  email.sender,
  };
}
