import React, { useState, useCallback, useRef } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface SafetyDocument {
  id: string;
  title: string;
  description: string;
  file: File;
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
}

interface SafetyDocumentImporterProps {
  onImport: (documents: SafetyDocument[]) => void;
  onCancel: () => void;
  className?: string;
}

const SafetyDocumentImporter: React.FC<SafetyDocumentImporterProps> = ({
  onImport,
  onCancel,
  className = ''
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<SafetyDocument[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'configure' | 'preview' | 'import'>('select');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Safety document categories
  const safetyCategories = [
    { id: 'general-safety', name: 'Genel Güvenlik', icon: '🛡️' },
    { id: 'emergency-procedures', name: 'Acil Durum Prosedürleri', icon: '🚨' },
    { id: 'equipment-safety', name: 'Ekipman Güvenliği', icon: '⚙️' },
    { id: 'chemical-safety', name: 'Kimyasal Güvenlik', icon: '🧪' },
    { id: 'fire-safety', name: 'Yangın Güvenliği', icon: '🔥' },
    { id: 'electrical-safety', name: 'Elektrik Güvenliği', icon: '⚡' },
    { id: 'workplace-safety', name: 'İşyeri Güvenliği', icon: '🏭' },
    { id: 'personal-protection', name: 'Kişisel Koruyucu Donanım', icon: '👷' },
    { id: 'training-materials', name: 'Eğitim Materyalleri', icon: '📚' },
    { id: 'compliance', name: 'Uyumluluk', icon: '📋' }
  ];

  // Departments
  const departments = [
    'İnsan Kaynakları',
    'Güvenlik',
    'Üretim',
    'Kalite Kontrol',
    'Bakım',
    'IT',
    'Muhasebe',
    'Satış',
    'Pazarlama',
    'Genel Müdürlük'
  ];

  // Supported file types
  const supportedTypes = {
    'application/pdf': { icon: '📄', name: 'PDF' },
    'application/msword': { icon: '📝', name: 'Word' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', name: 'Word' },
    'application/vnd.ms-excel': { icon: '📊', name: 'Excel' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', name: 'Excel' },
    'application/vnd.ms-powerpoint': { icon: '📈', name: 'PowerPoint' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: '📈', name: 'PowerPoint' },
    'text/plain': { icon: '📃', name: 'Text' },
    'image/jpeg': { icon: '🖼️', name: 'JPEG' },
    'image/png': { icon: '🖼️', name: 'PNG' }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      handleFileSelection(files);
    }
  }, []);

  const handleFileSelection = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = Object.keys(supportedTypes).includes(file.type);
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      alert('Bazı dosyalar desteklenmiyor veya çok büyük (max 50MB)');
    }

    setSelectedFiles(validFiles);
    setCurrentStep('configure');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelection(Array.from(e.target.files));
    }
  };

  const generateChecksum = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const createSafetyDocument = async (file: File, index: number): Promise<SafetyDocument> => {
    const checksum = await generateChecksum(file);
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Extract title from filename
    const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    
    return {
      id: `safety-doc-${Date.now()}-${index}`,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      description: '',
      file,
      category: 'general-safety',
      tags: [],
      priority: 'medium',
      department: 'Güvenlik',
      effectiveDate: new Date().toISOString().split('T')[0],
      reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      author: '',
      version: '1.0',
      status: 'draft',
      metadata: {
        fileSize: file.size,
        fileType: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
        checksum
      }
    };
  };

  const processFiles = async () => {
    setProcessing(true);
    try {
      const processedDocuments = await Promise.all(
        selectedFiles.map((file, index) => createSafetyDocument(file, index))
      );
      setDocuments(processedDocuments);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Dosya işleme hatası:', error);
      alert('Dosyalar işlenirken hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  const updateDocument = (index: number, updates: Partial<SafetyDocument>) => {
    setDocuments(prev => prev.map((doc, i) => 
      i === index ? { ...doc, ...updates } : doc
    ));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    return supportedTypes[fileType as keyof typeof supportedTypes]?.icon || '📎';
  };

  const handleImport = () => {
    onImport(documents);
    setCurrentStep('import');
  };

  const renderFileSelect = () => (
    <Card>
      <CardHeader>
        <CardTitle>İş Güvenliği Talimatı Dosyalarını Seçin</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Dosyaları buraya sürükleyin veya seçin
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            PDF, Word, Excel, PowerPoint ve resim dosyaları desteklenir
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            Dosya Seç
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
          />
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Desteklenen Formatlar:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(supportedTypes).map(([type, info]) => (
              <div key={type} className="flex items-center space-x-2 text-sm">
                <span className="text-lg">{info.icon}</span>
                <span className="text-gray-600 dark:text-gray-400">{info.name}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Seçilen Dosyalar ({selectedFiles.length}):
            </h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)} • {supportedTypes[file.type as keyof typeof supportedTypes]?.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                    className="text-red-600 hover:text-red-700"
                  >
                    Kaldır
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={processFiles} disabled={processing}>
                {processing ? 'İşleniyor...' : 'Devam Et'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderConfigure = () => (
    <div className="space-y-6">
      {documents.map((doc, index) => (
        <Card key={doc.id}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getFileIcon(doc.file.type)}</span>
              <div>
                <CardTitle className="text-lg">{doc.file.name}</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(doc.file.size)} • {supportedTypes[doc.file.type as keyof typeof supportedTypes]?.name}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Başlık *
                </label>
                <Input
                  value={doc.title}
                  onChange={(e) => updateDocument(index, { title: e.target.value })}
                  placeholder="Doküman başlığı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kategori *
                </label>
                <select
                  value={doc.category}
                  onChange={(e) => updateDocument(index, { category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  {safetyCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departman *
                </label>
                <select
                  value={doc.department}
                  onChange={(e) => updateDocument(index, { department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Öncelik *
                </label>
                <select
                  value={doc.priority}
                  onChange={(e) => updateDocument(index, { priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">🟢 Düşük</option>
                  <option value="medium">🟡 Orta</option>
                  <option value="high">🟠 Yüksek</option>
                  <option value="critical">🔴 Kritik</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Yazar
                </label>
                <Input
                  value={doc.author}
                  onChange={(e) => updateDocument(index, { author: e.target.value })}
                  placeholder="Doküman yazarı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Versiyon
                </label>
                <Input
                  value={doc.version}
                  onChange={(e) => updateDocument(index, { version: e.target.value })}
                  placeholder="1.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Geçerlilik Tarihi
                </label>
                <Input
                  type="date"
                  value={doc.effectiveDate}
                  onChange={(e) => updateDocument(index, { effectiveDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gözden Geçirme Tarihi
                </label>
                <Input
                  type="date"
                  value={doc.reviewDate}
                  onChange={(e) => updateDocument(index, { reviewDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Açıklama
              </label>
              <textarea
                value={doc.description}
                onChange={(e) => updateDocument(index, { description: e.target.value })}
                placeholder="Doküman açıklaması"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => setCurrentStep('select')}>
          Geri
        </Button>
        <Button onClick={() => setCurrentStep('preview')}>
          Önizleme
        </Button>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Önizlemesi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {documents.length} doküman import edilmeye hazır. Aşağıdaki bilgileri kontrol edin.
          </p>
          <div className="space-y-4">
            {documents.map((doc, index) => (
              <div key={doc.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{getFileIcon(doc.file.type)}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{doc.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{doc.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Kategori:</span>
                        <p>{safetyCategories.find(c => c.id === doc.category)?.name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Departman:</span>
                        <p>{doc.department}</p>
                      </div>
                      <div>
                        <span className="font-medium">Öncelik:</span>
                        <p className="capitalize">{doc.priority}</p>
                      </div>
                      <div>
                        <span className="font-medium">Versiyon:</span>
                        <p>{doc.version}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => setCurrentStep('configure')}>
          Geri
        </Button>
        <Button onClick={handleImport}>
          Import Et
        </Button>
      </div>
    </div>
  );

  const renderImport = () => (
    <Card>
      <CardContent className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Import Tamamlandı!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {documents.length} iş güvenliği talimatı başarıyla import edildi.
        </p>
        <Button onClick={onCancel}>
          Kapat
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          İş Güvenliği Talimatı Import
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Güvenlik dokümanlarınızı sisteme import edin ve yönetin.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {['select', 'configure', 'preview', 'import'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step 
                  ? 'bg-blue-600 text-white' 
                  : index < ['select', 'configure', 'preview', 'import'].indexOf(currentStep)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === step 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {step === 'select' && 'Dosya Seç'}
                {step === 'configure' && 'Yapılandır'}
                {step === 'preview' && 'Önizleme'}
                {step === 'import' && 'Import'}
              </span>
              {index < 3 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  index < ['select', 'configure', 'preview', 'import'].indexOf(currentStep)
                    ? 'bg-green-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {processing && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Dosyalar işleniyor...</span>
        </div>
      )}

      {!processing && (
        <>
          {currentStep === 'select' && renderFileSelect()}
          {currentStep === 'configure' && renderConfigure()}
          {currentStep === 'preview' && renderPreview()}
          {currentStep === 'import' && renderImport()}
        </>
      )}

      {currentStep !== 'import' && (
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onCancel}>
            İptal
          </Button>
        </div>
      )}
    </div>
  );
};

export default SafetyDocumentImporter;

