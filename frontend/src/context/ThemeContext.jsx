import React, { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT_CUSTOM_THEME = {
  mode: 'dark', // 'dark' or 'light'
  bgApp: '#0c1017',
  bgSidebar: '#111726',
  bgCard: '#172033',
  accentPrimary: '#8b5cf6',
  accentSecondary: '#06b6d4',
  textMain: '#f1f5f9',
  textMuted: '#94a3b8',
};

export const STARTER_PALETTES = [
  {
    name: 'Cyberpunk Neon',
    mode: 'dark',
    bgApp: '#080511',
    bgSidebar: '#100a20',
    bgCard: '#181030',
    accentPrimary: '#f43f5e',
    accentSecondary: '#06b6d4',
    textMain: '#fdf2f8',
    textMuted: '#f472b6',
  },
  {
    name: 'Sunset Horizon',
    mode: 'dark',
    bgApp: '#120d0a',
    bgSidebar: '#1c1410',
    bgCard: '#271c17',
    accentPrimary: '#f97316',
    accentSecondary: '#fbbf24',
    textMain: '#fff7ed',
    textMuted: '#fdba74',
  },
  {
    name: 'Electric Cobalt',
    mode: 'dark',
    bgApp: '#070c18',
    bgSidebar: '#0d1629',
    bgCard: '#13213d',
    accentPrimary: '#3b82f6',
    accentSecondary: '#60a5fa',
    textMain: '#eff6ff',
    textMuted: '#93c5fd',
  },
  {
    name: 'Emerald Matrix',
    mode: 'dark',
    bgApp: '#05120d',
    bgSidebar: '#0b2017',
    bgCard: '#112f22',
    accentPrimary: '#10b981',
    accentSecondary: '#34d399',
    textMain: '#ecfdf5',
    textMuted: '#6ee7b7',
  },
  {
    name: 'Warm Coffee Day',
    mode: 'light',
    bgApp: '#eae5de',
    bgSidebar: '#ded7ce',
    bgCard: '#f6f3ed',
    accentPrimary: '#b45309',
    accentSecondary: '#d97706',
    textMain: '#292524',
    textMuted: '#57534e',
  },
  {
    name: 'Nordic Breeze Day',
    mode: 'light',
    bgApp: '#e1eaf3',
    bgSidebar: '#d3e0ee',
    bgCard: '#eef4fa',
    accentPrimary: '#0284c7',
    accentSecondary: '#06b6d4',
    textMain: '#0c1e33',
    textMuted: '#2d425c',
  },
];

export const PRESET_THEMES = [
  // 1. Signature Dark Themes
  {
    id: 'nexa',
    name: 'Nexa',
    category: 'Dark',
    tag: 'Signature',
    description: 'Futuristic Nexa titanium obsidian with electric violet & luminous cyan duotone',
    swatches: ['#090d16', '#8b5cf6', '#06b6d4'],
    accentColor: '#8b5cf6',
    accentGradient: 'from-violet-500 to-cyan-400',
    sidebarBg: '#0e1322',
    cardBg: '#131a2e',
    bodyBg: '#090d16',
  },
  {
    id: 'dark-teal',
    name: 'Cyber Teal',
    category: 'Dark',
    tag: 'Default',
    description: 'Soft slate navy workspace with calm teal & mint accents (Eye Comfort)',
    swatches: ['#0b0f19', '#2dd4bf', '#34d399'],
    accentColor: '#2dd4bf',
    accentGradient: 'from-teal-400 to-emerald-400',
    sidebarBg: '#0f172a',
    cardBg: '#141d2f',
    bodyBg: '#0b0f19',
  },
  {
    id: 'midnight-indigo',
    name: 'Midnight Indigo',
    category: 'Dark',
    tag: 'Popular',
    description: 'Deep midnight blue with soothing pastel lavender & periwinkle accents',
    swatches: ['#0c0d1e', '#818cf8', '#c084fc'],
    accentColor: '#818cf8',
    accentGradient: 'from-indigo-400 to-purple-400',
    sidebarBg: '#11132b',
    cardBg: '#191b3a',
    bodyBg: '#0c0d1e',
  },
  {
    id: 'ocean-blue',
    name: 'Nordic Frost',
    category: 'Dark',
    tag: 'Cool',
    description: 'Muted Arctic navy with soft sky cyan & gentle ice blue glow',
    swatches: ['#08101a', '#38bdf8', '#06b6d4'],
    accentColor: '#38bdf8',
    accentGradient: 'from-sky-400 to-cyan-400',
    sidebarBg: '#0a1826',
    cardBg: '#0e2133',
    bodyBg: '#08101a',
  },
  {
    id: 'charcoal-ember',
    name: 'Charcoal Ember',
    category: 'Dark',
    tag: 'Warm',
    description: 'Warm soft charcoal with gentle honey amber & muted flame accents',
    swatches: ['#121110', '#f59e0b', '#fb923c'],
    accentColor: '#f59e0b',
    accentGradient: 'from-amber-400 to-orange-400',
    sidebarBg: '#1b1917',
    cardBg: '#262321',
    bodyBg: '#121110',
  },
  {
    id: 'luxury-emerald',
    name: 'Royal Forest',
    category: 'Dark',
    tag: 'Luxe',
    description: 'Soft pine jade with gentle botanical emerald & soft warm gold',
    swatches: ['#091410', '#10b981', '#fcd34d'],
    accentColor: '#10b981',
    accentGradient: 'from-emerald-400 to-amber-300',
    sidebarBg: '#0c1d17',
    cardBg: '#122921',
    bodyBg: '#091410',
  },
  {
    id: 'amoled-black',
    name: 'Graphite Blue',
    category: 'Dark',
    tag: 'Minimal',
    description: 'Balanced smooth graphite dark mode with calm cornflower blue',
    swatches: ['#111217', '#60a5fa', '#93c5fd'],
    accentColor: '#60a5fa',
    accentGradient: 'from-blue-400 to-sky-400',
    sidebarBg: '#16181f',
    cardBg: '#1d1f29',
    bodyBg: '#111217',
  },
  {
    id: 'crimson-noir',
    name: 'Velvet Rose',
    category: 'Dark',
    tag: 'Vivid',
    description: 'Deep velvet plum with gentle dusty rose & soft pink accents',
    swatches: ['#130a0f', '#fb7185', '#fda4af'],
    accentColor: '#fb7185',
    accentGradient: 'from-rose-400 to-pink-500',
    sidebarBg: '#1d0f17',
    cardBg: '#2a1621',
    bodyBg: '#130a0f',
  },

  // 2. Curated Soft Low-Glare Light Themes
  {
    id: 'light-clean',
    name: 'Clean Studio',
    category: 'Light',
    tag: 'Daylight',
    description: 'Soft slate off-white interface with calm teal accents (Low Glare)',
    swatches: ['#e8ecf1', '#0d9488', '#0284c7'],
    accentColor: '#0d9488',
    accentGradient: 'from-teal-600 to-sky-600',
    sidebarBg: '#dde3ea',
    cardBg: '#f3f6f9',
    bodyBg: '#e8ecf1',
  },
  {
    id: 'light-sand',
    name: 'Warm Sand',
    category: 'Light',
    tag: 'Warm',
    description: 'Warm muted oat & cream daylight theme with rich caramel amber tones',
    swatches: ['#eae5de', '#d97706', '#ea580c'],
    accentColor: '#d97706',
    accentGradient: 'from-amber-600 to-orange-600',
    sidebarBg: '#ded7ce',
    cardBg: '#f6f3ed',
    bodyBg: '#eae5de',
  },
  {
    id: 'light-nordic',
    name: 'Nordic Day',
    category: 'Light',
    tag: 'Cool',
    description: 'Calm Scandinavian daylight with muted cobalt sky & ice slate tones',
    swatches: ['#e1eaf3', '#0284c7', '#38bdf8'],
    accentColor: '#0284c7',
    accentGradient: 'from-sky-600 to-blue-600',
    sidebarBg: '#d3e0ee',
    cardBg: '#eef4fa',
    bodyBg: '#e1eaf3',
  },
  {
    id: 'light-sage',
    name: 'Sage Meadow',
    category: 'Light',
    tag: 'Botanical',
    description: 'Calming Japanese tea garden sage & mint with natural emerald highlights',
    swatches: ['#e1ede5', '#059669', '#10b981'],
    accentColor: '#059669',
    accentGradient: 'from-emerald-600 to-teal-600',
    sidebarBg: '#d2e2d8',
    cardBg: '#eef6f1',
    bodyBg: '#e1ede5',
  },
  {
    id: 'light-rose',
    name: 'Blush Dawn',
    category: 'Light',
    tag: 'Pastel',
    description: 'Soothing cashmere rose & soft morning blush with delicate coral highlights',
    swatches: ['#eee4e7', '#e11d48', '#fb7185'],
    accentColor: '#e11d48',
    accentGradient: 'from-rose-600 to-pink-600',
    sidebarBg: '#e1d4d8',
    cardBg: '#f7eff2',
    bodyBg: '#eee4e7',
  },
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('snd_theme') || 'nexa';
  });

  const [customTheme, setCustomTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('snd_custom_theme');
      return saved ? { ...DEFAULT_CUSTOM_THEME, ...JSON.parse(saved) } : DEFAULT_CUSTOM_THEME;
    } catch {
      return DEFAULT_CUSTOM_THEME;
    }
  });

  // Saved theme references vault
  const [savedThemes, setSavedThemes] = useState(() => {
    try {
      const saved = localStorage.getItem('snd_saved_theme_references');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Bookmarked preset theme IDs
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('snd_bookmarked_themes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Apply CSS variables and data-theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (currentTheme === 'custom') {
      const themeAttr = customTheme.mode === 'light' ? 'light-custom' : 'custom';
      root.setAttribute('data-theme', themeAttr);

      // Apply custom CSS variables directly
      root.style.setProperty('--bg-app', customTheme.bgApp);
      root.style.setProperty('--bg-sidebar', customTheme.bgSidebar);
      root.style.setProperty('--bg-header', customTheme.bgSidebar);
      root.style.setProperty('--bg-card', customTheme.bgCard);
      root.style.setProperty('--bg-card-hover', customTheme.bgCard);
      root.style.setProperty('--bg-input', customTheme.mode === 'light' ? '#f8fafc' : customTheme.bgApp);
      root.style.setProperty('--bg-modal', customTheme.bgCard);
      root.style.setProperty('--text-main', customTheme.textMain || (customTheme.mode === 'light' ? '#0f172a' : '#f1f5f9'));
      root.style.setProperty('--text-muted', customTheme.textMuted || (customTheme.mode === 'light' ? '#334155' : '#94a3b8'));
      root.style.setProperty('--text-subtle', customTheme.textMuted || (customTheme.mode === 'light' ? '#64748b' : '#71717a'));
      root.style.setProperty('--accent-primary', customTheme.accentPrimary);
      root.style.setProperty('--accent-primary-hover', customTheme.accentPrimary);
      root.style.setProperty('--accent-gradient-from', customTheme.accentPrimary);
      root.style.setProperty('--accent-gradient-to', customTheme.accentSecondary);
      root.style.setProperty('--accent-badge-bg', `${customTheme.accentPrimary}1a`);
      root.style.setProperty('--accent-badge-border', `${customTheme.accentPrimary}35`);
      root.style.setProperty('--accent-badge-text', customTheme.accentPrimary);
      root.style.setProperty('--border-main', customTheme.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)');
      root.style.setProperty('--border-subtle', customTheme.mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)');
    } else {
      root.setAttribute('data-theme', currentTheme);
      // Remove inline variable overrides so CSS rules take over
      const vars = [
        '--bg-app', '--bg-sidebar', '--bg-header', '--bg-card', '--bg-card-hover',
        '--bg-input', '--bg-modal', '--text-main', '--text-muted', '--text-subtle',
        '--accent-primary', '--accent-primary-hover', '--accent-gradient-from',
        '--accent-gradient-to', '--accent-badge-bg', '--accent-badge-border',
        '--accent-badge-text', '--border-main', '--border-subtle'
      ];
      vars.forEach(v => root.style.removeProperty(v));
    }

    localStorage.setItem('snd_theme', currentTheme);
  }, [currentTheme, customTheme]);

  // Save custom theme whenever it updates
  const updateCustomTheme = (newProps) => {
    setCustomTheme(prev => {
      const updated = { ...prev, ...newProps };
      localStorage.setItem('snd_custom_theme', JSON.stringify(updated));
      return updated;
    });
  };

  const resetCustomTheme = () => {
    setCustomTheme(DEFAULT_CUSTOM_THEME);
    localStorage.setItem('snd_custom_theme', JSON.stringify(DEFAULT_CUSTOM_THEME));
  };

  const selectTheme = (themeId) => {
    if (themeId === 'custom' || PRESET_THEMES.some(t => t.id === themeId)) {
      setCurrentTheme(themeId);
    }
  };

  // --- Saved References Management ---
  const saveThemeReference = (name, customData = null) => {
    const dataToSave = customData || {
      mode: customTheme.mode || 'dark',
      bgApp: customTheme.bgApp,
      bgSidebar: customTheme.bgSidebar,
      bgCard: customTheme.bgCard,
      accentPrimary: customTheme.accentPrimary,
      accentSecondary: customTheme.accentSecondary,
      textMain: customTheme.textMain || (customTheme.mode === 'light' ? '#0f172a' : '#f1f5f9'),
      textMuted: customTheme.textMuted || (customTheme.mode === 'light' ? '#334155' : '#94a3b8'),
    };

    const newRef = {
      id: `ref-${Date.now()}`,
      name: name && name.trim() ? name.trim() : `Theme Reference ${savedThemes.length + 1}`,
      createdAt: new Date().toISOString(),
      ...dataToSave,
    };

    const updated = [newRef, ...savedThemes];
    setSavedThemes(updated);
    localStorage.setItem('snd_saved_theme_references', JSON.stringify(updated));
    return newRef;
  };

  const deleteSavedTheme = (refId) => {
    const updated = savedThemes.filter(r => r.id !== refId);
    setSavedThemes(updated);
    localStorage.setItem('snd_saved_theme_references', JSON.stringify(updated));
  };

  const renameSavedTheme = (refId, newName) => {
    const updated = savedThemes.map(r => r.id === refId ? { ...r, name: newName.trim() } : r);
    setSavedThemes(updated);
    localStorage.setItem('snd_saved_theme_references', JSON.stringify(updated));
  };

  const applySavedTheme = (savedRef) => {
    updateCustomTheme({
      mode: savedRef.mode,
      bgApp: savedRef.bgApp,
      bgSidebar: savedRef.bgSidebar,
      bgCard: savedRef.bgCard,
      accentPrimary: savedRef.accentPrimary,
      accentSecondary: savedRef.accentSecondary,
      textMain: savedRef.textMain,
      textMuted: savedRef.textMuted,
    });
    setCurrentTheme('custom');
  };

  const toggleBookmarkTheme = (themeId) => {
    setBookmarkedIds(prev => {
      const exists = prev.includes(themeId);
      const updated = exists ? prev.filter(id => id !== themeId) : [...prev, themeId];
      localStorage.setItem('snd_bookmarked_themes', JSON.stringify(updated));
      return updated;
    });
  };

  // Build custom theme object for catalog
  const customThemeObj = {
    id: 'custom',
    name: 'Custom Theme',
    category: customTheme.mode === 'light' ? 'Light' : 'Dark',
    tag: 'Your Colors',
    description: 'Personalized user-defined palette with customizable surface and accent colors',
    swatches: [customTheme.bgApp, customTheme.accentPrimary, customTheme.accentSecondary],
    accentColor: customTheme.accentPrimary,
    accentGradient: 'from-violet-500 to-cyan-400',
    sidebarBg: customTheme.bgSidebar,
    cardBg: customTheme.bgCard,
    bodyBg: customTheme.bgApp,
    isCustom: true,
  };

  const allThemes = [customThemeObj, ...PRESET_THEMES];
  const activeThemeInfo = currentTheme === 'custom' ? customThemeObj : (PRESET_THEMES.find(t => t.id === currentTheme) || PRESET_THEMES[0]);

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        setTheme: selectTheme,
        themes: allThemes,
        activeTheme: activeThemeInfo,
        customTheme,
        updateCustomTheme,
        resetCustomTheme,
        starterPalettes: STARTER_PALETTES,
        savedThemes,
        saveThemeReference,
        deleteSavedTheme,
        renameSavedTheme,
        applySavedTheme,
        bookmarkedIds,
        toggleBookmarkTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}