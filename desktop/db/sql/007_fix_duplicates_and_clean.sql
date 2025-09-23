-- =====================================================
-- MIGRAÇÃO FINAL: Remover duplicatas e limpar dados
-- Data: 2025-01-07
-- Objetivo: Resolver duplicatas antes de criar índices únicos
-- =====================================================

-- PASSO 1: Remover constraints existentes
ALTER TABLE airlines DROP CONSTRAINT IF EXISTS chk_iata2_valid;
ALTER TABLE airlines DROP CONSTRAINT IF EXISTS chk_icao3_valid;

-- PASSO 2: Remover constraints NOT NULL
ALTER TABLE airlines 
ALTER COLUMN iata2 DROP NOT NULL,
ALTER COLUMN icao3 DROP NOT NULL;

-- PASSO 3: LIMPEZA ULTRA AGRESSIVA
-- Limpar TODOS os IATA que não são exatamente 2 caracteres A-Z ou 0-9
UPDATE airlines 
SET iata2 = NULL 
WHERE iata2 IS NOT NULL 
  AND (
    length(iata2) != 2 
    OR iata2 !~ '^[A-Z0-9]{2}$'
    OR iata2 ~ '[^A-Z0-9]'
    OR iata2 ~ '[а-яА-Я]'  -- Caracteres cirílicos
  );

-- Limpar TODOS os ICAO que não são exatamente 3 letras A-Z
UPDATE airlines 
SET icao3 = NULL 
WHERE icao3 IS NOT NULL 
  AND (
    length(icao3) != 3 
    OR icao3 !~ '^[A-Z]{3}$'
    OR icao3 ~ '[^A-Z]'
    OR icao3 ~ '[0-9]'  -- ICAO não pode ter números
    OR icao3 ~ '[а-яА-Я]'  -- Caracteres cirílicos
  );

-- PASSO 4: Normalizar dados restantes
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

-- PASSO 5: Corrigir escape duplo nos nomes
UPDATE airlines 
SET name = replace(name, '\\''', '''');

-- PASSO 6: REMOVER DUPLICATAS DE IATA
-- Manter apenas o primeiro registro com cada IATA válido
WITH duplicates AS (
  SELECT id, iata2,
    ROW_NUMBER() OVER (PARTITION BY iata2 ORDER BY id) as rn
  FROM airlines 
  WHERE iata2 IS NOT NULL
)
UPDATE airlines 
SET iata2 = NULL 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- PASSO 7: REMOVER DUPLICATAS DE ICAO
-- Manter apenas o primeiro registro com cada ICAO válido
WITH duplicates AS (
  SELECT id, icao3,
    ROW_NUMBER() OVER (PARTITION BY icao3 ORDER BY id) as rn
  FROM airlines 
  WHERE icao3 IS NOT NULL
)
UPDATE airlines 
SET icao3 = NULL 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- PASSO 8: Verificar se ainda há dados inválidos
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

-- PASSO 9: Verificar duplicatas restantes
SELECT 
  'IATA duplicados restantes' as tipo,
  count(*) as quantidade
FROM (
  SELECT iata2, count(*) as cnt
  FROM airlines 
  WHERE iata2 IS NOT NULL
  GROUP BY iata2
  HAVING count(*) > 1
) dup

UNION ALL

SELECT 
  'ICAO duplicados restantes' as tipo,
  count(*) as quantidade
FROM (
  SELECT icao3, count(*) as cnt
  FROM airlines 
  WHERE icao3 IS NOT NULL
  GROUP BY icao3
  HAVING count(*) > 1
) dup;

-- PASSO 10: Se não há dados inválidos nem duplicatas, adicionar constraints
-- (Execute apenas se os PASSOS 8 e 9 retornarem 0 para todos)
ALTER TABLE airlines
ADD CONSTRAINT chk_iata2_valid
  CHECK (iata2 ~ '^[A-Z0-9]{2}$' OR iata2 IS NULL),
ADD CONSTRAINT chk_icao3_valid
  CHECK (icao3 ~ '^[A-Z]{3}$' OR icao3 IS NULL);

-- PASSO 11: Adicionar campo verified
ALTER TABLE airlines 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- PASSO 12: Marcar como verificados os que têm códigos válidos
UPDATE airlines 
SET verified = TRUE 
WHERE (iata2 IS NOT NULL AND iata2 ~ '^[A-Z0-9]{2}$') 
   OR (icao3 IS NOT NULL AND icao3 ~ '^[A-Z]{3}$');

-- PASSO 13: Criar índices únicos para códigos válidos (agora sem duplicatas)
CREATE UNIQUE INDEX IF NOT EXISTS ux_airlines_iata2 ON airlines (iata2) WHERE iata2 IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_airlines_icao3 ON airlines (icao3) WHERE icao3 IS NOT NULL;

-- PASSO 14: Estatísticas finais
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
