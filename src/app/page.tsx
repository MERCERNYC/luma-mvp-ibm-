"use client";

import { useState, useCallback, useEffect } from "react";
import { Target, ChevronDown, ChevronUp, Sparkles, RefreshCw, ListChecks, Clock3, Newspaper } from "lucide-react";
import { AppShell }               from "@/components/layout/AppShell";
import { EmailRow }               from "@/components/email/EmailRow";
import { EmailPane }              from "@/components/email/EmailPane";
import { DoneCard }               from "@/components/email/DoneCard";
import { LaterCard }              from "@/components/email/LaterCard";
import { WelcomePage }            from "@/components/WelcomePage";
import { GREETING_NAME }          from "@/data/dashboard";
import { useClassifiedEmails }    from "@/hooks/useClassifiedEmails";
import { useDoneEmails }          from "@/hooks/useDoneEmails";
import { useFocusQueue }          from "@/hooks/useFocusQueue";
import { useFeedback }            from "@/hooks/useFeedback";
import type { Task, TaskPriority } from "@/types/dashboard";

/* ─────────────────────────────────────────────
   deriveFocusReason
   ─────────────────────────────────────────────
   Converts agent data (reason, recommendedAction,
   urgencyScore) into the short label + tooltip
   shown in Focus Now rows.

   Rules (in priority order):
   1. Scan reason text for deadline/date keywords
      → "⏱ Due …" or "📅 …"
   2. Scan reason for payment/invoice keywords
      → "$ Payment due"
   3. Scan reason for reply/respond keywords
      → "↩ Needs reply"
   4. urgencyScore ≥ 0.85  → "⚠ Time sensitive"
   5. requiresAction true   → "✓ Action required"
   6. Fallback              → "↗ Needs attention"

   The whyText is the agent's own reason string
   (cleaned up), so it is never hard-coded per email.
   ───────────────────────────────────────────── */

