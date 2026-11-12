<div align="center">

# LUMA

### Less inbox. More life.

**An AI-powered email attention assistant that helps people focus on what actually needs them.**

> The goal isn't to help people process more email.  
> It's to make email require less mental work.

Built with **Next.js · TypeScript · IBM watsonx Orchestrate · Gmail API**

</div>

---

## About LUMA

Email tools are very good at delivering and organizing messages.

But they still leave the hardest question to the user:

**What actually needs my attention right now?**

LUMA is an agentic AI email experience designed around that question.

Instead of presenting another crowded inbox, LUMA reads and understands incoming email, evaluates whether it requires action, prioritizes what matters, recommends a next step, and presents a small **Focus Now** queue.

The goal is not inbox zero.

The goal is **less cognitive load**.

---

## The Problem

A traditional inbox asks the user to repeatedly decide:

- Is this important?
- Do I need to respond?
- Is there a deadline?
- Can this wait?
- Is this just information?
- Is this marketing pretending to be urgent?

Those decisions create mental work before the user has even started acting on the email.

LUMA moves that decision-making support upstream.

---

## The Solution

LUMA turns a large inbox into a smaller attention system.

```text
Gmail
  ↓
Normalize Email
  ↓
LUMA Agent
  ↓
UNDERSTAND
What is this?
  ↓
PRIORITIZE
Does it need attention?
  ↓
RECOMMEND
What should I do?
  ↓
ASSIST
Help me act
  ↓
Focus Now
  ↓
Human Decision
```

LUMA organizes email into three primary categories:

| Category | Meaning |
|---|---|
| **Action Needed** | Requires attention or action |
| **For Later** | Relevant, but does not need attention now |
| **FYI** | Informational, newsletter, update, or low-attention content |

The most important actionable emails are surfaced separately in **Focus Now**.

---

## Focus Now

Focus Now is the core LUMA experience.

Rather than showing the entire inbox at once, LUMA creates a finite queue of **up to five actionable emails**.

```text
5 → 4 → 3 → 2 → 1 → 0
```

As the user completes emails, the queue gets smaller.

LUMA does **not** fill empty Focus Now positions with newsletters, promotions, or lower-priority emails just to keep the list full.

When the queue reaches zero:

> ✨ You're caught up  
> Nothing needs your attention right now.

The user can then choose **Prioritize Again** to generate another attention window.

---

## One Agent by Design

LUMA intentionally uses **one agent** for the current product scope.

This is a deliberate architecture decision.

The problem is focused: understand email and help the user decide what deserves attention.

The LUMA Agent performs four connected capabilities:

1. **Understand** — determine what the email is about
2. **Prioritize** — evaluate importance, action, and urgency
3. **Recommend** — explain why it matters and suggest a next step
4. **Assist** — help the user act, including drafting a reply

A multi-agent architecture would currently introduce additional orchestration, handoffs, latency, and failure points without providing enough additional user value.

As LUMA expands into separate domains such as **calendar, tasks, scheduling, and other productivity systems**, specialized agents may become appropriate.

---

## Human in the Loop

LUMA is designed to assist decision-making rather than silently take consequential actions.

**AI prepares. Human approves.**

LUMA can:

- understand an email
- identify whether action is required
- evaluate urgency
- prioritize messages
- explain why an email matters
- recommend a next step
- draft a reply

The user remains in control of the final action.

---

## AI Architecture

LUMA uses a provider-independent agent service.

```text
Next.js Application
        ↓
Server API Routes
        ↓
AgentService
        ↓
 ┌───────────────┐
 │               │
MockAgent    WatsonxAgent
 │               │
Local        IBM watsonx
Testing      Orchestrate
 └───────┬───────┘
         ↓
Structured Result
         ↓
LUMA Dashboard
```

The application communicates with the AI layer through a shared `IAgent` contract.

This means the interface does not need to know whether the active provider is the local MockAgent or IBM watsonx Orchestrate.

The provider is selected server-side using:

```env
AGENT_PROVIDER=mock
```

