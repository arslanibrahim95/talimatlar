# 🚀 Claude Talimat Load Testing Suite

Bu dizin, Claude Talimat İş Güvenliği Yönetim Sistemi için kapsamlı load testing araçlarını içerir.

## 📋 İçerik

- **k6-load-test.js** - Temel load testing (50 kullanıcıya kadar)
- **k6-stress-test.js** - Stress testing (100 kullanıcıya kadar, spike testleri dahil)
- **k6-spike-test.js** - Spike testing (300 kullanıcıya kadar, ani yük artışları)
- **run-load-tests.sh** - Otomatik test çalıştırma scripti
- **results/** - Test sonuçları (otomatik oluşturulur)

## 🛠️ Kurulum

### 1. K6 Kurulumu

```bash
# Ubuntu/Debian
sudo apt-get install k6

# macOS
brew install k6

# Windows (Chocolatey)
choco install k6

# Manuel kurulum
# https://k6.io/docs/getting-started/installation/
```

### 2. Servisleri Başlatma

Load testing yapmadan önce gerekli servisleri başlatın:

```bash
# Frontend
cd frontend && npm run dev

# PostgreSQL
docker run -d --name postgres -p 5433:5432 -e POSTGRES_PASSWORD=password postgres

# Redis
docker run -d --name redis -p 6380:6379 redis

# Backend servisleri (opsiyonel)
# Auth Service, Analytics Service, vb.
```

## 🚀 Kullanım

### Hızlı Başlangıç

```bash
# Tüm testleri çalıştır
./run-load-tests.sh

# Sadece servisleri kontrol et
./run-load-tests.sh --check-only

# Sadece load test
./run-load-tests.sh --load-only

# Sadece stress test
./run-load-tests.sh --stress-only

# Sadece spike test
./run-load-tests.sh --spike-only
```

### Manuel Test Çalıştırma

```bash
# Load test
k6 run k6-load-test.js

# Stress test
k6 run k6-stress-test.js

# Spike test
k6 run k6-spike-test.js
```

## 📊 Test Senaryoları

### 1. Load Test (k6-load-test.js)

**Hedef:** Normal kullanım koşullarında sistem performansını test etme

**Özellikler:**
- 0-50 kullanıcı arası kademeli artış
- 23 dakika süre
- Frontend, API, Database testleri
- Authentication flow testleri

**Thresholds:**
- 95% istekler < 500ms
- Hata oranı < 10%

### 2. Stress Test (k6-stress-test.js)

**Hedef:** Sistemin yüksek yük altındaki davranışını test etme

**Özellikler:**
- 0-100 kullanıcı arası artış
- Spike testleri dahil
- 20 dakika süre
- Recovery testleri

**Thresholds:**
- 95% istekler < 1s
- Hata oranı < 20%

### 3. Spike Test (k6-spike-test.js)

**Hedef:** Ani yük artışlarına sistemin tepkisini test etme

**Özellikler:**
- 0-300 kullanıcı arası ani artışlar
- Çoklu spike patternleri
- 15 dakika süre
- Recovery süreleri

**Thresholds:**
- 95% istekler < 2s
- Hata oranı < 30%

## 📈 Test Metrikleri

### Temel Metrikler
- **Response Time**: Yanıt süreleri (p50, p95, p99)
- **Error Rate**: Hata oranları
- **Throughput**: Saniye başına istek sayısı
- **Request Count**: Toplam istek sayısı

### Özel Metrikler
- **Spike Error Rate**: Spike dönemlerindeki hata oranları
- **Recovery Time**: Spike sonrası toparlanma süreleri
- **Custom Response Time**: Özel response time trendleri

## 📁 Sonuç Dosyaları

Testler çalıştırıldığında `results/` dizininde şu dosyalar oluşturulur:

```
results/
├── load_test_YYYYMMDD_HHMMSS.json    # JSON formatında detaylı sonuçlar
├── load_test_YYYYMMDD_HHMMSS.csv     # CSV formatında sonuçlar
├── stress_test_YYYYMMDD_HHMMSS.json
├── stress_test_YYYYMMDD_HHMMSS.csv
├── spike_test_YYYYMMDD_HHMMSS.json
├── spike_test_YYYYMMDD_HHMMSS.csv
└── load_test_summary_YYYYMMDD_HHMMSS.md  # Özet rapor
```

## 🔍 Sonuç Analizi

### JSON Dosyaları
- K6'nın built-in analiz araçları
- Grafana import
- Custom dashboard'lar

### CSV Dosyaları
- Excel/Google Sheets import
- Veri analizi araçları
- Custom raporlar

### Önemli Metrikler
1. **Response Time Percentiles**
   - p50: Ortalama yanıt süresi
   - p95: 95% isteklerin yanıt süresi
   - p99: 99% isteklerin yanıt süresi

2. **Error Rates**
   - Genel hata oranı
   - Spike dönemlerindeki hata oranı
   - Recovery sonrası hata oranı

3. **Throughput**
   - Saniye başına istek sayısı
   - Peak throughput
   - Sustained throughput

## ⚙️ Konfigürasyon

### Test Parametrelerini Değiştirme

Her test dosyasında `options` objesini düzenleyerek test parametrelerini değiştirebilirsiniz:

```javascript
export let options = {
  stages: [
    { duration: '2m', target: 10 },   // 2 dakikada 10 kullanıcıya çık
    { duration: '5m', target: 10 },   // 5 dakika 10 kullanıcıda kal
    { duration: '2m', target: 0 },    // 2 dakikada 0 kullanıcıya in
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% istekler < 500ms
    http_req_failed: ['rate<0.1'],    // Hata oranı < 10%
  },
};
```

### URL'leri Değiştirme

Test dosyalarının başında URL'leri güncelleyebilirsiniz:

```javascript
const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:8004';
const ANALYTICS_URL = 'http://localhost:8003';
const INSTRUCTION_URL = 'http://localhost:8005';
```

## 🚨 Sorun Giderme

### Yaygın Sorunlar

1. **K6 bulunamadı**
   ```bash
   # K6'yı yeniden yükle
   sudo apt-get update && sudo apt-get install k6
   ```

2. **Servisler çalışmıyor**
   ```bash
   # Servisleri kontrol et
   ./run-load-tests.sh --check-only
   ```

3. **Port çakışması**
   ```bash
   # Port kullanımını kontrol et
   netstat -tulpn | grep :3000
   ```

4. **Yetersiz kaynak**
   ```bash
   # Sistem kaynaklarını kontrol et
   htop
   free -h
   ```

### Debug Modu

Detaylı log için:

```bash
# Verbose output
k6 run --verbose k6-load-test.js

# Debug mode
k6 run --log-output=file=debug.log k6-load-test.js
```

## 📚 Ek Kaynaklar

- [K6 Documentation](https://k6.io/docs/)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/)
- [Performance Testing Guide](https://k6.io/docs/testing-guides/performance-testing/)

## 🤝 Katkıda Bulunma

1. Test senaryolarını genişletin
2. Yeni metrikler ekleyin
3. Farklı test patternleri oluşturun
4. Sonuç analiz araçları geliştirin

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

**Not:** Load testing yapmadan önce sistemin production ortamında olmadığından emin olun. Testler sistem kaynaklarını yoğun kullanabilir.
