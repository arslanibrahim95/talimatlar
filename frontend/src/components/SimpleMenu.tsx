import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SimpleMenu: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { href: '/dashboard', label: '🏠 Ana Sayfa' },
    { href: '/documents', label: '📄 Dokümanlar' },
    { href: '/categories', label: '📂 Kategoriler' },
    { href: '/analytics', label: '📈 Analitik' },
    { href: '/notifications', label: '🔔 Bildirimler' },
    { href: '/users', label: '👥 Kullanıcılar' },
    { href: '/instructions', label: '📋 Talimatlar' },
    { href: '/ai', label: '🤖 AI Yönetici' },
    { href: '/personnel', label: '👨‍💼 Personel Yönetimi' },
    { href: '/file-management', label: '📁 Dosya Yönetimi' },
    { href: '/settings', label: '⚙️ Ayarlar' },
    { href: '/help', label: '❓ Yardım' },
    { href: '/about', label: 'ℹ️ Hakkında' },
    { href: '/contact', label: '📧 İletişim' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="max-w-7xl mx-auto">
        <nav className="flex flex-wrap gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default SimpleMenu;
