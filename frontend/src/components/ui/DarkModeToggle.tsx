import React from 'react';
import { useTheme } from '../../stores/themeStore';
import { Button } from './Button';

interface DarkModeToggleProps {
  variant?: 'default' | 'minimal' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ 
  variant = 'default', 
  size = 'md',
  className = '' 
}) => {
  const { theme, toggleTheme, setTheme } = useTheme();

  const getThemeIcon = () => {
    if (theme === 'dark') {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (theme === 'light') {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      );
    } else {
      // System theme
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
  };

  const getThemeLabel = () => {
    if (theme === 'dark') return 'Açık temaya geç';
    if (theme === 'light') return 'Koyu temaya geç';
    return 'Sistem teması';
  };

  const getThemeText = () => {
    if (theme === 'dark') return 'Açık';
    if (theme === 'light') return 'Koyu';
    return 'Sistem';
  };

  if (variant === 'icon-only') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={toggleTheme}
        className={`p-2 ${className}`}
        title={getThemeLabel()}
        aria-label={getThemeLabel()}
      >
        {getThemeIcon()}
      </Button>
    );
  }

  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={toggleTheme}
        className={`flex items-center space-x-2 ${className}`}
        title={getThemeLabel()}
      >
        {getThemeIcon()}
        <span className="hidden sm:inline">{getThemeText()}</span>
      </Button>
    );
  }

  // Default variant with dropdown
  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size={size}
        onClick={toggleTheme}
        className={`flex items-center space-x-2 ${className}`}
        title={getThemeLabel()}
      >
        {getThemeIcon()}
        <span className="hidden sm:inline">{getThemeText()}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1">
          <button
            onClick={() => setTheme('light')}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              theme === 'light' 
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Açık Tema</span>
            </div>
          </button>
          
          <button
            onClick={() => setTheme('dark')}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              theme === 'dark' 
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              <span>Koyu Tema</span>
            </div>
          </button>
          
          <button
            onClick={() => setTheme('system')}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              theme === 'system' 
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Sistem Teması</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
