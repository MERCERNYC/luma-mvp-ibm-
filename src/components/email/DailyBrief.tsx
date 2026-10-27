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
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-[var(--radius-lg)]"
      style={{ background: "rgba(37,99,235,0.06)" }}
      role="region"
      aria-label="Your daily brief"
    >
      <Sunrise
        size={14}
        strokeWidth={1.5}
        className="shrink-0"
        style={{ color: "var(--luma-blue)" }}
        aria-hidden="true"
      />
      <p
        className="text-[var(--text-xs)]"
        style={{ color: "var(--luma-text-secondary)" }}
      >
        {text}
      </p>
    </div>
  );
}
