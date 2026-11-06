"use client";

/* ─────────────────────────────────────────────────────────────────
   DoneCard
   ─────────────────────────────────────────────────────────────────
   Collapsed by default — shows a "Done · N" header pill.
   Clicking it expands to reveal completed email rows (read-only,
   muted strikethrough style — they cannot re-enter Focus Now).
   ───────────────────────────────────────────────────────────────── */

import { useState }        from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import type { Task }       from "@/types/dashboard";

export interface DoneCardProps {
  tasks: Task[];
}

export function DoneCard({ tasks }: DoneCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div
      className="rounded-[var(--radius-2xl)] overflow-hidden"
      style={{
        border:     "1px solid var(--luma-glass-border)",
        background: "rgba(255,255,255,0.35)",
      }}
    >
      {/* ── Header — always visible ── */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="done-card-list"
        className="w-full flex items-center justify-between px-5 py-3.5 text-left
          transition-colors duration-100 hover:bg-[rgba(37,99,235,0.03)]
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]
          focus-visible:outline-offset-[-2px]"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2
            size={15}
            strokeWidth={1.5}
            style={{ color: "rgb(22,163,74)" }}
            aria-hidden="true"
          />
          <span
            className="text-[var(--text-sm)] font-semibold"
            style={{ color: "var(--luma-text-secondary)" }}
          >
            Done
          </span>
          {/* Count badge */}
          <span
            className="px-2 py-0.5 rounded-[var(--radius-full)] text-[var(--text-xs)] font-semibold"
            style={{
              background: "rgba(22,163,74,0.10)",
              color:      "rgb(22,163,74)",
            }}
          >
            {tasks.length}
          </span>
        </div>

        {isOpen
          ? <ChevronUp   size={14} strokeWidth={2} style={{ color: "var(--luma-text-tertiary)" }} aria-hidden="true" />
          : <ChevronDown size={14} strokeWidth={2} style={{ color: "var(--luma-text-tertiary)" }} aria-hidden="true" />}
      </button>

      {/* ── Expanded list ── */}
      {isOpen && (
        <div
          id="done-card-list"
          role="list"
          aria-label="Completed emails"
          style={{ borderTop: "1px solid var(--luma-glass-border)" }}
        >
          {tasks.map((task) => (
            <div
              key={task.id}
              role="listitem"
              className="flex items-center gap-3 px-5 py-3.5
                border-b border-[var(--luma-glass-border)] last:border-b-0"
            >
              {/* Done checkmark */}
              <CheckCircle2
                size={14}
                strokeWidth={1.5}
                style={{ color: "rgba(22,163,74,0.55)", flexShrink: 0 }}
                aria-hidden="true"
              />

              {/* Avatar */}
              <div
                className="shrink-0 w-7 h-7 rounded-[var(--radius-full)] flex items-center
                  justify-center text-[10px] font-bold select-none"
                style={{
                  background: "rgba(0,0,0,0.05)",
                  color:      "var(--luma-text-tertiary)",
                }}
                aria-hidden="true"
              >
                {task.senderInitial}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[var(--text-xs)] font-semibold truncate"
                  style={{
                    color:          "var(--luma-text-tertiary)",
                    textDecoration: "line-through",
                    textDecorationColor: "rgba(0,0,0,0.2)",
                  }}
                >
                  {task.subject}
                </p>
                <p
                  className="text-[var(--text-2xs)] truncate mt-0.5"
                  style={{ color: "var(--luma-text-tertiary)" }}
                >
                  {task.sender}
                </p>
              </div>

              {/* Time */}
              <span
                className="text-[var(--text-2xs)] tabular-nums shrink-0"
                style={{ color: "var(--luma-text-tertiary)" }}
              >
                {task.time}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
