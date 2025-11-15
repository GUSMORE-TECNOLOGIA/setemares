-- =============================================
-- MIGRAÇÃO: Ajustar RLS para Acesso Anônimo Temporário
-- Data: 2025-01-19
-- Descrição: Ajustar políticas RLS para permitir acesso anônimo temporário
--            enquanto autenticação completa não é implementada
-- =============================================
-- 
-- ATENÇÃO: Esta é uma solução temporária. O ideal é implementar autenticação
-- Supabase Auth completa e ajustar as políticas para usar auth.uid().
-- 
-- Esta migração mantém RLS habilitado mas com políticas permissivas para
-- permitir que o sistema funcione sem autenticação por enquanto.
-- =============================================

-- 1. REMOVER POLÍTICAS ANTIGAS QUE REQUEREM AUTENTICAÇÃO
-- =============================================

-- Remover políticas de cotações que requerem autenticação
DROP POLICY IF EXISTS "quotes_select_authenticated" ON quotes;
DROP POLICY IF EXISTS "quotes_insert_authenticated" ON quotes;
DROP POLICY IF EXISTS "quotes_update_authenticated" ON quotes;
DROP POLICY IF EXISTS "quotes_delete_authenticated" ON quotes;

DROP POLICY IF EXISTS "quote_segments_select_authenticated" ON quote_segments;
DROP POLICY IF EXISTS "quote_segments_insert_authenticated" ON quote_segments;
DROP POLICY IF EXISTS "quote_segments_update_authenticated" ON quote_segments;
DROP POLICY IF EXISTS "quote_segments_delete_authenticated" ON quote_segments;

DROP POLICY IF EXISTS "quote_options_select_authenticated" ON quote_options;
DROP POLICY IF EXISTS "quote_options_insert_authenticated" ON quote_options;
DROP POLICY IF EXISTS "quote_options_update_authenticated" ON quote_options;
DROP POLICY IF EXISTS "quote_options_delete_authenticated" ON quote_options;

DROP POLICY IF EXISTS "option_segments_select_authenticated" ON option_segments;
DROP POLICY IF EXISTS "option_segments_insert_authenticated" ON option_segments;
DROP POLICY IF EXISTS "option_segments_update_authenticated" ON option_segments;
DROP POLICY IF EXISTS "option_segments_delete_authenticated" ON option_segments;

DROP POLICY IF EXISTS "option_fares_select_authenticated" ON option_fares;
DROP POLICY IF EXISTS "option_fares_insert_authenticated" ON option_fares;
DROP POLICY IF EXISTS "option_fares_update_authenticated" ON option_fares;
DROP POLICY IF EXISTS "option_fares_delete_authenticated" ON option_fares;

-- 2. CRIAR POLÍTICAS PERMISSIVAS TEMPORÁRIAS
-- =============================================
-- NOTA: Estas políticas permitem acesso anônimo. Em produção, devem ser
-- substituídas por políticas que usam auth.uid() após implementar autenticação.

-- Quotes - Acesso público temporário (será restrito após auth)
CREATE POLICY "quotes_select_public_temp" ON quotes FOR SELECT USING (true);
CREATE POLICY "quotes_insert_public_temp" ON quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "quotes_update_public_temp" ON quotes FOR UPDATE USING (true);
CREATE POLICY "quotes_delete_public_temp" ON quotes FOR DELETE USING (true);

-- Quote Segments
CREATE POLICY "quote_segments_select_public_temp" ON quote_segments FOR SELECT USING (true);
CREATE POLICY "quote_segments_insert_public_temp" ON quote_segments FOR INSERT WITH CHECK (true);
CREATE POLICY "quote_segments_update_public_temp" ON quote_segments FOR UPDATE USING (true);
CREATE POLICY "quote_segments_delete_public_temp" ON quote_segments FOR DELETE USING (true);

-- Quote Options
CREATE POLICY "quote_options_select_public_temp" ON quote_options FOR SELECT USING (true);
CREATE POLICY "quote_options_insert_public_temp" ON quote_options FOR INSERT WITH CHECK (true);
CREATE POLICY "quote_options_update_public_temp" ON quote_options FOR UPDATE USING (true);
CREATE POLICY "quote_options_delete_public_temp" ON quote_options FOR DELETE USING (true);

-- Option Segments
CREATE POLICY "option_segments_select_public_temp" ON option_segments FOR SELECT USING (true);
CREATE POLICY "option_segments_insert_public_temp" ON option_segments FOR INSERT WITH CHECK (true);
CREATE POLICY "option_segments_update_public_temp" ON option_segments FOR UPDATE USING (true);
CREATE POLICY "option_segments_delete_public_temp" ON option_segments FOR DELETE USING (true);

-- Option Fares
CREATE POLICY "option_fares_select_public_temp" ON option_fares FOR SELECT USING (true);
CREATE POLICY "option_fares_insert_public_temp" ON option_fares FOR INSERT WITH CHECK (true);
CREATE POLICY "option_fares_update_public_temp" ON option_fares FOR UPDATE USING (true);
CREATE POLICY "option_fares_delete_public_temp" ON option_fares FOR DELETE USING (true);

-- 3. ATUALIZAR COMENTÁRIOS
-- =============================================

COMMENT ON POLICY "quotes_select_public_temp" ON quotes IS 
'TEMPORÁRIO: Permite leitura pública. Substituir por política com auth.uid() após implementar autenticação.';

COMMENT ON POLICY "quotes_insert_public_temp" ON quotes IS 
'TEMPORÁRIO: Permite inserção pública. Substituir por política com auth.uid() após implementar autenticação.';

-- =============================================
-- FIM DA MIGRAÇÃO
-- =============================================
-- 
-- PRÓXIMOS PASSOS:
-- 1. Implementar autenticação Supabase Auth
-- 2. Criar migração para substituir políticas temporárias por políticas
--    que usam auth.uid() para restringir acesso por usuário
-- 3. Remover políticas temporárias após implementar auth
-- =============================================

