/**
 * cn — class name merge utility
 *
 * Combines multiple class values, filtering out falsy entries.
 * Keeps the bundle lean: no external dependency needed for this use-case.
 * If conditional/variant logic grows complex, swap the body for clsx + tailwind-merge.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
