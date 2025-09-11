import { DashboardStats, AnalyticsReport } from '../types';
import { API_CONFIG, buildApiUrl } from '../config/api';

class AnalyticsService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl('ANALYTICS_SERVICE', endpoint);
    const token = localStorage.getItem('auth_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Test modu - backend olmadan mock data döndür
      const mockStats: DashboardStats = {
        total_documents: 1250,
        total_users: 45,
        total_downloads: 3420,
        total_views: 15680,
        popular_categories: [
          { name: 'Güvenlik', count: 156 },
          { name: 'Kalite', count: 89 },
          { name: 'Üretim', count: 67 },
          { name: 'İnsan Kaynakları', count: 43 }
        ]
      };
      
      // Simüle edilmiş gecikme
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return mockStats;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  async getReports(): Promise<AnalyticsReport[]> {
    try {
      const response = await this.request<{ reports: AnalyticsReport[] }>('/analytics/reports');
      return response.reports;
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      throw error;
    }
  }

  async generateReport(type: string, format: string = 'json'): Promise<any> {
    try {
      const response = await this.request(`/reports/${type}?format=${format}`, {
        method: 'POST',
      });
      return response;
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  }

  async getUserActivity(days: number = 30): Promise<any> {
    try {
      const response = await this.request(`/analytics/user-activity?days=${days}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
      throw error;
    }
  }

  async getDocumentStats(): Promise<any> {
    try {
      const response = await this.request('/analytics/document-stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch document stats:', error);
      throw error;
    }
  }

  async getComplianceAnalytics(startDate?: string, endDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await this.request(`/analytics/compliance?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch compliance analytics:', error);
      throw error;
    }
  }

  async getRiskAssessment(): Promise<any> {
    try {
      const response = await this.request('/analytics/risk-assessment');
      return response;
    } catch (error) {
      console.error('Failed to fetch risk assessment:', error);
      throw error;
    }
  }

  async getTrends(metric: string, period: string = 'month'): Promise<any> {
    try {
      const response = await this.request(`/analytics/trends?metric=${metric}&period=${period}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch trends:', error);
      throw error;
    }
  }

  async getRealTimeMetrics(): Promise<any> {
    try {
      const response = await this.request('/metrics/real-time');
      return response;
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error);
      throw error;
    }
  }

  async getMetricsSummary(period: string = 'day'): Promise<any> {
    try {
      const response = await this.request(`/metrics/summary?period=${period}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch metrics summary:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
