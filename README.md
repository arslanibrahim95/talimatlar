# 🏗️ Claude Talimat İş Güvenliği Yönetim Sistemi

Modern, güvenli ve ölçeklenebilir iş güvenliği yönetim sistemi. Raspberry Pi 5 üzerinde çalışacak şekilde optimize edilmiş mikroservis mimarisi.

## 🎯 Özellikler

- **🔐 Güvenli Kimlik Doğrulama**: JWT + OTP tabanlı
- **📄 Doküman Yönetimi**: PDF işleme, OCR, arama
- **📊 Real-time Analytics**: Dashboard ve raporlama
- **🔔 Bildirim Sistemi**: SMS, Email, Push notifications
- **🏢 Multi-tenant**: Çoklu şirket desteği
- **📱 PWA**: Progressive Web App
- **🤖 AI Ready**: Yapay zeka entegrasyonu için hazır

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (PWA)                      │
├─────────────────────────────────────────────────────────┤
│                    Nginx (Reverse Proxy)               │
├─────────────────────────────────────────────────────────┤
│  Auth Service  │ Document Service │ Analytics Service  │
│   (Deno/Oak)   │  (Python/FastAPI)│  (Python/FastAPI)  │
├─────────────────────────────────────────────────────────┤
│              Notification Service (Go/Gin)             │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL  │  Redis  │  MeiliSearch  │  MinIO        │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+
- Go 1.21+
- Deno 1.35+

### Kurulum

```bash
# Repository'yi klonlayın
git clone https://github.com/arslanibrahim95/talimatlar.git
cd talimatlar

# Environment dosyasını oluşturun
cp .env.example .env

# Servisleri başlatın
docker-compose up -d

# Frontend'i geliştirme modunda başlatın
cd frontend
npm install
npm run dev
```

### Erişim
- **Frontend**: http://localhost:3000
- **Auth API**: http://localhost:8001
- **Document API**: http://localhost:8002
- **Analytics API**: http://localhost:8003
- **Notification API**: http://localhost:8004

## 📁 Proje Yapısı

```
claude-talimat/
├── services/
│   ├── auth-service/          # Deno + Oak
│   ├── document-service/      # Python + FastAPI
│   ├── analytics-service/     # Python + FastAPI
│   └── notification-service/  # Go + Gin
├── frontend/                  # React/Preact PWA
├── infrastructure/
│   ├── nginx/
│   ├── postgresql/
│   ├── redis/
│   └── monitoring/
├── scripts/                   # Deployment scripts
└── docs/                      # Dokümantasyon
```

## 🔧 Geliştirme

### Backend Geliştirme
```bash
# Auth Service
cd services/auth-service
deno task dev

# Document Service
cd services/document-service
uvicorn main:app --reload --port 8002

# Analytics Service
cd services/analytics-service
uvicorn main:app --reload --port 8003

# Notification Service
cd services/notification-service
go run main.go
```

### Frontend Geliştirme
```bash
cd frontend
npm run dev
```

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm run test:all

# Backend testleri
npm run test:backend

# Frontend testleri
npm run test:frontend
```

## 📦 Deployment

### Production
```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# Raspberry Pi deployment
./scripts/deploy-rpi.sh
```

### Development
```bash
# Development environment
docker-compose up -d

# Hot reload için
npm run dev:all
```

## 🔐 Güvenlik

- JWT token authentication
- OTP (One-Time Password) verification
- Rate limiting
- CORS configuration
- Input validation
- SQL injection protection

## 📊 Monitoring

- Prometheus metrics
- Grafana dashboards
- Health checks
- Log aggregation
- Error tracking

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Email**: admin@claude-talimat.com
- **GitHub Issues**: [Proje Issues](https://github.com/arslanibrahim95/talimatlar/issues)

---

**Built with ❤️ for workplace safety**
