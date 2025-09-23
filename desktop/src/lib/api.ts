// API para conectar com o sistema Python existente
export interface PnrParseRequest {
  pnr_text: string;
  params: {
    rav_percent: number;
    fee: number;
    incentive_value: number;
    class: string;
    baggage: string;
    payment: string;
    max_installments: number;
    base_fine: number;
    refundable: boolean;
    family?: string;
  };
}

export interface PdfGenerateResponse {
  success: boolean;
  pdf_path?: string;
  filename?: string;
  error?: string;
}

// Simular chamada para o backend Python
export async function generatePdfViaPython(data: PnrParseRequest): Promise<PdfGenerateResponse> {
  try {
    // Em produção, seria uma chamada HTTP para o backend Python
    // Por ora, simula o comportamento
    
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Fallback: gerar via frontend por enquanto
    console.warn('Backend Python não disponível, usando fallback frontend');
    
    // Simular resposta de sucesso
    return {
      success: true,
      filename: `cotacao_${new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '_')}.pdf`,
    };
  }
}

// Bridge temporário: usar sistema Python existente
export async function callPythonPdfGenerator(pnrText: string, _params: any): Promise<string> {
  // Por enquanto, retorna um placeholder até conectarmos o backend
  // Em produção, isso faria uma chamada HTTP para o servidor Python
  
  // const pythonParams = {
  //   pnr_text: pnrText,
  //   params: {
  //     rav_percent: params.ravPercent || 10,
  //     fee: params.fee || 0,
  //     incentive_value: params.incentiveValue || 0,
  //     class: params.class || 'Executiva',
  //     baggage: params.baggage || '2 peças de até 23kg por bilhete',
  //     payment: params.payment || 'Em até 4x no cartão de crédito, taxas à vista',
  //     max_installments: params.maxInstallments || 4,
  //     base_fine: params.baseFine || 100,
  //     refundable: params.refundable || false,
  //     family: params.family || '',
  //   },
  // };

  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Por enquanto, mostrar instrução para usar o sistema Python
  alert(`Para gerar o PDF premium, use temporariamente o sistema Python:
  
1. Abra o app Python (ui/app.py)
2. Cole este PNR:
${pnrText}
3. Configure os parâmetros e gere o PDF
  
O sistema React será conectado ao Python em breve.`);
  
  return 'placeholder.pdf';
}