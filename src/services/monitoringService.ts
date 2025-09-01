import { supabase } from '@/integrations/supabase/client';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface ErrorLog {
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  timestamp: Date;
}

export interface UserAction {
  action: string;
  page: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private performanceMetrics: PerformanceMetric[] = [];
  private errorLogs: ErrorLog[] = [];
  private userActions: UserAction[] = [];
  private isEnabled: boolean = true;
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds

  constructor() {
    this.startPeriodicFlush();
  }

  /**
   * Log performance metric
   */
  logPerformanceMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    context?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      context
    };

    this.performanceMetrics.push(metric);
    this.checkBatchSize();
  }

  /**
   * Log error
   */
  logError(
    message: string,
    error?: Error,
    context?: Record<string, any>,
    userId?: string
  ): void {
    if (!this.isEnabled) return;

    const errorLog: ErrorLog = {
      level: 'error',
      message,
      stack: error?.stack,
      context,
      userId,
      timestamp: new Date()
    };

    this.errorLogs.push(errorLog);
    this.checkBatchSize();
  }

  /**
   * Log warning
   */
  logWarning(
    message: string,
    context?: Record<string, any>,
    userId?: string
  ): void {
    if (!this.isEnabled) return;

    const errorLog: ErrorLog = {
      level: 'warning',
      message,
      context,
      userId,
      timestamp: new Date()
    };

    this.errorLogs.push(errorLog);
    this.checkBatchSize();
  }

  /**
   * Log info
   */
  logInfo(
    message: string,
    context?: Record<string, any>,
    userId?: string
  ): void {
    if (!this.isEnabled) return;

    const errorLog: ErrorLog = {
      level: 'info',
      message,
      context,
      userId,
      timestamp: new Date()
    };

    this.errorLogs.push(errorLog);
    this.checkBatchSize();
  }

  /**
   * Track user action
   */
  trackUserAction(
    action: string,
    page: string,
    metadata?: Record<string, any>,
    userId?: string
  ): void {
    if (!this.isEnabled) return;

    const userAction: UserAction = {
      action,
      page,
      userId,
      timestamp: new Date(),
      metadata
    };

    this.userActions.push(userAction);
    this.checkBatchSize();
  }

  /**
   * Measure function execution time
   */
  async measureExecutionTime<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.logPerformanceMetric(name, duration, 'ms', context);
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.logPerformanceMetric(`${name}_error`, duration, 'ms', context);
      this.logError(`Error in ${name}`, error as Error, context);
      throw error;
    }
  }

  /**
   * Measure synchronous function execution time
   */
  measureSyncExecutionTime<T>(
    name: string,
    fn: () => T,
    context?: Record<string, any>
  ): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.logPerformanceMetric(name, duration, 'ms', context);
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.logPerformanceMetric(`${name}_error`, duration, 'ms', context);
      this.logError(`Error in ${name}`, error as Error, context);
      throw error;
    }
  }

  /**
   * Track page load performance
   */
  trackPageLoad(page: string): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.logPerformanceMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart, 'ms', {
            page,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
          });
        }
      });
    }
  }

  /**
   * Track API call performance
   */
  trackAPICall(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    context?: Record<string, any>
  ): void {
    this.logPerformanceMetric('api_call', duration, 'ms', {
      endpoint,
      method,
      statusCode,
      ...context
    });
  }

  /**
   * Get monitoring statistics
   */
  getStats(): {
    performanceMetrics: number;
    errorLogs: number;
    userActions: number;
    isEnabled: boolean;
  } {
    return {
      performanceMetrics: this.performanceMetrics.length,
      errorLogs: this.errorLogs.length,
      userActions: this.userActions.length,
      isEnabled: this.isEnabled
    };
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Flush all pending logs to database
   */
  async flush(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await Promise.all([
        this.flushErrorLogs(),
        this.flushPerformanceMetrics(),
        this.flushUserActions()
      ]);
    } catch (error) {
      console.error('Error flushing monitoring data:', error);
    }
  }

  /**
   * Clear all pending logs
   */
  clear(): void {
    this.performanceMetrics = [];
    this.errorLogs = [];
    this.userActions = [];
  }

  // Private methods
  private checkBatchSize(): void {
    const totalItems = this.performanceMetrics.length + this.errorLogs.length + this.userActions.length;
    
    if (totalItems >= this.batchSize) {
      this.flush();
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private async flushErrorLogs(): Promise<void> {
    if (this.errorLogs.length === 0) return;

    const logsToFlush = this.errorLogs.splice(0, this.batchSize);
    
    const { error } = await supabase
      .from('error_logs')
      .insert(logsToFlush.map(log => ({
        level: log.level,
        message: log.message,
        stack: log.stack,
        context: log.context,
        user_id: log.userId,
        timestamp: log.timestamp.toISOString()
      })));

    if (error) {
      console.error('Error flushing error logs:', error);
      // Restore logs that failed to flush
      this.errorLogs.unshift(...logsToFlush);
    }
  }

  private async flushPerformanceMetrics(): Promise<void> {
    if (this.performanceMetrics.length === 0) return;

    const metricsToFlush = this.performanceMetrics.splice(0, this.batchSize);
    
    // Store performance metrics in localStorage for now
    // In a real implementation, you'd send these to your analytics service
    const storedMetrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
    storedMetrics.push(...metricsToFlush.map(metric => ({
      ...metric,
      timestamp: metric.timestamp.toISOString()
    })));
    
    // Keep only last 1000 metrics
    if (storedMetrics.length > 1000) {
      storedMetrics.splice(0, storedMetrics.length - 1000);
    }
    
    localStorage.setItem('performance_metrics', JSON.stringify(storedMetrics));
  }

  private async flushUserActions(): Promise<void> {
    if (this.userActions.length === 0) return;

    const actionsToFlush = this.userActions.splice(0, this.batchSize);
    
    // Store user actions in localStorage for now
    // In a real implementation, you'd send these to your analytics service
    const storedActions = JSON.parse(localStorage.getItem('user_actions') || '[]');
    storedActions.push(...actionsToFlush.map(action => ({
      ...action,
      timestamp: action.timestamp.toISOString()
    })));
    
    // Keep only last 1000 actions
    if (storedActions.length > 1000) {
      storedActions.splice(0, storedActions.length - 1000);
    }
    
    localStorage.setItem('user_actions', JSON.stringify(storedActions));
  }
}

export const monitoringService = new MonitoringService(); 