import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Help: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yardım</h1>
          <p className="text-gray-600 dark:text-gray-400">Kullanım kılavuzu ve destek</p>
        </div>
      </div>

      {/* Help Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Başlangıç Rehberi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sistemi kullanmaya başlamak için temel bilgiler
            </p>
            <Button variant="outline">
              Rehberi Görüntüle
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sık Sorulan Sorular</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              En çok sorulan sorular ve cevapları
            </p>
            <Button variant="outline">
              SSS'yi Görüntüle
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Video Eğitimler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Adım adım video eğitimler
            </p>
            <Button variant="outline">
              Eğitimleri İzle
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Destek Talebi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Teknik destek için talep oluşturun
            </p>
            <Button variant="outline">
              Talep Oluştur
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>İletişim Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">E-posta</h3>
              <p className="text-gray-600 dark:text-gray-400">support@example.com</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Telefon</h3>
              <p className="text-gray-600 dark:text-gray-400">+90 212 123 45 67</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Çalışma Saatleri</h3>
              <p className="text-gray-600 dark:text-gray-400">Pazartesi - Cuma: 09:00 - 18:00</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Yanıt Süresi</h3>
              <p className="text-gray-600 dark:text-gray-400">24 saat içinde</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
