import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, CreditCard } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Top Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 select-none">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition active:scale-95"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-500/20">
                <CreditCard className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="font-bold text-base bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                IPTSP S&D
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
              isAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {user?.role || 'USER'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold text-xs">
              {user?.fullName ? user.fullName.charAt(0) : 'U'}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-8 w-full space-y-4 sm:space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}