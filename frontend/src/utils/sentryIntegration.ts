// Sentry Integration for Error Tracking
// Provides comprehensive error monitoring and reporting

import { AppError, ErrorType, ErrorSeverity } from './errorHandling';

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
  beforeSend?: (event: any) => any;
  beforeBreadcrumb?: (breadcrumb: any) => any;
  integrations?: any[];
  tags?: Record<string, string>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
}

export interface SentryEvent {
  event_id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  logger: string;
  platform: string;
  sdk: {
    name: string;
    version: string;
  };
  message?: string;
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename?: string;
          function?: string;
          lineno?: number;
          colno?: number;
        }>;
      };
    }>;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  breadcrumbs?: Array<{
    timestamp: number;
    type: string;
    category: string;
    message?: string;
    level: string;
    data?: Record<string, any>;
  }>;
  contexts?: Record<string, any>;
  fingerprint?: string[];
}

class SentryClient {
  private config: SentryConfig;
  private breadcrumbs: Array<any> = [];
  private user: any = null;
  private tags: Record<string, string> = {};
  private isInitialized = false;

  constructor(config: SentryConfig) {
    this.config = {
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      ...config,
    };
  }

  /**
   * Initializes Sentry client
   */
  init(): void {
    if (this.isInitialized) {
      console.warn('Sentry is already initialized');
      return;
    }

    // In a real implementation, this would initialize the actual Sentry SDK
    console.log('Sentry initialized with config:', {
      dsn: this.config.dsn ? '***' : 'not provided',
      environment: this.config.environment,
      release: this.config.release,
    });

    this.isInitialized = true;
  }

  /**
   * Captures an exception
   */
  captureException(error: AppError | Error, context?: Record<string, any>): string {
    if (!this.isInitialized) {
      console.warn('Sentry not initialized, cannot capture exception');
      return '';
    }

    const event = this.createEventFromError(error, context);
    const eventId = this.generateEventId();

    // Apply beforeSend hook if configured
    const processedEvent = this.config.beforeSend 
      ? this.config.beforeSend({ ...event, event_id: eventId })
      : { ...event, event_id: eventId };

    if (processedEvent) {
      this.sendEvent(processedEvent);
    }

    return eventId;
  }

  /**
   * Captures a message
   */
  captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info'): string {
    if (!this.isInitialized) {
      console.warn('Sentry not initialized, cannot capture message');
      return '';
    }

    const event: SentryEvent = {
      event_id: this.generateEventId(),
      timestamp: Date.now() / 1000,
      level,
      logger: 'javascript',
      platform: 'javascript',
      sdk: {
        name: 'sentry.javascript',
        version: '7.0.0',
      },
      message,
      tags: { ...this.tags, ...this.config.tags },
      user: this.user || this.config.user,
      breadcrumbs: this.breadcrumbs.slice(-10), // Last 10 breadcrumbs
    };

    const processedEvent = this.config.beforeSend 
      ? this.config.beforeSend(event)
      : event;

    if (processedEvent) {
      this.sendEvent(processedEvent);
    }

