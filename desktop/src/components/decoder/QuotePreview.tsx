import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Wrench, RefreshCw, FileText, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CodeCorrectionModal } from './CodeCorrectionModal';
import { CorrectionPopover } from './CorrectionPopover';
import ModalDetalhesDecodificacao, { DecodedSegment } from '../ModalDetalhesDecodificacao';
import { decoderV2Complete, DecodeResult } from '../../lib/decoder-v2-complete';
import { parsePNR, decodeItinerary, DecodedFlight } from '../../lib/parser';
import { parseEmailToOptions } from '../../lib/email-parser';
import type { ParsedEmail } from '../../lib/types/email-parser';

interface QuotePreviewProps {
  pnrData: string;
  onDecodeComplete?: (results: DecodeResult[]) => void;
}

interface DecodeError {
  code: string;
  line: number;
  context: string;
  suggestions: string[];
}

export function QuotePreview({ pnrData, onDecodeComplete }: QuotePreviewProps) {
  const [decodeResults, setDecodeResults] = useState<DecodeResult[]>([]);
  const [decodedFlights, setDecodedFlights] = useState<DecodedFlight[]>([]);
  const [errors, setErrors] = useState<DecodeError[]>([]);
  const [isDecoding, setIsDecoding] = useState(false);
  const [correctionModal, setCorrectionModal] = useState<{
    isOpen: boolean;
    code: string;
  }>({ isOpen: false, code: '' });
  const [correctionPopover, setCorrectionPopover] = useState<{
    isOpen: boolean;
    token: string;
    tokenKind: 'airline' | 'airport' | 'city' | 'segment';
  }>({ isOpen: false, token: '', tokenKind: 'airline' });
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [pnrHash, setPnrHash] = useState<string>('');
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [parsedEmail, setParsedEmail] = useState<ParsedEmail | null>(null);

  // Debug: Log quando o componente recebe dados
  useEffect(() => {
    console.log('📋 QuotePreview recebeu pnrData:', pnrData);
  }, [pnrData]);

  // Detectar se é e-mail ou PNR e limpar resultados quando vazio
  useEffect(() => {
    if (!pnrData.trim()) {
      console.log('🧹 PNR vazio, limpando resultados automaticamente');
      setDecodeResults([]);
      setDecodedFlights([]);
      setErrors([]);
      setPnrHash('');
      setIsEmailMode(false);
      setParsedEmail(null);
      return;
    }

    // Detectar se é PNR complexo (contém == ou múltiplas tarifas)
    const hasDoubleEquals = pnrData.includes('==');
    const tarifaMatches = pnrData.match(/tarifa\s+usd/gi) || [];
    const isComplexPNR = hasDoubleEquals || tarifaMatches.length > 1;
    
    console.log('🔍 DEBUG DETECÇÃO:');
    console.log('  - Contém ==:', hasDoubleEquals);
    console.log('  - Tarifas encontradas:', tarifaMatches.length);
    console.log('  - Texto:', pnrData.substring(0, 200) + '...');
    console.log('  - É complexo:', isComplexPNR);
    
    if (isComplexPNR) {
      setIsEmailMode(true);
      try {
        const email = parseEmailToOptions(pnrData);
        setParsedEmail(email);
        console.log('📧 PNR complexo detectado e parseado:', email);
      } catch (error) {
        console.error('❌ Erro ao parsear PNR complexo:', error);
        setIsEmailMode(false);
        setParsedEmail(null);
      }
    } else {
      setIsEmailMode(false);
      setParsedEmail(null);
    }
  }, [pnrData]);


  // Extrair códigos do PNR
  const extractCodes = (pnr: string): string[] => {
    const codes: string[] = [];
    
    // Regex para encontrar códigos IATA (3 letras) e ICAO (4 letras)
    const iataRegex = /\b[A-Z]{3}\b/g;
    const icaoRegex = /\b[A-Z]{4}\b/g;
    
    // Regex para encontrar códigos de companhias (2 letras)
    const airlineRegex = /\b[A-Z]{2}\b/g;
    
    // Regex para encontrar códigos de aeroportos concatenados (6 letras como GRULHR)
    const airportPairRegex = /\b[A-Z]{6}\b/g;
    
    const iataMatches = pnr.match(iataRegex) || [];
    const icaoMatches = pnr.match(icaoRegex) || [];
    const airlineMatches = pnr.match(airlineRegex) || [];
    const airportPairMatches = pnr.match(airportPairRegex) || [];
    
    // Adicionar códigos encontrados
    codes.push(...iataMatches);
    codes.push(...icaoMatches);
    codes.push(...airlineMatches);
    
    // Separar códigos de aeroportos concatenados (ex: GRULHR -> GRU, LHR)
    airportPairMatches.forEach(pair => {
      const first = pair.substring(0, 3);
      const second = pair.substring(3, 6);
      codes.push(first, second);
    });
    
    // Filtrar códigos comuns que não são códigos de aeroportos/companhias
    const commonWords = ['USD', 'HS1', 'HK1', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'];
    const filteredCodes = codes.filter(code => !commonWords.includes(code));
    
    console.log('📋 Códigos brutos encontrados:', codes);
    console.log('📋 Códigos filtrados:', filteredCodes);
    
    return [...new Set(filteredCodes)]; // Remove duplicatas
  };

  // Decodificar códigos
  const decodeCodes = async () => {
    console.log('🚀 Iniciando decodificação v2...');
    console.log('📋 PNR Data:', pnrData);
    
    // VALIDAÇÃO CRÍTICA: Se PNR estiver vazio, limpar tudo
    if (!pnrData.trim()) {
      console.log('⚠️ PNR vazio, limpando resultados');
      setDecodeResults([]);
      setDecodedFlights([]);
      setErrors([]);
      setPnrHash('');
      return;
    }
    
    setIsDecoding(true);
    setErrors([]);
    
    try {
      // Primeiro, decodificar o itinerário completo (parser original)
      const parsed = await parsePNR(pnrData);
      if (parsed && parsed.trechos) {
        const decoded = await decodeItinerary(parsed.trechos);
        if (decoded && decoded.flightInfo) {
          setDecodedFlights(decoded.flightInfo.flights);
          console.log('✈️ Voos decodificados:', decoded.flightInfo.flights);
        }
      }

      // Usar o Decoder v2 para estatísticas e correções
      const results = await decoderV2Complete.decodePNR(pnrData);
      console.log('📊 Resultados v2:', results);

      // Gerar hash do PNR para telemetria
      const hash = decoderV2Complete['generatePNRHash'](pnrData);
      setPnrHash(hash);

      // Separar sucessos e erros
      const errorList: DecodeError[] = [];
      results.forEach((result, index) => {
        if (!result.success) {
          errorList.push({
            code: result.originalCode,
            line: index + 1,
            context: `Código não reconhecido: ${result.originalCode}`,
            suggestions: result.suggestions || []
          });
        }
      });

      console.log('❌ Erros encontrados:', errorList);

      setDecodeResults(results);
      setErrors(errorList);
      onDecodeComplete?.(results);
    } catch (error) {
      console.error('❌ Erro ao decodificar:', error);
    } finally {
      setIsDecoding(false);
    }
  };

  // Reprocessar após correção
  const handleCodeResolved = (code: string, result: DecodeResult) => {
    console.log('🔄 Atualizando resultado para código:', code, result);
    
    // Atualizar APENAS o resultado específico
    const updatedResults = decodeResults.map(r => 
      r.originalCode === code ? result : r
    );
    setDecodeResults(updatedResults);

    // Remover erro específico
    setErrors(prev => prev.filter(e => e.code !== code));

    // Reprocessar todos os códigos para atualizar voos
    setTimeout(() => {
      decodeCodes();
    }, 500);
    
    console.log('✅ Resultado atualizado, reprocessando...');
  };

  // Estatísticas
  const stats = {
    total: decodeResults.length,
    success: decodeResults.filter(r => r.success).length,
    errors: decodeResults.filter(r => !r.success).length,
    overrides: decodeResults.filter(r => r.source === 'override').length,
    exact: decodeResults.filter(r => r.source === 'exact_match').length,
    heuristic: decodeResults.filter(r => r.source === 'heuristic').length
  };

  const getResultIcon = (result: DecodeResult) => {
    if (result.success) {
      switch (result.source) {
        case 'override': return <Wrench className="w-4 h-4 text-blue-500" />;
        case 'exact_match': return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'heuristic': return <CheckCircle className="w-4 h-4 text-yellow-500" />;
        default: return <CheckCircle className="w-4 h-4 text-green-500" />;
      }
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getResultLabel = (result: DecodeResult) => {
    if (!result.success) return 'Erro';
    
    switch (result.source) {
      case 'override': return 'Override';
      case 'exact_match': return 'Exato';
      case 'heuristic': return 'Heurístico';
      default: return 'Desconhecido';
    }
  };

  // Converter DecodedFlight para DecodedSegment
  const convertToDecodedSegments = (flights: DecodedFlight[]): DecodedSegment[] => {
    return flights.map((flight, index) => {
      // Converter data brasileira DD/MM/AAAA para ISO
      const convertToISO = (dateStr: string, timeStr: string) => {
        const [day, month, year] = dateStr.split('/');
        const [hours, minutes] = timeStr.split(':');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes)).toISOString();
      };

      // Encontrar o resultado correspondente para este voo
      const correspondingResult = decodeResults.find(result => 
        result.originalCode === flight.departureAirport.iataCode || 
        result.originalCode === flight.landingAirport.iataCode ||
        result.originalCode === flight.company.iataCode
      );

      return {
        airlineName: flight.company.description,
        flightNumber: flight.flight,
        depAirportName: flight.departureAirport.description.split('(')[0].trim(),
        depIata: flight.departureAirport.iataCode,
        depCity: extractCityFromDescription(flight.departureAirport.description),
        depCountry: extractCountryFromDescription(flight.departureAirport.description),
        arrAirportName: flight.landingAirport.description.split('(')[0].trim(),
        arrIata: flight.landingAirport.iataCode,
        arrCity: extractCityFromDescription(flight.landingAirport.description),
        arrCountry: extractCountryFromDescription(flight.landingAirport.description),
        depDateIso: convertToISO(flight.departureDate, flight.departureTime),
        arrDateIso: convertToISO(flight.landingDate, flight.landingTime),
        status: correspondingResult?.success ? 
          (correspondingResult.source === 'override' ? 'override' :
           correspondingResult.source === 'heuristic' ? 'heuristic' : 'success') : 'error',
        token: correspondingResult?.originalCode || flight.departureAirport.iataCode
      };
    });
  };

  // Extrair cidade da descrição do aeroporto
  const extractCityFromDescription = (description: string): string => {
    // Exemplo: "Guarulhos International Airport (GRU), São Paulo, Brazil"
    const parts = description.split(',');
    return parts[1]?.trim() || 'Unknown';
  };

  // Extrair país da descrição do aeroporto
  const extractCountryFromDescription = (description: string): string => {
    // Exemplo: "Guarulhos International Airport (GRU), São Paulo, Brazil"
    const parts = description.split(',');
    return parts[2]?.trim() || 'Unknown';
  };

  const getResultColor = (result: DecodeResult) => {
    if (!result.success) return 'red';
    
    switch (result.source) {
      case 'override': return 'blue';
      case 'exact_match': return 'green';
      case 'heuristic': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <div className="glass-card p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            {isEmailMode ? 'PNR com Múltiplas Opções' : 'Preview da Cotação'}
          </h2>
          <p className="text-sm text-slate-400">
            {isEmailMode ? (
              parsedEmail ? `${parsedEmail.options.length} opções encontradas` : 'Processando PNR complexo...'
            ) : (
              `${stats.total} códigos encontrados • ${stats.success} decodificados • ${stats.errors} erros`
            )}
          </p>
        </div>
        {!isEmailMode && (
          <Button
            onClick={decodeCodes}
            disabled={isDecoding || !pnrData.trim()}
            className="bg-brand hover:bg-brand/90"
          >
            {isDecoding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Decodificando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Decodificar
              </>
            )}
          </Button>
        )}
      </div>

      {/* Modo PNR Complexo: Mostrar opções */}
      {isEmailMode && parsedEmail && (
        <div className="space-y-4">
          <div className="text-sm text-slate-300 mb-4">
            PNR complexo processado com sucesso! {parsedEmail.options.length} opções encontradas.
          </div>
          
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {parsedEmail.options.map((option, optionIndex) => (
              <div key={optionIndex} className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-orange-400">{option.label}</h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                      {option.segments.length} segmentos
                    </span>
                    <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                      {option.fares.length} categorias
                    </span>
                  </div>
                </div>

                {/* Segmentos */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-slate-200 mb-3">Itinerário de Voo</h4>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="space-y-3">
                      {option.segments.map((segment, segmentIndex) => (
                        <div key={segmentIndex} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 text-center">
                              <div className="font-bold text-slate-200">
                                {segment.carrier} {segment.flight}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-slate-300">
                                {segment.depAirport} → {segment.arrAirport}
                              </div>
                              <div className="text-sm text-slate-400">
                                {new Date(segment.depTimeISO).toLocaleString('pt-BR', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })} → 
                                {new Date(segment.arrTimeISO).toLocaleString('pt-BR', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Categorias de Tarifa */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-slate-200 mb-3">Valores por Pessoa</h4>
                  <div className="space-y-3">
                    {option.fares.map((fare, fareIndex) => (
                      <div key={fareIndex} className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="font-bold text-slate-200 text-lg">
                              Classe {fare.fareClass}
                              {fare.paxType && fare.paxType !== 'ADT' && ` (${fare.paxType})`}
                            </div>
                            <div className="text-slate-400">
                              Tarifa USD {fare.baseFare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + 
                              USD {fare.baseTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} taxas
                            </div>
                          </div>
                          <div className="text-xl font-bold text-red-400">
                            TOTAL USD {(fare.baseFare + fare.baseTaxes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {option.paymentTerms && (
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="font-semibold text-slate-300 mb-1">Forma de pagamento:</div>
                      <div className="text-slate-400">{option.paymentTerms}</div>
                    </div>
                  )}
                  {option.baggage && option.baggage.length > 0 && (
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <div className="font-semibold text-slate-300 mb-1">Franquia de bagagem:</div>
                      <div className="text-slate-400">
                        {option.baggage.map(b => `${b.pieces}pc ${b.pieceKg}kg${b.fareClass ? `/${b.fareClass}` : ''}`).join(', ')}
                      </div>
                    </div>
                  )}
                  {option.notes && (
                    <div className="bg-slate-800/30 rounded-lg p-3 md:col-span-2">
                      <div className="font-semibold text-slate-300 mb-1">Observações:</div>
                      <div className="text-slate-400">{option.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modo PNR: Cards de Estatísticas + Botão Ver Detalhes */}
      {!isEmailMode && decodeResults.length > 0 && (
        <div className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-6 border border-green-500/30">
              <div className="text-3xl font-bold text-green-400 mb-2">{stats.success}</div>
              <div className="text-sm font-medium text-green-300">Sucessos</div>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl p-6 border border-red-500/30">
              <div className="text-3xl font-bold text-red-400 mb-2">{stats.errors}</div>
              <div className="text-sm font-medium text-red-300">Erros</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-6 border border-blue-500/30">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.overrides}</div>
              <div className="text-sm font-medium text-blue-300">Overrides</div>
              <div className="text-xs text-blue-400/70 mt-1">Correções manuais</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl p-6 border border-yellow-500/30">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.heuristic}</div>
              <div className="text-sm font-medium text-yellow-300">Heurísticos</div>
              <div className="text-xs text-yellow-400/70 mt-1">Decodificação inteligente</div>
            </div>
          </div>

          {/* Botão Ver Detalhes */}
          <div className="flex justify-center">
            <Button
              onClick={() => setDetailsModalOpen(true)}
              className="bg-gradient-to-r from-brand to-brand/80 hover:from-brand/90 hover:to-brand/70 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FileText className="w-5 h-5 mr-2" />
              Ver Detalhes da Decodificação
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Correção */}
      <CodeCorrectionModal
        isOpen={correctionModal.isOpen}
        onClose={() => setCorrectionModal({ isOpen: false, code: '' })}
        unknownCode={correctionModal.code}
        onResolved={handleCodeResolved}
      />

      {/* Popover de Correção v2 */}
      <CorrectionPopover
        isOpen={correctionPopover.isOpen}
        onClose={() => setCorrectionPopover({ isOpen: false, token: '', tokenKind: 'airline' })}
        token={correctionPopover.token}
        tokenKind={correctionPopover.tokenKind}
        onCorrected={(result) => {
          handleCodeResolved(result.originalCode, result);
        }}
        onReopenDetails={() => setDetailsModalOpen(true)}
      />

      {/* Modal de Detalhes - Componente do Gerente */}
      <ModalDetalhesDecodificacao
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        segments={convertToDecodedSegments(decodedFlights)}
        onCorrect={(segment, token) => {
          // Detectar tipo de token baseado no contexto
          let tokenKind: 'airline' | 'airport' | 'city' | 'segment' = 'airport';
          
          // Se o token está na linha do voo, pode ser companhia ou aeroporto
          if (token === segment.depIata || token === segment.arrIata) {
            tokenKind = 'airport';
          } else if (token.length === 2) {
            tokenKind = 'airline';
          } else if (token.length === 3) {
            tokenKind = 'airport';
          }
          
          // Fechar modal de detalhes temporariamente
          setDetailsModalOpen(false);
          
          // Abrir popover de correção
          setCorrectionPopover({
            isOpen: true,
            token: token,
            tokenKind: tokenKind
          });
        }}
      />

    </div>
  );
}
