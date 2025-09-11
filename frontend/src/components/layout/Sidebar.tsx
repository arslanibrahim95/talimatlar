import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { mainNavigation, NavigationItem } from '../../config/navigation';
import { 
  XMarkIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon,
  HomeIcon,
  DocumentIcon,
  FolderIcon,
  ChartBarIcon,
  BellIcon,
  UsersIcon,
  CogIcon,
  SparklesIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      dashboard: <HomeIcon className="w-5 h-5" />,
      document: <DocumentIcon className="w-5 h-5" />,
      category: <FolderIcon className="w-5 h-5" />,
      folder: <FolderIcon className="w-5 h-5" />,
      clipboard: <ClipboardDocumentListIcon className="w-5 h-5" />,
      analytics: <ChartBarIcon className="w-5 h-5" />,
      notification: <BellIcon className="w-5 h-5" />,
      users: <UsersIcon className="w-5 h-5" />,
      settings: <CogIcon className="w-5 h-5" />,
      ai: <SparklesIcon className="w-5 h-5" />,
      personnel: <UserGroupIcon className="w-5 h-5" />,
      help: <QuestionMarkCircleIcon className="w-5 h-5" />,
      about: <InformationCircleIcon className="w-5 h-5" />,
      contact: <EnvelopeIcon className="w-5 h-5" />
    };
    return iconMap[iconName] || <DocumentIcon className="w-5 h-5" />;
  };

  const handleItemClick = () => {
    // Close mobile sidebar when item is clicked
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={cn(
        'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out h-full',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header with close button for mobile */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          
          {/* Desktop toggle button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-4 h-4" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleItemClick}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                isActive(item.href)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500'
                  : 'text-gray-700 dark:text-gray-300'
              )}
              title={!isCollapsed ? undefined : item.description}
            >
              <div className="flex-shrink-0">
                {getIcon(item.icon)}
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.isNew && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                      Yeni
                    </span>
                  )}
                  {item.isBeta && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200">
                      Beta
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">CT</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Claude Talimat
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    İş Güvenliği Sistemi
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};



export default Sidebar;
