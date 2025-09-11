# 🚀 API Endpoints ve Konfigürasyon Dokümantasyonu

## 📋 Genel Bakış

Bu dokümantasyon, Claude Talimat İş Güvenliği Yönetim Sistemi'nin tüm API endpoint'lerini ve konfigürasyonlarını içermektedir.

## 🏗️ Sistem Mimarisi

### Servisler ve Port Numaraları

| Servis | Port | Açıklama | Durum |
|--------|------|----------|-------|
| **Auth Service** | 8004 | Kimlik doğrulama ve yetkilendirme | ✅ Aktif |
| **Analytics Service** | 8003 | Analitik ve raporlama | ✅ Aktif |
| **Document Service** | 8002 | Doküman yönetimi | ✅ Aktif |
| **Instruction Service** | 8005 | Talimat yönetimi | ✅ Aktif |
| **AI Service** | 8006 | AI entegrasyonu | ✅ Aktif |
| **Notification Service** | 8004 | Bildirim yönetimi | ✅ Aktif |

## 🔧 Konfigürasyon

### Environment Variables

```bash
# Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:8004
VITE_ANALYTICS_URL=http://localhost:8003
VITE_INSTRUCTION_URL=http://localhost:8005
VITE_AI_URL=http://localhost:8006
VITE_DOCUMENT_URL=http://localhost:8002
VITE_NOTIFICATION_URL=http://localhost:8004
```

### Merkezi API Konfigürasyonu

Tüm API endpoint'leri `src/config/api.ts` dosyasında merkezi olarak yönetilmektedir.

## 📡 API Endpoint'leri

### 1. 🔐 Auth Service (Port 8004)

#### Kimlik Doğrulama
- `POST /auth/login` - Kullanıcı girişi
- `POST /auth/register` - Kullanıcı kaydı
- `POST /auth/logout` - Kullanıcı çıkışı
- `GET /auth/me` - Mevcut kullanıcı bilgileri
- `POST /auth/refresh` - Token yenileme
- `POST /auth/forgot-password` - Şifre sıfırlama talebi
- `POST /auth/reset-password` - Şifre sıfırlama

#### Kullanıcı Yönetimi
- `GET /users` - Tüm kullanıcıları listele
- `GET /health` - Servis sağlık kontrolü

### 2. 📊 Analytics Service (Port 8003)

#### Dashboard ve Raporlar
- `GET /analytics/dashboard` - Ana dashboard istatistikleri
- `GET /analytics/reports` - Rapor listesi
- `GET /analytics/user-activity` - Kullanıcı aktivite analizi
- `GET /analytics/document-stats` - Doküman istatistikleri
- `GET /analytics/compliance` - Uyumluluk analizi
- `GET /analytics/risk-assessment` - Risk değerlendirmesi
- `GET /analytics/trends` - Trend analizi

#### Metrikler
- `GET /metrics/real-time` - Gerçek zamanlı metrikler
- `GET /metrics/summary` - Metrik özeti
- `GET /health` - Servis sağlık kontrolü

### 3. 📄 Document Service (Port 8002)

#### Doküman Yönetimi
- `GET /documents` - Doküman listesi
- `POST /documents` - Yeni doküman oluştur
- `GET /documents/{id}` - Doküman detayı
- `PUT /documents/{id}` - Doküman güncelle
- `DELETE /documents/{id}` - Doküman sil

#### Arama ve Kategoriler
- `GET /search` - Doküman arama
- `GET /categories` - Kategori listesi
- `GET /documents/{id}/download` - Doküman indir
- `GET /health` - Servis sağlık kontrolü

### 4. 📋 Instruction Service (Port 8005)

#### Talimat Yönetimi
- `GET /instructions` - Talimat listesi
- `POST /instructions` - Yeni talimat oluştur
- `GET /instructions/{id}` - Talimat detayı
- `PUT /instructions/{id}` - Talimat güncelle
- `DELETE /instructions/{id}` - Talimat sil

#### Dosya İşlemleri
- `POST /instructions/upload` - Talimat dosyası yükle
- `GET /instructions/{id}/download` - Talimat indir

