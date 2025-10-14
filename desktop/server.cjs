// Carregar variáveis de ambiente
require('dotenv').config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cors = require("cors");
const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");

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

// Rate limit (ajuste por necessidade)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS restrito
const ALLOWED_ORIGINS = [
  "https://sete-mares.app.br",
  "http://localhost:5173",
];
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("CORS not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "1mb" }));

// Inicializar Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://dgverpbhxtslmfrrcwwj.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs";

console.log('Supabase URL:', supabaseUrl ? 'Configurado' : 'Não configurado');
console.log('Supabase Key:', supabaseKey ? 'Configurado' : 'Não configurado');

const supabase = createClient(supabaseUrl, supabaseKey);

app.get("/health", (_req, res) => res.json({ ok: true }));

// =============================
// Utilidades e Infra (cache/log)
// =============================
const FEATURE_USE_AI = (process.env.USE_AI_CONCIERGE || 'true').toLowerCase() !== 'false';
const DEFAULT_CACHE_TTL_MIN = parseInt(process.env.CACHE_TTL_MIN || '360', 10); // 6h

// cache em memória (fallback se tabela de cache não existir)
const memoryCache = new Map(); // key -> { payload, expiresAt }

function setMemoryCache(key, payload, ttlMin = DEFAULT_CACHE_TTL_MIN) {
  const expiresAt = Date.now() + ttlMin * 60 * 1000;
  memoryCache.set(key, { payload, expiresAt });
}

function getMemoryCache(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.payload;
}

async function setCache(key, payload, ttlMin = DEFAULT_CACHE_TTL_MIN) {
  try {
    // tentar supabase table concierge_sources_cache
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('concierge_sources_cache')
      .upsert({ key, payload, expires_at: expiresAt })
      .select()
      .single();
    if (error) throw error;
  } catch (_err) {
    setMemoryCache(key, payload, ttlMin);
  }
}

async function getCache(key) {
  try {
    const { data, error } = await supabase
      .from('concierge_sources_cache')
      .select('payload, expires_at')
      .eq('key', key)
      .single();
    if (error || !data) throw error || new Error('cache miss');
    if (new Date(data.expires_at).getTime() < Date.now()) return null;
    return data.payload;
  } catch (_err) {
    return getMemoryCache(key);
  }
}

function withTimeout(promise, ms, label = 'request') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)),
  ]);
}

async function safeFetchJson(url, opts = {}, label = 'fetch') {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts.timeout || 12000);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    if (!res.ok) throw new Error(`${label} ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

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

// Helper para timezone correto por cidade
function getCityTimezone(city, country, timezones) {
  // Mapa de cidades brasileiras para timezone correto
  const cityTimezoneMap = {
    'Belo Horizonte': 'UTC-03:00',
    'São Paulo': 'UTC-03:00', 
    'Rio de Janeiro': 'UTC-03:00',
    'Brasília': 'UTC-03:00',
    'Salvador': 'UTC-03:00',
    'Fortaleza': 'UTC-03:00',
    'Recife': 'UTC-03:00',
    'Manaus': 'UTC-04:00',
    'Porto Alegre': 'UTC-03:00',
    'Curitiba': 'UTC-03:00'
  };
  
  // Se temos mapeamento específico, usar
  if (cityTimezoneMap[city]) {
    return cityTimezoneMap[city];
  }
  
  // Para Brasil, usar UTC-03:00 (horário padrão)
  if (country === 'Brazil' || country === 'Brasil') {
    return 'UTC-03:00';
  }
  
  // Para outros países, usar a primeira timezone disponível
  if (timezones && timezones.length > 0) {
    return timezones[0];
  }
  
  return 'UTC+00:00'; // fallback
}

// Helper para calcular distância entre coordenadas
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// =============
// Connectors
// =============
async function geocodeDestination(query) {
  // Preferir Nominatim (sem chave) para lat/lon e país
  const cacheKey = `geo:${query}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
  const json = await safeFetchJson(url, { headers: { 'User-Agent': '7Mares-Concierge/1.0' } }, 'geocode');
  const best = Array.isArray(json) && json[0];
  if (!best) return null;
  const result = {
    lat: parseFloat(best.lat),
    lon: parseFloat(best.lon),
    displayName: best.display_name,
    city: best.address?.city || best.address?.town || best.address?.village || best.address?.state_district || '',
    state: best.address?.state || '',
    country: best.address?.country || '',
    countryCode: (best.address?.country_code || '').toUpperCase(),
  };
  await setCache(cacheKey, result, 7 * 24 * 60); // 7 dias
  return result;
}
// Geocodificar endereço do hotel (precisão maior para centralidade)
async function geocodeAddress(address, city) {
  if (!address && !city) return null;
  const q = [address, city].filter(Boolean).join(', ');
  const cacheKey = `geoaddr:${q}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`;
  const json = await safeFetchJson(url, { headers: { 'User-Agent': '7Mares-Concierge/1.0' } }, 'geocode-address');
  const best = Array.isArray(json) && json[0];
  if (!best) return null;
  const result = {
    lat: parseFloat(best.lat),
    lon: parseFloat(best.lon),
    displayName: best.display_name,
  };
  await setCache(cacheKey, result, 7 * 24 * 60);
  return result;
}


