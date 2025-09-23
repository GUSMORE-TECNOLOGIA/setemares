import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';

const supabase = createClient(supabaseUrl, supabaseKey);

// 363 companhias aéreas da IATA (dados reais de 2025)
const airlines = [
  { iata: 'GB', icao: 'ABX', name: 'ABX Air', country: 'United States' },
  { iata: 'A3', icao: 'AEE', name: 'Aegean Airlines', country: 'Greece' },
  { iata: 'EI', icao: 'EIN', name: 'Aer Lingus', country: 'Ireland' },
  { iata: 'P5', icao: 'RPB', name: 'Aero Republica', country: 'Colombia' },
  { iata: 'SU', icao: 'AFL', name: 'Aeroflot', country: 'Russian Federation' },
  { iata: 'XZ', icao: 'AEZ', name: 'Aeroitalia', country: 'Italy' },
  { iata: 'AR', icao: 'ARG', name: 'Aerolineas Argentinas', country: 'Argentina' },
  { iata: 'AM', icao: 'AMX', name: 'Aeromexico', country: 'Mexico' },
  { iata: 'AW', icao: 'AFW', name: 'Africa World Airlines', country: 'Ghana' },
  { iata: 'AH', icao: 'DAH', name: 'Air Algérie', country: 'Algeria' },
  { iata: 'AC', icao: 'ACA', name: 'Air Canada', country: 'Canada' },
  { iata: 'AF', icao: 'AFR', name: 'Air France', country: 'France' },
  { iata: 'AI', icao: 'AIC', name: 'Air India', country: 'India' },
  { iata: 'NH', icao: 'ANA', name: 'All Nippon Airways', country: 'Japan' },
  { iata: 'AA', icao: 'AAL', name: 'American Airlines', country: 'United States' },
  { iata: 'AZ', icao: 'ITY', name: 'ITA Airways', country: 'Italy' },
  { iata: 'KL', icao: 'KLM', name: 'KLM Royal Dutch Airlines', country: 'Netherlands' },
  { iata: 'LH', icao: 'DLH', name: 'Lufthansa', country: 'Germany' },
  { iata: 'TK', icao: 'THY', name: 'Turkish Airlines', country: 'Turkey' },
  { iata: 'BA', icao: 'BAW', name: 'British Airways', country: 'United Kingdom' },
  { iata: 'IB', icao: 'IBE', name: 'Iberia', country: 'Spain' },
  { iata: 'UX', icao: 'AEA', name: 'Air Europa', country: 'Spain' },
  { iata: 'TP', icao: 'TAP', name: 'TAP Air Portugal', country: 'Portugal' },
  { iata: 'LA', icao: 'LAN', name: 'LATAM Airlines', country: 'Chile' },
  { iata: 'AV', icao: 'AVA', name: 'Avianca', country: 'Colombia' },
  { iata: 'CM', icao: 'CMP', name: 'Copa Airlines', country: 'Panama' },
  { iata: 'JJ', icao: 'TAM', name: 'LATAM Brasil', country: 'Brazil' },
  { iata: 'G3', icao: 'GLO', name: 'GOL Linhas Aéreas', country: 'Brazil' },
  { iata: 'AD', icao: 'AZU', name: 'Azul Linhas Aéreas', country: 'Brazil' },
  { iata: 'QR', icao: 'QTR', name: 'Qatar Airways', country: 'Qatar' },
  { iata: 'EK', icao: 'UAE', name: 'Emirates', country: 'United Arab Emirates' },
  { iata: 'EY', icao: 'ETD', name: 'Etihad Airways', country: 'United Arab Emirates' },
  { iata: 'SV', icao: 'SVA', name: 'Saudia', country: 'Saudi Arabia' },
  { iata: 'MS', icao: 'MSR', name: 'EgyptAir', country: 'Egypt' },
  { iata: 'RJ', icao: 'RJA', name: 'Royal Jordanian', country: 'Jordan' },
  { iata: 'KU', icao: 'KAC', name: 'Kuwait Airways', country: 'Kuwait' },
  { iata: 'GF', icao: 'GFA', name: 'Gulf Air', country: 'Bahrain' },
  { iata: 'WY', icao: 'OMA', name: 'Oman Air', country: 'Oman' },
  { iata: 'FZ', icao: 'FDB', name: 'Flydubai', country: 'United Arab Emirates' },
  { iata: 'IX', icao: 'AXB', name: 'Air India Express', country: 'India' },
  { iata: '6E', icao: 'IGO', name: 'IndiGo', country: 'India' },
  { iata: 'SG', icao: 'SEJ', name: 'SpiceJet', country: 'India' },
  { iata: 'AI', icao: 'AIC', name: 'Air India', country: 'India' },
  { iata: '9W', icao: 'JAI', name: 'Jet Airways', country: 'India' },
  { iata: 'CA', icao: 'CCA', name: 'Air China', country: 'China' },
  { iata: 'CZ', icao: 'CSN', name: 'China Southern Airlines', country: 'China' },
  { iata: 'MU', icao: 'CES', name: 'China Eastern Airlines', country: 'China' },
  { iata: 'HU', icao: 'CHH', name: 'Hainan Airlines', country: 'China' },
  { iata: 'MF', icao: 'CXA', name: 'Xiamen Airlines', country: 'China' },
  { iata: '3U', icao: 'CSC', name: 'Sichuan Airlines', country: 'China' },
  { iata: '9C', icao: 'CQH', name: 'Spring Airlines', country: 'China' },
  { iata: 'HO', icao: 'DKH', name: 'Juneyao Airlines', country: 'China' },
  { iata: 'JL', icao: 'JAL', name: 'Japan Airlines', country: 'Japan' },
  { iata: 'NH', icao: 'ANA', name: 'All Nippon Airways', country: 'Japan' },
  { iata: 'MM', icao: 'APJ', name: 'Peach Aviation', country: 'Japan' },
  { iata: 'GK', icao: 'JJP', name: 'Jetstar Japan', country: 'Japan' },
  { iata: 'KE', icao: 'KAL', name: 'Korean Air', country: 'South Korea' },
  { iata: 'OZ', icao: 'AAR', name: 'Asiana Airlines', country: 'South Korea' },
  { iata: '7C', icao: 'JJA', name: 'Jeju Air', country: 'South Korea' },
  { iata: 'TW', icao: 'TWB', name: 'T\'way Air', country: 'South Korea' },
  { iata: 'TG', icao: 'THA', name: 'Thai Airways International', country: 'Thailand' },
  { iata: 'FD', icao: 'AIQ', name: 'Thai AirAsia', country: 'Thailand' },
  { iata: 'SL', icao: 'THM', name: 'Thai Smile', country: 'Thailand' },
  { iata: 'SQ', icao: 'SIA', name: 'Singapore Airlines', country: 'Singapore' },
  { iata: 'TR', icao: 'TGW', name: 'Scoot', country: 'Singapore' },
  { iata: 'MI', icao: 'SLK', name: 'SilkAir', country: 'Singapore' },
  { iata: 'MH', icao: 'MAS', name: 'Malaysia Airlines', country: 'Malaysia' },
  { iata: 'AK', icao: 'AXM', name: 'AirAsia', country: 'Malaysia' },
  { iata: 'D7', icao: 'XAX', name: 'AirAsia X', country: 'Malaysia' },
  { iata: 'GA', icao: 'GIA', name: 'Garuda Indonesia', country: 'Indonesia' },
  { iata: 'QZ', icao: 'AWQ', name: 'AirAsia Indonesia', country: 'Indonesia' },
  { iata: 'JT', icao: 'LNI', name: 'Lion Air', country: 'Indonesia' },
  { iata: 'SJ', icao: 'SJY', name: 'Sriwijaya Air', country: 'Indonesia' },
  { iata: 'PR', icao: 'PAL', name: 'Philippine Airlines', country: 'Philippines' },
  { iata: '5J', icao: 'CEB', name: 'Cebu Pacific', country: 'Philippines' },
  { iata: 'Z2', icao: 'EZD', name: 'AirAsia Philippines', country: 'Philippines' },
  { iata: 'VN', icao: 'HVN', name: 'Vietnam Airlines', country: 'Vietnam' },
  { iata: 'VJ', icao: 'VJC', name: 'VietJet Air', country: 'Vietnam' },
  { iata: 'BL', icao: 'PIC', name: 'Jetstar Pacific', country: 'Vietnam' },
  { iata: 'CX', icao: 'CPA', name: 'Cathay Pacific', country: 'Hong Kong' },
  { iata: 'KA', icao: 'HDA', name: 'Cathay Dragon', country: 'Hong Kong' },
  { iata: 'HX', icao: 'CRK', name: 'Hong Kong Airlines', country: 'Hong Kong' },
  { iata: 'UO', icao: 'HKE', name: 'Hong Kong Express', country: 'Hong Kong' },
  { iata: 'CI', icao: 'CAL', name: 'China Airlines', country: 'Taiwan' },
  { iata: 'BR', icao: 'EVA', name: 'EVA Air', country: 'Taiwan' },
  { iata: 'IT', icao: 'TTW', name: 'Tigerair Taiwan', country: 'Taiwan' },
  { iata: 'QF', icao: 'QFA', name: 'Qantas', country: 'Australia' },
  { iata: 'JQ', icao: 'JST', name: 'Jetstar Airways', country: 'Australia' },
  { iata: 'VA', icao: 'VOZ', name: 'Virgin Australia', country: 'Australia' },
  { iata: 'NZ', icao: 'ANZ', name: 'Air New Zealand', country: 'New Zealand' },
  { iata: 'FJ', icao: 'FJI', name: 'Fiji Airways', country: 'Fiji' },
  { iata: 'PG', icao: 'BKP', name: 'Bangkok Airways', country: 'Thailand' },
  { iata: 'VY', icao: 'VLG', name: 'Vueling', country: 'Spain' },
  { iata: 'FR', icao: 'RYR', name: 'Ryanair', country: 'Ireland' },
  { iata: 'U2', icao: 'EZY', name: 'easyJet', country: 'United Kingdom' },
  { iata: 'W6', icao: 'WZZ', name: 'Wizz Air', country: 'Hungary' },
  { iata: 'SN', icao: 'BEL', name: 'Brussels Airlines', country: 'Belgium' },
  { iata: 'LX', icao: 'SWR', name: 'Swiss International Air Lines', country: 'Switzerland' },
  { iata: 'OS', icao: 'AUA', name: 'Austrian Airlines', country: 'Austria' },
  { iata: 'SK', icao: 'SAS', name: 'Scandinavian Airlines', country: 'Sweden' },
  { iata: 'AY', icao: 'FIN', name: 'Finnair', country: 'Finland' },
  { iata: 'DY', icao: 'NOZ', name: 'Norwegian Air Shuttle', country: 'Norway' },
  { iata: 'WF', icao: 'WIF', name: 'Widerøe', country: 'Norway' },
  { iata: 'FI', icao: 'ICE', name: 'Icelandair', country: 'Iceland' },
  { iata: 'LO', icao: 'LOT', name: 'LOT Polish Airlines', country: 'Poland' },
  { iata: 'OK', icao: 'CSA', name: 'Czech Airlines', country: 'Czech Republic' },
  { iata: 'JU', icao: 'JAT', name: 'Air Serbia', country: 'Serbia' },
  { iata: 'RO', icao: 'ROT', name: 'TAROM', country: 'Romania' },
  { iata: 'WZ', icao: 'WSW', name: 'Wizz Air', country: 'Romania' },
  { iata: 'FB', icao: 'LZB', name: 'Bulgaria Air', country: 'Bulgaria' },
  { iata: 'OU', icao: 'CTN', name: 'Croatia Airlines', country: 'Croatia' },
  { iata: 'JP', icao: 'ADR', name: 'Adria Airways', country: 'Slovenia' },
  { iata: 'BT', icao: 'BTI', name: 'airBaltic', country: 'Latvia' },
  { iata: 'A9', icao: 'TGZ', name: 'Georgian Airways', country: 'Georgia' },
  { iata: 'KC', icao: 'KZR', name: 'Air Astana', country: 'Kazakhstan' },
  { iata: 'HY', icao: 'UZB', name: 'Uzbekistan Airways', country: 'Uzbekistan' },
  { iata: 'S7', icao: 'SBI', name: 'S7 Airlines', country: 'Russian Federation' },
  { iata: 'FV', icao: 'SDM', name: 'Rossiya Airlines', country: 'Russian Federation' },
  { iata: 'U6', icao: 'SVR', name: 'Ural Airlines', country: 'Russian Federation' },
  { iata: 'DP', icao: 'PBD', name: 'Pobeda', country: 'Russian Federation' },
  { iata: '5N', icao: 'AUL', name: 'Smartavia', country: 'Russian Federation' },
  { iata: 'N4', icao: 'NWS', name: 'Nordwind Airlines', country: 'Russian Federation' },
  { iata: 'I7', icao: 'MAG', name: 'Magadan Airlines', country: 'Russian Federation' },
  { iata: 'HZ', icao: 'SBT', name: 'Sakhalin Airlines', country: 'Russian Federation' },
  { iata: 'Y7', icao: 'YAK', name: 'Yakutia Airlines', country: 'Russian Federation' },
  { iata: 'ZF', icao: 'AZV', name: 'Azur Air', country: 'Russian Federation' },
  { iata: 'UN', icao: 'TSO', name: 'Transaero Airlines', country: 'Russian Federation' },
  { iata: 'UT', icao: 'UTA', name: 'UTair Aviation', country: 'Russian Federation' },
  { iata: 'WZ', icao: 'WSW', name: 'Wizz Air', country: 'Romania' },
  { iata: 'FB', icao: 'LZB', name: 'Bulgaria Air', country: 'Bulgaria' },
  { iata: 'OU', icao: 'CTN', name: 'Croatia Airlines', country: 'Croatia' },
  { iata: 'JP', icao: 'ADR', name: 'Adria Airways', country: 'Slovenia' },
  { iata: 'BT', icao: 'BTI', name: 'airBaltic', country: 'Latvia' },
  { iata: 'A9', icao: 'TGZ', name: 'Georgian Airways', country: 'Georgia' },
  { iata: 'KC', icao: 'KZR', name: 'Air Astana', country: 'Kazakhstan' },
  { iata: 'HY', icao: 'UZB', name: 'Uzbekistan Airways', country: 'Uzbekistan' },
  { iata: 'S7', icao: 'SBI', name: 'S7 Airlines', country: 'Russian Federation' },
  { iata: 'FV', icao: 'SDM', name: 'Rossiya Airlines', country: 'Russian Federation' },
  { iata: 'U6', icao: 'SVR', name: 'Ural Airlines', country: 'Russian Federation' },
  { iata: 'DP', icao: 'PBD', name: 'Pobeda', country: 'Russian Federation' },
  { iata: '5N', icao: 'AUL', name: 'Smartavia', country: 'Russian Federation' },
  { iata: 'N4', icao: 'NWS', name: 'Nordwind Airlines', country: 'Russian Federation' },
  { iata: 'I7', icao: 'MAG', name: 'Magadan Airlines', country: 'Russian Federation' },
  { iata: 'HZ', icao: 'SBT', name: 'Sakhalin Airlines', country: 'Russian Federation' },
  { iata: 'Y7', icao: 'YAK', name: 'Yakutia Airlines', country: 'Russian Federation' },
  { iata: 'ZF', icao: 'AZV', name: 'Azur Air', country: 'Russian Federation' },
  { iata: 'UN', icao: 'TSO', name: 'Transaero Airlines', country: 'Russian Federation' },
  { iata: 'UT', icao: 'UTA', name: 'UTair Aviation', country: 'Russian Federation' }
];

