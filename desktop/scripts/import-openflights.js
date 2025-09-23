import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dgverpbhxtslmfrrcwwj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs';

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados de aeroportos principais do mundo (top 100)
const majorAirports = [
  { iata: 'ATL', icao: 'KATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States' },
  { iata: 'LAX', icao: 'KLAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States' },
  { iata: 'ORD', icao: 'KORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'United States' },
  { iata: 'DFW', icao: 'KDFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'United States' },
  { iata: 'DEN', icao: 'KDEN', name: 'Denver International Airport', city: 'Denver', country: 'United States' },
  { iata: 'JFK', icao: 'KJFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States' },
  { iata: 'SFO', icao: 'KSFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States' },
  { iata: 'SEA', icao: 'KSEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States' },
  { iata: 'LAS', icao: 'KLAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'United States' },
  { iata: 'MIA', icao: 'KMIA', name: 'Miami International Airport', city: 'Miami', country: 'United States' },
  { iata: 'PHX', icao: 'KPHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'United States' },
  { iata: 'EWR', icao: 'KEWR', name: 'Newark Liberty International Airport', city: 'Newark', country: 'United States' },
  { iata: 'MCO', icao: 'KMCO', name: 'Orlando International Airport', city: 'Orlando', country: 'United States' },
  { iata: 'CLT', icao: 'KCLT', name: 'Charlotte Douglas International Airport', city: 'Charlotte', country: 'United States' },
  { iata: 'BOS', icao: 'KBOS', name: 'Logan International Airport', city: 'Boston', country: 'United States' },
  { iata: 'DTW', icao: 'KDTW', name: 'Detroit Metropolitan Wayne County Airport', city: 'Detroit', country: 'United States' },
  { iata: 'PHL', icao: 'KPHL', name: 'Philadelphia International Airport', city: 'Philadelphia', country: 'United States' },
  { iata: 'LGA', icao: 'KLGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States' },
  { iata: 'BWI', icao: 'KBWI', name: 'Baltimore/Washington International Thurgood Marshall Airport', city: 'Baltimore', country: 'United States' },
  { iata: 'SLC', icao: 'KSLC', name: 'Salt Lake City International Airport', city: 'Salt Lake City', country: 'United States' },
  { iata: 'DCA', icao: 'KDCA', name: 'Ronald Reagan Washington National Airport', city: 'Washington', country: 'United States' },
  { iata: 'MDW', icao: 'KMDW', name: 'Chicago Midway International Airport', city: 'Chicago', country: 'United States' },
  { iata: 'HNL', icao: 'PHNL', name: 'Daniel K. Inouye International Airport', city: 'Honolulu', country: 'United States' },
  { iata: 'PDX', icao: 'KPDX', name: 'Portland International Airport', city: 'Portland', country: 'United States' },
  { iata: 'STL', icao: 'KSTL', name: 'St. Louis Lambert International Airport', city: 'St. Louis', country: 'United States' },
  { iata: 'TPA', icao: 'KTPA', name: 'Tampa International Airport', city: 'Tampa', country: 'United States' },
  { iata: 'SAN', icao: 'KSAN', name: 'San Diego International Airport', city: 'San Diego', country: 'United States' },
  { iata: 'BNA', icao: 'KBNA', name: 'Nashville International Airport', city: 'Nashville', country: 'United States' },
  { iata: 'AUS', icao: 'KAUS', name: 'Austin-Bergstrom International Airport', city: 'Austin', country: 'United States' },
  { iata: 'MSP', icao: 'KMSP', name: 'Minneapolis-Saint Paul International Airport', city: 'Minneapolis', country: 'United States' },
  { iata: 'FLL', icao: 'KFLL', name: 'Fort Lauderdale-Hollywood International Airport', city: 'Fort Lauderdale', country: 'United States' },
  { iata: 'IAD', icao: 'KIAD', name: 'Washington Dulles International Airport', city: 'Washington', country: 'United States' },
  { iata: 'MCI', icao: 'KMCI', name: 'Kansas City International Airport', city: 'Kansas City', country: 'United States' },
  { iata: 'CLE', icao: 'KCLE', name: 'Cleveland Hopkins International Airport', city: 'Cleveland', country: 'United States' },
  { iata: 'PIT', icao: 'KPIT', name: 'Pittsburgh International Airport', city: 'Pittsburgh', country: 'United States' },
  { iata: 'CVG', icao: 'KCVG', name: 'Cincinnati/Northern Kentucky International Airport', city: 'Cincinnati', country: 'United States' },
  { iata: 'RDU', icao: 'KRDU', name: 'Raleigh-Durham International Airport', city: 'Raleigh', country: 'United States' },
  { iata: 'IND', icao: 'KIND', name: 'Indianapolis International Airport', city: 'Indianapolis', country: 'United States' },
  { iata: 'CMH', icao: 'KCMH', name: 'John Glenn Columbus International Airport', city: 'Columbus', country: 'United States' },
  { iata: 'MKE', icao: 'KMKE', name: 'Milwaukee Mitchell International Airport', city: 'Milwaukee', country: 'United States' },
  { iata: 'PBI', icao: 'KPBI', name: 'Palm Beach International Airport', city: 'West Palm Beach', country: 'United States' },
  { iata: 'SJC', icao: 'KSJC', name: 'Norman Y. Mineta San José International Airport', city: 'San Jose', country: 'United States' },
  { iata: 'OAK', icao: 'KOAK', name: 'Oakland International Airport', city: 'Oakland', country: 'United States' },
  { iata: 'SNA', icao: 'KSNA', name: 'John Wayne Airport', city: 'Santa Ana', country: 'United States' },
  { iata: 'BUR', icao: 'KBUR', name: 'Hollywood Burbank Airport', city: 'Burbank', country: 'United States' },
  { iata: 'ONT', icao: 'KONT', name: 'Ontario International Airport', city: 'Ontario', country: 'United States' },
  { iata: 'SAC', icao: 'KSMF', name: 'Sacramento International Airport', city: 'Sacramento', country: 'United States' },
  { iata: 'SLC', icao: 'KSLC', name: 'Salt Lake City International Airport', city: 'Salt Lake City', country: 'United States' },
  { iata: 'ABQ', icao: 'KABQ', name: 'Albuquerque International Sunport', city: 'Albuquerque', country: 'United States' },
  { iata: 'TUS', icao: 'KTUS', name: 'Tucson International Airport', city: 'Tucson', country: 'United States' },
  { iata: 'ELP', icao: 'KELP', name: 'El Paso International Airport', city: 'El Paso', country: 'United States' },
  { iata: 'OKC', icao: 'KOKC', name: 'Will Rogers World Airport', city: 'Oklahoma City', country: 'United States' },
  { iata: 'TUL', icao: 'KTUL', name: 'Tulsa International Airport', city: 'Tulsa', country: 'United States' },
  { iata: 'LIT', icao: 'KLIT', name: 'Bill and Hillary Clinton National Airport', city: 'Little Rock', country: 'United States' },
  { iata: 'MEM', icao: 'KMEM', name: 'Memphis International Airport', city: 'Memphis', country: 'United States' },
  { iata: 'BHM', icao: 'KBHM', name: 'Birmingham-Shuttlesworth International Airport', city: 'Birmingham', country: 'United States' },
  { iata: 'MSY', icao: 'KMSY', name: 'Louis Armstrong New Orleans International Airport', city: 'New Orleans', country: 'United States' },
  { iata: 'JAX', icao: 'KJAX', name: 'Jacksonville International Airport', city: 'Jacksonville', country: 'United States' },
  { iata: 'RSW', icao: 'KRSW', name: 'Southwest Florida International Airport', city: 'Fort Myers', country: 'United States' },
  { iata: 'PNS', icao: 'KPNS', name: 'Pensacola International Airport', city: 'Pensacola', country: 'United States' },
  { iata: 'TLH', icao: 'KTLH', name: 'Tallahassee International Airport', city: 'Tallahassee', country: 'United States' },
  { iata: 'GSP', icao: 'KGSP', name: 'Greenville-Spartanburg International Airport', city: 'Greenville', country: 'United States' },
  { iata: 'CHS', icao: 'KCHS', name: 'Charleston International Airport', city: 'Charleston', country: 'United States' },
  { iata: 'GSO', icao: 'KGSO', name: 'Piedmont Triad International Airport', city: 'Greensboro', country: 'United States' },
  { iata: 'ORF', icao: 'KORF', name: 'Norfolk International Airport', city: 'Norfolk', country: 'United States' },
  { iata: 'RIC', icao: 'KRIC', name: 'Richmond International Airport', city: 'Richmond', country: 'United States' },
  { iata: 'ROA', icao: 'KROA', name: 'Roanoke-Blacksburg Regional Airport', city: 'Roanoke', country: 'United States' },
  { iata: 'CRW', icao: 'KCRW', name: 'Yeager Airport', city: 'Charleston', country: 'United States' },
  { iata: 'LEX', icao: 'KLEX', name: 'Blue Grass Airport', city: 'Lexington', country: 'United States' },
  { iata: 'SDF', icao: 'KSDF', name: 'Louisville Muhammad Ali International Airport', city: 'Louisville', country: 'United States' },
  { iata: 'EVV', icao: 'KEVV', name: 'Evansville Regional Airport', city: 'Evansville', country: 'United States' },
  { iata: 'FWA', icao: 'KFWA', name: 'Fort Wayne International Airport', city: 'Fort Wayne', country: 'United States' },
  { iata: 'DAY', icao: 'KDAY', name: 'Dayton International Airport', city: 'Dayton', country: 'United States' },
  { iata: 'TOL', icao: 'KTOL', name: 'Toledo Express Airport', city: 'Toledo', country: 'United States' },
  { iata: 'CAK', icao: 'KCAK', name: 'Akron-Canton Regional Airport', city: 'Akron', country: 'United States' },
  { iata: 'ERI', icao: 'KERI', name: 'Erie International Airport', city: 'Erie', country: 'United States' },
  { iata: 'BUF', icao: 'KBUF', name: 'Buffalo Niagara International Airport', city: 'Buffalo', country: 'United States' },
  { iata: 'ROC', icao: 'KROC', name: 'Greater Rochester International Airport', city: 'Rochester', country: 'United States' },
  { iata: 'SYR', icao: 'KSYR', name: 'Syracuse Hancock International Airport', city: 'Syracuse', country: 'United States' },
  { iata: 'ALB', icao: 'KALB', name: 'Albany International Airport', city: 'Albany', country: 'United States' },
  { iata: 'BTV', icao: 'KBTV', name: 'Burlington International Airport', city: 'Burlington', country: 'United States' },
  { iata: 'MHT', icao: 'KMHT', name: 'Manchester-Boston Regional Airport', city: 'Manchester', country: 'United States' },
  { iata: 'PVD', icao: 'KPVD', name: 'T. F. Green Airport', city: 'Providence', country: 'United States' },
  { iata: 'BDL', icao: 'KBDL', name: 'Bradley International Airport', city: 'Hartford', country: 'United States' },
  { iata: 'BGR', icao: 'KBGR', name: 'Bangor International Airport', city: 'Bangor', country: 'United States' },
  { iata: 'PWM', icao: 'KPWM', name: 'Portland International Jetport', city: 'Portland', country: 'United States' },
  { iata: 'BOS', icao: 'KBOS', name: 'Logan International Airport', city: 'Boston', country: 'United States' },
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
  { iata: 'CWB', icao: 'SBCT', name: 'Afonso Pena International Airport', city: 'Curitiba', country: 'Brazil' },
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
  { iata: 'CDG', icao: 'LFPG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  { iata: 'ORY', icao: 'LFPO', name: 'Orly Airport', city: 'Paris', country: 'France' },
  { iata: 'LYS', icao: 'LFLL', name: 'Lyon-Saint Exupéry Airport', city: 'Lyon', country: 'France' },
  { iata: 'MRS', icao: 'LFML', name: 'Marseille Provence Airport', city: 'Marseille', country: 'France' },
  { iata: 'TLS', icao: 'LFBO', name: 'Toulouse-Blagnac Airport', city: 'Toulouse', country: 'France' },
  { iata: 'NCE', icao: 'LFMN', name: 'Nice Côte d\'Azur Airport', city: 'Nice', country: 'France' },
  { iata: 'BOD', icao: 'LFBD', name: 'Bordeaux-Mérignac Airport', city: 'Bordeaux', country: 'France' },
  { iata: 'LIL', icao: 'LFQQ', name: 'Lille Airport', city: 'Lille', country: 'France' },
  { iata: 'NTE', icao: 'LFRS', name: 'Nantes Atlantique Airport', city: 'Nantes', country: 'France' },
  { iata: 'STR', icao: 'EDDS', name: 'Stuttgart Airport', city: 'Stuttgart', country: 'Germany' },
  { iata: 'FRA', icao: 'EDDF', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { iata: 'MUC', icao: 'EDDM', name: 'Munich Airport', city: 'Munich', country: 'Germany' },
  { iata: 'DUS', icao: 'EDDL', name: 'Düsseldorf Airport', city: 'Düsseldorf', country: 'Germany' },
  { iata: 'HAM', icao: 'EDDH', name: 'Hamburg Airport', city: 'Hamburg', country: 'Germany' },
  { iata: 'CGN', icao: 'EDDK', name: 'Cologne Bonn Airport', city: 'Cologne', country: 'Germany' },
  { iata: 'TXL', icao: 'EDDT', name: 'Berlin Tegel Airport', city: 'Berlin', country: 'Germany' },
  { iata: 'SXF', icao: 'EDDB', name: 'Berlin Schönefeld Airport', city: 'Berlin', country: 'Germany' },
  { iata: 'BRE', icao: 'EDDW', name: 'Bremen Airport', city: 'Bremen', country: 'Germany' },
  { iata: 'HAJ', icao: 'EDDV', name: 'Hannover Airport', city: 'Hannover', country: 'Germany' },
  { iata: 'LEJ', icao: 'EDDP', name: 'Leipzig/Halle Airport', city: 'Leipzig', country: 'Germany' },
  { iata: 'NUE', icao: 'EDDN', name: 'Nuremberg Airport', city: 'Nuremberg', country: 'Germany' },
  { iata: 'DRS', icao: 'EDDC', name: 'Dresden Airport', city: 'Dresden', country: 'Germany' },
  { iata: 'LHR', icao: 'EGLL', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
  { iata: 'LGW', icao: 'EGKK', name: 'Gatwick Airport', city: 'London', country: 'United Kingdom' },
  { iata: 'STN', icao: 'EGSS', name: 'Stansted Airport', city: 'London', country: 'United Kingdom' },
  { iata: 'LTN', icao: 'EGGW', name: 'Luton Airport', city: 'London', country: 'United Kingdom' },
  { iata: 'BHX', icao: 'EGBB', name: 'Birmingham Airport', city: 'Birmingham', country: 'United Kingdom' },
  { iata: 'MAN', icao: 'EGCC', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom' },
  { iata: 'EDI', icao: 'EGPH', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'United Kingdom' },
  { iata: 'GLA', icao: 'EGPF', name: 'Glasgow Airport', city: 'Glasgow', country: 'United Kingdom' },
  { iata: 'BFS', icao: 'EGAA', name: 'Belfast International Airport', city: 'Belfast', country: 'United Kingdom' },
  { iata: 'BHD', icao: 'EGAC', name: 'George Best Belfast City Airport', city: 'Belfast', country: 'United Kingdom' },
  { iata: 'NCL', icao: 'EGNT', name: 'Newcastle Airport', city: 'Newcastle', country: 'United Kingdom' },
  { iata: 'LPL', icao: 'EGGP', name: 'Liverpool John Lennon Airport', city: 'Liverpool', country: 'United Kingdom' },
  { iata: 'BRS', icao: 'EGGD', name: 'Bristol Airport', city: 'Bristol', country: 'United Kingdom' },
  { iata: 'CWL', icao: 'EGFF', name: 'Cardiff Airport', city: 'Cardiff', country: 'United Kingdom' },
  { iata: 'EXT', icao: 'EGTE', name: 'Exeter Airport', city: 'Exeter', country: 'United Kingdom' },
  { iata: 'SOU', icao: 'EGHI', name: 'Southampton Airport', city: 'Southampton', country: 'United Kingdom' },
  { iata: 'BOH', icao: 'EGHH', name: 'Bournemouth Airport', city: 'Bournemouth', country: 'United Kingdom' },
  { iata: 'NQY', icao: 'EGDG', name: 'Newquay Cornwall Airport', city: 'Newquay', country: 'United Kingdom' },
  { iata: 'PLH', icao: 'EGHD', name: 'Plymouth City Airport', city: 'Plymouth', country: 'United Kingdom' },
  { iata: 'LEQ', icao: 'EGHC', name: 'Land\'s End Airport', city: 'Land\'s End', country: 'United Kingdom' },
  { iata: 'ISC', icao: 'EGHE', name: 'St Mary\'s Airport', city: 'St Mary\'s', country: 'United Kingdom' },
  { iata: 'TRE', icao: 'EGET', name: 'Tresco Heliport', city: 'Tresco', country: 'United Kingdom' },
  { iata: 'MAD', icao: 'LEMD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain' },
  { iata: 'BCN', icao: 'LEBL', name: 'Barcelona–El Prat Airport', city: 'Barcelona', country: 'Spain' },
  { iata: 'VLC', icao: 'LEVC', name: 'Valencia Airport', city: 'Valencia', country: 'Spain' },
  { iata: 'SVQ', icao: 'LEZL', name: 'Seville Airport', city: 'Seville', country: 'Spain' },
  { iata: 'BIO', icao: 'LEBB', name: 'Bilbao Airport', city: 'Bilbao', country: 'Spain' },
  { iata: 'AGP', icao: 'LEMG', name: 'Málaga Airport', city: 'Málaga', country: 'Spain' },
  { iata: 'ALC', icao: 'LEAL', name: 'Alicante Airport', city: 'Alicante', country: 'Spain' },
  { iata: 'IBZ', icao: 'LEIB', name: 'Ibiza Airport', city: 'Ibiza', country: 'Spain' },
  { iata: 'PMI', icao: 'LEPA', name: 'Palma de Mallorca Airport', city: 'Palma', country: 'Spain' },
  { iata: 'TFS', icao: 'GCTS', name: 'Tenerife South Airport', city: 'Tenerife', country: 'Spain' },
  { iata: 'TFN', icao: 'GCXO', name: 'Tenerife North Airport', city: 'Tenerife', country: 'Spain' },
  { iata: 'LPA', icao: 'GCLP', name: 'Gran Canaria Airport', city: 'Las Palmas', country: 'Spain' },
  { iata: 'FUE', icao: 'GCFV', name: 'Fuerteventura Airport', city: 'Fuerteventura', country: 'Spain' },
  { iata: 'ACE', icao: 'GCRR', name: 'Lanzarote Airport', city: 'Lanzarote', country: 'Spain' },
  { iata: 'LCG', icao: 'LEGA', name: 'A Coruña Airport', city: 'A Coruña', country: 'Spain' },
  { iata: 'VGO', icao: 'LEVX', name: 'Vigo Airport', city: 'Vigo', country: 'Spain' },
  { iata: 'OVD', icao: 'LEAS', name: 'Asturias Airport', city: 'Oviedo', country: 'Spain' },
  { iata: 'SDR', icao: 'LEXJ', name: 'Santander Airport', city: 'Santander', country: 'Spain' },
  { iata: 'REU', icao: 'LERS', name: 'Reus Airport', city: 'Reus', country: 'Spain' },
  { iata: 'GRO', icao: 'LEGE', name: 'Girona Airport', city: 'Girona', country: 'Spain' },
  { iata: 'LEJ', icao: 'LEZL', name: 'Seville Airport', city: 'Seville', country: 'Spain' },
  { iata: 'FCO', icao: 'LIRF', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy' },
  { iata: 'LIN', icao: 'LIML', name: 'Milan Linate Airport', city: 'Milan', country: 'Italy' },
  { iata: 'MXP', icao: 'LIMC', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy' },
  { iata: 'BGY', icao: 'LIME', name: 'Bergamo Orio al Serio Airport', city: 'Bergamo', country: 'Italy' },
  { iata: 'VCE', icao: 'LIPZ', name: 'Venice Marco Polo Airport', city: 'Venice', country: 'Italy' },
  { iata: 'BLQ', icao: 'LIPE', name: 'Bologna Guglielmo Marconi Airport', city: 'Bologna', country: 'Italy' },
  { iata: 'FLR', icao: 'LIRQ', name: 'Florence Airport', city: 'Florence', country: 'Italy' },
  { iata: 'PSA', icao: 'LIRP', name: 'Pisa International Airport', city: 'Pisa', country: 'Italy' },
  { iata: 'NAP', icao: 'LIRN', name: 'Naples International Airport', city: 'Naples', country: 'Italy' },
  { iata: 'BRI', icao: 'LIBD', name: 'Bari Karol Wojtyła Airport', city: 'Bari', country: 'Italy' },
  { iata: 'BDS', icao: 'LIBR', name: 'Brindisi Airport', city: 'Brindisi', country: 'Italy' },
  { iata: 'CTA', icao: 'LICC', name: 'Catania-Fontanarossa Airport', city: 'Catania', country: 'Italy' },
  { iata: 'PMO', icao: 'LICJ', name: 'Palermo Airport', city: 'Palermo', country: 'Italy' },
  { iata: 'CAG', icao: 'LIEE', name: 'Cagliari Elmas Airport', city: 'Cagliari', country: 'Italy' },
  { iata: 'OLB', icao: 'LIEO', name: 'Olbia Costa Smeralda Airport', city: 'Olbia', country: 'Italy' },
  { iata: 'AHO', icao: 'LIEA', name: 'Alghero-Fertilia Airport', city: 'Alghero', country: 'Italy' },
  { iata: 'TRN', icao: 'LIMF', name: 'Turin Airport', city: 'Turin', country: 'Italy' },
  { iata: 'GOA', icao: 'LIMJ', name: 'Genoa Cristoforo Colombo Airport', city: 'Genoa', country: 'Italy' },
  { iata: 'VRN', icao: 'LIPX', name: 'Verona Villafranca Airport', city: 'Verona', country: 'Italy' },
  { iata: 'TSF', icao: 'LIPH', name: 'Treviso Airport', city: 'Treviso', country: 'Italy' },
  { iata: 'VBS', icao: 'LIPO', name: 'Brescia Airport', city: 'Brescia', country: 'Italy' },
  { iata: 'BZO', icao: 'LIPB', name: 'Bolzano Airport', city: 'Bolzano', country: 'Italy' },
  { iata: 'TRS', icao: 'LIPQ', name: 'Trieste Airport', city: 'Trieste', country: 'Italy' },
  { iata: 'UDN', icao: 'LIPD', name: 'Udine Airport', city: 'Udine', country: 'Italy' },
  { iata: 'VCE', icao: 'LIPZ', name: 'Venice Marco Polo Airport', city: 'Venice', country: 'Italy' },
  { iata: 'BLQ', icao: 'LIPE', name: 'Bologna Guglielmo Marconi Airport', city: 'Bologna', country: 'Italy' },
  { iata: 'FLR', icao: 'LIRQ', name: 'Florence Airport', city: 'Florence', country: 'Italy' },
  { iata: 'PSA', icao: 'LIRP', name: 'Pisa International Airport', city: 'Pisa', country: 'Italy' },
  { iata: 'NAP', icao: 'LIRN', name: 'Naples International Airport', city: 'Naples', country: 'Italy' },
  { iata: 'BRI', icao: 'LIBD', name: 'Bari Karol Wojtyła Airport', city: 'Bari', country: 'Italy' },
  { iata: 'BDS', icao: 'LIBR', name: 'Brindisi Airport', city: 'Brindisi', country: 'Italy' },
  { iata: 'CTA', icao: 'LICC', name: 'Catania-Fontanarossa Airport', city: 'Catania', country: 'Italy' },
  { iata: 'PMO', icao: 'LICJ', name: 'Palermo Airport', city: 'Palermo', country: 'Italy' },
  { iata: 'CAG', icao: 'LIEE', name: 'Cagliari Elmas Airport', city: 'Cagliari', country: 'Italy' },
  { iata: 'OLB', icao: 'LIEO', name: 'Olbia Costa Smeralda Airport', city: 'Olbia', country: 'Italy' },
  { iata: 'AHO', icao: 'LIEA', name: 'Alghero-Fertilia Airport', city: 'Alghero', country: 'Italy' },
  { iata: 'TRN', icao: 'LIMF', name: 'Turin Airport', city: 'Turin', country: 'Italy' },
  { iata: 'GOA', icao: 'LIMJ', name: 'Genoa Cristoforo Colombo Airport', city: 'Genoa', country: 'Italy' },
  { iata: 'VRN', icao: 'LIPX', name: 'Verona Villafranca Airport', city: 'Verona', country: 'Italy' },
  { iata: 'TSF', icao: 'LIPH', name: 'Treviso Airport', city: 'Treviso', country: 'Italy' },
  { iata: 'VBS', icao: 'LIPO', name: 'Brescia Airport', city: 'Brescia', country: 'Italy' },
  { iata: 'BZO', icao: 'LIPB', name: 'Bolzano Airport', city: 'Bolzano', country: 'Italy' },
  { iata: 'TRS', icao: 'LIPQ', name: 'Trieste Airport', city: 'Trieste', country: 'Italy' },
  { iata: 'UDN', icao: 'LIPD', name: 'Udine Airport', city: 'Udine', country: 'Italy' }
];

async function importMajorAirports() {
  console.log('Importando aeroportos principais...');
  
  const airports = majorAirports.map(airport => ({
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
    .insert(airports);

  if (error) {
    console.error('Erro ao importar aeroportos:', error);
  } else {
    console.log(`✅ ${airports.length} aeroportos importados com sucesso!`);
  }
}

async function importMajorCities() {
  console.log('Importando cidades principais...');
  
  // Extrair cidades únicas dos aeroportos
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
    console.log('🚀 Iniciando importação de aeroportos principais...\n');
    
    await importMajorCities();
    await importMajorAirports();
    
    console.log('\n🎉 Importação concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  }
}

main();
