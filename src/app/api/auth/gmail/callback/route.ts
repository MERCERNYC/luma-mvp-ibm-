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
     3. Stores tokens in an iron-session encrypted cookie.
     4. Redirects to "/" so the dashboard loads with Gmail connected.

   On error (denial, state mismatch, token exchange failure):
     Redirects to "/?gmail_error=<reason>" so the UI can show
     a banner without crashing.

   Token storage
   ─────────────
   Tokens are stored in an iron-session cookie (AES-256-GCM encrypted)
   so the plaintext is never sent to the client.  The old gmail_tokens
   plaintext cookie is deleted on every callback to migrate existing
   sessions.
   ═══════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { cookies }                   from "next/headers";
import { getSession }                from "@/lib/session";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const IS_PROD   = process.env.NODE_ENV === "production";

export interface GmailTokens {
  access_token:  string;
  refresh_token: string | null;
  expiry_date:   number; /* Unix ms */
}

/** Runtime type-guard — rejects cookies that don't have the expected shape. */
export function isValidTokens(v: unknown): v is GmailTokens {
  if (typeof v !== "object" || v === null) return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.access_token === "string"  && t.access_token.length > 0 &&
    (t.refresh_token === null || typeof t.refresh_token === "string") &&
    typeof t.expiry_date === "number"
  );
}

/** Shared cookie options for gmail_tokens — keeps set/delete calls in sync. */
export function tokenCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: "lax" as const,
    maxAge,
    path:     "/",
  };
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

  // ── Store tokens in encrypted iron-session cookie ───────────
  // Also delete any legacy plaintext gmail_tokens cookie so existing
  // users get cleanly migrated on their next login.
  jar.delete("gmail_tokens");

  const session = await getSession();
  session.gmailTokens = tokens;
  await session.save();

  return NextResponse.redirect(`${origin}/`);
}
