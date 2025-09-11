# 🏗️ Claude Talimat İş Güvenliği Yönetim Sistemi

[![CI/CD Pipeline](https://github.com/arslanibrahim95/talimatlar/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/arslanibrahim95/talimatlar/actions)
[![GitHub Pages](https://github.com/arslanibrahim95/talimatlar/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)](https://github.com/arslanibrahim95/talimatlar/actions)
[![Security](https://github.com/arslanibrahim95/talimatlar/workflows/Dependency%20Review/badge.svg)](https://github.com/arslanibrahim95/talimatlar/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-green.svg)](https://www.python.org/)
[![Deno](https://img.shields.io/badge/Deno-1.35+-blue.svg)](https://deno.land/)

Modern, güvenli ve ölçeklenebilir iş güvenliği yönetim sistemi. Raspberry Pi 5 üzerinde çalışacak şekilde optimize edilmiş mikroservis mimarisi.

> **🚀 Live Demo**: [GitHub Pages](https://arslanibrahim95.github.io/talimatlar/) | **📖 Documentation**: [Wiki](https://github.com/arslanibrahim95/talimatlar/wiki)

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
- **Frontend**: http://localhyost:3000
- **Auth API**: http://localhost:8001
- **Document API**: http://localhost:8002
- **Analytics API**: http://localhost:8003
- **Notification API**: http://localhost:8003

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

Katkılarınızı bekliyoruz! Lütfen [Contributing Guidelines](CONTRIBUTING.md) dosyasını okuyun.

### Hızlı Başlangıç
1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Katkı Türleri
- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🧪 Test coverage
- 🔧 Performance optimizations
- 🔒 Security enhancements

### Code of Conduct
Bu proje [Contributor Covenant](CODE_OF_CONDUCT.md) kurallarına uyar.

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Email**: ibrahim1995412@gmail.com
- **GitHub Issues**: [Proje Issues](https://github.com/arslanibrahim95/talimatlar/issues)
- **Discussions**: [GitHub Discussions](https://github.com/arslanibrahim95/talimatlar/discussions)
- **Security**: [Security Policy](SECURITY.md)

## 📊 Proje İstatistikleri

![GitHub stars](https://img.shields.io/github/stars/arslanibrahim95/talimatlar?style=social)
![GitHub forks](https://img.shields.io/github/forks/arslanibrahim95/talimatlar?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/arslanibrahim95/talimatlar?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/arslanibrahim95/talimatlar)
![GitHub issues](https://img.shields.io/github/issues/arslanibrahim95/talimatlar)
![GitHub pull requests](https://img.shields.io/github/issues-pr/arslanibrahim95/talimatlar)

## 🏆 Teşekkürler

Bu projeye katkıda bulunan herkese teşekkürler!

[![Contributors](https://contrib.rocks/image?repo=arslanibrahim95/talimatlar)](https://github.com/arslanibrahim95/talimatlar/graphs/contributors)

---

**Built with ❤️ for workplace safety**

[![GitHub](https://img.shields.io/badge/GitHub-arslanibrahim95-black?style=flat&logo=github)](https://github.com/arslanibrahim95)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-ibrahim--arslan-blue?style=flat&logo=linkedin)](https://linkedin.com/in/ibrahim-arslan)
[![Twitter](https://img.shields.io/badge/Twitter-@arslanibrahim95-blue?style=flat&logo=twitter)](https://twitter.com/arslanibrahim95)
