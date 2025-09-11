import { Document, DocumentCreate, DocumentUpdate, PaginatedResponse, ServiceResponse } from '../types';
import { BaseService } from './BaseService';

class DocumentService extends BaseService {
  constructor() {
    super('DOCUMENT_SERVICE', {
      timeout: 30000,
      retries: 3,
    });
  }

  async getDocuments(page: number = 1, limit: number = 20): Promise<ServiceResponse<PaginatedResponse<Document>>> {
    return this.get<PaginatedResponse<Document>>(`/documents?page=${page}&limit=${limit}`);
  }

  async getDocument(id: string): Promise<ServiceResponse<Document>> {
    return this.get<Document>(`/documents/${id}`);
  }

  async createDocument(data: DocumentCreate): Promise<ServiceResponse<Document>> {
    return this.post<Document>('/documents', data);
  }

  async updateDocument(id: string, data: DocumentUpdate): Promise<ServiceResponse<Document>> {
    return this.put<Document>(`/documents/${id}`, data);
  }

  async deleteDocument(id: string): Promise<ServiceResponse<void>> {
    return this.delete<void>(`/documents/${id}`);
  }

  async searchDocuments(query: string, page: number = 1, limit: number = 20): Promise<ServiceResponse<PaginatedResponse<Document>>> {
    return this.get<PaginatedResponse<Document>>(
      `/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
  }

  async getCategories(): Promise<ServiceResponse<string[]>> {
    const response = await this.get<{ categories: string[] }>('/categories');
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.categories,
        message: response.message
      };
    }
    return response as ServiceResponse<string[]>;
  }

  async downloadDocument(id: string): Promise<ServiceResponse<Blob>> {
    const response = await this.get<Blob>(`/documents/${id}/download`, {
      headers: {
        'Accept': 'application/octet-stream',
      }
    });
    return response;
  }
}

export const documentService = new DocumentService();
