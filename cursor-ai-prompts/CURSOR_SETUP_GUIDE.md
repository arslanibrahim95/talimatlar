# 🚀 Cursor IDE'de Agent CLI Prompt 2025-09-03 Kurulum Kılavuzu

Bu kılavuz, **Agent CLI Prompt 2025-09-03** prompt'unu Cursor IDE'de nasıl uygulayacağınızı adım adım açıklar.

## 📋 Ön Gereksinimler

- ✅ Cursor IDE yüklü ve çalışır durumda
- ✅ Talimat projesi açık
- ✅ Agent CLI Prompt 2025-09-03.txt dosyası hazır

## 🎯 Kurulum Adımları

### 1. Cursor IDE'yi Açın
```bash
# Terminal'den Cursor'u açın
cursor /home/igu/talimatlar

# Veya Cursor IDE'yi açıp projeyi File > Open Folder ile açın
```

### 2. Settings'e Erişin
**Yöntem 1: Klavye Kısayolu**
```
Ctrl + , (Windows/Linux)
Cmd + , (macOS)
```

**Yöntem 2: Menü**
```
File > Preferences > Settings
```

### 3. System Message Ayarlarını Bulun
Settings sayfasında:
1. **"Features"** sekmesine tıklayın
2. **"Override System Message"** seçeneğini bulun
3. Bu seçeneği **aktif** hale getirin

### 4. Prompt'u Kopyalayın
```bash
# Terminal'den prompt dosyasını okuyun
cat /home/igu/talimatlar/cursor-ai-prompts/Agent\ CLI\ Prompt\ 2025-09-03.txt
```

**Veya dosyayı açıp içeriğini kopyalayın:**
- Dosya: `/home/igu/talimatlar/cursor-ai-prompts/Agent CLI Prompt 2025-09-03.txt`
- Tüm içeriği seçin (Ctrl+A)
- Kopyalayın (Ctrl+C)

### 5. System Message Alanına Yapıştırın
1. **"Override System Message"** alanına tıklayın
2. Kopyaladığınız prompt içeriğini yapıştırın (Ctrl+V)
3. **"Save"** butonuna tıklayın

### 6. Kurulumu Doğrulayın
1. Cursor IDE'yi yeniden başlatın
2. Yeni bir chat başlatın
3. Test mesajı gönderin: `"Merhaba, prompt çalışıyor mu?"`

## 🧪 Test Senaryoları

### Test 1: Basit Kodlama Görevi
```
"React component'inde bir button ekle ve onClick event'i ekle"
```

**Beklenen Davranış:**
- ✅ Otomatik olarak dosyayı bulur
- ✅ Component'i düzenler
- ✅ Status update verir
- ✅ Todo list oluşturur

### Test 2: Karmaşık Görev
```
"Projemde authentication sistemi ekle. JWT token kullan, 
login/register sayfaları oluştur, protected routes ekle."
```

**Beklenen Davranış:**
- ✅ Görevi alt görevlere böler
- ✅ Paralel işlem yapar
- ✅ İlerleme takibi yapar
- ✅ Otomatik olarak tamamlar

### Test 3: Hata Ayıklama
```
"Projemde bir hata var, linter error'ları göster"
```

**Beklenen Davranış:**
- ✅ Hataları analiz eder
- ✅ Çözüm önerir
- ✅ Otomatik olarak düzeltir
- ✅ Test eder

## 🔧 Gelişmiş Ayarlar

### Custom Instructions (Opsiyonel)
Eğer özel talimatlar eklemek istiyorsanız:

1. System Message'ın sonuna ekleyin:
```
<custom_instructions>
- Bu proje mikroservis mimarisinde
- TypeScript kullan
- Tailwind CSS ile styling yap
- Docker container'ları kullan
</custom_instructions>
```

### Model Seçimi
Cursor IDE'de model seçimi:
1. Chat penceresinde **model seçici**'ye tıklayın
2. **GPT-4** veya **Claude** seçin
3. **Agent CLI Prompt 2025-09-03** her iki modelle de uyumludur

