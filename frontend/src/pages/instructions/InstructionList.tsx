import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { instructionService } from '../../services/instructionService';

interface Instruction {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'pending' | 'approved' | 'published' | 'archived';
  author: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  readCount: number;
  tags: string[];
}

const InstructionList: React.FC = () => {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  const categories = [
    'genel', 'güvenlik', 'operasyon', 'teknik', 'yönetim', 'acil', 'eğitim', 'prosedür'
  ];

  const statuses = [
    { value: 'draft', label: 'Taslak' },
    { value: 'pending', label: 'Beklemede' },
    { value: 'approved', label: 'Onaylandı' },
    { value: 'published', label: 'Yayınlandı' },
    { value: 'archived', label: 'Arşivlendi' }
  ];

  const priorities = [
    { value: 'low', label: 'Düşük' },
    { value: 'medium', label: 'Orta' },
    { value: 'high', label: 'Yüksek' },
    { value: 'critical', label: 'Kritik' }
  ];

  useEffect(() => {
    fetchInstructions();
  }, [searchQuery, selectedCategory, selectedStatus, selectedPriority]);

  const fetchInstructions = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedPriority) filters.priority = selectedPriority;

      const response = await instructionService.getInstructions(1, 100, filters);
      setInstructions(response.data || response.items || []);
    } catch (error) {
      console.error('Talimatlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'archived': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const getPriorityLabel = (priority: string) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.label : priority;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Talimatlar</h1>
          <p className="text-gray-600 dark:text-gray-400">Sistem talimatlarını yönetin</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/instructions/new">
            <Button>
              Yeni Talimat
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Arama
              </label>
              <Input
                placeholder="Talimat ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori
              </label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Tümü</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durum
              </label>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Tümü</option>
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Öncelik
              </label>
              <Select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
              >
                <option value="">Tümü</option>
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedStatus('');
                  setSelectedPriority('');
                }}
                className="w-full"
              >
                Temizle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Talimat Listesi */}
      <div className="grid gap-4">
        {instructions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Henüz talimat bulunmuyor</p>
            </CardContent>
          </Card>
        ) : (
          instructions.map((instruction) => (
            <Card key={instruction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        <Link 
                          to={`/instructions/${instruction.id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {instruction.title}
                        </Link>
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(instruction.priority)}`}>
                        {getPriorityLabel(instruction.priority)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(instruction.status)}`}>
                        {getStatusLabel(instruction.status)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {instruction.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Kategori: {instruction.category}</span>
                      <span>Yazar: {instruction.author}</span>
                      <span>Versiyon: {instruction.version}</span>
                      <span>Okunma: {instruction.readCount}</span>
                      <span>Güncellenme: {new Date(instruction.updatedAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                    
                    {instruction.tags.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {instruction.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Link to={`/instructions/${instruction.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Düzenle
                      </Button>
                    </Link>
                    {instruction.status === 'approved' && (
                      <Button size="sm">
                        Yayınla
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default InstructionList;
