import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { settingsService, AppearanceSettings } from '@/services/settingsService';

interface ThemeContextValue {
  appearance: AppearanceSettings;
  setAppearance: (next: Partial<AppearanceSettings>) => Promise<void>;
}

const defaultAppearance: AppearanceSettings = {
  theme: 'light',
  primaryColor: '#3b82f6',
  fontSize: 'medium',
  compactMode: false,
};

const ThemeContext = createContext<ThemeContextValue>({
  appearance: defaultAppearance,
  setAppearance: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

function applyAppearance(a: AppearanceSettings) {
  const root = document.documentElement;
  root.classList.toggle('dark', a.theme === 'dark');
  root.style.setProperty('--color-primary', a.primaryColor);
  const fontScale = a.fontSize === 'small' ? '0.95' : a.fontSize === 'large' ? '1.05' : '1';
  root.style.setProperty('--font-scale', fontScale);
  root.classList.toggle('compact', !!a.compactMode);

  // Sync background/text vars for light/dark
  if (a.theme === 'dark') {
    root.style.setProperty('--color-background', '#0f172a');
    root.style.setProperty('--color-surface', '#0b1220');
    root.style.setProperty('--color-border', '#1f2937');
    root.style.setProperty('--color-text', '#e5e7eb');
  } else {
    root.style.setProperty('--color-background', '#f8fafc');
    root.style.setProperty('--color-surface', '#ffffff');
    root.style.setProperty('--color-border', '#e2e8f0');
    root.style.setProperty('--color-text', '#1e293b');
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appearance, setAppearanceState] = useState<AppearanceSettings>(defaultAppearance);

  useEffect(() => {
    (async () => {
      const saved = await settingsService.getAppearanceSettings();
      const a = saved || defaultAppearance;
      setAppearanceState(a);
      applyAppearance(a);
    })();
  }, []);

  const setAppearance = async (next: Partial<AppearanceSettings>) => {
    const updated: AppearanceSettings = { ...appearance, ...next } as AppearanceSettings;
    setAppearanceState(updated);
    applyAppearance(updated);
    await settingsService.updateAppearanceSettings(updated);
  };

  const value = useMemo(() => ({ appearance, setAppearance }), [appearance]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
