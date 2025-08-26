import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage')
    if (token) {
      try {
        const authData = JSON.parse(token)
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`
        }
      } catch (error) {
        console.error('Error parsing auth token:', error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('auth-storage')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export interface LoginRequest {
  phone: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    phone: string
    email?: string
    role: string
    tenantId?: string
    firstName?: string
    lastName?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  token: string
  refreshToken: string
}

export interface RegisterRequest {
  phone: string
  email?: string
  password: string
  firstName?: string
  lastName?: string
}

export interface OTPRequest {
  phone: string
}

export interface OTPVerifyRequest {
  phone: string
  otp: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export const authService = {
  // Login with phone and password
  async login(phone: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      phone,
      password,
    })
    return response.data
  },

  // Register new user
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/register', userData)
    return response.data
  },

  // Request OTP
  async requestOTP(phone: string): Promise<void> {
    await api.post('/auth/otp/request', { phone })
  },

  // Verify OTP and login
  async verifyOTP(phone: string, otp: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/otp/verify', {
      phone,
      otp,
    })
    return response.data
  },

  // Refresh token
  async refreshToken(token: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/refresh', {
      refreshToken: token,
    })
    return response.data
  },

  // Logout
  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  // Get current user
  async getCurrentUser(): Promise<LoginResponse['user']> {
    const response = await api.get<LoginResponse['user']>('/auth/me')
    return response.data
  },

  // Update user profile
  async updateProfile(userData: Partial<LoginResponse['user']>): Promise<LoginResponse['user']> {
    const response = await api.put<LoginResponse['user']>('/auth/me', userData)
    return response.data
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    })
  },

  // Get user sessions
  async getUserSessions(): Promise<any[]> {
    const response = await api.get('/auth/sessions')
    return response.data
  },

  // Revoke session
  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/auth/sessions/${sessionId}`)
  },
}

export default authService
