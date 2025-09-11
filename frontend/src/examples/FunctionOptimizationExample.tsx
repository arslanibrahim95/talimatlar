/**
 * Function Optimization Examples
 * 
 * Bu dosya, fonksiyon optimizasyon utility'lerinin nasıl kullanılacağını gösterir.
 */

import React, { useState, useCallback } from 'react';
import { 
  useOptimizedAsync, 
  useMemoizedAsync,
  optimizeAsyncFunction,
  withRetry,
  withTimeout,
  withCache,
  withPerformanceTracking,
  createBatchProcessor,
  createDebouncedAsync
} from '../utils/functionOptimization';

// Örnek API fonksiyonları
const fetchUserData = async (userId: string): Promise<any> => {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
};

const fetchUserPosts = async (userId: string): Promise<any[]> => {
  const response = await fetch(`/api/users/${userId}/posts`);
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
};

const processUserData = async (users: any[]): Promise<any[]> => {
  // Simulated processing
  return users.map(user => ({ ...user, processed: true }));
};

export const FunctionOptimizationExample: React.FC = () => {
  const [userId, setUserId] = useState('1');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. useOptimizedAsync ile optimize edilmiş fonksiyon
  const optimizedFetchUser = useOptimizedAsync(fetchUserData, [userId]);

  // 2. useMemoizedAsync ile memoized fonksiyon
  const memoizedFetchPosts = useMemoizedAsync(fetchUserPosts, [userId]);

  // 3. optimizeAsyncFunction ile tam optimize edilmiş fonksiyon
  const fullyOptimizedFetch = optimizeAsyncFunction(fetchUserData)
    .withRetry(3, 1000)
    .withTimeout(5000)
    .withCache((id: string) => `user_${id}`)
    .withPerformanceTracking('fetchUserData');

  // 4. Batch processor örneği
  const batchProcessor = createBatchProcessor(processUserData, 5);

  // 5. Debounced async fonksiyon
  const debouncedSearch = createDebouncedAsync(async (query: string) => {
    const response = await fetch(`/api/search?q=${query}`);
    return response.json();
  }, 300);

  // Örnek kullanım fonksiyonları
  const handleBasicFetch = useCallback(async () => {
    setLoading(true);
    try {
      const user = await optimizedFetchUser(userId);
      setResult(user);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [optimizedFetchUser, userId]);

  const handleOptimizedFetch = useCallback(async () => {
    setLoading(true);
    try {
      const user = await fullyOptimizedFetch(userId);
      setResult(user);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [fullyOptimizedFetch, userId]);

  const handleBatchProcess = useCallback(async () => {
    setLoading(true);
    try {
      // Simulated user data
      const users = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
        { id: '3', name: 'User 3' },
        { id: '4', name: 'User 4' },
        { id: '5', name: 'User 5' },
        { id: '6', name: 'User 6' },
        { id: '7', name: 'User 7' },
        { id: '8', name: 'User 8' },
        { id: '9', name: 'User 9' },
        { id: '10', name: 'User 10' },
        { id: '11', name: 'User 11' },
        { id: '12', name: 'User 12' }
      ];
      
      const processedUsers = await batchProcessor(users);
      setResult({ processedUsers, total: processedUsers.length });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [batchProcessor]);

  const handleDebouncedSearch = useCallback(async (query: string) => {
    try {
      const results = await debouncedSearch(query);
      setResult(results);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [debouncedSearch]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Function Optimization Examples</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            User ID:
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="border rounded px-3 py-2 w-full max-w-xs"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleBasicFetch}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Basic Optimized Fetch
          </button>

          <button
            onClick={handleOptimizedFetch}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Fully Optimized Fetch
          </button>

          <button
            onClick={handleBatchProcess}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Batch Process
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Debounced Search:
          </label>
          <input
            type="text"
            placeholder="Type to search..."
            onChange={(e) => handleDebouncedSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full max-w-xs"
          />
        </div>

        {loading && (
          <div className="text-blue-600">Loading...</div>
        )}

        {result && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Result:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Optimization Features Used:</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li><strong>useOptimizedAsync:</strong> React hook ile optimize edilmiş async fonksiyon</li>
          <li><strong>useMemoizedAsync:</strong> Memoized async fonksiyon</li>
          <li><strong>withRetry:</strong> Otomatik retry mekanizması</li>
          <li><strong>withTimeout:</strong> Timeout koruması</li>
          <li><strong>withCache:</strong> Sonuç cache'leme</li>
          <li><strong>withPerformanceTracking:</strong> Performans ölçümü</li>
          <li><strong>createBatchProcessor:</strong> Toplu işlem işleme</li>
          <li><strong>createDebouncedAsync:</strong> Debounced async fonksiyon</li>
        </ul>
      </div>
    </div>
  );
};

export default FunctionOptimizationExample;
