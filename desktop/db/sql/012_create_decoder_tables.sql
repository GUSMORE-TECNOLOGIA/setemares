-- =====================================================
-- CRIAÇÃO DAS TABELAS DO DECODER V2
-- Data: 2025-01-07
-- Objetivo: Criar tabelas para overrides e códigos desconhecidos
-- =====================================================

-- Tabela de overrides (códigos personalizados)
CREATE TABLE IF NOT EXISTS code_overrides (
    id SERIAL PRIMARY KEY,
    original_code VARCHAR(10) NOT NULL,
    resolved_type VARCHAR(10) NOT NULL CHECK (resolved_type IN ('airport', 'airline', 'city')),
    resolved_id INTEGER NOT NULL,
    resolved_name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de códigos desconhecidos (telemetria)
CREATE TABLE IF NOT EXISTS codes_unknown (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    context TEXT,
    attempts INTEGER DEFAULT 1,
    last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    suggestions TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_code_overrides_original_code ON code_overrides(original_code);
CREATE INDEX IF NOT EXISTS idx_code_overrides_active ON code_overrides(active);
CREATE INDEX IF NOT EXISTS idx_codes_unknown_code ON codes_unknown(code);
CREATE INDEX IF NOT EXISTS idx_codes_unknown_resolved ON codes_unknown(resolved);
CREATE INDEX IF NOT EXISTS idx_codes_unknown_attempts ON codes_unknown(attempts);

-- Comentários nas tabelas
COMMENT ON TABLE code_overrides IS 'Tabela de overrides para códigos personalizados do Decoder v2';
COMMENT ON TABLE codes_unknown IS 'Tabela de telemetria para códigos não reconhecidos pelo Decoder v2';

-- Comentários nas colunas
COMMENT ON COLUMN code_overrides.original_code IS 'Código original que precisa ser mapeado';
COMMENT ON COLUMN code_overrides.resolved_type IS 'Tipo da resolução: airport, airline, city';
COMMENT ON COLUMN code_overrides.resolved_id IS 'ID do registro resolvido na tabela correspondente';
COMMENT ON COLUMN code_overrides.resolved_name IS 'Nome do registro resolvido para referência';
COMMENT ON COLUMN code_overrides.active IS 'Se o override está ativo';

COMMENT ON COLUMN codes_unknown.code IS 'Código que não foi reconhecido';
COMMENT ON COLUMN codes_unknown.context IS 'Contexto onde o código foi encontrado';
COMMENT ON COLUMN codes_unknown.attempts IS 'Número de tentativas de decodificação';
COMMENT ON COLUMN codes_unknown.last_attempt IS 'Última tentativa de decodificação';
COMMENT ON COLUMN codes_unknown.suggestions IS 'Sugestões de códigos similares';
COMMENT ON COLUMN codes_unknown.resolved IS 'Se o código foi resolvido via override';
