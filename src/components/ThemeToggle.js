import React from 'react';
import useTheme, { THEMES } from '../theme/useTheme';

const LABELS = {
  system: { icon: '◐', label: 'Match system theme' },
  light: { icon: '☀', label: 'Light theme' },
  dark: { icon: '☾', label: 'Dark theme' },
};

/**
 * Light / dark / system, as three explicit buttons.
 *
 * A single cycling button would take less room, but the reader cannot see
 * what the next press will do or which of the three they are currently on.
 * Three buttons make the current state visible and every option one press
 * away, which matters more here than the few pixels saved.
 */
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle" role="group" aria-label="Colour theme">
      {THEMES.map((option) => (
        <button
          key={option}
          type="button"
          className="theme-toggle-option"
          aria-pressed={theme === option}
          aria-label={LABELS[option].label}
          title={LABELS[option].label}
          onClick={() => setTheme(option)}
        >
          <span aria-hidden="true">{LABELS[option].icon}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
