import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Package, CreditCard, Sparkles } from 'lucide-react';

export default function SearchableProductSelect({
  value,
  onChange,
  products = [],
  placeholder = '-- Choose Card Product --',
  required = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const selectedProduct = products.find(
    (p) => String(p.id) === String(value)
  );

  // Filter products based on search query
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = (p.name || '').toLowerCase().includes(query);
    const codeMatch = (p.code || '').toLowerCase().includes(query);
    const descMatch = (p.description || '').toLowerCase().includes(query);
    const priceMatch = String(p.retailPrice || p.faceValue || '').includes(query);
    return nameMatch || codeMatch || descMatch || priceMatch;
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

  // Autofocus search input when dropdown opens
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

  const handleSelect = (product) => {
    onChange(String(product.id));
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
        prev < filteredProducts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts[highlightedIndex]) {
        handleSelect(filteredProducts[highlightedIndex]);
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
        className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-left flex items-center justify-between transition group ${
          isOpen
            ? 'border-teal-500 ring-1 ring-teal-500/30'
            : 'border-slate-700 hover:border-slate-600'
        } ${!selectedProduct ? 'text-slate-500' : 'text-white'}`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <div className="w-5 h-5 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0 text-teal-400">
            <Package className="w-3 h-3" />
          </div>
          {selectedProduct ? (
            <div className="truncate flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-teal-400 px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                {selectedProduct.code || 'CARD'}
              </span>
              <span className="font-semibold text-white truncate">
                {selectedProduct.name}
              </span>
              <span className="font-mono text-white text-[11px]">
                (৳{Number(selectedProduct.wholesalePrice != null ? selectedProduct.wholesalePrice : (selectedProduct.retailPrice || selectedProduct.faceValue || 0)).toFixed(0)})
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono flex-shrink-0">
                Stock: {selectedProduct.availableStock || 0}
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
                placeholder="Search card product by name, code, price..."
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
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                <p>No products found matching &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-1 text-[11px] text-teal-400 hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredProducts.map((p, index) => {
                const isSelected = String(p.id) === String(value);
                const isHighlighted = index === highlightedIndex;
                const wholesalePrice = Number(p.wholesalePrice != null ? p.wholesalePrice : (p.retailPrice || p.faceValue || 0));
                const retailPrice = Number(p.retailPrice || p.faceValue || 0);
                const stock = p.availableStock || 0;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
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
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold ${
                          isSelected
                            ? 'bg-teal-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-teal-400 border border-slate-700'
                        }`}
                      >
                        {(p.code || 'P').substring(0, 3).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-white truncate">
                            {p.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 truncate">
                            [{p.code || 'IPTSP'}]
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center gap-2 truncate mt-0.5 font-mono">
                          <span className="text-teal-300 font-semibold">WS: ৳{wholesalePrice.toFixed(2)}</span>
                          {retailPrice !== wholesalePrice && (
                            <span className="text-slate-500 line-through">Retail: ৳{retailPrice.toFixed(0)}</span>
                          )}
                          <span>•</span>
                          <span className={stock > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                            {stock > 0 ? `In-Stock: ${stock.toLocaleString()}` : 'Out of stock'}
                          </span>
                          {p.validityDays && (
                            <>
                              <span>•</span>
                              <span>{p.validityDays}d</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-bold font-mono text-white">
                        ৳{wholesalePrice.toFixed(0)}
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
