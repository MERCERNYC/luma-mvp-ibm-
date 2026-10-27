import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { RightPanel } from "@/components/layout/RightPanel";
import { DailyBrief } from "@/components/email/DailyBrief";
import { TaskCard } from "@/components/email/TaskCard";
import {
  DAILY_BRIEF,
  ATTENTION_TASKS,
  NEXT_STEP,
  LATER_ITEMS,
} from "@/data/dashboard";

/* ─────────────────────────────────────────────
   Dashboard — LUMA home
   Static server component. All data is imported
   from src/data/dashboard.ts.

   Layout matches reference:
   — Left:   sidebar nav
   — Centre: heading + brief + "Needs attention"
   — Right:  "Next step" + "Later"
   ───────────────────────────────────────────── */

export default function DashboardPage() {
  return (
    <AppShell
      rightPanel={
        <RightPanel nextStep={NEXT_STEP} laterItems={LATER_ITEMS} />
      }
    >
      {/* Top bar — search / focus mode / avatar */}
      <TopBar />

      {/* Page heading */}
      <div className="mb-6">
        <h1
          className="text-[var(--text-3xl)] font-bold tracking-[var(--tracking-tight)]"
          style={{ color: "var(--luma-text-primary)" }}
        >
          A little clarity for your day
        </h1>
        <p
          className="mt-1 text-[var(--text-base)]"
          style={{ color: "var(--luma-text-secondary)" }}
        >
          Three priorities. One next step at a time.
        </p>
      </div>

      {/* Daily brief */}
      <DailyBrief text={DAILY_BRIEF} />

      {/* Needs your attention */}
      <section className="mt-8" aria-labelledby="attention-heading">
        <h2
          id="attention-heading"
          className="text-[var(--text-base)] font-semibold mb-4"
          style={{ color: "var(--luma-text-primary)" }}
        >
          Needs your attention
        </h2>

        <div
          className="rounded-[var(--radius-xl)] overflow-hidden"
          style={{
            background: "var(--luma-glass-raised)",
            border: "1px solid var(--luma-glass-border)",
          }}
        >
          {ATTENTION_TASKS.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </section>

      {/* Footer note */}
      <p
        className="mt-6 text-[var(--text-xs)]"
        style={{ color: "var(--luma-text-tertiary)" }}
      >
        Priorities are editable · Sample emails
      </p>
    </AppShell>
  );
}
