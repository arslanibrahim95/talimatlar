# 🧪 Claude Talimat Testing Guide

Bu dokümantasyon, Claude Talimat İş Güvenliği Yönetim Sistemi için kapsamlı test stratejisini ve test süreçlerini açıklar.

## 📋 İçindekiler

- [Test Türleri](#test-türleri)
- [Test Altyapısı](#test-altyapısı)
- [Test Çalıştırma](#test-çalıştırma)
- [Test Konfigürasyonu](#test-konfigürasyonu)
- [Test Raporları](#test-raporları)
- [CI/CD Entegrasyonu](#cicd-entegrasyonu)
- [Troubleshooting](#troubleshooting)

## 🎯 Test Türleri

### 1. Unit Tests (Birim Testleri)
- **Amaç**: Bireysel fonksiyon ve bileşenlerin doğruluğunu test eder
- **Kapsam**: Her mikroservis için ayrı unit testler
- **Araçlar**: 
  - Frontend: Vitest, React Testing Library
  - Backend: Deno Test, Pytest, Go Test
- **Dosya Konumu**: `services/*/tests/`, `frontend/src/**/*.test.ts`

### 2. Integration Tests (Entegrasyon Testleri)
- **Amaç**: Servisler arası etkileşimleri ve API endpoint'lerini test eder
- **Kapsam**: Tüm mikroservisler arası entegrasyon
- **Araçlar**: Vitest, Axios
- **Dosya Konumu**: `tests/integration/`

### 3. E2E Tests (End-to-End Testleri)
- **Amaç**: Kullanıcı senaryolarını gerçek tarayıcıda test eder
- **Kapsam**: Tüm kullanıcı akışları
- **Araçlar**: Playwright
- **Dosya Konumu**: `frontend/e2e-tests/`

### 4. Performance Tests (Performans Testleri)
- **Amaç**: Sistem performansını ve ölçeklenebilirliğini test eder
- **Kapsam**: Load, stress, spike, soak testleri
- **Araçlar**: K6
- **Dosya Konumu**: `tests/performance/`

### 5. Security Tests (Güvenlik Testleri)
- **Amaç**: Güvenlik açıklarını ve zafiyetleri test eder
- **Kapsam**: Authentication, authorization, input validation
- **Araçlar**: Vitest, Custom security tests
- **Dosya Konumu**: `tests/security/`

## 🏗️ Test Altyapısı

### Test Servisleri
```yaml
# docker-compose.test.yml
services:
  postgres-test:     # Test veritabanı
  redis-test:        # Test cache
  auth-service-test: # Test auth servisi
  analytics-service-test: # Test analytics servisi
  instruction-service-test: # Test instruction servisi
  notification-service-test: # Test notification servisi
```

### Test Veritabanı
- **Database**: PostgreSQL (Port: 5434)
- **Cache**: Redis (Port: 6381)
- **Isolation**: Her test için ayrı veritabanı
- **Cleanup**: Test sonrası otomatik temizlik

### Test Konfigürasyonu
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/integration/test-setup.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

## 🚀 Test Çalıştırma

### Hızlı Başlangıç
```bash
# Tüm testleri çalıştır
npm run test:full

# Belirli test türünü çalıştır
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
npm run test:security
```

### Detaylı Test Komutları

#### Unit Tests
```bash
# Frontend unit tests
cd frontend && npm run test

# Backend unit tests
npm run test:backend

# Specific service tests
npm run test:auth
npm run test:analytics
npm run test:instruction
npm run test:notification
```

#### Integration Tests
```bash
# Integration tests
npm run test:integration

# With test services
npm run test:integration:full
```

#### E2E Tests
```bash
# E2E tests
npm run test:e2e

# With UI
cd frontend && npm run test:e2e:ui

# Headed mode
cd frontend && npm run test:e2e:headed
```

#### Performance Tests
```bash
# Load tests
k6 run tests/performance/load-test.js

# Stress tests
k6 run tests/performance/stress-test.js

# All performance tests
npm run test:performance
```

#### Security Tests
```bash
# Security tests
npm run test:security

# With test services
npm run test:security:full
```

### Test Script Kullanımı
```bash
# Test script ile çalıştırma
./scripts/run-tests.sh all
./scripts/run-tests.sh unit
./scripts/run-tests.sh integration
./scripts/run-tests.sh e2e
./scripts/run-tests.sh performance
./scripts/run-tests.sh security
```

## ⚙️ Test Konfigürasyonu

### Environment Variables
```bash
# Test environment
NODE_ENV=test
DATABASE_URL=postgresql://claude_user:claude_password@localhost:5434/claude_talimat_test
REDIS_URL=redis://localhost:6381
JWT_SECRET=test-jwt-secret-key
```

### Test Data
```typescript
// Test data examples
const testUsers = [
  { email: 'test@example.com', password: 'password123' },
  { email: 'admin@example.com', password: 'password123' }
];

const testInstructions = [
  {
    title: 'Test Safety Instruction',
    content: 'Test content',
    category: 'safety',
    priority: 'high'
  }
];
```

### Mock Services
```typescript
// Mock external services
const mockServices = {
  email: jest.fn(),
  sms: jest.fn(),
  fileStorage: jest.fn()
};
```

## 📊 Test Raporları

### Coverage Raporları
- **Format**: HTML, JSON, Text
- **Konum**: `test-results/coverage/`
- **Threshold**: %80 minimum coverage

### Performance Raporları
- **Format**: JSON, HTML
- **Konum**: `test-results/performance/`
- **Metrikler**: Response time, throughput, error rate

### Security Raporları
- **Format**: JSON, HTML
- **Konum**: `test-results/security/`
- **Metrikler**: Vulnerability count, security score

### Test Sonuçları
```bash
# Test raporu oluştur
npm run test:report

# Coverage raporu
npm run test:coverage

# Performance raporu
npm run test:performance:report
```

## 🔄 CI/CD Entegrasyonu

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:full
```

### Docker Test
```bash
# Test container oluştur
docker-compose -f docker-compose.test.yml up -d

# Testleri çalıştır
docker-compose -f docker-compose.test.yml exec test npm run test:full

# Container'ları temizle
docker-compose -f docker-compose.test.yml down -v
```

## 🐛 Troubleshooting

### Yaygın Sorunlar

#### Test Servisleri Başlamıyor
```bash
# Port çakışması kontrolü
netstat -tulpn | grep :8004

# Docker servisleri kontrolü
docker-compose -f docker-compose.test.yml ps

# Log kontrolü
docker-compose -f docker-compose.test.yml logs
```

#### Test Veritabanı Bağlantı Hatası
```bash
# Veritabanı durumu
docker-compose -f docker-compose.test.yml exec postgres-test psql -U claude_user -d claude_talimat_test -c "SELECT 1;"

# Bağlantı testi
nc -z localhost 5434
```

#### E2E Test Hatası
```bash
# Playwright kurulumu
cd frontend && npx playwright install

# Browser kontrolü
cd frontend && npx playwright test --list
```

#### Performance Test Hatası
```bash
# K6 kurulumu
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz --strip-components 1

# K6 test
k6 version
```

### Debug Modu
```bash
# Debug modunda test çalıştır
DEBUG=* npm run test:integration

# Verbose output
npm run test:integration -- --verbose

# Single test çalıştır
npm run test:integration -- --grep "Auth Service"
```

### Log Dosyaları
```bash
# Test logları
tail -f test-results/test.log

# Service logları
docker-compose -f docker-compose.test.yml logs -f

# Performance logları
tail -f test-results/performance.log
```

## 📈 Test Metrikleri

### Coverage Metrikleri
- **Frontend**: %85+ coverage
- **Backend**: %90+ coverage
- **Integration**: %80+ coverage

### Performance Metrikleri
- **Response Time**: < 500ms (95th percentile)
- **Throughput**: > 100 req/s
- **Error Rate**: < 1%
- **Memory Usage**: < 512MB per service

### Security Metrikleri
- **Vulnerability Count**: 0 critical, 0 high
- **Security Score**: > 90/100
- **Authentication**: 100% secure
- **Authorization**: 100% secure

## 🔧 Test Geliştirme

### Yeni Test Ekleme
1. Test dosyası oluştur: `tests/**/*.test.ts`
2. Test senaryosunu yaz
3. Test verilerini hazırla
4. Test'i çalıştır ve doğrula
5. Coverage'ı kontrol et

### Test Best Practices
- **AAA Pattern**: Arrange, Act, Assert
- **Single Responsibility**: Her test tek bir şeyi test etmeli
- **Independent**: Testler birbirinden bağımsız olmalı
- **Repeatable**: Testler her çalıştırmada aynı sonucu vermeli
- **Fast**: Testler hızlı çalışmalı
- **Clear**: Test isimleri açıklayıcı olmalı

### Test Naming Convention
```typescript
// Good
describe('Auth Service Integration Tests', () => {
  it('should login with valid credentials', () => {
    // test implementation
  });
});

// Bad
describe('Auth', () => {
  it('test1', () => {
    // test implementation
  });
});
```

## 📚 Kaynaklar

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [K6 Documentation](https://k6.io/docs/)
- [Testing Library Documentation](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)

---

**Son Güncelleme**: 2024-01-XX  
**Versiyon**: v1.0.0  
**Durum**: ✅ TAMAMLANDI