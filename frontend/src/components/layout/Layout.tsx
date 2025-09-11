import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import SimpleMenu from '../SimpleMenu';
import { Breadcrumb, CompactBreadcrumb } from '../ui/Breadcrumb';
import DebugNavigation from '../DebugNavigation';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showBreadcrumb?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showSidebar = true,
  showBreadcrumb = true 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        {/* Mobile sidebar overlay */}
        {showSidebar && (
          <>
            {/* Mobile sidebar */}
            <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
              <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800">
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </div>
            </div>
            
            {/* Desktop sidebar */}
            <div className="hidden lg:flex lg:w-64 lg:flex-col">
              <Sidebar />
            </div>
          </>
        )}
        
        {/* Main content */}
        <main className={`flex-1 transition-all duration-200 ${showSidebar ? 'lg:ml-64' : ''} flex flex-col`}>
          {/* Simple Menu */}
          <SimpleMenu />
          
          <div className="p-4 lg:p-6">
            <div className="mx-auto max-w-7xl">
              {/* Breadcrumb */}
              {showBreadcrumb && (
                <div className="mb-6">
                  {/* Desktop breadcrumb */}
                  <div className="hidden sm:block">
                    <Breadcrumb />
                  </div>
                  {/* Mobile breadcrumb */}
                  <div className="sm:hidden">
                    <CompactBreadcrumb />
                  </div>
                </div>
              )}
              
              {children}
            </div>
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2025 Claude Talimat. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Debug Navigation - Only show in development */}
      {process.env.NODE_ENV === 'development' && <DebugNavigation />}
    </div>
  );
};

export default Layout;
