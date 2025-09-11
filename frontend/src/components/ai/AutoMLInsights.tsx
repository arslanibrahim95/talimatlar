import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp,
  Users,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface MLInsight {
  id: string;
  type: 'prediction' | 'anomaly' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  timestamp: string;
  actionable: boolean;
  actions?: string[];
}

interface AutoMLInsightsProps {
  onInsightAction?: (insight: MLInsight, action: string) => void;
}

const AutoMLInsights: React.FC<AutoMLInsightsProps> = ({ onInsightAction }) => {
  const [insights, setInsights] = useState<MLInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      // Simulate ML model processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockInsights: MLInsight[] = [
        {
          id: '1',
          type: 'prediction',
          title: 'User Growth Prediction',
          description: 'Based on current trends, user registrations are expected to increase by 35% in the next 30 days.',
          confidence: 87,
          impact: 'high',
          category: 'growth',
          timestamp: new Date().toISOString(),
          actionable: true,
          actions: ['Prepare infrastructure scaling', 'Increase support capacity', 'Update onboarding flow']
        },
        {
          id: '2',
          type: 'anomaly',
          title: 'Unusual Document Upload Pattern',
          description: 'Document upload volume has increased by 200% compared to historical data. This may indicate a new use case or potential issue.',
          confidence: 92,
          impact: 'medium',
          category: 'usage',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          actionable: true,
          actions: ['Investigate upload patterns', 'Check system performance', 'Review user feedback']
        },
        {
          id: '3',
          type: 'recommendation',
          title: 'Feature Usage Optimization',
          description: 'AI Assistant usage correlates strongly with user retention. Consider promoting this feature to new users.',
          confidence: 78,
          impact: 'high',
          category: 'engagement',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          actionable: true,
          actions: ['Add AI Assistant to onboarding', 'Create AI feature tutorial', 'Send targeted notifications']
        },
        {
          id: '4',
          type: 'trend',
          title: 'Peak Usage Time Analysis',
          description: 'System usage peaks between 9-11 AM and 2-4 PM. Consider scheduling maintenance outside these windows.',
          confidence: 95,
          impact: 'medium',
          category: 'performance',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          actionable: true,
          actions: ['Schedule maintenance windows', 'Optimize resource allocation', 'Plan capacity scaling']
        },
        {
          id: '5',
          type: 'prediction',
          title: 'Storage Capacity Forecast',
          description: 'Current storage growth rate suggests capacity will reach 80% within 45 days.',
          confidence: 83,
          impact: 'high',
          category: 'infrastructure',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          actionable: true,
          actions: ['Plan storage expansion', 'Implement data archiving', 'Review retention policies']
        },
        {
          id: '6',
          type: 'anomaly',
          title: 'QR Code Generation Spike',
          description: 'QR code generation has increased by 150% in the last 24 hours, primarily from manufacturing sector users.',
          confidence: 89,
          impact: 'low',
          category: 'usage',
          timestamp: new Date(Date.now() - 18000000).toISOString(),
          actionable: false
        }
      ];
      
      setInsights(mockInsights);
    } catch (error) {
      console.error('Error loading ML insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshInsights = async () => {
    setIsRefreshing(true);
    await loadInsights();
    setIsRefreshing(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'anomaly':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'recommendation':
        return <Target className="w-5 h-5 text-green-600" />;
      case 'trend':
        return <Zap className="w-5 h-5 text-purple-600" />;
      default:
        return <Brain className="w-5 h-5 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(insights.map(i => i.category)))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            AI is analyzing your data...
          </p>
        </div>
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
            AutoML Insights
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered predictions, anomalies, and recommendations
          </p>
        </div>
        <Button
          onClick={refreshInsights}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? 'All Insights' : category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => (
          <Card key={insight.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {insight.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                        {insight.impact} impact
                      </span>
                      <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                        {insight.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {insight.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(insight.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="capitalize">{insight.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {insight.actionable && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Actionable</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {insight.actions && insight.actions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Recommended Actions:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {insight.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => onInsightAction?.(insight, action)}
                        className="text-xs"
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {insights.filter(i => i.type === 'prediction').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Predictions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {insights.filter(i => i.type === 'anomaly').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Anomalies</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {insights.filter(i => i.type === 'recommendation').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recommendations</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {insights.filter(i => i.type === 'trend').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Trends</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoMLInsights;
