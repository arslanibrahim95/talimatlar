import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import FileViewer from '../components/FileViewer';
import AdvancedFileUpload from '../components/AdvancedFileUpload';

interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  content?: string;
  uploadDate: Date;
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
    author?: string;
    version?: string;
  };
}

const FileManagement: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'detail'>('grid');

  // Mock data - gerçek uygulamada API'den gelecek
  useEffect(() => {
    const mockFiles: FileData[] = [
      {
        id: '1',
        name: 'güvenlik-protokolü.pdf',
        size: 2048576,
        type: 'application/pdf',
        url: '#',
        content: `
          <h1>Güvenlik Protokolü ve Acil Durum Prosedürleri</h1>
          <p>Bu doküman, çalışan güvenliği için kapsamlı rehber niteliğindedir.</p>
          
          <h2>1. Genel Güvenlik Kuralları</h2>
          <ul>
            <li>Çalışma alanında güvenlik ekipmanları kullanımı zorunludur</li>
            <li>Acil çıkış yolları her zaman açık tutulmalıdır</li>
            <li>Güvenlik işaretleri dikkatle takip edilmelidir</li>
          </ul>
          
          <h2>2. Acil Durum Prosedürleri</h2>
          <p>Acil durumlarda aşağıdaki adımlar takip edilmelidir:</p>
          <ol>
            <li>Panik yapmayın</li>
            <li>En yakın acil çıkışı kullanın</li>
            <li>Güvenlik personeline haber verin</li>
          </ol>
          
          <h3>2.1 Yangın Durumu</h3>
          <p>Yangın durumunda <strong>ASLA</strong> asansör kullanmayın!</p>
          
          <h3>2.2 Deprem Durumu</h3>
          <p>Deprem sırasında masa altına sığının ve başınızı koruyun.</p>
        `,
        uploadDate: new Date('2024-01-15'),
        metadata: {
          title: 'Güvenlik Protokolü ve Acil Durum Prosedürleri',
          description: 'Çalışan güvenliği için kapsamlı rehber',
          tags: ['güvenlik', 'prosedür', 'acil-durum'],
          category: 'Güvenlik',
          author: 'Güvenlik Müdürlüğü',
          version: '2.1'
        }
      },
      {
        id: '2',
        name: 'kalite-kontrol.docx',
        size: 1048576,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        url: '#',
        uploadDate: new Date('2024-01-14'),
        metadata: {
          title: 'Kalite Kontrol Prosedürleri',
          description: 'Üretim kalite kontrol süreçleri',
          tags: ['kalite', 'kontrol', 'üretim'],
          category: 'Kalite',
          author: 'Kalite Müdürlüğü',
          version: '1.5'
        }
      },
      {
        id: '3',
        name: 'egitim-planı.xlsx',
        size: 512000,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        url: '#',
        uploadDate: new Date('2024-01-13'),
        metadata: {
          title: 'Yıllık Eğitim Planı',
          description: 'Çalışan eğitim programları ve takvimi',
          tags: ['eğitim', 'plan', 'çalışan'],
          category: 'İnsan Kaynakları',
          author: 'İK Müdürlüğü',
          version: '1.0'
        }
      }
    ];
    setFiles(mockFiles);
  }, []);

  const handleFileUpload = async (file: File) => {
    const newFile: FileData = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      content: '', // Boş içerik ile başla
      uploadDate: new Date(),
      metadata: {
        title: file.name,
        description: '',
        tags: [],
        category: '',
        author: '',
        version: '1.0'
      }
    };

    setFiles(prev => [newFile, ...prev]);
  };

  const handleFileRemove = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  };

  const handleFileUpdate = (fileId: string, updates: any) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { 
            ...file, 
            ...updates,
            // İçerik güncellemesi varsa content'i de güncelle
            ...(updates.content && { content: updates.content })
          }
        : file
    ));
    
    if (selectedFile?.id === fileId) {
      setSelectedFile(prev => prev ? { 
        ...prev, 
        ...updates,
        ...(updates.content && { content: updates.content })
      } : null);
    }
  };

  const handleFileDownload = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !filterCategory || file.metadata?.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'size':
        aValue = a.size;
        bValue = b.size;
        break;
      case 'date':
        aValue = a.uploadDate.getTime();
        bValue = b.uploadDate.getTime();
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      default:
        aValue = a.uploadDate.getTime();
        bValue = b.uploadDate.getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const categories = Array.from(new Set(files.map(f => f.metadata?.category).filter(Boolean)));

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('text')) return '📃';
    return '📎';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dosya Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Yüklenen dosyaları görüntüleyin, düzenleyin ve yönetin
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dosya Ara
            </label>
            <Input
              placeholder="Dosya adı, açıklama veya etiket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kategori Filtresi
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sıralama
            </label>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="date">Tarih</option>
                <option value="name">İsim</option>
                <option value="size">Boyut</option>
                <option value="type">Tür</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📱 Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📋 Liste
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'detail'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🔍 Detay
            </button>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredFiles.length} dosya bulundu
          </div>
        </div>

        {/* File Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Yeni Dosya Yükle</CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedFileUpload
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
                uploadedFiles={[]}
                maxFiles={10}
                maxSize={100}
                showPreview={true}
                allowMultiple={true}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Yeni Doküman Oluştur</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Boş Sayfadan Başlayın
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Zengin metin editörü ile profesyonel dokümanlar oluşturun
              </p>
              <Button
                onClick={() => navigate('/create-document')}
                className="w-full"
              >
                ✨ Yeni Doküman Oluştur
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Files Display */}
        {viewMode === 'detail' && selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedFile(null)}
              >
                ← Dosya Listesine Dön
              </Button>
            </div>
            <FileViewer
              file={selectedFile}
              onUpdate={handleFileUpdate}
              onDelete={handleFileRemove}
              onDownload={handleFileDownload}
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedFiles.map(file => (
              <Card
                key={file.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedFile(file)}
              >
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <div className="text-4xl">{getFileIcon(file.type)}</div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {file.metadata?.title || file.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {file.uploadDate.toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    {file.metadata?.category && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                        {file.metadata.category}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedFiles.map(file => (
              <Card
                key={file.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedFile(file)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {file.metadata?.title || file.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {file.metadata?.description || 'Açıklama yok'}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <div>{formatFileSize(file.size)}</div>
                      <div>{file.uploadDate.toLocaleDateString('tr-TR')}</div>
                    </div>
                    {file.metadata?.category && (
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                        {file.metadata.category}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {sortedFiles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz dosya yüklenmemiş
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              İlk dosyanızı yüklemek için yukarıdaki formu kullanın
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManagement;
