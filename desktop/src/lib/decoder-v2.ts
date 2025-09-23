import { supabase } from './supabase';

// Tipos para o Decoder v2
export interface DecodeResult {
  success: boolean;
  type: 'airport' | 'airline' | 'city' | null;
  data: any;
  source: 'override' | 'exact_match' | 'alias' | 'heuristic' | null;
  confidence: number; // 0-100
  originalCode: string;
  suggestions?: string[];
}

export interface OverrideData {
  id?: number;
  original_code: string;
  resolved_type: 'airport' | 'airline' | 'city';
  resolved_id: number;
  resolved_name: string;
  created_at?: string;
}

export interface UnknownCodeData {
  id?: number;
  code: string;
  context?: string;
  attempts: number;
  last_attempt: string;
  suggestions?: string;
  resolved?: boolean;
  created_at?: string;
}

// Classe principal do Decoder v2
export class DecoderV2 {
  private overrideCache: Map<string, OverrideData> = new Map();
  private unknownCodesCache: Map<string, UnknownCodeData> = new Map();

  constructor() {
    this.loadOverrides();
    this.loadUnknownCodes();
  }

  // Carregar overrides do banco
  private async loadOverrides() {
    try {
      // Verificar se a tabela existe primeiro
      const { data, error } = await supabase
        .from('code_overrides')
        .select('*')
        .limit(1);

      if (error) {
        console.log('📋 Tabela code_overrides não existe ainda, usando cache vazio');
        this.overrideCache.clear();
        return;
      }

      this.overrideCache.clear();
      data?.forEach(override => {
        this.overrideCache.set(override.original_code.toLowerCase(), override);
      });

      console.log(`📋 ${data?.length || 0} overrides carregados`);
    } catch (error) {
      console.log('📋 Tabela code_overrides não existe ainda, usando cache vazio');
      this.overrideCache.clear();
    }
  }

  // Carregar códigos desconhecidos do banco
  private async loadUnknownCodes() {
    try {
      // Verificar se a tabela existe primeiro
      const { data, error } = await supabase
        .from('codes_unknown')
        .select('*')
        .eq('resolved', false)
        .limit(1);

      if (error) {
        console.log('📋 Tabela codes_unknown não existe ainda, usando cache vazio');
        this.unknownCodesCache.clear();
        return;
      }

      this.unknownCodesCache.clear();
      data?.forEach(unknown => {
        this.unknownCodesCache.set(unknown.code.toLowerCase(), unknown);
      });

      console.log(`📋 ${data?.length || 0} códigos desconhecidos carregados`);
    } catch (error) {
      console.log('📋 Tabela codes_unknown não existe ainda, usando cache vazio');
      this.unknownCodesCache.clear();
    }
  }

  // Método principal de decodificação
  async decode(code: string, context?: string): Promise<DecodeResult> {
    const normalizedCode = code.trim().toUpperCase();
    
    if (!normalizedCode) {
      return {
        success: false,
        type: null,
        data: null,
        source: null,
        confidence: 0,
        originalCode: code,
        suggestions: []
      };
    }

    // 1. Verificar overrides primeiro
    const overrideResult = await this.checkOverrides(normalizedCode);
    if (overrideResult.success) {
      return overrideResult;
    }

    // 2. Busca exata
    const exactResult = await this.exactMatch(normalizedCode);
    if (exactResult.success) {
      return exactResult;
    }

    // 3. Busca por aliases
    const aliasResult = await this.aliasMatch(normalizedCode);
    if (aliasResult.success) {
      return aliasResult;
    }

    // 4. Busca heurística
    const heuristicResult = await this.heuristicMatch(normalizedCode);
    if (heuristicResult.success) {
      return heuristicResult;
    }

    // 5. Se não encontrou, registrar como desconhecido
    await this.recordUnknownCode(normalizedCode, context);

    return {
      success: false,
      type: null,
      data: null,
      source: null,
      confidence: 0,
      originalCode: code,
      suggestions: await this.generateSuggestions(normalizedCode)
    };
  }

