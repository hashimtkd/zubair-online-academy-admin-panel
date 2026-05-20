import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { DriveStatus } from '../shared/DriveStatus';
import { Badge } from '../ui/Badge';

interface TopbarProps {
  onMenuToggle: () => void;
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-850/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shrink-0">
      {/* Page Title & Burger Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-none">
          {title}
        </h1>
      </div>

      {/* Control Widgets (Google Drive Status, Theme Toggle, Profile Info) */}
      <div className="flex items-center gap-4">
        {/* Google Drive Connector */}
        <DriveStatus />
        
        {/* Dark/Light mode selector */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>
        
        {/* Admin profile detail badge */}
        <div className="flex items-center gap-2">
          {user?.role === 'super_admin' ? (
            <Badge variant="purple">Super Admin</Badge>
          ) : (
            <Badge variant="info">Admin</Badge>
          )}
        </div>
      </div>
    </header>
  );
};
export default Topbar;
