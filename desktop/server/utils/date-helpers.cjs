/**
 * Utilitários de data, distância e timezone
 */

function isoDateRange(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

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

function toRad(v) {
  return (v * Math.PI) / 180;
}

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

module.exports = {
  isoDateRange,
  getCityTimezone,
  calculateDistance,
  distanceKm,
  toRad,
  parseTimeToMin,
  formatMinToTime,
  timeInBlock
};



