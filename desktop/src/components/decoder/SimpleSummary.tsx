import { Plane, Calendar, DollarSign, CreditCard, Package, FileText } from 'lucide-react';

interface SimpleSummaryProps {
  pnrData: any;
  pricingResult: any;
  updatedFares?: any[];
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

export function SimpleSummary({ pnrData, pricingResult, updatedFares }: SimpleSummaryProps) {
  const segments = Array.isArray(pnrData?.segments) ? pnrData.segments : [];
  const fares = updatedFares ?? (Array.isArray(pnrData?.fares) ? pnrData.fares : []);
  const paymentTerms = pnrData?.paymentTerms ?? DEFAULT_PAYMENT_TERMS;
  const baggage = pnrData?.baggage ?? DEFAULT_BAGGAGE;
  const notes = pnrData?.notes ?? '';

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
                {segments.map((segment: any, index: number) => (
                  <div key={index} className="flex flex-wrap items-center justify-between gap-4 text-sm bg-slate-600/30 rounded p-3">
                    <div className="font-medium text-slate-200">
                      {segment.carrier} {segment.flight}
                    </div>
                    <div className="text-slate-300">
                      {segment.depAirport} → {segment.arrAirport}
                    </div>
                    <div className="text-slate-400">
                      {formatDateTime(segment.depTimeISO)} → {formatDateTime(segment.arrTimeISO)}
                    </div>
                  </div>
                ))}

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
                    
                    if (pricingResult && pnrData?.ravPercent !== undefined && pnrData?.incentivoPercent !== undefined) {
                      // Calcular incentivo individual
                      const incentivoValue = baseFareValue * (pnrData.incentivoPercent / 100);
                      const ravValue = baseFareValue * ((pnrData.ravPercent || 10) / 100);
                      
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
                          {pricingResult && pnrData?.ravPercent !== undefined && pnrData?.incentivoPercent !== undefined
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-slate-300 mb-2 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagamento
                </h5>
                <div className="text-slate-400">{paymentTerms}</div>
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
              Cole um PNR no editor e clique em Executar para visualizar o resumo da cotaÃ§Ã£o.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
