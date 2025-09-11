import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Globe, 
  TrendingUp, 
  Users, 
  Building2,
  MapPin,
  Target,
  Zap,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface MarketData {
  currentMarkets: {
    region: string;
    users: number;
    revenue: number;
    growth: number;
    marketShare: number;
    competitors: number;
  }[];
  expansionOpportunities: {
    region: string;
    marketSize: number;
    competition: 'low' | 'medium' | 'high';
    entryBarriers: 'low' | 'medium' | 'high';
    potentialRevenue: number;
    timeToMarket: number; // months
    riskLevel: 'low' | 'medium' | 'high';
    recommendedStrategy: string;
  }[];
  marketTrends: {
    trend: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
    timeframe: string;
  }[];
  competitiveAnalysis: {
    competitor: string;
    marketShare: number;
    strengths: string[];
    weaknesses: string[];
    threatLevel: 'low' | 'medium' | 'high';
  }[];
}

interface MarketExpansionProps {
  onMarketEntry?: (market: string, strategy: string) => void;
  onCompetitorAnalysis?: (competitor: string) => void;
}

const MarketExpansion: React.FC<MarketExpansionProps> = ({ 
  onMarketEntry, 
  onCompetitorAnalysis 
}) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'current' | 'opportunities' | 'trends' | 'competitors'>('current');

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData: MarketData = {
        currentMarkets: [
          {
            region: 'North America',
            users: 450,
            revenue: 25000,
            growth: 18.5,
            marketShare: 12.3,
            competitors: 8
          },
          {
            region: 'Europe',
            users: 320,
            revenue: 18000,
            growth: 15.2,
            marketShare: 8.7,
            competitors: 12
          },
          {
            region: 'Asia Pacific',
            users: 180,
            revenue: 12000,
            growth: 25.8,
            marketShare: 5.2,
            competitors: 15
          }
        ],
        expansionOpportunities: [
          {
            region: 'Latin America',
            marketSize: 500000,
            competition: 'low',
            entryBarriers: 'medium',
            potentialRevenue: 35000,
            timeToMarket: 6,
            riskLevel: 'medium',
            recommendedStrategy: 'Partner with local distributors and focus on manufacturing sector'
          },
          {
            region: 'Middle East & Africa',
            marketSize: 300000,
            competition: 'low',
            entryBarriers: 'high',
            potentialRevenue: 20000,
            timeToMarket: 12,
            riskLevel: 'high',
            recommendedStrategy: 'Start with pilot program in UAE and South Africa'
          },
          {
            region: 'Eastern Europe',
            marketSize: 400000,
            competition: 'medium',
            entryBarriers: 'low',
            potentialRevenue: 28000,
            timeToMarket: 4,
            riskLevel: 'low',
            recommendedStrategy: 'Direct sales approach with localized content'
          },
          {
            region: 'Southeast Asia',
            marketSize: 600000,
            competition: 'medium',
            entryBarriers: 'medium',
            potentialRevenue: 45000,
            timeToMarket: 8,
            riskLevel: 'medium',
            recommendedStrategy: 'Focus on Singapore and Malaysia first, then expand regionally'
          }
        ],
        marketTrends: [
          {
            trend: 'Remote Work Adoption',
            impact: 'positive',
            description: 'Increased demand for digital safety management solutions',
            timeframe: '2024-2025'
          },
          {
            trend: 'AI Integration in Safety',
            impact: 'positive',
            description: 'Growing interest in AI-powered safety analytics and predictions',
            timeframe: '2024-2026'
          },
          {
            trend: 'Regulatory Compliance',
            impact: 'positive',
            description: 'Stricter safety regulations driving software adoption',
            timeframe: '2024-2027'
          },
          {
            trend: 'Economic Uncertainty',
            impact: 'negative',
            description: 'Potential budget constraints affecting enterprise software purchases',
            timeframe: '2024-2025'
          }
        ],
        competitiveAnalysis: [
          {
            competitor: 'SafetySoft Pro',
            marketShare: 25.3,
            strengths: ['Established brand', 'Comprehensive features', 'Strong support'],
            weaknesses: ['High pricing', 'Complex interface', 'Slow innovation'],
            threatLevel: 'high'
          },
          {
            competitor: 'SafeGuard Solutions',
            marketShare: 18.7,
            strengths: ['User-friendly interface', 'Good pricing', 'Quick implementation'],
            weaknesses: ['Limited features', 'Weak analytics', 'Poor scalability'],
            threatLevel: 'medium'
          },
          {
            competitor: 'RiskManager Plus',
            marketShare: 12.1,
            strengths: ['Strong analytics', 'Good integrations', 'Mobile-first'],
            weaknesses: ['Limited customization', 'High learning curve', 'Expensive'],
            threatLevel: 'medium'
          }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'negative':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      case 'neutral':
        return <Target className="w-4 h-4 text-gray-600" />;
      default:
        return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Market data could not be loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Globe className="w-6 h-6 text-blue-600 mr-2" />
            Market Expansion
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Global market analysis and expansion opportunities
          </p>
        </div>
        <div className="flex space-x-2">
          {(['current', 'opportunities', 'trends', 'competitors'] as const).map((view) => (
            <Button
              key={view}
              variant={selectedView === view ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Current Markets */}
      {selectedView === 'current' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.currentMarkets.map((market) => (
              <Card key={market.region}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    {market.region}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Users</span>
                      <span className="font-semibold">{market.users.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                      <span className="font-semibold">{formatCurrency(market.revenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Growth</span>
                      <span className="font-semibold text-green-600">+{market.growth}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Market Share</span>
                      <span className="font-semibold">{market.marketShare}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Competitors</span>
                      <span className="font-semibold">{market.competitors}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Expansion Opportunities */}
      {selectedView === 'opportunities' && (
        <div className="space-y-4">
          {data.expansionOpportunities.map((opportunity) => (
            <Card key={opportunity.region}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {opportunity.region}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompetitionColor(opportunity.competition)}`}>
                        {opportunity.competition} competition
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompetitionColor(opportunity.riskLevel)}`}>
                        {opportunity.riskLevel} risk
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Market Size</p>
                        <p className="font-semibold">{opportunity.marketSize.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Potential Revenue</p>
                        <p className="font-semibold">{formatCurrency(opportunity.potentialRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Time to Market</p>
                        <p className="font-semibold">{opportunity.timeToMarket} months</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Entry Barriers</p>
                        <p className="font-semibold capitalize">{opportunity.entryBarriers}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      <strong>Recommended Strategy:</strong> {opportunity.recommendedStrategy}
                    </p>
                  </div>
                  <div className="ml-4">
                    <Button
                      onClick={() => onMarketEntry?.(opportunity.region, opportunity.recommendedStrategy)}
                      className="whitespace-nowrap"
                    >
                      Explore Market
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Market Trends */}
      {selectedView === 'trends' && (
        <div className="space-y-4">
          {data.marketTrends.map((trend, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getImpactIcon(trend.impact)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {trend.trend}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trend.impact === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        trend.impact === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {trend.impact}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {trend.timeframe}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {trend.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Competitive Analysis */}
      {selectedView === 'competitors' && (
        <div className="space-y-4">
          {data.competitiveAnalysis.map((competitor) => (
            <Card key={competitor.competitor}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {competitor.competitor}
                      </h3>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {competitor.marketShare}% market share
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        competitor.threatLevel === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        competitor.threatLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        {competitor.threatLevel} threat
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {competitor.strengths.map((strength, index) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                              • {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                          <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                          Weaknesses
                        </h4>
                        <ul className="space-y-1">
                          {competitor.weaknesses.map((weakness, index) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                              • {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button
                      variant="outline"
                      onClick={() => onCompetitorAnalysis?.(competitor.competitor)}
                    >
                      Analyze
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketExpansion;
