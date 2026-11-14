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

import { NextRequest, NextResponse } from "next/server";
import { cookies }                   from "next/headers";
import { randomBytes }               from "crypto";
import { authRouteLimiter }          from "@/lib/rateLimit";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPE           = "https://www.googleapis.com/auth/gmail.readonly";
const IS_PROD         = process.env.NODE_ENV === "production";

/** Derive and validate the app origin from env.
 *  Strips trailing slash.
 *  In production, rejects any non-HTTPS origin to prevent tokens
 *  being issued against a plain-HTTP redirect URI.
 */
function getOrigin(): string | null {
  const raw = (process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000").replace(/\/$/, "");
  if (IS_PROD && !raw.startsWith("https://")) return null;
  return raw;
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!authRouteLimiter.check(ip)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin   = getOrigin();

  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID is not configured." },
      { status: 500 },
    );
  }

  if (!origin) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_URL must be an https:// URL in production." },
      { status: 500 },
    );
  }

  const redirectUri = `${origin}/api/auth/gmail/callback`;

  // Generate a random state token for CSRF protection
  const state = randomBytes(16).toString("hex");

  const jar = await cookies();
  jar.set("gmail_oauth_state", state, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: "lax",
    maxAge:   600, // 10 minutes
    path:     "/",
  });

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         SCOPE,
    access_type:   "offline",          // request a refresh token
    // "select_account" forces the Google account chooser every time,
    // so the user can pick a different account on reconnect.
    // "consent" ensures a refresh token is always returned.
    prompt:        "select_account consent",
    state,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
