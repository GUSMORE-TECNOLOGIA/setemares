import { useState, useEffect } from 'react';
import { Upload, Play, Home, FileText, Database, BarChart3, Settings, AlertTriangle } from 'lucide-react';
import { PnrEditor } from '@/components/pnr/PnrEditor';
import { UnifiedPreview } from '@/components/decoder/UnifiedPreview';
import { CatalogPage } from '@/components/catalog/CatalogPage';
import { UnknownCodesPage } from '@/components/decoder/UnknownCodesPage';
import { AdvancedPricingEngine } from '@/components/pricing/AdvancedPricingEngine';
import { SimpleSummary } from '@/components/decoder/SimpleSummary';
import { ModalDetalhesDecodificacao } from '@/components/ModalDetalhesDecodificacao';
import { parsePNR, decodeItinerary } from '@/lib/parser';
import { downloadPdf } from '@/lib/downloadPdf';
import { testSupabaseConnection } from '@/lib/supabase';
import type { PdfData } from '@/lib/PdfDocument';
import type { PricingResult } from '@/lib/pricing';

// Funções auxiliares para decodificação
const getAirportDescription = (code: string): string => {
  const airports: Record<string, string> = {
    'GRU': 'Guarulhos International Airport (GRU), São Paulo, Brazil',
    'ATL': 'Hartsfield–Jackson Atlanta International Airport (ATL), Atlanta, USA',
    'BOS': 'Logan International Airport (BOS), Boston, USA',
    'LHR': 'London Heathrow Airport (LHR), London, England, United Kingdom',
    'GVA': 'Cointrin International Airport (GVA), Geneva, Switzerland',
    'MAD': 'Madrid–Barajas Airport (MAD), Madrid, Spain',
    'ICN': 'Incheon International Airport (ICN), Seoul, South Korea',
    'PVG': 'Shanghai Pudong International Airport (PVG), Shanghai, China',
  };
  return airports[code] || `${code} Airport`;
};

const getCarrierName = (code: string): string => {
  const carriers: Record<string, string> = {
    'LA': 'LATAM Airlines',
    'DL': 'Delta Air Lines',
    'BA': 'British Airways',
    'IB': 'Iberia',
    'TP': 'TAP Air Portugal',
    'AF': 'Air France',
    'KL': 'KLM',
    'LH': 'Lufthansa',
    'AA': 'American Airlines',
    'UA': 'United Airlines'
  };
  return carriers[code] || code;
};

const formatTime = (timeStr: string): string => {
  if (!timeStr || typeof timeStr !== 'string') return '00:00';
  
  // Remover # se presente
  const cleanTime = timeStr.replace('#', '');
  
  // Se já está no formato HH:MM, retornar diretamente
  if (cleanTime.match(/^\d{2}:\d{2}$/)) {
    return cleanTime;
  }
  
  // Exemplo: "2340" -> "23:40", "1405" -> "14:05"
  if (cleanTime.length === 4) {
    const hours = cleanTime.substring(0, 2);
    const minutes = cleanTime.substring(2, 4);
    return `${hours}:${minutes}`;
  }
  
  return '00:00';
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toLocaleDateString('pt-BR');
  
  // Se já está no formato DD/MM/AAAA, retornar diretamente
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return dateStr;
  }
  
  // Exemplo: "14OCT" -> "14/10/2025"
  const monthMap: Record<string, string> = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
    'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };
  
  const match = dateStr.match(/(\d{1,2})([A-Z]{3})/);
  if (match) {
    const [, day, month] = match;
    const monthNum = monthMap[month] || '10';
    const year = new Date().getFullYear();
    return `${day.padStart(2, '0')}/${monthNum}/${year}`;
  }
  
  return new Date().toLocaleDateString('pt-BR');
};

