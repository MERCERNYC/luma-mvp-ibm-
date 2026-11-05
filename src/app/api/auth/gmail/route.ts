/* ═══════════════════════════════════════════════════════════════
   GET /api/auth/gmail
   ───────────────────────────────────────────────────────────────
   Redirects the browser to Google's OAuth 2.0 consent screen.

   Scopes requested (read-only):
     gmail.readonly — read messages and metadata, no write access.

   The `state` param is a random hex string stored in a short-lived
   HttpOnly cookie so the callback can verify it (CSRF protection).

   Prerequisites (Google Cloud Console):
     1. Enable the Gmail API for your project.
     2. Create an OAuth 2.0 Web Application credential.
     3. Add http://localhost:3000/api/auth/gmail/callback to
        Authorised Redirect URIs.
     4. Copy client ID + secret into .env.local.
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse }  from "next/server";
import { cookies }       from "next/headers";
import { randomBytes }   from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPE          = "https://www.googleapis.com/auth/gmail.readonly";

export async function GET() {
  const clientId    = process.env.GOOGLE_CLIENT_ID;
  const origin      = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const redirectUri = `${origin}/api/auth/gmail/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID is not configured." },
      { status: 500 },
    );
  }

  // Generate a random state token for CSRF protection
  const state = randomBytes(16).toString("hex");

  const jar = await cookies();
  jar.set("gmail_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge:   600, // 10 minutes
    path:     "/",
  });

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         SCOPE,
    access_type:   "offline",   // request a refresh token
    prompt:        "consent",   // always show consent so we get refresh_token
    state,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
