import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import InstructionTemplates from '../../components/InstructionTemplates';
import FileUpload from '../../components/FileUpload';
import { instructionService } from '../../services/instructionService';

const NewInstruction: React.FC = () => {
  const navigate = useNavigate();
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
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [attachments, setAttachments] = useState<Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }>>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const instructionData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        targetAudience: formData.targetAudience.split(',').map(audience => audience.trim()).filter(audience => audience),
        attachments: attachments.map(att => att.name),
        author: 'current_user' // TODO: Get from auth context
      };

      await instructionService.createInstruction(instructionData);
      navigate('/instructions');
    } catch (error) {
      console.error('Talimat oluşturma hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setFormData({
      title: template.name,
      description: template.description,
      content: template.content,
      category: template.category,
      priority: template.priority,
      tags: template.tags.join(', '),
      targetAudience: template.targetAudience.join(', '),
      distributionChannels: template.distributionChannels
    });
    setShowTemplates(false);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const uploadedInstruction = await instructionService.uploadInstruction(file);
      setAttachments(prev => [...prev, {
        id: uploadedInstruction.id,
        name: uploadedInstruction.title || file.name,
        size: file.size,
        type: file.type,
        url: `/instructions/${uploadedInstruction.id}`
      }]);
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      alert('Dosya yüklenirken hata oluştu');
    }
  };

  const handleFileRemove = (fileId: string) => {
    setAttachments(prev => prev.filter(file => file.id !== fileId));
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yeni Talimat</h1>
          <p className="text-gray-600 dark:text-gray-400">Yeni bir talimat oluşturun</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            Şablon Kullan
          </Button>
          <Button variant="outline" onClick={() => navigate('/instructions')}>
            Talimatlara Dön
          </Button>
        </div>
      </div>

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
            <CardTitle>Ekler</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
              uploadedFiles={attachments}
              maxFiles={5}
              maxSize={10}
              acceptedTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png', '.gif']}
            />
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
            onClick={() => navigate('/instructions')}
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Oluşturuluyor...' : 'Talimat Oluştur'}
          </Button>
        </div>
      </form>

      {/* Template Modal */}
      {showTemplates && (
        <InstructionTemplates
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};

export default NewInstruction;
