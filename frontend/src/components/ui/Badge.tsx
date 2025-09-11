import React from 'react';
import { cn } from '../../utils/cn';
import { COMPONENT_COLORS } from '../../constants/colors';
import { COMPONENT_TYPOGRAPHY } from '../../constants/typography';

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  children, 
  className 
}) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variantClasses = {
    default: COMPONENT_COLORS.badge.default,
    secondary: COMPONENT_COLORS.badge.secondary,
    success: COMPONENT_COLORS.badge.success,
    warning: COMPONENT_COLORS.badge.warning,
    danger: COMPONENT_COLORS.badge.danger,
    outline: COMPONENT_COLORS.badge.outline
  };

  return (
    <div className={cn(baseClasses, COMPONENT_TYPOGRAPHY.badge.default, variantClasses[variant], className)}>
      {children}
    </div>
  );
};

export { Badge };
