// Exemplo de teste para validar o PDF com dados do modelo Sete Mares
import { downloadPdf } from './src/lib/downloadPdf';
import type { PdfData } from './src/lib/PdfDocument';

// Dados de exemplo baseados no modelo oficial Sete Mares (PDF 2)
const testData: PdfData = {
  header: {
    title: "COTAÇÃO Lisbon, Portugal",
    subtitle: "Melhor valor com a TAP Air Portugal",
    departureLabel: "Saída: 22 de Setembro",
    logoSrc: undefined // sem logo por enquanto
  },
  flights: [
    {
      flightCode: "TP-088",
      fromAirport: "GUARULHOS INTERNATIONAL AIRPORT (GRU), SÃO PAULO, BRAZIL",
      toAirport: "HUMBERTO DELGADO AIRPORT (LIS), LISBON, PORTUGAL",
      departureDateTime: "2025-09-22 23:15",
      arrivalDateTime: "2025-09-23 12:30"
    },
    {
      flightCode: "TP-1903",
      fromAirport: "HUMBERTO DELGADO AIRPORT (LIS), LISBON, PORTUGAL",
      toAirport: "LEONARDO DA VINCI–FIUMICINO AIRPORT (FCO), ROME, ITALY",
      departureDateTime: "2025-09-23 14:05",
      arrivalDateTime: "2025-09-23 18:00"
    },
    {
      flightCode: "TP-081",
      fromAirport: "LEONARDO DA VINCI–FIUMICINO AIRPORT (FCO), ROME, ITALY",
      toAirport: "HUMBERTO DELGADO AIRPORT (LIS), LISBON, PORTUGAL",
      departureDateTime: "2025-10-03 20:15",
      arrivalDateTime: "2025-10-03 22:10"
    },
    {
      flightCode: "TP-089",
      fromAirport: "HUMBERTO DELGADO AIRPORT (LIS), LISBON, PORTUGAL",
      toAirport: "GUARULHOS INTERNATIONAL AIRPORT (GRU), SÃO PAULO, BRAZIL",
      departureDateTime: "2025-10-03 23:55",
      arrivalDateTime: "2025-10-04 05:45"
    }
  ],
  fareBlock: {
    classLabel: "Classe Executiva",
    totalUSD: 2404.00
  },
  footer: {
    baggage: "2 peças de até 23kg por bilhete",
    payment: "Em até 4x no cartão de crédito, taxas à vista",
    penalty: "USD 250.00 + diferença tarifária, caso houver.",
    refundable: "Bilhete não reembolsável."
  }
};

// Função para testar o PDF
export async function testPdfGeneration() {
  try {
    console.log('Gerando PDF de teste...');
    await downloadPdf(testData);
    console.log('PDF gerado com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
  }
}

// Executar teste se chamado diretamente
if (typeof window !== 'undefined') {
  // Adicionar botão de teste no console do navegador
  (window as any).testPdf = testPdfGeneration;
  console.log('Para testar o PDF, execute: testPdf()');
}
