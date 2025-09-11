import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  BarChart3, 
  Brain, 
  DollarSign, 
  Globe, 
  Users, 
  FileText, 
  QrCode, 
  Bot, 
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
  Target
} from 'lucide-react';

// Import our new advanced components
import SmartAnalytics from '../components/ai/SmartAnalytics';
import AutoMLInsights from '../components/ai/AutoMLInsights';
import RevenueAnalytics from '../components/business/RevenueAnalytics';
import MarketExpansion from '../components/business/MarketExpansion';
import AIAssistant from '../components/ai/AIAssistant';
import QRCodeGenerator from '../components/qr/QRCodeGenerator';
import TenantManagement from '../components/tenant/TenantManagement';

type DashboardView = 'overview' | 'analytics' | 'ai' | 'business' | 'monitoring' | 'expansion';

const AdvancedDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Smart Analytics', icon: Brain },
    { id: 'ai', label: 'AI & ML', icon: Bot },
    { id: 'business', label: 'Business Intelligence', icon: DollarSign },
    { id: 'monitoring', label: 'Performance Monitoring', icon: Activity },
    { id: 'expansion', label: 'Market Expansion', icon: Globe },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  $125,000
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +18.4% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  1,247
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12.3% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  AI Interactions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  2,341
                </p>
              </div>
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              +35.7% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  System Health
                </p>
                <p className="text-2xl font-bold text-green-600">
                  99.9%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              All systems operational
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'New user registered', user: 'John Doe', time: '2 minutes ago', type: 'user' },
              { action: 'AI insight generated', user: 'System', time: '5 minutes ago', type: 'ai' },
              { action: 'Revenue milestone reached', user: 'System', time: '1 hour ago', type: 'business' },
              { action: 'QR code generated', user: 'Jane Smith', time: '2 hours ago', type: 'qr' },
              { action: 'Market analysis completed', user: 'System', time: '3 hours ago', type: 'expansion' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex-shrink-0">
                  {activity.type === 'user' && <Users className="w-4 h-4 text-blue-600" />}
                  {activity.type === 'ai' && <Bot className="w-4 h-4 text-purple-600" />}
                  {activity.type === 'business' && <DollarSign className="w-4 h-4 text-green-600" />}
                  {activity.type === 'qr' && <QrCode className="w-4 h-4 text-orange-600" />}
                  {activity.type === 'expansion' && <Globe className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setCurrentView('ai')}
            >
              <Bot className="w-6 h-6" />
              <span>AI Assistant</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setCurrentView('analytics')}
            >
              <Brain className="w-6 h-6" />
              <span>Smart Analytics</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setCurrentView('business')}
            >
              <DollarSign className="w-6 h-6" />
              <span>Revenue Analytics</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setCurrentView('expansion')}
            >
              <Globe className="w-6 h-6" />
              <span>Market Expansion</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return renderOverview();
      case 'analytics':
        return <SmartAnalytics />;
      case 'ai':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <AIAssistant />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Generator</CardTitle>
                </CardHeader>
                <CardContent>
                  <QRCodeGenerator />
                </CardContent>
              </Card>
            </div>
            <AutoMLInsights />
          </div>
        );
      case 'business':
        return (
          <div className="space-y-6">
            <RevenueAnalytics />
            <TenantManagement />
          </div>
        );
      case 'monitoring':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Monitoring Dashboard
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Access your monitoring tools:
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button asChild>
                      <a href="http://localhost:9090" target="_blank" rel="noopener noreferrer">
                        Prometheus
                      </a>
                    </Button>
                    <Button asChild variant="outline">
                      <a href="http://localhost:3004" target="_blank" rel="noopener noreferrer">
                        Grafana
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'expansion':
        return <MarketExpansion />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300`}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Claude Talimat
              </h1>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <nav className="mt-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as DashboardView)}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {navigationItems.find(item => item.id === currentView)?.label || 'Dashboard'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {currentView === 'overview' && 'Comprehensive overview of your system'}
              {currentView === 'analytics' && 'AI-powered analytics and insights'}
              {currentView === 'ai' && 'Artificial Intelligence and Machine Learning tools'}
              {currentView === 'business' && 'Business intelligence and revenue analytics'}
              {currentView === 'monitoring' && 'System performance and health monitoring'}
              {currentView === 'expansion' && 'Market analysis and expansion opportunities'}
            </p>
          </div>
          
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;
