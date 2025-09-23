import { useEffect, useState } from 'react';
import { Clock, Plane } from 'lucide-react';
import { parsePNR, decodeItinerary, type ParsedPNR, type DecodedItinerary } from '@/lib/parser';

interface QuotePreviewProps {
  pnrText: string;
}

export function QuotePreview({ pnrText }: QuotePreviewProps) {
  const [parsed, setParsed] = useState<ParsedPNR | null>(null);
  const [decoded, setDecoded] = useState<DecodedItinerary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pnrText.trim()) {
      setParsed(null);
      setDecoded(null);
      return;
    }

    const parseData = async () => {
      setLoading(true);
      try {
        const parsedResult = await parsePNR(pnrText);
        setParsed(parsedResult);
        
        if (parsedResult?.trechos) {
          const decodedResult = await decodeItinerary(parsedResult.trechos);
          setDecoded(decodedResult);
        }
      } catch (error) {
        console.error('Erro ao processar PNR:', error);
      } finally {
        setLoading(false);
      }
    };

    parseData();
  }, [pnrText]);

  if (!pnrText.trim()) {
    return (
      <div className="glass-card p-6 h-full">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Quote Preview</h2>
        <div className="space-y-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-semibold text-slate-100">GRU → ICN</div>
                <div className="text-sm text-slate-400">2 passageiros</div>
              </div>
              <div className="text-right">
                <div className="text-base font-semibold text-slate-100">Total 5.761,25</div>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-semibold text-slate-100">PVG → GRU</div>
                <div className="text-sm text-slate-400">3 passageiros</div>
              </div>
              <div className="text-right">
                <div className="text-base font-semibold text-slate-100">Total 13.763,20</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 h-full">
      <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
        Quote Preview
        {loading && <Clock size={16} className="animate-spin" />}
      </h2>
      
      {loading ? (
        <div className="space-y-3">
          <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Trechos decodificados */}
          {decoded?.flightInfo.flights && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Trechos</h3>
              {decoded.flightInfo.flights.map((flight, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Plane size={14} className="text-brand" />
                    <span className="font-semibold text-slate-100">
                      {flight.company.iataCode} {flight.flight}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300">
                    {flight.departureAirport.iataCode} → {flight.landingAirport.iataCode}
                  </div>
                  <div className="text-xs text-slate-400">
                    {flight.departureTime} → {flight.landingTime}
                    {flight.overnight && <span className="ml-2 text-brand">+1 dia</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Tarifas detectadas */}
          {parsed?.fares && parsed.fares.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Tarifas</h3>
              {parsed.fares.map((fare, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-slate-100">{fare.category}</div>
                      <div className="text-sm text-slate-400">
                        Tarifa: USD {fare.tarifa} + Taxas: USD {fare.taxas}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-slate-100">
                        USD {(parseFloat(fare.tarifa) + parseFloat(fare.taxas)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Hints detectados */}
          {(parsed?.pagamento_hint || parsed?.bagagem_hint) && (
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-3">
              <h3 className="text-sm font-semibold text-blue-300 mb-2">Detectado automaticamente</h3>
              {parsed.pagamento_hint && (
                <div className="text-xs text-slate-300">Pagamento: {parsed.pagamento_hint}</div>
              )}
              {parsed.bagagem_hint && (
                <div className="text-xs text-slate-300">Bagagem: {parsed.bagagem_hint}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}