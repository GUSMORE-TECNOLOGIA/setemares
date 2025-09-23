// Tipos TypeScript para o banco de dados Supabase
// Criados manualmente (sem CLI do Supabase)

export type CityRow = {
  id: number;
  iata3: string;
  name: string;
  country: string;
  aliases?: any;
  active: boolean;
};

export type AirportRow = {
  id: number;
  iata3: string;
  icao4?: string | null;
  name: string;
  city_iata: string;
  country: string;
  tz?: string | null;
  aliases?: any;
  active: boolean;
};

export type AirlineRow = {
  id: number;
  iata2: string;
  icao3?: string | null;
  name: string;
  country?: string | null;
  aliases?: any;
  active: boolean;
};

export type CodeOverrideRow = {
  id: number;
  code: string;
  kind: 'city' | 'airport' | 'airline';
  mapped_id: number;
  note?: string | null;
  created_by?: string | null;
  created_at: string;
};

export type CodeUnknownRow = {
  id: number;
  code: string;
  context?: any;
  seen_at: string;
  resolved: boolean;
};

export type QuoteRow = {
  id: string;
  created_at: string;
  family_name?: string | null;
  class?: string | null;
  currency: string;
  fare?: number | null;
  taxes?: number | null;
  rav?: number | null;
  fee?: number | null;
  incentive?: number | null;
  total?: number | null;
  payment_terms?: string | null;
  penalty?: string | null;
  baggage?: string | null;
};

export type QuoteSegmentRow = {
  id: number;
  quote_id: string;
  carrier?: string | null;
  flight?: string | null;
  from_iata?: string | null;
  to_iata?: string | null;
  dep_utc?: string | null;
  arr_utc?: string | null;
  notes?: string | null;
};
