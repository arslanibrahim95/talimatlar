/**
 * Real User Monitoring (RUM) system
 * Tracks actual user performance metrics in production
 */

interface RUMData {
  timestamp: number;
  url: string;
  userAgent: string;
  connection: ConnectionInfo;
  performance: PerformanceMetrics;
  errors: ErrorData[];
  interactions: InteractionData[];
  sessionId: string;
  userId?: string;
}

interface ConnectionInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface PerformanceMetrics {
  navigationStart: number;
  loadEventEnd: number;
  domContentLoadedEventEnd: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToFirstByte: number;
}

interface ErrorData {
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
  type: string;
}

interface InteractionData {
  type: string;
  target: string;
  timestamp: number;
  duration?: number;
}

class RUMMonitor {
  private sessionId: string;
  private userId?: string;
  private data: RUMData;
  private errorCount = 0;
  private interactionCount = 0;
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.data = this.initializeData();
    this.init();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeData(): RUMData {
    return {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      performance: this.getPerformanceMetrics(),
      errors: [],
      interactions: [],
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }

  private getConnectionInfo(): ConnectionInfo {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
    };
  }

  private getPerformanceMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const firstPaint = paint.find(entry => entry.name === 'first-paint');
    const firstContentfulPaint = paint.find(entry => entry.name === 'first-contentful-paint');

    return {
      navigationStart: navigation?.startTime || 0,
      loadEventEnd: navigation?.loadEventEnd || 0,
      domContentLoadedEventEnd: navigation?.domContentLoadedEventEnd || 0,
      firstPaint: firstPaint?.startTime || 0,
      firstContentfulPaint: firstContentfulPaint?.startTime || 0,
      largestContentfulPaint: 0, // Will be updated by observer
      firstInputDelay: 0, // Will be updated by observer
      cumulativeLayoutShift: 0, // Will be updated by observer
      timeToFirstByte: navigation?.responseStart || 0,
    };
  }

  private init(): void {
    if (this.isInitialized) return;
    
    this.setupPerformanceObservers();
    this.setupErrorTracking();
    this.setupInteractionTracking();
    this.setupNavigationTracking();
    this.setupPeriodicReporting();
    
    this.isInitialized = true;
  }

  private setupPerformanceObservers(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.data.performance.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.data.performance.firstInputDelay = (lastEntry as any).processingStart - lastEntry.startTime;
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let cls = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
        this.data.performance.cumulativeLayoutShift = cls;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  private setupErrorTracking(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        timestamp: Date.now(),
        type: 'javascript',
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        type: 'promise',
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.trackError({
          message: `Failed to load resource: ${(event.target as any).src || (event.target as any).href}`,
          url: (event.target as any).src || (event.target as any).href,
          timestamp: Date.now(),
          type: 'resource',
        });
      }
    }, true);
  }

  private setupInteractionTracking(): void {
    const trackInteraction = (type: string, target: EventTarget, duration?: number) => {
      const targetElement = target as HTMLElement;
      this.trackInteraction({
        type,
        target: targetElement.tagName?.toLowerCase() || 'unknown',
        timestamp: Date.now(),
        duration,
      });
    };

    // Click interactions
    document.addEventListener('click', (event) => {
      trackInteraction('click', event.target);
    }, { passive: true });

    // Form interactions
    document.addEventListener('submit', (event) => {
      trackInteraction('form_submit', event.target);
    }, { passive: true });

    // Input interactions
    document.addEventListener('input', (event) => {
      trackInteraction('input', event.target);
    }, { passive: true });

    // Scroll tracking
    let scrollTimeout: number;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        trackInteraction('scroll', document);
      }, 100);
    }, { passive: true });
  }

  private setupNavigationTracking(): void {
    // Track navigation changes
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.trackNavigation(currentUrl);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private setupPeriodicReporting(): void {
    // Report data every 30 seconds
    setInterval(() => {
      this.reportData();
    }, 30000);

    // Report data before page unload
    window.addEventListener('beforeunload', () => {
      this.reportData(true);
    });
  }

  public trackError(error: ErrorData): void {
    this.data.errors.push(error);
    this.errorCount++;

    // Report immediately for critical errors
    if (this.errorCount >= 5) {
      this.reportData();
      this.errorCount = 0;
    }
  }

  public trackInteraction(interaction: InteractionData): void {
    this.data.interactions.push(interaction);
    this.interactionCount++;

    // Report immediately for high interaction counts
    if (this.interactionCount >= 50) {
      this.reportData();
      this.interactionCount = 0;
    }
  }

  public trackNavigation(url: string): void {
    this.data.url = url;
    this.data.timestamp = Date.now();
  }

  public setUserId(userId: string): void {
    this.userId = userId;
    this.data.userId = userId;
  }

  public getMetrics(): PerformanceMetrics {
    return this.data.performance;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  private async reportData(isFinal = false): Promise<void> {
    try {
      const reportData = {
        ...this.data,
        isFinal,
        errorCount: this.data.errors.length,
        interactionCount: this.data.interactions.length,
      };

      // Send to analytics service
      if (import.meta.env.PROD) {
        await this.sendToAnalytics(reportData);
      } else {
        console.log('RUM Data:', reportData);
      }

      // Clear data after reporting
      if (isFinal) {
        this.data.errors = [];
        this.data.interactions = [];
        this.errorCount = 0;
        this.interactionCount = 0;
      }
    } catch (error) {
      console.error('Failed to report RUM data:', error);
    }
  }

  private async sendToAnalytics(data: any): Promise<void> {
    try {
      const response = await fetch('/api/analytics/rum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send RUM data:', error);
    }
  }

  public destroy(): void {
    // Cleanup observers and event listeners
    this.isInitialized = false;
  }
}

// Singleton instance
export const rumMonitor = new RUMMonitor();

// React hook for RUM monitoring
export const useRUMMonitoring = () => {
  const trackCustomEvent = (eventName: string, data?: any) => {
    rumMonitor.trackInteraction({
      type: eventName,
      target: 'custom',
      timestamp: Date.now(),
    });
  };

  const trackPageView = (pageName: string) => {
    rumMonitor.trackNavigation(`/pages/${pageName}`);
  };

  const trackError = (error: Error, context?: string) => {
    rumMonitor.trackError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: Date.now(),
      type: 'custom',
    });
  };

  return {
    trackCustomEvent,
    trackPageView,
    trackError,
    getMetrics: () => rumMonitor.getMetrics(),
    getSessionId: () => rumMonitor.getSessionId(),
  };
};

export default rumMonitor;
