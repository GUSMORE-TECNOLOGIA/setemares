/**
 * Funções auxiliares para parsing e transformação de dados de PNR
 */

import type { ParsedBaggage, ParsedSegment } from "@/lib/types/email-parser";
import type { SimpleBookingSummary } from "../../../shared/types";
import { parsePNR } from "@/lib/parser";
import type { ParsedPNR } from "@/lib/parser";

/**
 * Constrói um resumo simples a partir de um PNR parseado
 */
export function buildSimpleSummary(parsed: ParsedPNR | null): SimpleBookingSummary | null {
  if (!parsed) {
    return null;
  }

  const segments = Array.isArray(parsed.segments) ? (parsed.segments as ParsedSegment[]) : [];
  const fares = (parsed.fares || []).map((fare) => ({
    fareClass: fare.category,
    paxType: (fare.paxType as "ADT" | "CHD" | "INF") || "ADT",
    baseFare: Number(fare.tarifa.replace(/,/g, '.')) || 0,
    baseTaxes: Number(fare.taxas.replace(/,/g, '.')) || 0,
    notes: '',
    includeInPdf: true
  }));

  return {
    segments,
    fares,
    paymentTerms: parsed.paymentTerms || 'Em ate 4x no cartao de credito. Taxas a vista.',
    baggage: parsed.baggage || 'Conforme regra da tarifa',
    notes: parsed.notes || '',
    numParcelas: parsed.numParcelas,
    ravPercent: parsed.ravPercent,
    incentivoPercent: parsed.incentivoPercent,
    feeUSD: parsed.feeUSD
  };
}

/**
 * Parseia uma string de bagagem em um array de objetos ParsedBaggage
 */
export function parseBaggageString(baggage?: string): ParsedBaggage[] | undefined {
  if (!baggage) {
    return undefined;
  }

  const entries = baggage
    .split(/[,;]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const parsed = entries
    .map((entry) => {
      const match = entry.match(/(\d+)\s*pc\s*(\d+)\s*kg(?:\/([a-zA-Z]+))?/i);
      if (!match) {
        return undefined;
      }

      return {
        pieces: Number(match[1]),
        pieceKg: Number(match[2]),
        fareClass: match[3] ? match[3].toUpperCase() : undefined
      } as ParsedBaggage;
    })
    .filter((item): item is ParsedBaggage => Boolean(item));

  return parsed.length ? parsed : undefined;
}

/**
 * Formata partes de data e hora de uma string ISO
 */
export function formatDateTimeParts(value?: string | null): { date: string; time: string } {
  if (!value) {
    return { date: '', time: '' };
  }

  let raw = String(value).replace(/#/g, '').replace(/T/, ' ').replace(/Z/, '').trim();
  raw = raw.replace(/\s+/g, ' ');

  const isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2})(?::(\d{2}))?)/);
  if (isoMatch) {
    const [, year, month, day, hour = '00', minutes = '00'] = isoMatch;
    return {
      date: `${day}/${month}/${year}`,
      time: `${hour.padStart(2, '0')}:${minutes.padStart(2, '0')}`
    };
  }

  return { date: raw, time: '' };
}

/**
 * Verifica se um PNR é complexo (múltiplas opções)
 */
export function isComplexPnr(text: string): boolean {
  // PNR complexo é quando há múltiplas OPÇÕES
  // Suporta diferentes separadores: ==, --, ---, +, OU
  const lines = text.split('\n').map(l => l.trim());
  
  return lines.some(line => 
    line.match(/^={2,}$/) ||      // Linhas com apenas ==
    line.match(/^-{2,}$/) ||      // Linhas com apenas -- ou ---
    line.match(/^\+{2,}$/) ||     // Linhas com apenas ++
    line.trim().toUpperCase() === 'OU'  // Linha com "OU"
  );
}

/**
 * Função para mapear franquia de bagagem por classe
 */
export function getBaggageAllowanceByClass(fareClass: string): string {
  const label = fareClass.toLowerCase();
  
  if (label.includes('exe') || label.includes('executiva') || label.includes('business')) {
    return '2pc 32kg';
  } else if (label.includes('pre') || label.includes('premium')) {
    return '2pc 23kg';
  } else if (label.includes('eco') || label.includes('economica') || label.includes('economy')) {
    return '1pc 23kg';
  }
  
  // Fallback baseado no tipo de passageiro
  if (label.includes('chd') || label.includes('child')) {
    return '1pc 23kg';
  }
  
  // Default para adulto
  return '1pc 23kg';
}

