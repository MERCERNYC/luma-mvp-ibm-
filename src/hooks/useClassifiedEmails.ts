"use client";

/* ═══════════════════════════════════════════════════════════════
   useClassifiedEmails
   ───────────────────────────────────────────────────────────────
   Drives the classification pipeline by calling the server-side
   API routes — never imports from services/agent directly.

   Email source (V2)
   ─────────────────
   1. Try GET /api/gmail/messages (requires gmail_tokens cookie).
      → 200: use real inbox emails.
      → 401: not connected — fall back to the evaluation dataset.
      → other error: fall back to the evaluation dataset.
   2. If Gmail is unavailable for any reason, the 50-email
      evaluation dataset is used silently.  No error is shown.

   Data flow
   ─────────
   source emails (Gmail or dataset)
     → POST /api/agent/classify   { emails: ClassifyInput[] }
          → ClassifyResult[] (priority per email)
     → POST /api/agent/daily-brief { emails[], userName }
          → { text: string }

   Returns
   ───────
   status      "loading" | "ready" | "error"
   tasks       Task[]  — agent-assigned priority; empty while loading
   urgencies   UrgencyMap
   briefText   string
   emailSource "gmail" | "dataset"  — which source was used

   Swap story
   ──────────
   Switching providers (Mock → watsonx) requires no changes here.
   Set AGENT_PROVIDER=watsonx in .env.local — the routes and
   AgentService handle the rest.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState }        from "react";
import { toClassifyInput }            from "@/types/email";
import { GREETING_NAME }              from "@/data/dashboard";
import { WATSON_EVAL_EMAILS, evalEmailsToTasks } from "@/data/emailEvaluationDataset";
import { classifyInputToTask }        from "@/services/gmail/classifyInputToTask";
import type { Task, TaskPriority }    from "@/types/dashboard";
import type { ClassifyInput, ClassifyResult, DailyBriefResult } from "@/services/agent/types";

// ─── Sort helpers ────────────────────────────────────────────────

const PRIORITY_RANK: Record<TaskPriority, number> = {
  "action-needed": 0,
  "for-later":     1,
  "news-updates":  2,
};

/** Number of top-priority emails shown on first load. */
export const FOCUS_LIMIT = 5;

/**
 * Sort tasks by:
 *   1. Priority bucket  (action-needed → for-later → news-updates)
 *   2. urgencyScore desc within each bucket (live deadlines surface first;
 *      overdue/expired items with score 0.4 sink to the bottom)
 *   3. receivedAt desc as final tiebreaker (most recently received first)
 */
function sortByPriority(
  tasks:   Task[],
  results: ClassifyResult[],
): Task[] {
  return tasks
    .map((task, i) => ({ task, result: results[i] }))
    .sort((a, b) => {
      const rankDiff =
        PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority];
      if (rankDiff !== 0) return rankDiff;
      const urgencyDiff = b.result.urgencyScore - a.result.urgencyScore;
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.task.receivedAt - a.task.receivedAt;
    })
    .map(({ task }) => task);
}

// ─── Types ───────────────────────────────────────────────────────

export type ClassificationStatus = "loading" | "ready" | "error";
export type EmailSource          = "gmail" | "dataset";

/** urgencyScore keyed by task id — used by the page to drive pill labels. */
export type UrgencyMap = Record<string, number>;

export interface UseClassifiedEmailsResult {
  status:      ClassificationStatus;
  tasks:       Task[];
  urgencies:   UrgencyMap;
  briefText:   string;
  emailSource: EmailSource;
}

// ─── Gmail fetch helper ──────────────────────────────────────────

interface GmailMessagesResponse {
  emails:      ClassifyInput[];
  receivedAts: number[];
}

/**
 * Try to fetch inbox emails via the Gmail route.
 * Returns null if the user is not authenticated (401) or if the
 * fetch fails for any reason — caller falls back to the dataset.
 */
async function fetchGmailEmails(): Promise<{
  inputs: ClassifyInput[];
  inbox:  Task[];
} | null> {
  try {
    const res = await fetch("/api/gmail/messages?maxResults=50");

    // 401 = not connected — silent fallback, not an error
    if (res.status === 401) return null;
    if (!res.ok)            return null;

    const data = await res.json() as GmailMessagesResponse;

    if (!Array.isArray(data.emails) || data.emails.length === 0) return null;

    const receivedAts = Array.isArray(data.receivedAts)
      ? data.receivedAts
      : data.emails.map(() => Date.now());

    const inbox = data.emails.map((input, i) =>
      classifyInputToTask(input, i, receivedAts[i] ?? Date.now()),
    );

    return { inputs: data.emails, inbox };
  } catch {
    return null;
  }
}

// ─── Hook ────────────────────────────────────────────────────────

// How many emails to classify in the first (fast) batch.
// These cover Focus Now (max 5) plus enough for the category cards.
// The rest are classified in a background second pass.
const FIRST_BATCH = 20;

