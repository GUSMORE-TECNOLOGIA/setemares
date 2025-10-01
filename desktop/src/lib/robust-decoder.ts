// Sistema de decodificação robusto com múltiplos fallbacks
import { getAirportInfo, formatAirportName, type AirportData } from './airport-cache';

export interface DecodeResult {
  success: boolean;
  data?: AirportData;
  source: 'database' | 'cache' | 'not_found';
  error?: string;
}

export interface RobustAirportInfo {
  iataCode: string;
  description: string;
  found: boolean;
  source: 'database' | 'cache' | 'not_found';
  error?: string;
}

// Cache em memória para evitar múltiplas consultas
const memoryCache = new Map<string, RobustAirportInfo>();

export class RobustDecoder {
  private static instance: RobustDecoder;
  
  static getInstance(): RobustDecoder {
    if (!RobustDecoder.instance) {
      RobustDecoder.instance = new RobustDecoder();
    }
    return RobustDecoder.instance;
  }

  // Correções de nomes de cidades conhecidas - baseado em códigos IATA
  private applyCityCorrections(data: { iata3: string; name: string; city: string; country: string }) {
    const cityCorrections: Record<string, string> = {
      // Brasil
      'GRU': 'São Paulo',
      'CGH': 'São Paulo', 
      'GIG': 'Rio de Janeiro',
      'SDU': 'Rio de Janeiro',
      'BSB': 'Brasília',
      'BEL': 'Belém',
      'REC': 'Recife',
      'SSA': 'Salvador',
      'FOR': 'Fortaleza',
      'CWB': 'Curitiba',
      'POA': 'Porto Alegre',
      
      // Portugal
      'LIS': 'Lisboa',
      'OPO': 'Porto',
      'FAO': 'Faro',
      
      // Espanha
      'BCN': 'Barcelona',
      'MAD': 'Madrid',
      'SVQ': 'Sevilha',
      'VLC': 'Valência',
      'BIO': 'Bilbao',
      
      // Itália
      'FCO': 'Roma',
      'MXP': 'Milão',
      'LIN': 'Milão',
      'VCE': 'Veneza',
      'FLR': 'Florença',
      'NAP': 'Nápoles',
      
      // França
      'CDG': 'Paris',
      'ORY': 'Paris',
      'LYS': 'Lyon',
      'MRS': 'Marselha',
      'NCE': 'Nice',
      
      // Reino Unido
      'LHR': 'Londres',
      'LGW': 'Londres',
      'STN': 'Londres',
      'MAN': 'Manchester',
      'BHX': 'Birmingham',
      'EDI': 'Edimburgo',
      
      // Estados Unidos
      'JFK': 'Nova York',
      'LGA': 'Nova York',
      'EWR': 'Nova York',
      'LAX': 'Los Angeles',
      'SFO': 'San Francisco',
      'MIA': 'Miami',
      'ORD': 'Chicago',
      'DFW': 'Dallas',
      'ATL': 'Atlanta',
      'DEN': 'Denver',
      'LAS': 'Las Vegas',
      'SEA': 'Seattle',
      'BOS': 'Boston',
      'PHL': 'Filadélfia',
      'IAD': 'Washington',
      
      // Canadá
      'YYZ': 'Toronto',
      'YUL': 'Montreal',
      'YVR': 'Vancouver',
      'YYC': 'Calgary',
      
      // Alemanha
      'FRA': 'Frankfurt',
      'MUC': 'Munique',
      'TXL': 'Berlim',
      'HAM': 'Hamburgo',
      'CGN': 'Colônia',
      
      // Países Baixos
      'AMS': 'Amsterdam',
      
      // Suíça
      'ZUR': 'Zurique',
      'GVA': 'Genebra',
      
      // Áustria
      'VIE': 'Viena',
      
      // Rússia
      'SVO': 'Moscou',
      'LED': 'São Petersburgo',
      
      // China
      'PEK': 'Pequim',
      'SHA': 'Xangai',
      'CAN': 'Guangzhou',
      'SZX': 'Shenzhen',
      
      // Japão
      'NRT': 'Tóquio',
      'HND': 'Tóquio',
      'KIX': 'Osaka',
      
      // Coreia do Sul
      'ICN': 'Seul',
      
      // Singapura
      'SIN': 'Singapura',
      
      // Tailândia
      'BKK': 'Bangkok',
      
      // Austrália
      'SYD': 'Sydney',
      'MEL': 'Melbourne',
      'BNE': 'Brisbane',
      'PER': 'Perth',
      
      // Nova Zelândia
      'AKL': 'Auckland',
      
      // África do Sul
      'JNB': 'Johannesburgo',
      'CPT': 'Cidade do Cabo',
      
      // Emirados Árabes
      'DXB': 'Dubai',
      'AUH': 'Abu Dhabi',
      
      // Turquia
      'IST': 'Istambul',
      
      // Índia
      'DEL': 'Nova Delhi',
      'BOM': 'Mumbai',
      'BLR': 'Bangalore',
      
      // México
      'MEX': 'Cidade do México',
      'CUN': 'Cancún',
      
      // Argentina
      'EZE': 'Buenos Aires',
      
      // Chile
      'SCL': 'Santiago',
      
      // Peru
      'LIM': 'Lima',
      
      // Colômbia
      'BOG': 'Bogotá'
    };

    const correctedCity = cityCorrections[data.iata3] || data.city;
    
    // Se houve correção, logar para possível atualização do banco
    if (cityCorrections[data.iata3] && correctedCity !== data.city) {
      console.log(`🔧 Correção aplicada: ${data.iata3} - "${data.city}" → "${correctedCity}"`);
      // TODO: Implementar atualização automática do Supabase aqui
    }
    
    return {
      iata3: data.iata3,
      name: data.name,
      city: correctedCity,
      country: data.country
    };
  }

