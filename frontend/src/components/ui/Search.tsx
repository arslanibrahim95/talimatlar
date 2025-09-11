import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchableItems, NavigationItem } from '../../config/navigation';
import { cn } from '../../utils/cn';

interface SearchProps {
  className?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  showResults?: boolean;
}

export const Search: React.FC<SearchProps> = ({ 
  className,
  placeholder = 'Ara...',
  size = 'md',
  showResults = true
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<NavigationItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Size classes
  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg'
  };

  // Filter items based on query
  useEffect(() => {
    if (query.trim() === '') {
      setFilteredItems([]);
      setIsOpen(false);
      return;
    }

    const filtered = searchableItems().filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase()) ||
      item.href.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredItems(filtered);
    setIsOpen(filtered.length > 0);
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleItemClick(filteredItems[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item: NavigationItem) => {
    if (item.isExternal) {
      window.open(item.href, '_blank');
    } else {
      navigate(item.href);
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (query.trim() !== '' && filteredItems.length > 0) {
      setIsOpen(true);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={cn(
            'block w-full pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'dark:focus:ring-blue-400 dark:focus:border-blue-400',
            'transition-colors duration-200',
            sizeClasses[size]
          )}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {showResults && isOpen && filteredItems.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          {filteredItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700',
                'transition-colors duration-200',
                'first:rounded-t-lg last:rounded-b-lg',
                selectedIndex === index && 'bg-blue-50 dark:bg-blue-900/20'
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.label}
                    </p>
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
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
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Keyboard Shortcut Hint */}
      {!query && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-500">
            ⌘K
          </kbd>
        </div>
      )}
    </div>
  );
};

// Icon components
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Global search hook
export const useGlobalSearch = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isSearchOpen, setIsSearchOpen };
};
