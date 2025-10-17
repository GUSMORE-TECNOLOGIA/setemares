import { useCallback, useMemo, useState } from "react";
import { parsePNR, decodeItinerary } from "@/lib/parser";
import type { DecodedItinerary } from "@/lib/parser";
import { computeTotals } from "@/lib/pricing";
import type { PricingResult } from "@/lib/pricing";
import { downloadMultiPdf } from "@/lib/downloadMultiPdf";
import type { MultiStackedPdfData } from "@/lib/MultiStackedPdfDocument";
import type { ParsedBaggage, ParsedEmail, ParsedFare, ParsedSegment } from "@/lib/types/email-parser";
import { QuoteValidator } from "@/lib/validation";
import { healthMonitor } from "@/lib/health-monitor";
import { logger } from "@/lib/logger";
import type {
  BookingControllerReturn,
  BookingDecodeError,
  BookingFlight,
  ExtendedParsedOption,
  SimpleBookingSummary
} from "../../../shared/types";

const SAMPLE_PNR = `AF 459 14APR GRUCDG HS2 1915 #1115\nAF 274 18APR CDGHND HS2 2200 #1830\nAF 187 05MAY HNDCDG HS2 0905 1640\nAF 454 07MAY CDGGRU HS2 2330 #0615\n\nTARIFA USD 8916.00 + TXS USD 564.00 *Exe\n\npagto 4x - comissao 7%\n\nTroca e reembolsa sem multa\n2pc 23kg`;

function isComplexPnr(text: string): boolean {
  // PNR complexo é quando há múltiplas OPÇÕES
  // Suporta diferentes separadores: ==, --, ---, +, OU
  const lines = text.split('\n').map(l => l.trim());
  
  return lines.some(line => 
    line.match(/^={2,}$/) ||      // Linhas com apenas ==
    line.match(/^-{2,}$/) ||      // Linhas com apenas -- ou ---
    line.match(/^OU$/i) ||        // Linha com apenas "OU"
    line === '+'                   // Linha com apenas +
  );
}

function mapParsedEmailToExtendedOptions(parsedEmail: ParsedEmail): ExtendedParsedOption[] {
  return parsedEmail.options.map((option) => ({
    ...option,
    fareCategories: option.fares.map((fare) => ({
      fareClass: fare.fareClass,
      paxType: fare.paxType,
      baseFare: fare.baseFare,
      baseTaxes: fare.baseTaxes,
      notes: fare.notes,
      includeInPdf: fare.includeInPdf
    }))
  }));
}

function toBookingFlights(itinerary?: DecodedItinerary, optionLabel?: string): BookingFlight[] {
  if (!itinerary?.flightInfo?.flights) {
    return [];
  }

  return itinerary.flightInfo.flights.map((flight) => {
    // Verificar se há erros nos aeroportos
    const hasAirportErrors = !flight.departureAirport.found || !flight.landingAirport.found;
    
    return {
      ...flight,
      status: hasAirportErrors ? "error" as const : "success" as const,
      option: optionLabel
    };
  });
}

function buildSimpleSummary(parsed: Awaited<ReturnType<typeof parsePNR>>): SimpleBookingSummary | null {
  if (!parsed) {
    return null;
  }

  const segments = Array.isArray(parsed.segments) ? (parsed.segments as ParsedSegment[]) : [];
  const fares = (parsed.fares || []).map((fare) => ({
    fareClass: fare.category,
    paxType: (fare.paxType as "ADT" | "CHD" | "INF") || "ADT",
    baseFare: Number(fare.tarifa.replace(/,/g, '.')) || 0,
    baseTaxes: Number(fare.taxas.replace(/,/g, '.')) || 0,
    notes: '',
    includeInPdf: true
  }));

  return {
    segments,
    fares,
    paymentTerms: parsed.paymentTerms || 'Em ate 4x no cartao de credito. Taxas a vista.',
    baggage: parsed.baggage || 'Conforme regra da tarifa',
    notes: parsed.notes || '',
    numParcelas: parsed.numParcelas,
    ravPercent: parsed.ravPercent
  };
}

