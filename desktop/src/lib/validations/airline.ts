import { z } from 'zod';

// Regex para validação de códigos
const IATA_REGEX = /^[A-Z0-9]{2}$/;
const ICAO_REGEX = /^[A-Z]{3}$/;

// Schema de validação para companhias aéreas
export const airlineSchema = z.object({
  iata2: z
    .string()
    .optional()
    .refine(
      (val) => !val || IATA_REGEX.test(val),
      {
        message: 'IATA deve ter exatamente 2 caracteres alfanuméricos (A-Z, 0-9)'
      }
    )
    .transform((val) => val ? val.trim().toUpperCase() : undefined),
    
  icao3: z
    .string()
    .optional()
    .refine(
      (val) => !val || ICAO_REGEX.test(val),
      {
        message: 'ICAO deve ter exatamente 3 letras (A-Z)'
      }
    )
    .transform((val) => val ? val.trim().toUpperCase() : undefined),
    
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .transform((val) => val.trim()),
    
  country: z
    .string()
    .min(1, 'País é obrigatório')
    .max(50, 'País deve ter no máximo 50 caracteres')
    .transform((val) => val.trim()),
    
  active: z.boolean().default(true),
  
  verified: z.boolean().default(false)
});

// Schema para validação de aeroportos
export const airportSchema = z.object({
  iata3: z
    .string()
    .min(3, 'IATA deve ter exatamente 3 caracteres')
    .max(3, 'IATA deve ter exatamente 3 caracteres')
    .regex(/^[A-Z]{3}$/, 'IATA deve ter 3 letras (A-Z)')
    .transform((val) => val.trim().toUpperCase()),
    
  icao4: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[A-Z]{4}$/.test(val),
      {
        message: 'ICAO deve ter exatamente 4 letras (A-Z)'
      }
    )
    .transform((val) => val ? val.trim().toUpperCase() : undefined),
    
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .transform((val) => val.trim()),
    
  city_iata: z
    .string()
    .min(3, 'Cidade IATA deve ter exatamente 3 caracteres')
    .max(3, 'Cidade IATA deve ter exatamente 3 caracteres')
    .regex(/^[A-Z]{3}$/, 'Cidade IATA deve ter 3 letras (A-Z)')
    .transform((val) => val.trim().toUpperCase()),
    
  country: z
    .string()
    .min(1, 'País é obrigatório')
    .max(50, 'País deve ter no máximo 50 caracteres')
    .transform((val) => val.trim()),
    
  tz: z
    .string()
    .optional()
    .transform((val) => val ? val.trim() : undefined),
    
  active: z.boolean().default(true)
});

// Schema para validação de cidades
export const citySchema = z.object({
  iata3: z
    .string()
    .min(3, 'IATA deve ter exatamente 3 caracteres')
    .max(3, 'IATA deve ter exatamente 3 caracteres')
    .regex(/^[A-Z]{3}$/, 'IATA deve ter 3 letras (A-Z)')
    .transform((val) => val.trim().toUpperCase()),
    
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .transform((val) => val.trim()),
    
  country: z
    .string()
    .min(1, 'País é obrigatório')
    .max(50, 'País deve ter no máximo 50 caracteres')
    .transform((val) => val.trim()),
    
  active: z.boolean().default(true)
});

// Função para normalizar dados antes de salvar
export function normalizeAirlineData(data: any) {
  return {
    ...data,
    iata2: data.iata2 ? data.iata2.trim().toUpperCase() : null,
    icao3: data.icao3 ? data.icao3.trim().toUpperCase() : null,
    name: data.name.trim(),
    country: data.country.trim()
  };
}

// Função para validar se IATA é válido
export function isValidIATA(code: string | null | undefined): boolean {
  if (!code) return true; // NULL é válido
  return IATA_REGEX.test(code);
}

// Função para validar se ICAO é válido
export function isValidICAO(code: string | null | undefined): boolean {
  if (!code) return true; // NULL é válido
  return ICAO_REGEX.test(code);
}
