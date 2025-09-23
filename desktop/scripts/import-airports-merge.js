import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

// Configuração do Supabase
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BATCH_SIZE = 50;

// Função para validar IATA
function isValidIATA(iata) {
    return iata && iata.length === 3 && /^[A-Z]{3}$/.test(iata);
}

// Função para validar ICAO
function isValidICAO(icao) {
    return icao && icao.length === 4 && /^[A-Z]{4}$/.test(icao);
}

// Função para processar o arquivo
async function processFile() {
    console.log('📊 Processando arquivo Aeroportos.txt...');
    
    const fileContent = await fs.readFile('../Aeroportos.txt', 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    const airports = [];
    const seenIATA = new Set();
    const seenICAO = new Set();
    
    for (const line of lines) {
        try {
            const parts = line.split(',');
            if (parts.length < 13) continue;
            
            const name = parts[1]?.replace(/"/g, '') || '';
            const city = parts[2]?.replace(/"/g, '') || '';
            const country = parts[3]?.replace(/"/g, '') || '';
            const iata = parts[4]?.replace(/"/g, '').replace(/\\N/g, '') || '';
            const icao = parts[5]?.replace(/"/g, '') || '';
            const latitude = parts[6] ? parseFloat(parts[6]) : null;
            const longitude = parts[7] ? parseFloat(parts[7]) : null;
            const elevation = parts[8] ? parseInt(parts[8]) : null;
            const timezoneOffset = parts[9] ? parseInt(parts[9]) : null;
            const dst = parts[10]?.replace(/"/g, '') || '';
            const timezone = parts[11]?.replace(/"/g, '') || '';
            const type = parts[12]?.replace(/"/g, '') || '';
            
            if (!name || !country) continue;
            
            // Validar e normalizar IATA
            let normalizedIata = null;
            if (iata && iata !== 'N/A') {
                const cleanIata = iata.toUpperCase().trim();
                if (isValidIATA(cleanIata) && !seenIATA.has(cleanIata)) {
                    normalizedIata = cleanIata;
                    seenIATA.add(cleanIata);
                }
            }
            
            // Validar e normalizar ICAO
            let normalizedIcao = null;
            if (icao && icao !== 'N/A') {
                const cleanIcao = icao.toUpperCase().trim();
                if (isValidICAO(cleanIcao) && !seenICAO.has(cleanIcao)) {
                    normalizedIcao = cleanIcao;
                    seenICAO.add(cleanIcao);
                }
            }
            
            // Usar IATA como city_iata se disponível
            const cityIata = normalizedIata || (normalizedIcao ? normalizedIcao.substring(0, 3) : null);
            
            airports.push({
                iata3: normalizedIata,
                icao4: normalizedIcao,
                name: name.trim(),
                city_iata: cityIata,
                country: country.trim(),
                tz: timezone || null,
                aliases: null,
                active: type === 'airport' && (normalizedIata || normalizedIcao) ? true : false,
                created_at: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Erro ao processar linha:', line, error);
        }
    }
    
    console.log(`📊 Processados ${airports.length} aeroportos válidos`);
    console.log(`📊 IATA únicos: ${seenIATA.size}`);
    console.log(`📊 ICAO únicos: ${seenICAO.size}`);
    
    return airports;
}

// Função para obter aeroportos existentes do banco
async function getExistingAirports() {
    console.log('📊 Obtendo aeroportos existentes do banco...');
    
    const { data: existingAirports, error } = await supabase
        .from('airports')
        .select('iata3, icao4, name, country');
    
    if (error) {
        console.error('❌ Erro ao buscar aeroportos existentes:', error);
        return new Set();
    }
    
    const existingIATAs = new Set();
    const existingICAOs = new Set();
    
    existingAirports.forEach(airport => {
        if (airport.iata3) existingIATAs.add(airport.iata3);
        if (airport.icao4) existingICAOs.add(airport.icao4);
    });
    
    console.log(`📊 Aeroportos existentes: ${existingAirports.length}`);
    console.log(`📊 IATA existentes: ${existingIATAs.size}`);
    console.log(`📊 ICAO existentes: ${existingICAOs.size}`);
    
    return { existingIATAs, existingICAOs, existingAirports };
}

// Função para filtrar aeroportos novos
function filterNewAirports(airports, existing) {
    console.log('🔍 Filtrando aeroportos novos...');
    
    const newAirports = airports.filter(airport => {
        const hasNewIATA = airport.iata3 && !existing.existingIATAs.has(airport.iata3);
        const hasNewICAO = airport.icao4 && !existing.existingICAOs.has(airport.icao4);
        
        return hasNewIATA || hasNewICAO;
    });
    
    console.log(`📊 Aeroportos novos encontrados: ${newAirports.length}`);
    
    return newAirports;
}

// Função para importar em lotes
async function importBatch(data, batchNumber) {
    const { error } = await supabase.from('airports').insert(data);
    
    if (error) {
        console.error(`❌ Erro no lote ${batchNumber}:`, error.message);
        return false;
    }
    
    console.log(`✅ Lote ${batchNumber} importado (${data.length} aeroportos)`);
    return true;
}

// Função para importar aeroportos novos
async function importNewAirports(airports) {
    console.log(`\n📤 Importando ${airports.length} aeroportos novos em lotes de ${BATCH_SIZE}...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < airports.length; i += BATCH_SIZE) {
        const batch = airports.slice(i, i + BATCH_SIZE);
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
    console.log('\n📊 Verificando resultados...');
    
    const { data: totalCount } = await supabase
        .from('airports')
        .select('id', { count: 'exact' });
    
    const { data: brazilianCount } = await supabase
        .from('airports')
        .select('id', { count: 'exact' })
        .eq('country', 'Brazil');
    
    const { data: activeCount } = await supabase
        .from('airports')
        .select('id', { count: 'exact' })
        .eq('active', true);
    
    console.log(`📋 Total de aeroportos: ${totalCount?.length || 0}`);
    console.log(`🇧🇷 Aeroportos brasileiros: ${brazilianCount?.length || 0}`);
    console.log(`✅ Aeroportos ativos: ${activeCount?.length || 0}`);
    
    // Mostrar alguns aeroportos brasileiros
    const { data: brazilianAirports } = await supabase
        .from('airports')
        .select('iata3, icao4, name, country')
        .eq('country', 'Brazil')
        .order('iata3')
        .limit(15);
    
    console.log('\n📋 Amostra de aeroportos brasileiros:');
    brazilianAirports?.forEach(airport => {
        console.log(`   ${airport.iata3 || '—'}/${airport.icao4 || '—'}: ${airport.name}`);
    });
}

// Função principal
async function main() {
    try {
        console.log('🚀 Iniciando importação inteligente de aeroportos...\n');
        
        // 1. Processar arquivo
        const airports = await processFile();
        
        // 2. Obter aeroportos existentes
        const existing = await getExistingAirports();
        
        // 3. Filtrar aeroportos novos
        const newAirports = filterNewAirports(airports, existing);
        
        if (newAirports.length === 0) {
            console.log('✅ Não há aeroportos novos para importar!');
            return;
        }
        
        // 4. Importar aeroportos novos
        await importNewAirports(newAirports);
        
        // 5. Verificar resultados
        await verifyResults();
        
        console.log('\n🎉 Importação concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a importação:', error);
    }
}

main();
