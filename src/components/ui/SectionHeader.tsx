import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────
   SectionHeader
   Scan anchor for each named section.
   ───────────────────────────────────────────── */

export interface SectionHeaderProps {
  label: string;
  count?: number;
  className?: string;
}

export function SectionHeader({ label, count, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className="text-[var(--text-xs)] font-semibold tracking-[var(--tracking-wider)] uppercase shrink-0"
        style={{ color: "var(--luma-text-tertiary)" }}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          className="text-[var(--text-xs)] font-semibold tabular-nums shrink-0"
          style={{ color: "var(--luma-text-tertiary)" }}
        >
          {count}
        </span>
      )}
      <div
        className="flex-1 h-px"
        style={{ background: "var(--luma-glass-border)" }}
        aria-hidden="true"
      />
    </div>
  );
}