  // 1. Verificar overrides
  private async checkOverrides(code: string): Promise<DecodeResult> {
    const override = this.overrideCache.get(code.toLowerCase());
    
    if (!override) {
      return { success: false, type: null, data: null, source: null, confidence: 0, originalCode: code };
    }

    // Buscar dados completos baseado no tipo e ID
    let data = null;
    try {
      const tableName = override.resolved_type === 'airport' ? 'airports' : 
                       override.resolved_type === 'airline' ? 'airlines' : 'cities';
      
      const { data: result, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', override.resolved_id)
        .single();

      if (error) throw error;
      data = result;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do override:', error);
      return { success: false, type: null, data: null, source: null, confidence: 0, originalCode: code };
    }

    return {
      success: true,
      type: override.resolved_type,
      data: data,
      source: 'override',
      confidence: 100,
      originalCode: code
    };
  }

  // 2. Busca exata
  private async exactMatch(code: string): Promise<DecodeResult> {
    // Buscar em aeroportos (IATA3)
    const airportResult = await this.searchInTable('airports', 'iata3', code);
    if (airportResult.success) return airportResult;

    // Buscar em companhias (IATA2)
    if (code.length === 2) {
      const airlineResult = await this.searchInTable('airlines', 'iata2', code);
      if (airlineResult.success) return airlineResult;
    }

    // Buscar em cidades (IATA3)
    const cityResult = await this.searchInTable('cities', 'iata3', code);
    if (cityResult.success) return cityResult;

    return { success: false, type: null, data: null, source: null, confidence: 0, originalCode: code };
  }

  // 3. Busca por aliases
  private async aliasMatch(code: string): Promise<DecodeResult> {
    // Buscar em aeroportos por aliases
    const airportResult = await this.searchInTable('airports', 'aliases', code, 'ILIKE');
    if (airportResult.success) return airportResult;

    // Buscar em companhias por aliases
    const airlineResult = await this.searchInTable('airlines', 'aliases', code, 'ILIKE');
    if (airlineResult.success) return airlineResult;

    // Buscar em cidades por aliases
    const cityResult = await this.searchInTable('cities', 'aliases', code, 'ILIKE');
    if (cityResult.success) return cityResult;

    return { success: false, type: null, data: null, source: null, confidence: 0, originalCode: code };
  }

  // 4. Busca heurística
  private async heuristicMatch(code: string): Promise<DecodeResult> {
    // Buscar por similaridade no nome
    const airportResult = await this.searchInTable('airports', 'name', `%${code}%`, 'ILIKE');
    if (airportResult.success) {
      airportResult.confidence = 60; // Menor confiança para busca heurística
      airportResult.source = 'heuristic';
      return airportResult;
    }

    const cityResult = await this.searchInTable('cities', 'name', `%${code}%`, 'ILIKE');
    if (cityResult.success) {
      cityResult.confidence = 60;
      cityResult.source = 'heuristic';
      return cityResult;
    }

    return { success: false, type: null, data: null, source: null, confidence: 0, originalCode: code };
  }

  // Método auxiliar para buscar em tabelas
  private async searchInTable(
    table: string, 
    column: string, 
    value: string, 
    operator: string = 'eq'
  ): Promise<DecodeResult> {
    try {
      console.log(`🔍 Buscando em ${table}.${column} = ${value}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(column, value)
        .limit(1);

      if (error) {
        console.error(`❌ Erro na query ${table}:`, error);
        throw error;
      }

      console.log(`📊 Resultado da busca em ${table}:`, data);

      if (data && data.length > 0) {
        const type = table === 'airports' ? 'airport' : 
                    table === 'airlines' ? 'airline' : 'city';

        const result = {
          success: true,
          type: type,
          data: data[0],
          source: 'exact_match',
          confidence: 90,
          originalCode: value
        };
        
        console.log(`✅ Match encontrado em ${table}:`, result);
        return result;
      }

      console.log(`❌ Nenhum match encontrado em ${table}`);
      return { success: false, type: null, data: null, source: null, confidence: 0, originalCode: value };
    } catch (error) {
      console.error(`❌ Erro ao buscar em ${table}:`, error);
      return { success: false, type: null, data: null, source: null, confidence: 0, originalCode: value };
    }
  }

  // Registrar código desconhecido
  private async recordUnknownCode(code: string, context?: string) {
    try {
      // Verificar se a tabela existe
      const { error: testError } = await supabase
        .from('codes_unknown')
        .select('id')
        .limit(1);

      if (testError) {
        console.log('📋 Tabela codes_unknown não existe, registrando apenas no cache local');
        // Registrar apenas no cache local
        const existing = this.unknownCodesCache.get(code.toLowerCase());
        if (existing) {
          existing.attempts += 1;
          existing.last_attempt = new Date().toISOString();
        } else {
          this.unknownCodesCache.set(code.toLowerCase(), {
            code: code,
            context: context || null,
            attempts: 1,
            last_attempt: new Date().toISOString(),
            resolved: false
          });
        }
        return;
      }

      const existing = this.unknownCodesCache.get(code.toLowerCase());
      
      if (existing) {
        // Atualizar tentativas
        const { error } = await supabase
          .from('codes_unknown')
          .update({
            attempts: existing.attempts + 1,
            last_attempt: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Criar novo registro
        const { error } = await supabase
          .from('codes_unknown')
          .insert({
            code: code,
            context: context || null,
            attempts: 1,
            last_attempt: new Date().toISOString(),
            resolved: false
          });

        if (error) throw error;
      }

      // Atualizar cache
      await this.loadUnknownCodes();
    } catch (error) {
      console.log('📋 Erro ao registrar código desconhecido, usando cache local:', error);
      // Fallback para cache local
      const existing = this.unknownCodesCache.get(code.toLowerCase());
      if (existing) {
        existing.attempts += 1;
        existing.last_attempt = new Date().toISOString();
      } else {
        this.unknownCodesCache.set(code.toLowerCase(), {
          code: code,
          context: context || null,
          attempts: 1,
          last_attempt: new Date().toISOString(),
          resolved: false
        });
      }
    }
  }

  // Gerar sugestões
  private async generateSuggestions(code: string): Promise<string[]> {
    const suggestions: string[] = [];
    
    try {
      // Buscar códigos similares
      const { data: airports } = await supabase
        .from('airports')
        .select('iata3')
        .ilike('iata3', `${code}%`)
        .limit(5);

      const { data: airlines } = await supabase
        .from('airlines')
        .select('iata2')
        .ilike('iata2', `${code}%`)
        .limit(5);

      const { data: cities } = await supabase
        .from('cities')
        .select('iata3')
        .ilike('iata3', `${code}%`)
        .limit(5);

      if (airports) suggestions.push(...airports.map(a => a.iata3).filter(Boolean));
      if (airlines) suggestions.push(...airlines.map(a => a.iata2).filter(Boolean));
      if (cities) suggestions.push(...cities.map(c => c.iata3).filter(Boolean));

    } catch (error) {
      console.error('❌ Erro ao gerar sugestões:', error);
    }

    return [...new Set(suggestions)].slice(0, 10);
  }

  // Adicionar override
  async addOverride(override: Omit<OverrideData, 'id' | 'created_at'>) {
    try {
      // Verificar se a tabela existe
      const { error: testError } = await supabase
        .from('code_overrides')
        .select('id')
        .limit(1);

      if (testError) {
        console.log('📋 Tabela code_overrides não existe, adicionando apenas ao cache local');
        // Adicionar apenas ao cache local
        const newOverride = {
          ...override,
          id: Date.now(), // ID temporário
          created_at: new Date().toISOString()
        };
        this.overrideCache.set(override.original_code.toLowerCase(), newOverride);
        return true;
      }

      const { error } = await supabase
        .from('code_overrides')
        .insert({
          ...override,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Recarregar cache
      await this.loadOverrides();
      
      return true;
    } catch (error) {
      console.log('📋 Erro ao adicionar override, usando cache local:', error);
      // Fallback para cache local
      const newOverride = {
        ...override,
        id: Date.now(), // ID temporário
        created_at: new Date().toISOString()
      };
      this.overrideCache.set(override.original_code.toLowerCase(), newOverride);
      return true;
    }
  }

  // Resolver código desconhecido
  async resolveUnknownCode(code: string, resolvedType: string, resolvedId: number, resolvedName: string) {
    try {
      // Adicionar override
      await this.addOverride({
        original_code: code,
        resolved_type: resolvedType as 'airport' | 'airline' | 'city',
        resolved_id: resolvedId,
        resolved_name: resolvedName
      });

      // Marcar como resolvido
      const { error } = await supabase
        .from('codes_unknown')
        .update({ resolved: true })
        .eq('code', code);

      if (error) throw error;

      // Recarregar caches
      await this.loadOverrides();
      await this.loadUnknownCodes();

      return true;
    } catch (error) {
      console.error('❌ Erro ao resolver código desconhecido:', error);
      return false;
    }
  }

  // Obter códigos desconhecidos
  getUnknownCodes(): UnknownCodeData[] {
    return Array.from(this.unknownCodesCache.values());
  }

  // Obter overrides
  getOverrides(): OverrideData[] {
    return Array.from(this.overrideCache.values());
  }
}

// Instância singleton
export const decoderV2 = new DecoderV2();
