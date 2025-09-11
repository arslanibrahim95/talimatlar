import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  PieChart,
  BarChart3,
  Calendar,
  Target,
  Zap,
  Globe,
  Building2,
  Loader2
} from 'lucide-react';

interface RevenueData {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  customerLifetimeValue: number;
  revenueByPlan: {
    [plan: string]: {
      revenue: number;
      users: number;
      percentage: number;
    };
  };
  revenueByRegion: {
    [region: string]: {
      revenue: number;
      percentage: number;
    };
  };
  revenueGrowth: {
    current: number;
    previous: number;
    growth: number;
  };
  topCustomers: {
    id: string;
    name: string;
    revenue: number;
    plan: string;
    region: string;
  }[];
  revenueForecast: {
    month: string;
    predicted: number;
    actual?: number;
  }[];
}

interface RevenueAnalyticsProps {
  onPlanUpgrade?: (customerId: string, newPlan: string) => void;
  onChurnPrevention?: (customerId: string) => void;
}

const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ 
  onPlanUpgrade, 
  onChurnPrevention 
}) => {
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadRevenueData();
  }, [selectedPeriod]);

  const loadRevenueData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData: RevenueData = {
        totalRevenue: 125000,
        monthlyRecurringRevenue: 45000,
        annualRecurringRevenue: 540000,
        averageRevenuePerUser: 125,
        churnRate: 5.2,
        customerLifetimeValue: 2400,
        revenueByPlan: {
          'Basic': {
            revenue: 15000,
            users: 120,
            percentage: 33.3
          },
          'Professional': {
            revenue: 20000,
            users: 80,
            percentage: 44.4
          },
          'Enterprise': {
            revenue: 10000,
            users: 20,
            percentage: 22.2
          }
        },
        revenueByRegion: {
          'North America': {
            revenue: 25000,
            percentage: 55.6
          },
          'Europe': {
            revenue: 12000,
            percentage: 26.7
          },
          'Asia Pacific': {
            revenue: 8000,
            percentage: 17.8
          }
        },
        revenueGrowth: {
          current: 45000,
          previous: 38000,
          growth: 18.4
        },
        topCustomers: [
          {
            id: '1',
            name: 'Acme Corporation',
            revenue: 2500,
            plan: 'Enterprise',
            region: 'North America'
          },
          {
            id: '2',
            name: 'TechStart Inc',
            revenue: 1800,
            plan: 'Professional',
            region: 'Europe'
          },
          {
            id: '3',
            name: 'Manufacturing Ltd',
            revenue: 1500,
            plan: 'Professional',
            region: 'Asia Pacific'
          }
        ],
        revenueForecast: [
          { month: 'Jan', predicted: 42000, actual: 41000 },
          { month: 'Feb', predicted: 45000, actual: 45000 },
          { month: 'Mar', predicted: 48000 },
          { month: 'Apr', predicted: 52000 },
          { month: 'May', predicted: 55000 },
          { month: 'Jun', predicted: 58000 }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setIsLoading(false);
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

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (growth < 0) return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
    return <Target className="w-4 h-4 text-gray-600" />;
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
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Revenue data could not be loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <DollarSign className="w-6 h-6 text-green-600 mr-2" />
            Revenue Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Business performance and revenue insights
          </p>
        </div>
        <div className="flex space-x-2">
          {(['30d', '90d', '1y'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data.totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Monthly Recurring Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data.monthlyRecurringRevenue)}
                </p>
              </div>
              <div className={`flex items-center ${getGrowthColor(data.revenueGrowth.growth)}`}>
                {getGrowthIcon(data.revenueGrowth.growth)}
                <span className="ml-1 text-sm">
                  {data.revenueGrowth.growth > 0 ? '+' : ''}{data.revenueGrowth.growth}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Revenue Per User
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data.averageRevenuePerUser)}
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
                  Customer Lifetime Value
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data.customerLifetimeValue)}
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Revenue by Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.revenueByPlan).map(([plan, planData]) => (
              <div key={plan} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {plan}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({planData.users} users)
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${planData.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20 text-right">
                    {formatCurrency(planData.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Revenue by Region
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.revenueByRegion).map(([region, regionData]) => (
              <div key={region} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {region}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${regionData.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-20 text-right">
                    {formatCurrency(regionData.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Top Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {customer.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {customer.plan} • {customer.region}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(customer.revenue)}
                  </span>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPlanUpgrade?.(customer.id, 'Enterprise')}
                    >
                      Upgrade
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onChurnPrevention?.(customer.id)}
                    >
                      Retain
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Revenue Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.revenueForecast.map((forecast, index) => (
              <div key={forecast.month} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
                    {forecast.month}
                  </span>
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(forecast.predicted / 60000) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(forecast.predicted)}
                  </span>
                  {forecast.actual && (
                    <span className="text-sm text-green-600">
                      (Actual: {formatCurrency(forecast.actual)})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Churn Rate Alert */}
      {data.churnRate > 5 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-600">
                  High Churn Rate Alert
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Current churn rate is {data.churnRate}%, which is above the recommended 5% threshold.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RevenueAnalytics;
