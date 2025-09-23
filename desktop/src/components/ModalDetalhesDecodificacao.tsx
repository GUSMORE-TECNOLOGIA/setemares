// components/ModalDetalhesDecodificacao.tsx
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from "./ui/dialog";
import { X } from "lucide-react";

// Tipagem mínima p/ os dados decodificados
export type DecodedSegment = {
  airlineName: string;     // ex.: "LATAM Airlines"
  flightNumber: string;    // ex.: "8084"
  depAirportName: string;  // "Guarulhos International Airport"
  depIata: string;         // "GRU"
  depCity: string;         // "São Paulo"
  depCountry: string;      // "Brazil"
  arrAirportName: string;  // "London Heathrow Airport"
  arrIata: string;         // "LHR"
  arrCity: string;         // "London"
  arrCountry: string;      // "United Kingdom"
  depDateIso: string;      // ISO ex.: "2025-11-22T23:40:00"
  arrDateIso: string;      // ISO ex.: "2025-11-23T14:05:00"
  status: 'success' | 'error' | 'override' | 'heuristic'; // Status da decodificação
  token?: string;          // Token original que foi decodificado
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  decodedFlights: any[];
  errors: any[];
  onCorrection?: (code: string, type: string, correctedValue: string) => void;
};

function formatDate(iso: string) {
  if (!iso || iso === 'Invalid Date' || iso.includes('NaN')) {
    return 'N/A';
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return 'N/A';
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function formatTime(iso: string) {
  if (!iso || iso === 'Invalid Date' || iso.includes('NaN')) {
    return 'N/A';
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return 'N/A';
  }
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
}

function splitAirline(airlineName: string, flightNumber: string) {
  // Objetivo: linha 1 = primeira palavra (ex.: "LATAM" ou "British" ou "Iberia")
  // linha 2 = resto do nome + número (ex.: "Airlines 8084" ou "Airways 748" ou "618")
  const parts = airlineName.trim().split(/\s+/);
  const line1 = parts[0] ?? airlineName;
  const tail = parts.slice(1).join(" ");
  const line2 = `${tail ? tail + " " : ""}${flightNumber}`;
  return { line1, line2 };
}

function getStatusColor(status: string) {
  switch (status) {
    case 'success': return 'text-green-400 bg-green-400/10';
    case 'error': return 'text-red-400 bg-red-400/10';
    case 'override': return 'text-blue-400 bg-blue-400/10';
    case 'heuristic': return 'text-yellow-400 bg-yellow-400/10';
    default: return 'text-slate-400 bg-slate-400/10';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'success': return 'Sucesso';
    case 'error': return 'Erro';
    case 'override': return 'Override';
    case 'heuristic': return 'Heurístico';
    default: return 'Desconhecido';
  }
}

export default function ModalDetalhesDecodificacao({
  isOpen,
  onClose,
  decodedFlights = [],
  errors = [],
  onCorrection,
}: Props) {
  // Debug: Log da estrutura dos dados
  console.log('🔍 ModalDetalhesDecodificacao Debug:', {
    decodedFlights,
    errors,
    decodedFlightsLength: decodedFlights.length,
    errorsLength: errors.length
  });
  
  // Debug detalhado do primeiro voo
  if (decodedFlights.length > 0) {
    console.log('🔍 Primeiro voo detalhado:', decodedFlights[0]);
    console.log('🔍 Estrutura do voo:', Object.keys(decodedFlights[0]));
  }
  

  // Combinar voos decodificados e erros em uma lista única
  const allSegments = [
    ...decodedFlights.map(flight => ({
      airlineName: flight.airlineName || flight.airline || flight.company?.name || 'Unknown',
      flightNumber: flight.flightNumber || flight.flight || 'N/A',
      depAirportName: flight.departureAirport?.description || flight.depAirportName || 'Unknown',
      depIata: flight.depIata || flight.departureAirport?.iataCode || 'N/A',
      depCity: flight.depCity || 'Unknown',
      depCountry: flight.depCountry || 'Unknown',
      arrAirportName: flight.landingAirport?.description || flight.arrAirportName || 'Unknown',
      arrIata: flight.arrIata || flight.landingAirport?.iataCode || 'N/A',
      arrCity: flight.arrCity || 'Unknown',
      arrCountry: flight.arrCountry || 'Unknown',
      depDateIso: flight.depDateIso || flight.departureTime || new Date().toISOString(),
      arrDateIso: flight.arrDateIso || flight.landingTime || new Date().toISOString(),
      status: flight.status || 'success',
      token: flight.token || flight.originalCode || `${flight.depIata || 'N/A'}${flight.arrIata || 'N/A'}`
    })),
    ...errors.map(error => ({
      airlineName: 'Error',
      flightNumber: error.code || 'N/A',
      depAirportName: 'Unknown',
      depIata: 'N/A',
      depCity: 'Unknown',
      depCountry: 'Unknown',
      arrAirportName: 'Unknown',
      arrIata: 'N/A',
      arrCity: 'Unknown',
      arrCountry: 'Unknown',
      depDateIso: new Date().toISOString(),
      arrDateIso: new Date().toISOString(),
      status: 'error' as const,
      token: error.code
    }))
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Overlay escuro premium */}
      <DialogOverlay className="fixed inset-0 z-[99] bg-slate-950/70 backdrop-blur-sm" />

      <DialogContent
        // Conteúdo centralizado, retangular, sem elementos extras
        className="z-[100] w-[90vw] max-w-[1100px] rounded-2xl border border-white/10 bg-slate-900 p-0 shadow-2xl
                   data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
      >
        <DialogTitle className="sr-only">Detalhes da Decodificação</DialogTitle>
        {/* Botão único de fechar (sem título/repetição) - posicionado fora da tabela */}
        <button
          aria-label="Fechar"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 inline-flex h-8 w-8 items-center justify-center
                     rounded-full bg-slate-800/90 ring-1 ring-white/20 transition hover:bg-slate-700
                     shadow-lg"
        >
          <X className="h-4 w-4 text-slate-200" />
        </button>

        {/* Tabela Premium Estilo PDF */}
        <div className="overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl">
          <table className="w-full table-fixed border-collapse">
            <thead className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
              <tr className="text-left text-slate-100">
                <th className="px-6 py-4 text-sm font-bold tracking-wide w-[14%] border-r border-slate-600/30">
                  VOO
                </th>
                <th className="px-6 py-4 text-sm font-bold tracking-wide w-[20%] border-r border-slate-600/30">
                  AEROPORTO PARTIDA
                </th>
                <th className="px-6 py-4 text-sm font-bold tracking-wide w-[20%] border-r border-slate-600/30">
                  AEROPORTO CHEGADA
                </th>
                <th className="px-6 py-4 text-sm font-bold tracking-wide w-[11%] border-r border-slate-600/30">
                  HORÁRIO DE PARTIDA
                </th>
                <th className="px-6 py-4 text-sm font-bold tracking-wide w-[11%] border-r border-slate-600/30">
                  HORÁRIO DE CHEGADA
                </th>
                <th className="px-6 py-4 text-sm font-bold tracking-wide w-[9%] border-r border-slate-600/30">
                  STATUS
                </th>
                <th className="px-6 py-4 text-sm font-bold tracking-wide w-[15%]">
                  AÇÕES
                </th>
              </tr>
            </thead>

            <tbody className="bg-slate-900">
              {allSegments.map((s, idx) => {
                const { line1, line2 } = splitAirline(s.airlineName, s.flightNumber);
                return (
                  <tr
                    key={`${s.airlineName}-${s.flightNumber}-${idx}`}
                    className={`${idx % 2 === 0 ? "bg-slate-900" : "bg-slate-800/50"} hover:bg-slate-700/30 transition-colors duration-200 border-b border-slate-700/30`}
                  >
                    {/* VOO */}
                    <td className="px-6 py-5 align-top border-r border-slate-700/30">
                      <div className="text-base font-semibold leading-tight text-slate-100">{line1}</div>
                      <div className="text-sm leading-tight text-slate-400">{line2}</div>
                    </td>

                    {/* AEROPORTO PARTIDA */}
                    <td className="px-6 py-5 align-top border-r border-slate-700/30">
                      <div className="text-base font-medium leading-tight text-slate-100">
                        {s.depAirportName} ({s.depIata})
                      </div>
                      {s.depCity !== 'Unknown' && s.depCountry !== 'Unknown' && (
                        <div className="text-sm leading-tight text-slate-400">
                          {s.depCity}, {s.depCountry}
                        </div>
                      )}
                    </td>

                    {/* AEROPORTO CHEGADA */}
                    <td className="px-6 py-5 align-top border-r border-slate-700/30">
                      <div className="text-base font-medium leading-tight text-slate-100">
                        {s.arrAirportName} ({s.arrIata})
                      </div>
                      {s.arrCity !== 'Unknown' && s.arrCountry !== 'Unknown' && (
                        <div className="text-sm leading-tight text-slate-400">
                          {s.arrCity}, {s.arrCountry}
                        </div>
                      )}
                    </td>

                    {/* HORÁRIO DE PARTIDA */}
                    <td className="px-6 py-5 align-top border-r border-slate-700/30">
                      <div className="text-base font-extrabold leading-tight text-slate-100">
                        {formatDate(s.depDateIso)}
                      </div>
                      <div className="text-sm leading-tight text-slate-400">
                        {formatTime(s.depDateIso)}
                      </div>
                    </td>

                    {/* HORÁRIO DE CHEGADA */}
                    <td className="px-6 py-5 align-top border-r border-slate-700/30">
                      <div className="text-base font-extrabold leading-tight text-slate-100">
                        {formatDate(s.arrDateIso)}
                      </div>
                      <div className="text-sm leading-tight text-slate-400">
                        {formatTime(s.arrDateIso)}
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-5 align-top border-r border-slate-700/30">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(s.status)}`}>
                        {getStatusText(s.status)}
                      </span>
                    </td>

                    {/* AÇÕES */}
                    <td className="px-6 py-5 align-top">
                      <button
                        onClick={() => {
                          console.log('🔧 Botão Corrigir clicado para:', s);
                          if (onCorrection) {
                            onCorrection(s.token || s.depIata + s.arrIata, 'airport', '');
                          }
                        }}
                        className="inline-flex items-center rounded-md bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-2 text-xs font-medium text-white transition-all duration-200 hover:from-orange-700 hover:to-orange-600 hover:shadow-lg whitespace-nowrap"
                      >
                        Corrigir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ModalDetalhesDecodificacao };
