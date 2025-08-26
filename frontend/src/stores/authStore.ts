import React from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/authService'

export interface User {
  id: string
  phone: string
  email?: string
  role: 'admin' | 'manager' | 'employee'
  tenantId?: string
  firstName?: string
  lastName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  login: (phone: string, password: string) => Promise<void>
  loginWithOTP: (phone: string, otp: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  setLoading: (loading: boolean) => void
}

interface RegisterData {
  phone: string
  email?: string
  password: string
  firstName?: string
  lastName?: string
}

type AuthStore = AuthState & AuthActions

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (phone: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authService.login(phone, password)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      loginWithOTP: async (phone: string, otp: string) => {
        set({ isLoading: true })
        try {
          const response = await authService.verifyOTP(phone, otp)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true })
        try {
          const response = await authService.register(userData)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
        // Clear any stored data
        localStorage.removeItem('auth-storage')
      },

      refreshToken: async () => {
        const { token } = get()
        if (!token) return

        try {
          const response = await authService.refreshToken(token)
          set({
            token: response.token,
            user: response.user,
          })
        } catch (error) {
          // If refresh fails, logout the user
          get().logout()
          throw error
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...userData },
          })
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
