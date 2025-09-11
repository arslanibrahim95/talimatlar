import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';

interface InstructionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetAudience: string[];
  distributionChannels: string[];
}

interface InstructionTemplatesProps {
  onSelectTemplate: (template: InstructionTemplate) => void;
  onClose: () => void;
}

const InstructionTemplates: React.FC<InstructionTemplatesProps> = ({
  onSelectTemplate,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templates: InstructionTemplate[] = [
    {
      id: 'security-policy',
      name: 'Güvenlik Politikası',
      description: 'Genel güvenlik politikası ve kuralları',
      category: 'güvenlik',
      content: `# Güvenlik Politikası

## Amaç
Bu talimat, kurumsal güvenlik standartlarını ve uygulamalarını tanımlar.

## Kapsam
Bu politika tüm çalışanları ve sistemleri kapsar.

## Güvenlik Kuralları

### 1. Şifre Politikası
- Minimum 8 karakter
- Büyük/küçük harf, rakam ve özel karakter içermeli
- 90 günde bir değiştirilmeli

### 2. Erişim Kontrolü
- Sadece yetkili personel sistemlere erişebilir
- Çok faktörlü kimlik doğrulama zorunlu
- Erişim logları düzenli olarak incelenmeli

### 3. Veri Koruma
- Hassas veriler şifrelenmeli
- Yedekleme düzenli olarak yapılmalı
- Veri sızıntısı durumunda derhal bildirim

## Uygulama
Bu politika tüm departmanlar tarafından uygulanmalıdır.

## İletişim
Sorularınız için: güvenlik@şirket.com`,
      tags: ['güvenlik', 'politika', 'şifre', 'erişim'],
      priority: 'high',
      targetAudience: ['tüm çalışanlar'],
      distributionChannels: ['email', 'dashboard', 'intranet']
    },
    {
      id: 'emergency-procedure',
      name: 'Acil Durum Prosedürü',
      description: 'Acil durumlarda izlenecek prosedürler',
      category: 'acil',
      content: `# Acil Durum Prosedürü

## Acil Durum Türleri
1. Yangın
2. Deprem
3. Güvenlik tehdidi
4. Sistem arızası
5. Doğal afet

## Genel Prosedür

### 1. İlk Müdahale
- **Güvenlik**: Önce kendi güvenliğinizi sağlayın
- **Alarm**: Acil durum alarmını çalıştırın
- **Bildirim**: Yetkilileri derhal bilgilendirin

### 2. Tahliye
- En yakın çıkışı kullanın
- Asansör kullanmayın
- Toplanma alanına gidin
- Roll call yapın

### 3. İletişim
- Acil durum numarası: 112
- İç güvenlik: 4444
- Yönetici: 5555

## Özel Durumlar

### Yangın
1. R.A.C.E. prosedürü:
   - **R**escue (Kurtar)
   - **A**larm (Alarm)
   - **C**ontain (Sınırla)
   - **E**xtinguish (Söndür)

### Deprem
1. **Çök**: Güvenli bir yere çökün
2. **Korun**: Başınızı ve boynunuzu koruyun
3. **Tutun**: Sağlam bir yere tutunun

## Toplanma Alanları
- Ana bina: Otopark
- Yan bina: Bahçe
- Acil durum: Spor salonu

## İletişim
Acil durum koordinatörü: acil@şirket.com`,
      tags: ['acil', 'güvenlik', 'tahliye', 'prosedür'],
      priority: 'critical',
      targetAudience: ['tüm çalışanlar', 'güvenlik ekibi'],
      distributionChannels: ['email', 'sms', 'push_notification', 'dashboard']
    },
    {
      id: 'it-procedure',
      name: 'IT Prosedürü',
      description: 'Bilgi teknolojileri kullanım prosedürleri',
      category: 'teknik',
      content: `# IT Kullanım Prosedürü

## Sistem Erişimi

### Kullanıcı Hesapları
- Her çalışan için ayrı hesap
- Şifre güvenliği zorunlu
- Düzenli şifre değişimi

### Ağ Erişimi
- Sadece yetkili cihazlar
- VPN kullanımı zorunlu (uzaktan erişim)
- Güvenlik duvarı kuralları

## Yazılım Kullanımı

### Lisanslı Yazılımlar
- Sadece lisanslı yazılımlar kullanılabilir
- Lisans ihlali yasaktır
- Yeni yazılım talepleri IT departmanına

### Güvenlik Yazılımları
- Antivirus güncel tutulmalı
- Güvenlik güncellemeleri otomatik
- Şüpheli dosyalar taratılmalı

## Veri Yönetimi

### Yedekleme
- Önemli dosyalar otomatik yedeklenir
- Manuel yedekleme önerilir
- Bulut depolama kullanılabilir

### Veri Paylaşımı
- Hassas veriler şifrelenmeli
- Güvenli kanallar kullanılmalı
- Veri sızıntısı bildirimi zorunlu

## Cihaz Yönetimi

### Bilgisayarlar
- Düzenli bakım yapılmalı
- Güvenlik güncellemeleri takip edilmeli
- Fiziksel güvenlik sağlanmalı

### Mobil Cihazlar
- Şirket politikalarına uygun kullanım
- Uzaktan silme özelliği aktif
- Kişisel kullanım sınırlı

## İletişim
IT Destek: it@şirket.com
Acil Durum: 4444`,
      tags: ['it', 'teknoloji', 'güvenlik', 'prosedür'],
      priority: 'medium',
      targetAudience: ['tüm çalışanlar', 'it departmanı'],
      distributionChannels: ['email', 'dashboard', 'intranet']
    },
    {
      id: 'hr-policy',
      name: 'İnsan Kaynakları Politikası',
      description: 'İK politikaları ve prosedürleri',
      category: 'yönetim',
      content: `# İnsan Kaynakları Politikası

## İstihdam Politikası

### İşe Alım
- Eşit fırsat prensibi
- Yetkinlik bazlı seçim
- Referans kontrolü zorunlu

### İş Sözleşmesi
- Yazılı sözleşme zorunlu
- Deneme süresi: 3 ay
- İş tanımı net olmalı

## Çalışma Koşulları

### Çalışma Saatleri
- Haftalık 40 saat
- Esnek çalışma saatleri mevcut
- Fazla mesai yönetmeliğe uygun

### İzin Hakları
- Yıllık izin: 20 gün
- Hastalık izni: 10 gün
- Doğum izni: 16 hafta

## Performans Değerlendirme

### Değerlendirme Süreci
- Yılda 2 kez değerlendirme
- Hedef belirleme zorunlu
- Geri bildirim süreci

### Gelişim Fırsatları
- Eğitim programları
- Kariyer planlama
- Mentorluk sistemi

## Disiplin Süreci

### Uyarılar
- Sözlü uyarı
- Yazılı uyarı
- Son uyarı

### Disiplin Cezaları
- Uyarı
- Kınama
- İşten çıkarma

## İletişim
İK Departmanı: ik@şirket.com
İç iletişim: 3333`,
      tags: ['ik', 'politika', 'çalışma', 'yönetim'],
      priority: 'medium',
      targetAudience: ['tüm çalışanlar', 'yöneticiler'],
      distributionChannels: ['email', 'dashboard', 'intranet']
    },
    {
      id: 'quality-procedure',
      name: 'Kalite Prosedürü',
      description: 'Kalite yönetim sistemi prosedürleri',
      category: 'operasyon',
      content: `# Kalite Yönetim Prosedürü

## Kalite Politikası
"Kaliteli ürün ve hizmet sunmak, sürekli iyileştirme yapmak"

## Kalite Hedefleri
- Müşteri memnuniyeti: %95+
- Hata oranı: <%1
- Teslimat süresi: Zamanında
- Süreç verimliliği: %90+

## Süreç Yönetimi

### Süreç Tanımlama
- Tüm süreçler dokümante edilmeli
- Sorumluluklar net olmalı
- Performans göstergeleri belirlenmeli

### Süreç İyileştirme
- Düzenli süreç analizi
- İyileştirme önerileri
- Değişiklik yönetimi

## Kalite Kontrol

### Giriş Kontrolü
- Tedarikçi değerlendirmesi
- Malzeme kontrolü
- Kalite belgeleri

### Süreç Kontrolü
- Ara kontroller
- Ölçüm ve test
- Kayıt tutma

### Çıkış Kontrolü
- Final kontrol
- Müşteri onayı
- Teslimat kontrolü

## Hata Yönetimi

### Hata Tespiti
- Otomatik kontrol sistemleri
- Manuel kontroller
- Müşteri geri bildirimleri

### Hata Analizi
- Kök neden analizi
- Hata kategorileri
- İyileştirme planları

### Düzeltici Faaliyetler
- Hemen düzeltme
- Önleyici faaliyetler
- Süreç güncelleme

## İletişim
Kalite Departmanı: kalite@şirket.com
İç iletişim: 2222`,
      tags: ['kalite', 'süreç', 'iyileştirme', 'kontrol'],
      priority: 'medium',
      targetAudience: ['tüm çalışanlar', 'kalite ekibi'],
      distributionChannels: ['email', 'dashboard', 'intranet']
    }
  ];

  const categories = [
    { value: 'all', label: 'Tümü' },
    { value: 'güvenlik', label: 'Güvenlik' },
    { value: 'acil', label: 'Acil Durum' },
    { value: 'teknik', label: 'Teknik' },
    { value: 'yönetim', label: 'Yönetim' },
    { value: 'operasyon', label: 'Operasyon' }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      critical: 'Kritik'
    };
    return labels[priority] || priority;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Talimat Şablonları
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kategori Filtresi
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedCategory === category.value
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {template.description}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(template.priority)}`}>
                      {getPriorityLabel(template.priority)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori:</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{template.category}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Etiketler:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hedef Kitle:</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{template.targetAudience.join(', ')}</p>
                    </div>

                    <div className="pt-3">
                      <Button
                        onClick={() => onSelectTemplate(template)}
                        className="w-full"
                      >
                        Bu Şablonu Kullan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Seçilen kategoride şablon bulunamadı</p>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionTemplates;
