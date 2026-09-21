import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getStoredTheme, applyTheme } from '../../theme/applyTheme.js';

const ThemeToggle = ({ compact = false }) => {
  const [theme, setTheme] = useState(() => getStoredTheme());

  useEffect(() => {
    const syncTheme = () => {
      setTheme(getStoredTheme());
    };

    window.addEventListener('storage', syncTheme);

    return () => {
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  const handleToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`group relative flex items-center justify-center rounded-xl border border-border bg-surface text-text transition-all duration-300 hover:border-primary/40 hover:bg-primary/10 ${
        compact ? 'h-9 w-9' : 'h-10 w-10'
      }`}
    >
      <span className="relative flex items-center justify-center">
        {isDark ? (
          <Sun
            size={compact ? 17 : 19}
            className="text-warning transition-transform duration-300 group-hover:rotate-45"
          />
        ) : (
          <Moon
            size={compact ? 17 : 19}
            className="text-text/70 transition-transform duration-300 group-hover:-rotate-12 group-hover:text-primary"
          />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
