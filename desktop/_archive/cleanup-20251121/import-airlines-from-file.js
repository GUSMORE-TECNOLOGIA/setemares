import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

// Configuração do Supabase
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BATCH_SIZE = 100;

// Função para limpar o banco de companhias
async function cleanAirlines() {
    console.log('🧹 Limpando tabela de companhias...');
    
    const { error } = await supabase
        .from('airlines')
        .delete()
        .neq('id', 0); // Deleta todos os registros
    
    if (error) {
        console.error('❌ Erro ao limpar banco:', error);
        return false;
    }
    
    console.log('✅ Banco limpo com sucesso!');
    return true;
}

// Função para processar o arquivo
async function processFile() {
    console.log('📊 Processando arquivo Companhias.txt...');
    
    const fileContent = await fs.readFile('../Companhias.txt', 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    const airlines = [];
    
    for (const line of lines) {
        try {
            // Parse da linha CSV
            const parts = line.split(',');
            if (parts.length < 8) continue;
            
            const id = parts[0];
            const name = parts[1]?.replace(/"/g, '') || '';
            const alias = parts[2]?.replace(/"/g, '') || '';
            const iata2 = parts[3]?.replace(/"/g, '').replace(/\\N/g, '') || '';
            const icao3 = parts[4]?.replace(/"/g, '').replace(/\\N/g, '') || '';
            const callsign = parts[5]?.replace(/"/g, '') || '';
            const country = parts[6]?.replace(/"/g, '') || '';
            const active = parts[7]?.replace(/"/g, '') === 'Y';
            
            // Validar dados
            if (!name || name === 'Unknown') continue;
            
            // Normalizar IATA e ICAO
            const normalizedIata2 = iata2 && iata2 !== '-' && iata2 !== 'N/A' && iata2.length === 2 
                ? iata2.toUpperCase() 
                : null;
            
            const normalizedIcao3 = icao3 && icao3 !== '-' && icao3 !== 'N/A' && icao3.length === 3 
                ? icao3.toUpperCase() 
                : null;
            
            airlines.push({
                iata2: normalizedIata2,
                icao3: normalizedIcao3,
                name: name.trim(),
                country: country.trim(),
                aliases: alias && alias !== '\\N' ? alias.trim() : null,
                active: active,
                created_at: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Erro ao processar linha:', line, error);
        }
    }
    
    console.log(`📊 Processadas ${airlines.length} companhias válidas`);
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
    
    for (let i = 0; i < airlines.length; i += BATCH_SIZE) {
        const batch = airlines.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        await importBatch(batch, batchNumber);
    }
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
        .limit(10);
    
    console.log('\n📋 Amostra de companhias brasileiras:');
    brazilianAirlines?.forEach(airline => {
        console.log(`   ${airline.iata2 || '—'}/${airline.icao3 || '—'}: ${airline.name} (${airline.active ? 'Ativa' : 'Inativa'})`);
    });
}

// Função principal
async function main() {
    try {
        console.log('🚀 Iniciando importação de companhias do arquivo...\n');
        
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
