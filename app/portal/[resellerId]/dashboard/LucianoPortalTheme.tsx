'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  isLucianoReseller,
  readLucianoTheme,
  writeLucianoTheme,
  type LucianoThemeMode,
} from '@/lib/portal-luciano-ui';

export type LucianoPortalThemeValue = {
  isLuciano: boolean;
  theme: LucianoThemeMode;
  light: boolean;
  toggleTheme: () => void;
};

const LucianoPortalThemeContext = createContext<LucianoPortalThemeValue | null>(null);

export function LucianoPortalThemeProvider({
  resellerId,
  children,
}: {
  resellerId: string;
  children: React.ReactNode;
}) {
  const isLuciano = isLucianoReseller(resellerId);
  const [theme, setTheme] = useState<LucianoThemeMode>('light');

  useEffect(() => {
    if (!isLuciano) {
      setTheme('dark');
      return;
    }
    setTheme(readLucianoTheme());
    const on = (e: Event) => {
      const d = (e as CustomEvent<LucianoThemeMode>).detail;
      if (d === 'light' || d === 'dark') setTheme(d);
    };
    window.addEventListener('agentia-luciano-theme', on as EventListener);
    return () => window.removeEventListener('agentia-luciano-theme', on as EventListener);
  }, [isLuciano]);

  const toggleTheme = useCallback(() => {
    if (!isLuciano) return;
    const next: LucianoThemeMode = theme === 'light' ? 'dark' : 'light';
    writeLucianoTheme(next);
    setTheme(next);
  }, [isLuciano, theme]);

  const light = isLuciano && theme === 'light';

  const value = useMemo(
    () => ({ isLuciano, theme, light, toggleTheme }),
    [isLuciano, theme, light, toggleTheme],
  );

  return (
    <LucianoPortalThemeContext.Provider value={value}>{children}</LucianoPortalThemeContext.Provider>
  );
}

export function useLucianoPortalThemeOptional(): LucianoPortalThemeValue | null {
  return useContext(LucianoPortalThemeContext);
}
