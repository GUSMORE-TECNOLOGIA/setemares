/**
 * Funções auxiliares para construção de dados de PDF
 */

import type { MultiStackedPdfData } from "@/lib/MultiStackedPdfDocument";
import type { ExtendedParsedOption, SimpleBookingSummary, PricingResult } from "../../../shared/types";
import type { ParsedFare, ParsedBaggage, ParsedSegment } from "@/lib/types/email-parser";
import { formatDateTimeParts, getBaggageAllowanceByClass } from "./parsing-helpers";
import { calculateIndividualPricing } from "./pricing-helpers";

/**
 * Obtém a companhia aérea principal de uma opção
 */
function getPrimaryCarrier(option: ExtendedParsedOption): string {
  const firstSegment = option.segments?.[0];
  if (!firstSegment?.carrier) {
    return 'Aérea';
  }
  
  const carrier = firstSegment.carrier.trim();
  // Mapear códigos conhecidos para nomes completos
  const carrierNames: Record<string, string> = {
    'EK': 'Emirates',
    'KL': 'KLM',
    'AF': 'Air France',
    'QR': 'Qatar Airways',
    'LA': 'LATAM',
    'AA': 'American Airlines',
    'DL': 'Delta',
    'UA': 'United Airlines'
  };
  
  return carrierNames[carrier] || carrier;
}

/**
 * Obtém o label de partida de uma opção
 */
function getDepartureLabel(option: ExtendedParsedOption): string {
  const firstSegment = option.segments?.[0];
  const lastSegment = option.segments?.[option.segments.length - 1];
  
  if (!firstSegment || !lastSegment) {
    return '';
  }
  
  const origin = firstSegment.depAirport || '';
  const destination = lastSegment.arrAirport || '';
  
  if (origin && destination) {
    return `${origin} → ${destination}`;
  }
  
  return '';
}

/**
 * Constrói dados para PDF multi-stacked a partir de múltiplas opções
 */
export function buildMultiStackedData(options: ExtendedParsedOption[]): MultiStackedPdfData {
  const primaryOption = options[0];
  const headerSubtitle = getPrimaryCarrier(primaryOption);
  const headerDepartureLabel = getDepartureLabel(primaryOption);

  // Gerar data da cotação no formato brasileiro
  const currentDate = new Date();
  const quoteDate = currentDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return {
    header: {
      title: 'COTAÇÃO DE AÉREOS',
      subtitle: headerSubtitle,
      departureLabel: headerDepartureLabel,
      quoteDate: `Data da Cotação: ${quoteDate}`,
      logoSrc: '/logo-sete-mares.jpg'
    },
    options: options.map((option, index) => ({
      index: index + 1,
      flights: (option.segments ?? []).map((segment: ParsedSegment) => {        
        console.log(`[pdf-builders] segment.depTimeISO: "${segment.depTimeISO}", tipo: ${typeof segment.depTimeISO}`);
        console.log(`[pdf-builders] segment.arrTimeISO: "${segment.arrTimeISO}", tipo: ${typeof segment.arrTimeISO}`);
        const departure = formatDateTimeParts(segment.depTimeISO ?? segment.arrTimeISO);                                                                        
        const arrival = formatDateTimeParts(segment.arrTimeISO ?? segment.depTimeISO);                                                                          
        const flightCode = `${(segment.carrier ?? '').trim()} ${(segment.flight ?? '').trim()}`.trim();                                                         

        return {
          flightCode,
          fromAirport: segment.depAirport,
          toAirport: segment.arrAirport,
          departureDateTime: [departure.date, departure.time].filter(Boolean).join(' '),                                                                        
          arrivalDateTime: [arrival.date, arrival.time].filter(Boolean).join(' '),
          departureWeekday: departure.weekday,
          arrivalWeekday: arrival.weekday                                                                               
        };
      }),
      fareDetails: ((option.fareCategories || option.fares || []) as ParsedFare[])
        .filter((fare) => (fare as { includeInPdf?: boolean }).includeInPdf !== false)
        .map((fare) => {
          const baseFare = Number(fare.baseFare ?? 0);
          const baseTaxes = Number(fare.baseTaxes ?? 0);
          
          // Calcular incentivo e RAV para esta cabine específica
          const incentivoPercent = option.pricingResult?.incentivoPercent || option.incentivoPercent || 0;
          const ravPercent = option.ravPercent || 10;
          const fee = option.feeUSD || 0;
          
          const totals = calculateIndividualPricing(
            baseFare,
            baseTaxes,
            ravPercent,
            fee,
            incentivoPercent,
            option.pricingResult?.changePenalty
          );
          
          return {
            classLabel: `${fare.fareClass || 'N/A'}${fare.paxType && fare.paxType !== 'ADT' ? ` (${fare.paxType})` : ''}`,
            baseFare,
            taxes: totals.taxasExibidas, // Taxas com RAV + incentivo aplicados
            total: baseFare + totals.taxasExibidas, // Total com incentivo
            baggage: getBaggageAllowanceByClass(fare.fareClass || 'N/A') // Bagagem específica da classe
          };
        }),
      footer: {
        baggage: (option.baggage ?? [])
          .map((bag: ParsedBaggage) => bag.fareClass ? `${bag.pieces}pc ${bag.pieceKg}kg/${bag.fareClass}` : `${bag.pieces}pc ${bag.pieceKg}kg`)
          .join(', ') || '2pc 32kg',
        payment: option.paymentTerms || 'Em até 4x no cartão de crédito. Taxas à vista.',
        penalty: option.changePenalty || option.notes || 'USD 500 + diferença tarifária, se houver. Bilhete não reembolsável.',
        refundable: 'Bilhete nao reembolsavel.'
      }
    }))
  };
}

