# 🚨 Error Handling System Documentation

## 📋 Genel Bakış

Bu dokümantasyon, Claude Talimat İş Güvenliği Yönetim Sistemi'nde kullanılan kapsamlı error handling sistemini açıklar. Sistem, merkezi hata yönetimi, retry mekanizmaları, circuit breaker pattern ve error tracking özelliklerini içerir.

## 🏗️ Sistem Mimarisi

### **1. Frontend Error Handling**
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Error Handling              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────┐  │
│  │ Error Boundary  │ │ Error Handler   │ │ Sentry   │  │
│  │ Components      │ │ Centralized     │ │ Tracking │  │
│  └─────────────────┘ └─────────────────┘ └──────────┘  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────┐  │
│  │ Retry Mechanism │ │ Circuit Breaker │ │ API      │  │
│  │ Exponential     │ │ Pattern         │ │ Client   │  │
│  └─────────────────┘ └─────────────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
```

### **2. Backend Error Handling**
```
┌─────────────────────────────────────────────────────────┐
│                    Backend Error Handling               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────┐  │
│  │ Error Handler   │ │ Global Middleware│ │ Logging  │  │
│  │ Centralized     │ │ Exception       │ │ System   │  │
│  └─────────────────┘ └─────────────────┘ └──────────┘  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────┐  │
│  │ Error Types     │ │ Error Context   │ │ Error    │  │
│  │ Classification  │ │ Tracking        │ │ Stats    │  │
│  └─────────────────┘ └─────────────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Temel Bileşenler

### **1. Error Types (Hata Türleri)**

```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  API_ERROR = 'API_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}
```

### **2. Error Severity (Hata Önem Derecesi)**

```typescript
enum ErrorSeverity {
  LOW = 'LOW',           // Düşük öncelik
  MEDIUM = 'MEDIUM',     // Orta öncelik
  HIGH = 'HIGH',         // Yüksek öncelik
  CRITICAL = 'CRITICAL', // Kritik öncelik
}
```

### **3. Error Context (Hata Bağlamı)**

```typescript
interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: Date;
  url?: string;
  method?: string;
  userAgent?: string;
  stack?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}
```

## 🚀 Kullanım Örnekleri

### **1. Frontend Error Handling**

#### **Error Boundary Kullanımı**
```tsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary level="page">
      <YourComponent />
    </ErrorBoundary>
  );
}
```

#### **API Client Kullanımı**
```typescript
import { apiClient } from './utils/apiClient';

// Otomatik retry ve circuit breaker ile
const response = await apiClient.get('/api/users');

// Manuel error handling
try {
  const response = await apiClient.post('/api/users', userData);
} catch (error) {
  // Error otomatik olarak handle edilir
  console.error('API Error:', error);
}
```

#### **Error Handler Kullanımı**
```typescript
import { errorHandler, createNetworkError } from './utils/errorHandling';

// Manuel error oluşturma
const error = createNetworkError('Connection failed', {
  userId: 'user123',
  component: 'UserProfile',
});

// Error handling
errorHandler.handleError(error);
```

### **2. Backend Error Handling**

#### **Error Handler Kullanımı**
```typescript
import { errorHandler, createServerError, withErrorHandling } from './utils/errorHandling';

// Route handler'da error handling
router.get('/users', withErrorHandling(async (ctx: Context) => {
  const users = await getUserList();
  ctx.response.body = { success: true, data: users };
}));

// Manuel error handling
try {
  const result = await someOperation();
} catch (error) {
  const appError = errorHandler.handleError(error as Error, {
    component: 'UserController',
    action: 'getUsers',
  });
  throw appError;
}
```

### **3. Retry Mechanism**

#### **Otomatik Retry**
```typescript
import { retryApiCall, retryWithExponentialBackoff } from './utils/retryMechanism';

// API call ile retry
const result = await retryApiCall(
  () => fetch('/api/data'),
  { maxRetries: 3, baseDelay: 1000 }
);

// Exponential backoff ile retry
const result = await retryWithExponentialBackoff(
  () => someAsyncOperation(),
  3, // maxRetries
  1000 // baseDelay
);
```

#### **Retry Configuration**
```typescript
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,        // 1 saniye
  maxDelay: 10000,        // 10 saniye
  backoffMultiplier: 2,   // Exponential backoff
  jitter: true,           // Random jitter
};
```

### **4. Circuit Breaker**

#### **Circuit Breaker Kullanımı**
```typescript
import { withCircuitBreaker, createServiceBreaker } from './utils/circuitBreaker';

// Service için circuit breaker
const breaker = createServiceBreaker('user-service', {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 dakika
});

// Function wrapper
const safeApiCall = withCircuitBreaker(
  () => fetch('/api/users'),
  'user-service'
);
```

### **5. Sentry Integration**

#### **Sentry Kurulumu**
```typescript
import { initSentry, captureException, setUser } from './utils/sentryIntegration';

// Sentry'yi başlat
initSentry({
  dsn: 'YOUR_SENTRY_DSN',
  environment: 'production',
  release: '1.0.0',
});

// User context set et
setUser({
  id: 'user123',
  email: 'user@example.com',
});

// Exception capture
try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    component: 'PaymentProcessor',
    action: 'processPayment',
  });
}
```

## 📊 Error Monitoring

### **1. Error Monitoring Dashboard**

Error monitoring dashboard'u `Ctrl+Shift+E` tuş kombinasyonu ile açabilirsiniz.

**Özellikler:**
- Real-time error statistics
- Error type ve severity breakdown
- Circuit breaker status
- Recent errors listesi
- Auto-refresh functionality

### **2. Error Statistics**

