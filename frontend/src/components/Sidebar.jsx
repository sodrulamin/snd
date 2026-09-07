import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  LogOut, 
  CreditCard, 
  Tag 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageLoading } from '../context/PageLoadingContext';

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const { isPageLoading } = usePageLoading();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Manage Inventory', path: '/inventory', icon: Layers },
    { name: 'Sales & Orders', path: '/sales', icon: ShoppingCart },
    { name: 'Distributors', path: '/distributors', icon: Users },
    { name: 'Reports & Revenue', path: '/reports', icon: BarChart3 },
    { name: 'Manage Card', path: '/cards', icon: Tag },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <CreditCard className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            IPTSP S&D
          </h1>
          <p className="text-xs text-teal-400 font-medium">Recharge Distribution</p>
        </div>
      </div>

      {/* User Profile Box */}
      <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold text-sm">
          {user?.fullName ? user.fullName.charAt(0) : 'U'}
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white truncate">{user?.fullName || user?.username}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
              isAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {user?.role || 'USER'}
            </span>
            {user?.balance !== undefined && !isAdmin && (
              <span className="text-[11px] text-teal-400 font-medium truncate">
                ৳{Number(user.balance).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Unified Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm border outline-none focus:outline-none focus:ring-0 select-none transition-colors duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-300 border-teal-500/30 shadow-sm shadow-teal-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <div className="flex items-center">
                      {isPageLoading ? (
                        <div className="flex items-center gap-1 px-1 py-0.5" title="Loading...">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 dot-pulse-1 shadow-sm shadow-teal-400/50"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 dot-pulse-2 shadow-sm shadow-teal-400/50"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 dot-pulse-3 shadow-sm shadow-teal-400/50"></span>
                        </div>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400/80 shadow-sm shadow-teal-400/50"></div>
                      )}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sign Out Footer */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 outline-none focus:outline-none focus:ring-0 transition-colors duration-150 active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
