/* ═══════════════════════════════════════════════════════════════
   POST /api/auth/gmail/disconnect
   ───────────────────────────────────────────────────────────────
   Revokes the Gmail OAuth tokens with Google, then destroys the
   iron-session so LUMA considers the user disconnected.

   Token revocation
   ────────────────
   POSTs the refresh token to Google's revoke endpoint.  Handles
   400 responses gracefully — the token may already be expired or
   previously revoked.  The session is destroyed regardless of the
   revocation outcome, so the user is always logged out locally.

   Why POST and not GET?
   A GET endpoint that deletes auth state is CSRF-vulnerable — any
   page could embed <img src="/api/auth/gmail/disconnect" /> and
   silently disconnect the user.  POST requires an explicit fetch()
   from client JS, which is safe under sameSite: lax.

   Response (always 200 JSON):
     { disconnected: true }
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse }  from "next/server";
import { cookies }       from "next/headers";
import { getSession }    from "@/lib/session";

const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export async function POST() {
  const session = await getSession();
  const tokens  = session.gmailTokens;

  // ── Revoke refresh token with Google ─────────────────────────
  // We revoke the refresh token (longer-lived) rather than the
  // access token.  Errors are logged but do not block disconnect —
  // the session is always cleared locally.
  if (tokens?.refresh_token) {
    try {
      const res = await fetch(REVOKE_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    new URLSearchParams({ token: tokens.refresh_token }),
      });
      if (!res.ok && res.status !== 400) {
        // 400 = already revoked/expired — expected; anything else is worth logging.
        console.warn("[gmail/disconnect] revoke returned", res.status);
      }
    } catch (err) {
      console.warn("[gmail/disconnect] revoke network error:", err);
    }
  }

  // ── Destroy the iron-session ──────────────────────────────────
  await session.destroy();

  // ── Also clear any legacy plaintext gmail_tokens cookie ──────
  const jar = await cookies();
  jar.delete("gmail_tokens");

  return NextResponse.json({ disconnected: true });
}
