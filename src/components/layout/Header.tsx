"use client";

import Image                     from "next/image";
import { useState }              from "react";
import { Bell, Settings2 }       from "lucide-react";
import { PreferencesModal }      from "@/components/layout/PreferencesModal";

/* ─────────────────────────────────────────────
   Header
   Full-width top bar.
   Left:  LUMA logo image
   Right: LUMA Preferences button · bell · avatar
   ───────────────────────────────────────────── */

export function Header() {
  const [prefsOpen, setPrefsOpen] = useState(false);

  return (
    <header
      className="flex items-center justify-between px-8 py-3"
      style={{ borderBottom: "1px solid var(--luma-glass-border)" }}
    >
      {/* Left — logo */}
      <div className="flex items-center">
        <Image
          src="/images/luma-logo.png"
          alt="Luma — Less inbox. More life."
          width={160}
          height={56}
          priority
          style={{ objectFit: "contain", height: 44, width: "auto" }}
        />
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Preferences pill button */}
        <button
          type="button"
          onClick={() => setPrefsOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={prefsOpen}
          className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)]
            text-[var(--text-sm)] font-medium transition-colors duration-100
            hover:bg-[rgba(37,99,235,0.07)]
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
          style={{
            background: prefsOpen ? "rgba(37,99,235,0.07)" : "var(--luma-glass-raised)",
            border: prefsOpen ? "1px solid var(--luma-blue)" : "1px solid var(--luma-glass-border)",
            color: prefsOpen ? "var(--luma-blue)" : "var(--luma-text-secondary)",
          }}
          aria-label="LUMA Preferences"
        >
          <Settings2 size={15} strokeWidth={1.5} aria-hidden="true" />
          LUMA Preferences
        </button>

        {prefsOpen && (
          <PreferencesModal onClose={() => setPrefsOpen(false)} />
        )}

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
