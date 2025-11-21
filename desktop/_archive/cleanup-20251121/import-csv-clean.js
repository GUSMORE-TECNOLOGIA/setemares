import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse';
import fs from 'fs/promises';
import path from 'path';

// Configuração do Supabase
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BATCH_SIZE = 1000;

// Função para limpar o banco
async function cleanDatabase() {
    console.log('🧹 Limpando banco de dados...');
    console.log('⚠️  Execute manualmente o script 009_manual_clean.sql no Supabase Dashboard');
    console.log('⚠️  Pressione Enter após executar o script...');
    
    // Aguardar input do usuário
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        console.log('✅ Continuando com a importação...');
    });
    
    return true;
}

// Função para processar CSV
async function processCsv(filePath) {
    console.log(`📊 Processando arquivo: ${filePath}`);
    
    const csvContent = await fs.readFile(filePath, 'utf8');
    
    return new Promise((resolve, reject) => {
        parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        }, (err, records) => {
            if (err) reject(err);
            else resolve(records);
        });
    });
}

// Função para normalizar dados de aeroporto
function normalizeAirport(record) {
    return {
        iata3: record.iata_code && record.iata_code !== '\\N' ? record.iata_code.trim().toUpperCase() : null,
        icao4: record.icao_code && record.icao_code !== '\\N' ? record.icao_code.trim().toUpperCase() : null,
        name: record.name ? record.name.trim() : null,
        city_iata: record.iata_code && record.iata_code !== '\\N' ? record.iata_code.trim().toUpperCase() : null,
        country: record.iso_country ? record.iso_country.trim() : null,
        tz: record.timezone_offset ? record.timezone_offset.trim() : null,
        aliases: null,
        active: record.scheduled_service === 'yes',
        created_at: new Date().toISOString()
    };
}

// Função para normalizar dados de cidade
function normalizeCity(record) {
    return {
        iata3: record.iata_code && record.iata_code !== '\\N' ? record.iata_code.trim().toUpperCase() : null,
        name: record.municipality ? record.municipality.trim() : (record.name ? record.name.trim() : null),
        country: record.iso_country ? record.iso_country.trim() : null,
        aliases: null,
        active: true,
        created_at: new Date().toISOString()
    };
}

// Função para importar em lotes
async function importBatch(table, data, batchNumber) {
    const { error } = await supabase.from(table).insert(data);
    
    if (error) {
        console.error(`❌ Erro no lote ${batchNumber} (${table}):`, error.message);
        return false;
    }
    
    console.log(`✅ Lote ${batchNumber} importado (${data.length} registros em ${table})`);
    return true;
}

// Função principal
async function main() {
    console.log('🚀 Iniciando importação limpa do CSV...');
    
    try {
        // 1. Limpar banco
        const cleaned = await cleanDatabase();
        if (!cleaned) {
            console.error('❌ Falha na limpeza do banco. Abortando...');
            return;
        }
        
        // 2. Processar CSV
        const csvPath = 'c:\\Users\\gma_s\\Downloads\\airports.csv';
        const records = await processCsv(csvPath);
        console.log(`📊 Processados ${records.length} registros do CSV`);
        
        // 3. Separar dados únicos
        const airportsMap = new Map();
        const citiesMap = new Map();
        
        console.log('🔄 Processando e normalizando dados...');
        
        for (const record of records) {
            // Processar aeroporto
            if (record.iata_code && record.iata_code !== '\\N') {
                const airport = normalizeAirport(record);
                if (airport.iata3 && airport.name) {
                    airportsMap.set(airport.iata3, airport);
                }
                
                // Processar cidade
                const city = normalizeCity(record);
                if (city.iata3 && city.name) {
                    citiesMap.set(city.iata3, city);
                }
            }
        }
        
        console.log(`📊 Dados únicos encontrados:`);
        console.log(`   - Aeroportos: ${airportsMap.size}`);
        console.log(`   - Cidades: ${citiesMap.size}`);
        
        // 4. Importar cidades
        console.log('\n📤 Importando cidades...');
        const citiesArray = Array.from(citiesMap.values());
        for (let i = 0; i < citiesArray.length; i += BATCH_SIZE) {
            const batch = citiesArray.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            await importBatch('cities', batch, batchNumber);
        }
        
        // 5. Importar aeroportos
        console.log('\n📤 Importando aeroportos...');
        const airportsArray = Array.from(airportsMap.values());
        for (let i = 0; i < airportsArray.length; i += BATCH_SIZE) {
            const batch = airportsArray.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            await importBatch('airports', batch, batchNumber);
        }
        
        // 6. Estatísticas finais
        console.log('\n📊 Verificando importação...');
        const { data: citiesCount } = await supabase.from('cities').select('id', { count: 'exact' });
        const { data: airportsCount } = await supabase.from('airports').select('id', { count: 'exact' });
        
        console.log('\n🎉 Importação concluída com sucesso!');
        console.log(`📊 Total importado:`);
        console.log(`   - Cidades: ${citiesCount?.length || 0}`);
        console.log(`   - Aeroportos: ${airportsCount?.length || 0}`);
        
    } catch (error) {
        console.error('❌ Erro durante a importação:', error);
    }
}

main();
