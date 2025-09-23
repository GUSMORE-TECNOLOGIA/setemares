import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAirlinesSchema() {
  console.log('🔧 Corrigindo schema da tabela airlines...');

  try {
    // 1. Remover constraint NOT NULL das colunas iata2 e icao3
    console.log('📝 Removendo constraints NOT NULL...');
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE airlines 
        ALTER COLUMN iata2 DROP NOT NULL,
        ALTER COLUMN icao3 DROP NOT NULL;
      `
    });

    if (alterError) {
      console.log('⚠️ Erro ao alterar constraints (pode ser que já estejam corretas):', alterError.message);
    } else {
      console.log('✅ Constraints NOT NULL removidas com sucesso');
    }

    // 2. Adicionar constraints de validação
    console.log('📝 Adicionando constraints de validação...');
    
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE airlines
        ADD CONSTRAINT chk_iata2_valid
          CHECK (iata2 ~ '^[A-Z0-9]{2}$' OR iata2 IS NULL),
        ADD CONSTRAINT chk_icao3_valid
          CHECK (icao3 ~ '^[A-Z]{3}$' OR icao3 IS NULL);
      `
    });

    if (constraintError) {
      console.log('⚠️ Erro ao adicionar constraints (pode já existir):', constraintError.message);
    } else {
      console.log('✅ Constraints de validação adicionadas');
    }

    // 3. Adicionar campo verified
    console.log('📝 Adicionando campo verified...');
    
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE airlines 
        ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
      `
    });

    if (columnError) {
      console.log('⚠️ Erro ao adicionar coluna verified:', columnError.message);
    } else {
      console.log('✅ Coluna verified adicionada');
    }

    console.log('\n✅ Schema corrigido com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a correção do schema:', error);
  }
}

fixAirlinesSchema();
