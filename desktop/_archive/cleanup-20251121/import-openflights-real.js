import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import https from 'https';

const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';

const supabase = createClient(supabaseUrl, supabaseKey);

// URLs dos dados do OpenFlights
const OPENFLIGHTS_AIRPORTS_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat';
const OPENFLIGHTS_AIRLINES_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat';

// Função para baixar arquivo
function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ ${filename} baixado com sucesso!`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filename, () => {}); // Remove arquivo parcial
      reject(err);
    });
  });
}

// Função para processar dados de aeroportos do OpenFlights
function processAirportsData(csvData) {
  const lines = csvData.split('\n');
  const airports = [];
  const cities = new Map();
  
  console.log(`📊 Processando ${lines.length} linhas de aeroportos...`);
  
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    
    try {
      // Formato do OpenFlights: ID,Name,City,Country,IATA,ICAO,Latitude,Longitude,Altitude,Timezone,DST,Tz,Type,Source
      const fields = line.split(',').map(field => field.replace(/"/g, ''));
      
      if (fields.length < 14) return;
      
      const [
        id, name, city, country, iata, icao, 
        latitude, longitude, altitude, timezone, dst, tz, type, source
      ] = fields;
      
      // Só processar aeroportos com IATA válido e tipo comercial
      if (!iata || iata === '\\N' || iata.length !== 3) return;
      if (type !== 'airport') return;
      
      // Adicionar aeroporto
      airports.push({
        iata3: iata,
        icao4: icao && icao !== '\\N' ? icao : null,
        name: name,
        city_iata: iata,
        country: country,
        tz: timezone && timezone !== '\\N' ? timezone : null,
        aliases: null,
        active: true
      });
      
      // Adicionar cidade se não existir
      if (!cities.has(city)) {
        cities.set(city, {
          iata3: iata,
          name: city,
          country: country,
          aliases: null,
          active: true
        });
      }
      
    } catch (error) {
      console.warn(`⚠️ Erro ao processar linha ${index}: ${error.message}`);
    }
  });
  
  console.log(`✅ Processados ${airports.length} aeroportos válidos`);
  console.log(`✅ Processadas ${cities.size} cidades únicas`);
  
  return { airports, cities: Array.from(cities.values()) };
}

// Função para processar dados de companhias do OpenFlights
function processAirlinesData(csvData) {
  const lines = csvData.split('\n');
  const airlines = [];
  
  console.log(`📊 Processando ${lines.length} linhas de companhias...`);
  
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    
    try {
      // Formato do OpenFlights: ID,Name,Alias,IATA,ICAO,Callsign,Country,Active
      const fields = line.split(',').map(field => field.replace(/"/g, ''));
      
      if (fields.length < 8) return;
      
      const [id, name, alias, iata, icao, callsign, country, active] = fields;
      
      // Só processar companhias com IATA válido e ativas
      if (!iata || iata === '\\N' || iata.length !== 2) return;
      if (active !== 'Y') return;
      
      airlines.push({
        iata2: iata,
        icao3: icao && icao !== '\\N' ? icao : null,
        name: name,
        country: country && country !== '\\N' ? country : null,
        aliases: alias && alias !== '\\N' ? alias : null,
        active: true
      });
      
    } catch (error) {
      console.warn(`⚠️ Erro ao processar linha ${index}: ${error.message}`);
    }
  });
  
  console.log(`✅ Processadas ${airlines.length} companhias válidas`);
  return airlines;
}

// Função para importar aeroportos em lotes
async function importAirportsBatch(airports, batchSize = 100) {
  console.log(`📤 Importando ${airports.length} aeroportos em lotes de ${batchSize}...`);
  
  for (let i = 0; i < airports.length; i += batchSize) {
    const batch = airports.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('airports')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error.message);
      } else {
        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(airports.length/batchSize)} importado (${batch.length} aeroportos)`);
      }
    } catch (err) {
      console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, err.message);
    }
    
    // Pequena pausa entre lotes para não sobrecarregar o Supabase
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Função para importar cidades em lotes
async function importCitiesBatch(cities, batchSize = 100) {
  console.log(`📤 Importando ${cities.length} cidades em lotes de ${batchSize}...`);
  
  for (let i = 0; i < cities.length; i += batchSize) {
    const batch = cities.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('cities')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error.message);
      } else {
        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(cities.length/batchSize)} importado (${batch.length} cidades)`);
      }
    } catch (err) {
      console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, err.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Função para importar companhias em lotes
async function importAirlinesBatch(airlines, batchSize = 100) {
  console.log(`📤 Importando ${airlines.length} companhias em lotes de ${batchSize}...`);
  
  for (let i = 0; i < airlines.length; i += batchSize) {
    const batch = airlines.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('airlines')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error.message);
      } else {
        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(airlines.length/batchSize)} importado (${batch.length} companhias)`);
      }
    } catch (err) {
      console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, err.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando importação completa do OpenFlights...\n');
    
    // Baixar arquivos
    console.log('📥 Baixando dados do OpenFlights...');
    await downloadFile(OPENFLIGHTS_AIRPORTS_URL, 'airports.dat');
    await downloadFile(OPENFLIGHTS_AIRLINES_URL, 'airlines.dat');
    
    // Processar aeroportos
    console.log('\n📊 Processando aeroportos...');
    const airportsData = fs.readFileSync('airports.dat', 'utf8');
    const { airports, cities } = processAirportsData(airportsData);
    
    // Processar companhias
    console.log('\n📊 Processando companhias...');
    const airlinesData = fs.readFileSync('airlines.dat', 'utf8');
    const airlines = processAirlinesData(airlinesData);
    
    // Importar para Supabase
    console.log('\n📤 Importando para Supabase...');
    await importCitiesBatch(cities);
    await importAirportsBatch(airports);
    await importAirlinesBatch(airlines);
    
    console.log('\n🎉 Importação OpenFlights concluída com sucesso!');
    console.log(`📊 Total importado:`);
    console.log(`   - ${cities.length} cidades`);
    console.log(`   - ${airports.length} aeroportos`);
    console.log(`   - ${airlines.length} companhias aéreas`);
    
    // Limpar arquivos temporários
    fs.unlinkSync('airports.dat');
    fs.unlinkSync('airlines.dat');
    console.log('\n🧹 Arquivos temporários removidos');
    
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  }
}

main();
