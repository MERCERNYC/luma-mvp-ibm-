/* ═══════════════════════════════════════════════════════════════
   GET /api/auth/gmail/callback
   ───────────────────────────────────────────────────────────────
   Google redirects here after the user grants (or denies) access.

   Query params from Google:
     code  — one-time authorisation code
     state — echoed back from our original redirect

   On success:
     1. Verifies state against the cookie (CSRF check).
     2. Exchanges the code for access + refresh tokens.
     3. Stores tokens in a single HttpOnly cookie ("gmail_tokens").
     4. Redirects to "/" so the dashboard loads with Gmail connected.

   On error (denial, state mismatch, token exchange failure):
     Redirects to "/?gmail_error=<reason>" so the UI can show
     a banner without crashing.

   Token storage
   ─────────────
   Tokens are stored server-side in an HttpOnly cookie so they are
   never accessible to client JavaScript.  The cookie is:
     - httpOnly: true  — no JS access
     - sameSite: lax   — safe for top-level navigations
     - path: /         — readable by all API routes
     - maxAge: 30 days — auto-expires; user re-authenticates after
   ═══════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { cookies }                   from "next/headers";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export interface GmailTokens {
  access_token:  string;
  refresh_token: string | null;
  expiry_date:   number; /* Unix ms */
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code             = searchParams.get("code");
  const state            = searchParams.get("state");
  const error            = searchParams.get("error");
  const origin           = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  // ── User denied access ──────────────────────────────────────
  if (error) {
    return NextResponse.redirect(
      `${origin}/?gmail_error=${encodeURIComponent(error)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/?gmail_error=missing_params`);
  }

  // ── CSRF state check ────────────────────────────────────────
  const jar       = await cookies();
  const savedState = jar.get("gmail_oauth_state")?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${origin}/?gmail_error=state_mismatch`);
  }

  // Consume the state cookie — single use
  jar.delete("gmail_oauth_state");

  // ── Token exchange ──────────────────────────────────────────
  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri  = `${origin}/api/auth/gmail/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/?gmail_error=server_config`);
  }

  let tokens: GmailTokens;

  try {
    const res = await fetch(TOKEN_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    "authorization_code",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[gmail/callback] token exchange failed:", text);
      return NextResponse.redirect(`${origin}/?gmail_error=token_exchange`);
    }

    const data = await res.json() as {
      access_token:  string;
      refresh_token?: string;
      expires_in:    number;
    };

    tokens = {
      access_token:  data.access_token,
      refresh_token: data.refresh_token ?? null,
      expiry_date:   Date.now() + data.expires_in * 1000,
    };
  } catch {
    return NextResponse.redirect(`${origin}/?gmail_error=token_exchange`);
  }

  // ── Store tokens in HttpOnly cookie ────────────────────────
  jar.set("gmail_tokens", JSON.stringify(tokens), {
    httpOnly: true,
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 30, // 30 days
    path:     "/",
  });

  return NextResponse.redirect(`${origin}/`);
}
