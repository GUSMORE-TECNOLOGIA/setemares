// Bridge para conectar com o parser Python
export interface ParsedPNR {
  tarifa: string;
  taxas_base: string;
  fares: Array<{
    category: string;
    tarifa: string;
    taxas: string;
    paxType?: string;
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
  numParcelas?: number; // Número de parcelas detectado no PNR
  ravPercent?: number; // Percentual de RAV detectado no PNR
  incentivoPercent?: number; // Percentual de Incentivo detectado no PNR
  feeUSD?: number; // Fee em USD detectado no PNR
}

export interface DecodedFlight {
  company: { iataCode: string; description: string };
  flight: string;
  departureDate: string; // DD/MM/AAAA
  departureTime: string; // HH:MM
  landingDate: string; // DD/MM/AAAA
  landingTime: string; // HH:MM
  departureAirport: { iataCode: string; description: string; found: boolean; error?: string };
  landingAirport: { iataCode: string; description: string; found: boolean; error?: string };
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

// Simulação do parser Python (será substituído por API real)
export async function parsePNR(pnrText: string): Promise<ParsedPNR | null> {
  if (!pnrText.trim()) return null;

  // Verificar se há separador de múltiplas cotações
  if (pnrText.match(/(?:\n\s*)?={2,}(?:\s*\n)?/)) {
    console.log('🔀 Detectado PNR com múltiplas opções (==)');
    const parts = pnrText.split(/(?:\n\s*)?={2,}(?:\s*\n)?/).filter(p => p.trim().length > 0);

    if (parts.length > 1) {
      console.log(`📦 Encontradas ${parts.length} opções de cotação`);
      const quotations = await Promise.all(parts.map(part => _parseSinglePNR(part)));
      const validQuotations = quotations.filter(q => q !== null) as ParsedPNR[];

      if (validQuotations.length > 0) {
        return {
          ...validQuotations[0],
          is_multi: true,
          quotations: validQuotations
        };
      }
    }
  }

  return _parseSinglePNR(pnrText);
}

async function _parseSinglePNR(pnrText: string): Promise<ParsedPNR | null> {
  if (!pnrText.trim()) return null;

  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 500));

  // Filtrar automaticamente as duas primeiras linhas de cada bloco de reserva
  const filteredText = filterReservationBlocks(pnrText);
  console.log('🔍 PNR filtrado (ignorando 2 primeiras linhas de cada bloco):', filteredText);

  // Parser básico para demonstração
  const lines = filteredText.split('\n').filter(line => line.trim());
  const trechos = lines.filter(line => /^[A-Z]{2}\s+\d+/.test(line.trim()));

  // Detectar moeda do PNR - procura por padrões como "EUR6500" ou "USD 6500" ou "usd" no texto
  let detectedCurrency = 'USD'; // Default
  const currencyMatch = pnrText.match(/\b(usd|eur|brl|gbp|cad|aud)\b/i) ||
    pnrText.match(/(EUR|USD|BRL|GBP|CAD|AUD)\d+/i);
  if (currencyMatch) {
    detectedCurrency = currencyMatch[1].toUpperCase();
  }

  // Detectar múltiplas tarifas em dois formatos
  // 1) "tarifa usd X + txs usd Y *Categoria[/Tipo]"
  // 2) "USD X + txs USD Y * categoria[/tipo]"
  const fareLinesTarifa = pnrText.match(/^[ \t]*tarifa\s+usd\s+[\d.,]+\s*\+\s*txs\s+usd\s+[\d.,]+\s*\*[^\n]+/gim) || [];
  const fareLinesUSD = pnrText.match(/^[ \t]*usd\s*[\d.,]+\s*\+\s*txs\s+usd\s*[\d.,]+\s*\*\s*[^\n]+/gim) || [];
  const fareLines = [...fareLinesTarifa, ...fareLinesUSD];

