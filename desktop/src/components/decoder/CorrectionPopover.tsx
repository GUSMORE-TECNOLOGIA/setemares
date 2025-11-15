import { useState, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface CorrectionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  tokenKind: 'airline' | 'airport' | 'city' | 'segment';
  onCorrected: (result: any) => void;
  onReopenDetails?: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  iata?: string;
  icao?: string;
  city?: string;
  country?: string;
  kind: 'airline' | 'airport';
}

export function CorrectionPopover({ 
  isOpen, 
  onClose, 
  token, 
  tokenKind: _tokenKind, 
  onCorrected,
  onReopenDetails
}: CorrectionPopoverProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [reason, setReason] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Buscar resultados com debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await searchCatalog(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchCatalog = async (query: string) => {
    setIsSearching(true);
    try {
      // Usar cache quando possível para melhor performance
      const { getAirports, getAirlines } = await import('@/lib/catalog-cache');
      
      // Carregar todos os dados do cache (ou Supabase se cache expirado)
      const [allAirports, allAirlines] = await Promise.all([
        getAirports().catch(() => []), // Fallback para array vazio em caso de erro
        getAirlines().catch(() => [])
      ]);

      // Filtrar localmente (mais rápido que query no Supabase)
      const queryLower = query.toLowerCase();
      const airports = allAirports
        .filter(airport => 
          airport.name?.toLowerCase().includes(queryLower) ||
          airport.iata3?.toLowerCase().includes(queryLower) ||
          airport.icao4?.toLowerCase().includes(queryLower)
        )
        .slice(0, 5);
      
      const airlines = allAirlines
        .filter(airline =>
          airline.name?.toLowerCase().includes(queryLower) ||
          airline.iata2?.toLowerCase().includes(queryLower) ||
          airline.icao3?.toLowerCase().includes(queryLower)
        )
        .slice(0, 5);

      const results: SearchResult[] = [
        ...airports.map(item => ({
          id: String(item.id),
          name: item.name,
          iata: item.iata3,
          icao: item.icao4 || undefined,
          city: item.city_iata || undefined,
          country: item.country,
          kind: 'airport' as const
        })),
        ...airlines.map(item => ({
          id: String(item.id),
          name: item.name,
          iata: item.iata2 || undefined,
          icao: item.icao3 || undefined,
          city: undefined, // AirlineRow não tem city
          country: item.country || undefined,
          kind: 'airline' as const
        }))
      ];

      setSearchResults(results);
    } catch (error) {
      console.error('Erro inesperado na busca:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!selectedResult) return;

    setIsSaving(true);
    try {
      // Salvar na tabela code_overrides existente
      const { data, error } = await supabase
        .from('code_overrides')
        .insert({
          code: token,
          kind: selectedResult.kind,
          mapped_id: selectedResult.id,
          note: reason.trim() || `Correção manual: ${token} -> ${selectedResult.name}`
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar override:', error);
        return;
      }

      // Chamar callback de correção
      onCorrected({
        success: true,
        type: selectedResult.kind,
        data: selectedResult,
        source: 'override',
        confidence: 100,
        originalCode: token,
        targetId: selectedResult.id,
        targetKind: selectedResult.kind
      });

      // Fechar modal e reabrir detalhes
      handleClose();
      
      console.log('✅ Override salvo com sucesso:', data);
    } catch (error) {
      console.error('Erro ao salvar correção:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
  };

  const handleClose = () => {
    // Limpar estado
    setSearchQuery('');
    setSearchResults([]);
    setSelectedResult(null);
    setReason('');
    
    // Fechar modal
    onClose();
    
    // Reabrir modal de detalhes se disponível
    if (onReopenDetails) {
      setTimeout(() => {
        onReopenDetails();
      }, 100);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-slate-900 rounded-xl p-6 w-[90vw] max-w-2xl shadow-2xl border border-slate-700/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">
            Corrigir: <span className="text-brand">{token}</span>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-200 mb-2">
            Buscar aeroporto ou companhia aérea
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o nome do aeroporto ou companhia..."
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
            />
          </div>
        </div>

        {/* Resultados da busca */}
        {searchQuery && (
          <div className="mb-6">
            <div className="max-h-60 overflow-y-auto border border-slate-700 rounded-lg">
              {isSearching ? (
                <div className="p-4 text-center text-slate-400">
                  Buscando...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-slate-700">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleResultSelect(result)}
                      className={`p-4 cursor-pointer hover:bg-slate-700/50 transition-colors ${
                        selectedResult?.id === result.id ? 'bg-brand/20 border-l-4 border-brand' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{result.name}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              result.kind === 'airport' 
                                ? 'bg-blue-500/20 text-blue-300' 
                                : 'bg-green-500/20 text-green-300'
                            }`}>
                              {result.kind === 'airport' ? 'Aeroporto' : 'Companhia'}
                            </span>
                          </div>
                          <div className="text-sm text-slate-400">
                            {result.iata && `IATA: ${result.iata}`}
                            {result.icao && ` • ICAO: ${result.icao}`}
                            {result.city && ` • ${result.city}`}
                            {result.country && `, ${result.country}`}
                          </div>
                        </div>
                        {selectedResult?.id === result.id && (
                          <Check className="w-5 h-5 text-brand" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400">
                  Nenhum resultado encontrado
                </div>
              )}
            </div>
          </div>
        )}

        {/* Motivo (opcional) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-200 mb-2">
            Motivo da correção (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Código incorreto no PNR, nome diferente..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand resize-none"
            rows={3}
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedResult || isSaving}
            className="bg-brand hover:bg-brand/90"
          >
            {isSaving ? 'Salvando...' : 'Salvar Correção'}
          </Button>
        </div>
      </div>
    </div>
  );
}
