import React from 'react';
import { useAuth } from '../stores/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { refreshToken, isLoading, setLoading } = useAuth();

  React.useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Try to refresh token on app start
        await refreshToken();
      } catch (error) {
        // Silent fail - user will need to login again
        console.log('Token refresh failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshToken, setLoading]);

  return <>{children}</>;
};
