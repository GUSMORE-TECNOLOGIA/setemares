/**
 * Configuração centralizada do servidor
 * Todas as variáveis de ambiente devem ser validadas aqui
 */

require('dotenv').config();

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória não configurada: ${key}\n` +
      `Por favor, configure no arquivo .env`
    );
  }
  return value;
}

function getEnv(key, defaultValue = '') {
  return process.env[key] || defaultValue;
}

// Supabase Configuration
const SUPABASE_CONFIG = {
  url: requireEnv('VITE_SUPABASE_URL'),
  anonKey: requireEnv('VITE_SUPABASE_ANON_KEY'),
};

// OpenAI Configuration (opcional)
const OPENAI_CONFIG = {
  apiKey: getEnv('OPENAI_API_KEY'),
  enabled: getEnv('USE_AI_CONCIERGE', 'true').toLowerCase() === 'true',
};

// Concierge Configuration
const CONCIERGE_CONFIG = {
  cacheTtlMinutes: parseInt(getEnv('CACHE_TTL_MIN', '360'), 10),
  useAI: OPENAI_CONFIG.enabled,
};

// Security Configuration
const SECURITY_CONFIG = {
  // CORS: Lista de origens permitidas (separadas por vírgula)
  allowedOrigins: getEnv('CORS_ALLOWED_ORIGINS', 'https://sete-mares.app.br,http://localhost:5173').split(',').map(s => s.trim()),
  // Rate Limiting: Limite global de requisições por janela
  rateLimitGlobal: parseInt(getEnv('RATE_LIMIT_GLOBAL', '100'), 10),
  rateLimitWindowMs: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10), // 15 minutos
  // Rate Limiting por endpoint
  rateLimitConcierge: parseInt(getEnv('RATE_LIMIT_CONCIERGE', '10'), 10), // 10 req/15min para Concierge
  rateLimitPdf: parseInt(getEnv('RATE_LIMIT_PDF', '20'), 10), // 20 req/15min para PDF
  // Ambiente
  environment: getEnv('NODE_ENV', 'development'),
  // Anti-bruteforce: Limite de tentativas falhadas
  bruteforceMaxAttempts: parseInt(getEnv('BRUTEFORCE_MAX_ATTEMPTS', '5'), 10),
  bruteforceWindowMs: parseInt(getEnv('BRUTEFORCE_WINDOW_MS', '900000'), 10), // 15 minutos
};

// Validação de configuração
function validateConfig() {
  const errors = [];

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

  if (errors.length > 0) {
    console.error('❌ Erros de configuração:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPor favor, configure as variáveis de ambiente no arquivo .env');
    process.exit(1);
  }

  console.log('✅ Configuração validada com sucesso');
  console.log(`   Supabase URL: ${SUPABASE_CONFIG.url ? 'Configurado' : 'Não configurado'}`);
  console.log(`   OpenAI: ${OPENAI_CONFIG.enabled ? 'Habilitado' : 'Desabilitado'}`);
}

module.exports = {
  SUPABASE_CONFIG,
  OPENAI_CONFIG,
  CONCIERGE_CONFIG,
  SECURITY_CONFIG,
  validateConfig,
};

