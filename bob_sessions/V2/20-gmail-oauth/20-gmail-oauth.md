# Session 20 — Gmail OAuth Plumbing (V2 branch)

**Status:** complete  **Date:** 2025-01-28  **Branch:** `feature/gmail-readonly`

---

## Goal

Lay the OAuth 2.0 + Gmail API plumbing for LUMA V2 without touching any V1/v7 logic.  
The seam: a new `/api/gmail/messages` route that returns `ClassifyInput[]` — exactly what the existing classify pipeline already consumes.

---

## Architecture

```
V1 (unchanged)                 V2 (this session)
──────────────                 ─────────────────
50 test emails                 Gmail API (read-only)
      │                               │
      │                  GET /api/auth/gmail          ← consent redirect
      │                  GET /api/auth/gmail/callback  ← token exchange
      │                               │
      │               gmailMessageToClassifyInput()    ← normalizer
      │                               │
      └──────── ClassifyInput[] ──────┘
                       │
            POST /api/agent/classify   (LUMA v7 — UNCHANGED)
                       │
            useClassifiedEmails()      (UNCHANGED)
                       │
               Dashboard               (UNCHANGED)
```

---

## Files created

### 1. `src/app/api/auth/gmail/route.ts`
`GET /api/auth/gmail`

Builds a Google OAuth 2.0 authorisation URL and redirects the browser to it.

- Scopes: `gmail.readonly` (no write access)
- Generates a random 16-byte hex `state` token, stores it in a short-lived `HttpOnly` cookie (`gmail_oauth_state`, 10 min TTL) for CSRF protection
- Passes `access_type=offline` + `prompt=consent` so Google always returns a refresh token

### 2. `src/app/api/auth/gmail/callback/route.ts`
`GET /api/auth/gmail/callback`

Google redirects here after the user approves (or denies) access.

| Step | Detail |
|---|---|
| Error check | If Google sends `?error=`, redirect to `/?gmail_error=<reason>` |
| CSRF check | Compare `?state=` against `gmail_oauth_state` cookie; redirect on mismatch |
| Token exchange | POST to `https://oauth2.googleapis.com/token` with the one-time `code` |
| Store tokens | Serialise `{ access_token, refresh_token, expiry_date }` into `gmail_tokens` HttpOnly cookie (30-day maxAge) |
| Redirect | Back to `/` — dashboard loads with Gmail now connected |

### 3. `src/services/gmail/normalizer.ts`
`gmailMessageToClassifyInput(msg: GmailMessage): ClassifyInput`

The **only coupling point** between Gmail and the LUMA pipeline.

| Mapping | Source |
|---|---|
| `id` | `msg.id` (Gmail message ID) |
| `subject` | `Subject` header |
| `sender` | display name from `From` header |
| `senderEmail` | email address from `From` header |
| `preview` | `msg.snippet` (HTML entities decoded, max 120 chars) |
| `body` | recursively decoded `text/plain` MIME part; falls back to snippet |

### 4. `src/app/api/gmail/messages/route.ts`
`GET /api/gmail/messages[?maxResults=N]`

Fetches real inbox messages and returns `{ emails: ClassifyInput[] }`.

- Reads `gmail_tokens` cookie; returns `401` if absent
- Auto-refreshes access token when `expiry_date - now < 60 s`
- Lists up to `maxResults` (default 20, max 50) message IDs from `INBOX`
- Fetches full message objects in parallel (`format=full`)
- Normalises via `gmailMessageToClassifyInput()`

---

## Files NOT changed

| File | Reason |
|---|---|
| `src/services/agent/WatsonxAgent.ts` | V7 logic — frozen |
| `src/services/agent/MockAgent.ts` | Evaluation logic — frozen |
| `src/hooks/useClassifiedEmails.ts` | Still uses test emails — wired in next session |
| `src/app/api/agent/classify/route.ts` | Unchanged |
| `src/app/page.tsx` | Dashboard unchanged |
| `src/types/dashboard.ts` | Unchanged |

---

## Environment variables added (`.env.local`)

```
GOOGLE_CLIENT_ID=       ← paste from Google Cloud Console
GOOGLE_CLIENT_SECRET=   ← paste from Google Cloud Console
NEXT_PUBLIC_URL=http://localhost:3000
```

### Google Cloud Console setup (one-time, manual)
1. Enable the **Gmail API** for your project
2. Create an **OAuth 2.0 Web Application** credential
3. Add `http://localhost:3000/api/auth/gmail/callback` to **Authorised Redirect URIs**
4. Copy **Client ID** and **Client Secret** into `.env.local`

---

## Build result

```
✓ TypeScript — 0 errors (tsc --noEmit)
```

---

## Next session (Session 21)

Wire `useClassifiedEmails` to try Gmail first, fall back to test emails when unauthenticated, and add a "Connect Gmail" button to the dashboard header.
