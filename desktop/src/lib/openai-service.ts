import OpenAI from 'openai';
import { logger } from './logger';

// Tipos para o serviço de Concierge
export interface ConciergeFormData {
  clientName: string;
  destination: string;
  checkin: string;
  checkout: string;
  travelType: 'lua_de_mel' | 'familia' | 'negocios' | 'aventura' | 'cultural' | 'gastronomico' | 'relaxamento';
  budget: 'economico' | 'confortavel' | 'premium' | 'luxo';
  adults: number;
  children: number;
  hotel?: string;
  address?: string;
  interests: string[];
  observations?: string;
  // Preferências Premium (opcionais)
  cuisinePreferences?: string[]; // ex.: alta_gastronomia, local_autentica, frutos_do_mar, churrasco, cafes
  dietaryRestrictions?: string[]; // ex.: sem_gluten, sem_lactose, vegetariano, vegano, alergias
  nightlifeLevel?: 'baixo' | 'moderado' | 'alto';
  eventInterests?: string[]; // ex.: shows, teatro, festivais, exposicoes, esportes
  dailyPace?: 'relaxado' | 'equilibrado' | 'intenso';
  morningStart?: string; // HH:mm
  eveningEnd?: string;   // HH:mm
  maxWalkingKmPerDay?: number;
  freeTimeBlocks?: string[]; // Ex.: ["14:00-16:00", "19:00-20:00"] padrão para todos os dias
}

export interface ConciergeReport {
  content: string;
  html: string;
  metadata: {
    processingTime: number;
    tokensUsed: number;
    model: string;
  };
}

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Templates de tipos de viagem em português
const travelTypeTranslations = {
  lua_de_mel: 'Lua de Mel',
  familia: 'Família',
  negocios: 'Negócios',
  aventura: 'Aventura',
  cultural: 'Cultural',
  gastronomico: 'Gastronômico',
  relaxamento: 'Relaxamento'
};

const budgetTranslations = {
  economico: 'Econômico',
  confortavel: 'Confortável',
  premium: 'Premium',
  luxo: 'Luxo'
};