#### Analitik ve Dağıtım
- `GET /instructions/stats` - Talimat istatistikleri
- `POST /instructions/{id}/distribute` - Talimat dağıtımı
- `GET /search` - Talimat arama
- `GET /categories` - Kategori listesi
- `GET /health` - Servis sağlık kontrolü

### 5. 🤖 AI Service (Port 8006)

#### Chat Sistemi
- `GET /chat/sessions` - Chat oturumları
- `POST /chat/sessions` - Yeni chat oturumu
- `GET /chat/sessions/{id}/messages` - Chat mesajları
- `POST /chat/sessions/{id}/messages` - Mesaj gönder

#### Komut Sistemi
- `GET /commands` - Mevcut komutlar
- `POST /commands/execute` - Komut çalıştır
- `POST /commands/advanced` - Gelişmiş komut
- `GET /commands/{id}` - Komut durumu

#### Konfigürasyon ve Analitik
- `GET /config` - AI konfigürasyonu
- `PUT /config` - AI konfigürasyonu güncelle
- `GET /config/api-keys` - API anahtarları
- `GET /analytics/usage` - Kullanım analizi
- `GET /analytics/commands` - Komut analizi
- `GET /health` - Servis sağlık kontrolü

### 6. 🔔 Notification Service (Port 8004)

#### Bildirim Yönetimi
- `GET /notifications` - Bildirim listesi
- `PUT /notifications/{id}/read` - Bildirimi okundu olarak işaretle
- `PUT /notifications/read-all` - Tüm bildirimleri okundu olarak işaretle
- `DELETE /notifications/{id}` - Bildirim sil
- `POST /notifications/send` - Bildirim gönder
- `GET /health` - Servis sağlık kontrolü

## 🔄 Service Dosyaları

### Mevcut Service'ler

| Service | Dosya | Durum | Açıklama |
|---------|-------|-------|----------|
| **AuthService** | `src/services/authService.ts` | ✅ Tamamlandı | Kimlik doğrulama işlemleri |
| **AnalyticsService** | `src/services/analyticsService.ts` | ✅ Tamamlandı | Analitik işlemleri |
| **DocumentService** | `src/services/documentService.ts` | ✅ Tamamlandı | Doküman işlemleri |
| **InstructionService** | `src/services/instructionService.ts` | ✅ Tamamlandı | Talimat işlemleri |
| **AIService** | `src/services/aiService.ts` | ✅ Tamamlandı | AI işlemleri |
| **NotificationService** | `src/services/notificationService.ts` | ✅ Tamamlandı | Bildirim işlemleri |

### Service Kullanımı

```typescript
import { authService } from '@/services/authService';
import { analyticsService } from '@/services/analyticsService';
import { documentService } from '@/services/documentService';
import { instructionService } from '@/services/instructionService';
import { aiService } from '@/services/aiService';
import { notificationService } from '@/services/notificationService';

// Örnek kullanım
const user = await authService.getCurrentUser();
const stats = await analyticsService.getDashboardStats();
const documents = await documentService.getDocuments();
const instructions = await instructionService.getInstructions();
const chatSessions = await aiService.getChatSessions();
const notifications = await notificationService.getNotifications();
```

## 🚨 Hata Yönetimi

### HTTP Status Kodları

| Kod | Açıklama | Kullanım |
|-----|-----------|----------|
| 200 | OK | Başarılı işlem |
| 201 | Created | Yeni kayıt oluşturuldu |
| 204 | No Content | İçerik olmadan başarılı |
| 400 | Bad Request | Geçersiz istek |
| 401 | Unauthorized | Yetkisiz erişim |
| 403 | Forbidden | Yasaklı erişim |
| 404 | Not Found | Kaynak bulunamadı |
| 409 | Conflict | Çakışma |
| 500 | Internal Server Error | Sunucu hatası |
| 503 | Service Unavailable | Servis kullanılamıyor |

### Hata Mesajları

Tüm hata mesajları `src/config/api.ts` dosyasında tanımlanmıştır:

