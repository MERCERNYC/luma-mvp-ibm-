/* ═══════════════════════════════════════════════════════════════
   GET /api/auth/gmail/status
   ───────────────────────────────────────────────────────────────
   Returns whether the current user has a valid Gmail session.

   Response (200 JSON):
     { connected: true }   — session exists and contains tokens
     { connected: false }  — no session / no tokens
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { getSession }   from "@/lib/session";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ connected: !!session.gmailTokens });
}
