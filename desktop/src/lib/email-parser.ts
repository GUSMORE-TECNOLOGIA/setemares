// EMAIL-MULTI-002: Parser de e-mail com múltiplas opções
import { ParsedEmail, ParsedSegment, ParsedFare, ParsedBaggage } from './types/email-parser';

/**
 * Filtra automaticamente as duas primeiras linhas de cada bloco de reserva
 * - Linha 1: Dados técnicos da emissão (localizador, código atendente, escritório, data)
 * - Linha 2: Nome do passageiro (SOBRENOME/NOME)
 * - Linha 3+: Dados relevantes (voos, tarifas, etc.)
 */
function filterReservationBlocks(pnrText: string): string {
  console.log('🔍 Iniciando filtro de blocos de reserva...');
  
  // Dividir em blocos usando separadores "=="
  const blocks = pnrText.split(/(?:\n\s*)?={2,}(?:\s*\n)?/);
  console.log(`📦 Encontrados ${blocks.length} blocos de reserva`);
  
  const filteredBlocks = blocks.map((block, index) => {
    if (!block.trim()) return '';
    
    const lines = block.split('\n').filter(line => line.trim());
    console.log(`📦 Bloco ${index + 1}: ${lines.length} linhas`);
    
    if (lines.length <= 2) {
      console.log(`⚠️ Bloco ${index + 1}: Muito pequeno (${lines.length} linhas), mantendo original`);
      return block;
    }
    
    // Ignorar as duas primeiras linhas e manter o resto
    const filteredLines = lines.slice(2);
    console.log(`✅ Bloco ${index + 1}: Removidas 2 primeiras linhas, mantidas ${filteredLines.length} linhas`);
    console.log(`🔍 Linhas removidas:`, lines.slice(0, 2));
    console.log(`🔍 Linhas mantidas:`, filteredLines.slice(0, 3));
    
    return filteredLines.join('\n');
  });
  
  // Reconstruir o texto com separadores "==" entre blocos
  const result = filteredBlocks
    .filter(block => block.trim())
    .join('\n==\n');
  
  console.log('✅ Filtro concluído:', result.substring(0, 200) + '...');
  return result;
}

/**
 * Parser principal: converte e-mail bruto em opções estruturadas
 */
export function parseEmail(raw: string): ParsedEmail {
  return parseEmailToOptions(raw);
}

