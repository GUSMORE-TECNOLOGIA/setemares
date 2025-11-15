import { useState, useEffect } from 'react';
import { X, Search, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { decoderV2, DecodeResult } from '../../lib/decoder-v2';
import { supabase } from '../../lib/supabase';

interface CodeCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  unknownCode: string;
  onResolved: (code: string, result: DecodeResult) => void;
}

export function CodeCorrectionModal({ 
  isOpen, 
  onClose, 
  unknownCode, 
  onResolved 
}: CodeCorrectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedResult(null);
    }
  }, [isOpen, unknownCode]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      // Buscar em aeroportos
      const { data: airports } = await supabase
        .from('airports')
        .select('id, iata3, icao4, name, country')
        .or(`iata3.ilike.%${searchTerm}%,icao4.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(10);

      // Buscar em companhias
      const { data: airlines } = await supabase
        .from('airlines')
        .select('id, iata2, icao3, name, country')
        .or(`iata2.ilike.%${searchTerm}%,icao3.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(10);

      // Buscar em cidades
      const { data: cities } = await supabase
        .from('cities')
        .select('id, iata3, name, country')
        .or(`iata3.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(10);

      const results = [
        ...(airports || []).map(item => ({ ...item, type: 'airport' })),
        ...(airlines || []).map(item => ({ ...item, type: 'airline' })),
        ...(cities || []).map(item => ({ ...item, type: 'city' }))
      ];

      setSearchResults(results);
    } catch (error) {
      console.error('❌ Erro na busca:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedResult) return;

    setIsResolving(true);
    try {
      const success = await decoderV2.resolveUnknownCode(
        unknownCode,
        selectedResult.type,
        selectedResult.id,
        selectedResult.name
      );

      if (success) {
        const decodeResult: DecodeResult = {
          success: true,
          type: selectedResult.type,
          data: selectedResult,
          source: 'override',
          confidence: 100,
          originalCode: unknownCode
        };

        onResolved(unknownCode, decodeResult);
        onClose();
      }
    } catch (error) {
      console.error('❌ Erro ao resolver código:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const getDisplayCode = (item: any) => {
    if (item.type === 'airport') {
      return item.iata3 || item.icao4 || '—';
    } else if (item.type === 'airline') {
      return item.iata2 || item.icao3 || '—';
    } else {
      return item.iata3 || '—';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'airport': return 'Aeroporto';
      case 'airline': return 'Companhia';
      case 'city': return 'Cidade';
      default: return type;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Corrigir Código: ${unknownCode}`} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            <div>
              <h2 className="text-xl font-semibold text-slate-200">
                Corrigir Código Desconhecido
              </h2>
              <p className="text-sm text-slate-400">
                Código: <span className="font-mono font-bold text-amber-400">{unknownCode}</span>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Buscar correspondência
            </label>
            <div className="flex gap-2">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite nome, código IATA/ICAO..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="px-4"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Resultados encontrados
              </label>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedResult?.id === item.id && selectedResult?.type === item.type
                        ? 'border-brand bg-brand/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    onClick={() => setSelectedResult(item)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                            {getTypeLabel(item.type)}
                          </span>
                          <span className="font-mono font-bold text-slate-200">
                            {getDisplayCode(item)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.country}</p>
                      </div>
                      {selectedResult?.id === item.id && selectedResult?.type === item.type && (
                        <Check className="w-5 h-5 text-brand" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedResult && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-600">
              <h3 className="font-medium text-slate-200 mb-2">Correspondência selecionada:</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-slate-400">Tipo:</span> {getTypeLabel(selectedResult.type)}</p>
                <p><span className="text-slate-400">Código:</span> {getDisplayCode(selectedResult)}</p>
                <p><span className="text-slate-400">Nome:</span> {selectedResult.name}</p>
                <p><span className="text-slate-400">País:</span> {selectedResult.country}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!selectedResult || isResolving}
            className="bg-brand hover:bg-brand/90"
          >
            {isResolving ? 'Resolvendo...' : 'Corrigir Agora'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
