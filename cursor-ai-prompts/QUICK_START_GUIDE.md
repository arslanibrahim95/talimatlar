# 🚀 Cursor AI Prompt Hızlı Başlangıç Kılavuzu

Bu kılavuz, **Agent CLI Prompt 2025-09-03**'ü Cursor IDE'de hızlıca nasıl uygulayacağınızı gösterir.

## ⚡ 5 Dakikada Kurulum

### 1️⃣ Cursor IDE'yi Açın
```bash
# Terminal'den Cursor'u açın
cursor /home/igu/talimatlar

# Veya Cursor IDE'yi açıp projeyi File > Open Folder ile açın
```

### 2️⃣ Settings'e Erişin
**Klavye Kısayolu:**
```
Ctrl + , (Windows/Linux)
Cmd + , (macOS)
```

**Veya Menü:**
```
File > Preferences > Settings
```

### 3️⃣ System Message Ayarlarını Bulun
Settings sayfasında:
1. **"Features"** sekmesine tıklayın
2. **"Override System Message"** seçeneğini bulun
3. Bu seçeneği **aktif** hale getirin (toggle switch'i açın)

### 4️⃣ Prompt'u Kopyalayın
```bash
# Terminal'den prompt dosyasını okuyun
cat /home/igu/talimatlar/cursor-ai-prompts/Agent\ CLI\ Prompt\ 2025-09-03.txt
```

**Veya dosyayı açıp kopyalayın:**
- Dosya: `/home/igu/talimatlar/cursor-ai-prompts/Agent CLI Prompt 2025-09-03.txt`
- Tüm içeriği seçin (Ctrl+A)
- Kopyalayın (Ctrl+C)

### 5️⃣ System Message Alanına Yapıştırın
1. **"Override System Message"** alanına tıklayın
2. Kopyaladığınız prompt içeriğini yapıştırın (Ctrl+V)
3. **"Save"** butonuna tıklayın

### 6️⃣ Kurulumu Doğrulayın
1. Cursor IDE'yi yeniden başlatın
2. Yeni bir chat başlatın
3. Test mesajı gönderin: `"Merhaba, prompt çalışıyor mu?"`

## 🧪 Test Etme

### Test Sayfasına Git
```
http://localhost:3000/test
```

### Test Senaryoları

#### 1. Basit Test
```
"React component'inde bir button ekle ve onClick event'i ekle"
```

#### 2. Karmaşık Test
```
"Projemde authentication sistemi ekle. JWT token kullan, 
login/register sayfaları oluştur, protected routes ekle."
```

#### 3. Hata Ayıklama Test
```
"Projemde bir hata var, linter error'ları göster"
```

## ✅ Başarı Kriterleri

Prompt düzgün çalışıyorsa:
- ✅ Otomatik olarak dosyayı bulur
- ✅ Component'i düzenler
- ✅ Status update verir
- ✅ Todo list oluşturur
- ✅ Paralel işlem yapar

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