or:

```env
AGENT_PROVIDER=watsonx
```

This keeps provider credentials and AI implementation details out of the browser.

---

## Email Intelligence

For each email, LUMA evaluates several independent dimensions.

### Email Type

```text
communication
notification
promotion
potential_spam
```

### Priority

The watsonx agent returns:

```text
urgent
action
later
news
```

These are mapped internally to the dashboard categories:

```text
urgent/action → action-needed
later         → for-later
news          → news-updates
```

### Additional Signals

LUMA also evaluates:

- whether the email requires action
- a short reason explaining the classification
- a recommended next step
- confidence
- an internal urgency score used for sorting

Priority, email type, and required action are treated as separate concepts.

A notification can be urgent.

A communication can require no action.

A promotion containing the word **URGENT** should not automatically become important.

---

## Sorting Logic

After classification, LUMA sorts messages using:

```text
Priority Bucket
      ↓
Urgency Score
      ↓
Received Time
```

Within the same category, more time-sensitive emails surface first.

When urgency is equal, the most recently received email is shown first.

---

## Gmail Integration

LUMA V2 integrates with Gmail using Google OAuth 2.0 and the Gmail API.

The current implementation requests:

```text
gmail.readonly
```

This gives LUMA read-only access to authorized Gmail messages.

The application currently retrieves up to **50 recent inbox messages**.

```text
Gmail API
   ↓
Message Normalizer
   ↓
Clean Classification Input
   ↓
LUMA Agent
```

If Gmail is unavailable or not connected, LUMA can fall back to its evaluation dataset.

---

## Email Normalization

Real-world email is messy.

Messages can contain:

- HTML
- tracking links
- newsletters
- forwarded content
- encoded characters
- signatures
- buttons
- formatting
- large amounts of irrelevant markup

LUMA includes a Gmail normalization layer before messages reach the AI.

The classifier receives clean text while the reading experience can preserve a sanitized display version.

This separation helps keep presentation markup from interfering with AI classification.

---

## AI Reply Assistant

LUMA also includes AI-assisted reply drafting.

The user provides an intent, and LUMA uses the original email context to generate a concise draft.

The reply assistant is explicitly instructed not to invent:

- dates
- commitments
- names
- availability
- facts not contained in the email or user instruction

The generated response remains editable.

LUMA does **not** automatically send the email.

---

## Evaluation

Before connecting LUMA to real Gmail, its email intelligence was tested against a controlled evaluation dataset.

The repository includes **50 deliberately challenging email scenarios** covering cases such as:

- genuine deadlines
- fake urgency
- promotions
- school communication
- financial alerts
- notifications
- newsletters
- spam-like messages
- emails requiring action
- informational emails

This allowed the prioritization behavior to be evaluated before introducing the variability of a real inbox.

### LUMA v7 Evaluation

| Metric | Result |
|---|---:|
| Overall Pass | **92%** |
| Priority Accuracy | **96%** |
| Email Type Accuracy | **96%** |
| Requires Action Accuracy | **100%** |
| Urgent Recall | **100%** |
| False Action Rate | **0%** |

The evaluation dataset remains part of the project as a regression benchmark while Gmail provides real-world testing.

---

## Product Experience

LUMA was designed around reducing cognitive load rather than reproducing a traditional inbox.

Key interaction principles include:

- a maximum of five Focus Now items
- strong visual hierarchy
- short explanations
- clear next actions
- finite progress
- quiet secondary categories
- minimal visual competition
- human confirmation
- accessible interaction states

The interface uses a bright, glass-based visual system with navy typography, soft blue atmospheric backgrounds, generous whitespace, and restrained semantic color.

The design system is documented in:

```text
docs/design-system.md
```

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
| Email | Gmail API |
| Authentication | Google OAuth 2.0 |
| Deployment | Vercel |

