/**
 * Performance monitoring and optimization utilities
 */

interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initPerformanceObservers();
  }

  /**
   * Start measuring performance for a named operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End measuring performance for a named operation
   */
  end(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log performance in development
    if (import.meta.env.DEV) {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`, metric.metadata);
    }

    // Send to analytics in production
    if (import.meta.env.PROD) {
      this.sendToAnalytics(metric);
    }

    return duration;
  }

  /**
   * Measure a function's execution time
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Measure an async function's execution time
   */
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get all performance metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Initialize performance observers for Core Web Vitals
   */
  private initPerformanceObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries[entries.length - 1];
        this.recordWebVital('FCP', fcp.startTime);
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch (error) {
      console.warn('Failed to observe FCP:', error);
    }

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1];
        this.recordWebVital('LCP', lcp.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('Failed to observe LCP:', error);
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fid = entries[entries.length - 1];
        const delay = (fid as any).processingStart - fid.startTime;
        this.recordWebVital('FID', delay);
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      console.warn('Failed to observe FID:', error);
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let cls = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
        this.recordWebVital('CLS', cls);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('Failed to observe CLS:', error);
    }
  }

  /**
   * Record Core Web Vital metric
   */
  private recordWebVital(name: string, value: number): void {
    if (import.meta.env.DEV) {
      console.log(`📊 Web Vital - ${name}: ${value.toFixed(2)}`);
    }

    if (import.meta.env.PROD) {
      this.sendToAnalytics({
        name: `web-vital-${name}`,
        startTime: 0,
        endTime: performance.now(),
        duration: value,
        metadata: { type: 'web-vital' }
      });
    }
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metric: PerformanceMetrics): void {
    // Implementation for sending to analytics service
    // Example: Google Analytics, Mixpanel, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        duration: metric.duration,
        metadata: metric.metadata
      });
    }
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component performance
 */
export const usePerformanceMeasure = () => {
  const measure = (name: string, fn: () => void, metadata?: Record<string, any>) => {
    return performanceMonitor.measure(name, fn, metadata);
  };

  const measureAsync = async <T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> => {
    return performanceMonitor.measureAsync(name, fn, metadata);
  };

  const start = (name: string, metadata?: Record<string, any>) => {
    performanceMonitor.start(name, metadata);
  };

  const end = (name: string) => {
    return performanceMonitor.end(name);
  };

  return {
    measure,
    measureAsync,
    start,
    end,
  };
};

/**
 * Higher-order component for measuring component render time
 */
export const withPerformanceMeasure = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Component';
    
    React.useEffect(() => {
      performanceMonitor.start(`${name}-render`);
      return () => {
        performanceMonitor.end(`${name}-render`);
      };
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceMeasure(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Utility functions for performance optimization
 */
export const performanceUtils = {
  /**
   * Debounce function calls
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function calls
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Check if device is low-end
   */
  isLowEndDevice: (): boolean => {
    if (typeof navigator === 'undefined') return false;
    
    const connection = (navigator as any).connection;
    const memory = (performance as any).memory;
    
    // Check connection speed
    if (connection && connection.effectiveType) {
      const slowConnections = ['slow-2g', '2g', '3g'];
      if (slowConnections.includes(connection.effectiveType)) {
        return true;
      }
    }
    
    // Check device memory
    if (memory && memory.jsHeapSizeLimit) {
      const memoryLimit = memory.jsHeapSizeLimit / (1024 * 1024); // Convert to MB
      if (memoryLimit < 1000) { // Less than 1GB
        return true;
      }
    }
    
    // Check CPU cores
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return true;
    }
    
    return false;
  },

  /**
   * Get performance budget recommendations
   */
  getPerformanceBudget: () => {
    const isLowEnd = performanceUtils.isLowEndDevice();
    
    return {
      maxBundleSize: isLowEnd ? 500 : 1000, // KB
      maxImageSize: isLowEnd ? 100 : 200,   // KB
      maxFontSize: isLowEnd ? 50 : 100,     // KB
      maxRenderTime: isLowEnd ? 100 : 200,  // ms
      maxNetworkTime: isLowEnd ? 2000 : 3000, // ms
    };
  }
};

export default performanceMonitor;
