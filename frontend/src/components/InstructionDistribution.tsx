import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { instructionService } from '../services/instructionService';

interface InstructionDistributionProps {
  instructionId: string;
  instructionTitle: string;
  onClose: () => void;
}

const InstructionDistribution: React.FC<InstructionDistributionProps> = ({
  instructionId,
  instructionTitle,
  onClose
}) => {
  const [distributionData, setDistributionData] = useState({
    channels: ['dashboard'],
    targetUsers: '',
    scheduledAt: '',
    priority: 'medium',
    customMessage: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const distributionChannels = [
    { value: 'email', label: 'E-posta', icon: '📧' },
    { value: 'sms', label: 'SMS', icon: '📱' },
    { value: 'push_notification', label: 'Push Bildirim', icon: '🔔' },
    { value: 'dashboard', label: 'Dashboard', icon: '📊' },
    { value: 'mobile_app', label: 'Mobil Uygulama', icon: '📲' },
    { value: 'web_portal', label: 'Web Portal', icon: '🌐' },
    { value: 'intranet', label: 'İntranet', icon: '🏢' }
  ];

  const priorities = [
    { value: 'low', label: 'Düşük' },
    { value: 'medium', label: 'Orta' },
    { value: 'high', label: 'Yüksek' },
    { value: 'critical', label: 'Kritik' }
  ];

  const handleChannelChange = (channel: string, checked: boolean) => {
    if (checked) {
      setDistributionData(prev => ({
        ...prev,
        channels: [...prev.channels, channel]
      }));
    } else {
      setDistributionData(prev => ({
        ...prev,
        channels: prev.channels.filter(c => c !== channel)
      }));
    }
  };

  const handleDistribute = async () => {
    setIsLoading(true);
    
    try {
      const targetUsers = distributionData.targetUsers.split(',').map(user => user.trim()).filter(user => user);
      await instructionService.distributeInstruction(instructionId, targetUsers);
      alert('Talimat başarıyla dağıtıldı!');
      onClose();
    } catch (error) {
      console.error('Dağıtım hatası:', error);
      alert('Dağıtım sırasında hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Talimat Dağıtımı
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Dağıtılacak Talimat:
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{instructionTitle}</p>
          </div>

          <div className="space-y-6">
            {/* Dağıtım Kanalları */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Dağıtım Kanalları *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {distributionChannels.map(channel => (
                  <label key={channel.value} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={distributionData.channels.includes(channel.value)}
                      onChange={(e) => handleChannelChange(channel.value, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-lg">{channel.icon}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {channel.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hedef Kullanıcılar */}
            <div>
              <label htmlFor="targetUsers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hedef Kullanıcılar
              </label>
              <Input
                id="targetUsers"
                type="text"
                placeholder="Kullanıcı e-postalarını virgülle ayırarak girin (boş bırakırsanız tüm kullanıcılara gönderilir)"
                value={distributionData.targetUsers}
                onChange={(e) => setDistributionData({ ...distributionData, targetUsers: e.target.value })}
              />
            </div>

            {/* Öncelik */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dağıtım Önceliği
              </label>
              <Select
                id="priority"
                value={distributionData.priority}
                onChange={(e) => setDistributionData({ ...distributionData, priority: e.target.value })}
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Zamanlama */}
            <div>
              <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zamanlama (İsteğe Bağlı)
              </label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={distributionData.scheduledAt}
                onChange={(e) => setDistributionData({ ...distributionData, scheduledAt: e.target.value })}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Boş bırakırsanız hemen dağıtılır
              </p>
            </div>

            {/* Özel Mesaj */}
            <div>
              <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Özel Mesaj (İsteğe Bağlı)
              </label>
              <textarea
                id="customMessage"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Dağıtım mesajına eklenecek özel not..."
                value={distributionData.customMessage}
                onChange={(e) => setDistributionData({ ...distributionData, customMessage: e.target.value })}
              />
            </div>

            {/* Dağıtım Özeti */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Dağıtım Özeti:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• {distributionData.channels.length} kanal seçildi</li>
                <li>• Öncelik: {priorities.find(p => p.value === distributionData.priority)?.label}</li>
                <li>• Hedef: {distributionData.targetUsers ? 'Belirli kullanıcılar' : 'Tüm kullanıcılar'}</li>
                <li>• Zamanlama: {distributionData.scheduledAt ? new Date(distributionData.scheduledAt).toLocaleString('tr-TR') : 'Hemen'}</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button
              onClick={handleDistribute}
              disabled={isLoading || distributionData.channels.length === 0}
            >
              {isLoading ? 'Dağıtılıyor...' : 'Talimatı Dağıt'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionDistribution;