  let fares: Array<{ category: string; tarifa: string; taxas: string; paxType?: string }> = [];

  if (fareLines.length > 0) {
    // Múltiplas tarifas detectadas
    fares = fareLines.map(fareLine => {
      const match = fareLine.match(/tarifa\s+usd\s+([\d.,]+)\s*\+\s*txs\s+usd\s+([\d.,]+)\s*\*\s*([^\/\n]+)(?:\/(\w+))?/i)
        || fareLine.match(/usd\s*([\d.,]+)\s*\+\s*txs\s+usd\s*([\d.,]+)\s*\*\s*([^\/\n]+)(?:\/(\w+))?/i);
      if (match) {
        const tarifaValue = match[1]?.replace(',', '.') || '0';
        const taxasValue = match[2]?.replace(',', '.') || '0';
        const categoryRaw = match[3]?.trim() || '';
        const paxTypeRaw = match[4]?.trim() || '';

        // Normalizar categoria
        const category = categoryRaw.toLowerCase() === 'exe' ? 'Exe' :
          categoryRaw.toLowerCase() === 'primeira' ? 'Primeira' :
            categoryRaw.toLowerCase() === 'eco' ? 'Eco' :
              categoryRaw.toLowerCase() === 'pre' ? 'Pre' :
                categoryRaw.toUpperCase();

        // Normalizar tipo de passageiro
        const paxType = paxTypeRaw.toLowerCase() === 'chd' ? 'CHD' :
          paxTypeRaw.toLowerCase() === 'inf' ? 'INF' :
            paxTypeRaw.toLowerCase() === 'adt' ? 'ADT' :
              paxTypeRaw.toUpperCase() || 'ADT';

        console.log(`🔍 Tarifa detectada: ${category}/${paxType} - USD ${tarifaValue} + USD ${taxasValue}`);

        return {
          category,
          tarifa: tarifaValue,
          taxas: taxasValue,
          paxType
        };
      }
      return null;
    }).filter(fare => fare !== null) as Array<{ category: string; tarifa: string; taxas: string; paxType?: string }>;
  } else {
    // Fallback para formato antigo - uma única tarifa
    const fareLineMatch = pnrText.match(/USD([\d.,]+)\s*\+\s*txs\s+USD([\d.,]+)\s*\*\s*(\w+)/i);

    if (fareLineMatch) {
      // Padrão completo encontrado - uma única tarifa
      const tarifaValue = fareLineMatch[1]?.replace(',', '.') || '0';
      const taxasValue = fareLineMatch[2]?.replace(',', '.') || '0';
      const category = fareLineMatch[3]?.toLowerCase() === 'exe' ? 'Exe' :
        fareLineMatch[3]?.toLowerCase() === 'eco' ? 'Eco' :
          fareLineMatch[3]?.toLowerCase() === 'pre' ? 'Pre' : 'ADT';

      fares = [{
        category,
        tarifa: tarifaValue,
        taxas: taxasValue,
      }];
    } else {
      // NOVO: aceitar linha sem classe (sem '* ...')
      const noClassTarifa = pnrText.match(/tarifa\s+usd\s+([\d.,]+)\s*\+\s*txs\s+usd\s+([\d.,]+)/i)
        || pnrText.match(/usd\s*([\d.,]+)\s*\+\s*txs\s+usd\s*([\d.,]+)/i);
      if (noClassTarifa) {
        const tarifaValue = noClassTarifa[1]?.replace(',', '.') || '0';
        const taxasValue = noClassTarifa[2]?.replace(',', '.') || '0';
        fares = [{
          category: 'Tarifa',
          tarifa: tarifaValue,
          taxas: taxasValue
        }];
      } else {
        // NOVO: Suporte para formato FARE: e TAXES:
        const fareTaxesLines = pnrText.match(/FARE:\s+(\w+)\s+([\d.,]+)\s*\n\s*TAXES:\s+([\d.,]+)/gi);
        if (fareTaxesLines && fareTaxesLines.length > 0) {
          fares = fareTaxesLines.map(line => {
            const match = line.match(/FARE:\s+(\w+)\s+([\d.,]+)\s*\n\s*TAXES:\s+([\d.,]+)/i);
            if (match) {
              const category = match[1]?.toLowerCase() === 'exe' ? 'Exe' :
                match[1]?.toLowerCase() === 'eco' ? 'Eco' :
                  match[1]?.toLowerCase() === 'pre' ? 'Pre' :
                    match[1]?.toUpperCase() || 'Tarifa';
              const tarifaValue = match[2]?.replace(',', '.') || '0';
              const taxasValue = match[3]?.replace(',', '.') || '0';

              console.log(`🔍 Tarifa FARE/TAXES detectada: ${category} - USD ${tarifaValue} + USD ${taxasValue}`);

              return {
                category,
                tarifa: tarifaValue,
                taxas: taxasValue,
                paxType: 'ADT'
              };
            }
            return null;
          }).filter(fare => fare !== null) as Array<{ category: string; tarifa: string; taxas: string; paxType?: string }>;
        } else {
          // Último fallback - método antigo
          const tarifaMatches = pnrText.match(/USD([\d.,]+)/gi) || [];
          const taxasMatches = pnrText.match(/txs\s+USD([\d.,]+)/gi) || [];

          fares = tarifaMatches.map((tarifa, i) => {
            const tarifaValue = tarifa.match(/USD([\d.,]+)/)?.[1]?.replace(',', '.') || '0';
            const taxasValue = taxasMatches[i]?.match(/txs\s+USD([\d.,]+)/)?.[1]?.replace(',', '.') || '0';

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
        }
      }
    }
  }

  // Detectar múltiplas cotações
  const isMulti = pnrText.includes('==');

  // Extrair dados adicionais
  const pagtoLine = pnrText.match(/pagto\s+([^\n]+)/i)?.[1]?.trim();

  // Extração de variáveis que estavam faltando
  const baggage = pnrText.match(/bagagem\s*:\s*([^\n]+)/i)?.[1]?.trim() || '1PC';
  const notes = pnrText.match(/notes\s*:\s*([^\n]+)/i)?.[1]?.trim();

  // Tentar extrair número de parcelas do texto de pagamento se não for encontrado depois
  let numParcelas = 1;
  if (pagtoLine) {
    const parcelasMatch = pagtoLine.match(/(\d+)x/i);
    if (parcelasMatch) {
      numParcelas = parseInt(parcelasMatch[1], 10);
    }
  }

  // Extração de valores numéricos adicionais
  const ravPercent = 0; // Default
  const incentivoPercent = 0; // Default
  const feeUSD = 0; // Default

  const paymentTerms = sanitizePaymentTerms(pagtoLine || '', numParcelas);

  const segments = await Promise.all(trechos.map(async trecho => {
    // Usar a mesma lógica de decodeItinerary para garantir consistência
    const cleanedTrecho = trecho.replace(/^\d+\s+/, '');
    const parts = cleanedTrecho.trim().split(/\s+/);

    const isBookingClass = (str: string): boolean => /^[A-Z]{2,3}\d{1,2}$/.test(str);
    const isTime = (str: string): boolean => /^#?\d{3,4}$/.test(str) || /^\d{2}:\d{2}$/.test(str);

    let cia, flight, dateStr, route, depTime, arrTime, arrDate;

    // Formato: "AZ 679 25NOV GRUFCO HS2 2040 #1200"
    if (parts.length >= 6) {
      [cia, flight, dateStr, route] = parts.slice(0, 4);
      const potentialClass = parts[4];
      if (isBookingClass(potentialClass)) {
        depTime = parts[5]?.trim();
        arrTime = parts[6]?.trim() || parts[5]?.trim();
        arrDate = parts[7]?.trim();
      } else if (isTime(potentialClass)) {
        depTime = parts[4]?.trim();
        arrTime = parts[5]?.trim();
        arrDate = parts[6]?.trim();
      } else {
        depTime = parts[4]?.trim();
        arrTime = parts[5]?.trim();
        arrDate = parts[6]?.trim();
      }
    } else if (parts.length >= 5) {
      [cia, flight, dateStr, route] = parts.slice(0, 4);
      const potentialClass = parts[4];
      if (isBookingClass(potentialClass) && parts.length >= 6) {
        depTime = parts[5]?.trim();
        arrTime = parts[6]?.trim() || parts[5]?.trim();
      } else if (isTime(potentialClass)) {
        depTime = parts[4]?.trim();
        arrTime = parts[5]?.trim() || parts[4]?.trim();
      } else {
        depTime = parts[4]?.trim();
        arrTime = parts[5]?.trim() || parts[4]?.trim();
      }
    } else {
      return null;
    }

    if (!cia || !flight || !dateStr || !route) return null;

    const orig = route?.substring(0, 3) || 'GRU';
    const dest = route?.substring(3, 6) || 'ICN';

    // Normalizar horários: garantir que tenham 4 dígitos (preencher com zero à esquerda se necessário)
    depTime = depTime ? depTime.padStart(4, '0') : '0000';
    arrTime = arrTime ? arrTime.replace('#', '').padStart(4, '0') : '0000';

    // Decodificar data e horário
    const decodedDate = decodeDate(dateStr);
    console.log(`[PARSER] Trecho: ${trecho}`);
    console.log(`[PARSER] depTime extraído: "${depTime}"`);
    const depTimeFormatted = formatTime(depTime);
    console.log(`[PARSER] depTime formatado: "${depTimeFormatted}"`);
    const arrTimeFormatted = formatTime(arrTime);
    console.log(`[PARSER] arrTime formatado: "${arrTimeFormatted}"`);

    // Calcular data de chegada
    let finalArrDate = decodedDate;
    const isOvernight = trecho.includes('#');

    if (arrDate && /^\d{1,2}[A-Z]{3}$/.test(arrDate)) {
      finalArrDate = decodeDate(arrDate);
    } else if (isOvernight) {
      const [day, month, year] = decodedDate.split('/');
      const nextDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day) + 1);
      finalArrDate = `${nextDay.getDate().toString().padStart(2, '0')}/${(nextDay.getMonth() + 1).toString().padStart(2, '0')}/${nextDay.getFullYear()}`;
    }

    // Converter para formato ISO (YYYY-MM-DDTHH:MM:SS) preservando horário local
    const [depDay, depMonth, depYear] = decodedDate.split('/');
    const [arrDay, arrMonth, arrYear] = finalArrDate.split('/');
    const [depHour, depMin] = depTimeFormatted.split(':');
    const [arrHour, arrMin] = arrTimeFormatted.split(':');

    // Criar string ISO manualmente preservando o horário local (não usar toISOString que converte para UTC)                                                  
    const depTimeISO = `${depYear}-${depMonth.padStart(2, '0')}-${depDay.padStart(2, '0')}T${depHour.padStart(2, '0')}:${depMin.padStart(2, '0')}:00`;
    const arrTimeISO = `${arrYear}-${arrMonth.padStart(2, '0')}-${arrDay.padStart(2, '0')}T${arrHour.padStart(2, '0')}:${arrMin.padStart(2, '0')}:00`;
    console.log(`[PARSER] depHour: "${depHour}", depMin: "${depMin}", depTimeISO: "${depTimeISO}"`);
    console.log(`[PARSER] arrHour: "${arrHour}", arrMin: "${arrMin}", arrTimeISO: "${arrTimeISO}"`);

    return {
      carrier: cia,
      flight: flight,
      depAirport: orig,
      arrAirport: dest,
      depTimeISO,
      arrTimeISO,
    };
  }));

