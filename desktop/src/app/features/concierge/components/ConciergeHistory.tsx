import React from 'react';
import { Button } from '@/components/ui/Button';

interface ConciergeReportSummary {
  id: string;
  created_at: string;
  client_name: string;
  destination: string;
  travel_type: string;
  budget: string;
  status: string;
}

interface ConciergeHistoryProps {
  reports: ConciergeReportSummary[];
  onViewReport: (reportId: string) => void;
}

const TRAVEL_TYPE_LABELS: Record<string, string> = {
  lua_de_mel: 'Lua de Mel',
  familia: 'Família',
  negocios: 'Negócios',
  aventura: 'Aventura',
  cultural: 'Cultural',
  gastronomico: 'Gastronômico',
  relaxamento: 'Relaxamento',
};

const BUDGET_LABELS: Record<string, string> = {
  economico: 'Econômico',
  confortavel: 'Confortável',
  premium: 'Premium',
  luxo: 'Luxo',
};

const STATUS_LABELS: Record<string, string> = {
  generated: 'Gerado',
  edited: 'Editado',
  sent: 'Enviado',
  archived: 'Arquivado',
};

const STATUS_COLORS: Record<string, string> = {
  generated: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  edited: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  sent: 'bg-green-500/20 text-green-300 border-green-500/50',
  archived: 'bg-slate-500/20 text-slate-300 border-slate-500/50',
};

export function ConciergeHistory({ reports, onViewReport }: ConciergeHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Nenhum relatório encontrado
        </h3>
        <p className="text-slate-400">
          Os relatórios gerados aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">
          Histórico de Relatórios
        </h2>
        <div className="text-sm text-slate-400">
          {reports.length} relatório{reports.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    {report.client_name}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[report.status]}`}
                  >
                    {STATUS_LABELS[report.status]}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-slate-400 text-sm">Destino:</span>
                    <p className="text-white font-medium">{report.destination}</p>
                  </div>
                  
                  <div>
                    <span className="text-slate-400 text-sm">Tipo:</span>
                    <p className="text-white font-medium">
                      {TRAVEL_TYPE_LABELS[report.travel_type]}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-slate-400 text-sm">Orçamento:</span>
                    <p className="text-white font-medium">
                      {BUDGET_LABELS[report.budget]}
                    </p>
                  </div>
                </div>
                
                <div className="text-sm text-slate-400">
                  Gerado em {formatDate(report.created_at)}
                </div>
              </div>
              
              <div className="ml-4">
                <Button
                  onClick={() => onViewReport(report.id)}
                  variant="outline"
                  size="sm"
                >
                  Ver Relatório
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
