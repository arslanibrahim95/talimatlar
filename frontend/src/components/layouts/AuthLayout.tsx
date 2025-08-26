import React from 'react';
import Layout from '../layout/Layout';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return <Layout showSidebar={false}>{children}</Layout>;
};

export default AuthLayout;
