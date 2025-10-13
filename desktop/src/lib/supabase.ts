import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dgverpbhxtslmfrrcwwj.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs";

console.log('Frontend Supabase URL:', supabaseUrl ? 'Configurado' : 'Não configurado');
console.log('Frontend Supabase Key:', supabaseAnonKey ? 'Configurado' : 'Não configurado');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
