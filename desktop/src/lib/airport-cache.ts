// Cache local de aeroportos para garantir confiabilidade
export interface AirportData {
  iata3: string;
  name: string;
  city: string;
  country: string;
  icao?: string;
}

// Base de dados local confiável de aeroportos
export const AIRPORTS_DATABASE: Record<string, AirportData> = {
  // Aeroportos brasileiros
  'GRU': {
    iata3: 'GRU',
    name: 'Guarulhos International Airport',
    city: 'São Paulo',
    country: 'Brazil',
    icao: 'SBGR'
  },
  'GIG': {
    iata3: 'GIG',
    name: 'Galeão International Airport',
    city: 'Rio de Janeiro',
    country: 'Brazil',
    icao: 'SBGL'
  },
  'CGH': {
    iata3: 'CGH',
    name: 'Congonhas Airport',
    city: 'São Paulo',
    country: 'Brazil',
    icao: 'SBSP'
  },
  'BSB': {
    iata3: 'BSB',
    name: 'Brasília International Airport',
    city: 'Brasília',
    country: 'Brazil',
    icao: 'SBBR'
  },
  'SDU': {
    iata3: 'SDU',
    name: 'Santos Dumont Airport',
    city: 'Rio de Janeiro',
    country: 'Brazil',
    icao: 'SBRJ'
  },
  
  // Aeroportos europeus
  'LIS': {
    iata3: 'LIS',
    name: 'Humberto Delgado Airport',
    city: 'Lisboa',
    country: 'Portugal',
    icao: 'LPPT'
  },
  'BCN': {
    iata3: 'BCN',
    name: 'Barcelona–El Prat Airport',
    city: 'Barcelona',
    country: 'Spain',
    icao: 'LEBL'
  },
  'FCO': {
    iata3: 'FCO',
    name: 'Leonardo da Vinci–Fiumicino Airport',
    city: 'Rome',
    country: 'Italy',
    icao: 'LIRF'
  },
  'CDG': {
    iata3: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    icao: 'LFPG'
  },
  'MAD': {
    iata3: 'MAD',
    name: 'Adolfo Suárez Madrid–Barajas Airport',
    city: 'Madrid',
    country: 'Spain',
    icao: 'LEMD'
  },
  'LHR': {
    iata3: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    icao: 'EGLL'
  },
  'FRA': {
    iata3: 'FRA',
    name: 'Frankfurt Airport',
    city: 'Frankfurt',
    country: 'Germany',
    icao: 'EDDF'
  },
  'AMS': {
    iata3: 'AMS',
    name: 'Amsterdam Airport Schiphol',
    city: 'Amsterdam',
    country: 'Netherlands',
    icao: 'EHAM'
  },
  'ZUR': {
    iata3: 'ZUR',
    name: 'Zurich Airport',
    city: 'Zurich',
    country: 'Switzerland',
    icao: 'LSZH'
  },
  'VIE': {
    iata3: 'VIE',
    name: 'Vienna International Airport',
    city: 'Vienna',
    country: 'Austria',
    icao: 'LOWW'
  },
  
  // Aeroportos americanos
  'MIA': {
    iata3: 'MIA',
    name: 'Miami International Airport',
    city: 'Miami',
    country: 'USA',
    icao: 'KMIA'
  },
  'ATL': {
    iata3: 'ATL',
    name: 'Hartsfield–Jackson Atlanta International Airport',
    city: 'Atlanta',
    country: 'USA',
    icao: 'KATL'
  },
  'JFK': {
    iata3: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'USA',
    icao: 'KJFK'
  },
  'LAX': {
    iata3: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'USA',
    icao: 'KLAX'
  },
  'BOS': {
    iata3: 'BOS',
    name: 'Logan International Airport',
    city: 'Boston',
    country: 'USA',
    icao: 'KBOS'
  },
  
  // Aeroportos asiáticos
  'HND': {
    iata3: 'HND',
    name: 'Haneda Airport',
    city: 'Tokyo',
    country: 'Japan',
    icao: 'RJTT'
  },
  'NRT': {
    iata3: 'NRT',
    name: 'Narita International Airport',
    city: 'Tokyo',
    country: 'Japan',
    icao: 'RJAA'
  },
  'ICN': {
    iata3: 'ICN',
    name: 'Incheon International Airport',
    city: 'Seoul',
    country: 'South Korea',
    icao: 'RKSI'
  },
  'PVG': {
    iata3: 'PVG',
    name: 'Shanghai Pudong International Airport',
    city: 'Shanghai',
    country: 'China',
    icao: 'ZSPD'
  },
  'SIN': {
    iata3: 'SIN',
    name: 'Singapore Changi Airport',
    city: 'Singapore',
    country: 'Singapore',
    icao: 'WSSS'
  },
  
  // Aeroportos sul-americanos
  'SCL': {
    iata3: 'SCL',
    name: 'Arturo Merino Benítez International Airport',
    city: 'Santiago',
    country: 'Chile',
    icao: 'SCEL'
  },
  'EZE': {
    iata3: 'EZE',
    name: 'Ezeiza International Airport',
    city: 'Buenos Aires',
    country: 'Argentina',
    icao: 'SAEZ'
  },
  'LIM': {
    iata3: 'LIM',
    name: 'Jorge Chávez International Airport',
    city: 'Lima',
    country: 'Peru',
    icao: 'SPJC'
  },
  'BOG': {
    iata3: 'BOG',
    name: 'El Dorado International Airport',
    city: 'Bogotá',
    country: 'Colombia',
    icao: 'SKBO'
  }
};

// Função para buscar aeroporto com fallback robusto
export function getAirportInfo(code: string): AirportData | null {
  const upperCode = code.toUpperCase().trim();
  return AIRPORTS_DATABASE[upperCode] || null;
}

// Função para formatar nome completo do aeroporto
export function formatAirportName(airport: AirportData): string {
  // Remover código IATA duplicado se já estiver no nome
  const cleanName = airport.name.replace(` (${airport.iata3})`, '').trim();
  return `${cleanName} (${airport.iata3}), ${airport.city}, ${airport.country}`;
}

// Função para verificar se um código de aeroporto é válido
export function isValidAirportCode(code: string): boolean {
  return getAirportInfo(code) !== null;
}

// Função para listar todos os códigos de aeroportos disponíveis
export function getAllAirportCodes(): string[] {
  return Object.keys(AIRPORTS_DATABASE);
}
