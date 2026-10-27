"use client";

import {
  FileText,
  Users,
  Home,
  Mail,
  Calendar,
  BarChart2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import type { Task, IconVariant } from "@/types/dashboard";

/* ─────────────────────────────────────────────
   TaskCard
   A single item in "Needs your attention".

   Layout (matches reference image):
   [icon]  [title]                  [primary btn]
           [category] [due label]   [view email]
           [description]            [chevron]

   ND rationale:
   — Icon + coloured bg gives instant category cue
   — Primary action button is always the same
     visual weight — no guessing which to click
   — Due label in orange/red only when urgent —
     paired with text, never color alone
   — "View email" secondary is always present
     so user always has an escape hatch
   ───────────────────────────────────────────── */

const ICON_MAP: Record<IconVariant, React.ReactNode> = {
  doc:      <FileText  size={18} strokeWidth={1.5} aria-hidden="true" />,
  people:   <Users     size={18} strokeWidth={1.5} aria-hidden="true" />,
  home:     <Home      size={18} strokeWidth={1.5} aria-hidden="true" />,
  mail:     <Mail      size={18} strokeWidth={1.5} aria-hidden="true" />,
  calendar: <Calendar  size={18} strokeWidth={1.5} aria-hidden="true" />,
  chart:    <BarChart2 size={18} strokeWidth={1.5} aria-hidden="true" />,
};

const ICON_BG: Record<IconVariant, string> = {
  doc:      "rgba(37,99,235,0.10)",
  people:   "rgba(22,163,74,0.10)",
  home:     "rgba(124,58,237,0.10)",
  mail:     "rgba(37,99,235,0.10)",
  calendar: "rgba(37,99,235,0.10)",
  chart:    "rgba(22,163,74,0.10)",
};

const ICON_COLOR: Record<IconVariant, string> = {
  doc:      "var(--luma-blue)",
  people:   "var(--luma-later)",
  home:     "var(--luma-purple)",
  mail:     "var(--luma-blue)",
  calendar: "var(--luma-blue)",
  chart:    "var(--luma-later)",
};

export interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 px-5 py-4",
        "border-b border-[var(--luma-glass-border)] last:border-b-0",
      )}
    >
      {/* Icon */}
      <div
        className="shrink-0 w-10 h-10 rounded-[var(--radius-full)] flex items-center justify-center mt-0.5"
        style={{
          background: ICON_BG[task.iconVariant],
          color: ICON_COLOR[task.iconVariant],
        }}
        aria-hidden="true"
      >
        {ICON_MAP[task.iconVariant]}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <p
          className="text-[var(--text-base)] font-semibold leading-snug"
          style={{ color: "var(--luma-text-primary)" }}
        >
          {task.title}
        </p>

        {/* Tags row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category pill */}
          <span
            className="px-2 py-0.5 rounded-[var(--radius-full)] text-[var(--text-xs)] font-medium"
            style={{
              background: "rgba(37,99,235,0.07)",
              color: "var(--luma-text-secondary)",
            }}
          >
            {task.category}
          </span>

          {/* Due label */}
          {task.dueLabel && (
            <span
              className="text-[var(--text-xs)] font-medium"
              style={{
                color: task.dueUrgent ? "var(--luma-urgent)" : "var(--luma-text-secondary)",
              }}
            >
              {task.dueLabel}
            </span>
          )}
        </div>

        <p
          className="text-[var(--text-sm)]"
          style={{ color: "var(--luma-text-secondary)" }}
        >
          {task.description}
        </p>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex flex-col gap-2 items-stretch min-w-[140px]">
        <Button variant="primary" size="sm">
          {task.primaryAction}
        </Button>
        <Button variant="secondary" size="sm">
          View email
        </Button>
      </div>

      {/* Chevron */}
      <div
        className="shrink-0 self-center"
        style={{ color: "var(--luma-text-tertiary)" }}
        aria-hidden="true"
      >
        <ChevronRight size={16} strokeWidth={1.5} />
      </div>
    </div>
  );
}
