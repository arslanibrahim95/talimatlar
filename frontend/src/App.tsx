import React, { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './stores/authStore'
import { useTheme } from './stores/themeStore'
import { uxAnalytics, useUXTracking } from './utils/analytics'
import { UXMetricsDashboard, useUXMetricsDashboard } from './components/UXMetricsDashboard'
import { TestUserProvider } from './components/TestUserProvider'
import ErrorBoundary from './components/ErrorBoundary'
import ErrorMonitoringDashboard from './components/ErrorMonitoringDashboard'

// Layouts
import MainLayout from './components/layouts/MainLayout'
import AuthLayout from './components/layouts/AuthLayout'

// Lazy loaded pages for better performance
import { LazyLoader } from './components/LazyLoader'
import TestPage from './pages/TestPage'

// Direct imports for testing (keep these for immediate access)
import AIDashboard from './pages/ai/AIDashboard'
import DebugPage from './pages/DebugPage'

/**
 * Preloads critical components for better user experience
 * This function is called after initial page load to prepare
 * commonly used components in the background
 */
const preloadCriticalComponents = () => {
  // Preload dashboard and main components
  import('./pages/Dashboard');
  import('./pages/instructions/InstructionList');
  import('./pages/PersonnelDashboard');
};

// Components
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import DevProtectedRoute from './components/DevProtectedRoute'

/**
 * Main application component that handles routing and global state
 * Manages authentication, theme, and UX analytics
 */
function App() {
  const { isLoading, getCurrentUser } = useAuth()
  const { theme } = useTheme()
  const { trackPageView } = useUXTracking()
  const { isVisible: isUXDashboardVisible } = useUXMetricsDashboard()

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }, [theme])

  // Initialize auth on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await getCurrentUser();
      } catch (error) {
        console.error('Auth initialization failed:', error);
      }
    };

    initializeAuth();
  }, [getCurrentUser]);

  // Initialize UX Analytics and preload critical components
  useEffect(() => {
    uxAnalytics.trackPageLoad();
    uxAnalytics.detectMobilePerformance();
    uxAnalytics.calculateAccessibilityScore();
    
    // Track initial page view
    trackPageView('App Initial Load');
    
    // Preload critical components after initial load
    setTimeout(preloadCriticalComponents, 2000);
  }, [trackPageView]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Sistem yükleniyor..." />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Routes>
        {/* Public routes */}
        <Route path="/test" element={<TestPage />} />
        <Route path="/modern-design" element={
          <LazyLoader 
            component={() => import('./pages/ModernDesignShowcase')}
            loadingText="Modern Design Showcase yükleniyor..."
          />
        } />
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/auth" element={<AuthLayout><Outlet /></AuthLayout>}>
          <Route index element={<Navigate to="/auth/login" replace />} />
          <Route path="login" element={
            <LazyLoader 
              component={() => import('./pages/auth/Login')}
              loadingText="Giriş sayfası yükleniyor..."
            />
          } />
          <Route path="register" element={
            <LazyLoader 
              component={() => import('./pages/auth/Register')}
              loadingText="Kayıt sayfası yükleniyor..."
            />
          } />
          <Route path="forgot-password" element={
            <LazyLoader 
              component={() => import('./pages/auth/ForgotPassword')}
              loadingText="Şifre sıfırlama yükleniyor..."
            />
          } />
          <Route path="reset-password" element={
            <LazyLoader 
              component={() => import('./pages/auth/ResetPassword')}
              loadingText="Şifre sıfırlama yükleniyor..."
            />
          } />
        </Route>

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <DevProtectedRoute>
              <MainLayout><Outlet /></MainLayout>
            </DevProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <LazyLoader 
              component={() => import('./pages/Dashboard')}
              loadingText="Dashboard yükleniyor..."
            />
          } />
          <Route path="documents" element={
            <LazyLoader 
              component={() => import('./pages/Documents')}
              loadingText="Dokümanlar yükleniyor..."
            />
          } />
          <Route path="categories" element={
            <LazyLoader 
              component={() => import('./pages/Categories')}
              loadingText="Kategoriler yükleniyor..."
            />
          } />
          <Route path="analytics" element={
            <LazyLoader 
              component={() => import('./pages/Analytics')}
              loadingText="Analitik yükleniyor..."
            />
          } />
          <Route path="notifications" element={
            <LazyLoader 
              component={() => import('./pages/Notifications')}
              loadingText="Bildirimler yükleniyor..."
            />
          } />
          <Route path="users" element={
            <LazyLoader 
              component={() => import('./pages/Users')}
              loadingText="Kullanıcılar yükleniyor..."
            />
          } />
          <Route path="settings" element={
            <LazyLoader 
              component={() => import('./pages/Settings')}
              loadingText="Ayarlar yükleniyor..."
            />
          } />
          
          {/* Document sub-routes */}
          <Route path="documents/new" element={
            <LazyLoader 
              component={() => import('./pages/documents/new/NewDocument')}
              loadingText="Yeni doküman yükleniyor..."
            />
          } />
          <Route path="documents/upload" element={
            <LazyLoader 
              component={() => import('./pages/documents/upload/UploadDocument')}
              loadingText="Doküman yükleme yükleniyor..."
            />
          } />
          
          {/* Analytics sub-routes */}
          <Route path="analytics/reports/new" element={
            <LazyLoader 
              component={() => import('./pages/analytics/NewReport')}
              loadingText="Yeni rapor yükleniyor..."
            />
          } />
          
          {/* Instruction routes */}
          <Route path="instructions" element={
            <LazyLoader 
              component={() => import('./pages/instructions/InstructionList')}
              loadingText="Talimatlar yükleniyor..."
            />
          } />
          <Route path="instructions/new" element={
            <LazyLoader 
              component={() => import('./pages/instructions/NewInstruction')}
              loadingText="Yeni talimat yükleniyor..."
            />
          } />
          <Route path="instructions/dashboard" element={
            <LazyLoader 
              component={() => import('./pages/instructions/InstructionDashboard')}
              loadingText="Talimat dashboard yükleniyor..."
            />
          } />
          <Route path="instructions/:id" element={
            <LazyLoader 
              component={() => import('./pages/instructions/InstructionDetail')}
              loadingText="Talimat detayı yükleniyor..."
            />
          } />
          <Route path="instructions/:id/edit" element={
            <LazyLoader 
              component={() => import('./pages/instructions/EditInstruction')}
              loadingText="Talimat düzenleme yükleniyor..."
            />
          } />
          
          {/* AI Dashboard */}
          <Route path="ai" element={<AIDashboard />} />
          
          {/* Personnel Management */}
          <Route path="personnel" element={
            <LazyLoader 
              component={() => import('./pages/PersonnelDashboard')}
              loadingText="Personel yönetimi yükleniyor..."
            />
          } />
          
          {/* Personnel Mobile Login */}
          <Route path="personnel/login" element={
            <LazyLoader 
              component={() => import('./pages/PersonnelMobileLoginPage')}
              loadingText="Personel girişi yükleniyor..."
            />
          } />
          
          {/* File Import Demo */}
          <Route path="file-import-demo" element={
            <LazyLoader 
              component={() => import('./pages/FileImportDemo')}
              loadingText="Dosya Import Demo yükleniyor..."
            />
          } />
          
          {/* File Management */}
          <Route path="file-management" element={
            <LazyLoader 
              component={() => import('./pages/FileManagement')}
              loadingText="Dosya Yönetimi yükleniyor..."
            />
          } />
          
          {/* Create Document */}
          <Route path="create-document" element={
            <LazyLoader 
              component={() => import('./pages/CreateDocument')}
              loadingText="Yeni Doküman oluşturuluyor..."
            />
          } />
          
          {/* User management sub-routes */}
          <Route path="users/management" element={
            <LazyLoader 
              component={() => import('./pages/users/UserManagement')}
              loadingText="Kullanıcı yönetimi yükleniyor..."
            />
          } />
          
          {/* Help and support routes */}
          <Route path="help" element={
            <LazyLoader 
              component={() => import('./pages/Help')}
              loadingText="Yardım yükleniyor..."
            />
          } />
          <Route path="about" element={
            <LazyLoader 
              component={() => import('./pages/About')}
              loadingText="Hakkında yükleniyor..."
            />
          } />
          <Route path="contact" element={
            <LazyLoader 
              component={() => import('./pages/Contact')}
              loadingText="İletişim yükleniyor..."
            />
          } />
          
          {/* Navigation Test */}
          <Route path="navigation-test" element={
            <LazyLoader 
              component={() => import('./pages/NavigationTest')}
              loadingText="Navigation test yükleniyor..."
            />
          } />
          
          {/* Route Debug */}
          <Route path="route-debug" element={
            <LazyLoader 
              component={() => import('./pages/RouteDebug')}
              loadingText="Route debug yükleniyor..."
            />
          } />
          
          {/* Simple Test */}
          <Route path="simple-test" element={
            <LazyLoader 
              component={() => import('./pages/SimpleTest')}
              loadingText="Simple test yükleniyor..."
            />
          } />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

        {/* UX Metrics Dashboard */}
        <UXMetricsDashboard isVisible={isUXDashboardVisible} />
        
        {/* Error Monitoring Dashboard */}
        <ErrorMonitoringDashboard />
      </div>
    </ErrorBoundary>
  )
}

export default App
