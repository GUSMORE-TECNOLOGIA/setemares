import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { PricingEngine } from './PricingEngine';

interface CompactPricingEngineProps {
  optionLabel: string;
  optionIndex: number;
  initialParams: {
    tarifa: number;
    taxasBase: number;
    ravPercent: number;
    fee: number;
    incentivo: number;
  };
  onPricingChange: (result: any) => void;
  resetTrigger: number;
}

export function CompactPricingEngine({ 
  optionLabel, 
  optionIndex, 
  initialParams, 
  onPricingChange, 
  resetTrigger 
}: CompactPricingEngineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pricingResult, setPricingResult] = useState<any>(null);

  const handlePricingChange = (result: any) => {
    setPricingResult(result);
    // Só chama onPricingChange se o resultado mudou
    if (JSON.stringify(result) !== JSON.stringify(pricingResult)) {
      onPricingChange(result);
    }
  };

  // Calcular total básico para exibição compacta
  const total = initialParams.tarifa + initialParams.taxasBase;
  const rav = (total * initialParams.ravPercent) / 100;
  const totalWithRav = total + rav + initialParams.fee + initialParams.incentivo;

  return (
    <div className="glass-card p-4">
      {/* Header Compacto */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Calculator className="w-5 h-5 text-orange-400" />
          <div>
            <h3 className="text-lg font-bold text-orange-400">{optionLabel}</h3>
            <p className="text-sm text-slate-400">
              Tarifa: USD {initialParams.tarifa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + 
              Taxas: USD {initialParams.taxasBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Valor Total */}
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              USD {totalWithRav.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400">Total por pessoa</div>
          </div>
          
          {/* Botão Detalhar */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300 px-4 py-2 text-sm transition-all duration-200"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Ocultar
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Detalhar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Pricing Engine Expandido */}
      {isExpanded && (
        <div className="border-t border-slate-600 pt-4">
          <PricingEngine 
            onPricingChange={handlePricingChange}
            resetTrigger={resetTrigger}
            initialParams={initialParams}
          />
        </div>
      )}
    </div>
  );
}
