import type { Task } from "@/types/dashboard";

/* ═══════════════════════════════════════════════
   Static demo email data
   3 emails matching the reference image.
   Priority tags: "action-needed" / "for-later" / "news-updates"

   receivedAt — Unix ms. Anchor: Nov 6 2024 09:00 AM PST = 1730912400000
   ═══════════════════════════════════════════════ */

// Nov 6 2024 09:00 AM PST
const D0 = 1730912400000;
const H  = 3600000; // 1 hour in ms

export const DEMO_TASKS: Task[] = [
  {
    id: "e1",
    priority: "action-needed",
    sender: "Dani (Teacher)",
    senderEmail: "dani@school.edu",
    senderInitial: "D",
    avatarColor: "purple",
    subject: "5th Grade – Permission Form",
    preview: "Hi Sofia, I wanted to let you know about the field trip next…",
    body: "Hi Sofia,\n\nI wanted to let you know about the field trip next Friday. We will be visiting the Science Museum. Please review and complete the permission form by Wednesday.\n\nLet me know if you have any questions!\n\nBest,\nDani",
    time: "9:24 AM",
    receivedAt: D0 + 0.4 * H,   // 9:24 AM today
    attachment: {
      name: "Field Trip Permission Form.pdf",
      meta: "PDF · 248 KB",
    },
  },
  {
    id: "e2",
    priority: "for-later",
    sender: "Team Meeting",
    senderEmail: "calendar@company.com",
    senderInitial: "T",
    avatarColor: "blue",
    subject: "Agenda for tomorrow",
    preview: "Here is the agenda for tomorrow's meeting. Please take a look…",
    body: "Hi,\n\nPlease find the agenda for tomorrow's team meeting attached. We'll be covering Q4 planning, design review, and open issues.\n\nSee you then.",
    time: "8:12 AM",
    receivedAt: D0 - 0.8 * H,   // 8:12 AM today
  },
  {
    id: "e3",
    priority: "news-updates",
    sender: "Amazon",
    senderEmail: "shipment-tracking@amazon.com",
    senderInitial: "A",
    avatarColor: "orange",
    subject: "Your order has shipped",
    preview: "Your order #123-456789 is on the way. It will arrive by Thursday…",
    body: "Good news! Your order #123-456789 has shipped and is on its way.\n\nEstimated delivery: Thursday by 8 PM.\n\nYou can track your package using the link below.",
    time: "7:03 AM",
    receivedAt: D0 - 1.95 * H,  // 7:03 AM today
  },
];

export const GREETING_NAME = "Sofia";
export const ATTENTION_COUNT = DEMO_TASKS.filter(t => t.priority === "action-needed").length;
