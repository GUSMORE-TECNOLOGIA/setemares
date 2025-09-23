import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

// Configuração do Supabase
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para analisar o arquivo Aeroportos.txt
async function analyzeFile() {
    console.log('📊 Analisando arquivo Aeroportos.txt...');
    
    const fileContent = await fs.readFile('../Aeroportos.txt', 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    console.log(`📋 Total de linhas no arquivo: ${lines.length}`);
    
    // Analisar estrutura do arquivo
    const sampleLine = lines[0];
    console.log(`📋 Estrutura da linha: ${sampleLine}`);
    
    // Contar aeroportos brasileiros no arquivo
    const brazilianLines = lines.filter(line => line.includes('Brazil'));
    console.log(`🇧🇷 Aeroportos brasileiros no arquivo: ${brazilianLines.length}`);
    
    // Mostrar alguns aeroportos brasileiros do arquivo
    console.log('\n📋 Aeroportos brasileiros do arquivo:');
    brazilianLines.slice(0, 10).forEach((line, index) => {
        const parts = line.split(',');
        const name = parts[1]?.replace(/"/g, '') || 'N/A';
        const city = parts[2]?.replace(/"/g, '') || 'N/A';
        const country = parts[3]?.replace(/"/g, '') || 'N/A';
        const iata = parts[4]?.replace(/"/g, '').replace(/\\N/g, '') || 'N/A';
        const icao = parts[5]?.replace(/"/g, '') || 'N/A';
        
        console.log(`   ${index + 1}. ${name} (${iata}/${icao}) - ${city}, ${country}`);
    });
    
    return {
        totalLines: lines.length,
        brazilianCount: brazilianLines.length,
        brazilianLines: brazilianLines
    };
}

// Função para analisar dados do banco
async function analyzeDatabase() {
    console.log('\n📊 Analisando dados do banco...');
    
    const { data: allAirports, error: allError } = await supabase
        .from('airports')
        .select('*');
    
    if (allError) {
        console.error('❌ Erro ao buscar dados do banco:', allError);
        return null;
    }
    
    console.log(`📋 Total de aeroportos no banco: ${allAirports.length}`);
    
    const brazilianAirports = allAirports.filter(airport => airport.country === 'Brazil');
    console.log(`🇧🇷 Aeroportos brasileiros no banco: ${brazilianAirports.length}`);
    
    console.log('\n📋 Aeroportos brasileiros do banco:');
    brazilianAirports.slice(0, 10).forEach((airport, index) => {
        console.log(`   ${index + 1}. ${airport.name} (${airport.iata3}/${airport.icao4}) - ${airport.city_iata}, ${airport.country}`);
    });
    
    return {
        totalCount: allAirports.length,
        brazilianCount: brazilianAirports.length,
        brazilianAirports: brazilianAirports
    };
}

// Função para comparar dados
function compareData(fileData, dbData) {
    console.log('\n🔍 Comparando dados...');
    
    console.log(`📊 Estatísticas:`);
    console.log(`   Arquivo: ${fileData.totalLines} linhas, ${fileData.brazilianCount} brasileiros`);
    console.log(`   Banco: ${dbData.totalCount} aeroportos, ${dbData.brazilianCount} brasileiros`);
    
    // Verificar se há aeroportos no arquivo que não estão no banco
    const fileBrazilianIATAs = new Set();
    const fileBrazilianICAOs = new Set();
    
    fileData.brazilianLines.forEach(line => {
        const parts = line.split(',');
        const iata = parts[4]?.replace(/"/g, '').replace(/\\N/g, '');
        const icao = parts[5]?.replace(/"/g, '');
        
        if (iata && iata !== 'N/A') {
            fileBrazilianIATAs.add(iata);
        }
        if (icao && icao !== 'N/A') {
            fileBrazilianICAOs.add(icao);
        }
    });
    
    const dbBrazilianIATAs = new Set();
    const dbBrazilianICAOs = new Set();
    
    dbData.brazilianAirports.forEach(airport => {
        if (airport.iata3) {
            dbBrazilianIATAs.add(airport.iata3);
        }
        if (airport.icao4) {
            dbBrazilianICAOs.add(airport.icao4);
        }
    });
    
    console.log(`\n📋 IATA codes únicos no arquivo: ${fileBrazilianIATAs.size}`);
    console.log(`📋 IATA codes únicos no banco: ${dbBrazilianIATAs.size}`);
    console.log(`📋 ICAO codes únicos no arquivo: ${fileBrazilianICAOs.size}`);
    console.log(`📋 ICAO codes únicos no banco: ${dbBrazilianICAOs.size}`);
    
    // Encontrar diferenças
    const onlyInFileIATA = [...fileBrazilianIATAs].filter(iata => !dbBrazilianIATAs.has(iata));
    const onlyInDbIATA = [...dbBrazilianIATAs].filter(iata => !fileBrazilianIATAs.has(iata));
    
    const onlyInFileICAO = [...fileBrazilianICAOs].filter(icao => !dbBrazilianICAOs.has(icao));
    const onlyInDbICAO = [...dbBrazilianICAOs].filter(icao => !fileBrazilianICAOs.has(icao));
    
    console.log(`\n🔍 Análise de diferenças IATA:`);
    console.log(`   Apenas no arquivo: ${onlyInFileIATA.length} códigos`);
    console.log(`   Apenas no banco: ${onlyInDbIATA.length} códigos`);
    
    console.log(`\n🔍 Análise de diferenças ICAO:`);
    console.log(`   Apenas no arquivo: ${onlyInFileICAO.length} códigos`);
    console.log(`   Apenas no banco: ${onlyInDbICAO.length} códigos`);
    
    if (onlyInFileIATA.length > 0) {
        console.log(`\n📋 IATA apenas no arquivo: ${onlyInFileIATA.slice(0, 10).join(', ')}`);
    }
    
    if (onlyInDbIATA.length > 0) {
        console.log(`\n📋 IATA apenas no banco: ${onlyInDbIATA.slice(0, 10).join(', ')}`);
    }
    
    return {
        fileBrazilianIATAs,
        dbBrazilianIATAs,
        fileBrazilianICAOs,
        dbBrazilianICAOs,
        onlyInFileIATA,
        onlyInDbIATA,
        onlyInFileICAO,
        onlyInDbICAO
    };
}

// Função principal
async function main() {
    try {
        console.log('🚀 Iniciando análise comparativa de aeroportos...\n');
        
        const fileData = await analyzeFile();
        const dbData = await analyzeDatabase();
        
        if (fileData && dbData) {
            const comparison = compareData(fileData, dbData);
            
            console.log('\n📊 Recomendação:');
            if (fileData.brazilianCount > dbData.brazilianCount) {
                console.log('✅ O arquivo tem mais aeroportos brasileiros. Recomendo importar do arquivo.');
            } else if (dbData.brazilianCount > fileData.brazilianCount) {
                console.log('✅ O banco tem mais aeroportos brasileiros. Manter dados do banco.');
            } else {
                console.log('🤔 Ambos têm quantidades similares. Analisar qualidade dos dados.');
            }
            
            // Verificar se há aeroportos importantes faltando
            const importantAirports = ['GRU', 'CGH', 'GIG', 'SDU', 'BSB', 'BEL', 'FOR', 'REC', 'POA', 'CWB'];
            const missingImportant = importantAirports.filter(iata => 
                !comparison.dbBrazilianIATAs.has(iata) && comparison.fileBrazilianIATAs.has(iata)
            );
            
            if (missingImportant.length > 0) {
                console.log(`\n⚠️  Aeroportos importantes faltando no banco: ${missingImportant.join(', ')}`);
            } else {
                console.log('\n✅ Todos os aeroportos importantes estão no banco.');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro durante a análise:', error);
    }
}

main();