```typescript
import { errorHandler } from './utils/errorHandling';

const stats = errorHandler.getErrorStats();
console.log('Total errors:', stats.total);
console.log('Errors by type:', stats.byType);
console.log('Errors by severity:', stats.bySeverity);
console.log('Recent errors:', stats.recent);
```

### **3. Circuit Breaker Statistics**

```typescript
import { circuitBreakerManager } from './utils/circuitBreaker';

const stats = circuitBreakerManager.getAllStats();
console.log('Circuit breaker stats:', stats);
```

## 🔧 Konfigürasyon

### **1. API Configuration**

```typescript
// frontend/src/config/api.ts
export const API_CONFIG = {
  REQUEST_CONFIG: {
    TIMEOUT: 30000,                    // 30 saniye
    RETRY_ATTEMPTS: 3,                 // 3 deneme
    RETRY_DELAY: 1000,                 // 1 saniye
    MAX_RETRY_DELAY: 10000,            // 10 saniye
    RETRY_BACKOFF_MULTIPLIER: 2,       // Exponential backoff
    ENABLE_RETRY: true,                // Retry aktif
    ENABLE_CIRCUIT_BREAKER: true,      // Circuit breaker aktif
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: 5,  // 5 hata threshold
    CIRCUIT_BREAKER_RESET_TIMEOUT: 60000,  // 1 dakika reset
  },
};
```

### **2. Error Handler Configuration**

```typescript
// Error handler singleton instance
const errorHandler = ErrorHandler.getInstance();

// Error log size
errorHandler.maxLogSize = 1000;

// Clear error log
errorHandler.clearErrorLog();
```

## 🚨 Error Handling Best Practices

### **1. Frontend Best Practices**

1. **Error Boundaries Kullanın**
   ```tsx
   <ErrorBoundary level="page">
     <YourComponent />
   </ErrorBoundary>
   ```

2. **API Calls için Error Handling**
   ```typescript
   try {
     const response = await apiClient.get('/api/data');
     // Success handling
   } catch (error) {
     // Error otomatik olarak handle edilir
   }
   ```

3. **User-Friendly Error Messages**
   ```typescript
   const userFriendlyMessage = getErrorMessage(error.type);
   ```

### **2. Backend Best Practices**

1. **Global Error Handler Kullanın**
   ```typescript
   app.use(async (ctx, next) => {
     try {
       await next();
     } catch (error) {
       const appError = errorHandler.handleError(error);
       // Error response
     }
   });
   ```

2. **withErrorHandling Wrapper**
   ```typescript
   router.get('/endpoint', withErrorHandling(async (ctx) => {
     // Route logic
   }));
   ```

3. **Specific Error Types**
   ```typescript
   if (!user) {
     throw createAuthError('User not found');
   }
   ```

### **3. Monitoring Best Practices**

1. **Error Tracking**
   - Sentry integration aktif
   - Error context bilgileri ekleyin
   - User information set edin

2. **Circuit Breaker Monitoring**
   - Service health monitoring
   - Failure rate tracking
   - Recovery time monitoring

3. **Performance Monitoring**
   - Error frequency tracking
   - Response time monitoring
   - Resource usage tracking

## 🔍 Troubleshooting

### **1. Common Issues**

**Problem**: Error boundary not catching errors
**Solution**: Error boundary'yi component tree'de doğru yere yerleştirin

**Problem**: Circuit breaker not opening
**Solution**: Failure threshold ve monitoring period'u kontrol edin

**Problem**: Retry mechanism not working
**Solution**: Error type'ın retryable olduğundan emin olun

### **2. Debug Mode**

```typescript
// Error handler debug mode
errorHandler.enableDebugMode = true;

// API client debug mode
apiClient.config.enableLogging = true;
```

### **3. Error Log Analysis**

```typescript
const stats = errorHandler.getErrorStats();
const recentErrors = stats.recent;

// Error pattern analysis
const networkErrors = recentErrors.filter(e => e.type === 'NETWORK_ERROR');
const authErrors = recentErrors.filter(e => e.type === 'AUTHENTICATION_ERROR');
```

## 📈 Performance Considerations

### **1. Error Log Size**
- Error log size'ı sınırlayın (default: 1000)
- Regular cleanup yapın

### **2. Circuit Breaker Tuning**
- Failure threshold'u service'e göre ayarlayın
- Reset timeout'u optimize edin

### **3. Retry Configuration**
- Max retry sayısını sınırlayın
- Delay configuration'ı optimize edin

## 🔐 Security Considerations

### **1. Error Information Disclosure**
- Production'da sensitive bilgileri loglamayın
- Error messages'ı sanitize edin

### **2. Error Context**
- User bilgilerini güvenli şekilde handle edin
- PII (Personally Identifiable Information) koruması

### **3. Error Monitoring**
- Error tracking'de sensitive data'yı exclude edin
- Access control uygulayın

## 📚 API Reference

### **ErrorHandler Class**
```typescript
class ErrorHandler {
  createError(message: string, type: ErrorType, severity: ErrorSeverity, context?: Partial<ErrorContext>): AppError
  handleError(error: AppError | Error, context?: Partial<ErrorContext>): AppError
  getErrorStats(): ErrorStats
  clearErrorLog(): void
}
```

### **RetryMechanism Class**
```typescript
class RetryMechanism {
  static execute<T>(fn: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T>
  static withRetry<T, R>(fn: (...args: T) => Promise<R>, config?: Partial<RetryConfig>): (...args: T) => Promise<R>
}
```

### **CircuitBreaker Class**
```typescript
class CircuitBreaker {
  execute<T>(fn: () => Promise<T>): Promise<T>
  getStats(): CircuitBreakerStats
  reset(): void
  open(): void
  close(): void
}
```

---

**Son Güncelleme**: 2024-01-XX  
**Versiyon**: 1.0.0  
**Durum**: ✅ TAMAMLANDI
