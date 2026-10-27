import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────
   Divider
   ───────────────────────────────────────────── */

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Divider({
  orientation = "horizontal",
  className,
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn(
          "w-px self-stretch bg-[var(--luma-glass-border)]",
          className
        )}
      />
    );
  }

  return (
    <hr
      role="separator"
      className={cn(
        "border-none h-px bg-[var(--luma-glass-border)] w-full",
        className
      )}
    />
  );
}
