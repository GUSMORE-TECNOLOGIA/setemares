import { AlertTriangle, BarChart3, Database, Sparkles, Home, Settings } from "lucide-react";
import { useAppState } from "../shared/hooks/useAppState";

export function Sidebar() {
  const { currentPage, navigate } = useAppState();

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-slate-900/80 backdrop-blur-sm border-r border-white/10">
      <div className="p-4">
        <div className="text-sm font-semibold text-slate-300 mb-6">Sete Mares</div>
        <nav className="space-y-1">
          <button
            className={`sidebar-item ${currentPage === 'home' ? 'sidebar-item-active' : ''}`}
            onClick={() => navigate('home')}
          >
            <Home size={18} />
            <span>Decodificar</span>
          </button>
          <button
            className={`sidebar-item ${currentPage === 'concierge' ? 'sidebar-item-active' : ''}`}
            onClick={() => navigate('concierge')}
          >
            <Sparkles size={18} />
            <span>Concierge</span>
          </button>
          <button
            className={`sidebar-item ${currentPage === 'catalog' ? 'sidebar-item-active' : ''}`}
            onClick={() => navigate('catalog')}
          >
            <Database size={18} />
            <span>Catálogo</span>
          </button>
          <button
            className={`sidebar-item ${currentPage === 'unknown-codes' ? 'sidebar-item-active' : ''}`}
            onClick={() => navigate('unknown-codes')}
          >
            <AlertTriangle size={18} />
            <span>Pendências</span>
          </button>
          <button className="sidebar-item" type="button">
            <BarChart3 size={18} />
            <span>Relatórios</span>
          </button>
          <button className="sidebar-item" type="button">
            <Settings size={18} />
            <span>Config</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
