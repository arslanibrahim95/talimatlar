import { Instruction, InstructionCreate, InstructionUpdate, PaginatedResponse } from '../types';
import { API_CONFIG, buildApiUrl } from '../config/api';

class InstructionService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl('INSTRUCTION_SERVICE', endpoint);
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

  async getInstructions(page: number = 1, limit: number = 20, filters?: any): Promise<PaginatedResponse<Instruction>> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await this.request<PaginatedResponse<Instruction>>(`/instructions?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch instructions:', error);
      throw error;
    }
  }

  async getInstruction(id: string): Promise<Instruction> {
    try {
      const response = await this.request<Instruction>(`/instructions/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch instruction:', error);
      throw error;
    }
  }

  async createInstruction(data: InstructionCreate): Promise<Instruction> {
    try {
      const response = await this.request<Instruction>('/instructions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error('Failed to create instruction:', error);
      throw error;
    }
  }

  async updateInstruction(id: string, data: InstructionUpdate): Promise<Instruction> {
    try {
      const response = await this.request<Instruction>(`/instructions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error('Failed to update instruction:', error);
      throw error;
    }
  }

  async deleteInstruction(id: string): Promise<void> {
    try {
      await this.request(`/instructions/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete instruction:', error);
      throw error;
    }
  }

  async uploadInstruction(file: File): Promise<Instruction> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const url = buildApiUrl('INSTRUCTION_SERVICE', '/instructions/upload');
      const token = localStorage.getItem('auth_token');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to upload instruction:', error);
      throw error;
    }
  }

  async searchInstructions(query: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Instruction>> {
    try {
      const response = await this.request<PaginatedResponse<Instruction>>(
        `/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Failed to search instructions:', error);
      throw error;
    }
  }

  async getInstructionStats(): Promise<any> {
    try {
      const response = await this.request('/instructions/stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch instruction stats:', error);
      throw error;
    }
  }

  async distributeInstruction(instructionId: string, recipients: string[]): Promise<void> {
    try {
      await this.request(`/instructions/${instructionId}/distribute`, {
        method: 'POST',
        body: JSON.stringify({ recipients }),
      });
    } catch (error) {
      console.error('Failed to distribute instruction:', error);
      throw error;
    }
  }

  async getInstructionCategories(): Promise<string[]> {
    try {
      const response = await this.request<{ categories: string[] }>('/categories');
      return response.categories;
    } catch (error) {
      console.error('Failed to fetch instruction categories:', error);
      throw error;
    }
  }

  async downloadInstruction(id: string): Promise<Blob> {
    try {
      const url = buildApiUrl('INSTRUCTION_SERVICE', `/instructions/${id}/download`);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(url, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to download instruction:', error);
      throw error;
    }
  }
}

export const instructionService = new InstructionService();
