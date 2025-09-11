#!/bin/bash

# Proje Yedekleme Scripti - Mac PC'ye Taşıma İçin
# Bu script projeyi Mac PC'ye taşımak için gerekli dosyaları yedekler

set -e

echo "📦 Claude Talimat Projesi - Yedekleme Başlıyor..."

# Renkli çıktı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonksiyonlar
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Tarih damgası
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="talimatlar-backup-${TIMESTAMP}"

print_status "Yedekleme dizini oluşturuluyor: ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"

# Proje dosyalarını kopyala
print_status "Proje dosyaları kopyalanıyor..."

# Ana dizin dosyaları
cp -r . "${BACKUP_DIR}/" 2>/dev/null || true

# Gereksiz dosyaları temizle
print_status "Gereksiz dosyalar temizleniyor..."

cd "${BACKUP_DIR}"

# Node modules'ları temizle (yeniden yüklenecek)
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".vite" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

# Python cache'leri temizle
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -type f -delete 2>/dev/null || true

# Go cache'leri temizle
find . -name "go.sum" -type f -delete 2>/dev/null || true

# Log dosyalarını temizle
find . -name "*.log" -type f -delete 2>/dev/null || true

# Docker volume'larını temizle
rm -rf postgres_data redis_data prometheus_data grafana_data alertmanager_data 2>/dev/null || true

# Geçici dosyaları temizle
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
find . -name "Thumbs.db" -type f -delete 2>/dev/null || true

# Git history'yi koru ama .git klasörünü sıkıştır
if [ -d ".git" ]; then
    print_status "Git history sıkıştırılıyor..."
    tar -czf git-history.tar.gz .git
    rm -rf .git
fi

cd ..

# Veritabanı yedeği al
print_status "Veritabanı yedeği alınıyor..."

# PostgreSQL yedeği
if docker-compose ps postgres | grep -q "Up"; then
    print_status "PostgreSQL yedeği alınıyor..."
    docker-compose exec -T postgres pg_dump -U safety_admin -d safety_production > "${BACKUP_DIR}/database_backup.sql"
    print_success "PostgreSQL yedeği alındı"
else
    print_warning "PostgreSQL çalışmıyor, veritabanı yedeği alınamadı"
fi

# Redis yedeği
if docker-compose ps redis | grep -q "Up"; then
    print_status "Redis yedeği alınıyor..."
    docker-compose exec -T redis redis-cli --rdb /data/dump.rdb
    docker cp claude-redis:/data/dump.rdb "${BACKUP_DIR}/redis_backup.rdb"
    print_success "Redis yedeği alındı"
else
    print_warning "Redis çalışmıyor, Redis yedeği alınamadı"
fi

# Environment dosyalarını kontrol et
print_status "Environment dosyaları kontrol ediliyor..."

if [ -f ".env" ]; then
    print_warning "⚠️  .env dosyası mevcut! Bu dosya hassas bilgiler içerebilir."
    print_warning "Mac PC'de .env dosyasını manuel olarak oluşturmanız önerilir."
    read -p "Yine de .env dosyasını yedeklemek istiyor musunuz? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        rm -f "${BACKUP_DIR}/.env"
        print_status ".env dosyası yedeklenmedi"
    else
        print_success ".env dosyası yedeklendi"
    fi
fi

# Yedekleme raporu oluştur
print_status "Yedekleme raporu oluşturuluyor..."

cat > "${BACKUP_DIR}/BACKUP_INFO.md" << EOF
# Claude Talimat Projesi - Yedekleme Raporu

**Tarih:** $(date)
**Kaynak:** $(hostname)
**Hedef:** Mac PC

## 📦 Yedeklenen İçerik

### Proje Dosyaları
- Tüm kaynak kod dosyaları
- Konfigürasyon dosyaları
- Dokümantasyon
- Script'ler

### Veritabanı Yedekleri
- PostgreSQL: \`database_backup.sql\`
- Redis: \`redis_backup.rdb\`

### Temizlenen Dosyalar
- node_modules/ (yeniden yüklenecek)
- __pycache__/ (yeniden oluşturulacak)
- .vite/ (yeniden oluşturulacak)
- dist/ (yeniden build edilecek)
- Log dosyaları
- Docker volume'ları

## 🚀 Mac PC'de Kurulum

1. Bu dosyaları Mac PC'ye kopyalayın
2. \`scripts/mac-setup.sh\` scriptini çalıştırın
3. Environment dosyalarını ayarlayın
4. Veritabanı yedeklerini geri yükleyin

## ⚠️ Önemli Notlar

- .env dosyası hassas bilgiler içerebilir, manuel olarak oluşturun
- Git history ayrı olarak sıkıştırıldı (git-history.tar.gz)
- Tüm bağımlılıklar Mac PC'de yeniden yüklenecek

## 📋 Kurulum Komutları

\`\`\`bash
# Mac PC'de
chmod +x scripts/mac-setup.sh
./scripts/mac-setup.sh

# Veritabanı geri yükleme
docker-compose exec -T postgres psql -U safety_admin -d safety_production < database_backup.sql
docker cp redis_backup.rdb claude-redis:/data/dump.rdb
docker-compose restart redis
\`\`\`
EOF

# Yedekleme boyutunu hesapla
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)

print_success "🎉 Yedekleme tamamlandı!"
print_status "Yedekleme dizini: ${BACKUP_DIR}"
print_status "Yedekleme boyutu: ${BACKUP_SIZE}"
print_status "Yedekleme raporu: ${BACKUP_DIR}/BACKUP_INFO.md"

# Sıkıştırma seçeneği
read -p "Yedekleme dosyalarını sıkıştırmak istiyor musunuz? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Yedekleme sıkıştırılıyor..."
    tar -czf "${BACKUP_DIR}.tar.gz" "${BACKUP_DIR}"
    rm -rf "${BACKUP_DIR}"
    print_success "Sıkıştırılmış yedekleme: ${BACKUP_DIR}.tar.gz"
fi

print_status "Mac PC'ye taşıma için hazır!"
print_status "Sonraki adımlar:"
print_status "1. Yedekleme dosyalarını Mac PC'ye kopyalayın"
print_status "2. Mac PC'de scripts/mac-setup.sh çalıştırın"
print_status "3. Environment dosyalarını ayarlayın"
print_status "4. Veritabanı yedeklerini geri yükleyin"
