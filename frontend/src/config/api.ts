// API Configuration - Centralized endpoint management
export const API_CONFIG = {
  // Base URLs for different services - using API Gateway with versioning
  AUTH_SERVICE: import.meta.env.VITE_API_BASE_URL || '/api/v1/auth',
  ANALYTICS_SERVICE: import.meta.env.VITE_ANALYTICS_URL || '/api/v1/analytics',
  DOCUMENT_SERVICE: import.meta.env.VITE_DOCUMENT_URL || '/api/v1/documents',
  INSTRUCTION_SERVICE: import.meta.env.VITE_INSTRUCTION_URL || '/api/v1/instructions',
  AI_SERVICE: import.meta.env.VITE_AI_URL || '/api/v1/ai',
  NOTIFICATION_SERVICE: import.meta.env.VITE_NOTIFICATION_URL || '/api/v1/notifications',
  
  // Cache Configuration
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
    USER_DATA_TTL: 15 * 60 * 1000, // 15 minutes
    STATIC_DATA_TTL: 60 * 60 * 1000, // 1 hour
    SESSION_TTL: 30 * 60 * 1000, // 30 minutes
    MAX_CACHE_SIZE: 100,
    ENABLE_HTTP_CACHE: true,
    ENABLE_MEMORY_CACHE: true,
  },
  
  // API Endpoints
  ENDPOINTS: {
    // Auth Service Endpoints
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
      REFRESH: '/auth/refresh',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      USERS: '/users',
      HEALTH: '/health',
    },
    
    // Analytics Service Endpoints
    ANALYTICS: {
      DASHBOARD: '/analytics/dashboard',
      REPORTS: '/analytics/reports',
      USER_ACTIVITY: '/analytics/user-activity',
      DOCUMENT_STATS: '/analytics/document-stats',
      COMPLIANCE: '/analytics/compliance',
      RISK_ASSESSMENT: '/analytics/risk-assessment',
      TRENDS: '/analytics/trends',
      REAL_TIME_METRICS: '/metrics/real-time',
      METRICS_SUMMARY: '/metrics/summary',
      HEALTH: '/health',
    },
    
    // Document Service Endpoints
    DOCUMENTS: {
      LIST: '/documents',
      CREATE: '/documents',
      GET: (id: string) => `/documents/${id}`,
      UPDATE: (id: string) => `/documents/${id}`,
      DELETE: (id: string) => `/documents/${id}`,
      SEARCH: '/search',
      CATEGORIES: '/categories',
      DOWNLOAD: (id: string) => `/documents/${id}/download`,
      HEALTH: '/health',
    },
    
    // Instruction Service Endpoints
    INSTRUCTIONS: {
      LIST: '/instructions',
      CREATE: '/instructions',
      GET: (id: string) => `/instructions/${id}`,
      UPDATE: (id: string) => `/instructions/${id}`,
      DELETE: (id: string) => `/instructions/${id}`,
      UPLOAD: '/instructions/upload',
      SEARCH: '/search',
      STATS: '/instructions/stats',
      DISTRIBUTE: (id: string) => `/instructions/${id}/distribute`,
      CATEGORIES: '/categories',
      DOWNLOAD: (id: string) => `/instructions/${id}/download`,
      HEALTH: '/health',
    },
    
    // AI Service Endpoints
    AI: {
      CHAT_SESSIONS: '/chat/sessions',
      CHAT_MESSAGES: (sessionId: string) => `/chat/sessions/${sessionId}/messages`,
      COMMANDS: '/commands',
      EXECUTE_COMMAND: '/commands/execute',
      ADVANCED_COMMAND: '/commands/advanced',
      COMMAND_STATUS: (id: string) => `/commands/${id}`,
      USAGE_ANALYTICS: '/analytics/usage',
      COMMAND_ANALYTICS: '/analytics/commands',
      CONFIG: '/config',
      API_KEYS: '/config/api-keys',
      HEALTH: '/health',
    },
    
    // Notification Service Endpoints
    NOTIFICATIONS: {
      LIST: '/notifications',
      MARK_READ: (id: string) => `/notifications/${id}/read`,
      MARK_ALL_READ: '/notifications/read-all',
      DELETE: (id: string) => `/notifications/${id}`,
      SEND: '/notifications/send',
      HEALTH: '/health',
    },
  },
  
  // HTTP Status Codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
  
  // Request Configuration
  REQUEST_CONFIG: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    MAX_RETRY_DELAY: 10000, // 10 seconds
    RETRY_BACKOFF_MULTIPLIER: 2,
    ENABLE_RETRY: true,
    ENABLE_CIRCUIT_BREAKER: true,
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: 5,
    CIRCUIT_BREAKER_RESET_TIMEOUT: 60000, // 1 minute
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error occurred. Please check your connection.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    FORBIDDEN: 'Access forbidden.',
    NOT_FOUND: 'The requested resource was not found.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    VALIDATION_ERROR: 'Validation error. Please check your input.',
  },
};

// Helper function to build full API URLs
export const buildApiUrl = (service: keyof typeof API_CONFIG, endpoint: string): string => {
  const baseUrl = API_CONFIG[service];
  
  // If using proxy routes (starting with /api/), don't append endpoint
  if (baseUrl.startsWith('/api/')) {
    return `${baseUrl}${endpoint}`;
  }
  
  // For direct service URLs, append endpoint
  return `${baseUrl}${endpoint}`;
};

// Helper function to get service base URL
export const getServiceUrl = (service: keyof typeof API_CONFIG): string => {
  return API_CONFIG[service];
};

// Helper function to check if service is available
export const isServiceAvailable = async (service: keyof typeof API_CONFIG): Promise<boolean> => {
  try {
    const baseUrl = API_CONFIG[service];
    const healthEndpoint = getHealthEndpoint(service);
    const response = await fetch(`${baseUrl}${healthEndpoint}`);
    return response.ok;
  } catch (error) {
    console.error(`Service ${service} health check failed:`, error);
    return false;
  }
};

// Helper function to get health endpoint for a service
const getHealthEndpoint = (service: keyof typeof API_CONFIG): string => {
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
};

export default API_CONFIG;
