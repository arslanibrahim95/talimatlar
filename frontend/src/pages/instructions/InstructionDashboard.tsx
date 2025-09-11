import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { instructionService } from '../../services/instructionService';

interface InstructionStats {
  total: number;
  byStatus: {
    draft: number;
    pending: number;
    approved: number;
    published: number;
    archived: number;
  };
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byCategory: Record<string, number>;
  totalReads: number;
  recentActivity: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string;
  }>;
}

const InstructionDashboard: React.FC = () => {
  const [stats, setStats] = useState<InstructionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const stats = await instructionService.getInstructionStats();
      setStats(stats);
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 dark:text-green-400';
      case 'approved': return 'text-blue-600 dark:text-blue-400';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      case 'draft': return 'text-gray-600 dark:text-gray-400';
      case 'archived': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Taslak',
      pending: 'Beklemede',
      approved: 'Onaylandı',
      published: 'Yayınlandı',
      archived: 'Arşivlendi'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">İstatistikler yüklenemedi</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Talimat Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Talimat sistemi genel durumu</p>
      </div>

      {/* Genel İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Talimat</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Okunma</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bekleyen</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.byStatus.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Kritik</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.byPriority.critical}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Durum Dağılımı */}
        <Card>
          <CardHeader>
            <CardTitle>Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'published' ? 'bg-green-500' :
                      status === 'approved' ? 'bg-blue-500' :
                      status === 'pending' ? 'bg-yellow-500' :
                      status === 'draft' ? 'bg-gray-500' :
                      'bg-purple-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Öncelik Dağılımı */}
        <Card>
          <CardHeader>
            <CardTitle>Öncelik Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      priority === 'critical' ? 'bg-red-500' :
                      priority === 'high' ? 'bg-orange-500' :
                      priority === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {priority === 'critical' ? 'Kritik' :
                       priority === 'high' ? 'Yüksek' :
                       priority === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kategori Dağılımı */}
      <Card>
        <CardHeader>
          <CardTitle>Kategori Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div key={category} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{category}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Son Aktiviteler */}
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(activity.updatedAt).toLocaleString('tr-TR')}
                  </p>
                </div>
                <span className={`text-sm font-medium ${getStatusColor(activity.status)}`}>
                  {getStatusLabel(activity.status)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructionDashboard;
