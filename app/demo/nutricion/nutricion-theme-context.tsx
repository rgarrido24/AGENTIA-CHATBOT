'use client';

import { createContext, useContext, useState } from 'react';

export type NutricionTheme = 'light' | 'dark';

export type NutricionThemeColors = {
  pageBg: string;
  cardBg: string;
  cardBgAlt: string;
  sidebarBg: string;
  border: string;
  borderAccent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  hoverBg: string;
  accentSoft: string;
  divider: string;
};

const LIGHT: NutricionThemeColors = {
  pageBg:        '#f8fafb',
  cardBg:        '#ffffff',
  cardBgAlt:     '#f3f4f6',
  sidebarBg:     '#ffffff',
  border:        '#e5e7eb',
  borderAccent:  '#bbf7d0',
  textPrimary:   '#111827',
  textSecondary: '#6b7280',
  textMuted:     '#9ca3af',
  inputBg:       '#f3f4f6',
  hoverBg:       '#f0fdf4',
  accentSoft:    '#dcfce7',
  divider:       '#f3f4f6',
};

const DARK: NutricionThemeColors = {
  pageBg:        '#07120c',
  cardBg:        'rgba(255,255,255,0.03)',
  cardBgAlt:     'rgba(255,255,255,0.015)',
  sidebarBg:     '#0a1a12',
  border:        'rgba(255,255,255,0.1)',
  borderAccent:  'rgba(22,163,74,0.3)',
  textPrimary:   '#ffffff',
  textSecondary: '#94a3b8',
  textMuted:     '#64748b',
  inputBg:       '#1e293b',
  hoverBg:       'rgba(22,163,74,0.1)',
  accentSoft:    'rgba(22,163,74,0.2)',
  divider:       'rgba(255,255,255,0.04)',
};

type NutricionThemeCtx = {
  theme: NutricionTheme;
  colors: NutricionThemeColors;
  toggleTheme: () => void;
};

const Ctx = createContext<NutricionThemeCtx>({
  theme: 'light',
  colors: LIGHT,
  toggleTheme: () => {},
});

export function NutricionThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<NutricionTheme>('light');
  const colors = theme === 'light' ? LIGHT : DARK;
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  return <Ctx.Provider value={{ theme, colors, toggleTheme }}>{children}</Ctx.Provider>;
}

export const useNutricionTheme = () => useContext(Ctx);
