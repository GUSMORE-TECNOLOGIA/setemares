-- =============================================
-- MIGRAÇÃO: Habilitar RLS e Adicionar Índices
-- Data: 2024-12-19
-- Descrição: Habilitar Row Level Security e adicionar índices críticos
-- =============================================

-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- =============================================

-- Tabelas de catálogo (leitura pública)
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE airlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE baggage_catalog ENABLE ROW LEVEL SECURITY;

-- Tabelas de sistema (leitura pública)
ALTER TABLE code_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE codes_unknown ENABLE ROW LEVEL SECURITY;

-- Tabelas de cotações (escrita autenticada)
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_fares ENABLE ROW LEVEL SECURITY;

-- 2. CRIAR POLÍTICAS RLS
-- =============================================

-- POLÍTICAS PARA TABELAS DE CATÁLOGO (Leitura Pública)
-- Cities
CREATE POLICY "cities_select_public" ON cities FOR SELECT USING (true);
CREATE POLICY "cities_insert_authenticated" ON cities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "cities_update_authenticated" ON cities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "cities_delete_authenticated" ON cities FOR DELETE USING (auth.role() = 'authenticated');

-- Airports
CREATE POLICY "airports_select_public" ON airports FOR SELECT USING (true);
CREATE POLICY "airports_insert_authenticated" ON airports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "airports_update_authenticated" ON airports FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "airports_delete_authenticated" ON airports FOR DELETE USING (auth.role() = 'authenticated');

-- Airlines
CREATE POLICY "airlines_select_public" ON airlines FOR SELECT USING (true);
CREATE POLICY "airlines_insert_authenticated" ON airlines FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "airlines_update_authenticated" ON airlines FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "airlines_delete_authenticated" ON airlines FOR DELETE USING (auth.role() = 'authenticated');

-- Baggage Catalog
CREATE POLICY "baggage_catalog_select_public" ON baggage_catalog FOR SELECT USING (true);
CREATE POLICY "baggage_catalog_insert_authenticated" ON baggage_catalog FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "baggage_catalog_update_authenticated" ON baggage_catalog FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "baggage_catalog_delete_authenticated" ON baggage_catalog FOR DELETE USING (auth.role() = 'authenticated');

-- POLÍTICAS PARA TABELAS DE SISTEMA (Leitura Pública, Escrita Autenticada)
-- Code Overrides
CREATE POLICY "code_overrides_select_public" ON code_overrides FOR SELECT USING (true);
CREATE POLICY "code_overrides_insert_authenticated" ON code_overrides FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "code_overrides_update_authenticated" ON code_overrides FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "code_overrides_delete_authenticated" ON code_overrides FOR DELETE USING (auth.role() = 'authenticated');

-- Codes Unknown
CREATE POLICY "codes_unknown_select_public" ON codes_unknown FOR SELECT USING (true);
CREATE POLICY "codes_unknown_insert_authenticated" ON codes_unknown FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "codes_unknown_update_authenticated" ON codes_unknown FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "codes_unknown_delete_authenticated" ON codes_unknown FOR DELETE USING (auth.role() = 'authenticated');

-- POLÍTICAS PARA TABELAS DE COTAÇÕES (Apenas Autenticadas)
-- Quotes
CREATE POLICY "quotes_select_authenticated" ON quotes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "quotes_insert_authenticated" ON quotes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "quotes_update_authenticated" ON quotes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "quotes_delete_authenticated" ON quotes FOR DELETE USING (auth.role() = 'authenticated');

-- Quote Segments
CREATE POLICY "quote_segments_select_authenticated" ON quote_segments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "quote_segments_insert_authenticated" ON quote_segments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "quote_segments_update_authenticated" ON quote_segments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "quote_segments_delete_authenticated" ON quote_segments FOR DELETE USING (auth.role() = 'authenticated');

-- Quote Options
CREATE POLICY "quote_options_select_authenticated" ON quote_options FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "quote_options_insert_authenticated" ON quote_options FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "quote_options_update_authenticated" ON quote_options FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "quote_options_delete_authenticated" ON quote_options FOR DELETE USING (auth.role() = 'authenticated');

-- Option Segments
CREATE POLICY "option_segments_select_authenticated" ON option_segments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "option_segments_insert_authenticated" ON option_segments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "option_segments_update_authenticated" ON option_segments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "option_segments_delete_authenticated" ON option_segments FOR DELETE USING (auth.role() = 'authenticated');

-- Option Fares
CREATE POLICY "option_fares_select_authenticated" ON option_fares FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "option_fares_insert_authenticated" ON option_fares FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "option_fares_update_authenticated" ON option_fares FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "option_fares_delete_authenticated" ON option_fares FOR DELETE USING (auth.role() = 'authenticated');

