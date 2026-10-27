/* ═══════════════════════════════════════════════
   LUMA Dashboard types
   ═══════════════════════════════════════════════ */

/** Icon variant — determines which icon + bg colour to render */
export type IconVariant = "doc" | "people" | "home" | "mail" | "calendar" | "chart";

/** A card in the "Needs your attention" zone */
export interface Task {
  id: string;
  title: string;
  category: string;
  /** null = no deadline shown */
  dueLabel: string | null;
  /** true = render due label in orange/red */
  dueUrgent: boolean;
  description: string;
  iconVariant: IconVariant;
  /** Label for the primary blue CTA button */
  primaryAction: string;
}

/** A row in the "Later" section of the right panel */
export interface LaterItem {
  id: string;
  label: string;
  iconVariant: IconVariant;
}

/** The single focused "Next step" card in the right panel */
export interface NextStep {
  title: string;
  description: string;
  ctaLabel: string;
  helperText: string;
  iconVariant: IconVariant;
}
