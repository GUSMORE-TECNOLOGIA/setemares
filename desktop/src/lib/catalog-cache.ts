/**
 * Cache de Catálogos em localStorage
 * 
 * Implementa cache local para aeroportos e companhias aéreas,
 * reduzindo chamadas ao Supabase e melhorando performance.
 * 
 * Cache é invalidado automaticamente após TTL configurado.
 */

import { supabase } from './supabase';
import type { AirportRow, AirlineRow } from '../types/db';

// Tipos para cache
interface CachedCatalog<T> {
  data: T[];
  timestamp: number;
  version: string;
}

interface CacheConfig {
  ttlMinutes: number;
  version: string;
}

// Configuração padrão
const DEFAULT_CONFIG: CacheConfig = {
  ttlMinutes: 60 * 24, // 24 horas
  version: '1.0.0', // Incrementar quando estrutura mudar
};

// Chaves do localStorage
const CACHE_KEYS = {
  airports: '7mares_cache_airports',
  airlines: '7mares_cache_airlines',
  config: '7mares_cache_config',
} as const;

/**
 * Verifica se cache está válido
 */
function isCacheValid<T>(cached: CachedCatalog<T> | null, config: CacheConfig): boolean {
  if (!cached) return false;
  
  // Verificar versão
  if (cached.version !== config.version) {
    console.log('[Cache] Versão do cache desatualizada, invalidando');
    return false;
  }
  
  // Verificar TTL
  const ageMinutes = (Date.now() - cached.timestamp) / (1000 * 60);
  if (ageMinutes > config.ttlMinutes) {
    console.log(`[Cache] Cache expirado (idade: ${ageMinutes.toFixed(1)}min)`);
    return false;
  }
  
  return true;
}

/**
 * Salva dados no cache
 */
function saveToCache<T>(key: string, data: T[], config: CacheConfig): void {
  try {
    const cached: CachedCatalog<T> = {
      data,
      timestamp: Date.now(),
      version: config.version,
    };
    localStorage.setItem(key, JSON.stringify(cached));
    console.log(`[Cache] Salvo: ${key} (${data.length} itens)`);
  } catch (error) {
    console.warn('[Cache] Erro ao salvar cache:', error);
    // Se localStorage estiver cheio, limpar cache antigo
    if (error instanceof DOMException && error.code === 22) {
      clearAllCache();
      try {
        const cached: CachedCatalog<T> = {
          data,
          timestamp: Date.now(),
          version: config.version,
        };
        localStorage.setItem(key, JSON.stringify(cached));
      } catch (retryError) {
        console.error('[Cache] Falha ao salvar após limpeza:', retryError);
      }
    }
  }
}

/**
 * Carrega dados do cache
 */
