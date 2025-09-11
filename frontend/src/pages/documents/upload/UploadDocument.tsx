import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useUXTracking } from '../../utils/analytics';

const UploadDocument: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { trackInteraction } = useUXTracking();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackInteraction('Document Uploaded');
    // Handle file upload
    navigate('/documents');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doküman Yükle</h1>
          <p className="text-gray-600 dark:text-gray-400">Mevcut dokümanı sisteme yükleyin</p>
        </div>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Doküman Yükleme</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dosya Seç
              </label>
              <Input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.md"
                required
              />
              {selectedFile && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Seçilen dosya: {selectedFile.name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Başlık
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Doküman başlığı"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Açıklama
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Doküman açıklaması"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Kategori seçin</option>
                <option value="technical">Teknik</option>
                <option value="user-guide">Kullanıcı Kılavuzu</option>
                <option value="policy">Politika</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Etiketler
              </label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Etiketler (virgülle ayırın)"
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit">
                Yükle
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/documents')}
              >
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadDocument;
