import type { Task, LaterItem, NextStep } from "@/types/dashboard";

/* ═══════════════════════════════════════════════
   Static demo dashboard data
   Matches the reference design: 3 attention tasks,
   1 next step, 2 later items, 1 brief sentence.
   ═══════════════════════════════════════════════ */

export const DAILY_BRIEF =
  "A client approval and school form are due today. A property issue needs attention.";

export const ATTENTION_TASKS: Task[] = [
  {
    id: "t1",
    title: "Client proposal approval",
    category: "Work",
    dueLabel: "Due today · 3 PM",
    dueUrgent: true,
    description: "The client is waiting before work can start.",
    iconVariant: "doc",
    primaryAction: "Review draft",
  },
  {
    id: "t2",
    title: "School permission form",
    category: "Family",
    dueLabel: "Due today · 5 PM",
    dueUrgent: true,
    description: "Permission is required for the field trip.",
    iconVariant: "people",
    primaryAction: "View next step",
  },
  {
    id: "t3",
    title: "Water leak at Oak Court",
    category: "Property",
    dueLabel: "Needs attention",
    dueUrgent: false,
    description: "An active leak was reported in unit 204.",
    iconVariant: "home",
    primaryAction: "Review next step",
  },
];

export const NEXT_STEP: NextStep = {
  title: "Review the client reply",
  description: "Check the details before approving.",
  ctaLabel: "Review reply",
  helperText: "Sending requires your approval",
  iconVariant: "doc",
};

export const LATER_ITEMS: LaterItem[] = [
  { id: "l1", label: "Weekly newsletter", iconVariant: "mail" },
  { id: "l2", label: "Monthly property report", iconVariant: "chart" },
];
