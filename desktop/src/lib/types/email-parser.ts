// EMAIL-MULTI-002: Tipos para parser de e-mail com múltiplas opções
export type ParsedEmail = {
  options: ParsedOption[];
};

export type ParsedOption = {
  label: string;               // "Opção 1"…
  paymentTerms?: string;       // "pagto 6x - net net"
  notes?: string;              // "Direto opera no dia seguinte"
  segments: ParsedSegment[];
  fares: ParsedFare[];         // múltiplas categorias
  baggage?: ParsedBaggage[];   // opcional
  numParcelas?: number;        // número de parcelas detectado
  ravPercent?: number;         // percentual de RAV detectado
  incentivoPercent?: number;  // percentual de incentivo detectado (ex: "in 3%")
  feeUSD?: number;            // fee em USD detectado (ex: "Fee USD 50,00")
  changePenalty?: string;     // multa de alteração (ex: "USD 200,00")
  refundable?: string;        // valor de reembolso (ex: "USD 400,00")
};

export type ParsedSegment = {
  carrier: string; 
  flight: string;
  depAirport: string; 
  arrAirport: string;
  depTimeISO: string;          // 2025-10-14T22:50:00-03:00
  arrTimeISO: string;          // overnight respeitando '#'
  status?: string; 
  cabin?: string; 
  bookingClass?: string;
};

export type ParsedFare = {
  fareClass: 'Eco'|'Pre'|'Exe'|'PremEco'|string;
  paxType: 'ADT'|'CHD'|'INF';
  baseFare: number;
  baseTaxes: number;
  notes?: string;
  includeInPdf: boolean;       // default true
};

export type ParsedBaggage = {
  fareClass?: string;          // se especificado (/pre,/exe)
  pieces: number;
  pieceKg: number;
};

// Tipos para banco de dados
export type QuoteOption = {
  id: string;
  quote_id: string;
  label: string;
  payment_terms?: string;
  notes?: string;
  position: number;
};

export type OptionSegment = {
  id: string;
  option_id: string;
  carrier: string;
  flight: string;
  dep_airport: string;
  arr_airport: string;
  dep_time: string;
  arr_time: string;
  status?: string;
  cabin?: string;
  booking_class?: string;
  position: number;
};

export type OptionFare = {
  id: string;
  option_id: string;
  fare_class: string;
  pax_type: string;
  base_fare: number;
  base_taxes: number;
  notes?: string;
  include_in_pdf: boolean;
};

export type BaggageCatalog = {
  code: string;
  fare_class: string;
  pieces: number;
  piece_kg: number;
  description: string;
};
