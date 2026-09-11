import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

export default function MultiSelectDropdown({
  label = 'Select',
  icon: Icon,
  options = [], // Array of { value, label, sublabel, badge }
  selectedValues = [],
  onChange,
  placeholder = 'All',
  searchPlaceholder = 'Search...',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (val) => {
    const exists = selectedValues.includes(val);
    if (exists) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const filteredOptions = options.filter((opt) => {
    if (!search) return true;
    const query = search.toLowerCase();
    const labelMatch = opt.label?.toLowerCase().includes(query);
    const subMatch = opt.sublabel?.toLowerCase().includes(query);
    const badgeMatch = opt.badge?.toLowerCase().includes(query);
    return labelMatch || subMatch || badgeMatch;
  });

  const selectedCount = selectedValues.length;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 transition border ${
          selectedCount > 0
            ? 'bg-slate-900 border-teal-500/40 text-white'
            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
        } ${isOpen ? 'ring-1 ring-teal-500/50 border-teal-500/50' : ''}`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0 text-left">
          {Icon && <Icon className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
          <span className="text-slate-400 shrink-0">{label}:</span>
          {selectedCount === 0 ? (
            <span className="text-slate-500 font-normal">{placeholder}</span>
          ) : selectedCount === 1 ? (
            <span className="text-teal-300 font-semibold truncate">
              {options.find((o) => o.value === selectedValues[0])?.label || selectedValues[0]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[11px] font-bold">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedCount > 0 && (
            <span
              onClick={handleClear}
              role="button"
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
        <div className="absolute left-0 mt-1.5 w-full min-w-full bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl z-50 p-2.5 space-y-2 animate-fadeIn">
          {/* Header Actions */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 px-1 text-[11px]">
            <span className="font-bold text-slate-400 uppercase tracking-wider">
              {label} ({selectedCount}/{options.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-teal-400 hover:underline font-semibold"
              >
                {selectedCount === options.length ? 'Unselect All' : 'Select All'}
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-slate-400 hover:text-white hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Search */}
          {options.length > 5 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
            {filteredOptions.map((opt) => {
              const isSelected = selectedValues.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => handleToggleOption(opt.value)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition select-none ${
                    isSelected
                      ? 'bg-teal-500/10 text-white font-medium'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'bg-teal-500 border-teal-500 text-slate-950'
                          : 'border-slate-700 bg-slate-950'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {opt.badge && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 font-mono border border-slate-700/60 ml-2">
                      {opt.badge}
                    </span>
                  )}
                </div>
              );
            })}

            {filteredOptions.length === 0 && (
              <p className="text-center text-xs text-slate-500 py-3">No matches found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
