# LUMA MVP — Project Architecture

## Overview

LUMA is an AI-powered email assistant built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4.

---

## Folder Structure

```
src/
├── app/                  # Next.js App Router — pages, layouts, API routes
├── components/
│   ├── layout/           # Shell, header, sidebar, nav components
│   ├── email/            # Email-specific UI components (list, thread, composer)
│   └── ui/               # Reusable primitive components (button, input, modal…)
├── data/                 # Static data, mock data, fixtures
├── lib/                  # Utility functions, helpers, client initializers
├── types/                # Shared TypeScript types and interfaces
├── services/             # External API calls (email providers, IBM Watson, etc.)
└── agent/                # AI agent logic, prompts, tool definitions

docs/
└── architecture.md       # This file
```

---

## Key Conventions

- **App Router only** — no `pages/` directory.
- **Server Components by default** — add `"use client"` only when needed.
- **Co-location** — keep component-specific types close to the component; only promote to `src/types/` when shared across features.
- **Services layer** — all external I/O goes through `src/services/`; components never call APIs directly.
- **Agent layer** — all AI orchestration, prompt templates, and tool definitions live in `src/agent/`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Runtime | React 19 |
| AI | IBM watsonx / Agent |

---

## Status

🚧 MVP — in active development.
