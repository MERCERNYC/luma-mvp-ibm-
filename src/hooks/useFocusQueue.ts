"use client";

/* ═══════════════════════════════════════════════════════════════
   useFocusQueue
   ───────────────────────────────────────────────────────────────
   Manages the Focus Now window — the ordered slice of up to
   FOCUS_LIMIT tasks shown at the top of the dashboard.

   Session contract
   ────────────────
   • On load (or after "Prioritize Again") a window of up to
     FOCUS_LIMIT un-done tasks is captured as a stable snapshot.
   • Completing a task removes it from that snapshot immediately.
   • No new task fills the vacated slot during the same session.
     The count simply decrements from 5 → 0.
   • When count reaches 0 the caller receives isCaughtUp = true
     and can render the "✨ You're caught up" state.
   • "Prioritize Again" (generation bump) redraws the window from
     the current un-done tasks, giving the user a fresh batch.

   V2 compatibility
   ────────────────
   The hook is inbox-agnostic — it only cares about Task[], doneIds,
   and generation.  It will work identically with Gmail tasks.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import type { Task }                   from "@/types/dashboard";
import { FOCUS_LIMIT }                 from "@/hooks/useClassifiedEmails";

export interface UseFocusQueueResult {
  /**
   * The current Focus Now slice — at most FOCUS_LIMIT items,
   * shrinks as the user completes tasks, never grows mid-session.
   */
  focusTasks:     Task[];
  /**
   * All active (un-done) tasks — used for category cards and counts.
   */
  activeTasks:    Task[];
  /**
   * True when every task in the current session window has been done
   * AND the agent has finished loading (status === "ready").
   */
  isCaughtUp:     boolean;
}

export function useFocusQueue(
  allTasks:   Task[],         // full sorted task list from useClassifiedEmails
  doneIds:    Set<string>,    // from useDoneEmails
  generation: number,         // bumps on "Prioritize Again"
  isReady:    boolean,        // true once classification is done
): UseFocusQueueResult {

  // The stable snapshot of IDs in the current Focus Now window.
  // Captured once per (isReady=true, generation) pair.
  const [windowIds, setWindowIds] = useState<string[]>([]);
  // Track which (generation, isReady) combo the window was built from.
  const builtForRef = useRef<{ generation: number; ready: boolean }>({
    generation: -1,
    ready: false,
  });

  useEffect(() => {
    // Only build the window once classification is ready and on each
    // new "prioritize again" generation.
    if (!isReady) return;

    const alreadyBuilt =
      builtForRef.current.ready === true &&
      builtForRef.current.generation === generation;

    if (alreadyBuilt) return;

    // Draw up to FOCUS_LIMIT un-done tasks from the head of the sorted list.
    const ids = allTasks
      .filter((t) => !doneIds.has(t.id))
      .slice(0, FOCUS_LIMIT)
      .map((t) => t.id);

    setWindowIds(ids);
    builtForRef.current = { generation, ready: true };
  }, [isReady, generation, allTasks, doneIds]);

  // Active tasks = all un-done (used for category cards / counts)
  const activeTasks = allTasks.filter((t) => !doneIds.has(t.id));

  // Focus tasks = window snapshot minus any since-completed items
  const focusTasks = windowIds
    .filter((id) => !doneIds.has(id))
    .map((id)    => activeTasks.find((t) => t.id === id))
    .filter((t): t is Task => t !== undefined);

  // Caught up = window was built, classification is ready, and every
  // task in the window is now done.
  const isCaughtUp =
    isReady &&
    windowIds.length > 0 &&
    windowIds.every((id) => doneIds.has(id));

  return { focusTasks, activeTasks, isCaughtUp };
}
