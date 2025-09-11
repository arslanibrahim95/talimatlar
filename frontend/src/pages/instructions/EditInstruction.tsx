import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { instructionService } from '../../services/instructionService';

interface Instruction {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'pending' | 'approved' | 'published' | 'archived';
  author: string;
  approver?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  attachments: string[];
  targetAudience: string[];
  distributionChannels: string[];
  readCount: number;
  lastReadAt?: string;
}

const EditInstruction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instruction, setInstruction] = useState<Instruction | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'genel',
    priority: 'medium',
    tags: '',
    targetAudience: '',
    distributionChannels: ['dashboard']
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    'genel', 'güvenlik', 'operasyon', 'teknik', 'yönetim', 'acil', 'eğitim', 'prosedür'
  ];

  const priorities = [
    { value: 'low', label: 'Düşük' },
    { value: 'medium', label: 'Orta' },
    { value: 'high', label: 'Yüksek' },
    { value: 'critical', label: 'Kritik' }
  ];

  const distributionChannels = [
    { value: 'email', label: 'E-posta' },
    { value: 'sms', label: 'SMS' },
    { value: 'push_notification', label: 'Push Bildirim' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'mobile_app', label: 'Mobil Uygulama' },
    { value: 'web_portal', label: 'Web Portal' },
    { value: 'intranet', label: 'İntranet' }
  ];

  useEffect(() => {
    if (id) {
      fetchInstruction(id);
    }
  }, [id]);

  const fetchInstruction = async (instructionId: string) => {
    try {
      setIsLoading(true);
      const inst = await instructionService.getInstruction(instructionId);
      setInstruction(inst);
      setFormData({
        title: inst.title,
        description: inst.description,
        content: inst.content,
        category: inst.category,
        priority: inst.priority,
        tags: inst.tags.join(', '),
        targetAudience: inst.targetAudience.join(', '),
        distributionChannels: inst.distributionChannels
      });
    } catch (error) {
      console.error('Talimat yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const instructionData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        targetAudience: formData.targetAudience.split(',').map(audience => audience.trim()).filter(audience => audience)
      };

      await instructionService.updateInstruction(id!, instructionData);
      navigate(`/instructions/${id}`);
    } catch (error) {
      console.error('Talimat güncelleme hatası:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChannelChange = (channel: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        distributionChannels: [...prev.distributionChannels, channel]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        distributionChannels: prev.distributionChannels.filter(c => c !== channel)
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!instruction) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Talimat bulunamadı</p>
        <Button onClick={() => navigate('/instructions')} className="mt-4">
          Talimatlara Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Talimat Düzenle</h1>
        <p className="text-gray-600 dark:text-gray-400">Talimat bilgilerini güncelleyin</p>
      </div>

      {/* Instruction Info */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Versiyon:</span>
              <p className="text-gray-600 dark:text-gray-400">v{instruction.version}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Durum:</span>
              <p className="text-gray-600 dark:text-gray-400 capitalize">{instruction.status}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Son Güncelleme:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date(instruction.updatedAt).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Başlık *
              </label>
              <Input
                id="title"
                type="text"
                placeholder="Talimat başlığını girin"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Açıklama *
              </label>
              <Input
                id="description"
                type="text"
                placeholder="Talimat açıklamasını girin"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategori *
                </label>
                <Select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Öncelik *
                </label>
                <Select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  required
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Etiketler
              </label>
              <Input
                id="tags"
                type="text"
                placeholder="Etiketleri virgülle ayırarak girin (örn: güvenlik, acil, prosedür)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>İçerik</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Talimat İçeriği *
              </label>
              <textarea
                id="content"
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Talimat içeriğini detaylı olarak yazın..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dağıtım Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hedef Kitle
              </label>
              <Input
                id="targetAudience"
                type="text"
                placeholder="Hedef kitleyi virgülle ayırarak girin (örn: tüm kullanıcılar, yöneticiler, operasyon ekibi)"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dağıtım Kanalları
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {distributionChannels.map(channel => (
                  <label key={channel.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.distributionChannels.includes(channel.value)}
                      onChange={(e) => handleChannelChange(channel.value, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {channel.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/instructions/${id}`)}
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditInstruction;
