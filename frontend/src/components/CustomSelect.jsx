import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export default function CustomSelect({
  label = 'Select',
  icon: Icon,
  options = [], // Array of { value, label, dotColor, badge }
  value = '',
  onChange,
  placeholder = 'All',
  className = '',
  allValue = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on click outside or global close-filter-dropdowns event
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleCloseEvent = () => {
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('close-filter-dropdowns', handleCloseEvent);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('close-filter-dropdowns', handleCloseEvent);
    };
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(allValue);
  };

  const selectedOption = options.find((o) => o.value === value);
  const isSelected = Boolean(value && value !== allValue);

  return (
    <div
      className={`relative ${isOpen ? 'z-50' : ''} ${className}`}
      ref={containerRef}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && isOpen) {
          setIsOpen(false);
        } else if (e.key === 'Escape' && isOpen) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 transition border ${
          isSelected
            ? 'bg-slate-900 border-teal-500/40 text-white'
            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
        } ${isOpen ? 'ring-1 ring-teal-500/50 border-teal-500/50' : ''}`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0 text-left">
          {Icon && <Icon className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
          <span className="text-slate-400 shrink-0">{label}:</span>
          {!isSelected ? (
            <span className="text-slate-500 font-normal truncate">{placeholder}</span>
          ) : (
            <span className="text-teal-300 font-semibold truncate flex items-center gap-1.5">
              {selectedOption?.dotColor && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedOption.dotColor}`} />
              )}
              {selectedOption?.label || value}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isSelected && (
            <span
              onClick={handleClear}
              role="button"
              data-action="clear"
              tabIndex={0}
              className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-teal-400' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full min-w-full bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 animate-fadeIn">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between gap-2 text-left transition border ${
                  active
                    ? 'bg-teal-500/15 text-teal-300 font-semibold border-teal-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.dotColor && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor}`} />
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>
                {active && (
                  <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
