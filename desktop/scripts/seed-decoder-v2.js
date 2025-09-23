import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados iniciais para companhias aéreas
const airlines = [
  { iata: 'LA', icao: 'LAN', name: 'LATAM Airlines', country_iso: 'CL' },
  { iata: 'BA', icao: 'BAW', name: 'British Airways', country_iso: 'GB' },
  { iata: 'IB', icao: 'IBE', name: 'Iberia', country_iso: 'ES' },
  { iata: 'TP', icao: 'TAP', name: 'TAP Air Portugal', country_iso: 'PT' },
  { iata: 'AF', icao: 'AFR', name: 'Air France', country_iso: 'FR' },
  { iata: 'KL', icao: 'KLM', name: 'KLM Royal Dutch Airlines', country_iso: 'NL' },
  { iata: 'LH', icao: 'DLH', name: 'Lufthansa', country_iso: 'DE' },
  { iata: 'AA', icao: 'AAL', name: 'American Airlines', country_iso: 'US' },
  { iata: 'UA', icao: 'UAL', name: 'United Airlines', country_iso: 'US' },
  { iata: 'DL', icao: 'DAL', name: 'Delta Air Lines', country_iso: 'US' }
];

// Dados iniciais para aeroportos
const airports = [
  { iata: 'GRU', icao: 'SBGR', name: 'Guarulhos International Airport', city: 'São Paulo', country: 'Brazil', country_iso: 'BR' },
  { iata: 'LHR', icao: 'EGLL', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', country_iso: 'GB' },
  { iata: 'GVA', icao: 'LSGG', name: 'Geneva Cointrin Airport', city: 'Geneva', country: 'Switzerland', country_iso: 'CH' },
  { iata: 'MAD', icao: 'LEMD', name: 'Madrid-Barajas Airport', city: 'Madrid', country: 'Spain', country_iso: 'ES' },
  { iata: 'CDG', icao: 'LFPG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', country_iso: 'FR' },
  { iata: 'AMS', icao: 'EHAM', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', country_iso: 'NL' },
  { iata: 'FRA', icao: 'EDDF', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', country_iso: 'DE' },
  { iata: 'JFK', icao: 'KJFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', country_iso: 'US' },
  { iata: 'LAX', icao: 'KLAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', country_iso: 'US' },
  { iata: 'DXB', icao: 'OMDB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', country_iso: 'AE' }
];

// Dados iniciais para aliases
const aliases = [
  // Aliases para aeroportos
  { kind: 'airport', alias: 'LONDRES HEATHROW', target_kind: 'airport' },
  { kind: 'airport', alias: 'HEATHROW', target_kind: 'airport' },
  { kind: 'airport', alias: 'GUARULHOS', target_kind: 'airport' },
  { kind: 'airport', alias: 'GENEVA', target_kind: 'airport' },
  { kind: 'airport', alias: 'MADRID BARAJAS', target_kind: 'airport' },
  { kind: 'airport', alias: 'CHARLES DE GAULLE', target_kind: 'airport' },
  { kind: 'airport', alias: 'SCHIPHOL', target_kind: 'airport' },
  { kind: 'airport', alias: 'FRANKFURT', target_kind: 'airport' },
  
  // Aliases para companhias
  { kind: 'airline', alias: 'LATAM', target_kind: 'airline' },
  { kind: 'airline', alias: 'BRITISH AIRWAYS', target_kind: 'airline' },
  { kind: 'airline', alias: 'IBERIA', target_kind: 'airline' },
  { kind: 'airline', alias: 'TAP', target_kind: 'airline' },
  { kind: 'airline', alias: 'AIR FRANCE', target_kind: 'airline' },
  { kind: 'airline', alias: 'KLM', target_kind: 'airline' },
  { kind: 'airline', alias: 'LUFTHANSA', target_kind: 'airline' }
];

async function seedData() {
  console.log('🌱 Iniciando seed do Decoder v2...');

  try {
    // 1. Verificar se já existem dados
    console.log('🔍 Verificando dados existentes...');
    
    const { data: existingAirlines, error: airlinesError } = await supabase
      .from('airlines')
      .select('id, name, iata2, icao3')
      .limit(10);

    if (airlinesError) {
      console.error('❌ Erro ao verificar companhias:', airlinesError);
      return;
    }

    const { data: existingAirports, error: airportsError } = await supabase
      .from('airports')
      .select('id, name, iata3, icao4')
      .limit(10);

    if (airportsError) {
      console.error('❌ Erro ao verificar aeroportos:', airportsError);
      return;
    }

    console.log(`✅ Encontradas ${existingAirlines.length} companhias e ${existingAirports.length} aeroportos`);

    // 2. Adicionar aliases às tabelas existentes
    console.log('🔗 Adicionando aliases...');
    
    // Adicionar aliases de companhias
    for (const airline of existingAirlines) {
      const aliases = [];
      
      // Adicionar aliases baseados no nome
      if (airline.name.includes('LATAM')) aliases.push('LATAM');
      if (airline.name.includes('British')) aliases.push('BRITISH AIRWAYS');
      if (airline.name.includes('Iberia')) aliases.push('IBERIA');
      if (airline.name.includes('TAP')) aliases.push('TAP');
      if (airline.name.includes('Air France')) aliases.push('AIR FRANCE');
      if (airline.name.includes('KLM')) aliases.push('KLM');
      if (airline.name.includes('Lufthansa')) aliases.push('LUFTHANSA');
      
      if (aliases.length > 0) {
        await supabase
          .from('airlines')
          .update({ aliases: aliases })
          .eq('id', airline.id);
      }
    }

    // Adicionar aliases de aeroportos
    for (const airport of existingAirports) {
      const aliases = [];
      
      // Adicionar aliases baseados no nome
      if (airport.name.includes('Heathrow')) aliases.push('LONDRES HEATHROW', 'HEATHROW');
      if (airport.name.includes('Guarulhos')) aliases.push('GUARULHOS');
      if (airport.name.includes('Geneva')) aliases.push('GENEVA');
      if (airport.name.includes('Madrid')) aliases.push('MADRID BARAJAS');
      if (airport.name.includes('Charles de Gaulle')) aliases.push('CHARLES DE GAULLE');
      if (airport.name.includes('Schiphol')) aliases.push('SCHIPHOL');
      if (airport.name.includes('Frankfurt')) aliases.push('FRANKFURT');
      
      if (aliases.length > 0) {
        await supabase
          .from('airports')
          .update({ aliases: aliases })
          .eq('id', airport.id);
      }
    }

    console.log('🎉 Seed do Decoder v2 concluído com sucesso!');
    console.log('✅ Aliases adicionados às tabelas existentes');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar seed
seedData();
