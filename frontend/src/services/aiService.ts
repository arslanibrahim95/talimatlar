import { API_CONFIG, buildApiUrl } from '../config/api';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface AICommand {
  id: string;
  name: string;
  description: string;
  parameters: any;
  result: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
}

interface AIAnalytics {
  total_sessions: number;
  total_messages: number;
  total_commands: number;
  popular_commands: Array<{ name: string; count: number }>;
  usage_by_date: Array<{ date: string; count: number }>;
}

class AIService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl('AI_SERVICE', endpoint);
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

  // Chat Sessions
  async getChatSessions(): Promise<ChatSession[]> {
    try {
      const response = await this.request<{ sessions: ChatSession[] }>('/chat/sessions');
      return response.sessions;
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
      throw error;
    }
  }

  async createChatSession(title?: string): Promise<ChatSession> {
    try {
      const response = await this.request<ChatSession>('/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ title: title || 'New Chat' }),
      });
      return response;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      throw error;
    }
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const response = await this.request<{ messages: ChatMessage[] }>(`/chat/sessions/${sessionId}/messages`);
      return response.messages;
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
      throw error;
    }
  }

  async sendChatMessage(sessionId: string, content: string): Promise<ChatMessage> {
    try {
      const response = await this.request<ChatMessage>(`/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      return response;
    } catch (error) {
      console.error('Failed to send chat message:', error);
      throw error;
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      await this.request(`/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete chat session:', error);
      throw error;
    }
  }

  // AI Commands
  async getAvailableCommands(): Promise<AICommand[]> {
    try {
      const response = await this.request<{ commands: AICommand[] }>('/commands');
      return response.commands;
    } catch (error) {
      console.error('Failed to fetch available commands:', error);
      throw error;
    }
  }

  async executeCommand(commandName: string, parameters: any): Promise<AICommand> {
    try {
      const response = await this.request<AICommand>('/commands/execute', {
        method: 'POST',
        body: JSON.stringify({ command: commandName, parameters }),
      });
      return response;
    } catch (error) {
      console.error('Failed to execute command:', error);
      throw error;
    }
  }

  async executeAdvancedCommand(commandData: any): Promise<AICommand> {
    try {
      const response = await this.request<AICommand>('/commands/advanced', {
        method: 'POST',
        body: JSON.stringify(commandData),
      });
      return response;
    } catch (error) {
      console.error('Failed to execute advanced command:', error);
      throw error;
    }
  }

  async getCommandStatus(commandId: string): Promise<AICommand> {
    try {
      const response = await this.request<AICommand>(`/commands/${commandId}`);
      return response;
    } catch (error) {
      console.error('Failed to get command status:', error);
      throw error;
    }
  }

  // AI Analytics
  async getUsageAnalytics(): Promise<AIAnalytics> {
    try {
      const response = await this.request<AIAnalytics>('/analytics/usage');
      return response;
    } catch (error) {
      console.error('Failed to fetch usage analytics:', error);
      throw error;
    }
  }

  async getCommandAnalytics(startDate?: string, endDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await this.request(`/analytics/commands?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch command analytics:', error);
      throw error;
    }
  }

  // AI Configuration
  async getAIConfig(): Promise<any> {
    try {
      const response = await this.request('/config');
      return response;
    } catch (error) {
      console.error('Failed to fetch AI config:', error);
      throw error;
    }
  }

  async updateAIConfig(config: any): Promise<any> {
    try {
      const response = await this.request('/config', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      return response;
    } catch (error) {
      console.error('Failed to update AI config:', error);
      throw error;
    }
  }

  async getAPIKeys(): Promise<any> {
    try {
      const response = await this.request('/config/api-keys');
      return response;
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      throw error;
    }
  }

  // Health Check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.request('/health');
      return response.status === 'healthy';
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }
}

export const aiService = new AIService();
