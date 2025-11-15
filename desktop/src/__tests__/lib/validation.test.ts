import { describe, it, expect } from 'vitest';
import { QuoteValidator } from '@/lib/validation';
import type { DecodedFlight } from '@/lib/parser';

describe('validation - QuoteValidator', () => {
  const createMockFlight = (overrides: Partial<DecodedFlight> = {}): DecodedFlight => ({
    company: {
      iataCode: 'AA',
      description: 'American Airlines',
      found: true
    },
    flight: '100',
    departureAirport: {
      iataCode: 'GRU',
      description: 'São Paulo/Guarulhos',
      found: true
    },
    landingAirport: {
      iataCode: 'JFK',
      description: 'New York/JFK',
      found: true
    },
    departureDate: '2025-01-20',
    departureTime: '10:00',
    landingDate: '2025-01-20',
    landingTime: '18:00',
    ...overrides
  });

  describe('validateQuote', () => {
    it('deve validar voos válidos', () => {
      const flights: DecodedFlight[] = [
        createMockFlight(),
        createMockFlight({
          departureAirport: { iataCode: 'JFK', description: 'New York/JFK', found: true },
          landingAirport: { iataCode: 'LAX', description: 'Los Angeles', found: true },
          departureDate: '2025-01-21',
          landingDate: '2025-01-21'
        })
      ];

      const result = QuoteValidator.validateQuote(flights);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar voos com aeroportos não encontrados', () => {
      const flights: DecodedFlight[] = [
        createMockFlight({
          departureAirport: { iataCode: 'XXX', description: '', found: false, error: 'Aeroporto não encontrado' }
        })
      ];

      const result = QuoteValidator.validateQuote(flights);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar voos com datas inválidas', () => {
      const flights: DecodedFlight[] = [
        createMockFlight({
          landingDate: '2025-01-19', // Antes da partida
          landingTime: '08:00'
        })
      ];

      const result = QuoteValidator.validateQuote(flights);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar voos com horários inválidos no mesmo dia', () => {
      const flights: DecodedFlight[] = [
        createMockFlight({
          departureTime: '18:00',
          landingTime: '10:00' // Chegada antes da partida no mesmo dia
        })
      ];

      const result = QuoteValidator.validateQuote(flights);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve validar voos overnight corretamente', () => {
      const flights: DecodedFlight[] = [
        createMockFlight({
          departureTime: '22:00',
          landingDate: '2025-01-21', // Dia seguinte
          landingTime: '06:00'
        })
      ];

      const result = QuoteValidator.validateQuote(flights);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

