import React from 'react';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/Button';

const Users: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kullanıcılar
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sistem kullanıcılarını yönetin
            </p>
          </div>
          <Button>👤 Yeni Kullanıcı</Button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Kullanıcı yönetimi sayfası burada olacak
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Users;
