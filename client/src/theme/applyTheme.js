import { COLORS } from './colors.js';

export const applyTheme = () => {
  const root = document.documentElement;
  Object.keys(COLORS).forEach(key => {
    root.style.setProperty(`--color-${key}`, COLORS[key]);
  });
};
