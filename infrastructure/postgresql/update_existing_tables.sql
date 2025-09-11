-- =============================================================================
-- MEVCUT TABLOLARA YENİ ALANLAR EKLEME
-- =============================================================================
-- Bu dosya, mevcut tablolara iş güvenliği yönetim sistemi için gerekli alanları ekler

-- =============================================================================
-- AUTH.USERS TABLOSUNA EKLENMESİ GEREKEN ALANLAR
-- =============================================================================

-- Personel bilgileri için alanlar
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS employee_number VARCHAR(50);
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS emergency_contact JSONB;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS certifications JSONB;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_users_employee_number ON auth.users(employee_number);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON auth.users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_position ON auth.users(position);

-- =============================================================================
-- DOCUMENTS.DOCUMENTS TABLOSUNA EKLENMESİ GEREKEN ALANLAR
-- =============================================================================

-- Talimat özellikleri için alanlar
ALTER TABLE documents.documents ADD COLUMN IF NOT EXISTS instruction_type VARCHAR(50);
ALTER TABLE documents.documents ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE documents.documents ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE documents.documents ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE documents.documents ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0';
ALTER TABLE documents.documents ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false;
ALTER TABLE documents.documents ADD COLUMN IF NOT EXISTS quiz_questions JSONB;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_documents_instruction_type ON documents.documents(instruction_type);
CREATE INDEX IF NOT EXISTS idx_documents_priority ON documents.documents(priority);
CREATE INDEX IF NOT EXISTS idx_documents_effective_date ON documents.documents(effective_date);
CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON documents.documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_documents_is_mandatory ON documents.documents(is_mandatory);

-- =============================================================================
-- ANALYTICS.EVENTS TABLOSUNA EKLENMESİ GEREKEN ALANLAR
-- =============================================================================

-- Detaylı analitik veriler için alanlar
ALTER TABLE analytics.events ADD COLUMN IF NOT EXISTS instruction_id UUID;
ALTER TABLE analytics.events ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE analytics.events ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE analytics.events ADD COLUMN IF NOT EXISTS device_type VARCHAR(50);
ALTER TABLE analytics.events ADD COLUMN IF NOT EXISTS session_duration INTEGER;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_events_instruction_id ON analytics.events(instruction_id);
CREATE INDEX IF NOT EXISTS idx_events_department_id ON analytics.events(department_id);
CREATE INDEX IF NOT EXISTS idx_events_location ON analytics.events(location);
CREATE INDEX IF NOT EXISTS idx_events_device_type ON analytics.events(device_type);

-- =============================================================================
-- ANALYTICS.USER_ACTIVITY TABLOSUNA EKLENMESİ GEREKEN ALANLAR
-- =============================================================================

-- Eksik alanları ekle (eğer yoksa)
ALTER TABLE analytics.user_activity ADD COLUMN IF NOT EXISTS search_count INTEGER DEFAULT 0;
ALTER TABLE analytics.user_activity ADD COLUMN IF NOT EXISTS upload_count INTEGER DEFAULT 0;

-- =============================================================================
-- ANALYTICS.COMPANY_METRICS TABLOSUNA EKLENMESİ GEREKEN ALANLAR
-- =============================================================================

-- Eksik alanları ekle (eğer yoksa)
ALTER TABLE analytics.company_metrics ADD COLUMN IF NOT EXISTS total_users INTEGER DEFAULT 0;
ALTER TABLE analytics.company_metrics ADD COLUMN IF NOT EXISTS total_downloads INTEGER DEFAULT 0;
ALTER TABLE analytics.company_metrics ADD COLUMN IF NOT EXISTS total_uploads INTEGER DEFAULT 0;

-- =============================================================================
-- NOTIFICATIONS.NOTIFICATIONS TABLOSUNA EKLENMESİ GEREKEN ALANLAR
-- =============================================================================

-- Eksik alanları ekle (eğer yoksa)
ALTER TABLE notifications.notifications ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES auth.companies(id);
ALTER TABLE notifications.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications.notifications ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE notifications.notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications.notifications(company_id);

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Users tablosundaki department_id için foreign key (personnel.departments oluşturulduktan sonra)
-- Bu constraint'i safety_schemas.sql çalıştırıldıktan sonra ekleyin
-- ALTER TABLE auth.users ADD CONSTRAINT fk_users_department_id 
--     FOREIGN KEY (department_id) REFERENCES personnel.departments(id);

