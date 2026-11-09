/* ═══════════════════════════════════════════════════════════════
   POST /api/auth/gmail/disconnect
   ───────────────────────────────────────────────────────────────
   Clears the gmail_tokens HttpOnly cookie so LUMA considers the
   user disconnected from Gmail.

   This does NOT revoke the token with Google (no network call).
   The access token will simply expire on its own.  If token
   revocation is needed in future, POST to:
     https://oauth2.googleapis.com/revoke?token=<access_token>

   Why POST and not GET?
   A GET endpoint that deletes auth state is CSRF-vulnerable — any
   page could embed <img src="/api/auth/gmail/disconnect" /> and
   silently disconnect the user.  POST requires an explicit fetch()
   from client JS, which is safe under sameSite: lax.

   Response (always 200 JSON):
     { disconnected: true }
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { cookies }      from "next/headers";

export async function POST() {
  const jar = await cookies();

  // Clear the tokens cookie by setting maxAge to 0.
  // The cookie name, path, and httpOnly must match exactly what was set
  // in /api/auth/gmail/callback so the browser removes it.
  jar.set("gmail_tokens", "", {
    httpOnly: true,
    sameSite: "lax",
    maxAge:   0,
    path:     "/",
  });

  return NextResponse.json({ disconnected: true });
}
