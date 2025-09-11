import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useUXTracking } from '../utils/analytics';

interface Category {
  id: string;
  name: string;
  description: string;
  document_count: number;
  color: string;
  created_at: string;
  updated_at: string;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { trackInteraction } = useUXTracking();

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCategories([
        {
          id: '1',
          name: 'Teknik Dokümanlar',
          description: 'Teknik kılavuzlar ve dokümantasyon',
          document_count: 45,
          color: '#3B82F6',
          created_at: '2024-01-15',
          updated_at: '2024-01-20'
        },
        {
          id: '2',
          name: 'Kullanıcı Kılavuzları',
          description: 'Kullanıcılar için hazırlanan rehberler',
          document_count: 23,
          color: '#10B981',
          created_at: '2024-01-10',
          updated_at: '2024-01-18'
        },
        {
          id: '3',
          name: 'Politikalar',
          description: 'Şirket politikaları ve prosedürler',
          document_count: 12,
          color: '#F59E0B',
          created_at: '2024-01-05',
          updated_at: '2024-01-15'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Kategoriler yükleniyor..." />
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kategoriler</h1>
          <p className="text-gray-600 dark:text-gray-400">Doküman kategorilerini yönetin</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button 
            onClick={() => trackInteraction('New Category Button')}
            className="w-full sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Kategori
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Kategori ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                ></div>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {category.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {category.document_count} doküman
                </span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Düzenle
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600">
                    Sil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Kategori Bulunamadı</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? 'Arama kriterlerinize uygun kategori bulunamadı.' : 'Henüz hiç kategori eklenmemiş.'}
            </p>
            <Button onClick={() => trackInteraction('Empty State New Category')}>
              İlk Kategoriyi Ekle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Categories;
