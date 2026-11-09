"use client";

/* ═══════════════════════════════════════════════════════════════
   useDoneEmails
   ───────────────────────────────────────────────────────────────
   Owns the "completed" state for LUMA email items.

   Persistence
   ───────────
   localStorage key: "luma_done_ids"
   Value: JSON array of task-id strings

   On mount the hook hydrates from localStorage so completed emails
   survive a page refresh and never re-enter Focus Now.

   Prioritize Again
   ────────────────
   Calling prioritizeAgain() does NOT un-complete emails — it only
   bumps the session generation counter so useFocusQueue knows to
   draw a fresh window of unfinished tasks.

   V2 compatibility
   ────────────────
   This hook is inbox-agnostic.  It works with the demo evaluation
   dataset today and will work identically with live Gmail tasks
   once those are wired in.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "luma_done_ids";

// ── localStorage helpers ─────────────────────────────────────────

function readDoneIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeDoneIds(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* quota exceeded or private mode — ignore */
  }
}

// ── Public interface ─────────────────────────────────────────────

export interface UseDoneEmailsResult {
  /** IDs of all emails the user has marked done (persisted across sessions). */
  doneIds:         Set<string>;
  /** Mark one email as done. Idempotent. */
  markDone:        (taskId: string) => void;
  /**
   * Generation counter — increments each time the user clicks
   * "Prioritize Again".  Consumers (useFocusQueue) watch this value
   * to know when to draw a fresh Focus Now window.
   * Completed emails are NEVER re-added by this action.
   */
  generation:      number;
  prioritizeAgain: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────

export function useDoneEmails(): UseDoneEmailsResult {
  // Lazy-init from localStorage
  const [doneIds,    setDoneIds]    = useState<Set<string>>(() => new Set());
  const [generation, setGeneration] = useState(0);
  const [hydrated,   setHydrated]   = useState(false);

  // Hydrate from localStorage on first client render only
  useEffect(() => {
    if (!hydrated) {
      setDoneIds(readDoneIds());
      setHydrated(true);
    }
  }, [hydrated]);

  const markDone = useCallback((taskId: string) => {
    setDoneIds((prev) => {
      if (prev.has(taskId)) return prev; // already done — no-op
      const next = new Set(prev);
      next.add(taskId);
      writeDoneIds(next);
      return next;
    });
  }, []);

  const prioritizeAgain = useCallback(() => {
    setGeneration((g) => g + 1);
  }, []);

  return { doneIds, markDone, generation, prioritizeAgain };
}