function isoDateRange(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// Clima: Open-Meteo (sem chave) fallback universal
// Função alternativa usando WeatherAPI
async function fetchWeatherWithWeatherAPI(lat, lon, startISO, endISO) {
  const apiKey = process.env.WEATHERAPI_KEY;
  if (!apiKey) {
    console.log('WeatherAPI key não configurada, usando fallback');
    return null;
  }

  try {
    const startDate = new Date(startISO).toISOString().slice(0, 10);
    const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=10&date=${startDate}`;
    
    console.log('=== WEATHER SOURCE ===', { source: 'WeatherAPI', lat, lon, startDate });
    
    const data = await safeFetchJson(url, {}, 'weather-api');
    
    if (!data?.forecast?.forecastday) {
      console.log('WeatherAPI: dados de previsão não encontrados');
      return null;
    }

    const days = [];
    const allDates = isoDateRange(startISO, endISO);
    
    for (const forecastDay of data.forecast.forecastday) {
      const date = forecastDay.date;
      const day = forecastDay.day;
      
      days.push({
        date: date,
        min: Math.round(day.mintemp_c),
        max: Math.round(day.maxtemp_c),
        condition: day.condition?.text || 'Parcialmente nublado'
      });
    }

    // Completar datas faltantes com médias históricas
    const have = new Set(days.map(d => d.date));
    for (const d of allDates) {
      if (!have.has(d)) {
        const month = new Date(d).getMonth() + 1;
        const cityData = weatherAverages['Belo Horizonte'] || weatherAverages['São Paulo'];
        if (cityData && cityData[month]) {
          days.push({
            date: d,
            min: cityData[month].temp_min,
            max: cityData[month].temp_max,
            condition: cityData[month].condition
          });
        } else {
          days.push({ date: d, min: 20, max: 28, condition: 'Parcialmente nublado' });
        }
      }
    }

    return days.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error('WeatherAPI error:', err);
    return null;
  }
}

async function fetchWeatherRange(lat, lon, startISO, endISO) {
  const cacheKey = `weather:${lat}:${lon}:${startISO}:${endISO}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  // Open-Meteo limita janelas; se exceder, vamos consultar o máximo possível e completar com fallback
  const startDate = new Date(startISO);
  const endDate = new Date(endISO);
  const allDates = isoDateRange(startISO, endISO);

  const tryFetch = async (s, e) => {
    const start = new Date(s).toISOString().slice(0, 10);
    const end = new Date(e).toISOString().slice(0, 10);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&start_date=${start}&end_date=${end}&timezone=auto`;
    return await safeFetchJson(url, {}, 'weather');
  };

  let days = [];
  let weatherSource = 'Historical';
  
  try {
    console.log('=== WEATHER SOURCE ===', { source: 'OpenMeteo', lat, lon, startISO, endISO });
    
    // Janela primária (até ~16 dias)
    const maxDays = 16;
    const windowEnd = new Date(startDate);
    windowEnd.setDate(windowEnd.getDate() + (maxDays - 1));
    const firstWindowEnd = windowEnd < endDate ? windowEnd : endDate;

    const data1 = await tryFetch(startDate, firstWindowEnd);
    const dates1 = data1?.daily?.time || [];
    const tmax1 = data1?.daily?.temperature_2m_max || [];
    const tmin1 = data1?.daily?.temperature_2m_min || [];
    const codes1 = data1?.daily?.weathercode || [];
    
    if (dates1.length > 0) {
      weatherSource = 'OpenMeteo';
      for (let i = 0; i < dates1.length; i++) {
        days.push({
          date: dates1[i],
          min: Math.round(tmin1[i]),
          max: Math.round(tmax1[i]),
          condition: weatherCodeToText(codes1[i])
        });
      }
    } else {
      throw new Error('OpenMeteo retornou dados vazios');
    }

  } catch (err) {
    console.error('OpenMeteo error:', err.message);
    
    // Tentar WeatherAPI como fallback
    const weatherAPIData = await fetchWeatherWithWeatherAPI(lat, lon, startISO, endISO);
    if (weatherAPIData && weatherAPIData.length > 0) {
      console.log('=== WEATHER SOURCE ===', { source: 'WeatherAPI', success: true, count: weatherAPIData.length });
      weatherSource = 'WeatherAPI';
      days = weatherAPIData;
    } else {
      console.log('=== WEATHER SOURCE ===', { source: 'Historical', success: true });
      // Fallback final: usar médias históricas
      weatherSource = 'Historical';
      days = allDates.map(d => {
        const month = new Date(d).getMonth() + 1;
        const cityData = weatherAverages['Belo Horizonte'] || weatherAverages['São Paulo'];
        if (cityData && cityData[month]) {
          return {
            date: d,
            min: cityData[month].temp_min,
            max: cityData[month].temp_max,
            condition: cityData[month].condition
          };
        }
        return { date: d, min: 20, max: 28, condition: 'Parcialmente nublado' };
      });
    }
  }

  console.log('=== WEATHER FINAL ===', { source: weatherSource, days_count: days.length });

  // Ordenar por data para consistência
  days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  await setCache(cacheKey, days);
  return days;
}

function weatherCodeToText(code) {
  const map = {
    0: 'Céu limpo', 1: 'Principalmente limpo', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Nevoeiro', 48: 'Nevoeiro com gelo', 51: 'Garoa fraca', 53: 'Garoa', 55: 'Garoa forte',
    61: 'Chuva fraca', 63: 'Chuva', 65: 'Chuva forte', 71: 'Neve fraca', 73: 'Neve', 75: 'Neve forte',
    80: 'Aguaceiros fracos', 81: 'Aguaceiros', 82: 'Aguaceiros fortes', 95: 'Trovoadas'
  };
  return map[code] || 'Condição variável';
}

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

function toRad(v) { return (v * Math.PI) / 180; }
function distanceKm(aLat, aLon, bLat, bLon) {
  if ([aLat, aLon, bLat, bLon].some(v => typeof v !== 'number')) return null;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return Math.round(R * c * 10) / 10;
}

function parseTimeToMin(hhmm) {
  if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(n => parseInt(n, 10));
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function formatMinToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeInBlock(mins, block) {
  if (!block || !block.includes('-')) return false;
  const [s, e] = block.split('-');
  const sm = parseTimeToMin(s);
  const em = parseTimeToMin(e);
  if (sm == null || em == null) return false;
  return mins >= sm && mins <= em;
}

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
  // geocode (destino e hotel)
  const geo = await geocodeDestination(formData.destination);
  if (!geo) throw new Error('Destino inválido ou não encontrado');
  const hotelGeo = await geocodeAddress(formData.address, geo.city || formData.destination);
  // weather
  const weather = await fetchWeatherRange(geo.lat, geo.lon, formData.checkin, formData.checkout);
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

app.post("/api/generate-pdf", async (req, res, next) => {
  try {
    const { htmlContent, filename } = req.body ?? {};

    if (!htmlContent || !filename) {
      const error = new Error("Missing htmlContent or filename");
      error.status = 400;
      throw error;
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent);

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// Regeneração parcial (na prática, reexecuta o pipeline com o contexto salvo)
app.post("/api/concierge/regenerate", async (req, res, next) => {
  try {
    const { reportId, type, date } = req.body || {};
    if (!reportId) return res.status(400).json({ error: true, message: 'reportId é obrigatório' });

    const { data: existing, error: fetchError } = await supabase
      .from('concierge_reports')
      .select('*')
      .eq('id', reportId)
      .single();
    if (fetchError || !existing) return res.status(404).json({ error: true, message: 'Relatório não encontrado' });

    // reconstruir formData mínimo a partir do contexto salvo
    let ctx = existing.enriched_json?.context || {};
    const formData = {
      clientName: existing.client_name || 'Cliente',
      destination: ctx.destination || existing.destination,
      checkin: ctx.checkin || existing.checkin,
      checkout: ctx.checkout || existing.checkout,
      travelType: ctx.travelType || existing.travel_type,
      budget: ctx.budget || existing.budget,
      adults: existing.adults || 1,
      children: existing.children || 0,
      hotel: existing.hotel || undefined,
      address: existing.address || undefined,
      interests: Array.isArray(existing.interests) ? existing.interests : [],
      observations: existing.observations || undefined,
    };

    const result = await generatePremiumPipeline(formData);

    // atualizar registro
    const { data: updated, error: updError } = await supabase
      .from('concierge_reports')
      .update({
        report_content: result.report.content,
        report_html: result.report.html,
        processing_time_ms: result.report.metadata.processingTime,
        openai_model: result.report.metadata.model,
        openai_tokens_used: result.report.metadata.tokensUsed,
        enriched_json: result.enriched_json,
        data_sources: result.sources,
        updated_at: new Date().toISOString(),
        status: 'generated'
      })
      .eq('id', reportId)
      .select()
      .single();
    if (updError) return res.status(500).json({ error: true, message: 'Erro ao atualizar relatório' });

    res.json({ success: true, report: {
      id: updated.id,
      content: result.report.content,
      html: result.report.html,
      metadata: result.report.metadata
    }, enriched: result.enriched_json });
  } catch (error) {
    console.error('Erro na regeneração:', error);
    next(error);
  }
});

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

// Endpoint para gerar relatório de Concierge
app.post("/api/concierge/generate", async (req, res, next) => {
  try {
    console.log('=== REQUEST BODY ===');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('===================');
    
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

    let report, enriched_json, sources;
    console.log('=== FEATURE_USE_AI ===', FEATURE_USE_AI);
    
    if (FEATURE_USE_AI) {
      try {
        console.log('=== TENTANDO PIPELINE IA ===');
        // Tentar pipeline premium com IA
        const result = await generatePremiumPipeline({
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
        console.log('=== PIPELINE IA SUCESSO ===', {
          hasReport: !!result.report,
          hasEnriched: !!result.enriched_json,
          enrichedKeys: result.enriched_json ? Object.keys(result.enriched_json) : 'null'
        });
        
        // Verificar se enriched_json é null ou vazio
        if (!result.enriched_json || Object.keys(result.enriched_json).length === 0) {
          console.warn('=== PIPELINE IA RETORNOU ENRICHED VAZIO, USANDO FALLBACK ===');
          throw new Error('Pipeline IA retornou enriched_json vazio');
        }
        
        report = result.report;
        enriched_json = result.enriched_json;
        sources = result.sources;
      } catch (aiError) {
        console.warn('=== PIPELINE IA FALHOU ===', aiError.message);
        console.warn('Stack trace:', aiError.stack);
        // Usar gerador local melhorado como fallback
        console.log('=== USANDO FALLBACK LOCAL ===');
        const localResult = generateConciergeReportEnriched({
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
        console.log('=== FALLBACK LOCAL SUCESSO ===', {
          hasReport: !!localResult.report,
          hasEnriched: !!localResult.enriched_json,
          enrichedKeys: localResult.enriched_json ? Object.keys(localResult.enriched_json) : 'null'
        });
        report = localResult.report;
        enriched_json = localResult.enriched_json;
        sources = localResult.sources;
      }
    } else {
      // Usar gerador local melhorado
      const localResult = generateConciergeReportEnriched({
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
      report = localResult.report;
      enriched_json = localResult.enriched_json;
      sources = localResult.sources;
    }

    // Salvar no Supabase (com fallback sem DB)
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
          status: 'generated',
          enriched_json: enriched_json || null,
          data_sources: sources || null
        })
        .select()
        .single();
      if (error) throw error;
      reportId = data?.id || null;
    } catch (dbErr) {
      console.error('=== ERRO SUPABASE (fallback sem DB) ===');
      console.error(dbErr);
      try {
        const { randomUUID } = require('crypto');
        reportId = randomUUID();
      } catch {
        reportId = `${Date.now()}`;
      }
    }

    console.log('=== RESPONSE FINAL ===', {
      hasReport: !!report,
      hasEnriched: !!enriched_json,
      enrichedKeys: enriched_json ? Object.keys(enriched_json) : 'null',
      enrichedType: typeof enriched_json
    });
    
    res.json({
      success: true,
      report: {
        id: reportId,
        content: report.content,
        html: report.html,
        metadata: report.metadata
      },
      enriched: enriched_json || null
    });

  } catch (error) {
    console.error('Erro no endpoint concierge:', error);
    next(error);
  }
});

// Endpoint para buscar histórico de relatórios
app.get("/api/concierge/history", async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const { data, error } = await supabase
      .from('concierge_reports')
      .select('id, created_at, client_name, destination, travel_type, budget, status')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return res.status(500).json({
        error: true,
        message: "Erro ao buscar histórico de relatórios"
      });
    }

    res.json({
      success: true,
      reports: data || []
    });

  } catch (error) {
    console.error('Erro no endpoint histórico:', error);
    next(error);
  }
});

// Endpoint para buscar relatório específico
app.get("/api/concierge/report/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('concierge_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar relatório:', error);
      return res.status(404).json({
        error: true,
        message: "Relatório não encontrado"
      });
    }

    res.json({
      success: true,
      report: data
    });

  } catch (error) {
    console.error('Erro no endpoint relatório:', error);
    next(error);
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const code = err.status || 500;
  res.status(code).json({ error: true, message: err.message || "Server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server up on :${PORT}`);
});
