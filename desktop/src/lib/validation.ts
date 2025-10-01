// Sistema de validação rigorosa para garantir confiabilidade
import type { DecodedFlight } from './parser';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class QuoteValidator {
  
  static validateFlight(flight: DecodedFlight): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validações obrigatórias
    if (!flight.company?.iataCode) {
      errors.push('Código da companhia aérea é obrigatório');
    }
    
    if (!flight.flight) {
      errors.push('Número do voo é obrigatório');
    }
    
    if (!flight.departureDate || !this.isValidDate(flight.departureDate)) {
      errors.push('Data de partida inválida');
    }
    
    if (!flight.landingDate || !this.isValidDate(flight.landingDate)) {
      errors.push('Data de chegada inválida');
    }
    
    if (!flight.departureTime || !this.isValidTime(flight.departureTime)) {
      errors.push('Horário de partida inválido');
    }
    
    if (!flight.landingTime || !this.isValidTime(flight.landingTime)) {
      errors.push('Horário de chegada inválido');
    }
    
    // Validações de aeroportos
    if (!flight.departureAirport?.iataCode) {
      errors.push('Código do aeroporto de partida é obrigatório');
    } else if (!flight.departureAirport.found) {
      errors.push(`Aeroporto de partida ${flight.departureAirport.iataCode} não encontrado`);
    }
    
    if (!flight.landingAirport?.iataCode) {
      errors.push('Código do aeroporto de chegada é obrigatório');
    } else if (!flight.landingAirport.found) {
      errors.push(`Aeroporto de chegada ${flight.landingAirport.iataCode} não encontrado`);
    }
    
    // Validações de lógica de negócio
    if (flight.departureAirport?.iataCode === flight.landingAirport?.iataCode) {
      errors.push('Aeroporto de partida e chegada não podem ser iguais');
    }
    
    // Validação de datas (chegada deve ser após partida)
    if (flight.departureDate && flight.landingDate && flight.departureTime && flight.landingTime) {
      const departureDateTime = this.parseDateTime(flight.departureDate, flight.departureTime);
      const landingDateTime = this.parseDateTime(flight.landingDate, flight.landingTime);
      
      if (departureDateTime >= landingDateTime) {
        warnings.push('Data/horário de chegada deve ser posterior à partida');
      }
    }
    
    // Validação de códigos IATA
    if (flight.departureAirport?.iataCode && !this.isValidIATACode(flight.departureAirport.iataCode)) {
      errors.push('Código IATA do aeroporto de partida inválido');
    }
    
    if (flight.landingAirport?.iataCode && !this.isValidIATACode(flight.landingAirport.iataCode)) {
      errors.push('Código IATA do aeroporto de chegada inválido');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  static validateQuote(flights: DecodedFlight[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!flights || flights.length === 0) {
      errors.push('Pelo menos um voo é obrigatório');
      return { isValid: false, errors, warnings };
    }
    
    // Validar cada voo individualmente
    flights.forEach((flight, index) => {
      const flightValidation = this.validateFlight(flight);
      if (!flightValidation.isValid) {
        errors.push(`Voo ${index + 1}: ${flightValidation.errors.join(', ')}`);
      }
      warnings.push(...flightValidation.warnings.map(w => `Voo ${index + 1}: ${w}`));
    });
    
    // Validações de consistência entre voos - REMOVIDO
    // Não validamos conexões pois podem haver conexões terrestres (trem, ônibus, etc.)
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private static isValidDate(dateStr: string): boolean {
    // Formato esperado: DD/MM/AAAA
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(regex);
    
    if (!match) return false;
    
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Verificar se a data é válida
    return date.getFullYear() === parseInt(year) &&
           date.getMonth() === parseInt(month) - 1 &&
           date.getDate() === parseInt(day);
  }
  
  private static isValidTime(timeStr: string): boolean {
    // Formato esperado: HH:MM
    const regex = /^(\d{2}):(\d{2})$/;
    const match = timeStr.match(regex);
    
    if (!match) return false;
    
    const [, hours, minutes] = match;
    const h = parseInt(hours);
    const m = parseInt(minutes);
    
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }
  
  private static isValidIATACode(code: string): boolean {
    // Código IATA deve ter exatamente 3 letras
    return /^[A-Z]{3}$/.test(code);
  }
  
  private static parseDateTime(dateStr: string, timeStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    return new Date(year, month - 1, day, hours, minutes);
  }
}
