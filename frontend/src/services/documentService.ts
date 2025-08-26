import axios from 'axios';
import { Document, DocumentCreate, DocumentUpdate, SearchFilters, PaginatedResponse, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const documentService = {
  // Get all documents with pagination and filters
  async getDocuments(
    page: number = 1,
    limit: number = 20,
    filters?: SearchFilters
  ): Promise<PaginatedResponse<Document>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.query && { query: filters.query }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo }),
      ...(filters?.tags && { tags: filters.tags.join(',') }),
      ...(filters?.createdBy && { createdBy: filters.createdBy })
    });

    const response = await axios.get(`${API_BASE_URL}/documents?${params}`);
    return response.data;
  },

  // Get document by ID
  async getDocument(id: string): Promise<Document> {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}`);
    return response.data;
  },

  // Create new document
  async createDocument(data: DocumentCreate): Promise<Document> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('category', data.category);
    if (data.description) formData.append('description', data.description);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    formData.append('file', data.file);

    const response = await axios.post(`${API_BASE_URL}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update document
  async updateDocument(id: string, data: DocumentUpdate): Promise<Document> {
    const response = await axios.put(`${API_BASE_URL}/documents/${id}`, data);
    return response.data;
  },

  // Delete document
  async deleteDocument(id: string): Promise<ApiResponse> {
    const response = await axios.delete(`${API_BASE_URL}/documents/${id}`);
    return response.data;
  },

  // Search documents
  async searchDocuments(query: string, filters?: Omit<SearchFilters, 'query'>): Promise<SearchResult<Document>> {
    const params = new URLSearchParams({
      query,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo }),
      ...(filters?.tags && { tags: filters.tags.join(',') }),
      ...(filters?.createdBy && { createdBy: filters.createdBy })
    });

    const response = await axios.get(`${API_BASE_URL}/documents/search?${params}`);
    return response.data;
  },

  // Get document categories
  async getCategories(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/documents/categories`);
    return response.data;
  },

  // Download document
  async downloadDocument(id: string): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get document analytics
  async getDocumentAnalytics(id: string): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}/analytics`);
    return response.data;
  },

  // Rate document
  async rateDocument(id: string, rating: number): Promise<ApiResponse> {
    const response = await axios.post(`${API_BASE_URL}/documents/${id}/rate`, { rating });
    return response.data;
  },

  // Get document versions
  async getDocumentVersions(id: string): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}/versions`);
    return response.data;
  },

  // Restore document version
  async restoreDocumentVersion(id: string, versionId: string): Promise<ApiResponse> {
    const response = await axios.post(`${API_BASE_URL}/documents/${id}/versions/${versionId}/restore`);
    return response.data;
  },

  // Bulk operations
  async bulkUpdateDocuments(ids: string[], updates: Partial<DocumentUpdate>): Promise<ApiResponse> {
    const response = await axios.put(`${API_BASE_URL}/documents/bulk`, { ids, updates });
    return response.data;
  },

  async bulkDeleteDocuments(ids: string[]): Promise<ApiResponse> {
    const response = await axios.delete(`${API_BASE_URL}/documents/bulk`, { data: { ids } });
    return response.data;
  },

  // Export documents
  async exportDocuments(filters?: SearchFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams({
      format,
      ...(filters?.query && { query: filters.query }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo }),
      ...(filters?.tags && { tags: filters.tags.join(',') }),
      ...(filters?.createdBy && { createdBy: filters.createdBy })
    });

    const response = await axios.get(`${API_BASE_URL}/documents/export?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default documentService;
