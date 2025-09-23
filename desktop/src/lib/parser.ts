// Bridge para conectar com o parser Python
export interface ParsedPNR {
  tarifa: string;
  taxas_base: string;
  fares: Array<{
    category: string;
    tarifa: string;
    taxas: string;
  }>;
  fee: string;
  incentivo: string;
  trechos: string[];
  multa: string;
  currency: string;
  pagamento_hint?: string;
  bagagem_hint?: string;
  quotations?: ParsedPNR[];
  is_multi?: boolean;
  // Novos campos para resumo
  segments?: any[];
  paymentTerms?: string;
  baggage?: string;
  notes?: string;
}

export interface DecodedFlight {
  company: { iataCode: string; description: string };
  flight: string;
  departureDate: string; // DD/MM/AAAA
  departureTime: string; // HH:MM
  landingDate: string; // DD/MM/AAAA
  landingTime: string; // HH:MM
  departureAirport: { iataCode: string; description: string };
  landingAirport: { iataCode: string; description: string };
  overnight: boolean;
  isOvernight: boolean; // Nova propriedade para indicar voo noturno
}

export interface DecodedItinerary {
  source: string;
  overnights: number;
  flightInfo: {
    flights: DecodedFlight[];
  };
}

// Simulação do parser Python (será substituído por API real)
export async function parsePNR(pnrText: string): Promise<ParsedPNR | null> {
  if (!pnrText.trim()) return null;
  
  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Parser básico para demonstração
  const lines = pnrText.split('\n').filter(line => line.trim());
  const trechos = lines.filter(line => /^[A-Z]{2}\s+\d+/.test(line.trim()));
  
  // Detectar tarifas
  const tarifaMatches = pnrText.match(/tarifa\s+usd\s+([\d.,]+)/gi) || [];
  const taxasMatches = pnrText.match(/txs\s+usd\s+([\d.,]+)/gi) || [];
  
  const fares = tarifaMatches.map((tarifa, i) => {
    const tarifaValue = tarifa.match(/([\d.,]+)/)?.[1] || '0';
    const taxasValue = taxasMatches[i]?.match(/([\d.,]+)/)?.[1] || '0';
    
    // Detectar categoria do sufixo
    const lineIndex = pnrText.indexOf(tarifa);
    const lineEnd = pnrText.indexOf('\n', lineIndex);
    const fullLine = pnrText.substring(lineIndex, lineEnd > -1 ? lineEnd : pnrText.length);
    
    let category = 'ADT';
    if (fullLine.toLowerCase().includes('chd') || fullLine.toLowerCase().includes('child')) {
      category = 'CHD';
    } else if (fullLine.toLowerCase().includes('exe')) {
      category = 'Exe';
    } else if (fullLine.toLowerCase().includes('eco')) {
      category = 'Eco';
    } else if (fullLine.toLowerCase().includes('pre')) {
      category = 'Pre';
    }
    
    return {
      category,
      tarifa: tarifaValue,
      taxas: taxasValue,
    };
  });
  
  // Detectar múltiplas cotações
  const isMulti = pnrText.includes('==');
  
  // Extrair dados adicionais
  const paymentTerms = pnrText.match(/pagto\s+([^\n]+)/i)?.[1]?.trim() || 'Em até 4x no cartão de crédito. Taxas à vista.';
  const baggage = pnrText.match(/(\d+pc\s+\d+kg)/i)?.[1]?.trim() || 'Conforme regra da tarifa';
  const notes = pnrText.match(/Troca e reembolsa[^\n]+/i)?.[0]?.trim() || '';
  
  // Decodificar segmentos
  const segments = trechos.map(trecho => {
    const parts = trecho.trim().split(/\s+/);
    const [cia, flight, dateStr, route, , depTime, arrTime] = parts;
    
    if (!cia || !flight || !dateStr || !route) return null;
    
    const orig = route?.substring(0, 3) || 'GRU';
    const dest = route?.substring(3, 6) || 'ICN';
    const decodedDate = decodeDate(dateStr);
    const depTimeFormatted = formatTime(depTime);
    const arrTimeFormatted = formatTime(arrTime);
    
    return {
      carrier: cia,
      flight: flight,
      depAirport: orig,
      arrAirport: dest,
      depTimeISO: new Date().toISOString(), // Placeholder
      arrTimeISO: new Date().toISOString(), // Placeholder
    };
  }).filter(segment => segment !== null);
  
  return {
    tarifa: fares[0]?.tarifa || '0',
    taxas_base: fares[0]?.taxas || '0',
    fares,
    fee: '0',
    incentivo: '0',
    trechos,
    multa: '0',
    currency: 'USD',
    is_multi: isMulti,
    // Novos campos
    segments,
    paymentTerms,
    baggage,
    notes,
  };
}

