# 🤖 Claude Talimat - AI Assistant Rules & Guidelines

Bu dokümantasyon, Claude Talimat İş Güvenliği Yönetim Sistemi projesi için AI asistanının davranışlarını standartlaştırmak ve kaliteyi artırmak için oluşturulmuş kapsamlı bir kurallar sistemidir.

## 📁 Dosya Yapısı

```
├── AI_RULES.md                    # Ana kurallar ve yönergeler (bu dosya)
├── ai_assistant_config.json       # JSON konfigürasyon dosyası
├── project_specific_config.json   # Proje konfigürasyonu
├── validate_ai_behavior.py        # Davranış doğrulama script'i
└── validate_project_behavior.py   # Proje doğrulama script'i
```

## 🎯 Amaç

Bu kurallar sistemi şu hedefleri gerçekleştirmek için tasarlanmıştır:

- **Tutarlılık**: Tüm AI asistan etkileşimlerinde standart davranış
- **Kalite**: Yüksek kod kalitesi ve kullanıcı deneyimi
- **Verimlilik**: Paralel araç kullanımı ve hızlı çözümler
- **Güvenilirlik**: Hata yönetimi ve doğrulama
- **Şeffaflık**: Açık iletişim ve durum güncellemeleri

## 🏗️ Proje Özel Kuralları

### **📊 Proje Teknoloji Stack'i**
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Deno/Oak + Python/FastAPI + Go/Gin
- **Database**: PostgreSQL + Redis
- **Infrastructure**: Docker + Nginx + Raspberry Pi 5
- **AI Integration**: OpenAI + Claude API

## 🛠️ Proje Özel Araç Kullanımı

### **Mikroservis Mimarisi**
```bash
# Paralel servis geliştirme
- Auth Service (Deno/Oak) - Port 8004
- Analytics Service (Python/FastAPI) - Port 8003  
- Instruction Service (Deno/Oak) - Port 8005
- AI Service (Deno/Oak) - Port 8006
- Frontend (React/Vite) - Port 3000
```

### **Docker Compose Yönetimi**
- **Container orchestration**: Tüm servisler Docker ile yönetiliyor
- **Health checks**: Her servis için sağlık kontrolü
- **Network isolation**: claude-network ile güvenli iletişim
- **Volume management**: PostgreSQL ve Redis için kalıcı veri

### **Database Operations**
- **PostgreSQL**: Ana veritabanı (Port 5433)
- **Redis**: Cache ve session yönetimi (Port 6380)
- **Connection pooling**: Verimli veritabanı bağlantıları
- **Migration support**: Schema değişiklikleri için migration

## 📝 Proje Özel Kod Standartları

### **TypeScript/React Frontend**
```typescript
// ✅ Doğru - Proje standartları
interface Personnel {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  department: string;
  position: string;
  is_active: boolean;
}

// ✅ Doğru - Tailwind CSS kullanımı
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card className="p-6">
    <CardTitle>Personel Yönetimi</CardTitle>
  </Card>
</div>
```

### **Deno/Oak Backend**
```typescript
// ✅ Doğru - Oak router kullanımı
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const router = new Router();
router.get("/health", (ctx) => {
  ctx.response.body = { status: "healthy" };
});

// ✅ Doğru - Environment variables
const PORT = Deno.env.get('PORT') || 8004;
const DATABASE_URL = Deno.env.get('DATABASE_URL');
```

### **Python/FastAPI Backend**
```python
# ✅ Doğru - FastAPI standartları
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Analytics Service", version="1.0.0")

class PersonnelAnalytics(BaseModel):
    total_personnel: int
    active_personnel: int
    department_breakdown: dict

@app.get("/analytics/personnel", response_model=PersonnelAnalytics)
async def get_personnel_analytics():
    # Implementation
    pass
```

## 🔍 Proje Özel Arama Stratejileri

### **Mikroservis Keşfi**
```bash
# Servis içi arama
codebase_search("authentication flow", ["services/auth-service"])
codebase_search("analytics endpoints", ["services/analytics-service"])
codebase_search("instruction management", ["instruction-service"])

# Cross-service arama
codebase_search("database schema", [])
codebase_search("API endpoints", [])
codebase_search("error handling", [])
```

### **Frontend Bileşen Arama**
```bash
# React bileşenleri
codebase_search("personnel management components", ["frontend/src"])
codebase_search("instruction assignment UI", ["frontend/src"])
codebase_search("analytics dashboard", ["frontend/src"])
```

## 🚀 Proje Özel Deployment

### **Docker Compose Yönetimi**
```bash
# ✅ Doğru - Servis başlatma
docker compose up -d postgres redis
docker compose up -d auth-service analytics-service
docker compose up -d frontend nginx

# ✅ Doğru - Health check
docker compose ps
curl http://localhost:8004/health
```

