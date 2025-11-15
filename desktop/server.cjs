// Carregar variáveis de ambiente
require('dotenv').config();

// Carregar configuração centralizada
const { SUPABASE_CONFIG, OPENAI_CONFIG, CONCIERGE_CONFIG, SECURITY_CONFIG, validateConfig } = require('./server-config.cjs');

// Validar configuração no startup
validateConfig();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cors = require("cors");
const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
const { validateConciergeForm, validatePdfGeneration, validateDateRange } = require('./server-validation');

// Importar módulos utilitários modulares
const { setCache, getCache } = require('./server/utils/cache');
const { safeFetchJson } = require('./server/utils/http-helpers');
const { geocodeDestination, geocodeAddress } = require('./server/utils/geocoding');
const { 
  isoDateRange, 
  getCityTimezone, 
  calculateDistance, 
  distanceKm, 
  parseTimeToMin, 
  formatMinToTime, 
  timeInBlock 
} = require('./server/utils/date-helpers');
const { fetchWeatherRange } = require('./server/utils/weather');

// Importar rotas modulares
const { registerPdfRoutes } = require('./server/routes/pdf');
const { registerConciergeRoutes } = require('./server/routes/concierge');

// Carregar datasets locais
const bhPlaces = require('./assets/bh-places.json');
const weatherAverages = require('./assets/weather-averages.json');

const app = express();

// Logs b�sicos
app.use(morgan("combined"));

// Seguran�a de headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Rate limit global (reduzido conforme plano: 300 → 100 req/15min)
const globalLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.rateLimitWindowMs,
  max: SECURITY_CONFIG.rateLimitGlobal,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições. Tente novamente em alguns minutos.',
  skip: (req) => {
    // Health check não conta no rate limit
    return req.path === '/health';
  },
});
app.use(globalLimiter);

// Rate limit específico para Concierge (proteção anti-bruteforce)
const conciergeLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.rateLimitWindowMs,
  max: SECURITY_CONFIG.rateLimitConcierge,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Limite de requisições para Concierge excedido. Tente novamente em alguns minutos.',
  skipSuccessfulRequests: false, // Contar todas as requisições, mesmo as bem-sucedidas
});

// Rate limit específico para PDF
const pdfLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.rateLimitWindowMs,
  max: SECURITY_CONFIG.rateLimitPdf,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Limite de geração de PDF excedido. Tente novamente em alguns minutos.',
});

// CORS com validação dinâmica baseada em ambiente
const isProduction = SECURITY_CONFIG.environment === 'production';
const ALLOWED_ORIGINS = SECURITY_CONFIG.allowedOrigins;