-- 3. ADICIONAR ÍNDICES CRÍTICOS
-- =============================================

-- Índices para Cities
CREATE INDEX IF NOT EXISTS idx_cities_iata3 ON cities(iata3);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country);
CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(active);

-- Índices para Airports
CREATE INDEX IF NOT EXISTS idx_airports_iata3 ON airports(iata3);
CREATE INDEX IF NOT EXISTS idx_airports_icao4 ON airports(icao4);
CREATE INDEX IF NOT EXISTS idx_airports_city_iata ON airports(city_iata);
CREATE INDEX IF NOT EXISTS idx_airports_country ON airports(country);
CREATE INDEX IF NOT EXISTS idx_airports_active ON airports(active);

-- Índices para Airlines
CREATE INDEX IF NOT EXISTS idx_airlines_iata2 ON airlines(iata2);
CREATE INDEX IF NOT EXISTS idx_airlines_icao3 ON airlines(icao3);
CREATE INDEX IF NOT EXISTS idx_airlines_country ON airlines(country);
CREATE INDEX IF NOT EXISTS idx_airlines_active ON airlines(active);
CREATE INDEX IF NOT EXISTS idx_airlines_verified ON airlines(verified);

-- Índices para Code Overrides
CREATE INDEX IF NOT EXISTS idx_code_overrides_code ON code_overrides(code);
CREATE INDEX IF NOT EXISTS idx_code_overrides_kind ON code_overrides(kind);

-- Índices para Codes Unknown
CREATE INDEX IF NOT EXISTS idx_codes_unknown_code ON codes_unknown(code);
CREATE INDEX IF NOT EXISTS idx_codes_unknown_resolved ON codes_unknown(resolved);

-- Índices para Quotes
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_currency ON quotes(currency);

-- Índices para Quote Segments
CREATE INDEX IF NOT EXISTS idx_quote_segments_quote_id ON quote_segments(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_segments_from_iata ON quote_segments(from_iata);
CREATE INDEX IF NOT EXISTS idx_quote_segments_to_iata ON quote_segments(to_iata);

-- Índices para Quote Options
CREATE INDEX IF NOT EXISTS idx_quote_options_quote_id ON quote_options(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_options_position ON quote_options(position);

-- Índices para Option Segments
CREATE INDEX IF NOT EXISTS idx_option_segments_option_id ON option_segments(option_id);
CREATE INDEX IF NOT EXISTS idx_option_segments_dep_airport ON option_segments(dep_airport);
CREATE INDEX IF NOT EXISTS idx_option_segments_arr_airport ON option_segments(arr_airport);
CREATE INDEX IF NOT EXISTS idx_option_segments_position ON option_segments(position);

-- Índices para Option Fares
CREATE INDEX IF NOT EXISTS idx_option_fares_option_id ON option_fares(option_id);
CREATE INDEX IF NOT EXISTS idx_option_fares_pax_type ON option_fares(pax_type);

-- Índices para Baggage Catalog
CREATE INDEX IF NOT EXISTS idx_baggage_catalog_fare_class ON baggage_catalog(fare_class);

-- 4. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================

COMMENT ON TABLE cities IS 'Catálogo de cidades com códigos IATA - Acesso público para leitura';
COMMENT ON TABLE airports IS 'Catálogo de aeroportos com códigos IATA/ICAO - Acesso público para leitura';
COMMENT ON TABLE airlines IS 'Catálogo de companhias aéreas com códigos IATA/ICAO - Acesso público para leitura';
COMMENT ON TABLE baggage_catalog IS 'Catálogo de informações de bagagem - Acesso público para leitura';
COMMENT ON TABLE code_overrides IS 'Overrides de códigos para correções manuais - Acesso público para leitura';
COMMENT ON TABLE codes_unknown IS 'Códigos desconhecidos para análise - Acesso público para leitura';
COMMENT ON TABLE quotes IS 'Cotações de voo - Acesso restrito a usuários autenticados';
COMMENT ON TABLE quote_segments IS 'Segmentos de voo das cotações - Acesso restrito a usuários autenticados';
COMMENT ON TABLE quote_options IS 'Opções de cotações - Acesso restrito a usuários autenticados';
COMMENT ON TABLE option_segments IS 'Segmentos por opção de cotação - Acesso restrito a usuários autenticados';
COMMENT ON TABLE option_fares IS 'Tarifas por opção de cotação - Acesso restrito a usuários autenticados';

-- =============================================
-- FIM DA MIGRAÇÃO
-- =============================================
