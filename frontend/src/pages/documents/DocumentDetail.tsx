import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useUXTracking } from '../../utils/analytics';
import { documentService } from '../../services/documentService';

interface Document {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  created_at: string;
  updated_at: string;
  file_size: number;
  file_type: string;
  status: 'active' | 'archived' | 'draft';
  tags: string[];
  version: string;
  downloads: number;
  views: number;
  permissions: string[];
}

const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'metadata' | 'history' | 'permissions'>('content');
  const { trackInteraction } = useUXTracking();

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await documentService.getDocument(id);
        setDocument(data);
        trackInteraction('Document Detail Loaded');
      } catch (err) {
        console.error('Failed to fetch document:', err);
        setError('Doküman yüklenirken hata oluştu');
        trackInteraction('Document Detail Load Error');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, trackInteraction]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleDownload = () => {
    trackInteraction('Document Download');
    // Implement download logic
  };

  const handleEdit = () => {
    trackInteraction('Document Edit');
    navigate(`/documents/${id}/edit`);
  };

  const handleDelete = () => {
    trackInteraction('Document Delete');
    // Implement delete logic with confirmation
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Doküman yükleniyor..." />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hata Oluştu</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Doküman bulunamadı'}</p>
          <Button onClick={() => navigate('/documents')} className="w-full sm:w-auto">
            Dokümanlara Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
            {document.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {document.description}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button 
            onClick={handleDownload}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            İndir
          </Button>
          <Button 
            onClick={handleEdit}
            className="w-full sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Düzenle
          </Button>
          <Button 
            onClick={handleDelete}
            variant="outline"
            className="w-full sm:w-auto text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Sil
          </Button>
        </div>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Görüntüleme</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{document.views}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">İndirme</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{document.downloads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Versiyon</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{document.version}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Boyut</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatFileSize(document.file_size)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <div className="flex space-x-1">
            {[
              { id: 'content', label: 'İçerik', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { id: 'metadata', label: 'Meta Veriler', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'history', label: 'Geçmiş', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'permissions', label: 'İzinler', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'content' && (
            <div className="prose dark:prose-invert max-w-none">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                  {document.content}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Başlık</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{document.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{document.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{document.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Yazar</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{document.author}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Durum</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(document.status)}`}>
                    {document.status === 'active' ? 'Aktif' : 
                     document.status === 'archived' ? 'Arşiv' : 'Taslak'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dosya Türü</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{document.file_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Oluşturulma Tarihi</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(document.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Son Güncelleme</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(document.updated_at).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
              {document.tags.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Etiketler</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {document.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Doküman oluşturuldu</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(document.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">v{document.version}</span>
                </div>
              </div>
              <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Son güncelleme</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(document.updated_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">v{document.version}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Doküman İzinleri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {document.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-900 dark:text-white">{permission}</span>
                    </div>
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

export default DocumentDetail;