```typescript
ERROR_MESSAGES: {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access forbidden.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Validation error. Please check your input.',
}
```

## 🔍 Health Check

### Servis Sağlık Kontrolü

Her servis için health check endpoint'i mevcuttur:

```typescript
import { isServiceAvailable } from '@/config/api';

// Servis durumunu kontrol et
const authAvailable = await isServiceAvailable('AUTH_SERVICE');
const analyticsAvailable = await isServiceAvailable('ANALYTICS_SERVICE');
const documentAvailable = await isServiceAvailable('DOCUMENT_SERVICE');
const instructionAvailable = await isServiceAvailable('INSTRUCTION_SERVICE');
const aiAvailable = await isServiceAvailable('AI_SERVICE');
const notificationAvailable = await isServiceAvailable('NOTIFICATION_SERVICE');
```

## 📝 Kullanım Örnekleri

### 1. Kullanıcı Girişi

```typescript
import { authService } from '@/services/authService';

try {
  const response = await authService.login({
    email: 'user@example.com',
    password: 'password123'
  });
  
  console.log('Giriş başarılı:', response.user);
} catch (error) {
  console.error('Giriş hatası:', error);
}
```

### 2. Talimat Oluşturma

```typescript
import { instructionService } from '@/services/instructionService';

try {
  const instruction = await instructionService.createInstruction({
    title: 'Yeni Talimat',
    description: 'Talimat açıklaması',
    content: 'Talimat içeriği',
    category: 'Güvenlik',
    priority: 'high',
    targetAudience: ['Çalışanlar']
  });
  
  console.log('Talimat oluşturuldu:', instruction);
} catch (error) {
  console.error('Talimat oluşturma hatası:', error);
}
```

### 3. AI Chat

```typescript
import { aiService } from '@/services/aiService';

try {
  // Yeni chat oturumu oluştur
  const session = await aiService.createChatSession('Güvenlik Sorusu');
  
  // Mesaj gönder
  const message = await aiService.sendChatMessage(session.id, 'İş güvenliği nedir?');
  
  console.log('AI yanıtı:', message);
} catch (error) {
  console.error('AI chat hatası:', error);
}
```

## 🚀 Geliştirme Notları

### 1. Yeni Endpoint Ekleme

Yeni bir endpoint eklemek için:

1. `src/config/api.ts` dosyasında endpoint'i tanımla
2. İlgili service dosyasında metodu ekle
3. TypeScript interface'lerini güncelle
4. Test et

### 2. Error Handling

Tüm API çağrıları için:

```typescript
try {
  const result = await service.method();
  return result;
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
```

### 3. Authentication

Tüm protected endpoint'ler için:

```typescript
const token = localStorage.getItem('auth_token');
if (!token) {
  throw new Error('Authentication required');
}
```

## 📊 Monitoring ve Logging

### Health Check Script

```bash
# Tüm servislerin durumunu kontrol et
./scripts/health-check.sh

# Belirli bir servisi kontrol et
curl -f http://localhost:8004/health
```

### Log Seviyeleri

- **INFO**: Genel bilgiler
- **WARN**: Uyarılar
- **ERROR**: Hatalar
- **DEBUG**: Geliştirme bilgileri

## 🔐 Güvenlik

### CORS Konfigürasyonu

```typescript
CORS_ORIGINS: [
  'http://localhost:3000',
  'http://localhost:8080'
]
```

### Rate Limiting

```typescript
RATE_LIMIT_REQUESTS: 100,
RATE_LIMIT_WINDOW: '15m'
```

### JWT Token

- **Expiration**: 24 saat
- **Refresh Expiration**: 7 gün
- **Algorithm**: HS256

## 📚 Ek Kaynaklar

- [API Konfigürasyonu](./src/config/api.ts)
- [Service Dosyaları](./src/services/)
- [Type Definitions](./src/types/)
- [Docker Compose](./docker-compose.yml)
- [Environment Variables](./env.example)

---

**Son Güncelleme**: $(date)
**Versiyon**: 1.0.0
**Geliştirici**: Claude AI Assistant