app.use(
  cors({
    origin(origin, cb) {
      // Em desenvolvimento, permitir requisições sem origin (ex: Postman, curl)
      if (!origin) {
        if (isProduction) {
          return cb(new Error("CORS: Origin obrigatório em produção"), false);
        }
        return cb(null, true);
      }

      // Validar origem
      if (ALLOWED_ORIGINS.includes(origin)) {
        return cb(null, true);
      }

      // Em produção, rejeitar origens não permitidas
      if (isProduction) {
        console.warn(`[CORS] Origem bloqueada: ${origin}`);
        return cb(new Error("CORS not allowed"), false);
      }

      // Em desenvolvimento, permitir localhost em qualquer porta
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        console.log(`[CORS] Permitindo localhost em desenvolvimento: ${origin}`);
        return cb(null, true);
      }

      // Rejeitar outras origens
      console.warn(`[CORS] Origem não permitida: ${origin}`);
      return cb(new Error("CORS not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
  })
);

app.use(express.json({ limit: "1mb" }));

// Inicializar Supabase com configuração validada
// Configuração carregada de server-config.js (validação já feita no require)
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

app.get("/health", (_req, res) => res.json({ ok: true }));

// =============================
// Utilidades e Infra (cache/log)
// =============================
const FEATURE_USE_AI = CONCIERGE_CONFIG.useAI;
const DEFAULT_CACHE_TTL_MIN = CONCIERGE_CONFIG.cacheTtlMinutes;

// Funções hashKey e outras ainda locais (podem ser extraídas depois)
function hashKey(obj) {
  try {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
    let h = 0, i, chr;
    for (i = 0; i < str.length; i++) { chr = str.charCodeAt(i); h = ((h << 5) - h) + chr; h |= 0; }
    return `k_${Math.abs(h)}`;
  } catch {
    return `k_${Date.now()}`;
  }
}

// Wrapper para cache que aceita supabase
const cacheWrapper = {
  async set(key, payload, ttlMin = DEFAULT_CACHE_TTL_MIN) {
    return setCache(supabase, key, payload, ttlMin);
  },
  async get(key) {
    return getCache(supabase, key);
  }
};

// =============
// Connectors
// =============
// Funções geocodeDestination e geocodeAddress agora são importadas do módulo geocoding.js
// Wrapper local para manter compatibilidade com chamadas existentes
const geocodeWrapper = {
  async destination(query) {
    return geocodeDestination(supabase, query);
  },
  async address(addr, city) {
    return geocodeAddress(supabase, addr, city);
  }
};

// Função isoDateRange agora importada do módulo date-helpers.js

// Funções de clima agora estão em server/utils/weather.js
// fetchWeatherRange e fetchWeatherWithWeatherAPI foram movidas para o módulo

// Places (Google/Foursquare) – aqui retornaremos apenas estrutura básica se não houver chaves
async function searchRestaurants(lat, lon, city, country, intents = { fine: true, localGems: true }) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const cacheKey = `places:rest:${lat}:${lon}:${city}:${country}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  
  let results = [];
  let source = 'MockBH';
  
  if (key) {
    try {
      console.log('=== PLACES SOURCE ===', { source: 'GoogleAPI', type: 'restaurants', lat, lon, city });
      
      const radius = 6000; // prioriza proximidade
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=restaurant&opennow=true&key=${key}`;
      const json = await safeFetchJson(url, {}, 'places-rest');
      
      if (json.error_message) {
        console.log('Google Places API error:', json.error_message);
      } else if (json.results && json.results.length > 0) {
        source = 'GoogleAPI';
        results = json.results.slice(0, 12).map(r => ({
          placeId: r.place_id,
          name: r.name,
          address: r.vicinity,
          rating: r.rating,
          price: r.price_level,
        }));
      }
    } catch (err) {
      console.error('Google Places API error:', err);
    }
  }
  
  // Fallback para Belo Horizonte se Google API falhar ou retornar poucos resultados
  if (results.length < 3 && city.toLowerCase().includes('belo horizonte')) {
    console.log('=== PLACES SOURCE ===', { source: 'MockBH', type: 'restaurants', count: bhPlaces.restaurants.length });
    source = 'MockBH';
    results = bhPlaces.restaurants.map(r => ({
      placeId: `mock_${r.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: r.name,
      address: r.address,
      rating: r.rating,
      price: r.price_range,
      cuisine: r.cuisine,
      signature_dish: r.signature_dish,
      chef: r.chef,
      coordinates: r.coordinates
    }));
  }
  
  console.log('=== PLACES FINAL ===', { source, type: 'restaurants', count: results.length });
  await setCache(cacheKey, results, 60); // 1h
  return results;
}

async function searchNightlife(lat, lon, city) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const cacheKey = `places:night:${lat}:${lon}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  
  let results = [];
  let source = 'MockBH';
  
  if (key) {
    try {
      console.log('=== PLACES SOURCE ===', { source: 'GoogleAPI', type: 'nightlife', lat, lon, city });
      
      const radius = 6000;
      const types = ['bar', 'night_club'];
      const all = await Promise.all(types.map(t => safeFetchJson(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${t}&opennow=true&key=${key}`, {}, `places-${t}`)));
      
      let googleResults = all.flatMap(j => (j.results || []));
      if (googleResults.length > 0) {
        source = 'GoogleAPI';
        results = googleResults.slice(0, 10).map(r => ({ 
          placeId: r.place_id, 
          name: r.name, 
          address: r.vicinity, 
          rating: r.rating 
        }));
      }
    } catch (err) {
      console.error('Google Places API error (nightlife):', err);
    }
  }
  
  // Fallback para Belo Horizonte se Google API falhar ou retornar poucos resultados
  if (results.length < 2 && city.toLowerCase().includes('belo horizonte')) {
    console.log('=== PLACES SOURCE ===', { source: 'MockBH', type: 'nightlife', count: bhPlaces.nightlife.length });
    source = 'MockBH';
    results = bhPlaces.nightlife.map(n => ({
      placeId: `mock_${n.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: n.name,
      address: n.address,
      rating: 4.5,
      type: n.type,
      specialty: n.specialty,
      vibe: n.vibe,
      coordinates: n.coordinates
    }));
  }
  
  console.log('=== PLACES FINAL ===', { source, type: 'nightlife', count: results.length });
  await setCache(cacheKey, results, 60);
  return results;
}

async function fetchEvents(city, startISO, endISO) {
  const token = process.env.EVENTBRITE_TOKEN;
  const cacheKey = `events:${city}:${startISO}:${endISO}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  let events = [];
  if (token) {
    try {
      const start = new Date(startISO).toISOString();
      const end = new Date(endISO).toISOString();
      const url = `https://www.eventbriteapi.com/v3/events/search/?location.address=${encodeURIComponent(city)}&start_date.range_start=${encodeURIComponent(start)}&start_date.range_end=${encodeURIComponent(end)}&sort_by=date`;
      const json = await safeFetchJson(url, { headers: { Authorization: `Bearer ${token}` } }, 'events');
      events = (json.events || []).slice(0, 8).map(e => ({
        id: e.id,
        name: e.name?.text,
        start: e.start?.local,
        url: e.url,
        venue: e.venue_id,
      }));
    } catch (_err) {}
  }
  await setCache(cacheKey, events, 60);
  return events;
}

// Consulados – carrega de assets; se não existir, retorna vazio
const fs = require('fs');
const path = require('path');
function loadConsulates() {
  try {
    const p = path.join(__dirname, '..', 'assets', 'consulates.json');
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw);
  } catch { return {}; }
}
const CONSULATES = loadConsulates();

function lookupConsulate(countryCode) {
  return CONSULATES[countryCode] || null;
}

// Info prática via RestCountries
async function fetchPracticalInfo(country, city) {
  try {
    const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fields=currencies,languages,timezones,idd`;
    const json = await safeFetchJson(url, {}, 'restcountries');
    const best = Array.isArray(json) && json[0];
    if (!best) return null;
    
    const currencyCode = best.currencies ? Object.keys(best.currencies)[0] : undefined;
    const currencyName = currencyCode ? best.currencies[currencyCode]?.name : undefined;
    const languageName = best.languages ? Object.values(best.languages)[0] : undefined;
    const timezones = best.timezones || [];
    
    // Usar helper para timezone correto
    const timezone = getCityTimezone(city, country, timezones);
    
    return {
      currency: currencyCode ? `${currencyCode} (${currencyName || ''})`.trim() : undefined,
      language: languageName,
      timezone,
      tipping: country.toLowerCase() === 'brasil' ? 'Gorjeta opcional (10%), não obrigatória' : 'Gorjeta varia por país (10–15%)',
      power: 'Verifique o padrão de tomada local (tipo e voltagem)'
    };
  } catch (err) {
    console.error('fetchPracticalInfo error:', err);
    return null; 
  }
}

// Atrações turísticas (tourist_attraction, museum, park)
async function searchAttractions(lat, lon) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const cacheKey = `places:attr:${lat}:${lon}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  let results = [];
  if (key) {
    try {
      const radius = 8000;
      const types = ['tourist_attraction', 'museum', 'park'];
      const calls = await Promise.all(types.map(t => safeFetchJson(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${t}&opennow=false&key=${key}`, {}, `places-${t}`)));
      results = calls.flatMap(j => (j.results || [])).slice(0, 24).map(r => ({
        placeId: r.place_id,
        name: r.name,
        address: r.vicinity,
        rating: r.rating,
        types: r.types,
        geometry: r.geometry?.location || null
      }));
    } catch (_err) {}
  }
  await setCache(cacheKey, results, 60);
  return results;
}

// Funções distanceKm, parseTimeToMin, formatMinToTime, timeInBlock agora estão em server/utils/date-helpers.js

// Itinerário simples: distribui restaurantes e eventos ao longo dos dias
function buildItinerary(days, params) {
  const { centerLat, centerLon, hotelName, restaurants, nightlife, events, attractions, formData } = params;
  const freeBlocks = Array.isArray(formData.freeTimeBlocks) ? formData.freeTimeBlocks : [];
  const startMin = parseTimeToMin(formData.morningStart || '09:00') ?? 540;
  const endMin = parseTimeToMin(formData.eveningEnd || '22:00') ?? 1320;

  // Helper choose nearest and pop
  function pickNearest(list) {
    if (!Array.isArray(list) || list.length === 0) return null;
    const withDist = list.map((x, i) => {
      const lat = x.geometry?.lat ?? x.lat;
      const lon = x.geometry?.lng ?? x.lon;
      const dist = distanceKm(centerLat, centerLon, lat, lon) ?? 0;
      return { idx: i, item: { ...x, distanceKm: dist } };
    }).sort((a,b) => a.item.distanceKm - b.item.distanceKm);
    const chosen = withDist[0];
    if (!chosen) return null;
    list.splice(chosen.idx, 1);
    return chosen.item;
  }

  function slotOrFree(mins, filler) {
    const isFree = freeBlocks.some(b => timeInBlock(mins, b));
    if (isFree) return { time: formatMinToTime(mins), items: [], note: 'Horas livres' };
    return filler();
  }

  const lunchTime = Math.min(Math.max(12*60+30, startMin + 150), Math.max(startMin + 180, endMin - 360));
  const dinnerTime = Math.max(19*60+30, Math.min(endMin - 180, 21*60));
  const morningTime = Math.min(startMin + 60, lunchTime - 120);
  const afternoonTime = Math.min(lunchTime + 180, dinnerTime - 120);
  const eveningTime = Math.min(dinnerTime + 120, endMin);

  return days.map(d => {
    const day = {
      date: d.date,
      weather: { min: d.min, max: d.max, condition: d.condition },
      hotel_breakfast: {
        time: formatMinToTime(startMin),
        items: [ { name: hotelName || 'Café no hotel', address: formData.address || '', note: 'Início do dia' } ]
      },
      morning: slotOrFree(morningTime, () => {
        const spot = pickNearest(attractions);
        return { time: formatMinToTime(morningTime), items: spot ? [ { name: spot.name, address: spot.address, distanceKm: spot.distanceKm } ] : [] };
      }),
      lunch: slotOrFree(lunchTime, () => {
        const r = pickNearest(restaurants);
        return { time: formatMinToTime(lunchTime), items: r ? [ { name: r.name, address: r.address, price: r.price, distanceKm: r.distanceKm } ] : [] };
      }),
      afternoon: slotOrFree(afternoonTime, () => {
        // prefer event in afternoon
        let ev = null;
        if (Array.isArray(events)) {
          ev = events.find(e => e.start && new Date(e.start).toISOString().slice(0,10) === d.date);
        }
        if (ev) return { time: formatMinToTime(afternoonTime), items: [ { name: ev.name, note: 'Evento', when: ev.start, url: ev.url } ] };
        const spot = pickNearest(attractions);
        return { time: formatMinToTime(afternoonTime), items: spot ? [ { name: spot.name, address: spot.address, distanceKm: spot.distanceKm } ] : [] };
      }),
      dinner: slotOrFree(dinnerTime, () => {
        const r = pickNearest(restaurants);
        return { time: formatMinToTime(dinnerTime), items: r ? [ { name: r.name, address: r.address, price: r.price, distanceKm: r.distanceKm } ] : [] };
      }),
      evening: slotOrFree(eveningTime, () => {
        // prefer nightlife; if event late, include
        let chosen = pickNearest(nightlife);
        if (!chosen && Array.isArray(events)) {
          const eLate = events.find(e => e.start && new Date(e.start).toISOString().slice(0,10) === d.date);
          if (eLate) return { time: formatMinToTime(eveningTime), items: [ { name: eLate.name, note: 'Evento', when: eLate.start, url: eLate.url } ] };
        }
        return { time: formatMinToTime(eveningTime), items: chosen ? [ { name: chosen.name, address: chosen.address, distanceKm: chosen.distanceKm } ] : [] };
      }),
      free_time: freeBlocks
    };
    return day;
  });
}

// Composição JSON consolidado
function composeReportJson(ctx) {
  return {
    context: ctx.context || undefined,
    summary: ctx.summary,
    currency_timezone_language: ctx.practical && {
      currency: ctx.practical.currency,
      timezone: ctx.practical.timezone,
      language: ctx.practical.language,
    },
    practical: {
      tipping: ctx.practical?.tipping,
      power: ctx.practical?.power,
      transport: 'Sugestões de transporte serão adaptadas conforme o destino (táxi, app, metrô)'
    },
    daily_itinerary: ctx.itinerary,
    restaurants: ctx.restaurants,
    nightlife: ctx.nightlife,
    events: ctx.events,
    exclusive_experiences: [],
    safety_tips: [ 'Mantenha documentos em local seguro', 'Use cofres do hotel', 'Evite áreas pouco movimentadas à noite' ],
    cultural_tips: [ 'Respeite costumes locais', 'Aprenda cumprimentos básicos no idioma local' ],
    consulate: ctx.consulate,
    sources: ctx.sources
  };
}

// Renderização com IA: transforma JSON em HTML interno e aplica template premium
async function renderHtmlWithAI(reportJson, formData) {
  const start = Date.now();
  let model = 'gpt-4o-mini';
  let tokens = 0;
  try {
    const OpenAI = require('openai');
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
    
    const user = `Dados estruturados (JSON):\n\n${JSON.stringify(reportJson, null, 2)}\n\nContexto do cliente/destino: ${formData.clientName} em ${formData.destination} (${formData.checkin} a ${formData.checkout}), tipo ${formData.travelType}, orçamento ${formData.budget}.`;
    const completion = await client.chat.completions.create({
      model,
      messages: [ { role: 'system', content: sys }, { role: 'user', content: user } ],
      temperature: 0.6,
      max_tokens: 3000
    });
    const inner = completion.choices?.[0]?.message?.content || '';
    tokens = completion.usage?.total_tokens || 0;
    const html = premiumWrapper(inner, formData);
    const processingTime = Date.now() - start;
    console.log('=== AI RENDERING ===', { model, tokens, time_ms: processingTime });
    return { html, model, tokens, content: inner };
  } catch (err) {
    console.error('AI rendering error:', err);
    // fallback: gerar HTML básico a partir do JSON
    const inner = `<h2>Resumo Executivo</h2><p>${reportJson.summary || 'Relatório personalizado'}</p>`;
    const html = premiumWrapper(inner, formData);
    return { html, model, tokens, content: inner };
  } finally {
    // no-op
  }
}

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
        .day-card { margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .day-header { background: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
        .day-title { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
        .day-weather { font-size: 14px; color: #64748b; }
        .day-body { padding: 20px; }
        .time-slot { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
        .time-slot:last-child { border-bottom: none; margin-bottom: 0; }
        .time-label { font-size: 14px; color: #FF7A1A; font-weight: 700; margin-bottom: 8px; }
        .activity-name { font-size: 15px; color: #1e293b; font-weight: 600; margin-bottom: 4px; }
        .activity-details { font-size: 13px; color: #64748b; margin-left: 12px; margin-top: 2px; }
        .place-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; margin-bottom: 12px; }
        .place-name { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
        .place-address { font-size: 13px; color: #64748b; margin-bottom: 4px; }
        .place-info { font-size: 13px; color: #6b7280; font-style: italic; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,.08); border-radius: 8px; overflow: hidden; }
        th { background: #f8fafc; color: #0f172a; font-weight: 600; padding: 14px 16px; text-align: left; border-bottom: 2px solid #e2e8f0; }
        td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #475569; }
        tr:last-child td { border-bottom: none; }
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

async function generatePremiumPipeline(formData) {
  const t0 = Date.now();
  const sources = [];
  // geocode (destino e hotel) - usando módulo extraído
  const geo = await geocodeDestination(supabase, formData.destination);
  if (!geo) throw new Error('Destino inválido ou não encontrado');
  const hotelGeo = await geocodeAddress(supabase, formData.address, geo.city || formData.destination);
  // weather - usando módulo extraído
  const weather = await fetchWeatherRange(supabase, geo.lat, geo.lon, formData.checkin, formData.checkout);
  sources.push({ type: 'weather', provider: 'open-meteo' });
  // places
  const centerLat = hotelGeo?.lat ?? geo.lat;
  const centerLon = hotelGeo?.lon ?? geo.lon;
  console.log('=== GEOCODING ===', { city: geo.city, lat: geo.lat, lon: geo.lon });
  
  const restaurants = await searchRestaurants(centerLat, centerLon, geo.city || formData.destination, geo.country);
  const nightlife = await searchNightlife(centerLat, centerLon, geo.city || formData.destination);
  const attractions = await searchAttractions(centerLat, centerLon);
  if (restaurants.length) sources.push({ type: 'restaurants', provider: process.env.GOOGLE_MAPS_API_KEY ? 'google-places' : 'mock-bh' });
  if (nightlife.length) sources.push({ type: 'nightlife', provider: process.env.GOOGLE_MAPS_API_KEY ? 'google-places' : 'mock-bh' });
  // events
  const events = await fetchEvents(geo.city || formData.destination, formData.checkin, formData.checkout);
  if (events.length) sources.push({ type: 'events', provider: 'eventbrite' });
  // practical
  const practical = await fetchPracticalInfo(geo.country || '', geo.city || '');
  if (practical) sources.push({ type: 'practical', provider: 'restcountries' });
  // consulate
  const consulate = lookupConsulate(geo.countryCode);
  if (consulate) sources.push({ type: 'consulate', provider: 'assets.consulates' });
  // itinerary
  const days = isoDateRange(formData.checkin, formData.checkout).map(d => ({ date: d }));
  const byDateWeather = weather.map(w => ({ date: w.date, min: w.min, max: w.max, condition: w.condition }));
  const merged = days.map(d => Object.assign({}, d, byDateWeather.find(w => w.date === d.date))); // may carry undefined
  const itinerary = buildItinerary(merged, {
    centerLat, centerLon,
    hotelName: formData.hotel,
    restaurants: [...restaurants],
    nightlife: [...nightlife],
    events: [...events],
    attractions: [...attractions],
    formData
  });
  // summary
  const summary = `${formData.clientName} realizará viagem ${formData.travelType} para ${formData.destination} (${formData.checkin} a ${formData.checkout}), considerando interesses ${formData.interests?.join(', ') || 'gerais'} e orçamento ${formData.budget}.`;
  const consolidated = composeReportJson({
    context: {
      destination: formData.destination,
      checkin: formData.checkin,
      checkout: formData.checkout,
      travelType: formData.travelType,
      budget: formData.budget,
      lat: geo.lat,
      lon: geo.lon,
      city: geo.city,
      country: geo.country,
      countryCode: geo.countryCode,
    },
    summary,
    practical,
    itinerary,
    restaurants,
    nightlife,
    events,
    consulate,
    sources
  });
  const render = FEATURE_USE_AI ? await renderHtmlWithAI(consolidated, formData) : { html: premiumWrapper('<h2>Relatório</h2><p>Conteúdo não processado por IA.</p>', formData), model: 'none', tokens: 0, content: '' };
  const processingTime = Date.now() - t0;
  return {
    report: {
      content: render.content,
      html: render.html,
      metadata: { processingTime, tokensUsed: render.tokens, model: render.model }
    },
    enriched_json: consolidated,
    sources,
  };
}

// =============================
// Funções de Geração (ainda no server.cjs - podem ser extraídas depois)
// =============================
// Estas funções ainda estão aqui e precisam ser definidas antes das rotas

// Função para gerar relatório de concierge (versão simplificada)
function generateConciergeReport(formData) {
  const startTime = Date.now();
  
  // Calcular duração da estadia
  const checkinDate = new Date(formData.checkin);
  const checkoutDate = new Date(formData.checkout);
  const durationDays = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Gerar relatório HTML simples
  const reportContent = `
# Relatório de Concierge - ${formData.destination}

## Informações do Cliente
- **Nome:** ${formData.clientName}
- **Destino:** ${formData.destination}
- **Período:** ${formData.checkin} a ${formData.checkout} (${durationDays} dias)
- **Tipo de viagem:** ${formData.travelType}
- **Orçamento:** ${formData.budget}
- **Viajantes:** ${formData.adults} adulto(s)${formData.children > 0 ? ` e ${formData.children} criança(s)` : ''}
${formData.hotel ? `- **Hotel:** ${formData.hotel}` : ''}
${formData.address ? `- **Endereço:** ${formData.address}` : ''}
- **Interesses:** ${formData.interests.join(', ')}
${formData.observations ? `- **Observações:** ${formData.observations}` : ''}

## Resumo Executivo
Este relatório foi gerado para ${formData.clientName} para uma viagem ${formData.travelType} para ${formData.destination} com orçamento ${formData.budget}. A viagem terá duração de ${durationDays} dias e incluirá atividades baseadas nos interesses: ${formData.interests.join(', ')}.

## Recomendações Gerais
- Reserve com antecedência para garantir disponibilidade
- Considere o clima local durante o período da viagem
- Verifique documentação necessária para o destino
- Prepare-se para experiências culturais únicas

## Próximos Passos
1. Confirmar reservas de hospedagem
2. Verificar documentação de viagem
3. Planejar atividades específicas
4. Organizar transporte local
`;

  const reportHtml = `
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
        h2:first-child { margin-top: 0; }
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
        li strong { color: #1e293b; font-weight: 600; }
        strong, b { color: #0f172a; font-weight: 600; }
        .highlight {
            background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
            padding: 20px 24px;
            border-left: 5px solid #FF7A1A;
            margin: 24px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(255, 122, 26, 0.08);
        }
        .tip {
            background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
            padding: 16px 20px;
            border-left: 4px solid #3B82F6;
            margin: 20px 0;
            border-radius: 6px;
            font-size: 14px;
        }
        .warning {
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
        tr:last-child td { border-bottom: none; }
        .footer {
            background: #f8fafc;
            text-align: center;
            color: #64748b;
            padding: 32px 40px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
        }
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
                <div class="header-meta">${formData.destination} • ${({lua_de_mel:'Lua de Mel',familia:'Família',negocios:'Negócios',aventura:'Aventura',cultural:'Cultural',gastronomico:'Gastronômico',relaxamento:'Relaxamento'})[formData.travelType] || formData.travelType} • ${({economico:'Econômico',confortavel:'Confortável',premium:'Premium',luxo:'Luxo'})[formData.budget] || formData.budget}</div>
                <div class="header-client">Preparado para: ${formData.clientName}</div>
            </div>
        </div>
        <div class="content">
            ${reportContent.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}
        </div>
        <div class="footer">
            <p>Relatório gerado por <strong>IA</strong> • Sete Mares Concierge Premium</p>
            <p style="margin-top: 8px; font-size: 13px; opacity: 0.8;">Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
    </div>
</body>
</html>`;

  const processingTime = Date.now() - startTime;
  
  return {
    content: reportContent,
    html: reportHtml,
    metadata: {
      processingTime,
      tokensUsed: 0,
      model: 'local-generator'
    }
  };
}

// Função para gerar relatório de concierge com dados enriquecidos (fallback robusto)
function generateConciergeReportEnriched(formData) {
  const startTime = Date.now();
  
  // Calcular duração da estadia
  const checkinDate = new Date(formData.checkin);
  const checkoutDate = new Date(formData.checkout);
  const durationDays = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Gerar itinerário dia a dia simulado
  const daily_itinerary = [];
  for (let i = 0; i < durationDays; i++) {
    const date = new Date(checkinDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    
    daily_itinerary.push({
      date: dateStr,
      weather: { min: 18, max: 28, condition: 'Ensolarado' },
      hotel_breakfast: {
        time: '08:00',
        items: [{ name: formData.hotel || 'Hotel', note: 'Café da manhã incluído' }]
      },
      morning: {
        time: '09:30',
        items: [{ name: `Atração turística em ${formData.destination}`, address: 'Centro histórico', distanceKm: 2.5 }]
      },
      lunch: {
        time: '12:30',
        items: [{ name: 'Restaurante local recomendado', address: 'Região central', price: 3, distanceKm: 1.2 }]
      },
      afternoon: {
        time: '15:00',
        items: [{ name: 'Passeio cultural', address: formData.destination, distanceKm: 3.1 }]
      },
      dinner: {
        time: '19:30',
        items: [{ name: 'Jantar especial', address: 'Área gastronômica', price: 4, distanceKm: 2.8 }]
      },
      evening: {
        time: '21:00',
        items: [{ name: 'Bar panorâmico', address: `${formData.destination} - Centro`, distanceKm: 1.5 }]
      }
    });
  }
  
  // Restaurantes simulados
  const restaurants = [
    { 
      name: 'Restaurante Premium', 
      address: `${formData.destination} - Centro`, 
      rating: 4.5, 
      price: 4, 
      cuisine: 'Internacional',
      signature_dish: 'Pratos da culinária local',
      chef: 'Chef renomado local'
    },
    { 
      name: 'Bistrô Local', 
      address: `${formData.destination} - Bairro histórico`, 
      rating: 4.3, 
      price: 3, 
      cuisine: 'Regional',
      signature_dish: 'Especialidade regional',
      chef: 'Chef tradicional'
    },
    { 
      name: 'Café Gourmet', 
      address: `${formData.destination}`, 
      rating: 4.7, 
      price: 2, 
      cuisine: 'Café e lanches',
      signature_dish: 'Café artesanal',
      chef: 'Barista especializado'
    }
  ];
  
  // Vida noturna simulada
  const nightlife = [
    { 
      name: 'Bar Panorâmico', 
      address: `${formData.destination}`, 
      type: 'Bar', 
      vibe: 'Sofisticado',
      specialty: 'Coquetéis premium',
      rating: 4.4
    },
    { 
      name: 'Lounge Musical', 
      address: `${formData.destination}`, 
      type: 'Lounge', 
      vibe: 'Relaxante',
      specialty: 'Música ao vivo',
      rating: 4.2
    },
    { 
      name: 'Casa de Shows', 
      address: `${formData.destination}`, 
      type: 'Casa de show', 
      vibe: 'Animado',
      specialty: 'Shows locais',
      rating: 4.6
    }
  ];
  
  // Dados enriquecidos estruturados
  const enriched_json = {
    context: {
      destination: formData.destination,
      checkin: formData.checkin,
      checkout: formData.checkout,
      travelType: formData.travelType,
      budget: formData.budget,
      clientName: formData.clientName,
      adults: formData.adults || 1,
      children: formData.children || 0,
      hotel: formData.hotel,
      address: formData.address
    },
    summary: `${formData.clientName} realizará viagem ${formData.travelType} para ${formData.destination} (${formData.checkin} a ${formData.checkout}), com orçamento ${formData.budget}. Este relatório foi gerado localmente com dados simulados e inclui sugestões de atividades, restaurantes e atrações para cada dia da viagem.`,
    currency_timezone_language: {
      currency: 'BRL (Real Brasileiro)',
      timezone: 'UTC-03:00',
      language: 'Português'
    },
    practical: {
      tipping: 'Gorjeta opcional (10%), não obrigatória',
      power: 'Tomadas padrão brasileiro (tipo N, 127V/220V)',
      transport: 'Táxi, Uber, transporte público disponível'
    },
    daily_itinerary,
    restaurants,
    nightlife,
    events: [],
    safety_tips: [
      'Mantenha documentos em local seguro',
      'Use cofres do hotel',
      'Evite áreas pouco movimentadas à noite',
      'Tenha sempre um telefone de emergência',
      'Informe ao hotel sobre seus planos diários'
    ],
    cultural_tips: [
      'Respeite costumes locais',
      'Aprenda cumprimentos básicos',
      'Vista-se adequadamente ao visitar locais religiosos',
      'Seja respeitoso com tradições locais',
      'Experimente a culinária regional'
    ],
    consulate: null,
    sources: [{ type: 'local-generator', provider: 'mock-data' }]
  };
  
  // Gerar HTML (reutilizar a função premiumWrapper existente)
  const reportHtml = premiumWrapper(
    `<h2>Resumo Executivo</h2><p>${enriched_json.summary}</p><h2>Informações da Viagem</h2><p>Viagem ${formData.travelType} para ${formData.destination} com duração de ${durationDays} dias. Orçamento ${formData.budget} para ${formData.adults || 1} adulto(s)${formData.children > 0 ? ` e ${formData.children} criança(s)` : ''}.</p>`,
    formData
  );
  
  const processingTime = Date.now() - startTime;
  
  return {
    report: {
      content: enriched_json.summary,
      html: reportHtml,
      metadata: {
        processingTime,
        tokensUsed: 0,
        model: 'local-generator-enriched'
      }
    },
    enriched_json,
    sources: enriched_json.sources
  };
}

// Endpoint para gerar relatório de Concierge (com rate limiting específico)
// Rota /api/concierge/generate agora está em server/routes/concierge.js
// Código removido - usando registerConciergeRoutes

// =============================
// Registrar Rotas Modulares
// =============================
// PDF Routes - usando módulo extraído
registerPdfRoutes(app, pdfLimiter, validatePdfGeneration);

// Concierge Routes - usando módulo extraído
registerConciergeRoutes(
  app,
  supabase,
  conciergeLimiter,
  validateConciergeForm,
  validateDateRange,
  generatePremiumPipeline, // definida acima
  generateConciergeReportEnriched, // definida acima
  FEATURE_USE_AI
);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const code = err.status || 500;
  res.status(code).json({ error: true, message: err.message || "Server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server up on :${PORT}`);
});
