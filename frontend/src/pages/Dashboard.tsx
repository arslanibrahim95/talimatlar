import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  BarChart3, 
  Users, 
  FileText, 
  QrCode, 
  Bot, 
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Shield,
  Database,
  Activity
} from 'lucide-react';

interface DashboardStats {
  totalInstructions: number;
  totalUsers: number;
  totalDocuments: number;
  qrCodesGenerated: number;
  aiInteractions: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  activeUsers: number;
  storageUsed: number;
  storageLimit: number;
}

interface RecentActivity {
  id: string;
  type: 'instruction_created' | 'user_registered' | 'document_uploaded' | 'qr_generated' | 'ai_interaction';
  description: string;
  timestamp: string;
  user: string;
  status: 'success' | 'warning' | 'error';
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalInstructions: 0,
    totalUsers: 0,
    totalDocuments: 0,
    qrCodesGenerated: 0,
    aiInteractions: 0,
    systemHealth: 'healthy',
    activeUsers: 0,
    storageUsed: 0,
    storageLimit: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data
      setStats({
        totalInstructions: 1247,
        totalUsers: 89,
        totalDocuments: 342,
        qrCodesGenerated: 156,
        aiInteractions: 2341,
        systemHealth: 'healthy',
        activeUsers: 23,
        storageUsed: 2.4,
        storageLimit: 10
      });

      setRecentActivity([
        {
          id: '1',
          type: 'instruction_created',
          description: 'Yeni güvenlik talimatı oluşturuldu',
          timestamp: '2024-01-20T14:30:00Z',
          user: 'Ahmet Yılmaz',
          status: 'success'
        },
        {
          id: '2',
          type: 'user_registered',
          description: 'Yeni kullanıcı kaydı',
          timestamp: '2024-01-20T14:15:00Z',
          user: 'Mehmet Demir',
          status: 'success'
        },
        {
          id: '3',
          type: 'document_uploaded',
          description: 'PDF doküman yüklendi',
          timestamp: '2024-01-20T14:00:00Z',
          user: 'Ayşe Kaya',
          status: 'success'
        },
        {
          id: '4',
          type: 'qr_generated',
          description: 'QR kod oluşturuldu',
          timestamp: '2024-01-20T13:45:00Z',
          user: 'Fatma Öz',
          status: 'success'
        },
        {
          id: '5',
          type: 'ai_interaction',
          description: 'AI asistan kullanıldı',
          timestamp: '2024-01-20T13:30:00Z',
          user: 'Ali Veli',
          status: 'success'
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'instruction_created':
        return <FileText className="w-4 h-4" />;
      case 'user_registered':
        return <Users className="w-4 h-4" />;
      case 'document_uploaded':
        return <Database className="w-4 h-4" />;
      case 'qr_generated':
        return <QrCode className="w-4 h-4" />;
      case 'ai_interaction':
        return <Bot className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Claude Talimat İş Güvenliği Yönetim Sistemi
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(stats.systemHealth)}`}>
            {stats.systemHealth === 'healthy' && <CheckCircle className="w-4 h-4 mr-1 inline" />}
            {stats.systemHealth === 'warning' && <AlertTriangle className="w-4 h-4 mr-1 inline" />}
            {stats.systemHealth === 'critical' && <AlertTriangle className="w-4 h-4 mr-1 inline" />}
            Sistem {stats.systemHealth === 'healthy' ? 'Sağlıklı' : stats.systemHealth === 'warning' ? 'Uyarı' : 'Kritik'}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Talimat
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalInstructions.toLocaleString()}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12% bu ay
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Kullanıcı
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +8% bu ay
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toplam Doküman
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalDocuments.toLocaleString()}
                </p>
              </div>
              <Database className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +15% bu ay
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  QR Kodlar
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.qrCodesGenerated.toLocaleString()}
                </p>
              </div>
              <QrCode className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +23% bu ay
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  AI Etkileşimleri
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.aiInteractions.toLocaleString()}
                </p>
              </div>
              <Bot className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Aktif Kullanıcılar
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeUsers}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Depolama Kullanımı
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.storageUsed} GB
                </p>
                <p className="text-sm text-gray-500">
                  / {stats.storageLimit} GB
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(stats.storageUsed / stats.storageLimit) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span>Son Aktiviteler</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.user} • {new Date(activity.timestamp).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  activity.status === 'success' ? 'bg-green-100 text-green-800' :
                  activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {activity.status === 'success' ? 'Başarılı' :
                   activity.status === 'warning' ? 'Uyarı' : 'Hata'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <FileText className="w-6 h-6" />
              <span>Yeni Talimat</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Users className="w-6 h-6" />
              <span>Kullanıcı Ekle</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <QrCode className="w-6 h-6" />
              <span>QR Kod Oluştur</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Bot className="w-6 h-6" />
              <span>AI Asistan</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;