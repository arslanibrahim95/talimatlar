// Enhanced Error Boundary Component
// Provides comprehensive error handling for React components

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler, AppError, ErrorType, ErrorSeverity } from '../utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error?: AppError;
  errorInfo?: ErrorInfo;
  retryCount: number;
  lastRetryTime?: Date;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Convert React error to AppError
    const appError = errorHandler.createError(
      error.message || 'An unexpected error occurred',
      ErrorType.CLIENT_ERROR,
      ErrorSeverity.HIGH,
      {
        component: 'ErrorBoundary',
        action: 'getDerivedStateFromError',
        stack: error.stack,
      },
      error
    );

    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Create AppError with additional context
    const appError = errorHandler.createError(
      error.message || 'Component error occurred',
      ErrorType.CLIENT_ERROR,
      ErrorSeverity.HIGH,
      {
        component: 'ErrorBoundary',
        action: 'componentDidCatch',
        stack: error.stack,
        metadata: {
          componentStack: errorInfo.componentStack,
          retryCount: this.state.retryCount,
        },
      },
      error
    );

    // Update state with error info
    this.setState({
      error: appError,
      errorInfo,
    });

    // Handle the error
    errorHandler.handleError(appError);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary if props changed and resetOnPropsChange is true
    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        prevProps.resetKeys?.[index] !== key
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
      lastRetryTime: undefined,
    });
  };

  retry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
      lastRetryTime: new Date(),
    }));

    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Retry after delay
    this.retryTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Render appropriate error UI based on level
      return this.renderErrorUI(error, retryCount, level);
    }

    return children;
  }

  private renderErrorUI(error?: AppError, retryCount: number = 0, level: string) {
    const isRetryable = retryCount < this.maxRetries;
    const canRetry = isRetryable && error?.isRetryable !== false;

    if (level === 'critical') {
      return this.renderCriticalError(error, canRetry);
    }

    if (level === 'page') {
      return this.renderPageError(error, canRetry);
    }

    return this.renderComponentError(error, canRetry);
  }

  private renderCriticalError(error?: AppError, canRetry: boolean) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Critical Error
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            A critical error has occurred. The application cannot continue.
          </p>
          {error && (
            <details className="text-left mb-4">
              <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                Error Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                <div><strong>Type:</strong> {error.type}</div>
                <div><strong>Message:</strong> {error.message}</div>
                {error.context.timestamp && (
                  <div><strong>Time:</strong> {error.context.timestamp.toISOString()}</div>
                )}
              </div>
            </details>
          )}
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Reload Application
            </button>
            {canRetry && (
              <button
                onClick={this.retry}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  private renderPageError(error?: AppError, canRetry: boolean) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We encountered an error while loading this page. Please try again.
          </p>
          <div className="space-y-3">
            {canRetry && (
              <button
                onClick={this.retry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  private renderComponentError(error?: AppError, canRetry: boolean) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Component Error
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              This component encountered an error and cannot be displayed.
            </p>
            {canRetry && (
              <div className="mt-3">
                <button
                  onClick={this.retry}
                  className="text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-200 font-medium py-1 px-3 rounded transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// Higher-order component for error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for error boundary functionality
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: { component?: string; action?: string }) => {
    const appError = errorHandler.createError(
      error.message,
      ErrorType.CLIENT_ERROR,
      ErrorSeverity.MEDIUM,
      {
        component: context?.component || 'useErrorHandler',
        action: context?.action,
        stack: error.stack,
      },
      error
    );

    errorHandler.handleError(appError);
  };

  return { handleError };
};

export default ErrorBoundary;