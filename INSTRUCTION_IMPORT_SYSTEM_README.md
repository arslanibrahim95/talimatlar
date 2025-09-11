# Firma Talimat Import Sistemi

Bu sistem, firmaların talimatlarını hızlı ve kolay bir şekilde import etmelerini ve mobil platformlarda optimize edilmiş görüntüleme deneyimi yaşamalarını sağlar.

## 🚀 Özellikler

### 1. Gelişmiş Import Sistemi
- **Drag & Drop Desteği**: Dosyaları sürükleyip bırakarak import edebilirsiniz
- **Çoklu Dosya Seçimi**: Birden fazla dosyayı aynı anda import edebilirsiniz
- **Toplu Import**: Klasör veya zip dosyasından toplu import
- **Şablon Import**: Önceden hazırlanmış şablonlardan import
- **Dosya Türü Validasyonu**: Desteklenen formatlar: PDF, Word, Excel, PowerPoint, Text, Resim
- **Dosya Boyutu Kontrolü**: Maksimum 50MB dosya boyutu sınırı
- **Checksum Doğrulama**: Dosya bütünlüğü için SHA-256 checksum

### 2. Akıllı Metadata Çıkarımı
- **Otomatik Başlık Çıkarımı**: Dosya adından başlık önerisi
- **Güvenlik Anahtar Kelime Analizi**: İçerikteki güvenlik terimlerini tespit eder
- **Risk Seviyesi Hesaplama**: Kritik, yüksek, orta, düşük risk seviyeleri
- **Uyumluluk Etiketleri**: ISO 45001, OHSAS 18001 gibi standartları tespit eder
- **Kategori Önerisi**: İçeriğe göre otomatik kategori önerisi
- **Dil Tespiti**: Otomatik dil tespiti (TR, EN, DE, FR)
- **Özet Oluşturma**: İçerik özeti otomatik oluşturma

### 3. Firma Bazlı Yönetim
- **Firma Profili**: Her firma için ayrı profil ve ayarlar
- **Güvenlik Seviyeleri**: Public, Internal, Confidential, Restricted
- **Departman Bazlı Erişim**: Departmanlara göre talimat erişimi
- **Hedef Kitle Belirleme**: Talimatların hedef kitlesini belirleme
- **Versiyon Kontrolü**: Talimat versiyonlarını takip etme

### 4. Mobil Optimize Görüntüleme
- **Responsive Tasarım**: Tüm cihazlarda mükemmel görüntüleme
- **Touch-Friendly Kontroller**: Mobil cihazlar için optimize edilmiş kontroller
- **Okuma İlerlemesi**: Okuma ilerlemesi takibi ve kaldığınız yerden devam
- **Zoom ve Rotate**: İçerik büyütme ve döndürme özellikleri
- **Tam Ekran Modu**: Tam ekranda görüntüleme
- **QR Kod Desteği**: Hızlı erişim için QR kod oluşturma
- **Offline Desteği**: İnternet bağlantısı olmadan da erişim

### 5. Gelişmiş Medya Desteği
- **PDF Görüntüleme**: PDF dosyalarını doğrudan görüntüleme
- **Resim Galerisi**: Resim dosyalarını galeri modunda görüntüleme
- **Video Oynatıcı**: Video dosyalarını yerleşik oynatıcı ile izleme
- **Ses Oynatıcı**: Ses dosyalarını yerleşik oynatıcı ile dinleme
- **Doküman Önizleme**: Word, Excel, PowerPoint dosyalarını önizleme

## 📋 Desteklenen Dosya Formatları

### Dokümanlar
- **PDF**: .pdf
- **Microsoft Word**: .doc, .docx
- **Metin**: .txt, .rtf

### Tablolar
- **Microsoft Excel**: .xls, .xlsx
- **CSV**: .csv

### Sunumlar
- **Microsoft PowerPoint**: .ppt, .pptx

### Medya
- **Resimler**: .jpg, .jpeg, .png, .gif, .bmp, .webp
- **Videolar**: .mp4, .avi, .mov, .wmv
- **Ses**: .mp3, .wav, .aac

