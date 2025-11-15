import { useCallback, useMemo, useState } from "react";
import { parsePNR, decodeItinerary } from "@/lib/parser";
import type { DecodedItinerary } from "@/lib/parser";
import { computeTotals } from "@/lib/pricing";
import type { PricingResult } from "@/lib/pricing";
import { downloadMultiPdf } from "@/lib/downloadMultiPdf";
import type { MultiStackedPdfData } from "@/lib/MultiStackedPdfDocument";
import type { ParsedEmail, ParsedFare, ParsedSegment } from "@/lib/types/email-parser";
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
// Importar funções auxiliares dos novos módulos
import { 
  buildSimpleSummary, 
  isComplexPnr as checkComplexPnr
} from "../utils/parsing-helpers";
import { mapPricingResult } from "../utils/pricing-helpers";
import { buildMultiStackedData, buildSingleOptionMultiStackedData } from "../utils/pdf-builders";

const SAMPLE_PNR = `AF 459 14APR GRUCDG HS2 1915 #1115\nAF 274 18APR CDGHND HS2 2200 #1830\nAF 187 05MAY HNDCDG HS2 0905 1640\nAF 454 07MAY CDGGRU HS2 2330 #0615\n\nTARIFA USD 8916.00 + TXS USD 564.00 *Exe\n\npagto 4x - comissao 7%\n\nTroca e reembolsa sem multa\n2pc 23kg`;

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

// Funções movidas para módulos auxiliares:
// - buildSimpleSummary -> parsing-helpers.ts
// - mapPricingResult -> pricing-helpers.ts  
// - parseBaggageString -> parsing-helpers.ts
// - formatDateTimeParts -> parsing-helpers.ts

/**
 * Converte data brasileira (DD/MM/YYYY) e horário (HH:MM) para ISO (YYYY-MM-DDTHH:MM:SS)
 */
