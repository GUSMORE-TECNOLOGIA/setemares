/**
 * Utilitários de geocodificação
 */

const { safeFetchJson } = require('./http-helpers.js');
const { setCache, getCache } = require('./cache.js');

/**
 * Geocodifica um destino (cidade/país)
 */
async function geocodeDestination(supabase, query) {
  // Preferir Nominatim (sem chave) para lat/lon e país
  const cacheKey = `geo:${query}`;
  const cached = await getCache(supabase, cacheKey);
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
  
  await setCache(supabase, cacheKey, result, 7 * 24 * 60); // 7 dias
  return result;
}

/**
 * Geocodifica um endereço de hotel (precisão maior para centralidade)
 */
async function geocodeAddress(supabase, address, city) {
  if (!address && !city) return null;
  const q = [address, city].filter(Boolean).join(', ');
  const cacheKey = `geoaddr:${q}`;
  const cached = await getCache(supabase, cacheKey);
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
  
  await setCache(supabase, cacheKey, result, 7 * 24 * 60);
  return result;
}

module.exports = {
  geocodeDestination,
  geocodeAddress
};

