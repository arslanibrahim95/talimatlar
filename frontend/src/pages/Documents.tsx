import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../utils/cn';

// Mock data - gerçek uygulamada API'den gelecek
const documents = [
  {
    id: 1,
    title: 'İş Güvenliği Talimatı v2.1',
    category: 'Talimat',
    status: 'active',
    updatedAt: '2024-01-15',
    updatedBy: 'Ahmet Yılmaz',
    size: '2.4 MB',
    downloads: 156,
    tags: ['güvenlik', 'talimat', 'iş güvenliği']
  },
  {
    id: 2,
    title: 'Yangın Güvenliği Prosedürü',
    category: 'Prosedür',
    status: 'active',
    updatedAt: '2024-01-14',
    updatedBy: 'Fatma Demir',
    size: '1.8 MB',
    downloads: 89,
    tags: ['yangın', 'güvenlik', 'prosedür']
  },
  {
    id: 3,
    title: 'Kişisel Koruyucu Ekipman Listesi',
    category: 'Liste',
    status: 'draft',
    updatedAt: '2024-01-13',
    updatedBy: 'Mehmet Kaya',
    size: '0.9 MB',
    downloads: 45,
    tags: ['KKD', 'ekipman', 'koruyucu']
  },
  {
    id: 4,
    title: 'Acil Durum Planı',
    category: 'Plan',
    status: 'active',
    updatedAt: '2024-01-12',
    updatedBy: 'Ayşe Özkan',
    size: '3.2 MB',
    downloads: 234,
    tags: ['acil durum', 'plan', 'güvenlik']
  },
  {
    id: 5,
    title: 'Çalışan Eğitim Programı',
    category: 'Program',
    status: 'active',
    updatedAt: '2024-01-11',
    updatedBy: 'Ali Veli',
    size: '1.5 MB',
    downloads: 67,
    tags: ['eğitim', 'program', 'çalışan']
  }
];

const categories = [
  'Tümü',
  'Talimat',
  'Prosedür',
  'Liste',
  'Plan',
  'Program',
  'Form',
  'Kontrol Listesi'
];

const statuses = [
  'Tümü',
  'Aktif',
  'Taslak',
  'Arşivlenmiş',
  'Onay Bekliyor'
];

const Documents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedStatus, setSelectedStatus] = useState('Tümü');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'Tümü' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Tümü' || 
                         (selectedStatus === 'Aktif' && doc.status === 'active') ||
                         (selectedStatus === 'Taslak' && doc.status === 'draft') ||
                         (selectedStatus === 'Arşivlenmiş' && doc.status === 'archived');
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'draft':
        return 'Taslak';
      case 'archived':
        return 'Arşivlenmiş';
      default:
        return 'Bilinmiyor';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Talimat':
        return '📋';
      case 'Prosedür':
        return '📝';
      case 'Liste':
        return '📋';
      case 'Plan':
        return '🗺️';
      case 'Program':
        return '📅';
      case 'Form':
        return '📄';
      case 'Kontrol Listesi':
        return '✅';
      default:
        return '📄';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dokümanlar
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Tüm dokümanları görüntüleyin ve yönetin
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              📤 Toplu İçe Aktar
            </Button>
            <Button>
              📝 Yeni Doküman
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Input
                label="Doküman Ara"
                placeholder="Doküman adı veya etiket ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon="🔍"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durum
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredDocuments.length} doküman bulundu
            </div>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                📱 Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                📋 Liste
              </Button>
            </div>
          </div>
        </div>

        {/* Documents Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">{getCategoryIcon(doc.category)}</div>
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      getStatusColor(doc.status)
                    )}
                  >
                    {getStatusText(doc.status)}
                  </span>
                </div>

                <h3 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {doc.title}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>📁 {doc.category}</p>
                  <p>📅 {doc.updatedAt}</p>
                  <p>👤 {doc.updatedBy}</p>
                  <p>💾 {doc.size}</p>
                  <p>⬇️ {doc.downloads} indirme</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {doc.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                      +{doc.tags.length - 3}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    👁️ Görüntüle
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    ⬇️ İndir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Doküman
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Güncellenme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İndirme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-xl mr-3">{getCategoryIcon(doc.category)}</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {doc.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {doc.updatedBy}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {doc.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            getStatusColor(doc.status)
                          )}
                        >
                          {getStatusText(doc.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {doc.updatedAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {doc.downloads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            👁️
                          </Button>
                          <Button variant="ghost" size="sm">
                            ⬇️
                          </Button>
                          <Button variant="ghost" size="sm">
                            ✏️
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Doküman bulunamadı
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Arama kriterlerinize uygun doküman bulunamadı.
            </p>
            <Button onClick={() => {
              setSearchTerm('');
              setSelectedCategory('Tümü');
              setSelectedStatus('Tümü');
            }}>
              Filtreleri Temizle
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Documents;
