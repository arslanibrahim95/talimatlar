import React from 'react';
import { Link } from 'react-router-dom';
import { quickActions } from '../config/navigation';
import { cn } from '../utils/cn';
import { useState } from 'react';
import {
  DashboardIcon,
  DocumentIcon,
  CategoryIcon,
  AnalyticsIcon,
  NotificationIcon,
  UsersIcon,
  SettingsIcon,
  HelpIcon,
  ContactIcon,
  AboutIcon,
  AIIcon
} from './icons';

interface QuickActionsProps {
  className?: string;
  variant?: 'grid' | 'list';
  size?: 'sm' | 'md' | 'lg';
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: DashboardIcon,
  document: DocumentIcon,
  category: CategoryIcon,
  analytics: AnalyticsIcon,
  notification: NotificationIcon,
  users: UsersIcon,
  settings: SettingsIcon,
  help: HelpIcon,
  contact: ContactIcon,
  about: AboutIcon,
  ai: AIIcon
};

// Helper function to render icon
const renderIcon = (iconName: string, className: string) => {
  const IconComponent = iconMap[iconName];
  if (!IconComponent) {
    return <DocumentIcon className={className} />; // fallback
  }
  return <IconComponent className={className} />;
};

export const QuickActions: React.FC<QuickActionsProps> = ({ 
  className,
  variant = 'grid',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-3 text-base',
    lg: 'p-4 text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (variant === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {quickActions.map((action) => (
          <Link
            key={action.id}
            to={action.href}
            className={cn(
              'flex items-center space-x-3 p-3 rounded-lg',
              'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
              'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600',
              'transition-all duration-200 group',
              sizeClasses[size]
            )}
          >
            <div className="flex-shrink-0 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
              {renderIcon(action.icon, iconSizes[size])}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {action.label}
              </p>
              {action.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {action.description}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {quickActions.map((action) => (
        <Link
          key={action.id}
          to={action.href}
          className={cn(
            'flex flex-col items-center text-center p-4 rounded-lg',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600',
            'hover:shadow-md transition-all duration-200 group',
            sizeClasses[size]
          )}
        >
          <div className="flex-shrink-0 mb-3 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
            {renderIcon(action.icon, iconSizes[size])}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {action.label}
            </p>
            {action.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {action.description}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};

// Floating Quick Actions for mobile
export const FloatingQuickActions: React.FC<{ className?: string }> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('fixed bottom-6 right-6 z-40', className)}>
      {/* Quick Actions Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full',
          'shadow-lg hover:shadow-xl transition-all duration-200',
          'flex items-center justify-center'
        )}
      >
        {isOpen ? (
          <XIcon className="w-6 h-6" />
        ) : (
          <PlusIcon className="w-6 h-6" />
        )}
      </button>

      {/* Quick Actions Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Hızlı İşlemler</h3>
          </div>
          <div className="p-2">
            {quickActions.map((action) => (
              <Link
                key={action.id}
                to={action.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                  {renderIcon(action.icon, 'w-5 h-5')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {action.label}
                  </p>
                  {action.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {action.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Icon components
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
