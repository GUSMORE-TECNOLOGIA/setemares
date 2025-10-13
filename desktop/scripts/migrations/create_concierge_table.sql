-- =============================================
-- MIGRAÇÃO: Criar Tabela Concierge Reports
-- Data: 2024-12-19
-- Descrição: Tabela para armazenar relatórios de concierge gerados por IA
-- =============================================

-- Criar tabela principal de relatórios de concierge
CREATE TABLE concierge_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Informações do agente
  agent_name TEXT,
  
  -- Informações do cliente
  client_name TEXT NOT NULL,
  
  -- Dados da viagem
  destination TEXT NOT NULL,
  checkin DATE NOT NULL,
  checkout DATE NOT NULL,
  duration_days INTEGER GENERATED ALWAYS AS (checkout - checkin) STORED,
  
  -- Configurações da viagem
  travel_type TEXT NOT NULL CHECK (travel_type IN ('lua_de_mel', 'familia', 'negocios', 'aventura', 'cultural', 'gastronomico', 'relaxamento')),
  budget TEXT NOT NULL CHECK (budget IN ('economico', 'confortavel', 'premium', 'luxo')),
  adults INTEGER DEFAULT 1 CHECK (adults > 0),
  children INTEGER DEFAULT 0 CHECK (children >= 0),
  
  -- Detalhes opcionais
  hotel TEXT,
  address TEXT,
  interests JSONB DEFAULT '[]'::jsonb,
  observations TEXT,
  
  -- Conteúdo gerado
  report_content TEXT NOT NULL,
  report_html TEXT NOT NULL,
  
  -- Status e metadados
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'edited', 'sent', 'archived')),
  processing_time_ms INTEGER,
  openai_model TEXT,
  openai_tokens_used INTEGER,
  
  -- Índices automáticos
  CONSTRAINT valid_dates CHECK (checkout > checkin)
);

-- Criar índices para performance
CREATE INDEX idx_concierge_reports_created_at ON concierge_reports(created_at DESC);
CREATE INDEX idx_concierge_reports_destination ON concierge_reports(destination);
CREATE INDEX idx_concierge_reports_travel_type ON concierge_reports(travel_type);
CREATE INDEX idx_concierge_reports_budget ON concierge_reports(budget);
CREATE INDEX idx_concierge_reports_status ON concierge_reports(status);
CREATE INDEX idx_concierge_reports_client_name ON concierge_reports(client_name);

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_concierge_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_concierge_reports_updated_at
  BEFORE UPDATE ON concierge_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_concierge_reports_updated_at();

-- Habilitar RLS
ALTER TABLE concierge_reports ENABLE ROW LEVEL SECURITY;

-- Política RLS: Permitir leitura e escrita para usuários autenticados
CREATE POLICY "concierge_reports_authenticated_access" ON concierge_reports
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política RLS: Permitir leitura pública (para futuras funcionalidades)
CREATE POLICY "concierge_reports_public_read" ON concierge_reports
  FOR SELECT
  TO anon
  USING (status = 'sent');

-- Comentários para documentação
COMMENT ON TABLE concierge_reports IS 'Relatórios de concierge gerados por IA para agentes de viagem';
COMMENT ON COLUMN concierge_reports.travel_type IS 'Tipo de viagem: lua_de_mel, familia, negocios, aventura, cultural, gastronomico, relaxamento';
COMMENT ON COLUMN concierge_reports.budget IS 'Categoria de orçamento: economico, confortavel, premium, luxo';
COMMENT ON COLUMN concierge_reports.interests IS 'Array JSON com interesses selecionados pelo cliente';
COMMENT ON COLUMN concierge_reports.report_content IS 'Conteúdo textual do relatório gerado pela IA';
COMMENT ON COLUMN concierge_reports.report_html IS 'Versão HTML do relatório para exibição e PDF';
COMMENT ON COLUMN concierge_reports.processing_time_ms IS 'Tempo de processamento da IA em milissegundos';
COMMENT ON COLUMN concierge_reports.openai_tokens_used IS 'Número de tokens utilizados na chamada da OpenAI';