function mapPricingResult(summary: SimpleBookingSummary, ravPercent?: number): PricingResult {
  // PROBLEMA IDENTIFICADO: Não devemos somar tarifas de tipos diferentes (ADT + CHD)
  // O mapPricingResult deve retornar um resultado consolidado apenas para referência
  // O cálculo individual será feito em buildSingleOptionMultiStackedData
  
  const totalBaseFare = summary.fares.reduce((sum, fare) => sum + fare.baseFare, 0);
  const totalBaseTaxes = summary.fares.reduce((sum, fare) => sum + fare.baseTaxes, 0);

  console.log('🔍 mapPricingResult - Consolidado:', {
    totalBaseFare,
    totalBaseTaxes,
    fareCount: summary.fares.length,
    fareTypes: summary.fares.map(f => `${f.fareClass}/${f.paxType}`)
  });

  return computeTotals({
    tarifa: totalBaseFare,
    taxasBase: totalBaseTaxes,
    ravPercent: ravPercent || 10, // Usar RAV detectado ou padrão 10%
    fee: 0
  });
}
function parseBaggageString(baggage?: string): ParsedBaggage[] | undefined {
  if (!baggage) {
    return undefined;
  }

  const entries = baggage
    .split(/[,;]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const parsed = entries
    .map((entry) => {
      const match = entry.match(/(\d+)\s*pc\s*(\d+)\s*kg(?:\/([a-zA-Z]+))?/i);
      if (!match) {
        return undefined;
      }

      return {
        pieces: Number(match[1]),
        pieceKg: Number(match[2]),
        fareClass: match[3] ? match[3].toUpperCase() : undefined
      } as ParsedBaggage;
    })
    .filter((item): item is ParsedBaggage => Boolean(item));

  return parsed.length ? parsed : undefined;
}


function formatDateTimeParts(value?: string | null): { date: string; time: string } {
  if (!value) {
    return { date: '', time: '' };
  }

  let raw = String(value).replace(/#/g, '').replace(/T/, ' ').replace(/Z/, '').trim();
  raw = raw.replace(/\s+/g, ' ');

  const isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2})(?::(\d{2}))?)/);
  if (isoMatch) {
    const [, year, month, day, hour = '00', minutes = '00'] = isoMatch;
    return {
      date: `${day}/${month}/${year}`,
      time: `${hour.padStart(2, '0')}:${minutes.padStart(2, '0')}`
    };
  }

  const brMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const datePart = brMatch ? `${brMatch[1]}/${brMatch[2]}/${brMatch[3]}` : raw.split(' ')[0] ?? '';

  let timePart = '';
  const timeMatch = raw.match(/(\d{2}):(\d{2})/);
  if (timeMatch) {
    timePart = `${timeMatch[1]}:${timeMatch[2]}`;
  } else {
    const fourDigit = raw.match(/\b(\d{4})\b/);
    if (fourDigit) {
      timePart = `${fourDigit[1].slice(0, 2)}:${fourDigit[1].slice(2)}`;
    }
  }

  return { date: datePart, time: timePart };
}

function parseDateForLabel(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const isoMatch = String(value).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const brMatch = String(value).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return new Date(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1]));
  }

  return null;
}

function getPrimaryCarrier(option?: ExtendedParsedOption): string {
  if (!option) {
    return '---';
  }

  const carrier = option.segments?.find((segment) => segment.carrier)?.carrier?.trim();
  if (carrier) {
    return carrier;
  }

  return option.label ?? '---';
}


