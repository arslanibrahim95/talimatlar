import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  className
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: number[] = [];
    const half = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <nav className={cn('flex items-center justify-center space-x-1', className)}>
      {/* First Page */}
      {showFirstLast && !visiblePages.includes(1) && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={isFirstPage}
          >
            1
          </Button>
          {visiblePages[0] > 2 && (
            <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
          )}
        </>
      )}

      {/* Previous Button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
      )}

      {/* Page Numbers */}
      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      {/* Next Button */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      )}

      {/* Last Page */}
      {showFirstLast && !visiblePages.includes(totalPages) && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={isLastPage}
          >
            {totalPages}
          </Button>
        </>
      )}
    </nav>
  );
};

// Pagination Info
interface PaginationInfoProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  className?: string;
}

export const PaginationInfo: React.FC<PaginationInfoProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={cn('text-sm text-gray-700 dark:text-gray-300', className)}>
      {totalItems > 0 ? (
        <>
          <span className="font-medium">{startItem}</span>
          {' - '}
          <span className="font-medium">{endItem}</span>
          {' / '}
          <span className="font-medium">{totalItems}</span>
          {' sonuç'}
        </>
      ) : (
        'Sonuç bulunamadı'
      )}
    </div>
  );
};
