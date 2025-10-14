import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/Button';
import { ConciergeFormData } from '@/lib/openai-service';
import { ConciergePdfDocument } from '@/lib/ConciergePdfGenerator';

interface ConciergeReportProps {
  report?: {
    id: string;
    content: string;
    html: string;
    metadata: {
      processingTime: number;
      tokensUsed: number;
      model: string;
    };
    enriched?: any;
    formData?: ConciergeFormData;
  };
  reportId?: string | null;
  onReportGenerated?: (reportId: string) => void;
  onLoadReport?: (reportId: string) => void;
  onRegenerate?: (params: { type?: 'day' | 'restaurants' | 'events' | 'all'; date?: string }) => void;
}

export function ConciergeReport({ 
  report, 
  reportId, 
  onReportGenerated, 
  onLoadReport,
  onRegenerate
}: ConciergeReportProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPremiumPdf, setIsGeneratingPremiumPdf] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Download PDF Premium (direto do frontend com @react-pdf/renderer)
  const handleDownloadPremiumPdf = async () => {
    if (!report) return;

    setIsGeneratingPremiumPdf(true);
    try {
      // Verificar se @react-pdf/renderer está disponível
      if (typeof pdf === 'undefined') {
        throw new Error('@react-pdf/renderer não está disponível');
      }

      // Extrair dados do relatório para o PDF
      const pdfData = extractPdfData(report);
      
      console.log('Gerando PDF premium com dados:', pdfData);
      
      // Gerar PDF usando @react-pdf/renderer
      const pdfDoc = <ConciergePdfDocument data={pdfData} enriched={report.enriched} />;
      const blob = await pdf(pdfDoc).toBlob();
      
      console.log('PDF gerado com sucesso, tamanho:', blob.size);
      
      // Download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `concierge-${pdfData.destination.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao gerar PDF premium:', error);
      console.error('Stack trace:', error.stack);
      alert(`Erro ao gerar PDF premium: ${error.message}. Tente novamente.`);
    } finally {
      setIsGeneratingPremiumPdf(false);
    }
  };

  // Download PDF via API (fallback com HTML)
  const handleGeneratePdf = async () => {
    if (!report) return;

    setIsGeneratingPdf(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: report.html,
          filename: `relatorio-concierge-${report.id.slice(0, 8)}.pdf`
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-concierge-${report.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Extrair dados estruturados do relatório
  const extractPdfData = (report: any) => {
    const enriched = report.enriched;
    const context = enriched?.context || {};
    
    // Buscar dados do context do enriched (quando disponível) ou do formData
    const formData = report.formData || {};
    
    return {
      clientName: formData.clientName || context.clientName || 'Cliente',
      destination: formData.destination || context.destination || 'Destino',
      checkin: formData.checkin || context.checkin || new Date().toISOString().slice(0, 10),
      checkout: formData.checkout || context.checkout || new Date().toISOString().slice(0, 10),
      travelType: formData.travelType || context.travelType || 'cultural',
      budget: formData.budget || context.budget || 'confortavel',
      adults: formData.adults || context.adults || 1,
      children: formData.children || context.children || 0,
      hotel: formData.hotel || context.hotel,
      address: formData.address || context.address,
      interests: formData.interests || context.interests || [],
      summary: enriched?.summary
    };
  };

  const handleLoadReport = async () => {
    if (!reportId || !onLoadReport) return;

    setIsLoadingReport(true);
    try {
      await onLoadReport(reportId);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setIsLoadingReport(false);
    }
  };

  if (reportId && !report) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
        <p className="text-slate-300">Carregando relatório...</p>
        <Button
          onClick={handleLoadReport}
          loading={isLoadingReport}
          className="mt-4"
          variant="outline"
        >
          Carregar Relatório
        </Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-6xl mb-4">🤖</div>
        <p className="text-lg mb-2">Nenhum relatório gerado</p>
        <p className="text-sm">
          Preencha o formulário e clique em "Gerar Relatório"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* Premium Summary (when enriched JSON is available) */}
      {report?.enriched && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Weather chips */}
            <div>
              <h4 className="text-slate-200 font-semibold mb-2">Clima por dia</h4>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(report.enriched.daily_itinerary) && report.enriched.daily_itinerary.map((d: any) => (
                  <button
                    key={d.date}
                    onClick={() => onRegenerate && onRegenerate({ type: 'day', date: d.date })}
                    className="px-3 py-2 rounded-md bg-slate-700 text-slate-200 text-sm border border-slate-600 hover:bg-slate-600 transition-colors"
                    title="Regerar este dia"
                  >
                    <div className="font-medium">{new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                    {d.weather && (
                      <div className="text-slate-300 text-xs">{d.weather.min}°/{d.weather.max}° • {d.weather.condition}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {/* Practical info */}
            <div>
              <h4 className="text-slate-200 font-semibold mb-2">Informações Práticas</h4>
              <ul className="text-sm text-slate-300 list-disc pl-5 space-y-1">
                {report.enriched.currency_timezone_language?.currency && (
                  <li>Moeda: {report.enriched.currency_timezone_language.currency}</li>
                )}
                {report.enriched.currency_timezone_language?.timezone && (
                  <li>Fuso horário: {report.enriched.currency_timezone_language.timezone}</li>
                )}
                {report.enriched.currency_timezone_language?.language && (
                  <li>Idioma: {report.enriched.currency_timezone_language.language}</li>
                )}
                {report.enriched.practical?.tipping && (<li>{report.enriched.practical.tipping}</li>)}
                {report.enriched.practical?.power && (<li>{report.enriched.practical.power}</li>)}
              </ul>
            </div>
          </div>

          {/* Consulado */}
          {report.enriched.consulate && (
            <div className="mt-4">
              <h4 className="text-slate-200 font-semibold mb-2">Consulado/Embaixada</h4>
              <div className="text-sm text-slate-300">
                {report.enriched.consulate.embassy?.name && <div>{report.enriched.consulate.embassy.name}</div>}
                {report.enriched.consulate.embassy?.address && <div>{report.enriched.consulate.embassy.address}</div>}
                {report.enriched.consulate.embassy?.phone && <div>{report.enriched.consulate.embassy.phone}</div>}
              </div>
            </div>
          )}

          {/* Gastronomia & Vida Noturna & Eventos */}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="text-slate-200 font-semibold mb-2">Gastronomia</h4>
              <ul className="text-sm text-slate-300 space-y-2">
                {(report.enriched.restaurants || []).slice(0,5).map((r: any, idx: number) => (
                  <li key={idx} className="border border-slate-700 rounded-md p-2">
                    <div className="text-slate-100 font-medium">{r.name}</div>
                    {r.address && <div className="text-xs text-slate-400">{r.address}</div>}
                    {(r.price || r.rating) && <div className="text-xs text-slate-400">{r.price ? `Preço: ${r.price}` : ''} {r.rating ? `• Nota: ${r.rating}` : ''}</div>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-slate-200 font-semibold mb-2">Vida Noturna</h4>
              <ul className="text-sm text-slate-300 space-y-2">
                {(report.enriched.nightlife || []).slice(0,5).map((n: any, idx: number) => (
                  <li key={idx} className="border border-slate-700 rounded-md p-2">
                    <div className="text-slate-100 font-medium">{n.name}</div>
                    {n.address && <div className="text-xs text-slate-400">{n.address}</div>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-slate-200 font-semibold mb-2">Eventos</h4>
              <ul className="text-sm text-slate-300 space-y-2">
                {(report.enriched.events || []).slice(0,5).map((e: any, idx: number) => (
                  <li key={idx} className="border border-slate-700 rounded-md p-2">
                    <div className="text-slate-100 font-medium">{e.name}</div>
                    {e.start && <div className="text-xs text-slate-400">{new Date(e.start).toLocaleString('pt-BR')}</div>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleDownloadPremiumPdf}
          loading={isGeneratingPremiumPdf}
          disabled={isGeneratingPremiumPdf}
          className="flex-1"
          size="lg"
        >
          {isGeneratingPremiumPdf ? 'Gerando PDF Premium...' : '📄 Baixar PDF Premium'}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleGeneratePdf}
          loading={isGeneratingPdf}
          disabled={isGeneratingPdf}
          className="flex-none"
        >
          {isGeneratingPdf ? 'Gerando...' : 'PDF HTML'}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(report.html);
              newWindow.document.close();
            }
          }}
          className="flex-none"
        >
          Visualizar
        </Button>

        {onRegenerate && (
          <>
            <Button variant="secondary" onClick={() => onRegenerate({ type: 'restaurants' })} className="flex-none">Refinar Gastronomia</Button>
            <Button variant="secondary" onClick={() => onRegenerate({ type: 'events' })} className="flex-none">Atualizar Eventos</Button>
            <Button variant="outline" onClick={() => onRegenerate({ type: 'all' })} className="flex-none">Regerar Tudo</Button>
          </>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-slate-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-slate-200 mb-2">
          Informações do Relatório
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
          <div>
            <span className="text-slate-400">Modelo:</span> {report.metadata.model}
          </div>
          <div>
            <span className="text-slate-400">Tokens:</span> {report.metadata.tokensUsed.toLocaleString()}
          </div>
          <div>
            <span className="text-slate-400">Tempo:</span> {(report.metadata.processingTime / 1000).toFixed(1)}s
          </div>
          <div>
            <span className="text-slate-400">ID:</span> {report.id.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg overflow-hidden min-w-0 shadow-xl">
        <iframe
          title="Relatório Concierge"
          className="w-full"
          style={{ height: '70vh', border: '0' }}
          srcDoc={report.html}
          sandbox=""
        />
      </div>

      {/* Footer Actions */}
      <div className="flex justify-center pt-4 border-t border-slate-600">
        <Button
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(report.content);
            alert('Conteúdo copiado para a área de transferência!');
          }}
          className="text-slate-400 hover:text-white"
        >
          Copiar Texto
        </Button>
      </div>
    </div>
  );
}
