import { useState, useEffect } from 'react';
import { Upload, Play, Home, FileText, Database, BarChart3, Settings, AlertTriangle } from 'lucide-react';
// import { ParamsForm } from '@/components/quote/ParamsForm'; // REMOVIDO - interface duplicada
import { PnrEditor } from '@/components/pnr/PnrEditor';
import { QuotePreview } from '@/components/decoder/QuotePreview';
import { UnifiedPreview } from '@/components/decoder/UnifiedPreview';
import { CatalogPage } from '@/components/catalog/CatalogPage';
import { UnknownCodesPage } from '@/components/decoder/UnknownCodesPage';
// import { PricingEngine } from '@/components/pricing/PricingEngine'; // REMOVIDO: usando AdvancedPricingEngine
import { CompactPricingEngine } from '@/components/pricing/CompactPricingEngine';
import { AdvancedPricingEngine } from '@/components/pricing/AdvancedPricingEngine';
import { SimpleSummary } from '@/components/decoder/SimpleSummary';
import { ModalDetalhesDecodificacao } from '@/components/ModalDetalhesDecodificacao';
import { parsePNR, decodeItinerary } from '@/lib/parser';
import { downloadPdf } from '@/lib/downloadPdf';
import { testSupabaseConnection } from '@/lib/supabase';
import type { PdfData } from '@/lib/PdfDocument';
import type { PricingResult } from '@/lib/pricing';
import { ProfessionalPdfDocument } from '@/lib/ProfessionalPdfGenerator';
import { UnifiedPdfDocument } from '@/lib/UnifiedPdfGenerator';
import { MultiPdfDocument } from '@/lib/MultiPdfDocument';
import { pdf } from '@react-pdf/renderer';
import { processEmailToMultiQuote, processSimplePNR, validateEngine } from '@/core/quote-engine/index';

