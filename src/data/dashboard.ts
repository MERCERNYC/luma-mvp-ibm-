import type { Task } from "@/types/dashboard";

/* ═══════════════════════════════════════════════
   Static demo email data — v3
   6 emails across all three priority buckets.
   Date: 2025-01-27 (Monday morning)
   ═══════════════════════════════════════════════ */

export const DEMO_TASKS: Task[] = [
  /* ── Action Needed ─────────────────────────── */
  {
    id: "e1",
    priority: "action-needed",
    isRead: false,
    date: "2025-01-27T09:24:00",
    sender: "Dani (Teacher)",
    senderEmail: "dani@school.edu",
    senderInitial: "D",
    avatarColor: "purple",
    subject: "5th Grade – Permission Form",
    preview: "Hi Sofia, I wanted to let you know about the field trip next…",
    body: "Hi Sofia,\n\nI wanted to let you know about the field trip next Friday. We will be visiting the Science Museum. Please review and complete the permission form by Wednesday.\n\nLet me know if you have any questions!\n\nBest,\nDani",
    time: "9:24 AM",
    attachment: {
      name: "Field Trip Permission Form.pdf",
      meta: "PDF · 248 KB",
    },
  },
  {
    id: "e2",
    priority: "action-needed",
    isRead: false,
    date: "2025-01-27T08:47:00",
    sender: "Dr. Reyes",
    senderEmail: "reyes@citymedical.com",
    senderInitial: "R",
    avatarColor: "blue",
    subject: "Appointment Reminder — Tomorrow 2 PM",
    preview: "Just a reminder that you have an annual checkup scheduled for…",
    body: "Hi Sofia,\n\nThis is a reminder that you have an annual checkup scheduled for tomorrow, January 28th at 2:00 PM.\n\nPlease arrive 10 minutes early to complete intake paperwork. If you need to reschedule, reply to this email.\n\nSee you tomorrow,\nDr. Reyes' Office",
    time: "8:47 AM",
  },

  /* ── For Later ──────────────────────────────── */
  {
    id: "e3",
    priority: "for-later",
    isRead: true,
    date: "2025-01-27T08:12:00",
    sender: "Team Meeting",
    senderEmail: "calendar@company.com",
    senderInitial: "T",
    avatarColor: "blue",
    subject: "Agenda for tomorrow",
    preview: "Here is the agenda for tomorrow's meeting. Please take a look…",
    body: "Hi,\n\nPlease find the agenda for tomorrow's team meeting attached. We'll be covering Q4 planning, design review, and open issues.\n\nSee you then.",
    time: "8:12 AM",
  },
  {
    id: "e4",
    priority: "for-later",
    isRead: true,
    date: "2025-01-27T07:55:00",
    sender: "Marcus (HOA)",
    senderEmail: "marcus@greenviewhoa.org",
    senderInitial: "M",
    avatarColor: "green",
    subject: "Monthly newsletter — January",
    preview: "Welcome to the January HOA newsletter. This month we cover the…",
    body: "Hi Neighbors,\n\nWelcome to the January HOA newsletter.\n\nThis month: new parking rules take effect February 1st, the community clean-up day is Saturday the 1st, and pool hours shift to 8 AM–9 PM.\n\nFull details attached.\n\nMarcus\nGreenview HOA Board",
    time: "7:55 AM",
    attachment: {
      name: "January-HOA-Newsletter.pdf",
      meta: "PDF · 512 KB",
    },
  },

  /* ── News & Updates ─────────────────────────── */
  {
    id: "e5",
    priority: "news-updates",
    isRead: true,
    date: "2025-01-27T07:03:00",
    sender: "Amazon",
    senderEmail: "shipment-tracking@amazon.com",
    senderInitial: "A",
    avatarColor: "orange",
    subject: "Your order has shipped",
    preview: "Your order #123-456789 is on the way. It will arrive by Thursday…",
    body: "Good news! Your order #123-456789 has shipped and is on its way.\n\nEstimated delivery: Thursday by 8 PM.\n\nYou can track your package using the link below.",
    time: "7:03 AM",
  },
  {
    id: "e6",
    priority: "news-updates",
    isRead: true,
    date: "2025-01-27T06:30:00",
    sender: "LinkedIn",
    senderEmail: "notifications@linkedin.com",
    senderInitial: "L",
    avatarColor: "blue",
    subject: "3 people viewed your profile this week",
    preview: "Your profile is getting noticed. See who's been looking…",
    body: "Hi Sofia,\n\nYour profile got 3 views this week — up 50% from last week.\n\nYou might want to update your headline and add your latest project to keep momentum going.\n\nThe LinkedIn Team",
    time: "6:30 AM",
  },
];

export const GREETING_NAME = "Sofia";

/** Count of unread action-needed emails — drives the dashboard headline */
export const ATTENTION_COUNT = DEMO_TASKS.filter(
  (t) => t.priority === "action-needed" && !t.isRead,
).length;

/** AI-generated daily brief — one calm orienting sentence */
export const DAILY_BRIEF =
  "A permission form and a doctor's appointment need your sign-off today — everything else can wait.";
