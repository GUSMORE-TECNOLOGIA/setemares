/**
 * Utilitários de cache (Supabase + memória)
 */

const DEFAULT_CACHE_TTL_MIN = 60; // 1 hora padrão

// Cache em memória (fallback se tabela de cache não existir)
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

async function setCache(supabase, key, payload, ttlMin = DEFAULT_CACHE_TTL_MIN) {
  try {
    // Tentar supabase table concierge_sources_cache
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

async function getCache(supabase, key) {
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

function hashKey(obj) {
  try {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
    let h = 0, i, chr;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      h = ((h << 5) - h) + chr;
      h |= 0;
    }
    return `k_${Math.abs(h)}`;
  } catch {
    return `k_${Date.now()}`;
  }
}

module.exports = {
  setCache,
  getCache,
  setMemoryCache,
  getMemoryCache,
  hashKey
};



