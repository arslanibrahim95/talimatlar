import { User, LoginCredentials, RegisterData, AuthResponse, ServiceResponse } from '../types';
import { BaseService } from './BaseService';
import { SecureStorage } from '../utils/security';

class AuthService extends BaseService {
  constructor() {
    super('AUTH_SERVICE', {
      timeout: 15000, // Shorter timeout for auth requests
      retries: 2,     // Fewer retries for auth
    });
  }

  async login(credentials: LoginCredentials): Promise<ServiceResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/login', credentials);

    if (response.success && response.data?.access_token) {
      // Store token securely
      SecureStorage.setItem('auth_token', response.data.access_token);
      
      // Store user data securely
      if (response.data.user) {
        SecureStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
    }

    return response;
  }

  async register(data: RegisterData): Promise<ServiceResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/register', data);

    if (response.success && response.data?.access_token) {
      // Store token securely
      SecureStorage.setItem('auth_token', response.data.access_token);
      
      // Store user data securely
      if (response.data.user) {
        SecureStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
    }

    return response;
  }

  async logout(): Promise<ServiceResponse<void>> {
    const response = await this.post<void>('/auth/logout');
    
    // Always clear secure storage regardless of response
    SecureStorage.clear();
    
    return response;
  }

  async getCurrentUser(): Promise<ServiceResponse<User>> {
    const response = await this.get<User>('/auth/me');
    
    if (!response.success) {
      SecureStorage.clear();
    }
    
    return response;
  }

  async refreshToken(): Promise<ServiceResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/refresh');

    if (response.success && response.data?.access_token) {
      SecureStorage.setItem('auth_token', response.data.access_token);
    } else {
      SecureStorage.clear();
    }

    return response;
  }

  async forgotPassword(email: string): Promise<ServiceResponse<void>> {
    return this.post<void>('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<ServiceResponse<void>> {
    return this.post<void>('/auth/reset-password', { 
      token, 
      new_password: newPassword 
    });
  }

  isAuthenticated(): boolean {
    return !!SecureStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return SecureStorage.getItem('auth_token');
  }
}

export const authService = new AuthService();
