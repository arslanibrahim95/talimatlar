import React from 'react';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

// Mock data - gerçek uygulamada API'den gelecek
const stats = [
  {
    title: 'Toplam Doküman',
    value: '1,234',
    change: '+12%',
    changeType: 'positive',
    icon: '📄'
  },
  {
    title: 'Aktif Kullanıcı',
    value: '89',
    change: '+5%',
    changeType: 'positive',
    icon: '👥'
  },
  {
    title: 'Bu Ay Yüklenen',
    value: '45',
    change: '+23%',
    changeType: 'positive',
    icon: '📤'
  },
  {
    title: 'Uyumluluk Oranı',
    value: '94%',
    change: '+2%',
    changeType: 'positive',
    icon: '✅'
  }
];

const recentDocuments = [
  {
    id: 1,
    title: 'İş Güvenliği Talimatı v2.1',
    category: 'Talimat',
    updatedAt: '2 saat önce',
    status: 'active'
  },
  {
    id: 2,
    title: 'Yangın Güvenliği Prosedürü',
    category: 'Prosedür',
    updatedAt: '1 gün önce',
    status: 'active'
  },
  {
    id: 3,
    title: 'Kişisel Koruyucu Ekipman Listesi',
    category: 'Liste',
    updatedAt: '3 gün önce',
    status: 'draft'
  },
  {
    id: 4,
    title: 'Acil Durum Planı',
    category: 'Plan',
    updatedAt: '1 hafta önce',
    status: 'active'
  }
];

const quickActions = [
  {
    title: 'Yeni Doküman',
    description: 'Yeni bir doküman oluşturun',
    icon: '📝',
    action: 'create',
    color: 'blue'
  },
  {
    title: 'Doküman Ara',
    description: 'Mevcut dokümanlarda arama yapın',
    icon: '🔍',
    action: 'search',
    color: 'green'
  },
  {
    title: 'Rapor Oluştur',
    description: 'Analitik raporu oluşturun',
    icon: '📊',
    action: 'report',
    color: 'purple'
  },
  {
    title: 'Kullanıcı Ekle',
    description: 'Yeni kullanıcı davet edin',
    icon: '👤',
    action: 'user',
    color: 'orange'
  }
];

const Dashboard: React.FC = () => {
  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
    // Gerçek uygulamada navigation veya modal açma işlemleri yapılacak
  };

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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Claude Talimat İş Güvenliği Yönetim Sistemi'ne hoş geldiniz
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              📊 Rapor İndir
            </Button>
            <Button>
              📝 Yeni Doküman
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
              <div className="mt-4">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    stat.changeType === 'positive'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  )}
                >
                  {stat.change}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  geçen aya göre
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Hızlı İşlemler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.action)}
                className={cn(
                  'p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-left group',
                  `hover:bg-${action.color}-50 dark:hover:bg-${action.color}-900/20`
                )}
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Son Güncellenen Dokümanlar
            </h2>
            <Button variant="outline" size="sm">
              Tümünü Gör
            </Button>
          </div>
          <div className="space-y-3">
            {recentDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-lg">📄</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {doc.category} • {doc.updatedAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      getStatusColor(doc.status)
                    )}
                  >
                    {getStatusText(doc.status)}
                  </span>
                  <Button variant="ghost" size="sm">
                    Görüntüle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Chart Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Aktivite Grafiği
          </h2>
          <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-600 dark:text-gray-400">
                Grafik burada görüntülenecek
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Gerçek verilerle doldurulacak
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
