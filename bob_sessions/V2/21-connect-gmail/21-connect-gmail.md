# Session 21 — Connect Gmail (V2 branch)

**Status:** complete  **Date:** 2025-01-28  **Branch:** `feature/gmail-readonly`

---

## Goal

Add a "Connect Gmail" button to LUMA Preferences so the user can authenticate
the existing OAuth flow from the UI.

Constraints:
- Do **not** fetch or classify Gmail emails on the dashboard yet
- Keep demo email classification working unchanged
- Do not touch LUMA v7, WatsonxAgent, AgentService, classification logic, or evaluation dataset

---

## Architecture

```
Header
  └── PreferencesModal (new)
        └── GET /api/auth/gmail/status  (new)
              └── reads gmail_tokens HttpOnly cookie → { connected: bool }

"Connect Gmail" button → GET /api/auth/gmail (session 20, unchanged)
                       → Google consent
                       → GET /api/auth/gmail/callback (session 20, unchanged)
                       → sets gmail_tokens cookie → redirect /

page.tsx
  └── reads ?gmail_error= on mount → dismissable red banner
```

---

## Files created

### 1. `src/app/api/auth/gmail/status/route.ts`
`GET /api/auth/gmail/status`

Reads the `gmail_tokens` HttpOnly cookie server-side and returns
`{ connected: true }` or `{ connected: false }`.

Client components cannot read HttpOnly cookies directly — this route is the
only safe way to check connection status from the browser.

### 2. `src/components/layout/PreferencesModal.tsx`
Dropdown panel rendered from the Header "LUMA Preferences" button.

| State | UI |
|---|---|
| `checking` | Spinner — "Checking connection…" |
| `disconnected` | "Connect Gmail" button → `/api/auth/gmail` |
| `connected` | Green "Gmail Connected" badge + "Read-only · Demo emails active" |

- Calls `/api/auth/gmail/status` on every open
- Closes on Escape key or backdrop click
- Uses `<a href>` (not `fetch`) for the Connect button — a full navigation
  is required so Google can redirect the browser through the OAuth flow

---

## Files modified

### 3. `src/components/layout/Header.tsx`
- Added `useState` for `prefsOpen`
- Preferences button toggles modal open/closed; turns blue when open
- `aria-haspopup="dialog"` + `aria-expanded` for accessibility
- Renders `<PreferencesModal onClose={…} />` when open

### 4. `src/app/page.tsx`
- Added `useEffect` that reads `?gmail_error=` from the URL on mount
- Clears the param with `history.replaceState` (no reload)
- Renders a dismissable red banner when an error is present

---

## Files NOT changed

| File | Reason |
|---|---|
| `src/services/agent/WatsonxAgent.ts` | V7 logic — frozen |
| `src/services/agent/MockAgent.ts` | Evaluation logic — frozen |
| `src/hooks/useClassifiedEmails.ts` | Still uses demo emails — wired next session |
| `src/app/api/agent/classify/route.ts` | Unchanged |
| `src/app/api/auth/gmail/route.ts` | OAuth redirect — unchanged |
| `src/app/api/auth/gmail/callback/route.ts` | Token exchange — unchanged |
| `src/app/api/gmail/messages/route.ts` | Unchanged |
| `src/services/gmail/normalizer.ts` | Unchanged |

---

## Environment

```
NEXT_PUBLIC_URL=http://localhost:3001   ← 3000 is occupied by Docker
GOOGLE_CLIENT_ID=       ← Google Cloud Console
GOOGLE_CLIENT_SECRET=   ← Google Cloud Console
```

Dev server runs on **3001**. Google Cloud Console Authorised Redirect URI must be:
```
http://localhost:3001/api/auth/gmail/callback
```

---

## Security notes (from session review)

The `gmail_tokens` HttpOnly cookie is:

| Property | What it means |
|---|---|
| `HttpOnly` | Client-side JS cannot read it — protects against XSS |
| `sameSite: lax` | Not sent on cross-site POST — protects against CSRF |
| **Not covered** | Cookie is still transmitted to the server on every matching request |

"Never leaves your machine" is **not accurate** — cookies travel to the server
on every request to the matching origin.  For local dev the risk surface is
minimal (server is localhost).  Before any real-user deployment, review:

- HTTPS + `Secure` flag on the cookie
- Move tokens to an encrypted server-side session store (raw tokens in a cookie
  are exposed if the cookie is stolen)
- Refresh token rotation / revocation on sign-out
- `gmail.readonly` scope is already correct — no escalation risk

---

## Forwarded test emails (deferred)

Discussed using a dedicated Gmail account with forwarded test emails.
Decision: **defer**. Stripping `Fwd:` from the subject is the wrong level of
intervention — the `From` header and body boilerplate are bigger problems for
the classifier. Options for a later session:

- **Option A** — Accept forwarded appearance; good enough for pipeline smoke tests
- **Option B** — Parse the forwarded-message block to recover real sender /
  subject / body (implemented as a wrapper on top of `gmailMessageToClassifyInput`,
  not inside it)

Real inbox (own Gmail account, read-only, first 100 emails) is safe for local
dev — scope is `gmail.readonly`, nothing is written, tokens never leave localhost.

---

## Build result

```
✓ TypeScript — 0 errors (tsc --noEmit)
✓ Next.js build — 0 errors, all routes registered

Route (app)
├ ƒ /api/auth/gmail
├ ƒ /api/auth/gmail/callback
├ ƒ /api/auth/gmail/status      ← new
├ ƒ /api/gmail/messages
└ ...
```

---

## Test procedure

1. `npm run dev` → open `http://localhost:3001`
2. Click **LUMA Preferences** → panel opens
3. If not connected: click **Connect Gmail** → Google consent screen
4. Approve → redirected back to dashboard
5. Open **LUMA Preferences** again → **Gmail Connected** badge
6. Dashboard unchanged — still classifies 50 demo emails

Error path: navigate to `/?gmail_error=access_denied` → red dismissable banner.

---

## Next session (Session 22)

- Bump `maxResults` to 100 with a concurrency limiter (batches of 10)
- Wire `useClassifiedEmails` to try `GET /api/gmail/messages` first,
  fall back to demo emails when unauthenticated
- Decide on forwarded-email parsing strategy after seeing first real
  classification results
