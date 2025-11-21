import { Plane, Calendar, DollarSign, CreditCard, Package, FileText } from 'lucide-react';

interface SimpleSummaryProps {
  pnrData: any;
  pricingResult: any;
  updatedFares?: any[];
  decodedFlights?: any[];
  numParcelas?: number;
  comparisonData?: {
    otherOptionsCount: number;
    priceDifference: number;
  };
}

const DEFAULT_PAYMENT_TERMS = 'Em até 4x no cartão de crédito. Taxas à vista.';
const DEFAULT_BAGGAGE = 'Conforme regra da tarifa';

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(value: string | undefined): string {
  if (!value) {
    return '--';
  }

  // Formato: "13/04/2026 09:50" (dd/mm/yyyy hh:mm)
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Fallback para ISO ou outros formatos
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function SimpleSummary({ pnrData, pricingResult, updatedFares, decodedFlights, numParcelas, comparisonData }: SimpleSummaryProps) {
  const segments = Array.isArray(decodedFlights) && decodedFlights.length
    ? decodedFlights
    : Array.isArray(pnrData?.segments) ? pnrData.segments : [];
  const fares = updatedFares ?? (Array.isArray(pnrData?.fares) ? pnrData.fares : []);

  // Construir payment terms dinamicamente com base em numParcelas
  const finalNumParcelas = numParcelas || pnrData?.numParcelas || 4;
  const paymentTerms = pnrData?.paymentTerms || `Em até ${finalNumParcelas}x no cartão de crédito. Taxas à vista.`;

  // Converter baggage de array para string
  const baggage = (() => {
    const baggageData = pnrData?.baggage;
    if (!baggageData) return DEFAULT_BAGGAGE;

    // Se já é string, retornar diretamente
    if (typeof baggageData === 'string') return baggageData;

    // Se é array de objetos, converter para string
    if (Array.isArray(baggageData)) {
      return baggageData
        .map((bag: any) => {
          const classLabel = bag.fareClass ? `/${bag.fareClass}` : '';
          return `${bag.pieces}pc ${bag.pieceKg}kg${classLabel}`;
        })
        .join(', ') || DEFAULT_BAGGAGE;
    }

    return DEFAULT_BAGGAGE;
  })();
  // Priorizar observações dos Metadados da Cotação, depois notes do PNR
  const notes = pnrData?.observation || pnrData?.notes || '';

  const hasSummaryData = Boolean(segments.length || fares.length || pricingResult);

  return (
    <div className="mb-6 h-full">
      <div className="glass-card p-6 h-full">
        <h3 className="text-xl font-bold text-slate-100 mb-4">Resumo da Cotação</h3>

        {hasSummaryData ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
                <Plane className="w-4 h-4 mr-2" />
                Itinerário
              </h4>
              <div className="space-y-2">
                {segments.map((segment: any, index: number) => {
                  // Usar dados do decodedFlights se disponível (formato correto)
                  const companyCode = segment.company?.iataCode || segment.carrier || '--';
                  const flightNumber = segment.flight || '--';

                  // Extrair IATA codes dos aeroportos
                  let depAirport = '--';
                  let arrAirport = '--';
                  let depTime;
                  let arrTime;

                  // Formato decodedFlights (departureAirport, landingAirport)
                  if (segment.departureAirport?.iataCode) {
                    depAirport = segment.departureAirport.iataCode;
                    depTime = `${segment.departureDate} ${segment.departureTime}`;
                  }
                  // Formato alternativo (departure, arrival)
                  else if (segment.departure?.iataCode) {
                    depAirport = segment.departure.iataCode;
                    depTime = segment.departure.dateTimeISO || segment.depTimeISO;
                  }
                  // Formato string "São Paulo (GRU)"
                  else if (segment.depAirport) {
                    const depMatch = segment.depAirport.match(/\(([A-Z]{3})\)/);
                    depAirport = depMatch ? depMatch[1] : segment.depAirport.slice(0, 3).toUpperCase();
                    depTime = segment.depTimeISO;
                  }

                  // Formato decodedFlights (landingAirport)
                  if (segment.landingAirport?.iataCode) {
                    arrAirport = segment.landingAirport.iataCode;
                    arrTime = segment.landingDate && segment.landingTime
                      ? `${segment.landingDate} ${segment.landingTime}`
                      : segment.arrTimeISO || '--';
                  }
                  // Formato alternativo (arrival)
                  else if (segment.arrival?.iataCode) {
                    arrAirport = segment.arrival.iataCode;
                    arrTime = segment.arrival.dateTimeISO || segment.arrTimeISO;
                  }
                  // Formato string "Frankfurt (FRA)"
                  else if (segment.arrAirport) {
                    const arrMatch = segment.arrAirport.match(/\(([A-Z]{3})\)/);
                    arrAirport = arrMatch ? arrMatch[1] : segment.arrAirport.slice(0, 3).toUpperCase();
                    arrTime = segment.arrTimeISO;
                  }

                  return (
                    <div key={index} className="flex flex-wrap items-center justify-between gap-4 text-sm bg-slate-600/30 rounded p-3">
                      <div className="font-medium text-slate-200">
                        {companyCode} {flightNumber}
                      </div>
                      <div className="text-slate-300">
                        {depAirport} → {arrAirport}
                      </div>
                      <div className="text-slate-400">
                        {formatDateTime(depTime)} → {formatDateTime(arrTime)}
                      </div>
                    </div>
                  );
                })}

                {segments.length === 0 && (
                  <div className="text-sm text-slate-400 bg-slate-700/20 rounded p-3 text-center">
                    Nenhum itinerário disponível ainda.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Valores
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {fares.length > 0 ? (
                  fares.map((fare: any, index: number) => {
                    const baseFareValue = toNumber(fare.baseFare ?? fare.tarifa ?? 0);
                    const baseTaxesValue = toNumber(fare.baseTaxes ?? fare.taxas ?? 0);

                    // Calcular valores individuais para cada categoria
                    let taxesDisplay = baseTaxesValue;
                    let totalDisplay = baseFareValue + baseTaxesValue;
                    let extrasDisplay = 0;

                    if (pricingResult) {
                      const ravPercent = typeof pnrData?.ravPercent === 'number' ? pnrData.ravPercent : 10;
                      const incentivoPercent = typeof pnrData?.incentivoPercent === 'number' ? pnrData.incentivoPercent : 0;
                      const incentivoValue = baseFareValue * (incentivoPercent / 100);
                      const ravValue = baseFareValue * (ravPercent / 100);

                      taxesDisplay = baseTaxesValue + ravValue + incentivoValue;
                      totalDisplay = baseFareValue + taxesDisplay;
                      extrasDisplay = ravValue + incentivoValue;
                    }

                    return (
                      <div key={index} className="bg-slate-600/30 rounded p-4">
                        <div className="font-medium text-slate-200 text-sm mb-2">
                          {fare.fareClass || fare.category || 'ADT'}
                          {fare.paxType && fare.paxType !== 'ADT' && ` (${fare.paxType})`}
                        </div>
                        <div className="text-xs text-slate-400 mb-2">
                          USD {formatCurrency(baseFareValue)} + USD {formatCurrency(taxesDisplay)} taxas
                        </div>
                        <div className="text-xs text-slate-500 mb-2">
                          {pricingResult
                            ? `Encargos adicionais: USD ${formatCurrency(extrasDisplay)}`
                            : '+ RAV + Fee + Incentivo'}
                        </div>
                        <div className="text-sm font-bold text-red-400">
                          TOTAL: USD {formatCurrency(totalDisplay)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-slate-600/30 rounded p-6 text-center text-sm text-slate-400">
                    Assim que decodificarmos o PNR, os valores calculados aparecem aqui.
                  </div>
                )}
              </div>
            </div>

            {/* Badge de Comparação */}
            {comparisonData && comparisonData.otherOptionsCount > 0 && (
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-300 font-medium">
                      Comparando com {comparisonData.otherOptionsCount} outra(s) opção(ões)
                    </div>
                    <div className="text-xs text-blue-400/70 mt-1">
                      Diferença em relação à Opção 1
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${comparisonData.priceDifference > 0
                    ? 'text-red-400'
                    : comparisonData.priceDifference < 0
                      ? 'text-green-400'
                      : 'text-slate-400'
                    }`}>
                    {comparisonData.priceDifference > 0 ? '+' : ''}
                    USD {formatCurrency(Math.abs(comparisonData.priceDifference))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-slate-300 mb-2 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagamento
                </h5>
                <div className="text-slate-400">
                  Em até {finalNumParcelas}x no cartão de crédito. Taxas à vista.
                </div>
              </div>

              <div>
                <h5 className="font-medium text-slate-300 mb-2 flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Bagagem
                </h5>
                <div className="text-slate-400">{baggage}</div>
              </div>

              <div>
                <h5 className="font-medium text-slate-300 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Observações
                </h5>
                <div className="text-slate-400">{notes || 'Sem observações adicionais.'}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-sm text-slate-400">
            <Calendar className="w-5 h-5 text-slate-500" />
            <p className="max-w-xs">
              Cole um PNR no editor e clique em Executar para visualizar o resumo da cotação.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
