import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';
import { useTheme } from '../../stores/themeStore';
import { Button } from '../ui/Button';
import { Search } from '../ui/Search';
import { DarkModeToggle } from '../ui/DarkModeToggle';
import { mainNavigation } from '../../config/navigation';
import { TestUserButton } from '../TestUserProvider';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center ml-2 lg:ml-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">CT</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Claude Talimat
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {mainNavigation.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Center Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <Search 
              placeholder="Menüde ara..."
              size="sm"
              className="w-full"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Theme toggle */}
            <DarkModeToggle 
              variant="minimal" 
              size="sm"
              className="hidden sm:flex"
            />
            
            {/* Mobile theme toggle */}
            <DarkModeToggle 
              variant="icon-only" 
              size="sm"
              className="sm:hidden"
            />

            {/* User menu */}
            {user && (
              <div className="relative">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.first_name || user.email || 'Kullanıcı'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.role}
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {(user.first_name || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Test User Button */}
            <div className="hidden sm:block">
              <TestUserButton />
            </div>
            
            {/* Logout button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:inline-flex"
            >
              Çıkış
            </Button>
            
            {/* Mobile logout icon */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="sm:hidden p-2"
              title="Çıkış yap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
