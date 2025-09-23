-- =====================================================
-- MIGRAÇÃO: Correção de validação de companhias aéreas
-- Data: 2025-01-07
-- Objetivo: Implementar validação rigorosa de IATA/ICAO
-- =====================================================

-- 1. Adicionar constraints de validação
ALTER TABLE airlines
  ADD CONSTRAINT chk_iata2_valid
    CHECK (iata2 ~ '^[A-Z0-9]{2}$' OR iata2 IS NULL),
  ADD CONSTRAINT chk_icao3_valid
    CHECK (icao3 ~ '^[A-Z]{3}$' OR icao3 IS NULL);

-- 2. Criar índices únicos para códigos válidos
CREATE UNIQUE INDEX ux_airlines_iata2 ON airlines (iata2) WHERE iata2 IS NOT NULL;
CREATE UNIQUE INDEX ux_airlines_icao3 ON airlines (icao3) WHERE icao3 IS NOT NULL;

-- 3. Saneamento dos dados existentes
-- Limpar códigos IATA inválidos
UPDATE airlines 
SET iata2 = NULL 
WHERE iata2 IN ('--', '-+', ';;', '..', '') 
   OR iata2 !~ '^[A-Z0-9]{2}$';

-- Limpar códigos ICAO inválidos  
UPDATE airlines 
SET icao3 = NULL 
WHERE icao3 IN ('- - +', '-', '...', 'T&O', '') 
   OR icao3 !~ '^[A-Z]{3}$';

-- Corrigir escape duplo nos nomes
UPDATE airlines 
SET name = replace(name, '\\''', '''');

-- 4. Normalizar dados restantes
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
  name = trim(name);

-- 5. Adicionar campo de verificação
ALTER TABLE airlines 
ADD COLUMN verified BOOLEAN DEFAULT FALSE;

-- Marcar como verificados os que têm códigos válidos
UPDATE airlines 
SET verified = TRUE 
WHERE (iata2 IS NOT NULL AND iata2 ~ '^[A-Z0-9]{2}$') 
   OR (icao3 IS NOT NULL AND icao3 ~ '^[A-Z]{3}$');

-- 6. Adicionar comentários para documentação
COMMENT ON COLUMN airlines.iata2 IS 'Código IATA de 2 caracteres alfanuméricos (A-Z, 0-9) ou NULL';
COMMENT ON COLUMN airlines.icao3 IS 'Código ICAO de 3 letras (A-Z) ou NULL';
COMMENT ON COLUMN airlines.verified IS 'Indica se os códigos foram verificados contra base confiável';

-- 7. Estatísticas pós-limpeza
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
FROM airlines;
