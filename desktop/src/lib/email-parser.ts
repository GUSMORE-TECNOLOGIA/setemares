// EMAIL-MULTI-002: Parser de e-mail com múltiplas opções
import { ParsedEmail, ParsedOption, ParsedSegment, ParsedFare, ParsedBaggage } from './types/email-parser';

/**
 * Parser principal: converte e-mail bruto em opções estruturadas
 */
export function parseEmailToOptions(raw: string): ParsedEmail {
  console.log('📧 Iniciando parse do e-mail...');
  console.log('📧 Conteúdo bruto:', raw);
  
  const blocks = splitByOptions(raw);
  console.log(`📦 Encontrados ${blocks.length} blocos de opções`);
  blocks.forEach((block, idx) => {
    console.log(`📦 Bloco ${idx + 1}:`, block.substring(0, 200) + '...');
  });
  
  const options = blocks.map((text, idx) => {
    console.log(`🔍 Processando Opção ${idx + 1}...`);
    console.log(`🔍 Texto da opção:`, text);
    
    const segments = parseSegments(text);
    const fares = parseFareLines(text);
    const payment = findPayment(text);
    const baggage = parseBaggage(text);
    const notes = findStandaloneNotes(text);
    
    console.log(`✈️ Segmentos encontrados:`, segments);
    console.log(`💰 Tarifas encontradas:`, fares);
    console.log(`💳 Pagamento:`, payment);
    console.log(`🎒 Bagagem:`, baggage);
    console.log(`📝 Notas:`, notes);
    
    return {
      label: `Opção ${idx + 1}`,
      paymentTerms: payment || undefined,
      notes: notes || undefined,
      segments,
      fares: fares.map(f => ({ ...f, includeInPdf: true })),
      baggage
    };
  });
  
  console.log('✅ Parse concluído:', options);
  return { options };
}

/**
 * Divide o texto em blocos de opções (separados por == ou linhas em branco duplas)
 */
function splitByOptions(text: string): string[] {
  console.log('🔍 splitByOptions: Iniciando divisão do texto...');
  
  // Primeiro, tentar dividir por linhas que contenham apenas ==
  const equalLines = text.split(/\n/).map(line => line.trim());
  const equalIndexes = equalLines
    .map((line, idx) => line.match(/^=+$/) ? idx : -1)
    .filter(idx => idx !== -1);
  
  console.log('🔍 splitByOptions: Linhas com === encontradas:', equalIndexes);
  
  if (equalIndexes.length > 0) {
    const lines = text.split(/\n/);
    const blocks: string[] = [];
    
    let start = 0;
    for (const idx of equalIndexes) {
      if (idx > start) {
        blocks.push(lines.slice(start, idx).join('\n'));
      }
      start = idx + 1;
    }
    
    // Adicionar último bloco
    if (start < lines.length) {
      blocks.push(lines.slice(start).join('\n'));
    }
    
    console.log('🔍 splitByOptions: Blocos criados com ===:', blocks.length);
    return blocks.filter(block => block.trim().length > 0);
  }
  
  // Fallback: dividir por duas linhas em branco consecutivas
  const doubleBlankBlocks = text.split(/\n\s*\n\s*\n/).filter(block => block.trim().length > 0);
  console.log('🔍 splitByOptions: Blocos criados com linhas em branco:', doubleBlankBlocks.length);
  
  // Se ainda não encontrou divisões, tratar como uma única opção
  if (doubleBlankBlocks.length === 0) {
    console.log('🔍 splitByOptions: Nenhuma divisão encontrada, tratando como opção única');
    return [text];
  }
  
  return doubleBlankBlocks;
}

/**
 * Extrai segmentos de voo do texto
 */
