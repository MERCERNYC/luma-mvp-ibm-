import { Header } from "@/components/layout/Header";

/* ─────────────────────────────────────────────
   AppShell — v5
   Layout: header on top, then two columns:
     main content | email pane (only when open)
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