function deriveFocusReason(task: Task): {
  label:    string;
  whyText:  string;
  nextStep: string | null;
} {
  const reason   = task.reason ?? "";
  const reasonLC = reason.toLowerCase();
  const whyText  = reason || "This email requires your attention.";
  const nextStep = task.recommendedAction ?? null;
  const score    = task.urgencyScore ?? 0.75;

  // ── helpers ───────────────────────────────────
  // Month name pattern used in several regexes
  const MON = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";

  // ── 1. Calendar / appointment ────────────────
  // e.g. "appointments on 11/19", "meeting tomorrow"
  const calendarMatch =
    /\b(appointment|meeting|call|event|visit)s?\b.*?\b(today|tomorrow|this week)\b/i.exec(reason) ??
    /\b(appointment|meeting|call|event|visit)s?\b.*?\b(\d{1,2}[\/\-]\d{1,2})\b/i.exec(reason);
  if (calendarMatch) {
    return { label: `📅 ${calendarMatch[1]} ${calendarMatch[2]}`, whyText, nextStep };
  }

  // ── 2. Deadline signal detection ─────────────
  // Broad trigger: any of these words/patterns in the reason
  const hasDeadline =
    /\b(due|deadline|expires?|must (submit|enroll|complete|update|act)|lose (coverage|access))\b/i.test(reasonLC) ||
    /\b(by|before|until)\s+(today|tomorrow|[a-z]+ \d|\d{1,2}[\/\-]\d)/i.test(reasonLC) ||
    /\bin \d+ days?\b/i.test(reasonLC) ||
    /\bthis week\b/i.test(reasonLC) ||
    /\b\d{1,2}[\/\-]\d{1,2}\b/.test(reasonLC) ||
    new RegExp(`\\b(${MON})\\b`, "i").test(reasonLC);

  if (hasDeadline) {
    // ── Specific label extraction (most precise first) ──

    // "due today by 4:00 PM" / "due today"
    if (/\b(due|before|by)\b.{0,20}?\btoday\b/i.test(reason)) {
      // try to extract a time
      const timeMatch = /\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b/i.exec(reason);
      return { label: timeMatch ? `⏱ Due today at ${timeMatch[1]}` : "⏱ Due today", whyText, nextStep };
    }

    // "due tomorrow"
    if (/\b(due|before|by)\b.{0,20}?\btomorrow\b/i.test(reason)) {
      return { label: "⏱ Due tomorrow", whyText, nextStep };
    }

    // "in N days" (matches "deadline is in 4 days", "due in 4 days")
    const inDaysMatch = /\bin (\d+) days?\b/i.exec(reason);
    if (inDaysMatch) {
      return { label: `⏱ Due in ${inDaysMatch[1]} days`, whyText, nextStep };
    }

    // "by Dec 15" / "enroll by Dec 15" / "before Nov 22"
    const byMonthMatch = new RegExp(
      `\\b(?:by|before|until)\\s+(?:[a-z\\s]+?)?\\b((?:${MON})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?)\\b`,
      "i",
    ).exec(reason);
    if (byMonthMatch) {
      return { label: `⏱ Due ${byMonthMatch[1]}`, whyText, nextStep };
    }

    // "November 22" / "Nov 22" standing alone
    const monthDayMatch = new RegExp(
      `\\b((?:${MON})[a-z]*\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?)\\b`,
      "i",
    ).exec(reason);
    if (monthDayMatch) {
      return { label: `⏱ Due ${monthDayMatch[1]}`, whyText, nextStep };
    }

    // "11/19" or "11-19" numeric date
    const numericDateMatch = /\b(\d{1,2}[\/\-]\d{1,2})\b/.exec(reason);
    if (numericDateMatch) {
      return { label: `⏱ Due ${numericDateMatch[1]}`, whyText, nextStep };
    }

    // "this week"
    if (/\bthis week\b/i.test(reason)) {
      return { label: "⏱ Due this week", whyText, nextStep };
    }

    // Generic deadline
    return { label: "⏱ Time-sensitive", whyText, nextStep };
  }

  // ── 3. Payment / invoice ─────────────────────
  if (/\b(payment|invoice|overdue|billing|charge|subscription)\b/i.test(reasonLC)) {
    return { label: "$ Payment due", whyText, nextStep };
  }

  // ── 4. Reply / respond ───────────────────────
  if (/\b(reply|respond|response|waiting for you|follow.?up)\b/i.test(reasonLC)) {
    return { label: "↩ Needs reply", whyText, nextStep };
  }

  // ── 5. Submit / approve / confirm / enroll ───
  if (/\b(submit|submission|confirm|approval|approve|sign|complete|enroll|update your)\b/i.test(reasonLC)) {
    return { label: "✓ Needs action", whyText, nextStep };
  }

  // ── 6. Coverage / access loss ────────────────
  if (/\b(lose (coverage|access)|lose your|coverage|miss (the|your|this))\b/i.test(reasonLC)) {
    return { label: "⚠ Action required", whyText, nextStep };
  }

  // ── 7. High urgency score ────────────────────
  if (score >= 0.85) {
    return { label: "⚠ Time sensitive", whyText, nextStep };
  }

  // ── 8. Fallback ──────────────────────────────
  return { label: "↗ Needs attention", whyText, nextStep };
}

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
  icon:     React.ReactNode;
  label:    string;
  count:    number;
  accent:   string;
  accentBg: string;
  isOpen:   boolean;
  onClick:  () => void;
}

