/**
 * Configuração centralizada do sistema
 * Todas as variáveis de ambiente devem ser validadas aqui
 */

function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória não configurada: ${key}\n` +
      `Por favor, configure no arquivo .env`
    );
  }
  return value;
}

function getEnv(key: string, defaultValue?: string): string {
  const value = import.meta.env[key];
  return value || defaultValue || '';
}

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: requireEnv('VITE_SUPABASE_URL'),
  anonKey: requireEnv('VITE_SUPABASE_ANON_KEY'),
};

// OpenAI Configuration (opcional)
export const OPENAI_CONFIG = {
  apiKey: getEnv('OPENAI_API_KEY'),
  enabled: getEnv('USE_AI_CONCIERGE', 'true').toLowerCase() === 'true',
};

// Concierge Configuration
export const CONCIERGE_CONFIG = {
  cacheTtlMinutes: parseInt(getEnv('CACHE_TTL_MIN', '360'), 10),
  useAI: OPENAI_CONFIG.enabled,
};

// Validação de configuração
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    requireEnv('VITE_SUPABASE_URL');
  } catch (error) {
    errors.push('VITE_SUPABASE_URL é obrigatória');
  }

  try {
    requireEnv('VITE_SUPABASE_ANON_KEY');
  } catch (error) {
    errors.push('VITE_SUPABASE_ANON_KEY é obrigatória');
  }

  if (OPENAI_CONFIG.enabled && !OPENAI_CONFIG.apiKey) {
    errors.push('OPENAI_API_KEY é obrigatória quando USE_AI_CONCIERGE=true');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

