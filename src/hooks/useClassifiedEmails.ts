"use client";

/* ═══════════════════════════════════════════════════════════════
   useClassifiedEmails
   ───────────────────────────────────────────────────────────────
   Runs agent.classifyEmail() on every email in the inbox at mount.
   Also runs agent.generateDailyBrief() once all classifications
   are known.

   Returns
   ───────
   status     "loading" | "ready" | "error"
   tasks      Task[]  — same shape EmailRow/EmailPane already expect,
              with `priority` set by the agent (not the hard-coded
              fixture value).  Empty while loading.
   briefText  string  — agent-generated daily brief sentence.
              Empty string while loading.

   Swap story
   ──────────
   The `agent` singleton is imported from @/services/agent.
   When WatsonxAgent replaces MockAgent there, this hook changes
   nothing — it will automatically use the real agent.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { agent }               from "@/services/agent";
import { toClassifyInput }     from "@/types/email";
import { DEMO_TASKS, GREETING_NAME } from "@/data/dashboard";
import type { Task }           from "@/types/dashboard";

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
        // 1. Classify every email in parallel.
        const results = await Promise.all(
          DEMO_TASKS.map((task) =>
            agent.classifyEmail(
              toClassifyInput({
                id:          task.id,
                sender:      task.sender,
                senderEmail: task.senderEmail,
                subject:     task.subject,
                preview:     task.preview,
                body:        task.body,
                time:        task.time,
                attachment:  task.attachment,
              }),
            ).then((r) => ({ task, priority: r.priority })),
          ),
        );

        if (cancelled) return;

        // 2. Merge agent priority back onto the Task objects.
        const classifiedTasks: Task[] = results.map(({ task, priority }) => ({
          ...task,
          priority,
        }));

        // 3. Generate the daily brief from the now-classified list.
        const { text } = await agent.generateDailyBrief({
          userName: GREETING_NAME,
          emails: classifiedTasks.map((t) => ({
            subject:  t.subject,
            priority: t.priority,
            sender:   t.sender,
          })),
        });

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
