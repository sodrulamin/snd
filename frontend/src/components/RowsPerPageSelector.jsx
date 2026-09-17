import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function RowsPerPageSelector({
  value = 10,
  onChange,
  options = [10, 20, 50, 100],
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
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition border cursor-pointer select-none ${
          isOpen
            ? 'bg-slate-900 border-teal-500/50 ring-1 ring-teal-500/30 text-white'
            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
        }`}
        title="Rows per page"
      >
        <span className="font-mono">{value}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-teal-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-1.5 left-0 min-w-[76px] bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-xl shadow-2xl z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = Number(opt) === Number(value);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(Number(opt));
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition font-mono ${
                  isSelected
                    ? 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span>{opt}</span>
                {isSelected && <Check className="w-3 h-3 text-teal-400 ml-1.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
