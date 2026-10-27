import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────
   Badge
   Always paired with a label or icon —
   never communicates meaning by color alone.
   ───────────────────────────────────────────── */

export type BadgeVariant =
  | "default"
  | "blue"
  | "purple"
  | "urgent"
  | "action"
  | "later"
  | "news";

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const base =
  "inline-flex items-center gap-1 px-2 py-0.5 " +
  "rounded-[var(--radius-full)] font-medium " +
  "text-[var(--text-xs)] leading-[var(--leading-snug)] tracking-[var(--tracking-wide)]";

const variants: Record<BadgeVariant, string> = {
  default:
    "bg-[rgba(37,99,235,0.07)] text-[var(--luma-text-secondary)]",
  blue:
    "bg-[var(--luma-blue-soft)] text-[var(--luma-blue)]",
  purple:
    "bg-[var(--luma-purple-soft)] text-[var(--luma-purple)]",
  urgent:
    "bg-[var(--luma-urgent-soft)] text-[var(--luma-urgent)]",
  action:
    "bg-[var(--luma-action-soft)] text-[var(--luma-action)]",
  later:
    "bg-[var(--luma-later-soft)] text-[var(--luma-later)]",
  news:
    "bg-[var(--luma-news-soft)] text-[var(--luma-news)]",
};

export function Badge({
  variant = "default",
  className,
  children,
}: BadgeProps) {
  return (
    <span className={cn(base, variants[variant], className)}>
      {children}
    </span>
  );
}
