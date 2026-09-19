import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const parseDate = (str) => {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
};

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplay = (str) => {
  const d = parseDate(str);
  if (!d) return '';
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export default function CustomDatePicker({
  value = '',
  onChange,
  placeholder = 'Select date...',
  className = '',
  minDate,
  maxDate,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const initialDate = parseDate(value) || new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Keep view in sync when value changes externally
  useEffect(() => {
    if (value) {
      const parsed = parseDate(value);
      if (parsed) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    }
  }, [value]);

  // Close on outside click, close-filter-dropdowns event, or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleCloseEvent = () => setIsOpen(false);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('close-filter-dropdowns', handleCloseEvent);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('close-filter-dropdowns', handleCloseEvent);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDate = (dateStr) => {
    if (disabled) return;
    onChange?.(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    onChange?.('');
  };

  const handleSetToday = (e) => {
    e.stopPropagation();
    if (disabled) return;
    const todayStr = formatDate(new Date());
    onChange?.(todayStr);
    setIsOpen(false);
  };

  // Calendar day calculation
  const todayStr = formatDate(new Date());
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];

  // Previous month padding days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const date = new Date(viewYear, viewMonth - 1, d);
    calendarDays.push({
      dateStr: formatDate(date),
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonth, d);
    calendarDays.push({
      dateStr: formatDate(date),
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  // Next month padding days to complete grid
  const totalCells = calendarDays.length <= 35 ? 35 : 42;
  const remaining = totalCells - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(viewYear, viewMonth + 1, d);
    calendarDays.push({
      dateStr: formatDate(date),
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  // Year choices from current - 5 to current + 5
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    years.push(y);
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${isOpen ? 'z-50' : ''} ${className}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && isOpen) {
          setIsOpen(false);
        }
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full h-9 px-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 transition border ${
          value
            ? 'bg-slate-900 border-teal-500/40 text-white'
            : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:border-slate-600'
        } ${isOpen ? 'ring-1 ring-teal-500/50 border-teal-500/50' : ''} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0 text-left">
          <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          {value ? (
            <span className="text-white font-medium truncate">
              {formatDisplay(value)}
            </span>
          ) : (
            <span className="text-slate-500 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              onClick={handleClear}
              role="button"
              data-action="clear"
              tabIndex={0}
              className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Clear date"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </div>
      </button>

      {/* Floating Dark Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl z-50 p-3.5 space-y-3 select-none animate-fadeIn">
          {/* Header Controls: Navigation + Month/Year Selectors */}
          <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-800/80">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Select */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-semibold focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Select */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-semibold focus:outline-none focus:border-teal-500 cursor-pointer font-mono"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAYS_OF_WEEK.map((day) => (
              <span
                key={day}
                className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-0.5"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              const isSelected = value === item.dateStr;
              const isToday = todayStr === item.dateStr;
              const isMinDisabled = minDate && item.dateStr < minDate;
              const isMaxDisabled = maxDate && item.dateStr > maxDate;
              const isDayDisabled = isMinDisabled || isMaxDisabled;

              return (
                <button
                  key={`${item.dateStr}-${idx}`}
                  type="button"
                  disabled={isDayDisabled}
                  onClick={() => handleSelectDate(item.dateStr)}
                  className={`w-full aspect-square flex items-center justify-center text-xs rounded-lg transition font-medium ${
                    isSelected
                      ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                      : isToday
                      ? 'border border-teal-500/60 text-teal-300 font-semibold bg-teal-500/10 hover:bg-teal-500/20'
                      : item.isCurrentMonth
                      ? 'text-slate-200 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-800/40 hover:text-slate-400'
                  } ${isDayDisabled ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {item.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Footer Shortcuts */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 px-1 text-xs">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-teal-400 hover:text-teal-300 font-semibold hover:underline cursor-pointer"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-white font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
