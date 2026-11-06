"use client";

import { useState, useCallback, useEffect } from "react";
import { Target, ChevronDown, ChevronUp, Sparkles, RefreshCw } from "lucide-react";
import { AppShell }               from "@/components/layout/AppShell";
import { EmailRow }               from "@/components/email/EmailRow";
import { EmailPane }              from "@/components/email/EmailPane";
import { DoneCard }               from "@/components/email/DoneCard";
import { GREETING_NAME }          from "@/data/dashboard";
import { useClassifiedEmails }    from "@/hooks/useClassifiedEmails";
import { useDoneEmails }          from "@/hooks/useDoneEmails";
import { useFocusQueue }          from "@/hooks/useFocusQueue";
import { useFeedback }            from "@/hooks/useFeedback";
import type { Task, TaskPriority } from "@/types/dashboard";

/* ─────────────────────────────────────────────
   Dashboard — LUMA home

   Layout
   ──────
   1. Greeting card
   2. Focus Now card — always visible, top 5
   3. Category cards — each opens independently
      beneath Focus Now when its tile is clicked.
      Multiple can be open at the same time.
   4. Three summary tiles — toggle category cards
   ───────────────────────────────────────────── */

// ── Skeleton row ────────────────────────────

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

// ── Summary tile ────────────────────────────

interface SummaryCardProps {
  icon:        React.ReactNode;
  label:       string;
  count:       number;
  description: string;
  accent:      string;
  accentBg:    string;
  isOpen:      boolean;
  onClick:     () => void;
}

function SummaryCard({
  icon, label, count, description, accent, accentBg, isOpen, onClick,
}: SummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isOpen}
      aria-label={`${label}: ${count} emails`}
      className="flex-1 rounded-[var(--radius-2xl)] px-5 py-4 flex items-center gap-4 text-left
        transition-all duration-150 focus-visible:outline focus-visible:outline-2
        focus-visible:outline-[var(--luma-blue)] focus-visible:outline-offset-2"
      style={{
        background: accentBg,
        border:     isOpen
          ? `2px solid ${accent}`
          : "1px solid var(--luma-glass-border)",
        boxShadow:  isOpen ? `0 0 0 3px ${accent}22` : undefined,
        cursor:     "pointer",
      }}
    >
      <div
        className="shrink-0 w-10 h-10 rounded-[var(--radius-xl)] flex items-center justify-center"
        style={{ background: accent + "22" }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
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
      {/* Open/close chevron */}
      <div style={{ color: accent, opacity: 0.7, flexShrink: 0 }} aria-hidden="true">
        {isOpen
          ? <ChevronUp   size={16} strokeWidth={2} />
          : <ChevronDown size={16} strokeWidth={2} />}
      </div>
    </button>
  );
}

// ── Category card ────────────────────────────

interface CategoryCardProps {
  category:   TaskPriority;
  label:      string;
  icon:       string;
  accent:     string;
  accentBg:   string;
  tasks:      Task[];
  selected:   Task | null;
  onSelect:   (t: Task) => void;
  onClose:    () => void;
}

