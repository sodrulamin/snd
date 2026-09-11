import React, { useState, useRef, useEffect } from 'react';
import { Columns3, ChevronDown } from 'lucide-react';

export default function ColumnSelector({
  columns = [],
  visibleColumns = {},
  onToggleColumn,
  onResetColumns,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
          isOpen
            ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
            : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700/80'
        }`}
        title="Customize table columns"
      >
        <Columns3 className="w-3.5 h-3.5 text-teal-400" />
        <span>Columns</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl z-30 p-2.5 space-y-1 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-800/80 px-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Visible Columns</span>
            {onResetColumns && (
              <button
                type="button"
                onClick={onResetColumns}
                className="text-[10px] text-teal-400 hover:underline font-semibold"
              >
                Reset All
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {columns.map((col) => {
              const isChecked = !!visibleColumns[col.key];
              return (
                <label
                  key={col.key}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer text-xs transition text-slate-300 select-none"
                >
                  <span className={isChecked ? 'text-white font-medium' : 'text-slate-500'}>
                    {col.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleColumn(col.key)}
                    className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
