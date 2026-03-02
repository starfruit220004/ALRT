import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ScrollText, BellRing,
  LogOut, User, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

const userNavItems = [
  { to: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/logs',          label: 'Activity Log',  icon: ScrollText },
  { to: '/notifications', label: 'Notifications', icon: BellRing },
];

export default function Sidebar({ onProfileClick }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <>
      <aside
        style={{ width: collapsed ? '72px' : '240px' }}
        className="fixed top-0 left-0 h-screen flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out shadow-2xl z-40 overflow-hidden group/sidebar"
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
          className="absolute top-4 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-700 transition-all duration-200 opacity-0 group-hover/sidebar:opacity-100"
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>

        {/* Profile button — opens modal */}
        <button
          onClick={onProfileClick}
          className={`flex flex-col items-center gap-2 pt-8 pb-6 border-b border-slate-700/60 w-full hover:bg-slate-800/60 transition-colors flex-shrink-0 ${collapsed ? 'px-2' : 'px-5'}`}
        >
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden ring-2 ring-blue-500/50 ring-offset-2 ring-offset-slate-900 shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : <User size={24} className="text-white" />
            }
          </div>
          {!collapsed && (
            <div className="text-center overflow-hidden">
              <p className="font-semibold text-sm text-white truncate max-w-40">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate max-w-40">{user?.email || ''}</p>
            </div>
          )}
        </button>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-0.5 px-2 pt-3 overflow-hidden">
          {userNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-blue-600/90 text-white'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'}
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-5 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={17} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Spacer */}
      <div
        style={{ width: collapsed ? '72px' : '240px', minWidth: collapsed ? '72px' : '240px' }}
        className="flex-shrink-0 transition-all duration-300"
      />
    </>
  );
}