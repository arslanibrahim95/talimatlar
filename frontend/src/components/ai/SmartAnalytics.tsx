import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Users,
  FileText,
  QrCode,
  Bot,
  Loader2
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  instructionsCreated: number;
  documentsUploaded: number;
  qrCodesGenerated: number;
  aiInteractions: number;
  userEngagement: number;
  featureUsage: {
    [key: string]: number;
  };
  trends: {
    users: 'up' | 'down' | 'stable';
    instructions: 'up' | 'down' | 'stable';
    documents: 'up' | 'down' | 'stable';
    qrCodes: 'up' | 'down' | 'stable';
  };
  insights: string[];
  recommendations: string[];
}

interface SmartAnalyticsProps {
  onInsightClick?: (insight: string) => void;
}

const SmartAnalytics: React.FC<SmartAnalyticsProps> = ({ onInsightClick }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeframe]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data with AI-generated insights
      const mockData: AnalyticsData = {
        totalUsers: 1247,
        activeUsers: 89,
        instructionsCreated: 342,
        documentsUploaded: 156,
        qrCodesGenerated: 78,
        aiInteractions: 2341,
        userEngagement: 85.3,
        featureUsage: {
          'AI Assistant': 45.2,
          'QR Generator': 32.1,
          'Document Upload': 28.7,
          'Analytics': 15.3,
          'User Management': 12.8
        },
        trends: {
          users: 'up',
          instructions: 'up',
          documents: 'stable',
          qrCodes: 'up'
        },
        insights: [
          'User engagement has increased by 23% this week',
          'AI Assistant usage is growing rapidly among new users',
          'QR code generation peaks during business hours (9-17)',
          'Document upload success rate is 98.5%',
          'Most active users are from manufacturing sector'
        ],
        recommendations: [
          'Consider adding more AI features to increase engagement',
          'Optimize QR code generation for mobile devices',
          'Implement document versioning for better management',
          'Add more analytics for user behavior tracking',
          'Create industry-specific instruction templates'
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable':
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-blue-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Analytics data could not be loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Brain className="w-6 h-6 text-purple-600 mr-2" />
            Smart Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered insights and recommendations
          </p>
        </div>
        <div className="flex space-x-2">
          {(['24h', '7d', '30d'] as const).map((timeframe) => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.totalUsers.toLocaleString()}
                </p>
              </div>
              <div className={`flex items-center ${getTrendColor(data.trends.users)}`}>
                {getTrendIcon(data.trends.users)}
              </div>
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
                  {data.activeUsers}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Instructions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.instructionsCreated}
                </p>
              </div>
              <div className={`flex items-center ${getTrendColor(data.trends.instructions)}`}>
                {getTrendIcon(data.trends.instructions)}
              </div>
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
                  {data.aiInteractions.toLocaleString()}
                </p>
              </div>
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Feature Usage Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.featureUsage).map(([feature, percentage]) => (
              <div key={feature} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {feature}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-600" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.insights.map((insight, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  onClick={() => onInsightClick?.(insight)}
                >
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recommendations.map((recommendation, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Engagement Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {data.userEngagement}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                User Engagement Rate
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {data.documentsUploaded}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Documents Uploaded
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {data.qrCodesGenerated}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                QR Codes Generated
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartAnalytics;