function loadFromCache<T>(key: string, config: CacheConfig): T[] | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const cached: CachedCatalog<T> = JSON.parse(stored);
    
    if (isCacheValid(cached, config)) {
      console.log(`[Cache] Hit: ${key} (${cached.data.length} itens)`);
      return cached.data;
    }
    
    // Cache inválido, remover
    localStorage.removeItem(key);
    return null;
  } catch (error) {
    console.warn('[Cache] Erro ao carregar cache:', error);
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Limpa todo o cache
 */
export function clearAllCache(): void {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('[Cache] Cache limpo completamente');
}

/**
 * Limpa cache específico
 */
export function clearCache(type: 'airports' | 'airlines'): void {
  const key = CACHE_KEYS[type];
  localStorage.removeItem(key);
  console.log(`[Cache] Cache limpo: ${type}`);
}

/**
 * Obtém configuração do cache (ou cria padrão)
 */
function getCacheConfig(): CacheConfig {
  try {
    const stored = localStorage.getItem(CACHE_KEYS.config);
    if (stored) {
      const config = JSON.parse(stored);
      // Mesclar com padrão para garantir propriedades
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (error) {
    console.warn('[Cache] Erro ao carregar configuração, usando padrão');
  }
  
  // Salvar configuração padrão
  localStorage.setItem(CACHE_KEYS.config, JSON.stringify(DEFAULT_CONFIG));
  return DEFAULT_CONFIG;
}

/**
 * Carrega aeroportos do Supabase (com cache)
 */
export async function getAirports(forceRefresh = false): Promise<AirportRow[]> {
  const config = getCacheConfig();
  
  // Tentar cache primeiro (se não for refresh forçado)
  if (!forceRefresh) {
    const cached = loadFromCache<AirportRow>(CACHE_KEYS.airports, config);
    if (cached) {
      return cached;
    }
  }
  
  // Carregar do Supabase
  console.log('[Cache] Carregando aeroportos do Supabase...');
  try {
    const { data, error } = await supabase
      .from('airports')
      .select('*')
      .eq('active', true)
      .order('iata3');
    
    if (error) {
      console.error('[Cache] Erro ao carregar aeroportos:', error);
      // Tentar retornar cache mesmo que expirado em caso de erro
      const staleCache = loadFromCache<AirportRow>(CACHE_KEYS.airports, {
        ...config,
        ttlMinutes: Infinity, // Ignorar TTL para fallback
      });
      if (staleCache) {
        console.log('[Cache] Retornando cache expirado como fallback');
        return staleCache;
      }
      throw error;
    }
    
    const airports = (data || []) as AirportRow[];
    
    // Salvar no cache
    saveToCache(CACHE_KEYS.airports, airports, config);
    
    return airports;
  } catch (error) {
    console.error('[Cache] Erro crítico ao carregar aeroportos:', error);
    throw error;
  }
}

/**
 * Carrega companhias aéreas do Supabase (com cache)
 */
export async function getAirlines(forceRefresh = false): Promise<AirlineRow[]> {
  const config = getCacheConfig();
  
  // Tentar cache primeiro (se não for refresh forçado)
  if (!forceRefresh) {
    const cached = loadFromCache<AirlineRow>(CACHE_KEYS.airlines, config);
    if (cached) {
      return cached;
    }
  }
  
  // Carregar do Supabase
  console.log('[Cache] Carregando companhias do Supabase...');
  try {
    const { data, error } = await supabase
      .from('airlines')
      .select('*')
      .eq('active', true)
      .order('iata2');
    
    if (error) {
      console.error('[Cache] Erro ao carregar companhias:', error);
      // Tentar retornar cache mesmo que expirado em caso de erro
      const staleCache = loadFromCache<AirlineRow>(CACHE_KEYS.airlines, {
        ...config,
        ttlMinutes: Infinity, // Ignorar TTL para fallback
      });
      if (staleCache) {
        console.log('[Cache] Retornando cache expirado como fallback');
        return staleCache;
      }
      throw error;
    }
    
    const airlines = (data || []) as AirlineRow[];
    
    // Salvar no cache
    saveToCache(CACHE_KEYS.airlines, airlines, config);
    
    return airlines;
  } catch (error) {
    console.error('[Cache] Erro crítico ao carregar companhias:', error);
    throw error;
  }
}

/**
 * Invalida cache quando dados são atualizados
 */
export function invalidateCache(type?: 'airports' | 'airlines'): void {
  if (type) {
    clearCache(type);
  } else {
    clearAllCache();
  }
}

/**
 * Estatísticas do cache
 */
export function getCacheStats(): {
  airports: { cached: boolean; ageMinutes: number | null; itemCount: number | null };
  airlines: { cached: boolean; ageMinutes: number | null; itemCount: number | null };
} {
  const config = getCacheConfig();
  
  const getStats = <T>(key: string) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        return { cached: false, ageMinutes: null, itemCount: null };
      }
      
      const cached: CachedCatalog<T> = JSON.parse(stored);
      const ageMinutes = (Date.now() - cached.timestamp) / (1000 * 60);
      
      return {
        cached: isCacheValid(cached, config),
        ageMinutes: Math.round(ageMinutes * 10) / 10,
        itemCount: cached.data.length,
      };
    } catch {
      return { cached: false, ageMinutes: null, itemCount: null };
    }
  };
  
  return {
    airports: getStats<AirportRow>(CACHE_KEYS.airports),
    airlines: getStats<AirlineRow>(CACHE_KEYS.airlines),
  };
}

