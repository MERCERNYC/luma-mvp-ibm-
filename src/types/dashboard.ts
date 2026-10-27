/* ═══════════════════════════════════════════════
   LUMA Dashboard types — v2
   Tag labels match the image: Action Needed /
   For Later / News & Updates
   ═══════════════════════════════════════════════ */

/** Icon variant for the sender avatar background */
export type IconVariant = "doc" | "people" | "home" | "mail" | "calendar" | "chart";

/**
 * Priority tag shown on each email row (right-aligned pill).
 * Plain language — no jargon.
 */
export type TaskPriority = "action-needed" | "for-later" | "news-updates";

/** Attachment shown in the email reading pane */
export interface EmailAttachment {
  name: string;
  meta: string; /* e.g. "PDF · 248 KB" */
}

/** A single email item — used both in the list and the reading pane */
export interface Task {
  id: string;
  priority: TaskPriority;
  /** Display name of sender */
  sender: string;
  /** Raw email address */
  senderEmail: string;
  /** Initials shown in the avatar circle */
  senderInitial: string;
  /** Background colour key for the avatar */
  avatarColor: "blue" | "purple" | "green" | "orange";
  /** Email subject line */
  subject: string;
  /** Short preview shown in the list row (~60 chars) */
  preview: string;
  /** Full body — shown in the reading pane */
  body: string;
  /** Displayed time string e.g. "9:24 AM" */
  time: string;
  attachment?: EmailAttachment;
}
