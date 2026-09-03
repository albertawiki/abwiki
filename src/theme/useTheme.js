import { useCallback, useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'alberta-wiki-theme';

/** The three states a reader can choose between. */
export const THEMES = ['system', 'light', 'dark'];

const prefersDark = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

/** What the reader last chose, or "system" if they have not chosen. */
export function storedTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.includes(saved) ? saved : 'system';
  } catch {
    // Private browsing, or storage disabled. Following the OS is a fine default.
    return 'system';
  }
}

/**
 * Light/dark preference, persisted, with the operating system as the default.
 *
 * The choice is written to the root element as `data-theme` rather than held
 * in React state alone, because the stylesheet and the charts both read it
 * from there — the chart colours are CSS custom properties, so nothing has to
 * re-render for a theme change to reach an axis label.
 */
export default function useTheme() {
  const [theme, setThemeState] = useState(storedTheme);
  const [systemDark, setSystemDark] = useState(prefersDark);

  // Track the OS setting so "system" stays live rather than sampled once.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);

    try {
      if (theme === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Not being able to remember the choice is not a reason to ignore it.
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (THEMES.includes(next)) setThemeState(next);
  }, []);

  return {
    theme,
    resolved: theme === 'system' ? (systemDark ? 'dark' : 'light') : theme,
    setTheme,
  };
}
