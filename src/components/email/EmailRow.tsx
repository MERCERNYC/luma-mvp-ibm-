"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Task, TaskPriority } from "@/types/dashboard";

/* ─────────────────────────────────────────────
   EmailRow
   A single row in the "3 Things Need Attention"
   list. Matches the reference image:

   [avatar]  [sender bold]  [tag pill]  [time]
             [subject]                  [›]
             [preview muted]

   The entire row is the tap target — no buttons.
   ───────────────────────────────────────────── */

/**
 * Derive the pill label from priority + urgencyScore.
 *   action-needed, urgencyScore ≥ 0.85 → Urgent  (red)
 *   action-needed, urgencyScore < 0.85  → Action  (purple)
 *   for-later                           → Later   (amber)
 *   news-updates                        → News    (grey)
 */
export function getPillConfig(
  priority: TaskPriority,
  urgencyScore?: number,
): { label: string; color: string; bg: string } {
  if (priority === "action-needed") {
    if ((urgencyScore ?? 0) >= 0.85) {
      return { label: "Urgent", color: "var(--luma-urgent)", bg: "var(--luma-urgent-soft)" };
    }
    return { label: "Action", color: "var(--luma-action)", bg: "var(--luma-action-soft)" };
  }
  if (priority === "for-later") {
    return { label: "Later", color: "var(--luma-later)", bg: "var(--luma-later-soft)" };
  }
  return { label: "News", color: "var(--luma-news)", bg: "var(--luma-news-soft)" };
}

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

/* ─────────────────────────────────────────────
   ReasonLabel
   Shows a short human-readable reason (always
   visible) with a "Why LUMA?" tooltip that
   appears on hover, focus, or tap.

   The popover is dismissed on:
   - Mouse leave (after a short delay so the
     user can read it)
   - Blur (keyboard)
   - Second click/tap (toggle)
   - Escape key
   ───────────────────────────────────────────── */

interface ReasonLabelProps {
  /** Short label always shown, e.g. "↩ Needs reply" */
  label: string;
  /** Why LUMA? explanation text (1–2 sentences max) */
  whyText: string;
  /** Optional suggested next step from the agent */
  nextStep?: string | null;
}

function ReasonLabel({ label, whyText, nextStep }: ReasonLabelProps) {
  const [open, setOpen]       = useState(false);
  const hideTimer             = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef            = useRef<HTMLSpanElement>(null);
  const popoverRef            = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setOpen(true);
  }, []);

  const hide = useCallback((delay = 0) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (delay > 0) {
      hideTimer.current = setTimeout(() => setOpen(false), delay);
    } else {
      setOpen(false);
    }
  }, []);

  /* Escape key closes popover */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hide();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, hide]);

  /* Click outside closes popover */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !popoverRef.current?.contains(e.target as Node)
      ) {
        hide();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, hide]);

  return (
    <span className="relative inline-flex items-center">
      {/* Always-visible reason label — acts as the popover trigger.
          Must be a <span role="button"> not a <button> because this
          element lives inside the EmailRow <button> and nested buttons
          are invalid HTML and cause a React hydration error. */}
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.stopPropagation(); // don't fire the row's onSelect
          setOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen((prev) => !prev);
          }
        }}
        onMouseEnter={show}
        onMouseLeave={() => hide(300)}
        onFocus={show}
        onBlur={(e) => {
          // only hide if focus left the entire reason widget
          if (!popoverRef.current?.contains(e.relatedTarget as Node)) {
            hide(150);
          }
        }}
        className={cn(
          "text-[var(--text-xs)] font-medium leading-none",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]",
          "focus-visible:outline-offset-2 rounded-[2px]",
          "transition-opacity duration-100",
          open ? "opacity-100" : "opacity-70 hover:opacity-90",
        )}
        style={{ color: "var(--luma-text-secondary)", cursor: "default" }}
      >
        {label}
      </span>

      {/* "Why LUMA?" popover */}
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Why LUMA prioritized this"
          onMouseEnter={show}
          onMouseLeave={() => hide(200)}
          className="absolute z-50 bottom-[calc(100%+6px)] left-0"
          style={{ minWidth: "220px", maxWidth: "280px" }}
          /* Prevent click-on-popover from firing row's onSelect */
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-[var(--radius-md)] px-3.5 py-3 text-left"
            style={{
              background:   "var(--luma-glass-raised)",
              border:       "1px solid var(--luma-glass-border)",
              boxShadow:    "var(--shadow-glass-md)",
              backdropFilter: "blur(20px) saturate(1.5)",
              WebkitBackdropFilter: "blur(20px) saturate(1.5)",
            }}
          >
            <p
              className="text-[var(--text-xs)] font-semibold mb-1"
              style={{ color: "var(--luma-text-secondary)" }}
            >
              Why LUMA prioritized this
            </p>
            <p
              className="text-[var(--text-xs)] leading-snug"
              style={{ color: "var(--luma-text-primary)" }}
            >
              {whyText}
            </p>
            {nextStep && (
              <>
                <p
                  className="text-[var(--text-xs)] font-semibold mt-2 mb-0.5"
                  style={{ color: "var(--luma-text-secondary)" }}
                >
                  Suggested next step
                </p>
                <p
                  className="text-[var(--text-xs)] leading-snug"
                  style={{ color: "var(--luma-text-primary)" }}
                >
                  {nextStep}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </span>
  );
}

