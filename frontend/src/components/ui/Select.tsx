import React from 'react';
import { cn } from '../../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ className, children, ...props }) => {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
};

const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => {
  return (
    <div className={cn('relative', className)}>
      {children}
    </div>
  );
};

const SelectItem: React.FC<SelectItemProps> = ({ value, children, className }) => {
  return (
    <option value={value} className={cn('px-3 py-2', className)}>
      {children}
    </option>
  );
};

const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className, onClick }) => {
  return (
    <button
      type="button"
      className={cn(
        'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex items-center justify-between',
        className
      )}
      onClick={onClick}
    >
      {children}
      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

const SelectValue: React.FC<SelectValueProps> = ({ placeholder, className }) => {
  return (
    <span className={cn('text-gray-500 dark:text-gray-400', className)}>
      {placeholder || 'Seçiniz...'}
    </span>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