function parseSegments(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const lines = text.split(/\n/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Regex para segmentos: AA 1234 14OCT GRUATL HS1 2250 #0735 (mais flexível com espaços)
    const segmentMatch = trimmed.match(/^([A-Z0-9]{2})\s+(\d{2,4})\s+(\d{2}[A-Z]{3})\s+([A-Z]{3})([A-Z]{3})\s+([A-Z]{2}\d)\s+(\d{3,4})\s+(\#?\d{3,4})?$/);
    
    // Se não encontrou com regex rígida, tentar versão mais flexível
    if (!segmentMatch) {
      // Versão mais flexível: aceita espaços extras e formatos variados
      const flexibleMatch = trimmed.match(/^([A-Z0-9]{2})\s+(\d{2,4})\s+(\d{2}[A-Z]{3})\s+([A-Z]{3})([A-Z]{3})\s+([A-Z]{2}\d)\s+(\d{3,4})\s+(\#?\d{3,4})?/);
      if (flexibleMatch) {
        const [, carrier, flight, date, depAirport, arrAirport, status, depTime, arrTime] = flexibleMatch;
        
        // Converter data e horários para ISO
        const depTimeISO = convertToISO(date, depTime);
        const arrTimeISO = convertToISO(date, arrTime, arrTime?.startsWith('#'));
        
        segments.push({
          carrier,
          flight,
          depAirport,
          arrAirport,
          depTimeISO,
          arrTimeISO,
          status,
          cabin: status?.substring(0, 2),
          bookingClass: status?.substring(2)
        });
        continue;
      }
      
      // Tentar versão ainda mais flexível para voos sem status (ex: DL 104 14OCT GRUATL 2250 #0735)
      const veryFlexibleMatch = trimmed.match(/^([A-Z0-9]{2})\s+(\d{2,4})\s+(\d{2}[A-Z]{3})\s+([A-Z]{3})([A-Z]{3})\s+(\d{3,4})\s+(\#?\d{3,4})?/);
      if (veryFlexibleMatch) {
        const [, carrier, flight, date, depAirport, arrAirport, depTime, arrTime] = veryFlexibleMatch;
        
        // Converter data e horários para ISO
        const depTimeISO = convertToISO(date, depTime);
        const arrTimeISO = convertToISO(date, arrTime, arrTime?.startsWith('#'));
        
        segments.push({
          carrier,
          flight,
          depAirport,
          arrAirport,
          depTimeISO,
          arrTimeISO,
          status: 'HS1', // Default status
          cabin: 'HS',
          bookingClass: '1'
        });
        continue;
      }
      
      // Tentar versão para voos com espaços extras (ex: DL  104   14OCT GRUATL HS1  2250  #0735)
      const extraSpacesMatch = trimmed.match(/^([A-Z0-9]{2})\s+(\d{2,4})\s+(\d{2}[A-Z]{3})\s+([A-Z]{3})([A-Z]{3})\s+([A-Z]{2}\d)\s+(\d{3,4})\s+(\#?\d{3,4})?/);
      if (extraSpacesMatch) {
        const [, carrier, flight, date, depAirport, arrAirport, status, depTime, arrTime] = extraSpacesMatch;
        
        // Converter data e horários para ISO
        const depTimeISO = convertToISO(date, depTime);
        const arrTimeISO = convertToISO(date, arrTime, arrTime?.startsWith('#'));
        
        segments.push({
          carrier,
          flight,
          depAirport,
          arrAirport,
          depTimeISO,
          arrTimeISO,
          status,
          cabin: status?.substring(0, 2),
          bookingClass: status?.substring(2)
        });
        continue;
      }
    }
    
    if (segmentMatch) {
      const [, carrier, flight, date, depAirport, arrAirport, status, depTime, arrTime] = segmentMatch;
      
      // Converter data e horários para ISO
      const depTimeISO = convertToISO(date, depTime);
      const arrTimeISO = convertToISO(date, arrTime, arrTime?.startsWith('#'));
      
      segments.push({
        carrier,
        flight,
        depAirport,
        arrAirport,
        depTimeISO,
        arrTimeISO,
        status,
        cabin: status?.substring(0, 2),
        bookingClass: status?.substring(2)
      });
    }
  }
  
  return segments;
}

/**
 * Extrai linhas de tarifa do texto
 */
function parseFareLines(text: string): ParsedFare[] {
  const fares: ParsedFare[] = [];
  const lines = text.split(/\n/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Regex para tarifas: tarifa usd 2999.00 + txs usd 90.00 *Exe/Internos em eco
    const fareMatch = trimmed.match(/^tarifa\s+usd\s+([\d.,]+)\s+\+\s+txs\s+usd\s+([\d.,]+)\s+\*(.+)$/i);
    
    if (fareMatch) {
      const [, baseFareStr, baseTaxesStr, label] = fareMatch;
      
      const baseFare = sanitizeNumber(baseFareStr);
      const baseTaxes = sanitizeNumber(baseTaxesStr);
      
      // Extrair fare class e pax type do label
      const fareClass = normalizeFareClass(extractFareClass(label));
      const paxType = paxTypeFromLabel(label);
      const notes = extractNotes(label);
      
      fares.push({
        fareClass,
        paxType,
        baseFare,
        baseTaxes,
        notes: notes || undefined
      });
    }
  }
  
  return fares;
}

/**
 * Encontra linha de pagamento
 */
function findPayment(text: string): string | null {
  const lines = text.split(/\n/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith('pagto')) {
      return trimmed;
    }
  }
  
  return null;
}

/**
 * Extrai informações de bagagem
 */
function parseBaggage(text: string): ParsedBaggage[] {
  const baggage: ParsedBaggage[] = [];
  const lines = text.split(/\n/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Regex para bagagem: 2pc 23kg/pre, 1pc 23kg, 2pc 32kg/exe
    const baggageMatch = trimmed.match(/^(\d)pc\s+(\d{2})kg(?:\/([a-z]{3}))?$/i);
    
    if (baggageMatch) {
      const [, piecesStr, kgStr, fareClass] = baggageMatch;
      
      baggage.push({
        pieces: parseInt(piecesStr),
        pieceKg: parseInt(kgStr),
        fareClass: fareClass ? fareClass.toLowerCase() : undefined
      });
    }
  }
  
  return baggage;
}

/**
 * Encontra notas soltas no texto
 */
function findStandaloneNotes(text: string): string | null {
  const lines = text.split(/\n/);
  const notes: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Ignorar linhas que são segmentos, tarifas, pagamento ou bagagem
    if (
      trimmed.match(/^([A-Z0-9]{2})\s+(\d{2,4})\s+(\d{2}[A-Z]{3})/) || // segmentos
      trimmed.match(/^tarifa\s+usd/) || // tarifas
      trimmed.toLowerCase().startsWith('pagto') || // pagamento
      trimmed.match(/^\dpc\s+\d{2}kg/) || // bagagem
      trimmed.match(/^=+$/) || // separadores
      trimmed.length === 0 // linhas vazias
    ) {
      continue;
    }
    
    // Se chegou aqui, é uma nota solta
    if (trimmed.length > 0) {
      notes.push(trimmed);
    }
  }
  
  return notes.length > 0 ? notes.join('; ') : null;
}

// ===== FUNÇÕES AUXILIARES =====

/**
 * Sanitiza números (aceita 4.705,00, 4705.00, usd 4705)
 */
function sanitizeNumber(str: string): number {
  // Remover "usd" se presente
  let cleaned = str.replace(/usd\s*/gi, '').trim();
  
  // Se tem vírgula como separador decimal (formato brasileiro)
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
  }
  
  // Se tem ponto como separador de milhares e vírgula como decimal
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  
  return parseFloat(cleaned) || 0;
}

/**
 * Normaliza classe de tarifa
 */
function normalizeFareClass(fareClass: string): string {
  const normalized = fareClass.toLowerCase().trim();
  
  if (normalized.includes('exe') || normalized.includes('executiva')) {
    return 'Exe';
  }
  if (normalized.includes('premeco') || normalized.includes('premium eco')) {
    return 'PremEco';
  }
  if (normalized.includes('pre') || normalized.includes('premium')) {
    return 'Pre';
  }
  if (normalized.includes('eco') || normalized.includes('economica')) {
    return 'Eco';
  }
  
  return fareClass; // Retorna original se não reconhecer
}

/**
 * Extrai classe de tarifa do label
 */
function extractFareClass(label: string): string {
  // Pegar primeiro token antes de / ou espaço
  const firstToken = label.split(/[/\s]/)[0];
  return firstToken || label;
}

/**
 * Extrai tipo de passageiro do label
 */
function paxTypeFromLabel(label: string): 'ADT'|'CHD'|'INF' {
  const lower = label.toLowerCase();
  
  if (lower.includes('/chd') || lower.includes('chd')) {
    return 'CHD';
  }
  if (lower.includes('/inf') || lower.includes('inf')) {
    return 'INF';
  }
  
  return 'ADT'; // Default
}

/**
 * Extrai notas do label (tudo após a classe de tarifa)
 */
function extractNotes(label: string): string | null {
  // Remover classe de tarifa e tipo de pax do início
  let notes = label
    .replace(/^(exe|pre|eco|premeco)\s*/i, '')
    .replace(/^\s*\/?(chd|inf|adt)\s*/i, '')
    .trim();
  
  return notes.length > 0 ? notes : null;
}

/**
 * Converte data e horário para ISO (reutiliza lógica do decoder atual)
 */
function convertToISO(dateStr: string, timeStr: string, isOvernight = false): string {
  try {
    // Validar entrada
    if (!dateStr || !timeStr || typeof dateStr !== 'string' || typeof timeStr !== 'string') {
      console.warn('⚠️ Dados inválidos para conversão:', { dateStr, timeStr });
      return new Date().toISOString();
    }

    // Converter DDMMM para Date
    const day = parseInt(dateStr.substring(0, 2));
    const monthStr = dateStr.substring(2, 5);
    const year = new Date().getFullYear(); // Assumir ano atual
    
    const monthMap: { [key: string]: number } = {
      'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
      'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
    };
    
    const month = monthMap[monthStr];
    if (month === undefined) {
      throw new Error(`Mês inválido: ${monthStr}`);
    }
    
    // Converter horário HHMM para horas e minutos
    const cleanTime = timeStr.replace('#', '');
    if (cleanTime.length !== 4) {
      throw new Error(`Formato de horário inválido: ${timeStr}`);
    }
    
    const hours = parseInt(cleanTime.substring(0, 2));
    const minutes = parseInt(cleanTime.substring(2, 4));
    
    // Validar horário
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Horário inválido: ${timeStr}`);
    }
    
    // Criar data
    const date = new Date(year, month, day, hours, minutes);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      throw new Error(`Data inválida: ${dateStr}`);
    }
    
    // Se é overnight, adicionar 1 dia
    if (isOvernight) {
      date.setDate(date.getDate() + 1);
    }
    
    return date.toISOString();
  } catch (error) {
    console.warn('❌ Erro ao converter data/hora:', dateStr, timeStr, error);
    return new Date().toISOString(); // Fallback para data atual
  }
}
