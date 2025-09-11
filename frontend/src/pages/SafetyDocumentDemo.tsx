import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import SafetyDocumentImporter from '../components/SafetyDocumentImporter';
import SafetyDocumentViewer from '../components/SafetyDocumentViewer';

interface SafetyDocument {
  id: string;
  title: string;
  description: string;
  file: File | string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  effectiveDate: string;
  reviewDate: string;
  author: string;
  version: string;
  status: 'draft' | 'active' | 'archived';
  metadata: {
    fileSize: number;
    fileType: string;
    lastModified: string;
    checksum: string;
  };
  content?: string;
  downloadCount?: number;
  viewCount?: number;
  lastViewed?: string;
}

const SafetyDocumentDemo: React.FC = () => {
  const [documents, setDocuments] = useState<SafetyDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<SafetyDocument | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'viewer'>('list');

  // Sample safety documents for demonstration
  const sampleDocuments: SafetyDocument[] = [
    {
      id: 'sample-1',
      title: 'Yangın Güvenliği Prosedürleri',
      description: 'İşyerinde yangın güvenliği için temel prosedürler ve acil durum planları',
      file: 'sample-file-1.pdf',
      category: 'fire-safety',
      tags: ['yangın', 'güvenlik', 'acil durum', 'prosedür'],
      priority: 'critical',
      department: 'Güvenlik',
      effectiveDate: '2024-01-01',
      reviewDate: '2024-12-31',
      author: 'Güvenlik Uzmanı',
      version: '2.1',
      status: 'active',
      metadata: {
        fileSize: 1024000,
        fileType: 'application/pdf',
        lastModified: '2024-01-15T10:30:00Z',
        checksum: 'abc123def456'
      },
      content: `
        <h1>Yangın Güvenliği Prosedürleri</h1>
        <h2>1. Genel Kurallar</h2>
        <p>İşyerinde yangın güvenliği için aşağıdaki kurallar geçerlidir:</p>
        <ul>
          <li>Yangın çıkışları her zaman açık tutulmalıdır</li>
          <li>Yangın söndürücüler düzenli olarak kontrol edilmelidir</li>
          <li>Sigara içmek kesinlikle yasaktır</li>
        </ul>
        <h2>2. Acil Durum Prosedürleri</h2>
        <p>Yangın durumunda:</p>
        <ol>
          <li>Panik yapmayın</li>
          <li>En yakın yangın çıkışını kullanın</li>
          <li>Güvenlik personeline haber verin</li>
          <li>Toplanma alanına gidin</li>
        </ol>
      `,
      downloadCount: 45,
      viewCount: 120,
      lastViewed: '2024-01-20T14:30:00Z'
    },
    {
      id: 'sample-2',
      title: 'Elektrik Güvenliği Talimatları',
      description: 'Elektrikli ekipmanların güvenli kullanımı ve bakımı hakkında talimatlar',
      file: 'sample-file-2.pdf',
      category: 'electrical-safety',
      tags: ['elektrik', 'güvenlik', 'ekipman', 'bakım'],
      priority: 'high',
      department: 'Bakım',
      effectiveDate: '2024-01-01',
      reviewDate: '2024-06-30',
      author: 'Elektrik Teknisyeni',
      version: '1.5',
      status: 'active',
      metadata: {
        fileSize: 512000,
        fileType: 'application/pdf',
        lastModified: '2024-01-10T09:15:00Z',
        checksum: 'def456ghi789'
      },
      content: `
        <h1>Elektrik Güvenliği Talimatları</h1>
        <h2>1. Temel Güvenlik Kuralları</h2>
        <p>Elektrikli ekipmanlarla çalışırken:</p>
        <ul>
          <li>Her zaman güvenlik ekipmanları kullanın</li>
          <li>Çalışmadan önce elektriği kesin</li>
          <li>Nemli ortamlarda çalışmayın</li>
        </ul>
        <h2>2. Bakım Prosedürleri</h2>
        <p>Düzenli bakım için:</p>
        <ol>
          <li>Haftalık görsel kontrol</li>
          <li>Aylık fonksiyon testi</li>
          <li>Yıllık profesyonel kontrol</li>
        </ol>
      `,
      downloadCount: 32,
      viewCount: 85,
      lastViewed: '2024-01-18T11:20:00Z'
    },
    {
      id: 'sample-3',
      title: 'Kişisel Koruyucu Donanım Kullanımı',
      description: 'İş güvenliği için gerekli kişisel koruyucu donanımların kullanımı',
      file: 'sample-file-3.pdf',
      category: 'personal-protection',
      tags: ['KKD', 'kişisel koruyucu', 'güvenlik', 'donanım'],
      priority: 'medium',
      department: 'İnsan Kaynakları',
      effectiveDate: '2024-01-01',
      reviewDate: '2024-12-31',
      author: 'İSG Uzmanı',
      version: '1.0',
      status: 'active',
      metadata: {
        fileSize: 768000,
        fileType: 'application/pdf',
        lastModified: '2024-01-05T16:45:00Z',
        checksum: 'ghi789jkl012'
      },
      content: `
        <h1>Kişisel Koruyucu Donanım Kullanımı</h1>
        <h2>1. Temel KKD'ler</h2>
        <p>İşyerinde kullanılması gereken temel KKD'ler:</p>
        <ul>
          <li>Güvenlik gözlüğü</li>
          <li>İş eldiveni</li>
          <li>Güvenlik ayakkabısı</li>
          <li>Koruyucu başlık</li>
        </ul>
        <h2>2. Kullanım Kuralları</h2>
        <p>KKD kullanımında dikkat edilecek noktalar:</p>
        <ol>
          <li>Doğru boyutta seçin</li>
          <li>Düzenli olarak temizleyin</li>
          <li>Hasarlı olanları değiştirin</li>
          <li>Kullanım sonrası uygun şekilde saklayın</li>
        </ol>
      `,
      downloadCount: 28,
      viewCount: 95,
      lastViewed: '2024-01-19T13:15:00Z'
    }
  ];

  const handleImport = (importedDocuments: SafetyDocument[]) => {
    setDocuments(prev => [...importedDocuments, ...prev]);
    setShowImporter(false);
    setViewMode('list');
  };

  const handleUpdateDocument = (updatedDocument: SafetyDocument) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === updatedDocument.id ? updatedDocument : doc
    ));
    if (selectedDocument?.id === updatedDocument.id) {
      setSelectedDocument(updatedDocument);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    if (selectedDocument?.id === documentId) {
      setSelectedDocument(null);
      setViewMode('list');
    }
  };

  const handleDownloadDocument = (document: SafetyDocument) => {
    console.log('Downloading document:', document.title);
    // In a real app, this would trigger the actual download
    alert(`"${document.title}" dokümanı indiriliyor...`);
  };

  const handlePrintDocument = (document: SafetyDocument) => {
    console.log('Printing document:', document.title);
    // In a real app, this would open the print dialog
    alert(`"${document.title}" dokümanı yazdırılıyor...`);
  };

  const handleShareDocument = (document: SafetyDocument) => {
    console.log('Sharing document:', document.title);
    // In a real app, this would open a share dialog
    alert(`"${document.title}" dokümanı paylaşılıyor...`);
  };

  const allDocuments = [...sampleDocuments, ...documents];

  if (showImporter) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SafetyDocumentImporter
          onImport={handleImport}
          onCancel={() => setShowImporter(false)}
        />
      </div>
    );
  }

  if (viewMode === 'viewer' && selectedDocument) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setViewMode('list')}
            >
              ← Geri
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Doküman Görüntüleyici
            </h1>
          </div>
          <SafetyDocumentViewer
            document={selectedDocument}
            onUpdate={handleUpdateDocument}
            onDelete={handleDeleteDocument}
            onDownload={handleDownloadDocument}
            onPrint={handlePrintDocument}
            onShare={handleShareDocument}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            İş Güvenliği Talimatı Yönetim Sistemi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Güvenlik dokümanlarınızı import edin, görüntüleyin ve yönetin.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Toplam: {allDocuments.length} doküman
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Aktif: {allDocuments.filter(d => d.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Taslak: {allDocuments.filter(d => d.status === 'draft').length}
            </div>
          </div>
          <Button onClick={() => setShowImporter(true)}>
            📋 Yeni Doküman Import Et
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">
                      {document.metadata.fileType === 'application/pdf' ? '📄' : '📝'}
                    </span>
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{document.title}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {document.department} • v{document.version}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      document.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      document.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      document.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {document.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      document.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      document.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {document.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {document.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {document.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                  {document.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      +{document.tags.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>👤 {document.author}</span>
                  <span>📅 {new Date(document.effectiveDate).toLocaleDateString('tr-TR')}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>👁️ {document.viewCount || 0} görüntüleme</span>
                  <span>📥 {document.downloadCount || 0} indirme</span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedDocument(document);
                      setViewMode('viewer');
                    }}
                  >
                    👁️ Görüntüle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDocument(document)}
                  >
                    📥
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {allDocuments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Henüz doküman yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                İlk güvenlik dokümanınızı import ederek başlayın.
              </p>
              <Button onClick={() => setShowImporter(true)}>
                📋 İlk Dokümanı Import Et
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SafetyDocumentDemo;

