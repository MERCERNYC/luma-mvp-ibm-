import { Header }      from "@/components/layout/Header";
import { FocusTimer }  from "@/components/layout/FocusTimer";

/* ─────────────────────────────────────────────
   AppShell — v4
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

        {/* ── Left sidebar — Focus Timer ───────────── */}
        <nav
          className="w-60 shrink-0 flex flex-col gap-3 px-4 py-6 overflow-y-auto"
          style={{ borderRight: "1px solid var(--luma-glass-border)" }}
          aria-label="Sidebar"
        >
          <FocusTimer />

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
