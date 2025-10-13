import React, { useState } from 'react';
import { ConciergeForm } from '../components/ConciergeForm';
import { ConciergeReport } from '../components/ConciergeReport';
import { ConciergeHistory } from '../components/ConciergeHistory';
import { useConciergeController } from '../hooks/useConciergeController';

export function ConciergePage() {
  const [activeTab, setActiveTab] = useState<'form' | 'report'>('form');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  
  const {
    isGenerating,
    generatedReport,
    generateReport,
    reports,
    loadReport,
    error,
    clearError,
    regenerateReport
  } = useConciergeController();

  const handleReportGenerated = (reportId: string) => {
    setSelectedReportId(reportId);
    setActiveTab('report');
  };

  const handleViewReport = (_reportId: string) => {};

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Concierge IA
          </h1>
          <p className="text-slate-300 text-lg">
            Gere relatórios personalizados de viagem com inteligência artificial
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'form'
                ? 'bg-brand text-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            Formulário
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'report'
                ? 'bg-brand text-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            Relatório Gerado
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-300">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === 'form' ? (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 min-w-0 w-full">
            <h2 className="text-2xl font-semibold mb-6 text-white">
              Dados da Viagem
            </h2>
            <ConciergeForm
              onSubmit={async (data) => { await generateReport(data); setActiveTab('report'); }}
              isSubmitting={isGenerating}
            />
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 min-w-0 w-full">
            <h2 className="text-2xl font-semibold mb-6 text-white">
              Relatório Gerado
            </h2>
            {isGenerating ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
                  <p className="text-slate-300">Gerando relatório com IA...</p>
                  <p className="text-sm text-slate-400 mt-2">Isso pode levar alguns segundos</p>
                </div>
              </div>
            ) : generatedReport || selectedReportId ? (
              <div className="min-w-0 w-full">
                <ConciergeReport
                  report={generatedReport}
                  reportId={selectedReportId}
                  onReportGenerated={handleReportGenerated}
                  onLoadReport={loadReport}
                  onRegenerate={(params) => {
                    if (!generatedReport?.id) return;
                    regenerateReport({ reportId: generatedReport.id, ...params } as any);
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-lg mb-2">Nenhum relatório gerado</p>
                <p className="text-sm">Preencha o formulário e clique em "Gerar Relatório"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