-- Events tablosundaki instruction_id için foreign key
ALTER TABLE analytics.events ADD CONSTRAINT fk_events_instruction_id 
    FOREIGN KEY (instruction_id) REFERENCES instructions.instructions(id);

-- Events tablosundaki department_id için foreign key
ALTER TABLE analytics.events ADD CONSTRAINT fk_events_department_id 
    FOREIGN KEY (department_id) REFERENCES personnel.departments(id);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Notifications tablosu için updated_at trigger'ı
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications.notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SAMPLE DATA FOR NEW FIELDS
-- =============================================================================

-- Mevcut kullanıcılara örnek personel bilgileri ekle
UPDATE auth.users SET 
    employee_number = 'EMP001',
    position = 'Güvenlik Müdürü',
    hire_date = '2023-01-15',
    emergency_contact = '{"name": "Ayşe Yılmaz", "phone": "+90 555 111 22 33", "relation": "Eş"}',
    skills = ARRAY['İş Güvenliği', 'Risk Değerlendirmesi', 'Eğitim'],
    certifications = '{"safety_certificate": "2024-12-31", "first_aid": "2024-06-30"}'
WHERE email = 'admin@orneksirket.com';

UPDATE auth.users SET 
    employee_number = 'EMP002',
    position = 'Kalite Müdürü',
    hire_date = '2023-03-01',
    emergency_contact = '{"name": "Mehmet Yılmaz", "phone": "+90 555 222 33 44", "relation": "Kardeş"}',
    skills = ARRAY['Kalite Kontrol', 'ISO 9001', 'Proses İyileştirme'],
    certifications = '{"iso_9001": "2024-12-31", "quality_auditor": "2024-08-31"}'
WHERE email = 'ahmet.yilmaz@orneksirket.com';

-- Mevcut dokümanlara örnek talimat bilgileri ekle
UPDATE documents.documents SET 
    instruction_type = 'safety_procedure',
    priority = 'high',
    effective_date = '2024-01-01',
    expiry_date = '2025-01-01',
    version = '2.1',
    is_mandatory = true,
    quiz_questions = '[
        {
            "question": "Acil durum prosedürlerinde ilk yapılması gereken nedir?",
            "options": ["Panik yapmak", "Güvenli alana çıkmak", "Ekipmanları toplamak", "Müdürü aramak"],
            "correct_answer": 1
        },
        {
            "question": "İş kazası durumunda kim bilgilendirilmelidir?",
            "options": ["Sadece müdür", "Güvenlik müdürü ve İK", "Sadece İK", "Kimse"],
            "correct_answer": 1
        }
    ]'
WHERE title LIKE '%Güvenlik Protokolü%';

UPDATE documents.documents SET 
    instruction_type = 'quality_procedure',
    priority = 'normal',
    effective_date = '2024-02-01',
    expiry_date = '2025-02-01',
    version = '1.5',
    is_mandatory = false,
    quiz_questions = '[
        {
            "question": "Kalite kontrol sürecinde hangi adım önceliklidir?",
            "options": ["Üretim", "Kontrol", "Paketleme", "Sevkiyat"],
            "correct_answer": 1
        }
    ]'
WHERE title LIKE '%Kalite Kontrol%';

-- =============================================================================
-- BAŞARILI GÜNCELLEME MESAJI
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Mevcut tablolar başarıyla güncellendi!';
    RAISE NOTICE '📊 Eklenen alanlar:';
    RAISE NOTICE '   - auth.users: personel bilgileri alanları';
    RAISE NOTICE '   - documents.documents: talimat özellikleri alanları';
    RAISE NOTICE '   - analytics.events: detaylı analitik alanları';
    RAISE NOTICE '   - notifications.notifications: eksik alanlar';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Foreign key constraint''ler eklendi';
    RAISE NOTICE '📈 İndeksler oluşturuldu';
    RAISE NOTICE '🎯 Örnek veriler eklendi';
END $$;

-- =============================================================================
-- END OF UPDATE EXISTING TABLES SCRIPT
-- =============================================================================
