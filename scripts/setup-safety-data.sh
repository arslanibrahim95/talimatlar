#!/bin/bash

# =============================================================================
# İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - ÖRNEK VERİ KURULUMU
# =============================================================================
# Bu script, iş güvenliği yönetim sistemi için örnek veriler oluşturur

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

log "İş Güvenliği Yönetim Sistemi - Örnek Veri Kurulumu Başlatılıyor"

# PostgreSQL bağlantı kontrolü
check_db_connection() {
    log "Veritabanı bağlantısı kontrol ediliyor..."
    
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        error "Veritabanına bağlanılamıyor!"
        exit 1
    fi
    
    success "Veritabanı bağlantısı başarılı"
}

# Örnek veri SQL'ini oluştur
create_sample_data_sql() {
    local sql_file="$SQL_DIR/safety_sample_data.sql"
    
    log "Örnek veri SQL dosyası oluşturuluyor: $sql_file"
    
    cat > "$sql_file" << 'EOF'
-- =============================================================================
-- İŞ GÜVENLİĞİ YÖNETİM SİSTEMİ - ÖRNEK VERİLER
-- =============================================================================
-- Bu dosya, iş güvenliği yönetim sistemi için örnek veriler içerir

-- =============================================================================
-- DEPARTMANLAR
-- =============================================================================
INSERT INTO personnel.departments (id, name, code, description, company_id, is_active, created_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440010', 'İnsan Kaynakları', 'IK', 'İnsan kaynakları ve personel yönetimi', '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
    ('550e8400-e29b-41d4-a716-446655440011', 'Güvenlik Müdürlüğü', 'GM', 'İş güvenliği ve çevre yönetimi', '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
    ('550e8400-e29b-41d4-a716-446655440012', 'Kalite Kontrol', 'KK', 'Kalite kontrol ve süreç iyileştirme', '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
    ('550e8400-e29b-41d4-a716-446655440013', 'Üretim', 'URT', 'Üretim operasyonları', '550e8400-e29b-41d4-a716-446655440000', true, NOW()),
    ('550e8400-e29b-41d4-a716-446655440014', 'Bakım', 'BAK', 'Makine ve ekipman bakımı', '550e8400-e29b-41d4-a716-446655440000', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PERSONEL
-- =============================================================================
INSERT INTO personnel.employees (id, user_id, employee_number, department_id, position, hire_date, employment_type, work_location, shift, skills, certifications, emergency_contact, is_active, created_at, updated_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440100', 'EMP001', '550e8400-e29b-41d4-a716-446655440011', 'Güvenlik Müdürü', '2023-01-15', 'full_time', 'Ana Tesis', 'day', ARRAY['İş Güvenliği', 'Risk Değerlendirmesi', 'Eğitim'], '{"safety_certificate": "2024-12-31", "first_aid": "2024-06-30"}', '{"name": "Ayşe Yılmaz", "phone": "+90 555 111 22 33", "relation": "Eş"}', true, NOW(), NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440101', 'EMP002', '550e8400-e29b-41d4-a716-446655440012', 'Kalite Müdürü', '2023-03-01', 'full_time', 'Ana Tesis', 'day', ARRAY['Kalite Kontrol', 'ISO 9001', 'Proses İyileştirme'], '{"iso_9001": "2024-12-31", "quality_auditor": "2024-08-31"}', '{"name": "Mehmet Yılmaz", "phone": "+90 555 222 33 44", "relation": "Kardeş"}', true, NOW(), NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440102', 'EMP003', '550e8400-e29b-41d4-a716-446655440013', 'Üretim Operatörü', '2023-05-15', 'full_time', 'Üretim Hattı', 'day', ARRAY['Üretim', 'Makine Operasyonu', 'Kalite Kontrol'], '{"machine_operator": "2024-12-31"}', '{"name": "Fatma Demir", "phone": "+90 555 333 44 55", "relation": "Eş"}', true, NOW(), NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440103', 'EMP004', '550e8400-e29b-41d4-a716-446655440014', 'Bakım Teknisyeni', '2023-07-01', 'full_time', 'Bakım Atölyesi', 'day', ARRAY['Makine Bakımı', 'Elektrik', 'Hidrolik'], '{"electrical_certificate": "2024-12-31", "maintenance": "2024-09-30"}', '{"name": "Ali Kaya", "phone": "+90 555 444 55 66", "relation": "Baba"}', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Departman yöneticilerini güncelle
UPDATE personnel.departments SET manager_id = '550e8400-e29b-41d4-a716-446655440020' WHERE id = '550e8400-e29b-41d4-a716-446655440011';
UPDATE personnel.departments SET manager_id = '550e8400-e29b-41d4-a716-446655440021' WHERE id = '550e8400-e29b-41d4-a716-446655440012';

-- =============================================================================
-- TALIMATLAR
-- =============================================================================
INSERT INTO instructions.instructions (id, title, content, category_id, company_id, created_by, status, priority, effective_date, expiry_date, version, tags, is_mandatory, quiz_questions, created_at, updated_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440030', 'İş Güvenliği Genel Kuralları', 'Tüm çalışanların uyması gereken temel iş güvenliği kuralları ve prosedürleri...', '550e8400-e29b-41d4-a716-446655440400', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', 'published', 'high', '2024-01-01', '2025-01-01', '2.0', ARRAY['güvenlik', 'genel', 'kurallar'], true, '[
        {
            "question": "İş güvenliği kurallarına uymak kimin sorumluluğundadır?",
            "options": ["Sadece güvenlik müdürü", "Tüm çalışanlar", "Sadece yöneticiler", "Sadece operatörler"],
            "correct_answer": 1
        },
        {
            "question": "Kişisel koruyucu donanım (KKD) kullanımı ne zaman zorunludur?",
            "options": ["Sadece tehlikeli işlerde", "Her zaman", "Sadece gece vardiyasında", "Sadece yeni çalışanlar için"],
            "correct_answer": 1
        }
    ]', NOW(), NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440031', 'Acil Durum Prosedürleri', 'Yangın, deprem ve diğer acil durumlarda uygulanacak prosedürler...', '550e8400-e29b-41d4-a716-446655440400', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', 'published', 'urgent', '2024-01-01', '2025-01-01', '1.5', ARRAY['acil-durum', 'yangın', 'prosedür'], true, '[
        {
            "question": "Yangın alarmı çaldığında ilk yapılması gereken nedir?",
            "options": ["Panik yapmak", "Güvenli alana çıkmak", "Ekipmanları toplamak", "Müdürü aramak"],
            "correct_answer": 1
        }
    ]', NOW(), NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440032', 'Makine Kullanım Talimatları', 'Üretim makinelerinin güvenli kullanımı için talimatlar...', '550e8400-e29b-41d4-a716-446655440400', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', 'published', 'normal', '2024-02-01', '2025-02-01', '1.0', ARRAY['makine', 'kullanım', 'güvenlik'], false, '[
        {
            "question": "Makine çalışırken hangi işlem yasaktır?",
            "options": ["Temizlik", "Bakım", "Ayarlama", "Hepsi"],
            "correct_answer": 3
        }
    ]', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- TALIMAT ATAMALARI
-- =============================================================================
INSERT INTO instructions.instruction_assignments (id, instruction_id, user_id, assigned_by, assigned_at, due_date, status, read_at, completed_at, quiz_score, notes, created_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440100', NOW(), NOW() + INTERVAL '7 days', 'assigned', NULL, NULL, NULL, 'Yeni çalışan eğitimi', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440100', NOW(), NOW() + INTERVAL '3 days', 'assigned', NULL, NULL, NULL, 'Acil durum eğitimi', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440100', NOW(), NOW() + INTERVAL '14 days', 'assigned', NULL, NULL, NULL, 'Makine operatörü eğitimi', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- EĞİTİM PROGRAMLARI
-- =============================================================================
INSERT INTO training.training_programs (id, title, description, category, duration_hours, is_mandatory, validity_period_months, company_id, created_by, is_active, created_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440050', 'Temel İş Güvenliği Eğitimi', 'Yeni çalışanlar için temel iş güvenliği eğitimi', 'Güvenlik', 8, true, 12, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', true, NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440051', 'Yangın Güvenliği Eğitimi', 'Yangın önleme ve söndürme eğitimi', 'Güvenlik', 4, true, 24, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', true, NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440052', 'İlk Yardım Eğitimi', 'Temel ilk yardım bilgileri ve uygulamaları', 'Sağlık', 16, true, 12, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', true, NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440053', 'Makine Operatörü Eğitimi', 'Üretim makinelerinin güvenli kullanımı', 'Teknik', 12, false, 24, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440100', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PERSONEL EĞİTİMLERİ
-- =============================================================================
INSERT INTO training.employee_training (id, employee_id, training_program_id, assigned_date, completed_date, expiry_date, status, score, certificate_url, notes, created_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440050', '2023-01-20', '2023-01-25', '2024-01-25', 'completed', 95, '/certificates/safety_001.pdf', 'Mükemmel performans', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440050', '2023-03-05', '2023-03-10', '2024-03-10', 'completed', 88, '/certificates/safety_002.pdf', 'İyi performans', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440053', '2023-05-20', '2023-06-01', '2025-06-01', 'completed', 92, '/certificates/machine_001.pdf', 'Başarılı tamamlama', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440052', '2023-07-05', NULL, '2024-07-05', 'assigned', NULL, NULL, 'Eğitim bekleniyor', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- RİSK DEĞERLENDİRMELERİ
-- =============================================================================
INSERT INTO risk.risk_assessments (id, assessment_number, title, department_id, location, assessed_by, assessment_date, review_date, risk_level, hazards, control_measures, residual_risk, responsible_person, company_id, status, created_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440070', 'RA-2024-001', 'Üretim Hattı Risk Değerlendirmesi', '550e8400-e29b-41d4-a716-446655440013', 'Üretim Hattı A', '550e8400-e29b-41d4-a716-446655440100', '2024-01-15', '2024-07-15', 'medium', '[
        {"hazard": "Makine çarpması", "probability": "medium", "severity": "high"},
        {"hazard": "Gürültü", "probability": "high", "severity": "medium"},
        {"hazard": "Toz", "probability": "medium", "severity": "medium"}
    ]', 'KKD kullanımı, güvenlik eğitimi, düzenli bakım', 'low', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', 'active', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440071', 'RA-2024-002', 'Bakım Atölyesi Risk Değerlendirmesi', '550e8400-e29b-41d4-a716-446655440014', 'Bakım Atölyesi', '550e8400-e29b-41d4-a716-446655440100', '2024-02-01', '2024-08-01', 'high', '[
        {"hazard": "Elektrik çarpması", "probability": "medium", "severity": "high"},
        {"hazard": "Kimyasal maruziyet", "probability": "low", "severity": "high"},
        {"hazard": "Yüksekten düşme", "probability": "low", "severity": "high"}
    ]', 'Elektrik güvenliği, KKD, güvenlik eğitimi', 'medium', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440000', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- QR KODLAR
-- =============================================================================
INSERT INTO qr.qr_codes (id, code, type, related_id, related_type, location, company_id, is_active, created_by, created_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440080', 'QR-INS-001', 'instruction', '550e8400-e29b-41d4-a716-446655440030', 'instructions.instructions', 'Üretim Hattı A - Giriş', '550e8400-e29b-41d4-a716-446655440000', true, '550e8400-e29b-41d4-a716-446655440100', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440081', 'QR-INS-002', 'instruction', '550e8400-e29b-41d4-a716-446655440031', 'instructions.instructions', 'Acil Çıkış Kapısı', '550e8400-e29b-41d4-a716-446655440000', true, '550e8400-e29b-41d4-a716-446655440100', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440082', 'QR-EQP-001', 'equipment', '550e8400-e29b-41d4-a716-446655440090', 'equipment', 'Üretim Makinesi #1', '550e8400-e29b-41d4-a716-446655440000', true, '550e8400-e29b-41d4-a716-446655440100', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- KPI METRİKLERİ
-- =============================================================================
INSERT INTO kpi.safety_metrics (id, metric_name, metric_type, value, unit, period_start, period_end, department_id, company_id, target_value, actual_value, status, created_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440090', 'İş Kazası Sayısı', 'lagging', 2, 'adet', '2024-01-01', '2024-01-31', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', 0, 2, 'above_target', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440091', 'Eğitim Tamamlama Oranı', 'leading', 85, '%', '2024-01-01', '2024-01-31', NULL, '550e8400-e29b-41d4-a716-446655440000', 90, 85, 'below_target', NOW()),
    
    ('550e8400-e29b-41d4-a716-446655440092', 'Risk Değerlendirme Sayısı', 'leading', 5, 'adet', '2024-01-01', '2024-01-31', NULL, '550e8400-e29b-41d4-a716-446655440000', 4, 5, 'above_target', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- BAŞARILI KURULUM MESAJI
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ İş güvenliği yönetim sistemi örnek verileri başarıyla oluşturuldu!';
    RAISE NOTICE '📊 Oluşturulan veriler:';
    RAISE NOTICE '   - % departman', (SELECT COUNT(*) FROM personnel.departments);
    RAISE NOTICE '   - % personel', (SELECT COUNT(*) FROM personnel.employees);
    RAISE NOTICE '   - % talimat', (SELECT COUNT(*) FROM instructions.instructions);
    RAISE NOTICE '   - % talimat ataması', (SELECT COUNT(*) FROM instructions.instruction_assignments);
    RAISE NOTICE '   - % eğitim programı', (SELECT COUNT(*) FROM training.training_programs);
    RAISE NOTICE '   - % personel eğitimi', (SELECT COUNT(*) FROM training.employee_training);
    RAISE NOTICE '   - % risk değerlendirmesi', (SELECT COUNT(*) FROM risk.risk_assessments);
    RAISE NOTICE '   - % QR kod', (SELECT COUNT(*) FROM qr.qr_codes);
    RAISE NOTICE '   - % KPI metrik', (SELECT COUNT(*) FROM kpi.safety_metrics);
END $$;
EOF

    success "Örnek veri SQL dosyası oluşturuldu: $sql_file"
}

# Ana işlem
main() {
    log "Örnek veri kurulumu başlatılıyor..."
    
    # 1. Bağlantı kontrolü
    check_db_connection
    
    # 2. Örnek veri SQL'ini oluştur
    create_sample_data_sql
    
    # 3. SQL dosyasını çalıştır
    log "Örnek veriler veritabanına yükleniyor..."
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_DIR/safety_sample_data.sql"; then
        success "🎉 Örnek veriler başarıyla yüklendi!"
        
        log "📊 Yüklenen örnek veriler:"
        log "   - 5 departman"
        log "   - 4 personel kaydı"
        log "   - 3 talimat"
        log "   - 3 talimat ataması"
        log "   - 4 eğitim programı"
        log "   - 4 personel eğitimi"
        log "   - 2 risk değerlendirmesi"
        log "   - 3 QR kod"
        log "   - 3 KPI metrik"
        
        log "🔗 Test için kullanılabilecek veriler:"
        log "   - Talimatlar: İş Güvenliği Genel Kuralları, Acil Durum Prosedürleri"
        log "   - Eğitimler: Temel İş Güvenliği, Yangın Güvenliği, İlk Yardım"
        log "   - Risk Değerlendirmeleri: Üretim Hattı, Bakım Atölyesi"
        log "   - QR Kodlar: Talimat ve ekipman kodları"
        
    else
        error "Örnek veriler yüklenemedi!"
        exit 1
    fi
}

# Hata yakalama
trap 'error "Örnek veri kurulumu sırasında hata oluştu!"; exit 1' ERR

# Ana fonksiyonu çalıştır
main "$@"
