/**
 * Application constants and configuration values
 * Centralized location for all magic numbers and strings
 */

// API Configuration
export const API_CONSTANTS = {
  TIMEOUTS: {
    DEFAULT: 30000,
    AUTH: 15000,
    UPLOAD: 60000,
    DOWNLOAD: 120000,
  },
  RETRY: {
    DEFAULT_ATTEMPTS: 3,
    AUTH_ATTEMPTS: 2,
    UPLOAD_ATTEMPTS: 1,
    RETRY_DELAY: 1000,
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    MIN_PAGE_SIZE: 5,
  },
} as const;

// UI Configuration
export const UI_CONSTANTS = {
  ANIMATION: {
    DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
    EASING: {
      EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
      EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080,
  },
} as const;

// File Upload Configuration
export const FILE_CONSTANTS = {
  MAX_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    VIDEO: 50 * 1024 * 1024, // 50MB
    AUDIO: 20 * 1024 * 1024, // 20MB
  },
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
    AUDIO: ['audio/mp3', 'audio/wav', 'audio/ogg'],
  },
  COMPRESSION: {
    IMAGE_QUALITY: 0.8,
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
  },
} as const;

// Validation Rules
export const VALIDATION_CONSTANTS = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
  },
  EMAIL: {
    MAX_LENGTH: 254,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    PATTERN: /^(\+90|0)?[0-9]{10}$/,
    MAX_LENGTH: 15,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/,
  },
  TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000,
  },
} as const;

// Cache Configuration
export const CACHE_CONSTANTS = {
  STALE_TIME: {
    SHORT: 1 * 60 * 1000, // 1 minute
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 30 * 60 * 1000, // 30 minutes
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
  },
  GC_TIME: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 10 * 60 * 1000, // 10 minutes
    LONG: 60 * 60 * 1000, // 1 hour
    VERY_LONG: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: {
    CONNECTION_LOST: 'İnternet bağlantınızı kontrol edin.',
    TIMEOUT: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
    SERVER_ERROR: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
    SERVICE_UNAVAILABLE: 'Servis şu anda kullanılamıyor.',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'E-posta veya şifre hatalı.',
    USER_NOT_FOUND: 'Kullanıcı bulunamadı.',
    USER_ALREADY_EXISTS: 'Bu e-posta adresi zaten kullanılıyor.',
    TOKEN_EXPIRED: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.',
    INSUFFICIENT_PERMISSIONS: 'Bu işlem için yetkiniz bulunmuyor.',
  },
  VALIDATION: {
    REQUIRED_FIELD: 'Bu alan zorunludur.',
    INVALID_EMAIL: 'Geçerli bir e-posta adresi girin.',
    INVALID_PHONE: 'Geçerli bir telefon numarası girin.',
    PASSWORD_TOO_SHORT: `Şifre en az ${VALIDATION_CONSTANTS.PASSWORD.MIN_LENGTH} karakter olmalıdır.`,
    PASSWORD_TOO_LONG: `Şifre en fazla ${VALIDATION_CONSTANTS.PASSWORD.MAX_LENGTH} karakter olabilir.`,
    NAME_TOO_SHORT: `İsim en az ${VALIDATION_CONSTANTS.NAME.MIN_LENGTH} karakter olmalıdır.`,
    NAME_TOO_LONG: `İsim en fazla ${VALIDATION_CONSTANTS.NAME.MAX_LENGTH} karakter olabilir.`,
  },
  FILE: {
    TOO_LARGE: 'Dosya boyutu çok büyük.',
    INVALID_TYPE: 'Desteklenmeyen dosya türü.',
    UPLOAD_FAILED: 'Dosya yükleme başarısız.',
    DOWNLOAD_FAILED: 'Dosya indirme başarısız.',
  },
  GENERAL: {
    UNKNOWN_ERROR: 'Beklenmeyen bir hata oluştu.',
    OPERATION_FAILED: 'İşlem başarısız oldu.',
    DATA_NOT_FOUND: 'Veri bulunamadı.',
    OPERATION_CANCELLED: 'İşlem iptal edildi.',
  },
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Giriş başarılı.',
    LOGOUT_SUCCESS: 'Çıkış başarılı.',
    REGISTER_SUCCESS: 'Kayıt başarılı.',
    PASSWORD_RESET_SENT: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
    PASSWORD_RESET_SUCCESS: 'Şifre başarıyla sıfırlandı.',
  },
  CRUD: {
    CREATE_SUCCESS: 'Kayıt başarıyla oluşturuldu.',
    UPDATE_SUCCESS: 'Kayıt başarıyla güncellendi.',
    DELETE_SUCCESS: 'Kayıt başarıyla silindi.',
    SAVE_SUCCESS: 'Değişiklikler başarıyla kaydedildi.',
  },
  FILE: {
    UPLOAD_SUCCESS: 'Dosya başarıyla yüklendi.',
    DOWNLOAD_SUCCESS: 'Dosya başarıyla indirildi.',
    DELETE_SUCCESS: 'Dosya başarıyla silindi.',
  },
  GENERAL: {
    OPERATION_SUCCESS: 'İşlem başarılı.',
    DATA_LOADED: 'Veriler başarıyla yüklendi.',
    SETTINGS_SAVED: 'Ayarlar başarıyla kaydedildi.',
  },
} as const;

