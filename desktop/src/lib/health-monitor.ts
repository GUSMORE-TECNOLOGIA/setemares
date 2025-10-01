// Sistema de monitoramento de saúde para detectar problemas em tempo real
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
  lastCheck: Date;
  uptime: number;
}

export interface SystemMetrics {
  totalQuotes: number;
  successfulQuotes: number;
  failedQuotes: number;
  averageProcessingTime: number;
  errorRate: number;
}

class HealthMonitor {
  private static instance: HealthMonitor;
  private startTime: Date;
  private metrics: SystemMetrics;
  private issues: string[] = [];
  
  private constructor() {
    this.startTime = new Date();
    this.metrics = {
      totalQuotes: 0,
      successfulQuotes: 0,
      failedQuotes: 0,
      averageProcessingTime: 0,
      errorRate: 0
    };
  }
  
  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }
  
  // Registrar início de processamento
  recordQuoteStart(): { startTime: number; quoteId: string } {
    const startTime = Date.now();
    const quoteId = `quote_${startTime}_${Math.random().toString(36).substr(2, 9)}`;
    return { startTime, quoteId };
  }
  
  // Registrar sucesso
  recordQuoteSuccess(quoteId: string, startTime: number): void {
    const processingTime = Date.now() - startTime;
    
    this.metrics.totalQuotes++;
    this.metrics.successfulQuotes++;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.totalQuotes - 1) + processingTime) / this.metrics.totalQuotes;
    
    this.updateErrorRate();
    
    console.log(`✅ Quote ${quoteId} processada com sucesso em ${processingTime}ms`);
  }
  
  // Registrar falha
  recordQuoteFailure(quoteId: string, startTime: number, error: string): void {
    const processingTime = Date.now() - startTime;
    
    this.metrics.totalQuotes++;
    this.metrics.failedQuotes++;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.totalQuotes - 1) + processingTime) / this.metrics.totalQuotes;
    
    this.updateErrorRate();
    this.addIssue(`Quote ${quoteId} falhou: ${error}`);
    
    console.error(`❌ Quote ${quoteId} falhou em ${processingTime}ms:`, error);
  }
  
  // Verificar saúde do sistema
  getHealthStatus(): HealthStatus {
    const uptime = Date.now() - this.startTime.getTime();
    
    // Determinar status baseado na taxa de erro
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (this.metrics.errorRate < 0.05) { // < 5% de erro
      status = 'healthy';
    } else if (this.metrics.errorRate < 0.20) { // < 20% de erro
      status = 'degraded';
    } else { // >= 20% de erro
      status = 'unhealthy';
    }
    
    return {
      status,
      issues: [...this.issues],
      lastCheck: new Date(),
      uptime
    };
  }
  
  // Obter métricas do sistema
  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }
  
  // Adicionar problema
  private addIssue(issue: string): void {
    this.issues.push(`${new Date().toISOString()}: ${issue}`);
    
    // Manter apenas os últimos 50 problemas
    if (this.issues.length > 50) {
      this.issues = this.issues.slice(-50);
    }
  }
  
  // Atualizar taxa de erro
  private updateErrorRate(): void {
    if (this.metrics.totalQuotes > 0) {
      this.metrics.errorRate = this.metrics.failedQuotes / this.metrics.totalQuotes;
    }
  }
  
  // Limpar problemas antigos
  clearOldIssues(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.issues = this.issues.filter(issue => {
      const timestamp = new Date(issue.split(': ')[0]);
      return timestamp > oneHourAgo;
    });
  }
  
  // Reset das métricas (útil para testes)
  reset(): void {
    this.startTime = new Date();
    this.metrics = {
      totalQuotes: 0,
      successfulQuotes: 0,
      failedQuotes: 0,
      averageProcessingTime: 0,
      errorRate: 0
    };
    this.issues = [];
  }
  
  // Verificar se o sistema está funcionando bem
  isSystemHealthy(): boolean {
    const health = this.getHealthStatus();
    return health.status === 'healthy';
  }
  
  // Obter resumo para logs
  getSummary(): string {
    const health = this.getHealthStatus();
    const metrics = this.getMetrics();
    
    return `Sistema: ${health.status.toUpperCase()} | ` +
           `Quotes: ${metrics.totalQuotes} (${metrics.successfulQuotes} sucesso, ${metrics.failedQuotes} falhas) | ` +
           `Taxa de erro: ${(metrics.errorRate * 100).toFixed(1)}% | ` +
           `Tempo médio: ${metrics.averageProcessingTime.toFixed(0)}ms | ` +
           `Uptime: ${Math.floor(health.uptime / 1000 / 60)}min`;
  }
}

// Instância singleton
export const healthMonitor = HealthMonitor.getInstance();

// Função para limpar problemas antigos a cada hora
setInterval(() => {
  healthMonitor.clearOldIssues();
}, 60 * 60 * 1000); // 1 hora
