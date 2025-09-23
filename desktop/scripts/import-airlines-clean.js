import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

// Configuração do Supabase
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BATCH_SIZE = 50;

// Função para limpar o banco de companhias
async function cleanAirlines() {
    console.log('🧹 Limpando tabela de companhias...');
    
    const { error } = await supabase
        .from('airlines')
        .delete()
        .neq('id', 0);
    
    if (error) {
        console.error('❌ Erro ao limpar banco:', error);
        return false;
    }
    
    console.log('✅ Banco limpo com sucesso!');
    return true;
}

// Função para validar IATA
function isValidIATA(iata) {
    return iata && iata.length === 2 && /^[A-Z0-9]{2}$/.test(iata);
}

// Função para validar ICAO
function isValidICAO(icao) {
    return icao && icao.length === 3 && /^[A-Z]{3}$/.test(icao);
}

// Função para processar o arquivo
async function processFile() {
    console.log('📊 Processando arquivo Companhias.txt...');
    
    const fileContent = await fs.readFile('../Companhias.txt', 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    const airlines = [];
    const seenIATA = new Set();
    const seenICAO = new Set();
    
    for (const line of lines) {
        try {
            const parts = line.split(',');
            if (parts.length < 8) continue;
            
            const name = parts[1]?.replace(/"/g, '') || '';
            const iata2 = parts[3]?.replace(/"/g, '').replace(/\\N/g, '') || '';
            const icao3 = parts[4]?.replace(/"/g, '').replace(/\\N/g, '') || '';
            const country = parts[6]?.replace(/"/g, '') || '';
            const active = parts[7]?.replace(/"/g, '') === 'Y';
            
            if (!name || name === 'Unknown') continue;
            
            // Validar e normalizar IATA
            let normalizedIata2 = null;
            if (iata2 && iata2 !== '-' && iata2 !== 'N/A') {
                const cleanIata = iata2.toUpperCase().trim();
                if (isValidIATA(cleanIata) && !seenIATA.has(cleanIata)) {
                    normalizedIata2 = cleanIata;
                    seenIATA.add(cleanIata);
                }
            }
            
            // Validar e normalizar ICAO
            let normalizedIcao3 = null;
            if (icao3 && icao3 !== '-' && icao3 !== 'N/A') {
                const cleanIcao = icao3.toUpperCase().trim();
                if (isValidICAO(cleanIcao) && !seenICAO.has(cleanIcao)) {
                    normalizedIcao3 = cleanIcao;
                    seenICAO.add(cleanIcao);
                }
            }
            
            airlines.push({
                iata2: normalizedIata2,
                icao3: normalizedIcao3,
                name: name.trim(),
                country: country.trim(),
                aliases: null,
                active: active,
                created_at: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Erro ao processar linha:', line, error);
        }
    }
    
    console.log(`📊 Processadas ${airlines.length} companhias válidas`);
    console.log(`📊 IATA únicos: ${seenIATA.size}`);
    console.log(`📊 ICAO únicos: ${seenICAO.size}`);
    
    return airlines;
}

// Função para importar em lotes
async function importBatch(data, batchNumber) {
    const { error } = await supabase.from('airlines').insert(data);
    
    if (error) {
        console.error(`❌ Erro no lote ${batchNumber}:`, error.message);
        return false;
    }
    
    console.log(`✅ Lote ${batchNumber} importado (${data.length} companhias)`);
    return true;
}

// Função para importar todas as companhias
async function importAllAirlines(airlines) {
    console.log(`\n📤 Importando ${airlines.length} companhias em lotes de ${BATCH_SIZE}...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < airlines.length; i += BATCH_SIZE) {
        const batch = airlines.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        
        const success = await importBatch(batch, batchNumber);
        if (success) {
            successCount += batch.length;
        } else {
            errorCount += batch.length;
        }
    }
    
    console.log(`\n📊 Resumo da importação:`);
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
}

// Função para verificar resultados
async function verifyResults() {
    console.log('\n📊 Verificando importação...');
    
    const { data: totalCount } = await supabase
        .from('airlines')
        .select('id', { count: 'exact' });
    
    const { data: brazilianCount } = await supabase
        .from('airlines')
        .select('id', { count: 'exact' })
        .eq('country', 'Brazil');
    
    const { data: activeCount } = await supabase
        .from('airlines')
        .select('id', { count: 'exact' })
        .eq('active', true);
    
    console.log(`📋 Total de companhias: ${totalCount?.length || 0}`);
    console.log(`🇧🇷 Companhias brasileiras: ${brazilianCount?.length || 0}`);
    console.log(`✅ Companhias ativas: ${activeCount?.length || 0}`);
    
    // Mostrar algumas companhias brasileiras
    const { data: brazilianAirlines } = await supabase
        .from('airlines')
        .select('iata2, icao3, name, active')
        .eq('country', 'Brazil')
        .order('iata2')
        .limit(15);
    
    console.log('\n📋 Companhias brasileiras importadas:');
    brazilianAirlines?.forEach(airline => {
        console.log(`   ${airline.iata2 || '—'}/${airline.icao3 || '—'}: ${airline.name} (${airline.active ? 'Ativa' : 'Inativa'})`);
    });
}

// Função principal
async function main() {
    try {
        console.log('🚀 Iniciando importação limpa de companhias...\n');
        
        // 1. Limpar banco
        const cleaned = await cleanAirlines();
        if (!cleaned) {
            console.error('❌ Falha na limpeza. Abortando...');
            return;
        }
        
        // 2. Processar arquivo
        const airlines = await processFile();
        
        // 3. Importar dados
        await importAllAirlines(airlines);
        
        // 4. Verificar resultados
        await verifyResults();
        
        console.log('\n🎉 Importação concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a importação:', error);
    }
}

main();
