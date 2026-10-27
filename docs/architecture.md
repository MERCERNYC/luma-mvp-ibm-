# LUMA MVP — Architecture & Separation of Concerns

## Overview

LUMA is an AI-powered email assistant built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4.

The architecture enforces three hard boundaries:

1. **UI must not contain AI logic.**
2. **Email data must remain separate from UI components.**
3. **Agent/provider code must remain separate from the dashboard.**

---

## Folder Structure

```
src/
├── app/                        # Next.js App Router — routes, pages, API handlers
├── components/
│   ├── layout/                 # Dashboard shell, header, sidebar, navigation
│   ├── email/                  # Email-specific visual components
│   └── ui/                     # Reusable primitive components
├── data/                       # Test email datasets and fixtures
├── lib/                        # Utilities and deterministic application logic
├── types/                      # Shared TypeScript types and interfaces
└── services/
    └── agent/                  # Provider-independent agent layer

docs/
└── architecture.md             # This file
```

---

## What Belongs Where

### `src/app/`
Next.js App Router pages, layouts, loading states, and API route handlers (`route.ts`).
No AI logic. No raw data. Renders components; calls services through API routes only.

### `src/components/layout/`
Dashboard shell components: top navigation, sidebar, main content wrapper.
Pure presentational — no data fetching, no AI calls.

### `src/components/email/`
Visual components for displaying email content: email list rows, thread view, message composer shell.
Receives data as props. Never imports from `services/` or `agent/`.

### `src/components/ui/`
Reusable, application-agnostic primitives: Button, Input, Badge, Modal, Spinner, etc.
No business logic. No email-specific or AI-specific concepts.

### `src/data/`
Test email datasets (JSON or TypeScript fixtures).
Plain data files only — no component imports, no service calls.
This is where the 50-email dataset will live when built.

### `src/lib/`
Deterministic utility functions and application logic that have no side effects and make no external calls.
Examples: date formatters, string helpers, email parsing utilities, sorting/filtering functions.

### `src/types/`
Shared TypeScript interfaces and type definitions used across more than one folder.
Examples: `Email`, `Thread`, `AgentResponse`, `User`.
Types that are only used in one place stay co-located with that file.

### `src/services/agent/`
The provider-independent agent layer. Defines the contract for what an agent can do (classify, summarize, draft, prioritize) without binding to any specific provider.
- **Now:** will wrap MockAgent when it is built.
- **Later:** will wrap IBM watsonx without any changes to the dashboard or components.

The agent layer is the only code that is allowed to change when switching AI providers.
Components and pages never import from this folder directly — they go through API routes in `src/app/`.

---

## Separation of Concerns — Rules

| Rule | What it prevents |
|---|---|
| UI must not contain AI logic | Avoids entangling re-renders with async AI calls; keeps components testable |
| Email data must stay out of UI components | Prevents hardcoded fixtures leaking into production components |
| Agent/provider code stays out of the dashboard | Allows swapping MockAgent → IBM watsonx with zero UI changes |

---

## Data Flow

```
Page (app/)
  └── calls → API Route (app/api/)
                └── calls → services/agent/
                              └── (later) IBM watsonx
  └── renders → components/layout/
                  └── renders → components/email/   ← props from page
                                  └── uses → components/ui/
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Runtime | React 19 |
| AI (current) | MockAgent (not yet built) |
| AI (target) | IBM watsonx |

---

## Status

🚧 MVP — architecture established, implementation in progress.

### Not yet built (intentionally)
- MockAgent
- 50-email test dataset
- IBM watsonx connection
- Gmail connection
- Docker setup
