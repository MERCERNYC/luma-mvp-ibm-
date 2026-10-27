"use client";

import { Sun, Bell, Settings2 } from "lucide-react";

/* ─────────────────────────────────────────────
   Header
   Full-width top bar matching the reference image.
   Left:  LUMA wordmark + tagline
   Right: LUMA Preferences button · bell · avatar
   ───────────────────────────────────────────── */

export function Header() {
  return (
    <header
      className="flex items-center justify-between px-8 py-4"
      style={{ borderBottom: "1px solid var(--luma-glass-border)" }}
    >
      {/* Left — logo + tagline */}
      <div className="flex items-center gap-3">
        {/* Icon mark */}
        <div
          className="w-10 h-10 rounded-[var(--radius-full)] flex items-center justify-center shrink-0"
          style={{ background: "var(--luma-blue-soft)" }}
          aria-hidden="true"
        >
          <Sun size={20} strokeWidth={1.5} style={{ color: "var(--luma-blue)" }} />
        </div>
        <div className="flex flex-col leading-none">
          <span
            className="text-[var(--text-lg)] font-bold tracking-[var(--tracking-wide)] uppercase"
            style={{ color: "var(--luma-text-primary)", letterSpacing: "0.18em" }}
          >
            L U M A
          </span>
          <span
            className="text-[var(--text-xs)] mt-0.5"
            style={{ color: "var(--luma-text-tertiary)" }}
          >
            Less inbox. More life.
          </span>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Preferences pill button */}
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)]
            text-[var(--text-sm)] font-medium transition-colors duration-100
            hover:bg-[rgba(37,99,235,0.07)]
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
          style={{
            background: "var(--luma-glass-raised)",
            border: "1px solid var(--luma-glass-border)",
            color: "var(--luma-text-secondary)",
          }}
          aria-label="LUMA Preferences"
        >
          <Settings2 size={15} strokeWidth={1.5} aria-hidden="true" />
          LUMA Preferences
        </button>

        {/* Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-full)]
            hover:bg-[rgba(37,99,235,0.07)] transition-colors duration-100
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
          style={{ color: "var(--luma-text-secondary)" }}
        >
          <Bell size={17} strokeWidth={1.5} aria-hidden="true" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-[var(--radius-full)] flex items-center justify-center
              text-[var(--text-xs)] font-bold select-none shrink-0"
            style={{ background: "var(--luma-blue-soft)", color: "var(--luma-blue)" }}
            aria-label="Sofia's account"
            role="img"
          >
            S
          </div>
          <span
            className="text-[var(--text-sm)] font-medium"
            style={{ color: "var(--luma-text-primary)" }}
          >
            Sofia
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 4l4 4 4-4" stroke="var(--luma-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </header>
  );
}
