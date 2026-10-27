import { Header } from "@/components/layout/Header";

/* ─────────────────────────────────────────────
   AppShell — v2
   Layout: header on top, then side-by-side
   left content + right email pane.
   ───────────────────────────────────────────── */

interface AppShellProps {
  children: React.ReactNode;
  emailPane?: React.ReactNode;
}

export function AppShell({ children, emailPane }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />

      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Left — main content */}
        <main
          className="flex-1 min-w-0 px-10 py-8 overflow-y-auto"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>

        {/* Right — email reading pane */}
        {emailPane && (
          <aside
            className="w-[520px] shrink-0 overflow-y-auto glass-raised"
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
