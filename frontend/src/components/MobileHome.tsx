import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Instruction } from '../types';
import { instructionService } from '../services/instructionService';
import QRCodeScanner from './QRCodeScanner';

const MobileHome: React.FC = () => {
  const navigate = useNavigate();
  const [recentInstructions, setRecentInstructions] = useState<Instruction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadRecentInstructions();
    
    // Dark mode preference'i kontrol et
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const loadRecentInstructions = async () => {
    try {
      setIsLoading(true);
      const response = await instructionService.getInstructions(1, 10, { status: 'published' });
      setRecentInstructions(response.data || []);
    } catch (error) {
      console.error('Failed to load recent instructions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await instructionService.searchInstructions(searchQuery, 1, 20);
      // Arama sonuçlarını yeni sayfada göster
      navigate('/mobile/search', { 
        state: { 
          searchResults: response.data,
          searchQuery 
        } 
      });
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleQRScanSuccess = (result: string) => {
    setShowScanner(false);
    // QR kod tarama sonucunda talimat sayfasına yönlendir
    if (result.includes('/instruction/')) {
      const instructionId = result.split('/instruction/')[1];
      navigate(`/mobile/instructions/${instructionId}`);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return '✅';
      default: return '📋';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return '📢';
      case 'approved': return '✅';
      case 'pending': return '⏳';
      case 'draft': return '📝';
      default: return '📋';
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">📱 Talimat Sistemi</h1>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            
            <button
              onClick={() => setShowScanner(!showScanner)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              📱
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* QR Scanner */}
        {showScanner && (
          <div className="mb-6">
            <QRCodeScanner
              onScanSuccess={handleQRScanSuccess}
              onScanError={(error) => console.error('Scan error:', error)}
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Talimat ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className={`w-full px-4 py-3 pl-12 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={handleSearch}
              className="absolute inset-y-0 right-0 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg"
            >
              Ara
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/mobile/instructions')}
              className={`p-4 rounded-lg text-center ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 border border-gray-600' 
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="text-3xl mb-2">📋</div>
              <div className="font-medium">Tüm Talimatlar</div>
            </button>
            
            <button
              onClick={() => navigate('/mobile/categories')}
              className={`p-4 rounded-lg text-center ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 border border-gray-600' 
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="text-3xl mb-2">📂</div>
              <div className="font-medium">Kategoriler</div>
            </button>
            
            <button
              onClick={() => navigate('/mobile/favorites')}
              className={`p-4 rounded-lg text-center ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 border border-gray-600' 
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="text-3xl mb-2">⭐</div>
              <div className="font-medium">Favoriler</div>
            </button>
            
            <button
              onClick={() => navigate('/mobile/recent')}
              className={`p-4 rounded-lg text-center ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 border border-gray-600' 
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="text-3xl mb-2">🕒</div>
              <div className="font-medium">Son Görülenler</div>
            </button>
          </div>
        </div>

        {/* Recent Instructions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Son Talimatlar</h2>
            <button
              onClick={() => navigate('/mobile/instructions')}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
            >
              Tümünü Gör →
            </button>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg animate-pulse ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : recentInstructions.length > 0 ? (
            <div className="space-y-3">
              {recentInstructions.map((instruction) => (
                <div
                  key={instruction.id}
                  onClick={() => navigate(`/mobile/instructions/${instruction.id}`)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800 hover:bg-gray-700 border border-gray-600' 
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                      {instruction.title}
                    </h3>
                    <div className="flex items-center space-x-1 ml-2">
                      <span className="text-sm">{getPriorityIcon(instruction.priority)}</span>
                      <span className="text-sm">{getStatusIcon(instruction.status)}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {instruction.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{instruction.category}</span>
                    <span>{new Date(instruction.updatedAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600`}>
              <div className="text-4xl mb-2">📋</div>
              <p className="text-gray-500 dark:text-gray-400">Henüz talimat bulunmuyor</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Hızlı İstatistikler</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-lg text-center ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="text-2xl font-bold text-blue-600">
                {recentInstructions.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Aktif Talimat
              </div>
            </div>
            
            <div className={`p-4 rounded-lg text-center ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="text-2xl font-bold text-green-600">
                {recentInstructions.filter(inst => inst.status === 'published').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Yayınlanan
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className={`p-4 rounded-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-blue-50'
        }`}>
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Nasıl Kullanılır?
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• QR kod tarayarak talimata hızlıca erişin</li>
            <li>• Arama yaparak istediğiniz talimatı bulun</li>
            <li>• Kategorilere göre talimatları filtreleyin</li>
            <li>• Favori talimatları kaydedin</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MobileHome;
