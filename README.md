<div align="center">

<img src="public/images/luma-logo.png" alt="Luma — Less inbox. More life." width="320" />

<br/>

**An AI-powered email attention assistant that helps people focus on what actually needs them.**

> The goal isn't to help people process more email.  
> It's to make email require less mental work.

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![IBM watsonx](https://img.shields.io/badge/IBM_watsonx_Orchestrate-1F70C1?style=flat-square&logo=ibm&logoColor=white)](https://www.ibm.com/products/watsonx-orchestrate)
[![Vercel](https://img.shields.io/badge/Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

</div>

---

## What is LUMA?

Email tools are very good at delivering and organizing messages.

But they still leave the hardest question to the user:

**What actually needs my attention right now?**

LUMA is an agentic AI email experience designed around that question. Instead of presenting another crowded inbox, LUMA reads and understands incoming email, evaluates whether it requires action, prioritizes what matters, recommends a next step, and surfaces a small **Focus Now** queue.

The goal is not inbox zero. The goal is **less cognitive load**.

---

## The Problem

A traditional inbox asks the user to repeatedly decide:

- Is this important?
- Do I need to respond?
- Is there a deadline?
- Can this wait?
- Is this just information?
- Is this marketing pretending to be urgent?

Those decisions create mental work before the user has even started acting on the email. LUMA moves that decision-making support upstream.

---

## How It Works

```
Gmail
  ↓
Normalize Email
  ↓
LUMA Agent (IBM watsonx Orchestrate)
  ↓
UNDERSTAND → PRIORITIZE → RECOMMEND → ASSIST
  ↓
Focus Now
  ↓
Human Decision
```

LUMA organizes email into three categories:

| Category | Meaning |
|---|---|
| **Action Needed** | Requires a reply or decision |
| **For Later** | Relevant, but not urgent right now |
| **FYI** | Informational, newsletters, updates |

The most important actionable emails are surfaced in **Focus Now**.

---

## Focus Now

Focus Now is the core LUMA experience.

Rather than showing the entire inbox at once, LUMA creates a finite queue of **up to five actionable emails**.

```
5 → 4 → 3 → 2 → 1 → 0
```

As the user completes emails, the queue counts down. LUMA does **not** fill empty slots with newsletters or lower-priority emails to keep the list full.

When the queue reaches zero:

> ✨ You're caught up — nothing needs your attention right now.

The user can then choose **Prioritize Again** to generate a fresh window.

---

## One Agent by Design

LUMA intentionally uses **one agent** for the current product scope. This is a deliberate architecture decision.

The LUMA Agent performs four connected capabilities:

1. **Understand** — determine what the email is about
2. **Prioritize** — evaluate importance, action, and urgency
3. **Recommend** — explain why it matters and suggest a next step
4. **Assist** — help the user act, including drafting a reply

A multi-agent architecture would currently introduce additional orchestration, handoffs, latency, and failure points without enough additional user value. As LUMA expands into calendar, tasks, and scheduling, specialized agents may become appropriate.

---

## Human in the Loop

LUMA assists decision-making rather than silently taking consequential actions.

**AI prepares. Human approves.**

LUMA can: understand an email, identify whether action is required, evaluate urgency, prioritize messages, explain why an email matters, recommend a next step, and draft a reply. The user remains in control of the final action.

---

## IBM watsonx Orchestrate + IBM Bob

LUMA is built with **IBM watsonx Orchestrate** as its AI backbone and was developed using **IBM Bob** as its agentic coding assistant.

```
Next.js Application
        ↓
Server API Routes
        ↓
AgentService (IAgent interface)
        ↓
 ┌──────────────────┐
 │                  │
MockAgent    WatsonxAgent
 │                  │
Local         IBM watsonx
Testing       Orchestrate
 └──────┬───────────┘
        ↓
 Structured Result
        ↓
 LUMA Dashboard
```

The application communicates with the AI layer through a shared `IAgent` contract, keeping the interface provider-agnostic. Provider selection is server-side via environment variable:

```env
AGENT_PROVIDER=mock      # local development / testing
AGENT_PROVIDER=watsonx   # IBM watsonx Orchestrate
```

IBM Bob was used throughout V1 and V2 development for architecture decisions, code generation, debugging, and iterative feature work — functioning as a collaborative engineering partner across the entire build.

---

## Email Intelligence

For each email, LUMA evaluates several independent dimensions.

### Email Type
```
communication · notification · promotion · potential_spam
```

### Priority
```
urgent / action  →  action-needed
later            →  for-later
news             →  news-updates (FYI)
```

### Additional Signals

- Whether the email requires action
- A short reason explaining the classification
- A recommended next step
- Confidence score
- Internal urgency score used for sorting

Priority, email type, and required action are treated as separate concepts. A notification can be urgent. A communication can require no action. A promotion containing the word "URGENT" should not automatically become important.

---

## Sorting Logic

```
Priority Bucket  →  Urgency Score  →  Received Time
```

Within the same category, more time-sensitive emails surface first. When urgency is equal, the most recently received email is shown first.

---

## Gmail Integration

LUMA V2 integrates with Gmail using Google OAuth 2.0 with a `gmail.readonly` scope.

```
Gmail API  →  Message Normalizer  →  Clean Classification Input  →  LUMA Agent
```

- Retrieves up to **50 recent inbox messages**
- Falls back to a sample dataset if Gmail is unavailable or not connected
- Sanitizes email HTML before display to remove tracking pixels, unsafe links, and markup

---

## AI Reply Assistant

The user provides an intent and LUMA uses the original email context to generate a concise draft. The assistant is explicitly instructed not to invent dates, commitments, names, availability, or facts not present in the email.

The generated response is editable. LUMA does **not** automatically send email.

---

## Evaluation

Before connecting to real Gmail, LUMA was tested against a controlled dataset of **50 deliberately challenging email scenarios**.

### LUMA v7 Evaluation Results

| Metric | Result |
|---|---:|
| Overall Pass | **92%** |
| Priority Accuracy | **96%** |
| Email Type Accuracy | **96%** |
| Requires Action Accuracy | **100%** |
| Urgent Recall | **100%** |
| False Action Rate | **0%** |

The evaluation dataset remains as a regression benchmark while Gmail provides real-world testing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Animation | GSAP |
| AI | IBM watsonx Orchestrate |
| Dev Assistant | IBM Bob |
| Email | Gmail API |
| Auth | Google OAuth 2.0 |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── agent/          # classify, compose-reply, daily-brief
│   │   ├── auth/gmail/     # OAuth flow + token management
│   │   └── gmail/          # Gmail message fetching
│   ├── globals.css
│   └── page.tsx            # Dashboard
│
├── components/
│   ├── email/              # EmailPane, ReplyComposer, DoneCard
│   ├── layout/             # AppShell, Header, PreferencesModal
│   └── WelcomePage.tsx
│
├── hooks/
│   ├── useClassifiedEmails.ts
│   ├── useDoneEmails.ts
│   └── useFocusQueue.ts
│
├── services/
│   ├── agent/              # AgentService, MockAgent, WatsonxAgent
│   └── gmail/              # normalizer, classifyInputToTask
│
└── types/
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/MERCERNYC/luma-mvp-ibm-.git
cd luma-mvp-ibm-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local` in the project root:

**Mock provider (no external services needed):**
```env
AGENT_PROVIDER=mock
NEXT_PUBLIC_URL=http://localhost:3000
```

**With Gmail:**
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_URL=http://localhost:3000
```

**With IBM watsonx Orchestrate:**
```env
AGENT_PROVIDER=watsonx
WATSONX_API_KEY=your_key
ORCHESTRATE_INSTANCE_URL=your_url
ORCHESTRATE_AGENT_ID=your_agent_id
```

> **Never commit `.env.local` or real credentials.** The `.gitignore` already excludes `.env*`.

### 4. Start development

```bash
npm run dev
```

Open `http://localhost:3000`

---

## Google OAuth Setup

1. Enable the Gmail API in Google Cloud Console
2. Create an OAuth 2.0 Web Application credential
3. Add authorized origins and redirect URI:

```
Authorized origin:       http://localhost:3000
Authorized redirect URI: http://localhost:3000/api/auth/gmail/callback
```

For production, replace with your deployed HTTPS domain. LUMA requests only `gmail.readonly`.

---

## Security & Privacy

| Protection | Detail |
|---|---|
| OAuth scope | `gmail.readonly` only |
| CSRF protection | State parameter validation |
| Token storage | HttpOnly cookie |
| AI provider access | Server-side only |
| Secrets | Environment variables, never in client |
| Email display | Sanitized before render |
| Send / delete / archive | Not implemented — human action required |

**MVP note:** OAuth tokens are stored in an HttpOnly cookie. A production multi-user version should move credentials to encrypted server-side storage associated with an authenticated user session.

---

## Available Scripts

```bash
npm run dev       # start development server
npm run build     # production build
npm run start     # serve production build
npm run lint      # ESLint
```

---

## Product Evolution

### V1 — Intelligence
Controlled email dataset and classification logic. Goal: *Can LUMA correctly understand and prioritize difficult email scenarios?*

### V2 — Real Inbox *(current)*
Gmail + IBM watsonx Orchestrate + Focus Now + reply assistance. Goal: *Does LUMA reduce the mental work of deciding what deserves attention?*

### Future
Potential future capabilities include preference learning, persistent user profiles, calendar and task integration, approved Gmail actions, reminders, and scheduling. At that scale, LUMA may evolve from its current single-agent architecture into coordinated specialized agents.

---

## Design Philosophy

```
Traditional Inbox          LUMA
─────────────────          ────
Everything arrived    →    Everything arrived
User scans all        →    AI understands inbox
User decides          →    LUMA identifies what matters
User acts             →    User sees Focus Now queue
                      →    Human decides and acts
```

The product is designed around one question:

### What actually needs me today?

---

## Author

**Juliana Mercer Fogg** — Software Engineer · AI Product Builder

LUMA was developed as an Agentic AI project through the **IBM Learning Lab**, combining user-centered product design, AI agent architecture, Gmail integration, and IBM watsonx Orchestrate — with **IBM Bob** as the engineering co-pilot throughout.

---

## License

MIT License

Copyright (c) 2025 Juliana Mercer Fogg

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

<div align="center">

<img src="public/images/luma-logo.png" alt="Luma" width="140" />

**Less inbox. More life.**

</div>
