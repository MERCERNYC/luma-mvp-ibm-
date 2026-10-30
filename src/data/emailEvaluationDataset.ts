import type { Task, TaskPriority } from "@/types/dashboard";
import type { EmailType }          from "@/services/agent/types";

/* ═══════════════════════════════════════════════════════════════════
   Session 15 — Watson Evaluation Dataset
   ───────────────────────────────────────────────────────────────────
   Time anchor: Wed Nov 6 2024 09:00 AM PST = 1730912400000
   Day offsets from anchor:
     today     = Wed Nov 6    (±0)
     yesterday = Tue Nov 5    (-86400000)
     Mon       = Nov 4        (-172800000)
     Sun       = Nov 3        (-259200000)
     Sat       = Nov 2        (-345600000)
     Fri       = Nov 1        (-432000000)
     Thu       = Oct 31       (-518400000)
     Wed       = Oct 30       (-604800000)
   ───────────────────────────────────────────────────────────────────
   LABEL DEFINITIONS
   ─────────────────
   EMAIL TYPE  (origin/nature of the message — independent of priority)
     communication = primarily person-to-person correspondence
     notification  = automated/system/organizational alert, reminder,
                     status or account message
     promotion     = marketing or commercial content
     potential_spam = suspicious or potentially unwanted/deceptive content

   IMPORTANT: emailType does NOT determine requiresAction or priority.
     A notification can be urgent.
     A notification can require action.
     A communication can require no action.

   PRIORITY  (expectedPriority field values — post-mapped internal TaskPriority)
     action-needed = attention needed soon + meaningful consequence
                     (agent outputs "urgent" or "action" → mapped here)
     for-later     = personally relevant, no immediate action
                     (agent outputs "later" → mapped here)
     news-updates  = informational/general content
                     (agent outputs "news" → mapped here)

   NOTE: emailType does NOT determine priority.
     A "notification" can be "action-needed".
     A "communication" can be "news-updates".

   ───────────────────────────────────────────────────────────────────
   PURPOSE
   ───────
   Ground-truth fixture for evaluating the watsonx Orchestrate
   luma-classify agent.  Each item carries three extra fields beyond
   the Task shape:

     expectedEmailType      — the correct EmailType label (communication |
                              notification | promotion | potential_spam)
     expectedPriority       — the correct TaskPriority bucket (action-needed |
                              for-later | news-updates)
     expectedRequiresAction — whether the user must do something (true | false)

   These are NOT produced by the agent; they are the human-annotated
   answers the evaluation harness compares against.

   ───────────────────────────────────────────────────────────────────
   DESIGN PHILOSOPHY — DELIBERATELY DIFFICULT
   ──────────────────────────────────────────
   Each category is chosen to probe a specific failure mode:

   • Urgent (5)          — real same-day / next-day deadlines with
                           consequences; agent must escalate these.
   • Action-needed (10)  — genuine deadlines but not same-day; agent
                           must not confuse them with for-later.
   • Notification (7)    — automated status updates, some requiring
                           action; agent must not conflate origin with
                           priority.
   • Trusted / no deadline (6) — known senders, warm tone, nothing due;
                           agent must resist the friendly-sender bias.
   • Fake-urgency promos (6) — marketing copy with URGENT / LAST CHANCE
                           language; agent must never escalate promotions.
   • Potential spam (5)  — phishing, spoofing, one-hour deadlines from
                           unknown domains; agent must detect these.
   • Newsletters (5)     — informational updates from real orgs; no action.
   • Ambiguous (6)       — vague subject, missing context, or low signal;
                           agent should land conservatively in for-later.

   Total: 50 emails
   ───────────────────────────────────────────────────────────────────
   COVERAGE
   ────────
   action-needed   15 emails  (30 %)   ← urgent (5) + action (10)
   for-later       12 emails  (24 %)   ← trusted (6) + ambiguous (6)
   news-updates    23 emails  (46 %)   ← notification (7) + newsletters (5) + 11 promos/spam
   ─────────────────────────────────────────────────────────
   Total           50 emails

   requiresAction = true  → 15 emails (all action-needed; emailType may be
                             communication OR notification)
   requiresAction = false → 35 emails
   ═══════════════════════════════════════════════════════════════════ */

// ─── Evaluation item type ────────────────────────────────────────

export interface EvalEmail {
  // ── Input fields (passed verbatim to classifyEmail) ─────────────
  id:          string;
  sender:      string;
  senderEmail: string;
  subject:     string;
  preview:     string;
  body:        string;
  receivedAt:  number;

  // ── Ground-truth labels ─────────────────────────────────────────
  expectedEmailType:      EmailType;
  expectedPriority:       TaskPriority;
  expectedRequiresAction: boolean;

  // ── Human annotation note (not passed to agent) ─────────────────
  note: string;
}

// ─── Time anchor ────────────────────────────────────────────────
const T = 1730912400000; // Wed Nov 6 2024 09:00 AM PST

