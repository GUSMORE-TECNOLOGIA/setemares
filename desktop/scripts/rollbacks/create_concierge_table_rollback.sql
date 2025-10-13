-- =============================================
-- ROLLBACK: Criar Tabela Concierge Reports
-- Data: 2024-12-19
-- Descrição: Rollback da migração que criou a tabela concierge_reports
-- =============================================

-- Remover trigger
DROP TRIGGER IF EXISTS trigger_concierge_reports_updated_at ON concierge_reports;

-- Remover função
DROP FUNCTION IF EXISTS update_concierge_reports_updated_at();

-- Remover políticas RLS
DROP POLICY IF EXISTS "concierge_reports_public_read" ON concierge_reports;
DROP POLICY IF EXISTS "concierge_reports_authenticated_access" ON concierge_reports;

-- Desabilitar RLS
ALTER TABLE concierge_reports DISABLE ROW LEVEL SECURITY;

-- Remover índices
DROP INDEX IF EXISTS idx_concierge_reports_client_name;
DROP INDEX IF EXISTS idx_concierge_reports_status;
DROP INDEX IF EXISTS idx_concierge_reports_budget;
DROP INDEX IF EXISTS idx_concierge_reports_travel_type;
DROP INDEX IF EXISTS idx_concierge_reports_destination;
DROP INDEX IF EXISTS idx_concierge_reports_created_at;

-- Remover tabela principal
DROP TABLE IF EXISTS concierge_reports;
