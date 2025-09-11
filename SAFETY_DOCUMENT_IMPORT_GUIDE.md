# İş Güvenliği Talimatı Import Sistemi

Bu rehber, yeni geliştirilen iş güvenliği talimatı import ve görüntüleme sisteminin nasıl kullanılacağını açıklar.

## 🚀 Özellikler

### 1. Gelişmiş Dosya Import Sistemi
- **Drag & Drop Desteği**: Dosyaları sürükleyip bırakarak import edebilirsiniz
- **Çoklu Dosya Seçimi**: Birden fazla dosyayı aynı anda import edebilirsiniz
- **Dosya Türü Validasyonu**: Desteklenen formatlar: PDF, Word, Excel, PowerPoint, Text, Resim
- **Dosya Boyutu Kontrolü**: Maksimum 50MB dosya boyutu sınırı
- **Checksum Doğrulama**: Dosya bütünlüğü için SHA-256 checksum

### 2. Akıllı Metadata Çıkarımı
- **Otomatik Başlık Çıkarımı**: Dosya adından başlık önerisi
- **Güvenlik Anahtar Kelime Analizi**: İçerikteki güvenlik terimlerini tespit eder
- **Risk Seviyesi Hesaplama**: Kritik, yüksek, orta, düşük risk seviyeleri
- **Uyumluluk Etiketleri**: ISO 45001, OHSAS 18001 gibi standartları tespit eder
- **Kategori Önerisi**: İçeriğe göre otomatik kategori önerisi

### 3. Güvenlik Odaklı Kategoriler
- 🛡️ Genel Güvenlik
- 🚨 Acil Durum Prosedürleri
- ⚙️ Ekipman Güvenliği
- 🧪 Kimyasal Güvenlik
- 🔥 Yangın Güvenliği
- ⚡ Elektrik Güvenliği
- 🏭 İşyeri Güvenliği
- 👷 Kişisel Koruyucu Donanım
- 📚 Eğitim Materyalleri
- 📋 Uyumluluk

### 4. Gelişmiş Doküman Görüntüleyici
- **Çoklu Görüntüleme Modu**: Önizleme, Bilgiler, Geçmiş
- **Tam Ekran Desteği**: Dokümanları tam ekranda görüntüleyin
- **Dosya Önizleme**: PDF, resim ve metin dosyalarını doğrudan görüntüleyin
- **Süre Takibi**: Gözden geçirme tarihlerini takip edin
- **Uyarı Sistemi**: Süresi dolan veya yakında dolacak dokümanlar için uyarılar

## 📋 Kullanım Adımları

### 1. Doküman Import Etme

```typescript
import SafetyDocumentImporter from '../components/SafetyDocumentImporter';

// Import işlemi
const handleImport = (documents: SafetyDocument[]) => {
  console.log('Import edilen dokümanlar:', documents);
  // Dokümanları state'e ekle veya API'ye gönder
};

<SafetyDocumentImporter
  onImport={handleImport}
  onCancel={() => setShowImporter(false)}
/>
```

### 2. Doküman Görüntüleme

```typescript
import SafetyDocumentViewer from '../components/SafetyDocumentViewer';

<SafetyDocumentViewer
  document={selectedDocument}
  onUpdate={handleUpdateDocument}
  onDelete={handleDeleteDocument}
  onDownload={handleDownloadDocument}
  onPrint={handlePrintDocument}
  onShare={handleShareDocument}
/>
```

### 3. Metadata Çıkarımı

```typescript
import { documentMetadataExtractor } from '../utils/documentMetadataExtractor';

const analyzeDocument = async (file: File) => {
  const analysis = await documentMetadataExtractor.extractMetadata(file);
  console.log('Analiz sonucu:', analysis);
  
  // Güvenlik uyumluluğu kontrolü
  const validation = documentMetadataExtractor.validateSafetyCompliance(analysis);
  console.log('Uyumluluk:', validation);
};
```

## 🔧 API Endpoints

### Yeni Eklenen Endpoints

```javascript
// Güvenlik dokümanı upload
POST /api/documents/safety/upload
{
  "title": "Yangın Güvenliği Prosedürleri",
  "description": "İşyerinde yangın güvenliği...",
  "category": "fire-safety",
  "priority": "critical",
  "department": "Güvenlik",
  "effectiveDate": "2024-01-01",
  "reviewDate": "2024-12-31",
  "author": "Güvenlik Uzmanı",
  "version": "2.1",
  "tags": ["yangın", "güvenlik", "prosedür"],
  "metadata": {
    "fileSize": 1024000,
    "fileType": "application/pdf",
    "checksum": "abc123def456"
  }
}

// Toplu upload
POST /api/documents/safety/bulk-upload
{
  "documents": [
    { /* doküman 1 */ },
    { /* doküman 2 */ }
  ]
}

// Metadata analizi
POST /api/documents/analyze
{
  "fileType": "application/pdf",
  "fileSize": 1024000,
  "content": "Doküman içeriği..."
}
```

## 🎯 Demo Sayfası

Demo sayfasını görüntülemek için:

```typescript
import SafetyDocumentDemo from '../pages/SafetyDocumentDemo';

// Route olarak ekleyin
<Route path="/safety-demo" component={SafetyDocumentDemo} />
```

## 📊 Özellik Detayları

### Risk Seviyesi Hesaplama
- **Kritik**: Yangın, patlama, elektrik, kimyasal, gaz, basınç, yükseklik, derinlik, makine
- **Yüksek**: Güvenlik, prosedür, talimat, acil, kaza, yaralanma, koruyucu, donanım
- **Orta**: Eğitim, bilgilendirme, rehber, kontrol, denetim, bakım
- **Düşük**: Genel, temel, standart, politika, yönetmelik

### Uyumluluk Etiketleri
- ISO 45001, OHSAS 18001, ISO 14001, ISO 9001
- SGK, ÇSGB, İSG, OSHA, CE, TSE
- RoHS, REACH, GDPR, KVKK

### Desteklenen Dosya Formatları
- **Dokümanlar**: PDF, DOC, DOCX, TXT, RTF
- **Tablolar**: XLS, XLSX, CSV
- **Sunumlar**: PPT, PPTX
- **Resimler**: JPG, JPEG, PNG, GIF, BMP, WEBP
- **Arşivler**: ZIP, RAR, 7Z

## 🔒 Güvenlik Özellikleri

1. **Dosya Bütünlüğü**: SHA-256 checksum ile doğrulama
2. **Dosya Boyutu Sınırı**: 50MB maksimum
3. **Dosya Türü Kontrolü**: Sadece desteklenen formatlar
4. **Metadata Doğrulama**: Güvenlik uyumluluğu kontrolü
5. **Süre Takibi**: Gözden geçirme tarihleri

## 🚀 Gelecek Geliştirmeler

- [ ] OCR ile PDF içerik çıkarımı
- [ ] AI destekli kategori önerisi
- [ ] Çoklu dil desteği
- [ ] Versiyon kontrolü
- [ ] Onay süreçleri
- [ ] Otomatik bildirimler
- [ ] Raporlama ve analitik

## 📝 Notlar

- Sistem şu anda mock API ile çalışmaktadır
- Gerçek dosya işleme için PDF.js, mammoth.js gibi kütüphaneler eklenebilir
- Metadata çıkarımı için daha gelişmiş kütüphaneler kullanılabilir
- Dosya depolama için AWS S3, Google Cloud Storage gibi servisler entegre edilebilir

Bu sistem, iş güvenliği dokümanlarınızı daha etkili bir şekilde yönetmenizi sağlar ve güvenlik standartlarına uyumluluğunuzu artırır.

