# QR Kod Sistemi - Talimat Görüntüleme

Bu dokümantasyon, talimat görüntüleme sistemi için geliştirilen QR kod özelliklerini açıklamaktadır.

## 🎯 Genel Bakış

QR kod sistemi, çalışanların talimatlara hızlı ve kolay erişimini sağlamak için tasarlanmıştır. Sistem şu özellikleri içerir:

- **QR Kod Oluşturma**: Her talimat için benzersiz QR kod
- **Mobil Tarama**: Kamera ile QR kod tarama
- **Erişim Takibi**: QR kod tarama logları ve istatistikler
- **Mobil Uyumlu**: Responsive tasarım ve mobil optimizasyon

## 🏗️ Sistem Mimarisi

### Backend Servisleri

#### 1. Instruction Service (`instruction-service/main.ts`)
- QR kod CRUD işlemleri
- Tarama logları
- İstatistikler
- Şablon yönetimi

#### 2. QR Kod Endpoints
```typescript
POST /qr-codes                    // QR kod oluştur
GET /qr-codes/:instructionId      // QR kod getir
POST /qr-codes/:qrCodeId/scan     // Tarama logu
GET /qr-codes/:instructionId/access-logs  // Erişim logları
GET /qr-codes/:instructionId/stats        // İstatistikler
PUT /qr-codes/:qrCodeId/deactivate        // Devre dışı bırak
PUT /qr-codes/:qrCodeId/activate          // Etkinleştir
PUT /qr-codes/:qrCodeId/extend            // Süre uzat
POST /qr-codes/bulk                       // Toplu oluştur
GET /qr-codes/templates                   // Şablonlar
GET /qr-codes/:instructionId/preview      // Önizleme
```

### Frontend Bileşenleri

#### 1. QR Code Manager (`QRCodeManager.tsx`)
- QR kod oluşturma ve yönetimi
- Süre ayarları
- Durum kontrolü (aktif/pasif)
- İndirme ve kopyalama

#### 2. QR Code Scanner (`QRCodeScanner.tsx`)
- Kamera erişimi
- QR kod tarama
- Hata yönetimi
- Mobil optimizasyon

#### 3. Mobile Instruction Viewer (`MobileInstructionViewer.tsx`)
- Mobil uyumlu talimat görüntüleme
- Dark mode desteği
- Font boyutu ayarları
- QR kod entegrasyonu

#### 4. Mobile Home (`MobileHome.tsx`)
- Mobil ana sayfa
- Hızlı erişim
- Son talimatlar
- Arama fonksiyonu

## 📱 Kullanım Senaryoları

### 1. QR Kod Oluşturma
```typescript
// QR kod oluştur
const qrCode = await qrCodeService.generateQRCode(instructionId, {
  expiresAt: '2024-12-31T23:59:59Z',
  customUrl: 'https://custom-domain.com/instruction/123'
});
```

### 2. QR Kod Tarama
```typescript
// Tarama başlat
<QRCodeScanner
  onScanSuccess={(result) => {
    // Talimat sayfasına yönlendir
    navigate(`/mobile/instructions/${instructionId}`);
  }}
  onScanError={(error) => console.error(error)}
/>
```

### 3. Erişim Takibi
```typescript
// Tarama logu kaydet
await qrCodeService.logQRCodeScan(qrCodeId, {
  personnelId: 'user123',
  deviceInfo: { device_type: 'mobile', os: 'iOS' },
  ipAddress: '192.168.1.1'
});
```

## 🔧 Kurulum ve Yapılandırma

### Gereksinimler
- Node.js 18+
- Deno (backend için)
- Modern web tarayıcısı (kamera erişimi için)

### Backend Kurulumu
```bash
cd instruction-service
deno run --allow-net --allow-read main.ts
```

### Frontend Kurulumu
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```env
# Backend
PORT=8003
CORS_ORIGIN=*

# Frontend
VITE_API_BASE_URL=http://localhost:8003
```

## 📊 Veri Modelleri

### Instruction Interface
```typescript
interface Instruction {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'pending' | 'approved' | 'published' | 'archived';
  author: string;
  approver?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  attachments: string[];
  targetAudience: string[];
  distributionChannels: string[];
  readCount: number;
  lastReadAt?: string;
  qrCode?: string;
  accessUrl?: string;
}
```

### QR Code Interface
```typescript
interface InstructionQRCode {
  id: string;
  instructionId: string;
  qrCodeData: string;
  qrCodeImage: string;
  accessUrl: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  scanCount: number;
  lastScannedAt?: string;
}
```

### Access Log Interface
```typescript
interface InstructionAccessLog {
  id: string;
  instructionId: string;
  personnelId?: string;
  deviceInfo?: DeviceInfo;
  accessMethod: 'qr_code' | 'direct_link' | 'search' | 'dashboard';
  accessTime: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
}
```

## 🚀 Özellikler

### QR Kod Yönetimi
- ✅ Otomatik QR kod oluşturma
- ✅ Süre sınırı ayarlama
- ✅ Özel URL desteği
- ✅ Durum kontrolü (aktif/pasif)
- ✅ Toplu QR kod oluşturma

