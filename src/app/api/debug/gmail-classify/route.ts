/* ═══════════════════════════════════════════════════════════════
   GET /api/debug/gmail-classify
   ───────────────────────────────────────────────────────────────
   DEVELOPMENT ONLY — returns 404 in production.

   Fetches the current Gmail inbox, runs every message through
   the classify pipeline, and returns a combined debug payload
   showing exactly what was sent to the agent and what it decided.

   This route is the single source of truth for diagnosing
   classification issues. It does NOT change any pipeline behaviour.

   Response (200):
     {
       source:  "gmail" | "not_connected"
       rows: DebugRow[]
     }

   DebugRow:
     {
       // ── Normalised input sent to the agent ──
       id:           string
       sender:       string
       senderEmail:  string
       subject:      string
       preview:      string        (first 200 chars)
       bodyPreview:  string        (first 400 chars)
       receivedAt:   number        (Unix ms)
       receivedDate: string        (human-readable ISO)

       // ── Agent classification result ──
       priority:          "action-needed" | "for-later" | "news-updates"
       emailType:         string
       requiresAction:    boolean
       reason:            string
       recommendedAction: string | null
       confidence:        number
     }
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse }    from "next/server";
import { getSession }      from "@/lib/session";
import type { GmailTokens } from "@/app/api/auth/gmail/callback/route";
import {
  gmailMessageToClassifyInput,
  type GmailMessage,
} from "@/services/gmail/normalizer";
import { agentService } from "@/services/agent";

// ── Dev-only gate ────────────────────────────────────────────────

const IS_DEV = process.env.NODE_ENV !== "production";

// ── Token helper (same logic as /api/gmail/messages) ─────────────

async function getAccessToken(tokens: GmailTokens): Promise<string> {
  if (tokens.expiry_date - Date.now() > 60_000) return tokens.access_token;
  if (!tokens.refresh_token) throw new Error("no_refresh_token");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID     ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: tokens.refresh_token,
      grant_type:    "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("token_refresh_failed");
  const data = await res.json() as { access_token: string; expires_in: number };
  return data.access_token;
}

// ── Route handler ────────────────────────────────────────────────

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";

export async function GET() {
  if (!IS_DEV) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // ── Check Gmail auth ─────────────────────────────────────────
  const session = await getSession();
  const tokens  = session.gmailTokens;

  if (!tokens) {
    return NextResponse.json({ source: "not_connected", rows: [] });
  }

  let accessToken: string;
  try { accessToken = await getAccessToken(tokens); }
  catch { return NextResponse.json({ source: "not_connected", rows: [] }); }

  // ── Fetch inbox messages ──────────────────────────────────────
  const listRes = await fetch(
    `${GMAIL_API}/users/me/messages?` +
      new URLSearchParams({ labelIds: "INBOX", maxResults: "50" }),
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!listRes.ok) {
    return NextResponse.json(
      { error: "Gmail list failed", detail: await listRes.text() },
      { status: 502 },
    );
  }

  const list = await listRes.json() as { messages?: { id: string }[] };
  const ids  = (list.messages ?? []).map((m) => m.id);

  if (ids.length === 0) {
    return NextResponse.json({ source: "gmail", rows: [] });
  }

  // Fetch full message objects (same as production route)
  const messages = await Promise.all(
    ids.map((id) =>
      fetch(`${GMAIL_API}/users/me/messages/${id}?format=full`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => r.json() as Promise<GmailMessage>),
    ),
  );

  // ── Normalise ────────────────────────────────────────────────
  const inputs      = messages.map(gmailMessageToClassifyInput);
  const receivedAts = messages.map((m) => Number(m.internalDate) || Date.now());

  // ── Classify (sequential to avoid rate-limiting) ─────────────
  const results = await Promise.all(
    inputs.map((input) => agentService.classifyEmail(input)),
  );

  // ── Zip into debug rows ───────────────────────────────────────
  const rows = inputs.map((input, i) => ({
    // Normalised input
    id:           input.id,
    sender:       input.sender,
    senderEmail:  input.senderEmail,
    subject:      input.subject,
    preview:      input.preview.slice(0, 200),
    bodyPreview:  input.body.slice(0, 400),
    receivedAt:   receivedAts[i],
    receivedDate: new Date(receivedAts[i]).toISOString(),

    // Agent result (no chain-of-thought / internal reasoning)
    priority:          results[i].priority,
    emailType:         results[i].emailType,
    requiresAction:    results[i].requiresAction,
    reason:            results[i].reason,
    recommendedAction: results[i].recommendedAction,
    confidence:        results[i].confidence,
  }));

  return NextResponse.json({ source: "gmail", rows });
}
