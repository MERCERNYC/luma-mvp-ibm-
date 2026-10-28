import { Header } from "@/components/layout/Header";

/* ─────────────────────────────────────────────
   AppShell — v3
   Layout: header on top, then three columns:
     left sidebar  | main content | email pane (only when open)
   ───────────────────────────────────────────── */

interface AppShellProps {
  children:   React.ReactNode;
  emailPane?: React.ReactNode;
}

export function AppShell({ children, emailPane }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar — Breathe & Focus ─────── */}
        <nav
          className="w-52 shrink-0 flex flex-col gap-3 px-4 py-6 overflow-y-auto"
          style={{ borderRight: "1px solid var(--luma-glass-border)" }}
          aria-label="Sidebar"
        >
          {/* Breathe & Focus card */}
          <div
            className="rounded-[var(--radius-2xl)] px-4 py-5 flex flex-col items-center gap-2 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.10) 100%)",
              border: "1px solid var(--luma-glass-border)",
            }}
          >
            {/* Lotus SVG */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                d="M16 26c0 0-8-5-8-12a8 8 0 0 1 8-8 8 8 0 0 1 8 8c0 7-8 12-8 12z"
                fill="rgba(124,58,237,0.15)" stroke="rgba(124,58,237,0.5)" strokeWidth="1.2"
              />
              <path
                d="M16 26c0 0-5-4-5-9a5 5 0 0 1 5-5 5 5 0 0 1 5 5c0 5-5 9-5 9z"
                fill="rgba(37,99,235,0.12)" stroke="rgba(37,99,235,0.4)" strokeWidth="1"
              />
              <circle cx="16" cy="17" r="2" fill="rgba(124,58,237,0.4)" />
            </svg>

            <p
              className="text-[var(--text-sm)] font-semibold"
              style={{ color: "var(--luma-text-primary)" }}
            >
              Breathe &amp; Focus
            </p>
            <p
              className="text-[var(--text-xs)] leading-relaxed"
              style={{ color: "var(--luma-text-secondary)" }}
            >
              You&apos;re doing great. Take it one email at a time.
            </p>
          </div>

          {/* Nav links */}
          <div className="flex flex-col gap-1 mt-2">
            {[
              { label: "Today",    icon: "🏠", active: true  },
              { label: "Inbox",    icon: "📬", active: false },
              { label: "Done",     icon: "✓",  active: false },
              { label: "Settings", icon: "⚙️", active: false },
            ].map(({ label, icon, active }) => (
              <button
                key={label}
                type="button"
                className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-xl)] text-left transition-colors duration-100"
                style={{
                  background: active ? "rgba(37,99,235,0.08)" : "transparent",
                  color: active ? "var(--luma-blue)" : "var(--luma-text-secondary)",
                  fontWeight: active ? 600 : 400,
                  fontSize: "var(--text-sm)",
                }}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Main content ───────────────────────── */}
        <main
          className="flex-1 min-w-0 px-8 py-8 overflow-y-auto"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>

        {/* ── Email reading pane (only when open) ── */}
        {emailPane && (
          <aside
            className="w-[500px] shrink-0 overflow-y-auto glass-raised"
            style={{ borderLeft: "1px solid var(--luma-glass-border)" }}
            aria-label="Email reading pane"
          >
            {emailPane}
          </aside>
        )}

      </div>
    </div>
  );
}
