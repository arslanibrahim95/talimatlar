# 🚨 İş Güvenliği Yönetim Sistemi - Veritabanı Migrasyon Rehberi

Bu rehber, mevcut veritabanına iş güvenliği yönetim sistemi için gerekli yeni schema'ları ve tabloları ekleme sürecini açıklar.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Yeni Schema'lar](#yeni-schemalar)
3. [Mevcut Tablolara Eklenen Alanlar](#mevcut-tablolara-eklenen-alanlar)
4. [Migrasyon Adımları](#migrasyon-adımları)
5. [Örnek Veri Kurulumu](#örnek-veri-kurulumu)
6. [Güvenlik ve Backup](#güvenlik-ve-backup)
7. [Sorun Giderme](#sorun-giderme)

## 🎯 Genel Bakış

Bu migrasyon, mevcut sisteminize aşağıdaki yeni özellikleri ekler:

- **📋 Talimat Yönetimi** - Talimatların oluşturulması, atanması ve takibi
- **👥 Personel Yönetimi** - Departmanlar ve personel bilgileri
- **🎓 Eğitim Yönetimi** - Eğitim programları ve personel eğitimleri
- **⚠️ Olay/Kaza Yönetimi** - İş kazaları ve olayların takibi
- **📊 Uyumluluk ve Denetim** - Yönetmelikler ve denetimler
- **🔍 Risk Yönetimi** - Risk değerlendirmeleri ve kontrol önlemleri
- **📱 QR Kod Sistemi** - QR kodlar ile hızlı erişim
- **📈 KPI ve Metrikler** - Güvenlik performans göstergeleri

## 🗂️ Yeni Schema'lar

### 1. **instructions** - Talimat Yönetimi
```sql
- instructions.instructions (Talimatlar)
- instructions.instruction_assignments (Talimat Atamaları)
- instructions.instruction_templates (Talimat Şablonları)
- instructions.instruction_versions (Talimat Versiyonları)
```

### 2. **personnel** - Personel Yönetimi
```sql
- personnel.departments (Departmanlar)
- personnel.employees (Personel)
```

### 3. **training** - Eğitim Yönetimi
```sql
- training.training_programs (Eğitim Programları)
- training.employee_training (Personel Eğitimleri)
- training.training_sessions (Eğitim Oturumları)
- training.session_participants (Eğitim Katılımcıları)
```

### 4. **incidents** - Olay/Kaza Yönetimi
```sql
- incidents.incidents (Olaylar/Kazalar)
- incidents.incident_status_history (Olay Durum Geçmişi)
```

### 5. **compliance** - Uyumluluk ve Denetim
```sql
- compliance.regulations (Yönetmelikler)
- compliance.audits (Denetimler)
- compliance.compliance_checks (Uyumluluk Kontrolleri)
```

### 6. **risk** - Risk Yönetimi
```sql
- risk.risk_assessments (Risk Değerlendirmeleri)
- risk.control_measures (Risk Kontrol Önlemleri)
```

### 7. **qr** - QR Kod Yönetimi
```sql
- qr.qr_codes (QR Kodlar)
- qr.qr_usage_logs (QR Kod Kullanım Logları)
```

### 8. **kpi** - KPI ve Metrikler
```sql
- kpi.safety_metrics (Güvenlik Metrikleri)
- kpi.kpi_targets (KPI Hedefleri)
```

## 🔄 Mevcut Tablolara Eklenen Alanlar

### **auth.users** tablosuna eklenen alanlar:
```sql
- employee_number VARCHAR(50) - Personel numarası
- department_id UUID - Departman ID'si
- position VARCHAR(100) - Pozisyon
- hire_date DATE - İşe giriş tarihi
- emergency_contact JSONB - Acil durum iletişim bilgileri
- skills TEXT[] - Yetenekler
- certifications JSONB - Sertifikalar
```

### **documents.documents** tablosuna eklenen alanlar:
```sql
- instruction_type VARCHAR(50) - Talimat türü
- priority VARCHAR(20) - Öncelik
- effective_date DATE - Geçerlilik başlangıç tarihi
- expiry_date DATE - Geçerlilik bitiş tarihi
- version VARCHAR(20) - Versiyon
- is_mandatory BOOLEAN - Zorunlu mu?
- quiz_questions JSONB - Quiz soruları
```

### **analytics.events** tablosuna eklenen alanlar:
```sql
- instruction_id UUID - Talimat ID'si
- department_id UUID - Departman ID'si
- location VARCHAR(255) - Konum
- device_type VARCHAR(50) - Cihaz türü
- session_duration INTEGER - Oturum süresi
```

## 🚀 Migrasyon Adımları

### 1. **Ön Hazırlık**
```bash
# Veritabanı bağlantı bilgilerini kontrol edin
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=safety_management
export DB_USER=safety_admin
export DB_PASSWORD=safety_password
```

### 2. **Migrasyon Scriptini Çalıştırın**
```bash
# Ana migrasyon scriptini çalıştırın
./scripts/migrate-safety-schemas.sh
```

Bu script:
- ✅ Veritabanı bağlantısını kontrol eder
- 💾 Otomatik backup oluşturur
- 🗂️ Yeni schema'ları ve tabloları oluşturur
- 🔄 Mevcut tabloları günceller
- 🔗 Foreign key constraint'leri ekler
- 📊 İndeksleri oluşturur

### 3. **Örnek Veri Kurulumu (Opsiyonel)**
```bash
# Test ve geliştirme için örnek veriler
./scripts/setup-safety-data.sh
```

## 📊 Örnek Veri Kurulumu

Örnek veri scripti aşağıdaki verileri oluşturur:

- **5 Departman**: İK, Güvenlik, Kalite, Üretim, Bakım
- **4 Personel**: Güvenlik Müdürü, Kalite Müdürü, Operatör, Teknisyen
- **3 Talimat**: İş Güvenliği Kuralları, Acil Durum, Makine Kullanımı
- **4 Eğitim Programı**: Temel Güvenlik, Yangın, İlk Yardım, Makine
- **2 Risk Değerlendirmesi**: Üretim Hattı, Bakım Atölyesi
- **3 QR Kod**: Talimat ve ekipman kodları
- **3 KPI Metrik**: Kazalar, Eğitim, Risk Değerlendirmeleri

## 🔒 Güvenlik ve Backup

### **Otomatik Backup**
Migrasyon scripti otomatik olarak backup oluşturur:
```
backups/backup_YYYYMMDD_HHMMSS.sql
```

### **Manuel Backup (Önerilen)**
```bash
# Manuel backup oluşturun
pg_dump -h localhost -U safety_admin -d safety_management > backup_manual.sql
```

### **Rollback (Geri Alma)**
```bash
# Backup'tan geri yükleme
psql -h localhost -U safety_admin -d safety_management < backup_manual.sql
```

## 🔧 Sorun Giderme

### **Bağlantı Sorunları**
```bash
# Veritabanı servisini kontrol edin
sudo systemctl status postgresql

# Bağlantıyı test edin
psql -h localhost -U safety_admin -d safety_management -c "SELECT 1;"
```

### **Schema Çakışması**
Eğer schema'lar zaten mevcutsa:
```bash
# Mevcut schema'ları kontrol edin
psql -h localhost -U safety_admin -d safety_management -c "
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN ('instructions', 'personnel', 'training', 'incidents', 'compliance', 'risk', 'qr', 'kpi');
"
```

### **Foreign Key Hataları**
```bash
# Foreign key constraint'leri kontrol edin
psql -h localhost -U safety_admin -d safety_management -c "
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint 
WHERE contype = 'f' AND confrelid::regclass::text LIKE '%personnel%';
"
```

### **İndeks Sorunları**
```bash
# İndeksleri kontrol edin
psql -h localhost -U safety_admin -d safety_management -c "
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname IN ('instructions', 'personnel', 'training', 'incidents', 'compliance', 'risk', 'qr', 'kpi');
"
```

## 📈 Performans Optimizasyonu

### **İndeksler**
Tüm kritik alanlar için indeksler oluşturulmuştur:
- Foreign key'ler
- Sık kullanılan filtreleme alanları
- Tarih alanları
- Durum alanları

### **İstatistikler**
```bash
# Veritabanı istatistiklerini güncelleyin
psql -h localhost -U safety_admin -d safety_management -c "ANALYZE;"
```

## 🎯 Sonraki Adımlar

Migrasyon tamamlandıktan sonra:

1. **Uygulama Servislerini Yeniden Başlatın**
   ```bash
   docker-compose restart
   ```

2. **API Endpoint'lerini Güncelleyin**
   - Yeni tablolar için API endpoint'leri ekleyin
   - Frontend'i yeni alanlarla güncelleyin

3. **Test Edin**
   - Yeni özellikleri test edin
   - Veri bütünlüğünü kontrol edin
   - Performansı ölçün

4. **Dokümantasyonu Güncelleyin**
   - API dokümantasyonunu güncelleyin
   - Kullanıcı rehberini güncelleyin

## 📞 Destek

Sorun yaşarsanız:

1. **Log'ları kontrol edin**: `logs/` dizinindeki log dosyalarını inceleyin
2. **Veritabanı durumunu kontrol edin**: Connection ve query log'larını inceleyin
3. **Backup'tan geri yükleyin**: Gerekirse önceki duruma dönün

---

**⚠️ Önemli Not**: Bu migrasyon production ortamında çalıştırılmadan önce mutlaka test ortamında denenmelidir!
