import axios from 'axios';
import { AnalyticsOverview, TrendData, CategoryData, TopDocument, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:8002';

const analyticsService = {
  // Get dashboard overview
  async getDashboardOverview(): Promise<AnalyticsOverview> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/overview`);
    return response.data;
  },

  // Get trend data
  async getTrends(timeRange: string = '6months'): Promise<TrendData[]> {
    const response = await axios.get(`${API_BASE_URL}/trends?timeRange=${timeRange}`);
    return response.data;
  },

  // Get category distribution
  async getCategoryDistribution(): Promise<CategoryData[]> {
    const response = await axios.get(`${API_BASE_URL}/categories/distribution`);
    return response.data;
  },

  // Get top documents
  async getTopDocuments(limit: number = 10): Promise<TopDocument[]> {
    const response = await axios.get(`${API_BASE_URL}/documents/top?limit=${limit}`);
    return response.data;
  },

  // Get user activity
  async getUserActivity(timeRange: string = '1month'): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/users/activity?timeRange=${timeRange}`);
    return response.data;
  },

  // Get document statistics
  async getDocumentStats(timeRange: string = '1month'): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/documents/stats?timeRange=${timeRange}`);
    return response.data;
  },

  // Get compliance report
  async getComplianceReport(timeRange: string = '1month'): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/compliance/report?timeRange=${timeRange}`);
    return response.data;
  },

  // Get risk assessment
  async getRiskAssessment(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/risk/assessment`);
    return response.data;
  },

  // Get real-time metrics
  async getRealTimeMetrics(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/metrics/realtime`);
    return response.data;
  },

  // Generate custom report
  async generateCustomReport(params: {
    metrics: string[];
    timeRange: string;
    filters?: any;
    format?: 'pdf' | 'excel' | 'csv';
  }): Promise<Blob> {
    const response = await axios.post(`${API_BASE_URL}/reports/custom`, params, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get audit logs
  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    filters?: {
      userId?: string;
      action?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.action && { action: filters.action }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo })
    });

    const response = await axios.get(`${API_BASE_URL}/audit/logs?${params}`);
    return response.data;
  },

  // Get system health
  async getSystemHealth(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/system/health`);
    return response.data;
  },

  // Get performance metrics
  async getPerformanceMetrics(timeRange: string = '1hour'): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/performance/metrics?timeRange=${timeRange}`);
    return response.data;
  },

  // Get user engagement
  async getUserEngagement(timeRange: string = '1month'): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/users/engagement?timeRange=${timeRange}`);
    return response.data;
  },

  // Get document usage patterns
  async getDocumentUsagePatterns(timeRange: string = '1month'): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/documents/usage-patterns?timeRange=${timeRange}`);
    return response.data;
  },

  // Export analytics data
  async exportAnalyticsData(
    dataType: string,
    timeRange: string,
    format: 'csv' | 'excel' | 'json' = 'csv'
  ): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/export/${dataType}`, {
      params: { timeRange, format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Get predictive analytics
  async getPredictiveAnalytics(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/predictive/analytics`);
    return response.data;
  },

  // Get anomaly detection
  async getAnomalyDetection(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/anomaly/detection`);
    return response.data;
  }
};

export default analyticsService;