### Tarama ve Erişim
- ✅ Kamera ile QR kod tarama
- ✅ Mobil uyumlu arayüz
- ✅ Erişim logları
- ✅ İstatistikler ve raporlar
- ✅ Gerçek zamanlı takip

### Mobil Deneyim
- ✅ Responsive tasarım
- ✅ Dark mode desteği
- ✅ Touch-friendly arayüz
- ✅ Offline destek (PWA)
- ✅ Push notifications

### Güvenlik
- ✅ Erişim kontrolü
- ✅ IP adresi takibi
- ✅ Cihaz bilgisi kaydı
- ✅ Süre sınırı
- ✅ Audit logları

## 📱 Mobil Kullanım

### QR Kod Tarama
1. Mobil uygulamayı aç
2. QR kod tarayıcıyı başlat
3. Talimat QR kodunu kameraya tut
4. Otomatik yönlendirme

### Talimat Görüntüleme
1. QR kod tarama sonrası otomatik yönlendirme
2. Mobil optimize edilmiş arayüz
3. Font boyutu ayarları
4. Dark mode desteği
5. Hızlı navigasyon

## 🔍 API Endpoints

### QR Kod İşlemleri
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/qr-codes` | QR kod oluştur |
| GET | `/qr-codes/:id` | QR kod getir |
| PUT | `/qr-codes/:id/activate` | Etkinleştir |
| PUT | `/qr-codes/:id/deactivate` | Devre dışı bırak |
| PUT | `/qr-codes/:id/extend` | Süre uzat |

### İstatistik ve Loglar
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/qr-codes/:id/stats` | İstatistikler |
| GET | `/qr-codes/:id/access-logs` | Erişim logları |
| POST | `/qr-codes/:id/scan` | Tarama logu |

### Toplu İşlemler
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/qr-codes/bulk` | Toplu QR kod oluştur |
| GET | `/qr-codes/templates` | Şablonlar |

## 📈 İstatistikler ve Raporlama

### QR Kod Metrikleri
- Toplam tarama sayısı
- Benzersiz tarayıcı sayısı
- Son tarama tarihi
- Günlük tarama trendleri
- Kategori bazlı kullanım

### Erişim Analizi
- Erişim yöntemleri (QR, direkt link, arama)
- Cihaz türleri ve işletim sistemleri
- Coğrafi konum bilgileri
- Zaman bazlı kullanım analizi

## 🛠️ Geliştirme ve Test

### Test Senaryoları
```bash
# Backend test
cd instruction-service
deno test

# Frontend test
cd frontend
npm run test

# E2E test
npm run test:e2e
```

### Debug Modu
```typescript
// QR kod tarama debug
const debugMode = process.env.NODE_ENV === 'development';
if (debugMode) {
  console.log('QR Code scan result:', result);
}
```

### Performance Monitoring
- QR kod tarama süresi
- API response time
- Memory usage
- Error rates

## 🔮 Gelecek Özellikler

### Planlanan Geliştirmeler
- [ ] NFC tag desteği
- [ ] Bluetooth beacon entegrasyonu
- [ ] AI destekli talimat önerileri
- [ ] Çoklu dil desteği
- [ ] Offline QR kod tarama
- [ ] Batch QR kod yazdırma

### Teknik İyileştirmeler
- [ ] WebAssembly QR kod tarama
- [ ] Service Worker cache
- [ ] Progressive Web App (PWA)
- [ ] Real-time notifications
- [ ] Advanced analytics

## 📚 Kaynaklar ve Referanslar

### Dokümantasyon
- [QR Code API Documentation](./API_ENDPOINTS_README.md)
- [System Architecture](./AI_SISTEM_MIMARISI.md)
- [Development Roadmap](./AI_GELISTIRME_ROADMAP.md)

### Teknolojiler
- **Backend**: Deno, Oak framework
- **Frontend**: React, TypeScript, Tailwind CSS
- **QR Code**: Custom SVG generation
- **Mobile**: Progressive Web App (PWA)

### Standartlar
- ISO/IEC 18004 (QR Code standard)
- WCAG 2.1 (Accessibility)
- PWA Best Practices
- Mobile-First Design

## 🤝 Katkıda Bulunma

### Geliştirme Süreci
1. Issue oluştur
2. Feature branch oluştur
3. Kod yaz ve test et
4. Pull request gönder
5. Code review süreci

### Kod Standartları
- TypeScript strict mode
- ESLint + Prettier
- Unit test coverage >80%
- Accessibility compliance
- Mobile-first approach

## 📞 Destek ve İletişim

### Teknik Destek
- **Email**: tech-support@company.com
- **Slack**: #qr-code-system
- **Documentation**: [Wiki](https://wiki.company.com/qr-system)

### Geliştirici Ekibi
- **Lead Developer**: [Name]
- **Mobile Developer**: [Name]
- **Backend Developer**: [Name]
- **QA Engineer**: [Name]

---

**Son Güncelleme**: 2024-12-19  
**Versiyon**: 1.0.0  
**Durum**: Production Ready
