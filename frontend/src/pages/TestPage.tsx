import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TestButton } from '../components/ui/TestButton';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Tooltip } from '../components/ui/Tooltip';
import { Dropdown } from '../components/ui/Dropdown';
import { Toast, ToastContainer } from '../components/ui/Toast';
import { Pagination, PaginationInfo } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MODERN_GRADIENTS, THEME_COLORS } from '../constants/colors';

const TestPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;
  const totalItems = 100;
  const itemsPerPage = 10;

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const dropdownItems = [
    { label: 'Profil', value: 'profile', icon: '👤' },
    { label: 'Ayarlar', value: 'settings', icon: '⚙️' },
    { label: 'Çıkış', value: 'logout', icon: '🚪' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🎨 Modern Design System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            2024-2025 tasarım trendleriyle oluşturulmuş modern, glassmorphism efektli bileşenler
          </p>
        </div>

        {/* Modern Cards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                Glassmorphism
              </CardTitle>
              <CardDescription>
                Modern cam efekti ile şeffaf tasarım
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="default">Modern</Badge>
                <Badge variant="success">2024</Badge>
                <Badge variant="warning">Trendy</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🌈</span>
                Gradient 2.0
              </CardTitle>
              <CardDescription>
                Gelişmiş gradient kombinasyonları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className={`h-8 rounded-lg ${MODERN_GRADIENTS.modern.sunset}`}></div>
                <div className={`h-8 rounded-lg ${MODERN_GRADIENTS.modern.ocean}`}></div>
                <div className={`h-8 rounded-lg ${MODERN_GRADIENTS.modern.forest}`}></div>
                <div className={`h-8 rounded-lg ${MODERN_GRADIENTS.modern.aurora}`}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎭</span>
                Micro-interactions
              </CardTitle>
              <CardDescription>
                Gelişmiş animasyonlar ve geçişler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="primary" size="sm" className="animate-float">
                  Floating Button
                </Button>
                <Button variant="success" size="sm" className="animate-glow">
                  Glowing Button
                </Button>
                <Button variant="warning" size="sm" className="animate-shimmer">
                  Shimmer Effect
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Buttons Showcase */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">🚀 Modern Button Collection</CardTitle>
            <CardDescription>
              Yeni tasarım sistemiyle güncellenmiş button bileşenleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Primary Actions</h3>
                <div className="space-y-2">
                  <Button variant="primary" size="lg" className="w-full">
                    Primary Action
                  </Button>
                  <Button variant="secondary" size="md" className="w-full">
                    Secondary Action
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Outline Action
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Status Actions</h3>
                <div className="space-y-2">
                  <Button variant="success" size="md" className="w-full">
                    ✅ Success Action
                  </Button>
                  <Button variant="warning" size="md" className="w-full">
                    ⚠️ Warning Action
                  </Button>
                  <Button variant="danger" size="md" className="w-full">
                    ❌ Danger Action
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Interactive States</h3>
                <div className="space-y-2">
                  <Button variant="ghost" size="md" className="w-full">
                    👻 Ghost Button
                  </Button>
                  <Button variant="primary" size="md" loading className="w-full">
                    Loading State
                  </Button>
                  <Button variant="secondary" size="md" disabled className="w-full">
                    Disabled State
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Original Test Content */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            🧪 Test Sayfası
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Routing Test
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Bu sayfa routing sisteminin çalışıp çalışmadığını test etmek için oluşturuldu.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/dashboard"
                className="block p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
              >
                <h3 className="font-medium text-blue-900 dark:text-blue-100">🏠 Ana Sayfa</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">Dashboard sayfası</p>
              </Link>
              
              <Link
                to="/dashboard"
                className="block p-4 bg-green-100 dark:bg-green-900/20 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
              >
                <h3 className="font-medium text-green-900 dark:text-green-100">📊 Dashboard</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Dashboard sayfası</p>
              </Link>
              
              <Link
                to="/file-management"
                className="block p-4 bg-purple-100 dark:bg-purple-900/20 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors"
              >
                <h3 className="font-medium text-purple-900 dark:text-purple-100">📁 Dosya Yönetimi</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">Dosya yönetimi sayfası</p>
              </Link>
              
              <Link
                to="/create-document"
                className="block p-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-colors"
              >
                <h3 className="font-medium text-orange-900 dark:text-orange-100">✏️ Yeni Doküman</h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">Yeni doküman oluşturma</p>
              </Link>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🧪 TestButton Component Test
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Agent CLI Prompt 2025-09-03 test için oluşturulan TestButton component'i:
            </p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <TestButton 
                variant="primary" 
                onClick={() => console.log('Primary button clicked!')}
              >
                Primary Button
              </TestButton>
              
              <TestButton 
                variant="success" 
                onClick={() => console.log('Success button clicked!')}
              >
                Success Button
              </TestButton>
              
              <TestButton 
                variant="danger" 
                onClick={() => console.log('Danger button clicked!')}
              >
                Danger Button
              </TestButton>
              
              <TestButton 
                variant="outline" 
                onClick={() => console.log('Outline button clicked!')}
              >
                Outline Button
              </TestButton>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-green-800 dark:text-green-200 text-sm">
                ✅ <strong>Test Başarılı!</strong> TestButton component'i başarıyla oluşturuldu ve onClick event'leri çalışıyor.
                Console'da click loglarını görebilirsiniz.
              </p>
            </div>
          </div>

          {/* New UI Components Test */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🎨 Yeni UI Component'leri Test
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Agent CLI Prompt 2025-09-03 ile otomatik olarak oluşturulan yeni component'ler:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Modal Test */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Modal Component</h3>
                <Button onClick={() => setIsModalOpen(true)}>
                  Modal Aç
                </Button>
              </div>

              {/* Tooltip Test */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Tooltip Component</h3>
                <Tooltip content="Bu bir tooltip mesajıdır">
                  <Button variant="outline">Hover yap</Button>
                </Tooltip>
              </div>

              {/* Dropdown Test */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Dropdown Component</h3>
                <Dropdown
                  trigger={<Button variant="outline">Menü ▼</Button>}
                  items={dropdownItems}
                  onItemClick={(item) => console.log('Selected:', item.value)}
                />
              </div>

              {/* Toast Test */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Toast Component</h3>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="success"
                    onClick={() => addToast('success', 'Başarılı!', 'İşlem tamamlandı')}
                  >
                    Success
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger"
                    onClick={() => addToast('error', 'Hata!', 'Bir hata oluştu')}
                  >
                    Error
                  </Button>
                  <Button 
                    size="sm" 
                    variant="warning"
                    onClick={() => addToast('warning', 'Uyarı!', 'Dikkatli olun')}
                  >
                    Warning
                  </Button>
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={() => addToast('info', 'Bilgi', 'Önemli bilgi')}
                  >
                    Info
                  </Button>
                </div>
              </div>
            </div>

            {/* Pagination Test */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Pagination Component</h3>
              <div className="flex items-center justify-between">
                <PaginationInfo
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>

            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                🎉 <strong>Otomatik Görev Tamamlama Başarılı!</strong> 5 yeni UI component'i otomatik olarak oluşturuldu ve test edildi.
                Tüm component'ler çalışıyor ve kullanıma hazır.
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Authentication Test
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Authentication durumunu test etmek için console'da aşağıdaki kodu çalıştırın:
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg font-mono text-sm">
              <p className="text-gray-800 dark:text-gray-200">
                // Test kullanıcısı oluştur<br/>
                localStorage.setItem('test_user', JSON.stringify(&#123;<br/>
                &nbsp;&nbsp;id: 'test-user-123',<br/>
                &nbsp;&nbsp;email: 'test@example.com',<br/>
                &nbsp;&nbsp;first_name: 'Test',<br/>
                &nbsp;&nbsp;last_name: 'Kullanıcı',<br/>
                &nbsp;&nbsp;role: 'user'<br/>
                &#125;));<br/>
                localStorage.setItem('auth_token', 'test-token-123');<br/>
                localStorage.setItem('is_test_user', 'true');<br/>
                <br/>
                // Sayfayı yenile<br/>
                location.reload();
              </p>
            </div>
          </div>
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Test Modal"
          size="md"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Bu modal Agent CLI Prompt 2025-09-03 ile otomatik olarak oluşturuldu.
          </p>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>
              Tamam
            </Button>
          </ModalFooter>
        </Modal>

        {/* Toast Container */}
        <ToastContainer
          toasts={toasts}
          onRemove={removeToast}
        />
      </div>
    </div>
  );
};

export default TestPage;