  const validSegments = segments.filter(segment => segment !== null);

  return {
    tarifa: fares[0]?.tarifa || '0',
    taxas_base: fares[0]?.taxas || '0',
    fares,
    fee: '0',
    incentivo: '0',
    trechos,
    multa: '0',
    currency: detectedCurrency,
    is_multi: isMulti,
    // Novos campos
    segments: validSegments,
    paymentTerms,
    baggage,
    bagagem_hint: baggage, // Alias para compatibilidade
    notes,
    numParcelas,
    ravPercent,
    incentivoPercent,
    feeUSD,
  };
}

function sanitizePaymentTerms(paymentLine: string, numParcelas: number): string {
  // Remover informações internas (net net, comissão, etc.)
  const cleanLine = paymentLine
    .replace(/\s*-\s*net\s*net\b/gi, '')
    .replace(/\s*-\s*comiss[ãa]o\s*\d+%?/gi, '')
    .replace(/\s*net\s*net\b/gi, '')
    .trim();

  // Se contém informação de parcelas, usar ela
  const parcelasMatch = cleanLine.match(/(\d+)x/i);
  if (parcelasMatch) {
    return `Em até ${parcelasMatch[1]}x no cartão de crédito. Taxas à vista.`;
  }

  if (numParcelas > 1) {
    return `Em até ${numParcelas}x no cartão de crédito. Taxas à vista.`;
  }

  return cleanLine || 'À vista';
}

