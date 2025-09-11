# 🧪 Functional Test Suite

Bu dizin, Claude Talimat İş Güvenliği Yönetim Sistemi için kapsamlı functional testleri içerir.

## 📁 Test Dosyaları

### 1. `functional-test-suite.ts`
- **Amaç**: Ana functional test suite'i
- **Kapsam**: Kullanıcı senaryoları, UI testleri, end-to-end workflows
- **Teknolojiler**: Playwright, Vitest

### 2. `api-functional-tests.ts`
- **Amaç**: API endpoint'lerinin functional testleri
- **Kapsam**: Tüm API servisleri, authentication, CRUD operasyonları
- **Teknolojiler**: Axios, Vitest

### 3. `integration-functional-tests.ts`
- **Amaç**: Servisler arası entegrasyon testleri
- **Kapsam**: Database, cache, servis iletişimi, data flow
- **Teknolojiler**: PostgreSQL, Redis, Axios

### 4. `performance-functional-tests.ts`
- **Amaç**: Performans ve yük testleri
- **Kapsam**: Response time, throughput, memory usage, load testing
- **Teknolojiler**: Axios, Performance API

### 5. `security-functional-tests.ts`
- **Amaç**: Güvenlik testleri
- **Kapsam**: SQL injection, XSS, CSRF, authentication, authorization
- **Teknolojiler**: Axios, Security testing patterns

### 6. `run-functional-tests.ts`
- **Amaç**: Test runner ve rapor oluşturucu
- **Kapsam**: Tüm testleri çalıştırma, rapor oluşturma
- **Teknolojiler**: Node.js, Vitest

## 🚀 Kullanım

### Tüm Testleri Çalıştırma
```bash
# Tüm functional testleri çalıştır
npm run test:all

# Sadece belirli test suite'ini çalıştır
npm run test:api
npm run test:integration
npm run test:performance
npm run test:security
```

### Test Modları
```bash
# Watch mode (değişiklikleri izle)
npm run test:watch

# UI mode (browser'da test sonuçları)
npm run test:ui

# Coverage raporu ile
npm run test:coverage
```

### Manuel Test Çalıştırma
```bash
# Vitest ile
npx vitest run

# Belirli dosya ile
npx vitest run functional-test-suite.ts
```

## 📊 Test Raporları

Testler çalıştırıldıktan sonra aşağıdaki raporlar oluşturulur:

- `test-results/functional-test-report.html` - HTML raporu
- `test-results/functional-test-report.json` - JSON raporu
- `test-results/functional-test-report.md` - Markdown raporu

## 🔧 Konfigürasyon

### Test Ortamı
- **Node.js**: v18+
- **Test Framework**: Vitest
- **Browser Automation**: Playwright
- **HTTP Client**: Axios
- **Database**: PostgreSQL, Redis

### Gerekli Servisler
Testlerin çalışması için aşağıdaki servislerin çalışır durumda olması gerekir:

- Frontend (Port 3000)
- Auth Service (Port 8004)
- Analytics Service (Port 8003)
- Instruction Service (Port 8005)
- AI Service (Port 8006)
- API Gateway (Port 8080)
- PostgreSQL (Port 5433)
- Redis (Port 6380)

## 📋 Test Senaryoları

### 1. Authentication Flow
- ✅ Kullanıcı girişi
- ✅ Admin girişi
- ✅ Geçersiz kimlik bilgileri
- ✅ Çıkış işlemi
- ✅ Token yenileme

### 2. Dashboard Functionality
- ✅ Dashboard görüntüleme
- ✅ İstatistikler
- ✅ Navigasyon
- ✅ Hızlı eylemler

### 3. Instruction Management
- ✅ Talimat listesi
- ✅ Yeni talimat oluşturma
- ✅ Talimat düzenleme
- ✅ Talimat silme
- ✅ Arama

### 4. Document Management
- ✅ Doküman listesi
- ✅ Dosya yükleme
- ✅ Dosya indirme
- ✅ Doküman yönetimi

### 5. Analytics Dashboard
- ✅ Analitik görünüm
- ✅ Grafikler ve metrikler
- ✅ Tarih aralığı filtreleme
- ✅ Rapor oluşturma

### 6. AI Integration
- ✅ AI chat arayüzü
- ✅ Mesaj gönderme
- ✅ Konuşma geçmişi
- ✅ AI yanıtları

### 7. Admin Panel
- ✅ Admin paneli
- ✅ Kullanıcı yönetimi
- ✅ Sistem istatistikleri
- ✅ Yönetim işlemleri

### 8. Error Handling
- ✅ Ağ hataları
- ✅ API hataları
- ✅ Hata mesajları
- ✅ Graceful degradation

### 9. Performance Tests
- ✅ Response time
- ✅ Load testing
- ✅ Stress testing
- ✅ Memory usage
- ✅ CPU usage

### 10. Security Tests
- ✅ SQL injection
- ✅ XSS attacks
- ✅ CSRF protection
- ✅ Authentication bypass
- ✅ Authorization bypass
- ✅ Input validation
- ✅ Rate limiting

## 🎯 Test Kriterleri

### Başarı Kriterleri
- **Response Time**: < 2s (normal), < 5s (yüksek yük)
- **Error Rate**: < 5% (normal), < 10% (yüksek yük)
- **Throughput**: > 10 req/s (normal), > 5 req/s (yüksek yük)
- **Memory Usage**: < 500MB artış
- **CPU Usage**: < 80% kullanım

### Güvenlik Kriterleri
- **SQL Injection**: %100 engellenmeli
- **XSS Attacks**: %100 engellenmeli
- **CSRF Protection**: Aktif olmalı
- **Authentication**: Zorunlu olmalı
- **Authorization**: Role-based olmalı
- **Input Validation**: Tüm inputlar doğrulanmalı

## 🔍 Troubleshooting

### Yaygın Sorunlar

1. **Servisler çalışmıyor**
   ```bash
   # Servisleri başlat
   docker-compose up -d
   ```

2. **Database bağlantı hatası**
   ```bash
   # PostgreSQL'i kontrol et
   docker-compose logs postgres
   ```

3. **Redis bağlantı hatası**
   ```bash
   # Redis'i kontrol et
   docker-compose logs redis
   ```

4. **Test timeout hatası**
   - Test timeout değerlerini artır
   - Servislerin yanıt süresini kontrol et

5. **Memory hatası**
   - Node.js memory limit'ini artır
   - Test verilerini temizle

### Debug Modu
```bash
# Debug modunda çalıştır
DEBUG=* npm run test:all

# Verbose output ile
npm run test:all -- --verbose
```

## 📈 İyileştirme Önerileri

1. **Test Coverage**: Daha fazla edge case testi ekle
2. **Performance**: Daha gerçekçi load test senaryoları
3. **Security**: Daha kapsamlı güvenlik testleri
4. **Monitoring**: Test sonuçlarını izleme sistemi
5. **CI/CD**: Otomatik test pipeline'ı

## 🤝 Katkıda Bulunma

1. Yeni test senaryoları ekle
2. Mevcut testleri iyileştir
3. Test raporlarını geliştir
4. Dokümantasyonu güncelle

## 📞 Destek

Sorunlar için:
- GitHub Issues
- Team Slack
- Email: dev@claudetalimat.com

---

**Son Güncelleme**: 2024-01-XX  
**Versiyon**: 1.0.0  
**Durum**: ✅ Aktif
