import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────
   Card
   Glass-morphism surface.
   blur/saturate lives in the .glass / .glass-raised
   CSS classes defined in globals.css so it never
   competes with text readability.
   ───────────────────────────────────────────── */

export type CardVariant = "flat" | "glass" | "raised";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
}

const base = "rounded-[var(--radius-xl)] overflow-hidden";

const variants: Record<CardVariant, string> = {
  flat:
    "bg-[var(--luma-glass-raised)] border border-[var(--luma-glass-border)]",
  glass:
    "glass",           /* .glass from globals.css */
  raised:
    "glass-raised",    /* .glass-raised from globals.css */
};

const paddings = {
  none: "",
  sm:   "p-3",
  md:   "p-5",
  lg:   "p-7",
};

export function Card({
  variant = "glass",
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(base, variants[variant], paddings[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}
