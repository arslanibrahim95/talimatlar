# 🍎 Mac PC'ye Taşıma Rehberi - Claude Talimat Projesi

Bu rehber, Claude Talimat İş Güvenliği Yönetim Sistemi projesini Linux'tan Mac PC'ye taşıma sürecini detaylı olarak açıklar.

## 📋 İçindekiler

1. [Ön Gereksinimler](#ön-gereksinimler)
2. [Taşıma Yöntemleri](#taşıma-yöntemleri)
3. [Mac'te Kurulum](#macte-kurulum)
4. [Veritabanı Taşıma](#veritabanı-taşıma)
5. [Konfigürasyon](#konfigürasyon)
6. [Test ve Doğrulama](#test-ve-doğrulama)
7. [Sorun Giderme](#sorun-giderme)

## 🎯 Ön Gereksinimler

### Mac'te Kurulması Gerekenler

| Yazılım | Sürüm | Kurulum Yöntemi |
|---------|-------|-----------------|
| Docker Desktop | En son | Homebrew |
| Node.js | 18+ | nvm |
| Python | 3.11+ | pyenv |
| Go | 1.21+ | Homebrew |
| Deno | 1.35+ | curl script |
| Git | En son | Homebrew |

### Sistem Gereksinimleri

- **macOS**: 12.0 (Monterey) veya üzeri
- **RAM**: En az 8GB (16GB önerilen)
- **Disk**: En az 20GB boş alan
- **CPU**: Intel veya Apple Silicon (M1/M2)

## 🚀 Taşıma Yöntemleri

### Yöntem 1: Git ile (Önerilen)

```bash
# Mac'te
git clone https://github.com/arslanibrahim95/talimatlar.git
cd talimatlar
```

**Avantajları:**
- En güvenli yöntem
- Git history korunur
- Güncellemeler kolay
- Sürüm kontrolü

### Yöntem 2: Yedekleme Scripti ile

```bash
# Linux makinede
./scripts/backup-for-migration.sh

# Mac'te (yedekleme dosyalarını kopyaladıktan sonra)
tar -xzf talimatlar-backup-YYYYMMDD_HHMMSS.tar.gz
cd talimatlar-backup-YYYYMMDD_HHMMSS
```

**Avantajları:**
- Tüm dosyalar dahil
- Veritabanı yedekleri dahil
- Offline çalışma

### Yöntem 3: Manuel Kopyalama

```bash
# Linux'ta
rsync -avz --exclude='node_modules' --exclude='__pycache__' \
  --exclude='.git' --exclude='dist' \
  /home/igu/talimatlar/ user@mac-ip:~/talimatlar/
```

## 🛠️ Mac'te Kurulum

### Otomatik Kurulum (Önerilen)

```bash
# Proje dizinine git
cd talimatlar

# Kurulum scriptini çalıştır
chmod +x scripts/mac-setup.sh
./scripts/mac-setup.sh
```

### Manuel Kurulum

#### 1. Homebrew Kurulumu

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

#### 2. Docker Desktop

```bash
brew install --cask docker
# Docker Desktop'ı manuel olarak başlatın
```

#### 3. Node.js (nvm ile)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc
nvm install 18
nvm use 18
nvm alias default 18
```

#### 4. Python (pyenv ile)

```bash
brew install pyenv
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc
source ~/.zshrc

pyenv install 3.11.0
pyenv global 3.11.0
```

#### 5. Go

```bash
brew install go
```

#### 6. Deno

```bash
curl -fsSL https://deno.land/install.sh | sh
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### 7. Proje Bağımlılıkları

```bash
# Root bağımlılıkları
npm install

# Frontend bağımlılıkları
cd frontend
npm install
cd ..

# Backend servisleri
cd services/auth-service && deno cache --reload deno.json && cd ../..
cd services/document-service && python3.11 -m pip install -r requirements.txt && cd ../..
cd services/analytics-service && python3.11 -m pip install -r requirements.txt && cd ../..
cd services/notification-service && go mod download && go mod tidy && cd ../..
```

## 🗄️ Veritabanı Taşıma

### PostgreSQL Yedekleme ve Geri Yükleme

#### Linux'ta Yedekleme

```bash
# Çalışan container'dan yedekleme
docker-compose exec -T postgres pg_dump -U safety_admin -d safety_production > database_backup.sql

# Veya container dışından
pg_dump -h localhost -p 5433 -U safety_admin -d safety_production > database_backup.sql
```

#### Mac'te Geri Yükleme

```bash
# Docker container'ına yükleme
docker-compose exec -T postgres psql -U safety_admin -d safety_production < database_backup.sql

# Veya container dışından
psql -h localhost -p 5433 -U safety_admin -d safety_production < database_backup.sql
```

### Redis Yedekleme ve Geri Yükleme

#### Linux'ta Yedekleme

```bash
# Redis dump dosyasını al
docker-compose exec redis redis-cli --rdb /data/dump.rdb
docker cp claude-redis:/data/dump.rdb ./redis_backup.rdb
```

#### Mac'te Geri Yükleme

```bash
# Redis dump dosyasını yükle
docker cp redis_backup.rdb claude-redis:/data/dump.rdb
docker-compose restart redis
```

## ⚙️ Konfigürasyon

### Environment Dosyaları

```bash
# Environment dosyasını oluştur
cp .env.example .env

# Gerekli değerleri ayarla
nano .env
```

### Önemli Environment Değişkenleri

```bash
# Veritabanı
POSTGRES_DB=safety_production
POSTGRES_USER=safety_admin
POSTGRES_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256

# API Keys
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key

# Monitoring
GRAFANA_PASSWORD=your_grafana_password
```

### Port Konfigürasyonu

Mac'te port çakışmalarını önlemek için:

```bash
# Kullanılan portları kontrol et
lsof -i :3000,5433,6380,8003,8004,8005,8006,8080,9090,3004

# Gerekirse portları değiştir
# docker-compose.yml dosyasında port mapping'leri güncelleyin
```

## 🧪 Test ve Doğrulama

### Servisleri Başlatma

```bash
# Tüm servisleri başlat
docker-compose up -d

# Servis durumunu kontrol et
docker-compose ps

# Logları kontrol et
docker-compose logs -f
```

### Health Check'ler

```bash
# Frontend
curl http://localhost:3000

# Auth Service
curl http://localhost:8004/health

# Analytics Service
curl http://localhost:8003/health

# Instruction Service
curl http://localhost:8005/health

# AI Service
curl http://localhost:8006/health

# API Gateway
curl http://localhost:8080/gateway/health
```

### Test Çalıştırma

```bash
# Unit testler
npm run test:unit

# Integration testler
npm run test:integration

# E2E testler
npm run test:e2e

# Tüm testler
npm run test:all
```

## 🔧 Sorun Giderme

### Yaygın Sorunlar

#### 1. Docker Desktop Çalışmıyor

```bash
# Docker Desktop'ı başlat
open -a Docker

# Docker servisini kontrol et
docker info
```

#### 2. Port Çakışması

```bash
# Port kullanımını kontrol et
lsof -i :PORT_NUMBER

# Servisi durdur
sudo lsof -ti:PORT_NUMBER | xargs kill -9
```

#### 3. Node.js Sürüm Sorunu

```bash
# nvm ile doğru sürümü kullan
nvm use 18
nvm alias default 18
```

#### 4. Python Sürüm Sorunu

```bash
# pyenv ile doğru sürümü kullan
pyenv global 3.11.0
pyenv rehash
```

#### 5. Deno Bulunamıyor

```bash
# PATH'i güncelle
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### 6. Go Module Sorunları

```bash
# Go modülleri temizle ve yeniden yükle
go clean -modcache
go mod download
go mod tidy
```

### Log Kontrolü

```bash
# Tüm servis logları
docker-compose logs -f

# Belirli servis logları
docker-compose logs -f auth-service
docker-compose logs -f postgres
docker-compose logs -f redis

# Nginx logları
docker-compose logs -f nginx
```

### Performans Optimizasyonu

#### Docker Kaynak Ayarları

```bash
# Docker Desktop > Settings > Resources
# Memory: En az 4GB (8GB önerilen)
# CPU: En az 2 core (4 core önerilen)
```

#### macOS Özel Ayarlar

```bash
# File descriptor limitini artır
ulimit -n 65536

# Swap kullanımını kontrol et
vm_stat
```

## 📊 Monitoring ve İzleme

### Grafana Dashboard

- **URL**: http://localhost:3004
- **Kullanıcı**: admin
- **Şifre**: .env dosyasındaki GRAFANA_PASSWORD

### Prometheus Metrics

- **URL**: http://localhost:9090
- **Targets**: http://localhost:9090/targets

### Health Check Endpoints

```bash
# Sistem durumu
curl http://localhost/health

# Servis durumları
curl http://localhost:8004/health
curl http://localhost:8003/health
curl http://localhost:8005/health
curl http://localhost:8006/health
```

## 🚀 Production Deployment

### Production Build

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# SSL sertifikaları
# Let's Encrypt veya manuel SSL sertifikası kurulumu
```

### Backup Stratejisi

```bash
# Otomatik backup scripti
./scripts/backup-for-migration.sh

# Cron job ile otomatik backup
crontab -e
# 0 2 * * * /path/to/backup-script.sh
```

## 📞 Destek

### Hata Raporlama

1. GitHub Issues: [Proje Issues](https://github.com/arslanibrahim95/talimatlar/issues)
2. Email: ibrahim1995412@gmail.com

### Dokümantasyon

- [Proje README](README.md)
- [API Dokümantasyonu](docs/API.md)
- [Deployment Rehberi](DEPLOYMENT.md)

---

**Not**: Bu rehber sürekli güncellenmektedir. En güncel versiyon için GitHub repository'sini kontrol edin.

**Son Güncelleme**: 9 Eylül 2025
