"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Archive,
  Trash2,
  Clock,
  Folder,
  MoreHorizontal,
  Star,
  Paperclip,
  Download,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import type { Task, TaskPriority } from "@/types/dashboard";
import { getPillConfig }    from "@/components/email/EmailRow";
import { ReplyComposer }    from "@/components/email/ReplyComposer";

/* ─────────────────────────────────────────────
   EmailPane
   The right-side email reading panel.

   Props
   ─────
   task             — the email being viewed
   onClose          — closes the pane
   onPriorityChange — called when Sofia overrides LUMA's priority;
                      parent updates task list + tile counts
   ───────────────────────────────────────────── */

const AVATAR_BG: Record<Task["avatarColor"], string> = {
  blue:   "rgba(37,99,235,0.12)",
  purple: "rgba(124,58,237,0.12)",
  green:  "rgba(22,163,74,0.12)",
  orange: "rgba(234,88,12,0.12)",
};

const AVATAR_COLOR: Record<Task["avatarColor"], string> = {
  blue:   "var(--luma-blue)",
  purple: "var(--luma-purple)",
  green:  "var(--luma-later)",
  orange: "#ea580c",
};

/** Human-readable label for a priority value */
const PRIORITY_LABEL: Record<TaskPriority, string> = {
  "action-needed": "Action Needed",
  "for-later":     "For Later",
  "news-updates":  "News & Updates",
};

/** The one move available in the pane — only action↔later is exposed for now */
const MOVE_TARGET: Partial<Record<TaskPriority, TaskPriority>> = {
  "action-needed": "for-later",
  "for-later":     "action-needed",
};

export interface EmailPaneProps {
  task:             Task;
  onClose:          () => void;
  /** Called when Sofia marks the email as done — parent removes it from all lists. */
  onDone:           (taskId: string) => void;
  /** Called after Sofia confirms a priority change. */
  onPriorityChange: (taskId: string, lumaOriginal: TaskPriority, sofiaChanged: TaskPriority) => void;
}

function ToolbarBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)]
        hover:bg-[rgba(37,99,235,0.07)] transition-colors duration-100
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
      style={{ color: "var(--luma-text-secondary)" }}
    >
      {children}
    </button>
  );
}

/** Self-dismissing toast — fades out after 3 s */
function CorrectionToast({
  lumaOriginal,
  sofiaChanged,
  onDone,
}: {
  lumaOriginal: TaskPriority;
  sofiaChanged: TaskPriority;
  onDone: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide  = setTimeout(() => setVisible(false), 3000);
    const clean = setTimeout(onDone,                  3400);
    return () => { clearTimeout(hide); clearTimeout(clean); };
  }, [onDone]);

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-3 rounded-[var(--radius-xl)]"
      style={{
        background:  "var(--luma-glass-raised)",
        border:      "1px solid var(--luma-glass-border)",
        opacity:     visible ? 1 : 0,
        transition:  "opacity 400ms ease",
        pointerEvents: "none",
      }}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2
        size={14}
        strokeWidth={1.5}
        style={{ color: "var(--luma-later)", flexShrink: 0 }}
        aria-hidden="true"
      />
      <span className="text-[var(--text-xs)]" style={{ color: "var(--luma-text-secondary)" }}>
        <span style={{ color: "var(--luma-text-primary)", fontWeight: 600 }}>
          Moved to {PRIORITY_LABEL[sofiaChanged]}
        </span>
        {" · "}LUMA suggested{" "}
        <span style={{ color: "var(--luma-text-primary)", fontWeight: 600 }}>
          {PRIORITY_LABEL[lumaOriginal]}
        </span>
        {" · correction stored"}
      </span>
    </div>
  );
}

