/* ═══════════════════════════════════════════════════════════════
   GET /api/auth/gmail/status
   ───────────────────────────────────────────────────────────────
   Returns whether the current session has valid Gmail tokens.
   The gmail_tokens cookie is HttpOnly — client components cannot
   read it directly, so they call this route instead.

   Response (always 200):
     { connected: true }   — gmail_tokens cookie present + parseable
     { connected: false }  — cookie absent or unparseable
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { cookies }      from "next/headers";

export async function GET() {
  const jar = await cookies();
  const raw = jar.get("gmail_tokens")?.value;

  if (!raw) {
    return NextResponse.json({ connected: false });
  }

  try {
    JSON.parse(raw);
    return NextResponse.json({ connected: true });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
