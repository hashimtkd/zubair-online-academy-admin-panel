import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Trophy, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Database,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['super_admin', 'admin'] },
    { name: 'Students', path: '/students', icon: <Users className="w-5 h-5" />, roles: ['super_admin', 'admin'] },
    { name: 'Teachers', path: '/teachers', icon: <GraduationCap className="w-5 h-5" />, roles: ['super_admin', 'admin'] },
    { name: 'Courses', path: '/courses', icon: <BookOpen className="w-5 h-5" />, roles: ['super_admin', 'admin'] },
    { name: 'Achievements', path: '/achievements', icon: <Trophy className="w-5 h-5" />, roles: ['super_admin', 'admin'] },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon className="w-5 h-5" />, roles: ['super_admin'] },
    { name: 'Admin Users', path: '/admins', icon: <ShieldCheck className="w-5 h-5" />, roles: ['super_admin'] },
    { name: 'Backups', path: '/backups', icon: <Database className="w-5 h-5" />, roles: ['super_admin'] },
  ];

  // Filter items by user role
  const visibleItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-slate-950 border-r border-slate-900 text-slate-400 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-green-600/20">
              Z
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-slate-100 tracking-wider uppercase leading-none">Zubair Academy</span>
              <span className="text-[10px] text-green-500 font-semibold tracking-wider uppercase mt-1">Admin Panel</span>
            </div>
          </div>
          
          <button 
            className="p-1 rounded-lg hover:bg-slate-900 lg:hidden text-slate-500 hover:text-slate-300 cursor-pointer"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User profile card inside sidebar */}
        <div className="p-4 border-b border-slate-900/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40">
            <div className="w-10 h-10 rounded-xl bg-green-950/50 border border-green-800/30 flex items-center justify-center font-bold text-green-400 text-sm">
              {user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-200 truncate leading-snug">{user?.fullName}</span>
              <span className="text-[10px] text-slate-500 truncate leading-none mt-1">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1 scrollbar-thin">
          {visibleItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-205 cursor-pointer ${
                  isActive
                    ? 'bg-green-600 text-white shadow-md shadow-green-600/10'
                    : 'hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer (Log out) */}
        <div className="p-4 border-t border-slate-900 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