    return event.event_id;
  }

  /**
   * Adds breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    message?: string;
    category: string;
    level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
    data?: Record<string, any>;
  }): void {
    const fullBreadcrumb = {
      timestamp: Date.now() / 1000,
      type: 'default',
      category: breadcrumb.category,
      message: breadcrumb.message,
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
    };

    // Apply beforeBreadcrumb hook if configured
    const processedBreadcrumb = this.config.beforeBreadcrumb 
      ? this.config.beforeBreadcrumb(fullBreadcrumb)
      : fullBreadcrumb;

    if (processedBreadcrumb) {
      this.breadcrumbs.push(processedBreadcrumb);
      
      // Keep only last 100 breadcrumbs
      if (this.breadcrumbs.length > 100) {
        this.breadcrumbs = this.breadcrumbs.slice(-100);
      }
    }
  }

  /**
   * Sets user context
   */
  setUser(user: { id?: string; email?: string; username?: string }): void {
    this.user = user;
  }

  /**
   * Sets tags
   */
  setTag(key: string, value: string): void {
    this.tags[key] = value;
  }

  /**
   * Sets multiple tags
   */
  setTags(tags: Record<string, string>): void {
    this.tags = { ...this.tags, ...tags };
  }

  /**
   * Sets context
   */
  setContext(key: string, context: any): void {
    // In a real implementation, this would be stored and sent with events
    console.log(`Sentry context set: ${key}`, context);
  }

  /**
   * Creates event from error
   */
  private createEventFromError(error: AppError | Error, context?: Record<string, any>): SentryEvent {
    const isAppError = this.isAppError(error);
    const level = isAppError ? this.mapSeverityToLevel(error.severity) : 'error';

    const event: SentryEvent = {
      event_id: this.generateEventId(),
      timestamp: Date.now() / 1000,
      level,
      logger: 'javascript',
      platform: 'javascript',
      sdk: {
        name: 'sentry.javascript',
        version: '7.0.0',
      },
      message: error.message,
      exception: {
        values: [{
          type: error.name || 'Error',
          value: error.message,
          stacktrace: this.parseStackTrace(error.stack),
        }],
      },
      tags: {
        ...this.tags,
        ...this.config.tags,
        ...(isAppError ? {
          errorType: error.type,
          errorSeverity: error.severity,
          isRetryable: error.isRetryable.toString(),
        } : {}),
      },
      extra: {
        ...context,
        ...(isAppError ? {
          errorContext: error.context,
          originalError: error.originalError?.message,
          statusCode: error.statusCode,
          service: error.service,
        } : {}),
      },
      user: this.user || this.config.user,
      breadcrumbs: this.breadcrumbs.slice(-10),
    };

    return event;
  }

  /**
   * Checks if error is AppError
   */
  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'type' in error && 'severity' in error;
  }

  /**
   * Maps ErrorSeverity to Sentry level
   */
  private mapSeverityToLevel(severity: ErrorSeverity): 'debug' | 'info' | 'warning' | 'error' | 'fatal' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'info';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.CRITICAL:
        return 'fatal';
      default:
        return 'error';
    }
  }

  /**
   * Parses stack trace
   */
  private parseStackTrace(stack?: string): { frames: Array<any> } | undefined {
    if (!stack) return undefined;

    const frames = stack.split('\n').slice(1).map(line => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          filename: match[2],
          lineno: parseInt(match[3]),
          colno: parseInt(match[4]),
        };
      }
      return {
        function: line.trim(),
      };
    });

    return { frames };
  }

  /**
   * Generates unique event ID
   */
  private generateEventId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Sends event to Sentry (placeholder implementation)
   */
  private sendEvent(event: SentryEvent): void {
    // In a real implementation, this would send the event to Sentry
    console.log('Sentry event sent:', {
      eventId: event.event_id,
      level: event.level,
      message: event.message,
      tags: event.tags,
    });

    // Simulate network request
    if (this.config.dsn) {
      // In production, this would be a real HTTP request to Sentry
      fetch(this.config.dsn, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }).catch(error => {
        console.error('Failed to send event to Sentry:', error);
      });
    }
  }
}

// Create Sentry client instance
let sentryClient: SentryClient | null = null;

/**
 * Initializes Sentry
 */
export const initSentry = (config: SentryConfig): void => {
  sentryClient = new SentryClient(config);
  sentryClient.init();
};

/**
 * Captures exception
 */
export const captureException = (error: AppError | Error, context?: Record<string, any>): string => {
  if (!sentryClient) {
    console.warn('Sentry not initialized, cannot capture exception');
    return '';
  }
  return sentryClient.captureException(error, context);
};

/**
 * Captures message
 */
export const captureMessage = (message: string, level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal'): string => {
  if (!sentryClient) {
    console.warn('Sentry not initialized, cannot capture message');
    return '';
  }
  return sentryClient.captureMessage(message, level);
};

/**
 * Adds breadcrumb
 */
export const addBreadcrumb = (breadcrumb: {
  message?: string;
  category: string;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  data?: Record<string, any>;
}): void => {
  if (!sentryClient) {
    console.warn('Sentry not initialized, cannot add breadcrumb');
    return;
  }
  sentryClient.addBreadcrumb(breadcrumb);
};

/**
 * Sets user context
 */
export const setUser = (user: { id?: string; email?: string; username?: string }): void => {
  if (!sentryClient) {
    console.warn('Sentry not initialized, cannot set user');
    return;
  }
  sentryClient.setUser(user);
};

/**
 * Sets tags
 */
export const setTag = (key: string, value: string): void => {
  if (!sentryClient) {
    console.warn('Sentry not initialized, cannot set tag');
    return;
  }
  sentryClient.setTag(key, value);
};

/**
 * Sets multiple tags
 */
export const setTags = (tags: Record<string, string>): void => {
  if (!sentryClient) {
    console.warn('Sentry not initialized, cannot set tags');
    return;
  }
  sentryClient.setTags(tags);
};

/**
 * Sets context
 */
export const setContext = (key: string, context: any): void => {
  if (!sentryClient) {
    console.warn('Sentry not initialized, cannot set context');
    return;
  }
  sentryClient.setContext(key, context);
};

/**
 * Gets Sentry client instance
 */
export const getSentryClient = (): SentryClient | null => {
  return sentryClient;
};

export default {
  init: initSentry,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setTags,
  setContext,
  getClient: getSentryClient,
};
