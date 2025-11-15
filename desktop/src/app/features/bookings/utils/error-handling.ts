/**
 * Utilitários para tratamento de erros no módulo de bookings
 */

import { logger } from "@/lib/logger";
import type { BookingDecodeError } from "../../../shared/types";

/**
 * Tipos de erros comuns no sistema
 */
export enum ErrorType {
  PARSING_ERROR = 'PARSING_ERROR',
  DECODING_ERROR = 'DECODING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PDF_GENERATION_ERROR = 'PDF_GENERATION_ERROR',
  PRICING_ERROR = 'PRICING_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Cria um erro de decodificação padronizado
 */
export function createDecodeError(
  code: string,
  message: string,
  option?: string,
  context?: Record<string, unknown>
): BookingDecodeError {
  logger.error(`Erro de decodificação: ${code}`, { message, option, ...context }, 'ErrorHandling');
  
  return {
    code,
    error: message,
    option
  };
}

/**
 * Trata erros de parsing de forma consistente
 */
export function handleParsingError(
  error: unknown,
  context: string,
  fallbackValue?: any
): { error: BookingDecodeError | null; value: any } {
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao fazer parsing';
  
  logger.error(`Erro de parsing em ${context}`, { error: errorMessage, fallbackValue }, 'ErrorHandling');
  
  const decodeError: BookingDecodeError = {
    code: ErrorType.PARSING_ERROR,
    error: `Erro ao processar ${context}: ${errorMessage}`,
    option: context
  };
  
  return {
    error: decodeError,
    value: fallbackValue ?? null
  };
}

/**
 * Trata erros de decodificação de forma consistente
 */
export function handleDecodingError(
  error: unknown,
  optionLabel?: string
): BookingDecodeError {
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao decodificar';
  
  logger.error('Erro de decodificação', { error: errorMessage, optionLabel }, 'ErrorHandling');
  
  return createDecodeError(
    ErrorType.DECODING_ERROR,
    errorMessage,
    optionLabel
  );
}

/**
 * Trata erros de validação
 */
export function handleValidationError(
  message: string,
  field?: string
): BookingDecodeError {
  logger.warn('Erro de validação', { message, field }, 'ErrorHandling');
  
  return {
    code: ErrorType.VALIDATION_ERROR,
    error: field ? `${field}: ${message}` : message
  };
}

/**
 * Trata erros de geração de PDF
 */
export function handlePdfGenerationError(
  error: unknown,
  context?: Record<string, unknown>
): Error {
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao gerar PDF';
  
  logger.error('Erro ao gerar PDF', { error: errorMessage, ...context }, 'ErrorHandling');
  
  return new Error(`Erro ao gerar PDF: ${errorMessage}`);
}

/**
 * Trata erros de cálculo de pricing
 */
export function handlePricingError(
  error: unknown,
  context?: Record<string, unknown>
): Error {
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao calcular pricing';
  
  logger.error('Erro ao calcular pricing', { error: errorMessage, ...context }, 'ErrorHandling');
  
  return new Error(`Erro ao calcular pricing: ${errorMessage}`);
}

/**
 * Wrapper para executar funções com tratamento de erro padronizado
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorHandler: (error: unknown) => T | Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error(`Erro em ${context || 'operação'}`, { error: errorMessage }, 'ErrorHandling');
    return await errorHandler(error);
  }
}

/**
 * Valida se um valor não é nulo/undefined e retorna erro se for
 */
export function requireValue<T>(
  value: T | null | undefined,
  fieldName: string,
  context?: string
): T {
  if (value === null || value === undefined) {
    const message = `${fieldName} é obrigatório${context ? ` em ${context}` : ''}`;
    logger.warn('Valor obrigatório ausente', { fieldName, context }, 'ErrorHandling');
    throw new Error(message);
  }
  return value;
}

