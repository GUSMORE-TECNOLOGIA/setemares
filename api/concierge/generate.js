// Serverless Function para geração de relatórios de Concierge
// Importar as dependências necessárias do server.cjs

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://dgverpbhxtslmfrrcwwj.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs";
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração
const FEATURE_USE_AI = (process.env.USE_AI_CONCIERGE || 'true').toLowerCase() === 'true';

// Função para gerar relatório de concierge com IA
async function generateConciergeReportWithAI(formData) {
  const startTime = Date.now();
  let model = 'gpt-4o-mini';
  let tokens = 0;
  
  try {
    // Importar OpenAI dinamicamente para evitar problemas de build
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const sys = `Você é um concierge sênior de luxo com 20 anos de experiência.
Gere um relatório HTML completo e DETALHADO com:

ROTEIRO DIA-A-DIA:
- Para CADA refeição: sugira 1-2 restaurantes específicos (nome, endereço, prato famoso, por que é especial)
- Para CADA período (manhã/tarde/noite): sugira atividades/atrações específicas com:
 * Nome exato do local
 * Endereço completo
 * Tempo estimado de visita
 * Dica prática (melhor horário, ingresso antecipado, etc)
- Respeite os horários (início: ${formData.dayStartTime || '09:00'}, fim: ${formData.dayEndTime || '22:00'})
- Considere o ritmo (${formData.dailyPace || 'equilibrado'}) e distâncias (máx ${formData.maxWalkingKm || 5}km/dia)

GASTRONOMIA:
- Liste 5-8 restaurantes com: nome, endereço, tipo de culinária, prato assinatura, chef (se famoso), faixa de preço
- Priorize os interesses: ${formData.cuisinePreferences || 'geral'}
- Evite: ${formData.dietaryRestrictions || 'nenhuma'}

VIDA NOTURNA:
- 3-5 locais (bares, lounges, casas de show) com endereço e especialidade
- Nível: ${formData.nightlifeLevel || 'moderado'}

ATRAÇÕES:
- 8-12 pontos turísticos/culturais com descrição curta e dica prática

Use os dados fornecidos em JSON. Se faltarem detalhes, INVENTE com base no seu conhecimento de ${formData.destination}, mas seja específico e verossímil.

HTML: Use classes Tailwind, layout premium, seções bem organizadas. Apenas conteúdo do corpo, sem <html>/<body>/<style>.`;
    
    const user = `Dados do cliente: ${formData.clientName} em ${formData.destination} (${formData.checkin} a ${formData.checkout}), tipo ${formData.travelType}, orçamento ${formData.budget}.`;
    
    const completion = await client.chat.completions.create({
      model,
      messages: [ { role: 'system', content: sys }, { role: 'user', content: user } ],
      temperature: 0.6,
      max_tokens: 3000
    });
    
    const inner = completion.choices?.[0]?.message?.content || '';
    tokens = completion.usage?.total_tokens || 0;
    
    const html = premiumWrapper(inner, formData);
    const processingTime = Date.now() - startTime;
    
    return {
      content: inner,
      html,
      metadata: {
        processingTime,
        tokensUsed: tokens,
        model
      }
    };
  } catch (err) {
    console.error('AI rendering error:', err);
    // fallback: gerar HTML básico
    const inner = `<h2>Resumo Executivo</h2><p>Relatório personalizado para ${formData.clientName} em ${formData.destination}.</p>`;
    const html = premiumWrapper(inner, formData);
    return {
      content: inner,
      html,
      metadata: {
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        model: 'fallback'
      }
    };
  }
}