function CategoryCard({
  category, label, icon, accent, accentBg, tasks, selected, onSelect, onClose,
}: CategoryCardProps) {
  return (
    <div
      className="glass rounded-[var(--radius-2xl)] overflow-hidden"
      style={{
        border:     `1.5px solid ${accent}44`,
        background: accentBg,
        transition: "background 200ms ease",
      }}
      role="region"
      aria-label={`${label} emails`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
          <h2
            className="text-[var(--text-base)] font-bold"
            style={{ color: "var(--luma-text-primary)" }}
          >
            {label}
          </h2>
          <span
            className="text-[var(--text-xs)] font-medium px-2 py-0.5 rounded-[var(--radius-full)]"
            style={{ background: `${accent}18`, color: accent }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${label}`}
          className="flex items-center gap-1 text-[var(--text-xs)] font-medium transition-opacity
            duration-100 hover:opacity-70 focus-visible:outline focus-visible:outline-2
            focus-visible:outline-[var(--luma-blue)]"
          style={{ color: "var(--luma-text-tertiary)" }}
        >
          <ChevronUp size={14} strokeWidth={2} aria-hidden="true" />
          Collapse
        </button>
      </div>

      {/* Accent bar */}
      <div
        style={{
          height:     2,
          background: `linear-gradient(to right, ${accent}66, transparent)`,
        }}
        aria-hidden="true"
      />

      {/* Email rows */}
      <div role="list" aria-label={`${label} email list`}>
        {tasks.length === 0 ? (
          <p
            className="px-5 py-6 text-[var(--text-sm)]"
            style={{ color: "var(--luma-text-tertiary)" }}
          >
            No emails in this category.
          </p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} role="listitem">
              <EmailRow
                task={task}
                isSelected={selected?.id === task.id}
                onSelect={onSelect}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Lookup tables ────────────────────────────

const CATEGORY_LABEL: Record<TaskPriority, string> = {
  "action-needed": "Action Needed",
  "for-later":     "For Later",
  "news-updates":  "News & Updates",
};

const CATEGORY_ICON: Record<TaskPriority, string> = {
  "action-needed": "✉️",
  "for-later":     "🕐",
  "news-updates":  "📰",
};

const CATEGORY_ACCENT: Record<TaskPriority, string> = {
  "action-needed": "var(--luma-action)",
  "for-later":     "var(--luma-later)",
  "news-updates":  "var(--luma-blue)",
};

const CATEGORY_BG: Record<TaskPriority, string> = {
  "action-needed": "rgba(91,110,245,0.05)",
  "for-later":     "rgba(217,119,6,0.05)",
  "news-updates":  "rgba(59,125,232,0.05)",
};

/** The order category cards appear in (below Focus Now) */
const CATEGORY_ORDER: TaskPriority[] = ["action-needed", "for-later", "news-updates"];

// ── Page ─────────────────────────────────────

export default function DashboardPage() {
  const { status, tasks: agentTasks } = useClassifiedEmails();
  const { recordCorrection }          = useFeedback();
  const {
    doneIds,
    markDone,
    generation,
    prioritizeAgain,
  } = useDoneEmails();

  // ── Gmail OAuth error banner ────────────────────────────────
  const [gmailError, setGmailError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err    = params.get("gmail_error");
    if (err) {
      setGmailError(decodeURIComponent(err));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const [selected,       setSelected]       = useState<Task | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<TaskPriority>>(new Set());
  // Priority overrides applied this session — keyed by task id
  const [overrides, setOverrides] = useState<Record<string, TaskPriority>>({});

  // Merge agent priorities with any manual overrides
  const allTasks = agentTasks.map((t) =>
    overrides[t.id] ? { ...t, priority: overrides[t.id] } : t,
  );

  // Focus Now window + active tasks (both exclude done items)
  const { focusTasks, activeTasks, isCaughtUp } = useFocusQueue(
    allTasks,
    doneIds,
    generation,
    status === "ready",
  );

  // Done tasks list — ordered by most recently done (last in set = most recent)
  const doneTasks = [...doneIds]
    .reverse()
    .map((id) => allTasks.find((t) => t.id === id))
    .filter((t): t is Task => t !== undefined);

  const actionCount = activeTasks.filter((t) => t.priority === "action-needed").length;
  const laterCount  = activeTasks.filter((t) => t.priority === "for-later").length;
  const newsCount   = activeTasks.filter((t) => t.priority === "news-updates").length;

  // Keep selected task in sync; clear it if marked done
  const activeTask = selected
    ? (activeTasks.find((t) => t.id === selected.id) ?? null)
    : null;

  const handlePriorityChange = useCallback(
    (taskId: string, lumaOriginal: TaskPriority, sofiaChanged: TaskPriority) => {
      recordCorrection(taskId, lumaOriginal, sofiaChanged);
      setOverrides((prev) => ({ ...prev, [taskId]: sofiaChanged }));
    },
    [recordCorrection],
  );

  const handleDone = useCallback((taskId: string) => {
    markDone(taskId);
    // If the task being marked done is currently open in the pane, close it
    setSelected((prev) => (prev?.id === taskId ? null : prev));
  }, [markDone]);

  function toggleCategory(category: TaskPriority) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }

  function closeCategory(category: TaskPriority) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.delete(category);
      return next;
    });
  }

  return (
    <AppShell
      emailPane={
        activeTask
          ? (
            <EmailPane
              task={activeTask}
              onClose={() => setSelected(null)}
              onDone={handleDone}
              onPriorityChange={handlePriorityChange}
            />
          )
          : null
      }
    >
      {/* ── Gmail error banner ───────────────────── */}
      {gmailError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 px-5 py-3 rounded-[var(--radius-xl)] mb-4 text-[var(--text-sm)]"
          style={{
            background: "rgba(220,38,38,0.07)",
            border:     "1px solid rgba(220,38,38,0.25)",
            color:      "#b91c1c",
          }}
        >
          <span>
            <strong>Gmail connection failed</strong>
            {" — "}{gmailError.replace(/_/g, " ")}
          </span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setGmailError(null)}
            className="shrink-0 font-bold opacity-70 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Greeting ─────────────────────────────── */}
      <div
        className="glass rounded-[var(--radius-2xl)] px-6 py-5 mb-4"
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
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
          {status === "loading"
            ? "Checking your inbox…"
            : status === "error"
              ? "Couldn't load emails right now."
              : isCaughtUp
                ? "You're all caught up!"
                : `${focusTasks.length} thing${focusTasks.length === 1 ? "" : "s"} need your attention today.`}
        </p>
        {status === "ready" && !isCaughtUp && (
          <p
            className="mt-0.5 text-[var(--text-sm)]"
            style={{ color: "var(--luma-text-tertiary)" }}
          >
            LUMA prioritized them for you.
          </p>
        )}
      </div>

      {/* ── Focus Now card — always visible ─────── */}
      <div
        className="glass rounded-[var(--radius-2xl)] overflow-hidden mb-4"
        style={{ border: "1px solid var(--luma-glass-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Target size={18} strokeWidth={1.5} style={{ color: "var(--luma-blue)" }} aria-hidden="true" />
            <h2
              className="text-[var(--text-base)] font-bold"
              style={{ color: "var(--luma-text-primary)" }}
            >
              Focus Now
            </h2>
            {/* Live count badge — counts down as tasks are completed */}
            {status === "ready" && !isCaughtUp && (
              <span
                className="text-[var(--text-xs)] font-semibold px-2 py-0.5 rounded-[var(--radius-full)]"
                style={{ background: "var(--luma-blue-soft)", color: "var(--luma-blue)" }}
              >
                {focusTasks.length}
              </span>
            )}
          </div>
        </div>

        {/* Email rows / empty states */}
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
            <p className="px-5 py-6 text-[var(--text-sm)]" style={{ color: "var(--luma-text-tertiary)" }}>
              Something went wrong. Please refresh the page.
            </p>
          ) : isCaughtUp ? (
            /* ── Caught-up empty state ── */
            <div
              className="flex flex-col items-center gap-3 px-6 py-8 text-center"
              role="status"
              aria-live="polite"
            >
              <div
                className="w-12 h-12 rounded-[var(--radius-full)] flex items-center justify-center"
                style={{ background: "rgba(124,92,216,0.10)" }}
                aria-hidden="true"
              >
                <Sparkles size={22} strokeWidth={1.5} style={{ color: "var(--luma-purple, #7c5cd8)" }} />
              </div>
              <div>
                <p
                  className="text-[var(--text-base)] font-bold"
                  style={{ color: "var(--luma-text-primary)" }}
                >
                  You&rsquo;re caught up
                </p>
                <p
                  className="text-[var(--text-sm)] mt-0.5"
                  style={{ color: "var(--luma-text-secondary)" }}
                >
                  Nothing needs your attention right now.
                </p>
              </div>
              <button
                type="button"
                onClick={prioritizeAgain}
                className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)]
                  text-[var(--text-sm)] font-semibold transition-all duration-100
                  hover:opacity-85 active:scale-[0.97]
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
                style={{
                  background: "var(--luma-glass-raised)",
                  border:     "1px solid var(--luma-glass-border)",
                  color:      "var(--luma-text-secondary)",
                }}
              >
                <RefreshCw size={13} strokeWidth={2} aria-hidden="true" />
                Prioritize Again
              </button>
            </div>
          ) : (
            focusTasks.map((task) => (
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

      {/* ── Done card ────────────────────────────── */}
      {doneTasks.length > 0 && (
        <div className="mb-4">
          <DoneCard tasks={doneTasks} />
        </div>
      )}

      {/* ── Open category cards ──────────────────── */}
      {CATEGORY_ORDER.filter((cat) => openCategories.has(cat)).map((category) => (
        <div key={category} className="mb-4">
          <CategoryCard
            category={category}
            label={CATEGORY_LABEL[category]}
            icon={CATEGORY_ICON[category]}
            accent={CATEGORY_ACCENT[category]}
            accentBg={CATEGORY_BG[category]}
            tasks={activeTasks.filter((t) => t.priority === category)}
            selected={selected}
            onSelect={setSelected}
            onClose={() => closeCategory(category)}
          />
        </div>
      ))}

      {/* ── Summary tiles ────────────────────────── */}
      <div className="flex gap-3">
        <SummaryCard
          icon={<span style={{ fontSize: 18 }}>✉️</span>}
          label="Action Needed"
          count={status === "ready" ? actionCount : 0}
          description="Requires a reply or decision"
          accent="var(--luma-action)"
          accentBg="var(--luma-action-soft)"
          isOpen={openCategories.has("action-needed")}
          onClick={() => toggleCategory("action-needed")}
        />
        <SummaryCard
          icon={<span style={{ fontSize: 18 }}>🕐</span>}
          label="For Later"
          count={status === "ready" ? laterCount : 0}
          description="Keep on your radar"
          accent="var(--luma-later)"
          accentBg="var(--luma-later-soft)"
          isOpen={openCategories.has("for-later")}
          onClick={() => toggleCategory("for-later")}
        />
        <SummaryCard
          icon={<span style={{ fontSize: 18 }}>📰</span>}
          label="News & Updates"
          count={status === "ready" ? newsCount : 0}
          description="FYI and newsletters"
          accent="var(--luma-blue)"
          accentBg="var(--luma-blue-soft)"
          isOpen={openCategories.has("news-updates")}
          onClick={() => toggleCategory("news-updates")}
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
