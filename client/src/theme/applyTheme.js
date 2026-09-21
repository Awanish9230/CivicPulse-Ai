import { LIGHT_COLORS, DARK_COLORS } from './colors.js';

const STORAGE_KEY = 'civicpulse-theme';

export const getStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Ignore localStorage errors.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export const applyTheme = (theme = getStoredTheme()) => {
  const root = document.documentElement;
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore localStorage errors.
  }

  return theme;
};

export const toggleTheme = () => {
  const nextTheme = getStoredTheme() === 'dark' ? 'light' : 'dark';
  return applyTheme(nextTheme);
};
