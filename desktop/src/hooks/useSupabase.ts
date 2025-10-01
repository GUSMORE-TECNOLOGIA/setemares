import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { CityRow, AirportRow, AirlineRow, CodeOverrideRow, CodeUnknownRow } from '@/types/db';

// Hook para listar dados com paginação e busca
export function useSupabaseData<T>(
  table: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    searchFields?: string[];
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    filters?: Record<string, any>;
  } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(options.page || 1);
  const [itemsPerPage, setItemsPerPage] = useState(options.limit || 50);

  const {
    search = '',
    searchFields = [],
    orderBy = 'id',
    orderDirection = 'asc',
    filters = {}
  } = options;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase.from(table).select('*', { count: 'exact' });

        // Aplicar filtros
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
          }
        });

        // Aplicar busca
        if (search && searchFields.length > 0) {
          const searchConditions = searchFields.map(field => 
            `${field}.ilike.%${search}%`
          );
          query = query.or(searchConditions.join(','));
        }

        // Aplicar ordenação
        query = query.order(orderBy, { ascending: orderDirection === 'asc' });

        // Se há busca ativa, carregar TODOS os resultados (sem paginação)
        // Se não há busca, aplicar paginação normal
        let result, queryError, count;
        
        if (search && search.trim()) {
          // Busca ativa: carregar todos os resultados
          const { data: searchResult, error: searchError, count: searchCount } = await query;
          result = searchResult;
          queryError = searchError;
          count = searchCount;
        } else {
          // Sem busca: aplicar paginação normal
          const from = (currentPage - 1) * itemsPerPage;
          const to = from + itemsPerPage - 1;
          query = query.range(from, to);
          
          const { data: pageResult, error: pageError, count: pageCount } = await query;
          result = pageResult;
          queryError = pageError;
          count = pageCount;
        }

        if (queryError) {
          throw queryError;
        }

        setData(result || []);
        setTotal(count || 0);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados');
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, currentPage, itemsPerPage, search, JSON.stringify(searchFields), orderBy, orderDirection, JSON.stringify(filters)]);

  const refetch = () => {
    setLoading(true);
    // O useEffect será executado novamente
  };

  const changePage = (page: number) => {
    setCurrentPage(page);
  };

  const changeItemsPerPage = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset para primeira página
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return { 
    data, 
    loading, 
    error, 
    total, 
    currentPage, 
    itemsPerPage, 
    totalPages,
    refetch, 
    changePage, 
    changeItemsPerPage 
  };
}

// Hook específico para cidades
export function useCities() {
  return useSupabaseData<CityRow>('cities', {
    searchFields: ['iata3', 'name', 'country'],
    orderBy: 'iata3'
  });
}

// Hook específico para aeroportos
export function useAirports(options?: { page?: number; limit?: number; search?: string; }) {
  return useSupabaseData<AirportRow>('airports', {
    searchFields: ['iata3', 'icao4', 'name', 'city_iata', 'country'],
    orderBy: 'iata3',
    ...options
  });
}

// Hook específico para companhias aéreas
export function useAirlines(options?: { page?: number; limit?: number; search?: string; }) {
  return useSupabaseData<AirlineRow>('airlines', {
    searchFields: ['iata2', 'icao3', 'name', 'country'],
    orderBy: 'iata2',
    ...options
  });
}

// Hook para códigos desconhecidos
export function useUnknownCodes() {
  return useSupabaseData<CodeUnknownRow>('codes_unknown', {
    orderBy: 'seen_at',
    orderDirection: 'desc'
  });
}

// Hook para overrides
export function useCodeOverrides() {
  return useSupabaseData<CodeOverrideRow>('code_overrides', {
    orderBy: 'created_at',
    orderDirection: 'desc'
  });
}

// Hook para operações CRUD
export function useSupabaseCRUD<T>(table: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: Partial<T>) => {
    try {
      setLoading(true);
      setError(null);
      const { data: result, error: createError } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
      
      if (createError) throw createError;
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string | number, data: Partial<T>) => {
    try {
      setLoading(true);
      setError(null);
      const { data: result, error: updateError } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string | number) => {
    try {
      setLoading(true);
      setError(null);
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, loading, error };
}
