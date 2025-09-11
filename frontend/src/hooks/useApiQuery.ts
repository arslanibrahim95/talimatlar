import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { ServiceResponse } from '../types';
import { ErrorHandler } from '../utils/errorHandler';

/**
 * Custom hook for API queries with React Query
 * Provides consistent error handling and caching
 */
export const useApiQuery = <T>(
  queryKey: (string | number)[],
  queryFn: () => Promise<ServiceResponse<T>>,
  options?: Omit<UseQueryOptions<ServiceResponse<T>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await queryFn();
        if (!response.success) {
          throw new Error(response.error?.detail || 'Query failed');
        }
        return response;
      } catch (error) {
        ErrorHandler.logError(error, `useApiQuery: ${queryKey.join('.')}`);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on client errors
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
};

/**
 * Custom hook for API mutations with React Query
 * Provides consistent error handling and cache invalidation
 */
export const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ServiceResponse<TData>>,
  options?: UseMutationOptions<ServiceResponse<TData>, Error, TVariables>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        const response = await mutationFn(variables);
        if (!response.success) {
          throw new Error(response.error?.detail || 'Mutation failed');
        }
        return response;
      } catch (error) {
        ErrorHandler.logError(error, 'useApiMutation');
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      ErrorHandler.logError(error, 'useApiMutation');
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
    ...options,
  });
};

/**
 * Hook for invalidating queries
 */
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  const invalidate = (queryKey: (string | number)[]) => {
    queryClient.invalidateQueries({ queryKey });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };

  const removeQueries = (queryKey: (string | number)[]) => {
    queryClient.removeQueries({ queryKey });
  };

  return {
    invalidate,
    invalidateAll,
    removeQueries,
  };
};

/**
 * Hook for prefetching data
 */
export const usePrefetchQuery = () => {
  const queryClient = useQueryClient();

  const prefetch = async <T>(
    queryKey: (string | number)[],
    queryFn: () => Promise<ServiceResponse<T>>
  ) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const response = await queryFn();
        if (!response.success) {
          throw new Error(response.error?.detail || 'Prefetch failed');
        }
        return response;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetch };
};
