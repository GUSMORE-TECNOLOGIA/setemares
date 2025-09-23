import { createClient } from '@supabase/supabase-js';

// Usando as credenciais diretamente para resolver o problema
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Teste de conexão
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('airports').select('id').limit(1);
    console.log('Supabase connection test:', !error ? 'OK' : 'FAILED', error);
    return !error;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return false;
  }
}