function convertToISOString(brDate: string, brTime: string): string {
  try {
    const [day, month, year] = brDate.split('/');
    if (!day || !month || !year) {
      logger.warn('Data inválida para conversão ISO', { brDate }, 'convertToISOString');
      return new Date().toISOString();
    }
    const [hours, minutes] = brTime.split(':');
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours || '0'),
      parseInt(minutes || '0')
    );
    if (isNaN(date.getTime())) {
      logger.warn('Data inválida após conversão', { brDate, brTime }, 'convertToISOString');
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (error) {
    logger.error('Erro ao converter para ISO', error as Error, { brDate, brTime }, 'convertToISOString');
    return new Date().toISOString();
  }
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

// Funções movidas para módulos auxiliares:
// - getPrimaryCarrier, getDepartureLabel, buildMultiStackedData -> pdf-builders.ts
// - buildSimpleSummary, parseBaggageString, formatDateTimeParts, isComplexPnr -> parsing-helpers.ts
// - mapPricingResult, calculateIndividualPricing -> pricing-helpers.ts

async function decodeSegments(segments: ParsedSegment[], optionLabel?: string): Promise<{ flights: BookingFlight[]; errors: BookingDecodeError[] }> {
  const flights: BookingFlight[] = [];
  const errors: BookingDecodeError[] = [];

  if (segments.length === 0) {
    return { flights, errors };
  }

  const trechos = segments.map((segment) => {
    try {
      // Extrair horário do ISO e converter de HH:MM para HHMM (formato esperado pelo parser)
      const depTimeISO = segment.depTimeISO ? segment.depTimeISO.split('T')[1]?.substring(0, 5) : '00:00';
      const arrTimeISO = segment.arrTimeISO ? segment.arrTimeISO.split('T')[1]?.substring(0, 5) : '00:00';
      
      // Converter de HH:MM para HHMM (remover os dois pontos)
      const depTime = depTimeISO.replace(':', '');
      // Verificar se é voo noturno (chegada no dia seguinte) e adicionar # se necessário
      let arrTime = arrTimeISO.replace(':', '');
      if (segment.arrTimeISO && segment.depTimeISO) {
        const depDate = new Date(segment.depTimeISO);
        const arrDate = new Date(segment.arrTimeISO);
        // Se a data de chegada é diferente da data de partida, é voo noturno
        if (arrDate.toDateString() !== depDate.toDateString()) {
          arrTime = `#${arrTime}`;
        }
      }

      let dateStr = '01JAN';
      if (segment.depTimeISO) {
        const date = new Date(segment.depTimeISO);
        if (isNaN(date.getTime())) {
          logger.warn('Data inválida em segmento', { segment, optionLabel }, 'decodeSegments');
          return null;
        }
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en', { month: 'short' }).toUpperCase();
        dateStr = `${day}${month}`;
      }

      if (!segment.carrier || !segment.flight || !segment.depAirport || !segment.arrAirport) {
        logger.warn('Segmento incompleto', { segment, optionLabel }, 'decodeSegments');
        return null;
      }

      // Usar a classe do segmento se disponível, senão usar HS1 como padrão
      const status = segment.status || 'HS1';
      return `${segment.carrier} ${segment.flight} ${dateStr} ${segment.depAirport}${segment.arrAirport} ${status} ${depTime} ${arrTime}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar segmento';
      logger.error('Erro ao processar segmento', { segment, error: errorMessage, optionLabel }, 'decodeSegments');
      errors.push({
        code: 'SEGMENT_PROCESSING_ERROR',
        error: errorMessage,
        option: optionLabel
      });
      return null;
    }
  }).filter((trecho): trecho is string => trecho !== null);

  if (trechos.length === 0) {
    errors.push({
      code: 'NO_VALID_SEGMENTS',
      error: 'Nenhum segmento válido encontrado',
      option: optionLabel
    });
    return { flights, errors };
  }

  try {
    const decoded = await decodeItinerary(trechos);
    if (decoded) {
      flights.push(...toBookingFlights(decoded, optionLabel));
    } else {
      errors.push({
        code: 'DECODING_FAILED',
        error: 'Falha ao decodificar itinerário',
        option: optionLabel
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao decodificar segmentos';
    logger.error('Erro ao decodificar segmentos', { error: errorMessage, trechos, optionLabel }, 'decodeSegments');
    errors.push({
      code: 'DECODING_ERROR',
      error: errorMessage,
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
    setParsedOptions((prev) => prev.map((option, index) => {
      if (index !== optionIndex) return option;
      
      const totalBaseFare = categories.reduce((sum, category) => sum + (category?.baseFare ?? 0), 0);
      const totalBaseTaxes = categories.reduce((sum, category) => sum + (category?.baseTaxes ?? 0), 0);
      
      const pricingResult = computeTotals({
        tarifa: totalBaseFare,
        taxasBase: totalBaseTaxes,
        ravPercent: option.ravPercent || 10,
        fee: option.feeUSD || 0,
        incentivoPercent: option.incentivoPercent || 0,
        changePenalty: option.changePenalty || 'USD 500 + diferença tarifária'
      });
      
      return {
        ...option,
        fareCategories: categories,
        fares: categories?.map((category) => ({
          fareClass: category.fareClass,
          paxType: category.paxType,
          baseFare: category.baseFare,
          baseTaxes: category.baseTaxes,
          notes: category.notes,
          includeInPdf: category.includeInPdf
        })) || option.fares,
        pricingResult
      };
    }));
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
    
    const result = computeTotals({ 
      tarifa: totalBaseFare, 
      taxasBase: totalBaseTaxes, 
      ravPercent: simplePnrData?.ravPercent || 10, 
      fee: simplePnrData?.feeUSD || 0,
      incentivoPercent: simplePnrData?.incentivoPercent || 0,
      changePenalty: 'USD 500 + diferença tarifária'
    });
    setPricingResult(result);
    setResetTrigger((prev) => prev + 1);
  }, [simplePnrData?.ravPercent, simplePnrData?.feeUSD, simplePnrData?.incentivoPercent]);

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
          depTimeISO: convertToISOString(flight.departureDate, flight.departureTime),
          arrTimeISO: convertToISOString(flight.landingDate, flight.landingTime)
        }));
        
        return {
          ...option,
          segments: decodedSegments
        };
      })
    );

    const extendedOptions = mapParsedEmailToExtendedOptions({ options: extendedOptionsWithFlights });
    
    // Calcular pricingResult inicial para cada opção
    const optionsWithPricing = extendedOptions.map((option) => {
      const totalBaseFare = (option.fareCategories || []).reduce((sum, fare) => sum + (fare.baseFare || 0), 0);
      const totalBaseTaxes = (option.fareCategories || []).reduce((sum, fare) => sum + (fare.baseTaxes || 0), 0);
      
      const pricingResult = computeTotals({
        tarifa: totalBaseFare,
        taxasBase: totalBaseTaxes,
        ravPercent: option.ravPercent || 10,
        fee: option.feeUSD || 0,
        incentivoPercent: option.incentivoPercent || 0,
        changePenalty: option.changePenalty || 'USD 500 + diferença tarifária'
      });
      
      return {
        ...option,
        pricingResult
      };
    });
    
    setParsedOptions(optionsWithPricing);

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
        
        logger.info('Decodificação concluída, iniciando validação', { quoteId }, 'handleSimplePnr');
        
        // Validar rigorosamente todos os voos
        const validationResult = QuoteValidator.validateQuote(itinerary.flightInfo.flights);
        
        if (!validationResult.isValid) {
          const errorMsg = validationResult.errors.join('; ');
          logger.error('Validação falhou', new Error(errorMsg), { quoteId, validationErrors: validationResult.errors }, 'handleSimplePnr');
          healthMonitor.recordQuoteFailure(quoteId, startTime, errorMsg);
          setErrors(validationResult.errors.map(error => ({
            code: 'VALIDATION_ERROR',
            error: error
          })));
          setDecodedFlights([]);
          return;
        }
        
        logger.info('Validação passou, processando voos', { quoteId, flightsCount: itinerary.flightInfo.flights.length }, 'handleSimplePnr');
        
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
          logger.info('Processamento concluído com sucesso', { quoteId }, 'handleSimplePnr');
        } else {
          const errorMsg = airportErrors.map(e => e.error).join('; ');
          healthMonitor.recordQuoteFailure(quoteId, startTime, errorMsg);
          logger.warn('Processamento concluído com warnings', { quoteId, warnings: errorMsg }, 'handleSimplePnr');
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro ao decodificar PNR simples';
        logger.error('Erro crítico na decodificação', new Error(errorMsg), { quoteId }, 'handleSimplePnr');
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

      const complex = checkComplexPnr(pnrText);
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
        isComplex: checkComplexPnr(pnrText),
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
    logger.info('Iniciando buildSimplePdf', {}, 'buildSimplePdf');
    const parsed = await parsePNR(pnrText);
    if (!parsed) {
      throw new Error('Erro ao processar PNR');
    }

    const itinerary = parsed.trechos ? await decodeItinerary(parsed.trechos) : undefined;
    const summary = buildSimpleSummary(parsed);
    const effectivePricing = pricingResult ?? (summary ? mapPricingResult(summary, summary.ravPercent) : null);
    
    logger.debug('buildSimplePdf dados', {
      summary: summary ? { 
        faresCount: summary.fares.length, 
        ravPercent: summary.ravPercent, 
        fares: summary.fares.map((f: ParsedFare) => ({ fareClass: f.fareClass, baseFare: f.baseFare, baseTaxes: f.baseTaxes }))
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

    logger.debug('buildProfessionalPdf - parsedOptions', {
      count: options.length,
      options: options.map((o, i) => ({
        index: i,
        label: o.label,
        segmentsCount: o.segments?.length || 0,
        faresCount: o.fares?.length || 0
      }))
    }, 'buildProfessionalPdf');

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

    logger.debug('buildProfessionalPdf - validOptions', {
      original: options.length,
      valid: validOptions.length,
      filtered: options.length - validOptions.length
    }, 'buildProfessionalPdf');

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
        const totals = computeTotals({ 
          tarifa, 
          taxasBase, 
          ravPercent: ravPercentFromEngine, 
          fee: opt.feeUSD || 0, 
          incentivoPercent: opt.incentivoPercent || 0,
          changePenalty: 'USD 500 + diferença tarifária'
        });
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
      isComplex: checkComplexPnr(pnrText),
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
      const isComplex = checkComplexPnr(pnrText);
      
      logger.info(`Iniciando geração de PDF ${isComplex ? 'complexo' : 'simples'}`, {
        isComplex,
        textLength: pnrText.length
      }, 'BookingsController');

      try {
        if (isComplex) {
          if (parsedOptions.length === 0) {
            throw new Error('Nenhuma opção parseada disponível para PDF complexo');
          }
          await buildProfessionalPdf();
        } else {
          if (!simplePnrData) {
            throw new Error('Dados do PNR simples não disponíveis');
          }
          await buildSimplePdf();
        }

        const duration = Date.now() - startTime;
        logger.pdfGeneration({
          type: isComplex ? 'complex' : 'simple',
          pages: isComplex ? parsedOptions.length : 1,
          size: 0 // TODO: Obter tamanho real do PDF
        }, duration);

        actionEnd();
      } catch (innerError) {
        logger.error('Erro interno ao gerar PDF', innerError as Error, {
          isComplex,
          textLength: pnrText.length
        }, 'BookingsController');
        throw innerError; // Re-throw para ser capturado pelo catch externo
      }
    } catch (error) {
      logger.error('Erro ao gerar PDF', error as Error, {
        isComplex: checkComplexPnr(pnrText),
        textLength: pnrText.length
      }, 'BookingsController');
      alert(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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


// Função buildSingleOptionMultiStackedData movida para pdf-builders.ts










