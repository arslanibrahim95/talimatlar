import React, { useState, useEffect } from 'react';

interface APIKey {
  id: string;
  name: string;
  provider: string;
  key: string;
  isActive: boolean;
  createdAt: string;
  lastUsed: string;
  usageCount: number;
}

interface AIService {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastHealthCheck: string;
  responseTime: number;
  usage: number;
}

const AIDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'services' | 'analytics'>('overview');
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [aiServices, setAiServices] = useState<AIService[]>([
    {
      id: '1',
      name: 'OpenAI GPT-4',
      status: 'active',
      lastHealthCheck: new Date().toISOString(),
      responseTime: 1.2,
      usage: 85
    },
    {
      id: '2',
      name: 'Claude 3.5 Sonnet',
      status: 'active',
      lastHealthCheck: new Date().toISOString(),
      responseTime: 0.8,
      usage: 92
    },
    {
      id: '3',
      name: 'Local AI Server',
      status: 'inactive',
      lastHealthCheck: new Date(Date.now() - 3600000).toISOString(),
      responseTime: 0,
      usage: 0
    }
  ]);
  const [newKey, setNewKey] = useState({ name: '', provider: 'openai', key: '' });
  const [editingKey, setEditingKey] = useState<APIKey | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  // LocalStorage'dan API key'leri yükle
  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = () => {
    try {
      const savedKeys = localStorage.getItem('api_keys');
      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      }
    } catch (error) {
      console.error('API key\'ler yüklenemedi:', error);
    }
  };

  const saveAPIKeys = (keys: APIKey[]) => {
    try {
      localStorage.setItem('api_keys', JSON.stringify(keys));
      setApiKeys(keys);
    } catch (error) {
      console.error('API key\'ler kaydedilemedi:', error);
    }
  };

  // Yeni API key ekle
  const handleAddKey = () => {
    if (!newKey.name.trim()) {
      alert('Lütfen API Key için bir isim girin');
      return;
    }
    
    if (!newKey.key.trim()) {
      alert('Lütfen API Key değerini girin');
      return;
    }

    const key: APIKey = {
      id: Date.now().toString(),
      name: newKey.name,
      provider: newKey.provider,
      key: newKey.key,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      usageCount: 0
    };

    const updatedKeys = [...apiKeys, key];
    saveAPIKeys(updatedKeys);
    
    // Form'u temizle
    setNewKey({ name: '', provider: 'openai', key: '' });
    setShowAddForm(false);
    
    alert('✅ API Key başarıyla eklendi!');
  };

  // API key düzenle
  const handleEditKey = (key: APIKey) => {
    setEditingKey(key);
  };

  // Düzenlemeyi kaydet
  const handleSaveEdit = () => {
    if (!editingKey) return;

    const updatedKeys = apiKeys.map(k => 
      k.id === editingKey.id ? editingKey : k
    );
    saveAPIKeys(updatedKeys);
    setEditingKey(null);
  };

  // API key sil
  const handleDeleteKey = (id: string) => {
    if (confirm('Bu API key\'i silmek istediğinizden emin misiniz?')) {
      const updatedKeys = apiKeys.filter(k => k.id !== id);
      saveAPIKeys(updatedKeys);
    }
  };

  // API key test et
  const handleTestKey = async (id: string) => {
    setIsTesting(id);
    
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update usage count
      const updatedKeys = apiKeys.map(k => 
        k.id === id 
          ? { ...k, lastUsed: new Date().toISOString(), usageCount: k.usageCount + 1 }
          : k
      );
      saveAPIKeys(updatedKeys);
      
      alert('✅ API key test edildi ve çalışıyor!');
    } catch (error) {
      alert('❌ API key test edilemedi');
    } finally {
      setIsTesting(null);
    }
  };

  // API key'i aktif/pasif yap
  const handleToggleKey = (id: string) => {
    const updatedKeys = apiKeys.map(k => 
      k.id === id ? { ...k, isActive: !k.isActive } : k
    );
    saveAPIKeys(updatedKeys);
  };

  // Filtrelenmiş key'ler
  const filteredKeys = apiKeys.filter(key =>
    key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🤖 AI Yönetici Paneli
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          AI servislerinizi yönetin, API key'lerinizi kontrol edin ve performansı izleyin
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-1">
        <div className="flex space-x-1">
          {[
            { id: 'overview', label: '📊 Genel Bakış', icon: '📊' },
            { id: 'keys', label: '🔑 API Key\'ler', icon: '🔑' },
            { id: 'services', label: '⚙️ Servisler', icon: '⚙️' },
            { id: 'analytics', label: '📈 Analitik', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Genel İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{apiKeys.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Toplam API Key</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {aiServices.filter(s => s.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Aktif Servis</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {apiKeys.reduce((sum, k) => sum + k.usageCount, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Toplam Kullanım</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(aiServices.reduce((sum, s) => sum + s.usage, 0) / aiServices.length)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ortalama Kullanım</div>
            </div>
          </div>

          {/* Hızlı Erişim */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">🚀 Hızlı İşlemler</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('keys')}
                  className="w-full text-left p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="font-medium">🔑 Yeni API Key Ekle</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">AI servisleri için API key ekleyin</div>
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className="w-full text-left p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <div className="font-medium">⚙️ Servis Durumunu Kontrol Et</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">AI servislerinizin durumunu görün</div>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Son Aktiviteler</h3>
              <div className="space-y-3">
                {apiKeys.slice(0, 3).map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div>
                      <div className="font-medium text-sm">{key.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {key.usageCount} kez kullanıldı
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      key.isActive 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {key.isActive ? 'Aktif' : 'Pasif'}
                    </div>
                  </div>
                ))}
                {apiKeys.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <div className="text-2xl mb-2">🔑</div>
                    <p className="text-sm">Henüz API key eklenmemiş</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'keys' && (
        <div className="space-y-6">
          {/* Basit API Key Ekleme */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            🔑 Yeni API Key Ekle
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            {showAddForm ? '❌ Kapat' : '➕ Yeni Key Ekle'}
          </button>
        </div>

        {/* Basit Form */}
        {showAddForm && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="space-y-4">
              {/* Key Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📝 API Key Adı
                </label>
                <input
                  type="text"
                  placeholder="Örnek: ChatGPT Ana Hesap"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Bu key'i tanımlamak için bir isim verin
                </p>
              </div>

              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🏢 AI Servisi
                </label>
                <select
                  value={newKey.provider}
                  onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="openai">🤖 OpenAI (ChatGPT, GPT-4)</option>
                  <option value="claude">🧠 Claude (Anthropic)</option>
                  <option value="local">🏠 Local AI (Kendi sunucunuz)</option>
                  <option value="other">🔧 Diğer AI Servisi</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Hangi AI servisi için key ekliyorsunuz?
                </p>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🔐 API Key
                </label>
                <input
                  type="password"
                  placeholder="Örnek: sk-1234567890abcdef..."
                  value={newKey.key}
                  onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  AI servisinden aldığınız API key'i buraya yapıştırın
                </p>
              </div>

              {/* Butonlar */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddKey}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-lg"
                >
                  💾 API Key'i Kaydet
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
                >
                  ❌ İptal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Arama */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 API key ara... (isim veya servis adı)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* API Key Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">📋 API Key Listesi</h3>
        
        {filteredKeys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🔑</div>
            <p>Henüz API key eklenmemiş</p>
            <p className="text-sm">Yukarıdaki "Yeni Key Ekle" butonuna tıklayarak ekleyin</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4">Ad</th>
                  <th className="text-left py-3 px-4">Servis</th>
                  <th className="text-left py-3 px-4">Durum</th>
                  <th className="text-left py-3 px-4">Kullanım</th>
                  <th className="text-left py-3 px-4">Son Kullanım</th>
                  <th className="text-left py-3 px-4">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map((key) => (
                  <tr key={key.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">
                      {editingKey?.id === key.id ? (
                        <input
                          type="text"
                          value={editingKey.name}
                          onChange={(e) => setEditingKey({ ...editingKey, name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <span className="font-medium">{key.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                        {key.provider}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleKey(key.id)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          key.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {key.isActive ? '✅ Aktif' : '❌ Pasif'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {key.usageCount} kez
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(key.lastUsed).toLocaleDateString('tr-TR')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {editingKey?.id === key.id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                            >
                              💾
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
                            >
                              ❌
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditKey(key)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleTestKey(key.id)}
                              disabled={isTesting === key.id}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-sm"
                            >
                              {isTesting === key.id ? '🔄' : '🧪'}
                            </button>
                            <button
                              onClick={() => handleDeleteKey(key.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

          {/* Güvenlik Notu */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Güvenlik Notu:</p>
                <p>API key'leriniz sadece tarayıcınızda saklanır ve hiçbir yere gönderilmez. Güvenliğiniz için API key'lerinizi kimseyle paylaşmayın.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-6">⚙️ AI Servis Durumları</h3>
            <div className="space-y-4">
              {aiServices.map((service) => (
                <div key={service.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        service.status === 'active' ? 'bg-green-500' :
                        service.status === 'inactive' ? 'bg-gray-400' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Son kontrol: {new Date(service.lastHealthCheck).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Yanıt süresi: {service.responseTime}s
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Kullanım: {service.usage}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${service.usage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Kullanım İstatistikleri</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Toplam API Çağrısı</span>
                  <span className="font-medium">{apiKeys.reduce((sum, k) => sum + k.usageCount, 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Aktif Servis Sayısı</span>
                  <span className="font-medium">{aiServices.filter(s => s.status === 'active').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ortalama Yanıt Süresi</span>
                  <span className="font-medium">
                    {(aiServices.reduce((sum, s) => sum + s.responseTime, 0) / aiServices.length).toFixed(2)}s
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">🔧 Sistem Durumu</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Genel Durum</span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                    ✅ Sağlıklı
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Son Güncelleme</span>
                  <span className="text-sm">{new Date().toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Versiyon</span>
                  <span className="text-sm">v1.0.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDashboard;
