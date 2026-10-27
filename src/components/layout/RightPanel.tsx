import {
  FileText,
  Mail,
  BarChart2,
  Calendar,
  Users,
  Home,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { NextStep, LaterItem, IconVariant } from "@/types/dashboard";

/* ─────────────────────────────────────────────
   RightPanel
   Right column of the dashboard.
   Contains:
   — "Next step" — one focused task with a CTA
   — "Later"     — low-priority reading list

   ND rationale:
   — Forces attention to one thing at a time
   — "Later" is below "Next step" — it is
     visible but never competing
   — No counts, no badges, no noise
   ───────────────────────────────────────────── */

const ICON_MAP: Record<IconVariant, React.ReactNode> = {
  doc:      <FileText  size={20} strokeWidth={1.5} aria-hidden="true" />,
  people:   <Users     size={20} strokeWidth={1.5} aria-hidden="true" />,
  home:     <Home      size={20} strokeWidth={1.5} aria-hidden="true" />,
  mail:     <Mail      size={20} strokeWidth={1.5} aria-hidden="true" />,
  calendar: <Calendar  size={20} strokeWidth={1.5} aria-hidden="true" />,
  chart:    <BarChart2 size={20} strokeWidth={1.5} aria-hidden="true" />,
};

const ICON_BG: Record<IconVariant, string> = {
  doc:      "rgba(37,99,235,0.10)",
  people:   "rgba(22,163,74,0.10)",
  home:     "rgba(124,58,237,0.10)",
  mail:     "rgba(37,99,235,0.10)",
  calendar: "rgba(37,99,235,0.10)",
  chart:    "rgba(22,163,74,0.10)",
};

const ICON_COLOR: Record<IconVariant, string> = {
  doc:      "var(--luma-blue)",
  people:   "var(--luma-later)",
  home:     "var(--luma-purple)",
  mail:     "var(--luma-blue)",
  calendar: "var(--luma-blue)",
  chart:    "var(--luma-later)",
};

interface RightPanelProps {
  nextStep: NextStep;
  laterItems: LaterItem[];
}

export function RightPanel({ nextStep, laterItems }: RightPanelProps) {
  return (
    <aside
      aria-label="Next steps"
      className="flex flex-col gap-6 w-64 shrink-0"
    >
      {/* ── Next step ── */}
      <section aria-labelledby="next-step-heading">
        <h2
          id="next-step-heading"
          className="text-[var(--text-lg)] font-semibold mb-4"
          style={{ color: "var(--luma-text-primary)" }}
        >
          Next step
        </h2>

        <div className="glass rounded-[var(--radius-xl)] p-4 flex flex-col gap-3">
          {/* Icon + text */}
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center"
              style={{
                background: ICON_BG[nextStep.iconVariant],
                color: ICON_COLOR[nextStep.iconVariant],
              }}
              aria-hidden="true"
            >
              {ICON_MAP[nextStep.iconVariant]}
            </div>
            <div className="flex flex-col gap-0.5">
              <p
                className="text-[var(--text-sm)] font-semibold leading-snug"
                style={{ color: "var(--luma-text-primary)" }}
              >
                {nextStep.title}
              </p>
              <p
                className="text-[var(--text-xs)]"
                style={{ color: "var(--luma-text-secondary)" }}
              >
                {nextStep.description}
              </p>
            </div>
          </div>

          {/* CTA */}
          <Button variant="primary" size="md" className="w-full justify-center">
            {nextStep.ctaLabel}
          </Button>

          {/* Helper text */}
          <p
            className="text-[var(--text-xs)] text-center"
            style={{ color: "var(--luma-text-tertiary)" }}
          >
            {nextStep.helperText}
          </p>
        </div>
      </section>

      {/* ── Later ── */}
      <section aria-labelledby="later-heading">
        <h2
          id="later-heading"
          className="text-[var(--text-lg)] font-semibold mb-3"
          style={{ color: "var(--luma-text-primary)" }}
        >
          Later
        </h2>

        <div className="flex flex-col gap-1">
          {laterItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex items-center gap-3 px-3 py-3 rounded-[var(--radius-lg)] w-full text-left
                hover:bg-[rgba(37,99,235,0.05)] transition-colors duration-100
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)] focus-visible:outline-offset-1"
            >
              <div
                className="shrink-0 w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center"
                style={{
                  background: ICON_BG[item.iconVariant],
                  color: ICON_COLOR[item.iconVariant],
                }}
                aria-hidden="true"
              >
                {ICON_MAP[item.iconVariant]}
              </div>
              <span
                className="flex-1 text-[var(--text-sm)] font-medium"
                style={{ color: "var(--luma-text-primary)" }}
              >
                {item.label}
              </span>
              <ChevronRight
                size={15}
                strokeWidth={1.5}
                style={{ color: "var(--luma-text-tertiary)" }}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
