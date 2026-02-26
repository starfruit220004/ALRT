import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ScrollText, BellRing,
  ShieldAlert, ShieldCheck, ChevronLeft,
  ChevronRight, LogOut, User,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/logs',          label: 'Activity Log',   icon: ScrollText },
  { to: '/notifications', label: 'Notifications',  icon: BellRing },
  { to: '/alarm',         label: 'Alarm Settings', icon: ShieldAlert },
];

const adminItem = { to: '/admin', label: 'Admin', icon: ShieldCheck };

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const allItems = isAdmin ? [...navItems, adminItem] : navItems;

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <aside
      style={{ width: collapsed ? '72px' : '240px' }}
      className="relative flex flex-col min-h-screen bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out shadow-2xl"
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center shadow-md transition-colors"
      >
        {collapsed
          ? <ChevronRight size={14} className="text-white" />
          : <ChevronLeft  size={14} className="text-white" />}
      </button>

      {/* Profile section — clicking navigates to /profile */}
      <button
        onClick={() => navigate('/profile')}
        className={`flex flex-col items-center gap-2 pt-8 pb-6 border-b border-slate-700 w-full hover:bg-slate-800 transition-colors ${collapsed ? 'px-2' : 'px-5'}`}
      >
        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 shrink-0">
          {user?.avatar
            ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            : <User size={28} className="text-white" />
          }
        </div>
        {!collapsed && (
          <div className="text-center overflow-hidden">
            <p className="font-semibold text-sm text-white truncate max-w-40">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400 truncate max-w-40">{user?.email || ''}</p>
            {isAdmin && (
              <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wide">
                Admin
              </span>
            )}
          </div>
        )}
      </button>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-1 px-2 pt-4">
        {allItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
              ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              ${collapsed ? 'justify-center px-2' : ''}
            `}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-6">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-all duration-150 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}