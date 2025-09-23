import React from 'react';
import { Button } from '../ui/Button';
import { Eye, RefreshCw } from 'lucide-react';

interface UnifiedPreviewProps {
  pnrData: string;
  isComplexPNR: boolean;
  parsedOptions: any[];
  onShowDetails: () => void;
  // Dados reais de decodificação
  decodeResults?: any;
  decodedFlights?: any[];
  errors?: any[];
  overrides?: any[];
  heuristics?: any[];
}

export function UnifiedPreview({ 
  pnrData, 
  isComplexPNR, 
  parsedOptions, 
  onShowDetails, 
  decodeResults, 
  decodedFlights = [], 
  errors = [], 
  overrides = [], 
  heuristics = [] 
}: UnifiedPreviewProps) {
  // Calcular estatísticas reais
  const totalCodes = decodedFlights.length;
  const successCodes = decodedFlights.filter(f => f.status === 'success').length;
  const errorCodes = errors.length;
  const overrideCodes = overrides.length;
  const heuristicCodes = heuristics.length;
  
  // Debug: Log dos dados para verificar (apenas quando há dados)
  if (pnrData.trim().length > 0 && (parsedOptions.length > 0 || decodedFlights.length > 0)) {
    console.log('🔍 UnifiedPreview Debug:', {
      pnrData: pnrData.trim().length > 0,
      parsedOptions: parsedOptions.length,
      decodedFlights: decodedFlights.length,
      errors: errors.length,
      isComplexPNR
    });
  }

  return (
    <div className="glass-card p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Preview da Cotação</h2>
          <p className="text-sm text-slate-400">
            {totalCodes} códigos encontrados • {successCodes} decodificados • {errorCodes} erros
          </p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30">
          <div className="text-2xl font-bold text-green-400 mb-1">{successCodes}</div>
          <div className="text-sm font-medium text-green-300">Sucessos</div>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl p-4 border border-red-500/30">
          <div className="text-2xl font-bold text-red-400 mb-1">{errorCodes}</div>
          <div className="text-sm font-medium text-red-300">Erros</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/30">
          <div className="text-2xl font-bold text-blue-400 mb-1">{overrideCodes}</div>
          <div className="text-sm font-medium text-blue-300">Overrides</div>
          <div className="text-xs text-blue-400">Correções manuais</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl p-4 border border-yellow-500/30">
          <div className="text-2xl font-bold text-yellow-400 mb-1">{heuristicCodes}</div>
          <div className="text-sm font-medium text-yellow-300">Heurísticos</div>
          <div className="text-xs text-yellow-400">Decodificação inteligente</div>
        </div>
      </div>

      {/* Botão Ver Detalhes */}
      <div className="text-center">
        <Button
          onClick={onShowDetails}
          disabled={!pnrData.trim() || (decodedFlights.length === 0 && errors.length === 0)}
          className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300 px-6 py-3 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver Detalhes da Decodificação
        </Button>
      </div>

      {/* Estado Vazio */}
      {!pnrData.trim() && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            Cole um PNR no editor para começar
          </div>
        </div>
      )}
    </div>
  );
}
