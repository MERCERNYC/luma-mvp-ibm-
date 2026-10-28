/* ═══════════════════════════════════════════════════════════════
   MockAgent
   ───────────────────────────────────────────────────────────────
   A fully deterministic, zero-dependency drop-in for IAgent.

   UNDERSTAND → PRIORITIZE → RECOMMEND
   ─────────────────────────────────────
   Each email passes through three stages:

   1. UNDERSTAND  — determine emailType (communication | notification |
                    promotion | potential_spam) from sender patterns
                    and content signals.

   2. PRIORITIZE  — determine priority (action-needed | for-later |
                    news-updates) based on:
                      • Real deadlines or time-sensitive consequences
                      • Required user action with meaningful consequence
                      • NOT marketing urgency language alone
                      • NOT sender importance alone

   3. RECOMMEND   — generate reason (human-readable) and
                    recommendedAction (single clear step or null).

   CORE DECISION RULE
   ──────────────────
   Urgent (action-needed) requires ALL THREE:
     1. Time sensitivity  — a deadline or window that closes
     2. Meaningful consequence — fee, loss, service interruption,
        safety, missed opportunity with real cost
     3. User attention or action — the user must do something

   Marketing urgency words (LAST CHANCE, ACT NOW, ENDS TODAY,
   URGENT, etc.) never independently cause action-needed.

   Potential spam / suspicious emails are never promoted because
   they contain threatening language.

   SWAPPING IN THE REAL AGENT
   ──────────────────────────
   When WatsonxAgent is ready, replace the provider in AgentService.
   No changes required here or in any route/hook/component.
   ═══════════════════════════════════════════════════════════════ */

import type {
  IAgent,
  ClassifyInput,
  ClassifyResult,
  DailyBriefInput,
  DailyBriefResult,
  EmailType,
} from "./types";
import type { TaskPriority } from "@/types/dashboard";

// ─── Types ───────────────────────────────────────────────────────

