import axios from 'axios';
import { Notification, NotificationTemplate, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_NOTIFICATION_API_URL || 'http://localhost:8003';

const notificationService = {
  // Get user notifications
  async getNotifications(
    page: number = 1,
    limit: number = 20,
    filters?: {
      type?: string;
      isRead?: boolean;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.isRead !== undefined && { isRead: filters.isRead.toString() }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo })
    });

    const response = await axios.get(`${API_BASE_URL}/notifications?${params}`);
    return response.data;
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<ApiResponse> {
    const response = await axios.put(`${API_BASE_URL}/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<ApiResponse> {
    const response = await axios.put(`${API_BASE_URL}/notifications/read-all`);
    return response.data;
  },

  // Delete notification
  async deleteNotification(id: string): Promise<ApiResponse> {
    const response = await axios.delete(`${API_BASE_URL}/notifications/${id}`);
    return response.data;
  },

  // Get notification templates
  async getTemplates(): Promise<NotificationTemplate[]> {
    const response = await axios.get(`${API_BASE_URL}/templates`);
    return response.data;
  },

  // Create notification template
  async createTemplate(data: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> {
    const response = await axios.post(`${API_BASE_URL}/templates`, data);
    return response.data;
  },

  // Update notification template
  async updateTemplate(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const response = await axios.put(`${API_BASE_URL}/templates/${id}`, data);
    return response.data;
  },

  // Delete notification template
  async deleteTemplate(id: string): Promise<ApiResponse> {
    const response = await axios.delete(`${API_BASE_URL}/templates/${id}`);
    return response.data;
  },

  // Send notification
  async sendNotification(data: {
    type: string;
    recipientId: string;
    title: string;
    message: string;
    data?: any;
  }): Promise<ApiResponse> {
    const response = await axios.post(`${API_BASE_URL}/send`, data);
    return response.data;
  },

  // Send bulk notifications
  async sendBulkNotifications(data: {
    type: string;
    recipientIds: string[];
    title: string;
    message: string;
    data?: any;
  }): Promise<ApiResponse> {
    const response = await axios.post(`${API_BASE_URL}/send/bulk`, data);
    return response.data;
  },

  // Get notification subscriptions
  async getSubscriptions(): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/subscriptions`);
    return response.data;
  },

  // Update notification subscriptions
  async updateSubscriptions(subscriptions: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  }): Promise<ApiResponse> {
    const response = await axios.put(`${API_BASE_URL}/subscriptions`, subscriptions);
    return response.data;
  },

  // Get notification settings
  async getSettings(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/settings`);
    return response.data;
  },

  // Update notification settings
  async updateSettings(settings: any): Promise<ApiResponse> {
    const response = await axios.put(`${API_BASE_URL}/settings`, settings);
    return response.data;
  },

  // Test notification
  async testNotification(type: string): Promise<ApiResponse> {
    const response = await axios.post(`${API_BASE_URL}/test/${type}`);
    return response.data;
  },

  // Get notification statistics
  async getStatistics(timeRange: string = '1month'): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/statistics?timeRange=${timeRange}`);
    return response.data;
  },

  // Get delivery status
  async getDeliveryStatus(notificationId: string): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/notifications/${notificationId}/status`);
    return response.data;
  },

  // Retry failed notification
  async retryNotification(notificationId: string): Promise<ApiResponse> {
    const response = await axios.post(`${API_BASE_URL}/notifications/${notificationId}/retry`);
    return response.data;
  },

  // Get notification logs
  async getNotificationLogs(
    page: number = 1,
    limit: number = 50,
    filters?: {
      type?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo })
    });

    const response = await axios.get(`${API_BASE_URL}/logs?${params}`);
    return response.data;
  }
};

export default notificationService;
