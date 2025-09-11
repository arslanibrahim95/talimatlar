import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>
          <p className="text-gray-600 dark:text-gray-400">Sistem ayarları ve konfigürasyon</p>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Genel Ayarlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sistem genel ayarları ve konfigürasyonu
            </p>
            <Button variant="outline">
              Düzenle
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Ayarları</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Kullanıcı tercihleri ve profil ayarları
            </p>
            <Button variant="outline">
              Düzenle
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Güvenlik</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Güvenlik ayarları ve şifre değiştirme
            </p>
            <Button variant="outline">
              Düzenle
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bildirimler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Bildirim tercihleri ve e-posta ayarları
            </p>
            <Button variant="outline">
              Düzenle
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
