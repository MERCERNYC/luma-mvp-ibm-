/* ═══════════════════════════════════════════════════════════════
   GET /api/gmail/messages
   ───────────────────────────────────────────────────────────────
   Fetches the most recent inbox messages via the Gmail REST API
   and returns them as ClassifyInput[] — the exact shape LUMA v7
   already expects.

   Auth:
     Reads the "gmail_tokens" HttpOnly cookie written by the
     /api/auth/gmail/callback route.  Returns 401 when absent.

   Query params:
     maxResults — number of messages to fetch (default 20, max 50)

   Response (200):
     { emails: ClassifyInput[] }

   Error responses:
     401 — not authenticated (redirect client to /api/auth/gmail)
     500 — Gmail API error
   ═══════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { cookies }                   from "next/headers";
import type { GmailTokens }          from "@/app/api/auth/gmail/callback/route";
import {
  gmailMessageToClassifyInput,
  type GmailMessage,
} from "@/services/gmail/normalizer";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";

// ── Token helpers ────────────────────────────────────────────────

async function getAccessToken(tokens: GmailTokens): Promise<string> {
  // If the access token hasn't expired yet (with 60 s buffer), use it.
  if (tokens.expiry_date - Date.now() > 60_000) {
    return tokens.access_token;
  }

  // Refresh the access token
  if (!tokens.refresh_token) {
    throw new Error("no_refresh_token");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID    ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: tokens.refresh_token,
      grant_type:    "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("token_refresh_failed");

  const data = await res.json() as {
    access_token: string;
    expires_in:   number;
  };

  return data.access_token;
}

// ── Route handler ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const jar          = await cookies();
  const tokensCookie = jar.get("gmail_tokens")?.value;

  if (!tokensCookie) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let tokens: GmailTokens;
  try {
    tokens = JSON.parse(tokensCookie) as GmailTokens;
  } catch {
    return NextResponse.json({ error: "invalid_token_cookie" }, { status: 401 });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(tokens);
  } catch {
    return NextResponse.json({ error: "token_expired" }, { status: 401 });
  }

  // ── Parse maxResults param ───────────────────────────────────
  const raw        = request.nextUrl.searchParams.get("maxResults");
  const maxResults = Math.min(Math.max(parseInt(raw ?? "20", 10) || 20, 1), 50);

  try {
    // 1. List message IDs from INBOX
    const listRes = await fetch(
      `${GMAIL_API}/users/me/messages?` +
        new URLSearchParams({
          labelIds:   "INBOX",
          maxResults: String(maxResults),
        }),
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!listRes.ok) {
      const text = await listRes.text();
      console.error("[gmail/messages] list failed:", text);
      return NextResponse.json({ error: "gmail_list_failed" }, { status: 500 });
    }

    const list = await listRes.json() as { messages?: { id: string }[] };
    const ids  = (list.messages ?? []).map((m) => m.id);

    if (ids.length === 0) {
      return NextResponse.json({ emails: [] });
    }

    // 2. Fetch full message objects in parallel (format=full for body)
    const messageResponses = await Promise.all(
      ids.map((id) =>
        fetch(`${GMAIL_API}/users/me/messages/${id}?format=full`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then((r) => r.json() as Promise<GmailMessage>),
      ),
    );

    // 3. Normalize to ClassifyInput[]
    const emails = messageResponses.map(gmailMessageToClassifyInput);

    return NextResponse.json({ emails });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("[gmail/messages]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
