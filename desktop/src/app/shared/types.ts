import type { ParsedBaggage, ParsedFare, ParsedOption, ParsedSegment } from '@/lib/types/email-parser';
import type { DecodedFlight, DecodedItinerary } from '@/lib/parser';
import type { PricingResult } from '@/lib/pricing';
export type { PricingResult };

export type PageKey = 'home' | 'catalog' | 'unknown-codes' | 'concierge';
export type SupabaseStatus = 'testing' | 'connected' | 'error';

export interface BookingDecodeError {
  code: string;
  error: string;
  option?: string;
}

export interface BookingFlight extends DecodedFlight {
  status: 'success' | 'error';
  option?: string;
}

export interface SimpleBookingSummary {
  segments: ParsedSegment[];
  fares: ParsedFare[];
  paymentTerms: string;
  baggage: string;
  notes: string;
  numParcelas?: number;
  ravPercent?: number;
  incentivoPercent?: number;
  feeUSD?: number; // Fee em USD detectado no PNR
}

export interface ProfessionalPdfPricing {
  fareClass: string;
  paxType: string;
  baseFare: number;
  baseTaxes: number;
  total: number;
}

export interface ProfessionalPdfSegment {
  carrier: string;
  flight: string;
  depAirport: string;
  arrAirport: string;
  depTime: string;
  arrTime: string;
  date: string;
}

export interface ProfessionalPdfOption {
  label: string;
  segments: ProfessionalPdfSegment[];
  pricing: ProfessionalPdfPricing[];
  baggage: string;
  payment: string;
  penalty: string;
  notes: string;
}

export interface ProfessionalPdfPayload {
  options: ProfessionalPdfOption[];
  companyInfo: {
    name: string;
    phone: string;
    address: string;
    website: string;
  };
}

export type ExtendedParsedOption = ParsedOption & {
  fareCategories?: ParsedFare[];
  baggage?: ParsedBaggage[];
  pricing?: ProfessionalPdfPricing[];
  changePenalty?: string;
  pricingResult?: PricingResult; // Resultado do cálculo de preços para esta opção
};

export interface BookingContextValue {
  currentPage: PageKey;
  supabaseStatus: SupabaseStatus;
  navigate: (page: PageKey) => void;
}

export interface BookingControllerReturn {
  pnrText: string;
  isGenerating: boolean;
  isComplexPNR: boolean;
  parsedOptions: ExtendedParsedOption[];
  simplePnrData: SimpleBookingSummary | null;
  decodedFlights: BookingFlight[];
  errors: BookingDecodeError[];
  pricingResult: PricingResult | null;
  resetTrigger: number;
  showDetailsModal: boolean;
  decodeResults: DecodedItinerary | null;
  quoteFamily: string;
  quoteObservation: string;
  onChangePnr: (value: string) => void;
  onChangeQuoteFamily: (value: string) => void;
  onChangeQuoteObservation: (value: string) => void;
  onClearAll: () => void;
  onExecute: () => Promise<void>;
  onImportSample: () => void;
  onGeneratePdf: () => Promise<void>;
  openDetailsModal: () => void;
  closeDetailsModal: () => void;
  updateOptionPricing: (optionIndex: number, categories?: ExtendedParsedOption['fareCategories']) => void;
  updateSimplePricing: (categories?: ExtendedParsedOption['fareCategories']) => void;
  setPricingResultFromEngine: (result: PricingResult) => void;
}

export type SupabaseTestFn = () => Promise<boolean>;