## 🚨 Sorun Giderme

### Problem 1: Prompt Çalışmıyor
**Çözüm:**
- System Message'ın doğru kopyalandığını kontrol edin
- Cursor IDE'yi yeniden başlatın
- Settings'te "Override System Message" aktif olduğunu kontrol edin

### Problem 2: AI Yanıt Vermiyor
**Çözüm:**
- Model seçimini kontrol edin
- Internet bağlantınızı kontrol edin
- Cursor IDE'yi güncelleyin

### Problem 3: Paralel İşlem Çalışmıyor
**Çözüm:**
- Prompt'un tam olarak kopyalandığını kontrol edin
- GPT-4 modelini kullanın
- Karmaşık görevler verin

## 📊 Performans Beklentileri

### Hız Artışı
- **3-5x daha hızlı** işlem
- **Paralel tool execution**
- **Otomatik görev tamamlama**

### Özellikler
- ✅ **Todo list yönetimi**
- ✅ **Status update sistemi**
- ✅ **Semantic code search**
- ✅ **Otomatik error handling**
- ✅ **Progress tracking**

## 🎯 Proje İçin Özel Ayarlar

### Talimat Projesi İçin Optimizasyon
System Message'ın sonuna ekleyin:

```
<project_context>
Bu proje Claude Talimat İş Güvenliği Yönetim Sistemi'dir:
- Mikroservis mimarisi (Auth, Document, Analytics, Notification)
- Frontend: React/TypeScript + Tailwind CSS
- Backend: Deno, Python, Go
- Database: PostgreSQL + Redis
- Deployment: Docker + Nginx + Raspberry Pi
- PWA özellikleri
- Real-time analytics
</project_context>
```

## 🔄 Güncelleme

Prompt'u güncellemek için:
1. Yeni prompt dosyasını kopyalayın
2. System Message'ı güncelleyin
3. Cursor IDE'yi yeniden başlatın

## 📞 Destek

Sorunlarınız için:
- GitHub Issues: [Proje Issues](https://github.com/arslanibrahim95/talimatlar/issues)
- Cursor IDE Documentation
- Community Support

---

**🎉 Kurulum tamamlandı! Artık Agent CLI Prompt 2025-09-03 ile çalışmaya başlayabilirsiniz.**

## 📋 Kurulum Talimatları (Özet)

### ⚡ Hızlı Kurulum
1. **Cursor IDE'yi açın**
2. **Settings > Features > Override System Message**
3. **Agent CLI Prompt 2025-09-03.txt içeriğini kopyalayın**
4. **System message alanına yapıştırın**
5. **Save edin**

### 🧪 Test Etme
**Test için: `/test` sayfasına gidin ve tüm component'leri test edin!**

#### Test Senaryoları:
- **Basit Test**: `"React component'inde bir button ekle ve onClick event'i ekle"`
- **Karmaşık Test**: `"Projemde authentication sistemi ekle. JWT token kullan, login/register sayfaları oluştur, protected routes ekle."`
- **Hata Ayıklama**: `"Projemde bir hata var, linter error'ları göster"`

### ✅ Başarı Kriterleri
Prompt düzgün çalışıyorsa:
- ✅ Otomatik olarak dosyayı bulur
- ✅ Component'i düzenler
- ✅ Status update verir
- ✅ Todo list oluşturur
- ✅ Paralel işlem yapar

### 🎯 Proje İçin Özel Ayarlar
System Message'ın sonuna ekleyin:
```
<project_context>
Bu proje Claude Talimat İş Güvenliği Yönetim Sistemi'dir:
- Mikroservis mimarisi (Auth, Document, Analytics, Notification)
- Frontend: React/TypeScript + Tailwind CSS
- Backend: Deno, Python, Go
- Database: PostgreSQL + Redis
- Deployment: Docker + Nginx + Raspberry Pi
- PWA özellikleri
- Real-time analytics
</project_context>
```