interface Decision {
  priority:          TaskPriority;
  emailType:         EmailType;
  requiresAction:    boolean;
  reason:            string;
  recommendedAction: string | null;
  confidence:        number;
  urgencyScore:      number;
  reasoning:         string;
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Lower-case concatenation of all text fields for keyword matching. */
function haystack(input: ClassifyInput): string {
  return [input.subject, input.preview, input.body, input.sender]
    .join(" ")
    .toLowerCase();
}

function has(text: string, ...terms: string[]): boolean {
  return terms.some((t) => text.includes(t));
}

// ─── STAGE 1 — UNDERSTAND ────────────────────────────────────────
// Determine the semantic email type.

/**
 * Promotion senders / domains — marketing that may use urgency language
 * but must never escalate to action-needed based on that alone.
 */
const PROMOTION_SENDER_PATTERNS = [
  "spotify",
  "netflix",
  "target",
  "amazon",
  "costco",
  "crunch",
  "linkedin",
  "doordash",
  "instacart",
  "venmo",
  "headspace",
  "turbotax",
  "aaa",
  "walgreens",
  "apple",
  "kaiser",
  "uber",
  "bankofamerica",
  "slack",
];

/**
 * Notification senders — automated status / transactional updates.
 * These are informational; no action required unless content says otherwise.
 */
const NOTIFICATION_SENDER_PATTERNS = [
  "shipment",
  "tracking",
  "noreply@uber",
  "noreply@doordash",
  "noreply@instacart",
  "noreply@bankofamerica",
  "noreply@apple",
  "noreply@spotify",
  "noreply@target",
  "no-reply@accounts.google",
  "noreply@turbotax",
  "venmo@venmo",
  "hello@headspace",
  "info@mailer.netflix",
  "communications@lausd",
  "alerts@weather",
  "feedback@slack",
];

function detectEmailType(input: ClassifyInput): EmailType {
  const text = haystack(input);
  const senderLower = input.sender.toLowerCase() + " " + input.senderEmail.toLowerCase();

  // Potential spam signals: lottery, prize, Nigerian prince, suspicious urgency
  if (
    has(text, "you have been selected", "claim your prize", "wire transfer",
        "bitcoin", "crypto investment", "nigerian", "foreign funds",
        "won a prize", "lottery winner", "click here to claim")
  ) {
    return "potential_spam";
  }

  // Notification: automated transactional updates (order, receipt, delivery,
  //               sign-in alert, streak, statement ready, account change).
  if (
    has(text,
      "has shipped", "your order", "was delivered", "trip receipt",
      "statement is ready", "statement for", "you earned", "paid you",
      "new sign-in", "new sign in", "you're on a", "you are on a",
      "your ralphs order", "your instacart", "your chipotle",
      "receipt —", "receipt—", "automated receipt",
      "mentioned you in", "school closed", "tax season begins",
      "wind advisory", "advisory is in effect",
      "shows we think", "titles we think",
    )
  ) {
    return "notification";
  }

  // Promotion: marketing / loyalty / recommendations / service offers.
  if (
    has(senderLower, ...PROMOTION_SENDER_PATTERNS) &&
    !has(text,
      "past due", "overdue", "final notice", "action required",
      "response required", "confirm", "expires", "shortage",
      "negative balance", "documentation needed", "unusual activity",
      "cover shift", "swap shift", "authorization form",
      "lapse in coverage", "avoid a lapse",
      "returned to stock", "prescriptions not picked up", "prescription ready",
    )
  ) {
    // Spotify, Netflix, LinkedIn jobs, Crunch Fitness class → promotion
    if (
      has(text,
        "new album", "new on netflix", "shows we think", "job match",
        "jobs match", "new class", "yoga nidra", "safe driver discount",
        "flu shot", "annual flu", "walk-ins welcome",
        "your membership renews", "membership renews next month",
        "ios 18 is available", "software update is available",
        "volunteer sign-up", "volunteer sign up",
        "birthday gift ideas", "street repair", "parking restriction",
        "recertification is due in 60", "recertification due in 60",
      )
    ) {
      return "promotion";
    }
    return "promotion";
  }

  // Default: communication (person/org that expects awareness or reply).
  return "communication";
}

// ─── STAGE 2 — PRIORITIZE ────────────────────────────────────────
// Determine whether the email is action-needed, for-later, or news-updates.
// Notifications are almost always news-updates unless they contain a
// real security/fraud alert.

function prioritize(
  input: ClassifyInput,
  emailType: EmailType,
): Pick<Decision, "priority" | "requiresAction" | "confidence"> {
  const text = haystack(input);

  // Potential spam → never promote, keep for-later with low confidence.
  if (emailType === "potential_spam") {
    return { priority: "for-later", requiresAction: false, confidence: 0.55 };
  }

  // Notifications that are pure status updates → news-updates.
  if (emailType === "notification") {
    // Exception: fraud / unusual activity alerts require user verification.
    if (has(text, "unusual activity", "doesn't match your usual", "dispute")) {
      return { priority: "action-needed", requiresAction: true, confidence: 0.88 };
    }
    // Exception: new sign-in from UNKNOWN pattern → but the dataset labels
    // Google sign-in from own device as news-updates, so we keep it there.
    return { priority: "news-updates", requiresAction: false, confidence: 0.92 };
  }

  // Promotions → never action-needed regardless of marketing urgency words.
  if (emailType === "promotion") {
    // Small window: library hold with explicit hold-expiry could be for-later.
    if (has(text, "your hold is ready", "held until")) {
      return { priority: "for-later", requiresAction: false, confidence: 0.82 };
    }
    // Prescription from pharmacy is communication/action — but already
    // caught above in communication branch.  Pure promotions → for-later.
    return { priority: "for-later", requiresAction: false, confidence: 0.85 };
  }

  // ── Communication: apply the three-part urgency test ─────────────
  //
  // action-needed requires:
  //   1. Time sensitivity
  //   2. Meaningful consequence
  //   3. User must act

  // Hard deadlines + specific consequences.
  if (
    // Due dates with explicit consequence
    has(text, "must be returned by", "cannot attend without",
               "cannot attend", "without it") ||
    // Appointment must confirm same day
    has(text, "confirm or", "confirm by", "need confirmation by",
               "slot will be released") ||
    // Overdue bills with fee/interruption threat
    has(text, "past due", "overdue", "late fee", "service may be interrupted",
               "may be interrupted", "final notice") ||
    // Legal / government response required
    has(text, "response required", "respond by", "sign and return") ||
    // Expired authorisations that block access
    has(text, "authorization form expired", "cannot administer") ||
    // Insurance lapse in near term
    has(text, "lapse in coverage", "avoid a lapse") ||
    // Escrow shortage with payment option
    has(text, "escrow shortage", "additional payment required") ||
    // Prescription expires
    has(text, "returned to stock", "prescriptions not picked up") ||
    // Enrollment closing soon
    has(text, "enrollment closes", "open enrollment", "sign-up form closes",
               "conference slots", "closing tonight", "closing today") ||
    // Registration expires
    has(text, "vehicle registration expires", "registration expires") ||
    // Shift cover with explicit deadline
    has(text, "cover her", "cover shift", "confirm by noon",
               "swap shifts", "let me know by tonight") ||
    // Account balance / service interruption
    has(text, "service may be interrupted", "account past due",
               "outstanding balance", "balance of") &&
      has(text, "november 8", "interrupted", "cut off") ||
    // Lunch account negative (child impact)
    has(text, "negative balance", "alternate meal") ||
    // Documentation needed for active claim
    has(text, "documentation needed", "cannot process your claim",
               "waiting on the repair estimate") ||
    // Unusual financial activity (fraud)
    has(text, "unusual activity", "doesn't match your usual spending")
  ) {
    // Distinguish action-needed from for-later by checking for soft language.
    // "Next month", "60 days", "no action needed" → not urgently action-needed.
    if (
      has(text, "no action needed right now", "no action is needed right now",
                 "60 days", "next month", "december 1st") &&
      !has(text, "overdue", "past due", "expires in", "shortage",
                  "final notice", "unauthorized", "unusual activity",
                  "response required", "respond by", "sign and return")
    ) {
      return { priority: "for-later", requiresAction: false, confidence: 0.80 };
    }

    return { priority: "action-needed", requiresAction: true, confidence: 0.90 };
  }

  // For-later: worth reading, no hard deadline, no concrete near-term consequence.
  return { priority: "for-later", requiresAction: false, confidence: 0.78 };
}

// ─── STAGE 3 — RECOMMEND ─────────────────────────────────────────
// Generate human-readable reason and recommended action.

function recommend(
  input: ClassifyInput,
  decision: Pick<Decision, "priority" | "emailType" | "requiresAction">,
): Pick<Decision, "reason" | "recommendedAction"> {
  const text = haystack(input);
  const { priority, requiresAction } = decision;

  if (priority === "news-updates") {
    if (has(text, "has shipped", "your order")) {
      return { reason: "Order update — on its way.", recommendedAction: null };
    }
    if (has(text, "was delivered", "your ralphs order", "your chipotle")) {
      return { reason: "Delivery confirmed.", recommendedAction: null };
    }
    if (has(text, "trip receipt", "receipt —", "receipt—", "automated receipt")) {
      return { reason: "Transaction receipt — no action needed.", recommendedAction: null };
    }
    if (has(text, "statement is ready", "statement for")) {
      return { reason: "Monthly statement is available.", recommendedAction: null };
    }
    if (has(text, "you earned", "circle rewards")) {
      return { reason: "Rewards earned on recent purchases.", recommendedAction: null };
    }
    if (has(text, "paid you")) {
      return { reason: "Payment received.", recommendedAction: null };
    }
    if (has(text, "new sign-in", "new sign in")) {
      return { reason: "New sign-in from a recognised device.", recommendedAction: null };
    }
    if (has(text, "school closed", "veterans day")) {
      return { reason: "School closure notice — no action needed.", recommendedAction: null };
    }
    if (has(text, "mentioned you in")) {
      return { reason: "You were mentioned on Slack.", recommendedAction: null };
    }
    if (has(text, "wind advisory", "advisory is in effect")) {
      return { reason: "Weather advisory for your area tonight.", recommendedAction: null };
    }
    if (has(text, "tax season begins", "irs begins accepting")) {
      return { reason: "Tax season start date — months away.", recommendedAction: null };
    }
    if (has(text, "streak", "you've meditated")) {
      return { reason: "Wellness streak update.", recommendedAction: null };
    }
    if (has(text, "new on netflix", "shows we think")) {
      return { reason: "Content recommendations from Netflix.", recommendedAction: null };
    }
    return { reason: "Status update — no action needed.", recommendedAction: null };
  }

  if (priority === "action-needed" && requiresAction) {
    if (has(text, "permission form", "must be returned by", "cannot attend")) {
      return {
        reason: "Permission form is due before the field trip.",
        recommendedAction: "Complete and return the permission form",
      };
    }
    if (has(text, "confirm", "annual checkup", "slot will be released")) {
      return {
        reason: "Appointment confirmation is needed today.",
        recommendedAction: "Confirm or reschedule the appointment",
      };
    }
    if (has(text, "rent payment", "overdue", "late fee")) {
      return {
        reason: "Rent is past due and a late fee is approaching.",
        recommendedAction: "Make the rent payment",
      };
    }
    if (has(text, "open enrollment", "benefits closes")) {
      return {
        reason: "Benefits enrollment closes Friday.",
        recommendedAction: "Log in and confirm your benefit selections",
      };
    }
    if (has(text, "unusual activity", "doesn't match your usual", "dispute")) {
      return {
        reason: "Unrecognised transaction flagged on your account.",
        recommendedAction: "Review the transaction and dispute if needed",
      };
    }
    if (has(text, "cover shift", "cover her", "confirm by noon")) {
      return {
        reason: "Manager needs shift coverage confirmation by noon.",
        recommendedAction: "Reply to confirm or decline the shift",
      };
    }
    if (has(text, "final notice", "water bill", "past due", "service may be interrupted")) {
      return {
        reason: "Water service may be interrupted if the bill is not paid.",
        recommendedAction: "Pay the water bill",
      };
    }
    if (has(text, "response required", "cp2000", "respond by december")) {
      return {
        reason: "IRS notice requires a response by December 1st.",
        recommendedAction: "Review and respond to the IRS notice",
      };
    }
    if (has(text, "authorization form expired", "cannot administer")) {
      return {
        reason: "Maya's medication authorization has expired.",
        recommendedAction: "Complete and return the medication authorization form",
      };
    }
    if (has(text, "lapse in coverage", "avoid a lapse", "policy renewal", "payment due in")) {
      return {
        reason: "Auto insurance lapses in 5 days if not paid.",
        recommendedAction: "Make the insurance payment",
      };
    }
    if (has(text, "conference slots", "sign-up form closes", "closing tonight")) {
      return {
        reason: "Parent-teacher conference sign-up closes tonight.",
        recommendedAction: "Sign up for a conference slot",
      };
    }
    if (has(text, "prescription ready", "returned to stock", "prescriptions not picked up")) {
      return {
        reason: "Prescription will be returned to stock in 7 days.",
        recommendedAction: "Pick up the prescription",
      };
    }
    if (has(text, "escrow shortage", "additional payment required")) {
      return {
        reason: "Escrow shortage requires payment or your mortgage payment will increase.",
        recommendedAction: "Review the escrow analysis and decide on payment",
      };
    }
    if (has(text, "swap shifts", "let me know by tonight")) {
      return {
        reason: "Co-worker needs a shift swap answer tonight.",
        recommendedAction: "Reply about the shift swap",
      };
    }
    if (has(text, "vehicle registration expires", "registration expires")) {
      return {
        reason: "Vehicle registration expires in 10 days.",
        recommendedAction: "Renew vehicle registration online",
      };
    }
    if (has(text, "account past due", "outstanding balance") &&
        has(text, "november 8", "may be interrupted", "service")) {
      return {
        reason: "Internet service may be interrupted if not paid by November 8th.",
        recommendedAction: "Pay the Comcast bill",
      };
    }
    if (has(text, "negative balance", "alternate meal")) {
      return {
        reason: "Maya's lunch account is negative — meals could be affected.",
        recommendedAction: "Add funds to the school lunch account",
      };
    }
    if (has(text, "documentation needed", "cannot process your claim")) {
      return {
        reason: "Insurance claim is stalled without the required documents.",
        recommendedAction: "Upload the repair estimate and photos",
      };
    }
    // Fallback for action-needed
    return {
      reason: "Action required soon.",
      recommendedAction: "Review and act on this email",
    };
  }

  // for-later
  if (has(text, "staff meeting", "agenda for tomorrow")) {
    return { reason: "Meeting agenda for tomorrow — worth reviewing.", recommendedAction: "Read before the meeting" };
  }
  if (has(text, "thanksgiving", "are you in")) {
    return { reason: "Social invitation — no deadline until next week.", recommendedAction: "Reply when you have a moment" };
  }
  if (has(text, "jobs match", "new jobs match")) {
    return { reason: "Job recommendations — worth reviewing when you have time.", recommendedAction: "Browse the job matches" };
  }
  if (has(text, "your hold is ready", "held until")) {
    return { reason: "Library hold is ready for pickup until November 14th.", recommendedAction: "Pick up the book when convenient" };
  }
  if (has(text, "yoga nidra", "new class")) {
    return { reason: "New fitness class starting next week.", recommendedAction: "Reserve a spot if interested" };
  }
  if (has(text, "new album from", "mitski")) {
    return { reason: "New music release — no action needed.", recommendedAction: "Listen when you feel like it" };
  }
  if (has(text, "call me when you get a chance", "nothing urgent")) {
    return { reason: "Personal message — no urgency.", recommendedAction: "Call when you have a free moment" };
  }
  if (has(text, "performance review", "december 3")) {
    return { reason: "Performance review is scheduled for December — heads-up only.", recommendedAction: "Note the date" };
  }
  if (has(text, "membership renews", "membership renews next month")) {
    return { reason: "Membership auto-renews next month — no action needed unless you want to change it.", recommendedAction: "Review if you want to update your plan" };
  }
  if (has(text, "november newsletter", "classroom newsletter")) {
    return { reason: "Monthly classroom newsletter — informational.", recommendedAction: "Read when you have a moment" };
  }
  if (has(text, "birthday gift", "gift ideas")) {
    return { reason: "Gift brainstorm from family — no deadline.", recommendedAction: "Reply with ideas when you have time" };
  }
  if (has(text, "street repair", "parking restriction", "repaving")) {
    return { reason: "Neighbourhood parking heads-up for next week.", recommendedAction: "Note the parking restrictions" };
  }
  if (has(text, "safe driver discount", "qualify for an additional")) {
    return { reason: "Discount available on your next insurance renewal.", recommendedAction: "Apply the discount before your renewal date" };
  }
  if (has(text, "flu shot", "annual flu", "walk-ins welcome")) {
    return { reason: "Free flu shot available — no deadline.", recommendedAction: "Schedule when convenient" };
  }
  if (has(text, "volunteer sign", "book fair")) {
    return { reason: "Volunteer opportunity for the book fair — optional.", recommendedAction: "Sign up if you want to help" };
  }
  if (has(text, "recertification", "60 days", "no action needed right now")) {
    return { reason: "Benefits recertification in 60 days — no action needed now.", recommendedAction: "Watch for the mail notice" };
  }
  if (has(text, "ios 18", "software update")) {
    return { reason: "Software update available — install when convenient.", recommendedAction: "Update over Wi-Fi when ready" };
  }

  return { reason: "Worth reading when you have a moment.", recommendedAction: "Read later" };
}

// ─── STAGE 4 — URGENCY SCORE ─────────────────────────────────────
// Assigns a 0–1 within-bucket sort key that reflects how soon the
// email actually needs attention.
//
// Rules:
//   action-needed only — scored by deadline proximity.
//     1.0  fraud / security alert, or "today" / "by noon" deadline
//     0.9  "tomorrow" or "end of day today"
//     0.85 "this week" (within ~5 days)
//     0.75 within 10 days
//     0.6  within 30 days
//     0.4  overdue/expired but no longer actionable — suppressed to
//          the bottom of action-needed so live items surface first
//     0.5  default (no clear deadline signal)
//   for-later       → always 0.5
//   news-updates    → always 0.3

function computeUrgencyScore(
  input:    ClassifyInput,
  priority: TaskPriority,
): number {
  if (priority === "news-updates") return 0.3;
  if (priority === "for-later")    return 0.5;

  // action-needed: check deadline signals in the haystack.
  const text = haystack(input);

  // Expired / overdue items that are no longer actionable — push to bottom.
  // These matched action-needed rules (fees, lapses, etc.) but the window
  // has passed and the email no longer requires immediate attention.
  if (
    has(text, "authorization form expired", "expired on october",
               "cannot administer") &&
    !has(text, "please complete", "as soon as possible")
  ) {
    return 0.4;
  }

  // Immediate / same-day — security alerts, "by noon today", "closing tonight"
  if (
    has(text, "unusual activity", "doesn't match your usual spending",
               "dispute", "confirm by noon", "closing tonight",
               "closing today", "by end of day today", "end of day today")
  ) {
    return 1.0;
  }

  // Tomorrow / today deadline
  if (
    has(text, "tomorrow", "by end of day", "by tonight",
               "let me know by tonight", "slot will be released")
  ) {
    return 0.9;
  }

  // This week (within ~5 days)
  if (
    has(text, "this friday", "this week", "closes friday",
               "by friday", "by wednesday", "in 5 days",
               "enrollment closes", "sign-up form closes")
  ) {
    return 0.85;
  }

  // Within 10 days
  if (
    has(text, "in 7 days", "7 days", "expires in 7",
               "in 10 days", "10 days", "november 10",
               "november 12", "november 14", "november 8")
  ) {
    return 0.75;
  }

  // Within 30 days / upcoming month
  if (
    has(text, "november 18", "december 1", "december 1st",
               "next month", "in 60 days", "renews next month",
               "payment due in", "lapse in coverage")
  ) {
    return 0.6;
  }

  return 0.5; // no clear deadline signal
}

// ─── Main classify function ───────────────────────────────────────

function classifySync(input: ClassifyInput): Decision {
  const emailType   = detectEmailType(input);
  const prio        = prioritize(input, emailType);
  const rec         = recommend(input, { ...prio, emailType });
  const urgencyScore = computeUrgencyScore(input, prio.priority);

  // Build the internal reasoning note (dev/debug only).
  const reasoning =
    `emailType=${emailType} priority=${prio.priority} ` +
    `requiresAction=${prio.requiresAction} confidence=${prio.confidence} ` +
    `urgencyScore=${urgencyScore}`;

  return {
    emailType,
    priority:          prio.priority,
    requiresAction:    prio.requiresAction,
    confidence:        prio.confidence,
    urgencyScore,
    reason:            rec.reason,
    recommendedAction: rec.recommendedAction,
    reasoning,
  };
}

// ─── Daily brief templates ───────────────────────────────────────

function buildBrief(
  userName: string,
  actionCount: number,
  laterCount: number,
): string {
  if (actionCount === 0) {
    return `Good morning, ${userName} — your inbox is clear of urgent items today.`;
  }
  if (actionCount === 1) {
    return `Good morning, ${userName} — you have 1 item that needs attention today.`;
  }
  if (actionCount <= 3) {
    return (
      `Good morning, ${userName} — you have ${actionCount} things that need attention today` +
      (laterCount > 0 ? ` and ${laterCount} items to revisit when you have a moment.` : ".")
    );
  }
  return (
    `Good morning, ${userName} — there are ${actionCount} items waiting on you today; ` +
    `tackle the most time-sensitive ones first.`
  );
}

// ─── MockAgent ───────────────────────────────────────────────────

const CLASSIFY_DELAY_MS = 0; // set to 120 to simulate network latency in dev
const BRIEF_DELAY_MS    = 0;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockAgent implements IAgent {
  async classifyEmail(input: ClassifyInput): Promise<ClassifyResult> {
    await delay(CLASSIFY_DELAY_MS);
    return classifySync(input);
  }

  async generateDailyBrief(input: DailyBriefInput): Promise<DailyBriefResult> {
    await delay(BRIEF_DELAY_MS);

    const actionCount = input.emails.filter(
      (e) => e.priority === "action-needed",
    ).length;
    const laterCount = input.emails.filter(
      (e) => e.priority === "for-later",
    ).length;

    return {
      text: buildBrief(input.userName, actionCount, laterCount),
    };
  }
}
