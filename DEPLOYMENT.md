# 🚀 Claude Talimat Production Deployment Guide

Bu dokümantasyon, Claude Talimat İş Güvenliği Yönetim Sistemi'nin production ortamına deployment sürecini ve mevcut durumunu detaylandırır.

## 📋 İçindekiler

- [Ön Gereksinimler](#ön-gereksinimler)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Detaylı Kurulum](#detaylı-kurulum)
- [Monitoring ve Alerting](#monitoring-ve-alerting)
- [Backup ve Recovery](#backup-ve-recovery)
- [Troubleshooting](#troubleshooting)
- [Deployment Status](#deployment-status)

## 🔧 Ön Gereksinimler

### Sistem Gereksinimleri

- **CPU**: Minimum 4 core, Önerilen 8+ core
- **RAM**: Minimum 8GB, Önerilen 16+ GB
- **Disk**: Minimum 100GB SSD, Önerilen 500+ GB
- **OS**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+

### Yazılım Gereksinimleri

- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- curl, jq, openssl

### Ağ Gereksinimleri

- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 22 (SSH)
- Port 5432 (PostgreSQL - internal)
- Port 6379 (Redis - internal)

## 🚀 Hızlı Başlangıç

### 1. Repository'yi Klonlayın

```bash
git clone https://github.com/your-org/claude-talimat.git
cd claude-talimat
```

### 2. Environment Dosyasını Hazırlayın

```bash
cp env.production.example .env.production
# .env.production dosyasını düzenleyin
```

### 3. SSL Sertifikalarını Hazırlayın

```bash
mkdir -p ssl
# SSL sertifikalarınızı ssl/ dizinine kopyalayın
# cert.pem ve key.pem dosyaları
```

### 4. Deployment'ı Başlatın

```bash
./scripts/deploy.sh production latest
```

## 📖 Detaylı Kurulum

### 1. Environment Konfigürasyonu

`.env.production` dosyasında aşağıdaki değişkenleri ayarlayın:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://user:password@postgres:5432/dbname

# Redis
REDIS_PASSWORD=your_secure_redis_password

# JWT
JWT_SECRET=your_very_secure_jwt_secret_minimum_32_chars

# Email
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Monitoring
GRAFANA_PASSWORD=your_grafana_password
```

### 2. SSL Sertifikası Kurulumu

#### Let's Encrypt ile Otomatik SSL

```bash
# Certbot kurulumu
sudo apt install certbot

# Sertifika oluşturma
sudo certbot certonly --standalone -d your-domain.com

# Sertifikaları kopyalama
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

#### Manuel SSL Sertifikası

```bash
# Sertifikaları ssl/ dizinine kopyalayın
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem
```

### 3. Docker Compose ile Deployment

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Logları kontrol etme
docker-compose -f docker-compose.prod.yml logs -f

# Servis durumunu kontrol etme
docker-compose -f docker-compose.prod.yml ps
```

### 4. Health Check

```bash
# Tüm servislerin sağlığını kontrol etme
curl http://localhost:80/health
curl http://localhost:8004/health  # Auth Service
curl http://localhost:8002/health  # Document Service
curl http://localhost:8003/health  # Analytics Service
curl http://localhost:8005/health  # Notification Service
```

## 📊 Monitoring ve Alerting

### Prometheus ve Grafana

- **Prometheus**: http://your-domain.com:9090
- **Grafana**: http://your-domain.com:3000
  - Kullanıcı: admin
  - Şifre: .env.production dosyasındaki GRAFANA_PASSWORD

### Kibana (Log Analysis)

- **Kibana**: http://your-domain.com:5601

### Alerting

Sistem aşağıdaki durumlarda otomatik alert gönderir:

- Yüksek error rate (>10%)
- Yüksek response time (>2s)
- Servis down
- Yüksek CPU/Memory kullanımı
- Disk space düşük
- SSL sertifika süresi dolmak üzere

## 💾 Backup ve Recovery

### Otomatik Backup

Sistem günlük otomatik backup alır:

```bash
# Backup dizini
/backups/YYYYMMDD_HHMMSS/
├── database.sql
├── postgres-data.tar.gz
└── redis-data.tar.gz
```

### Manuel Backup

```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U claude_talimat_user claude_talimat_prod > backup.sql

# Volume backup
docker run --rm -v claude-talimat_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data.tar.gz -C /data .
```

### Recovery

```bash
# Database restore
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U claude_talimat_user claude_talimat_prod < backup.sql

# Volume restore
docker run --rm -v claude-talimat_postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-data.tar.gz -C /data
```

## 🔧 Troubleshooting

### Yaygın Sorunlar

#### 1. Servis Başlamıyor

```bash
# Logları kontrol etme
docker-compose -f docker-compose.prod.yml logs service-name

# Servis durumunu kontrol etme
docker-compose -f docker-compose.prod.yml ps

# Servisi yeniden başlatma
docker-compose -f docker-compose.prod.yml restart service-name
```

#### 2. Database Bağlantı Sorunu

```bash
# PostgreSQL bağlantısını test etme
docker-compose -f docker-compose.prod.yml exec postgres psql -U claude_talimat_user -d claude_talimat_prod -c "SELECT 1;"

# Database loglarını kontrol etme
docker-compose -f docker-compose.prod.yml logs postgres
```

#### 3. SSL Sertifika Sorunu

```bash
# Sertifika geçerliliğini kontrol etme
openssl x509 -in ssl/cert.pem -text -noout

# Sertifika süresini kontrol etme
openssl x509 -in ssl/cert.pem -dates -noout
```

#### 4. Memory/CPU Yüksek Kullanım

```bash
# Container resource kullanımını kontrol etme
docker stats

# Sistem resource kullanımını kontrol etme
htop
```

### Log Analizi

```bash
# Tüm servis logları
docker-compose -f docker-compose.prod.yml logs -f

# Belirli servis logları
docker-compose -f docker-compose.prod.yml logs -f frontend

# Log filtreleme
docker-compose -f docker-compose.prod.yml logs -f | grep ERROR
```

### Performance Monitoring

```bash
# K6 ile load test
cd tests/performance
k6 run load-test.js

# Stress test
k6 run stress-test.js
```

## 🔄 Güncelleme Süreci

### 1. Yeni Versiyon Deployment

```bash
# Yeni versiyonu çekme
git pull origin main

# Yeni versiyonu deploy etme
./scripts/deploy.sh production v1.1.0
```

### 2. Rollback

```bash
# Önceki versiyona geri dönme
./scripts/deploy.sh production v1.0.0
```

## 📞 Destek

- **Dokümantasyon**: [GitHub Wiki](https://github.com/your-org/claude-talimat/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/claude-talimat/issues)
- **Email**: support@claude-talimat.com

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 🚀 Deployment Status

### ✅ Deployment Başarıyla Tamamlandı!

**Tarih**: 6 Eylül 2025  
**Saat**: 14:27 (UTC+3)  
**Platform**: Raspberry Pi 5 (ARM64)

### 📊 Sistem Durumu

#### 🟢 Çalışan Servisler

| Servis | Port | Durum | URL |
|--------|------|-------|-----|
| **Frontend** | 3000 | ✅ Çalışıyor | http://localhost:3000 |
| **Auth Service** | 8004 | ✅ Çalışıyor | http://localhost:8004 |
| **Analytics Service** | 8003 | ✅ Çalışıyor | http://localhost:8003 |
| **Instruction Service** | 8005 | ✅ Çalışıyor | http://localhost:8005 |
| **AI Service** | 8006 | ✅ Çalışıyor | http://localhost:8006 |
| **Nginx Proxy** | 8080 | ✅ Çalışıyor | http://localhost:8080 |
| **PostgreSQL** | 5433 | ✅ Çalışıyor | localhost:5433 |
| **Redis** | 6380 | ✅ Çalışıyor | localhost:6380 |

#### 📈 Monitoring Servisleri

| Servis | Port | Durum | URL |
|--------|------|-------|-----|
| **Prometheus** | 9090 | ✅ Çalışıyor | http://localhost:9090 |
| **Grafana** | 3004 | ✅ Çalışıyor | http://localhost:3004 |

**Grafana Giriş Bilgileri:**
- Kullanıcı: `admin`
- Şifre: `ClaudeTalimat2024!Grafana`

---

## 🎯 Tamamlanan Özellikler

### ✅ 1. Production Deployment
- [x] Docker containerization
- [x] SSL sertifika oluşturma
- [x] Environment konfigürasyonu
- [x] Health check'ler
- [x] Auto-restart policies
- [x] Resource limits

### ✅ 2. User Onboarding
- [x] 4 adımlı kayıt süreci
- [x] Email doğrulama sistemi
- [x] Form validasyonu
- [x] Progress tracking
- [x] Responsive tasarım

### ✅ 3. Performance Monitoring
- [x] Prometheus metrik toplama
- [x] Grafana dashboard'ları
- [x] Alert kuralları
- [x] Custom metrikler
- [x] Real-time monitoring

### ✅ 4. Advanced Features
- [x] AI Assistant entegrasyonu
- [x] QR Code generator
- [x] Document analysis
- [x] Smart suggestions
- [x] Real-time chat

### ✅ 5. Business Expansion
- [x] Multi-tenant sistem
- [x] Tenant management paneli
- [x] Scalable architecture
- [x] Feature toggles
- [x] Resource limits

---

## 🔧 Yönetim Komutları

### Servis Yönetimi
```bash
# Tüm servisleri başlat
docker compose up -d

# Servisleri durdur
docker compose down

# Logları görüntüle
docker compose logs -f

# Servis durumunu kontrol et
docker compose ps
```

### Monitoring Yönetimi
```bash
# Monitoring servislerini başlat
docker compose -f docker-compose.monitoring.yml up -d

# Monitoring servislerini durdur
docker compose -f docker-compose.monitoring.yml down

# Monitoring logları
docker compose -f docker-compose.monitoring.yml logs -f
```

### Veritabanı Yönetimi
```bash
# PostgreSQL'e bağlan
docker exec -it claude-postgres psql -U safety_admin -d safety_production

# Redis'e bağlan
docker exec -it claude-redis redis-cli
```

---

## 📁 Önemli Dizinler

```
/home/igu/talimatlar/
├── frontend/                 # React frontend
├── services/                 # Backend servisleri
├── monitoring/               # Monitoring konfigürasyonları
├── scripts/                  # Deployment script'leri
├── logs/                     # Uygulama logları
├── backups/                  # Veritabanı yedekleri
└── ssl/                      # SSL sertifikaları
```

---

## 🌐 Erişim URL'leri

### Ana Uygulama
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080

### Monitoring
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3004

### API Endpoints
- **Auth API**: http://localhost:8004
- **Analytics API**: http://localhost:8003
- **Instruction API**: http://localhost:8005
- **AI API**: http://localhost:8006

---

## 🔒 Güvenlik

### Aktif Güvenlik Önlemleri
- ✅ SSL/TLS encryption
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ Input validation
- ✅ XSS/CSRF protection
- ✅ SQL injection prevention
- ✅ Rate limiting

### Güvenlik Konfigürasyonu
- JWT Secret: Güçlü production secret
- Database: Şifreli bağlantı
- Redis: Şifreli bağlantı
- CORS: Sınırlı origin'ler

---

## 📊 Performans Metrikleri

### Hedeflenen Performans
- **Frontend Response**: < 100ms
- **API Response**: < 200ms
- **Database Query**: < 50ms
- **Cache Operations**: < 10ms

### Monitoring Metrikleri
- CPU kullanımı
- Memory kullanımı
- Disk kullanımı
- Network trafiği
- Database bağlantıları
- API response times

---

## 🚀 Sonraki Adımlar

### Kısa Vadeli (1-2 hafta)
- [ ] Production domain kurulumu
- [ ] SSL sertifika güncelleme
- [ ] Backup otomasyonu
- [ ] Log rotation

### Orta Vadeli (1-2 ay)
- [ ] Load balancing
- [ ] Auto-scaling
- [ ] CDN entegrasyonu
- [ ] Advanced monitoring

### Uzun Vadeli (3-6 ay)
- [ ] Multi-region deployment
- [ ] Disaster recovery
- [ ] Advanced analytics
- [ ] Machine learning features

---

## 📞 Destek

### Sistem Yöneticisi
- **Email**: admin@claude-talimat.com
- **Telefon**: +90 XXX XXX XX XX

### Teknik Destek
- **Email**: support@claude-talimat.com
- **Dokümantasyon**: /docs klasörü

### Acil Durum
- **24/7 Monitoring**: Grafana dashboard
- **Alert System**: Prometheus alerts
- **Log Analysis**: ELK stack (kurulum aşamasında)

---

## 🎉 Başarıyla Tamamlandı!

Claude Talimat İş Güvenliği Yönetim Sistemi production ortamında başarıyla çalışmaktadır. Tüm temel özellikler aktif ve monitoring sistemi kurulmuştur.

**Sistem Durumu**: 🟢 OPERASYONEL  
**Son Güncelleme**: 6 Eylül 2025, 14:27  
**Versiyon**: 1.0.0