  async decodeAirport(code: string): Promise<RobustAirportInfo> {
    const upperCode = code.toUpperCase().trim();
    
    // Verificar cache em memória primeiro
    if (memoryCache.has(upperCode)) {
      const cached = memoryCache.get(upperCode)!;
      console.log(`💾 Cache hit para ${upperCode}:`, cached.source);
      return cached;
    }

    // Usar 100% Supabase com correções automáticas - mais confiável e completo
    try {
      const { decoderV2 } = await import('./decoder-v2');
      const result = await decoderV2.decode(upperCode, 'airport');
      
      if (result.success && result.data) {
        // Aplicar correções de nomes de cidades conhecidas
        const correctedData = RobustDecoder.getInstance().applyCityCorrections({
          iata3: result.data.iata3,
          name: result.data.name,
          city: result.data.city_iata || result.data.city,
          country: result.data.country
        });

        const airportInfo: RobustAirportInfo = {
          iataCode: upperCode,
          description: formatAirportName(correctedData),
          found: true,
          source: 'database'
        };
        
        // Cachear resultado
        memoryCache.set(upperCode, airportInfo);
        console.log(`✅ DecoderV2 encontrou ${upperCode}:`, airportInfo.description);
        return airportInfo;
      }
    } catch (error) {
      console.warn(`⚠️ DecoderV2 falhou para ${upperCode}:`, error);
      
      // Fallback crítico: usar cache local apenas se Supabase falhou completamente
      const localAirport = getAirportInfo(upperCode);
      if (localAirport) {
        const airportInfo: RobustAirportInfo = {
          iataCode: upperCode,
          description: formatAirportName(localAirport),
          found: true,
          source: 'cache_fallback'
        };
        
        memoryCache.set(upperCode, airportInfo);
        console.log(`🚨 Fallback cache local para ${upperCode}:`, airportInfo.description);
        return airportInfo;
      }
    }

    // Aeroporto não encontrado
    const notFoundInfo: RobustAirportInfo = {
      iataCode: upperCode,
      description: upperCode, // Usar código como descrição
      found: false,
      source: 'not_found',
      error: `Aeroporto ${upperCode} não encontrado na base de dados nem no cache local`
    };
    
    // Cachear resultado negativo também (para evitar tentativas repetidas)
    memoryCache.set(upperCode, notFoundInfo);
    console.warn(`❌ Aeroporto ${upperCode} não encontrado`);
    return notFoundInfo;
  }

  // Função para limpar cache (útil para testes)
  clearCache(): void {
    memoryCache.clear();
    console.log('🧹 Cache limpo');
  }

  // Função para obter estatísticas do cache
  getCacheStats(): { total: number; found: number; notFound: number } {
    let found = 0;
    let notFound = 0;
    
    for (const info of memoryCache.values()) {
      if (info.found) {
        found++;
      } else {
        notFound++;
      }
    }
    
    return {
      total: memoryCache.size,
      found,
      notFound
    };
  }

  // Função para adicionar aeroporto ao cache manualmente
  addToCache(code: string, airportData: AirportData): void {
    const upperCode = code.toUpperCase().trim();
    const airportInfo: RobustAirportInfo = {
      iataCode: upperCode,
      description: formatAirportName(airportData),
      found: true,
      source: 'cache'
    };
    
    memoryCache.set(upperCode, airportInfo);
    console.log(`➕ Aeroporto ${upperCode} adicionado ao cache:`, airportInfo.description);
  }
}

// Instância singleton
export const robustDecoder = RobustDecoder.getInstance();
