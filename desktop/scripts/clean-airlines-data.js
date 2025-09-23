import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Regex para validação
const IATA_REGEX = /^[A-Z0-9]{2}$/;
const ICAO_REGEX = /^[A-Z]{3}$/;

async function cleanAirlinesData() {
  console.log('🧹 Iniciando limpeza completa dos dados de companhias aéreas...');

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
    const invalidIATA = [];
    const invalidICAO = [];

    for (const airline of airlines) {
      try {
        const updates = {};

        // Validar e limpar IATA
        if (airline.iata2) {
          const cleanIATA = airline.iata2.trim().toUpperCase();
          if (IATA_REGEX.test(cleanIATA)) {
            updates.iata2 = cleanIATA;
          } else {
            console.log(`❌ IATA inválido: "${airline.iata2}" -> NULL`);
            invalidIATA.push(airline.iata2);
            updates.iata2 = null;
          }
        }

        // Validar e limpar ICAO
        if (airline.icao3) {
          const cleanICAO = airline.icao3.trim().toUpperCase();
          if (ICAO_REGEX.test(cleanICAO)) {
            updates.icao3 = cleanICAO;
          } else {
            console.log(`❌ ICAO inválido: "${airline.icao3}" -> NULL`);
            invalidICAO.push(airline.icao3);
            updates.icao3 = null;
          }
        }

        // Corrigir escape duplo no nome
        if (airline.name && airline.name.includes("\\'")) {
          updates.name = airline.name.replace(/\\'/g, "'");
          console.log(`🔧 Nome corrigido: "${airline.name}" -> "${updates.name}"`);
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

    console.log('\n✅ Limpeza concluída!');
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

    console.log('\n📋 Amostra dos dados limpos:');
    finalData.forEach(airline => {
      console.log(`   ${airline.iata2 || '—'} | ${airline.icao3 || '—'} | ${airline.name}`);
    });

    // 4. Verificar se ainda há dados inválidos
    const { data: invalidData, error: invalidError } = await supabase
      .from('airlines')
      .select('iata2, icao3, name')
      .or(`iata2.not.null,icao3.not.null`);

    if (invalidError) {
      throw invalidError;
    }

    const stillInvalidIATA = invalidData.filter(a => a.iata2 && !IATA_REGEX.test(a.iata2));
    const stillInvalidICAO = invalidData.filter(a => a.icao3 && !ICAO_REGEX.test(a.icao3));

    if (stillInvalidIATA.length > 0) {
      console.log('\n⚠️ Ainda há IATA inválidos:');
      stillInvalidIATA.forEach(a => console.log(`   "${a.iata2}" - ${a.name}`));
    }

    if (stillInvalidICAO.length > 0) {
      console.log('\n⚠️ Ainda há ICAO inválidos:');
      stillInvalidICAO.forEach(a => console.log(`   "${a.icao3}" - ${a.name}`));
    }

    if (stillInvalidIATA.length === 0 && stillInvalidICAO.length === 0) {
      console.log('\n🎉 Todos os dados estão válidos! Agora você pode executar as constraints no Supabase Dashboard.');
    }

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

cleanAirlinesData();
