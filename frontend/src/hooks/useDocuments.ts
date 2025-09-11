import { useApiQuery, useApiMutation, useInvalidateQueries } from './useApiQuery';
import { documentService } from '../services/documentService';
import { Document, DocumentCreate, DocumentUpdate, PaginatedResponse } from '../types';

/**
 * Hook for fetching documents with pagination
 */
export const useDocuments = (page: number = 1, limit: number = 20) => {
  return useApiQuery<PaginatedResponse<Document>>(
    ['documents', page, limit],
    () => documentService.getDocuments(page, limit),
    {
      keepPreviousData: true, // Keep previous data while fetching new page
    }
  );
};

/**
 * Hook for fetching a single document
 */
export const useDocument = (id: string, enabled: boolean = true) => {
  return useApiQuery<Document>(
    ['documents', id],
    () => documentService.getDocument(id),
    {
      enabled: enabled && !!id,
    }
  );
};

/**
 * Hook for searching documents
 */
export const useSearchDocuments = (query: string, page: number = 1, limit: number = 20) => {
  return useApiQuery<PaginatedResponse<Document>>(
    ['documents', 'search', query, page, limit],
    () => documentService.searchDocuments(query, page, limit),
    {
      enabled: query.length > 2, // Only search if query is longer than 2 characters
      keepPreviousData: true,
    }
  );
};

/**
 * Hook for fetching document categories
 */
export const useDocumentCategories = () => {
  return useApiQuery<string[]>(
    ['documents', 'categories'],
    () => documentService.getCategories(),
    {
      staleTime: 30 * 60 * 1000, // Cache categories for 30 minutes
    }
  );
};

/**
 * Hook for creating a document
 */
export const useCreateDocument = () => {
  const { invalidate } = useInvalidateQueries();

  return useApiMutation<Document, DocumentCreate>(
    (data) => documentService.createDocument(data),
    {
      onSuccess: () => {
        // Invalidate documents list to refetch
        invalidate(['documents']);
        invalidate(['documents', 'categories']);
      },
    }
  );
};

/**
 * Hook for updating a document
 */
export const useUpdateDocument = () => {
  const { invalidate } = useInvalidateQueries();

  return useApiMutation<Document, { id: string; data: DocumentUpdate }>(
    ({ id, data }) => documentService.updateDocument(id, data),
    {
      onSuccess: (data, variables) => {
        // Invalidate specific document and documents list
        invalidate(['documents', variables.id]);
        invalidate(['documents']);
      },
    }
  );
};

/**
 * Hook for deleting a document
 */
export const useDeleteDocument = () => {
  const { invalidate } = useInvalidateQueries();

  return useApiMutation<void, string>(
    (id) => documentService.deleteDocument(id),
    {
      onSuccess: (_, id) => {
        // Remove specific document from cache and invalidate list
        invalidate(['documents', id]);
        invalidate(['documents']);
      },
    }
  );
};

/**
 * Hook for downloading a document
 */
export const useDownloadDocument = () => {
  return useApiMutation<Blob, string>(
    (id) => documentService.downloadDocument(id)
  );
};
