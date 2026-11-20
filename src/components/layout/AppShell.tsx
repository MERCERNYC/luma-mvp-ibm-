import { Header } from "@/components/layout/Header";

/* ─────────────────────────────────────────────
   AppShell — v6
   Layout: header on top, then:
     • mobile/tablet (<md): single column; email
       pane overlays as a full-screen sheet when open
     • desktop (md+): two columns side by side —
       main content | email pane (500 px fixed)
   ───────────────────────────────────────────── */

interface AppShellProps {
  children:     React.ReactNode;
  emailPane?:   React.ReactNode;
  clearDone:    () => void;
  onLogoClick?: () => void;
}

export function AppShell({ children, emailPane, clearDone, onLogoClick }: AppShellProps) {
  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      <Header clearDone={clearDone} onLogoClick={onLogoClick} />

      {/* flex-1 + min-h-0 gives this row a real pixel height = viewport minus header */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">

        {/* ── Main content ───────────────────────── */}
        <main
          className="flex-1 min-w-0 px-4 py-4 md:px-8 md:py-8 overflow-y-auto"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>

        {/* ── Email reading pane ──────────────────
            Mobile (<md):  fixed full-screen overlay, slides over the list
            Desktop (md+): fixed-width side column   */}
        {emailPane && (
          <aside
            className={[
              /* mobile — full-screen overlay */
              "fixed inset-0 z-40 flex flex-col overflow-hidden glass-raised",
              /* desktop — side panel */
              "md:static md:inset-auto md:z-auto md:w-[500px] md:shrink-0",
            ].join(" ")}
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
