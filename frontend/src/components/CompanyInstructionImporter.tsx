import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { 
  Upload, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  Presentation, 
  Archive,
  CheckCircle,
  AlertCircle,
  X,
  Building2,
  Users,
  Calendar,
  Tag,
  Eye,
  Download
} from 'lucide-react';

interface CompanyInstruction {
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
  attachments: FileAttachment[];
  metadata: InstructionMetadata;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  readCount: number;
  lastReadAt?: string;
  mobileOptimized: boolean;
  qrCode?: string;
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  checksum: string;
}

interface InstructionMetadata {
  fileType: string;
  fileSize: number;
  pageCount?: number;
  wordCount?: number;
  language: string;
  securityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  compliance: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  extractedText?: string;
  summary?: string;
}

interface CompanyInstructionImporterProps {
  onImport: (instructions: CompanyInstruction[]) => void;
  onCancel: () => void;
  companyId?: string;
  className?: string;
}

const CompanyInstructionImporter: React.FC<CompanyInstructionImporterProps> = ({
  onImport,
  onCancel,
  companyId,
  className = ''
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [importType, setImportType] = useState<'single' | 'bulk' | 'template'>('single');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedFiles, setProcessedFiles] = useState<CompanyInstruction[]>([]);
  const [currentStep, setCurrentStep] = useState<'select' | 'process' | 'review' | 'complete'>('select');
  const [dragActive, setDragActive] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industry: '',
    size: '',
    location: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const importTypes = [
    {
      id: 'single',
      title: 'Tek Dosya Import',
      description: 'Tek bir talimat dosyası import edin',
      icon: FileText,
      maxFiles: 1,
      supportedFormats: ['.pdf', '.doc', '.docx', '.txt', '.rtf']
    },
    {
      id: 'bulk',
      title: 'Toplu Import',
      description: 'Birden fazla dosya veya klasör import edin',
      icon: Archive,
      maxFiles: 50,
      supportedFormats: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.xlsx', '.pptx', '.zip']
    },
    {
      id: 'template',
      title: 'Şablon Import',
      description: 'Önceden hazırlanmış şablonlardan import edin',
      icon: Building2,
      maxFiles: 10,
      supportedFormats: ['.json', '.csv', '.xlsx']
    }
  ];

  const supportedFormats = [
    { type: 'document', extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf'], icon: FileText, color: 'bg-blue-100 text-blue-800' },
    { type: 'spreadsheet', extensions: ['.xlsx', '.xls', '.csv'], icon: FileSpreadsheet, color: 'bg-green-100 text-green-800' },
    { type: 'presentation', extensions: ['.pptx', '.ppt'], icon: Presentation, color: 'bg-purple-100 text-purple-800' },
    { type: 'image', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'], icon: Image, color: 'bg-pink-100 text-pink-800' },
    { type: 'archive', extensions: ['.zip', '.rar', '.7z'], icon: Archive, color: 'bg-gray-100 text-gray-800' }
  ];

  const categories = [
    { id: 'safety', name: 'İş Güvenliği', icon: '🛡️', subcategories: ['Genel Güvenlik', 'Acil Durum', 'Ekipman Güvenliği', 'Kimyasal Güvenlik'] },
    { id: 'hr', name: 'İnsan Kaynakları', icon: '👥', subcategories: ['Politikalar', 'Prosedürler', 'Eğitim', 'Performans'] },
    { id: 'operations', name: 'Operasyon', icon: '⚙️', subcategories: ['Üretim', 'Kalite', 'Bakım', 'Lojistik'] },
    { id: 'compliance', name: 'Uyumluluk', icon: '📋', subcategories: ['Yasal', 'ISO', 'Çevre', 'Kalite'] },
    { id: 'it', name: 'Bilgi Teknolojileri', icon: '💻', subcategories: ['Güvenlik', 'Sistem', 'Ağ', 'Yazılım'] }
  ];

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
      const currentType = importTypes.find(t => t.id === importType);
      
      if (currentType && files.length > currentType.maxFiles) {
        alert(`Maksimum ${currentType.maxFiles} dosya seçebilirsiniz`);
        return;
      }
      
      setSelectedFiles(files);
    }
  }, [importType]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const currentType = importTypes.find(t => t.id === importType);
    
    if (currentType && files.length > currentType.maxFiles) {
      alert(`Maksimum ${currentType.maxFiles} dosya seçebilirsiniz`);
      return;
    }
    
    setSelectedFiles(files);
  }, [importType]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    const format = supportedFormats.find(f => f.extensions.includes(`.${extension}`));
    return format ? format.icon : FileText;
  };

  const getFileTypeColor = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    const format = supportedFormats.find(f => f.extensions.includes(`.${extension}`));
    return format ? format.color : 'bg-gray-100 text-gray-800';
  };

  const extractMetadata = async (file: File): Promise<InstructionMetadata> => {
    // Simulate metadata extraction
    const extension = file.name.toLowerCase().split('.').pop();
    const fileType = `application/${extension}`;
    
    // Simulate content analysis
    const keywords = ['güvenlik', 'talimat', 'prosedür', 'kurallar', 'uyumluluk'];
    const compliance = ['ISO 45001', 'OHSAS 18001', 'SGK'];
    const riskLevel = Math.random() > 0.7 ? 'critical' : Math.random() > 0.5 ? 'high' : 'medium';
    
    return {
      fileType,
      fileSize: file.size,
      language: 'tr',
      securityLevel: 'internal',
      compliance,
      riskLevel: riskLevel as 'low' | 'medium' | 'high' | 'critical',
      keywords,
      extractedText: `Extracted text from ${file.name}`,
      summary: `Summary of ${file.name}`
    };
  };

  const processFile = async (file: File, index: number): Promise<CompanyInstruction> => {
    const metadata = await extractMetadata(file);
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    return {
      id: `inst_${Date.now()}_${index}`,
      companyId: companyId || 'default_company',
      companyName: companyInfo.name || 'Şirket Adı',
      title: file.name.replace(/\.[^/.]+$/, ''),
      description: `Import edilen talimat: ${file.name}`,
      content: metadata.extractedText || '',
      category: category.id,
      subcategory: category.subcategories[0],
      priority: metadata.riskLevel,
      status: 'draft',
      author: 'Import Sistemi',
      version: '1.0',
      effectiveDate: new Date().toISOString().split('T')[0],
      reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tags: metadata.keywords,
      targetAudience: ['Tüm Çalışanlar'],
      departments: ['Genel'],
      attachments: [{
        id: `att_${Date.now()}_${index}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        checksum: `checksum_${Date.now()}`
      }],
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readCount: 0,
      mobileOptimized: true,
      qrCode: `QR_${Date.now()}_${index}`
    };
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) return;
    
    setProcessing(true);
    setCurrentStep('process');
    setProgress(0);
    
    const processed: CompanyInstruction[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        const instruction = await processFile(selectedFiles[i], i);
        processed.push(instruction);
        setProgress(((i + 1) / selectedFiles.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
      } catch (error) {
        console.error(`Error processing file ${selectedFiles[i].name}:`, error);
      }
    }
    
    setProcessedFiles(processed);
    setCurrentStep('review');
    setProcessing(false);
  };

  const handleConfirmImport = () => {
    onImport(processedFiles);
    setCurrentStep('complete');
  };

  const renderFilePreview = (instruction: CompanyInstruction) => {
    const attachment = instruction.attachments[0];
    const IconComponent = getFileIcon(attachment.name);
    
    return (
      <div key={instruction.id} className="border rounded-lg p-4 bg-white">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getFileTypeColor(attachment.name)}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{instruction.title}</h4>
              <p className="text-sm text-gray-500">{attachment.name}</p>
            </div>
          </div>
          <Badge variant={instruction.priority === 'critical' ? 'destructive' : 'secondary'}>
            {instruction.priority}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Kategori:</span>
            <span className="ml-2 font-medium">{instruction.category}</span>
          </div>
          <div>
            <span className="text-gray-500">Boyut:</span>
            <span className="ml-2 font-medium">{formatFileSize(attachment.size)}</span>
          </div>
          <div>
            <span className="text-gray-500">Risk Seviyesi:</span>
            <span className="ml-2 font-medium">{instruction.metadata.riskLevel}</span>
          </div>
          <div>
            <span className="text-gray-500">Uyumluluk:</span>
            <span className="ml-2 font-medium">{instruction.metadata.compliance.join(', ')}</span>
          </div>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-1">
          {instruction.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  if (currentStep === 'complete') {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Import Başarılı!</CardTitle>
            <p className="text-gray-600">
              {processedFiles.length} talimat başarıyla import edildi.
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Talimatlar sisteminize eklendi ve mobil platformlarda görüntülenmeye hazır.
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => window.location.reload()}>
                  Yeni Import
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  Kapat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-6 h-6" />
            <span>Firma Talimat Import Sistemi</span>
          </CardTitle>
          <p className="text-gray-600">
            Firma bazlı talimatları hızlı ve kolay bir şekilde import edin
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Company Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firma Adı
              </label>
              <Input
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Firma adını girin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sektör
              </label>
              <Input
                value={companyInfo.industry}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="Sektör"
              />
            </div>
          </div>

          {/* Import Type Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Import Türü Seçin</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {importTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <div
                    key={type.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      importType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setImportType(type.id as any)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                      <h4 className="font-medium">{type.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                    <div className="text-xs text-gray-500">
                      Max {type.maxFiles} dosya
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supported Formats */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Desteklenen Formatlar</h3>
            <div className="flex flex-wrap gap-2">
              {supportedFormats.map((format) => {
                const IconComponent = format.icon;
                return (
                  <div key={format.type} className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${format.color}`}>
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm font-medium">{format.type}</span>
                    <span className="text-xs opacity-75">
                      {format.extensions.join(', ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* File Upload Area */}
          {currentStep === 'select' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dosyaları Seçin</h3>
              <div
                ref={dropZoneRef}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Dosyaları buraya sürükleyin veya
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-2"
                >
                  Dosya Seç
                </Button>
                <p className="text-sm text-gray-500">
                  Maksimum {importTypes.find(t => t.id === importType)?.maxFiles} dosya
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept={importTypes.find(t => t.id === importType)?.supportedFormats.join(',')}
                />
              </div>
            </div>
          )}

          {/* Selected Files */}
          {selectedFiles.length > 0 && currentStep === 'select' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Seçilen Dosyalar ({selectedFiles.length})
              </h3>
              <div className="space-y-3">
                {selectedFiles.map((file, index) => {
                  const IconComponent = getFileIcon(file.name);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getFileTypeColor(file.name)}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <Button variant="outline" onClick={onCancel}>
                  İptal
                </Button>
                <Button onClick={handleImport} disabled={!companyInfo.name}>
                  Import Et
                </Button>
              </div>
            </div>
          )}

          {/* Processing */}
          {currentStep === 'process' && (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Dosyalar İşleniyor...
              </h3>
              <p className="text-gray-600 mb-4">
                Talimatlar analiz ediliyor ve metadata çıkarılıyor
              </p>
              <div className="w-full max-w-md mx-auto">
                <Progress value={progress} className="mb-2" />
                <p className="text-sm text-gray-500">{Math.round(progress)}% tamamlandı</p>
              </div>
            </div>
          )}

          {/* Review */}
          {currentStep === 'review' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Import Önizleme ({processedFiles.length} talimat)
              </h3>
              <div className="space-y-4 mb-6">
                {processedFiles.map(renderFilePreview)}
              </div>
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setCurrentStep('select')}>
                  Geri Dön
                </Button>
                <Button onClick={handleConfirmImport}>
                  Import Et
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyInstructionImporter;
