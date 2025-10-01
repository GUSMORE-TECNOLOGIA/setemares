import { useState } from 'react';
import { Users, FileText, Edit3 } from 'lucide-react';
import { Input } from '../ui/Input';

interface QuoteMetadataFieldsProps {
  family: string;
  observation: string;
  onFamilyChange: (value: string) => void;
  onObservationChange: (value: string) => void;
}

export function QuoteMetadataFields({ 
  family, 
  observation, 
  onFamilyChange, 
  onObservationChange 
}: QuoteMetadataFieldsProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="glass-card p-6">
      {/* Header com título e botão de edição */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg border border-blue-500/30">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Metadados da Cotação</h3>
            <p className="text-sm text-slate-400">Informações adicionais para identificação e contexto</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-all duration-200"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? 'Salvar' : 'Editar'}</span>
        </button>
      </div>

      {/* Campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campo Família */}
        <div className="space-y-3">
          <label className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Família</span>
          </label>
          <div className="relative">
            <Input
              value={family}
              onChange={(e) => onFamilyChange(e.target.value)}
              placeholder="Nome da família ou cliente"
              disabled={!isEditing}
              className={`w-full transition-all duration-200 ${
                isEditing 
                  ? 'bg-slate-700/50 border-slate-500 text-slate-100 placeholder-slate-400 focus:border-blue-400 focus:ring-blue-400/20' 
                  : 'bg-slate-800/30 border-slate-600 text-slate-300 cursor-not-allowed'
              }`}
            />
            {family && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Identifique de quem é esta cotação para facilitar a organização
          </p>
        </div>

        {/* Campo Observação */}
        <div className="space-y-3">
          <label className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Observação</span>
          </label>
          <div className="relative">
            <Input
              value={observation}
              onChange={(e) => onObservationChange(e.target.value)}
              placeholder="Observações adicionais sobre a cotação"
              disabled={!isEditing}
              className={`w-full transition-all duration-200 ${
                isEditing 
                  ? 'bg-slate-700/50 border-slate-500 text-slate-100 placeholder-slate-400 focus:border-purple-400 focus:ring-purple-400/20' 
                  : 'bg-slate-800/30 border-slate-600 text-slate-300 cursor-not-allowed'
              }`}
            />
            {observation && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Informações importantes que não estão no PNR
          </p>
        </div>
      </div>

      {/* Resumo dos campos preenchidos */}
      {(family || observation) && (
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-700/30 to-slate-600/30 rounded-lg border border-slate-600/50">
          <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Resumo</span>
          </h4>
          <div className="space-y-2 text-sm">
            {family && (
              <div className="flex items-center space-x-3">
                <span className="text-slate-400 w-20">Família:</span>
                <span className="text-blue-300 font-medium">{family}</span>
              </div>
            )}
            {observation && (
              <div className="flex items-start space-x-3">
                <span className="text-slate-400 w-20 mt-0.5">Obs:</span>
                <span className="text-purple-300 font-medium flex-1">{observation}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dica de uso */}
      {!family && !observation && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg border border-blue-500/20">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-blue-500/20 rounded">
              <Edit3 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-1">Dica de Uso</h4>
              <p className="text-xs text-slate-400">
                Preencha a <strong>Família</strong> para identificar o cliente e use o campo <strong>Observação</strong> para 
                adicionar informações importantes que não estão no PNR, como preferências especiais ou requisitos específicos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
