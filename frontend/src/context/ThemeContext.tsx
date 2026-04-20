 import { createContext, useContext, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'system';

export type FontSize = 'sm' | 'base' | 'lg';

export interface ThemeSettings {
  accentColor: string;
  themeMode: ThemeMode;
  fontSize: FontSize;
  compactMode: boolean;
  animations: boolean;
}

interface ThemeContextValue extends ThemeSettings {
  setAccentColor: (color: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: FontSize) => void;
  setCompactMode: (v: boolean) => void;
  setAnimations: (v: boolean) => void;
  isDark: boolean;
}

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: ThemeSettings = {
  accentColor: '#2563eb',
  themeMode: 'light',
  fontSize: 'base',
  compactMode: false,
  animations: true,
};

const STORAGE_KEY = 'medicai_theme';

function loadSettings(): ThemeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: ThemeSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(loadSettings);

  const isDark = (() => {
    if (settings.themeMode === 'dark') return true;
    if (settings.themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  })();

  // Apply CSS variables and classes whenever settings change
  useEffect(() => {
    const root = document.documentElement;

    // Accent color
    root.style.setProperty('--color-accent', settings.accentColor);

    // Dark/light class
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Font size
    const fontSizeMap: Record<FontSize, string> = {
      sm: '13px',
      base: '15px',
      lg: '17px',
    };
    root.style.setProperty('--font-size-base', fontSizeMap[settings.fontSize]);
    root.style.fontSize = fontSizeMap[settings.fontSize];

    // Compact / animations
    if (settings.compactMode) {
      root.classList.add('compact');
    } else {
      root.classList.remove('compact');
    }
    if (!settings.animations) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }

    saveSettings(settings);
  }, [settings, isDark]);

  const update = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const value: ThemeContextValue = {
    ...settings,
    isDark,
    setAccentColor: v => update('accentColor', v),
    setThemeMode:   v => update('themeMode', v),
    setFontSize:    v => update('fontSize', v),
    setCompactMode: v => update('compactMode', v),
    setAnimations:  v => update('animations', v),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