function SummaryCard({
  icon, label, count, accent, accentBg, isOpen, onClick,
}: SummaryCardProps) {
  const [hovered, setHovered] = useState(false);

  /* Active = open OR hovered — drives lavender tint */
  const lavender = "#8564DD";
  const isActive = isOpen || hovered;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isOpen}
      aria-label={`${label}: ${count} emails`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="flex-1 rounded-[var(--radius-xl)] px-4 py-2.5 flex items-center gap-3 text-left
        focus-visible:outline focus-visible:outline-2
        focus-visible:outline-offset-2"
      style={{
        background:  isOpen
          ? accentBg
          : hovered
            ? "rgba(133,100,221,0.07)"
            : "rgba(255,255,255,0.28)",
        border: isOpen
          ? `1.5px solid ${accent}55`
          : hovered
            ? `1px solid rgba(133,100,221,0.35)`
            : "1px solid var(--luma-glass-border)",
        boxShadow: hovered && !isOpen
          ? "0 2px 10px 0 rgba(133,100,221,0.12)"
          : undefined,
        cursor: "pointer",
        transition: "background 200ms ease, border 200ms ease, box-shadow 200ms ease",
        /* Focus ring color matches lavender when hovered */
        outlineColor: isActive ? lavender : "var(--luma-blue)",
      }}
    >
      {/* Icon */}
      <span
        style={{
          lineHeight: 1,
          flexShrink: 0,
          color: isActive ? lavender : "var(--luma-text-secondary)",
          opacity: isOpen ? 1 : hovered ? 1 : 0.7,
          transition: "color 200ms ease, opacity 200ms ease",
        }}
        aria-hidden="true"
      >
        {icon}
      </span>

      {/* Label */}
      <span
        className="flex-1 min-w-0 truncate text-[var(--text-xs)] font-medium"
        style={{
          color: isOpen
            ? "var(--luma-text-primary)"
            : hovered
              ? lavender
              : "var(--luma-text-secondary)",
          transition: "color 200ms ease",
        }}
      >
        {label}
      </span>

      {/* Count badge */}
      <span
        className="text-[var(--text-2xs)] font-semibold px-1.5 py-0.5 rounded-[var(--radius-full)] shrink-0"
        style={{
          background: isOpen
            ? `${accent}20`
            : hovered
              ? "rgba(133,100,221,0.15)"
              : "rgba(100,140,200,0.12)",
          color: isOpen
            ? accent
            : hovered
              ? lavender
              : "var(--luma-text-tertiary)",
          transition: "background 200ms ease, color 200ms ease",
        }}
      >
        {count}
      </span>

      {/* Chevron */}
      <span
        style={{
          color: isOpen
            ? accent
            : hovered
              ? lavender
              : "var(--luma-text-disabled)",
          flexShrink: 0,
          lineHeight: 1,
          transition: "color 200ms ease, transform 180ms ease",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        }}
        aria-hidden="true"
      >
        <ChevronDown size={13} strokeWidth={2} />
      </span>
    </button>
  );
}

// ── Category card ────────────────────────────

interface CategoryCardProps {
  category:   TaskPriority;
  label:      string;
  icon:       React.ReactNode;
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
          <span aria-hidden="true" style={{ lineHeight: 1, color: accent }}>{icon}</span>
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
                hidePriorityBadge={category === "action-needed" || category === "news-updates"}
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
  "action-needed": "Up Next",
  "for-later":     "For Later",
  "news-updates":  "Updates",
};

