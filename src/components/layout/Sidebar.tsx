"use client";

import { useState } from "react";
import { Sun, Inbox, Clock, Settings, Database, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────
   Sidebar
   Matches reference image:
   — LUMA logo mark + wordmark
   — Today (active), Inbox, Follow-ups, Preferences
   — Divider
   — Demo inbox (collapsible)

   ND rationale:
   — 4 nav items + 1 inbox — no folder sprawl
   — Active state: bg fill + text color + weight
   — Icons always paired with labels
   ───────────────────────────────────────────── */

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "today",      label: "Today",       icon: <Sun      size={17} strokeWidth={1.5} aria-hidden="true" /> },
  { id: "inbox",      label: "Inbox",       icon: <Inbox    size={17} strokeWidth={1.5} aria-hidden="true" /> },
  { id: "followups",  label: "Follow-ups",  icon: <Clock    size={17} strokeWidth={1.5} aria-hidden="true" /> },
  { id: "preferences",label: "Preferences", icon: <Settings size={17} strokeWidth={1.5} aria-hidden="true" /> },
];

export function Sidebar() {
  const [active, setActive] = useState("today");
  const [inboxOpen, setInboxOpen] = useState(false);

  return (
    <aside
      aria-label="Main navigation"
      className="flex flex-col w-52 shrink-0 py-5 px-3 glass-raised rounded-[var(--radius-2xl)]"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 pb-6">
        <div
          className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center"
          style={{ background: "var(--luma-blue-soft)" }}
          aria-hidden="true"
        >
          <Sun size={16} strokeWidth={1.5} style={{ color: "var(--luma-blue)" }} />
        </div>
        <span
          className="text-[var(--text-lg)] font-semibold tracking-[var(--tracking-tight)]"
          style={{ color: "var(--luma-text-primary)" }}
        >
          luma
        </span>
      </div>

      {/* Nav */}
      <nav aria-label="Navigation">
        <ul role="list" className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ id, label, icon }) => {
            const isActive = id === active;
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActive(id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)]",
                    "text-[var(--text-sm)] transition-colors duration-100",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)] focus-visible:outline-offset-1",
                    isActive
                      ? "bg-[rgba(37,99,235,0.09)] font-semibold"
                      : "font-normal hover:bg-[rgba(37,99,235,0.05)]",
                  )}
                  style={{ color: isActive ? "var(--luma-blue)" : "var(--luma-text-secondary)" }}
                >
                  {icon}
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Divider */}
      <div className="my-3 h-px mx-3" style={{ background: "var(--luma-glass-border)" }} aria-hidden="true" />

      {/* Demo inbox */}
      <button
        type="button"
        onClick={() => setInboxOpen((v) => !v)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] w-full
          text-[var(--text-sm)] font-normal hover:bg-[rgba(37,99,235,0.05)] transition-colors duration-100
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--luma-blue)] focus-visible:outline-offset-1"
        style={{ color: "var(--luma-text-tertiary)" }}
        aria-expanded={inboxOpen}
      >
        <Database size={17} strokeWidth={1.5} aria-hidden="true" />
        <span className="flex-1 text-left">Demo inbox</span>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          aria-hidden="true"
          className={cn("transition-transform duration-150", inboxOpen && "rotate-180")}
        />
      </button>
    </aside>
  );
}
