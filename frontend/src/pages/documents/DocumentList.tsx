import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner, TableSkeleton } from '../../components/ui/LoadingSpinner';
import { Search } from '../../components/ui/Search';
import { useUXTracking } from '../../utils/analytics';
import { documentService } from '../../services/documentService';

interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  author: string;
  created_at: string;
  updated_at: string;
  file_size: number;
  file_type: string;
  status: 'active' | 'archived' | 'draft';
  tags: string[];
}

const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { trackInteraction } = useUXTracking();

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const data = await documentService.getDocuments();
        setDocuments(data);
        trackInteraction('Documents Loaded');
      } catch (err) {
        console.error('Failed to fetch documents:', err);
        setError('Dokümanlar yüklenirken hata oluştu');
        trackInteraction('Documents Load Error');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [trackInteraction]);

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Sort documents
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [documents, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(documents.map(doc => doc.category))];
    return ['all', ...uniqueCategories];
  }, [documents]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dokümanlar</h1>
            <p className="text-gray-600 dark:text-gray-400">Tüm dokümanları görüntüleyin ve yönetin</p>
          </div>
        </div>
        <TableSkeleton rows={10} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hata Oluştu</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dokümanlar</h1>
          <p className="text-gray-600 dark:text-gray-400">Tüm dokümanları görüntüleyin ve yönetin</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button 
            onClick={() => trackInteraction('New Document Button')}
            className="w-full sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Doküman
          </Button>
          <Button 
            variant="outline"
            onClick={() => trackInteraction('Upload Document Button')}
            className="w-full sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Yükle
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Arama
              </label>
              <Search 
                placeholder="Doküman ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Tüm Kategoriler' : category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sıralama
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="created_at-desc">En Yeni</option>
                <option value="created_at-asc">En Eski</option>
                <option value="title-asc">Başlık A-Z</option>
                <option value="title-desc">Başlık Z-A</option>
                <option value="updated_at-desc">Son Güncelleme</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedDocuments.map((document) => (
          <Card 
            key={document.id} 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => {
              trackInteraction('Document Card Click');
              // Navigate to document detail
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    {document.title}
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {document.description}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                    {document.status === 'active' ? 'Aktif' : 
                     document.status === 'archived' ? 'Arşiv' : 'Taslak'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Kategori:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{document.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Yazar:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{document.author}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Boyut:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatFileSize(document.file_size)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Oluşturulma:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(document.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                {document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {document.tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        +{document.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedDocuments.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Doküman Bulunamadı</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Arama kriterlerinize uygun doküman bulunamadı.'
                : 'Henüz hiç doküman eklenmemiş.'
              }
            </p>
            <Button onClick={() => trackInteraction('Empty State New Document')}>
              İlk Dokümanı Oluştur
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      {filteredAndSortedDocuments.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {filteredAndSortedDocuments.length} doküman bulundu
        </div>
      )}
    </div>
  );
};

export default DocumentList;