export function useClassifiedEmails(): UseClassifiedEmailsResult {
  const [status,      setStatus]      = useState<ClassificationStatus>("loading");
  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [urgencies,   setUrgencies]   = useState<UrgencyMap>({});
  const [briefText,   setBriefText]   = useState("");
  const [emailSource, setEmailSource] = useState<EmailSource>("dataset");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // ── 1. Resolve email source ───────────────────────────────
        let allInputs: ClassifyInput[];
        let inbox:     Task[];
        let source:    EmailSource;

        const gmail = await fetchGmailEmails();

        if (gmail) {
          allInputs = gmail.inputs;
          inbox     = gmail.inbox;
          source    = "gmail";
        } else {
          allInputs = WATSON_EVAL_EMAILS.map(toClassifyInput);
          inbox     = evalEmailsToTasks(WATSON_EVAL_EMAILS);
          source    = "dataset";
        }

        // ── 2a. Classify first FIRST_BATCH emails ─────────────────
        // This renders Focus Now and category cards fast.
        // The remaining emails are classified in the background (step 4).
        const firstInputs = allInputs.slice(0, FIRST_BATCH);

        const firstResponse = await fetch("/api/agent/classify", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ emails: firstInputs }),
        });

        if (!firstResponse.ok) throw new Error("classify request failed");

        const { results: firstResults }: { results: ClassifyResult[] } =
          await firstResponse.json();

        if (cancelled) return;

        // ── 2b. Merge + sort the first batch ──────────────────────
        const firstMerged: Task[] = inbox.slice(0, FIRST_BATCH).map((task, i) => ({
          ...task,
          priority:          firstResults[i].priority,
          reason:            firstResults[i].reason,
          recommendedAction: firstResults[i].recommendedAction,
          urgencyScore:      firstResults[i].urgencyScore,
        }));

        // Remaining emails get default priority until background pass finishes
        const restInbox = inbox.slice(FIRST_BATCH);
        const restPlaceholders: Task[] = restInbox.map((task) => ({
          ...task,
          priority:    "news-updates" as const,
          urgencyScore: 0.3,
        }));

        const allResults = [...firstResults];
        const restPlaceholderResults: ClassifyResult[] = restInbox.map(() => ({
          priority:          "news-updates" as const,
          emailType:         "notification" as const,
          requiresAction:    false,
          reason:            "",
          recommendedAction: null,
          confidence:        0,
          urgencyScore:      0.3,
          reasoning:         "",
        }));
        allResults.push(...restPlaceholderResults);

        const allMerged = [...firstMerged, ...restPlaceholders];
        const sortedTasks = sortByPriority(allMerged, allResults);

        const urgencyMap: UrgencyMap = {};
        allMerged.forEach((task, i) => {
          urgencyMap[task.id] = allResults[i].urgencyScore;
        });

        // ── 2c. Show the dashboard now — don't wait for brief ─────
        setTasks(sortedTasks);
        setUrgencies(urgencyMap);
        setEmailSource(source);
        setStatus("ready");

        // ── 3. Daily brief — fires after dashboard is visible ─────
        // No await blocking the user; updates briefText when done.
        fetch("/api/agent/daily-brief", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: GREETING_NAME,
            emails: sortedTasks.slice(0, 10).map((t) => ({
              subject:  t.subject,
              priority: t.priority,
              sender:   t.sender,
            })),
          }),
        })
          .then((r) => r.ok ? r.json() : null)
          .then((data: DailyBriefResult | null) => {
            if (!cancelled && data?.text) setBriefText(data.text);
          })
          .catch(() => { /* brief is non-critical — silent fail */ });

        // ── 4. Background: classify remaining emails ──────────────
        if (allInputs.length > FIRST_BATCH) {
          const restInputs = allInputs.slice(FIRST_BATCH);

          fetch("/api/agent/classify", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ emails: restInputs }),
          })
            .then((r) => r.ok ? r.json() : null)
            .then((data: { results: ClassifyResult[] } | null) => {
              if (cancelled || !data?.results) return;

              const restMerged: Task[] = restInbox.map((task, i) => ({
                ...task,
                priority:          data.results[i].priority,
                reason:            data.results[i].reason,
                recommendedAction: data.results[i].recommendedAction,
                urgencyScore:      data.results[i].urgencyScore,
              }));

              const fullResults = [...firstResults, ...data.results];
              const fullMerged  = [...firstMerged, ...restMerged];
              const fullSorted  = sortByPriority(fullMerged, fullResults);

              const fullUrgencies: UrgencyMap = {};
              fullMerged.forEach((task, i) => {
                fullUrgencies[task.id] = fullResults[i].urgencyScore;
              });

              setTasks(fullSorted);
              setUrgencies(fullUrgencies);
            })
            .catch(() => { /* background pass failed — first batch still showing */ });
        }

      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    run();
    return () => { cancelled = true; };
  }, []); // runs once on mount

  return { status, tasks, urgencies, briefText, emailSource };
}
