#!/bin/bash

# Claude Talimat İş Güvenliği Yönetim Sistemi - Kurulum Scripti
# Bu script sistemi kurmak ve yapılandırmak için kullanılır

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log fonksiyonları
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Sistem kontrolü
check_system() {
    log_info "Sistem gereksinimleri kontrol ediliyor..."
    
    # Docker kontrolü
    if ! command -v docker &> /dev/null; then
        log_error "Docker bulunamadı. Lütfen Docker'ı yükleyin."
        exit 1
    fi
    
    # Docker Compose kontrolü
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose bulunamadı. Lütfen Docker Compose'u yükleyin."
        exit 1
    fi
    
    # Git kontrolü
    if ! command -v git &> /dev/null; then
        log_error "Git bulunamadı. Lütfen Git'i yükleyin."
        exit 1
    fi
    
    log_success "Sistem gereksinimleri karşılanıyor."
}

# Environment dosyası oluşturma
create_env_file() {
    log_info "Environment dosyası oluşturuluyor..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# Claude Talimat System Environment Variables

# Application Settings
NODE_ENV=development
DEBUG=true

# Database Settings
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=safety_production
POSTGRES_USER=safety_admin
POSTGRES_PASSWORD=strong_password_here
DATABASE_URL=postgresql://safety_admin:strong_password_here@localhost:5432/safety_production

# Redis Settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379

# JWT Settings
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION=86400
JWT_REFRESH_EXPIRATION=604800

# MeiliSearch Settings
MEILISEARCH_HOST=localhost
MEILISEARCH_PORT=7700
MEILISEARCH_KEY=masterKey123456789
MEILISEARCH_URL=http://localhost:7700

# MinIO Settings
MINIO_HOST=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=claude-documents
MINIO_USE_SSL=false

# Email Settings (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@claude-talimat.com
SMTP_TLS=true

# SMS Settings (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-number

# Service Ports
AUTH_SERVICE_PORT=8001
DOCUMENT_SERVICE_PORT=8002
ANALYTICS_SERVICE_PORT=8003
NOTIFICATION_SERVICE_PORT=8004
FRONTEND_PORT=3000
NGINX_PORT=80

# Security Settings
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Settings
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png

# Monitoring Settings
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# Development Settings
LOG_LEVEL=INFO
ENABLE_SWAGGER=true
ENABLE_METRICS=true
EOF
        log_success "Environment dosyası oluşturuldu."
    else
        log_warning "Environment dosyası zaten mevcut."
    fi
}

# Docker network oluşturma
create_docker_network() {
    log_info "Docker network oluşturuluyor..."
    
    if ! docker network ls | grep -q claude-talimat; then
        docker network create claude-talimat
        log_success "Docker network oluşturuldu."
    else
        log_warning "Docker network zaten mevcut."
    fi
}

# Veritabanı başlatma
start_database() {
    log_info "Veritabanı servisleri başlatılıyor..."
    
    docker-compose up -d postgres redis meilisearch minio
    
    # PostgreSQL'nin hazır olmasını bekle
    log_info "PostgreSQL'nin başlaması bekleniyor..."
    sleep 10
    
    # Veritabanı bağlantısını test et
    until docker-compose exec -T postgres pg_isready -U safety_admin; do
        log_info "PostgreSQL başlatılıyor..."
        sleep 2
    done
    
    log_success "Veritabanı servisleri başlatıldı."
}

# Microservice'leri başlatma
start_microservices() {
    log_info "Microservice'ler başlatılıyor..."
    
    docker-compose up -d auth-service document-service analytics-service notification-service
    
    log_success "Microservice'ler başlatıldı."
}

# Frontend başlatma
start_frontend() {
    log_info "Frontend başlatılıyor..."
    
    # Frontend dependencies'lerini yükle
    if [ ! -d "frontend/node_modules" ]; then
        log_info "Frontend dependencies yükleniyor..."
        cd frontend
        npm install
        cd ..
    fi
    
    # Frontend'i development modunda başlat
    cd frontend
    npm run dev &
    cd ..
    
    log_success "Frontend başlatıldı."
}

# Nginx başlatma
start_nginx() {
    log_info "Nginx başlatılıyor..."
    
    docker-compose up -d nginx
    
    log_success "Nginx başlatıldı."
}

# Monitoring başlatma
start_monitoring() {
    log_info "Monitoring servisleri başlatılıyor..."
    
    docker-compose up -d prometheus grafana
    
    log_success "Monitoring servisleri başlatıldı."
}

# Sistem durumu kontrolü
check_system_status() {
    log_info "Sistem durumu kontrol ediliyor..."
    
    # Servislerin durumunu kontrol et
    docker-compose ps
    
    # Health check'leri yap
    log_info "Health check'ler yapılıyor..."
    
    # Auth Service
    if curl -f http://localhost:8001/health > /dev/null 2>&1; then
        log_success "Auth Service çalışıyor"
    else
        log_error "Auth Service çalışmıyor"
    fi
    
    # Document Service
    if curl -f http://localhost:8002/health > /dev/null 2>&1; then
        log_success "Document Service çalışıyor"
    else
        log_error "Document Service çalışmıyor"
    fi
    
    # Analytics Service
    if curl -f http://localhost:8003/health > /dev/null 2>&1; then
        log_success "Analytics Service çalışıyor"
    else
        log_error "Analytics Service çalışmıyor"
    fi
    
    # Notification Service
    if curl -f http://localhost:8004/health > /dev/null 2>&1; then
        log_success "Notification Service çalışıyor"
    else
        log_error "Notification Service çalışmıyor"
    fi
    
    # Nginx
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "Nginx çalışıyor"
    else
        log_error "Nginx çalışmıyor"
    fi
}

# Ana kurulum fonksiyonu
main() {
    log_info "Claude Talimat İş Güvenliği Yönetim Sistemi kurulumu başlatılıyor..."
    
    check_system
    create_env_file
    create_docker_network
    start_database
    start_microservices
    start_nginx
    start_monitoring
    
    # Frontend'i ayrı bir süreçte başlat
    start_frontend
    
    # Biraz bekle ve durumu kontrol et
    sleep 5
    check_system_status
    
    log_success "Kurulum tamamlandı!"
    log_info "Sistem erişim bilgileri:"
    log_info "  - Frontend: http://localhost:3000"
    log_info "  - API Gateway: http://localhost"
    log_info "  - Grafana: http://localhost:3001 (admin/admin)"
    log_info "  - Prometheus: http://localhost:9090"
    log_info "  - MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"
    log_info "  - MeiliSearch: http://localhost:7700"
}

# Script'i çalıştır
main "$@"