export function parseEmailToOptions(raw: string): ParsedEmail {
  console.log('📧 Iniciando parse do e-mail...');
  console.log('📧 Conteúdo bruto:', raw);
  
  // Só aplicar filtro se NÃO tiver separadores de opções (==, --, +)
  // Se tiver separadores, já são opções limpas, não precisam de filtro
  const hasSeparators = raw.includes('==') || /^--+$/m.test(raw) || /^\+$/m.test(raw);
  const filteredText = hasSeparators ? raw : filterReservationBlocks(raw);
  
  if (hasSeparators) {
    console.log('🔍 PNR com separadores detectado, pulando filtro de 2 linhas');
  } else {
    console.log('🔍 E-mail filtrado (ignorando 2 primeiras linhas de cada bloco):', filteredText);
  }
  
  const blocks = splitByOptions(filteredText);
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
    
    // Detectar número de parcelas - formato: "pagto 10x" ou "parcela 4x"
    const parcelasMatch = text.match(/(?:pagto|parcela(?:do)?)\s+(\d+)x/i);
    const numParcelas = parcelasMatch ? parseInt(parcelasMatch[1]) : undefined;
    
    // Detectar percentual de RAV - formato: "du 7%"
    const ravMatch = text.match(/du\s+(\d+)%/i);
    const ravPercent = ravMatch ? parseInt(ravMatch[1]) : undefined;
    
    // Detectar percentual de Incentivo - formato: "in 2%"
    const incentivoMatch = text.match(/in\s+(\d+)%/i);
    const incentivoPercent = incentivoMatch ? parseInt(incentivoMatch[1]) : undefined;
    
    console.log(`✈️ Segmentos encontrados:`, segments);
    console.log(`💰 Tarifas encontradas:`, fares);
    console.log(`💳 Pagamento:`, payment);
    console.log(`🎒 Bagagem:`, baggage);
    console.log(`📝 Notas:`, notes);
    console.log(`📊 Parcelas:`, numParcelas);
    console.log(`📊 RAV:`, ravPercent);
    console.log(`📊 Incentivo:`, incentivoPercent);
    
    return {
      label: `Opção ${idx + 1}`,
      paymentTerms: payment || undefined,
      notes: notes || undefined,
      segments,
      fares: fares.map(f => ({ ...f, includeInPdf: true })),
      baggage,
      numParcelas,
      ravPercent,
      incentivoPercent
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
  
  // Tentar dividir por linhas que contenham apenas separadores: ==, --, ---, +
  const equalLines = text.split(/\n/).map(line => line.trim());
  const separatorIndexes = equalLines
    .map((line, idx) => {
      // Detecta linhas com apenas: ==, --, ---, OU
      if (line.match(/^=+$/) || line.match(/^-{2,}$/) || line.match(/^OU$/i) || line === '+') {
        return idx;
      }
      return -1;
    })
    .filter(idx => idx !== -1);
  
  console.log('🔍 splitByOptions: Linhas separadoras encontradas:', separatorIndexes);
  
  if (separatorIndexes.length > 0) {
    const lines = text.split(/\n/);
    const blocks: string[] = [];
    
    let start = 0;
    for (const idx of separatorIndexes) {
      if (idx > start) {
        blocks.push(lines.slice(start, idx).join('\n'));
      }
      start = idx + 1;
    }
    
    // Adicionar último bloco
    if (start < lines.length) {
      blocks.push(lines.slice(start).join('\n'));
    }
    
    console.log('🔍 splitByOptions: Blocos criados:', blocks.length);
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
    let trimmed = line.trim();
    
    // Remover número de linha no início (ex: "1 AA" -> "AA", "2 JL" -> "JL")
    trimmed = trimmed.replace(/^\d+\s+/, '');
    
    // Regex mais robusta para novos formatos:
    // Captura: AA 950 12FEB GRUJFK SS2 2235 0615 13FEB
    // Captura: UA 844 07JAN GRUORD HS1 2145 #0530
    // Captura: DL 104 14OCT GRUATL HS1 2250 #0735
    const newFormatMatch = trimmed.match(/^([A-Z0-9]{2,3})\s+(\d{2,5})\s+(\d{1,2}[A-Z]{3})\s+([A-Z]{3})([A-Z]{3})(\*?)\s*([A-Z]{2}\d)\s+(\d{3,4})\s+(\#?\d{3,4})(\s+(\d{1,2}[A-Z]{3}))?/);
    
    if (newFormatMatch) {
      const [, carrier, flight, depDate, depAirport, arrAirport, asterisk, status, depTime, arrTime, , arrDate] = newFormatMatch;
      
      // Converter data e horários para ISO
      const depTimeISO = convertToISO(depDate, depTime);
      // Se tem data de chegada explícita, usar ela; senão, usar data de partida
      const arrTimeISO = arrDate ? convertToISO(arrDate, arrTime) : convertToISO(depDate, arrTime, arrTime?.startsWith('#'));
      
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
    
    // Fallback: versão mais flexível sem status
    const flexibleMatch = trimmed.match(/^([A-Z0-9]{2,3})\s+(\d{2,5})\s+(\d{1,2}[A-Z]{3})\s+([A-Z]{3})([A-Z]{3})\s+(\d{3,4})\s+(\#?\d{3,4})?/);
    if (flexibleMatch) {
      const [, carrier, flight, date, depAirport, arrAirport, depTime, arrTime] = flexibleMatch;
      
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
        status: 'HS1',
        cabin: 'HS',
        bookingClass: '1'
      });
      continue;
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
    
    // Regex para tarifas aceitando 2 formatos:
    // 1) "tarifa usd 2999,00 + txs usd 90,00 *Exe/Internos em eco"
    // 2) "USD2999,00 + txs USD90,00 * exe"
    const fareMatch =
      trimmed.match(/^tarifa\s+usd\s+([\d.,]+)\s*\+\s*txs\s+usd\s+([\d.,]+)\s*\*(.+)$/i) ||
      trimmed.match(/^usd\s*([\d.,]+)\s*\+\s*txs\s+usd\s*([\d.,]+)\s*\*\s*(.+)$/i);
    
    if (fareMatch) {
      const [, baseFareStr, baseTaxesStr, label] = fareMatch;
      
      const baseFare = sanitizeNumber(baseFareStr);
      const baseTaxes = sanitizeNumber(baseTaxesStr);
      
      // Usar o label completo como fareClass para preservar descrições compostas
      // Ex: "Vai Eco/Volta Pre", "Exe/Internos em eco", etc.
      const fareClass = label.trim();
      const paxType = paxTypeFromLabel(label);
      
      fares.push({
        fareClass,
        paxType,
        baseFare,
        baseTaxes,
        includeInPdf: true,
        notes: undefined // Não usar notes separadas, o fareClass já contém tudo
      });
      continue;
    }

    // Fallback: aceitar linha de tarifa sem classe (sem "* ...")
    const noLabelMatch =
      trimmed.match(/^tarifa\s+usd\s+([\d.,]+)\s*\+\s*txs\s+usd\s+([\d.,]+)\s*$/i) ||
      trimmed.match(/^usd\s*([\d.,]+)\s*\+\s*txs\s+usd\s*([\d.,]+)\s*$/i);
    if (noLabelMatch) {
      const [, baseFareStr, baseTaxesStr] = noLabelMatch;
      fares.push({
        fareClass: 'Tarifa',
        paxType: 'ADT',
        baseFare: sanitizeNumber(baseFareStr),
        baseTaxes: sanitizeNumber(baseTaxesStr),
        includeInPdf: true,
        notes: undefined
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
    // Detectar linhas de pagamento mesmo sem o prefixo 'pagto'
    if (trimmed.toLowerCase().startsWith('pagto')) {
      return trimmed;
    }
    // Padrões comuns: "net net", "parcela 6x", "parcelado em 6x"
    if (/\bnet\s+net\b/i.test(trimmed) || /\bparcela\s+\d+x\b/i.test(trimmed) || /\bparcelado\s+em\s+\d+x\b/i.test(trimmed)) {
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
    
    // Regex para bagagem: aceitar com ou sem espaços ao redor da barra
    // Exemplos válidos: "2pc 23kg/pre", "2pc 23kg / pre", "1pc 23kg"
    const baggageMatch = trimmed.match(/^(\d)pc\s+(\d{2})kg(?:\s*\/\s*([a-z]{3}))?$/i);
    
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
  const notes = label
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
