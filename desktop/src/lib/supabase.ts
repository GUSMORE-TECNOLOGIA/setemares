import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, validateConfig } from './config';

// Validar configuração no carregamento do módulo
const configValidation = validateConfig();
if (!configValidation.valid) {
  console.error('❌ Erros de configuração no frontend:');
  configValidation.errors.forEach(error => console.error(`  - ${error}`));
  throw new Error('Configuração inválida. Verifique as variáveis de ambiente.');
}

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

export async function testSupabaseConnection() {
  try {
    const { error } = await supabase.from('airports').select('id').limit(1);
    if (error) {
      console.error('Supabase connection failed', error);
    }
    return !error;
  } catch (err) {
    console.error('Supabase connection error', err);
    return false;
  }
}
