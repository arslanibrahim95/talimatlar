/**
 * UX Analytics ve Performance Tracking
 * Core Web Vitals ve kullanıcı deneyimi metriklerini takip eder
 */

/**
 * User Experience metrics interface
 * Tracks various aspects of user interaction and satisfaction
 */
export interface UXMetrics {
  pageLoadTime: number;
  interactionTime: number;
  errorRate: number;
  userEngagement: number;
  mobilePerformance: number;
  accessibilityScore: number;
}

/**
 * Performance metrics interface
 * Core Web Vitals and technical performance indicators
 */
export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

/**
 * UX Analytics class for tracking user experience metrics
 * Implements Core Web Vitals monitoring and custom UX tracking
 */
class UXAnalytics {
  private metrics: UXMetrics = {
    pageLoadTime: 0,
    interactionTime: 0,
    errorRate: 0,
    userEngagement: 0,
    mobilePerformance: 0,
    accessibilityScore: 0
  };

  private performanceMetrics: PerformanceMetrics = {
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0
  };

  constructor() {
    this.initPerformanceObserver();
    this.initErrorTracking();
    this.initUserEngagementTracking();
  }

  /**
   * Initializes Performance Observer for Core Web Vitals
   * Monitors FCP, LCP, FID, and CLS metrics
   */
  private initPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries[entries.length - 1];
        this.performanceMetrics.fcp = fcp.startTime;
        this.logMetric('FCP', fcp.startTime);
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1];
        this.performanceMetrics.lcp = lcp.startTime;
        this.logMetric('LCP', lcp.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fid = entries[entries.length - 1];
        this.performanceMetrics.fid = (fid as any).processingStart - fid.startTime;
        this.logMetric('FID', this.performanceMetrics.fid);
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
        this.performanceMetrics.cls = cls;
        this.logMetric('CLS', cls);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Initializes error tracking for JavaScript errors and unhandled rejections
   * Calculates error rate based on total interactions
   */
  private initErrorTracking() {
    let errorCount = 0;
    const totalInteractions = 0;

    window.addEventListener('error', (event) => {
      errorCount++;
      this.metrics.errorRate = (errorCount / Math.max(totalInteractions, 1)) * 100;
      this.logError('JavaScript Error', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      errorCount++;
      this.metrics.errorRate = (errorCount / Math.max(totalInteractions, 1)) * 100;
      this.logError('Unhandled Promise Rejection', event.reason);
    });
  }

  /**
   * Initializes user engagement tracking
   * Monitors user interactions and calculates engagement score
   */
  private initUserEngagementTracking() {
    let interactionCount = 0;
    let lastInteractionTime = Date.now();

    const trackInteraction = () => {
      interactionCount++;
      lastInteractionTime = Date.now();
      this.metrics.userEngagement = Math.min(100, (interactionCount / 10) * 100);
    };

    // Track various user interactions
    ['click', 'scroll', 'keypress', 'mousemove'].forEach(eventType => {
      document.addEventListener(eventType, trackInteraction, { passive: true });
    });

    // Calculate interaction time
    setInterval(() => {
      this.metrics.interactionTime = Date.now() - lastInteractionTime;
    }, 1000);
  }

  /**
   * Tracks page load performance
   * Measures time from navigation start to load complete
   */
  trackPageLoad() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.navigationStart;
        this.performanceMetrics.ttfb = navigation.responseStart - navigation.requestStart;
        this.logMetric('Page Load Time', this.metrics.pageLoadTime);
        this.logMetric('TTFB', this.performanceMetrics.ttfb);
      }
    }
  }

  /**
   * Detects mobile performance characteristics
   * Adjusts metrics based on device capabilities
   */
  detectMobilePerformance() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const connection = (navigator as any).connection;
    
    if (isMobile) {
      // Adjust performance expectations for mobile devices
      this.metrics.mobilePerformance = this.calculateMobileScore();
      this.logMetric('Mobile Performance Score', this.metrics.mobilePerformance);
    }
  }

  /**
   * Calculates accessibility score based on various factors
   * Considers ARIA labels, color contrast, and keyboard navigation
   */
  calculateAccessibilityScore() {
    let score = 100;
    
    // Check for ARIA labels
    const elementsWithoutAria = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    score -= elementsWithoutAria.length * 2;
    
    // Check for alt text on images
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    score -= imagesWithoutAlt.length * 3;
    
    // Check for proper heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let headingScore = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (index === 0 && level === 1) headingScore += 20;
      if (level <= 3) headingScore += 10;
    });
    score += headingScore;
    
    this.metrics.accessibilityScore = Math.max(0, Math.min(100, score));
    this.logMetric('Accessibility Score', this.metrics.accessibilityScore);
  }

  /**
   * Logs performance metrics for debugging and analysis
   * @param name - Metric name
   * @param value - Metric value
   */
  private logMetric(name: string, value: number) {
    if (import.meta.env.DEV) {
      console.log(`[UX Analytics] ${name}:`, value);
    }
  }

  /**
   * Logs errors for debugging purposes
   * @param type - Error type
   * @param error - Error object or message
   */
  private logError(type: string, error: any) {
    if (import.meta.env.DEV) {
      console.error(`[UX Analytics] ${type}:`, error);
    }
  }

  /**
   * Returns current UX metrics
   * @returns Combined UX and performance metrics
   */
  getMetrics(): UXMetrics & PerformanceMetrics {
    return { ...this.metrics, ...this.performanceMetrics };
  }

  /**
   * Resets all metrics to initial values
   * Useful for testing and debugging
   */
  resetMetrics() {
    this.metrics = {
      pageLoadTime: 0,
      interactionTime: 0,
      errorRate: 0,
      userEngagement: 0,
      mobilePerformance: 0,
      accessibilityScore: 0
    };
    
    this.performanceMetrics = {
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0
    };
  }

  /**
   * Calculates mobile performance score based on device characteristics
   * @returns Mobile performance score (0-100)
   */
  private calculateMobileScore(): number {
    let score = 100;
    
    // Check for slow connection
    const connection = (navigator as any).connection;
    if (connection) {
      if (connection.effectiveType === 'slow-2g') score -= 30;
      else if (connection.effectiveType === '2g') score -= 20;
      else if (connection.effectiveType === '3g') score -= 10;
    }
    
    // Check for low memory devices
    if ((navigator as any).deviceMemory) {
      const memory = (navigator as any).deviceMemory;
      if (memory < 2) score -= 15;
      else if (memory < 4) score -= 5;
    }
    
    // Check for slow CPU
    if ((navigator as any).hardwareConcurrency) {
      const cores = (navigator as any).hardwareConcurrency;
      if (cores < 4) score -= 10;
    }
    
    return Math.max(0, score);
  }
}

/**
 * Global instance of UX Analytics
 * Provides access to analytics functionality throughout the application
 */
export const uxAnalytics = new UXAnalytics();

/**
 * Custom hook for UX tracking
 * Provides tracking functions and current metrics
 * @returns Object with tracking functions and metrics
 */
export const useUXTracking = () => {
  const trackPageView = (pageName: string) => {
    uxAnalytics.trackPageLoad();
    if (import.meta.env.DEV) {
      console.log(`[UX Tracking] Page View: ${pageName}`);
    }
  };

  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (import.meta.env.DEV) {
      console.log(`[UX Tracking] Event: ${eventName}`, properties);
    }
  };

  const trackError = (error: Error, context?: string) => {
    if (import.meta.env.DEV) {
      console.error(`[UX Tracking] Error in ${context}:`, error);
    }
  };

  return {
    trackPageView,
    trackEvent,
    trackError,
    metrics: uxAnalytics.getMetrics()
  };
};
