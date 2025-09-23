-- =====================================================
-- MIGRAÇÃO STEP-BY-STEP: Correção de companhias aéreas
-- Data: 2025-01-07
-- Objetivo: Limpar dados ANTES de adicionar constraints
-- =====================================================

-- PASSO 1: Remover constraints existentes (se houver)
ALTER TABLE airlines DROP CONSTRAINT IF EXISTS chk_iata2_valid;
ALTER TABLE airlines DROP CONSTRAINT IF EXISTS chk_icao3_valid;

-- PASSO 2: Remover constraints NOT NULL
ALTER TABLE airlines 
ALTER COLUMN iata2 DROP NOT NULL,
ALTER COLUMN icao3 DROP NOT NULL;

-- PASSO 3: Limpar dados inválidos ANTES de adicionar constraints
-- Limpar códigos IATA inválidos
UPDATE airlines 
SET iata2 = NULL 
WHERE iata2 IS NOT NULL 
  AND (
    iata2 IN ('--', '-+', ';;', '..', '^^', '&T', 'ЯП', 'МИ', '') 
    OR iata2 !~ '^[A-Z0-9]{2}$'
    OR length(iata2) != 2
    OR iata2 ~ '[^A-Z0-9]'
  );

-- Limpar códigos ICAO inválidos  
UPDATE airlines 
SET icao3 = NULL 
WHERE icao3 IS NOT NULL 
  AND (
    icao3 IN ('- - +', '-', '...', 'T&O', 'BA1', '4AA', 'A1F', 'CA1', 'WE1', '1CH', '--+', '1QA', 'SA1', '3FF', 'TP6', 'IG1', '') 
    OR icao3 !~ '^[A-Z]{3}$'
    OR length(icao3) != 3
    OR icao3 ~ '[^A-Z]'
  );

-- Corrigir escape duplo nos nomes
UPDATE airlines 
SET name = replace(name, '\\''', '''');

-- Normalizar dados restantes
UPDATE airlines 
SET 
  iata2 = CASE 
    WHEN iata2 IS NOT NULL THEN upper(trim(iata2))
    ELSE NULL 
  END,
  icao3 = CASE 
    WHEN icao3 IS NOT NULL THEN upper(trim(icao3))
    ELSE NULL 
  END,
  name = trim(name),
  country = trim(country);

-- PASSO 4: Verificar se ainda há dados inválidos
SELECT 
  'IATA inválidos restantes' as tipo,
  count(*) as quantidade
FROM airlines 
WHERE iata2 IS NOT NULL 
  AND (iata2 !~ '^[A-Z0-9]{2}$' OR length(iata2) != 2)

UNION ALL

SELECT 
  'ICAO inválidos restantes' as tipo,
  count(*) as quantidade
FROM airlines 
WHERE icao3 IS NOT NULL 
  AND (icao3 !~ '^[A-Z]{3}$' OR length(icao3) != 3);

-- PASSO 5: Se não há dados inválidos, adicionar constraints
-- (Execute apenas se o PASSO 4 retornar 0 para ambos)
ALTER TABLE airlines
ADD CONSTRAINT chk_iata2_valid
  CHECK (iata2 ~ '^[A-Z0-9]{2}$' OR iata2 IS NULL),
ADD CONSTRAINT chk_icao3_valid
  CHECK (icao3 ~ '^[A-Z]{3}$' OR icao3 IS NULL);

-- PASSO 6: Adicionar campo verified
ALTER TABLE airlines 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- PASSO 7: Marcar como verificados os que têm códigos válidos
UPDATE airlines 
SET verified = TRUE 
WHERE (iata2 IS NOT NULL AND iata2 ~ '^[A-Z0-9]{2}$') 
   OR (icao3 IS NOT NULL AND icao3 ~ '^[A-Z]{3}$');

-- PASSO 8: Criar índices únicos para códigos válidos
CREATE UNIQUE INDEX IF NOT EXISTS ux_airlines_iata2 ON airlines (iata2) WHERE iata2 IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_airlines_icao3 ON airlines (icao3) WHERE icao3 IS NOT NULL;

-- PASSO 9: Estatísticas finais
SELECT 
  'Companhias com IATA válido' as tipo,
  count(*) as quantidade
FROM airlines 
WHERE iata2 IS NOT NULL

UNION ALL

SELECT 
  'Companhias com ICAO válido' as tipo,
  count(*) as quantidade
FROM airlines 
WHERE icao3 IS NOT NULL

UNION ALL

SELECT 
  'Companhias verificadas' as tipo,
  count(*) as quantidade
FROM airlines 
WHERE verified = TRUE

UNION ALL

SELECT 
  'Total de companhias' as tipo,
  count(*) as quantidade
FROM airlines

UNION ALL

SELECT 
  'Companhias sem códigos' as tipo,
  count(*) as quantidade
FROM airlines 
WHERE iata2 IS NULL AND icao3 IS NULL;
