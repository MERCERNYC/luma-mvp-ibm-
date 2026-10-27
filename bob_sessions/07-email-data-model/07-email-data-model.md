# 07-email-data-model

---

**Status:** complete  **Date:** 2025-01-27

---

### 👤 User

07 — Email Data Model  
Create the TypeScript email data model for LUMA.  
Do NOT redesign or change the dashboard.  
Purpose: establish a clean shared data contract to later support the 50-email evaluation dataset, MockAgent, IBM watsonx, and Gmail integration.

Email types: `communication`, `notification`, `promotion`, `potential_spam`  
Priority values: `urgent`, `action`, `later`, `news`  
Each email must carry `requiresAction: boolean`  
`urgent` means delaying causes a real consequence — urgent language alone MUST NOT make an email urgent.

---

### 🤖 Assistant

> 🔧 **read_file** — src/types/dashboard.ts, src/types/ directory listing  
> Confirmed existing `Task` / `TaskPriority` UI types live in `dashboard.ts`; `src/types/` had no other files.

> 🔧 **write_file** — src/types/email.ts  
> New file. Source-agnostic canonical email model with `EmailType`, `EmailPriority`, `EmailSender`, `EmailAttachmentMeta`, `ClassifierResult`, `Email`.

> 🔧 **apply_diff** — src/types/email.ts  
> Added `EmailPriority` union with inline urgency rule.  
> Added `priority: EmailPriority` and `requiresAction: boolean` to `ClassifierResult`.  
> Tightened `reasoning` doc to require the classifier to name the specific consequence that justifies the priority.

> 🔧 **execute_command** — `npx tsc --noEmit` ✅ 0 errors, 0 warnings

---

### Result

#### What was built

| File | Action |
|---|---|
| `src/types/email.ts` | Created — canonical email data model |

#### Type inventory

| Export | Kind | Description |
|---|---|---|
| `EmailType` | union | `"communication" \| "notification" \| "promotion" \| "potential_spam"` |
| `EmailPriority` | union | `"urgent" \| "action" \| "later" \| "news"` |
| `EmailSender` | interface | `name` + `address` |
| `EmailAttachmentMeta` | interface | `filename`, `mimeType`, `sizeBytes` — descriptor only, no binary |
| `ClassifierResult` | interface | `emailType`, `priority`, `requiresAction`, `confidence`, `summary`, `reasoning` |
| `Email` | interface | Canonical raw email record — `classification` optional until classifier runs |

#### Design decisions

| Decision | Rationale |
|---|---|
| Separate file (`email.ts`) from `dashboard.ts` | Data model and UI display types are different concerns — prevents coupling |
| `EmailPriority` urgency rule encoded in comments | The definition of `urgent` lives at the type level — any classifier that imports the type reads the rule |
| `requiresAction: boolean` on `ClassifierResult` | Orthogonal to priority — an `action` email requires action; a `news` email never does; this makes that explicit |
| `reasoning: string` required (not optional) | Forces MockAgent and watsonx to name the specific consequence; makes evaluation auditable |
| `classification?: ClassifierResult` optional on `Email` | Emails enter the system unclassified; populated once a classifier processes them |
| `confidence: number` (0–1) | MockAgent returns `1` (deterministic); watsonx returns softmax probability — same field |
| `attachments: EmailAttachmentMeta[]` always present | Empty array, never `undefined` — avoids null-checks at every call site |
| `receivedAt` ISO-8601 string | Timezone-safe; works for static fixtures and Gmail API `internalDate` equally |
| `body` plain text only | HTML must be stripped before storage — keeps the classifier prompt clean |
| Dashboard untouched | `dashboard.ts`, `Task`, all UI components unchanged |

#### Architecture relationship

```
src/types/
├── dashboard.ts   UI display types (TaskPriority, Task, avatarColor …)
│                  ↑ Task.preview will derive from Email.classification.summary
└── email.ts       Data model (Email, ClassifierResult, EmailType, EmailPriority …)
                   ↑ consumed by: fixtures · MockAgent · watsonx · Gmail
```

#### Shared classifier contract

Both MockAgent and watsonx implement the same function signature:

```ts
import type { Email, ClassifierResult } from "@/types/email";

async function classify(email: Email): Promise<ClassifierResult> { ... }
```

Same input shape, same output shape — the rest of the app never knows which ran.

#### Build

✅ `tsc --noEmit` — compiled successfully, 0 errors, 0 warnings.
