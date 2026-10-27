import { Sidebar } from "@/components/layout/Sidebar";

/* ─────────────────────────────────────────────
   AppShell
   3-column layout: sidebar | main | right panel.
   Right panel is passed as a prop so the page
   controls what goes there.
   ───────────────────────────────────────────── */

interface AppShellProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export function AppShell({ children, rightPanel }: AppShellProps) {
  return (
    <div className="flex min-h-dvh gap-4 p-4 items-start">
      <Sidebar />

      <main
        className="flex-1 min-w-0 py-5 px-4"
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>

      {rightPanel && (
        <div className="py-5 pr-2">
          {rightPanel}
        </div>
      )}
    </div>
  );
}
