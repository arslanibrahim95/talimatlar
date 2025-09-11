import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import InstructionViewer from '../../components/InstructionViewer';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Smartphone, 
  Tablet, 
  Monitor,
  Eye,
  MousePointer,
  Touch,
  Keyboard,
  Search,
  Bookmark,
  MessageSquare,
  Highlighter,
  Settings,
  Play,
  Pause,
  Volume2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface UXTestScenario {
  id: string;
  title: string;
  description: string;
  category: 'navigation' | 'interaction' | 'accessibility' | 'performance' | 'usability';
  priority: 'high' | 'medium' | 'low';
  steps: string[];
  expectedResult: string;
  actualResult?: string;
  status: 'pending' | 'pass' | 'fail' | 'warning';
  timeSpent?: number;
  notes?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userType: 'novice' | 'intermediate' | 'expert';
}

interface UXTestSession {
  id: string;
  name: string;
  startTime: string;
  endTime?: string;
  scenarios: UXTestScenario[];
  overallScore: number;
  issues: UXIssue[];
  recommendations: string[];
}

interface UXIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'cosmetic';
  category: string;
  description: string;
  stepsToReproduce: string[];
  impact: string;
  suggestedFix: string;
  status: 'open' | 'in-progress' | 'resolved' | 'wont-fix';
}

