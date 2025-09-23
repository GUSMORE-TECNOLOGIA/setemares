import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

// Configuração do Supabase
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para analisar o arquivo Companhias.txt
async function analyzeFile() {
    console.log('📊 Analisando arquivo Companhias.txt...');
    
    const fileContent = await fs.readFile('../Companhias.txt', 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    console.log(`📋 Total de linhas no arquivo: ${lines.length}`);
    
    // Analisar estrutura do arquivo
    const sampleLine = lines[0];
    console.log(`📋 Estrutura da linha: ${sampleLine}`);
    
    // Contar companhias brasileiras no arquivo
    const brazilianLines = lines.filter(line => line.includes('Brazil'));
    console.log(`🇧🇷 Companhias brasileiras no arquivo: ${brazilianLines.length}`);
    
    // Mostrar algumas companhias brasileiras do arquivo
    console.log('\n📋 Companhias brasileiras do arquivo:');
    brazilianLines.slice(0, 10).forEach((line, index) => {
        const parts = line.split(',');
        const name = parts[1]?.replace(/"/g, '') || 'N/A';
        const iata = parts[3]?.replace(/"/g, '') || 'N/A';
        const icao = parts[4]?.replace(/"/g, '') || 'N/A';
        const country = parts[6]?.replace(/"/g, '') || 'N/A';
        const active = parts[7]?.replace(/"/g, '') || 'N/A';
        
        console.log(`   ${index + 1}. ${name} (${iata}/${icao}) - ${country} - ${active}`);
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
    
    const { data: allAirlines, error: allError } = await supabase
        .from('airlines')
        .select('*');
    
    if (allError) {
        console.error('❌ Erro ao buscar dados do banco:', allError);
        return null;
    }
    
    console.log(`📋 Total de companhias no banco: ${allAirlines.length}`);
    
    const brazilianAirlines = allAirlines.filter(airline => airline.country === 'Brazil');
    console.log(`🇧🇷 Companhias brasileiras no banco: ${brazilianAirlines.length}`);
    
    console.log('\n📋 Companhias brasileiras do banco:');
    brazilianAirlines.slice(0, 10).forEach((airline, index) => {
        console.log(`   ${index + 1}. ${airline.name} (${airline.iata2}/${airline.icao3}) - ${airline.country} - ${airline.active}`);
    });
    
    return {
        totalCount: allAirlines.length,
        brazilianCount: brazilianAirlines.length,
        brazilianAirlines: brazilianAirlines
    };
}

// Função para comparar dados
function compareData(fileData, dbData) {
    console.log('\n🔍 Comparando dados...');
    
    console.log(`📊 Estatísticas:`);
    console.log(`   Arquivo: ${fileData.totalLines} linhas, ${fileData.brazilianCount} brasileiras`);
    console.log(`   Banco: ${dbData.totalCount} companhias, ${dbData.brazilianCount} brasileiras`);
    
    // Verificar se há companhias no arquivo que não estão no banco
    const fileBrazilianIATAs = new Set();
    fileData.brazilianLines.forEach(line => {
        const parts = line.split(',');
        const iata = parts[3]?.replace(/"/g, '').replace(/\\N/g, '');
        if (iata && iata !== '-' && iata !== 'N/A') {
            fileBrazilianIATAs.add(iata);
        }
    });
    
    const dbBrazilianIATAs = new Set();
    dbData.brazilianAirlines.forEach(airline => {
        if (airline.iata2) {
            dbBrazilianIATAs.add(airline.iata2);
        }
    });
    
    console.log(`\n📋 IATA codes únicos no arquivo: ${fileBrazilianIATAs.size}`);
    console.log(`📋 IATA codes únicos no banco: ${dbBrazilianIATAs.size}`);
    
    // Encontrar diferenças
    const onlyInFile = [...fileBrazilianIATAs].filter(iata => !dbBrazilianIATAs.has(iata));
    const onlyInDb = [...dbBrazilianIATAs].filter(iata => !fileBrazilianIATAs.has(iata));
    
    console.log(`\n🔍 Análise de diferenças:`);
    console.log(`   Apenas no arquivo: ${onlyInFile.length} códigos`);
    console.log(`   Apenas no banco: ${onlyInDb.length} códigos`);
    
    if (onlyInFile.length > 0) {
        console.log(`\n📋 Códigos apenas no arquivo: ${onlyInFile.slice(0, 10).join(', ')}`);
    }
    
    if (onlyInDb.length > 0) {
        console.log(`\n📋 Códigos apenas no banco: ${onlyInDb.slice(0, 10).join(', ')}`);
    }
    
    return {
        fileBrazilianIATAs,
        dbBrazilianIATAs,
        onlyInFile,
        onlyInDb
    };
}

// Função principal
async function main() {
    try {
        console.log('🚀 Iniciando análise comparativa de companhias aéreas...\n');
        
        const fileData = await analyzeFile();
        const dbData = await analyzeDatabase();
        
        if (fileData && dbData) {
            const comparison = compareData(fileData, dbData);
            
            console.log('\n📊 Recomendação:');
            if (fileData.brazilianCount > dbData.brazilianCount) {
                console.log('✅ O arquivo tem mais companhias brasileiras. Recomendo importar do arquivo.');
            } else if (dbData.brazilianCount > fileData.brazilianCount) {
                console.log('✅ O banco tem mais companhias brasileiras. Manter dados do banco.');
            } else {
                console.log('🤔 Ambos têm quantidades similares. Analisar qualidade dos dados.');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro durante a análise:', error);
    }
}

main();
