"use client";

/* ═══════════════════════════════════════════════════════════════
   useFeedback
   ───────────────────────────────────────────────────────────────
   Records priority corrections Sofia makes to LUMA's suggestions.

   Storage
   ───────
   Key:   "luma_feedback"
   Value: JSON array of FeedbackCorrection

   Each entry captures:
     taskId       — which email
     lumaOriginal — what the agent suggested
     sofiaChanged — what Sofia chose instead
     timestamp    — when the correction was made

   The hook is intentionally fire-and-forget — it never throws.
   localStorage failures are silently swallowed so a storage quota
   or private-browsing restriction never breaks the UI.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback } from "react";
import type { FeedbackCorrection, TaskPriority } from "@/types/dashboard";

const STORAGE_KEY = "luma_feedback";

function readAll(): FeedbackCorrection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FeedbackCorrection[]) : [];
  } catch {
    return [];
  }
}

function writeAll(corrections: FeedbackCorrection[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(corrections));
  } catch {
    /* quota exceeded or private mode — ignore */
  }
}

export interface UseFeedbackResult {
  /**
   * Record that Sofia changed a task's priority away from LUMA's suggestion.
   * Returns the stored FeedbackCorrection so callers can log/display it.
   */
  recordCorrection: (
    taskId:       string,
    lumaOriginal: TaskPriority,
    sofiaChanged: TaskPriority,
  ) => FeedbackCorrection;

  /** All stored corrections — useful for a future review panel. */
  getAll: () => FeedbackCorrection[];
}

export function useFeedback(): UseFeedbackResult {
  const recordCorrection = useCallback(
    (
      taskId:       string,
      lumaOriginal: TaskPriority,
      sofiaChanged: TaskPriority,
    ): FeedbackCorrection => {
      const entry: FeedbackCorrection = {
        taskId,
        lumaOriginal,
        sofiaChanged,
        timestamp: Date.now(),
      };
      const existing = readAll();
      // Replace any prior correction for this task (last-write wins)
      const updated = existing.filter((c) => c.taskId !== taskId).concat(entry);
      writeAll(updated);
      return entry;
    },
    [],
  );

  const getAll = useCallback((): FeedbackCorrection[] => readAll(), []);

  return { recordCorrection, getAll };
}
