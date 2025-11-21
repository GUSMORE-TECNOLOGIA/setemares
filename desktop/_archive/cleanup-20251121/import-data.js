import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados de aeroportos do arquivo JSON
const airportsData = {
  "GRU": "Guarulhos International Airport (GRU), São Paulo, Brazil",
  "CDG": "Charles de Gaulle Airport (CDG), Paris, France", 
  "HND": "Haneda Airport (HND), Tokyo, Japan",
  "LIS": "Humberto Delgado Airport (LIS), Lisbon, Portugal",
  "FCO": "Leonardo da Vinci–Fiumicino Airport (FCO), Rome, Italy",
  "MIA": "Miami International Airport (MIA), Miami, USA",
  "MAD": "Adolfo Suárez Madrid–Barajas Airport (MAD), Madrid, Spain",
  "BCN": "Barcelona–El Prat Airport (BCN), Barcelona, Spain",
  "SCL": "Arturo Merino Benítez Intl (SCL), Santiago, Chile"
};

// Dados de companhias aéreas
const airlinesData = {
  "AF": "Air France",
  "TP": "TAP Air Portugal", 
  "UX": "Air Europa",
  "IB": "Iberia",
  "LA": "LATAM Airlines",
  "AA": "American Airlines",
  "AZ": "ITA Airways",
  "KL": "KLM Royal Dutch Airlines",
  "LH": "Lufthansa",
  "TK": "Turkish Airlines"
};

async function importAirports() {
  console.log('Importando aeroportos...');
  
  const airports = Object.entries(airportsData).map(([iata, fullName]) => {
    const parts = fullName.split(', ');
    const name = parts[0];
    const city = parts[1] || iata;
    const country = parts[2] || 'Unknown';
    
    return {
      iata3: iata,
      icao4: null,
      name: name,
      city_iata: iata,
      country: country,
      tz: null,
      aliases: null,
      active: true
    };
  });

  const { data, error } = await supabase
    .from('airports')
    .insert(airports);

  if (error) {
    console.error('Erro ao importar aeroportos:', error);
  } else {
    console.log(`✅ ${airports.length} aeroportos importados com sucesso!`);
  }
}

async function importAirlines() {
  console.log('Importando companhias aéreas...');
  
  const airlines = Object.entries(airlinesData).map(([iata2, name]) => ({
    iata2: iata2,
    icao3: null,
    name: name,
    country: null,
    aliases: null,
    active: true
  }));

  const { data, error } = await supabase
    .from('airlines')
    .insert(airlines);

  if (error) {
    console.error('Erro ao importar companhias:', error);
  } else {
    console.log(`✅ ${airlines.length} companhias importadas com sucesso!`);
  }
}

async function importCities() {
  console.log('Importando cidades...');
  
  // Extrair cidades únicas dos aeroportos
  const cities = new Map();
  
  Object.entries(airportsData).forEach(([iata, fullName]) => {
    const parts = fullName.split(', ');
    const cityName = parts[1] || iata;
    const country = parts[2] || 'Unknown';
    
    if (!cities.has(cityName)) {
      cities.set(cityName, {
        iata3: iata,
        name: cityName,
        country: country,
        aliases: null,
        active: true
      });
    }
  });

  const citiesArray = Array.from(cities.values());

  const { data, error } = await supabase
    .from('cities')
    .insert(citiesArray);

  if (error) {
    console.error('Erro ao importar cidades:', error);
  } else {
    console.log(`✅ ${citiesArray.length} cidades importadas com sucesso!`);
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando importação de dados...\n');
    
    await importCities();
    await importAirports(); 
    await importAirlines();
    
    console.log('\n🎉 Importação concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  }
}

main();