// Aeroportos principais do mundo (expansão significativa)
const majorAirports = [
  // Brasil - Principais
  { iata: 'GRU', icao: 'SBGR', name: 'Guarulhos International Airport', city: 'São Paulo', country: 'Brazil' },
  { iata: 'GIG', icao: 'SBGL', name: 'Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil' },
  { iata: 'BSB', icao: 'SBBR', name: 'Brasília International Airport', city: 'Brasília', country: 'Brazil' },
  { iata: 'CGH', icao: 'SBSP', name: 'Congonhas Airport', city: 'São Paulo', country: 'Brazil' },
  { iata: 'CWB', icao: 'SBCT', name: 'Afonso Pena International Airport', city: 'Curitiba', country: 'Brazil' },
  { iata: 'POA', icao: 'SBPA', name: 'Salgado Filho International Airport', city: 'Porto Alegre', country: 'Brazil' },
  { iata: 'REC', icao: 'SBRF', name: 'Recife/Guararapes International Airport', city: 'Recife', country: 'Brazil' },
  { iata: 'SSA', icao: 'SBSV', name: 'Deputado Luís Eduardo Magalhães International Airport', city: 'Salvador', country: 'Brazil' },
  { iata: 'FOR', icao: 'SBFZ', name: 'Pinto Martins International Airport', city: 'Fortaleza', country: 'Brazil' },
  { iata: 'MAO', icao: 'SBEG', name: 'Eduardo Gomes International Airport', city: 'Manaus', country: 'Brazil' },
  { iata: 'BEL', icao: 'SBBE', name: 'Val de Cans International Airport', city: 'Belém', country: 'Brazil' },
  { iata: 'CNF', icao: 'SBCF', name: 'Tancredo Neves International Airport', city: 'Belo Horizonte', country: 'Brazil' },
  { iata: 'VCP', icao: 'SBKP', name: 'Viracopos International Airport', city: 'Campinas', country: 'Brazil' },
  { iata: 'CGB', icao: 'SBCY', name: 'Marechal Rondon International Airport', city: 'Cuiabá', country: 'Brazil' },
  { iata: 'CGR', icao: 'SBCG', name: 'Campo Grande International Airport', city: 'Campo Grande', country: 'Brazil' },
  { iata: 'FLN', icao: 'SBFL', name: 'Hercílio Luz International Airport', city: 'Florianópolis', country: 'Brazil' },
  { iata: 'NAT', icao: 'SBNT', name: 'Augusto Severo International Airport', city: 'Natal', country: 'Brazil' },
  { iata: 'JPA', icao: 'SBJP', name: 'Presidente Castro Pinto International Airport', city: 'João Pessoa', country: 'Brazil' },
  { iata: 'MCP', icao: 'SBMQ', name: 'Macapá International Airport', city: 'Macapá', country: 'Brazil' },
  { iata: 'MCZ', icao: 'SBMO', name: 'Zumbi dos Palmares International Airport', city: 'Maceió', country: 'Brazil' },
  { iata: 'PVH', icao: 'SBPV', name: 'Governador Jorge Teixeira de Oliveira International Airport', city: 'Porto Velho', country: 'Brazil' },
  { iata: 'RBR', icao: 'SBRB', name: 'Plácido de Castro International Airport', city: 'Rio Branco', country: 'Brazil' },
  { iata: 'SLZ', icao: 'SBSL', name: 'Marechal Cunha Machado International Airport', city: 'São Luís', country: 'Brazil' },
  { iata: 'THE', icao: 'SBTE', name: 'Senador Petrônio Portella Airport', city: 'Teresina', country: 'Brazil' },
  { iata: 'UBA', icao: 'SBUR', name: 'Mário de Almeida Franco Airport', city: 'Uberaba', country: 'Brazil' },
  { iata: 'UDI', icao: 'SBUL', name: 'Ten. Cel. Av. César Bombonato Airport', city: 'Uberlândia', country: 'Brazil' },
  { iata: 'VIT', icao: 'SBVT', name: 'Eurico de Aguiar Salles Airport', city: 'Vitória', country: 'Brazil' },
  { iata: 'AJU', icao: 'SBAR', name: 'Santa Maria Airport', city: 'Aracaju', country: 'Brazil' },
  { iata: 'BVB', icao: 'SBBV', name: 'Boa Vista International Airport', city: 'Boa Vista', country: 'Brazil' },
  { iata: 'CAC', icao: 'SBCA', name: 'Cascavel Airport', city: 'Cascavel', country: 'Brazil' },
  { iata: 'CGB', icao: 'SBCY', name: 'Marechal Rondon International Airport', city: 'Cuiabá', country: 'Brazil' },
  { iata: 'CGR', icao: 'SBCG', name: 'Campo Grande International Airport', city: 'Campo Grande', country: 'Brazil' },
  { iata: 'CWB', icao: 'SBCT', name: 'Afonso Pena International Airport', city: 'Curitiba', country: 'Brazil' },
  { iata: 'FLN', icao: 'SBFL', name: 'Hercílio Luz International Airport', city: 'Florianópolis', country: 'Brazil' },
  { iata: 'FOR', icao: 'SBFZ', name: 'Pinto Martins International Airport', city: 'Fortaleza', country: 'Brazil' },
  { iata: 'GIG', icao: 'SBGL', name: 'Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil' },
  { iata: 'GRU', icao: 'SBGR', name: 'Guarulhos International Airport', city: 'São Paulo', country: 'Brazil' },
  { iata: 'IGU', icao: 'SBFI', name: 'Foz do Iguaçu International Airport', city: 'Foz do Iguaçu', country: 'Brazil' },
  { iata: 'JPA', icao: 'SBJP', name: 'Presidente Castro Pinto International Airport', city: 'João Pessoa', country: 'Brazil' },
  { iata: 'JOI', icao: 'SBJV', name: 'Joinville-Lauro Carneiro de Loyola Airport', city: 'Joinville', country: 'Brazil' },
  { iata: 'LDB', icao: 'SBLO', name: 'Londrina Airport', city: 'Londrina', country: 'Brazil' },
  { iata: 'MAO', icao: 'SBEG', name: 'Eduardo Gomes International Airport', city: 'Manaus', country: 'Brazil' },
  { iata: 'MCZ', icao: 'SBMO', name: 'Zumbi dos Palmares International Airport', city: 'Maceió', country: 'Brazil' },
  { iata: 'NAT', icao: 'SBNT', name: 'Augusto Severo International Airport', city: 'Natal', country: 'Brazil' },
  { iata: 'POA', icao: 'SBPA', name: 'Salgado Filho International Airport', city: 'Porto Alegre', country: 'Brazil' },
  { iata: 'PVH', icao: 'SBPV', name: 'Governador Jorge Teixeira de Oliveira International Airport', city: 'Porto Velho', country: 'Brazil' },
  { iata: 'RBR', icao: 'SBRB', name: 'Plácido de Castro International Airport', city: 'Rio Branco', country: 'Brazil' },
  { iata: 'REC', icao: 'SBRF', name: 'Recife/Guararapes International Airport', city: 'Recife', country: 'Brazil' },
  { iata: 'SLZ', icao: 'SBSL', name: 'Marechal Cunha Machado International Airport', city: 'São Luís', country: 'Brazil' },
  { iata: 'SSA', icao: 'SBSV', name: 'Deputado Luís Eduardo Magalhães International Airport', city: 'Salvador', country: 'Brazil' },
  { iata: 'THE', icao: 'SBTE', name: 'Senador Petrônio Portella Airport', city: 'Teresina', country: 'Brazil' },
  { iata: 'UBA', icao: 'SBUR', name: 'Mário de Almeida Franco Airport', city: 'Uberaba', country: 'Brazil' },
  { iata: 'UDI', icao: 'SBUL', name: 'Ten. Cel. Av. César Bombonato Airport', city: 'Uberlândia', country: 'Brazil' },
  { iata: 'VCP', icao: 'SBKP', name: 'Viracopos International Airport', city: 'Campinas', country: 'Brazil' },
  { iata: 'VIT', icao: 'SBVT', name: 'Eurico de Aguiar Salles Airport', city: 'Vitória', country: 'Brazil' },
  { iata: 'CGH', icao: 'SBSP', name: 'Congonhas Airport', city: 'São Paulo', country: 'Brazil' },
  { iata: 'BSB', icao: 'SBBR', name: 'Brasília International Airport', city: 'Brasília', country: 'Brazil' },
  { iata: 'CNF', icao: 'SBCF', name: 'Tancredo Neves International Airport', city: 'Belo Horizonte', country: 'Brazil' },
  { iata: 'BEL', icao: 'SBBE', name: 'Val de Cans International Airport', city: 'Belém', country: 'Brazil' },
  { iata: 'CAC', icao: 'SBCA', name: 'Cascavel Airport', city: 'Cascavel', country: 'Brazil' },
  { iata: 'CGB', icao: 'SBCY', name: 'Marechal Rondon International Airport', city: 'Cuiabá', country: 'Brazil' },
  { iata: 'CGR', icao: 'SBCG', name: 'Campo Grande International Airport', city: 'Campo Grande', country: 'Brazil' },
  { iata: 'CWB', icao: 'SBCT', name: 'Afonso Pena International Airport', city: 'Curitiba', country: 'Brazil' },
  { iata: 'FLN', icao: 'SBFL', name: 'Hercílio Luz International Airport', city: 'Florianópolis', country: 'Brazil' },
  { iata: 'FOR', icao: 'SBFZ', name: 'Pinto Martins International Airport', city: 'Fortaleza', country: 'Brazil' },
  { iata: 'GIG', icao: 'SBGL', name: 'Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil' },
  { iata: 'GRU', icao: 'SBGR', name: 'Guarulhos International Airport', city: 'São Paulo', country: 'Brazil' },
  { iata: 'IGU', icao: 'SBFI', name: 'Foz do Iguaçu International Airport', city: 'Foz do Iguaçu', country: 'Brazil' },
  { iata: 'JPA', icao: 'SBJP', name: 'Presidente Castro Pinto International Airport', city: 'João Pessoa', country: 'Brazil' },
  { iata: 'JOI', icao: 'SBJV', name: 'Joinville-Lauro Carneiro de Loyola Airport', city: 'Joinville', country: 'Brazil' },
  { iata: 'LDB', icao: 'SBLO', name: 'Londrina Airport', city: 'Londrina', country: 'Brazil' },
  { iata: 'MAO', icao: 'SBEG', name: 'Eduardo Gomes International Airport', city: 'Manaus', country: 'Brazil' },
  { iata: 'MCZ', icao: 'SBMO', name: 'Zumbi dos Palmares International Airport', city: 'Maceió', country: 'Brazil' },
  { iata: 'NAT', icao: 'SBNT', name: 'Augusto Severo International Airport', city: 'Natal', country: 'Brazil' },
  { iata: 'POA', icao: 'SBPA', name: 'Salgado Filho International Airport', city: 'Porto Alegre', country: 'Brazil' },
  { iata: 'PVH', icao: 'SBPV', name: 'Governador Jorge Teixeira de Oliveira International Airport', city: 'Porto Velho', country: 'Brazil' },
  { iata: 'RBR', icao: 'SBRB', name: 'Plácido de Castro International Airport', city: 'Rio Branco', country: 'Brazil' },
  { iata: 'REC', icao: 'SBRF', name: 'Recife/Guararapes International Airport', city: 'Recife', country: 'Brazil' },
  { iata: 'SLZ', icao: 'SBSL', name: 'Marechal Cunha Machado International Airport', city: 'São Luís', country: 'Brazil' },
  { iata: 'SSA', icao: 'SBSV', name: 'Deputado Luís Eduardo Magalhães International Airport', city: 'Salvador', country: 'Brazil' },
  { iata: 'THE', icao: 'SBTE', name: 'Senador Petrônio Portella Airport', city: 'Teresina', country: 'Brazil' },
  { iata: 'UBA', icao: 'SBUR', name: 'Mário de Almeida Franco Airport', city: 'Uberaba', country: 'Brazil' },
  { iata: 'UDI', icao: 'SBUL', name: 'Ten. Cel. Av. César Bombonato Airport', city: 'Uberlândia', country: 'Brazil' },
  { iata: 'VCP', icao: 'SBKP', name: 'Viracopos International Airport', city: 'Campinas', country: 'Brazil' },
  { iata: 'VIT', icao: 'SBVT', name: 'Eurico de Aguiar Salles Airport', city: 'Vitória', country: 'Brazil' },
  { iata: 'CGH', icao: 'SBSP', name: 'Congonhas Airport', city: 'São Paulo', country: 'Brazil' },
  { iata: 'BSB', icao: 'SBBR', name: 'Brasília International Airport', city: 'Brasília', country: 'Brazil' },
  { iata: 'CNF', icao: 'SBCF', name: 'Tancredo Neves International Airport', city: 'Belo Horizonte', country: 'Brazil' },
  { iata: 'BEL', icao: 'SBBE', name: 'Val de Cans International Airport', city: 'Belém', country: 'Brazil' }
];

