/**
 * Utilitários HTTP (timeout, safe fetch)
 */

function withTimeout(promise, ms, label = 'request') {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
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

module.exports = {
  withTimeout,
  safeFetchJson
};



