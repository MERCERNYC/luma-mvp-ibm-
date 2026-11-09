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
        let classifyInputs: ClassifyInput[];
        let inbox:          Task[];
        let source:         EmailSource;

        const gmail = await fetchGmailEmails();

        if (gmail) {
          classifyInputs = gmail.inputs;
          inbox          = gmail.inbox;
          source         = "gmail";
        } else {
          // Fall back to the 50-email evaluation dataset
          classifyInputs = WATSON_EVAL_EMAILS.map(toClassifyInput);
          inbox          = evalEmailsToTasks(WATSON_EVAL_EMAILS);
          source         = "dataset";
        }

        // ── 2. Classify all emails via the API route ──────────────
        const classifyResponse = await fetch("/api/agent/classify", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ emails: classifyInputs }),
        });

        if (!classifyResponse.ok) throw new Error("classify request failed");

        const { results }: { results: ClassifyResult[] } =
          await classifyResponse.json();

        if (cancelled) return;

        // ── 3. Merge agent results back onto Task objects ─────────
        const mergedTasks: Task[] = inbox.map((task, i) => ({
          ...task,
          priority:          results[i].priority,
          reason:            results[i].reason,
          recommendedAction: results[i].recommendedAction,
          urgencyScore:      results[i].urgencyScore,
        }));

        // ── 4. Sort: bucket → urgencyScore desc → receivedAt desc ─
        const classifiedTasks = sortByPriority(mergedTasks, results);

        // Build urgencyScore lookup keyed by task id
        const urgencyMap: UrgencyMap = {};
        inbox.forEach((task, i) => {
          urgencyMap[task.id] = results[i].urgencyScore;
        });

        // ── 5. Generate the daily brief ───────────────────────────
        const briefResponse = await fetch("/api/agent/daily-brief", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: GREETING_NAME,
            emails: classifiedTasks.map((t) => ({
              subject:  t.subject,
              priority: t.priority,
              sender:   t.sender,
            })),
          }),
        });

        if (!briefResponse.ok) throw new Error("daily-brief request failed");

        const { text }: DailyBriefResult = await briefResponse.json();

        if (cancelled) return;

        setTasks(classifiedTasks);
        setUrgencies(urgencyMap);
        setBriefText(text);
        setEmailSource(source);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    run();
    return () => { cancelled = true; };
  }, []); // runs once on mount

  return { status, tasks, urgencies, briefText, emailSource };
}