### Arşivler
- **Sıkıştırılmış**: .zip, .rar, .7z

## 🔧 API Endpoints

### Dosya Upload
```http
POST /instructions/upload
Content-Type: multipart/form-data

# Tek dosya upload
```

```http
POST /instructions/bulk-upload
Content-Type: multipart/form-data

# Toplu dosya upload (max 50 dosya)
```

### Firma Talimat Import
```http
POST /instructions/company/import
Content-Type: application/json

{
  "companyId": "company_123",
  "companyName": "ABC İnşaat A.Ş.",
  "companyIndustry": "İnşaat",
  "companySize": "100-500",
  "companyLocation": "İstanbul",
  "importType": "bulk",
  "files": ["file_id_1", "file_id_2"],
  "metadata": {
    "category": "güvenlik",
    "priority": "high"
  }
}
```

### Firma Talimatları Listele
```http
GET /instructions/company/{company_id}?category=güvenlik&status=published&priority=high&search=yangın
```

### Talimat Detayı
```http
GET /instructions/company/{company_id}/{instruction_id}
```

### Talimat Güncelleme
```http
PUT /instructions/company/{company_id}/{instruction_id}
Content-Type: application/json

{
  "title": "Güncellenmiş Başlık",
  "description": "Güncellenmiş açıklama",
  "priority": "critical",
  "status": "approved"
}
```

### İstatistikler
```http
GET /instructions/company/{company_id}/stats
```

## 🎯 Kullanım Örnekleri

### 1. Tek Dosya Import
```typescript
import CompanyInstructionImporter from '../components/CompanyInstructionImporter';

const handleImport = (instructions) => {
  console.log('Import edilen talimatlar:', instructions);
  // Talimatları state'e ekle veya API'ye gönder
};

<CompanyInstructionImporter
  onImport={handleImport}
  onCancel={() => setShowImporter(false)}
  companyId="company_123"
/>
```

### 2. Mobil Görüntüleme
```typescript
import MobileInstructionViewer from '../components/MobileInstructionViewer';

<MobileInstructionViewer
  instruction={selectedInstruction}
  onUpdate={handleUpdateInstruction}
  onDelete={handleDeleteInstruction}
  onDownload={handleDownloadAttachment}
  onShare={handleShareInstruction}
  onBookmark={handleBookmarkInstruction}
/>
```

### 3. Doküman İşleme
```typescript
import { documentProcessor } from '../utils/documentProcessor';

const processFile = async (file) => {
  const processed = await documentProcessor.processDocument(file, {
    extractText: true,
    generateSummary: true,
    assessRisk: true,
    checkCompliance: true
  });
  
  console.log('İşlenen doküman:', processed);
};
```

## 🔒 Güvenlik Özellikleri

### 1. Dosya Güvenliği
- **SHA-256 Checksum**: Dosya bütünlüğü doğrulama
- **Dosya Boyutu Sınırı**: 50MB maksimum
- **Dosya Türü Kontrolü**: Sadece desteklenen formatlar
- **Malware Tarama**: Dosya içeriği güvenlik kontrolü

### 2. Erişim Kontrolü
- **Firma Bazlı İzolasyon**: Her firma kendi verilerine erişir
- **Güvenlik Seviyeleri**: Public, Internal, Confidential, Restricted
- **Departman Bazlı Erişim**: Departmanlara göre kısıtlama
- **Kullanıcı Yetkilendirme**: Rol bazlı erişim kontrolü

### 3. Veri Koruma
- **Şifreleme**: Hassas verilerin şifrelenmesi
- **Yedekleme**: Otomatik veri yedekleme
- **Audit Log**: Tüm işlemlerin loglanması
- **GDPR Uyumluluğu**: Veri koruma standartlarına uyum

## 📊 Risk Seviyesi Hesaplama

### Kritik Risk
- Yangın, patlama, elektrik, kimyasal, gaz, basınç
- Yükseklik, derinlik, makine, tehlikeli, zehirli
- Radyoaktif, patlayıcı, yanıcı, aşındırıcı

