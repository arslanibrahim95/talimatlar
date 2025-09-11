import { create } from 'zustand';
import { authService } from '../services/authService';
import { User, LoginCredentials, RegisterData } from '../types';
import { ErrorHandler } from '../utils/errorHandler';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Başlangıçta true olmalı
  error: null,

  login: async (_credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      set({ isLoading: true, error: null });
      
      // Test modu - herhangi bir email/şifre ile giriş yapabilir
      const { loginAsTestUser } = await import('../utils/testUser');
      const response = loginAsTestUser();
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = ErrorHandler.handleApiError(error);
      ErrorHandler.logError(error, 'AuthStore.login');
      
      set({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false,
        user: null
      });
      return { success: false, error: errorMessage };
    }
  },

  register: async (_data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      set({ isLoading: true, error: null });
      
      // Test modu - backend olmadan test kullanıcısı oluştur
      const { createTestUser } = await import('../utils/testUser');
      const testUser = createTestUser();
      
      set({
        user: testUser,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = ErrorHandler.handleApiError(error);
      ErrorHandler.logError(error, 'AuthStore.register');
      
      set({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false,
        user: null
      });
      return { success: false, error: errorMessage };
    }
  },

  logout: async (): Promise<void> => {
    try {
      // Test kullanıcısı temizleme
      const { clearTestUser } = await import('../utils/testUser');
      clearTestUser();
      
      // Normal logout da dene
      await authService.logout();
    } catch (error) {
      ErrorHandler.logError(error, 'AuthStore.logout');
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        error: null
      });
    }
  },

  getCurrentUser: async (): Promise<void> => {
    try {
      set({ isLoading: true });
      
      // Test kullanıcısı kontrolü
      const { getTestUser, isTestUser } = await import('../utils/testUser');
      const testUser = getTestUser();
      
      if (isTestUser() && testUser) {
        set({
          user: testUser,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      ErrorHandler.logError(error, 'AuthStore.getCurrentUser');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  clearError: (): void => {
    set({ error: null });
  }
}));
