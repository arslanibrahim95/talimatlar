import React from 'react';

interface DevProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

/**
 * Development version of ProtectedRoute that bypasses authentication
 * This is used for testing purposes when authentication is not needed
 */
const DevProtectedRoute: React.FC<DevProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  // In development mode, always render children
  if (process.env.NODE_ENV === 'development') {
    console.log('🔓 DevProtectedRoute: Bypassing authentication for development');
    return <>{children}</>;
  }

  // In production, use normal ProtectedRoute
  const ProtectedRoute = React.lazy(() => import('./auth/ProtectedRoute'));
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ProtectedRoute requiredRole={requiredRole}>
        {children}
      </ProtectedRoute>
    </React.Suspense>
  );
};

export default DevProtectedRoute;