// Simulação do decoder de itinerário
export async function decodeItinerary(trechos: string[]): Promise<DecodedItinerary | null> {
  if (!trechos.length) return null;

  await new Promise(resolve => setTimeout(resolve, 300));

  const flightsResults = await Promise.all(trechos.map(async trecho => {
    // Exemplo: "LA 8084   22NOV GRULHR HS1  2340  #1405"
    // Exemplo: "DL  104   14OCT GRUATL HS1  2250  #0735"
    // Exemplo: "1 AA 950 12FEB  GRUJFK SS2  2235  0615   13FEB" (novo formato)

    // Remover número de linha no início (ex: "1 AA" -> "AA")
    const cleanedTrecho = trecho.replace(/^\d+\s+/, '');

    const parts = cleanedTrecho.trim().split(/\s+/);
    console.log('🔍 Trecho original:', trecho);
    console.log('🔍 cleanedTrecho:', cleanedTrecho);
    console.log('🔍 Parts divididas:', parts);
    console.log('🔍 Parts com índices:', parts.map((p, i) => `[${i}]: "${p}"`).join(', '));

    // Função para detectar se uma string é uma classe de voo (ex: HS2, HK1, SS1)
    const isBookingClass = (str: string): boolean => {
      // Classe geralmente é 2-3 letras seguidas de 1-2 dígitos (HS2, HK1, SS1, J2, Y1, etc.)
      return /^[A-Z]{2,3}\d{1,2}$/.test(str);
    };

    // Função para detectar se uma string é um horário (4 dígitos ou # seguido de 4 dígitos)
    const isTime = (str: string): boolean => {
      return /^#?\d{3,4}$/.test(str) || /^\d{2}:\d{2}$/.test(str);
    };

    // Tentar diferentes formatos
    let cia, flight, dateStr, route, depTime, arrTime, arrDate;

    // Formato novo: "AA 950 12FEB GRUJFK SS2 2235 0615 13FEB"
    if (parts.length >= 8) {
      [cia, flight, dateStr, route] = parts.slice(0, 4);
      // Procurar classe após a rota
      const classIndex = parts.findIndex((p, i) => i >= 4 && isBookingClass(p));
      if (classIndex >= 0) {
        depTime = parts[classIndex + 1];
        arrTime = parts[classIndex + 2];
        arrDate = parts[classIndex + 3];
      } else {
        [, , , , depTime, arrTime, arrDate] = parts;
      }
    }
    // Formato: "AZ 679 25NOV GRUFCO HS2 2040 #1200" ou "DL 104 14OCT GRUATL HS1 2250 #0735"
    // ou "AF 459 16NOV GRUCDG 2040 #1150" (sem classe)
    else if (parts.length >= 6) {
      [cia, flight, dateStr, route] = parts.slice(0, 4);
      // Verificar se há classe após a rota
      const potentialClass = parts[4];
      console.log(`[PARSER] parts.length: ${parts.length}, potentialClass[4]: "${potentialClass}"`);
      if (isBookingClass(potentialClass)) {
        // Formato com classe: "GRUFCO HS2 2040 #1200"
        depTime = parts[5];
        arrTime = parts[6] || parts[5]; // Pode não ter horário de chegada
        arrDate = parts[7];
        console.log(`[PARSER] Formato com classe: depTime[5]="${parts[5]}", arrTime[6]="${parts[6]}"`);
      } else if (isTime(potentialClass)) {
        // Formato sem classe: "GRUCDG 2040 #1150"
        depTime = parts[4];
        arrTime = parts[5];
        arrDate = parts[6];
      } else {
        // Fallback: assumir que é horário mesmo
        depTime = parts[4];
        arrTime = parts[5];
        arrDate = parts[6];
      }
    }
    // Formato: "LA 8084 22NOV GRULHR HS1 2340 #1405"
    else if (parts.length >= 5) {
      [cia, flight, dateStr, route] = parts.slice(0, 4);
      const potentialClass = parts[4];
      if (isBookingClass(potentialClass) && parts.length >= 6) {
        // Tem classe e horários
        depTime = parts[5];
        arrTime = parts[6] || parts[5];
      } else if (isTime(potentialClass)) {
        // Sem classe, direto para horário
        depTime = parts[4];
        arrTime = parts[5] || parts[4];
      } else {
        // Fallback
        depTime = parts[4];
        arrTime = parts[5] || parts[4];
      }
    } else {
      console.warn('⚠️ Trecho inválido - formato não reconhecido:', trecho);
      return null;
    }

    // Validar se temos os dados mínimos necessários
    if (!cia || !flight || !dateStr || !route) {
      console.warn('⚠️ Trecho inválido - dados insuficientes:', trecho);
      return null;
    }

    console.log(`[PARSER] ⚠️ ANTES DE FORMATAR: depTime="${depTime}", arrTime="${arrTime}"`);

    const orig = route?.substring(0, 3) || 'GRU';
    const dest = route?.substring(3, 6) || 'ICN';

    // Decodificar data (ex: "22NOV" -> "22/11/2025")
    const decodedDate = decodeDate(dateStr);

    // Decodificar horários
    const depTimeFormatted = formatTime(depTime);

    // Para voos noturnos (#) ou com data de chegada explícita, calcular a data correta
    let finalArrDate = decodedDate;
    let isOvernight = false;

    // Se há data de chegada explícita (formato: "13FEB"), usar ela
    if (arrDate && /^\d{1,2}[A-Z]{3}$/.test(arrDate)) {
      finalArrDate = decodeDate(arrDate);
      isOvernight = true;
    }
    // Senão, se tem # (voo noturno), adicionar 1 dia
    else if (trecho.includes('#')) {
      isOvernight = true;
      const [day, month, year] = decodedDate.split('/');
      const nextDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day) + 1);
      finalArrDate = `${nextDay.getDate().toString().padStart(2, '0')}/${(nextDay.getMonth() + 1).toString().padStart(2, '0')}/${nextDay.getFullYear()}`;
    }
    const arrTimeFormatted = formatTime(arrTime);

    // Decodificar aeroportos
    const [depAirport, arrAirport] = await Promise.all([
      getAirportName(orig),
      getAirportName(dest)
    ]);

    return {
      company: { iataCode: cia, description: getCompanyName(cia) },
      flight,
      departureDate: decodedDate,
      departureTime: depTimeFormatted,
      landingDate: finalArrDate,
      landingTime: arrTimeFormatted,
      departureAirport: {
        iataCode: orig,
        description: depAirport.name,
        found: depAirport.found,
        error: depAirport.error
      },
      landingAirport: {
        iataCode: dest,
        description: arrAirport.name,
        found: arrAirport.found,
        error: arrAirport.error
      },
      overnight: trecho.includes('#'),
      isOvernight: isOvernight, // Indica se é voo noturno (chegada no dia seguinte)
    };
  }));

  const flights = flightsResults.filter((flight) => flight !== null) as DecodedFlight[];

  return {
    source: 'internal-parser',
    overnights: flights.filter(f => f?.overnight).length,
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
  let cleanTime = timeStr.replace('#', '').trim();
  console.log(`[formatTime] timeStr: "${timeStr}", cleanTime: "${cleanTime}", length: ${cleanTime.length}`);

  // Se já está no formato HH:MM, retornar diretamente
  if (cleanTime.match(/^\d{2}:\d{2}$/)) {
    return cleanTime;
  }

  // Remover qualquer caractere não numérico
  cleanTime = cleanTime.replace(/\D/g, '');
  console.log(`[formatTime] cleanTime após remover não-numéricos: "${cleanTime}"`);

  // Normalizar: garantir 4 dígitos (preencher com zero à esquerda)
  // IMPORTANTE: "2040" deve permanecer "2040", não "02040"
  // Se já tem 4 dígitos, usar como está. Se tem menos, preencher à esquerda.
  const normalizedTime = cleanTime.length === 4 ? cleanTime : cleanTime.padStart(4, '0');
  console.log(`[formatTime] cleanTime: "${cleanTime}", normalizedTime: "${normalizedTime}", length: ${normalizedTime.length}`);

  // Exemplo: "2340" -> "23:40", "1405" -> "14:05", "2040" -> "20:40"
  if (normalizedTime.length >= 4) {
    // SEMPRE pegar os 2 primeiros dígitos para hora e os 2 últimos para minutos
    // Para "2040": [0:2] = "20", [2:4] = "40"
    const hours = normalizedTime.substring(0, 2);
    const minutes = normalizedTime.substring(2, 4);
    console.log(`[formatTime] hours substring(0,2): "${hours}", minutes substring(2,4): "${minutes}"`);

    // Validar horário (00-23 para horas, 00-59 para minutos)
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    console.log(`[formatTime] h parsed: ${h}, m parsed: ${m}`);

    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      const result = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      console.log(`[formatTime] resultado final: "${result}"`);
      return result;
    } else {
      console.warn('❌ Horário inválido:', timeStr, 'h:', h, 'm:', m);
      return '00:00';
    }
  }

  console.warn('❌ Formato de horário inválido:', timeStr, 'length:', cleanTime.length);
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
    'LH': 'Lufthansa',
    'UA': 'United Airlines',
    'AA': 'American Airlines',
    'DL': 'Delta Air Lines',
    'AZ': 'ITA Airways',
    'LX': 'Swiss International Air Lines',
    'JL': 'Japan Airlines',
    'EK': 'Emirates',
    'SA': 'South African Airways'
  };
  return companies[code] || code;
}

async function getAirportName(code: string): Promise<{ name: string; found: boolean; error?: string }> {
  try {
    // Usar o sistema robusto de decodificação
    const { robustDecoder } = await import('./robust-decoder');
    const result = await robustDecoder.decodeAirport(code);

    return {
      name: result.description,
      found: result.found,
      error: result.error
    };
  } catch (error) {
    console.error('❌ Erro crítico no sistema de decodificação:', error);

    // Fallback de emergência - usar código simples
    return {
      name: code,
      found: false,
      error: `Erro crítico no sistema de decodificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}