/**
 * src/lib/session.ts
 * ──────────────────
 * iron-session configuration for LUMA.
 *
 * Session contents
 * ────────────────
 * { gmailTokens?: GmailTokens }
 *
 * The entire object is encrypted with AES-256-GCM using SESSION_SECRET
 * before being written to the browser cookie.  The browser holds a
 * sealed, opaque blob — the plaintext tokens are never sent to the client.
 *
 * Cookie properties
 * ─────────────────
 *   Name:      luma_session
 *   httpOnly:  true  — not accessible to client-side JavaScript
 *   secure:    true  — HTTPS only in production
 *   sameSite:  lax   — protects against CSRF on cross-origin navigations
 *   maxAge:    30 d  — auto-expires; user re-authenticates after
 *   path:      /     — readable by all API routes on this origin
 *
 * Cookie size
 * ───────────
 * iron-session seals a GmailTokens object (~280 chars of JSON).
 * The sealed output is Base64url-encoded and adds ~100 bytes of
 * iron overhead, plus a ~32-byte MAC.  Total: ≈ 600–700 bytes,
 * well inside the 4096-byte browser cookie limit.
 *
 * Known limitations (documented per approval)
 * ────────────────────────────────────────────
 * • Server-side revocation is not possible: the browser holds the only
 *   copy of the session.  Deleting the cookie does not invalidate a
 *   copy that may have been captured earlier (e.g. by a browser extension
 *   or in a screenshot).  For production hardening, store a session ID in
 *   a database and check it on every request.
 * • Each browser/device gets its own independent session.
 * • Rate limiting (see rateLimit.ts) is in-memory per process instance.
 *   On Vercel's serverless architecture, multiple concurrent function
 *   instances each maintain separate counters, so the limits are
 *   best-effort, not globally enforced.
 */

import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies }                                               from "next/headers";
import type { GmailTokens }                                      from "@/app/api/auth/gmail/callback/route";

// ── Session data shape ───────────────────────────────────────────

export interface SessionData {
  gmailTokens?: GmailTokens;
}

// ── Session options ──────────────────────────────────────────────

const IS_PROD = process.env.NODE_ENV === "production";

/** Minimum length enforced for SESSION_SECRET. */
const MIN_SECRET_LEN = 32;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET ?? "";
  if (secret.length < MIN_SECRET_LEN) {
    throw new Error(
      `SESSION_SECRET must be at least ${MIN_SECRET_LEN} characters. ` +
      `Generate one with: openssl rand -hex 32`,
    );
  }
  return secret;
}

export const SESSION_OPTIONS: SessionOptions = {
  cookieName: "luma_session",
  get password() { return getSecret(); },
  cookieOptions: {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 30, // 30 days
    path:     "/",
  },
};

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Returns the current iron-session for the incoming request.
 * Usage (in a Route Handler):
 *
 *   const session = await getSession();
 *   const tokens  = session.gmailTokens;
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const jar = await cookies();
  return getIronSession<SessionData>(jar, SESSION_OPTIONS);
}
