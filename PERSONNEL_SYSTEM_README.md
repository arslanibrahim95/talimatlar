# Personel Yönetim ve Talimat Takip Sistemi

Bu sistem, personel yönetimi ve talimat okuma takibi için geliştirilmiş kapsamlı bir web uygulamasıdır.

## 🚀 Özellikler

### 1. Personel Yönetimi
- **Personel Ekleme/Düzenleme/Silme**: Tek tek personel ekleme ve yönetimi
- **Toplu Personel Yükleme**: CSV/Excel dosyaları ile toplu personel ekleme
- **Departman Yönetimi**: Departman bazında personel organizasyonu
- **Arama ve Filtreleme**: Personel listesinde gelişmiş arama ve filtreleme
- **Export İşlemleri**: CSV ve Excel formatlarında veri dışa aktarma

### 2. Mobil Kimlik Doğrulama
- **Çok Faktörlü Kimlik Doğrulama (MFA)**: SMS, e-posta, TOTP, biyometrik
- **Cihaz Tanıma**: Güvenilir cihazları hatırlama ve güvenlik
- **Biyometrik Giriş**: Parmak izi ve yüz tanıma desteği
- **Push Bildirim**: Telefon üzerinden onay ile giriş
- **Konum Doğrulama**: GPS ile güvenlik artırımı

### 3. Talimat Atama ve Takip
- **Talimat Atama**: Personellere talimat atama ve öncelik belirleme
- **Durum Takibi**: Atanan talimatların durumunu takip etme
- **Son Tarih Yönetimi**: Talimatlar için son tarih belirleme ve gecikme uyarıları
- **Toplu Atama**: Birden fazla personel için aynı anda talimat atama
- **Kriter Bazlı Atama**: Bölüm, pozisyon, vardiya, lokasyon ve yeteneklere göre toplu atama
- **Atama Şablonları**: Sık kullanılan kriterleri şablon olarak kaydetme ve yeniden kullanma
- **Yeni Talimat Oluşturma**: Sıfırdan yeni talimat oluşturma ve personellere gönderme
- **Planlı Gönderim**: Talimatları belirli tarih ve saatte gönderme
- **Çoklu Bildirim**: E-posta, SMS ve push bildirim ile talimat gönderimi

### 4. Okuma Takibi
- **Okuma Durumu**: Personellerin talimatları okuyup okumadığını takip etme
- **Quiz Skorları**: Talimat okuma sonrası quiz skorlarını kaydetme
- **Okuma Süresi**: Talimat okuma sürelerini ölçme
- **Notlar**: Personellerin talimat hakkında notlarını kaydetme

### 5. Analitik ve Raporlama
- **Genel İstatistikler**: Sistem genelinde performans metrikleri
- **Departman Analizi**: Departman bazında performans karşılaştırması
- **Trend Analizi**: Zaman içindeki performans değişimleri
- **Detaylı Raporlar**: CSV/Excel formatında detaylı raporlar

## 🛠️ Teknik Detaylar

### Frontend Teknolojileri
- **React 18** + **TypeScript**
- **Tailwind CSS** - Modern ve responsive tasarım
- **Shadcn/ui** - UI bileşen kütüphanesi
- **React Router** - Sayfa yönlendirme
- **Lucide React** - İkon kütüphanesi

### Backend API Entegrasyonu
- **RESTful API** desteği
- **JWT Token** tabanlı kimlik doğrulama
- **Pagination** desteği
- **Error handling** ve kullanıcı bildirimleri

### Veri Yapısı
```typescript
// Personel
interface Personnel {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  hire_date: string;
  is_active: boolean;
  manager_id?: string;
}

// Talimat Atama
interface InstructionAssignment {
  id: string;
  instruction_id: string;
  personnel_id: string;
  assigned_by: string;
  assigned_at: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
}

// Okuma Takibi
interface InstructionReading {
  id: string;
  personnel_id: string;
  instruction_id: string;
  read_at: string;
  read_duration: number;
  is_completed: boolean;
  quiz_score?: number;
  notes?: string;
}
```

## 📁 Dosya Yapısı

```
frontend/src/
├── components/
│   ├── PersonnelManagement.tsx      # Ana personel yönetimi bileşeni
│   ├── InstructionAssignment.tsx    # Talimat atama bileşeni
│   └── BulkPersonnelUpload.tsx     # Toplu personel yükleme
├── services/
│   └── personnelService.ts          # Personel API servisleri
├── types/
│   └── index.ts                     # Tip tanımları
└── pages/
    └── PersonnelDashboard.tsx       # Ana dashboard sayfası
```

