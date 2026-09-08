import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, 
  Check, 
  Sparkles, 
  X, 
  Sun, 
  Moon, 
  Shuffle, 
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSelector() {
  const { theme, setTheme, themes, activeTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'dark', 'light'
  const containerRef = useRef(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredThemes = themes.filter((t) => {
    if (filter === 'dark') return t.category === 'Dark';
    if (filter === 'light') return t.category === 'Light';
    return true;
  });

  const handleRandomTheme = () => {
    const otherThemes = themes.filter(t => t.id !== theme);
    if (otherThemes.length > 0) {
      const random = otherThemes[Math.floor(Math.random() * otherThemes.length)];
      setTheme(random.id);
    }
  };

  const handleResetDefault = () => {
    setTheme('dark-teal');
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Beautiful Capsule Header Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative shrink-0 flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border transition-all duration-200 select-none whitespace-nowrap active:scale-95 ${
          isOpen
            ? 'bg-slate-800 text-white shadow-lg'
            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white shadow-sm hover:shadow-md'
        }`}
        style={{
          borderColor: `${activeTheme.accentColor}60`,
          boxShadow: `0 2px 12px -2px ${activeTheme.accentColor}35`,
        }}
        title="Theme Studio - Click to change theme"
        aria-expanded={isOpen}
      >
        {/* Jewel Orb with Accent Gradient */}
        <div className="relative flex items-center justify-center shrink-0">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center shadow-inner transition-transform duration-200"
            style={{
              background: `radial-gradient(circle at 35% 35%, #ffffff95, ${activeTheme.accentColor} 65%, #00000075 100%)`,
              boxShadow: `0 0 6px ${activeTheme.accentColor}90`,
            }}
          >
            <Palette className="w-2.5 h-2.5 text-slate-950 stroke-[2.5]" />
          </span>
        </div>

        {/* Theme Name */}
        <span className="text-xs font-bold tracking-tight text-white">
          {activeTheme.name}
        </span>

        {/* Color Dot & Dropdown Chevron */}
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: activeTheme.accentColor }}
        ></span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Popup View Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-[380px] sm:w-[460px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden z-50 animate-fadeIn origin-top-right">
          {/* Top Accent Gradient Bar */}
          <div
            className="h-1 w-full transition-all duration-300"
            style={{
              background: `linear-gradient(90deg, ${activeTheme.swatches[1] || activeTheme.accentColor}, ${activeTheme.swatches[2] || activeTheme.accentColor})`
            }}
          ></div>

          {/* Popup Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div
                className="p-2 rounded-xl border shadow-inner flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${activeTheme.accentColor}18`,
                  borderColor: `${activeTheme.accentColor}40`,
                  color: activeTheme.accentColor
                }}
              >
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  Theme Studio
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {themes.length} Presets
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select your workspace appearance
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Chips */}
          <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  filter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({themes.length})
              </button>
              <button
                onClick={() => setFilter('dark')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  filter === 'dark'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3 h-3 text-indigo-400" />
                Dark ({themes.filter(t => t.category === 'Dark').length})
              </button>
              <button
                onClick={() => setFilter('light')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  filter === 'light'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-400" />
                Light ({themes.filter(t => t.category === 'Light').length})
              </button>
            </div>

            {/* Surprise / Shuffle */}
            <button
              onClick={handleRandomTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition text-[11px] font-semibold flex items-center gap-1"
              title="Randomize theme"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Random</span>
            </button>
          </div>

          {/* 2-Column Theme Selection Buttons */}
          <div className="p-3 overflow-y-auto max-h-[340px] grid grid-cols-2 gap-2.5">
            {filteredThemes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`group relative rounded-xl p-2.5 text-left border transition-all duration-150 flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-slate-800/90 shadow-md ring-1'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                  style={{
                    borderColor: isSelected ? t.accentColor : undefined,
                    boxShadow: isSelected ? `0 0 12px -2px ${t.accentColor}40` : undefined,
                  }}
                >
                  {/* Top Preview Bar & Active Dot */}
                  <div className="flex items-center justify-between w-full mb-2">
                    {/* Swatches mini preview bar */}
                    <div className="flex items-center gap-1 p-0.5 rounded-md bg-slate-900 border border-slate-800">
                      {t.swatches.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-2.5 h-2.5 rounded-sm border border-black/30 shrink-0"
                          style={{ backgroundColor: color }}
                          title={color}
                        ></span>
                      ))}
                    </div>

                    {/* Active Pill Badge */}
                    {isSelected ? (
                      <span
                        className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-slate-950 shadow-sm shrink-0"
                        style={{ backgroundColor: t.accentColor }}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                        {t.tag || t.category}
                      </span>
                    )}
                  </div>

                  {/* Theme Name */}
                  <div className="w-full">
                    <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors truncate">
                      {t.name}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {t.description}
                    </div>
                  </div>

                  {/* Bottom Accent Line */}
                  <div
                    className="w-full h-1 rounded-full mt-2 opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(90deg, ${t.swatches[1] || t.accentColor}, ${t.swatches[2] || t.accentColor})`
                    }}
                  ></div>
                </button>
              );
            })}
          </div>

          {/* Popup Footer */}
          <div className="p-2.5 px-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={handleResetDefault}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Default</span>
            </button>

            <span className="text-[10px] text-slate-500">
              Auto-saved to browser
            </span>
          </div>
        </div>
      )}
    </div>
  );
}