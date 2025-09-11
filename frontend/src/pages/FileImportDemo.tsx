import React, { useState } from 'react';
import AdvancedFileUpload from '../components/AdvancedFileUpload';
import ModernInstructionViewer from '../components/ModernInstructionViewer';
import FileImportHelper from '../components/FileImportHelper';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
  uploadDate: Date;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
}

const FileImportDemo: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showImportHelper, setShowImportHelper] = useState(false);
  const [currentView, setCurrentView] = useState<'upload' | 'viewer'>('upload');

  // Sample instruction data
  const sampleInstruction = {
    header: {
      companyLogo: 'https://via.placeholder.com/48x48/3B82F6/FFFFFF?text=LOGO',
      companyName: 'TechCorp A.Ş.',
      title: 'Güvenlik Protokolü ve Acil Durum Prosedürleri',
      subtitle: 'Çalışan güvenliği ve iş sürekliliği için kapsamlı rehber',
      author: 'Güvenlik Müdürlüğü',
      publishDate: '2024-01-15',
      readTime: 25,
      category: 'Güvenlik',
      tags: ['güvenlik', 'prosedür', 'acil-durum', 'çalışan'],
      priority: 'high' as const,
      version: '2.1'
    },
    content: `# Güvenlik Protokolü ve Acil Durum Prosedürleri

## Genel Güvenlik Kuralları

### 1. Giriş Kontrolü
- Tüm çalışanlar giriş kartı ile giriş yapmalıdır
- Ziyaretçiler kayıt defterine imza atmalıdır
- Şüpheli durumlar güvenlik görevlisine bildirilmelidir

### 2. Çalışma Alanı Güvenliği
- Masalar temiz ve düzenli tutulmalıdır
- Önemli belgeler kilitli dolaplarda saklanmalıdır
- Bilgisayar ekranları kilitlenmelidir

## Acil Durum Prosedürleri

### Yangın Durumu
1. **Alarm verin** - En yakın yangın alarmını çalıştırın
2. **Güvenlik ekibini arayın** - 112'yi arayın
3. **Binayı tahliye edin** - Acil çıkış yollarını kullanın
4. **Toplanma noktasına gidin** - Belirlenen güvenli alana gidin

### Deprem Durumu
- **Çök, Kapan, Tutun** prensibini uygulayın
- Masaların altına sığının
- Asansör kullanmayın
- Binadan çıkmaya çalışmayın

### Güvenlik İhlali
- Şüpheli kişileri güvenlik ekibine bildirin
- Kanıtları koruyun
- Tanık ifadelerini kaydedin
- Polis ile iletişime geçin

## İletişim Bilgileri

### Acil Durum Numaraları
- **Güvenlik**: 0212 555 0123
- **İnsan Kaynakları**: 0212 555 0124
- **Teknik Destek**: 0212 555 0125

### Güvenlik Ekibi
- **Güvenlik Müdürü**: Ahmet Yılmaz
- **Vardiya Sorumlusu**: Mehmet Demir
- **Güvenlik Görevlisi**: Ali Kaya

## Eğitim ve Bilgilendirme

### Yıllık Eğitimler
- Temel güvenlik eğitimi (zorunlu)
- Acil durum tatbikatları (3 ayda bir)
- Yangın söndürme eğitimi (6 ayda bir)

### Güncellemeler
Bu doküman düzenli olarak güncellenir. Son güncelleme tarihi: 15 Ocak 2024

## Sonuç

Güvenlik herkesin sorumluluğudur. Bu protokollere uygun hareket ederek hem kendinizi hem de çalışma arkadaşlarınızı koruyun.

**Unutmayın**: Güvenlik önceliğimizdir!`
  };

  const handleFileUpload = async (file: File) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadDate: new Date(),
      status: 'success'
    };

    setUploadedFiles(prev => [...prev, newFile]);
  };

  const handleFileRemove = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleImport = async (files: File[]) => {
    for (const file of files) {
      await handleFileUpload(file);
    }
    setShowImportHelper(false);
  };

  const handleProgressUpdate = (progress: number) => {
    console.log('Okuma ilerlemesi:', progress);
  };

  const handleSectionClick = (sectionId: string) => {
    console.log('Bölüm tıklandı:', sectionId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dosya Import ve Talimat Görüntüleme Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gelişmiş dosya yükleme ve modern talimat görüntüleme özelliklerini test edin
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-lg mb-6">
          <button
            onClick={() => setCurrentView('upload')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              currentView === 'upload'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            📁 Dosya Yükleme
          </button>
          <button
            onClick={() => setCurrentView('viewer')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              currentView === 'viewer'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            📖 Talimat Görüntüleyici
          </button>
        </div>

        {currentView === 'upload' && (
          <div className="space-y-6">
            {/* Advanced File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Gelişmiş Dosya Yükleme</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImportHelper(true)}
                  >
                    Import Yardımcısı
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedFileUpload
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  uploadedFiles={uploadedFiles}
                  maxFiles={20}
                  maxSize={100}
                  showPreview={true}
                  allowMultiple={true}
                />
              </CardContent>
            </Card>

            {/* Uploaded Files Summary */}
            {uploadedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Yüklenen Dosya Özeti</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {uploadedFiles.length}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Toplam Dosya
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {uploadedFiles.filter(f => f.status === 'success').length}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Başarılı
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                        {(uploadedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Toplam Boyut (MB)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentView === 'viewer' && (
          <Card className="h-[800px]">
            <CardContent className="p-0 h-full">
              <ModernInstructionViewer
                header={sampleInstruction.header}
                content={sampleInstruction.content}
                onProgressUpdate={handleProgressUpdate}
                onSectionClick={handleSectionClick}
                className="h-full"
              />
            </CardContent>
          </Card>
        )}

        {/* Import Helper Modal */}
        {showImportHelper && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Dosya Import Yardımcısı
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowImportHelper(false)}
                  >
                    ✕
                  </Button>
                </div>
                <FileImportHelper
                  onImport={handleImport}
                  onCancel={() => setShowImportHelper(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileImportDemo;
