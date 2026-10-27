"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmailRow } from "@/components/email/EmailRow";
import { EmailPane } from "@/components/email/EmailPane";
import { DailyBrief } from "@/components/email/DailyBrief";
import { DEMO_TASKS, GREETING_NAME, ATTENTION_COUNT } from "@/data/dashboard";
import type { Task } from "@/types/dashboard";

/* ─────────────────────────────────────────────
   Dashboard — LUMA home
   "use client" — selected email state lives here.

   Layout:
   — Header (top, full-width)
   — Left: greeting + "N Things Need Attention" list
   — Right: email reading pane (opens on row click)
   ───────────────────────────────────────────── */

export default function DashboardPage() {
  const [selected, setSelected] = useState<Task>(DEMO_TASKS[0]);

  return (
    <AppShell
      emailPane={
        <EmailPane task={selected} onClose={() => {}} />
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
          You have {ATTENTION_COUNT} important email{ATTENTION_COUNT !== 1 ? "s" : ""} today.
        </p>
      </div>

      {/* Daily brief */}
      <DailyBrief text="A permission form, a team agenda, and a shipping update are waiting for you." />

      {/* Focus list */}
      <div className="mt-8">
        {/* Section heading */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} strokeWidth={1.5} style={{ color: "var(--luma-blue)" }} aria-hidden="true" />
          <h2
            className="text-[var(--text-base)] font-bold"
            style={{ color: "var(--luma-text-primary)" }}
          >
            {DEMO_TASKS.length} Things Need Attention
          </h2>
        </div>

        {/* Email rows — glass card */}
        <div
          className="glass rounded-[var(--radius-2xl)] overflow-hidden"
          style={{ border: "1px solid var(--luma-glass-border)" }}
          role="list"
          aria-label="Emails needing attention"
        >
          {DEMO_TASKS.map((task) => (
            <div key={task.id} role="listitem">
              <EmailRow
                task={task}
                isSelected={selected.id === task.id}
                onSelect={setSelected}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p
        className="mt-6 text-[var(--text-xs)]"
        style={{ color: "var(--luma-text-tertiary)" }}
      >
        Priorities are editable · Sample emails
      </p>
    </AppShell>
  );
}
