"use client";

/* ═══════════════════════════════════════════════════════════════
   useClassifiedEmails
   ───────────────────────────────────────────────────────────────
   Drives the classification pipeline by calling the server-side
   API routes — never imports from services/agent directly.

   Data flow
   ─────────
   1. POST /api/agent/classify   { emails: ClassifyInput[] }
        → ClassifyResult[] (priority per email)
   2. POST /api/agent/daily-brief { emails[], userName }
        → { text: string }

   Returns
   ───────
   status     "loading" | "ready" | "error"
   tasks      Task[]  — agent-assigned priority; empty while loading
   briefText  string  — agent-generated brief; empty while loading

   Swap story
   ──────────
   Switching providers (Mock → watsonx) requires no changes here.
   Set AGENT_PROVIDER=watsonx in .env.local — the routes and
   AgentService handle the rest.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState }        from "react";
import { toClassifyInput }            from "@/types/email";
import { GREETING_NAME }              from "@/data/dashboard";
import { EVAL_EMAILS }                from "@/data/emailDataset";
import type { Task, TaskPriority }    from "@/types/dashboard";
import type { ClassifyResult, DailyBriefResult } from "@/services/agent/types";

// The live inbox — 50 realistic emails covering all three priority buckets.
const INBOX = EVAL_EMAILS;

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
      // Same bucket — urgencyScore descending
      const urgencyDiff = b.result.urgencyScore - a.result.urgencyScore;
      if (urgencyDiff !== 0) return urgencyDiff;
      // Same urgency — most recently received first
      return b.task.receivedAt - a.task.receivedAt;
    })
    .map(({ task }) => task);
}

export type ClassificationStatus = "loading" | "ready" | "error";

export interface UseClassifiedEmailsResult {
  status:    ClassificationStatus;
  tasks:     Task[];
  briefText: string;
}

export function useClassifiedEmails(): UseClassifiedEmailsResult {
  const [status,    setStatus]    = useState<ClassificationStatus>("loading");
  const [tasks,     setTasks]     = useState<Task[]>([]);
  const [briefText, setBriefText] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // 1. Classify all emails via the API route (server runs the agent).
        const classifyResponse = await fetch("/api/agent/classify", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emails: INBOX.map((task) =>
              toClassifyInput({
                id:          task.id,
                sender:      task.sender,
                senderEmail: task.senderEmail,
                subject:     task.subject,
                preview:     task.preview,
                body:        task.body,
                time:        task.time,
                receivedAt:  task.receivedAt,
                attachment:  task.attachment,
              }),
            ),
          }),
        });

        if (!classifyResponse.ok) throw new Error("classify request failed");

        const { results }: { results: ClassifyResult[] } =
          await classifyResponse.json();

        if (cancelled) return;

        // 2. Merge agent priorities back onto Task objects.
        const mergedTasks: Task[] = INBOX.map((task, i) => ({
          ...task,
          priority: results[i].priority,
        }));

        // 3. Sort: bucket rank → urgencyScore desc → receivedAt desc.
        //    Overdue/expired items (urgencyScore 0.4) sink below live deadlines.
        const classifiedTasks = sortByPriority(mergedTasks, results);

        // 4. Generate the daily brief via the API route.
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
        setBriefText(text);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    run();
    return () => { cancelled = true; };
  }, []); // runs once on mount

  return { status, tasks, briefText };
}
