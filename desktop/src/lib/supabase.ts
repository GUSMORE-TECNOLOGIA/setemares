import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are not configured');
}

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
