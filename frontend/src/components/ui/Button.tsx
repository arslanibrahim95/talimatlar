import React from 'react';
import { cn } from '../../utils/cn';
import { COMPONENT_COLORS } from '../../constants/colors';
import { COMPONENT_SPACING } from '../../constants/spacing';
import { COMPONENT_TYPOGRAPHY } from '../../constants/typography';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = cn(
    // Modern base styles
    'inline-flex items-center justify-center',
    'font-semibold font-sans-modern',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    'ring-offset-background',
    'transform-gpu',
    // Modern hover and active effects
    'hover:scale-[1.02] hover:shadow-modern-md',
    'active:scale-[0.98] active:shadow-modern-sm',
    // Modern focus effects
    'focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    // Modern disabled state
    'disabled:transform-none disabled:shadow-none',
    // Modern loading state
    loading && 'cursor-not-allowed'
  );
  
  const variantClasses = {
    default: cn(
      'bg-gray-900 text-white',
      'hover:bg-gray-800 hover:shadow-glow',
      'dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200',
      'shadow-modern-sm'
    ),
    primary: cn(
      'bg-primary text-primary-foreground',
      'hover:bg-primary/90 hover:shadow-glow-blue',
      'shadow-modern-sm',
      'bg-gradient-modern-primary'
    ),
    secondary: cn(
      'bg-secondary text-secondary-foreground',
      'hover:bg-secondary/80 hover:shadow-modern-md',
      'shadow-modern-xs'
    ),
    outline: cn(
      'border border-input bg-background',
      'hover:bg-accent hover:text-accent-foreground',
      'hover:shadow-modern-sm',
      'shadow-modern-xs'
    ),
    ghost: cn(
      'hover:bg-accent hover:text-accent-foreground',
      'hover:shadow-modern-xs'
    ),
    danger: cn(
      'bg-destructive text-destructive-foreground',
      'hover:bg-destructive/90 hover:shadow-glow-red',
      'shadow-modern-sm',
      'bg-gradient-modern-danger'
    ),
    success: cn(
      'bg-success text-success-foreground',
      'hover:bg-success/90 hover:shadow-glow-green',
      'shadow-modern-sm',
      'bg-gradient-modern-success'
    ),
    warning: cn(
      'bg-warning text-warning-foreground',
      'hover:bg-warning/90 hover:shadow-glow-orange',
      'shadow-modern-sm',
      'bg-gradient-modern-warning'
    ),
  };
  
  const sizeClasses = {
    sm: cn(
      'h-8 px-3 text-xs',
      'rounded-lg',
      'gap-1'
    ),
    md: cn(
      'h-10 px-4 text-sm',
      'rounded-xl',
      'gap-2'
    ),
    lg: cn(
      'h-12 px-6 text-base',
      'rounded-2xl',
      'gap-3'
    ),
  };
  
  const typographyClasses = {
    sm: 'font-medium tracking-tight',
    md: 'font-semibold tracking-normal',
    lg: 'font-bold tracking-wide',
  };
  
  const spacingClasses = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
  };
  
  const loadingSpinner = (
    <div className="relative">
      <svg
        className={cn(
          'animate-spin',
          size === 'sm' && 'h-3 w-3',
          size === 'md' && 'h-4 w-4',
          size === 'lg' && 'h-5 w-5'
        )}
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
    </div>
  );

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        typographyClasses[size],
        spacingClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {loading && loadingSpinner}
        {!loading && leftIcon && (
          <span className="flex items-center justify-center">
            {leftIcon}
          </span>
        )}
        <span className="flex items-center justify-center">
          {children}
        </span>
        {!loading && rightIcon && (
          <span className="flex items-center justify-center">
            {rightIcon}
          </span>
        )}
      </div>
    </button>
  );
};
