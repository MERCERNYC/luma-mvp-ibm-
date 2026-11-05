# Session 19 — Focus Timer

**Status:** complete  **Date:** 2025-01-28

---

## Goal

Replace the static "Breathe & Focus" card in the left sidebar with a functional 25-minute Focus Timer. Requirements: Start/Pause, Reset, ambient sound toggle (OFF by default), minimal volume control, soft sound with no lyrics, LUMA glass design. Timer must persist while the user works through emails.

---

## What was built

### 1. `FocusTimer` component
**File:** `src/components/layout/FocusTimer.tsx`

New `"use client"` component. Fully self-contained — no external audio files, no new dependencies.

#### Timer logic
- `remaining` state starts at `25 * 60 = 1500` seconds
- `useEffect` drives a `setInterval` tick of 1 s when `running === true` — cleans up on pause or unmount
- Hitting zero sets `running = false` and shows a "Done ✓" badge
- Reset returns to `TOTAL_SECONDS` without touching the sound state

#### Progress ring
- SVG with two `<circle>` elements: a track ring and a progress arc
- Arc `strokeDasharray` = `circumference * progress` (1 − remaining/total), animated with `transition: stroke-dasharray 1s linear` so it advances smoothly each tick
- Stroke colour shifts from `rgba(37,99,235,0.55)` (blue) to `rgba(124,58,237,0.6)` (purple) on completion

#### Ambient sound engine (`createAmbientEngine`)
Built entirely with the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — no `<audio>` element, no external file.

Signal chain:
```
[4× OscillatorNode] → [BiquadFilter lowpass 600 Hz] → [GainNode] → destination
```

Four sine oscillators at A2 (110 Hz), A3 (220 Hz), E3 (165 Hz), C#4 (277 Hz) — an open-fifth chord stack. Each oscillator has its own slow LFO (0.07–0.16 Hz, ±2.5 cents) connected to `osc.detune` for a shimmer/beating effect. The low-pass filter removes harshness. Total gain is scaled to 18% of the volume fraction to keep it whisper-quiet.

| Control | Behaviour |
|---|---|
| Sound toggle | `createAmbientEngine()` on enable; `.stop()` + null on disable |
| Volume slider | `gain.gain.setTargetAtTime()` with 50 ms ramp — no clicks |
| Unmount | `engineRef.current?.stop()` cleans up `AudioContext` |

Browser autoplay policy is handled: the `AudioContext` is only created on an explicit user click (the toggle button), so no suspended-state errors.

#### Accessibility
- `role="switch"` + `aria-checked` on the sound toggle button
- `aria-live="polite"` hidden span announces state changes to screen readers (running / paused / done)
- `aria-label` on every interactive control
- Timer digit display has `aria-live="off"` (too frequent to announce every second)
- `disabled` attribute on Start/Pause when timer is done

#### Volume slider
- `<input type="range" min=0 max=100 step=5>` with `accentColor: var(--luma-blue)`
- Custom CSS gradient fill: `linear-gradient(to right, var(--luma-blue) N%, rgba…15% N%)`
- Shown only when sound is on; hidden with "Sound off" muted label otherwise

---

### 2. AppShell updated
**File:** `src/components/layout/AppShell.tsx`

- Removed the entire static "Breathe & Focus" `<div>` (lotus SVG, tagline text)
- Imported `FocusTimer` and dropped `<FocusTimer />` in its place
- AppShell comment updated to v4; sidebar label updated to "Focus Timer"

---

## Files changed

| File | Change |
|---|---|
| `src/components/layout/FocusTimer.tsx` | **New file** — Focus Timer component |
| `src/components/layout/AppShell.tsx` | Replaced Breathe & Focus with `<FocusTimer />` |

---

## What was NOT changed

- `src/app/page.tsx` — dashboard layout untouched
- `src/hooks/useClassifiedEmails.ts` — classification pipeline untouched
- `src/components/email/` — email components untouched
- `src/app/api/` — agent routes untouched
- `src/app/globals.css` — reuses existing `.luma-toggle-track` / `.luma-toggle-thumb` CSS already in the design system

---

## Build result

```
✓ TypeScript — 0 errors (tsc --noEmit)
```
