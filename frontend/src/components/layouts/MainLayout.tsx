import React from 'react';
import Layout from '../layout/Layout';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return <Layout showSidebar={true}>{children}</Layout>;
};

export default MainLayout;
