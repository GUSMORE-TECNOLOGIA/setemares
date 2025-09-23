import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAirlinesData() {
  console.log('🔧 Iniciando correção dos dados de companhias aéreas...');

  try {
    // 1. Buscar todas as companhias
    const { data: airlines, error: fetchError } = await supabase
      .from('airlines')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📊 Encontradas ${airlines.length} companhias para processar`);

    // 2. Processar cada companhia
    let updated = 0;
    let errors = 0;

    for (const airline of airlines) {
      try {
        const updates = {};

        // Limpar IATA inválido
        if (airline.iata2 && !/^[A-Z0-9]{2}$/.test(airline.iata2)) {
          console.log(`❌ IATA inválido: ${airline.iata2} -> NULL`);
          updates.iata2 = null;
        } else if (airline.iata2) {
          updates.iata2 = airline.iata2.trim().toUpperCase();
        }

        // Limpar ICAO inválido
        if (airline.icao3 && !/^[A-Z]{3}$/.test(airline.icao3)) {
          console.log(`❌ ICAO inválido: ${airline.icao3} -> NULL`);
          updates.icao3 = null;
        } else if (airline.icao3) {
          updates.icao3 = airline.icao3.trim().toUpperCase();
        }

        // Corrigir escape duplo no nome
        if (airline.name && airline.name.includes("\\'")) {
          updates.name = airline.name.replace(/\\'/g, "'");
          console.log(`🔧 Nome corrigido: ${airline.name} -> ${updates.name}`);
        } else if (airline.name) {
          updates.name = airline.name.trim();
        }

        // Normalizar país
        if (airline.country) {
          updates.country = airline.country.trim();
        }

        // Atualizar se houver mudanças
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('airlines')
            .update(updates)
            .eq('id', airline.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar ${airline.name}:`, updateError);
            errors++;
          } else {
            updated++;
          }
        }
      } catch (err) {
        console.error(`❌ Erro ao processar ${airline.name}:`, err);
        errors++;
      }
    }

    console.log('\n✅ Correção concluída!');
    console.log(`📊 Estatísticas:`);
    console.log(`   - Companhias atualizadas: ${updated}`);
    console.log(`   - Erros: ${errors}`);
    console.log(`   - Total processadas: ${airlines.length}`);

    // 3. Verificar resultado final
    const { data: finalData, error: finalError } = await supabase
      .from('airlines')
      .select('iata2, icao3, name')
      .limit(10);

    if (finalError) {
      throw finalError;
    }

    console.log('\n📋 Amostra dos dados corrigidos:');
    finalData.forEach(airline => {
      console.log(`   ${airline.iata2 || '—'} | ${airline.icao3 || '—'} | ${airline.name}`);
    });

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

fixAirlinesData();
