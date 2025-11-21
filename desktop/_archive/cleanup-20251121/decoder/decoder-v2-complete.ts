import { supabase } from './supabase';
// Função para gerar hash no navegador
const generateHash = (text: string): string => {
  // Implementação simples de hash para o navegador
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

// Tipos para o Decoder v2
export interface DecodeResult {
  success: boolean;
  type: 'airport' | 'airline' | 'city' | null;
  data: any;
  source: 'override' | 'exact_match' | 'alias' | 'heuristic' | null;
  confidence: number; // 0-100
  originalCode: string;
  suggestions?: string[];
  targetId?: string;
  targetKind?: 'airline' | 'airport';
}

export interface OverrideData {
  id?: string;
  token: string;
  token_kind: 'airline' | 'airport' | 'city' | 'segment';
  target_id: string;
  target_kind: 'airline' | 'airport';
  reason?: string;
  scope?: 'global' | 'org' | 'user';
  user_id?: string;
  created_at?: string;
}

export interface DecodeEvent {
  pnr_hash: string;
  token: string;
  token_kind: 'airline' | 'airport' | 'city' | 'segment';
  status: 'exact' | 'override' | 'alias' | 'heuristic' | 'error';
  target_id?: string;
  target_kind?: 'airline' | 'airport';
  message?: string;
  user_id?: string;
}

// Classe principal do Decoder v2
export class DecoderV2Complete {
  private overrideCache: Map<string, OverrideData> = new Map();
  private aliasCache: Map<string, any> = new Map();

  constructor() {
    this.loadOverrides();
    this.loadAliases();
  }

  // Carregar overrides do banco (usando tabela existente)
  private async loadOverrides() {
    try {
      const { data, error } = await supabase
        .from('code_overrides')
        .select('*');

      if (error) {
        console.error('Erro ao carregar overrides:', error);
        return;
      }

      data.forEach(override => {
        const key = `${override.kind}:${override.code}`;
        this.overrideCache.set(key, {
          id: override.id.toString(),
          token: override.code,
          token_kind: override.kind as 'airline' | 'airport' | 'city' | 'segment',
          target_id: override.mapped_id.toString(),
          target_kind: override.kind as 'airline' | 'airport',
          reason: override.note,
          created_at: override.created_at
        });
      });
      console.log(`Overrides carregados: ${this.overrideCache.size}`);
    } catch (error) {
      console.error('Erro inesperado ao carregar overrides:', error);
    }
  }

  // Carregar aliases do banco (usando campo aliases das tabelas existentes)
  private async loadAliases() {
    try {
      // Carregar aliases de companhias
      const { data: airlinesData, error: airlinesError } = await supabase
        .from('airlines')
        .select('id, name, aliases');

      if (!airlinesError && airlinesData) {
        airlinesData.forEach(airline => {
          if (airline.aliases && Array.isArray(airline.aliases)) {
            airline.aliases.forEach((alias: string) => {
              const key = `airline:${alias.toLowerCase()}`;
              this.aliasCache.set(key, {
                target_id: airline.id.toString(),
                target_kind: 'airline',
                alias: alias
              });
            });
          }
        });
      }

      // Carregar aliases de aeroportos
      const { data: airportsData, error: airportsError } = await supabase
        .from('airports')
        .select('id, name, aliases');

      if (!airportsError && airportsData) {
        airportsData.forEach(airport => {
          if (airport.aliases && Array.isArray(airport.aliases)) {
            airport.aliases.forEach((alias: string) => {
              const key = `airport:${alias.toLowerCase()}`;
              this.aliasCache.set(key, {
                target_id: airport.id.toString(),
                target_kind: 'airport',
                alias: alias
              });
            });
          }
        });
      }

      console.log(`Aliases carregados: ${this.aliasCache.size}`);
    } catch (error) {
      console.error('Erro inesperado ao carregar aliases:', error);
    }
  }

  // Gerar hash do PNR
  private generatePNRHash(pnrText: string): string {
    return generateHash(pnrText);
  }

  // Logar evento de decodificação (usando tabela existente)
  private async logDecodeEvent(event: DecodeEvent) {
    try {
      // Para erros, usar a tabela codes_unknown existente
      if (event.status === 'error') {
        await supabase
          .from('codes_unknown')
          .insert({
            code: event.token,
            context: {
              token_kind: event.token_kind,
              pnr_hash: event.pnr_hash,
              message: event.message
            },
            resolved: false
          });
      }
      
      // Para outros eventos, apenas logar no console por enquanto
      console.log('Decode Event:', event);
    } catch (error) {
      console.error('Erro ao logar evento:', error);
    }
  }

  // Resolver token com cadeia de precedência: override > alias > exact > heuristic > error
  async resolveToken(
    token: string, 
    tokenKind: 'airline' | 'airport' | 'city' | 'segment',
    pnrHash: string,
    userId?: string
  ): Promise<DecodeResult> {
    const originalCode = token;
    const lowerToken = token.toLowerCase();

    // 1. OVERRIDE (maior precedência)
    const overrideKey = `${tokenKind}:${lowerToken}`;
    const override = this.overrideCache.get(overrideKey);
    
    if (override) {
      const targetData = await this.getTargetData(override.target_id, override.target_kind);
      if (targetData) {
        await this.logDecodeEvent({
          pnr_hash: pnrHash,
          token: originalCode,
          token_kind: tokenKind,
          status: 'override',
          target_id: override.target_id,
          target_kind: override.target_kind,
          user_id: userId
        });

        return {
          success: true,
          type: override.target_kind,
          data: targetData,
          source: 'override',
          confidence: 100,
          originalCode,
          targetId: override.target_id,
          targetKind: override.target_kind
        };
      }
    }

    // 2. ALIAS
    const aliasKey = `${tokenKind}:${lowerToken}`;
    const alias = this.aliasCache.get(aliasKey);
    
    if (alias) {
      const targetData = await this.getTargetData(alias.target_id, alias.target_kind);
      if (targetData) {
        await this.logDecodeEvent({
          pnr_hash: pnrHash,
          token: originalCode,
          token_kind: tokenKind,
          status: 'alias',
          target_id: alias.target_id,
          target_kind: alias.target_kind,
          user_id: userId
        });

        return {
          success: true,
          type: alias.target_kind,
          data: targetData,
          source: 'alias',
          confidence: 95,
          originalCode,
          targetId: alias.target_id,
          targetKind: alias.target_kind
        };
      }
    }

    // 3. EXACT MATCH
    const exactResult = await this.exactMatch(token, tokenKind);
    if (exactResult.success) {
      await this.logDecodeEvent({
        pnr_hash: pnrHash,
        token: originalCode,
        token_kind: tokenKind,
        status: 'exact',
        target_id: exactResult.targetId,
        target_kind: exactResult.targetKind,
        user_id: userId
      });

      return exactResult;
    }

    // 4. HEURISTIC (implementação futura)
    const heuristicResult = await this.heuristicMatch(token, tokenKind);
    if (heuristicResult.success) {
      await this.logDecodeEvent({
        pnr_hash: pnrHash,
        token: originalCode,
        token_kind: tokenKind,
        status: 'heuristic',
        target_id: heuristicResult.targetId,
        target_kind: heuristicResult.targetKind,
        user_id: userId
      });

      return heuristicResult;
    }

    // 5. ERROR (nenhum match encontrado)
    await this.logDecodeEvent({
      pnr_hash: pnrHash,
      token: originalCode,
      token_kind: tokenKind,
      status: 'error',
      message: 'Token não encontrado em nenhuma fonte',
      user_id: userId
    });

    return {
      success: false,
      type: null,
      data: null,
      source: null,
      confidence: 0,
      originalCode,
      suggestions: []
    };
  }

  // Busca exata por IATA/ICAO
  private async exactMatch(token: string, tokenKind: string): Promise<DecodeResult> {
    if (tokenKind === 'airline') {
      // Buscar por IATA (2 chars) ou ICAO (3 chars)
      let result = await this.searchInTable('airlines', token, 'iata');
      if (!result) result = await this.searchInTable('airlines', token, 'icao');
      
      if (result) {
        return {
          success: true,
          type: 'airline',
          data: result,
          source: 'exact_match',
          confidence: 100,
          originalCode: token,
          targetId: result.id,
          targetKind: 'airline'
        };
      }
    } else if (tokenKind === 'airport') {
      // Buscar por IATA (3 chars) ou ICAO (4 chars)
      let result = await this.searchInTable('airports', token, 'iata');
      if (!result) result = await this.searchInTable('airports', token, 'icao');
      
      if (result) {
        return {
          success: true,
          type: 'airport',
          data: result,
          source: 'exact_match',
          confidence: 100,
          originalCode: token,
          targetId: result.id,
          targetKind: 'airport'
        };
      }
    }

    return {
      success: false,
      type: null,
      data: null,
      source: null,
      confidence: 0,
      originalCode: token
    };
  }

  // Busca heurística (implementação futura)
  private async heuristicMatch(token: string, tokenKind: string): Promise<DecodeResult> {
    // TODO: Implementar busca por similaridade, fuzzy search, etc.
    return {
      success: false,
      type: null,
      data: null,
      source: null,
      confidence: 0,
      originalCode: token
    };
  }

  // Buscar em tabelas (adaptado para estrutura existente)
  private async searchInTable(table: string, token: string, column: string): Promise<any | null> {
    try {
      // Mapear colunas para estrutura existente
      const columnMap: Record<string, string> = {
        'airlines.iata': 'iata2',
        'airlines.icao': 'icao3',
        'airports.iata': 'iata3',
        'airports.icao': 'icao4'
      };
      
      const mappedColumn = columnMap[`${table}.${column}`] || column;
      
      console.log(`🔍 Buscando ${token} em ${table}.${mappedColumn}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(mappedColumn, token.toUpperCase())
        .limit(1);

      if (error) {
        console.warn(`Erro ao buscar em ${table}.${mappedColumn}:`, error.message);
        return null;
      }

      console.log(`📊 Resultado da busca:`, data?.[0] ? 'Encontrado' : 'Não encontrado');
      return data?.[0] || null;
    } catch (err) {
      console.error(`Erro inesperado ao buscar em ${table}.${column}:`, err);
      return null;
    }
  }

  // Obter dados do target por ID
  private async getTargetData(targetId: string, targetKind: 'airline' | 'airport'): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from(targetKind === 'airline' ? 'airlines' : 'airports')
        .select('*')
        .eq('id', targetId)
        .limit(1);

      if (error) {
        console.warn(`Erro ao buscar target ${targetKind}:`, error.message);
        return null;
      }

      return data?.[0] || null;
    } catch (err) {
      console.error(`Erro inesperado ao buscar target ${targetKind}:`, err);
      return null;
    }
  }

  // Salvar override (usando tabela existente)
  async saveOverride(override: Omit<OverrideData, 'id' | 'created_at'>): Promise<OverrideData | null> {
    try {
      const { data, error } = await supabase
        .from('code_overrides')
        .insert({
          code: override.token,
          kind: override.token_kind,
          mapped_id: parseInt(override.target_id),
          note: override.reason,
          created_by: 'decoder-v2'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar override:', error);
        return null;
      }

      // Atualizar cache
      const key = `${override.token_kind}:${override.token.toLowerCase()}`;
      this.overrideCache.set(key, {
        id: data.id.toString(),
        token: override.token,
        token_kind: override.token_kind,
        target_id: override.target_id,
        target_kind: override.target_kind,
        reason: override.reason,
        created_at: data.created_at
      });

      console.log('Override salvo:', data);
      return {
        id: data.id.toString(),
        token: override.token,
        token_kind: override.token_kind,
        target_id: override.target_id,
        target_kind: override.target_kind,
        reason: override.reason,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Erro inesperado ao salvar override:', error);
      return null;
    }
  }

  // Decodificar PNR completo
  async decodePNR(pnrText: string, userId?: string): Promise<DecodeResult[]> {
    const pnrHash = this.generatePNRHash(pnrText);
    const tokens = this.extractTokens(pnrText);
    const results: DecodeResult[] = [];

    for (const token of tokens) {
      const result = await this.resolveToken(token.code, token.kind, pnrHash, userId);
      results.push(result);
    }

    return results;
  }

  // Extrair tokens do PNR
  private extractTokens(pnrText: string): Array<{code: string, kind: 'airline' | 'airport' | 'city' | 'segment'}> {
    const tokens: Array<{code: string, kind: 'airline' | 'airport' | 'city' | 'segment'}> = [];

    // Regex para encontrar códigos
    const iataRegex = /\b[A-Z]{3}\b/g;
    const icaoRegex = /\b[A-Z]{4}\b/g;
    const airlineRegex = /\b[A-Z0-9]{2}\b/g;

    const iataMatches = pnrText.match(iataRegex) || [];
    const icaoMatches = pnrText.match(icaoRegex) || [];
    const airlineMatches = pnrText.match(airlineRegex) || [];

    // Adicionar aeroportos (IATA 3 chars)
    iataMatches.forEach(code => {
      if (!['USD', 'HS1', 'HK1', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'PC', 'KG'].includes(code)) {
        tokens.push({ code, kind: 'airport' });
      }
    });

    // Adicionar aeroportos (ICAO 4 chars)
    icaoMatches.forEach(code => {
      tokens.push({ code, kind: 'airport' });
    });

    // Adicionar companhias (2 chars)
    airlineMatches.forEach(code => {
      if (!/^\d+$/.test(code)) {
        tokens.push({ code, kind: 'airline' });
      }
    });

    return tokens;
  }

  // Obter estatísticas de decodificação
  async getDecodeStats(pnrHash: string): Promise<{
    total: number;
    exact: number;
    override: number;
    alias: number;
    heuristic: number;
    error: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('decode_events')
        .select('status')
        .eq('pnr_hash', pnrHash);

      if (error) {
        console.error('Erro ao obter estatísticas:', error);
        return { total: 0, exact: 0, override: 0, alias: 0, heuristic: 0, error: 0 };
      }

      const stats = {
        total: data.length,
        exact: data.filter(d => d.status === 'exact').length,
        override: data.filter(d => d.status === 'override').length,
        alias: data.filter(d => d.status === 'alias').length,
        heuristic: data.filter(d => d.status === 'heuristic').length,
        error: data.filter(d => d.status === 'error').length,
      };

      return stats;
    } catch (error) {
      console.error('Erro inesperado ao obter estatísticas:', error);
      return { total: 0, exact: 0, override: 0, alias: 0, heuristic: 0, error: 0 };
    }
  }
}

export const decoderV2Complete = new DecoderV2Complete();
