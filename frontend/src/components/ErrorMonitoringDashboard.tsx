// Error Monitoring Dashboard
// Provides real-time error monitoring and statistics

import React, { useState, useEffect } from 'react';
import { errorHandler, ErrorType, ErrorSeverity } from '../utils/errorHandling';
import { circuitBreakerManager } from '../utils/circuitBreaker';

interface ErrorStats {
  total: number;
  byType: Record<ErrorType, number>;
  bySeverity: Record<ErrorSeverity, number>;
  recent: any[];
}

interface CircuitBreakerStats {
  state: string;
  failures: number;
  successes: number;
  requests: number;
  failureRate: number;
  nextAttemptTime?: Date;
}

const ErrorMonitoringDashboard: React.FC = () => {
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [circuitBreakerStats, setCircuitBreakerStats] = useState<Record<string, CircuitBreakerStats>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Refresh data
  const refreshData = () => {
    const stats = errorHandler.getErrorStats();
    setErrorStats(stats);

    const breakerStats = circuitBreakerManager.getAllStats();
    const processedBreakerStats: Record<string, CircuitBreakerStats> = {};
    
    Object.entries(breakerStats).forEach(([name, stats]) => {
      processedBreakerStats[name] = {
        state: stats.state,
        failures: stats.failures,
        successes: stats.successes,
        requests: stats.requests,
        failureRate: stats.requests > 0 ? stats.failures / stats.requests : 0,
        nextAttemptTime: stats.nextAttemptTime,
      };
    });
    
    setCircuitBreakerStats(processedBreakerStats);
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    refreshData();
    const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Toggle visibility with Ctrl+Shift+E
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getSeverityColor = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'text-blue-600 bg-blue-100';
      case ErrorSeverity.MEDIUM:
        return 'text-yellow-600 bg-yellow-100';
      case ErrorSeverity.HIGH:
        return 'text-orange-600 bg-orange-100';
      case ErrorSeverity.CRITICAL:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCircuitBreakerColor = (state: string): string => {
    switch (state) {
      case 'CLOSED':
        return 'text-green-600 bg-green-100';
      case 'OPEN':
        return 'text-red-600 bg-red-100';
      case 'HALF_OPEN':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Error Monitoring Dashboard
          </h2>
          <div className="flex items-center space-x-2">
            <label className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto Refresh
            </label>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Error Statistics */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Error Statistics
              </h3>
              
              {errorStats ? (
                <div className="space-y-4">
                  {/* Total Errors */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {errorStats.total}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Total Errors
                    </div>
                  </div>

                  {/* Errors by Type */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Errors by Type
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(errorStats.byType).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Errors by Severity */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Errors by Severity
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
                        <div key={severity} className="flex justify-between items-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(severity as ErrorSeverity)}`}>
                            {severity}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  No error data available
                </div>
              )}
            </div>

            {/* Circuit Breaker Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Circuit Breaker Status
              </h3>
              
              {Object.keys(circuitBreakerStats).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(circuitBreakerStats).map(([name, stats]) => (
                    <div key={name} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {name}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getCircuitBreakerColor(stats.state)}`}>
                          {stats.state}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600 dark:text-gray-300">Requests</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {stats.requests}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-300">Failures</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {stats.failures}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-300">Successes</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {stats.successes}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-300">Failure Rate</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {(stats.failureRate * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      {stats.nextAttemptTime && (
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          Next attempt: {formatDate(stats.nextAttemptTime)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  No circuit breakers configured
                </div>
              )}
            </div>
          </div>

          {/* Recent Errors */}
          {errorStats && errorStats.recent.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Recent Errors
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="space-y-3">
                  {errorStats.recent.map((error, index) => (
                    <div key={index} className="border-l-4 border-red-400 pl-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {error.type}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(error.severity)}`}>
                          {error.severity}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {error.message}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(error.context.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-2">
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Refresh Data
            </button>
            <button
              onClick={() => errorHandler.clearErrorLog()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Clear Error Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMonitoringDashboard;
