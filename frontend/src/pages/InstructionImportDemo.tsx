import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import CompanyInstructionImporter from '../../components/CompanyInstructionImporter';
import MobileInstructionViewer from '../../components/MobileInstructionViewer';
import { 
  Building2, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Upload, 
  Eye, 
  Download,
  Share2,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Info,
  Play,
  Pause,
  RotateCw
} from 'lucide-react';

interface DemoInstruction {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  content: string;
  category: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'pending' | 'approved' | 'published' | 'archived';
  author: string;
  approver?: string;
  version: string;
  effectiveDate: string;
  reviewDate: string;
  tags: string[];
  targetAudience: string[];
  departments: string[];
  attachments: any[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  readCount: number;
  lastReadAt?: string;
  mobileOptimized: boolean;
  qrCode?: string;
}

const InstructionImportDemo: React.FC = () => {
  const [currentView, setCurrentView] = useState<'demo' | 'import' | 'viewer'>('demo');
  const [selectedInstruction, setSelectedInstruction] = useState<DemoInstruction | null>(null);
  const [importedInstructions, setImportedInstructions] = useState<DemoInstruction[]>([]);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [isPlaying, setIsPlaying] = useState(false);

  // Demo data
  const demoInstructions: DemoInstruction[] = [
    {
      id: 'demo_1',
      companyId: 'company_1',
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
      priority: 'critical',
      status: 'published',
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
        securityLevel: 'internal',
        compliance: ['ISO 45001', 'OHSAS 18001', 'SGK'],
        riskLevel: 'critical',
        keywords: ['güvenlik', 'talimat', 'prosedür', 'kurallar'],
        extractedText: 'İş güvenliği genel kuralları...',
        summary: 'İşyerinde uyulması gereken temel güvenlik kuralları ve prosedürleri'
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      publishedAt: '2024-01-15T10:30:00Z',
      readCount: 45,
      lastReadAt: '2024-01-20T14:22:00Z',
      mobileOptimized: true,
      qrCode: 'QR_demo_1_abc123'
    },
    {
      id: 'demo_2',
      companyId: 'company_1',
      companyName: 'ABC İnşaat A.Ş.',
      title: 'Yangın Güvenliği Prosedürleri',
      description: 'Yangın önleme ve müdahale prosedürleri',
      content: `YANGIN GÜVENLİĞİ PROSEDÜRLERİ

1. YANGIN ÖNLEME
- Sigara içme yasaklarına uyulmalıdır
- Elektrik tesisatları düzenli kontrol edilmelidir
- Yanıcı maddeler güvenli şekilde depolanmalıdır
- Çıkış yolları açık tutulmalıdır

2. YANGIN TESPİTİ
- Duman dedektörleri çalışır durumda olmalıdır
- Isı dedektörleri düzenli test edilmelidir
- Manuel alarm butonları erişilebilir olmalıdır

3. YANGIN MÜDAHALESİ
- 110 numaralı telefon aranmalıdır
- Güvenli alana tahliye yapılmalıdır
- Yangın söndürücüler kullanılmalıdır
- İtfaiye gelene kadar güvenlik sağlanmalıdır

4. TAHİYE PROSEDÜRLERİ
- En yakın çıkış kullanılmalıdır
- Asansör kullanılmamalıdır
- Toplanma noktasına gidilmelidir
- Kişi sayımı yapılmalıdır`,
      category: 'güvenlik',
      subcategory: 'Acil Durum',
      priority: 'critical',
      status: 'published',
      author: 'Güvenlik Uzmanı',
      version: '1.5',
      effectiveDate: '2024-01-01',
      reviewDate: '2024-12-31',
      tags: ['yangın', 'güvenlik', 'acil durum', 'tahliye', 'prosedür'],
      targetAudience: ['Tüm Çalışanlar'],
      departments: ['Güvenlik'],
      attachments: [{
        id: 'att_2',
        name: 'yangin_guvenligi.pdf',
        type: 'application/pdf',
        size: 850000,
        url: '/demo/yangin_guvenligi.pdf',
        checksum: 'def456ghi789'
      }],
      metadata: {
        fileType: 'application/pdf',
        fileSize: 850000,
        pageCount: 12,
        wordCount: 1800,
        language: 'tr',
        securityLevel: 'internal',
        compliance: ['ISO 45001', 'SGK'],
        riskLevel: 'critical',
        keywords: ['yangın', 'güvenlik', 'acil durum'],
        extractedText: 'Yangın güvenliği prosedürleri...',
        summary: 'Yangın önleme ve müdahale prosedürleri'
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-10T09:15:00Z',
      publishedAt: '2024-01-10T09:15:00Z',
      readCount: 32,
      lastReadAt: '2024-01-18T16:45:00Z',
      mobileOptimized: true,
      qrCode: 'QR_demo_2_def456'
    }
  ];

  const handleImport = (instructions: DemoInstruction[]) => {
    setImportedInstructions(prev => [...prev, ...instructions]);
    setCurrentView('demo');
  };

  const handleViewInstruction = (instruction: DemoInstruction) => {
    setSelectedInstruction(instruction);
    setCurrentView('viewer');
  };

  const handleDeviceChange = (device: 'mobile' | 'tablet' | 'desktop') => {
    setDeviceType(device);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (currentView === 'import') {
    return (
      <CompanyInstructionImporter
        onImport={handleImport}
        onCancel={() => setCurrentView('demo')}
        companyId="demo_company"
      />
    );
  }

  if (currentView === 'viewer' && selectedInstruction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => setCurrentView('demo')}
              className="flex items-center space-x-2"
            >
              <span>← Geri Dön</span>
            </Button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Cihaz:</span>
              <Button
                variant={deviceType === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDeviceChange('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button
                variant={deviceType === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDeviceChange('tablet')}
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={deviceType === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDeviceChange('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className={`${deviceType === 'mobile' ? 'max-w-sm mx-auto' : deviceType === 'tablet' ? 'max-w-2xl mx-auto' : 'max-w-4xl mx-auto'}`}>
            <MobileInstructionViewer
              instruction={selectedInstruction}
              onUpdate={(instruction) => {
                setSelectedInstruction(instruction);
              }}
              onDelete={(id) => {
                setCurrentView('demo');
              }}
              onDownload={(attachment) => {
                console.log('Download:', attachment);
              }}
              onShare={(instruction) => {
                console.log('Share:', instruction);
              }}
              onBookmark={(id, bookmarked) => {
                console.log('Bookmark:', id, bookmarked);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Firma Talimat Import Sistemi Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Firma bazlı talimatları hızlı ve kolay bir şekilde import edin, 
            mobil platformlarda optimize edilmiş görüntüleme deneyimi yaşayın.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-6 h-6 text-blue-600" />
                <span>Hızlı Import</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Drag & drop ile dosyaları sürükleyin, otomatik metadata çıkarımı 
                ve akıllı kategori önerileri ile hızlı import yapın.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="w-6 h-6 text-green-600" />
                <span>Mobil Optimize</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Tüm cihazlarda mükemmel görüntüleme deneyimi. 
                Responsive tasarım ve touch-friendly kontroller.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-6 h-6 text-purple-600" />
                <span>Firma Bazlı</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Her firmanın kendine özel talimatları. 
                Güvenlik seviyeleri ve uyumluluk standartları.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Actions */}
        <div className="text-center mb-8">
          <div className="flex justify-center space-x-4">
            <Button
              size="lg"
              onClick={() => setCurrentView('import')}
              className="flex items-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Import Demo</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleViewInstruction(demoInstructions[0])}
              className="flex items-center space-x-2"
            >
              <Eye className="w-5 h-5" />
              <span>Görüntüleme Demo</span>
            </Button>
          </div>
        </div>

        {/* Demo Instructions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Demo Talimatlar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoInstructions.map((instruction) => (
              <Card key={instruction.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{instruction.title}</CardTitle>
                      <p className="text-gray-600 text-sm mb-3">{instruction.description}</p>
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge className={getPriorityColor(instruction.priority)}>
                          {instruction.priority}
                        </Badge>
                        <Badge className={getStatusColor(instruction.status)}>
                          {instruction.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInstruction(instruction)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Firma:</span>
                      <span className="font-medium">{instruction.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kategori:</span>
                      <span className="font-medium">{instruction.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Versiyon:</span>
                      <span className="font-medium">{instruction.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Okunma:</span>
                      <span className="font-medium">{instruction.readCount} kez</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-1">
                    {instruction.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {instruction.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{instruction.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {instruction.qrCode && (
                    <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                      <QrCode className="w-4 h-4" />
                      <span>QR Kod: {instruction.qrCode}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Imported Instructions */}
        {importedInstructions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Edilen Talimatlar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {importedInstructions.map((instruction) => (
                <Card key={instruction.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{instruction.title}</CardTitle>
                        <p className="text-gray-600 text-sm mb-3">{instruction.description}</p>
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge className={getPriorityColor(instruction.priority)}>
                            {instruction.priority}
                          </Badge>
                          <Badge className={getStatusColor(instruction.status)}>
                            {instruction.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInstruction(instruction)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Firma:</span>
                        <span className="font-medium">{instruction.companyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kategori:</span>
                        <span className="font-medium">{instruction.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Versiyon:</span>
                        <span className="font-medium">{instruction.version}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-1">
                      {instruction.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Technical Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Teknik Özellikler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Desteklenen Formatlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>PDF, DOC, DOCX, TXT, RTF</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>XLS, XLSX, CSV</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>PPT, PPTX</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>JPG, PNG, GIF, BMP</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>ZIP, RAR, 7Z</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Güvenlik Özellikleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>SHA-256 Checksum Doğrulama</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>50MB Dosya Boyutu Sınırı</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Dosya Türü Kontrolü</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Güvenlik Seviyesi Belirleme</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Uyumluluk Standardı Tespiti</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Mobil Özellikler</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>Responsive Tasarım</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Tüm cihaz boyutlarında mükemmel görüntüleme deneyimi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-green-600" />
                  <span>Okuma İlerlemesi</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Okuma ilerlemesi takibi ve kaldığınız yerden devam etme
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5 text-purple-600" />
                  <span>QR Kod Desteği</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Hızlı erişim için QR kod oluşturma ve okuma
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /instructions/upload
                  </code>
                  <span className="text-sm text-gray-600">Tek dosya upload</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /instructions/bulk-upload
                  </code>
                  <span className="text-sm text-gray-600">Toplu dosya upload</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /instructions/company/import
                  </code>
                  <span className="text-sm text-gray-600">Firma talimat import</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">GET</Badge>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /instructions/company/{'{company_id}'}
                  </code>
                  <span className="text-sm text-gray-600">Firma talimatları listele</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">GET</Badge>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    /instructions/company/{'{company_id}'}/{'{instruction_id}'}
                  </code>
                  <span className="text-sm text-gray-600">Talimat detayı</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600">
          <p>
            Bu demo, firma bazlı talimat import sistemi ve mobil optimize görüntüleme 
            özelliklerini göstermektedir.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructionImportDemo;
