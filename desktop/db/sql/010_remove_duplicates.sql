-- =====================================================
-- REMOÇÃO DE DUPLICATAS
-- Data: 2025-01-07
-- Objetivo: Remover duplicatas mantendo apenas o primeiro registro
-- =====================================================

-- PASSO 1: Remover duplicatas de aeroportos (mantém o primeiro por IATA)
WITH ranked_airports AS (
    SELECT 
        id,
        iata3,
        ROW_NUMBER() OVER (PARTITION BY iata3 ORDER BY id) as rn
    FROM airports
    WHERE iata3 IS NOT NULL
)
DELETE FROM airports 
WHERE id IN (
    SELECT id 
    FROM ranked_airports 
    WHERE rn > 1
);

-- PASSO 2: Remover duplicatas de cidades (mantém o primeiro por IATA)
WITH ranked_cities AS (
    SELECT 
        id,
        iata3,
        ROW_NUMBER() OVER (PARTITION BY iata3 ORDER BY id) as rn
    FROM cities
    WHERE iata3 IS NOT NULL
)
DELETE FROM cities 
WHERE id IN (
    SELECT id 
    FROM ranked_cities 
    WHERE rn > 1
);

-- PASSO 3: Verificar duplicatas restantes
SELECT 
  'Aeroportos duplicados' as tipo,
  count(*) as quantidade
FROM (
  SELECT iata3, count(*) as cnt
  FROM airports 
  WHERE iata3 IS NOT NULL
  GROUP BY iata3
  HAVING count(*) > 1
) dups

UNION ALL

SELECT 
  'Cidades duplicadas' as tipo,
  count(*) as quantidade
FROM (
  SELECT iata3, count(*) as cnt
  FROM cities 
  WHERE iata3 IS NOT NULL
  GROUP BY iata3
  HAVING count(*) > 1
) dups;

-- PASSO 4: Estatísticas finais
SELECT 
  'Total aeroportos' as tipo,
  count(*) as quantidade
FROM airports

UNION ALL

SELECT 
  'Total cidades' as tipo,
  count(*) as quantidade
FROM cities

UNION ALL

SELECT 
  'Aeroportos únicos por IATA' as tipo,
  count(DISTINCT iata3) as quantidade
FROM airports
WHERE iata3 IS NOT NULL

UNION ALL

SELECT 
  'Cidades únicas por IATA' as tipo,
  count(DISTINCT iata3) as quantidade
FROM cities
WHERE iata3 IS NOT NULL;
