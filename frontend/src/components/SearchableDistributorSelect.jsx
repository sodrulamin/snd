import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Building2, User } from 'lucide-react';

export default function SearchableDistributorSelect({
  value,
  onChange,
  distributors = [],
  placeholder = '-- Choose Distributor --',
  required = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const selectedDistributor = distributors.find(
    (d) => String(d.id) === String(value)
  );

  // Filter distributors based on search query
  const filteredDistributors = distributors.filter((d) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = (d.fullName || '').toLowerCase().includes(query);
    const companyMatch = (d.companyName || '').toLowerCase().includes(query);
    const userMatch = (d.username || '').toLowerCase().includes(query);
    const phoneMatch = (d.phoneNumber || d.phone || '').toLowerCase().includes(query);
    const emailMatch = (d.email || '').toLowerCase().includes(query);
    return nameMatch || companyMatch || userMatch || phoneMatch || emailMatch;
  });

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  // Keep highlighted index in view when navigating with keyboard
  useEffect(() => {
    if (isOpen && listRef.current && listRef.current.children[highlightedIndex]) {
      listRef.current.children[highlightedIndex].scrollIntoView({
        block: 'nearest',
      });
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (distributor) => {
    onChange(String(distributor.id));
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredDistributors.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredDistributors[highlightedIndex]) {
        handleSelect(filteredDistributors[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden input for form required validation */}
      {required && (
        <input
          type="text"
          required
          value={value || ''}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Select Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-left flex items-center justify-between transition group ${
          isOpen
            ? 'border-teal-500 ring-1 ring-teal-500/30'
            : 'border-slate-800 hover:border-slate-700'
        } ${!selectedDistributor ? 'text-slate-500' : 'text-white'}`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <div className="w-5 h-5 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0 text-teal-400">
            {selectedDistributor?.companyName ? (
              <Building2 className="w-3 h-3" />
            ) : (
              <User className="w-3 h-3" />
            )}
          </div>
          {selectedDistributor ? (
            <div className="truncate flex items-center gap-2">
              <span className="font-semibold text-white truncate">
                {selectedDistributor.companyName || selectedDistributor.fullName}
              </span>
              {selectedDistributor.companyName && selectedDistributor.fullName && (
                <span className="text-[11px] text-slate-400 truncate">
                  ({selectedDistributor.fullName})
                </span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 font-mono font-medium flex-shrink-0">
                Disc: {selectedDistributor.discountRate || 0}%
              </span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-teal-400' : 'group-hover:text-slate-300'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input Header */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/80">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search distributor by name, company, phone..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-56 overflow-y-auto p-1.5 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          >
            {filteredDistributors.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                <p>No distributors found matching &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-1 text-[11px] text-teal-400 hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredDistributors.map((d, index) => {
                const isSelected = String(d.id) === String(value);
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelect(d)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-teal-500/20 text-white font-semibold'
                        : isHighlighted
                        ? 'bg-slate-800/80 text-white'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          isSelected
                            ? 'bg-teal-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {(d.companyName || d.fullName || 'D')
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-white truncate">
                            {d.companyName || d.fullName}
                          </span>
                          {d.companyName && d.fullName && (
                            <span className="text-[11px] text-slate-400 truncate">
                              • {d.fullName}
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500 flex items-center gap-2 truncate mt-0.5">
                          {d.username && <span>@{d.username}</span>}
                          {(d.phoneNumber || d.phone) && (
                            <span>{d.phoneNumber || d.phone}</span>
                          )}
                          <span>• Bal: ৳{Number(d.balance || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-teal-300 font-mono font-semibold">
                        Disc: {d.discountRate || 0}%
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
