import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from './ui/LoadingSpinner';

/**
 * Props interface for LazyLoader component
 */
interface LazyLoaderProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  loadingText?: string;
}

/**
 * LazyLoader component for code splitting and dynamic imports
 * Wraps components with Suspense boundary for better loading experience
 * 
 * @param component - Function that returns a dynamic import promise
 * @param fallback - Custom fallback component (optional)
 * @param loadingText - Text to display during loading (optional)
 * @returns Suspense-wrapped lazy component
 */
export const LazyLoader: React.FC<LazyLoaderProps> = ({ 
  component, 
  fallback,
  loadingText = 'Yükleniyor...'
}) => {
  const LazyComponent = lazy(component);

  return (
    <Suspense 
      fallback={
        fallback || (
          <div className="flex items-center justify-center min-h-[200px]">
            <LoadingSpinner size="lg" text={loadingText} />
          </div>
        )
      }
    >
      <LazyComponent />
    </Suspense>
  );
};

/**
 * Predefined lazy components for common pages
 * These components are pre-configured for lazy loading
 */
export const LazyDashboard = lazy(() => import('../pages/Dashboard'));
export const LazyDocuments = lazy(() => import('../pages/Documents'));
export const LazyAnalytics = lazy(() => import('../pages/Analytics'));
export const LazyUsers = lazy(() => import('../pages/Users'));
export const LazySettings = lazy(() => import('../pages/Settings'));

/**
 * Lazy loading wrapper for images with placeholder support
 * Provides smooth loading experience with fallback images
 * 
 * @param src - Image source URL
 * @param alt - Alt text for accessibility
 * @param className - CSS classes for styling
 * @param placeholder - Placeholder image URL (optional)
 * @returns Image component with lazy loading
 */
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}> = ({ src, alt, className, placeholder = '/placeholder.svg' }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse">
          <img 
            src={placeholder} 
            alt="Loading placeholder" 
            className="w-full h-full object-cover opacity-50"
          />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
};

/**
 * Custom hook for intersection observer
 * Triggers callback when element becomes visible
 * Useful for lazy loading and infinite scrolling
 * 
 * @param callback - Function to call when element intersects
 * @param options - IntersectionObserver options
 * @returns Ref to attach to target element
 */
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const elementRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(entry.target);
        }
      });
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [callback, options]);

  return elementRef;
};

/**
 * Virtual scrolling component for large lists
 * Renders only visible items to improve performance
 * 
 * @param items - Array of items to render
 * @param itemHeight - Height of each item in pixels
 * @param containerHeight - Height of the container
 * @param renderItem - Function to render each item
 * @returns Virtualized list component
 */
export const VirtualList: React.FC<{
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}> = ({ items, itemHeight, containerHeight, renderItem }) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemCount + 1, items.length);

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