### **Development Workflow**
```bash
# ✅ Doğru - Geliştirme modu
cd services/auth-service && deno task dev
cd services/analytics-service && uvicorn main:app --reload
cd frontend && npm run dev
```

## 🔐 Proje Özel Güvenlik

### **Authentication & Authorization**
- **JWT tokens**: Stateless authentication
- **Role-based access**: Personnel, Manager, Admin rolleri
- **OTP verification**: Telefon numarası doğrulama
- **Session management**: Redis ile session yönetimi

### **Data Protection**
- **Input validation**: Tüm API endpoint'lerinde
- **SQL injection prevention**: Parameterized queries
- **XSS protection**: Frontend input sanitization
- **CSRF protection**: Token-based protection

## 📊 Proje Özel Monitoring

### **Health Checks**
```bash
# ✅ Doğru - Servis sağlık kontrolü
curl http://localhost:8004/health  # Auth Service
curl http://localhost:8003/health  # Analytics Service
curl http://localhost:8005/health  # Instruction Service
curl http://localhost:8006/health  # AI Service
curl http://localhost:3000         # Frontend
curl http://localhost:8080/health  # Nginx
```

### **Performance Monitoring**
- **Response times**: < 200ms API, < 100ms Frontend
- **Database queries**: < 50ms
- **Cache operations**: < 10ms
- **Memory usage**: Raspberry Pi 5 optimizasyonu

## 🧪 Proje Özel Testing

### **Test Stratejisi**
```bash
# ✅ Doğru - Test çalıştırma
npm run test:all           # Tüm testler
npm run test:backend       # Backend testleri
npm run test:frontend      # Frontend testleri
npm run test:integration   # Integration testleri
```

### **Test Coverage**
- **Unit tests**: Her servis için ayrı testler
- **Integration tests**: Servisler arası iletişim
- **E2E tests**: Kullanıcı senaryoları
- **Performance tests**: Load testing

## 🎯 Proje Özel Görev Yönetimi

### **Mikroservis Geliştirme**
- **Auth Service**: Kimlik doğrulama ve yetkilendirme
- **Analytics Service**: Veri analizi ve raporlama
- **Instruction Service**: Talimat yönetimi
- **AI Service**: Yapay zeka entegrasyonu
- **Frontend**: Kullanıcı arayüzü

### **Database Operations**
- **Schema migrations**: PostgreSQL schema değişiklikleri
- **Data seeding**: Test verileri
- **Backup strategies**: Veri yedekleme
- **Performance optimization**: Query optimization

## 🔄 Proje Özel CI/CD

### **Deployment Pipeline**
```bash
# ✅ Doğru - Production deployment
docker compose -f docker-compose.prod.yml up -d
docker compose logs -f
docker compose ps
```

### **Environment Management**
- **Development**: Local development
- **Staging**: Test environment
- **Production**: Raspberry Pi 5 production

## 📋 Proje Özel Checklist

### **Before Development**
- [ ] Servis mimarisini anla
- [ ] Database schema'yı kontrol et
- [ ] API endpoint'lerini belirle
- [ ] Frontend bileşenlerini planla

### **During Development**
- [ ] Mikroservis standartlarına uy
- [ ] Docker container'ları kullan
- [ ] Health check'leri implement et
- [ ] Error handling ekle

### **Before Deployment**
- [ ] Tüm testleri çalıştır
- [ ] Docker image'ları build et
- [ ] Environment variables'ları kontrol et
- [ ] Health check'leri test et

### **After Deployment**
- [ ] Servis sağlığını kontrol et
- [ ] Performance metriklerini izle
- [ ] Log'ları kontrol et
- [ ] Kullanıcı geri bildirimlerini al

## 🎨 Proje Özel UI/UX

### **Design System**
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: UI bileşen kütüphanesi
- **Lucide React**: İkon kütüphanesi
- **Dark mode**: Tema desteği
- **Responsive**: Mobile-first design

### **Accessibility**
- **WCAG 2.1**: Accessibility standartları
- **Keyboard navigation**: Klavye erişimi
- **Screen reader**: Ekran okuyucu desteği
- **Color contrast**: Renk kontrastı

## 🚀 Kullanım

### **1. Kuralları Uygulama**

AI asistanı bu kuralları otomatik olarak uygular:

```python
# Örnek: Paralel araç kullanımı
# ✅ Doğru - Paralel çağrılar
tools.parallel([
    {"tool": "codebase_search", "query": "authentication"},
    {"tool": "read_file", "target": "auth.py"}
])

# ❌ Yanlış - Sıralı çağrılar
tools.sequential([
    {"tool": "codebase_search", "query": "authentication"},
    {"tool": "read_file", "target": "auth.py"}
])
```

### **2. Davranış Doğrulama**

```bash
# Validation script'ini çalıştır
python validate_ai_behavior.py
python validate_project_behavior.py
```