export interface EmailRowProps {
  task:              Task;
  isSelected:        boolean;
  onSelect:          (task: Task) => void;
  /** When true, the priority badge (Action/Urgent/Later/News) is hidden. */
  hidePriorityBadge?: boolean;
  /**
   * When provided (Focus Now only), replaces the Urgent/Action pill with a
   * short human-readable reason label + "Why LUMA?" tooltip.
   * The agent's urgency/priority data is still used internally for sorting.
   */
  focusReason?: {
    label:    string;
    whyText:  string;
    nextStep: string | null;
  };
}

export function EmailRow({ task, isSelected, onSelect, hidePriorityBadge, focusReason }: EmailRowProps) {
  const tag = getPillConfig(task.priority, task.urgencyScore);

  /* When focusReason is provided, the aria-label describes the reason
     instead of the internal AI classification label. */
  const rowAriaLabel = focusReason
    ? `${focusReason.label}: ${task.subject} from ${task.sender}`
    : `${tag.label}: ${task.subject} from ${task.sender}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      aria-label={rowAriaLabel}
      aria-pressed={isSelected}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-100",
        "border-b border-[var(--luma-glass-border)] last:border-b-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)] focus-visible:outline-offset-[-2px]",
        isSelected
          ? "bg-[rgba(37,99,235,0.06)]"
          : "hover:bg-[rgba(37,99,235,0.03)]",
      )}
    >
      {/* Avatar */}
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

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[var(--text-sm)] font-bold truncate"
            style={{ color: "var(--luma-text-primary)" }}
          >
            {task.sender}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {focusReason ? null : (!hidePriorityBadge && (
              <span
                className="px-2.5 py-0.5 rounded-[var(--radius-full)] text-[var(--text-xs)] font-semibold"
                style={{ background: tag.bg, color: tag.color }}
              >
                {tag.label}
              </span>
            ))}
            <span
              className="text-[var(--text-xs)] tabular-nums"
              style={{ color: "var(--luma-text-tertiary)" }}
            >
              {task.time}
            </span>
          </div>
        </div>

        <span
          className="text-[var(--text-xs)] font-medium truncate"
          style={{ color: "var(--luma-text-primary)" }}
        >
          {task.subject}
        </span>

        {focusReason ? (
          <ReasonLabel
            label={focusReason.label}
            whyText={focusReason.whyText}
            nextStep={focusReason.nextStep}
          />
        ) : (
          <span
            className="text-[var(--text-xs)] truncate"
            style={{ color: "var(--luma-text-tertiary)" }}
          >
            {task.preview}
          </span>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight
        size={15}
        strokeWidth={1.5}
        className="shrink-0"
        style={{ color: "var(--luma-text-tertiary)" }}
        aria-hidden="true"
      />
    </button>
  );
}