const InstructionViewerUXTests: React.FC = () => {
  const [currentTest, setCurrentTest] = useState<UXTestScenario | null>(null);
  const [testSession, setTestSession] = useState<UXTestSession | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [userType, setUserType] = useState<'novice' | 'intermediate' | 'expert'>('intermediate');

  // Test scenarios
  const testScenarios: UXTestScenario[] = [
    {
      id: 'nav-001',
      title: 'Temel Navigasyon',
      description: 'Kullanıcının talimat görüntüleyicisinde temel navigasyon işlemlerini gerçekleştirmesi',
      category: 'navigation',
      priority: 'high',
      steps: [
        'Talimat görüntüleyicisini aç',
        'Farklı görünümler arasında geçiş yap (Genel, İçerik, Ekler, Bilgi)',
        'İçindekiler menüsünden bir bölüme git',
        'Geri butonuna tıkla'
      ],
      expectedResult: 'Kullanıcı tüm navigasyon işlemlerini 30 saniye içinde tamamlayabilmeli',
      status: 'pending',
      deviceType: 'desktop',
      userType: 'intermediate'
    },
    {
      id: 'int-001',
      title: 'Metin Seçimi ve Vurgulama',
      description: 'Kullanıcının metin seçip vurgulama yapabilmesi',
      category: 'interaction',
      priority: 'high',
      steps: [
        'İçerik görünümüne git',
        'Bir metin parçası seç',
        'Vurgulama menüsünden bir renk seç',
        'Vurgulamayı kaldır'
      ],
      expectedResult: 'Metin seçimi ve vurgulama işlemi 15 saniye içinde tamamlanmalı',
      status: 'pending',
      deviceType: 'desktop',
      userType: 'intermediate'
    },
    {
      id: 'int-002',
      title: 'Not Ekleme',
      description: 'Kullanıcının seçilen metne not ekleyebilmesi',
      category: 'interaction',
      priority: 'medium',
      steps: [
        'Bir metin parçası seç',
        'Not ekle butonuna tıkla',
        'Not içeriğini yaz',
        'Notu kaydet',
        'Notu görüntüle'
      ],
      expectedResult: 'Not ekleme işlemi 20 saniye içinde tamamlanmalı',
      status: 'pending',
      deviceType: 'desktop',
      userType: 'intermediate'
    },
    {
      id: 'acc-001',
      title: 'Klavye Navigasyonu',
      description: 'Kullanıcının sadece klavye ile navigasyon yapabilmesi',
      category: 'accessibility',
      priority: 'high',
      steps: [
        'Tab tuşu ile öğeler arasında geçiş yap',
        'Enter tuşu ile öğeleri aktifleştir',
        'Ok tuşları ile içerikte gezin',
        'Escape tuşu ile menüleri kapat'
      ],
      expectedResult: 'Tüm işlevler klavye ile erişilebilir olmalı',
      status: 'pending',
      deviceType: 'desktop',
      userType: 'expert'
    },
    {
      id: 'acc-002',
      title: 'Ekran Okuyucu Desteği',
      description: 'Ekran okuyucu kullanıcılarının içeriğe erişebilmesi',
      category: 'accessibility',
      priority: 'high',
      steps: [
        'Ekran okuyucu modunu aktifleştir',
        'İçeriği oku',
        'Navigasyon öğelerini oku',
        'Form elemanlarını oku'
      ],
      expectedResult: 'Tüm içerik ekran okuyucu ile erişilebilir olmalı',
      status: 'pending',
      deviceType: 'desktop',
      userType: 'expert'
    },
    {
      id: 'perf-001',
      title: 'Yükleme Performansı',
      description: 'Talimat görüntüleyicisinin hızlı yüklenmesi',
      category: 'performance',
      priority: 'high',
      steps: [
        'Sayfayı yenile',
        'Yükleme süresini ölç',
        'İçerik render süresini ölç',
        'Etkileşim süresini ölç'
      ],
      expectedResult: 'Sayfa 2 saniye içinde yüklenmeli, etkileşim 100ms içinde yanıt vermeli',
      status: 'pending',
      deviceType: 'desktop',
      userType: 'intermediate'
    },
    {
      id: 'usa-001',
      title: 'Mobil Kullanım',
      description: 'Mobil cihazlarda kullanım kolaylığı',
      category: 'usability',
      priority: 'high',
      steps: [
        'Mobil görünüme geç',
        'Touch ile navigasyon yap',
        'Pinch-to-zoom yap',
        'Swipe ile gezin'
      ],
      expectedResult: 'Mobil cihazlarda tüm işlevler touch ile kullanılabilir olmalı',
      status: 'pending',
      deviceType: 'mobile',
      userType: 'novice'
    },
    {
      id: 'usa-002',
      title: 'Arama Fonksiyonu',
      description: 'Kullanıcının içerikte arama yapabilmesi',
      category: 'usability',
      priority: 'medium',
      steps: [
        'Arama butonuna tıkla',
        'Arama terimi gir',
        'Sonuçları görüntüle',
        'Sonuçlar arasında gezin'
      ],
      expectedResult: 'Arama işlemi 10 saniye içinde tamamlanmalı',
      status: 'pending',
      deviceType: 'desktop',
      userType: 'intermediate'
    },
    {
      id: 'usa-003',
      title: 'Ayarlar Paneli',
      description: 'Kullanıcının görüntüleme ayarlarını değiştirebilmesi',
      category: 'usability',
      priority: 'medium',
      steps: [
        'Ayarlar butonuna tıkla',
        'Yazı boyutunu değiştir',
        'Temayı değiştir',
        'Ayarları kaydet'
      ],
      expectedResult: 'Ayarlar değişiklikleri anında uygulanmalı',
      status: 'pending',
      deviceType: 'desktop',
      userType: 'intermediate'
    },
    {
      id: 'usa-004',
      title: 'Tam Ekran Modu',
      description: 'Kullanıcının tam ekran modunu kullanabilmesi',
      category: 'usability',
      priority: 'low',
      steps: [
        'Tam ekran butonuna tıkla',
        'Tam ekran modunda gezin',
        'Tam ekran modundan çık'
      ],
      expectedResult: 'Tam ekran modu sorunsuz çalışmalı',
      status: 'pending',
      deviceType: 'desktop',
      userType: 'intermediate'
    }
  ];

  // Demo instruction data
  const demoInstruction = {
    id: 'demo_instruction_001',
    companyId: 'company_001',
    companyName: 'ABC İnşaat A.Ş.',
    title: 'İş Güvenliği Genel Kuralları',
    description: 'İşyerinde uyulması gereken temel güvenlik kuralları ve prosedürleri',
    content: `İŞ GÜVENLİĞİ GENEL KURALLARI

1. GENEL PRENSİPLER
- Tüm çalışanlar iş güvenliği kurallarına uymakla yükümlüdür
- Güvenlik öncelikli olarak ele alınmalıdır
- Kaza ve yaralanmaları önlemek için gerekli önlemler alınmalıdır

2. KİŞİSEL KORUYUCU DONANIM
- Baretsiz işyerine girilmez
- Güvenlik ayakkabısı giyilmelidir
- Yüksekte çalışırken emniyet kemeri takılmalıdır
- Gerekli durumlarda gözlük, eldiven kullanılmalıdır

3. ACİL DURUM PROSEDÜRLERİ
- Acil durum numaraları bilinmelidir
- Kaçış yolları açık tutulmalıdır
- Yangın söndürücülerin yerleri bilinmelidir
- İlk yardım eğitimi alınmalıdır

4. MAKİNE VE EKİPMAN GÜVENLİĞİ
- Makineler sadece yetkili kişiler tarafından kullanılmalıdır
- Bakım ve onarım işlemleri güvenlik kurallarına uygun yapılmalıdır
- Kilitli/tiketli sistem uygulanmalıdır

5. KİMYASAL MADDE GÜVENLİĞİ
- MSDS formları incelenmelidir
- Uygun depolama koşulları sağlanmalıdır
- Kişisel koruyucu donanım kullanılmalıdır`,
    category: 'güvenlik',
    subcategory: 'Genel Güvenlik',
    priority: 'critical' as const,
    status: 'published' as const,
    author: 'Güvenlik Uzmanı',
    version: '2.1',
    effectiveDate: '2024-01-01',
    reviewDate: '2024-12-31',
    tags: ['güvenlik', 'talimat', 'prosedür', 'kurallar', 'iş güvenliği'],
    targetAudience: ['Tüm Çalışanlar'],
    departments: ['Güvenlik', 'İnsan Kaynakları'],
    attachments: [{
      id: 'att_1',
      name: 'is_guvenligi_kurallari.pdf',
      type: 'application/pdf',
      size: 1024000,
      url: '/demo/is_guvenligi_kurallari.pdf',
      checksum: 'abc123def456'
    }],
    metadata: {
      fileType: 'application/pdf',
      fileSize: 1024000,
      pageCount: 15,
      wordCount: 2500,
      language: 'tr',
      securityLevel: 'internal' as const,
      compliance: ['ISO 45001', 'OHSAS 18001', 'SGK'],
      riskLevel: 'critical' as const,
      keywords: ['güvenlik', 'talimat', 'prosedür', 'kurallar'],
      extractedText: 'İş güvenliği genel kuralları...',
      summary: 'İşyerinde uyulması gereken temel güvenlik kuralları ve prosedürleri',
      readingTime: 8
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    publishedAt: '2024-01-15T10:30:00Z',
    readCount: 45,
    lastReadAt: '2024-01-20T14:22:00Z',
    mobileOptimized: true,
    qrCode: 'QR_demo_001_abc123'
  };

  const startTest = (scenario: UXTestScenario) => {
    setCurrentTest(scenario);
    setCurrentStep(0);
    setStartTime(new Date());
    
    // Initialize test session if not exists
    if (!testSession) {
      setTestSession({
        id: `session_${Date.now()}`,
        name: `UX Test Session - ${new Date().toLocaleDateString()}`,
        startTime: new Date().toISOString(),
        scenarios: [],
        overallScore: 0,
        issues: [],
        recommendations: []
      });
    }
  };

  const completeStep = () => {
    if (currentStep < (currentTest?.steps.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const finishTest = (status: 'pass' | 'fail' | 'warning', notes?: string) => {
    if (currentTest && startTime) {
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      const completedTest = {
        ...currentTest,
        status,
        timeSpent,
        notes,
        actualResult: status === 'pass' ? 'Test başarıyla tamamlandı' : 'Test başarısız'
      };

      setTestSession(prev => {
        if (prev) {
          const updatedScenarios = [...prev.scenarios, completedTest];
          const overallScore = calculateOverallScore(updatedScenarios);
          return {
            ...prev,
            scenarios: updatedScenarios,
            overallScore
          };
        }
        return prev;
      });

      setCurrentTest(null);
      setCurrentStep(0);
      setStartTime(null);
    }
  };

  const calculateOverallScore = (scenarios: UXTestScenario[]): number => {
    if (scenarios.length === 0) return 0;
    
    const totalWeight = scenarios.reduce((sum, scenario) => {
      return sum + (scenario.priority === 'high' ? 3 : scenario.priority === 'medium' ? 2 : 1);
    }, 0);

    const weightedScore = scenarios.reduce((sum, scenario) => {
      const weight = scenario.priority === 'high' ? 3 : scenario.priority === 'medium' ? 2 : 1;
      const score = scenario.status === 'pass' ? 100 : scenario.status === 'warning' ? 50 : 0;
      return sum + (score * weight);
    }, 0);

    return Math.round(weightedScore / totalWeight);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation': return <ChevronRight className="w-4 h-4" />;
      case 'interaction': return <MousePointer className="w-4 h-4" />;
      case 'accessibility': return <Eye className="w-4 h-4" />;
      case 'performance': return <Clock className="w-4 h-4" />;
      case 'usability': return <User className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  if (currentTest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getStatusIcon(currentTest.status)}
                <span>{currentTest.title}</span>
              </CardTitle>
              <p className="text-gray-600">{currentTest.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Test Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Test İlerlemesi</span>
                  <span className="text-sm text-gray-500">
                    {currentStep + 1} / {currentTest.steps.length}
                  </span>
                </div>
                <Progress value={((currentStep + 1) / currentTest.steps.length) * 100} />
              </div>

              {/* Current Step */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  Adım {currentStep + 1}: {currentTest.steps[currentStep]}
                </h3>
                <p className="text-sm text-blue-700">
                  Bu adımı gerçekleştirin ve tamamlandığında "Sonraki Adım" butonuna tıklayın.
                </p>
              </div>

              {/* Test Environment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Test Ortamı</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      {deviceType === 'mobile' && <Smartphone className="w-4 h-4" />}
                      {deviceType === 'tablet' && <Tablet className="w-4 h-4" />}
                      {deviceType === 'desktop' && <Monitor className="w-4 h-4" />}
                      <span>Cihaz: {deviceType}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Kullanıcı Tipi: {userType}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Geçen Süre: {startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0}s</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Beklenen Sonuç</h4>
                  <p className="text-sm text-gray-600">{currentTest.expectedResult}</p>
                </div>
              </div>

              {/* Test Actions */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentTest(null);
                    setCurrentStep(0);
                    setStartTime(null);
                  }}
                >
                  Testi İptal Et
                </Button>

                <div className="flex space-x-2">
                  {currentStep < currentTest.steps.length - 1 ? (
                    <Button onClick={completeStep}>
                      Sonraki Adım
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => finishTest('warning', 'Test uyarı ile tamamlandı')}
                      >
                        Uyarı ile Tamamla
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => finishTest('fail', 'Test başarısız')}
                      >
                        Başarısız
                      </Button>
                      <Button
                        onClick={() => finishTest('pass', 'Test başarılı')}
                      >
                        Başarılı
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Test Area */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 text-sm font-medium">
                  Test Alanı - {currentTest.title}
                </div>
                <div className="h-96">
                  <InstructionViewer
                    instruction={demoInstruction}
                    onUpdate={(instruction) => console.log('Updated:', instruction)}
                    onDelete={(id) => console.log('Deleted:', id)}
                    onDownload={(attachment) => console.log('Download:', attachment)}
                    onShare={(instruction) => console.log('Share:', instruction)}
                    onBookmark={(id, bookmarked) => console.log('Bookmark:', id, bookmarked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showResults && testSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>UX Test Sonuçları</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Test Oturumu: {testSession.name}</span>
                <span>Genel Skor: {testSession.overallScore}/100</span>
                <span>Test Sayısı: {testSession.scenarios.length}</span>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Overall Score */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-medium">Genel Performans</span>
                  <span className="text-2xl font-bold text-blue-600">{testSession.overallScore}/100</span>
                </div>
                <Progress value={testSession.overallScore} />
              </div>

              {/* Test Results */}
              <div className="space-y-4">
                {testSession.scenarios.map((scenario) => (
                  <div key={scenario.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(scenario.status)}
                        <div>
                          <h3 className="font-medium">{scenario.title}</h3>
                          <p className="text-sm text-gray-600">{scenario.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(scenario.priority)}>
                          {scenario.priority}
                        </Badge>
                        <Badge variant="outline">
                          {scenario.timeSpent}s
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Kategori:</span>
                        <div className="flex items-center space-x-1 mt-1">
                          {getCategoryIcon(scenario.category)}
                          <span>{scenario.category}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Beklenen:</span>
                        <div className="mt-1">{scenario.expectedResult}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Sonuç:</span>
                        <div className="mt-1">{scenario.actualResult}</div>
                      </div>
                    </div>
                    
                    {scenario.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium text-gray-700">Notlar:</span>
                        <p className="text-sm text-gray-600 mt-1">{scenario.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Öneriler</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Navigasyon işlemleri için daha büyük tıklama alanları ekleyin
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Mobil cihazlarda touch etkileşimlerini iyileştirin
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      Klavye navigasyonu için daha iyi focus göstergeleri ekleyin
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowResults(false)}
                >
                  Geri Dön
                </Button>
                <Button onClick={() => window.print()}>
                  Raporu Yazdır
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Talimat Görüntüleyici UX Testleri
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Talimat görüntüleyicisinin kullanılabilirlik, erişilebilirlik ve performans 
            açısından test edilmesi için hazırlanmış test senaryoları.
          </p>
        </div>

        {/* Test Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Konfigürasyonu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cihaz Tipi
                </label>
                <div className="flex space-x-2">
                  {['mobile', 'tablet', 'desktop'].map((device) => (
                    <Button
                      key={device}
                      variant={deviceType === device ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDeviceType(device as any)}
                      className="flex items-center space-x-2"
                    >
                      {device === 'mobile' && <Smartphone className="w-4 h-4" />}
                      {device === 'tablet' && <Tablet className="w-4 h-4" />}
                      {device === 'desktop' && <Monitor className="w-4 h-4" />}
                      <span className="capitalize">{device}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kullanıcı Tipi
                </label>
                <div className="flex space-x-2">
                  {['novice', 'intermediate', 'expert'].map((user) => (
                    <Button
                      key={user}
                      variant={userType === user ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUserType(user as any)}
                    >
                      <span className="capitalize">{user}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testScenarios.map((scenario) => (
            <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg">{scenario.title}</CardTitle>
                  {getStatusIcon(scenario.status)}
                </div>
                <p className="text-sm text-gray-600">{scenario.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(scenario.category)}
                  <span className="text-sm text-gray-600 capitalize">{scenario.category}</span>
                  <Badge className={getPriorityColor(scenario.priority)}>
                    {scenario.priority}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600">
                  <div className="font-medium mb-1">Test Adımları:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {scenario.steps.slice(0, 2).map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                    {scenario.steps.length > 2 && (
                      <li className="text-gray-400">+{scenario.steps.length - 2} adım daha</li>
                    )}
                  </ul>
                </div>

                <div className="text-sm">
                  <div className="font-medium text-gray-700 mb-1">Beklenen Sonuç:</div>
                  <p className="text-gray-600">{scenario.expectedResult}</p>
                </div>

                <Button
                  onClick={() => startTest(scenario)}
                  className="w-full"
                  disabled={scenario.status !== 'pending'}
                >
                  {scenario.status === 'pending' ? 'Testi Başlat' : 'Tamamlandı'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Test Session Summary */}
        {testSession && testSession.scenarios.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Test Oturumu Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{testSession.overallScore}</div>
                  <div className="text-sm text-gray-600">Genel Skor</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {testSession.scenarios.filter(s => s.status === 'pass').length}
                  </div>
                  <div className="text-sm text-gray-600">Başarılı</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {testSession.scenarios.filter(s => s.status === 'fail').length}
                  </div>
                  <div className="text-sm text-gray-600">Başarısız</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {testSession.scenarios.filter(s => s.status === 'warning').length}
                  </div>
                  <div className="text-sm text-gray-600">Uyarı</div>
                </div>
              </div>

              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTestSession(null);
                    setShowResults(false);
                  }}
                >
                  Yeni Oturum
                </Button>
                <Button onClick={() => setShowResults(true)}>
                  Detaylı Sonuçlar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InstructionViewerUXTests;
