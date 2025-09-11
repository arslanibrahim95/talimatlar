import { Notification } from '../types';
import { API_CONFIG, buildApiUrl } from '../config/api';

class NotificationService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl('NOTIFICATION_SERVICE', endpoint);
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

  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await this.request<{ notifications: Notification[] }>('/notifications');
      return response.notifications;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await this.request(`/notifications/${id}/read`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.request('/notifications/read-all', {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      await this.request(`/notifications/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  async sendNotification(data: {
    recipient_id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
  }): Promise<void> {
    try {
      await this.request('/notifications/send', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