// Simulação do decoder de itinerário
export async function decodeItinerary(trechos: string[]): Promise<DecodedItinerary | null> {
  if (!trechos.length) return null;
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const flights: (DecodedFlight | null)[] = trechos.map(trecho => {
    // Exemplo: "LA 8084   22NOV GRULHR HS1  2340  #1405"
    // Exemplo: "DL  104   14OCT GRUATL HS1  2250  #0735"
    const parts = trecho.trim().split(/\s+/);
    console.log('🔍 Trecho original:', trecho);
    console.log('🔍 Parts divididas:', parts);
    
    // Tentar diferentes formatos
    let cia, flight, dateStr, route, depTime, arrTime;
    
    if (parts.length >= 6) {
      // Formato: "DL  104   14OCT GRUATL HS1  2250  #0735"
      [cia, flight, dateStr, route, , depTime, arrTime] = parts;
    } else if (parts.length >= 5) {
      // Formato: "LA 8084   22NOV GRULHR HS1  2340  #1405"
      [cia, flight, dateStr, route, depTime, arrTime] = parts;
    } else {
      console.warn('⚠️ Trecho inválido - formato não reconhecido:', trecho);
      return null;
    }
    
    // Validar se temos os dados mínimos necessários
    if (!cia || !flight || !dateStr || !route) {
      console.warn('⚠️ Trecho inválido - dados insuficientes:', trecho);
      return null;
    }
    
    const orig = route?.substring(0, 3) || 'GRU';
    const dest = route?.substring(3, 6) || 'ICN';
    
    // Decodificar data (ex: "22NOV" -> "22/11/2025")
    const decodedDate = decodeDate(dateStr);
    
    // Decodificar horários
    const depTimeFormatted = formatTime(depTime);
    
    // Para voos noturnos (#), adicionar 1 dia à data de chegada
    let arrDate = decodedDate;
    let isOvernight = false;
    if (trecho.includes('#')) {
      isOvernight = true;
      // Converter data brasileira para Date, adicionar 1 dia e converter de volta
      const [day, month, year] = decodedDate.split('/');
      const nextDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day) + 1);
      arrDate = `${nextDay.getDate().toString().padStart(2, '0')}/${(nextDay.getMonth() + 1).toString().padStart(2, '0')}/${nextDay.getFullYear()}`;
    }
    const arrTimeFormatted = formatTime(arrTime);
    
    return {
      company: { iataCode: cia, description: getCompanyName(cia) },
      flight,
      departureDate: decodedDate,
      departureTime: depTimeFormatted,
      landingDate: arrDate,
      landingTime: arrTimeFormatted,
      departureAirport: { iataCode: orig, description: getAirportName(orig) },
      landingAirport: { iataCode: dest, description: getAirportName(dest) },
      overnight: trecho.includes('#'),
      isOvernight: isOvernight, // Indica se é voo noturno (chegada no dia seguinte)
    };
  }).filter((flight): flight is DecodedFlight => flight !== null);
  
  return {
    source: 'internal-parser',
    overnights: flights.filter(f => f.overnight).length,
    flightInfo: { flights },
  };
}

function decodeDate(dateStr: string): string {
  // Exemplo: "22NOV" -> "22/11/2025" (formato brasileiro DD/MM/AAAA)
  const monthMap: Record<string, string> = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
    'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };
  
  const match = dateStr.match(/(\d{1,2})([A-Z]{3})/);
  if (!match) {
    console.warn('❌ Data inválida no PNR:', dateStr);
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  }
  
  const [, day, month] = match;
  const monthNum = monthMap[month] || '11';
  
  // Usar ano atual (2025) e ajustar se necessário
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentDay = new Date().getDate();
  
  let year = currentYear;
  const parsedMonth = parseInt(monthNum);
  const parsedDay = parseInt(day);
  
  // Se a data já passou este ano, assumir próximo ano
  if (parsedMonth < currentMonth || 
      (parsedMonth === currentMonth && parsedDay < currentDay)) {
    year = currentYear + 1;
  }
  
  const brazilianDate = `${day.padStart(2, '0')}/${monthNum}/${year}`;
  console.log(`📅 Decodificando data: ${dateStr} -> ${brazilianDate}`);
  
  return brazilianDate;
}

function formatTime(timeStr: string | undefined): string {
  // Verificar se timeStr existe e é string
  if (!timeStr || typeof timeStr !== 'string') {
    console.warn('⚠️ formatTime recebeu valor inválido:', timeStr);
    return '00:00';
  }
  
  // Remover # se presente e formatar horário
  const cleanTime = timeStr.replace('#', '');
  
  // Se já está no formato HH:MM, retornar diretamente
  if (cleanTime.match(/^\d{2}:\d{2}$/)) {
    console.log(`🕐 Horário já formatado: ${timeStr} -> ${cleanTime}`);
    return cleanTime;
  }
  
  // Exemplo: "2340" -> "23:40", "1405" -> "14:05"
  if (cleanTime.length === 4) {
    const hours = cleanTime.substring(0, 2);
    const minutes = cleanTime.substring(2, 4);
    
    // Validar horário (00-23 para horas, 00-59 para minutos)
    const h = parseInt(hours);
    const m = parseInt(minutes);
    
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      console.log(`🕐 Formatando horário: ${timeStr} -> ${hours}:${minutes}`);
      return `${hours}:${minutes}`;
    } else {
      console.warn('❌ Horário inválido:', timeStr);
      return '00:00';
    }
  }
  
  console.warn('❌ Formato de horário inválido:', timeStr);
  return '00:00';
}

function getCompanyName(code: string): string {
  const companies: Record<string, string> = {
    'LA': 'LATAM Airlines',
    'BA': 'British Airways',
    'IB': 'Iberia',
    'TP': 'TAP Air Portugal',
    'AF': 'Air France',
    'KL': 'KLM',
    'LH': 'Lufthansa'
  };
  return companies[code] || code;
}

function getAirportName(code: string): string {
  const airports: Record<string, string> = {
    GRU: 'Guarulhos International Airport (GRU), São Paulo, Brazil',
    LHR: 'London Heathrow Airport (LHR), London, England, United Kingdom',
    GVA: 'Cointrin International Airport (GVA), Geneva, Switzerland',
    MAD: 'Madrid–Barajas Airport (MAD), Madrid, Spain',
    ICN: 'Incheon International Airport (ICN), Seoul, South Korea',
    PVG: 'Shanghai Pudong International Airport (PVG), Shanghai, China',
    ATL: 'Hartsfield–Jackson Atlanta International Airport (ATL), Atlanta, USA',
    BOS: 'Logan International Airport (BOS), Boston, USA',
  };
  return airports[code] || code;
}