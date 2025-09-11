import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className="relative">
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700',
            sizeClasses[size]
          )}
          style={{
            borderTopColor: 'transparent',
            borderRightColor: 'transparent'
          }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent border-r-transparent animate-pulse"></div>
        </div>
      </div>
      {text && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 text-center">
          {text}
        </p>
      )}
    </div>
  );
};

// Modern Page Loading Spinner with glassmorphism
export const PageLoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Yükleniyor...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="text-center">
        {/* Modern glassmorphism loading card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-glass border border-white/30 dark:border-gray-700/30">
          <div className="relative mb-6">
            {/* Modern gradient spinner */}
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin" style={{ animationDuration: '1.5s' }}></div>
              <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-800"></div>
              <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"></div>
            </div>
            
            {/* Floating dots */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-500 rounded-full animate-float"></div>
            <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-purple-500 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-1/2 -left-4 w-2 h-2 bg-pink-500 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {text}
          </h3>
          
          {/* Modern progress dots */}
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loading
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
        className
      )}
    />
  );
};

// Card Skeleton
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
};

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Skeleton className="w-8 h-8 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="w-20 h-8 rounded" />
        </div>
      ))}
    </div>
  );
};
