import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DebugPage: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const navigate = useNavigate();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testLinkClick = (href: string) => {
    addLog(`Link tıklanıyor: ${href}`);
    try {
      // Programmatic navigation test
      navigate(href);
      addLog(`Programmatic navigation başarılı: ${href}`);
    } catch (error) {
      addLog(`Programmatic navigation hatası: ${error}`);
    }
  };

  const testExternalLink = (url: string) => {
    addLog(`External link tıklanıyor: ${url}`);
    try {
      window.open(url, '_blank');
      addLog(`External link başarılı: ${url}`);
    } catch (error) {
      addLog(`External link hatası: ${error}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Link Debug Sayfası</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Links */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Linkler</h2>
          
          <div className="space-y-3">
            <Link 
              to="/dashboard" 
              className="block p-3 bg-blue-100 dark:bg-blue-900 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
              onClick={() => addLog('Dashboard link tıklandı')}
            >
              Dashboard Link
            </Link>
            
            <Link 
              to="/documents" 
              className="block p-3 bg-green-100 dark:bg-green-900 rounded hover:bg-green-200 dark:hover:bg-green-800"
              onClick={() => addLog('Documents link tıklandı')}
            >
              Documents Link
            </Link>
            
            <Link 
              to="/instructions" 
              className="block p-3 bg-purple-100 dark:bg-purple-900 rounded hover:bg-purple-200 dark:hover:bg-purple-800"
              onClick={() => addLog('Instructions link tıklandı')}
            >
              Instructions Link
            </Link>
            
            <button
              onClick={() => testLinkClick('/analytics')}
              className="block w-full p-3 bg-yellow-100 dark:bg-yellow-900 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800"
            >
              Analytics (Programmatic)
            </button>
            
            <button
              onClick={() => testExternalLink('https://google.com')}
              className="block w-full p-3 bg-red-100 dark:bg-red-900 rounded hover:bg-red-200 dark:hover:bg-red-800"
            >
              External Link Test
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Debug Logları</h2>
          
          <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Henüz log yok...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          
          <button
            onClick={() => setLogs([])}
            className="mt-3 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Logları Temizle
          </button>
        </div>
      </div>

      {/* Current Route Info */}
      <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Mevcut Route Bilgisi</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Current Pathname:</strong> {window.location.pathname}
          </div>
          <div>
            <strong>Current Hash:</strong> {window.location.hash}
          </div>
          <div>
            <strong>Current Search:</strong> {window.location.search}
          </div>
          <div>
            <strong>User Agent:</strong> {navigator.userAgent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
