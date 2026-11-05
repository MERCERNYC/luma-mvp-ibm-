/* ═══════════════════════════════════════════════════════════════
   Gmail message normalizer
   ───────────────────────────────────────────────────────────────
   Converts a raw Gmail API message object into the ClassifyInput
   shape that LUMA v7 / WatsonxAgent already understands.

   This is the sole seam between Gmail and the V1 pipeline.
   Nothing downstream changes — /api/agent/classify, useClassifiedEmails,
   and the dashboard are all untouched.
   ═══════════════════════════════════════════════════════════════ */

import type { ClassifyInput } from "@/services/agent/types";

// ── Gmail REST API types (subset we need) ───────────────────────

export interface GmailMessageHeader {
  name:  string;
  value: string;
}

export interface GmailMessagePart {
  mimeType: string;
  body:     { data?: string; size: number };
  parts?:   GmailMessagePart[];
}

export interface GmailMessage {
  id:               string;
  threadId:         string;
  internalDate:     string; /* Unix ms as a string */
  payload:          GmailMessagePart & { headers: GmailMessageHeader[] };
  snippet:          string;
}

// ── Helpers ──────────────────────────────────────────────────────

function getHeader(msg: GmailMessage, name: string): string {
  return (
    msg.payload.headers.find(
      (h) => h.name.toLowerCase() === name.toLowerCase(),
    )?.value ?? ""
  );
}

/** Recursively extract plain-text body from the MIME tree */
function extractBody(part: GmailMessagePart): string {
  if (part.mimeType === "text/plain" && part.body.data) {
    return Buffer.from(part.body.data, "base64url").toString("utf-8");
  }
  if (part.parts) {
    for (const child of part.parts) {
      const text = extractBody(child);
      if (text) return text;
    }
  }
  return "";
}

/** Pull display name out of "Name <email>" or return address as-is */
function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: from.trim(), email: from.trim() };
}

// ── Main export ──────────────────────────────────────────────────

/**
 * Normalise one Gmail API message into a ClassifyInput.
 * Called by GET /api/gmail/messages for each message in the batch.
 */
export function gmailMessageToClassifyInput(msg: GmailMessage): ClassifyInput {
  const from    = getHeader(msg, "from");
  const subject = getHeader(msg, "subject");
  const { name: sender, email: senderEmail } = parseSender(from);
  const body    = extractBody(msg.payload).trim();
  // snippet is the short preview Google already generates (~100 chars)
  const preview = msg.snippet.replace(/&#(\d+);/g, (_, c) =>
    String.fromCharCode(Number(c)),
  );

  return {
    id:          msg.id,
    subject:     subject || "(no subject)",
    preview:     preview.slice(0, 120),
    body:        body || preview,   // fall back to snippet if body is empty
    sender,
    senderEmail,
  };
}
