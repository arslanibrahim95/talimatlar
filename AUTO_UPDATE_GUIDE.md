# Claude Talimat Otomatik Güncelleştirme Sistemi

Bu rehber, Claude Talimat İş Güvenliği Yönetim Sistemi için otomatik güncelleştirme sisteminin nasıl yapılandırılacağını ve kullanılacağını açıklar.

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [Sistem Bileşenleri](#sistem-bileşenleri)
- [Kurulum](#kurulum)
- [Yapılandırma](#yapılandırma)
- [Kullanım](#kullanım)
- [İzleme ve Bildirimler](#izleme-ve-bildirimler)
- [Sorun Giderme](#sorun-giderme)
- [Güvenlik](#güvenlik)

## 🔍 Genel Bakış

Otomatik güncelleştirme sistemi, Claude Talimat sisteminin tüm bileşenlerini otomatik olarak günceller:

- **Frontend bağımlılıkları** (npm paketleri)
- **Backend servisleri** (Deno, Python, Go modülleri)
- **Docker görüntüleri**
- **Sistem paketleri** (Raspberry Pi için)
- **Veritabanı migrasyonları**

### Özellikler

- ✅ **Otomatik yedekleme** güncelleme öncesi
- ✅ **Sağlık kontrolleri** güncelleme sonrası
- ✅ **Geri alma (rollback)** hata durumunda
- ✅ **İzleme ve bildirimler**
- ✅ **Zamanlanmış güncellemeler**
- ✅ **İnteraktif yönetim arayüzü**

## 🏗️ Sistem Bileşenleri

### 1. Ana Güncelleştirme Scripti
- **Dosya**: `scripts/auto-update.sh`
- **Amaç**: Tüm güncelleştirme işlemlerini yönetir
- **Özellikler**: Yedekleme, güncelleme, sağlık kontrolü, geri alma

### 2. İnteraktif Yönetici
- **Dosya**: `scripts/update-manager.sh`
- **Amaç**: Kullanıcı dostu arayüz sağlar
- **Özellikler**: Menü tabanlı navigasyon, gerçek zamanlı durum

### 3. İzleme Sistemi
- **Dosya**: `scripts/update-monitor.sh`
- **Amaç**: Sistem sağlığını izler ve bildirimler gönderir
- **Özellikler**: E-posta, webhook, raporlama

### 4. Servis Kurulumu
- **Dosya**: `scripts/setup-auto-update-service.sh`
- **Amaç**: Systemd servisleri ve cron işleri oluşturur
- **Özellikler**: Otomatik zamanlama, servis yönetimi

### 5. Yapılandırma Dosyası
- **Dosya**: `auto-update-config.json`
- **Amaç**: Sistem ayarlarını saklar
- **Özellikler**: JSON formatında yapılandırma

## 🚀 Kurulum

### 1. Temel Kurulum

```bash
# Proje dizinine gidin
cd /home/igu/talimatlar

# Scriptleri çalıştırılabilir yapın
chmod +x scripts/*.sh

# Gerekli dizinleri oluşturun
mkdir -p logs backups

# İlk yapılandırmayı oluşturun
./scripts/auto-update.sh --test
```

### 2. Servis Kurulumu (Otomatik Güncelleştirmeler İçin)

```bash
# Systemd servislerini kurun (sudo gerekli)
sudo ./scripts/setup-auto-update-service.sh

# Servis durumunu kontrol edin
systemctl status claude-talimat-auto-update.timer

# Servisleri etkinleştirin
sudo systemctl enable claude-talimat-auto-update.timer
sudo systemctl start claude-talimat-auto-update.timer
```

### 3. Bağımlılık Kontrolü

```bash
# Gerekli araçları kontrol edin
./scripts/auto-update.sh --test

# Eksik araçları yükleyin
sudo apt-get update
sudo apt-get install -y jq curl mailutils
```

## ⚙️ Yapılandırma

### Yapılandırma Dosyası Düzenleme

```bash
# Yapılandırma dosyasını düzenleyin
nano auto-update-config.json
```

### Temel Ayarlar

```json
{
  "enabled": true,                    // Otomatik güncelleştirmeleri etkinleştir
  "updateInterval": "weekly",         // Güncelleştirme sıklığı
  "backupBeforeUpdate": true,         // Güncelleştirme öncesi yedekleme
  "notifyOnUpdate": true,             // Güncelleştirme bildirimleri
  "notifyOnError": true,              // Hata bildirimleri
  "maxBackups": 10                    // Maksimum yedek sayısı
}
```

### Güncelleştirme Sıklığı Seçenekleri

- `"daily"` - Günlük
- `"weekly"` - Haftalık (önerilen)
- `"monthly"` - Aylık
- `"always"` - Her çalıştırmada

### Servis Ayarları

```json
{
  "services": {
    "frontend": {
      "enabled": true,
      "updateDependencies": true,
      "rebuildImage": true
    },
    "ai-service": {
      "enabled": true,
      "updateDependencies": true,
      "rebuildImage": true
    }
  }
}
```

### Bildirim Ayarları

```json
{
  "notifications": {
    "email": {
      "enabled": true,
      "recipients": ["admin@example.com", "dev@example.com"]
    },
    "webhook": {
      "enabled": true,
      "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    }
  }
}
```

## 🎯 Kullanım

### 1. İnteraktif Yönetici

```bash
# İnteraktif yöneticiyi başlatın
make update:manager
# veya
./scripts/update-manager.sh
```

**Menü Seçenekleri:**
1. Güncellemeleri kontrol et
2. Tüm bağımlılıkları güncelle
3. Belirli servisi güncelle
4. Docker görüntülerini güncelle
5. Sistem bakımı
6. Güncelleştirme geçmişini görüntüle
7. Otomatik güncelleştirmeleri yapılandır
8. Yedek yönetimi
9. Sağlık kontrolü

### 2. Komut Satırı Kullanımı

```bash
# Otomatik güncelleştirme çalıştır
make auto-update

# Zorla güncelleştirme
make auto-update:force

# Yapılandırmayı görüntüle
make auto-update:config

# Yapılandırmayı test et
make auto-update:test

# Sistem sağlığını kontrol et
make update:health

# Mevcut güncellemeleri kontrol et
make update:check

# Güncelleştirme raporu oluştur
make update:report
```

### 3. Manuel Güncelleştirme

```bash
# Sadece frontend'i güncelle
cd frontend && npm update

# Sadece backend servislerini güncelle
cd services/analytics-service && pip install -r requirements.txt --upgrade

# Docker görüntülerini güncelle
docker-compose build --no-cache
docker-compose up -d
```

## 📊 İzleme ve Bildirimler

### 1. Sistem İzleme

```bash
# Güncelleştirme izleme başlat
make update:monitor

# Sistem sağlığını kontrol et
make update:health

# Güncelleştirme raporu oluştur
make update:report
```

### 2. Log Dosyaları

```bash
# Ana güncelleştirme logları
tail -f logs/auto-update.log

# İzleme logları
tail -f logs/update-monitor.log

# Sağlık kontrol logları
tail -f logs/health-check.log

# Systemd servis logları
journalctl -u claude-talimat-auto-update.service -f
```

### 3. Bildirim Ayarlama

#### E-posta Bildirimleri

```bash
# Mailutils yükleyin
sudo apt-get install mailutils

# E-posta yapılandırmasını düzenleyin
nano auto-update-config.json
```

#### Webhook Bildirimleri

```json
{
  "notifications": {
    "webhook": {
      "enabled": true,
      "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    }
  }
}
```

### 4. Raporlama

```bash
# Günlük rapor oluştur
./scripts/update-monitor.sh report

# Sistem durumu raporu
./scripts/update-monitor.sh health

# Güncelleştirme geçmişi
ls -la backups/auto-update-backup_*
```

## 🔧 Sorun Giderme

### 1. Yaygın Sorunlar

#### Güncelleştirme Başarısız

```bash
# Logları kontrol edin
tail -f logs/auto-update.log

# Sistem sağlığını kontrol edin
make update:health

# Manuel geri alma
./scripts/auto-update.sh --force
```

#### Servis Çalışmıyor

```bash
# Servis durumunu kontrol edin
systemctl status claude-talimat-auto-update.timer

# Servisi yeniden başlatın
sudo systemctl restart claude-talimat-auto-update.timer

# Servis loglarını kontrol edin
journalctl -u claude-talimat-auto-update.service -f
```

#### Disk Alanı Sorunu

```bash
# Disk kullanımını kontrol edin
df -h

# Eski yedekleri temizleyin
find backups/ -name "auto-update-backup_*" -mtime +30 -exec rm -rf {} \;

# Docker temizliği yapın
docker system prune -f
```

### 2. Debug Modu

```bash
# Detaylı loglarla çalıştır
DEBUG=true ./scripts/auto-update.sh --force

# Test modunda çalıştır
./scripts/auto-update.sh --test
```

### 3. Geri Alma (Rollback)

```bash
# Son yedekten geri yükle
ls -la backups/auto-update-backup_*

# Manuel geri yükleme
cd backups/auto-update-backup_YYYYMMDD_HHMMSS/
# Gerekli dosyaları kopyalayın
```

## 🔒 Güvenlik

### 1. Güvenlik Önlemleri

- **Yedekleme**: Her güncelleştirme öncesi otomatik yedekleme
- **Rollback**: Hata durumunda otomatik geri alma
- **Sağlık Kontrolü**: Güncelleştirme sonrası sistem kontrolü
- **İzleme**: Sürekli sistem izleme ve bildirimler

### 2. Erişim Kontrolü

```bash
# Script dosyalarının izinlerini kontrol edin
ls -la scripts/*.sh

# Sadece gerekli kullanıcıların erişimine izin verin
chmod 750 scripts/auto-update.sh
chown root:claude-talimat scripts/auto-update.sh
```

### 3. Güvenli Yapılandırma

```json
{
  "system": {
    "updatePackages": false,    // Sistem paketlerini güncelleme
    "updateDocker": true,       // Docker'ı güncelle
    "cleanupOldImages": true    // Eski görüntüleri temizle
  }
}
```

## 📈 Performans Optimizasyonu

### 1. Güncelleştirme Zamanlaması

```json
{
  "schedules": {
    "maintenance": {
      "enabled": true,
      "time": "03:00",
      "timezone": "Europe/Istanbul",
      "dayOfWeek": "sunday"
    }
  }
}
```

### 2. Kaynak Kullanımı

```bash
# Güncelleştirme sırasında kaynak kullanımını sınırla
# systemd servis dosyasında:
MemoryLimit=512M
CPUQuota=50%
```

### 3. Paralel Güncelleştirmeler

```bash
# Birden fazla servisi paralel güncelle
# (Yapılandırma dosyasında ayarlanabilir)
```

## 📚 Ek Kaynaklar

### Yararlı Komutlar

```bash
# Tüm güncelleştirme komutları
make help | grep update

# Sistem durumu
make status

# Servis logları
make logs

# Yedekleme
make backup
```

### Dosya Yapısı

```
talimatlar/
├── scripts/
│   ├── auto-update.sh              # Ana güncelleştirme scripti
│   ├── update-manager.sh           # İnteraktif yönetici
│   ├── update-monitor.sh           # İzleme sistemi
│   └── setup-auto-update-service.sh # Servis kurulumu
├── auto-update-config.json         # Yapılandırma dosyası
├── logs/                           # Log dosyaları
├── backups/                        # Yedek dosyaları
└── .last-update                    # Son güncelleştirme zamanı
```

### Destek

Sorunlar için:
1. Log dosyalarını kontrol edin
2. Sistem sağlığını kontrol edin
3. Yapılandırmayı doğrulayın
4. Manuel güncelleştirme deneyin

---

**Not**: Bu sistem production ortamında kullanılmadan önce test ortamında denenmelidir. Kritik sistemlerde manuel güncelleştirme tercih edilebilir.
