import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Percent, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { computeTotals, formatCurrency, formatPercent, validatePricingParams, PricingParams, PricingResult } from '../../lib/pricing';

interface PricingEngineProps {
  onPricingChange?: (result: PricingResult) => void;
  initialParams?: Partial<PricingParams>;
  resetTrigger?: number; // Quando muda, reseta os valores
}

export function PricingEngine({ onPricingChange, initialParams, resetTrigger }: PricingEngineProps) {
  const [params, setParams] = useState<PricingParams>({
    tarifa: initialParams?.tarifa || 0,
    taxasBase: initialParams?.taxasBase || 0,
    ravPercent: initialParams?.ravPercent || 10,
    fee: initialParams?.fee || 0,
    incentivo: initialParams?.incentivo || 0
  });

  const [result, setResult] = useState<PricingResult>({
    rav: 0,
    comissao: 0,
    taxasExibidas: 0,
    total: 0
  });

  const [errors, setErrors] = useState<string[]>([]);

  // Reset quando resetTrigger mudar
  useEffect(() => {
    if (resetTrigger !== undefined) {
      console.log('🔄 Resetando Pricing Engine...');
      setParams({
        tarifa: initialParams?.tarifa || 0,
        taxasBase: initialParams?.taxasBase || 0,
        ravPercent: initialParams?.ravPercent || 10,
        fee: initialParams?.fee || 0,
        incentivo: initialParams?.incentivo || 0
      });
    }
  }, [resetTrigger, initialParams]);

  // Calcular totais quando os parâmetros mudarem
  useEffect(() => {
    const validationErrors = validatePricingParams(params);
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      const newResult = computeTotals(params);
      setResult(newResult);
      onPricingChange?.(newResult);
    }
  }, [params]); // REMOVIDO: onPricingChange da dependência para evitar loop infinito

  const handleParamChange = (key: keyof PricingParams, value: number) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="glass-card p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Calculator className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">Pricing Engine</h3>
            <p className="text-sm text-slate-400">RAV + Fee + Incentivo</p>
          </div>
        </div>
      </div>

      {/* Layout Padronizado: Campos à esquerda, Cálculos à direita */}
      <div className="grid grid-cols-12 gap-6">
        {/* Parâmetros de Entrada - Esquerda */}
        <div className="col-span-6 space-y-4">
          {/* Tarifa Base */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Tarifa Base (USD)</label>
            <Input
              type="number"
              value={params.tarifa}
              onChange={(e) => handleParamChange('tarifa', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full bg-slate-800/50 border-slate-600 text-slate-100 focus:ring-brand focus:border-brand"
            />
          </div>

          {/* Taxas Base */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Taxas Base (USD)</label>
            <Input
              type="number"
              value={params.taxasBase}
              onChange={(e) => handleParamChange('taxasBase', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full bg-slate-800/50 border-slate-600 text-slate-100 focus:ring-brand focus:border-brand"
            />
          </div>

          {/* RAV Percentual */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">RAV (%)</label>
            <div className="relative">
              <Input
                type="number"
                value={params.ravPercent}
                onChange={(e) => handleParamChange('ravPercent', parseFloat(e.target.value) || 0)}
                placeholder="10.00"
                className="w-full pr-8 bg-slate-800/50 border-slate-600 text-slate-100 focus:ring-brand focus:border-brand"
              />
              <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Fee */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Fee (USD)</label>
            <div className="relative">
              <Input
                type="number"
                value={params.fee}
                onChange={(e) => handleParamChange('fee', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pr-8 bg-slate-800/50 border-slate-600 text-slate-100 focus:ring-brand focus:border-brand"
              />
              <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Incentivo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Incentivo (USD)</label>
            <div className="relative">
              <Input
                type="number"
                value={params.incentivo}
                onChange={(e) => handleParamChange('incentivo', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pr-8 bg-slate-800/50 border-slate-600 text-slate-100 focus:ring-brand focus:border-brand"
              />
              <Plus className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Cálculos - Direita */}
        <div className="col-span-6">
          {/* Erros de Validação */}
          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-red-400 mb-2">Erros de Validação:</h4>
              <ul className="text-sm text-red-300 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Resultados */}
          {errors.length === 0 && (
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 h-full">
              <h4 className="text-lg font-semibold text-slate-200 mb-4">Cálculos</h4>
              
              <div className="space-y-4">
                {/* RAV */}
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-300">RAV ({formatPercent(params.ravPercent)})</span>
                  <span className="font-mono text-blue-400 text-lg">{formatCurrency(result.rav)}</span>
                </div>

                {/* Comissão */}
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-300">Comissão (Lucro)</span>
                  <span className="font-mono text-green-400 text-lg">{formatCurrency(result.comissao)}</span>
                </div>

                {/* Taxas Exibidas */}
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-300">Taxas Exibidas</span>
                  <span className="font-mono text-yellow-400 text-lg">{formatCurrency(result.taxasExibidas)}</span>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-300 font-semibold">Total por Bilhete</span>
                  <span className="font-mono text-2xl font-bold text-white">{formatCurrency(result.total)}</span>
                </div>
              </div>

              {/* Resumo */}
              <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
                <h5 className="text-sm font-medium text-slate-300 mb-3">Resumo</h5>
                <div className="text-sm text-slate-400 space-y-2">
                  <p><strong>Tarifa Base:</strong> {formatCurrency(params.tarifa)}</p>
                  <p><strong>Taxas Base:</strong> {formatCurrency(params.taxasBase)}</p>
                  <p><strong>RAV:</strong> {formatCurrency(result.rav)} ({formatPercent(params.ravPercent)})</p>
                  <p><strong>Fee:</strong> {formatCurrency(params.fee)}</p>
                  <p><strong>Incentivo:</strong> {formatCurrency(params.incentivo)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