const CATEGORY_ICON: Record<TaskPriority, React.ReactNode> = {
  "action-needed": <ListChecks size={18} strokeWidth={1.75} aria-hidden="true" />,
  "for-later":     <Clock3     size={18} strokeWidth={1.75} aria-hidden="true" />,
  "news-updates":  <Newspaper  size={18} strokeWidth={1.75} aria-hidden="true" />,
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
  // ── Gmail connection gate ───────────────────────────────────
  // "checking" = haven't fetched status yet (avoids flash of dashboard)
  // "welcome"  = not connected — show welcome page
  // "dashboard" = connected or user chose demo — show dashboard
  const [gate, setGate] = useState<"checking" | "welcome" | "dashboard">("checking");

  useEffect(() => {
    fetch("/api/auth/gmail/status")
      .then((r) => r.json())
      .then((data: { connected: boolean }) => {
        setGate(data.connected ? "dashboard" : "welcome");
      })
      .catch(() => {
        setGate("welcome");
      });
  }, []);

  // ── Dashboard state (all hooks must be unconditional) ───────
  const { status, tasks: agentTasks, emailSource } = useClassifiedEmails();
  const { recordCorrection }          = useFeedback();
  const {
    doneIds,
    markDone,
    generation,
    prioritizeAgain,
    clearDone,
  } = useDoneEmails();

  const [gmailError,     setGmailError]     = useState<string | null>(null);
  const [selected,       setSelected]       = useState<Task | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<TaskPriority>>(new Set());
  const [overrides,      setOverrides]      = useState<Record<string, TaskPriority>>({});

  // ── Gmail OAuth error banner ────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err    = params.get("gmail_error");
    if (err) {
      setGmailError(decodeURIComponent(err));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // ── Derived state (computed before any conditional return) ───
  const allTasks = agentTasks.map((t) =>
    overrides[t.id] ? { ...t, priority: overrides[t.id] } : t,
  );

  const { focusTasks, activeTasks, isCaughtUp, windowSize, focusIds } = useFocusQueue(
    allTasks,
    doneIds,
    generation,
    status === "ready",
  );

  const doneTasks = [...doneIds]
    .reverse()
    .map((id) => allTasks.find((t) => t.id === id))
    .filter((t): t is Task => t !== undefined);

  const actionCount = activeTasks.filter((t) => t.priority === "action-needed" && !focusIds.has(t.id)).length;
  const laterCount  = activeTasks.filter((t) => t.priority === "for-later").length;
  const newsCount   = activeTasks.filter((t) => t.priority === "news-updates").length;

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
    setSelected((prev) => (prev?.id === taskId ? null : prev));
  }, [markDone]);

  // ── Route: checking / welcome (all hooks are above this) ────
  if (gate === "checking") {
    return null;
  }

  if (gate === "welcome") {
    return (
      <WelcomePage
        onDemo={() => setGate("dashboard")}
      />
    );
  }

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
      clearDone={clearDone}
      onLogoClick={emailSource === "dataset" ? () => setGate("welcome") : undefined}
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
          className="text-[var(--text-xl)] sm:text-[var(--text-3xl)] font-bold tracking-[var(--tracking-tight)]"
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
            {/* Progress indicator — counts down as tasks are completed */}
            {status === "ready" && windowSize > 0 && !isCaughtUp && (
              <span
                className="text-[var(--text-xs)] tabular-nums"
                style={{ color: "var(--luma-text-tertiary)" }}
              >
                {focusTasks.length} of {windowSize} left
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
                  focusReason={deriveFocusReason(task)}
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
          {category === "for-later" ? (
            <LaterCard
              tasks={activeTasks.filter((t) => t.priority === "for-later")}
              selected={selected}
              onSelect={setSelected}
              onClose={() => closeCategory("for-later")}
            />
          ) : (
            <CategoryCard
              category={category}
              label={CATEGORY_LABEL[category]}
              icon={CATEGORY_ICON[category]}
              accent={CATEGORY_ACCENT[category]}
              accentBg={CATEGORY_BG[category]}
              tasks={activeTasks.filter((t) =>
                t.priority === category &&
                !(category === "action-needed" && focusIds.has(t.id))
              )}
              selected={selected}
              onSelect={setSelected}
              onClose={() => closeCategory(category)}
            />
          )}
        </div>
      ))}

      {/* ── Summary tiles ────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <SummaryCard
          icon={<ListChecks size={18} strokeWidth={1.75} />}
          label="Up Next"
          count={status === "ready" ? actionCount : 0}
          accent="var(--luma-action)"
          accentBg="var(--luma-action-soft)"
          isOpen={openCategories.has("action-needed")}
          onClick={() => toggleCategory("action-needed")}
        />
        <SummaryCard
          icon={<Clock3 size={18} strokeWidth={1.75} />}
          label="For Later"
          count={status === "ready" ? laterCount : 0}
          accent="var(--luma-later)"
          accentBg="var(--luma-later-soft)"
          isOpen={openCategories.has("for-later")}
          onClick={() => toggleCategory("for-later")}
        />
        <SummaryCard
          icon={<Newspaper size={18} strokeWidth={1.75} />}
          label="Updates"
          count={status === "ready" ? newsCount : 0}
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
          ? `Sorted by urgency · Up Next → For Later → Updates · ${emailSource === "gmail" ? "Gmail inbox" : "Sample emails"}`
          : "Sorting by urgency…"}
      </p>
    </AppShell>
  );
}
