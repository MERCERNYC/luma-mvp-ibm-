"use client";

import { useState }    from "react";
import { Target }      from "lucide-react";
import { AppShell }    from "@/components/layout/AppShell";
import { EmailRow }    from "@/components/email/EmailRow";
import { EmailPane }   from "@/components/email/EmailPane";
import { GREETING_NAME } from "@/data/dashboard";
import { useClassifiedEmails, FOCUS_LIMIT } from "@/hooks/useClassifiedEmails";
import type { Task }   from "@/types/dashboard";

/* ─────────────────────────────────────────────
   Dashboard — LUMA home

   Layout
   ──────
   1. Greeting + subtitle
   2. "Focus Now" card — top 5 sorted emails, See all toggle
   3. Three summary tiles — Action Needed / For Later / News & Updates
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

interface SummaryCardProps {
  icon:        React.ReactNode;
  label:       string;
  count:       number;
  description: string;
  accent:      string;
  accentBg:    string;
}

function SummaryCard({ icon, label, count, description, accent, accentBg }: SummaryCardProps) {
  return (
    <div
      className="flex-1 rounded-[var(--radius-2xl)] px-5 py-4 flex items-center gap-4"
      style={{ background: accentBg, border: "1px solid var(--luma-glass-border)" }}
    >
      <div
        className="shrink-0 w-10 h-10 rounded-[var(--radius-xl)] flex items-center justify-center"
        style={{ background: accent + "22" }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[var(--text-xs)] font-medium" style={{ color: "var(--luma-text-secondary)" }}>
          {label}
        </p>
        <p className="text-[2rem] font-bold leading-none mt-0.5" style={{ color: "var(--luma-text-primary)" }}>
          {count}
        </p>
        <p className="text-[var(--text-xs)] mt-0.5" style={{ color: "var(--luma-text-tertiary)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { status, tasks, briefText } = useClassifiedEmails();

  const [showAll,  setShowAll]  = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);

  const actionCount  = tasks.filter((t) => t.priority === "action-needed").length;
  const laterCount   = tasks.filter((t) => t.priority === "for-later").length;
  const newsCount    = tasks.filter((t) => t.priority === "news-updates").length;

  const visibleTasks = showAll ? tasks : tasks.slice(0, FOCUS_LIMIT);
  // No default — pane starts closed; user must click a row to open it
  const activeTask   = selected ?? null;

  // Subtitle varies by loading state
  const subtitle = status === "loading"
    ? "Checking your inbox…"
    : status === "error"
      ? "Couldn't load emails right now."
      : briefText || "What needs your attention today?";

  return (
    <AppShell
      emailPane={
        activeTask
          ? <EmailPane task={activeTask} onClose={() => setSelected(null)} />
          : null
      }
    >
      {/* ── Greeting ─────────────────────────────── */}
      <div className="mb-6">
        <h1
          className="text-[var(--text-3xl)] font-bold tracking-[var(--tracking-tight)]"
          style={{ color: "var(--luma-text-primary)" }}
        >
          Good morning, {GREETING_NAME}! ☀️
        </h1>
        <p
          className="mt-1 text-[var(--text-base)]"
          style={{ color: "var(--luma-text-secondary)" }}
        >
          {subtitle}
        </p>
      </div>

      {/* ── Focus Now card ───────────────────────── */}
      <div
        className="glass rounded-[var(--radius-2xl)] overflow-hidden"
        style={{ border: "1px solid var(--luma-glass-border)" }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Target size={18} strokeWidth={1.5} style={{ color: "var(--luma-blue)" }} aria-hidden="true" />
            <h2
              className="text-[var(--text-base)] font-bold"
              style={{ color: "var(--luma-text-primary)" }}
            >
              Focus Now
            </h2>
          </div>

          {status === "ready" && tasks.length > FOCUS_LIMIT && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-[var(--text-sm)] font-medium flex items-center gap-1"
              style={{ color: "var(--luma-blue)" }}
            >
              {showAll
                ? "Show less"
                : `See all (${tasks.length}) →`}
            </button>
          )}
        </div>

        {/* Email rows */}
        <div
          role="list"
          aria-label="Focus Now emails"
          aria-busy={status === "loading"}
        >
          {status === "loading" ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
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
                  isSelected={selected?.id === task.id}
                  onSelect={setSelected}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Summary tiles ────────────────────────── */}
      <div className="flex gap-3 mt-4">
        <SummaryCard
          icon={<span style={{ fontSize: 18 }}>✉️</span>}
          label="Action Needed"
          count={status === "ready" ? actionCount : 0}
          description="Requires a reply or decision"
          accent="var(--luma-action)"
          accentBg="var(--luma-action-soft)"
        />
        <SummaryCard
          icon={<span style={{ fontSize: 18 }}>🕐</span>}
          label="For Later"
          count={status === "ready" ? laterCount : 0}
          description="Keep on your radar"
          accent="var(--luma-later)"
          accentBg="var(--luma-later-soft)"
        />
        <SummaryCard
          icon={<span style={{ fontSize: 18 }}>📰</span>}
          label="News & Updates"
          count={status === "ready" ? newsCount : 0}
          description="FYI and newsletters"
          accent="var(--luma-blue)"
          accentBg="var(--luma-blue-soft)"
        />
      </div>

      {/* Footer */}
      <p
        className="mt-5 text-[var(--text-xs)]"
        style={{ color: "var(--luma-text-tertiary)" }}
      >
        {status === "ready"
          ? "Sorted by urgency · action-needed → for-later → news-updates · Sample emails"
          : "Sorting by urgency · Sample emails"}
      </p>
    </AppShell>
  );
}
