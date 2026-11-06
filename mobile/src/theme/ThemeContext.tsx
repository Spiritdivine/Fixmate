import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Storage } from '../lib/storage';
import { ThemePalette, lightPalette, darkPalette } from './tokens';

export type ThemePreference = 'SYSTEM' | 'LIGHT' | 'DARK';

interface ThemeContextValue {
  themeMode: ThemePreference;
  isDark: boolean;
  colors: ThemePalette;
  setThemeMode: (mode: ThemePreference) => Promise<void>;
}

const THEME_STORAGE_KEY = '@artifix_user_theme_preference';

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'SYSTEM',
  isDark: false,
  colors: lightPalette,
  setThemeMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemePreference>('SYSTEM');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await Storage.getItem(THEME_STORAGE_KEY);
        if (saved === 'LIGHT' || saved === 'DARK' || saved === 'SYSTEM') {
          setThemeModeState(saved);
        }
      } catch (err) {
        console.warn('[ThemeContext] Failed loading theme preference:', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const setThemeMode = async (mode: ThemePreference) => {
    setThemeModeState(mode);
    try {
      await Storage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.warn('[ThemeContext] Failed saving theme preference:', err);
    }
  };

  const isDark = useMemo(() => {
    if (themeMode === 'DARK') return true;
    if (themeMode === 'LIGHT') return false;
    return systemColorScheme === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = useMemo(() => (isDark ? darkPalette : lightPalette), [isDark]);

  const value = useMemo(
    () => ({ themeMode, isDark, colors, setThemeMode }),
    [themeMode, isDark, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