export default function App() {
  const [pnrText, setPnrText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [currentPage, setCurrentPage] = useState<'home' | 'catalog' | 'unknown-codes'>('home');
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [isComplexPNR, setIsComplexPNR] = useState(false);
  const [parsedOptions, setParsedOptions] = useState<any[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [simplePnrData, setSimplePnrData] = useState<any>(null);
  
  // Estados de decodificação
  const [decodeResults, setDecodeResults] = useState<any>(null);
  const [decodedFlights, setDecodedFlights] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  

  // Testar conexão Supabase na inicialização
  useEffect(() => {
    const testConnection = async () => {
      const isConnected = await testSupabaseConnection();
      setSupabaseStatus(isConnected ? 'connected' : 'error');
    };
    testConnection();
  }, []);

  const handlePnrChange = (newPnr: string) => {
    console.log('📋 PNR alterado:', newPnr);
    setPnrText(newPnr);
  };


  const handleClearAll = () => {
    console.log('🧹 Limpando todos os dados do sistema...');
    setPnrText('');
    setPricingResult(null);
    setResetTrigger(prev => prev + 1);
    setIsComplexPNR(false);
    setParsedOptions([]);
    setSimplePnrData(null);
    
    // Limpar estados de decodificação
    setDecodeResults(null);
    setDecodedFlights([]);
    setErrors([]);
  };

  const handleExecute = async () => {
    console.log('🚀 INÍCIO: handleExecute chamado');
    
    if (!pnrText.trim()) {
      console.log('❌ PNR vazio');
      alert('Cole um PNR primeiro no editor');
      return;
    }

    console.log('📋 PNR Text:', pnrText);
    
    try {
      console.log('🔍 Passo 1: Detectar tipo de PNR');
      
      // Detectar se é PNR complexo
      const tarifaMatches = pnrText.match(/tarifa\s+usd/gi) || [];
      const isComplex = pnrText.includes('==') || tarifaMatches.length > 1;
      console.log('📊 É complexo?', isComplex);
      console.log('📊 PNR contém "=="?', pnrText.includes('=='));
      console.log('📊 Quantas tarifas encontradas?', tarifaMatches.length);
      console.log('📊 Tarifas encontradas:', tarifaMatches);
      console.log('📊 PNR Text completo:', pnrText);
      
      setIsComplexPNR(isComplex);
      console.log('✅ Passo 1: Estado isComplexPNR atualizado');
      
      if (isComplex) {
        console.log('🔍 Passo 2: Processando PNR complexo');
        // Para PNR complexo, parsear opções
        const { parseEmailToOptions } = await import('@/lib/email-parser');
        console.log('✅ Passo 2a: parseEmailToOptions importado');
        
        const parsedEmail = parseEmailToOptions(pnrText);
        console.log('✅ Passo 2b: Email parseado:', parsedEmail);
        console.log('✅ Passo 2b: Número de opções:', parsedEmail?.options?.length || 0);
        
        // Converter opções para o formato esperado pelo Pricing Engine
        const convertedOptions = parsedEmail.options.map(option => ({
          ...option,
          fareCategories: option.fares?.map(fare => ({
            fareClass: fare.fareClass || 'Eco',
            paxType: fare.paxType || 'ADT',
            baseFare: fare.baseFare || 0,
            baseTaxes: fare.baseTaxes || 0,
            notes: fare.notes || '',
            includeInPdf: fare.includeInPdf !== false
          })) || []
        }));
        
        setParsedOptions(convertedOptions);
        console.log('✅ Passo 2c: Estados atualizados para PNR complexo');
        console.log('📊 Opções convertidas:', convertedOptions.length);
        console.log('📊 Primeira opção:', convertedOptions[0]);
        
        // Decodificar voos para todas as opções
        console.log('🔍 Passo 2d: Decodificando voos complexos');
        const allFlights: any[] = [];
        const allErrors: any[] = [];
        
        for (const option of parsedEmail.options) {
          console.log(`🔍 Decodificando opção: ${option.label}`);
          console.log(`🔍 Segmentos da opção:`, option.segments);
          
          // Converter segmentos para formato de trecho
          const trechos = option.segments.map(s => {
            // Formato: "DL 104 14OCT GRUATL HS1 2250 #0735"
            const depTime = s.depTimeISO ? s.depTimeISO.split('T')[1]?.substring(0, 5) : '0000';
            const arrTime = s.arrTimeISO ? s.arrTimeISO.split('T')[1]?.substring(0, 5) : '0000';
            
            // Converter data ISO para formato DDMMM
            let dateStr = '14OCT';
            if (s.depTimeISO) {
              const date = new Date(s.depTimeISO);
              const day = date.getDate().toString().padStart(2, '0');
              const month = date.toLocaleString('en', { month: 'short' }).toUpperCase();
              dateStr = `${day}${month}`;
            }
            
            return `${s.carrier} ${s.flight} ${dateStr} ${s.depAirport}${s.arrAirport} HS1 ${depTime} ${arrTime}`;
          });
          
          console.log(`🔍 Trechos convertidos:`, trechos);
          
          try {
            const decoded = await decodeItinerary(trechos);
            if (decoded && decoded.flightInfo && decoded.flightInfo.flights) {
              allFlights.push(...decoded.flightInfo.flights.map((f: any) => ({
                ...f,
                status: 'success',
                option: option.label
              })));
            }
            // DecodedItinerary não tem propriedade errors
            // Os erros são tratados no catch abaixo
          } catch (error: any) {
            allErrors.push({
              code: option.label,
              error: error.message,
              option: option.label
            });
          }
        }
        
        setDecodedFlights(allFlights);
        setErrors(allErrors);
        console.log('✅ Passo 2e: Decodificação complexa concluída');
        console.log('📊 Dados finais - allFlights:', allFlights.length, 'allErrors:', allErrors.length);
        console.log('📊 Primeiro voo:', allFlights[0]);
        
      } else {
        console.log('🔍 Passo 2: Processando PNR simples');
        
        const parsed = await parsePNR(pnrText);
        console.log('✅ Passo 2a: PNR parseado:', parsed);
        
        // Decodificar voos para PNR simples
        console.log('🔍 Passo 2b: Decodificando voos simples');
        const allFlights: any[] = [];
        const allErrors: any[] = [];
        
        if (parsed && parsed.trechos && parsed.trechos.length > 0) {
          try {
            const decoded = await decodeItinerary(parsed.trechos);
            if (decoded && decoded.flightInfo && decoded.flightInfo.flights) {
              allFlights.push(...decoded.flightInfo.flights.map((f: any) => ({
                ...f,
                status: 'success'
              })));
            }
          } catch (error: any) {
            allErrors.push({
              code: 'PNR_SIMPLE',
              error: error.message
            });
          }
        }
        
        setDecodedFlights(allFlights);
        setErrors(allErrors);
        console.log('✅ Passo 2c: Decodificação simples concluída');
        
        if (parsed && parsed.fares && parsed.fares.length > 0) {
          console.log('🔍 Passo 2d: Processando fares');
          
          const firstFare = parsed.fares[0];
          console.log('📊 Primeira fare:', firstFare);
          
          const tarifa = parseFloat(firstFare.tarifa.replace(',', '.')) || 0;
          const taxasBase = parseFloat(firstFare.taxas.replace(',', '.')) || 0;
          console.log('💰 Valores calculados:', { tarifa, taxasBase });
          
          // Removido setPricingParams - não está mais sendo usado
          console.log('✅ Passo 2e: PricingParams atualizado');
          
          // Armazenar dados do PNR simples para o resumo
          const simpleData = {
            segments: parsed.segments || [],
            fares: (parsed.fares || []).map(fare => ({
              fareClass: fare.category || 'ADT',
              paxType: 'ADT',
              baseFare: parseFloat(fare.tarifa.replace(',', '.')) || 0,
              baseTaxes: parseFloat(fare.taxas.replace(',', '.')) || 0,
              notes: ''
            })),
            paymentTerms: parsed.paymentTerms || 'Em até 4x no cartão de crédito. Taxas à vista.',
            baggage: parsed.baggage || 'Conforme regra da tarifa',
            notes: parsed.notes || ''
          };
          
          console.log('📊 Dados simples preparados:', simpleData);
          setSimplePnrData(simpleData);
          console.log('✅ Passo 2f: SimplePnrData atualizado');
          
          // Calcular pricing result para PNR simples
          const totalBaseFare = simpleData.fares.reduce((sum, f) => sum + f.baseFare, 0);
          const totalBaseTaxes = simpleData.fares.reduce((sum, f) => sum + f.baseTaxes, 0);
          const rav = 10; // RAV 10% padrão
          const fee = 0;
          const incentivo = 0;
          const total = totalBaseFare + totalBaseTaxes + (totalBaseFare + totalBaseTaxes) * (rav / 100) + fee + incentivo;
          
          const pricingResult: PricingResult = {
            rav,
            comissao: rav + fee + incentivo,
            taxasExibidas: totalBaseTaxes + rav + fee + incentivo,
            total
          };
          
          console.log('🔍 Antes de setPricingResult para PNR simples:', {
            currentPricingResult: pricingResult,
            calculatedTotal: total,
          });
          setPricingResult(pricingResult);
          console.log('✅ Passo 2g: PricingResult para PNR simples atualizado:', pricingResult);
          
          setResetTrigger(prev => prev + 1);
          console.log('✅ Passo 2h: ResetTrigger atualizado');
        }
        
        setParsedOptions([]);
        console.log('✅ Passo 2h: Estados limpos');
      }
      
      console.log('🎉 SUCESSO: Processamento concluído!');
      
    } catch (error: any) {
      console.error('💥 ERRO CRÍTICO:', error);
      console.error('Stack trace:', error.stack);
      alert(`Erro ao processar PNR: ${error.message}`);
    }
  };

  const handleImportPNR = () => {
    const samplePNR = `LA 8084   22NOV GRULHR HS1  2340  #1405
BA  748   23NOV LHRGVA HS1  1745   2030
IB  618   28NOV GVAMAD HK1  1835   2040
LA 8065   28NOV MADGRU HK1  2255  #0530

tarifa usd 4419.00 + txs usd 400.00

pagto 4x - comissão 7%

Troca e reembolsa sem multa
2pc 23kg`;
    setPnrText(samplePNR);
  };


  const handleGenerate = async () => {
    if (!pnrText.trim()) {
      alert('Cole um PNR primeiro no editor');
      return;
    }

    setIsGenerating(true);
    try {
      // Detectar se é PNR complexo
      const isComplex = pnrText.includes('==') || (pnrText.match(/tarifa\s+usd/gi) || []).length > 1;
      
      if (isComplex) {
        // Gerar PDF profissional para PNR complexo
        await generateProfessionalPdf();
      } else {
        // Gerar PDF simples para PNR único
        await generateSimplePdf();
      }
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Veja o console para detalhes.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateProfessionalPdf = async () => {
    try {
      console.log('🔄 Iniciando geração de PDF profissional...');
      
      // Usar dados já processados e atualizados do parsedOptions
      if (!parsedOptions || parsedOptions.length === 0) {
        // Se não temos dados processados, processar agora
        const { parseEmailToOptions } = await import('@/lib/email-parser');
        const parsedEmail = parseEmailToOptions(pnrText);
        
        if (!parsedEmail || !parsedEmail.options || parsedEmail.options.length === 0) {
          throw new Error('Nenhuma opção encontrada no PNR');
        }
        
        // Processar e usar os dados
        const processedOptions = parsedEmail.options.map(option => ({
          ...option,
          fareCategories: option.fares.map(fare => ({
            fareClass: fare.fareClass,
            paxType: fare.paxType,
            baseFare: fare.baseFare,
            baseTaxes: fare.baseTaxes,
            notes: fare.notes
          }))
        }));
        
        console.log('📧 Email parseado e processado:', processedOptions);
        await generatePdfFromOptions(processedOptions);
        return;
      }
      
      console.log('📊 Usando dados atualizados do parsedOptions:', parsedOptions);
      await generatePdfFromOptions(parsedOptions);
      
    } catch (error: any) {
      console.error('❌ Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  const generatePdfFromOptions = async (options: any[]) => {
    try {
      console.log('🔄 Gerando PDF a partir das opções:', options);
      const professionalData = {
        options: options.map((option, index) => {
          // Validar cada opção
          if (!option.segments || (!option.fares && !option.fareCategories)) {
            console.warn(`⚠️ Opção ${index + 1} com dados inválidos:`, option);
            return null;
          }
          
          // Debug: Verificar dados da opção
          console.log(`🔍 Debug Opção ${index + 1}:`, {
            hasFares: !!option.fares,
            hasFareCategories: !!option.fareCategories,
            faresLength: option.fares?.length || 0,
            fareCategoriesLength: option.fareCategories?.length || 0,
            fares: option.fares,
            fareCategories: option.fareCategories
          });
          
          // Usar fareCategories se disponível (dados atualizados), senão usar fares
          const faresData = option.fareCategories || option.fares || [];
          console.log(`📊 faresData para opção ${index + 1}:`, faresData);
          
          return {
            label: `Opção ${index + 1}`,
            segments: option.segments.map((segment: any) => {
              // Validar segmento
              if (!segment.carrier || !segment.flight || !segment.depAirport || !segment.arrAirport) {
                console.warn('⚠️ Segmento inválido:', segment);
                return null;
              }
              
              return {
                carrier: segment.carrier || 'N/A',
                flight: segment.flight || 'N/A',
                depAirport: segment.depAirport || 'N/A',
                arrAirport: segment.arrAirport || 'N/A',
                depTime: segment.depTime || '00:00',
                arrTime: segment.arrTime || '00:00',
                date: segment.date || new Date().toLocaleDateString('pt-BR')
              };
            }).filter((segment: any) => segment !== null),
            pricing: faresData.map((fare: any, fareIndex: number) => {
              // Debug: Verificar cada fare
              console.log(`🔍 Debug Fare ${fareIndex + 1} da Opção ${index + 1}:`, {
                fare,
                baseFareType: typeof fare.baseFare,
                baseTaxesType: typeof fare.baseTaxes,
                baseFareValue: fare.baseFare,
                baseTaxesValue: fare.baseTaxes
              });
              
              // Validar fare
              if (typeof fare.baseFare !== 'number' || typeof fare.baseTaxes !== 'number') {
                console.warn('⚠️ Fare inválido:', fare);
                return null;
              }
              
              return {
                fareClass: fare.fareClass || 'N/A',
                paxType: fare.paxType || 'ADT',
                baseFare: Number(fare.baseFare) || 0,
                baseTaxes: Number(fare.baseTaxes) || 0,
                total: (Number(fare.baseFare) || 0) + (Number(fare.baseTaxes) || 0)
              };
            }).filter((fare: any) => fare !== null),
            baggage: option.baggage?.map((b: any) => `${b.pieces}pc ${b.pieceKg}kg${b.fareClass ? `/${b.fareClass}` : ''}`).join(', ') || 'Conforme regra da tarifa',
            payment: option.paymentTerms || 'Em até 4x no cartão de crédito. Taxas à vista.',
            penalty: 'USD 500 + Diferença tarifária, se houver. Bilhete não reembolsável.',
            notes: option.notes || ''
          };
        }).filter(option => option !== null),
        companyInfo: {
          name: 'Sete Mares Turismo',
          phone: '(+5511) 3121-2888',
          address: 'Rua Dr. Renato Paes de Barros, 33 - 1º andar - Itaim Bibi - SP 04530-001',
          website: 'www.setemaresturismo.com.br'
        }
      };
      
      console.log('📊 Dados processados para PDF (com valores atualizados):', professionalData);
      
      // Validar se temos dados válidos
      if (professionalData.options.length === 0) {
        throw new Error('Nenhuma opção válida encontrada para gerar PDF');
      }
      
      console.log('🔄 Gerando PDF...');
      
      // Debug: Verificar dados de cada opção
      console.log('🔍 Debug PDF - Verificando opções:');
      professionalData.options.forEach((option, index) => {
        console.log(`📊 Opção ${index + 1}:`, {
          label: option.label,
          pricingCount: option.pricing?.length || 0,
          pricing: option.pricing?.map((f: any) => ({
            fareClass: f.fareClass,
            baseFare: f.baseFare,
            baseTaxes: f.baseTaxes
          })) || [],
          rawOption: option
        });
      });
      
      // Debug: Verificar parsedOptions original
      console.log('🔍 Debug PDF - parsedOptions original:');
      parsedOptions.forEach((option, index) => {
        console.log(`📊 ParsedOption ${index + 1}:`, {
          label: option.label,
          faresCount: option.fares?.length || 0,
          fareCategoriesCount: option.fareCategories?.length || 0,
          fares: option.fares,
          fareCategories: option.fareCategories
        });
      });
      
      // Validar dados antes de gerar PDF (validação mais flexível)
      const validOptions = professionalData.options.filter(option => 
        option.pricing && option.pricing.length > 0 && 
        option.pricing.some((fare: any) => fare.baseFare > 0)
      );
      
      console.log(`📊 Opções válidas encontradas: ${validOptions.length} de ${professionalData.options.length}`);
      
      if (validOptions.length === 0) {
        throw new Error('Nenhuma opção válida encontrada para gerar PDF');
      }
      
      // Usar apenas opções válidas para o PDF
      professionalData.options = validOptions;
      
      // Gerar UM ÚNICO PDF com todas as opções como blocos
      console.log('🔄 Gerando PDF unificado com todas as opções...');
      
      // Processar todas as opções para o PDF unificado
      const pdfBlocks = professionalData.options.map((option, i) => {
        console.log(`🔍 Processando bloco Opção ${i + 1}:`, option);
        
        // Encontrar voos correspondentes à opção
        // Para PNRs complexos, os voos são decodificados por opção
        let optionFlights = decodedFlights.filter(flight => 
          flight.option === `Opção ${i + 1}`
        );
        
        // Se não encontrou voos decodificados, criar voos a partir dos segmentos da opção
        if (optionFlights.length === 0) {
          console.log(`⚠️ Nenhum voo decodificado encontrado para opção ${i + 1}, criando voos a partir dos segmentos`);
          // Criar voos a partir dos segmentos da opção atual
          const optionSegments = option.segments || [];
          console.log(`🔍 Segmentos da opção ${i + 1}:`, optionSegments);
          // Criar voos básicos a partir dos segmentos sem decodificação async
          optionFlights = optionSegments.map((segment: any) => {
            
            // Decodificar aeroportos básicos
            const fromAirport = getAirportDescription(segment.depAirport || segment.departureAirport || '');
            const toAirport = getAirportDescription(segment.arrAirport || segment.arrivalAirport || '');
            
            // Decodificar companhia
            const carrierName = getCarrierName(segment.carrier || segment.airline || '');
            
            // Formatar datas e horários
            console.log(`🔍 Debug segmento ${i + 1}:`, {
              depTime: segment.depTime,
              arrTime: segment.arrTime,
              date: segment.date
            });
            const depTime = formatTime(segment.depTime || '');
            const arrTime = formatTime(segment.arrTime || '');
            const depDate = formatDate(segment.date || '');
            console.log(`🔍 Debug formatado:`, {
              depTime,
              arrTime,
              depDate
            });
            
            // Para voos noturnos (#), adicionar 1 dia à data de chegada
            let arrDate = depDate;
            if (segment.arrTime && segment.arrTime.includes('#')) {
              // Converter data brasileira para Date (DD/MM/AAAA -> MM/DD/AAAA)
              const [day, month, year] = depDate.split('/');
              const depDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              depDateObj.setDate(depDateObj.getDate() + 1);
              arrDate = depDateObj.toLocaleDateString('pt-BR');
            }
                
                return {
              flightCode: `${carrierName} ${segment.flight || segment.flightNumber || ''}`,
              fromAirport: fromAirport,
              toAirport: toAirport,
              departureDateTime: `${depDate} ${depTime}`,
              arrivalDateTime: `${arrDate} ${arrTime}`,
                  optionIndex: i
                };
          });
              } else {
          // Usar os voos decodificados diretamente
          console.log(`✅ Usando ${optionFlights.length} voos decodificados para opção ${i + 1}`);
          console.log(`🔍 Debug - Primeiro voo decodificado:`, optionFlights[0]);
          optionFlights = optionFlights.map((flight: any) => {
            console.log(`🔍 Debug - Dados do voo:`, {
              departureDate: flight.departureDate,
              departureTime: flight.departureTime,
              landingDate: flight.landingDate,
              landingTime: flight.landingTime
            });
            
            // Extrair informações do aeroporto de partida
            let fromAirport = 'N/A';
            if (flight.departureAirport) {
              if (typeof flight.departureAirport === 'string') {
                fromAirport = flight.departureAirport;
              } else if (flight.departureAirport.description) {
                fromAirport = flight.departureAirport.description;
              } else if (flight.departureAirport.iataCode) {
                fromAirport = getAirportDescription(flight.departureAirport.iataCode);
              }
            }

            // Extrair informações do aeroporto de chegada
            let toAirport = 'N/A';
            
            // Tentar arrivalAirport primeiro, depois landingAirport
            const arrivalData = flight.arrivalAirport || flight.landingAirport;
            if (arrivalData) {
              if (typeof arrivalData === 'string') {
                toAirport = arrivalData;
              } else if (arrivalData.description) {
                toAirport = arrivalData.description;
              } else if (arrivalData.iataCode) {
                toAirport = getAirportDescription(arrivalData.iataCode);
              }
            }

            // Extrair nome da companhia
            let airlineName = 'N/A';
            if (flight.company) {
              if (typeof flight.company === 'string') {
                airlineName = flight.company;
              } else if (flight.company.name) {
                airlineName = flight.company.name;
              } else if (flight.company.iataCode) {
                airlineName = getCarrierName(flight.company.iataCode);
              }
            }

            return {
              flightCode: `${airlineName} ${flight.flight || 'N/A'}`,
              fromAirport: fromAirport,
              toAirport: toAirport,
              departureDateTime: `${flight.departureDate || 'N/A'} ${flight.departureTime || 'N/A'}`,
              arrivalDateTime: `${flight.landingDate || 'N/A'} ${flight.landingTime || 'N/A'}`,
              optionIndex: i
            };
          });
        }

        console.log(`🔍 Voos para opção ${i + 1}:`, optionFlights);
        console.log(`🔍 Debug - Primeiro voo da opção ${i + 1}:`, optionFlights[0]);

        // Determinar destino a partir dos voos - usar o último voo da opção
        const lastFlight = optionFlights[optionFlights.length - 1];
        let destination = lastFlight?.toAirport || "Destino";
        
        // Se toAirport é N/A, tentar extrair do último voo decodificado
        if (destination === 'N/A' && optionFlights.length > 0) {
          const lastDecodedFlight = optionFlights[optionFlights.length - 1];
          if (lastDecodedFlight.landingAirport) {
            if (typeof lastDecodedFlight.landingAirport === 'string') {
              destination = lastDecodedFlight.landingAirport;
            } else if (lastDecodedFlight.landingAirport.description) {
              destination = lastDecodedFlight.landingAirport.description;
            } else if (lastDecodedFlight.landingAirport.iataCode) {
              destination = getAirportDescription(lastDecodedFlight.landingAirport.iataCode);
            }
          }
        }
        
        // Extrair cidade e país do aeroporto de destino
        let city = "Cidade";
        let country = "País";
        
        if (typeof destination === 'string' && destination !== 'N/A' && destination !== 'Destino') {
          if (destination.includes('(') && destination.includes(')')) {
            // Exemplo: "Guarulhos International Airport (GRU), São Paulo, Brazil"
            // Primeiro pegar a parte após o parêntese
            const afterParenthesis = destination.split(')')[1];
            if (afterParenthesis) {
              const parts = afterParenthesis.trim().split(',').filter((part: string) => part.trim() !== '');
              if (parts.length >= 2) {
                city = parts[0].trim();
                country = parts[1].trim();
              } else if (parts.length === 1) {
                // Se só tem uma parte, tentar dividir por espaços
                const words = parts[0].trim().split(' ');
                if (words.length >= 2) {
                  city = words[0];
                  country = words.slice(1).join(' ');
                }
              }
            }
          } else if (destination.includes(',')) {
            // Fallback para outros formatos
            const parts = destination.split(',');
            if (parts.length >= 2) {
              city = parts[parts.length - 2].trim();
              country = parts[parts.length - 1].trim();
            }
          }
        }
        
        // Companhia principal - extrair do flightCode
        const firstFlight = optionFlights[0];
        let mainCarrier = "CIA";
        if (firstFlight?.flightCode && typeof firstFlight.flightCode === 'string') {
          // Extrair nome da companhia do flightCode (ex: "Delta Air Lines 104" -> "Delta Air Lines")
          const flightParts = firstFlight.flightCode.split(' ');
          if (flightParts.length > 1) {
            mainCarrier = flightParts.slice(0, -1).join(' ');
          }
        }
        
        // Mapeamento de códigos de companhias para nomes completos
        const carrierNames: Record<string, string> = {
          'LA': 'LATAM Airlines', 'TP': 'TAP Air Portugal', 'BA': 'British Airways',
          'IB': 'Iberia', 'AF': 'Air France', 'KL': 'KLM', 'LH': 'Lufthansa',
          'DL': 'Delta Air Lines', 'AA': 'American Airlines', 'UA': 'United Airlines'
        };


        // Extrair data de saída do primeiro voo
        let departureDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
        if (firstFlight?.departureDateTime) {
          const datePart = firstFlight.departureDateTime.split(' ')[0];
          if (datePart) {
            const [day, month, year] = datePart.split('/');
            const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            departureDate = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
          }
        }

        return {
          header: {
            title: `${city}, ${country}`,
            subtitle: `${carrierNames[mainCarrier] || mainCarrier}`,
            departureLabel: departureDate,
            logoSrc: "/logo-sete-mares.jpg"
          },
          flights: optionFlights.map(flight => ({
            flightCode: flight.flightCode || `${flight.company?.description || flight.company?.iataCode || ''} ${flight.flight || ''}`,
            fromAirport: flight.fromAirport || flight.departureAirport?.description || '',
            toAirport: flight.toAirport || flight.landingAirport?.description || '',
            departureDateTime: flight.departureDateTime || (flight.departureDate && flight.departureTime ? `${flight.departureDate} ${flight.departureTime}` : ''),
            arrivalDateTime: flight.arrivalDateTime || (flight.landingDate && flight.landingTime ? `${flight.landingDate} ${flight.landingTime}` : '')
          })),
          fareDetails: option.pricing.map((fare: any, index: number) => {
            console.log(`🔍 Debug - Fare ${index + 1} da opção ${i + 1}:`, fare);
            
            const baseFare = Number(fare.baseFare) || 0;
            const baseTaxes = Number(fare.baseTaxes) || 0;
            const rav = baseFare * 0.10; // 10% RAV
            const totalTaxes = baseTaxes + rav;
            
            // Determinar classe baseada no índice ou propriedades disponíveis
            let classLabel = 'N/A';
            if (fare.fareClass) {
              classLabel = fare.fareClass;
            } else if (fare.class) {
              classLabel = fare.class;
            } else {
              // Fallback baseado no índice
              const classes = ['Executiva', 'Premium', 'Economy'];
              classLabel = classes[index] || `Classe ${index + 1}`;
            }
            
            console.log(`🔍 Debug - ClassLabel determinado: "${classLabel}"`);
            
            return {
              classLabel: classLabel,
              baseFare: baseFare,
              taxes: totalTaxes,
              total: baseFare + totalTaxes
            };
          }),
          footer: {
            baggage: option.baggage || "2 peças de até 23kg por bilhete",
            payment: option.payment || "Em até 4x no cartão de crédito, taxas à vista",
            penalty: "USD 250.00 + diferença tarifária, caso houver.",
            refundable: "Bilhete não reembolsável."
          }
        };
      });

      console.log('📊 Blocos processados para PDF unificado:', pdfBlocks);
      console.log('🔍 Debug - Voos da primeira opção:', pdfBlocks[0]?.flights);

      // Gerar PDF unificado com todos os blocos
      const unifiedPdfData = {
        blocks: pdfBlocks,
        companyInfo: {
          name: 'Sete Mares Turismo',
          phone: '(+5511) 3121-2888',
          address: 'Rua Dr. Renato Paes de Barros, 33 - 1º andar - Itaim Bibi - SP 04530-001',
          website: 'www.setemaresturismo.com.br'
        }
      };

      // Usar o gerador unificado
      await generateUnifiedPdf(unifiedPdfData);
      
      console.log('✅ Todos os PDFs gerados com sucesso!');
      
    } catch (error: any) {
      console.error('❌ Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  const generateUnifiedPdf = async (data: any) => {
    try {
      console.log('🔄 Gerando PDF único com múltiplas opções empilhadas...', data);
      
      // Usar o motor multi-stacked para gerar um único PDF
      const { downloadMultiPdf } = await import('@/lib/downloadMultiPdf');
      
      // Converter dados para o formato multi-stacked
      const multiStackedData = {
               header: {
          title: data.blocks[0]?.header?.title || "COTAÇÃO DE AÉREOS",
          subtitle: data.blocks[0]?.header?.subtitle || "Melhor valor disponível",
          departureLabel: data.blocks[0]?.header?.departureLabel || new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
                 logoSrc: '/logo-sete-mares.jpg'
               },
        options: data.blocks.map((block: any, index: number) => ({
          index: index + 1,
          flights: block.flights.map((flight: any) => ({
            flightCode: flight.flightCode,
            fromAirport: flight.fromAirport || flight.departureAirport?.description || '',
            toAirport: flight.toAirport || flight.landingAirport?.description || '',
            departureDateTime: flight.departureDateTime,
            arrivalDateTime: flight.arrivalDateTime
          })),
          fareDetails: block.fareDetails || [],
          footer: {
            baggage: block.footer.baggage || '2 peças de até 23kg por bilhete',
            payment: block.footer.payment || 'Em até 4x no cartão de crédito, taxas à vista',
            penalty: block.footer.penalty || 'USD 250.00 + diferença tarifária, caso houver.',
            refundable: block.footer.refundable || 'Bilhete não reembolsável.'
          }
        }))
      };
      
      console.log('📊 Dados convertidos para multi-stacked:', multiStackedData);
      console.log('🔍 Debug - Voos da primeira opção no multi-stacked:', multiStackedData.options[0]?.flights);
      console.log('🔍 Debug - Primeiro voo da primeira opção no multi-stacked:', multiStackedData.options[0]?.flights[0]);
      
      // Gerar um único PDF com todas as opções
      await downloadMultiPdf(multiStackedData);
      
      console.log('✅ PDF único gerado com sucesso com todas as opções empilhadas!');
      
    } catch (error: any) {
      console.error('❌ Erro ao gerar PDF multi-stacked:', error);
      throw error;
    }
  };

  const generateSimplePdf = async () => {
      const parsed = await parsePNR(pnrText);
      if (!parsed) {
        alert('Erro ao processar PNR. Verifique o formato.');
        return;
      }

      const decoded = parsed.trechos ? await decodeItinerary(parsed.trechos) : undefined;

      const params = {
        ravPercent: 10,
        fee: 0,
        incentiveValue: 0,
        class: 'Executiva',
        baggage: '2 peças de até 23kg por bilhete',
        payment: 'Em até 4x no cartão de crédito, taxas à vista',
        maxInstallments: 4,
        baseFine: 100,
        refundable: false,
        family: 'Silva',
      };

    // Usar resultado do Pricing Engine se disponível, senão calcular manualmente
    const totalValue = pricingResult?.total || (parsed.fares?.[0] ? (
        parseFloat(parsed.fares[0].tarifa) + 
        parseFloat(parsed.fares[0].taxas) + 
        (parseFloat(parsed.fares[0].tarifa) * params.ravPercent / 100) + 
        params.fee + 
        params.incentiveValue
    ) : 2404.00); // fallback

      // Determinar destino a partir dos voos
      const lastFlight = decoded?.flightInfo?.flights?.[decoded.flightInfo.flights.length - 1];
      let destination = "Destino";
      
      if (lastFlight?.landingAirport) {
        if (typeof lastFlight.landingAirport === 'string') {
          destination = lastFlight.landingAirport;
        } else if (lastFlight.landingAirport.description) {
          destination = lastFlight.landingAirport.description;
        } else if (lastFlight.landingAirport.iataCode) {
          destination = getAirportDescription(lastFlight.landingAirport.iataCode);
        }
      }
      
      console.log(`🔍 Debug PDF Simples - Destino:`, destination);
      
      // Extrair cidade e país
      let city = "Cidade";
      let country = "País";
      
      if (typeof destination === 'string' && destination !== 'Destino') {
        if (destination.includes('(') && destination.includes(')')) {
          const afterParenthesis = destination.split(')')[1];
          if (afterParenthesis) {
            const parts = afterParenthesis.trim().split(',').filter((part: string) => part.trim() !== '');
            if (parts.length >= 2) {
              city = parts[0].trim();
              country = parts[1].trim();
            } else if (parts.length === 1) {
              const words = parts[0].trim().split(' ');
              if (words.length >= 2) {
                city = words[0];
                country = words.slice(1).join(' ');
              }
            }
          }
        } else if (destination.includes(',')) {
          const parts = destination.split(',');
          if (parts.length >= 2) {
            city = parts[parts.length - 2].trim();
            country = parts[parts.length - 1].trim();
          }
        }
      }
      
      console.log(`🔍 Debug PDF Simples - Cidade: "${city}", País: "${country}"`);
      
      // Companhia principal
      const firstFlight = decoded?.flightInfo?.flights?.[0];
      let mainCarrier = "CIA";
      
      if (firstFlight?.company) {
        if (typeof firstFlight.company === 'string') {
          mainCarrier = firstFlight.company;
        } else if ((firstFlight.company as any).name) {
          mainCarrier = (firstFlight.company as any).name;
        } else if (firstFlight.company.iataCode) {
          mainCarrier = getCarrierName(firstFlight.company.iataCode);
        }
      }
      
      console.log(`🔍 Debug PDF Simples - Companhia: "${mainCarrier}"`);
      
      // Mapeamento de códigos de companhias para nomes completos
      const carrierNames: Record<string, string> = {
        'LA': 'LATAM Airlines', 'TP': 'TAP Air Portugal', 'BA': 'British Airways',
        'IB': 'Iberia', 'AF': 'Air France', 'KL': 'KLM', 'LH': 'Lufthansa',
        'DL': 'Delta Air Lines', 'AA': 'American Airlines', 'UA': 'United Airlines'
      };

  const pdfData: PdfData = {
    header: {
      title: `${city}, ${country}`,
      subtitle: `${carrierNames[mainCarrier] || mainCarrier}`,
      departureLabel: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
      logoSrc: "/logo-sete-mares.jpg"
    },
    flights: decoded?.flightInfo?.flights?.map(flight => ({
        flightCode: `${flight.company?.description || flight.company?.iataCode || ''} ${flight.flight || ''}`,
      fromAirport: flight.departureAirport?.description || '',
      toAirport: flight.landingAirport?.description || '',
        departureDateTime: flight.departureDate && flight.departureTime ? `${flight.departureDate} ${flight.departureTime}` : '',
        arrivalDateTime: flight.landingDate && flight.landingTime ? `${flight.landingDate} ${flight.landingTime}` : ''
    })) || [],
    fareBlock: {
      classLabel: `Classe ${params.class}`,
      totalUSD: totalValue
    },
    footer: {
      baggage: params.baggage || "2 peças de até 23kg por bilhete",
      payment: "Em até 4x no cartão de crédito, taxas à vista",
      penalty: "USD 250.00 + diferença tarifária, caso houver.",
      refundable: "Bilhete não reembolsável."
    }
  };

      await downloadPdf(pdfData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <aside className="fixed inset-y-0 left-0 w-60 bg-slate-900/80 backdrop-blur-sm border-r border-white/10">
        <div className="p-4">
          <div className="text-sm font-semibold text-slate-300 mb-6">Sete Mares</div>
          <nav className="space-y-1">
            <button 
              className={`sidebar-item ${currentPage === 'home' ? 'sidebar-item-active' : ''}`}
              onClick={() => setCurrentPage('home')}
            >
              <Home size={18}/><span>Decodificar</span>
            </button>
            <button className="sidebar-item">
              <FileText size={18}/><span>Cotações</span>
            </button>
            <button 
              className={`sidebar-item ${currentPage === 'catalog' ? 'sidebar-item-active' : ''}`}
              onClick={() => setCurrentPage('catalog')}
            >
              <Database size={18}/><span>Catálogo</span>
            </button>
            <button 
              className={`sidebar-item ${currentPage === 'unknown-codes' ? 'sidebar-item-active' : ''}`}
              onClick={() => setCurrentPage('unknown-codes')}
            >
              <AlertTriangle size={18}/><span>Pendências</span>
            </button>
            <button className="sidebar-item">
              <BarChart3 size={18}/><span>Relatórios</span>
            </button>
            <button className="sidebar-item">
              <Settings size={18}/><span>Config</span>
            </button>
          </nav>
        </div>
      </aside>

      <div className="ml-60">
        <header className="sticky top-0 z-40 h-16 bg-slate-900/70 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 xl:px-8 h-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo-sete-mares-app.png" alt="7Mares Logo" className="h-10 w-auto" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-100">7Mares Cotador</h1>
                <p className="text-sm text-slate-400">PNR — Cotação com RAV/Fee</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  supabaseStatus === 'connected' ? 'bg-green-500' : 
                  supabaseStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-slate-400">
                  {supabaseStatus === 'connected' ? 'Supabase OK' : 
                   supabaseStatus === 'error' ? 'Supabase Error' : 'Testing...'}
                </span>
              </div>
              <button className="btn btn-outline" onClick={handleImportPNR}>
                <Upload size={18}/> Importar PNR
              </button>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={isGenerating || !pnrText.trim()}>
                {isGenerating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Play size={18}/> Gerar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 xl:px-8 py-6">
          {currentPage === 'home' ? (
            <>
          <div className="grid grid-cols-12 gap-6 mb-6">
            <div className="col-span-6">
                  <PnrEditor onPnrChange={handlePnrChange} onClearAll={handleClearAll} onExecute={handleExecute} />
            </div>
            <div className="col-span-6">
                  <UnifiedPreview 
                    pnrData={pnrText}
                    isComplexPNR={isComplexPNR}
                    parsedOptions={parsedOptions}
                    onShowDetails={() => setShowDetailsModal(true)}
                    decodeResults={decodeResults}
                    decodedFlights={decodedFlights}
                    errors={errors}
                    overrides={[]}
                    heuristics={[]}
                  />
                </div>
              </div>
              
              {/* Pricing Engines - Compactados para cada opção */}
              <div className="mb-6">
                {isComplexPNR && parsedOptions.length > 0 ? (
                  <div className="space-y-4">
                    {parsedOptions.map((option, optionIndex) => (
                      <AdvancedPricingEngine
                        key={optionIndex}
                        optionLabel={`Pricing Engine: ${option.label}`}
                        optionIndex={optionIndex}
                        fareCategories={option.fareCategories || []}
                        onPricingChange={(result) => {
                          // Só logar se o resultado mudou significativamente
                          if (result && (result.rav > 0 || result.total > 0)) {
                            console.log(`Pricing para ${option.label}:`, result);
                          }
                        }}
                        onSave={(updatedCategories) => {
                          // Atualizar as categorias da opção
                          const updatedOptions = [...parsedOptions];
                          updatedOptions[optionIndex] = {
                            ...option,
                            fareCategories: updatedCategories,
                            // Atualizar também o array fares para manter compatibilidade
                            fares: updatedCategories.map(cat => ({
                              fareClass: cat.fareClass,
                              paxType: cat.paxType,
                              baseFare: cat.baseFare,
                              baseTaxes: cat.baseTaxes,
                              notes: cat.notes,
                              includeInPdf: true
                            }))
                          };
                          setParsedOptions(updatedOptions);
                          console.log(`✅ Categorias salvas para ${option.label}:`, updatedCategories);
                          
                          // Forçar re-render do componente para atualizar o Resumo
                          setResetTrigger(prev => prev + 1);
                        }}
                        resetTrigger={resetTrigger}
                      />
                    ))}
                  </div>
                ) : (
                  // Para PNR simples, usar AdvancedPricingEngine também
                  simplePnrData && simplePnrData.fares && simplePnrData.fares.length > 0 ? (
                    <AdvancedPricingEngine
                      optionLabel="Pricing Engine: Cotação Simples"
                      optionIndex={0}
                      fareCategories={simplePnrData.fares}
                      onPricingChange={(result) => {
                        // Atualizar pricingResult e forçar re-render do SimpleSummary
                        setPricingResult(result);
                        console.log('🔄 PricingResult atualizado para cotação simples:', result);
                      }}
                      onSave={(updatedCategories) => {
                        // Atualizar dados simples
                        const updatedSimpleData = {
                          ...simplePnrData,
                          fares: updatedCategories
                        };
                        setSimplePnrData(updatedSimpleData);
                        console.log('✅ Categorias salvas para cotação simples:', updatedCategories);
                        
                        // Recalcular pricingResult com os novos dados
                        const totalBaseFare = updatedCategories.reduce((sum, f) => sum + f.baseFare, 0);
                        const totalBaseTaxes = updatedCategories.reduce((sum, f) => sum + f.baseTaxes, 0);
                        const rav = 10; // RAV 10% padrão
                        const fee = 0;
                        const incentivo = 0;
                        const total = totalBaseFare + totalBaseTaxes + (totalBaseFare + totalBaseTaxes) * (rav / 100) + fee + incentivo;
                        
                        const newPricingResult: PricingResult = {
                          rav,
                          comissao: rav + fee + incentivo,
                          taxasExibidas: totalBaseTaxes + rav + fee + incentivo,
                          total
                        };
                        
                        setPricingResult(newPricingResult);
                        console.log('🔄 PricingResult recalculado após salvar:', newPricingResult);
                        setResetTrigger(prev => prev + 1);
                      }}
                      resetTrigger={resetTrigger}
                    />
                  ) : (
                    <div className="glass-card p-6 text-center">
                      <p className="text-slate-400">Nenhum PNR processado ainda</p>
                    </div>
                  )
                )}
                
                {/* Resumo da Cotação para PNR Simples */}
                {(() => {
                  // Debug reduzido - apenas quando há dados relevantes
                  if (simplePnrData || pricingResult) {
                    console.log('🔍 Verificando condições do SimpleSummary:', {
                      isComplexPNR,
                      simplePnrData: !!simplePnrData,
                      pricingResult: !!pricingResult,
                      shouldRender: !isComplexPNR && simplePnrData
                    });
                  }
                  
                  if (!isComplexPNR && simplePnrData) {
                    console.log('✅ Renderizando SimpleSummary');
                    return (
                      <SimpleSummary 
                        pnrData={simplePnrData}
                        pricingResult={pricingResult}
                        updatedFares={simplePnrData.fares}
                      />
                    );
                  } else {
                    console.log('❌ SimpleSummary não será renderizado');
                    return null;
                  }
                })()}
              </div>

              {/* Resumo das Opções */}
              {isComplexPNR && parsedOptions.length > 0 && (
                <div className="mb-6">
                  <div className="glass-card p-6">
                    <h3 className="text-xl font-bold text-slate-100 mb-4">Resumo das Opções</h3>
                    
                    <div className="space-y-4">
                      {parsedOptions.map((option, optionIndex) => (
                        <div key={optionIndex} className="bg-slate-800/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-bold text-orange-400">{option.label}</h4>
                            <div className="flex items-center space-x-2 text-sm text-slate-400">
                              <span>{option.segments.length} voos</span>
                              <span>•</span>
                              <span>{option.fares.length} categorias</span>
                            </div>
                          </div>

                          {/* Voos */}
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-slate-300 mb-2">Itinerário:</h5>
                            <div className="space-y-2">
                              {option.segments.map((segment: any, segmentIndex: number) => (
                                <div key={segmentIndex} className="flex items-center justify-between text-sm bg-slate-600/30 rounded p-2">
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

                {/* Categorias de Tarifa */}
                <div>
                  <h5 className="text-sm font-medium text-slate-300 mb-2">Valores:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(option.fareCategories || option.fares || []).map((fare: any, fareIndex: number) => {
                      // Usar fareCategories se disponível, senão usar fares
                      const fareData = option.fareCategories ? fare : fare;
                      const baseFare = fareData.baseFare || 0;
                      const baseTaxes = fareData.baseTaxes || 0;
                      
                      // Aplicar RAV, Fee e Incentivo (mesmo cálculo do Pricing Engine)
                      const ravPercent = 10; // RAV padrão
                      const fee = 0; // Fee padrão
                      const incentivo = 0; // Incentivo padrão
                      const subtotal = baseFare + baseTaxes;
                      const rav = (subtotal * ravPercent) / 100;
                      const total = subtotal + rav + fee + incentivo;
                      
                      return (
                        <div key={fareIndex} className="bg-slate-600/30 rounded p-3">
                          <div className="font-medium text-slate-200 text-sm">
                            {fareData.fareClass}
                            {fareData.paxType && fareData.paxType !== 'ADT' && ` (${fareData.paxType})`}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            USD {baseFare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + 
                            USD {baseTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} taxas
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            + RAV {ravPercent}% + Fee + Incentivo
                          </div>
                          <div className="text-sm font-bold text-red-400 mt-1">
                            TOTAL: USD {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                          {/* Informações Adicionais */}
                          {(option.paymentTerms || option.baggage?.length > 0 || option.notes) && (
                            <div className="mt-4 pt-4 border-t border-slate-600">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                {option.paymentTerms && (
                                  <div>
                                    <div className="font-medium text-slate-300">Pagamento:</div>
                                    <div className="text-slate-400">{option.paymentTerms}</div>
                                  </div>
                                )}
                                {option.baggage && option.baggage.length > 0 && (
                                  <div>
                                    <div className="font-medium text-slate-300">Bagagem:</div>
                                    <div className="text-slate-400">
                                      {option.baggage.map((b: any) => `${b.pieces}pc ${b.pieceKg}kg${b.fareClass ? `/${b.fareClass}` : ''}`).join(', ')}
                                    </div>
                                  </div>
                                )}
                                {option.notes && (
                                  <div>
                                    <div className="font-medium text-slate-300">Observações:</div>
                                    <div className="text-slate-400">{option.notes}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
            </div>
          </div>
              )}
            </>
          ) : currentPage === 'catalog' ? (
            <CatalogPage />
          ) : (
            <UnknownCodesPage />
          )}
        </main>
      </div>

      {/* Modal de Detalhes da Decodificação */}
      {showDetailsModal && (
        <ModalDetalhesDecodificacao
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          decodedFlights={decodedFlights}
          errors={errors}
          onCorrection={(code, type, correctedValue) => {
            console.log('Correção solicitada:', { code, type, correctedValue });
            // TODO: Implementar lógica de correção
          }}
        />
      )}

    </div>
  );
}