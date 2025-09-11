import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export interface TestButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

export const TestButton: React.FC<TestButtonProps> = ({
  variant = 'default',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  onClick,
  ...props
}) => {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    setClickCount(prev => prev + 1);
    console.log(`TestButton clicked ${clickCount + 1} times`);
    onClick?.();
  };

  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const variantClasses = {
    default: 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800 focus-visible:ring-gray-500 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700',
    outline: 'border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:ring-gray-500',
    ghost: 'bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500 dark:bg-green-600 dark:text-white dark:hover:bg-green-700',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800 focus-visible:ring-yellow-500 dark:bg-yellow-600 dark:text-white dark:hover:bg-yellow-700',
  };
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-base',
  };
  
  const loadingSpinner = (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        loading && 'cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && loadingSpinner}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children} {clickCount > 0 && `(${clickCount})`}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
