import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import RichTextEditor from '../components/RichTextEditor';

interface DocumentData {
  title: string;
  description: string;
  category: string;
  author: string;
  version: string;
  tags: string[];
  content: string;
}

const CreateDocument: React.FC = () => {
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState<DocumentData>({
    title: '',
    description: '',
    category: '',
    author: '',
    version: '1.0',
    tags: [],
    content: ''
  });
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof DocumentData, value: string) => {
    setDocumentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !documentData.tags.includes(newTag.trim())) {
      setDocumentData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDocumentData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    if (!documentData.title.trim()) {
      alert('Lütfen doküman başlığı girin');
      return;
    }

    setIsSaving(true);

    try {
      // Gerçek uygulamada burada API'ye kaydetme yapılır
      // Şimdilik localStorage'a kaydediyoruz
      const savedDocuments = JSON.parse(localStorage.getItem('documents') || '[]');
      const newDocument = {
        id: Date.now().toString(),
        ...documentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      savedDocuments.push(newDocument);
      localStorage.setItem('documents', JSON.stringify(savedDocuments));

      // Başarı mesajı
      alert('Doküman başarıyla kaydedildi!');
      
      // Dosya yönetimi sayfasına yönlendir
      navigate('/file-management');
    } catch (error) {
      console.error('Doküman kaydetme hatası:', error);
      alert('Doküman kaydedilirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (documentData.title || documentData.content) {
      const confirmed = window.confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?');
      if (confirmed) {
        navigate('/file-management');
      }
    } else {
      navigate('/file-management');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Yeni Doküman Oluştur
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Boş sayfadan başlayarak zengin içerikli doküman oluşturun
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                ❌ İptal
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !documentData.title.trim()}
              >
                {isSaving ? '💾 Kaydediliyor...' : '💾 Kaydet'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Panel - Doküman Bilgileri */}
          <div className="lg:col-span-1 space-y-6">
            {/* Temel Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle>Doküman Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Başlık *
                  </label>
                  <Input
                    placeholder="Doküman başlığı"
                    value={documentData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    placeholder="Doküman açıklaması"
                    value={documentData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategori
                  </label>
                  <Input
                    placeholder="Doküman kategorisi"
                    value={documentData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Yazar
                  </label>
                  <Input
                    placeholder="Doküman yazarı"
                    value={documentData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Versiyon
                  </label>
                  <Input
                    placeholder="1.0"
                    value={documentData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Etiketler */}
            <Card>
              <CardHeader>
                <CardTitle>Etiketler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Yeni etiket"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button size="sm" onClick={addTag}>
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {documentData.tags.map((tag, index) => (
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
              </CardContent>
            </Card>

            {/* Hızlı İpuçları */}
            <Card>
              <CardHeader>
                <CardTitle>💡 Hızlı İpuçları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• <strong>B</strong> - Kalın metin</p>
                <p>• <em>I</em> - İtalik metin</p>
                <p>• <u>U</u> - Altı çizili metin</p>
                <p>• H1, H2, H3 - Başlık seviyeleri</p>
                <p>• • Liste - Madde işaretli liste</p>
                <p>• 1. Liste - Numaralı liste</p>
                <p>• 🖼️ - Resim ekleme</p>
                <p>• 📊 - Tablo ekleme</p>
                <p>• 🔗 - Bağlantı ekleme</p>
                <p>• 📁 - Resim yükleme</p>
                <p>• Drag & Drop - Resim sürükleme</p>
              </CardContent>
            </Card>
          </div>

          {/* Sağ Panel - İçerik Editörü */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>İçerik Editörü</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={documentData.content}
                  onContentChange={(content) => handleInputChange('content', content)}
                  placeholder="Doküman içeriğinizi buraya yazın... Resim eklemek için toolbar'daki resim butonlarını kullanın veya dosyayı buraya sürükleyip bırakın."
                  className="min-h-[600px]"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            size="lg"
          >
            ❌ İptal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !documentData.title.trim()}
            size="lg"
          >
            {isSaving ? '💾 Kaydediliyor...' : '💾 Dokümanı Kaydet'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateDocument;
