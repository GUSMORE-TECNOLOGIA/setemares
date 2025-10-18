// Pricing Engine para o frontend React
// Baseado no core/rules/pricing.py do backend

export interface PricingParams {
  tarifa: number;
  taxasBase: number;
  ravPercent: number;
  fee: number;
}

export interface PricingResult {
  rav: number;
  comissao: number;
  taxasExibidas: number;
  total: number;
  numParcelas?: number;
}

// Função para arredondar para 2 casas decimais
function q2(value: number): number {
  const num = Number(value);
  if (isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
}

// Calcular totais baseado nas regras do backend
export function computeTotals(params: PricingParams): PricingResult {
  const { tarifa, taxasBase, ravPercent, fee } = params;

  // Validar e converter para números, com fallback para 0
  const tarifaNum = Number(tarifa) || 0;
  const taxasBaseNum = Number(taxasBase) || 0;
  const ravPercentNum = Number(ravPercent) || 0;
  const feeNum = Number(fee) || 0;

  // RAV = tarifa_base * (rav_percent/100)
  const rav = q2(tarifaNum * (ravPercentNum / 100));

  // Comissão (lucro) = RAV + fee
  const comissao = q2(rav + feeNum);

  // Taxas exibidas = taxas_base + Comissão
  const taxasExibidas = q2(taxasBaseNum + comissao);

  // Total = tarifa_base + taxas_exibidas
  const total = q2(tarifaNum + taxasExibidas);

  return {
    rav,
    comissao,
    taxasExibidas,
    total
  };
}

// Formatar valores para exibição
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Formatar percentual
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Validações
export function validatePricingParams(params: PricingParams): string[] {
  const errors: string[] = [];

  if (params.tarifa < 0) {
    errors.push('Tarifa deve ser maior ou igual a zero');
  }

  if (params.taxasBase < 0) {
    errors.push('Taxas base devem ser maiores ou iguais a zero');
  }

  if (params.ravPercent < 0 || params.ravPercent > 100) {
    errors.push('RAV deve estar entre 0% e 100%');
  }

  if (params.fee < 0) {
    errors.push('Fee deve ser maior ou igual a zero');
  }

  return errors;
}
