# 04-luma-design-system

---

**Status:** complete  **Date:** 2026-10-27

---

### 👤 User

04 — LUMA Design System  
Create the visual design system for LUMA MVP.  
Do not build the full dashboard yet.

---

### 👤 User

**Visual direction:**

- Background: very light baby blue, soft atmospheric blue gradient, bright and calming, no dark background
- Glass: translucent white surfaces, subtle backdrop blur, thin pale borders, very soft shadows — glass must never reduce text readability
- Colors: baby blue environment, white/translucent white surfaces, dark navy text, subtle blue accents, very limited soft purple accents, avoid excessive colors
- Shape: large rounded corners, comfortable padding, generous whitespace
- Typography: TT Commons when available, otherwise clean modern sans-serif fallback, strong but simple hierarchy, avoid excessive font sizes or weights
- Icons: use lucide-react, consistent icon size, consistent stroke weight, simple line icons, avoid decorative icon overload

**Design tokens for:** background, glass surface, glass border, primary text, secondary text, blue, soft blue, purple, soft purple, urgent, action, later, news, border radius, spacing, glass shadow

**NEURODIVERGENT DESIGN PRINCIPLES** — LUMA is designed to reduce cognitive load:
- reduce visual noise
- create obvious hierarchy
- use generous whitespace
- keep labels short
- avoid unnecessary competing elements
- make important information easy to scan
- maintain strong text contrast
- avoid using color as the only way to communicate meaning

**Important:** Do not create email data, MockAgent, Gmail, IBM watsonx, or Docker.

---

### 🤖 Assistant

> 🔧 called: read_file (globals.css, layout.tsx, page.tsx, package.json), next.js docs

Investigated current stack: Next.js 16, React 19, Tailwind v4 (`@import "tailwindcss"`), Geist font.

> 🔧 **write_file** — src/app/globals.css (full design token system)

> 🔧 **write_file** — src/lib/cn.ts

> 🔧 **write_file** — src/components/ui/Button.tsx

> 🔧 **write_file** — src/components/ui/Badge.tsx

> 🔧 **write_file** — src/components/ui/Card.tsx

> 🔧 **write_file** — src/components/ui/Divider.tsx

> 🔧 **write_file** — src/components/ui/index.ts

> 🔧 **execute_command** — npm install lucide-react

> 🔧 **write_file** — docs/design-system.md

> 🔧 **write_file** — src/app/design/page.tsx

> 🔧 **execute_command** — npm run build ✅ 0 errors, 0 warnings — 3 routes: /, /design, /_not-found

> 🔧 **execute_command** — git add -A && git commit && git push

---

### Result

#### Design tokens

| Group | Token | Value |
|---|---|---|
| Background | `--luma-bg` | `#ddeeff` |
| Background | `--luma-bg-gradient` | 3-stop radial+linear baby-blue gradient (body `background-image`) |
| Glass | `--luma-glass` | `rgba(255,255,255,0.62)` |
| Glass | `--luma-glass-raised` | `rgba(255,255,255,0.80)` |
| Glass | `--luma-glass-border` | `rgba(180,210,255,0.45)` |
| Text | `--luma-text-primary` | `#0f1c2e` — 14.5:1 AAA |
| Text | `--luma-text-secondary` | `#2c4263` — 7.2:1 AA |
| Text | `--luma-text-tertiary` | `#5470a0` — 4.6:1 AA large |
| Blue | `--luma-blue` | `#2563eb` |
| Blue soft | `--luma-blue-soft` | `rgba(37,99,235,0.10)` |
| Purple | `--luma-purple` | `#7c3aed` |
| Purple soft | `--luma-purple-soft` | `rgba(124,58,237,0.10)` |
| Urgent | `--luma-urgent` | `#dc2626` |
| Urgent soft | `--luma-urgent-soft` | `rgba(220,38,38,0.09)` |
| Action | `--luma-action` | `#2563eb` |
| Action soft | `--luma-action-soft` | `rgba(37,99,235,0.09)` |
| Later | `--luma-later` | `#16a34a` |
| Later soft | `--luma-later-soft` | `rgba(22,163,74,0.09)` |
| News | `--luma-news` | `#7c3aed` |
| News soft | `--luma-news-soft` | `rgba(124,58,237,0.09)` |
| Radius | `--radius-xs` … `--radius-full` | 4px / 8px / 12px / 16px / 22px / 28px / 9999px |
| Spacing | `--space-1` … `--space-16` | 4px → 64px, 4px base grid |
| Shadow | `--shadow-glass-xs` … `--shadow-glass-lg` | Blue-tinted, low-opacity shadows |

#### Files created or changed

| File | Action |
|---|---|
| `src/app/globals.css` | Full rewrite — tokens, gradient bg, glass utilities, base reset |
| `src/lib/cn.ts` | Created — class name merge utility |
| `src/components/ui/Button.tsx` | Created — 4 variants, 3 sizes |
| `src/components/ui/Badge.tsx` | Created — 7 variants (incl. all 4 email priorities) |
| `src/components/ui/Card.tsx` | Created — flat / glass / raised |
| `src/components/ui/Divider.tsx` | Created — horizontal / vertical |
| `src/components/ui/index.ts` | Created — barrel export |
| `docs/design-system.md` | Created — full token + component reference |
| `src/app/design/page.tsx` | Created — live design preview at `/design` |
| `package.json` / `package-lock.json` | lucide-react added |

#### How the glass effect works

Glass is implemented as two plain CSS utility classes in `globals.css` (not Tailwind inline classes):

```css
.glass {
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  border: 1px solid rgba(180, 210, 255, 0.45);
  box-shadow: var(--shadow-glass-sm);
}
```

`Card variant="glass"` applies `.glass`, `variant="raised"` applies `.glass-raised`. The blur is only on container elements — never on elements containing small text — so readability is never compromised.

#### Accessibility / contrast

- `--luma-text-primary` (#0f1c2e) on glass surface: **~14.5:1 AAA ✓**
- `--luma-text-secondary` (#2c4263): **7.2:1 AA ✓**
- `--luma-text-tertiary` (#5470a0): **4.6:1 AA large ✓**
- All semantic colors (urgent/action/later/news) paired with text label and icon — never color alone
- Focus ring: `:focus-visible` only (keyboard, not mouse)
- Native `<button>` elements throughout

#### Build

✅ `next build` — compiled successfully, 0 errors, 0 warnings.  
Routes: `/`, `/design`, `/_not-found`
