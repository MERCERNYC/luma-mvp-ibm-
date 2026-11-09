/* ═══════════════════════════════════════════════════════════════
   classifyInputToTask
   ───────────────────────────────────────────────────────────────
   Converts a ClassifyInput (the shape returned by
   GET /api/gmail/messages) into a Task (the shape the dashboard
   and email pane expect).

   Used by useClassifiedEmails when the Gmail source is active.
   The dataset path (evalEmailsToTasks) is unchanged.
   ═══════════════════════════════════════════════════════════════ */

import type { ClassifyInput } from "@/services/agent/types";
import type { Task }          from "@/types/dashboard";

const AVATAR_COLORS = ["blue", "purple", "green", "orange"] as const;

function deriveInitial(sender: string): string {
  return (sender.trim()[0] ?? "?").toUpperCase();
}

function deriveAvatarColor(index: number): Task["avatarColor"] {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function deriveTime(receivedAt: number): string {
  return new Date(receivedAt).toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Convert a ClassifyInput + its array index into a Task.
 *
 * Fields that only the agent can provide (priority, reason,
 * recommendedAction, urgencyScore) are left at their defaults —
 * useClassifiedEmails overwrites them after classification.
 */
export function classifyInputToTask(
  input: ClassifyInput,
  index: number,
  receivedAt: number,
): Task {
  return {
    id:            input.id,
    priority:      "for-later",        // placeholder — overwritten by agent
    sender:        input.sender  || "Unknown",
    senderEmail:   input.senderEmail,
    senderInitial: deriveInitial(input.sender || "?"),
    avatarColor:   deriveAvatarColor(index),
    subject:       input.subject,
    preview:       input.preview,
    body:          input.body,
    displayBody:   input.displayBody,  // sanitized HTML for reading pane
    time:          deriveTime(receivedAt),
    receivedAt,
  };
}