### Yüksek Risk
- Güvenlik, prosedür, talimat, acil, kaza, yaralanma
- Koruyucu, donanım, emniyet, risk, tehlike, önlem

### Orta Risk
- Eğitim, bilgilendirme, rehber, kontrol, denetim
- Bakım, işlem, süreç, standart, kalite

### Düşük Risk
- Genel, temel, standart, politika, yönetmelik
- Bilgi, açıklama, tanım, kavram

## 🏷️ Uyumluluk Standartları

### Uluslararası Standartlar
- **ISO 45001**: İş Sağlığı ve Güvenliği Yönetim Sistemi
- **OHSAS 18001**: İş Sağlığı ve Güvenliği Değerlendirme Serisi
- **ISO 14001**: Çevre Yönetim Sistemi
- **ISO 9001**: Kalite Yönetim Sistemi
- **ISO 27001**: Bilgi Güvenliği Yönetim Sistemi
- **ISO 22000**: Gıda Güvenliği Yönetim Sistemi

### Ulusal Standartlar
- **SGK**: Sosyal Güvenlik Kurumu
- **ÇSGB**: Çalışma ve Sosyal Güvenlik Bakanlığı
- **İSG**: İş Sağlığı ve Güvenliği
- **TSE**: Türk Standardları Enstitüsü

### Diğer Standartlar
- **OSHA**: Occupational Safety and Health Administration
- **CE**: Conformité Européenne
- **RoHS**: Restriction of Hazardous Substances
- **REACH**: Registration, Evaluation, Authorisation and Restriction of Chemicals
- **GDPR**: General Data Protection Regulation
- **KVKK**: Kişisel Verilerin Korunması Kanunu

## 🚀 Kurulum ve Çalıştırma

### 1. Gereksinimler
- Node.js 18+
- Python 3.8+
- PostgreSQL 13+
- Redis 6+

### 2. Kurulum
```bash
# Projeyi klonlayın
git clone <repository-url>
cd talimatlar

# Bağımlılıkları yükleyin
npm install
pip install -r requirements.txt

# Veritabanını kurun
python scripts/setup-database.py

# Servisleri başlatın
docker-compose up -d
```

### 3. Geliştirme Ortamı
```bash
# Frontend geliştirme sunucusu
cd frontend
npm run dev

# Backend API sunucusu
cd instruction-service
python main.py

# Tüm servisleri başlat
make dev
```

### 4. Üretim Ortamı
```bash
# Üretim build
make build

# Üretim deploy
make deploy

# Monitoring
make monitor
```

## 📱 Mobil Uygulama

### PWA Desteği
- **Offline Çalışma**: İnternet bağlantısı olmadan erişim
- **Push Notifications**: Yeni talimatlar için bildirim
- **App Install**: Ana ekrana ekleme
- **Background Sync**: Arka planda senkronizasyon

### Native App Özellikleri
- **QR Kod Okuma**: Kamera ile QR kod okuma
- **Dosya Paylaşımı**: Diğer uygulamalarla dosya paylaşımı
- **Biometric Auth**: Parmak izi ve yüz tanıma
- **Offline Storage**: Yerel veri depolama

## 🔧 Konfigürasyon

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/talimatlar
REDIS_URL=redis://localhost:6379

# File Storage
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=52428800  # 50MB
ALLOWED_EXTENSIONS=pdf,doc,docx,txt,rtf,xlsx,pptx,jpg,png

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# External Services
OCR_API_KEY=your-ocr-api-key
TRANSLATION_API_KEY=your-translation-api-key
```

### Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8005
  
  instruction-service:
    build: ./instruction-service
    ports:
      - "8005:8005"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/talimatlar
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=talimatlar
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:6
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 📈 Performans Optimizasyonu

### 1. Dosya İşleme
- **Asenkron İşleme**: Dosyalar arka planda işlenir
- **Queue System**: Redis tabanlı kuyruk sistemi
- **Batch Processing**: Toplu dosya işleme
- **Caching**: İşlenmiş dosyaların önbelleğe alınması

### 2. Veritabanı Optimizasyonu
- **Indexing**: Sık kullanılan alanlar için indeks
- **Connection Pooling**: Veritabanı bağlantı havuzu
- **Query Optimization**: Sorgu optimizasyonu
- **Read Replicas**: Okuma işlemleri için replica

### 3. Frontend Optimizasyonu
- **Code Splitting**: Kod bölme
- **Lazy Loading**: Gecikmeli yükleme
- **Image Optimization**: Resim optimizasyonu
- **CDN**: İçerik dağıtım ağı

## 🧪 Test

### 1. Unit Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd instruction-service
python -m pytest tests/
```

