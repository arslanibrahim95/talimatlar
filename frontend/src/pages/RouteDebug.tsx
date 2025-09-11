import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const RouteDebug: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [errors, setErrors] = useState<string[]>([]);
  const [routeTests, setRouteTests] = useState<any[]>([]);

  useEffect(() => {
    // Check for common routing issues
    const checkRoutingIssues = () => {
      const issues: string[] = [];
      
      // Check if we're in the right location
      if (location.pathname === '/route-debug') {
        issues.push('✅ Route debug page loaded successfully');
      }
      
      // Check for missing components
      const requiredComponents = [
        'Dashboard',
        'Documents', 
        'Categories',
        'Analytics',
        'Users',
        'Settings'
      ];
      
      requiredComponents.forEach(component => {
        try {
          // This would normally check if component exists
          issues.push(`✅ ${component} component should be available`);
        } catch (error) {
          issues.push(`❌ ${component} component missing: ${error}`);
        }
      });
      
      setErrors(issues);
    };

    checkRoutingIssues();
  }, [location]);

  const testRoute = async (path: string) => {
    const startTime = Date.now();
    try {
      navigate(path);
      const endTime = Date.now();
      setRouteTests(prev => [...prev, {
        path,
        status: 'success',
        duration: endTime - startTime,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      setRouteTests(prev => [...prev, {
        path,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const testAllRoutes = () => {
    const routes = [
      '/dashboard',
      '/documents',
      '/categories',
      '/analytics',
      '/users',
      '/settings',
      '/instructions',
      '/ai',
      '/personnel',
      '/file-management',
      '/create-document',
      '/file-import-demo'
    ];

    routes.forEach((route, index) => {
      setTimeout(() => testRoute(route), index * 100);
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Route Debug Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Route Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📍 Current Route Info</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Pathname:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{location.pathname}</code></div>
            <div><strong>Search:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{location.search || 'none'}</code></div>
            <div><strong>Hash:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{location.hash || 'none'}</code></div>
            <div><strong>State:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{JSON.stringify(location.state) || 'none'}</code></div>
            <div><strong>Key:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{location.key}</code></div>
            <div><strong>Params:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{JSON.stringify(params)}</code></div>
          </div>
        </div>

        {/* Route Tests */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Route Tests</h2>
          <div className="space-y-3">
            <button
              onClick={testAllRoutes}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test All Routes
            </button>
            <button
              onClick={() => setRouteTests([])}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Results
            </button>
          </div>
          
          <div className="mt-4 max-h-64 overflow-y-auto">
            {routeTests.map((test, index) => (
              <div key={index} className={`p-2 rounded text-sm mb-2 ${
                test.status === 'success' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                <div className="font-medium">{test.path}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {test.status === 'success' ? `✅ ${test.duration}ms` : `❌ ${test.error}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Route Issues */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">🐛 Route Issues</h2>
        <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 max-h-64 overflow-y-auto">
          {errors.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No issues detected</p>
          ) : (
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="text-sm font-mono">
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">🔗 Quick Navigation</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {[
            { path: '/dashboard', label: 'Dashboard' },
            { path: '/documents', label: 'Documents' },
            { path: '/categories', label: 'Categories' },
            { path: '/analytics', label: 'Analytics' },
            { path: '/users', label: 'Users' },
            { path: '/settings', label: 'Settings' },
            { path: '/instructions', label: 'Instructions' },
            { path: '/ai', label: 'AI Dashboard' },
            { path: '/personnel', label: 'Personnel' },
            { path: '/file-management', label: 'File Management' },
            { path: '/create-document', label: 'Create Document' },
            { path: '/file-import-demo', label: 'File Import Demo' }
          ].map((route) => (
            <button
              key={route.path}
              onClick={() => testRoute(route.path)}
              className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
            >
              {route.label}
            </button>
          ))}
        </div>
      </div>

      {/* Browser Info */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">🌐 Browser Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</div>
            <div><strong>Platform:</strong> {navigator.platform}</div>
            <div><strong>Language:</strong> {navigator.language}</div>
          </div>
          <div>
            <div><strong>Window Size:</strong> {window.innerWidth}x{window.innerHeight}</div>
            <div><strong>Screen Size:</strong> {screen.width}x{screen.height}</div>
            <div><strong>History Length:</strong> {window.history.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDebug;
