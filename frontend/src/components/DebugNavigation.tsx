import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DebugNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      currentPath: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state,
      key: location.key,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      windowLocation: window.location.href,
      historyLength: window.history.length
    };
    
    setDebugInfo(info);
    console.log('🔍 Navigation Debug Info:', info);
  }, [location]);

  const testNavigation = (path: string) => {
    console.log(`🧪 Testing navigation to: ${path}`);
    try {
      navigate(path);
      console.log(`✅ Navigation successful to: ${path}`);
    } catch (error) {
      console.error(`❌ Navigation failed to: ${path}`, error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-semibold text-sm mb-2">🔍 Navigation Debug</h3>
      <div className="text-xs space-y-1">
        <div><strong>Path:</strong> {debugInfo.currentPath}</div>
        <div><strong>Search:</strong> {debugInfo.search || 'none'}</div>
        <div><strong>Hash:</strong> {debugInfo.hash || 'none'}</div>
        <div><strong>Key:</strong> {debugInfo.key}</div>
      </div>
      
      <div className="mt-3 space-y-1">
        <button
          onClick={() => testNavigation('/dashboard')}
          className="w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Dashboard
        </button>
        <button
          onClick={() => testNavigation('/documents')}
          className="w-full px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Documents
        </button>
        <button
          onClick={() => testNavigation('/analytics')}
          className="w-full px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Test Analytics
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Check console for detailed logs
      </div>
    </div>
  );
};

export default DebugNavigation;
