import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ title, subtitle, onRefresh, children }) {
  const { user } = useAuth();

  return (
    <header className="h-16 px-8 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {children}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/50"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-teal-400">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>IPTSP Platform Live</span>
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-slate-400 text-xs">
          <span>Logged as <strong className="text-slate-200">{user?.username}</strong></span>
        </div>
      </div>
    </header>
  );
}
