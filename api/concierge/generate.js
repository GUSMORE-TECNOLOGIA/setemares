// Serverless Function para geração de relatórios de Concierge
// Importar as dependências necessárias do server.cjs

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://dgverpbhxtslmfrrcwwj.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs";
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração
const FEATURE_USE_AI = (process.env.USE_AI_CONCIERGE || 'false').toLowerCase() === 'true';

// Função simples de geração (sem IA por enquanto)
function generateSimpleReport(formData) {
  const startTime = Date.now();
  
  // Calcular duração da estadia
  const checkinDate = new Date(formData.checkin);
  const checkoutDate = new Date(formData.checkout);
  const durationDays = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const reportContent = `
# Relatório de Concierge - ${formData.destination}

## Informações do Cliente
- **Nome:** ${formData.clientName}
- **Destino:** ${formData.destination}
- **Período:** ${formData.checkin} a ${formData.checkout} (${durationDays} dias)
- **Tipo de viagem:** ${formData.travelType}
- **Orçamento:** ${formData.budget}

## Resumo Executivo
Este relatório foi gerado para ${formData.clientName} para uma viagem ${formData.travelType} para ${formData.destination}.
`;

  const reportHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Concierge - ${formData.destination}</title>
    <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; padding: 40px; }
        h1 { color: #FF7A1A; }
        h2 { color: #0f172a; border-bottom: 2px solid #FF7A1A; padding-bottom: 10px; }
    </style>
</head>
<body>
    <h1>Relatório de Concierge Premium</h1>
    <h2>Informações do Cliente</h2>
    <p><strong>Nome:</strong> ${formData.clientName}</p>
    <p><strong>Destino:</strong> ${formData.destination}</p>
    <p><strong>Período:</strong> ${formData.checkin} a ${formData.checkout}</p>
</body>
</html>`;

  const processingTime = Date.now() - startTime;
  
  return {
    content: reportContent,
    html: reportHtml,
    metadata: {
      processingTime,
      tokensUsed: 0,
      model: 'simple-generator'
    }
  };
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: true, message: 'Method not allowed' });
  }

  try {
    const {
      clientName,
      destination,
      checkin,
      checkout,
      travelType,
      budget,
      adults,
      children,
      hotel,
      address,
      interests,
      observations,
      agentName
    } = req.body;

    // Validação básica
    if (!clientName || !destination || !checkin || !checkout || !travelType || !budget) {
      return res.status(400).json({
        error: true,
        message: "Campos obrigatórios: clientName, destination, checkin, checkout, travelType, budget"
      });
    }

    // Gerar relatório simples
    const report = generateSimpleReport({
      clientName,
      destination,
      checkin,
      checkout,
      travelType,
      budget,
      adults: adults || 1,
      children: children || 0,
      hotel,
      address,
      interests: interests || [],
      observations
    });

    // Salvar no Supabase
    let reportId = null;
    try {
      const { data, error } = await supabase
        .from('concierge_reports')
        .insert({
          agent_name: agentName,
          client_name: clientName,
          destination,
          checkin,
          checkout,
          travel_type: travelType,
          budget,
          adults: adults || 1,
          children: children || 0,
          hotel,
          address,
          interests: interests || [],
          observations,
          report_content: report.content,
          report_html: report.html,
          processing_time_ms: report.metadata.processingTime,
          openai_model: report.metadata.model,
          openai_tokens_used: report.metadata.tokensUsed,
          status: 'generated'
        })
        .select()
        .single();
      
      if (error) throw error;
      reportId = data?.id || null;
    } catch (dbErr) {
      console.error('Erro Supabase:', dbErr);
      // Gerar ID aleatório se falhar
      reportId = `${Date.now()}`;
    }

    res.status(200).json({
      success: true,
      report: {
        id: reportId,
        content: report.content,
        html: report.html,
        metadata: report.metadata
      }
    });

  } catch (error) {
    console.error('Erro no endpoint concierge:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Erro interno do servidor'
    });
  }
}

