import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

// Mock data - gerçek uygulamada API'den gelecek
const analyticsData = {
  overview: {
    totalDocuments: 1234,
    activeUsers: 89,
    monthlyUploads: 45,
    complianceRate: 94,
    totalDownloads: 5678,
    averageRating: 4.2
  },
  trends: [
    { month: 'Oca', documents: 120, downloads: 450, users: 75 },
    { month: 'Şub', documents: 135, downloads: 520, users: 78 },
    { month: 'Mar', documents: 142, downloads: 580, users: 82 },
    { month: 'Nis', documents: 138, downloads: 540, users: 80 },
    { month: 'May', documents: 156, downloads: 620, users: 85 },
    { month: 'Haz', documents: 168, downloads: 680, users: 89 }
  ],
  categories: [
    { name: 'Talimat', count: 456, percentage: 37 },
    { name: 'Prosedür', count: 234, percentage: 19 },
    { name: 'Liste', count: 189, percentage: 15 },
    { name: 'Plan', count: 156, percentage: 13 },
    { name: 'Program', count: 98, percentage: 8 },
    { name: 'Form', count: 67, percentage: 5 },
    { name: 'Diğer', count: 34, percentage: 3 }
  ],
  topDocuments: [
    { title: 'İş Güvenliği Talimatı v2.1', downloads: 156, rating: 4.5 },
    { title: 'Yangın Güvenliği Prosedürü', downloads: 89, rating: 4.3 },
    { title: 'Acil Durum Planı', downloads: 234, rating: 4.7 },
    { title: 'Kişisel Koruyucu Ekipman Listesi', downloads: 45, rating: 4.1 },
    { title: 'Çalışan Eğitim Programı', downloads: 67, rating: 4.4 }
  ]
};

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('documents');

  const getMetricData = () => {
    return analyticsData.trends.map(item => ({
      month: item.month,
      value: item[selectedMetric as keyof typeof item] as number
    }));
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'documents':
        return 'Doküman Sayısı';
      case 'downloads':
        return 'İndirme Sayısı';
      case 'users':
        return 'Aktif Kullanıcı';
      default:
        return 'Metrik';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analitik
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sistem performansı ve kullanım istatistikleri
            </p>
          </div>
          <div className="flex space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1month">Son 1 Ay</option>
              <option value="3months">Son 3 Ay</option>
              <option value="6months">Son 6 Ay</option>
              <option value="1year">Son 1 Yıl</option>
            </select>
            <Button variant="outline">
              📊 Rapor İndir
            </Button>
            <Button>
              📈 Detaylı Analiz
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Doküman
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.overview.totalDocuments.toLocaleString()}
                </p>
              </div>
              <div className="text-3xl">📄</div>
            </div>
            <div className="mt-4">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                +12% geçen aya göre
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Aktif Kullanıcı
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData.overview.activeUsers}
                </p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
            <div className="mt-4">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                +5% geçen aya göre
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Uyumluluk Oranı
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  %{analyticsData.overview.complianceRate}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
            <div className="mt-4">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                +2% geçen aya göre
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Trend Analizi
              </h2>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="documents">Doküman</option>
                <option value="downloads">İndirme</option>
                <option value="users">Kullanıcı</option>
              </select>
            </div>
            <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-gray-600 dark:text-gray-400">
                  {getMetricLabel()} Grafiği
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {getMetricData().map(item => `${item.month}: ${item.value}`).join(' | ')}
                </p>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Kategori Dağılımı
            </h2>
            <div className="space-y-3">
              {analyticsData.categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{
                      backgroundColor: `hsl(${index * 45}, 70%, 60%)`
                    }}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {category.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: `hsl(${index * 45}, 70%, 60%)`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                      {category.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Documents */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              En Popüler Dokümanlar
            </h2>
            <Button variant="outline" size="sm">
              Tümünü Gör
            </Button>
          </div>
          <div className="space-y-3">
            {analyticsData.topDocuments.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {doc.downloads} indirme • ⭐ {doc.rating}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    👁️ Görüntüle
                  </Button>
                  <Button variant="ghost" size="sm">
                    📊 Detay
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center">
              <div className="text-3xl mb-2">📤</div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bu Ay Yüklenen
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analyticsData.overview.monthlyUploads}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center">
              <div className="text-3xl mb-2">⬇️</div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam İndirme
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analyticsData.overview.totalDownloads.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center">
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Ortalama Puan
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analyticsData.overview.averageRating}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