export function EmailPane({ task, onClose, onDone, onPriorityChange }: EmailPaneProps) {
  const bodyParagraphs = task.body.split("\n\n");
  const moveTarget     = MOVE_TARGET[task.priority];

  /** Toast state — tracks the last correction for display */
  const [toast, setToast] = useState<{
    lumaOriginal: TaskPriority;
    sofiaChanged: TaskPriority;
  } | null>(null);

  /** Whether the user has marked this email as done */
  const [isDone, setIsDone] = useState(false);

  // Reset both states when the task changes
  useEffect(() => { setToast(null); setIsDone(false); }, [task.id]);

  function handleMove() {
    if (!moveTarget) return;
    onPriorityChange(task.id, task.priority, moveTarget);
    setToast({ lumaOriginal: task.priority, sofiaChanged: moveTarget });
  }

  function handleDone() {
    setIsDone(true);
    onDone(task.id);
  }

  const movePill = moveTarget ? getPillConfig(moveTarget) : null;

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-1 px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--luma-glass-border)" }}
      >
        {/* Close / back — calls onClose to collapse the pane */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close email"
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)]
            hover:bg-[rgba(37,99,235,0.07)] transition-colors duration-100
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
          style={{ color: "var(--luma-text-secondary)" }}
        >
          <ArrowLeft size={17} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <div className="w-px h-5 mx-1" style={{ background: "var(--luma-glass-border)" }} aria-hidden="true" />
        <ToolbarBtn label="Archive"><Archive  size={17} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
        <ToolbarBtn label="Delete" ><Trash2   size={17} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
        <ToolbarBtn label="Snooze" ><Clock    size={17} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
        <ToolbarBtn label="Move"   ><Folder   size={17} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
        <ToolbarBtn label="More"   ><MoreHorizontal size={17} strokeWidth={1.5} aria-hidden="true" /></ToolbarBtn>
      </div>

      {/* ── Email content — scrollable ── */}
      <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">

        {/* Sender row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 w-10 h-10 rounded-[var(--radius-full)] flex items-center justify-center
                text-[var(--text-sm)] font-bold select-none"
              style={{
                background: AVATAR_BG[task.avatarColor],
                color: AVATAR_COLOR[task.avatarColor],
              }}
              aria-hidden="true"
            >
              {task.senderInitial}
            </div>
            <div className="flex flex-col gap-0.5">
              <span
                className="text-[var(--text-sm)] font-bold"
                style={{ color: "var(--luma-text-primary)" }}
              >
                {task.sender}
              </span>
              <span
                className="text-[var(--text-xs)]"
                style={{ color: "var(--luma-text-tertiary)" }}
              >
                {task.senderEmail}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-[var(--text-xs)] tabular-nums"
              style={{ color: "var(--luma-text-tertiary)" }}
            >
              {task.time}
            </span>
            <button
              type="button"
              aria-label="Star email"
              className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)]
                hover:bg-[rgba(37,99,235,0.07)] transition-colors duration-100"
              style={{ color: "var(--luma-text-tertiary)" }}
            >
              <Star size={15} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Subject */}
        <h1
          className="text-[var(--text-xl)] font-bold leading-snug"
          style={{ color: "var(--luma-text-primary)" }}
        >
          {task.subject}
        </h1>

        {/* Body */}
        <div className="flex flex-col gap-3">
          {bodyParagraphs.map((para, i) => (
            <p
              key={i}
              className="text-[var(--text-sm)] leading-[var(--leading-relaxed)]"
              style={{ color: "var(--luma-text-primary)" }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Attachment chip */}
        {task.attachment && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)]"
            style={{
              background: "var(--luma-blue-soft)",
              border: "1px solid var(--luma-glass-border)",
            }}
          >
            <div
              className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
              style={{ background: "rgba(37,99,235,0.12)", color: "var(--luma-blue)" }}
              aria-hidden="true"
            >
              <Paperclip size={16} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span
                className="text-[var(--text-xs)] font-semibold truncate"
                style={{ color: "var(--luma-text-primary)" }}
              >
                {task.attachment.name}
              </span>
              <span
                className="text-[var(--text-2xs)]"
                style={{ color: "var(--luma-text-tertiary)" }}
              >
                {task.attachment.meta}
              </span>
            </div>
            <button
              type="button"
              aria-label="Download attachment"
              className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)]
                hover:bg-[rgba(37,99,235,0.10)] transition-colors duration-100"
              style={{ color: "var(--luma-blue)" }}
            >
              <Download size={15} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* ── LUMA Insight card ── */}
        {(task.reason || task.recommendedAction) && (
          <div
            className="rounded-[var(--radius-xl)] px-4 py-3.5 flex flex-col gap-2"
            style={{
              background: "var(--luma-glass-raised)",
              border: "1px solid var(--luma-glass-border)",
            }}
          >
            {/* ✦ LUMA header + move button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles
                  size={12}
                  strokeWidth={1.5}
                  style={{ color: "var(--luma-blue)" }}
                  aria-hidden="true"
                />
                <span
                  className="text-[var(--text-xs)] font-bold"
                  style={{ color: "var(--luma-blue)" }}
                >
                  LUMA
                </span>
              </div>

              {/* Priority-change button — only shown when a move target exists */}
              {moveTarget && movePill && (
                <button
                  type="button"
                  onClick={handleMove}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)]
                    text-[var(--text-2xs)] font-semibold transition-opacity duration-100
                    hover:opacity-80 active:scale-[0.97]
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
                  style={{
                    background: movePill.bg,
                    color:      movePill.color,
                  }}
                  aria-label={`Move to ${PRIORITY_LABEL[moveTarget]}`}
                >
                  <ArrowRightLeft size={10} strokeWidth={2} aria-hidden="true" />
                  Move to {PRIORITY_LABEL[moveTarget]}
                </button>
              )}
            </div>

            {/* Why this matters: <value> */}
            {task.reason && (
              <p className="text-[var(--text-sm)] leading-[var(--leading-relaxed)]">
                <span
                  className="font-semibold"
                  style={{ color: "var(--luma-text-primary)" }}
                >
                  Why this matters:
                </span>{" "}
                <span style={{ color: "var(--luma-text-secondary)" }}>
                  {task.reason}
                </span>
              </p>
            )}

            {/* Suggested next step: <value> */}
            {task.recommendedAction && (
              <p className="text-[var(--text-sm)] leading-[var(--leading-relaxed)]">
                <span
                  className="font-semibold"
                  style={{ color: "var(--luma-text-primary)" }}
                >
                  Suggested next step:
                </span>{" "}
                <span style={{ color: "var(--luma-text-secondary)" }}>
                  {task.recommendedAction}
                </span>
              </p>
            )}
          </div>
        )}

        {/* ── Correction toast ── */}
        {toast && (
          <CorrectionToast
            lumaOriginal={toast.lumaOriginal}
            sofiaChanged={toast.sofiaChanged}
            onDone={() => setToast(null)}
          />
        )}

        {/* ── Done card — shown after Mark as Done ── */}
        {isDone && (
          <div
            className="rounded-[var(--radius-xl)] px-5 py-6 flex flex-col items-center gap-3 text-center mt-2"
            style={{
              background: "linear-gradient(135deg, rgba(22,163,74,0.07) 0%, rgba(37,99,235,0.06) 100%)",
              border:     "1px solid rgba(22,163,74,0.22)",
            }}
            role="status"
            aria-live="polite"
          >
            <div
              className="w-10 h-10 rounded-[var(--radius-full)] flex items-center justify-center"
              style={{ background: "rgba(22,163,74,0.12)" }}
              aria-hidden="true"
            >
              <CheckCircle2 size={20} strokeWidth={1.5} style={{ color: "rgb(22,163,74)" }} />
            </div>
            <div className="flex flex-col gap-1">
              <p
                className="text-[var(--text-base)] font-bold"
                style={{ color: "var(--luma-text-primary)" }}
              >
                All done with this one ✓
              </p>
              <p
                className="text-[var(--text-sm)]"
                style={{ color: "var(--luma-text-secondary)" }}
              >
                Removed from your Focus Now list.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--text-sm)] font-medium transition-opacity duration-100
                hover:opacity-70 focus-visible:outline focus-visible:outline-2
                focus-visible:outline-[var(--luma-blue)]"
              style={{ color: "var(--luma-blue)" }}
            >
              ← Back to inbox
            </button>
          </div>
        )}

        {/* Reply composer — hidden after Done */}
        {!isDone && (
          <>
            <ReplyComposer
              subject={task.subject}
              body={task.body}
              sender={task.sender}
            />

            {/* Done button — kept below the composer */}
            <button
              type="button"
              onClick={handleDone}
              className="self-end flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)]
                text-[var(--text-sm)] font-semibold transition-all duration-100
                hover:opacity-90 active:scale-[0.98]
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
              style={{
                background: "rgba(22,163,74,0.12)",
                color:      "rgb(22,163,74)",
                border:     "1px solid rgba(22,163,74,0.25)",
              }}
            >
              <CheckCircle2 size={14} strokeWidth={1.5} aria-hidden="true" />
              Done
            </button>
          </>
        )}

      </div>
    </div>
  );
}
