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
// Desabilita automaticamente se a API key for um placeholder ou vazia
function isValidApiKey(key: string | undefined): boolean {
  if (!key) return false;
  // Considera placeholder se começa com 'your-' ou 'sk-your-' ou vazio
  const placeholderPatterns = ['your-', 'sk-your-', ''];
  return !placeholderPatterns.some(pattern => key.startsWith(pattern));
}

const rawApiKey = getEnv('OPENAI_API_KEY');
const shouldEnableConcierge = getEnv('USE_AI_CONCIERGE', 'true').toLowerCase() === 'true';
const hasValidApiKey = isValidApiKey(rawApiKey);

export const OPENAI_CONFIG = {
  apiKey: hasValidApiKey ? rawApiKey : '',
  // Só habilita se USE_AI_CONCIERGE=true E tiver uma API key válida
  enabled: shouldEnableConcierge && hasValidApiKey,
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

  // Não valida OPENAI_API_KEY - se inválida, o Concierge é automaticamente desabilitado
  // Isso permite que o app funcione sem a API key do OpenAI

  return {
    valid: errors.length === 0,
    errors,
  };
}

