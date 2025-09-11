import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Users: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanıcılar</h1>
          <p className="text-gray-600 dark:text-gray-400">Kullanıcı yönetimi ana sayfası</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button 
            onClick={() => navigate('/users')}
            className="w-full sm:w-auto"
          >
            Kullanıcıları Görüntüle
          </Button>
        </div>
      </div>

      {/* Redirect Card */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Yönetimi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Kullanıcı yönetimi için ana sayfaya yönlendiriliyorsunuz.
          </p>
          <Button onClick={() => navigate('/users')}>
            Kullanıcılara Git
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
