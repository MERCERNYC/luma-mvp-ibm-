"use client";

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

// urgencyScore threshold above which action-needed emails get the URGENT label
const URGENT_THRESHOLD = 0.9;

/**
 * Derive the pill label from priority + urgencyScore.
 *   action-needed + score ≥ 0.9  → URGENT  (red)
 *   action-needed + score < 0.9  → ACTION  (purple)
 *   for-later                    → LATER   (amber)
 *   news-updates                 → NEWS    (grey)
 */
export function getPillConfig(
  priority:     TaskPriority,
  urgencyScore?: number,
): { label: string; color: string; bg: string } {
  if (priority === "action-needed") {
    const score = urgencyScore ?? 0;
    return score >= URGENT_THRESHOLD
      ? { label: "Urgent",  color: "#dc2626", bg: "rgba(220,38,38,0.10)" }
      : { label: "Action",  color: "var(--luma-action)", bg: "var(--luma-action-soft)" };
  }
  if (priority === "for-later") {
    return { label: "Later", color: "#b45309", bg: "rgba(245,158,11,0.12)" };
  }
  return { label: "News", color: "var(--luma-text-tertiary)", bg: "rgba(100,116,139,0.10)" };
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

export interface EmailRowProps {
  task:         Task;
  urgencyScore?: number;
  isSelected:   boolean;
  onSelect:     (task: Task) => void;
}

export function EmailRow({ task, urgencyScore, isSelected, onSelect }: EmailRowProps) {
  const tag = getPillConfig(task.priority, urgencyScore);

  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      aria-label={`${tag.label}: ${task.subject} from ${task.sender}`}
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
            <span
              className="px-2.5 py-0.5 rounded-[var(--radius-full)] text-[var(--text-xs)] font-semibold"
              style={{ background: tag.bg, color: tag.color }}
            >
              {tag.label}
            </span>
            <span
              className="text-[var(--text-xs)] tabular-nums"
              style={{ color: "var(--luma-text-tertiary)" }}
            >
              {task.time}
            </span>
          </div>
        </div>

        <span
          className="text-[var(--text-sm)] font-medium truncate"
          style={{ color: "var(--luma-text-primary)" }}
        >
          {task.subject}
        </span>

        <span
          className="text-[var(--text-xs)] truncate"
          style={{ color: "var(--luma-text-tertiary)" }}
        >
          {task.preview}
        </span>
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
