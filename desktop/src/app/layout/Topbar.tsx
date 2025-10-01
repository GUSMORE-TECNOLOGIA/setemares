import type { ReactNode } from "react";
import { SupabaseStatusBadge } from "../shared/components/SupabaseStatusBadge";
import { useAppState } from "../shared/hooks/useAppState";

interface TopbarProps {
  actions?: ReactNode;
}

export function Topbar({ actions }: TopbarProps) {
  const { supabaseStatus } = useAppState();

  return (
    <header className="sticky top-0 z-40 h-16 bg-slate-900/70 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 xl:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/logo-sete-mares-app.png" alt="7Mares Logo" className="h-10 w-auto" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-100">7Mares Cotador</h1>
            <p className="text-sm text-slate-400">PNR — Cotação com RAV/Fee</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SupabaseStatusBadge status={supabaseStatus} />
          {actions}
        </div>
      </div>
    </header>
  );
}
