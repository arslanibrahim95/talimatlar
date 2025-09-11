// Enhanced API Service with Caching
import { API_CONFIG } from '../config/api';
import { HttpCache } from '../utils/cache';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ApiRequestConfig extends RequestInit {
  useCache?: boolean;
  cacheTTL?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

class ApiService {
  private baseConfig: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  private async makeRequest<T>(
    url: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      useCache = true,
      cacheTTL = API_CONFIG.CACHE.DEFAULT_TTL,
      retryAttempts = API_CONFIG.REQUEST_CONFIG.RETRY_ATTEMPTS,
      retryDelay = API_CONFIG.REQUEST_CONFIG.RETRY_DELAY,
      ...requestConfig
    } = config;

    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    const requestOptions = { ...this.baseConfig, ...requestConfig };

    // Check cache first
    if (useCache && API_CONFIG.CACHE.ENABLE_HTTP_CACHE) {
      const cachedResponse = await HttpCache.get(fullUrl, requestOptions);
      if (cachedResponse) {
        const data = await cachedResponse.json();
        return data;
      }
    }

    // Make request with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const response = await fetch(fullUrl, {
          ...requestOptions,
          signal: AbortSignal.timeout(API_CONFIG.REQUEST_CONFIG.TIMEOUT),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful responses
        if (useCache && API_CONFIG.CACHE.ENABLE_HTTP_CACHE && response.ok) {
          await HttpCache.set(fullUrl, response, cacheTTL, requestOptions);
        }

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Request failed after all retry attempts');
  }

  // GET request
  async get<T>(url: string, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'GET' });
  }

  // POST request
  async post<T>(url: string, data?: any, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(url: string, data?: any, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T>(url: string, data?: any, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(url: string, config: ApiRequestConfig = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...config, method: 'DELETE' });
  }

  // Upload file
  async uploadFile<T>(
    url: string,
    file: File,
    additionalData?: Record<string, any>,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.makeRequest<T>(url, {
      ...config,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        ...this.baseConfig.headers,
        ...config.headers,
      },
    });
  }

  // Download file
  async downloadFile(url: string, filename?: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  // Set authorization header
  setAuthToken(token: string): void {
    this.baseConfig.headers = {
      ...this.baseConfig.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  // Remove authorization header
  removeAuthToken(): void {
    const { Authorization, ...headers } = this.baseConfig.headers as any;
    this.baseConfig.headers = headers;
  }

  // Clear cache
  clearCache(): void {
    HttpCache.clear();
  }

  // Health check
  async healthCheck(service: keyof typeof API_CONFIG): Promise<boolean> {
    try {
      const baseUrl = API_CONFIG[service];
      const healthEndpoint = this.getHealthEndpoint(service);
      const response = await this.get(`${baseUrl}${healthEndpoint}`, {
        useCache: false,
        retryAttempts: 1,
      });
      return response.success;
    } catch (error) {
      console.error(`Health check failed for ${service}:`, error);
      return false;
    }
  }

  private getHealthEndpoint(service: keyof typeof API_CONFIG): string {
    switch (service) {
      case 'AUTH_SERVICE':
        return API_CONFIG.ENDPOINTS.AUTH.HEALTH;
      case 'ANALYTICS_SERVICE':
        return API_CONFIG.ENDPOINTS.ANALYTICS.HEALTH;
      case 'DOCUMENT_SERVICE':
        return API_CONFIG.ENDPOINTS.DOCUMENTS.HEALTH;
      case 'INSTRUCTION_SERVICE':
        return API_CONFIG.ENDPOINTS.INSTRUCTIONS.HEALTH;
      case 'AI_SERVICE':
        return API_CONFIG.ENDPOINTS.AI.HEALTH;
      case 'NOTIFICATION_SERVICE':
        return API_CONFIG.ENDPOINTS.NOTIFICATIONS.HEALTH;
      default:
        return '/health';
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Service-specific API methods
export class AuthApiService {
  async login(credentials: { email: string; password: string }) {
    return apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials, {
      useCache: false,
    });
  }

  async register(userData: { email: string; password: string; name: string }) {
    return apiService.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData, {
      useCache: false,
    });
  }

  async getCurrentUser() {
    return apiService.get(API_CONFIG.ENDPOINTS.AUTH.ME, {
      cacheTTL: API_CONFIG.CACHE.USER_DATA_TTL,
    });
  }

  async refreshToken() {
    return apiService.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {}, {
      useCache: false,
    });
  }

  async logout() {
    const result = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {}, {
      useCache: false,
    });
    apiService.removeAuthToken();
    return result;
  }
}

export class DocumentApiService {
  async getDocuments(params?: { page?: number; limit?: number; search?: string }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return apiService.get(`${API_CONFIG.ENDPOINTS.DOCUMENTS.LIST}${queryString}`, {
      cacheTTL: API_CONFIG.CACHE.DEFAULT_TTL,
    });
  }

  async getDocument(id: string) {
    return apiService.get(API_CONFIG.ENDPOINTS.DOCUMENTS.GET(id), {
      cacheTTL: API_CONFIG.CACHE.DEFAULT_TTL,
    });
  }

  async createDocument(documentData: any) {
    return apiService.post(API_CONFIG.ENDPOINTS.DOCUMENTS.CREATE, documentData, {
      useCache: false,
    });
  }

  async updateDocument(id: string, documentData: any) {
    return apiService.put(API_CONFIG.ENDPOINTS.DOCUMENTS.UPDATE(id), documentData, {
      useCache: false,
    });
  }

  async deleteDocument(id: string) {
    return apiService.delete(API_CONFIG.ENDPOINTS.DOCUMENTS.DELETE(id), {
      useCache: false,
    });
  }

  async searchDocuments(query: string) {
    return apiService.get(`${API_CONFIG.ENDPOINTS.DOCUMENTS.SEARCH}?q=${encodeURIComponent(query)}`, {
      cacheTTL: API_CONFIG.CACHE.DEFAULT_TTL,
    });
  }
}

export class InstructionApiService {
  async getInstructions(params?: { page?: number; limit?: number; search?: string }) {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return apiService.get(`${API_CONFIG.ENDPOINTS.INSTRUCTIONS.LIST}${queryString}`, {
      cacheTTL: API_CONFIG.CACHE.DEFAULT_TTL,
    });
  }

  async getInstruction(id: string) {
    return apiService.get(API_CONFIG.ENDPOINTS.INSTRUCTIONS.GET(id), {
      cacheTTL: API_CONFIG.CACHE.DEFAULT_TTL,
    });
  }

  async createInstruction(instructionData: any) {
    return apiService.post(API_CONFIG.ENDPOINTS.INSTRUCTIONS.CREATE, instructionData, {
      useCache: false,
    });
  }

  async updateInstruction(id: string, instructionData: any) {
    return apiService.put(API_CONFIG.ENDPOINTS.INSTRUCTIONS.UPDATE(id), instructionData, {
      useCache: false,
    });
  }

  async deleteInstruction(id: string) {
    return apiService.delete(API_CONFIG.ENDPOINTS.INSTRUCTIONS.DELETE(id), {
      useCache: false,
    });
  }
}

export class AnalyticsApiService {
  async getDashboard() {
    return apiService.get(API_CONFIG.ENDPOINTS.ANALYTICS.DASHBOARD, {
      cacheTTL: API_CONFIG.CACHE.DEFAULT_TTL,
    });
  }

  async getReports() {
    return apiService.get(API_CONFIG.ENDPOINTS.ANALYTICS.REPORTS, {
      cacheTTL: API_CONFIG.CACHE.STATIC_DATA_TTL,
    });
  }

  async getUserActivity() {
    return apiService.get(API_CONFIG.ENDPOINTS.ANALYTICS.USER_ACTIVITY, {
      cacheTTL: API_CONFIG.CACHE.DEFAULT_TTL,
    });
  }
}

// Export service instances
export const authApi = new AuthApiService();
export const documentApi = new DocumentApiService();
export const instructionApi = new InstructionApiService();
export const analyticsApi = new AnalyticsApiService();

export default apiService;
