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
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      <Header />

      {/* flex-1 + min-h-0 gives this row a real pixel height = viewport minus header */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Main content ───────────────────────── */}
        <main
          className="flex-1 min-w-0 px-8 py-8 overflow-y-auto"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>

        {/* ── Email reading pane — independent scroll container ── */}
        {emailPane && (
          <aside
            className="w-[500px] shrink-0 flex flex-col overflow-hidden glass-raised"
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