## 🚀 Kurulum ve Çalıştırma

### 1. Gereksinimler
- Node.js 18+
- npm veya yarn
- Backend API servisi (port 8004)

### 2. Kurulum
```bash
cd frontend
npm install
```

### 3. Çalıştırma
```bash
npm run dev
```

### 4. Tarayıcıda Açma
```
http://localhost:5173/personnel
```

## 📊 Kullanım Senaryoları

### Senaryo 1: Mobil Giriş ve Kimlik Doğrulama
1. **Personel Giriş** sayfasına gidin (`/personnel/login`)
2. Personel numarası, telefon veya e-posta ile giriş yapın
3. **Doğrulama yöntemi seçin** (SMS, e-posta, TOTP, biyometrik)
4. **Doğrulama kodunu girin** veya biyometrik doğrulama yapın
5. **Cihazı güvenilir olarak işaretleyin** (opsiyonel)

### Senaryo 2: MFA Yönetimi
1. **MFA Yönetimi** bölümüne gidin
2. **Yeni MFA Yöntemi Ekle** ile yöntem ekleyin
3. **TOTP kurulumu** için QR kodu tarayın
4. **Biyometrik doğrulama** için parmak izi/yüz tanıma ekleyin
5. **Birincil yöntemi belirleyin** ve yedek yöntemler ekleyin

### Senaryo 3: Yeni Personel Ekleme
1. **Personel Yönetimi** sekmesine gidin
2. **Yeni Personel** butonuna tıklayın
3. Gerekli bilgileri doldurun (Personel No, Ad, Soyad, E-posta zorunlu)
4. **Kaydet** butonuna tıklayın

### Senaryo 4: Toplu Personel Yükleme
1. **Toplu Yükleme** sekmesine gidin
2. **Şablon İndir** ile CSV şablonunu indirin
3. Personel bilgilerini doldurun
4. Dosyayı yükleyin ve **Yükle** butonuna tıklayın

### Senaryo 5: Talimat Atama
1. **Talimat Atama** sekmesine gidin
2. **Yeni Talimat Ata** butonuna tıklayın
3. Talimat ve personel seçin
4. Son tarih ve öncelik belirleyin
5. **Ata** butonuna tıklayın

### Senaryo 6: Yeni Talimat Oluşturma ve Gönderme
1. **Yeni Talimat** sekmesine gidin
2. **Talimat Oluştur** sekmesinde:
   - Talimat başlığı ve açıklaması girin
   - Detaylı içeriği yazın
   - Kategori ve öncelik seçin
   - Ek dosya ekleyin (opsiyonel)
3. **Talimat Gönder** sekmesinde:
   - Oluşturulan talimatı seçin
   - Personel seçimi yapın (bireysel veya kriter bazlı)
   - Gönderim ayarlarını belirleyin
   - Bildirim türlerini seçin
4. **Talimatı Gönder** ile işlemi tamamlayın

### Senaryo 7: Toplu Kriter Bazlı Atama
1. **Toplu Atama** sekmesine gidin
2. Talimat seçin ve atama detaylarını belirleyin
3. **Atama Kriterleri** bölümünde filtreleri seçin:
   - Departman (Üretim, Kalite, Satış)
   - Pozisyon (Mühendis, Uzman, Teknisyen)
   - Vardiya (Sabah, Akşam, Gece)
   - Lokasyon (Fabrika, Ofis, Sahada)
   - Yetenek Seviyesi (Başlangıç, Orta, İleri, Uzman)
4. **Önizleme Göster** ile hedef personel sayısını kontrol edin
5. **Toplu Talimat Ata** ile işlemi gerçekleştirin

### Senaryo 8: Performans Takibi
1. **Analitik** sekmesine gidin
2. Genel istatistikleri inceleyin
3. Departman performanslarını karşılaştırın
4. Trend analizlerini görüntüleyin

## 🔧 API Endpoints

### Personel Yönetimi
- `GET /personnel` - Personel listesi
- `POST /personnel` - Yeni personel ekleme
- `PUT /personnel/{id}` - Personel güncelleme
- `DELETE /personnel/{id}` - Personel silme
- `POST /personnel/bulk-upload` - Toplu personel yükleme
- `POST /personnel/count-by-criteria` - Kriterlere göre personel sayısı

