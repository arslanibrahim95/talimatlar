import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface PlaceholderPageProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ 
  title = 'Sayfa Yükleniyor',
  description = 'Bu sayfa henüz geliştirilme aşamasındadır.',
  icon
}) => {
  const location = useLocation();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-2xl font-semibold mb-4">{title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {description}
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Route:</strong> {location.pathname}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Status:</strong> Development in progress
              </p>
            </div>
            <div className="space-x-4">
              <Button 
                onClick={() => window.history.back()}
                variant="outline"
              >
                ← Geri Dön
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="default"
              >
                🏠 Ana Sayfaya Git
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
