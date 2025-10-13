import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Inicializar cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dgverpbhxtslmfrrcwwj.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs";

const supabase = createClient(supabaseUrl, supabaseKey);

export interface ConciergeReportData {
  agent_name?: string;
  client_name: string;
  destination: string;
  checkin: string;
  checkout: string;
  travel_type: string;
  budget: string;
  adults: number;
  children: number;
  hotel?: string;
  address?: string;
  interests: string[];
  observations?: string;
  report_content: string;
  report_html: string;
  processing_time_ms: number;
  openai_model: string;
  openai_tokens_used: number;
  status?: string;
}

export interface ConciergeReportSummary {
  id: string;
  created_at: string;
  client_name: string;
  destination: string;
  travel_type: string;
  budget: string;
  status: string;
}

export interface ConciergeReportFull extends ConciergeReportData {
  id: string;
  created_at: string;
  updated_at: string;
  duration_days: number;
}

/**
 * Salvar um novo relatório de concierge no banco de dados
 */
export async function saveConciergeReport(data: ConciergeReportData): Promise<string> {
  try {
    logger.info('Salvando relatório de concierge', {
      destination: data.destination,
      client: data.client_name,
      travelType: data.travel_type
    }, 'ConciergeRepository');

    const { data: result, error } = await supabase
      .from('concierge_reports')
      .insert({
        ...data,
        status: data.status || 'generated'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Erro ao salvar relatório: ${error.message}`);
    }

    logger.info('Relatório de concierge salvo com sucesso', {
      reportId: result.id,
      destination: data.destination
    }, 'ConciergeRepository');

    return result.id;

  } catch (error) {
    logger.error('Erro ao salvar relatório de concierge', error as Error, {
      destination: data.destination,
      client: data.client_name
    }, 'ConciergeRepository');
    throw error;
  }
}

/**
 * Buscar relatórios de concierge com paginação
 */
export async function getConciergeReports(limit: number = 10, offset: number = 0): Promise<ConciergeReportSummary[]> {
  try {
    logger.info('Buscando relatórios de concierge', { limit, offset }, 'ConciergeRepository');

    const { data, error } = await supabase
      .from('concierge_reports')
      .select('id, created_at, client_name, destination, travel_type, budget, status')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Erro ao buscar relatórios: ${error.message}`);
    }

    logger.info('Relatórios de concierge carregados', {
      count: data?.length || 0,
      limit,
      offset
    }, 'ConciergeRepository');

    return data || [];

  } catch (error) {
    logger.error('Erro ao buscar relatórios de concierge', error as Error, {
      limit,
      offset
    }, 'ConciergeRepository');
    throw error;
  }
}

/**
 * Buscar um relatório específico por ID
 */
export async function getConciergeReportById(id: string): Promise<ConciergeReportFull | null> {
  try {
    logger.info('Buscando relatório de concierge por ID', { reportId: id }, 'ConciergeRepository');

    const { data, error } = await supabase
      .from('concierge_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Registro não encontrado
        logger.warn('Relatório de concierge não encontrado', { reportId: id }, 'ConciergeRepository');
        return null;
      }
      throw new Error(`Erro ao buscar relatório: ${error.message}`);
    }

    logger.info('Relatório de concierge carregado', {
      reportId: id,
      destination: data.destination,
      client: data.client_name
    }, 'ConciergeRepository');

    return data;

  } catch (error) {
    logger.error('Erro ao buscar relatório de concierge por ID', error as Error, {
      reportId: id
    }, 'ConciergeRepository');
    throw error;
  }
}

/**
 * Atualizar status de um relatório
 */
export async function updateConciergeReportStatus(
  id: string, 
  status: 'generated' | 'edited' | 'sent' | 'archived'
): Promise<void> {
  try {
    logger.info('Atualizando status do relatório', { reportId: id, status }, 'ConciergeRepository');

    const { error } = await supabase
      .from('concierge_reports')
      .update({ status })
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao atualizar status: ${error.message}`);
    }

    logger.info('Status do relatório atualizado', { reportId: id, status }, 'ConciergeRepository');

  } catch (error) {
    logger.error('Erro ao atualizar status do relatório', error as Error, {
      reportId: id,
      status
    }, 'ConciergeRepository');
    throw error;
  }
}

/**
 * Buscar relatórios por destino
 */
export async function getConciergeReportsByDestination(destination: string): Promise<ConciergeReportSummary[]> {
  try {
    logger.info('Buscando relatórios por destino', { destination }, 'ConciergeRepository');

    const { data, error } = await supabase
      .from('concierge_reports')
      .select('id, created_at, client_name, destination, travel_type, budget, status')
      .ilike('destination', `%${destination}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Erro ao buscar relatórios por destino: ${error.message}`);
    }

    logger.info('Relatórios por destino carregados', {
      destination,
      count: data?.length || 0
    }, 'ConciergeRepository');

    return data || [];

  } catch (error) {
    logger.error('Erro ao buscar relatórios por destino', error as Error, {
      destination
    }, 'ConciergeRepository');
    throw error;
  }
}

/**
 * Buscar estatísticas dos relatórios
 */
export async function getConciergeStats(): Promise<{
  totalReports: number;
  reportsByType: Record<string, number>;
  reportsByBudget: Record<string, number>;
  averageProcessingTime: number;
}> {
  try {
    logger.info('Buscando estatísticas de concierge', {}, 'ConciergeRepository');

    // Buscar total de relatórios
    const { count: totalReports, error: countError } = await supabase
      .from('concierge_reports')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Erro ao contar relatórios: ${countError.message}`);
    }

    // Buscar relatórios para análise
    const { data: reports, error: reportsError } = await supabase
      .from('concierge_reports')
      .select('travel_type, budget, processing_time_ms')
      .limit(1000); // Limitar para não sobrecarregar

    if (reportsError) {
      throw new Error(`Erro ao buscar relatórios: ${reportsError.message}`);
    }

    // Processar estatísticas
    const reportsByType: Record<string, number> = {};
    const reportsByBudget: Record<string, number> = {};
    let totalProcessingTime = 0;

    reports?.forEach(report => {
      // Por tipo de viagem
      reportsByType[report.travel_type] = (reportsByType[report.travel_type] || 0) + 1;
      
      // Por orçamento
      reportsByBudget[report.budget] = (reportsByBudget[report.budget] || 0) + 1;
      
      // Tempo de processamento
      if (report.processing_time_ms) {
        totalProcessingTime += report.processing_time_ms;
      }
    });

    const averageProcessingTime = reports && reports.length > 0 
      ? totalProcessingTime / reports.length 
      : 0;

    const stats = {
      totalReports: totalReports || 0,
      reportsByType,
      reportsByBudget,
      averageProcessingTime
    };

    logger.info('Estatísticas de concierge carregadas', stats, 'ConciergeRepository');

    return stats;

  } catch (error) {
    logger.error('Erro ao buscar estatísticas de concierge', error as Error, {}, 'ConciergeRepository');
    throw error;
  }
}
