-- =============================================
-- ROLLBACK: ENABLE RLS AND ADD INDEXES
-- Data: 2024-12-19
-- Descrição: Rollback da migração que habilitou RLS e adicionou índices
-- =============================================

-- ⚠️  ATENÇÃO: Este rollback é destrutivo!
-- ⚠️  Ele remove todas as políticas RLS e índices criados.

-- 1. REMOVER TODAS AS POLÍTICAS RLS
-- =============================================

-- Cities
DROP POLICY IF EXISTS "cities_select_public" ON cities;
DROP POLICY IF EXISTS "cities_insert_authenticated" ON cities;
DROP POLICY IF EXISTS "cities_update_authenticated" ON cities;
DROP POLICY IF EXISTS "cities_delete_authenticated" ON cities;

-- Airports
DROP POLICY IF EXISTS "airports_select_public" ON airports;
DROP POLICY IF EXISTS "airports_insert_authenticated" ON airports;
DROP POLICY IF EXISTS "airports_update_authenticated" ON airports;
DROP POLICY IF EXISTS "airports_delete_authenticated" ON airports;

-- Airlines
DROP POLICY IF EXISTS "airlines_select_public" ON airlines;
DROP POLICY IF EXISTS "airlines_insert_authenticated" ON airlines;
DROP POLICY IF EXISTS "airlines_update_authenticated" ON airlines;
DROP POLICY IF EXISTS "airlines_delete_authenticated" ON airlines;

-- Baggage Catalog
DROP POLICY IF EXISTS "baggage_catalog_select_public" ON baggage_catalog;
DROP POLICY IF EXISTS "baggage_catalog_insert_authenticated" ON baggage_catalog;
DROP POLICY IF EXISTS "baggage_catalog_update_authenticated" ON baggage_catalog;
DROP POLICY IF EXISTS "baggage_catalog_delete_authenticated" ON baggage_catalog;

-- Code Overrides
DROP POLICY IF EXISTS "code_overrides_select_public" ON code_overrides;
DROP POLICY IF EXISTS "code_overrides_insert_authenticated" ON code_overrides;
DROP POLICY IF EXISTS "code_overrides_update_authenticated" ON code_overrides;
DROP POLICY IF EXISTS "code_overrides_delete_authenticated" ON code_overrides;

-- Codes Unknown
DROP POLICY IF EXISTS "codes_unknown_select_public" ON codes_unknown;
DROP POLICY IF EXISTS "codes_unknown_insert_authenticated" ON codes_unknown;
DROP POLICY IF EXISTS "codes_unknown_update_authenticated" ON codes_unknown;
DROP POLICY IF EXISTS "codes_unknown_delete_authenticated" ON codes_unknown;

-- Quotes
DROP POLICY IF EXISTS "quotes_select_authenticated" ON quotes;
DROP POLICY IF EXISTS "quotes_insert_authenticated" ON quotes;
DROP POLICY IF EXISTS "quotes_update_authenticated" ON quotes;
DROP POLICY IF EXISTS "quotes_delete_authenticated" ON quotes;

-- Quote Segments
DROP POLICY IF EXISTS "quote_segments_select_authenticated" ON quote_segments;
DROP POLICY IF EXISTS "quote_segments_insert_authenticated" ON quote_segments;
DROP POLICY IF EXISTS "quote_segments_update_authenticated" ON quote_segments;
DROP POLICY IF EXISTS "quote_segments_delete_authenticated" ON quote_segments;

-- Quote Options
DROP POLICY IF EXISTS "quote_options_select_authenticated" ON quote_options;
DROP POLICY IF EXISTS "quote_options_insert_authenticated" ON quote_options;
DROP POLICY IF EXISTS "quote_options_update_authenticated" ON quote_options;
DROP POLICY IF EXISTS "quote_options_delete_authenticated" ON quote_options;

