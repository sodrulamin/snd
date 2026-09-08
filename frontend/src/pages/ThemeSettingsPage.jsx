import React, { useState } from 'react';
import { 
  Palette, 
  Check, 
  Moon, 
  Sun, 
  Shuffle, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  Wand2, 
  ChevronDown, 
  ChevronUp, 
  Paintbrush, 
  Type,
  Star,
  Bookmark,
  BookmarkCheck,
  Save,
  Trash2,
  Copy,
  Edit2,
  FolderHeart,
  Plus,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSettingsPage() {
  const { 
    theme, 
    setTheme, 
    themes, 
    activeTheme, 
    customTheme, 
    updateCustomTheme, 
    resetCustomTheme,
    starterPalettes,
    savedThemes,
    saveThemeReference,
    deleteSavedTheme,
    renameSavedTheme,
    applySavedTheme,
    bookmarkedIds,
    toggleBookmarkTheme
  } = useTheme();

  const [filter, setFilter] = useState('all'); // 'all', 'saved', 'dark', 'light'
  const [isCustomEditorOpen, setIsCustomEditorOpen] = useState(theme === 'custom');
  
  // Modal State for Saving Reference
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [referenceNameInput, setReferenceNameInput] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Editing Name State
  const [editingRefId, setEditingRefId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRandomTheme = () => {
    const otherThemes = themes.filter(t => t.id !== theme);
    if (otherThemes.length > 0) {
      const random = otherThemes[Math.floor(Math.random() * otherThemes.length)];
      setTheme(random.id);
    }
  };

  const handleResetDefault = () => {
    setTheme('nexa');
  };

  const applyStarterPalette = (palette) => {
    updateCustomTheme({
      mode: palette.mode,
      bgApp: palette.bgApp,
      bgSidebar: palette.bgSidebar,
      bgCard: palette.bgCard,
      accentPrimary: palette.accentPrimary,
      accentSecondary: palette.accentSecondary,
      textMain: palette.textMain,
      textMuted: palette.textMuted,
    });
    setTheme('custom');
  };

  const handleOpenSaveModal = () => {
    const defaultName = theme === 'custom' 
      ? `Custom Reference ${savedThemes.length + 1}`
      : `${activeTheme.name} Reference`;
    setReferenceNameInput(defaultName);
    setIsSaveModalOpen(true);
  };

  const handleSaveReferenceConfirm = () => {
    if (!referenceNameInput.trim()) return;

    if (theme === 'custom') {
      saveThemeReference(referenceNameInput.trim());
    } else {
      // Save snapshot of current active preset theme
      saveThemeReference(referenceNameInput.trim(), {
        mode: activeTheme.category === 'Light' ? 'light' : 'dark',
        bgApp: activeTheme.bodyBg,
        bgSidebar: activeTheme.sidebarBg,
        bgCard: activeTheme.cardBg,
        accentPrimary: activeTheme.accentColor,
        accentSecondary: activeTheme.swatches[2] || activeTheme.accentColor,
        textMain: activeTheme.category === 'Light' ? '#0f172a' : '#f1f5f9',
        textMuted: activeTheme.category === 'Light' ? '#334155' : '#94a3b8',
      });
    }

    setIsSaveModalOpen(false);
    showToast(`Saved "${referenceNameInput.trim()}" to your references vault!`);
  };

  const handleCopyPalette = (themeObj) => {
    const paletteData = {
      name: themeObj.name || 'Theme Reference',
      bgApp: themeObj.bgApp || themeObj.bodyBg,
      bgSidebar: themeObj.bgSidebar || themeObj.sidebarBg,
      bgCard: themeObj.bgCard || themeObj.cardBg,
      accentPrimary: themeObj.accentPrimary || themeObj.accentColor,
      accentSecondary: themeObj.accentSecondary || themeObj.swatches?.[2] || themeObj.accentColor,
    };
    navigator.clipboard.writeText(JSON.stringify(paletteData, null, 2));
    showToast('Palette hex values copied to clipboard!');
  };

  const handleStartRename = (ref) => {
    setEditingRefId(ref.id);
    setEditNameValue(ref.name);
  };

  const handleSaveRename = (refId) => {
    if (editNameValue.trim()) {
      renameSavedTheme(refId, editNameValue.trim());
      showToast('Reference renamed successfully!');
    }
    setEditingRefId(null);
  };

  // Filter themes logic
  const filteredThemes = themes.filter((t) => {
    if (filter === 'dark') return t.category === 'Dark';
    if (filter === 'light') return t.category === 'Light';
    return true;
  });

  const bookmarkedPresets = themes.filter(t => bookmarkedIds.includes(t.id));

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 p-6 sm:p-8 select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-teal-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce">
          <Check className="w-4 h-4 text-teal-400 stroke-[3]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Save Reference Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Save Theme as Reference</h3>
                  <p className="text-xs text-slate-400">Save this color palette into your personal library</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Capsule */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center -space-x-1.5">
                  {(theme === 'custom' 
                    ? [customTheme.bgApp, customTheme.bgCard, customTheme.accentPrimary, customTheme.accentSecondary]
                    : activeTheme.swatches
                  ).map((col, idx) => (
                    <span 
                      key={idx} 
                      className="w-5 h-5 rounded-full border border-slate-900 shadow-sm"
                      style={{ backgroundColor: col }}
                    ></span>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-200">
                  {theme === 'custom' ? 'Custom Live Palette' : activeTheme.name}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                {theme === 'custom' ? customTheme.mode : activeTheme.category}
              </span>
            </div>

            {/* Reference Name Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">Reference Name</label>
              <input
                type="text"
                value={referenceNameInput}
                onChange={(e) => setReferenceNameInput(e.target.value)}
                placeholder="e.g. My Favorite Dark Glow"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-teal-500 transition"
                autoFocus
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReferenceConfirm}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to My References</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full space-y-6 flex-1">

        {/* 1. Selected Theme Hero Bar */}
        <div
          className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border shadow-xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
          style={{
            backgroundColor: activeTheme.cardBg,
            borderColor: `${activeTheme.accentColor}35`,
            boxShadow: `0 8px 25px -10px ${activeTheme.accentColor}20`,
          }}
        >
          {/* Ambient Background Gradient Blur */}
          <div
            className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: activeTheme.accentColor }}
          ></div>

          <div className="flex items-center gap-4 relative z-10">
            {/* Jewel Orb Icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md shrink-0 border"
              style={{
                background: `linear-gradient(135deg, ${activeTheme.swatches[1] || activeTheme.accentColor}25, ${activeTheme.swatches[2] || activeTheme.accentColor}10)`,
                borderColor: `${activeTheme.accentColor}40`,
                color: activeTheme.accentColor,
              }}
            >
              <Palette className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                  Selected Theme
                </span>
                <span
                  className="px-2 py-0.2 rounded-full text-[10px] font-bold text-slate-950 flex items-center gap-1 shadow-sm"
                  style={{ backgroundColor: activeTheme.accentColor }}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  Active
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {activeTheme.name}
              </h2>
              <p className="text-xs text-slate-300 max-w-lg mt-0.5 leading-relaxed">
                {activeTheme.description}
              </p>
            </div>
          </div>

          {/* Color Swatches & Quick Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10 w-full md:w-auto">
            {/* Swatch Orbs */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              {activeTheme.swatches.map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span
                    className="w-5 h-5 rounded-md border border-black/40 shadow-sm"
                    style={{ backgroundColor: c }}
                    title={c}
                  ></span>
                  <span className="text-[8px] font-mono text-slate-400 uppercase">{c}</span>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Save as Reference Button */}
              <button
                onClick={handleOpenSaveModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold transition active:scale-95 shadow-sm"
                title="Save this theme as a reference in your library"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Save as Reference</span>
              </button>

              <button
                onClick={handleRandomTheme}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-semibold transition active:scale-95 shadow-sm"
                title="Shuffle a random theme"
              >
                <Shuffle className="w-3.5 h-3.5 text-teal-400" />
                <span>Shuffle</span>
              </button>

              <button
                onClick={handleResetDefault}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-semibold transition active:scale-95 shadow-sm"
                title="Reset to default Nexa theme"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Custom Theme Studio Accordion Section */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-lg transition-all">
          <div 
            onClick={() => setIsCustomEditorOpen(!isCustomEditorOpen)}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition border-b border-transparent"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-violet-500/20 to-cyan-500/20 text-violet-400 border border-violet-500/30">
                <Paintbrush className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">Custom Theme Studio</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-300 border border-violet-500/30">
                    Live Palette Builder
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pick your own background, surface, text, and accent colors with real-time application preview
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTheme('custom');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  theme === 'custom'
                    ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                {theme === 'custom' ? <Check className="w-3.5 h-3.5" /> : null}
                {theme === 'custom' ? 'Custom Active' : 'Activate Custom'}
              </button>

              <div className="p-1 rounded-lg text-slate-400 hover:text-white">
                {isCustomEditorOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </div>

          {/* Expanded Custom Color Controls */}
          {isCustomEditorOpen && (
            <div className="p-6 border-t border-slate-800/80 bg-slate-950/40 space-y-6 animate-fadeIn">
              {/* Starter Presets Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                    Quick Starter Palettes (1-Click Presets):
                  </span>
                  <button
                    onClick={resetCustomTheme}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Custom Colors
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {starterPalettes.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyStarterPalette(p)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700/60 hover:border-slate-500 transition flex items-center gap-2 shadow-sm"
                    >
                      <div className="flex items-center -space-x-1">
                        <span className="w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: p.bgApp }}></span>
                        <span className="w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: p.accentPrimary }}></span>
                        <span className="w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: p.accentSecondary }}></span>
                      </div>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Customization Grid (8 items in 4 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Base Mode */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">Base Mode</label>
                    <p className="text-[11px] text-slate-400 mb-3">Overall contrast styling & baseline</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateCustomTheme({ mode: 'dark', textMain: '#f1f5f9', textMuted: '#94a3b8' })}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                        customTheme.mode === 'dark'
                          ? 'bg-slate-800 text-white border-violet-500/50 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      Dark
                    </button>
                    <button
                      onClick={() => updateCustomTheme({ mode: 'light', textMain: '#0f172a', textMuted: '#475569' })}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                        customTheme.mode === 'light'
                          ? 'bg-slate-800 text-white border-violet-500/50 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      Light
                    </button>
                  </div>
                </div>

                {/* 2. App Background Color */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <label className="block text-xs font-bold text-slate-200 mb-1">Background Canvas</label>
                  <p className="text-[11px] text-slate-400 mb-3">Main application workspace backdrop</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customTheme.bgApp}
                      onChange={(e) => updateCustomTheme({ bgApp: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={customTheme.bgApp}
                      onChange={(e) => updateCustomTheme({ bgApp: e.target.value })}
                      className="flex-1 font-mono text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white uppercase"
                    />
                  </div>
                </div>

                {/* 3. Sidebar & Header Color */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <label className="block text-xs font-bold text-slate-200 mb-1">Sidebar & Header</label>
                  <p className="text-[11px] text-slate-400 mb-3">Navigation bar & top header tone</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customTheme.bgSidebar}
                      onChange={(e) => updateCustomTheme({ bgSidebar: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={customTheme.bgSidebar}
                      onChange={(e) => updateCustomTheme({ bgSidebar: e.target.value })}
                      className="flex-1 font-mono text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white uppercase"
                    />
                  </div>
                </div>

                {/* 4. Card & Surface Color */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <label className="block text-xs font-bold text-slate-200 mb-1">Cards & Panels</label>
                  <p className="text-[11px] text-slate-400 mb-3">Metric cards, tables, modal containers</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customTheme.bgCard}
                      onChange={(e) => updateCustomTheme({ bgCard: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={customTheme.bgCard}
                      onChange={(e) => updateCustomTheme({ bgCard: e.target.value })}
                      className="flex-1 font-mono text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white uppercase"
                    />
                  </div>
                </div>

                {/* 5. Primary Text Color */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <label className="block text-xs font-bold text-slate-200 mb-1">Primary Text Color</label>
                  <p className="text-[11px] text-slate-400 mb-3">Headings, titles, high-contrast text</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customTheme.textMain || (customTheme.mode === 'light' ? '#0f172a' : '#f1f5f9')}
                      onChange={(e) => updateCustomTheme({ textMain: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={customTheme.textMain || (customTheme.mode === 'light' ? '#0f172a' : '#f1f5f9')}
                      onChange={(e) => updateCustomTheme({ textMain: e.target.value })}
                      className="flex-1 font-mono text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white uppercase"
                    />
                  </div>
                </div>

                {/* 6. Muted / Secondary Text Color */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <label className="block text-xs font-bold text-slate-200 mb-1">Muted / Subtitle Text</label>
                  <p className="text-[11px] text-slate-400 mb-3">Subtitles, table headers, descriptions</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customTheme.textMuted || (customTheme.mode === 'light' ? '#475569' : '#94a3b8')}
                      onChange={(e) => updateCustomTheme({ textMuted: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={customTheme.textMuted || (customTheme.mode === 'light' ? '#475569' : '#94a3b8')}
                      onChange={(e) => updateCustomTheme({ textMuted: e.target.value })}
                      className="flex-1 font-mono text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white uppercase"
                    />
                  </div>
                </div>

                {/* 7. Primary Accent Color */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <label className="block text-xs font-bold text-slate-200 mb-1">Primary Accent</label>
                  <p className="text-[11px] text-slate-400 mb-3">Buttons, active tabs, focus highlights</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customTheme.accentPrimary}
                      onChange={(e) => updateCustomTheme({ accentPrimary: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={customTheme.accentPrimary}
                      onChange={(e) => updateCustomTheme({ accentPrimary: e.target.value })}
                      className="flex-1 font-mono text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white uppercase"
                    />
                  </div>
                </div>

                {/* 8. Secondary / Gradient Accent */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <label className="block text-xs font-bold text-slate-200 mb-1">Secondary Accent</label>
                  <p className="text-[11px] text-slate-400 mb-3">Duotone gradients and subtle badges</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customTheme.accentSecondary}
                      onChange={(e) => updateCustomTheme({ accentSecondary: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={customTheme.accentSecondary}
                      onChange={(e) => updateCustomTheme({ accentSecondary: e.target.value })}
                      className="flex-1 font-mono text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleOpenSaveModal}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 transition active:scale-95 flex items-center gap-2"
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>Save Palette as Reference</span>
                </button>

                <button
                  onClick={() => {
                    setTheme('custom');
                    showToast('Applied custom colors!');
                  }}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 transition active:scale-95 shadow-lg flex items-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${customTheme.accentPrimary}, ${customTheme.accentSecondary})`
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Apply Custom Colors Now</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Catalog Section: Category Tabs & Available Themes Grid */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800 pt-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-400" />
              Theme Library & References
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose from signature preset themes, bookmarked favorites, and your saved custom references
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({themes.length})
            </button>

            <button
              onClick={() => setFilter('saved')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'saved'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              My References ({savedThemes.length + bookmarkedIds.length})
            </button>

            <button
              onClick={() => setFilter('dark')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
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
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'light'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-400" />
              Light ({themes.filter(t => t.category === 'Light').length})
            </button>
          </div>
        </div>

        {/* 4. When 'My References' tab is selected */}
        {filter === 'saved' ? (
          <div className="space-y-6">
            {/* User Custom Saved Themes Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <FolderHeart className="w-4 h-4 text-amber-400" />
                  Custom Saved References ({savedThemes.length})
                </h4>
                <button
                  onClick={handleOpenSaveModal}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Current Palette</span>
                </button>
              </div>

              {savedThemes.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">No Saved References Yet</h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      When you find or customize a color scheme you love, save it as a reference to access it anytime!
                    </p>
                  </div>
                  <button
                    onClick={handleOpenSaveModal}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
                  >
                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Save Current Theme as Reference</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {savedThemes.map((saved) => (
                    <div
                      key={saved.id}
                      className="group relative rounded-2xl p-4 border border-amber-500/30 bg-slate-900/60 hover:bg-slate-900/90 hover:border-amber-500/60 transition-all duration-200 flex flex-col justify-between shadow-lg"
                    >
                      {/* Top Bar with Name & Delete */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2">
                          {editingRefId === saved.id ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRename(saved.id)}
                                className="p-1 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 truncate flex-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                              <h5 className="font-bold text-sm text-white truncate">{saved.name}</h5>
                              <button
                                onClick={() => handleStartRename(saved)}
                                className="p-1 rounded text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition"
                                title="Rename reference"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              deleteSavedTheme(saved.id);
                              showToast(`Deleted reference "${saved.name}"`);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                            title="Delete this saved reference"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Mini UI Layout Mockup */}
                        <div
                          className="w-full h-20 rounded-xl border mb-3 overflow-hidden flex shadow-inner"
                          style={{
                            backgroundColor: saved.bgApp,
                            borderColor: `${saved.accentPrimary}40`,
                          }}
                        >
                          {/* Mini Sidebar */}
                          <div
                            className="w-6 border-r p-1 flex flex-col justify-between items-center shrink-0"
                            style={{
                              backgroundColor: saved.bgSidebar,
                              borderColor: '#33415530',
                            }}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-sm shadow-sm"
                              style={{ backgroundColor: saved.accentPrimary }}
                            ></div>
                            <div className="w-2 h-2 rounded-full bg-slate-600/40"></div>
                          </div>

                          {/* Mini Content Canvas */}
                          <div className="flex-1 p-2 flex flex-col justify-between min-w-0">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-700/20">
                              <div
                                className="w-10 h-1.5 rounded-sm"
                                style={{ backgroundColor: saved.textMain || '#ffffff' }}
                              ></div>
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: saved.accentPrimary }}
                              ></div>
                            </div>

                            <div
                              className="p-1 rounded-md border shadow-sm my-auto flex items-center justify-between"
                              style={{ backgroundColor: saved.bgCard, borderColor: '#33415530' }}
                            >
                              <div className="w-6 h-1 rounded-sm bg-slate-400/40"></div>
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: saved.accentPrimary }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Color Swatches */}
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center -space-x-1">
                            {[saved.bgApp, saved.bgCard, saved.accentPrimary, saved.accentSecondary].map((c, idx) => (
                              <span
                                key={idx}
                                className="w-4 h-4 rounded-full border border-slate-900 shadow-sm"
                                style={{ backgroundColor: c }}
                                title={c}
                              ></span>
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(saved.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleCopyPalette(saved)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Copy palette hex codes"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              applySavedTheme(saved);
                              setIsCustomEditorOpen(true);
                              showToast(`Loaded "${saved.name}" into Studio!`);
                            }}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              applySavedTheme(saved);
                              showToast(`Applied "${saved.name}" theme!`);
                            }}
                            className="px-3 py-1 rounded-lg font-bold text-[11px] bg-amber-500 hover:bg-amber-400 text-slate-950 transition active:scale-95"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bookmarked Preset Themes Section */}
            {bookmarkedPresets.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-teal-400" />
                  Bookmarked Preset Themes ({bookmarkedPresets.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {bookmarkedPresets.map((t) => {
                    const isSelected = theme === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`group relative rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                          isSelected
                            ? 'bg-slate-900/90 shadow-xl scale-[1.01]'
                            : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70 hover:scale-[1.005]'
                        }`}
                        style={{
                          borderColor: isSelected ? t.accentColor : undefined,
                          boxShadow: isSelected ? `0 0 20px -4px ${t.accentColor}35` : undefined,
                        }}
                      >
                        {/* Bookmark indicator */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmarkTheme(t.id);
                            showToast('Bookmark updated');
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-xl bg-slate-950/70 text-amber-400 hover:text-amber-300 z-20"
                          title="Remove bookmark"
                        >
                          <Star className="w-4 h-4 fill-amber-400" />
                        </button>

                        {/* Title & Desc */}
                        <div>
                          <h4 className="font-bold text-sm text-white mb-1 pr-8">{t.name}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                        </div>

                        {/* Swatches & Select Button */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {t.swatches.map((color, idx) => (
                              <span
                                key={idx}
                                className="w-3 h-3 rounded-full border border-slate-900 shadow-sm"
                                style={{ backgroundColor: color }}
                              ></span>
                            ))}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTheme(t.id);
                            }}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] transition active:scale-95"
                            style={{
                              backgroundColor: isSelected ? t.accentColor : 'rgba(30, 41, 59, 0.6)',
                              color: isSelected ? '#020617' : '#cbd5e1',
                            }}
                          >
                            {isSelected ? 'Applied' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 4-Column Theme Selection Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredThemes.map((t) => {
              const isSelected = theme === t.id;
              const isBookmarked = bookmarkedIds.includes(t.id);

              return (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`group relative rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-slate-900/90 shadow-xl scale-[1.01]'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70 hover:scale-[1.005]'
                  }`}
                  style={{
                    borderColor: isSelected ? t.accentColor : undefined,
                    boxShadow: isSelected ? `0 0 20px -4px ${t.accentColor}35` : undefined,
                  }}
                >
                  {/* Top Floating Controls: Active Indicator & Bookmark Star */}
                  <div className="absolute -top-2.5 right-3 flex items-center gap-1.5 z-10">
                    {/* Bookmark Star Button */}
                    {!t.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmarkTheme(t.id);
                          showToast(isBookmarked ? `Removed "${t.name}" from bookmarks` : `Bookmarked "${t.name}" as reference!`);
                        }}
                        className={`p-1 rounded-full shadow-md transition ${
                          isBookmarked 
                            ? 'bg-amber-500 text-slate-950' 
                            : 'bg-slate-900/90 text-slate-400 hover:text-amber-300 border border-slate-700'
                        }`}
                        title={isBookmarked ? 'Bookmarked in References' : 'Bookmark as reference'}
                      >
                        <Star className={`w-3 h-3 ${isBookmarked ? 'fill-slate-950' : ''}`} />
                      </button>
                    )}

                    {/* Active Indicator Top Pill */}
                    {isSelected && (
                      <div
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-950 flex items-center gap-1 shadow-md"
                        style={{ backgroundColor: t.accentColor }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        Active
                      </div>
                    )}
                  </div>

                  {/* Miniature UI Layout Mockup */}
                  <div
                    className="w-full h-22 rounded-xl border mb-3 overflow-hidden flex shadow-inner transition-transform group-hover:scale-[1.01]"
                    style={{
                      backgroundColor: t.bodyBg,
                      borderColor: isSelected ? `${t.accentColor}70` : '#33415540',
                    }}
                  >
                    {/* Mini Sidebar */}
                    <div
                      className="w-7 border-r p-1.5 flex flex-col justify-between items-center shrink-0"
                      style={{
                        backgroundColor: t.sidebarBg,
                        borderColor: '#33415530',
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-md shadow-sm"
                        style={{ backgroundColor: t.accentColor }}
                      ></div>
                      <div className="space-y-1 my-auto w-full px-0.5">
                        <div className="w-full h-1 rounded-sm bg-slate-500/40"></div>
                        <div
                          className="w-full h-1 rounded-sm"
                          style={{ backgroundColor: `${t.accentColor}60` }}
                        ></div>
                        <div className="w-full h-1 rounded-sm bg-slate-500/40"></div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-slate-600/40"></div>
                    </div>

                    {/* Mini Content Canvas */}
                    <div className="flex-1 p-2 flex flex-col justify-between min-w-0">
                      {/* Header bar */}
                      <div className="flex items-center justify-between pb-1 border-b border-slate-700/30">
                        <div
                          className="w-12 h-1.5 rounded-sm"
                          style={{ backgroundColor: t.category === 'Light' ? '#0f172a' : '#f8fafc' }}
                        ></div>
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: t.accentColor }}
                        ></div>
                      </div>

                      {/* Metric Card */}
                      <div
                        className="p-1 rounded-lg border shadow-sm my-auto flex items-center justify-between"
                        style={{ backgroundColor: t.cardBg, borderColor: '#33415540' }}
                      >
                        <div className="space-y-0.5">
                          <div className="w-6 h-1 rounded-sm bg-slate-400/40"></div>
                          <div
                            className="w-8 h-1.5 rounded-sm font-bold"
                            style={{ backgroundColor: t.accentColor }}
                          ></div>
                        </div>
                        <div
                          className="w-3 h-3 rounded-md flex items-center justify-center opacity-80"
                          style={{ backgroundColor: `${t.accentColor}25` }}
                        >
                          <span
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: t.accentColor }}
                          ></span>
                        </div>
                      </div>

                      {/* Bottom Row */}
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1.5 rounded-sm bg-slate-500/25"></div>
                        <div
                          className="w-4 h-1 rounded-sm"
                          style={{ backgroundColor: t.accentColor }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Theme Details & Swatches */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors truncate">
                          {t.name}
                        </h4>

                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${
                            t.category === 'Light'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {t.tag || t.category}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed min-h-[30px] line-clamp-2">
                        {t.description}
                      </p>
                    </div>

                    {/* Swatches & Select Button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {t.swatches.map((color, idx) => (
                          <span
                            key={idx}
                            className="w-3 h-3 rounded-full border border-slate-900 shadow-sm shrink-0"
                            style={{ backgroundColor: color }}
                            title={color}
                          ></span>
                        ))}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme(t.id);
                        }}
                        className="px-2.5 py-1 rounded-lg font-bold text-[11px] transition active:scale-95 shrink-0"
                        style={{
                          backgroundColor: isSelected ? t.accentColor : 'rgba(30, 41, 59, 0.6)',
                          color: isSelected ? '#020617' : '#cbd5e1',
                          border: isSelected ? 'none' : '1px solid rgba(51, 65, 85, 0.5)',
                        }}
                      >
                        {isSelected ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}