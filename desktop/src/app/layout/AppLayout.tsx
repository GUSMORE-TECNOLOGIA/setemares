import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { HeaderActionsContext } from "../shared/hooks/useHeaderActions";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [headerActions, setHeaderActions] = useState<ReactNode | null>(null);

  const headerContextValue = useMemo(
    () => ({ setHeaderActions }),
    [setHeaderActions]
  );

  return (
    <HeaderActionsContext.Provider value={headerContextValue}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
        <Sidebar />
        <div className="ml-60">
          <Topbar actions={headerActions ?? undefined} />
          <main className="max-w-7xl mx-auto px-6 xl:px-8 py-6">{children}</main>
        </div>
      </div>
    </HeaderActionsContext.Provider>
  );
}
