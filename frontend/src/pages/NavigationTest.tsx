import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { mainNavigation } from '../config/navigation';

const NavigationTest: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testNavigation = (href: string, title: string) => {
    addResult(`Testing navigation to: ${title} (${href})`);
    
    try {
      navigate(href);
      addResult(`✅ Successfully navigated to: ${title}`);
    } catch (error) {
      addResult(`❌ Failed to navigate to: ${title} - ${error}`);
    }
  };

  const testLinkClick = (href: string, title: string) => {
    addResult(`Testing Link component to: ${title} (${href})`);
    // Link component test - this should work
    addResult(`✅ Link component ready for: ${title}`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 Navigation Test Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Location Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📍 Current Location</h2>
          <div className="space-y-2">
            <p><strong>Pathname:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{location.pathname}</code></p>
            <p><strong>Search:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{location.search || 'none'}</code></p>
            <p><strong>Hash:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{location.hash || 'none'}</code></p>
            <p><strong>State:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{JSON.stringify(location.state) || 'none'}</code></p>
          </div>
        </div>

        {/* Navigation Test Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🎮 Test Controls</h2>
          <div className="space-y-3">
            <button
              onClick={() => setTestResults([])}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Results
            </button>
            <button
              onClick={() => testNavigation('/dashboard', 'Dashboard')}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Navigate to Dashboard
            </button>
            <button
              onClick={() => testNavigation('/documents', 'Documents')}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Navigate to Documents
            </button>
            <button
              onClick={() => testNavigation('/nonexistent', 'Non-existent Page')}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Test Navigate to Non-existent Page
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Menu Test */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">🧭 Navigation Menu Test</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mainNavigation.map((item) => (
            <div key={item.id} className="space-y-2">
              <h3 className="font-medium text-sm">{item.title}</h3>
              <div className="space-y-1">
                <Link
                  to={item.href}
                  className="block w-full px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                  onClick={() => addResult(`Link clicked: ${item.title} -> ${item.href}`)}
                >
                  Link Component
                </Link>
                <button
                  onClick={() => testNavigation(item.href, item.title)}
                  className="block w-full px-3 py-2 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                >
                  Navigate Function
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">📊 Test Results</h2>
        <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No test results yet. Click the test buttons above.</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">🔗 Quick Navigation Links</h2>
        <div className="flex flex-wrap gap-2">
          {mainNavigation.slice(0, 8).map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Debug Information */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">🐛 Debug Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Router Info</h3>
            <div className="text-sm space-y-1">
              <p><strong>Window Location:</strong> {window.location.href}</p>
              <p><strong>History Length:</strong> {window.history.length}</p>
              <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</p>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">React Router Info</h3>
            <div className="text-sm space-y-1">
              <p><strong>Location Key:</strong> {location.key}</p>
              <p><strong>Location Pathname:</strong> {location.pathname}</p>
              <p><strong>Location Search:</strong> {location.search || 'none'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationTest;
