-- =====================================================
-- LIMPEZA COMPLETA DO BANCO DE DADOS
-- Data: 2025-01-07
-- Objetivo: Limpar completamente todas as tabelas para importação do CSV
-- =====================================================

-- PASSO 1: Desabilitar constraints temporariamente
SET session_replication_role = replica;

-- PASSO 2: Limpar todas as tabelas (ordem importante devido às foreign keys)
TRUNCATE TABLE quote_segments CASCADE;
TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE codes_unknown CASCADE;
TRUNCATE TABLE code_overrides CASCADE;
TRUNCATE TABLE airports CASCADE;
TRUNCATE TABLE cities CASCADE;
TRUNCATE TABLE airlines CASCADE;

-- PASSO 3: Resetar sequences
ALTER SEQUENCE cities_id_seq RESTART WITH 1;
ALTER SEQUENCE airports_id_seq RESTART WITH 1;
ALTER SEQUENCE airlines_id_seq RESTART WITH 1;
ALTER SEQUENCE code_overrides_id_seq RESTART WITH 1;
ALTER SEQUENCE codes_unknown_id_seq RESTART WITH 1;
ALTER SEQUENCE quotes_id_seq RESTART WITH 1;
ALTER SEQUENCE quote_segments_id_seq RESTART WITH 1;

-- PASSO 4: Reabilitar constraints
SET session_replication_role = DEFAULT;

-- PASSO 5: Verificar limpeza
SELECT 
  'cities' as tabela, count(*) as registros FROM cities
UNION ALL
SELECT 
  'airports' as tabela, count(*) as registros FROM airports
UNION ALL
SELECT 
  'airlines' as tabela, count(*) as registros FROM airlines
UNION ALL
SELECT 
  'code_overrides' as tabela, count(*) as registros FROM code_overrides
UNION ALL
SELECT 
  'codes_unknown' as tabela, count(*) as registros FROM codes_unknown
UNION ALL
SELECT 
  'quotes' as tabela, count(*) as registros FROM quotes
UNION ALL
SELECT 
  'quote_segments' as tabela, count(*) as registros FROM quote_segments;

-- FIM DA LIMPEZA
