import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic header mapping
  const getHeaderTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Dashboard';
      case '/students':
        return 'Students Directory';
      case '/teachers':
        return 'Teachers Directory';
      case '/courses':
        return 'Courses Catalog';
      case '/achievements':
        return 'Achievements & Hall of Fame';
      case '/settings':
        return 'Academy Settings';
      case '/admins':
        return 'Admin Management';
      case '/backups':
        return 'Backups & Storage';
      default:
        return 'Zubair Online Academy';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar Page Header */}
        <Topbar 
          onMenuToggle={() => setSidebarOpen(true)} 
          title={getHeaderTitle(location.pathname)} 
        />
        
        {/* Subpage Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
export default Layout;
