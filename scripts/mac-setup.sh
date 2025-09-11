#!/bin/bash

# Mac PC Kurulum Scripti - Claude Talimat Projesi
# Bu script Mac PC'de projeyi çalıştırmak için gerekli kurulumları yapar

set -e

echo "🚀 Claude Talimat Projesi - Mac Kurulum Başlıyor..."

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

# Sistem kontrolü
print_status "Sistem kontrolü yapılıyor..."

# macOS kontrolü
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "Bu script sadece macOS için tasarlanmıştır!"
    exit 1
fi

# Homebrew kontrolü
if ! command -v brew &> /dev/null; then
    print_status "Homebrew kuruluyor..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
    source ~/.zshrc
else
    print_success "Homebrew zaten kurulu"
fi

# Docker kontrolü ve kurulumu
print_status "Docker kontrol ediliyor..."
if ! command -v docker &> /dev/null; then
    print_status "Docker Desktop kuruluyor..."
    brew install --cask docker
    print_warning "Docker Desktop'ı manuel olarak başlatmanız gerekiyor!"
    print_warning "Docker Desktop başlatıldıktan sonra scripti tekrar çalıştırın."
    exit 0
else
    print_success "Docker zaten kurulu"
fi

# Docker çalışıyor mu kontrol et
if ! docker info &> /dev/null; then
    print_error "Docker çalışmıyor! Docker Desktop'ı başlatın ve tekrar deneyin."
    exit 1
fi

# Node.js kurulumu (nvm ile)
print_status "Node.js kurulumu kontrol ediliyor..."
if ! command -v node &> /dev/null; then
    print_status "nvm kuruluyor..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    print_status "Node.js 18 kuruluyor..."
    nvm install 18
    nvm use 18
    nvm alias default 18
else
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_warning "Node.js sürümü 18'den düşük. nvm ile güncelleniyor..."
        if ! command -v nvm &> /dev/null; then
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        fi
        nvm install 18
        nvm use 18
        nvm alias default 18
    else
        print_success "Node.js zaten kurulu ve uygun sürümde"
    fi
fi

# Python kurulumu (pyenv ile)
print_status "Python kurulumu kontrol ediliyor..."
if ! command -v python3.11 &> /dev/null; then
    if ! command -v pyenv &> /dev/null; then
        print_status "pyenv kuruluyor..."
        brew install pyenv
        echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
        echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
        echo 'eval "$(pyenv init -)"' >> ~/.zshrc
        source ~/.zshrc
    fi
    
    print_status "Python 3.11 kuruluyor..."
    pyenv install 3.11.0
    pyenv global 3.11.0
    pyenv rehash
else
    print_success "Python 3.11 zaten kurulu"
fi

# Go kurulumu
print_status "Go kurulumu kontrol ediliyor..."
if ! command -v go &> /dev/null; then
    print_status "Go kuruluyor..."
    brew install go
else
    GO_VERSION=$(go version | cut -d' ' -f3 | cut -d'o' -f2 | cut -d'.' -f1,2)
    print_success "Go zaten kurulu (sürüm: $GO_VERSION)"
fi

# Deno kurulumu
print_status "Deno kurulumu kontrol ediliyor..."
if ! command -v deno &> /dev/null; then
    print_status "Deno kuruluyor..."
    curl -fsSL https://deno.land/install.sh | sh
    echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.zshrc
    source ~/.zshrc
else
    print_success "Deno zaten kurulu"
fi

# Git kurulumu
print_status "Git kurulumu kontrol ediliyor..."
if ! command -v git &> /dev/null; then
    print_status "Git kuruluyor..."
    brew install git
else
    print_success "Git zaten kurulu"
fi

# Proje bağımlılıklarını yükle
print_status "Proje bağımlılıkları yükleniyor..."

# Root package.json
if [ -f "package.json" ]; then
    print_status "Root bağımlılıkları yükleniyor..."
    npm install
fi

# Frontend bağımlılıkları
if [ -d "frontend" ]; then
    print_status "Frontend bağımlılıkları yükleniyor..."
    cd frontend
    npm install
    cd ..
fi

# Backend servisleri
print_status "Backend servisleri kuruluyor..."

# Auth Service (Deno)
if [ -d "services/auth-service" ]; then
    print_status "Auth Service bağımlılıkları yükleniyor..."
    cd services/auth-service
    deno cache --reload deno.json
    cd ../..
fi

# Document Service (Python)
if [ -d "services/document-service" ]; then
    print_status "Document Service bağımlılıkları yükleniyor..."
    cd services/document-service
    python3.11 -m pip install -r requirements.txt
    cd ../..
fi

# Analytics Service (Python)
if [ -d "services/analytics-service" ]; then
    print_status "Analytics Service bağımlılıkları yükleniyor..."
    cd services/analytics-service
    python3.11 -m pip install -r requirements.txt
    cd ../..
fi

# Notification Service (Go)
if [ -d "services/notification-service" ]; then
    print_status "Notification Service bağımlılıkları yükleniyor..."
    cd services/notification-service
    go mod download
    go mod tidy
    cd ../..
fi

# Environment dosyası oluştur
print_status "Environment dosyası oluşturuluyor..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Environment dosyası oluşturuldu (.env.example'dan kopyalandı)"
        print_warning "Lütfen .env dosyasını düzenleyerek gerekli değerleri ayarlayın!"
    else
        print_warning ".env.example dosyası bulunamadı!"
    fi
else
    print_success "Environment dosyası zaten mevcut"
fi

# Docker servislerini başlat
print_status "Docker servisleri başlatılıyor..."
docker-compose up -d

# Servislerin hazır olmasını bekle
print_status "Servislerin hazır olması bekleniyor..."
sleep 30

# Health check
print_status "Servis durumu kontrol ediliyor..."
docker-compose ps

print_success "🎉 Kurulum tamamlandı!"
print_status "Projeyi başlatmak için:"
print_status "  Frontend: npm run dev:frontend"
print_status "  Tüm servisler: npm run dev"
print_status "  Docker servisleri: docker-compose up -d"
print_status ""
print_status "Erişim adresleri:"
print_status "  Frontend: http://localhost:3000"
print_status "  Auth API: http://localhost:8004"
print_status "  Analytics API: http://localhost:8003"
print_status "  Instruction API: http://localhost:8005"
print_status "  AI Service: http://localhost:8006"
print_status "  API Gateway: http://localhost:8080"
print_status "  Grafana: http://localhost:3004"
print_status "  Prometheus: http://localhost:9090"
