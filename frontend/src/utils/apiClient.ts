// Enhanced API Client with Error Handling, Retry, and Circuit Breaker
// Provides robust API communication with comprehensive error management

import { errorHandler, AppError, ErrorType, ErrorSeverity } from './errorHandling';
import { retryApiCall, RetryConfig } from './retryMechanism';
import { withCircuitBreaker, CircuitBreakerConfig } from './circuitBreaker';
import { API_CONFIG } from '../config/api';

export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean | RetryConfig;
  circuitBreaker?: boolean | CircuitBreakerConfig;
  skipErrorHandling?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  success: boolean;
  error?: AppError;
}

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  retryConfig?: RetryConfig;
  circuitBreakerConfig?: CircuitBreakerConfig;
  enableLogging?: boolean;
}

export class ApiClient {
  private config: Required<ApiClientConfig>;
  private requestInterceptors: Array<(config: ApiRequestConfig) => ApiRequestConfig> = [];
  private responseInterceptors: Array<(response: ApiResponse) => ApiResponse> = [];
  private errorInterceptors: Array<(error: AppError) => AppError> = [];

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || API_CONFIG.REQUEST_CONFIG.TIMEOUT,
      defaultHeaders: {
        'Content-Type': 'application/json',
        ...config.defaultHeaders,
      },
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: true,
        ...config.retryConfig,
      },
      circuitBreakerConfig: {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 5000,
        resetTimeout: 60000,
        monitoringPeriod: 60000,
        volumeThreshold: 10,
        ...config.circuitBreakerConfig,
      },
      enableLogging: config.enableLogging ?? true,
    };
  }

  /**
   * Adds a request interceptor
   */
  addRequestInterceptor(interceptor: (config: ApiRequestConfig) => ApiRequestConfig): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Adds a response interceptor
   */
  addResponseInterceptor(interceptor: (response: ApiResponse) => ApiResponse): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Adds an error interceptor
   */
  addErrorInterceptor(interceptor: (error: AppError) => AppError): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Makes an API request with comprehensive error handling
   */
  async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Apply request interceptors
      let processedConfig = { ...config };
      for (const interceptor of this.requestInterceptors) {
        processedConfig = interceptor(processedConfig);
      }

      // Add default headers
      const headers = {
        ...this.config.defaultHeaders,
        ...processedConfig.headers,
        'X-Request-ID': requestId,
      };

      // Build full URL
      const url = this.buildUrl(processedConfig.url);

      // Create fetch options
      const fetchOptions: RequestInit = {
        method: processedConfig.method,
        headers,
        signal: this.createAbortSignal(processedConfig.timeout || this.config.timeout),
      };

      // Add body for non-GET requests
      if (processedConfig.data && processedConfig.method !== 'GET') {
        fetchOptions.body = JSON.stringify(processedConfig.data);
      }

      // Log request if enabled
      if (this.config.enableLogging) {
        console.log(`API Request [${processedConfig.method}] ${url}`, {
          requestId,
          headers,
          data: processedConfig.data,
        });
      }

      // Execute request with retry and circuit breaker if enabled
      const response = await this.executeRequest(url, fetchOptions, processedConfig, requestId);

      // Process response
      const apiResponse = await this.processResponse<T>(response, requestId, startTime);

      // Apply response interceptors
      let processedResponse = apiResponse;
      for (const interceptor of this.responseInterceptors) {
        processedResponse = interceptor(processedResponse);
      }

      return processedResponse;
    } catch (error) {
      const duration = Date.now() - startTime;
      return this.handleRequestError(error as Error, config, requestId, duration);
    }
  }

  /**
   * Executes the actual request with retry and circuit breaker
   */
  private async executeRequest(
    url: string,
    fetchOptions: RequestInit,
    config: ApiRequestConfig,
    requestId: string
  ): Promise<Response> {
    const executeFn = async (): Promise<Response> => {
      const response = await fetch(url, fetchOptions);
      
      // Check if response is ok
      if (!response.ok) {
        const error = await this.createHttpError(response, requestId);
        throw error;
      }

      return response;
    };

    // Apply circuit breaker if enabled
    if (config.circuitBreaker !== false) {
      const circuitBreakerConfig = typeof config.circuitBreaker === 'object' 
        ? config.circuitBreaker 
        : this.config.circuitBreakerConfig;
      
      const serviceName = this.extractServiceName(url);
      const circuitBreakerFn = withCircuitBreaker(
        executeFn,
        serviceName,
        circuitBreakerConfig,
        { operation: `${config.method} ${url}` }
      );
      
      // Apply retry if enabled
      if (config.retry !== false) {
        const retryConfig = typeof config.retry === 'object' 
          ? config.retry 
          : this.config.retryConfig;
        
        return retryApiCall(circuitBreakerFn, retryConfig, {
          operation: `${config.method} ${url}`,
        });
      }
      
      return circuitBreakerFn();
    }

    // Apply retry if enabled (without circuit breaker)
    if (config.retry !== false) {
      const retryConfig = typeof config.retry === 'object' 
        ? config.retry 
        : this.config.retryConfig;
      
      return retryApiCall(executeFn, retryConfig, {
        operation: `${config.method} ${url}`,
      });
    }

    // Execute without retry or circuit breaker
    return executeFn();
  }

  /**
   * Processes the response
   */
  private async processResponse<T>(
    response: Response,
    requestId: string,
    startTime: number
  ): Promise<ApiResponse<T>> {
    const duration = Date.now() - startTime;
    let data: T;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as T;
      }
    } catch (error) {
      throw this.createError(
        'Failed to parse response',
        ErrorType.CLIENT_ERROR,
        ErrorSeverity.MEDIUM,
        { requestId, status: response.status }
      );
    }

    const apiResponse: ApiResponse<T> = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      success: response.ok,
    };

    // Log response if enabled
    if (this.config.enableLogging) {
      console.log(`API Response [${response.status}] ${response.url}`, {
        requestId,
        duration: `${duration}ms`,
        success: apiResponse.success,
        data: apiResponse.data,
      });
    }

    return apiResponse;
  }

  /**
   * Handles request errors
   */
  private async handleRequestError(
    error: Error,
    config: ApiRequestConfig,
    requestId: string,
    duration: number
  ): Promise<ApiResponse> {
    let appError: AppError;

    if (error.name === 'AbortError') {
      appError = this.createError(
        'Request timeout',
        ErrorType.TIMEOUT_ERROR,
        ErrorSeverity.MEDIUM,
        { requestId, duration }
      );
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      appError = this.createError(
        'Network error',
        ErrorType.NETWORK_ERROR,
        ErrorSeverity.MEDIUM,
        { requestId, duration }
      );
    } else if (errorHandler.isAppError(error)) {
      appError = error;
    } else {
      appError = this.createError(
        error.message || 'Unknown error',
        ErrorType.UNKNOWN_ERROR,
        ErrorSeverity.MEDIUM,
        { requestId, duration },
        error
      );
    }

    // Apply error interceptors
    for (const interceptor of this.errorInterceptors) {
      appError = interceptor(appError);
    }

    // Handle error if not skipped
    if (!config.skipErrorHandling) {
      errorHandler.handleError(appError);
    }

    return {
      data: null,
      status: 0,
      statusText: 'Error',
      headers: new Headers(),
      success: false,
      error: appError,
    };
  }

  /**
   * Creates an HTTP error from response
   */
  private async createHttpError(response: Response, requestId: string): Promise<AppError> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorType = ErrorType.SERVER_ERROR;
    let severity = ErrorSeverity.MEDIUM;

    // Try to get error message from response body
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      }
    } catch {
      // Ignore parsing errors
    }

    // Classify error type based on status code
    switch (response.status) {
      case 400:
        errorType = ErrorType.VALIDATION_ERROR;
        severity = ErrorSeverity.MEDIUM;
        break;
      case 401:
        errorType = ErrorType.AUTHENTICATION_ERROR;
        severity = ErrorSeverity.HIGH;
        break;
      case 403:
        errorType = ErrorType.AUTHORIZATION_ERROR;
        severity = ErrorSeverity.HIGH;
        break;
      case 404:
        errorType = ErrorType.CLIENT_ERROR;
        severity = ErrorSeverity.LOW;
        break;
      case 408:
        errorType = ErrorType.TIMEOUT_ERROR;
        severity = ErrorSeverity.MEDIUM;
        break;
      case 429:
        errorType = ErrorType.RATE_LIMIT_ERROR;
        severity = ErrorSeverity.MEDIUM;
        break;
      case 503:
        errorType = ErrorType.SERVICE_UNAVAILABLE;
        severity = ErrorSeverity.HIGH;
        break;
      default:
        if (response.status >= 500) {
          errorType = ErrorType.SERVER_ERROR;
          severity = ErrorSeverity.HIGH;
        }
    }

    return this.createError(
      errorMessage,
      errorType,
      severity,
      {
        requestId,
        status: response.status,
        url: response.url,
      }
    );
  }

  /**
   * Creates an AppError
   */
  private createError(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity,
    context: Record<string, any> = {},
    originalError?: Error
  ): AppError {
    return errorHandler.createError(
      message,
      type,
      severity,
      {
        component: 'ApiClient',
        action: 'request',
        ...context,
      },
      originalError
    );
  }

  /**
   * Builds full URL
   */
  private buildUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return `${this.config.baseURL}${url}`;
  }

  /**
   * Creates abort signal for timeout
   */
  private createAbortSignal(timeout: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  /**
   * Extracts service name from URL for circuit breaker
   */
  private extractServiceName(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Generates unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods
  async get<T = any>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  async post<T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  async put<T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }

  async delete<T = any>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }

  async patch<T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, ...config });
  }
}

// Create default API client instance
export const apiClient = new ApiClient({
  enableLogging: import.meta.env.DEV,
});

// Add default interceptors
apiClient.addRequestInterceptor((config) => {
  // Add authentication token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  return config;
});

apiClient.addResponseInterceptor((response) => {
  // Handle token refresh if needed
  if (response.status === 401) {
    // Clear invalid token
    localStorage.removeItem('auth_token');
    // Redirect to login or trigger auth refresh
    window.location.href = '/auth/login';
  }
  return response;
});

export default ApiClient;
