import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  position?: 'left' | 'right';
  className?: string;
  onItemClick?: (item: DropdownItem) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  position = 'left',
  className,
  onItemClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    
    item.onClick?.();
    onItemClick?.(item);
    setIsOpen(false);
  };

  const positionClasses = {
    left: 'left-0',
    right: 'right-0'
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          'absolute top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50',
          positionClasses[position],
          className
        )}>
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-colors',
                  item.disabled
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
