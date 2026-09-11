import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'teal', trend, trendPositive }) {
  const colorMap = {
    teal:    { card: 'from-teal-500/15 via-teal-500/5 to-transparent border-teal-500/25',    icon: 'bg-teal-500/15 border-teal-500/30 text-teal-400',    text: 'text-teal-400' },
    sky:     { card: 'from-sky-500/15 via-sky-500/5 to-transparent border-sky-500/25',       icon: 'bg-sky-500/15 border-sky-500/30 text-sky-400',       text: 'text-sky-400' },
    violet:  { card: 'from-violet-500/15 via-violet-500/5 to-transparent border-violet-500/25', icon: 'bg-violet-500/15 border-violet-500/30 text-violet-400', text: 'text-violet-400' },
    amber:   { card: 'from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/25', icon: 'bg-amber-500/15 border-amber-500/30 text-amber-400',  text: 'text-amber-400' },
    rose:    { card: 'from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/25',    icon: 'bg-rose-500/15 border-rose-500/30 text-rose-400',    text: 'text-rose-400' },
    emerald: { card: 'from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/25', icon: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', text: 'text-emerald-400' },
    blue:    { card: 'from-blue-500/15 via-blue-500/5 to-transparent border-blue-500/25',    icon: 'bg-blue-500/15 border-blue-500/30 text-blue-400',    text: 'text-blue-400' },
    indigo:  { card: 'from-indigo-500/15 via-indigo-500/5 to-transparent border-indigo-500/25', icon: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400', text: 'text-indigo-400' },
  };

  const c = colorMap[color] || colorMap.teal;
  const isPositive = trendPositive !== undefined ? trendPositive : (!trend?.startsWith('-'));

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.card} border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
          {trend && (
            <span className={`inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              isPositive
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/20'
            }`}>
              {trend}
            </span>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border backdrop-blur-sm ${c.icon}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}