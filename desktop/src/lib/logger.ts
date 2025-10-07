// Sistema de logs estruturados para o 7Mares Cotador

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private sessionId = this.generateSessionId();

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, component, action, duration } = entry;
    
    let logMessage = `[${timestamp}] ${level.toUpperCase()}`;
    
    if (component) logMessage += ` [${component}]`;
    if (action) logMessage += ` [${action}]`;
    if (duration !== undefined) logMessage += ` (${duration}ms)`;
    
    logMessage += `: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      logMessage += ` | Context: ${JSON.stringify(context)}`;
    }
    
    return logMessage;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    component?: string,
    action?: string,
    duration?: number,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      component,
      action,
      duration,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
  }

  private getCurrentUserId(): string | undefined {
    // TODO: Implementar quando sistema de auth estiver pronto
    return undefined;
  }

  private log(entry: LogEntry): void {
    const formattedLog = this.formatLog(entry);
    
    // Console logging
    switch (entry.level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedLog, entry.context);
        }
        break;
      case 'info':
        console.info(formattedLog, entry.context);
        break;
      case 'warn':
        console.warn(formattedLog, entry.context);
        break;
      case 'error':
        console.error(formattedLog, entry.context);
        if (entry.error?.stack) {
          console.error('Stack trace:', entry.error.stack);
        }
        break;
    }

    // TODO: Enviar para serviço de logging em produção
    if (!this.isDevelopment && entry.level === 'error') {
      this.sendToLoggingService(entry);
    }
  }

  private async sendToLoggingService(entry: LogEntry): Promise<void> {
    try {
      // TODO: Implementar integração com serviço de logging (ex: Sentry, LogRocket, etc.)
      // Por enquanto, apenas simular
      console.log('Sending to logging service:', entry);
    } catch (error) {
      console.error('Failed to send log to service:', error);
    }
  }

  // Métodos públicos
  debug(message: string, context?: Record<string, any>, component?: string): void {
    this.log(this.createLogEntry('debug', message, context, component));
  }

  info(message: string, context?: Record<string, any>, component?: string): void {
    this.log(this.createLogEntry('info', message, context, component));
  }

  warn(message: string, context?: Record<string, any>, component?: string): void {
    this.log(this.createLogEntry('warn', message, context, component));
  }

  error(message: string, error?: Error, context?: Record<string, any>, component?: string): void {
    this.log(this.createLogEntry('error', message, context, component, undefined, undefined, error));
  }

  // Métodos para ações específicas
  actionStart(action: string, context?: Record<string, any>, component?: string): () => void {
    const startTime = Date.now();
    this.info(`Iniciando ação: ${action}`, context, component);
    
    return () => {
      const duration = Date.now() - startTime;
      this.info(`Ação concluída: ${action}`, { ...context, duration }, component);
    };
  }

  performance(message: string, duration: number, context?: Record<string, any>, component?: string): void {
    const entry = this.createLogEntry('info', message, context, component, undefined, duration);
    this.log(entry);
  }

  // Métodos específicos para componentes
  pdfGeneration(data: { type: string; pages: number; size: number }, duration: number): void {
    this.info('PDF gerado com sucesso', {
      pdfType: data.type,
      pages: data.pages,
      sizeKB: Math.round(data.size / 1024)
    }, 'PDFGenerator');
    this.performance('PDF Generation', duration, data, 'PDFGenerator');
  }

  pnrParsing(data: { type: 'simple' | 'complex'; segments: number; options: number }, duration: number): void {
    this.info('PNR processado', {
      pnrType: data.type,
      segments: data.segments,
      options: data.options
    }, 'PNRParser');
    this.performance('PNR Parsing', duration, data, 'PNRParser');
  }

  userAction(action: string, context?: Record<string, any>): void {
    this.info(`Ação do usuário: ${action}`, context, 'UserAction');
  }
}

// Instância singleton
export const logger = new Logger();

// Hook para usar em componentes React
export function useLogger(component: string) {
  return {
    debug: (message: string, context?: Record<string, any>) => logger.debug(message, context, component),
    info: (message: string, context?: Record<string, any>) => logger.info(message, context, component),
    warn: (message: string, context?: Record<string, any>) => logger.warn(message, context, component),
    error: (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context, component),
    actionStart: (action: string, context?: Record<string, any>) => logger.actionStart(action, context, component),
    performance: (message: string, duration: number, context?: Record<string, any>) => logger.performance(message, duration, context, component)
  };
}