/**
 * Constrói dados para PDF single-option multi-stacked
 */
export function buildSingleOptionMultiStackedData(
  summary: SimpleBookingSummary | null,
  _itinerary?: unknown | null,
  pricingResult?: PricingResult | null
): MultiStackedPdfData {
  const segments = summary?.segments ?? [];
  
  // Normalizar fares para garantir que todas tenham os campos necessários
  const normalizedFares: ParsedFare[] = (summary?.fares ?? []).map((fare: ParsedFare) => {
    const baseFare = fare.baseFare ?? 0;
    const baseTaxes = fare.baseTaxes ?? 0;
    let adjustedTaxes = baseTaxes;

    // Para múltiplas tarifas, calcular as taxas ajustadas individualmente
    if (pricingResult) {
      const individualPricing = calculateIndividualPricing(
        baseFare,
        baseTaxes,
        summary?.ravPercent || 10,
        summary?.feeUSD || 0,
        summary?.incentivoPercent || 0,
        pricingResult?.changePenalty
      );
      adjustedTaxes = individualPricing.taxasExibidas;
    }

    return {
      ...fare,
      baseFare,
      baseTaxes: adjustedTaxes,
      includeInPdf: fare.includeInPdf ?? true
    };
  });

  const fallbackFares: ParsedFare[] =
    !normalizedFares.length && pricingResult
      ? [
          {
            fareClass: 'Tarifa',
            paxType: 'ADT',
            baseFare: Math.max(pricingResult.total - pricingResult.taxasExibidas, 0),
            baseTaxes: pricingResult.taxasExibidas,
            notes: '',
            includeInPdf: true
          }
        ]
      : [];

  const faresForPdf = normalizedFares.length ? normalizedFares : fallbackFares;

  const routeLabel =
    segments.length > 1
      ? `${segments[0]?.depAirport || ''} → ${segments[segments.length - 1]?.arrAirport || ''}`
      : segments[0]?.depAirport || '';

  return {
    header: {
      title: 'COTAÇÃO DE AÉREOS',
      subtitle: getPrimaryCarrier({ segments } as ExtendedParsedOption),
      departureLabel: routeLabel,
      quoteDate: `Data da Cotação: ${new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })}`,
      logoSrc: '/logo-sete-mares.jpg'
    },
    options: [
      {
        index: 1,
        flights: segments.map((segment: ParsedSegment) => {
          const departure = formatDateTimeParts(segment.depTimeISO ?? segment.arrTimeISO);                                                                      
          const arrival = formatDateTimeParts(segment.arrTimeISO ?? segment.depTimeISO);                                                                        
          const flightCode = `${(segment.carrier ?? '').trim()} ${(segment.flight ?? '').trim()}`.trim();                                                       

          return {
            flightCode,
            fromAirport: segment.depAirport,
            toAirport: segment.arrAirport,
            departureDateTime: [departure.date, departure.time].filter(Boolean).join(' '),                                                                      
            arrivalDateTime: [arrival.date, arrival.time].filter(Boolean).join(' '),
            departureWeekday: departure.weekday,
            arrivalWeekday: arrival.weekday                                                                             
          };
        }),
        fareDetails: faresForPdf.map((fare: ParsedFare) => ({
          classLabel: `${fare.fareClass || 'N/A'}${fare.paxType && fare.paxType !== 'ADT' ? ` (${fare.paxType})` : ''}`,
          baseFare: fare.baseFare ?? 0,
          taxes: fare.baseTaxes ?? 0,
          total: (fare.baseFare ?? 0) + (fare.baseTaxes ?? 0),
          baggage: getBaggageAllowanceByClass(fare.fareClass || 'N/A')
        })),
        footer: {
          baggage: summary?.baggage || '2pc 32kg',
          payment: summary?.paymentTerms || 'Em até 4x no cartão de crédito. Taxas à vista.',
          penalty: summary?.notes || 'USD 500 + diferença tarifária, se houver. Bilhete não reembolsável.',
          refundable: 'Bilhete nao reembolsavel.'
        }
      }
    ]
  };
}