export default function App() {
  const [pnrText, setPnrText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [currentPage, setCurrentPage] = useState<'home' | 'catalog' | 'unknown-codes'>('home');
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [pricingParams, setPricingParams] = useState({
    tarifa: 0,
    taxasBase: 0,
    ravPercent: 10,
    fee: 0,
    incentivo: 0
  });
  const [isComplexPNR, setIsComplexPNR] = useState(false);
  const [parsedOptions, setParsedOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [fareCategories, setFareCategories] = useState<any[]>([]);
  const [simplePnrData, setSimplePnrData] = useState<any>(null);
  
  // Estados de decodificação
  const [decodeResults, setDecodeResults] = useState<any>(null);
  const [decodedFlights, setDecodedFlights] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  
  // Monitorar mudanças no pricingResult
  useEffect(() => {
    console.log('📊 Estado pricingResult alterado:', pricingResult);
  }, [pricingResult]);

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
    // REMOVIDO: Decodificação automática - agora só acontece no botão Executar
  };

  const decodeAndFillPricing = async (pnrText: string) => {
    try {
      console.log('🔄 Decodificando PNR para preencher Pricing Engine...');
      
      // Detectar se é PNR complexo
      const isComplex = pnrText.includes('==') || (pnrText.match(/tarifa\s+usd/gi) || []).length > 1;
      setIsComplexPNR(isComplex);
      
      if (isComplex) {
        // Para PNR complexo, parsear opções
        const { parseEmailToOptions } = await import('@/lib/email-parser');
        const parsedEmail = parseEmailToOptions(pnrText);
        setParsedOptions(parsedEmail.options);
        setSelectedOption(0); // Selecionar primeira opção por padrão
        console.log('📧 PNR complexo detectado:', parsedEmail.options.length, 'opções');
      } else {
        // Para PNR simples, usar lógica atual
        const parsed = await parsePNR(pnrText);
        
        if (parsed && parsed.fares && parsed.fares.length > 0) {
          const firstFare = parsed.fares[0];
          const tarifa = parseFloat(firstFare.tarifa.replace(',', '.')) || 0;
          const taxasBase = parseFloat(firstFare.taxas.replace(',', '.')) || 0;
          
          console.log('💰 Valores extraídos do PNR:', { tarifa, taxasBase });
          
          // Atualizar parâmetros do Pricing Engine
          setPricingParams({
            tarifa: tarifa,
            taxasBase: taxasBase,
            ravPercent: 10,
            fee: 0,
            incentivo: 0
          });
          
          // Triggerar reset do Pricing Engine com os novos valores
          setResetTrigger(prev => prev + 1);
        }
        setParsedOptions([]);
        setSelectedOption(null);
      }
    } catch (error) {
      console.error('❌ Erro ao decodificar PNR para Pricing Engine:', error);
    }
  };

  const handleClearAll = () => {
    console.log('🧹 Limpando todos os dados do sistema...');
    setPnrText('');
    setPricingResult(null);
    setPricingParams({
      tarifa: 0,
      taxasBase: 0,
      ravPercent: 10,
      fee: 0,
      incentivo: 0
    });
    setResetTrigger(prev => prev + 1); // Incrementa para triggerar reset do PricingEngine
    setIsComplexPNR(false);
    setParsedOptions([]);
    setSelectedOption(null);
    setSimplePnrData(null);
    setFareCategories([]);
    
    // Limpar estados de decodificação
    setDecodeResults(null);
    setDecodedFlights([]);
    setErrors([]);
    
    // O QuotePreview já limpa automaticamente quando pnrText fica vazio
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
      // Validar motor unificado
      const engineStatus = validateEngine();
      console.log('🔧 Status do motor:', engineStatus);
      
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
        console.log('🔍 Processando PNR complexo com motor unificado');
        
        // Usar novo motor unificado
        const result = processEmailToMultiQuote(pnrText);
        
        if (!result.success) {
          console.error('❌ Erro no processamento:', result.errors);
          setErrors(result.errors.map(e => ({ error: e })));
          return;
        }
        
        console.log('✅ PNR complexo processado:', result.doc?.options.length, 'opções');
        
        // Converter para formato compatível com UI existente
        const convertedOptions = result.doc?.options.map((opt, index) => ({
          label: opt.label,
          paymentTerms: opt.quote.payment,
          notes: opt.quote.notes,
          segments: opt.quote.segments.map(seg => ({
            carrier: seg.carrier,
            flightNumber: seg.flight,
            date: seg.date,
            from: seg.from,
            to: seg.to,
            departureTime: seg.dep,
            arrivalTime: seg.arr + (seg.arrNextDay ? '#' : '')
          })),
          fares: Object.entries(opt.quote.fares).map(([cabin, fare]) => ({
            class: cabin === 'executive' ? 'Exe' : cabin === 'premiumEco' ? 'Pre' : 'Eco',
            tarifa: fare?.tarifa.toString() || '0',
            taxas: fare?.taxas.toString() || '0',
            total: fare?.total.toString() || '0'
          })),
          baggage: Object.entries(opt.quote.baggage).map(([cabin, text]) => ({
            cabin: cabin === 'executive' ? 'Exe' : cabin === 'premiumEco' ? 'Pre' : 'Eco',
            text: text || ''
          }))
        })) || [];
        
        setParsedOptions(convertedOptions);
        setSelectedOption(0);
        setDecodeResults(null);
        setDecodedFlights([]);
        setErrors([]);
        setPricingResult(null);
        setSimplePnrData(null);
        
        console.log('✅ Estados atualizados para PNR complexo');
        
      } else {
        console.log('🔍 Processando PNR simples com motor unificado');
        
        // Usar novo motor unificado para PNR simples
        const result = processSimplePNR(pnrText);
        
        if (!result.success) {
          console.error('❌ Erro no processamento do PNR simples:', result.errors);
          setErrors(result.errors.map(e => ({ error: e })));
          return;
        }
        
        console.log('✅ PNR simples processado:', result.quote);
        
        // Configurar dados para PNR simples
        if (result.quote) {
          const firstFare = Object.values(result.quote.fares).find(f => f) || { tarifa: 0, taxas: 0, total: 0 };
          
          setPricingParams({
            tarifa: firstFare.tarifa,
            taxasBase: firstFare.taxas - firstFare.tarifa, // Remove RAV das taxas
            ravPercent: 10,
            fee: 0,
            incentivo: 0
          });
          
          const simplePricingResult: PricingResult = {
            tarifa: firstFare.tarifa,
            taxasBase: firstFare.taxas - firstFare.tarifa,
            rav: firstFare.tarifa * 0.10,
            fee: 0,
            incentivo: 0,
            taxas: firstFare.taxas,
            total: firstFare.total
          };
          
          setPricingResult(simplePricingResult);
          
          // Converter segmentos para formato de voos
          const flights = result.quote.segments.map(seg => ({
            company: { code: seg.carrier },
            flight: seg.flight,
            departureDate: seg.date || '',
            departureTime: seg.dep,
            landingDate: seg.date || '',
            landingTime: seg.arr,
            fromAirport: seg.from,
            toAirport: seg.to
          }));
          
          setDecodedFlights(flights);
          setDecodeResults({ flightInfo: { flights } });
        }
        
        setSimplePnrData(result.quote);
        setParsedOptions([]);
        setSelectedOption(null);
      }
      
      console.log('🎉 SUCESSO: Processamento concluído com motor unificado!');
      
    } catch (error) {
      console.error('❌ ERRO: Falha no processamento:', error);
      setErrors([{ error: error instanceof Error ? error.message : String(error) }]);
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

  // Função para formatar data/hora de forma segura
  const formatDateTime = (dateTimeStr: string): string => {
    try {
      console.log('🕐 Formatando data/hora:', dateTimeStr);
      
      // Se já está no formato correto (YYYY-MM-DD HH:MM), retornar como está
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dateTimeStr)) {
        return dateTimeStr;
      }
      
      // Tentar parsear como data
      const date = new Date(dateTimeStr);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('❌ Data inválida:', dateTimeStr);
        return dateTimeStr; // Retornar string original se inválida
      }
      
      // Formatar para YYYY-MM-DD HH:MM
      const formatted = date.toISOString().slice(0, 16).replace('T', ' ');
      console.log('✅ Data formatada:', formatted);
      return formatted;
    } catch (error) {
      console.warn('❌ Erro ao formatar data:', dateTimeStr, error);
      return dateTimeStr; // Retornar string original em caso de erro
    }
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
        await downloadPdf(simplePnrData);
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
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  const generatePdfFromOptions = async (options: any[]) => {
    try {
      console.log('🔄 Gerando PDF com motor unificado...');
      
      // Usar o novo motor unificado para processar o PNR completo
      const result = processEmailToMultiQuote(pnrText);
      
      if (!result.success) {
        console.error('❌ Erro no processamento:', result.errors);
        alert('Erro ao processar PNR: ' + result.errors.join(', '));
        return;
      }
      
      console.log('✅ PNR processado com sucesso:', result.doc?.options.length, 'opções');
      
      // Gerar PDF único com múltiplas páginas
      const pdfDoc = <MultiPdfDocument data={result.doc!} />;
      const pdfBlob = await pdf(pdfDoc).toBlob();
      
      // Download do PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cotacao_multipla_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ PDF único gerado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleGeneratePdf = async () => {
    if (isComplexPNR) {
      await generatePdfFromOptions(parsedOptions);
    } else {
      // Para PNR simples, usar a lógica existente
      if (simplePnrData && pricingResult) {
        const pdfData: PdfData = {
          header: {
            title: 'COTAÇÃO DE AÉREOS',
            subtitle: 'Melhor valor com: Sete Mares Turismo',
            departureLabel: 'Saída: ' + new Date().toLocaleDateString('pt-BR'),
            logoSrc: '/logo-sete-mares.jpg'
          },
          flights: decodedFlights.map(flight => ({
            flightCode: `${flight.company?.code || 'N/A'} ${flight.flight || 'N/A'}`,
            fromAirport: flight.fromAirport || 'N/A',
            toAirport: flight.toAirport || 'N/A',
            departureDateTime: `${flight.departureDate || ''} ${flight.departureTime || ''}`,
            arrivalDateTime: `${flight.landingDate || ''} ${flight.landingTime || ''}`
          })),
          fareBlock: {
            classLabel: 'Classe Executiva',
            totalUSD: pricingResult.total
          },
          footer: {
            baggage: '2 peças de até 23kg por bilhete',
            payment: 'Em até 4x no cartão de crédito, taxas à vista',
            penalty: 'USD 250.00 + diferença tarifária, caso houver.',
            refundable: 'Bilhete não reembolsável.'
          }
        };
        
        await downloadPdf(pdfData);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">7Mares Cotador</h1>
              <div className="ml-4 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${supabaseStatus === 'connected' ? 'bg-green-500' : supabaseStatus === 'testing' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {supabaseStatus === 'connected' ? 'Supabase OK' : supabaseStatus === 'testing' ? 'Testando...' : 'Supabase Error'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleImportPNR}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar PNR
              </button>
              <button
                onClick={handleGeneratePdf}
                disabled={!pnrText.trim() || isGenerating}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4 mr-2" />
                Gerar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - PNR Editor */}
          <div className="space-y-6">
            <PnrEditor
              onPnrChange={setPnrText}
              onExecute={handleExecute}
            />
            
            {/* Unified Preview */}
            <UnifiedPreview
              pnrData={pnrText}
              parsedOptions={parsedOptions}
              decodedFlights={decodedFlights}
              errors={errors}
              isComplexPNR={isComplexPNR}
              onShowDetails={() => setShowDetailsModal(true)}
            />
          </div>

          {/* Right Column - Pricing Engine */}
          <div className="space-y-6">
            {isComplexPNR ? (
            <AdvancedPricingEngine
              optionLabel={parsedOptions[selectedOption || 0]?.label || 'Opção'}
              optionIndex={selectedOption || 0}
              fareCategories={parsedOptions[selectedOption || 0]?.fares || []}
              onPricingChange={(result) => {
                console.log('Pricing changed:', result);
              }}
              onSave={(updatedCategories) => {
                console.log('Categories saved:', updatedCategories);
              }}
              resetTrigger={resetTrigger}
            />
            ) : (
              <CompactPricingEngine
                optionLabel="Cotação Simples"
                optionIndex={0}
                initialParams={pricingParams}
                onPricingChange={(result) => {
                  setPricingResult(result);
                }}
                resetTrigger={resetTrigger}
              />
            )}

            {/* Simple Summary for simple PNRs */}
            {!isComplexPNR && pricingResult && (
              <SimpleSummary
                pnrData={simplePnrData}
                pricingResult={pricingResult}
              />
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <ModalDetalhesDecodificacao
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        decodedFlights={decodedFlights}
        errors={errors}
      />
    </div>
  );
}