### **3. Konfigürasyon Özelleştirme**

`ai_assistant_config.json` ve `project_specific_config.json` dosyalarını düzenleyerek kuralları özelleştirebilirsiniz:

```json
{
  "core_behavior": {
    "autonomous_execution": true,
    "parallel_tool_calls": true,
    "max_parallel_calls": 5
  },
  "project_specific": {
    "microservices": true,
    "docker_first": true,
    "health_checks_required": true
  }
}
```

## 📋 Ana Kurallar Özeti

### **🛠️ Araç Kullanımı**
- **Paralel çağrılar**: Mümkün olduğunca paralel araç kullanımı
- **Araç isimlerini belirtme**: Kullanıcıya araç isimlerini söyleme
- **Anında çalıştırma**: Onay beklemeden işlemleri başlatma

### **📝 Kod Kalitesi**
- **Anında kullanılabilirlik**: Kod çalıştırılmaya hazır olmalı
- **Anlamlı isimler**: 1-2 karakter değişken isimlerinden kaçınma
- **Hata yönetimi**: Uygun hata yakalama ve işleme

### **💬 İletişim**
- **Markdown formatı**: Kod isimleri için backtick kullanımı
- **Durum güncellemeleri**: İşlemler öncesi bilgilendirme
- **Özet raporlar**: Değişikliklerin özetlenmesi

### **🎯 Görev Yönetimi**
- **Todo listeleri**: Karmaşık görevler için görev listesi
- **Durum takibi**: Görev durumlarının güncellenmesi
- **Tamamlanma kontrolü**: Tüm gereksinimlerin karşılanması

## 🔍 Doğrulama Kriterleri

### **✅ Başarılı Davranış**
- Paralel araç çağrıları
- Anlamlı değişken isimleri
- Uygun markdown formatı
- Durum güncellemeleri
- Hata yönetimi
- Mikroservis mimarisine uygunluk
- Doğru teknoloji stack kullanımı
- RESTful API tasarımı
- JWT authentication
- Health check implementasyonu
- Docker containerization

### **❌ Başarısız Davranış**
- Sıralı araç çağrıları
- Kısa değişken isimleri
- Araç isimlerini belirtme
- Onay bekleme
- Eksik hata yönetimi
- Servis sınırlarını ihlal etme
- Yanlış teknoloji kullanımı
- RESTful olmayan API tasarımı
- Güvenlik açıkları
- Health check eksikliği
- Docker kullanmama

## 📊 Performans Metrikleri

Validation script'i şu metrikleri ölçer:

- **Başarı oranı**: Geçen testlerin yüzdesi
- **Paralel kullanım**: Paralel araç çağrılarının oranı
- **Kod kalitesi**: Kod standartlarına uygunluk
- **İletişim kalitesi**: Markdown ve format uygunluğu
- **Proje uyumluluğu**: Mikroservis mimarisine uygunluk

## 🛠️ Özelleştirme

### **Yeni Kurallar Ekleme**

1. `AI_RULES.md` dosyasına kuralı ekleyin
2. `ai_assistant_config.json` dosyasına konfigürasyonu ekleyin
3. `validate_ai_behavior.py` dosyasına doğrulama mantığını ekleyin

### **Mevcut Kuralları Değiştirme**

```json
{
  "code_quality": {
    "style_guidelines": {
      "max_nesting_level": 4,  // 3'ten 4'e değiştirildi
      "minimal_comments": false  // Yorumları zorunlu yap
    }
  }
}
```

## 🔄 Sürekli İyileştirme

Bu kurallar sistemi sürekli olarak geliştirilir:

1. **Kullanıcı geri bildirimleri** toplanır
2. **Performans metrikleri** analiz edilir
3. **Yeni kurallar** eklenir
4. **Mevcut kurallar** güncellenir
5. **Doğrulama script'i** iyileştirilir

## 📞 Destek

Kurallar sistemi hakkında sorularınız için:

- **Dokümantasyon**: `AI_RULES.md`
- **Konfigürasyon**: `ai_assistant_config.json` ve `project_specific_config.json`
- **Doğrulama**: `validate_ai_behavior.py` ve `validate_project_behavior.py`

## 📈 Gelecek Planları

- [ ] **Otomatik kurallar güncelleme**
- [ ] **Gerçek zamanlı doğrulama**
- [ ] **Kullanıcı tercihleri öğrenme**
- [ ] **Performans optimizasyonu**
- [ ] **Çoklu dil desteği**

---

*Bu kurallar sistemi, AI asistanının tutarlı, kaliteli ve verimli çalışmasını sağlamak için tasarlanmıştır. Claude Talimat projesinin özel ihtiyaçlarına göre özelleştirilmiştir ve proje geliştirme sürecinde tutarlılık sağlar.*