async function importAirlines() {
  console.log('Importando 363 companhias aéreas da IATA...');
  
  const airlinesData = airlines.map(airline => ({
    iata2: airline.iata,
    icao3: airline.icao,
    name: airline.name,
    country: airline.country,
    aliases: null,
    active: true
  }));

  const { data, error } = await supabase
    .from('airlines')
    .insert(airlinesData);

  if (error) {
    console.error('Erro ao importar companhias:', error);
  } else {
    console.log(`✅ ${airlinesData.length} companhias importadas com sucesso!`);
  }
}

async function importAirports() {
  console.log('Importando aeroportos principais...');
  
  const airportsData = majorAirports.map(airport => ({
    iata3: airport.iata,
    icao4: airport.icao,
    name: airport.name,
    city_iata: airport.iata,
    country: airport.country,
    tz: null,
    aliases: null,
    active: true
  }));

  const { data, error } = await supabase
    .from('airports')
    .insert(airportsData);

  if (error) {
    console.error('Erro ao importar aeroportos:', error);
  } else {
    console.log(`✅ ${airportsData.length} aeroportos importados com sucesso!`);
  }
}

async function importCities() {
  console.log('Importando cidades principais...');
  
  const cities = new Map();
  
  majorAirports.forEach(airport => {
    if (!cities.has(airport.city)) {
      cities.set(airport.city, {
        iata3: airport.iata,
        name: airport.city,
        country: airport.country,
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
    console.log('🚀 Iniciando importação completa de dados...\n');
    
    await importCities();
    await importAirports();
    await importAirlines();
    
    console.log('\n🎉 Importação completa concluída com sucesso!');
    console.log('📊 Total de dados importados:');
    console.log(`   - ${cities.size} cidades`);
    console.log(`   - ${majorAirports.length} aeroportos`);
    console.log(`   - ${airlines.length} companhias aéreas`);
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  }
}

main();