### Mobil Kimlik Doğrulama
- `POST /personnel/auth/login` - Personel girişi
- `POST /personnel/auth/send-code` - Doğrulama kodu gönderme
- `POST /personnel/auth/verify` - Doğrulama kodu kontrolü
- `GET /personnel/auth/mfa-methods/{id}` - MFA yöntemlerini listele
- `POST /personnel/auth/setup-mfa` - MFA yöntemi ekleme
- `DELETE /personnel/auth/mfa-methods/{id}` - MFA yöntemi silme
- `POST /personnel/auth/trust-device` - Cihazı güvenilir olarak işaretle
- `GET /personnel/auth/trusted-devices/{id}` - Güvenilir cihazları listele
- `POST /personnel/auth/verify-biometric` - Biyometrik doğrulama
- `POST /personnel/auth/send-push` - Push bildirim gönderme
- `POST /personnel/auth/setup-totp` - TOTP kurulumu
- `POST /personnel/auth/verify-totp` - TOTP doğrulama
- `POST /personnel/auth/security-log` - Güvenlik log kaydı

### Ek Servisler
- `GET /work-shifts` - Vardiya bilgilerini listele
- `GET /skills` - Yetenek bilgilerini listele
- `GET /locations` - Lokasyon bilgilerini listele

### Talimat Atama
- `GET /instruction-assignments` - Atama listesi
- `POST /instruction-assignments` - Yeni atama
- `PUT /instruction-assignments/{id}` - Atama güncelleme
- `DELETE /instruction-assignments/{id}` - Atama silme
- `POST /instruction-assignments/bulk-by-criteria` - Kriter bazlı toplu atama
- `GET /instruction-assignments/templates` - Atama şablonlarını listele
- `POST /instruction-assignments/templates` - Atama şablonu oluştur
- `PUT /instruction-assignments/templates/{id}` - Atama şablonu güncelle
- `DELETE /instruction-assignments/templates/{id}` - Atama şablonu sil
- `GET /instruction-assignments/bulk-history` - Toplu atama geçmişi

### Yeni Talimat Oluşturma
- `POST /instructions` - Yeni talimat oluştur
- `PUT /instructions/{id}` - Talimat güncelle
- `DELETE /instructions/{id}` - Talimat sil
- `POST /instructions/send` - Talimatı personellere gönder
- `POST /instructions/schedule` - Planlı talimat gönderimi

### Okuma Takibi
- `GET /instruction-readings` - Okuma kayıtları
- `POST /instruction-readings` - Okuma kaydı ekleme
- `GET /instruction-readings/stats` - Okuma istatistikleri
- `GET /instruction-readings/department-stats` - Departman istatistikleri

## 📈 Performans Metrikleri

### Ana Göstergeler
- **Toplam Personel Sayısı**: Sistemdeki aktif personel sayısı
- **Talimat Tamamlanma Oranı**: Atanan talimatların tamamlanma yüzdesi
- **Ortalama Quiz Skoru**: Personellerin quiz performansı
- **Gecikmiş Talimat Sayısı**: Son tarihi geçen talimatlar

### Departman Bazında Analiz
- Departman personel sayıları
- Departman tamamlanma oranları
- Departman quiz performansları
- Departman trend analizleri

## 🔒 Güvenlik

- **JWT Token** tabanlı kimlik doğrulama
- **Role-based access control** (RBAC)
- **Input validation** ve sanitization
- **CSRF protection**
- **Rate limiting** desteği

## 🚧 Gelecek Geliştirmeler

### Planlanan Özellikler
- **Mobil Uygulama**: React Native ile mobil uygulama
- **Real-time Bildirimler**: WebSocket ile anlık bildirimler
- **Gelişmiş Raporlama**: PDF export ve grafik raporlar
- **Workflow Yönetimi**: Talimat onay süreçleri
- **Entegrasyon**: HR sistemleri ile entegrasyon

### Teknik İyileştirmeler
- **Caching**: Redis ile performans optimizasyonu
- **Search Engine**: Elasticsearch ile gelişmiş arama
- **Microservices**: Servis mimarisi ayrımı
- **CI/CD**: Otomatik deployment pipeline

## 📞 Destek

### Teknik Destek
- **GitHub Issues**: Hata bildirimleri ve özellik istekleri
- **Documentation**: Detaylı API dokümantasyonu
- **Code Examples**: Kullanım örnekleri ve kod snippet'leri

### İletişim
- **E-posta**: support@firma.com
- **Telefon**: +90 xxx xxx xx xx
- **Çalışma Saatleri**: Pazartesi - Cuma, 09:00 - 18:00

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

---

**Not**: Bu sistem sürekli geliştirilmektedir. Güncel özellikler ve değişiklikler için dokümantasyonu takip edin.