// Status Types
export const STATUS_TYPES = {
  DOCUMENT: ['draft', 'published', 'archived'] as const,
  INSTRUCTION: ['draft', 'pending', 'approved', 'published', 'archived'] as const,
  ASSIGNMENT: ['assigned', 'in_progress', 'completed', 'overdue'] as const,
  PRIORITY: ['low', 'medium', 'high', 'urgent'] as const,
  NOTIFICATION: ['info', 'warning', 'error', 'success'] as const,
  USER_ROLE: ['admin', 'manager', 'user'] as const,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
  SETTINGS: 'app_settings',
  CACHE_PREFIX: 'cache_',
  TEST_USER: 'test_user',
  IS_TEST_USER: 'is_test_user',
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  DOCUMENTS: ['documents'] as const,
  DOCUMENT: (id: string) => ['documents', id] as const,
  DOCUMENT_CATEGORIES: ['documents', 'categories'] as const,
  INSTRUCTIONS: ['instructions'] as const,
  INSTRUCTION: (id: string) => ['instructions', id] as const,
  INSTRUCTION_CATEGORIES: ['instructions', 'categories'] as const,
  USERS: ['users'] as const,
  USER: (id: string) => ['users', id] as const,
  PERSONNEL: ['personnel'] as const,
  PERSONNEL_STATS: ['personnel', 'stats'] as const,
  ANALYTICS: ['analytics'] as const,
  NOTIFICATIONS: ['notifications'] as const,
  HEALTH: ['health'] as const,
} as const;

// Environment Configuration
export const ENV_CONFIG = {
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8004',
  ANALYTICS_URL: import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:8003',
  DOCUMENT_URL: import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:8004',
  INSTRUCTION_URL: import.meta.env.VITE_INSTRUCTION_URL || 'http://localhost:8005',
  AI_URL: import.meta.env.VITE_AI_URL || 'http://localhost:8006',
  NOTIFICATION_URL: import.meta.env.VITE_NOTIFICATION_URL || 'http://localhost:8004',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_PWA: import.meta.env.VITE_ENABLE_PWA === 'true',
  ENABLE_OFFLINE_MODE: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
  ENABLE_DARK_MODE: import.meta.env.VITE_ENABLE_DARK_MODE !== 'false',
  ENABLE_MULTI_LANGUAGE: import.meta.env.VITE_ENABLE_MULTI_LANGUAGE === 'true',
  ENABLE_AI_FEATURES: import.meta.env.VITE_ENABLE_AI_FEATURES === 'true',
} as const;

export default {
  API_CONSTANTS,
  UI_CONSTANTS,
  FILE_CONSTANTS,
  VALIDATION_CONSTANTS,
  CACHE_CONSTANTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STATUS_TYPES,
  STORAGE_KEYS,
  QUERY_KEYS,
  ENV_CONFIG,
  FEATURE_FLAGS,
};
