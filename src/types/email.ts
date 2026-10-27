/* ═══════════════════════════════════════════════
   LUMA Email data model
   -----------------------------------------------
   Shared types consumed by:
     • 50-email evaluation dataset
     • MockAgent (local deterministic classifier)
     • IBM watsonx (LLM classification + summary)
     • Gmail integration (OAuth fetch + mapping)

   UI-display types (TaskPriority, avatarColor, etc.)
   live in ./dashboard.ts — keep them separate.
   ═══════════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   EmailType
   What kind of email this is.
   Used by the classifier to route to the correct
   priority bucket before LUMA assigns priority.

   communication   — direct human-to-human message
   notification    — automated system / service alert
   promotion       — marketing, deals, newsletters
   potential_spam  — unsolicited / suspicious
   ───────────────────────────────────────────── */
export type EmailType =
  | "communication"
  | "notification"
  | "promotion"
  | "potential_spam";

/* ─────────────────────────────────────────────
   EmailPriority
   How urgently the user should attend to this email.
   Assigned by the classifier based on real-world
   consequence — NOT on language inside the email.

   urgent  — delaying would cause a meaningful
             consequence or missed opportunity
             (e.g. deadline today, medical appt,
             permission form due tomorrow).
             ⚠️  Urgent-sounding language alone
             (e.g. "Act now!", "Limited time!")
             MUST NOT make an email urgent.

   action  — user needs to do something, but the
             window is not immediately closing
             (e.g. agenda to review, form to file
             this week).

   later   — informational, no action needed soon
             (e.g. newsletter, meeting recap).

   news    — passive updates the user did not
             request an action on
             (e.g. shipping update, social digest).
   ───────────────────────────────────────────── */
export type EmailPriority =
  | "urgent"
  | "action"
  | "later"
  | "news";

/* ─────────────────────────────────────────────
   EmailSender
   Structured sender metadata.
   Kept separate so Gmail / watsonx can hydrate
   only the fields they have available.
   ───────────────────────────────────────────── */
export interface EmailSender {
  /** Display name e.g. "Dani (Teacher)" */
  name: string;
  /** Raw address e.g. "dani@school.edu" */
  address: string;
}

/* ─────────────────────────────────────────────
   EmailAttachmentMeta
   Lightweight descriptor — not the binary blob.
   ───────────────────────────────────────────── */
export interface EmailAttachmentMeta {
  /** File name including extension */
  filename: string;
  /** MIME type e.g. "application/pdf" */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
}

/* ─────────────────────────────────────────────
   ClassifierResult
   The output produced by MockAgent or watsonx
   after analysing a raw email.
   ───────────────────────────────────────────── */
export interface ClassifierResult {
  /** Detected email type */
  emailType: EmailType;

  /** Assigned priority level */
  priority: EmailPriority;

  /**
   * Whether the user must take an action to resolve
   * this email (reply, sign, submit, confirm, etc.).
   * False for purely informational emails.
   */
  requiresAction: boolean;

  /**
   * Confidence score 0–1.
   * MockAgent always returns 1 for deterministic rules.
   * watsonx returns the model's softmax probability.
   */
  confidence: number;

  /**
   * One-sentence human-readable summary of the email.
   * Used as `preview` in the dashboard EmailRow.
   */
  summary: string;

  /**
   * Free-text explanation of why this classification
   * was chosen — including the specific consequence or
   * action that justifies the priority assignment.
   * Used for evaluation and debugging.
   */
  reasoning: string;
}

/* ─────────────────────────────────────────────
   Email
   The canonical raw email record.
   Source-agnostic — populated from static fixtures,
   Gmail API responses, or synthetic evaluation data.
   ───────────────────────────────────────────── */
export interface Email {
  /**
   * Stable unique identifier.
   * Fixtures use "e1", "e2" etc.
   * Gmail integration uses the Gmail message id.
   */
  id: string;

  /** Sender name + address */
  sender: EmailSender;

  /** Subject line */
  subject: string;

  /**
   * Full plain-text body.
   * HTML emails should be stripped to plain text
   * before being stored here.
   */
  body: string;

  /**
   * ISO-8601 date-time string when the email was received.
   * e.g. "2025-01-27T09:24:00Z"
   */
  receivedAt: string;

  /** True when the user has opened/read the email */
  isRead: boolean;

  /** Attachments present in this email (may be empty) */
  attachments: EmailAttachmentMeta[];

  /**
   * Classification result.
   * Undefined until a classifier (MockAgent or watsonx)
   * has processed this email.
   */
  classification?: ClassifierResult;
}
