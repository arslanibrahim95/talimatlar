import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useUXTracking } from '../../utils/analytics';
import { analyticsService } from '../../services/analyticsService';

interface AnalyticsData {
  total_documents: number;
  total_users: number;
  total_downloads: number;
  total_views: number;
  documents_by_category: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  user_activity: Array<{
    date: string;
    active_users: number;
    new_users: number;
  }>;
  top_documents: Array<{
    title: string;
    views: number;
    downloads: number;
    category: string;
  }>;
  system_performance: {
    avg_response_time: number;
    uptime_percentage: number;
    error_rate: number;
    active_sessions: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { trackInteraction } = useUXTracking();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const analyticsData = await analyticsService.getAnalytics(timeRange);
        setData(analyticsData);
        trackInteraction('Analytics Loaded');
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Analitik verileri yüklenirken hata oluştu');
        trackInteraction('Analytics Load Error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, trackInteraction]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Son 7 Gün';
      case '30d': return 'Son 30 Gün';
      case '90d': return 'Son 90 Gün';
      case '1y': return 'Son 1 Yıl';
      default: return 'Son 30 Gün';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Analitik verileri yükleniyor..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hata Oluştu</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Analitik verileri bulunamadı'}</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analitik Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Sistem performansı ve kullanım istatistikleri</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Son 7 Gün</option>
            <option value="30d">Son 30 Gün</option>
            <option value="90d">Son 90 Gün</option>
            <option value="1y">Son 1 Yıl</option>
          </select>
          <Button 
            onClick={() => trackInteraction('Export Analytics')}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Dışa Aktar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Doküman</CardTitle>
            <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(data.total_documents)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getTimeRangeLabel(timeRange)} içinde
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Kullanıcılar</CardTitle>
            <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(data.total_users)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getTimeRangeLabel(timeRange)} içinde
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İndirme</CardTitle>
            <svg className="h-4 w-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(data.total_downloads)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getTimeRangeLabel(timeRange)} içinde
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Görüntüleme</CardTitle>
            <svg className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(data.total_views)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getTimeRangeLabel(timeRange)} içinde
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Dokümanlar Kategoriye Göre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.documents_by_category.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full" style={{
                      backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                    }}></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(category.count)}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatPercentage(category.percentage)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Sistem Performansı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Ortalama Yanıt Süresi</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.system_performance.avg_response_time}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Çalışma Süresi</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPercentage(data.system_performance.uptime_percentage)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Hata Oranı</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPercentage(data.system_performance.error_rate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Aktif Oturumlar</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatNumber(data.system_performance.active_sessions)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Documents */}
      <Card>
        <CardHeader>
          <CardTitle>En Popüler Dokümanlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Doküman
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Görüntüleme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İndirme
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {data.top_documents.map((doc, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {doc.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(doc.views)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(doc.downloads)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Activity Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Aktivitesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">Grafik bileşeni burada görüntülenecek</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {data.user_activity.length} veri noktası mevcut
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
