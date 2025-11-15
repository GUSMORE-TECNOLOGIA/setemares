/**
 * Funções auxiliares para cálculos de pricing
 */

import { computeTotals } from "@/lib/pricing";
import type { PricingResult } from "@/lib/pricing";
import type { SimpleBookingSummary } from "../../../shared/types";
import type { ParsedFare } from "@/lib/types/email-parser";

/**
 * Mapeia um resumo simples para um resultado de pricing
 * 
 * NOTA: Este resultado é consolidado apenas para referência.
 * O cálculo individual será feito por fare category em outras funções.
 */
export function mapPricingResult(summary: SimpleBookingSummary, ravPercent?: number): PricingResult {
  const totalBaseFare = summary.fares.reduce((sum: number, fare: ParsedFare) => sum + fare.baseFare, 0);
  const totalBaseTaxes = summary.fares.reduce((sum: number, fare: ParsedFare) => sum + fare.baseTaxes, 0);

  // Log removido - usar logger se necessário para debug

  return computeTotals({
    tarifa: totalBaseFare,
    taxasBase: totalBaseTaxes,
    ravPercent: ravPercent || summary.ravPercent || 10, // Usar RAV detectado ou padrão 10%
    fee: summary.feeUSD || 0,
    incentivoPercent: summary.incentivoPercent || 0,
    changePenalty: 'USD 500 + diferença tarifária'
  });
}

/**
 * Calcula o pricing para uma tarifa individual
 */
export function calculateIndividualPricing(
  baseFare: number,
  baseTaxes: number,
  ravPercent: number = 10,
  fee: number = 0,
  incentivoPercent: number = 0,
  changePenalty?: string
): PricingResult {
  return computeTotals({
    tarifa: baseFare,
    taxasBase: baseTaxes,
    ravPercent,
    fee,
    incentivoPercent,
    changePenalty: changePenalty || 'USD 500 + diferença tarifária'
  });
}

