"use client";

import { useState } from "react";
import { Search, User } from "lucide-react";

/* ─────────────────────────────────────────────
   TopBar
   Top-right strip: search icon, Focus mode
   toggle, user avatar initials.

   "use client" — toggle state is local.

   ND rationale:
   — "Focus mode" toggle lets the user hide
     everything except "Needs your attention"
     reducing the visible surface to zero noise
   — Avatar gives orientation ("I'm logged in")
   ───────────────────────────────────────────── */

export function TopBar() {
  const [focusMode, setFocusMode] = useState(false);

  return (
    <div className="flex items-center justify-end gap-3 pb-1">
      {/* Search */}
      <button
        type="button"
        aria-label="Search"
        className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)]
          hover:bg-[rgba(37,99,235,0.07)] transition-colors duration-100
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)]"
        style={{ color: "var(--luma-text-secondary)" }}
      >
        <Search size={17} strokeWidth={1.5} aria-hidden="true" />
      </button>

      {/* Focus mode toggle */}
      <div className="flex items-center gap-2">
        <span
          className="text-[var(--text-sm)]"
          style={{ color: "var(--luma-text-secondary)" }}
        >
          Focus mode
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={focusMode}
          aria-label="Toggle focus mode"
          onClick={() => setFocusMode((v) => !v)}
          className="luma-toggle-track focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)] focus-visible:outline-offset-2"
          data-checked={focusMode ? "true" : "false"}
        >
          <span className="luma-toggle-thumb" />
        </button>
      </div>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-[var(--radius-full)] flex items-center justify-center
          text-[var(--text-xs)] font-semibold select-none"
        style={{
          background: "var(--luma-blue-soft)",
          color: "var(--luma-blue)",
        }}
        aria-label="User menu"
        role="img"
      >
        JM
      </div>
    </div>
  );
}
