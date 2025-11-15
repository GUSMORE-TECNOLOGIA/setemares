import { describe, it, expect } from 'vitest';
import { computeTotals } from '@/lib/pricing';
import type { PricingParams } from '@/lib/pricing';

describe('pricing - computeTotals', () => {
  it('deve calcular corretamente com RAV, fee e incentivo', () => {
    const params: PricingParams = {
      tarifa: 6500,
      taxasBase: 2539.30,
      ravPercent: 10,
      fee: 0,
      incentivoPercent: 0,
      changePenalty: 'USD 500 + diferença tarifária'
    };

    const result = computeTotals(params);

    expect(result.rav).toBe(650); // 10% de 6500
    expect(result.comissao).toBe(650); // RAV + fee + incentivo
    expect(result.taxasExibidas).toBeCloseTo(3189.30, 2); // taxasBase + comissao
    expect(result.total).toBeCloseTo(9689.30, 2); // tarifa + taxasExibidas
    expect(result.incentivo).toBe(0);
  });

  it('deve calcular corretamente com fee', () => {
    const params: PricingParams = {
      tarifa: 7729,
      taxasBase: 266.30,
      ravPercent: 10,
      fee: 50,
      incentivoPercent: 0,
      changePenalty: 'USD 500 + diferença tarifária'
    };

    const result = computeTotals(params);

    expect(result.rav).toBe(772.90); // 10% de 7729
    expect(result.comissao).toBe(822.90); // RAV + fee
    expect(result.taxasExibidas).toBeCloseTo(1089.20, 2); // taxasBase + comissao
    expect(result.total).toBeCloseTo(8818.20, 2); // tarifa + taxasExibidas
    expect(result.incentivo).toBe(0);
  });

  it('deve calcular corretamente com incentivo percentual', () => {
    const params: PricingParams = {
      tarifa: 5875,
      taxasBase: 1320.30,
      ravPercent: 10,
      fee: 0,
      incentivoPercent: 3,
      changePenalty: 'USD 500 + diferença tarifária'
    };

    const result = computeTotals(params);

    expect(result.rav).toBe(587.50); // 10% de 5875
    const incentivo = 5875 * 0.03; // 3% de 5875 = 176.25
    expect(result.incentivo).toBeCloseTo(incentivo, 2);
    expect(result.comissao).toBeCloseTo(763.75, 2); // RAV + incentivo
    expect(result.taxasExibidas).toBeCloseTo(2084.05, 2); // taxasBase + comissao
    expect(result.total).toBeCloseTo(7959.05, 2); // tarifa + taxasExibidas
  });

  it('deve calcular corretamente com RAV, fee e incentivo juntos', () => {
    const params: PricingParams = {
      tarifa: 10000,
      taxasBase: 500,
      ravPercent: 10,
      fee: 100,
      incentivoPercent: 5,
      changePenalty: 'USD 500 + diferença tarifária'
    };

    const result = computeTotals(params);

    expect(result.rav).toBe(1000); // 10% de 10000
    const incentivo = 10000 * 0.05; // 5% de 10000 = 500
    expect(result.incentivo).toBe(incentivo);
    expect(result.comissao).toBe(1600); // RAV + fee + incentivo = 1000 + 100 + 500
    expect(result.taxasExibidas).toBe(2100); // taxasBase + comissao = 500 + 1600
    expect(result.total).toBe(12100); // tarifa + taxasExibidas = 10000 + 2100
  });

  it('deve lidar com valores zero', () => {
    const params: PricingParams = {
      tarifa: 0,
      taxasBase: 0,
      ravPercent: 0,
      fee: 0,
      incentivoPercent: 0,
      changePenalty: 'USD 500 + diferença tarifária'
    };

    const result = computeTotals(params);

    expect(result.rav).toBe(0);
    expect(result.incentivo).toBe(0);
    expect(result.comissao).toBe(0);
    expect(result.taxasExibidas).toBe(0);
    expect(result.total).toBe(0);
  });
});

