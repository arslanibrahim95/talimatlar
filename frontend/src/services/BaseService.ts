import { API_CONFIG, buildApiUrl } from '../config/api';
import { 
  ApiError, 
  NetworkError, 
  ServiceResponse, 
  HttpMethod, 
  RequestConfig 
} from '../types';
import { SecureStorage, CSRFProtection } from '../utils/security';

/**
 * Base service class that provides common HTTP request functionality
 * Reduces code duplication across all service classes
 * 
 * @abstract
 * @class BaseService
 * @example
 * ```typescript
 * class MyService extends BaseService {
 *   constructor() {
 *     super('MY_SERVICE', { timeout: 30000 });
 *   }
 *   
 *   async getData() {
 *     return this.get<MyDataType>('/data');
 *   }
 * }
 * ```
 */
export abstract class BaseService {
  protected serviceName: keyof typeof API_CONFIG;
  protected defaultConfig: RequestConfig;

  constructor(serviceName: keyof typeof API_CONFIG, defaultConfig: RequestConfig = {}) {
    this.serviceName = serviceName;
    this.defaultConfig = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...defaultConfig
    };
  }

  /**
   * Generic HTTP request method with error handling and retry logic
   * 
   * @template T The expected response type
   * @param endpoint The API endpoint to call
   * @param method HTTP method to use
   * @param body Request body data
   * @param config Additional request configuration
   * @returns Promise resolving to ServiceResponse<T>
   * @example
   * ```typescript
   * const response = await this.request<User>('/users/123', 'GET');
   * if (response.success) {
   *   console.log(response.data);
   * }
   * ```
   */
  protected async request<T>(
    endpoint: string,
    method: HttpMethod = 'GET',
    body?: any,
    config: RequestConfig = {}
  ): Promise<ServiceResponse<T>> {
    const requestConfig = { ...this.defaultConfig, ...config };
    const url = buildApiUrl(this.serviceName, endpoint);
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...requestConfig.headers,
    };

    // Add CSRF protection
    CSRFProtection.addTokenToHeaders(headers);

    const fetchConfig: RequestInit = {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) }),
    };

    // Add timeout
    if (requestConfig.timeout) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestConfig.timeout);
      fetchConfig.signal = controller.signal;
    }

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= (requestConfig.retries || 0); attempt++) {
      try {
        const response = await fetch(url, fetchConfig);
        
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          throw new ApiError(
            errorData.detail || `HTTP error! status: ${response.status}`,
            response.status,
            new Date().toISOString(),
            errorData.error_code,
            errorData.field_errors
          );
        }

        const data = await this.parseResponse<T>(response);
        return {
          success: true,
          data,
          message: 'Request successful'
        };

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.shouldNotRetry(error as Error)) {
          break;
        }

        // Wait before retry
        if (attempt < (requestConfig.retries || 0)) {
          await this.delay(requestConfig.retryDelay || 1000);
        }
      }
    }

    return {
      success: false,
      error: this.createApiError(lastError),
      message: 'Request failed after retries'
    };
  }

  /**
   * GET request helper
   */
  protected async get<T>(endpoint: string, config?: RequestConfig): Promise<ServiceResponse<T>> {
    return this.request<T>(endpoint, 'GET', undefined, config);
  }

  /**
   * POST request helper
   */
  protected async post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ServiceResponse<T>> {
    return this.request<T>(endpoint, 'POST', body, config);
  }

  /**
   * PUT request helper
   */
  protected async put<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ServiceResponse<T>> {
    return this.request<T>(endpoint, 'PUT', body, config);
  }

  /**
   * DELETE request helper
   */
  protected async delete<T>(endpoint: string, config?: RequestConfig): Promise<ServiceResponse<T>> {
    return this.request<T>(endpoint, 'DELETE', undefined, config);
  }

  /**
   * PATCH request helper
   */
  protected async patch<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ServiceResponse<T>> {
    return this.request<T>(endpoint, 'PATCH', body, config);
  }

  /**
   * File upload helper
   */
  protected async uploadFile<T>(
    endpoint: string, 
    file: File, 
    additionalData?: Record<string, any>,
    config?: RequestConfig
  ): Promise<ServiceResponse<T>> {
    const url = buildApiUrl(this.serviceName, endpoint);
    const token = this.getAuthToken();
    
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...config?.headers,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new ApiError(
          errorData.detail || `HTTP error! status: ${response.status}`,
          response.status,
          new Date().toISOString(),
          errorData.error_code,
          errorData.field_errors
        );
      }

      const data = await this.parseResponse<T>(response);
      return {
        success: true,
        data,
        message: 'File uploaded successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: this.createApiError(error as Error),
        message: 'File upload failed'
      };
    }
  }

  /**
   * Get authentication token from secure storage
   */
  private getAuthToken(): string | null {
    return SecureStorage.getItem('auth_token');
  }

  /**
   * Parse error response from server
   */
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return { detail: `HTTP error! status: ${response.status}` };
    }
  }

  /**
   * Parse successful response from server
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType?.includes('text/')) {
      return await response.text() as unknown as T;
    }
    
    return await response.blob() as unknown as T;
  }

  /**
   * Create ApiError from generic Error
   */
  private createApiError(error: Error): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error.name === 'AbortError') {
      return new ApiError(
        'Request timeout',
        408,
        new Date().toISOString(),
        'TIMEOUT_ERROR'
      );
    }

    return new ApiError(
      error.message || 'Unknown error occurred',
      500,
      new Date().toISOString(),
      'UNKNOWN_ERROR'
    );
  }

  /**
   * Determine if error should not be retried
   */
  private shouldNotRetry(error: Error): boolean {
    if (error instanceof ApiError) {
      // Don't retry client errors (4xx) except 408, 429
      return error.status_code >= 400 && error.status_code < 500 && 
             error.status_code !== 408 && error.status_code !== 429;
    }
    
    return false;
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

/**
 * Custom ApiError class
 */
class ApiError extends Error implements ApiError {
  constructor(
    public detail: string,
    public status_code: number,
    public timestamp: string,
    public error_code?: string,
    public field_errors?: Record<string, string[]>
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}
