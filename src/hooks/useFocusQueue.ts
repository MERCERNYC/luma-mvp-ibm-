"use client";

/* ═══════════════════════════════════════════════════════════════
   useFocusQueue
   ───────────────────────────────────────────────────────────────
   Manages the Focus Now window — the ordered slice of up to
   FOCUS_LIMIT tasks shown at the top of the dashboard.

   Eligibility rule
   ────────────────
   Only "action-needed" tasks enter Focus Now.
   "for-later" and "news-updates" are NEVER promoted to fill slots.
   Focus Now is a ceiling (max FOCUS_LIMIT), not a quota.

   Session contract
   ────────────────
   • On load (or after "Prioritize Again") a window of up to
     FOCUS_LIMIT qualifying tasks is captured as a stable snapshot.
   • Completing a task removes it from that snapshot immediately.
   • No new task fills the vacated slot during the same session.
     The count simply decrements from N → 0.
   • When count reaches 0 (or was 0 from the start) the caller
     receives isCaughtUp = true and renders "✨ You're caught up".
   • "Prioritize Again" redraws the window from the current
     un-done qualifying tasks, giving the user a fresh batch.

   V2 compatibility
   ────────────────
   The hook is inbox-agnostic — it only cares about Task[], doneIds,
   and generation.  It will work identically with Gmail tasks.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import type { Task }                   from "@/types/dashboard";
import { FOCUS_LIMIT }                 from "@/hooks/useClassifiedEmails";

/** The only priority that qualifies a task for Focus Now. */
const FOCUS_ELIGIBLE = "action-needed" as const;

export interface UseFocusQueueResult {
  /**
   * The current Focus Now slice — at most FOCUS_LIMIT items,
   * shrinks as the user completes tasks, never grows mid-session.
   * Every item has priority === "action-needed".
   */
  focusTasks:  Task[];
  /**
   * All active (un-done) tasks — used for category cards and counts.
   */
  activeTasks: Task[];
  /**
   * True when classification is ready AND either:
   *   (a) all tasks in the captured window are done, or
   *   (b) there were no qualifying tasks at all.
   */
  isCaughtUp:  boolean;
  /**
   * The number of tasks in the initial Focus Now window for this
   * session — fixed at capture time, used to render "X of Y left".
   * May be less than FOCUS_LIMIT when the inbox has fewer qualifying emails.
   */
  windowSize:  number;
}

export function useFocusQueue(
  allTasks:   Task[],      // full classified+sorted task list
  doneIds:    Set<string>, // from useDoneEmails
  generation: number,      // bumps on "Prioritize Again"
  isReady:    boolean,     // true once classification is complete
): UseFocusQueueResult {

  // Stable snapshot of IDs in the current Focus Now window.
  // Captured once per (isReady=true, generation) pair and never
  // modified mid-session — tasks only leave via doneIds.
  const [windowIds, setWindowIds] = useState<string[]>([]);

  // Tracks which (generation, ready) pair the current window was built for,
  // so we only rebuild when the generation bumps or on first load.
  const builtForRef = useRef<{ generation: number; ready: boolean }>({
    generation: -1,
    ready:      false,
  });

  useEffect(() => {
    if (!isReady) return;

    const alreadyBuilt =
      builtForRef.current.ready === true &&
      builtForRef.current.generation === generation;

    if (alreadyBuilt) return;

    // Draw up to FOCUS_LIMIT qualifying tasks from the sorted list.
    // ONLY action-needed tasks qualify — for-later and news-updates are
    // never used to fill empty slots, regardless of how few action items exist.
    const ids = allTasks
      .filter((t) => !doneIds.has(t.id) && t.priority === FOCUS_ELIGIBLE)
      .slice(0, FOCUS_LIMIT)
      .map((t) => t.id);

    setWindowIds(ids);
    builtForRef.current = { generation, ready: true };
  }, [isReady, generation, allTasks, doneIds]);

  // All un-done tasks — for category cards and counts.
  const activeTasks = allTasks.filter((t) => !doneIds.has(t.id));

  // Focus tasks = window snapshot filtered to un-done, eligible tasks only.
  // The priority re-check here is a defence-in-depth guard: it ensures that
  // even if a task's priority was somehow changed after the window was built
  // (e.g. via an override), non-qualifying tasks can never appear in Focus Now.
  const focusTasks = windowIds
    .filter((id) => !doneIds.has(id))
    .map((id)    => allTasks.find((t) => t.id === id))
    .filter((t): t is Task => t !== undefined && t.priority === FOCUS_ELIGIBLE);

  // isCaughtUp: classification is done, window was captured, and either
  // the inbox had no qualifying emails or the user has finished them all.
  const windowBuilt = builtForRef.current.ready;
  const isCaughtUp  =
    isReady &&
    windowBuilt &&
    (windowIds.length === 0 || windowIds.every((id) => doneIds.has(id)));

  return { focusTasks, activeTasks, isCaughtUp, windowSize: windowIds.length };
}