function getDepartureLabel(option?: ExtendedParsedOption, fallback?: string): string {
  if (option?.segments) {
    for (const segment of option.segments) {
      const { date } = formatDateTimeParts(segment.depTimeISO ?? segment.arrTimeISO);
      const parsed = parseDateForLabel(date);
      if (parsed) {
        return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
      }
    }
  }

  if (fallback) {
    return fallback;
  }

  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

function buildMultiStackedData(options: ExtendedParsedOption[]): MultiStackedPdfData {
  const primaryOption = options[0];
  const headerSubtitle = getPrimaryCarrier(primaryOption);
  const headerDepartureLabel = getDepartureLabel(primaryOption);

  return {
    header: {
      title: 'COTAÇÃO DE AÉREOS',
      subtitle: headerSubtitle,
      departureLabel: headerDepartureLabel,
      logoSrc: '/logo-sete-mares.jpg'
    },
    options: options.map((option, index) => ({
      index: index + 1,
      flights: (option.segments ?? []).map((segment) => {
        const departure = formatDateTimeParts(segment.depTimeISO ?? segment.arrTimeISO);
        const arrival = formatDateTimeParts(segment.arrTimeISO ?? segment.depTimeISO);
        const flightCode = `${(segment.carrier ?? '').trim()} ${(segment.flight ?? '').trim()}`.trim();

        return {
          flightCode,
          fromAirport: segment.depAirport,
          toAirport: segment.arrAirport,
          departureDateTime: [departure.date, departure.time].filter(Boolean).join(' '),
          arrivalDateTime: [arrival.date, arrival.time].filter(Boolean).join(' ')
        };
      }),
      fareDetails: ((option.fareCategories || option.fares || []) as ParsedFare[])
        .filter((fare) => (fare as { includeInPdf?: boolean }).includeInPdf !== false)
        .map((fare) => ({
          classLabel: `${fare.fareClass || 'N/A'}${fare.paxType && fare.paxType !== 'ADT' ? ` (${fare.paxType})` : ''}`,
          baseFare: Number(fare.baseFare ?? 0),
          taxes: Number(fare.baseTaxes ?? 0), // Já ajustado com RAV + incentivo
          total: Number(fare.baseFare ?? 0) + Number(fare.baseTaxes ?? 0) // Total já calculado corretamente
        })),
      footer: {
        baggage: (option.baggage ?? [])
          .map((bag) => bag.fareClass ? `${bag.pieces}pc ${bag.pieceKg}kg/${bag.fareClass}` : `${bag.pieces}pc ${bag.pieceKg}kg`)
          .join(', ') || '2pc 32kg',
        payment: option.paymentTerms || '5x - net net',
        penalty: option.notes || 'USD 500 + diferenca tarifaria, se houver. Bilhete nao reembolsavel.',
        refundable: 'Bilhete nao reembolsavel.'
      }
    }))
  };
}

async function decodeSegments(segments: ParsedSegment[], optionLabel?: string): Promise<{ flights: BookingFlight[]; errors: BookingDecodeError[] }> {
  const flights: BookingFlight[] = [];
  const errors: BookingDecodeError[] = [];

  if (segments.length === 0) {
    return { flights, errors };
  }

  const trechos = segments.map((segment) => {
    const depTime = segment.depTimeISO ? segment.depTimeISO.split('T')[1]?.substring(0, 5) : '0000';
    const arrTime = segment.arrTimeISO ? segment.arrTimeISO.split('T')[1]?.substring(0, 5) : '0000';

    let dateStr = '01JAN';
    if (segment.depTimeISO) {
      const date = new Date(segment.depTimeISO);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en', { month: 'short' }).toUpperCase();
      dateStr = `${day}${month}`;
    }

    return `${segment.carrier} ${segment.flight} ${dateStr} ${segment.depAirport}${segment.arrAirport} HS1 ${depTime} ${arrTime}`;
  });

  try {
    const decoded = await decodeItinerary(trechos);
    flights.push(...toBookingFlights(decoded || undefined, optionLabel));
  } catch (error) {
    errors.push({
      code: optionLabel ?? 'PNR',
      error: error instanceof Error ? error.message : 'Erro ao decodificar segmentos',
      option: optionLabel
    });
  }

  return { flights, errors };
}

export function useBookingsController(): BookingControllerReturn {
  const [pnrText, setPnrText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplexPNR, setIsComplexPNR] = useState(false);
  const [parsedOptions, setParsedOptions] = useState<ExtendedParsedOption[]>([]);
  const [simplePnrData, setSimplePnrData] = useState<SimpleBookingSummary | null>(null);
  const [decodedFlights, setDecodedFlights] = useState<BookingFlight[]>([]);
  const [errors, setErrors] = useState<BookingDecodeError[]>([]);
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [decodeResults, setDecodeResults] = useState<DecodedItinerary | null>(null);
  
  // Campos de metadados da cotação
  const [quoteFamily, setQuoteFamily] = useState('');
  const [quoteObservation, setQuoteObservation] = useState('');

  const updateOptionPricing = useCallback((optionIndex: number, categories: ExtendedParsedOption['fareCategories'] = []) => {
    setParsedOptions((prev) => prev.map((option, index) => index === optionIndex ? {
      ...option,
      fareCategories: categories,
      fares: categories?.map((category) => ({
        fareClass: category.fareClass,
        paxType: category.paxType,
        baseFare: category.baseFare,
        baseTaxes: category.baseTaxes,
        notes: category.notes,
        includeInPdf: category.includeInPdf
      })) || option.fares
    } : option));
    setResetTrigger((prev) => prev + 1);
  }, []);

  const updateSimplePricing = useCallback((categories: ExtendedParsedOption['fareCategories'] = []) => {
    setSimplePnrData((prev) => {
      if (!prev) {
        return prev;
      }
      const updatedFares = categories.map((category) => ({
        fareClass: category.fareClass,
        paxType: category.paxType,
        baseFare: category.baseFare,
        baseTaxes: category.baseTaxes,
        notes: category.notes,
        includeInPdf: category.includeInPdf
      }));
      return { ...prev, fares: updatedFares };
    });

    const totalBaseFare = categories.reduce((sum, category) => sum + (category?.baseFare ?? 0), 0);
    const totalBaseTaxes = categories.reduce((sum, category) => sum + (category?.baseTaxes ?? 0), 0);
    
    const result = computeTotals({ tarifa: totalBaseFare, taxasBase: totalBaseTaxes, ravPercent: simplePnrData?.ravPercent || 10, fee: 0 });
    setPricingResult(result);
    setResetTrigger((prev) => prev + 1);
  }, [simplePnrData?.ravPercent]);

  const setPricingResultFromEngine = useCallback((result: PricingResult) => {
    setPricingResult(result);
  }, []);

  const onChangePnr = useCallback((value: string) => {
    setPnrText(value);
  }, []);

  const onChangeQuoteFamily = useCallback((value: string) => {
    setQuoteFamily(value);
  }, []);

  const onChangeQuoteObservation = useCallback((value: string) => {
    setQuoteObservation(value);
  }, []);

  const clearState = useCallback(() => {
    setPricingResult(null);
    setResetTrigger((prev) => prev + 1);
    setIsComplexPNR(false);
    setParsedOptions([]);
    setSimplePnrData(null);
    setDecodeResults(null);
    setDecodedFlights([]);
    setErrors([]);
    setQuoteFamily('');
    setQuoteObservation('');
  }, []);

  const onClearAll = useCallback(() => {
    setPnrText('');
    clearState();
  }, [clearState]);

  const handleComplexPnr = useCallback(async (text: string) => {
    const { parseEmailToOptions } = await import('@/lib/email-parser');
    const parsedEmail: ParsedEmail = parseEmailToOptions(text);

    const flightsAccumulator: BookingFlight[] = [];
    const errorAccumulator: BookingDecodeError[] = [];

    // Decodificar voos para cada opção
    const extendedOptionsWithFlights = await Promise.all(
      parsedEmail.options.map(async (option) => {
        const { flights, errors: optionErrors } = await decodeSegments(option.segments, option.label);
        flightsAccumulator.push(...flights);
        errorAccumulator.push(...optionErrors);
        
        // Atualizar segments com dados decodificados
        const decodedSegments = flights.map(flight => ({
          carrier: flight.company.description || flight.company.iataCode,
          flight: flight.flight,
          depAirport: `${flight.departureAirport.description} (${flight.departureAirport.iataCode})`,
          arrAirport: `${flight.landingAirport.description} (${flight.landingAirport.iataCode})`,
          depTimeISO: `${flight.departureDate} ${flight.departureTime}`,
          arrTimeISO: `${flight.landingDate} ${flight.landingTime}`
        }));
        
        return {
          ...option,
          segments: decodedSegments
        };
      })
    );

    const extendedOptions = mapParsedEmailToExtendedOptions({ options: extendedOptionsWithFlights });
    setParsedOptions(extendedOptions);

    setDecodedFlights(flightsAccumulator);
    setErrors(errorAccumulator);
  }, []);

  const handleSimplePnr = useCallback(async (text: string) => {
    const parsed = await parsePNR(text);
    if (!parsed) {
      throw new Error('Erro ao processar PNR');
    }

    const summary = buildSimpleSummary(parsed);
    setSimplePnrData(summary);
    setPricingResult(summary ? mapPricingResult(summary, summary.ravPercent) : null);

    if (parsed.trechos) {
      const { startTime, quoteId } = healthMonitor.recordQuoteStart();
      
      try {
        console.log(`🔍 Iniciando decodificação robusta (${quoteId})...`);
        const itinerary = await decodeItinerary(parsed.trechos);
        setDecodeResults(itinerary);
        
        if (!itinerary?.flightInfo?.flights) {
          throw new Error('Nenhum voo decodificado');
        }
        
        console.log('✅ Decodificação concluída, iniciando validação...');
        
        // Validar rigorosamente todos os voos
        const validationResult = QuoteValidator.validateQuote(itinerary.flightInfo.flights);
        
        if (!validationResult.isValid) {
          const errorMsg = validationResult.errors.join('; ');
          console.error('❌ Validação falhou:', errorMsg);
          healthMonitor.recordQuoteFailure(quoteId, startTime, errorMsg);
          setErrors(validationResult.errors.map(error => ({
            code: 'VALIDATION_ERROR',
            error: error
          })));
          setDecodedFlights([]);
          return;
        }
        
        console.log('✅ Validação passou, processando voos...');
        
        const flights = toBookingFlights(itinerary);
        setDecodedFlights(flights);
        
        // Coletar erros específicos dos aeroportos
        const airportErrors: BookingDecodeError[] = [];
        flights.forEach((flight) => {
          if (!flight.departureAirport.found) {
            airportErrors.push({
              code: flight.departureAirport.iataCode,
              error: flight.departureAirport.error || `Aeroporto ${flight.departureAirport.iataCode} não encontrado`
            });
          }
          if (!flight.landingAirport.found) {
            airportErrors.push({
              code: flight.landingAirport.iataCode,
              error: flight.landingAirport.error || `Aeroporto ${flight.landingAirport.iataCode} não encontrado`
            });
          }
        });
        
        // Adicionar warnings como erros informativos
        const warningErrors = validationResult.warnings.map(warning => ({
          code: 'VALIDATION_WARNING',
          error: warning
        }));
        
        setErrors([...airportErrors, ...warningErrors]);
        
        // Registrar sucesso apenas se não há erros críticos
        if (airportErrors.length === 0) {
          healthMonitor.recordQuoteSuccess(quoteId, startTime);
          console.log('✅ Processamento concluído com sucesso!');
        } else {
          const errorMsg = airportErrors.map(e => e.error).join('; ');
          healthMonitor.recordQuoteFailure(quoteId, startTime, errorMsg);
          console.warn('⚠️ Processamento concluído com warnings:', errorMsg);
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro ao decodificar PNR simples';
        console.error('❌ Erro crítico na decodificação:', errorMsg);
        healthMonitor.recordQuoteFailure(quoteId, startTime, errorMsg);
        setErrors([{ code: 'PNR_SIMPLE', error: errorMsg }]);
        setDecodedFlights([]);
      }
    }
  }, []);

  const onExecute = useCallback(async () => {
    const actionEnd = logger.actionStart('PNR Processing', { 
      textLength: pnrText.length,
      hasText: !!pnrText.trim()
    }, 'BookingsController');

    try {
      if (!pnrText.trim()) {
        logger.warn('Tentativa de processar PNR vazio', {}, 'BookingsController');
        alert('Cole um PNR primeiro no editor');
        return;
      }

      clearState();

      const complex = isComplexPnr(pnrText);
      setIsComplexPNR(complex);

      logger.info(`Processando PNR ${complex ? 'complexo' : 'simples'}`, {
        isComplex: complex,
        textLength: pnrText.length
      }, 'BookingsController');

      if (complex) {
        await handleComplexPnr(pnrText);
      } else {
        await handleSimplePnr(pnrText);
      }

      actionEnd();
    } catch (error) {
      logger.error('Erro ao processar PNR', error as Error, {
        isComplex: isComplexPnr(pnrText),
        textLength: pnrText.length
      }, 'BookingsController');
      actionEnd();
      throw error;
    }
  }, [clearState, handleComplexPnr, handleSimplePnr, pnrText]);

  const onImportSample = useCallback(() => {
    setPnrText(SAMPLE_PNR);
  }, []);

  const buildSimplePdf = useCallback(async () => {
    console.log('🔍 buildSimplePdf iniciado');
    const parsed = await parsePNR(pnrText);
    if (!parsed) {
      throw new Error('Erro ao processar PNR');
    }

    const itinerary = parsed.trechos ? await decodeItinerary(parsed.trechos) : undefined;
    const summary = buildSimpleSummary(parsed);
    const effectivePricing = pricingResult ?? (summary ? mapPricingResult(summary, summary.ravPercent) : null);
    
    console.log('🔍 buildSimplePdf dados:', {
      summary: summary ? { 
        faresCount: summary.fares.length, 
        ravPercent: summary.ravPercent, 
        fares: summary.fares.map(f => ({ fareClass: f.fareClass, baseFare: f.baseFare, baseTaxes: f.baseTaxes }))
      } : null,
      effectivePricing,
      pricingResult
    });
    
    const multiData = buildSingleOptionMultiStackedData(summary, itinerary ?? undefined, effectivePricing);
    
    // Adicionar metadados da cotação
    if (quoteFamily || quoteObservation) {
      multiData.metadata = {
        family: quoteFamily || undefined,
        observation: quoteObservation || undefined
      };
    }

    await downloadMultiPdf(multiData);
  }, [pnrText, pricingResult, quoteFamily, quoteObservation]);

  const buildProfessionalPdf = useCallback(async () => {
    let options = parsedOptions;

    console.log('🔍 buildProfessionalPdf - parsedOptions:', {
      count: options.length,
      options: options.map((o, i) => ({
        index: i,
        label: o.label,
        segmentsCount: o.segments?.length || 0,
        faresCount: o.fares?.length || 0
      }))
    });

    if (options.length === 0) {
      const { parseEmailToOptions } = await import('@/lib/email-parser');
      const parsedEmail: ParsedEmail = parseEmailToOptions(pnrText);
      options = mapParsedEmailToExtendedOptions(parsedEmail);
    }

    // Filtrar opções vazias (sem voos e sem tarifas)
    const validOptions = options.filter(opt => 
      (opt.segments && opt.segments.length > 0) || 
      (opt.fares && opt.fares.length > 0)
    );

    console.log('🔍 buildProfessionalPdf - validOptions:', {
      original: options.length,
      valid: validOptions.length,
      filtered: options.length - validOptions.length
    });

    if (validOptions.length === 0) {
      throw new Error('Nenhuma opcao valida encontrada para gerar PDF');
    }

    // Ajustar preços para PDF com o mesmo RAV do Pricing Engine quando disponível
    const ravPercentFromEngine = pricingResult
      ? (() => {
          const tarifaFromResult = Math.max(pricingResult.total - pricingResult.taxasExibidas, 0.0001);
          return (pricingResult.rav / tarifaFromResult) * 100;
        })()
      : 10;

    const pricedOptions = validOptions.map((opt) => {
      const categories = ((opt.fareCategories || opt.fares || []) as ParsedFare[]);
      const adjusted = categories.map((fare) => {
        const tarifa = Number(fare.baseFare ?? 0);
        const taxasBase = Number(fare.baseTaxes ?? 0);
        const totals = computeTotals({ tarifa, taxasBase, ravPercent: ravPercentFromEngine, fee: 0, incentivo: 0 });
        return {
          ...fare,
          baseFare: tarifa,
          baseTaxes: totals.taxasExibidas,
          includeInPdf: (fare as any).includeInPdf ?? true
        } as ParsedFare;
      });
      return {
        ...opt,
        fareCategories: adjusted,
        fares: adjusted
      } as typeof opt;
    });

    const multiStackedData: MultiStackedPdfData = buildMultiStackedData(pricedOptions);
    
    // Adicionar metadados da cotação
    if (quoteFamily || quoteObservation) {
      multiStackedData.metadata = {
        family: quoteFamily || undefined,
        observation: quoteObservation || undefined
      };
    }
    
    await downloadMultiPdf(multiStackedData);
  }, [parsedOptions, pnrText, quoteFamily, quoteObservation]);

  const onGeneratePdf = useCallback(async () => {
    const actionEnd = logger.actionStart('PDF Generation', {
      isComplex: isComplexPnr(pnrText),
      hasText: !!pnrText.trim()
    }, 'BookingsController');

    try {
      if (!pnrText.trim()) {
        logger.warn('Tentativa de gerar PDF sem PNR', {}, 'BookingsController');
        alert('Cole um PNR primeiro no editor');
        return;
      }

      setIsGenerating(true);
      
      const startTime = Date.now();
      const isComplex = isComplexPnr(pnrText);
      
      logger.info(`Iniciando geração de PDF ${isComplex ? 'complexo' : 'simples'}`, {
        isComplex,
        textLength: pnrText.length
      }, 'BookingsController');

      if (isComplex) {
        await buildProfessionalPdf();
      } else {
        await buildSimplePdf();
      }

      const duration = Date.now() - startTime;
      logger.pdfGeneration({
        type: isComplex ? 'complex' : 'simple',
        pages: isComplex ? parsedOptions.length : 1,
        size: 0 // TODO: Obter tamanho real do PDF
      }, duration);

      actionEnd();
    } catch (error) {
      logger.error('Erro ao gerar PDF', error as Error, {
        isComplex: isComplexPnr(pnrText),
        textLength: pnrText.length
      }, 'BookingsController');
      alert('Erro ao gerar PDF. Veja o console para detalhes.');
    } finally {
      setIsGenerating(false);
    }
  }, [buildProfessionalPdf, buildSimplePdf, pnrText, parsedOptions.length]);

  const openDetailsModal = useCallback(() => setShowDetailsModal(true), []);
  const closeDetailsModal = useCallback(() => setShowDetailsModal(false), []);

  return useMemo<BookingControllerReturn>(
    () => ({
      pnrText,
      isGenerating,
      isComplexPNR,
      parsedOptions,
      simplePnrData,
      decodedFlights,
      errors,
      pricingResult,
      resetTrigger,
      showDetailsModal,
      decodeResults,
      quoteFamily,
      quoteObservation,
      onChangePnr,
      onChangeQuoteFamily,
      onChangeQuoteObservation,
      onClearAll,
      onExecute,
      onImportSample,
      onGeneratePdf,
      openDetailsModal,
      closeDetailsModal,
      updateOptionPricing,
      updateSimplePricing,
      setPricingResultFromEngine
    }),
    [
      pnrText,
      isGenerating,
      isComplexPNR,
      parsedOptions,
      simplePnrData,
      decodedFlights,
      errors,
      pricingResult,
      resetTrigger,
      showDetailsModal,
      decodeResults,
      quoteFamily,
      quoteObservation,
      onChangePnr,
      onChangeQuoteFamily,
      onChangeQuoteObservation,
      onClearAll,
      onExecute,
      onImportSample,
      onGeneratePdf,
      openDetailsModal,
      closeDetailsModal,
      updateOptionPricing,
      updateSimplePricing,
      setPricingResultFromEngine
    ]
  );
}


function buildSingleOptionMultiStackedData(
  summary: SimpleBookingSummary | null,
  itinerary?: DecodedItinerary | null,
  pricingResult?: PricingResult | null
): MultiStackedPdfData {
  console.log('🔍 buildSingleOptionMultiStackedData chamada com:', {
    summary: summary ? { 
      faresCount: summary.fares.length, 
      ravPercent: summary.ravPercent, 
      fares: summary.fares.map(f => ({ fareClass: f.fareClass, baseFare: f.baseFare, baseTaxes: f.baseTaxes }))
    } : null,
    pricingResult
  });
  const itineraryFlights = itinerary?.flightInfo?.flights ?? [];
  const segments: ParsedSegment[] = itineraryFlights.length
    ? itineraryFlights.map<ParsedSegment>((flight) => ({
        carrier: flight.company.description || flight.company.iataCode,
        flight: flight.flight,
        depAirport: `${flight.departureAirport.description} (${flight.departureAirport.iataCode})`,
        arrAirport: `${flight.landingAirport.description} (${flight.landingAirport.iataCode})`,
        depTimeISO: `${flight.departureDate} ${flight.departureTime}`,
        arrTimeISO: `${flight.landingDate} ${flight.landingTime}`
      }))
    : summary?.segments ?? [];

  console.log('🔍 Iniciando normalizedFares com:', { summaryFares: summary?.fares, pricingResult });
  
  const normalizedFares: ParsedFare[] = (summary?.fares ?? []).map((fare, index, all) => {
    const baseFare = fare.baseFare ?? 0;
    const baseTaxes = fare.baseTaxes ?? 0;
    let adjustedTaxes = baseTaxes;

    // Para múltiplas tarifas, calcular as taxas ajustadas individualmente
    console.log(`🔍 Verificando condição para ${fare.fareClass}:`, {
      hasPricingResult: !!pricingResult,
      hasRavPercent: !!summary?.ravPercent,
      ravPercent: summary?.ravPercent
    });
    
    if (pricingResult && summary?.ravPercent) {
      const individualPricing = computeTotals({
        tarifa: baseFare,
        taxasBase: baseTaxes,
        ravPercent: summary.ravPercent || 10, // Usar RAV detectado ou padrão 10%
        fee: 0
      });
      adjustedTaxes = individualPricing.taxasExibidas;
      
      // Debug para PDF
      console.log(`🔍 PDF Debug - ${fare.fareClass}:`, {
        baseFare,
        baseTaxes,
        adjustedTaxes,
        total: baseFare + adjustedTaxes,
        individualPricing
      });
    } else if (pricingResult && all.length === 1 && index === 0) {
      // Fallback para tarifa única
      adjustedTaxes = Math.max(pricingResult.total - baseFare, 0);
    }

    return {
      ...fare,
      baseFare,
      baseTaxes: adjustedTaxes,
      includeInPdf: fare.includeInPdf ?? true
    };
  });

  const fallbackFares: ParsedFare[] =
    !normalizedFares.length && pricingResult
      ? [
          {
            fareClass: 'Tarifa',
            paxType: 'ADT',
            baseFare: Math.max(pricingResult.total - pricingResult.taxasExibidas, 0),
            baseTaxes: pricingResult.taxasExibidas,
            notes: '',
            includeInPdf: true
          }
        ]
      : [];

  const faresForPdf = normalizedFares.length ? normalizedFares : fallbackFares;

  const routeLabel =
    segments.length > 1
      ? `${segments[0].depAirport} -> ${segments[segments.length - 1].arrAirport}`
      : segments.length === 1
        ? `${segments[0].depAirport} -> ${segments[0].arrAirport}`
        : 'Cotacao Personalizada';

  // Construir payment terms dinamicamente
  const numParcelas = summary?.numParcelas || 4;
  const defaultPaymentTerms = `Em até ${numParcelas}x no cartão de crédito. Taxas à vista.`;
  
  const option: ExtendedParsedOption = {
    label: routeLabel,
    paymentTerms: summary?.paymentTerms || defaultPaymentTerms,
    notes: summary?.notes,
    segments,
    fares: faresForPdf,
    fareCategories: faresForPdf,
    baggage: parseBaggageString(summary?.baggage)
  };

  return buildMultiStackedData([option]);
}

function buildSimplePdfData(summary: SimpleBookingSummary): MultiStackedPdfData {
  const segments = summary.segments || [];
  const fares = summary.fares || [];
  
  const option: ExtendedParsedOption = {
    label: 'Cotação Simples',
    paymentTerms: summary.paymentTerms,
    notes: summary.notes,
    segments,
    fares,
    fareCategories: fares,
    baggage: parseBaggageString(summary.baggage)
  };

  return buildMultiStackedData([option]);
}

function buildComplexPdfData(options: ExtendedParsedOption[]): MultiStackedPdfData {
  return buildMultiStackedData(options);
}










