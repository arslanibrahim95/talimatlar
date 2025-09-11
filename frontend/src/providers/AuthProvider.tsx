import React, { useEffect } from 'react';
import { useAuth } from '../stores/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { getCurrentUser } = useAuth();

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  return <>{children}</>;
};
