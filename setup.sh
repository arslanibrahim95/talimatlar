#!/bin/bash

echo "🚀 Claude Talimat İş Güvenliği Yönetim Sistemi - Kurulum Scripti"
echo "================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Update system
print_status "Sistem güncelleniyor..."
sudo apt update

# Install basic dependencies
print_status "Temel bağımlılıklar kuruluyor..."
sudo apt install -y curl wget git build-essential

# Install Deno
print_status "Deno kuruluyor..."
curl -fsSL https://deno.land/x/install/install.sh | sh
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"

# Add Deno to PATH permanently
if ! grep -q "DENO_INSTALL" ~/.bashrc; then
    echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
    echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
fi

# Install Python and pip
print_status "Python kuruluyor..."
sudo apt install -y python3 python3-pip python3-venv

# Install Go
print_status "Go kuruluyor..."
sudo apt install -y golang-go

# Add Go to PATH
if ! grep -q "GOPATH" ~/.bashrc; then
    echo 'export GOPATH=$HOME/go' >> ~/.bashrc
    echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
fi

# Install PostgreSQL
print_status "PostgreSQL kuruluyor..."
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
print_status "Redis kuruluyor..."
sudo apt install -y redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Create database and user
print_status "Database oluşturuluyor..."
sudo -u postgres psql -c "CREATE DATABASE safety_production;" 2>/dev/null || print_warning "Database zaten mevcut"
sudo -u postgres psql -c "CREATE USER safety_admin WITH PASSWORD 'strong_password_here';" 2>/dev/null || print_warning "Kullanıcı zaten mevcut"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE safety_production TO safety_admin;" 2>/dev/null

# Test Redis connection
print_status "Redis bağlantısı test ediliyor..."
if redis-cli ping > /dev/null 2>&1; then
    print_status "Redis başarıyla çalışıyor"
else
    print_error "Redis bağlantısı başarısız"
fi

# Create .env file
print_status ".env dosyası oluşturuluyor..."
if [ ! -f .env ]; then
    cp env.example .env
    print_status ".env dosyası oluşturuldu. Lütfen gerekli değerleri düzenleyin."
else
    print_warning ".env dosyası zaten mevcut"
fi

# Install Python dependencies for Document Service
print_status "Document Service Python bağımlılıkları kuruluyor..."
cd services/document-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../..

# Install Python dependencies for Analytics Service
print_status "Analytics Service Python bağımlılıkları kuruluyor..."
cd services/analytics-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../..

# Install Go dependencies for Notification Service
print_status "Notification Service Go bağımlılıkları kuruluyor..."
cd services/notification-service
go mod tidy
cd ../..

# Install frontend dependencies
print_status "Frontend bağımlılıkları kuruluyor..."
cd frontend
npm install
cd ..

# Source bashrc to load new PATH
source ~/.bashrc

echo ""
echo "🎉 Kurulum tamamlandı!"
echo "======================"
echo ""
echo "📋 Sonraki adımlar:"
echo "1. .env dosyasını düzenleyin: nano .env"
echo "2. Gerekli API anahtarlarını ekleyin"
echo "3. Servisleri başlatın: npm run dev"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔐 Auth Service: http://localhost:8001"
echo "📄 Document Service: http://localhost:8002"
echo "📊 Analytics Service: http://localhost:8003"
echo "🔔 Notification Service: http://localhost:8003"
echo ""
echo "📚 Dokümantasyon: README.md dosyasını inceleyin"