### 2. Integration Tests
```bash
# API tests
npm run test:api

# E2E tests
npm run test:e2e
```

### 3. Performance Tests
```bash
# Load testing
npm run test:load

# Stress testing
npm run test:stress
```

## 📊 Monitoring ve Logging

### 1. Application Monitoring
- **Health Checks**: Servis sağlık kontrolü
- **Metrics**: Performans metrikleri
- **Alerts**: Kritik durumlar için uyarılar
- **Dashboards**: Grafana dashboard'ları

### 2. Logging
- **Structured Logging**: JSON formatında loglar
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Log Aggregation**: ELK Stack ile log toplama
- **Log Rotation**: Log dosyalarının döndürülmesi

### 3. Error Tracking
- **Sentry Integration**: Hata takibi
- **Error Reporting**: Otomatik hata raporlama
- **Stack Traces**: Detaylı hata izleme
- **User Context**: Kullanıcı bağlamı ile hata takibi

## 🔄 Backup ve Recovery

### 1. Veri Yedekleme
- **Automated Backups**: Otomatik yedekleme
- **Incremental Backups**: Artımlı yedekleme
- **Cross-Region Backup**: Bölgeler arası yedekleme
- **Backup Encryption**: Yedekleme şifreleme

### 2. Disaster Recovery
- **RTO**: Recovery Time Objective
- **RPO**: Recovery Point Objective
- **Failover**: Otomatik yedekleme
- **Data Replication**: Veri çoğaltma

## 🚀 Gelecek Geliştirmeler

### 1. AI/ML Özellikleri
- **Smart Categorization**: AI destekli kategori önerisi
- **Content Analysis**: İçerik analizi ve öneriler
- **Risk Prediction**: Risk tahmin algoritmaları
- **Natural Language Processing**: Doğal dil işleme

### 2. Gelişmiş Özellikler
- **Multi-language Support**: Çoklu dil desteği
- **Advanced Search**: Gelişmiş arama özellikleri
- **Workflow Automation**: İş akışı otomasyonu
- **Integration APIs**: Üçüncü parti entegrasyonlar

### 3. Mobile Enhancements
- **AR/VR Support**: Artırılmış/sanal gerçeklik
- **Voice Commands**: Sesli komutlar
- **Gesture Control**: Jest kontrolü
- **Wearable Integration**: Giysi entegrasyonu

## 📞 Destek ve İletişim

### 1. Dokümantasyon
- **API Documentation**: Swagger/OpenAPI
- **User Guide**: Kullanıcı kılavuzu
- **Developer Guide**: Geliştirici kılavuzu
- **FAQ**: Sık sorulan sorular

### 2. Topluluk
- **GitHub Issues**: Hata raporlama
- **Discord**: Topluluk desteği
- **Stack Overflow**: Teknik sorular
- **Blog**: Güncellemeler ve haberler

### 3. Ticari Destek
- **Enterprise Support**: Kurumsal destek
- **Training**: Eğitim programları
- **Consulting**: Danışmanlık hizmetleri
- **Custom Development**: Özel geliştirme

---

Bu sistem, firmaların talimat yönetimini modernize etmelerini ve mobil platformlarda etkili bir şekilde çalışmalarını sağlar. Güvenlik, performans ve kullanıcı deneyimi odaklı tasarımı ile endüstri standartlarını karşılar.