export const WATSON_EVAL_EMAILS: EvalEmail[] = [

  // ══════════════════════════════════════════════════════════════
  // SECTION 1 — URGENT (5)
  // Same-day or next-day deadline with a real consequence.
  // All must resolve to action-needed.
  // ══════════════════════════════════════════════════════════════

  {
    id:          "wx-001",
    sender:      "Ms. Park (Teacher)",
    senderEmail: "s.park@madisonelem.edu",
    subject:     "Permission Slip Due TODAY by 3 PM — Trip Tomorrow",
    preview:     "Hi, we still haven't received Ethan's permission form. The bus leaves…",
    body:        "Hi,\n\nWe still haven't received Ethan's signed permission slip for tomorrow's Natural History Museum trip. The bus leaves at 8 AM sharp.\n\nWithout the form returned by 3 PM today, Ethan cannot board. Please sign the attached PDF and email it back or drop it at the front office.\n\nThank you,\nMs. Park\nMadison Elementary, Room 14",
    receivedAt:  T + 3600000, // 10:00 AM today
    expectedEmailType:      "communication",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "URGENT — same-day hard cutoff with a direct consequence for the child. Classic action-needed pattern.",
  },
  {
    id:          "wx-002",
    sender:      "Chase Bank Security",
    senderEmail: "security-alerts@chase.com",
    subject:     "Fraud Alert: Card Ending 4471 Locked — Confirm or Dispute Now",
    preview:     "We've temporarily locked your card after detecting an unusual $892 charge…",
    body:        "Dear Account Holder,\n\nWe detected a $892.00 charge at an overseas merchant and have temporarily locked your Visa card ending in 4471 as a precaution.\n\nTo unlock your card or dispute the charge, call 1-800-432-3117 or log in at chase.com/fraud within the next 24 hours.\n\nIf no action is taken, the lock will be escalated and a replacement card will be issued (7–10 business days).\n\nChase Fraud Prevention",
    receivedAt:  T - 1800000, // 8:30 AM today
    expectedEmailType:      "notification",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "URGENT — fraud alert with locked card, real financial consequence, 24-hour window. urgencyScore should be 1.0.",
  },
  {
    id:          "wx-003",
    sender:      "Dr. Kim (Pediatrician)",
    senderEmail: "appts@sunvalleypeds.com",
    subject:     "Ethan's Appointment Changed to Tomorrow at 9 AM — Confirm Today",
    preview:     "We had to reschedule Ethan's appointment. Please confirm by end of business today…",
    body:        "Hi,\n\nDue to a scheduling conflict we've moved Ethan's annual checkup to tomorrow, Thursday, November 7th at 9:00 AM.\n\nPlease reply to this email or call (555) 214-0090 by 5 PM today to confirm you can make the new time. If we don't hear back, the slot will be released.\n\nDr. Kim's Office\nSun Valley Pediatrics",
    receivedAt:  T + 7200000, // 11:00 AM today
    expectedEmailType:      "notification",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "URGENT — same-day confirmation cutoff. Inaction loses the appointment slot. emailType=notification: sent from automated appointments system address on behalf of medical office.",
  },
  {
    id:          "wx-004",
    sender:      "HR — Crestline Health",
    senderEmail: "hr@crestlinehealth.org",
    subject:     "Open Enrollment Closes at Midnight Tonight — Select Your 2025 Plan",
    preview:     "This is your final reminder. Open enrollment ends at 11:59 PM tonight…",
    body:        "Hi Jordan,\n\nThis is your final reminder: open enrollment for your 2025 benefits closes at 11:59 PM tonight.\n\nIf you do not make a selection, you will be auto-enrolled in the Basic plan, which does not include dental or vision.\n\nLog in now at benefits.crestlinehealth.org to review and confirm your choices.\n\nHR Benefits Team\nCrestline Health",
    receivedAt:  T + 10800000, // 12:00 PM today
    expectedEmailType:      "notification",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "URGENT — midnight tonight, auto-enrollment in inferior plan if no action. urgencyScore 1.0. emailType=notification: automated HR system sending a deadline reminder.",
  },
  {
    id:          "wx-005",
    sender:      "City Utilities Emergency",
    senderEmail: "emergency@cityutilities.gov",
    subject:     "Water Shutoff Scheduled for Tomorrow 8 AM — Unpaid Balance",
    preview:     "Your account has an overdue balance of $211.40. Water service will be interrupted…",
    body:        "Dear Jordan Ellis,\n\nYour account (#WU-88201) has an overdue balance of $211.40. Water service to your address will be shut off tomorrow, Thursday November 7th, at 8:00 AM unless full payment is received before that time.\n\nPay online at cityutilities.gov, by phone at (555) 900-4000, or in person at our office (open until 6 PM today).\n\nCity Utilities Billing Department",
    receivedAt:  T - 3600000, // 8:00 AM today
    expectedEmailType:      "notification",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "URGENT — next-morning shutoff with payment options today. urgencyScore 0.9. emailType=notification: automated billing system update, origin-channel not person-to-person.",
  },


  // ══════════════════════════════════════════════════════════════
  // SECTION 2 — ACTION-NEEDED, NOT SAME-DAY (10)
  // Real deadlines within days-to-weeks. Must resolve to
  // action-needed but with lower urgencyScore than Section 1.
  // ══════════════════════════════════════════════════════════════

  {
    id:          "wx-006",
    sender:      "Marcus (Manager)",
    senderEmail: "m.hayes@crestlinehealth.org",
    subject:     "Project Proposal Due Next Friday — Need Your Section by Wednesday",
    preview:     "Hey Jordan, the full proposal goes to the board next Friday. I need your…",
    body:        "Hey Jordan,\n\nThe Q1 budget proposal is due to the board next Friday the 15th. I need your staffing section completed and sent to me by Wednesday the 13th so I have time to compile everything.\n\nNothing fancy — two paragraphs on headcount and the rationale. Let me know if you have questions.\n\nMarcus",
    receivedAt:  T - 86400000, // yesterday
    expectedEmailType:      "communication",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "Action-needed — work deliverable with a real Wednesday deadline. Not same-day but consequences are real (board proposal).",
  },
  {
    id:          "wx-007",
    sender:      "DMV",
    senderEmail: "renewal@dmv.ca.gov",
    subject:     "Vehicle Registration Expires in 7 Days — Renew to Avoid Fines",
    preview:     "Your 2019 Toyota Camry (plate 5KHR449) registration expires on Nov 13th…",
    body:        "Dear Jordan Ellis,\n\nYour vehicle registration for your 2019 Toyota Camry (plate 5KHR449) expires on November 13, 2024.\n\nDriving with an expired registration may result in a fine of up to $500. Renew online at dmv.ca.gov, by mail, or at any DMV location.\n\nNote: A smog check may be required before renewal.\n\nCalifornia Department of Motor Vehicles",
    receivedAt:  T - 172800000, // Monday
    expectedEmailType:      "notification",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "Action-needed — 7-day registration deadline with a legal fine consequence. urgencyScore 0.85. emailType=notification: automated government renewal system.",
  },
  {
    id:          "wx-008",
    sender:      "Landlord — Elmwood Properties",
    senderEmail: "leasing@elmwoodproperties.com",
    subject:     "Lease Renewal Decision Required by November 15th",
    preview:     "Your current lease expires December 31st. Please notify us by Nov 15th…",
    body:        "Dear Jordan,\n\nYour lease at 412 Elmwood Drive expires on December 31, 2024. We need your decision to renew or vacate by November 15th.\n\nIf you wish to renew, please sign and return the attached lease addendum. If you plan to vacate, this letter serves as notice to begin re-listing the unit.\n\nPlease contact us at (555) 301-8800 or reply to this email.\n\nElmwood Properties Management",
    receivedAt:  T - 172800000, // Monday
    expectedEmailType:      "communication",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "Action-needed — housing decision with a hard 9-day cutoff. Significant consequence (loss of home).",
  },
  {
    id:          "wx-009",
    sender:      "School Nurse — Madison Elem",
    senderEmail: "nurse@madisonelem.edu",
    subject:     "Ethan's Epipen Authorization Expired — Return Form This Week",
    preview:     "Ethan's emergency medication authorization expired Oct 31. We cannot…",
    body:        "Hi,\n\nEthan's epinephrine auto-injector (EpiPen) authorization form expired on October 31st. Per district policy, we are unable to administer any emergency medication without a current signed form on file.\n\nPlease complete and return the attached form before the end of this week. You may email it back or drop it at the school office.\n\nMadison Elementary School Nurse",
    receivedAt:  T - 86400000, // yesterday
    expectedEmailType:      "communication",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "Action-needed — child safety medication authorization missing, return this week. Real medical consequence.",
  },
  {
    id:          "wx-010",
    sender:      "State Farm Insurance",
    senderEmail: "claims@statefarm.com",
    subject:     "Claim #7701432 — Repair Estimate Needed Within 10 Days",
    preview:     "We're still waiting on your repair estimate to process claim #7701432…",
    body:        "Dear Jordan Ellis,\n\nWe are still waiting on the repair estimate from your chosen auto body shop to move forward with claim #7701432 (incident date: Oct 29, 2024).\n\nWithout this documentation, we cannot issue a payment. Please upload the estimate at statefarm.com/claims or email it to claims@statefarm.com within 10 days of this notice to avoid claim closure.\n\nState Farm Claims Team",
    receivedAt:  T - 86400000, // yesterday
    expectedEmailType:      "notification",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "Action-needed — 10-day window to prevent claim closure. Real financial consequence. urgencyScore 0.75. emailType=notification: automated claims system address.",
  },
  {
    id:          "wx-011",
    sender:      "Principal Davis",
    senderEmail: "rdavis@madisonelem.edu",
    subject:     "Parent-Teacher Conferences Sign-Up Closes This Sunday",
    preview:     "Slots for Nov 18–19 conferences are filling fast. If you haven't signed…",
    body:        "Dear Families,\n\nParent-teacher conference sign-ups for November 18–19 close this Sunday, November 10th, at 11:59 PM. Slots are filling quickly.\n\nIf you haven't reserved your time yet, please visit the school portal at madisonelem.edu/conferences.\n\nPrincipal Davis\nMadison Elementary",
    receivedAt:  T - 86400000, // yesterday
    expectedEmailType:      "communication",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "Action-needed — 4-day sign-up cutoff with genuine scarcity (slots filling). Relevant to child's education.",
  },
  {
    id:          "wx-012",
    sender:      "Walgreens Pharmacy",
    senderEmail: "pharmacy@walgreens.com",
    subject:     "Ethan's Prescription Ready — Held Until November 12th",
    preview:     "Ethan's prescription (Cetirizine 10mg) is ready for pickup at Oak Ave…",
    body:        "Hi Jordan,\n\nEthan's prescription (Cetirizine 10mg / 30-count) is ready for pickup at your Oak Ave Walgreens.\n\nPrescriptions not claimed within 7 days will be returned to stock. Your hold expires November 12th.\n\nWalgreens Pharmacy",
    receivedAt:  T - 172800000, // Monday
    expectedEmailType:      "notification",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "Action-needed — 6-day pickup window for child's medication. Will be returned to stock if ignored.",
  },
  {
    id:          "wx-013",
    sender:      "IRS",
    senderEmail: "noreply@irs.gov",
    subject:     "Response Required — Notice CP503 — Balance Due $347",
    preview:     "We have not received your payment for the balance owed on your 2022…",
    body:        "Dear Taxpayer,\n\nThis is a second notice for the balance of $347.00 owed on your 2022 federal tax return. We have not received payment or a response to our first notice.\n\nPlease pay the balance in full or contact us to set up a payment plan by November 30, 2024 to avoid additional penalties and interest.\n\nInternal Revenue Service\nCP503 Notice",
    receivedAt:  T - 259200000, // Sunday
    expectedEmailType:      "notification",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "Action-needed — 24-day IRS deadline with compounding penalties. Authoritative sender. urgencyScore 0.6. emailType=notification: automated government notice (noreply@irs.gov).",
  },
  {
    id:          "wx-014",
    sender:      "AAA Insurance",
    senderEmail: "renewal@aaa.com",
    subject:     "Auto Policy #BX-221944 Renews in 8 Days — Payment Required",
    preview:     "Your auto insurance policy renews November 14th. To maintain coverage…",
    body:        "Hi Jordan,\n\nYour auto insurance policy #BX-221944 renews on November 14, 2024. To maintain continuous coverage, please ensure your payment of $203.50 is received by the renewal date.\n\nLog in at aaa.com or call (800) 222-4357.\n\nAAA Member Services",
    receivedAt:  T - 172800000, // Monday
    expectedEmailType:      "notification",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "Action-needed — 8-day insurance renewal window. Lapse in coverage is a real consequence. emailType=notification: automated renewal system (renewal@aaa.com).",
  },
  {
    id:          "wx-015",
    sender:      "CalFresh Benefits",
    senderEmail: "noreply@benefitscal.com",
    subject:     "Action Required — CalFresh Recertification Due by November 20th",
    preview:     "Your CalFresh benefits are up for recertification. Failure to complete…",
    body:        "Dear Jordan Ellis,\n\nYour CalFresh benefits are due for recertification by November 20, 2024. Failure to complete recertification will result in termination of your benefits.\n\nComplete your recertification online at benefitscal.com, by phone at (877) 847-3663, or in person at your local county office.\n\nCalifornia Department of Social Services",
    receivedAt:  T - 259200000, // Sunday
    expectedEmailType:      "notification",
    expectedPriority:       "action-needed",
    expectedRequiresAction: true,
    note:        "Action-needed — 14-day government deadline with benefit termination consequence. urgencyScore 0.75. emailType=notification: automated government system (noreply@benefitscal.com).",
  },


  // ══════════════════════════════════════════════════════════════
  // SECTION 3 — LEGITIMATE AUTOMATED NOTIFICATIONS (7)
  // No deadline, no reply needed, purely informational status.
  // Must resolve to news-updates.
  // ══════════════════════════════════════════════════════════════

  {
    id:          "wx-016",
    sender:      "Amazon",
    senderEmail: "shipment-tracking@amazon.com",
    subject:     "Your Order Has Shipped — Arrives Friday",
    preview:     "Your order #112-9938821 is on its way and will arrive by Friday…",
    body:        "Hi Jordan,\n\nYour order #112-9938821 has shipped.\n\nEstimated delivery: Friday, November 8th by 8 PM.\n\nItems: Ethan's science kit, dry-erase markers (4-pack).\n\nTrack your package in the Amazon app or at amazon.com/orders.",
    receivedAt:  T - 3600000, // 8:00 AM today
    expectedEmailType:      "notification",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Legitimate shipping notification. No action — just an FYI. Agent must not escalate.",
  },
  {
    id:          "wx-017",
    sender:      "Bank of America",
    senderEmail: "noreply@bankofamerica.com",
    subject:     "Your November Statement Is Ready",
    preview:     "Your statement for account ending in 6614 is now available in Online…",
    body:        "Hi Jordan,\n\nYour November statement for the account ending in 6614 is now available in Online Banking.\n\nYour statement balance is $1,243.87.\n\nView your statement at bankofamerica.com or in the mobile app.\n\nBank of America",
    receivedAt:  T - 172800000, // Monday
    expectedEmailType:      "notification",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Routine bank statement notification. No payment overdue. Not action-needed — tests agent's ability to distinguish statement availability from bill due.",
  },
  {
    id:          "wx-018",
    sender:      "Uber",
    senderEmail: "noreply@uber.com",
    subject:     "Your Trip Receipt — $11.75",
    preview:     "Thanks for riding with Uber. Here is your receipt for the trip from…",
    body:        "Hi Jordan,\n\nThanks for riding with Uber!\n\nTrip: Oak Ave → Crestline Health Medical Center\nDate: November 5, 7:58 AM\nTotal: $11.75\n\nRate your driver or get help at help.uber.com.\n\nThe Uber Team",
    receivedAt:  T - 86400000, // yesterday
    expectedEmailType:      "notification",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Trip receipt — a pure notification. Nothing to do.",
  },
  {
    id:          "wx-019",
    sender:      "Instacart",
    senderEmail: "noreply@instacart.com",
    subject:     "Your Grocery Order Was Delivered",
    preview:     "Your Instacart order from Trader Joe's was delivered today at 1:14 PM…",
    body:        "Hi Jordan,\n\nYour Instacart order from Trader Joe's was delivered today at 1:14 PM.\n\nItems: Almond milk (2), eggs, mixed greens, pasta, chicken thighs, apples.\n\nRate your shopper or report an issue in the Instacart app.\n\nInstacart",
    receivedAt:  T - 86400000, // yesterday
    expectedEmailType:      "notification",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Delivery confirmation. Pure informational status.",
  },
  {
    id:          "wx-020",
    sender:      "Google",
    senderEmail: "no-reply@accounts.google.com",
    subject:     "New Sign-In to Your Google Account",
    preview:     "We noticed a new sign-in to your Google account from a MacBook in Oakland…",
    body:        "Hi Jordan,\n\nWe noticed a new sign-in to your Google account from a MacBook Pro in Oakland, CA.\n\nIf this was you, no action is needed. If you don't recognize this activity, secure your account at myaccount.google.com.\n\nThe Google Account Team",
    receivedAt:  T - 259200000, // Sunday
    expectedEmailType:      "notification",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Sign-in notification from a recognised device/location. Conditional action — agent should NOT escalate a routine sign-in to action-needed.",
  },
  {
    id:          "wx-021",
    sender:      "Venmo",
    senderEmail: "venmo@venmo.com",
    subject:     "Marcus paid you $40.00",
    preview:     "Marcus H. sent you $40.00 with the note 'Lunch last week'…",
    body:        "Hi Jordan,\n\nMarcus H. sent you $40.00.\n\nNote: \"Lunch last week\"\n\nYour Venmo balance is now $53.25. Transfer to your bank at venmo.com.\n\nVenmo",
    receivedAt:  T - 345600000, // Saturday
    expectedEmailType:      "notification",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Payment received — purely informational. No action required.",
  },
  {
    id:          "wx-022",
    sender:      "Apple",
    senderEmail: "noreply@apple.com",
    subject:     "Receipt — iCloud+ 200 GB Plan $2.99",
    preview:     "Your monthly iCloud+ 200 GB plan was charged $2.99 to the card ending…",
    body:        "Hi Jordan,\n\nYour monthly iCloud+ 200 GB plan was charged $2.99 to the Visa card ending in 3317.\n\nThis is an automated receipt. For questions, visit support.apple.com.\n\nApple",
    receivedAt:  T - 432000000, // Friday
    expectedEmailType:      "notification",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Routine subscription receipt. No action. Tests agent's ability not to treat receipts as bills-due.",
  },


  // ══════════════════════════════════════════════════════════════
  // SECTION 4 — TRUSTED SENDER, NO DEADLINE (6)
  // Warm, personal, or known-sender emails with nothing urgent.
  // Must resolve to for-later. Tests the friendly-sender bias trap.
  // ══════════════════════════════════════════════════════════════

  {
    id:          "wx-023",
    sender:      "Mom",
    senderEmail: "carol.ellis74@gmail.com",
    subject:     "Call Me When You Get a Chance",
    preview:     "Hi honey, just wanted to check in. Nothing urgent — Dad and I are…",
    body:        "Hi honey,\n\nJust wanted to check in. Nothing urgent — Dad and I are doing well. We're planning to come visit in December for the holidays if that works for you and Ethan.\n\nCall me when you have a few minutes. I'm usually free after 7 PM.\n\nLove, Mom",
    receivedAt:  T - 172800000, // Monday
    expectedEmailType:      "communication",
    expectedPriority:       "for-later",
    expectedRequiresAction: false,
    note:        "Trusted sender, zero deadline, explicitly 'nothing urgent'. Agent must resist 'Mom = important' bias.",
  },
  {
    id:          "wx-024",
    sender:      "Marcus (Manager)",
    senderEmail: "m.hayes@crestlinehealth.org",
    subject:     "Performance Review Scheduled for December 4th — FYI",
    preview:     "Hi Jordan, just a heads-up that your annual review is on the calendar…",
    body:        "Hi Jordan,\n\nJust a heads-up — your annual performance review is scheduled for December 4th at 2:00 PM in Conference Room B. You'll receive a self-assessment form to fill out the week before.\n\nNothing to prepare right now. Just wanted to give you plenty of advance notice.\n\nMarcus",
    receivedAt:  T - 259200000, // Sunday
    expectedEmailType:      "communication",
    expectedPriority:       "for-later",
    expectedRequiresAction: false,
    note:        "Manager email — but explicit FYI, nothing due now. for-later, not action-needed.",
  },
  {
    id:          "wx-025",
    sender:      "Priya (Friend)",
    senderEmail: "priya.nair@gmail.com",
    subject:     "Thanksgiving Plans — Are You In?",
    preview:     "Hey! We're doing Thanksgiving at my place this year. Would love for you…",
    body:        "Hey Jordan!\n\nWe're doing Thanksgiving at my place this year — just a small group, very relaxed. Would love for you and Ethan to join if you don't have other plans!\n\nNo pressure at all. Just let me know by next week when you get a chance.\n\nXo Priya",
    receivedAt:  T - 172800000, // Monday
    expectedEmailType:      "communication",
    expectedPriority:       "for-later",
    expectedRequiresAction: false,
    note:        "Friendly social invite with a casual 'next week' soft ask. No consequence if not responded to immediately.",
  },
  {
    id:          "wx-026",
    sender:      "LAPL — Library",
    senderEmail: "notifications@lapl.org",
    subject:     "Your Hold Is Ready — 'Atomic Habits' at Silver Lake Branch",
    preview:     "Good news! The book you placed on hold is ready for pickup…",
    body:        "Hi Jordan,\n\nGood news! The book you placed on hold, Atomic Habits by James Clear, is ready for pickup at the Silver Lake branch.\n\nIt will be held for you until November 16th.\n\nLos Angeles Public Library",
    receivedAt:  T - 86400000, // yesterday
    expectedEmailType:      "notification",
    expectedPriority:       "for-later",
    expectedRequiresAction: false,
    note:        "Library hold available — there's a pickup window (10 days) but no real consequence. for-later is correct; not action-needed.",
  },
  {
    id:          "wx-027",
    sender:      "Dani (Teacher)",
    senderEmail: "d.watkins@madisonelem.edu",
    subject:     "November Classroom Newsletter — Habitats Unit",
    preview:     "Hi families! Attached is our November newsletter covering our science…",
    body:        "Hi families!\n\nAttached is our November classroom newsletter. This month we started our habitats unit — the kids are building dioramas next week!\n\nA few reminders:\n• Spirit Week is Nov 18–22\n• Book fair arrives Dec 2–6\n\nHave a great weekend,\nDani",
    receivedAt:  T - 345600000, // Saturday
    expectedEmailType:      "communication",
    expectedPriority:       "for-later",
    expectedRequiresAction: false,
    note:        "Classroom newsletter from known teacher — informational, no action needed. Warm sender should not bias agent toward action-needed.",
  },
  {
    id:          "wx-028",
    sender:      "Costco",
    senderEmail: "membershipservices@costco.com",
    subject:     "Your Membership Renews Next Month — No Action Needed",
    preview:     "Your Gold Star membership renews December 1st and will be auto-charged…",
    body:        "Hi Jordan,\n\nYour Costco Gold Star membership renews on December 1st and will be automatically charged to the Visa card on file.\n\nIf you'd like to upgrade, cancel, or update your payment method, log in to costco.com before November 30th.\n\nOtherwise, no action is needed.\n\nCostco Member Services",
    receivedAt:  T - 432000000, // Friday
    expectedEmailType:      "notification",
    expectedPriority:       "for-later",
    expectedRequiresAction: false,
    note:        "Auto-renewal notice with 24-day window and explicit 'no action needed'. for-later is correct.",
  },


  // ══════════════════════════════════════════════════════════════
  // SECTION 5 — FAKE URGENCY PROMOTIONS (6)
  // Marketing emails using urgency language (URGENT, LAST CHANCE,
  // ENDS TODAY, LIMITED TIME). Agent must NEVER escalate these.
  // 4 → for-later, 2 → news-updates (pure broadcast, no offer to act on)
  // ══════════════════════════════════════════════════════════════

  {
    id:          "wx-029",
    sender:      "Gap",
    senderEmail: "deals@gap.com",
    subject:     "LAST CHANCE — 70% Off Sitewide Ends Tonight",
    preview:     "Don't miss out! Our biggest sale of the year ends at midnight. Shop now…",
    body:        "Jordan,\n\nDon't miss out! Our biggest sale of the year ends TONIGHT at midnight.\n\n70% OFF EVERYTHING SITEWIDE — No exclusions!\n\nShop now at gap.com before it's too late.\n\nGap",
    receivedAt:  T - 3600000, // 8:00 AM today
    expectedEmailType:      "promotion",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Fake urgency promotion. 'LAST CHANCE' and 'ends tonight' are marketing language. Must never become action-needed. news-updates: transactional/promotional, consume-or-dismiss.",
  },
  {
    id:          "wx-030",
    sender:      "Target",
    senderEmail: "noreply@target.com",
    subject:     "⚠️ URGENT: Your Cart Is About to Expire",
    preview:     "You left items in your cart! This deal expires in 2 hours. Hurry back…",
    body:        "Jordan,\n\n⚠️ URGENT! Your cart is about to expire.\n\nYou left these items behind:\n• Dyson V8 Vacuum — was $399, NOW $229\n• Hydro Flask 32oz — was $49, NOW $29\n\nThis price is only valid for 2 more hours. Complete your purchase now at target.com.\n\nTarget",
    receivedAt:  T - 7200000, // 7:00 AM today
    expectedEmailType:      "promotion",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Cart-abandonment email with manufactured 2-hour urgency. Key test: subject uses 'URGENT' but it's promotional. Must not escalate. news-updates: promotional content is consume-or-dismiss regardless of personal relevance.",
  },
  {
    id:          "wx-031",
    sender:      "Wayfair",
    senderEmail: "savings@wayfair.com",
    subject:     "ACT NOW — Flash Sale Ends in 3 Hours",
    preview:     "Prices dropping fast! Up to 60% off furniture today only. Act now before…",
    body:        "Jordan,\n\nACT NOW — our Flash Sale ends in just 3 hours!\n\nUp to 60% off furniture, rugs, and lighting — today only.\n\nShop before it's too late at wayfair.com.\n\nWayfair",
    receivedAt:  T - 21600000, // 3:00 AM today
    expectedEmailType:      "promotion",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Flash sale with 'ACT NOW'. All-caps urgency from a retail sender. Must be demoted regardless of deadline language. news-updates: promotional, consume-or-dismiss.",
  },
  {
    id:          "wx-032",
    sender:      "Hulu",
    senderEmail: "noreply@hulu.com",
    subject:     "Limited Time: 3 Months of Hulu for $2.99/mo — Offer Expires Sunday",
    preview:     "Upgrade or gift Hulu at our lowest price ever. This offer expires Sunday…",
    body:        "Jordan,\n\nFor a limited time, get 3 months of Hulu (With Ads) for just $2.99/month — that's 70% off.\n\nThis offer expires Sunday, November 10th. Upgrade or gift it at hulu.com/offer.\n\nThe Hulu Team",
    receivedAt:  T - 86400000, // yesterday
    expectedEmailType:      "promotion",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Streaming promotion with a 4-day expiry. Real date but purely promotional. news-updates: promotional, consume-or-dismiss.",
  },
  {
    id:          "wx-033",
    sender:      "Nike",
    senderEmail: "news@nike.com",
    subject:     "New Arrivals: Air Max 2025 Is Here",
    preview:     "The new Air Max 2025 just dropped. Be the first to shop the latest…",
    body:        "Jordan,\n\nThe Air Max 2025 just dropped. Be the first to shop the newest colorways.\n\nExplore the collection at nike.com.\n\nNike",
    receivedAt:  T - 259200000, // Sunday
    expectedEmailType:      "promotion",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Product launch announcement — no urgency language, no deadline, pure broadcast promotion. news-updates.",
  },
  {
    id:          "wx-034",
    sender:      "Spotify",
    senderEmail: "noreply@spotify.com",
    subject:     "New Album Drop: Chappell Roan — Out Now",
    preview:     "Chappell Roan just released a new album. Listen now on Spotify…",
    body:        "Hi Jordan,\n\nChappell Roan just released a new album. Based on your listening history we think you'll love it.\n\nListen now at spotify.com.\n\nThe Spotify Team",
    receivedAt:  T - 345600000, // Saturday
    expectedEmailType:      "promotion",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Content recommendation promo. No urgency, no deadline, nothing actionable. news-updates.",
  },


  // ══════════════════════════════════════════════════════════════
  // SECTION 6 — POTENTIAL SPAM / PHISHING (5)
  // Suspicious domains, impossible deadlines, account-verification
  // hooks, threatening language. Must resolve to news-updates.
  // Agent must detect and not escalate these regardless of urgency.
  // ══════════════════════════════════════════════════════════════

  {
    id:          "wx-035",
    sender:      "PayPal Security",
    senderEmail: "security@paypa1-alerts.net",
    subject:     "Your PayPal Account Has Been Suspended — Verify Within 1 Hour",
    preview:     "Unusual activity was detected. Your account is suspended until you verify…",
    body:        "Dear Valued Customer,\n\nUnusual activity has been detected on your PayPal account. Your account has been SUSPENDED.\n\nYou must verify your identity within 1 HOUR or your account will be permanently closed and funds frozen.\n\nClick here to verify: http://paypa1-secure-verify.net/account\n\nPayPal Security Team",
    receivedAt:  T - 1800000, // 8:30 AM today
    expectedEmailType:      "potential_spam",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Phishing. Domain is paypa1-alerts.net (note the '1'). One-hour threat deadline + account freeze threat + non-PayPal link. Never action-needed.",
  },
  {
    id:          "wx-036",
    sender:      "IRS Refund Center",
    senderEmail: "refunds@irs-gov-refund.com",
    subject:     "You Have a Pending Tax Refund of $2,847 — Claim in 48 Hours",
    preview:     "The IRS has issued a tax refund for your account. You must claim it within…",
    body:        "Dear Taxpayer,\n\nThe IRS has processed an unclaimed tax refund of $2,847.00 for your Social Security number.\n\nYou must claim your refund within 48 hours or it will be forfeited to the US Treasury.\n\nSubmit your banking information at: http://irs-gov-refund.com/claim\n\nIRS Refund Department",
    receivedAt:  T - 86400000, // yesterday
    expectedEmailType:      "potential_spam",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "IRS phishing. The IRS never emails refund claims. Fake domain, 48-hour threat, request for banking info. potential_spam.",
  },
  {
    id:          "wx-037",
    sender:      "Apple Support",
    senderEmail: "no-reply@apple-id-verify.support",
    subject:     "Your Apple ID Has Been Locked — Action Required Immediately",
    preview:     "Your Apple ID was used to sign in from an unrecognised device in Russia…",
    body:        "Dear Apple User,\n\nYour Apple ID (jordan@gmail.com) was used to sign in from an unrecognised device in Moscow, Russia.\n\nFor your security, we have locked your account. To unlock it, you must verify your identity immediately by clicking the link below:\n\nhttp://apple-id-verify.support/unlock\n\nFailure to verify within 2 hours will result in permanent account deletion.\n\nApple Support",
    receivedAt:  T - 3600000, // 8:00 AM today
    expectedEmailType:      "potential_spam",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Apple ID phishing. Domain is apple-id-verify.support (not apple.com). Threats of permanent deletion. Classic pattern.",
  },
  {
    id:          "wx-038",
    sender:      "Federal Benefits Office",
    senderEmail: "benefits@federal-benefits-gov.org",
    subject:     "You Are Eligible for $4,200 in Unclaimed Benefits — Respond Now",
    preview:     "You have been selected to receive unclaimed federal benefits. Respond to…",
    body:        "Dear Jordan Ellis,\n\nYou have been identified as eligible for $4,200 in unclaimed federal benefits from a 2022 relief program.\n\nTo claim your benefits, you must respond to this notice within 72 hours with your full name, date of birth, and Social Security number.\n\nReply directly to this email or call 1-888-BENEFITS.\n\nFederal Benefits Processing Center",
    receivedAt:  T - 172800000, // Monday
    expectedEmailType:      "potential_spam",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Benefit scam. No real federal agency emails requests for SSN. Domain is not .gov. Requesting PII by email is a phishing red flag.",
  },
  {
    id:          "wx-039",
    sender:      "Netflix Billing",
    senderEmail: "billing@netflixbilling-update.com",
    subject:     "Payment Failed — Update Your Info or Lose Access Tonight",
    preview:     "We were unable to process your Netflix payment. Update now or lose access…",
    body:        "Dear Netflix Member,\n\nWe were unable to process your last payment of $15.49. Your account will be suspended TONIGHT unless you update your payment information immediately.\n\nUpdate your details here: http://netflixbilling-update.com/payment\n\nNetflix Billing Team",
    receivedAt:  T - 7200000, // 7:00 AM today
    expectedEmailType:      "potential_spam",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Netflix phishing. Domain is netflixbilling-update.com (not netflix.com). Tonight cutoff + payment update request. potential_spam.",
  },


  // ══════════════════════════════════════════════════════════════
  // SECTION 7 — NEWSLETTERS / INFORMATIONAL (5)
  // Broadcast updates from legitimate organizations. No call to
  // action. Must resolve to news-updates.
  // ══════════════════════════════════════════════════════════════

  {
    id:          "wx-040",
    sender:      "LAUSD Communications",
    senderEmail: "communications@lausd.net",
    subject:     "Schools Closed Monday — Veterans Day Observance",
    preview:     "All LAUSD schools will be closed on Monday, November 11th in observance…",
    body:        "Dear Families,\n\nAll LAUSD schools will be closed on Monday, November 11, 2024 in observance of Veterans Day.\n\nRegular school hours resume Tuesday, November 12th.\n\nLAUSD Communications Office",
    receivedAt:  T - 86400000, // yesterday
    expectedEmailType:      "notification",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "School closure announcement from an authoritative org. No action required — just awareness.",
  },
  {
    id:          "wx-041",
    sender:      "Kaiser Permanente",
    senderEmail: "healthreminders@kp.org",
    subject:     "Flu Season Is Here — Free Flu Shots Available at All Locations",
    preview:     "It's flu season. As a Kaiser member you're eligible for a free flu shot…",
    body:        "Hi Jordan,\n\nFlu season is here. As a Kaiser Permanente member, you're eligible for a free flu shot at any Kaiser location — no appointment needed.\n\nSchedule yours or walk in at kp.org.\n\nKaiser Permanente",
    receivedAt:  T - 259200000, // Sunday
    expectedEmailType:      "notification",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Health reminder from a legitimate sender. Encouraged but not required. news-updates not action-needed.",
  },
  {
    id:          "wx-042",
    sender:      "Madison Elementary PTA",
    senderEmail: "pta@madisonelem.edu",
    subject:     "Book Fair Volunteer Sign-Ups Open — December 2–6",
    preview:     "The book fair is coming up and we need volunteers. Sign up if you're…",
    body:        "Hi families,\n\nThe annual book fair is December 2–6 and we need volunteer help for setup, sales, and breakdown. Even one shift makes a big difference!\n\nSign up at madisonelem.edu/pta if you're available.\n\nMadison Elementary PTA",
    receivedAt:  T - 345600000, // Saturday
    expectedEmailType:      "communication",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Volunteer opportunity from trusted school org — no obligation, far-future event. news-updates.",
  },
  {
    id:          "wx-043",
    sender:      "TurboTax",
    senderEmail: "noreply@turbotax.com",
    subject:     "Tax Season Starts January 27th — We'll Be Ready",
    preview:     "The IRS begins accepting 2024 returns on January 27th. TurboTax will be…",
    body:        "Hi Jordan,\n\nThe IRS will begin accepting 2024 tax returns on January 27, 2025. TurboTax will be ready on day one.\n\nWe'll send you a reminder when it's time to get started.\n\nTurboTax",
    receivedAt:  T - 518400000, // Thursday
    expectedEmailType:      "notification",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Advance tax season notice, months out. Purely informational. news-updates.",
  },
  {
    id:          "wx-044",
    sender:      "NWS Los Angeles",
    senderEmail: "alerts@weather.gov",
    subject:     "Wind Advisory — Los Angeles County Tonight Through 6 AM",
    preview:     "A Wind Advisory is in effect tonight from 9 PM through 6 AM. Gusts up to…",
    body:        "WIND ADVISORY — Los Angeles County\n\nIn effect: 9 PM tonight through 6 AM Thursday\nSustained winds: 20–30 mph\nGusts: up to 55 mph\n\nSecure loose outdoor items. Use caution on overpasses and in open areas.\n\nNational Weather Service Los Angeles",
    receivedAt:  T - 172800000, // Monday
    expectedEmailType:      "notification",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Weather advisory from official NWS. Awareness item — agent should not escalate a weather alert to action-needed.",
  },


  // ══════════════════════════════════════════════════════════════
  // SECTION 8 — AMBIGUOUS / LOW-CONTEXT (6)
  // Vague subject lines, missing context, or emails where priority
  // cannot be determined from content alone. Agent should default
  // to for-later conservatively.
  // ══════════════════════════════════════════════════════════════

  {
    id:          "wx-045",
    sender:      "Ana (Co-worker)",
    senderEmail: "a.reyes@crestlinehealth.org",
    subject:     "Can You Look at This?",
    preview:     "Hey Jordan, got a second? Wanted to get your eyes on something before…",
    body:        "Hey Jordan,\n\nGot a second? Wanted to get your eyes on something before I send it up to Marcus. Nothing urgent — just want a gut check.\n\nAna",
    receivedAt:  T - 86400000, // yesterday
    expectedEmailType:      "communication",
    expectedPriority:       "for-later",
    expectedRequiresAction: false,
    note:        "Vague collegial request, self-described as 'nothing urgent', no deadline. for-later is conservative correct choice.",
  },
  {
    id:          "wx-046",
    sender:      "Elena (Sister)",
    senderEmail: "elena.ellis@hotmail.com",
    subject:     "Ethan's Birthday — Thoughts?",
    preview:     "Hey! His birthday is coming up and I want to get him something good…",
    body:        "Hey!\n\nEthan's birthday is coming up and I want to get him something good this year — not another gift card. Is he into anything new? Books, games, art stuff?\n\nAlso should we do something together for it?\n\nXo Elena",
    receivedAt:  T - 259200000, // Sunday
    expectedEmailType:      "communication",
    expectedPriority:       "for-later",
    expectedRequiresAction: false,
    note:        "Social planning email from sister. No deadline stated. for-later.",
  },
  {
    id:          "wx-047",
    sender:      "Nextdoor",
    senderEmail: "noreply@nextdoor.com",
    subject:     "New Post in Your Neighborhood",
    preview:     "Your neighbor Kevin posted about street parking on Oak Ave next week…",
    body:        "Hi Jordan,\n\nYour neighbor Kevin posted in Silver Lake:\n\n\"Heads up — the city will be repaving Oak Ave next Tuesday and Wednesday. Parking restrictions 7 AM–5 PM both days. Move your cars.\"\n\nReply or react on Nextdoor.",
    receivedAt:  T - 345600000, // Saturday
    expectedEmailType:      "notification",
    expectedPriority:       "for-later",
    expectedRequiresAction: false,
    note:        "Parking heads-up from neighborhood app. Mildly actionable (move car) but no consequence stated and several days away. for-later.",
  },
  {
    id:          "wx-048",
    sender:      "LinkedIn",
    senderEmail: "jobs@linkedin.com",
    subject:     "3 Jobs Match Your Profile",
    preview:     "Based on your skills, these roles might interest you: Clinical Coordinator…",
    body:        "Hi Jordan,\n\nBased on your profile and skills, these roles might interest you:\n\n• Clinical Coordinator – Kaiser Permanente (Los Angeles, CA)\n• Charge Nurse – UCLA Health (Remote)\n• RN Case Manager – Cedars-Sinai (Los Angeles, CA)\n\nView all matches at linkedin.com/jobs.",
    receivedAt:  T - 432000000, // Friday
    expectedEmailType:      "promotion",
    expectedPriority:       "for-later",
    expectedRequiresAction: false,
    note:        "Algorithmic job suggestions. No urgency, no deadline. Promotional in nature but potentially relevant — for-later.",
  },
  {
    id:          "wx-049",
    sender:      "Unknown",
    senderEmail: "info@quarterly-update-newsletter.com",
    subject:     "Your Quarterly Update Is Ready",
    preview:     "Hi, your quarterly update is ready for review. Please log in to access…",
    body:        "Hi,\n\nYour quarterly update is ready for review. Please log in to access your report at quarterly-update-newsletter.com/reports.\n\nThis update contains important information about your account.\n\nCustomer Service",
    receivedAt:  T - 518400000, // Thursday
    expectedEmailType:      "potential_spam",
    expectedPriority:       "news-updates",
    expectedRequiresAction: false,
    note:        "Ambiguous near-spam. Unknown sender, generic domain, vague 'important information' hook with a login link. Potential phishing dressed as a notification.",
  },
  {
    id:          "wx-050",
    sender:      "Marcus (Manager)",
    senderEmail: "m.hayes@crestlinehealth.org",
    subject:     "Following Up",
    preview:     "Hey Jordan, just following up on our earlier conversation. Let me know…",
    body:        "Hey Jordan,\n\nJust following up on our earlier conversation. Let me know your thoughts whenever you get a chance.\n\nMarcus",
    receivedAt:  T - 604800000, // Wednesday (previous week)
    expectedEmailType:      "communication",
    expectedPriority:       "for-later",
    expectedRequiresAction: false,
    note:        "Vague follow-up from manager. No context, no deadline, no stated consequence. Trusted sender but zero signal to escalate. for-later.",
  },
];

