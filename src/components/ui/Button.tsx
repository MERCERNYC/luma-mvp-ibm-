import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────
   Button
   ───────────────────────────────────────────── */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-md)] " +
  "transition-all duration-150 cursor-pointer select-none " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-[var(--luma-blue)] " +
  "disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--luma-blue)] text-white " +
    "hover:opacity-90 active:scale-[0.98]",
  secondary:
    "glass text-[var(--luma-text-primary)] " +
    "hover:bg-[var(--luma-glass-raised)] active:scale-[0.98]",
  ghost:
    "bg-transparent text-[var(--luma-text-primary)] " +
    "hover:bg-[rgba(37,99,235,0.07)] active:scale-[0.98]",
  danger:
    "bg-[var(--luma-urgent)] text-white " +
    "hover:opacity-90 active:scale-[0.98]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-7 px-3 text-[var(--text-xs)] gap-1.5",
  md: "h-9 px-4 text-[var(--text-sm)]",
  lg: "h-11 px-5 text-[var(--text-base)]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
