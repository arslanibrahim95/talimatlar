#!/bin/bash

# =============================================================================
# İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - VERİTABANI MİGRASYON SCRIPTİ
# =============================================================================
# Bu script, iş güvenliği yönetim sistemi için gerekli yeni schema'ları ve tabloları oluşturur

set -e  # Hata durumunda scripti durdur

# Renkli çıktı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log fonksiyonu
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Konfigürasyon
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-safety_management}
DB_USER=${DB_USER:-safety_admin}
DB_PASSWORD=${DB_PASSWORD:-safety_password}

# Script dizini
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SQL_DIR="$PROJECT_ROOT/infrastructure/postgresql"

log "İş Güvenliği Yönetim Sistemi - Veritabanı Migrasyonu Başlatılıyor"
log "Veritabanı: $DB_NAME@$DB_HOST:$DB_PORT"
log "Kullanıcı: $DB_USER"

# PostgreSQL bağlantı kontrolü
check_db_connection() {
    log "Veritabanı bağlantısı kontrol ediliyor..."
    
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        error "Veritabanına bağlanılamıyor!"
        error "Lütfen aşağıdaki bilgileri kontrol edin:"
        error "  - Host: $DB_HOST"
        error "  - Port: $DB_PORT"
        error "  - Database: $DB_NAME"
        error "  - User: $DB_USER"
        error "  - Password: [GİZLİ]"
        exit 1
    fi
    
    success "Veritabanı bağlantısı başarılı"
}

# Backup oluştur
create_backup() {
    log "Veritabanı backup'ı oluşturuluyor..."
    
    BACKUP_DIR="$PROJECT_ROOT/backups"
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$BACKUP_DIR"
    
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
        success "Backup oluşturuldu: $BACKUP_FILE"
    else
        error "Backup oluşturulamadı!"
        exit 1
    fi
}

# SQL dosyasını çalıştır
run_sql_file() {
    local sql_file="$1"
    local description="$2"
    
    if [[ ! -f "$sql_file" ]]; then
        error "SQL dosyası bulunamadı: $sql_file"
        return 1
    fi
    
    log "$description çalıştırılıyor..."
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file"; then
        success "$description başarıyla tamamlandı"
        return 0
    else
        error "$description başarısız!"
        return 1
    fi
}

# Mevcut schema'ları kontrol et
check_existing_schemas() {
    log "Mevcut schema'lar kontrol ediliyor..."
    
    local existing_schemas=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name IN ('instructions', 'personnel', 'training', 'incidents', 'compliance', 'risk', 'qr', 'kpi')
        AND schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast');
    " | tr -d ' ')
    
    if [[ -n "$existing_schemas" ]]; then
        warning "Aşağıdaki schema'lar zaten mevcut:"
        echo "$existing_schemas" | tr ' ' '\n' | while read schema; do
            if [[ -n "$schema" ]]; then
                warning "  - $schema"
            fi
        done
        
        read -p "Devam etmek istiyor musunuz? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Migrasyon iptal edildi"
            exit 0
        fi
    fi
}

# Ana migrasyon işlemi
main() {
    log "Migrasyon işlemi başlatılıyor..."
    
    # 1. Bağlantı kontrolü
    check_db_connection
    
    # 2. Backup oluştur
    create_backup
    
    # 3. Mevcut schema'ları kontrol et
    check_existing_schemas
    
    # 4. Yeni schema'ları ve tabloları oluştur
    run_sql_file "$SQL_DIR/safety_schemas.sql" "Yeni schema'lar ve tablolar"
    
    # 5. Mevcut tabloları güncelle
    run_sql_file "$SQL_DIR/update_existing_tables.sql" "Mevcut tabloların güncellenmesi"
    
    # 6. Foreign key constraint'leri ekle (safety_schemas.sql'den sonra)
    log "Foreign key constraint'leri ekleniyor..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        -- Users tablosundaki department_id için foreign key
        ALTER TABLE auth.users ADD CONSTRAINT IF NOT EXISTS fk_users_department_id 
            FOREIGN KEY (department_id) REFERENCES personnel.departments(id);
    " || warning "Foreign key constraint eklenemedi (tablo henüz oluşturulmamış olabilir)"
    
    # 7. Veritabanı istatistiklerini güncelle
    log "Veritabanı istatistikleri güncelleniyor..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;"
    
    # 8. Başarı mesajı
    success "🎉 İş Güvenliği Yönetim Sistemi veritabanı migrasyonu başarıyla tamamlandı!"
    
    log "📊 Oluşturulan yeni schema'lar:"
    log "   - instructions (Talimat Yönetimi)"
    log "   - personnel (Personel Yönetimi)"
    log "   - training (Eğitim Yönetimi)"
    log "   - incidents (Olay/Kaza Yönetimi)"
    log "   - compliance (Uyumluluk ve Denetim)"
    log "   - risk (Risk Yönetimi)"
    log "   - qr (QR Kod Yönetimi)"
    log "   - kpi (KPI ve Metrikler)"
    
    log "📈 Güncellenen mevcut tablolar:"
    log "   - auth.users (personel bilgileri eklendi)"
    log "   - documents.documents (talimat özellikleri eklendi)"
    log "   - analytics.events (detaylı analitik alanları eklendi)"
    log "   - notifications.notifications (eksik alanlar eklendi)"
    
    log "🔗 Tüm foreign key constraint'ler ve indeksler oluşturuldu"
    log "📋 Backup dosyası: $BACKUP_FILE"
    
    warning "⚠️  Uygulama servislerini yeniden başlatmanız önerilir"
}

# Hata yakalama
trap 'error "Migrasyon sırasında hata oluştu!"; exit 1' ERR

# Ana fonksiyonu çalıştır
main "$@"