// ─── Task mapper ──────────────────────────────────────────────────
// Converts EvalEmail[] → Task[] for use in the dashboard.
// EvalEmail has no UI-specific fields (senderInitial, avatarColor, time),
// so we derive them here.  `priority` is set to a placeholder — it will be
// overwritten by the real agent result in useClassifiedEmails.

const AVATAR_COLORS = ["blue", "purple", "green", "orange"] as const;

function deriveInitial(sender: string): string {
  return (sender.trim()[0] ?? "?").toUpperCase();
}

function deriveAvatarColor(index: number): Task["avatarColor"] {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function deriveTime(receivedAt: number): string {
  const date = new Date(receivedAt);
  return date.toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Convert the v7 evaluation dataset into Task objects suitable for
 * the dashboard.  The `priority` field is a placeholder — useClassifiedEmails
 * overwrites it with the real agent result before rendering.
 */
export function evalEmailsToTasks(emails: EvalEmail[]): Task[] {
  return emails.map((e, i) => ({
    id:            e.id,
    priority:      e.expectedPriority, // placeholder — agent overwrites this
    sender:        e.sender,
    senderEmail:   e.senderEmail,
    senderInitial: deriveInitial(e.sender),
    avatarColor:   deriveAvatarColor(i),
    subject:       e.subject,
    preview:       e.preview,
    body:          e.body,
    time:          deriveTime(e.receivedAt),
    receivedAt:    e.receivedAt,
  }));
}

// ─── Derived counts ───────────────────────────────────────────────

export const WATSON_COUNT_ACTION       = WATSON_EVAL_EMAILS.filter(e => e.expectedPriority === "action-needed").length;
export const WATSON_COUNT_LATER        = WATSON_EVAL_EMAILS.filter(e => e.expectedPriority === "for-later").length;
export const WATSON_COUNT_NEWS         = WATSON_EVAL_EMAILS.filter(e => e.expectedPriority === "news-updates").length;
export const WATSON_COUNT_TOTAL        = WATSON_EVAL_EMAILS.length;

export const WATSON_COUNT_COMMUNICATION = WATSON_EVAL_EMAILS.filter(e => e.expectedEmailType === "communication").length;
export const WATSON_COUNT_NOTIFICATION  = WATSON_EVAL_EMAILS.filter(e => e.expectedEmailType === "notification").length;
export const WATSON_COUNT_PROMOTION     = WATSON_EVAL_EMAILS.filter(e => e.expectedEmailType === "promotion").length;
export const WATSON_COUNT_SPAM          = WATSON_EVAL_EMAILS.filter(e => e.expectedEmailType === "potential_spam").length;

export const WATSON_COUNT_REQUIRES_ACTION = WATSON_EVAL_EMAILS.filter(e => e.expectedRequiresAction).length;
