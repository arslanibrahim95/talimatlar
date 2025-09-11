import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const About: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hakkında</h1>
          <p className="text-gray-600 dark:text-gray-400">Sistem hakkında bilgiler</p>
        </div>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>Sistem Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Versiyon</h3>
              <p className="text-gray-600 dark:text-gray-400">1.0.0</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Geliştirici</h3>
              <p className="text-gray-600 dark:text-gray-400">Claude AI Team</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Lisans</h3>
              <p className="text-gray-600 dark:text-gray-400">MIT License</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Son Güncelleme</h3>
              <p className="text-gray-600 dark:text-gray-400">29 Ağustos 2025</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Özellikler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Doküman Yönetimi</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Doküman yükleme ve düzenleme</li>
                <li>• Kategori bazlı organizasyon</li>
                <li>• Arama ve filtreleme</li>
                <li>• Versiyon kontrolü</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Kullanıcı Yönetimi</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Rol tabanlı yetkilendirme</li>
                <li>• Kullanıcı profil yönetimi</li>
                <li>• Güvenlik ve kimlik doğrulama</li>
                <li>• Audit logging</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Analitik ve Raporlama</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Performans metrikleri</li>
                <li>• Kullanım istatistikleri</li>
                <li>• Özelleştirilebilir raporlar</li>
                <li>• Veri export/import</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Bildirim Sistemi</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Gerçek zamanlı bildirimler</li>
                <li>• E-posta entegrasyonu</li>
                <li>• Özelleştirilebilir ayarlar</li>
                <li>• Bildirim geçmişi</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Teknoloji Altyapısı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Frontend</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• React 18</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Vite</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Backend</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Python FastAPI</li>
                <li>• Deno Oak</li>
                <li>• Go Gin</li>
                <li>• Node.js Express</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Veritabanı</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• PostgreSQL</li>
                <li>• Redis</li>
                <li>• Docker</li>
                <li>• Nginx</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
