import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';

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

interface SafetyDocumentViewerProps {
  document: SafetyDocument;
  onUpdate: (document: SafetyDocument) => void;
  onDelete: (documentId: string) => void;
  onDownload: (document: SafetyDocument) => void;
  onPrint: (document: SafetyDocument) => void;
  onShare: (document: SafetyDocument) => void;
  className?: string;
}

const SafetyDocumentViewer: React.FC<SafetyDocumentViewerProps> = ({
  document,
  onUpdate,
  onDelete,
  onDownload,
  onPrint,
  onShare,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: document.title,
    description: document.description,
    category: document.category,
    tags: document.tags,
    priority: document.priority,
    department: document.department,
    effectiveDate: document.effectiveDate,
    reviewDate: document.reviewDate,
    author: document.author,
    version: document.version,
    status: document.status
  });
  const [newTag, setNewTag] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'metadata' | 'history'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Safety document categories
  const safetyCategories = [
    { id: 'general-safety', name: 'Genel Güvenlik', icon: '🛡️', color: 'blue' },
    { id: 'emergency-procedures', name: 'Acil Durum Prosedürleri', icon: '🚨', color: 'red' },
    { id: 'equipment-safety', name: 'Ekipman Güvenliği', icon: '⚙️', color: 'green' },
    { id: 'chemical-safety', name: 'Kimyasal Güvenlik', icon: '🧪', color: 'yellow' },
    { id: 'fire-safety', name: 'Yangın Güvenliği', icon: '🔥', color: 'red' },
    { id: 'electrical-safety', name: 'Elektrik Güvenliği', icon: '⚡', color: 'yellow' },
    { id: 'workplace-safety', name: 'İşyeri Güvenliği', icon: '🏭', color: 'blue' },
    { id: 'personal-protection', name: 'Kişisel Koruyucu Donanım', icon: '👷', color: 'green' },
    { id: 'training-materials', name: 'Eğitim Materyalleri', icon: '📚', color: 'purple' },
    { id: 'compliance', name: 'Uyumluluk', icon: '📋', color: 'gray' }
  ];

  const priorityColors = {
    low: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200',
    medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200',
    critical: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
  };

  const statusColors = {
    draft: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
    active: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200',
    archived: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
  };

  useEffect(() => {
    // Track view count
    if (document.id) {
      // In a real app, this would make an API call to track the view
      console.log(`Document ${document.id} viewed`);
    }
  }, [document.id]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    const icons: { [key: string]: string } = {
      'application/pdf': '📄',
      'application/msword': '📝',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
      'application/vnd.ms-excel': '📊',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
      'application/vnd.ms-powerpoint': '📈',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📈',
      'text/plain': '📃',
      'image/jpeg': '🖼️',
      'image/png': '🖼️'
    };
    return icons[fileType] || '📎';
  };

  const getCategoryInfo = (categoryId: string) => {
    return safetyCategories.find(cat => cat.id === categoryId) || safetyCategories[0];
  };

  const handleSave = () => {
    const updatedDocument = {
      ...document,
      ...editData,
      updatedAt: new Date().toISOString()
    };
    onUpdate(updatedDocument);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      title: document.title,
      description: document.description,
      category: document.category,
      tags: document.tags,
      priority: document.priority,
      department: document.department,
      effectiveDate: document.effectiveDate,
      reviewDate: document.reviewDate,
      author: document.author,
      version: document.version,
      status: document.status
    });
    setIsEditing(false);
  };

  const addTag = () => {
    if (newTag.trim() && !editData.tags.includes(newTag.trim())) {
      setEditData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const isExpired = () => {
    return new Date(document.reviewDate) < new Date();
  };

  const isExpiringSoon = () => {
    const reviewDate = new Date(document.reviewDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return reviewDate <= thirtyDaysFromNow && reviewDate > new Date();
  };

  const renderFilePreview = () => {
    if (typeof document.file === 'string') {
      // URL-based file
      if (document.metadata.fileType.startsWith('image/')) {
        return (
          <div className="max-w-full overflow-hidden rounded-lg">
            <img
              src={document.file}
              alt={document.title}
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
        );
      }
      
      if (document.metadata.fileType === 'application/pdf') {
        return (
          <div className="w-full h-96 border border-gray-300 dark:border-gray-600 rounded-lg">
            <iframe
              src={document.file}
              className="w-full h-full rounded-lg"
              title={document.title}
            />
          </div>
        );
      }
    }

    // File object or content
    if (document.content) {
      return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg max-h-96 overflow-y-auto">
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: document.content }}
          />
        </div>
      );
    }

    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-6xl mb-4">{getFileIcon(document.metadata.fileType)}</div>
        <p className="text-lg mb-2">Dosya Önizlemesi</p>
        <p className="text-sm">Bu dosya türü için önizleme mevcut değil</p>
        <Button 
          className="mt-4" 
          onClick={() => onDownload(document)}
        >
          İndir ve Görüntüle
        </Button>
      </div>
    );
  };

  const renderMetadata = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Dosya Bilgileri</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Dosya Boyutu:</span>
              <span className="font-medium">{formatFileSize(document.metadata.fileSize)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Dosya Türü:</span>
              <span className="font-medium">{document.metadata.fileType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Son Değişiklik:</span>
              <span className="font-medium">
                {new Date(document.metadata.lastModified).toLocaleDateString('tr-TR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Checksum:</span>
              <span className="font-mono text-xs">{document.metadata.checksum.substring(0, 16)}...</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">İstatistikler</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Görüntülenme:</span>
              <span className="font-medium">{document.viewCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">İndirme:</span>
              <span className="font-medium">{document.downloadCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Son Görüntülenme:</span>
              <span className="font-medium">
                {document.lastViewed ? new Date(document.lastViewed).toLocaleDateString('tr-TR') : 'Hiç'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Güvenlik Bilgileri</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">📅</span>
              <span className="font-medium">Geçerlilik Tarihi</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(document.effectiveDate).toLocaleDateString('tr-TR')}
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">🔄</span>
              <span className="font-medium">Gözden Geçirme Tarihi</span>
            </div>
            <p className={`text-sm ${isExpired() ? 'text-red-600' : isExpiringSoon() ? 'text-yellow-600' : 'text-gray-600 dark:text-gray-400'}`}>
              {new Date(document.reviewDate).toLocaleDateString('tr-TR')}
              {isExpired() && ' (Süresi Dolmuş)'}
              {isExpiringSoon() && ' (Yakında Dolacak)'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Doküman Oluşturuldu</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(document.metadata.lastModified).toLocaleString('tr-TR')}
            </p>
          </div>
        </div>
      </div>
      
      {document.lastViewed && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Son Görüntülenme</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(document.lastViewed).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const categoryInfo = getCategoryInfo(document.category);

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-auto' : ''} ${className}`}>
      <Card className={isFullscreen ? 'border-0 shadow-none' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <span className="text-3xl">{getFileIcon(document.metadata.fileType)}</span>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <CardTitle className="text-xl">{document.title}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[document.priority]}`}>
                    {document.priority.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[document.status]}`}>
                    {document.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>{categoryInfo.icon} {categoryInfo.name}</span>
                  <span>📁 {document.department}</span>
                  <span>👤 {document.author || 'Belirtilmemiş'}</span>
                  <span>v{document.version}</span>
                </div>
                {isExpired() && (
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-sm">
                    ⚠️ Bu dokümanın gözden geçirme tarihi geçmiş!
                  </div>
                )}
                {isExpiringSoon() && !isExpired() && (
                  <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-yellow-800 dark:text-yellow-200 text-sm">
                    ⚠️ Bu dokümanın gözden geçirme tarihi yaklaşıyor!
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? '🔽' : '🔼'}
              </Button>
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(document)}
                  >
                    📥 İndir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPrint(document)}
                  >
                    🖨️ Yazdır
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShare(document)}
                  >
                    🔗 Paylaş
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    ✏️ Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(document.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    🗑️ Sil
                  </Button>
                </>
              )}
              {isEditing && (
                <>
                  <Button size="sm" onClick={handleSave}>
                    💾 Kaydet
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    ❌ İptal
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* View Mode Tabs */}
          <div className="flex space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'preview', label: 'Önizleme', icon: '👁️' },
              { id: 'metadata', label: 'Bilgiler', icon: '📋' },
              { id: 'history', label: 'Geçmiş', icon: '🕒' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content based on view mode */}
          {viewMode === 'preview' && renderFilePreview()}
          {viewMode === 'metadata' && renderMetadata()}
          {viewMode === 'history' && renderHistory()}

          {/* Description */}
          {document.description && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Açıklama</h4>
              <p className="text-gray-700 dark:text-gray-300">{document.description}</p>
            </div>
          )}

          {/* Tags */}
          {document.tags.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Etiketler</h4>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Edit Form */}
          {isEditing && (
            <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Doküman Bilgilerini Düzenle</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Başlık *
                  </label>
                  <Input
                    value={editData.title}
                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Doküman başlığı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={editData.category}
                    onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
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
                  <Input
                    value={editData.department}
                    onChange={(e) => setEditData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Departman"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Öncelik *
                  </label>
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value as any }))}
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
                    value={editData.author}
                    onChange={(e) => setEditData(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Doküman yazarı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Versiyon
                  </label>
                  <Input
                    value={editData.version}
                    onChange={(e) => setEditData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Geçerlilik Tarihi
                  </label>
                  <Input
                    type="date"
                    value={editData.effectiveDate}
                    onChange={(e) => setEditData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gözden Geçirme Tarihi
                  </label>
                  <Input
                    type="date"
                    value={editData.reviewDate}
                    onChange={(e) => setEditData(prev => ({ ...prev, reviewDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Doküman açıklaması"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Etiketler
                </label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Yeni etiket"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button size="sm" onClick={addTag}>
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SafetyDocumentViewer;

