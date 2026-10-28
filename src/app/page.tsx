"use client";

import { useState }        from "react";
import { Sparkles }        from "lucide-react";
import { AppShell }        from "@/components/layout/AppShell";
import { EmailRow }        from "@/components/email/EmailRow";
import { EmailPane }       from "@/components/email/EmailPane";
import { DailyBrief }      from "@/components/email/DailyBrief";
import { GREETING_NAME }   from "@/data/dashboard";
import { useClassifiedEmails, FOCUS_LIMIT } from "@/hooks/useClassifiedEmails";
import type { Task }       from "@/types/dashboard";

/* ─────────────────────────────────────────────
   Dashboard — LUMA home
   "use client" — selected email + classification
   state lives here.

   Data flow
   ─────────
   useClassifiedEmails()
     → calls agent.classifyEmail() for each DEMO_TASKS item
     → calls agent.generateDailyBrief() once classification done
     → returns { status, tasks, briefText }

   While status === "loading":
     — skeleton rows replace the email list
     — brief shows a placeholder string

   When status === "ready":
     — tasks[] has agent-assigned priorities
     — briefText is the agent-generated sentence
   ───────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 border-b border-[var(--luma-glass-border)] last:border-b-0 animate-pulse"
      aria-hidden="true"
    >
      <div className="shrink-0 w-10 h-10 rounded-full bg-[rgba(37,99,235,0.08)]" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-32 rounded bg-[rgba(37,99,235,0.08)]" />
        <div className="h-3 w-48 rounded bg-[rgba(37,99,235,0.06)]" />
        <div className="h-2.5 w-64 rounded bg-[rgba(37,99,235,0.05)]" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { status, tasks, briefText } = useClassifiedEmails();

  const [showAll,  setShowAll]  = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);

  const actionCount  = tasks.filter((t) => t.priority === "action-needed").length;
  const visibleTasks = showAll ? tasks : tasks.slice(0, FOCUS_LIMIT);
  const defaultTask  = visibleTasks[0];
  const activeTask   = selected ?? defaultTask ?? null;

  return (
    <AppShell
      emailPane={
        activeTask
          ? <EmailPane task={activeTask} onClose={() => setSelected(null)} />
          : null
      }
    >
      {/* Greeting */}
      <div className="mb-8">
        <h1
          className="text-[var(--text-3xl)] font-bold tracking-[var(--tracking-tight)]"
          style={{ color: "var(--luma-text-primary)" }}
        >
          Good morning, {GREETING_NAME}! ☀️
        </h1>
        <p
          className="mt-2 text-[var(--text-lg)]"
          style={{ color: "var(--luma-text-secondary)" }}
        >
          {status === "loading"
            ? "Checking your inbox…"
            : status === "error"
              ? "Couldn't load emails right now."
              : `You have ${actionCount} important email${actionCount !== 1 ? "s" : ""} today.`}
        </p>
      </div>

      {/* Daily brief */}
      <DailyBrief
        text={
          status === "loading"
            ? "Summarising your inbox…"
            : status === "error"
              ? "Unable to generate a summary."
              : briefText
        }
      />

      {/* Focus list */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} strokeWidth={1.5} style={{ color: "var(--luma-blue)" }} aria-hidden="true" />
            <h2
              className="text-[var(--text-base)] font-bold"
              style={{ color: "var(--luma-text-primary)" }}
            >
              {status === "loading"
                ? "Loading emails…"
                : showAll
                  ? `All ${tasks.length} Emails`
                  : `Top ${Math.min(FOCUS_LIMIT, tasks.length)} of ${tasks.length}`}
            </h2>
          </div>
          {status === "ready" && tasks.length > FOCUS_LIMIT && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-[var(--text-sm)]"
              style={{ color: "var(--luma-blue)" }}
            >
              {showAll ? "Show less" : `Show all ${tasks.length}`}
            </button>
          )}
        </div>

        <div
          className="glass rounded-[var(--radius-2xl)] overflow-hidden"
          style={{ border: "1px solid var(--luma-glass-border)" }}
          role="list"
          aria-label="Inbox emails"
          aria-busy={status === "loading"}
        >
          {status === "loading" ? (
            /* Skeleton — 3 placeholder rows while agent classifies */
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : status === "error" ? (
            <p
              className="px-5 py-6 text-[var(--text-sm)]"
              style={{ color: "var(--luma-text-tertiary)" }}
            >
              Something went wrong. Please refresh the page.
            </p>
          ) : (
            visibleTasks.map((task) => (
              <div key={task.id} role="listitem">
                <EmailRow
                  task={task}
                  isSelected={(selected ?? defaultTask)?.id === task.id}
                  onSelect={setSelected}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <p
        className="mt-6 text-[var(--text-xs)]"
        style={{ color: "var(--luma-text-tertiary)" }}
      >
        {status === "ready"
          ? "Sorted by urgency · action-needed → for-later → news-updates · Sample emails"
          : "Sorting by urgency · Sample emails"}
      </p>
    </AppShell>
  );
}
