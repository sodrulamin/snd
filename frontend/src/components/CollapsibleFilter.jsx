import React, { useEffect, useRef } from 'react';
import { Filter, ChevronDown, ChevronUp, RotateCcw, Search } from 'lucide-react';

export default function CollapsibleFilter({
  isOpen,
  onToggle,
  onApply,
  onReset,
  activeFilterCount = 0,
  isSubmitting = false,
  title = "Search & Filter",
  applyText = "Apply Filters",
  resetText = "Reset",
  children,
}) {
  const containerRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const target = e.target;

      // If user is focused on the Reset button, let it reset
      if (target && (target.getAttribute('data-action') === 'reset' || target.closest('[data-action="reset"]'))) {
        return;
      }

      // If user is focused on a clear button, let it clear
      if (target && (target.getAttribute('data-action') === 'clear' || target.closest('[data-action="clear"]'))) {
        return;
      }

      e.preventDefault();

      // Close any open popovers/dropdowns inside the filter
      document.dispatchEvent(new CustomEvent('close-filter-dropdowns'));

      if (onApply && !isSubmitting) {
        onApply(e);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentKeyDown = (e) => {
      if (e.key === 'Enter') {
        const active = document.activeElement;

        // If a modal or dialog is open, do not intercept
        if (document.querySelector('[role="dialog"], .modal-open, .fixed.inset-0')) {
          return;
        }

        // If focus is inside the filter container, form's onKeyDown handles it
        if (containerRef.current && containerRef.current.contains(active)) {
          return;
        }

        // If focus is on body / document root (e.g. after clicking dropdown options or background)
        if (active === document.body || !active || active === document.documentElement) {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent('close-filter-dropdowns'));
          if (onApply && !isSubmitting) {
            onApply(e);
          }
        }
      }
    };

    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => document.removeEventListener('keydown', handleDocumentKeyDown);
  }, [isOpen, onApply, isSubmitting]);

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900/60 border border-slate-800 rounded-2xl shadow-sm transition-all relative ${isOpen ? 'z-30' : 'z-10'}`}
    >
      {/* Collapsible Header Button */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 bg-slate-900/80 hover:bg-slate-800/50 transition-colors text-left select-none cursor-pointer ${
          isOpen ? 'rounded-t-2xl' : 'rounded-2xl'
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <Filter className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="text-sm font-semibold text-white">{title}</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              {activeFilterCount} {activeFilterCount === 1 ? 'filter active' : 'filters active'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium">
            {isOpen ? 'Hide Filters' : 'Show Filters'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Filter Panel */}
      {isOpen && (
        <div className="p-4 sm:p-5 pt-3.5 border-t border-slate-800/80 bg-slate-950/40 rounded-b-2xl animate-in fade-in zoom-in-95 duration-150">
          <form onSubmit={onApply} onKeyDown={handleKeyDown} className="space-y-4">
            {children}

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-2.5 pt-2 border-t border-slate-800/60">
              <button
                type="button"
                data-action="reset"
                onClick={onReset}
                className="h-9 px-4 rounded-xl flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{resetText}</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-5 rounded-xl flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 hover:from-teal-300 hover:to-emerald-300 transition shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{applyText}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