---

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── agent/
│   │   ├── auth/
│   │   └── gmail/
│   ├── globals.css
│   └── page.tsx
│
├── components/
│   ├── email/
│   ├── layout/
│   └── ui/
│
├── data/
│   ├── emailDataset.ts
│   └── emailEvaluationDataset.ts
│
├── hooks/
│   ├── useClassifiedEmails.ts
│   ├── useDoneEmails.ts
│   ├── useFeedback.ts
│   └── useFocusQueue.ts
│
├── services/
│   ├── agent/
│   │   ├── AgentService.ts
│   │   ├── MockAgent.ts
│   │   ├── WatsonxAgent.ts
│   │   └── types.ts
│   │
│   └── gmail/
│       ├── classifyInputToTask.ts
│       └── normalizer.ts
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

Create:

```text
.env.local
```

For the mock provider:

```env
AGENT_PROVIDER=mock
NEXT_PUBLIC_URL=http://localhost:3000
```

For Gmail:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_URL=http://localhost:3000
```

For IBM watsonx Orchestrate:

```env
AGENT_PROVIDER=watsonx
WATSONX_API_KEY=
ORCHESTRATE_INSTANCE_URL=
ORCHESTRATE_AGENT_ID=
```

**Never commit real credentials or `.env.local` to GitHub.**

The repository's `.gitignore` already excludes `.env*`.

### 4. Start development

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If you intentionally run Next.js on another port, make sure `NEXT_PUBLIC_URL` and your Google OAuth redirect URI use that same port.

---

## Google OAuth Setup

Enable the Gmail API in Google Cloud and create an OAuth 2.0 Web Application credential.

For local development, authorize:

```text
http://localhost:3000
```

and the callback:

```text
http://localhost:3000/api/auth/gmail/callback
```

For production, use the deployed HTTPS domain for both the application origin and callback.

LUMA requests only:

```text
https://www.googleapis.com/auth/gmail.readonly
```

---

## Security & Privacy

LUMA follows a minimal-permission approach for its current MVP.

Current protections include:

- Gmail read-only OAuth scope
- OAuth CSRF state validation
- HttpOnly token cookies
- server-side AI provider access
- environment-based secrets
- sanitized email display content
- no automatic Gmail send/delete/archive behavior
- human review of generated replies

### MVP limitation

The current Gmail token implementation stores OAuth tokens in an **HttpOnly cookie**.

This is suitable for the current MVP/testing architecture, but a production multi-user version should move OAuth credentials to encrypted server-side storage associated with an authenticated user.

---

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

The repository also contains an evaluation script for testing the mock email intelligence against the benchmark dataset:

```text
scripts/evaluate-mock-agent.ts
```

---

## Product Evolution

### V1 — Intelligence

Controlled email dataset and classification logic.

Goal:

**Can LUMA correctly understand and prioritize difficult email scenarios?**

### V2 — Real Inbox

Gmail + IBM watsonx Orchestrate + Focus Now + reply assistance.

Goal:

**Does LUMA reduce the mental work of deciding what deserves attention?**

### Future

Potential future capabilities include:

- preference learning
- corrections that influence future prioritization
- persistent user profiles
- calendar integration
- task integration
- approved Gmail actions
- reminders and scheduling
- personalized attention management

At that point, LUMA may evolve from its current single-agent architecture into specialized agents coordinated across separate domains.

---

## Design Philosophy

LUMA is not trying to build another inbox.

It is exploring a different relationship between people and email:

```text
Traditional Inbox

Everything arrived
      ↓
User scans everything
      ↓
User decides what matters
      ↓
User acts
```

```text
LUMA

Everything arrived
      ↓
AI understands the inbox
      ↓
LUMA identifies what deserves attention
      ↓
User sees a small Focus Now queue
      ↓
Human decides and acts
```

The product is designed around one question:

# What actually needs me today?

---

## Author

**Juliana Mercer Fogg**

Software Engineer · AI Product Builder

LUMA was developed as an Agentic AI project through the **IBM Learning Lab**, combining user-centered product design, AI agent architecture, Gmail integration, and IBM watsonx Orchestrate.

---

<div align="center">

### LUMA

**Less inbox. More life.**

</div>