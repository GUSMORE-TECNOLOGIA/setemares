import React from 'react';
import { Plane, Calendar, DollarSign, CreditCard, Package, FileText } from 'lucide-react';

interface SimpleSummaryProps {
  pnrData: any;
  pricingResult: any;
  // Dados atualizados do AdvancedPricingEngine
  updatedFares?: any[];
}

export function SimpleSummary({ pnrData, pricingResult, updatedFares }: SimpleSummaryProps) {
  console.log('🔍 SimpleSummary renderizando:', { pnrData, pricingResult, updatedFares });
  
  if (!pnrData || !pricingResult) {
    console.log('❌ SimpleSummary: dados insuficientes', { pnrData: !!pnrData, pricingResult: !!pricingResult });
    return null;
  }

  // Extrair dados do PNR
  const segments = pnrData.segments || [];
  // Usar fares atualizados se disponível, senão usar originais
  const fares = updatedFares || pnrData.fares || [];
  const paymentTerms = pnrData.paymentTerms || 'Em até 4x no cartão de crédito. Taxas à vista.';
  const baggage = pnrData.baggage || 'Conforme regra da tarifa';
  const notes = pnrData.notes || '';
  
  console.log('🔍 SimpleSummary dados:', { 
    segments: segments.length, 
    fares: fares.length, 
    pricingResult: !!pricingResult,
    updatedFares: !!updatedFares 
  });

  return (
    <div className="mb-6">
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-4">Resumo da Cotação</h3>
        
        <div className="space-y-4">
          {/* Itinerário */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
              <Plane className="w-4 h-4 mr-2" />
              Itinerário
            </h4>
            <div className="space-y-2">
              {segments.map((segment: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm bg-slate-600/30 rounded p-3">
                  <div className="font-medium text-slate-200">
                    {segment.carrier} {segment.flight}
                  </div>
                  <div className="text-slate-300">
                    {segment.depAirport} → {segment.arrAirport}
                  </div>
                  <div className="text-slate-400">
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
              ))}
            </div>
          </div>

          {/* Valores */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Valores
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {fares.map((fare: any, index: number) => {
                // Usar pricingResult se disponível, senão calcular
                const baseFare = pricingResult?.totalBaseFare || 
                  (typeof (fare.baseFare || fare.tarifa || '0') === 'string' 
                    ? parseFloat((fare.baseFare || fare.tarifa || '0').replace(',', '.')) || 0
                    : (fare.baseFare || fare.tarifa || 0));
                const baseTaxes = pricingResult?.totalBaseTaxes || 
                  (typeof (fare.baseTaxes || fare.taxas || '0') === 'string'
                    ? parseFloat((fare.baseTaxes || fare.taxas || '0').replace(',', '.')) || 0
                    : (fare.baseTaxes || fare.taxas || 0));
                const rav = pricingResult?.rav || 10;
                const fee = pricingResult?.fee || 0;
                const incentivo = pricingResult?.incentivo || 0;
                const total = pricingResult?.total || (baseFare + baseTaxes + (baseFare + baseTaxes) * (rav / 100) + fee + incentivo);
                
                return (
                  <div key={index} className="bg-slate-600/30 rounded p-4">
                    <div className="font-medium text-slate-200 text-sm mb-2">
                      {fare.fareClass || fare.category || 'ADT'}
                      {fare.paxType && fare.paxType !== 'ADT' && ` (${fare.paxType})`}
                    </div>
                    <div className="text-xs text-slate-400 mb-2">
                      USD {baseFare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + 
                      USD {baseTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} taxas
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      + RAV {rav}% + Fee + Incentivo
                    </div>
                    <div className="text-sm font-bold text-red-400">
                      TOTAL: USD {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {/* Pagamento */}
            <div>
              <h5 className="font-medium text-slate-300 mb-2 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Pagamento
              </h5>
              <div className="text-slate-400">{paymentTerms}</div>
            </div>

            {/* Bagagem */}
            <div>
              <h5 className="font-medium text-slate-300 mb-2 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Bagagem
              </h5>
              <div className="text-slate-400">{baggage}</div>
            </div>

            {/* Observações */}
            {notes && (
              <div>
                <h5 className="font-medium text-slate-300 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Observações
                </h5>
                <div className="text-slate-400">{notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
