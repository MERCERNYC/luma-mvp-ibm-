# LUMA Design System

**Version:** 0.4  
**Stack:** Next.js 16 / React 19 / Tailwind CSS v4 / Lucide React  
**Principles:** Neurodivergent-first · Bright atmosphere · Glass surfaces · Navy text

---

## Visual Direction

LUMA's environment is bright, calm, and airy. The background is never a flat colour — it is a soft atmospheric gradient built from baby-blue tones. All content surfaces float above it as translucent glass panels.

The goal is to reduce cognitive load, not to be decorative.

---

## Design Principles

| Principle | What it means in practice |
|---|---|
| **Reduce visual noise** | Max 2 competing visual weights per screen zone |
| **Obvious hierarchy** | Size + weight alone establish heading vs body vs label |
| **Generous whitespace** | Components breathe — padding is never compressed |
| **Short labels** | UI copy is scanned, not read. Labels ≤ 3 words preferred |
| **No color-only meaning** | Every semantic color is paired with a label or icon |
| **Strong text contrast** | Navy text on glass achieves ≥ 7:1 (AAA) for primary |
| **Keyboard navigable** | Focus ring visible, consistent, never hidden |

---

## Token Reference

All tokens live in `src/app/globals.css` inside `@theme inline` (Tailwind v4) and `:root`.

### Background

| Token | Value | Use |
|---|---|---|
| `--luma-bg` | `#ddeeff` | Solid fallback for `background-color` |
| `--luma-bg-gradient` | Three-stop radial + linear | Applied to `body` via `background-image` |

### Glass Surfaces

| Token | Value | Use |
|---|---|---|
| `--luma-glass` | `rgba(255,255,255,0.62)` | Default card / panel background |
| `--luma-glass-raised` | `rgba(255,255,255,0.80)` | Elevated panel (modal, popover) |
| `--luma-glass-border` | `rgba(180,210,255,0.45)` | Thin border on all glass surfaces |

Glass blur is applied via `.glass` and `.glass-raised` CSS utility classes (not inline):

```css
.glass {
  background: var(--luma-glass);
  backdrop-filter: blur(20px) saturate(1.5);
  border: 1px solid var(--luma-glass-border);
  box-shadow: var(--shadow-glass-sm);
}

.glass-raised {
  background: var(--luma-glass-raised);
  backdrop-filter: blur(32px) saturate(1.6);
  border: 1px solid var(--luma-glass-border);
  box-shadow: var(--shadow-glass-md);
}
```

**Rule:** apply `.glass` / `.glass-raised` to containers only, never to elements that contain text directly at a small font size.

### Text

| Token | Hex | Contrast on `.glass` | Use |
|---|---|---|---|
| `--luma-text-primary` | `#0f1c2e` | ~14.5:1 AAA ✓ | Headings, primary body |
| `--luma-text-secondary` | `#2c4263` | ~7.2:1 AA ✓ | Secondary labels |
| `--luma-text-tertiary` | `#5470a0` | ~4.6:1 AA large ✓ | Timestamps, meta |
| `--luma-text-disabled` | `#94aac8` | decorative | Disabled states only |
| `--luma-text-inverse` | `#ffffff` | — | On solid dark/accent fills |

### Brand Colors

| Token | Hex | Soft Token | Use |
|---|---|---|---|
| `--luma-blue` | `#2563eb` | `--luma-blue-soft` | Primary action, links |
| `--luma-purple` | `#7c3aed` | `--luma-purple-soft` | Secondary accent — use sparingly |

### Email Priority (Semantic)

Always paired with a text label or icon — never color alone.

| Token | Hex | Soft Token | Meaning |
|---|---|---|---|
| `--luma-urgent` | `#dc2626` | `--luma-urgent-soft` | Needs response today |
| `--luma-action` | `#2563eb` | `--luma-action-soft` | Needs action (no urgency) |
| `--luma-later` | `#16a34a` | `--luma-later-soft` | Can wait / FYI |
| `--luma-news` | `#7c3aed` | `--luma-news-soft` | Newsletter / digest |

### Border Radius

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | `4px` | Tags, tight badges |
| `--radius-sm` | `8px` | Inputs, small controls |
| `--radius-md` | `12px` | Buttons |
| `--radius-lg` | `16px` | Cards (inner) |
| `--radius-xl` | `22px` | Cards (outer), panels |
| `--radius-2xl` | `28px` | Large modals |
| `--radius-full` | `9999px` | Pills, avatars, toggles |

### Spacing

4 px base grid: `--space-1` (4) → `--space-2` (8) → `--space-3` (12) → `--space-4` (16) → `--space-5` (20) → `--space-6` (24) → `--space-8` (32) → `--space-10` (40) → `--space-12` (48) → `--space-16` (64).

### Glass Shadows

Blue-tinted, low opacity — never stark black drop shadows.

| Token | Use |
|---|---|
| `--shadow-glass-xs` | Hairline lift |
| `--shadow-glass-sm` | Default card |
| `--shadow-glass-md` | Elevated / raised card |
| `--shadow-glass-lg` | Modals, drawers |

---

## Component Inventory

| Component | File | Variants |
|---|---|---|
| `Button` | `src/components/ui/Button.tsx` | `primary` `secondary` `ghost` `danger` · sizes `sm` `md` `lg` |
| `Badge` | `src/components/ui/Badge.tsx` | `default` `blue` `purple` `urgent` `action` `later` `news` |
| `Card` | `src/components/ui/Card.tsx` | `flat` `glass` `raised` · padding `none` `sm` `md` `lg` |
| `Divider` | `src/components/ui/Divider.tsx` | `horizontal` `vertical` |

All exported from `src/components/ui/index.ts`.

---

## Icons

Library: **lucide-react** — consistent 24px line icons, stroke-width 1.5.

```tsx
import { Mail, AlertCircle, Clock, Newspaper } from "lucide-react";

// Standard usage
<Mail size={18} strokeWidth={1.5} className="text-[var(--luma-text-secondary)]" />
```

Rules:
- Default size: `18px` in body context, `16px` inside badges/buttons
- Default stroke: `1.5`
- Color: always matches surrounding text token
- No decorative icons without adjacent text labels

---

## Typography

Font: **TT Commons** (with Geist Sans as fallback).

| Step | Token | px | Use |
|---|---|---|---|
| 2xs | `--text-2xs` | 11 | Overlines, caps labels only |
| xs | `--text-xs` | 12 | Badge text, timestamps |
| sm | `--text-sm` | 13 | Secondary body, captions |
| base | `--text-base` | 15 | Default body |
| md | `--text-md` | 16 | Slightly emphasized body |
| lg | `--text-lg` | 18 | Card titles |
| xl | `--text-xl` | 22 | Section headings |
| 2xl | `--text-2xl` | 28 | Page headings |
| 3xl | `--text-3xl` | 36 | Hero / display only |

---

## Preview Route

`/design` — renders the full token and component palette. Development only.

---

## Accessibility Checklist

- [x] Text contrast ≥ 4.5:1 for all interactive text (WCAG AA)  
- [x] Primary and secondary text ≥ 7:1 (WCAG AAA)  
- [x] Focus ring visible on keyboard navigation (`:focus-visible`)  
- [x] Semantic colors always paired with text label or icon  
- [x] `role="separator"` on `<Divider>`  
- [x] Buttons use native `<button>` element (no `div` replacements)  
- [x] `disabled` prop disables pointer events and reduces opacity  
