import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight, Calculator, RotateCcw, Save } from 'lucide-react';
import { Input } from '../ui/Input';
import { computeTotals, formatCurrency, PricingParams } from '../../lib/pricing';

interface FareCategory {
  fareClass: string;
  paxType: "ADT" | "CHD" | "INF";
  baseFare: number;
  baseTaxes: number;
  notes?: string;
  includeInPdf: boolean;
}

interface AdvancedPricingEngineProps {
  optionLabel: string;
  optionIndex: number;
  fareCategories: FareCategory[];
  onPricingChange: (result: any) => void;
  onSave: (updatedCategories: FareCategory[]) => void;
  resetTrigger: number;
  ravPercent?: number;
  fee?: number;
  numParcelas?: number;
}

export function AdvancedPricingEngine({ 
  optionLabel, 
  optionIndex, 
  fareCategories,
  onPricingChange, 
  onSave,
  resetTrigger,
  ravPercent = 10,
  fee = 0,
  numParcelas
}: AdvancedPricingEngineProps) {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [globalConfig, setGlobalConfig] = useState({
    ravPercent,
    fee,
    numParcelas: numParcelas || 4
  });
  const [localParams, setLocalParams] = useState<PricingParams>({
    tarifa: 0,
    taxasBase: 0,
    ravPercent,
    fee
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Sincronizar quando props mudarem
  useEffect(() => {
    // Só atualizar numParcelas se não foi editado manualmente (manter valor atual se já foi modificado)
    setGlobalConfig(prevConfig => ({
      ravPercent,
      fee,
      numParcelas: prevConfig.numParcelas !== undefined ? prevConfig.numParcelas : (numParcelas || 4)
    }));
    if (fareCategories.length > 0 && currentCategoryIndex < fareCategories.length) {
      const currentCategory = fareCategories[currentCategoryIndex];
      setLocalParams({
        tarifa: Number(currentCategory.baseFare) || 0,
        taxasBase: Number(currentCategory.baseTaxes) || 0,
        ravPercent: Number(ravPercent) || 0,
        fee: Number(fee) || 0
      });
    }
  }, [ravPercent, fee, fareCategories, currentCategoryIndex]);

  // Atualizar parâmetros locais quando mudar de categoria
  useEffect(() => {
    if (fareCategories.length > 0 && currentCategoryIndex < fareCategories.length) {
      const currentCategory = fareCategories[currentCategoryIndex];
      
      setLocalParams({
        tarifa: Number(currentCategory.baseFare) || 0,
        taxasBase: Number(currentCategory.baseTaxes) || 0,
        ravPercent: Number(globalConfig.ravPercent) || 0,
        fee: Number(globalConfig.fee) || 0
      });
    }
  }, [currentCategoryIndex, fareCategories, globalConfig]);

  // Calcular resultado atual
  const currentResult = computeTotals(localParams);
  const totalCategories = fareCategories.length;
  const currentCategory = fareCategories[currentCategoryIndex];

  // Navegação
  const goToPrevious = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (currentCategoryIndex < totalCategories - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    }
  };

  // Atualizar parâmetros locais
  const handleParamChange = (key: keyof PricingParams, value: number) => {
    setLocalParams(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  // Atualizar configuração global
  const handleGlobalConfigChange = (key: 'ravPercent' | 'fee' | 'numParcelas', value: number) => {
    setGlobalConfig(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  // Restaurar valores originais
  const handleRestore = () => {
    if (currentCategory) {
      setLocalParams({
        tarifa: currentCategory.baseFare,
        taxasBase: currentCategory.baseTaxes,
        ravPercent: globalConfig.ravPercent,
        fee: globalConfig.fee
      });
      setHasChanges(false);
    }
  };

  // Salvar mudanças
  const handleSave = () => {
    const updatedCategories = [...fareCategories];
    updatedCategories[currentCategoryIndex] = {
      ...currentCategory,
      baseFare: localParams.tarifa,
      baseTaxes: localParams.taxasBase
    };
    
    onSave(updatedCategories);
    setHasChanges(false);
    
    // Notificar mudança de pricing incluindo numParcelas
    onPricingChange({
      ...currentResult,
      numParcelas: globalConfig.numParcelas
    });
  };

  // Calcular total para exibição compacta (primeira categoria)
  const compactTotal = useMemo(() => {
    if (fareCategories.length > 0) {
      const baseFare = Number(localParams.tarifa || fareCategories[0].baseFare) || 0;
      const baseTaxes = Number(localParams.taxasBase || fareCategories[0].baseTaxes) || 0;
      const ravPercent = Number(localParams.ravPercent) || 0;
      const fee = Number(localParams.fee) || 0;
      
      // Usar a mesma lógica da função computeTotals
      const rav = Math.round(baseFare * (ravPercent / 100) * 100) / 100;
      const comissao = Math.round((rav + fee) * 100) / 100;
      const taxasExibidas = Math.round((baseTaxes + comissao) * 100) / 100;
      const total = Math.round((baseFare + taxasExibidas) * 100) / 100;
      
      return isNaN(total) ? 0 : total;
    }
    return 0;
  }, [fareCategories, localParams]);

  return (
    <div className="glass-card p-4">
      {/* Header Compacto */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Calculator className="w-5 h-5 text-orange-400" />
          <div>
            <h3 className="text-lg font-bold text-orange-400">{optionLabel}</h3>
            <p className="text-sm text-slate-400">
              {fareCategories.length > 0 && (
                <>
                  {fareCategories[0].fareClass}
                  {fareCategories[0].paxType !== 'ADT' && ` (${fareCategories[0].paxType})`}
                  {fareCategories[0].notes && ` - ${fareCategories[0].notes}`}
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Valor Total */}
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              USD {compactTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                <ChevronRight className="w-4 h-4 mr-2" />
                Ocultar
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4 mr-2" />
                Detalhar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Pricing Engine Expandido */}
      {isExpanded && (
        <div className="border-t border-slate-600 pt-4">
          {/* Navegação entre Categorias */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                onClick={goToPrevious}
                disabled={currentCategoryIndex === 0}
                className="bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-slate-300 hover:text-slate-200 px-3 py-2 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">
                  {currentCategory?.fareClass}
                  {currentCategory?.paxType !== 'ADT' && ` (${currentCategory?.paxType})`}
                </div>
                <div className="text-sm text-slate-400">
                  {currentCategory?.notes || 'Categoria de tarifa'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {currentCategoryIndex + 1} de {totalCategories}
                </div>
              </div>
              
              <Button
                onClick={goToNext}
                disabled={currentCategoryIndex === totalCategories - 1}
                className="bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-slate-300 hover:text-slate-200 px-3 py-2 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRestore}
                className="bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/30 text-slate-400 hover:text-slate-300 px-3 py-2 text-sm transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 hover:text-green-300 px-4 py-2 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>

          {/* Campos de Entrada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Parâmetros da Categoria Atual */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Parâmetros da Categoria</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Tarifa Base (USD)
                  </label>
                  <Input
                    type="number"
                    value={localParams.tarifa}
                    onChange={(e) => handleParamChange('tarifa', parseFloat(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Taxas Base (USD)
                  </label>
                  <Input
                    type="number"
                    value={localParams.taxasBase}
                    onChange={(e) => handleParamChange('taxasBase', parseFloat(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Configuração Global */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Configuração Global</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    RAV (%)
                  </label>
                  <Input
                    type="number"
                    value={globalConfig.ravPercent}
                    onChange={(e) => handleGlobalConfigChange('ravPercent', parseFloat(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Fee (USD)
                  </label>
                  <Input
                    type="number"
                    value={globalConfig.fee}
                    onChange={(e) => handleGlobalConfigChange('fee', parseFloat(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Nº Parcelas
                  </label>
                  <Input
                    type="number"
                    value={globalConfig.numParcelas}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permitir valores vazios temporariamente, mas usar 4 como fallback apenas quando necessário
                      const numValue = value === '' ? undefined : parseFloat(value);
                      handleGlobalConfigChange('numParcelas', numValue || 4);
                    }}
                    className="w-full"
                    min={1}
                    max={36}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Em até {globalConfig.numParcelas}x no cartão de crédito
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cálculos */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-4">Cálculos</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">RAV ({globalConfig.ravPercent}%)</div>
                <div className="text-lg font-bold text-green-400">
                  {formatCurrency(currentResult.rav)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Comissão</div>
                <div className="text-lg font-bold text-green-400">
                  {formatCurrency(currentResult.comissao)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Taxas Exibidas</div>
                <div className="text-lg font-bold text-orange-400">
                  {formatCurrency(currentResult.taxasExibidas)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Total por Bilhete</div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(currentResult.total)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
