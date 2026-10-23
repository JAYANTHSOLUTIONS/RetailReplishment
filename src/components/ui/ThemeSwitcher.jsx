// src/components/ui/ThemeSwitcher.jsx

import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

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
      iconClass: 'theme-icon-sun',
      icon: <WbSunnyIcon style={{ fontSize: 16 }} />,
    },
    dark: {
      next: 'system',
      label: 'Dark',
      nextLabel: 'System',
      iconClass: 'theme-icon-moon',
      icon: <DarkModeIcon style={{ fontSize: 16 }} />,
    },
    system: {
      next: 'light',
      label: 'System',
      nextLabel: 'Light',
      iconClass: 'theme-icon-system',
      icon: <SettingsBrightnessIcon style={{ fontSize: 16 }} />,
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
      <span className={`ui-theme-toggle-icon ${current.iconClass}`}>{current.icon}</span>
      <span className="ui-theme-toggle-label">{current.label}</span>
    </button>
  );
}

