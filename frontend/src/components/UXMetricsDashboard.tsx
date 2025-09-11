import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { uxAnalytics, UXMetrics, PerformanceMetrics } from '../utils/analytics';

/**
 * Props interface for UXMetricsDashboard component
 */
interface UXMetricsDashboardProps {
  isVisible?: boolean;
}

/**
 * UX Metrics Dashboard component
 * Displays real-time performance metrics and user experience data
 * Provides insights into application performance and user engagement
 * 
 * @param isVisible - Controls dashboard visibility
 * @returns Dashboard component with performance metrics
 */
export const UXMetricsDashboard: React.FC<UXMetricsDashboardProps> = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState<UXMetrics & PerformanceMetrics | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = uxAnalytics.getMetrics();
      setMetrics(currentMetrics);
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !metrics) {
    return null;
  }

  /**
   * Determines color based on performance threshold
   * Green: Good, Yellow: Warning, Red: Poor
   */
  const getPerformanceColor = (value: number, threshold: number) => {
    if (value <= threshold) return 'text-green-600 dark:text-green-400';
    if (value <= threshold * 1.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  /**
   * Determines color based on accessibility score
   * Green: 90+, Yellow: 70-89, Red: <70
   */
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 shadow-xl border-2 transition-all duration-300 ${
        isExpanded ? 'h-96' : 'h-16'
      }`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              UX Metrikleri
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4 overflow-y-auto max-h-80">
            {/* Performance Metrics */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Core Web Vitals
              </h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>FCP:</span>
                  <span className={getPerformanceColor(metrics.fcp, 1800)}>
                    {metrics.fcp.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>LCP:</span>
                  <span className={getPerformanceColor(metrics.lcp, 2500)}>
                    {metrics.lcp.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>FID:</span>
                  <span className={getPerformanceColor(metrics.fid, 100)}>
                    {metrics.fid.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CLS:</span>
                  <span className={getPerformanceColor(metrics.cls, 0.1)}>
                    {metrics.cls.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            {/* User Experience Metrics */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Kullanıcı Deneyimi
              </h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Sayfa Yükleme:</span>
                  <span className={getPerformanceColor(metrics.pageLoadTime, 3000)}>
                    {metrics.pageLoadTime.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Etkileşim Süresi:</span>
                  <span className={getPerformanceColor(metrics.interactionTime, 100)}>
                    {metrics.interactionTime.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Hata Oranı:</span>
                  <span className={getScoreColor(100 - metrics.errorRate)}>
                    {(100 - metrics.errorRate).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kullanıcı Katılımı:</span>
                  <span className={getScoreColor(metrics.userEngagement)}>
                    {metrics.userEngagement.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Performance */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Mobil Performans
              </h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Mobil Skor:</span>
                  <span className={getScoreColor(metrics.mobilePerformance)}>
                    {metrics.mobilePerformance.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Erişilebilirlik:</span>
                  <span className={getScoreColor(metrics.accessibilityScore)}>
                    {metrics.accessibilityScore.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Ek Metrikler
              </h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>TTFB:</span>
                  <span className={getPerformanceColor(metrics.ttfb, 800)}>
                    {metrics.ttfb.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Güncelleme:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

/**
 * Custom hook for UX Metrics Dashboard
 * Manages dashboard visibility state
 * 
 * @returns Object with dashboard visibility state and toggle function
 */
export const useUXMetricsDashboard = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggle = () => setIsVisible(!isVisible);
  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  return {
    isVisible,
    toggle,
    show,
    hide
  };
};
