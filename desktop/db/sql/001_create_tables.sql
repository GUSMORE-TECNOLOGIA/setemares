-- 7Mares Cotador - Schema do Banco de Dados
-- Execute este script no SQL Editor do Supabase Dashboard
-- Data: 2025-01-19

-- CIDADES
CREATE TABLE cities (
  id BIGSERIAL PRIMARY KEY,
  iata3 TEXT NOT NULL CHECK (char_length(iata3) = 3),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  aliases JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AEROPORTOS
CREATE TABLE airports (
  id BIGSERIAL PRIMARY KEY,
  iata3 TEXT NOT NULL CHECK (char_length(iata3) = 3),
  icao4 TEXT CHECK (char_length(icao4) = 4),
  name TEXT NOT NULL,
  city_iata TEXT NOT NULL,  -- ex.: "SAO" ou "GRU" conforme fonte
  country TEXT NOT NULL,
  tz TEXT,
  aliases JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_airports_iata3 ON airports(iata3);
CREATE INDEX idx_airports_name ON airports((lower(name)));

-- CIA AÉREA
CREATE TABLE airlines (
  id BIGSERIAL PRIMARY KEY,
  iata2 TEXT NOT NULL CHECK (char_length(iata2) = 2),
  icao3 TEXT CHECK (char_length(icao3) = 3),
  name TEXT NOT NULL,
  country TEXT,
  aliases JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_airlines_iata2 ON airlines(iata2);

-- OVERRIDES (correções criadas pelos usuários)
CREATE TABLE code_overrides (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL,                 -- "SAO", "GRU", "LA", etc.
  kind TEXT NOT NULL CHECK (kind IN ('city','airport','airline')),
  mapped_id BIGINT NOT NULL,          -- id da tabela de destino (cities/airports/airlines)
  note TEXT,
  created_by TEXT,                    -- e-mail/usuário (sem Auth por enquanto)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LOG de desconhecidos (telemetria para melhorar base)
CREATE TABLE codes_unknown (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  context JSONB,                      -- PNR/linha/cia/rota
  seen_at TIMESTAMPTZ DEFAULT now(),
  resolved BOOLEAN DEFAULT false
);

CREATE INDEX idx_codes_unknown_code ON codes_unknown(code);

-- QUOTES (armazenar histórico e facilitar reemissão do PDF)
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  family_name TEXT,
  class TEXT,
  currency TEXT DEFAULT 'USD',
  fare NUMERIC,
  taxes NUMERIC,
  rav NUMERIC,
  fee NUMERIC,
  incentive NUMERIC,
  total NUMERIC,
  payment_terms TEXT,
  penalty TEXT,
  baggage TEXT
);

CREATE TABLE quote_segments (
  id BIGSERIAL PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  carrier TEXT,           -- "LA"
  flight TEXT,            -- "8084"
  from_iata TEXT,         -- "GRU"
  to_iata TEXT,           -- "LHR"
  dep_utc TIMESTAMPTZ,
  arr_utc TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_quote_segments_quote_id ON quote_segments(quote_id);

-- Inserir dados iniciais básicos
INSERT INTO cities (iata3, name, country) VALUES
('SAO', 'São Paulo', 'Brazil'),
('RIO', 'Rio de Janeiro', 'Brazil'),
('BSB', 'Brasília', 'Brazil'),
('LIS', 'Lisboa', 'Portugal'),
('MAD', 'Madrid', 'Spain'),
('LHR', 'London', 'United Kingdom'),
('CDG', 'Paris', 'France'),
('FRA', 'Frankfurt', 'Germany'),
('JFK', 'New York', 'United States'),
('LAX', 'Los Angeles', 'United States');

INSERT INTO airports (iata3, icao4, name, city_iata, country) VALUES
('GRU', 'SBGR', 'Guarulhos International Airport', 'SAO', 'Brazil'),
('CGH', 'SBSP', 'Congonhas Airport', 'SAO', 'Brazil'),
('GIG', 'SBGL', 'Galeão International Airport', 'RIO', 'Brazil'),
('SDU', 'SBRJ', 'Santos Dumont Airport', 'RIO', 'Brazil'),
('BSB', 'SBBR', 'Brasília International Airport', 'BSB', 'Brazil'),
('LIS', 'LPPT', 'Humberto Delgado Airport', 'LIS', 'Portugal'),
('MAD', 'LEMD', 'Adolfo Suárez Madrid-Barajas Airport', 'MAD', 'Spain'),
('LHR', 'EGLL', 'Heathrow Airport', 'LHR', 'United Kingdom'),
('CDG', 'LFPG', 'Charles de Gaulle Airport', 'CDG', 'France'),
('FRA', 'EDDF', 'Frankfurt Airport', 'FRA', 'Germany');

INSERT INTO airlines (iata2, icao3, name, country) VALUES
('LA', 'LAN', 'LATAM Airlines', 'Chile'),
('TP', 'TAP', 'TAP Air Portugal', 'Portugal'),
('BA', 'BAW', 'British Airways', 'United Kingdom'),
('IB', 'IBE', 'Iberia', 'Spain'),
('AF', 'AFR', 'Air France', 'France'),
('KL', 'KLM', 'KLM Royal Dutch Airlines', 'Netherlands'),
('LH', 'DLH', 'Lufthansa', 'Germany'),
('AA', 'AAL', 'American Airlines', 'United States'),
('DL', 'DAL', 'Delta Air Lines', 'United States'),
('UA', 'UAL', 'United Airlines', 'United States');
