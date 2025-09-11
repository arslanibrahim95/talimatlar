import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavigationItem, getBreadcrumbs } from '../../config/navigation';
import { cn } from '../../utils/cn';

interface BreadcrumbProps {
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  className,
  showHome = true,
  separator = <ChevronRightIcon className="w-4 h-4 text-gray-400" />
}) => {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      {showHome && (
        <>
          <Link
            to="/dashboard"
            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <HomeIcon className="w-4 h-4 mr-1" />
            Ana Sayfa
          </Link>
          {separator}
        </>
      )}
      
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <React.Fragment key={item.id}>
            {isLast ? (
              <span className="flex items-center text-gray-900 dark:text-white font-medium">
                {item.icon && (
                  <span className="mr-2 text-gray-500 dark:text-gray-400">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
              >
                {item.icon && (
                  <span className="mr-2 text-gray-400 dark:text-gray-500">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </Link>
            )}
            
            {!isLast && separator}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// Icon components
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Compact breadcrumb for mobile
export const CompactBreadcrumb: React.FC<BreadcrumbProps> = ({ 
  className,
  showHome = false 
}) => {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  if (breadcrumbs.length === 0) {
    return null;
  }

  const currentPage = breadcrumbs[breadcrumbs.length - 1];

  return (
    <div className={cn('flex items-center space-x-2 text-sm', className)}>
      {showHome && (
        <>
          <Link
            to="/dashboard"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
          >
            Ana Sayfa
          </Link>
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
        </>
      )}
      
      <span className="flex items-center text-gray-900 dark:text-white font-medium">
        {currentPage.icon && (
          <span className="mr-2 text-gray-500 dark:text-gray-400">
            {currentPage.icon}
          </span>
        )}
        {currentPage.label}
      </span>
    </div>
  );
};
