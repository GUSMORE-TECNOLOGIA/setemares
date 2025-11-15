/**
 * Utilitários de clima
 */

const { safeFetchJson } = require('./http-helpers');
const { setCache, getCache } = require('./cache');
const { isoDateRange } = require('./date-helpers');

// Carregar médias históricas
const weatherAverages = require('../../assets/weather-averages.json');

function weatherCodeToText(code) {
  const map = {
    0: 'Céu limpo', 1: 'Principalmente limpo', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Nevoeiro', 48: 'Nevoeiro com gelo', 51: 'Garoa fraca', 53: 'Garoa', 55: 'Garoa forte',
    61: 'Chuva fraca', 63: 'Chuva', 65: 'Chuva forte', 71: 'Neve fraca', 73: 'Neve', 75: 'Neve forte',
    80: 'Aguaceiros fracos', 81: 'Aguaceiros', 82: 'Aguaceiros fortes', 95: 'Trovoadas'
  };
  return map[code] || 'Condição variável';
}

async function fetchWeatherWithWeatherAPI(supabase, lat, lon, startISO, endISO) {
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

async function fetchWeatherRange(supabase, lat, lon, startISO, endISO) {
  const cacheKey = `weather:${lat}:${lon}:${startISO}:${endISO}`;
  const cached = await getCache(supabase, cacheKey);
  if (cached) return cached;

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
    
    const weatherAPIData = await fetchWeatherWithWeatherAPI(supabase, lat, lon, startISO, endISO);
    if (weatherAPIData && weatherAPIData.length > 0) {
      console.log('=== WEATHER SOURCE ===', { source: 'WeatherAPI', success: true, count: weatherAPIData.length });
      weatherSource = 'WeatherAPI';
      days = weatherAPIData;
    } else {
      console.log('=== WEATHER SOURCE ===', { source: 'Historical', success: true });
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

  days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  await setCache(supabase, cacheKey, days);
  return days;
}

module.exports = {
  fetchWeatherRange,
  fetchWeatherWithWeatherAPI,
  weatherCodeToText
};

