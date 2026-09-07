import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'teal', trend }) {
  const colorMap = {
    teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/30 text-teal-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
  };

  const selectedColor = colorMap[color] || colorMap.teal;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${selectedColor} border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
          {trend && (
            <span className="inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              {trend}
            </span>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-sm">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}