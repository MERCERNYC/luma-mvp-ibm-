"use client";

/* ═══════════════════════════════════════════════════════════════
   LaterCard
   ───────────────────────────────────────────────────────────────
   ADHD-friendly "For Later" section.

   Collapsed (default)
   ───────────────────
   • Title "Later" + count badge
   • Reassuring copy: "Safe to ignore for now"
   • Peek at the single next item (subject + sender)
   • "View Later →" button to expand

   Expanded
   ────────
   • Same header with "Collapse" button
   • Full email list (same EmailRow used by CategoryCard)
   • Visually quieter than Focus Now / Action Needed:
     - dimmer border opacity
     - no accent bar
     - muted text hierarchy
   ═══════════════════════════════════════════════════════════════ */

import { useState }                   from "react";
import { ChevronDown, ChevronUp }     from "lucide-react";
import { EmailRow }                   from "@/components/email/EmailRow";
import type { Task }                  from "@/types/dashboard";

interface LaterCardProps {
  tasks:    Task[];
  selected: Task | null;
  onSelect: (t: Task) => void;
  onClose:  () => void;
}

const ACCENT      = "var(--luma-later)";        // amber token
const ACCENT_SOFT = "rgba(217,119,6,0.05)";

export function LaterCard({ tasks, selected, onSelect, onClose }: LaterCardProps) {
  const [expanded, setExpanded] = useState(false);

  const nextTask = tasks[0] ?? null;

  return (
    <div
      className="glass rounded-[var(--radius-2xl)] overflow-hidden"
      style={{
        border:     "1px solid rgba(217,119,6,0.22)",
        background: ACCENT_SOFT,
        transition: "background 200ms ease",
      }}
      role="region"
      aria-label="Later emails"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3 gap-3">

        {/* Left: title + count + reassurance */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2
              className="text-[var(--text-base)] font-bold"
              style={{ color: "var(--luma-text-primary)" }}
            >
              Later
            </h2>
            {/* Count badge — muted amber */}
            <span
              className="text-[var(--text-xs)] font-semibold px-2 py-0.5 rounded-[var(--radius-full)] tabular-nums"
              style={{
                background: "rgba(217,119,6,0.12)",
                color:      ACCENT,
              }}
              aria-label={`${tasks.length} emails`}
            >
              {tasks.length}
            </span>
          </div>

          {/* Reassurance copy — this is the ADHD-friendly signal */}
          <p
            className="text-[var(--text-xs)] font-medium"
            style={{ color: "var(--luma-text-secondary)" }}
          >
            Safe to ignore for now
          </p>
          <p
            className="text-[var(--text-xs)]"
            style={{ color: "var(--luma-text-tertiary)" }}
          >
            Nothing here needs you today.
          </p>

          {/* Next item peek — only when collapsed and there are tasks */}
          {!expanded && nextTask && (
            <div
              className="mt-2 flex flex-col gap-0.5"
              aria-label="Next later email"
            >
              <p
                className="text-[var(--text-xs)] font-medium truncate"
                style={{ color: "var(--luma-text-secondary)" }}
              >
                <span style={{ color: "var(--luma-text-tertiary)" }}>Next: </span>
                {nextTask.subject}
              </p>
              <p
                className="text-[var(--text-xs)]"
                style={{ color: "var(--luma-text-tertiary)" }}
              >
                {nextTask.sender} · {nextTask.time}
              </p>
            </div>
          )}
        </div>

        {/* Right: expand / collapse controls */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Close (collapse back to summary tile) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Later"
            className="flex items-center gap-1 text-[var(--text-xs)] font-medium
              transition-opacity duration-100 hover:opacity-70
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
            style={{ color: "var(--luma-text-tertiary)" }}
          >
            <ChevronUp size={13} strokeWidth={2} aria-hidden="true" />
            Close
          </button>

          {/* View / collapse list */}
          {tasks.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-controls="later-email-list"
              className="flex items-center gap-1 text-[var(--text-xs)] font-semibold
                transition-opacity duration-100 hover:opacity-75
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
              style={{ color: ACCENT }}
            >
              {expanded ? (
                <>
                  <ChevronUp size={13} strokeWidth={2} aria-hidden="true" />
                  Hide
                </>
              ) : (
                <>
                  View Later
                  <ChevronDown size={13} strokeWidth={2} aria-hidden="true" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded email list ── */}
      {expanded && (
        <div
          id="later-email-list"
          role="list"
          aria-label="Later email list"
        >
          {tasks.length === 0 ? (
            <p
              className="px-5 py-5 text-[var(--text-sm)]"
              style={{ color: "var(--luma-text-tertiary)" }}
            >
              No emails here right now.
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
      )}
    </div>
  );
}
