import React from 'react';
import { cn } from '../../utils/cn';

interface AlertProps {
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ 
  variant = 'default', 
  children, 
  className 
}) => {
  const baseClasses = 'relative w-full rounded-lg border p-4';
  
  const variantClasses = {
    default: 'bg-background text-foreground border-border',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </div>
  );
};

const AlertDescription: React.FC<AlertDescriptionProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn('text-sm [&_p]:leading-relaxed', className)}>
      {children}
    </div>
  );
};

export { Alert, AlertDescription };