// Função principal para gerar relatório de concierge
export async function generateConciergeReport(formData: ConciergeFormData): Promise<ConciergeReport> {
  const startTime = Date.now();
  
  try {
    // Calcular duração da estadia
    const checkinDate = new Date(formData.checkin);
    const checkoutDate = new Date(formData.checkout);
    const durationDays = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Preparar prompt estruturado
    const prompt = buildConciergePrompt(formData, durationDays);
    
    logger.info('Iniciando geração de relatório Concierge', {
      destination: formData.destination,
      travelType: formData.travelType,
      budget: formData.budget,
      duration: durationDays
    }, 'OpenAIService');

    // Chamar OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em viagens e concierge premium da Sete Mares. Sua tarefa é criar relatórios detalhados e personalizados para agentes de viagem apresentarem aos seus clientes. 

IMPORTANTE: 
- Responda APENAS em português brasileiro
- Use tom profissional mas acolhedor e inspirador
- Seja específico e detalhado
- Inclua informações práticas e úteis
- Adapte o conteúdo ao tipo de viagem e orçamento
- Use formatação HTML SEMÂNTICA para estruturar o relatório (h2, h3, h4, p, ul, ol, li, strong)
- NUNCA inclua tags <html>, <head>, <body> ou <style> no seu HTML
- Retorne APENAS o conteúdo HTML do corpo do relatório
- Use classes CSS quando apropriado: .highlight para destaques, .tip para dicas, .warning para avisos
- Organize o conteúdo de forma hierárquica e visual
- Use emojis sutilmente quando apropriado para dar vida ao texto`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('Resposta vazia da OpenAI');
    }

    const processingTime = Date.now() - startTime;
    const tokensUsed = completion.usage?.total_tokens || 0;

    logger.info('Relatório Concierge gerado com sucesso', {
      processingTime,
      tokensUsed,
      model: 'gpt-4'
    }, 'OpenAIService');

    return {
      content: response,
      html: formatReportAsHTML(response, formData),
      metadata: {
        processingTime,
        tokensUsed,
        model: 'gpt-4'
      }
    };

  } catch (error) {
    logger.error('Erro ao gerar relatório Concierge', error as Error, {
      destination: formData.destination,
      travelType: formData.travelType
    }, 'OpenAIService');
    
    throw new Error(`Erro na geração do relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// Construir prompt estruturado para a IA
function buildConciergePrompt(data: ConciergeFormData, durationDays: number): string {
  const travelTypeText = travelTypeTranslations[data.travelType];
  const budgetText = budgetTranslations[data.budget];
  const interestsText = data.interests.join(', ');
  const childrenText = data.children > 0 ? ` e ${data.children} criança(s)` : '';
  
  return `
Crie um relatório completo de concierge para a seguinte viagem:

**INFORMAÇÕES DO CLIENTE:**
- Nome: ${data.clientName}
- Destino: ${data.destination}
- Período: ${formatDate(data.checkin)} a ${formatDate(data.checkout)} (${durationDays} dias)
- Tipo de viagem: ${travelTypeText}
- Orçamento: ${budgetText}
- Viajantes: ${data.adults} adulto(s)${childrenText}
${data.hotel ? `- Hotel: ${data.hotel}` : ''}
${data.address ? `- Endereço: ${data.address}` : ''}
- Interesses: ${interestsText}
${data.observations ? `- Observações especiais: ${data.observations}` : ''}

**ESTRUTURA DO RELATÓRIO (HTML SEMÂNTICO):**

<h2>📋 Resumo Executivo</h2>
<p>Overview personalizado da viagem (100-150 palavras). Destaque as principais experiências. Seja acolhedor e inspire confiança.</p>

<h2>🌍 ${data.destination}: Informações Essenciais</h2>
<h3>Clima e Melhor Época</h3>
<p>Clima atual, estações, temperaturas esperadas</p>
<h3>Informações Práticas</h3>
<ul>
  <li><strong>Moeda:</strong> [moeda local] e taxas de câmbio</li>
  <li><strong>Fuso Horário:</strong> [diferença horária]</li>
  <li><strong>Idioma:</strong> [idioma principal] + dicas de comunicação</li>
  <li><strong>Documentação:</strong> visto, vacinas, etc.</li>
</ul>

<h2>📅 Roteiro Dia-a-Dia (${durationDays} dias)</h2>
<p>Crie um roteiro balanceado para cada dia, considerando:</p>
<ul>
  <li>Interesses: ${interestsText}</li>
  <li>Tipo de viagem: ${travelTypeText}</li>
  <li>Orçamento: ${budgetText}</li>
  <li>Logística e deslocamentos eficientes</li>
</ul>
<div class="tip">💡 <strong>Dica:</strong> Inclua tempos de deslocamento e períodos de descanso</div>

<h2>🍽️ Experiências Gastronômicas</h2>
<h3>Restaurantes Premium</h3>
<ul><li>[Nome] - [Especialidade] - [Faixa de preço]</li></ul>
<h3>Jóias Locais</h3>
<ul><li>[Restaurantes autênticos e cafés especiais]</li></ul>
<div class="highlight">⭐ Destaque pratos imperdíveis e dicas de reserva</div>

<h2>🎯 Atrações Imperdíveis</h2>
<p>Baseadas nos interesses (${interestsText}):</p>
<ul>
  <li><strong>[Atração]:</strong> Horário, preço, melhor momento, tempo sugerido</li>
</ul>

<h2>✨ Experiências Exclusivas</h2>
<p>Experiências únicas adaptadas ao tipo ${travelTypeText} e orçamento ${budgetText}:</p>
<ul>
  <li>[Experiência diferenciada com detalhes de agendamento]</li>
</ul>

<h2>🚗 Transporte e Mobilidade</h2>
<ul>
  <li>Do aeroporto ao hotel</li>
  <li>Transporte local (táxi, uber, transporte público)</li>
  <li>Aluguel de carro (se relevante)</li>
</ul>

<h2>⚠️ Dicas de Segurança</h2>
<div class="warning">
  <p>Precauções importantes, áreas a evitar, contatos de emergência</p>
</div>

<h2>💼 Checklist Final</h2>
<ul>
  <li>[ ] Documentação</li>
  <li>[ ] Reservas confirmadas</li>
  <li>[ ] Seguro viagem</li>
  <li>[ ] Adaptadores de tomada</li>
</ul>

**IMPORTANTE:**
- Retorne APENAS o HTML do conteúdo (sem tags html, head, body)
- Use h2 para seções principais, h3 para subsecões
- Use classes .highlight para destaques, .tip para dicas, .warning para avisos
- Seja MUITO específico para ${data.destination}
- Adapte TUDO ao orçamento ${budgetText} e tipo ${travelTypeText}
- Inclua informações reais e atualizadas
- Use emojis nos títulos para tornar visualmente atraente
`;
}

// Formatar data para exibição
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// Converter resposta da IA em HTML estruturado
function formatReportAsHTML(content: string, formData: ConciergeFormData): string {
  // Extrair apenas o conteúdo do body se a IA retornou HTML completo
  let cleanContent = content;
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    cleanContent = bodyMatch[1];
  }
  
  // Se a IA já retornou HTML bem formatado, usar com estilos premium
  if (cleanContent.includes('<h2>') || cleanContent.includes('<h3>') || cleanContent.includes('<div>')) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Concierge - ${formData.destination}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            line-height: 1.7; 
            color: #1e293b; 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 40px 20px;
            font-size: 15px;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
        }
        
        .header {
            background: linear-gradient(135deg, #FF7A1A 0%, #FF5A00 100%);
            color: white;
            padding: 48px 40px;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(30%, -30%);
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .header h1 { 
            font-size: 32px; 
            font-weight: 700;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
        }
        
        .header-meta {
            font-size: 16px;
            font-weight: 500;
            opacity: 0.95;
            margin-bottom: 8px;
        }
        
        .header-client {
            font-size: 14px;
            opacity: 0.85;
            font-weight: 400;
        }
        
        .content {
            padding: 40px;
        }
        
        h2 { 
            color: #FF7A1A; 
            font-size: 24px;
            font-weight: 700;
            margin-top: 40px;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #FF7A1A;
            letter-spacing: -0.3px;
        }
        
        h2:first-child {
            margin-top: 0;
        }
        
        h3 { 
            color: #0f172a; 
            font-size: 19px;
            font-weight: 600;
            margin-top: 28px;
            margin-bottom: 14px;
            letter-spacing: -0.2px;
        }
        
        h4 {
            color: #334155;
            font-size: 16px;
            font-weight: 600;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        
        p { 
            margin: 14px 0; 
            color: #334155;
            line-height: 1.8;
        }
        
        ul, ol { 
            margin: 16px 0;
            padding-left: 28px;
        }
        
        li { 
            margin: 10px 0;
            color: #475569;
            line-height: 1.7;
        }
        
        li strong {
            color: #1e293b;
            font-weight: 600;
        }
        
        strong, b {
            color: #0f172a;
            font-weight: 600;
        }
        
        .highlight, .section-highlight, [class*="destaque"] { 
            background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
            padding: 20px 24px;
            border-left: 5px solid #FF7A1A;
            margin: 24px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(255, 122, 26, 0.08);
        }
        
        .tip, .dica, [class*="tip"] {
            background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
            padding: 16px 20px;
            border-left: 4px solid #3B82F6;
            margin: 20px 0;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .warning, .aviso, [class*="warning"] {
            background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
            padding: 16px 20px;
            border-left: 4px solid #F59E0B;
            margin: 20px 0;
            border-radius: 6px;
            font-size: 14px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            background: white;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            overflow: hidden;
        }
        
        th {
            background: #f8fafc;
            color: #0f172a;
            font-weight: 600;
            padding: 14px 16px;
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
        }
        
        td {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f5f9;
            color: #475569;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        .footer {
            background: #f8fafc;
            text-align: center;
            color: #64748b;
            padding: 32px 40px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
        }
        
        .footer strong {
            color: #FF7A1A;
            font-weight: 600;
        }
        
        /* Responsividade */
        @media (max-width: 768px) {
            body {
                padding: 20px 10px;
            }
            
            .header, .content, .footer {
                padding: 24px 20px;
            }
            
            .header h1 {
                font-size: 26px;
            }
            
            h2 {
                font-size: 21px;
            }
            
            h3 {
                font-size: 17px;
            }
        }
        
        /* Melhoria de impressão */
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>Relatório de Concierge Premium</h1>
                <div class="header-meta">${formData.destination} • ${travelTypeTranslations[formData.travelType]} • ${budgetTranslations[formData.budget]}</div>
                <div class="header-client">Preparado para: ${formData.clientName}</div>
            </div>
        </div>
        <div class="content">
            ${cleanContent}
        </div>
        <div class="footer">
            <p>Relatório gerado por <strong>IA</strong> • Sete Mares Concierge Premium</p>
            <p style="margin-top: 8px; font-size: 13px; opacity: 0.8;">Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Se não for HTML, converter texto em HTML com formatação premium
  // Converter markdown-like para HTML
  let formattedContent = cleanContent
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  formattedContent = `<p>${formattedContent}</p>`;
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Concierge - ${formData.destination}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            line-height: 1.7; 
            color: #1e293b; 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 40px 20px;
            font-size: 15px;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
        }
        
        .header {
            background: linear-gradient(135deg, #FF7A1A 0%, #FF5A00 100%);
            color: white;
            padding: 48px 40px;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(30%, -30%);
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .header h1 { 
            font-size: 32px; 
            font-weight: 700;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
        }
        
        .header-meta {
            font-size: 16px;
            font-weight: 500;
            opacity: 0.95;
            margin-bottom: 8px;
        }
        
        .header-client {
            font-size: 14px;
            opacity: 0.85;
            font-weight: 400;
        }
        
        .content {
            padding: 40px;
        }
        
        p { 
            margin: 14px 0; 
            color: #334155;
            line-height: 1.8;
        }
        
        strong {
            color: #0f172a;
            font-weight: 600;
        }
        
        em {
            font-style: italic;
            color: #475569;
        }
        
        .footer {
            background: #f8fafc;
            text-align: center;
            color: #64748b;
            padding: 32px 40px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
        }
        
        .footer strong {
            color: #FF7A1A;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>Relatório de Concierge Premium</h1>
                <div class="header-meta">${formData.destination} • ${travelTypeTranslations[formData.travelType]} • ${budgetTranslations[formData.budget]}</div>
                <div class="header-client">Preparado para: ${formData.clientName}</div>
            </div>
        </div>
        <div class="content">
            ${formattedContent}
        </div>
        <div class="footer">
            <p>Relatório gerado por <strong>IA</strong> • Sete Mares Concierge Premium</p>
            <p style="margin-top: 8px; font-size: 13px; opacity: 0.8;">Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
    </div>
</body>
</html>`;
}