-- Option Segments
DROP POLICY IF EXISTS "option_segments_select_authenticated" ON option_segments;
DROP POLICY IF EXISTS "option_segments_insert_authenticated" ON option_segments;
DROP POLICY IF EXISTS "option_segments_update_authenticated" ON option_segments;
DROP POLICY IF EXISTS "option_segments_delete_authenticated" ON option_segments;

-- Option Fares
DROP POLICY IF EXISTS "option_fares_select_authenticated" ON option_fares;
DROP POLICY IF EXISTS "option_fares_insert_authenticated" ON option_fares;
DROP POLICY IF EXISTS "option_fares_update_authenticated" ON option_fares;
DROP POLICY IF EXISTS "option_fares_delete_authenticated" ON option_fares;

-- 2. DESABILITAR RLS EM TODAS AS TABELAS
-- =============================================

ALTER TABLE cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE airports DISABLE ROW LEVEL SECURITY;
ALTER TABLE airlines DISABLE ROW LEVEL SECURITY;
ALTER TABLE baggage_catalog DISABLE ROW LEVEL SECURITY;
ALTER TABLE code_overrides DISABLE ROW LEVEL SECURITY;
ALTER TABLE codes_unknown DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE quote_segments DISABLE ROW LEVEL SECURITY;
ALTER TABLE quote_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE option_segments DISABLE ROW LEVEL SECURITY;
ALTER TABLE option_fares DISABLE ROW LEVEL SECURITY;

-- 3. REMOVER TODOS OS ÍNDICES CRIADOS
-- =============================================

-- Índices Cities
DROP INDEX IF EXISTS idx_cities_iata3;
DROP INDEX IF EXISTS idx_cities_country;
DROP INDEX IF EXISTS idx_cities_active;

-- Índices Airports
DROP INDEX IF EXISTS idx_airports_iata3;
DROP INDEX IF EXISTS idx_airports_icao4;
DROP INDEX IF EXISTS idx_airports_city_iata;
DROP INDEX IF EXISTS idx_airports_country;
DROP INDEX IF EXISTS idx_airports_active;

-- Índices Airlines
DROP INDEX IF EXISTS idx_airlines_iata2;
DROP INDEX IF EXISTS idx_airlines_icao3;
DROP INDEX IF EXISTS idx_airlines_country;
DROP INDEX IF EXISTS idx_airlines_active;
DROP INDEX IF EXISTS idx_airlines_verified;

-- Índices Code Overrides
DROP INDEX IF EXISTS idx_code_overrides_code;
DROP INDEX IF EXISTS idx_code_overrides_kind;

-- Índices Codes Unknown
DROP INDEX IF EXISTS idx_codes_unknown_code;
DROP INDEX IF EXISTS idx_codes_unknown_resolved;

-- Índices Quotes
DROP INDEX IF EXISTS idx_quotes_created_at;
DROP INDEX IF EXISTS idx_quotes_currency;

-- Índices Quote Segments
DROP INDEX IF EXISTS idx_quote_segments_quote_id;
DROP INDEX IF EXISTS idx_quote_segments_from_iata;
DROP INDEX IF EXISTS idx_quote_segments_to_iata;

-- Índices Quote Options
DROP INDEX IF EXISTS idx_quote_options_quote_id;
DROP INDEX IF EXISTS idx_quote_options_position;

-- Índices Option Segments
DROP INDEX IF EXISTS idx_option_segments_option_id;
DROP INDEX IF EXISTS idx_option_segments_dep_airport;
DROP INDEX IF EXISTS idx_option_segments_arr_airport;
DROP INDEX IF EXISTS idx_option_segments_position;

-- Índices Option Fares
DROP INDEX IF EXISTS idx_option_fares_option_id;
DROP INDEX IF EXISTS idx_option_fares_pax_type;

-- Índices Baggage Catalog
DROP INDEX IF EXISTS idx_baggage_catalog_fare_class;

-- =============================================
-- FIM DO ROLLBACK
-- =============================================
