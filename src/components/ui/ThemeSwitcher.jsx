// src/components/ui/ThemeSwitcher.jsx
import React from 'react';

/**
 * Single accessible theme toggle button that cycles between Light -> Dark -> System.
 * @param {'light'|'dark'|'system'} value - Current active theme
 * @param {(theme: 'light'|'dark'|'system') => void} onChange - Callback when theme changes
 * @param {string} [className] - Optional extra class
 */
export default function ThemeSwitcher({ value = 'system', onChange, className = '' }) {
  const modes = {
    light: {
      next: 'dark',
      label: 'Light',
      nextLabel: 'Dark',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ),
    },
    dark: {
      next: 'system',
      label: 'Dark',
      nextLabel: 'System',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
    },
    system: {
      next: 'light',
      label: 'System',
      nextLabel: 'Light',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
  };

  const current = modes[value] || modes.system;

  const handleClick = () => {
    onChange?.(current.next);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`ui-theme-toggle-btn ${className}`}
      title={`Theme: ${current.label} (Click to switch to ${current.nextLabel})`}
      aria-label={`Theme: ${current.label}. Click to switch to ${current.nextLabel}`}
    >
      <span className="ui-theme-toggle-icon">{current.icon}</span>
      <span className="ui-theme-toggle-label">{current.label}</span>
    </button>
  );
}
