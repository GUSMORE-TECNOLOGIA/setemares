import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { ConciergeFormData } from '@/lib/openai-service';

interface ConciergeReport {
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
}

interface ConciergeReportSummary {
  id: string;
  created_at: string;
  client_name: string;
  destination: string;
  travel_type: string;
  budget: string;
  status: string;
}

export function useConciergeController() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<ConciergeReport | null>(null);
  const [reports, setReports] = useState<ConciergeReportSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Carregar histórico na inicialização
  useEffect(() => {
    loadReports();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateReport = useCallback(async (formData: ConciergeFormData) => {
    setIsGenerating(true);
    setError(null);
    
    const actionEnd = logger.actionStart('Concierge Report Generation', {
      destination: formData.destination,
      travelType: formData.travelType,
      budget: formData.budget
    }, 'ConciergeController');

    try {
      const response = await fetch('/api/concierge/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          agentName: 'Agente Sete Mares', // TODO: Pegar do contexto do usuário
        }),
      });

      if (!response.ok) {
        let errorMessage = `Erro ao gerar relatório (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (_e) {
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {}
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Erro na resposta do servidor');
      }

      const report: ConciergeReport = {
        id: result.report.id,
        content: result.report.content,
        html: result.report.html,
        metadata: result.report.metadata,
        enriched: result.enriched || null,
        formData: formData, // Incluir os dados do formulário
      };

      setGeneratedReport(report);
      
      // Recarregar histórico para incluir o novo relatório
      await loadReports();

      logger.info('Relatório Concierge gerado com sucesso', {
        reportId: report.id,
        processingTime: report.metadata.processingTime,
        tokensUsed: report.metadata.tokensUsed
      }, 'ConciergeController');

      actionEnd();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      logger.error('Erro ao gerar relatório Concierge', error as Error, {
        destination: formData.destination,
        travelType: formData.travelType
      }, 'ConciergeController');
      
      actionEnd();
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const response = await fetch('/api/concierge/history?limit=20');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar histórico');
      }

      const result = await response.json();
      
      if (result.success) {
        setReports(result.reports);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      // Não definir erro aqui para não interferir na UI principal
    }
  }, []);

  const loadReport = useCallback(async (reportId: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/concierge/report/${reportId}`);
      
      if (!response.ok) {
        throw new Error('Relatório não encontrado');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Erro na resposta do servidor');
      }

      // Reconstruir formData a partir dos campos salvos no banco
      const formDataFromDb: ConciergeFormData = {
        clientName: result.report.client_name || 'Cliente',
        destination: result.report.destination || 'Destino',
        checkin: result.report.checkin || new Date().toISOString().slice(0, 10),
        checkout: result.report.checkout || new Date().toISOString().slice(0, 10),
        travelType: result.report.travel_type || 'cultural',
        budget: result.report.budget || 'confortavel',
        adults: result.report.adults || 1,
        children: result.report.children || 0,
        hotel: result.report.hotel,
        address: result.report.address,
        interests: result.report.interests || [],
        observations: result.report.observations || '',
        cuisinePreferences: [],
        dietaryRestrictions: [],
        nightlifeLevel: 'moderado',
        eventInterests: [],
        dailyPace: 'equilibrado',
        morningStart: '09:00',
        eveningEnd: '22:00',
        maxWalkingKmPerDay: 5,
        freeTimeBlocks: [],
      };

      const report: ConciergeReport = {
        id: result.report.id,
        content: result.report.report_content,
        html: result.report.report_html,
        metadata: {
          processingTime: result.report.processing_time_ms || 0,
          tokensUsed: result.report.openai_tokens_used || 0,
          model: result.report.openai_model || 'gpt-4',
        },
        enriched: result.report.enriched_json || null,
        formData: formDataFromDb,
      };

      setGeneratedReport(report);

      logger.info('Relatório Concierge carregado', {
        reportId: report.id
      }, 'ConciergeController');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      logger.error('Erro ao carregar relatório', error as Error, {
        reportId
      }, 'ConciergeController');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const regenerateReport = useCallback(async (params: { reportId: string; type?: 'day' | 'restaurants' | 'events' | 'all'; date?: string; }) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/concierge/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        let errorMessage = `Erro ao regerar relatório (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (_e) {
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {}
        }
        throw new Error(errorMessage);
      }
      const result = await response.json();
      if (!result.success) throw new Error('Erro na resposta do servidor');
      const report: ConciergeReport = {
        id: result.report.id,
        content: result.report.content,
        html: result.report.html,
        metadata: result.report.metadata,
        enriched: result.enriched || null,
      };
      setGeneratedReport(report);
      await loadReports();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [loadReports]);

  return {
    isGenerating,
    generatedReport,
    reports,
    error,
    generateReport,
    loadReport,
    loadReports,
    clearError,
    regenerateReport,
  };
}