// Wrapper HTML premium
function premiumWrapper(innerHtml, formData) {
  const travelTypeLabels = {
    lua_de_mel: 'Lua de Mel',
    familia: 'Família',
    negocios: 'Negócios',
    aventura: 'Aventura',
    cultural: 'Cultural',
    gastronomico: 'Gastronômico',
    relaxamento: 'Relaxamento'
  };
  const budgetLabels = {
    economico: 'Econômico',
    confortavel: 'Confortável',
    premium: 'Premium',
    luxo: 'Luxo'
  };
  
  const travelTypeLabel = travelTypeLabels[formData.travelType] || formData.travelType;
  const budgetLabel = budgetLabels[formData.budget] || formData.budget;
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Concierge - ${formData.destination}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.7; color: #1e293b; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 40px 20px; font-size: 15px; }
        .container { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.05); }
        .header { background: linear-gradient(135deg, #FF7A1A 0%, #FF5A00 100%); color: #fff; padding: 48px 40px; position: relative; overflow: hidden; }
        .header::before { content: ''; position: absolute; top: 0; right: 0; width: 400px; height: 400px; background: radial-gradient(circle, rgba(255,255,255,.15) 0%, transparent 70%); border-radius: 50%; transform: translate(30%,-30%); }
        .header-content { position: relative; z-index: 1; }
        .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 16px; letter-spacing: -.5px; }
        .header-meta { font-size: 16px; font-weight: 500; opacity: .95; margin-bottom: 8px; }
        .header-client { font-size: 14px; opacity: .85; font-weight: 400; }
        .content { padding: 40px; }
        h2 { color: #FF7A1A; font-size: 24px; font-weight: 700; margin-top: 40px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 3px solid #FF7A1A; letter-spacing: -.3px; }
        h2:first-child { margin-top: 0; }
        h3 { color: #0f172a; font-size: 19px; font-weight: 600; margin-top: 28px; margin-bottom: 14px; letter-spacing: -.2px; }
        h4 { color: #334155; font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 10px; }
        p { margin: 14px 0; color: #334155; line-height: 1.8; }
        ul,ol { margin: 16px 0; padding-left: 28px; }
        li { margin: 10px 0; color: #475569; line-height: 1.7; }
        strong, b { color: #0f172a; font-weight: 600; }
        li strong { color: #1e293b; font-weight: 600; }
        .highlight { background: linear-gradient(135deg,#FFF7ED 0%,#FFEDD5 100%); padding: 20px 24px; border-left: 5px solid #FF7A1A; margin: 24px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(255,122,26,.08); }
        .tip { background: linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%); padding: 16px 20px; border-left: 4px solid #3B82F6; margin: 20px 0; border-radius: 6px; font-size: 14px; }
        .warning { background: linear-gradient(135deg,#FEF3C7 0%,#FDE68A 100%); padding: 16px 20px; border-left: 4px solid #F59E0B; margin: 20px 0; border-radius: 6px; font-size: 14px; }
        .footer { background: #f8fafc; text-align: center; color: #64748b; padding: 32px 40px; border-top: 1px solid #e2e8f0; font-size: 14px; }
        .footer strong { color: #FF7A1A; font-weight: 600; }
        @media (max-width: 768px) {
            body { padding: 20px 10px; }
            .header, .content, .footer { padding: 24px 20px; }
            .header h1 { font-size: 26px; }
            h2 { font-size: 21px; }
            h3 { font-size: 17px; }
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-content">
          <h1>Relatório de Concierge Premium</h1>
          <div class="header-meta">${formData.destination} • ${travelTypeLabel} • ${budgetLabel}</div>
          <div class="header-client">Preparado para: ${formData.clientName}</div>
        </div>
      </div>
      <div class="content">${innerHtml}</div>
      <div class="footer">
        <p>Relatório gerado por <strong>IA</strong> • Sete Mares Concierge Premium</p>
        <p style="margin-top: 8px; font-size: 13px; opacity: 0.8;">Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
  </body>
  </html>`;
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

    // Gerar relatório com IA ou fallback
    let report;
    if (FEATURE_USE_AI) {
      try {
        report = await generateConciergeReportWithAI({
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
      } catch (aiError) {
        console.warn('AI generation failed, using fallback:', aiError.message);
        // Fallback simples se IA falhar
        const fallbackContent = `<h2>Resumo Executivo</h2><p>Relatório personalizado para ${clientName} em ${destination}.</p>`;
        report = {
          content: fallbackContent,
          html: premiumWrapper(fallbackContent, {
            clientName,
            destination,
            travelType,
            budget
          }),
          metadata: {
            processingTime: 0,
            tokensUsed: 0,
            model: 'fallback'
          }
        };
      }
    } else {
      // Gerador simples quando IA está desabilitada
      const simpleContent = `<h2>Resumo Executivo</h2><p>Relatório personalizado para ${clientName} em ${destination}.</p>`;
      report = {
        content: simpleContent,
        html: premiumWrapper(simpleContent, {
          clientName,
          destination,
          travelType,
          budget
        }),
        metadata: {
          processingTime: 0,
          tokensUsed: 0,
          model: 'simple-generator'
        }
      };
    }

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

