import { Sunrise } from "lucide-react";

/* ─────────────────────────────────────────────
   DailyBrief
   The AI-generated summary card at the top of
   the dashboard. One sentence. Calm. Orienting.

   ND rationale: the user should never have to
   read the inbox to understand what needs to
   happen today — this card does it for them.
   ───────────────────────────────────────────── */

export interface DailyBriefProps {
  text: string;
}

export function DailyBrief({ text }: DailyBriefProps) {
  return (
    <div
      className="flex items-start gap-4 px-5 py-4 rounded-[var(--radius-xl)]"
      style={{ background: "var(--luma-blue-soft)" }}
      role="region"
      aria-label="Your daily brief"
    >
      {/* Icon container */}
      <div
        className="shrink-0 w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center mt-0.5"
        style={{ background: "rgba(37,99,235,0.12)" }}
        aria-hidden="true"
      >
        <Sunrise size={20} strokeWidth={1.5} style={{ color: "var(--luma-blue)" }} />
      </div>

      {/* Text */}
      <div className="flex flex-col gap-0.5">
        <p
          className="text-[var(--text-sm)] font-semibold"
          style={{ color: "var(--luma-text-primary)" }}
        >
          Your daily brief
        </p>
        <p
          className="text-[var(--text-sm)]"
          style={{ color: "var(--luma-text-secondary)" }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
