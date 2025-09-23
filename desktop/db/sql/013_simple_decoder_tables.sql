-- =====================================================
-- CRIAÇÃO SIMPLES DAS TABELAS DO DECODER V2
-- Data: 2025-01-07
-- Objetivo: Criar tabelas básicas para overrides e códigos desconhecidos
-- =====================================================

-- Tabela de overrides (códigos personalizados)
CREATE TABLE IF NOT EXISTS code_overrides (
    id SERIAL PRIMARY KEY,
    original_code VARCHAR(10) NOT NULL,
    resolved_type VARCHAR(10) NOT NULL,
    resolved_id INTEGER NOT NULL,
    resolved_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
