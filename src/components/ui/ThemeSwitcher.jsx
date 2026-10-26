"use client";

import { useRef, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";

const icons = [
  { label: "Sun", theme: "light", Component: Sun },
  { label: "Moon", theme: "dark", Component: Moon },
  { label: "Laptop", theme: "system", Component: Laptop },
];

const themeToIndex = {
  light: 0,
  dark: 1,
  system: 2,
};

export default function IconCycleButton({ value, onChange, className = '', style = {} }) {
  const [index, setIndex] = useState(() => (value && themeToIndex[value] !== undefined ? themeToIndex[value] : 0));
  const iconRef = useRef(null);

  const activeIndex = value !== undefined && themeToIndex[value] !== undefined ? themeToIndex[value] : index;
  const current = icons[activeIndex] || icons[0];
  const next = icons[(activeIndex + 1) % icons.length];
  const CurrentIcon = current.Component;

  function handleClick() {
    const nextIndex = (activeIndex + 1) % icons.length;
    setIndex(nextIndex);
    onChange?.(icons[nextIndex].theme);

    const icon = iconRef.current;
    if (!icon || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    icon.getAnimations().forEach((animation) => animation.cancel());
    icon.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
      { duration: 560, iterations: 1, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Current icon: ${current.label}. Click to show ${next.label}.`}
      title={`Show ${next.label} icon`}
      className={className}
      style={{
        width: 48,
        height: 48,
        padding: 0,
        display: "grid",
        placeItems: "center",
        border: "1px solid currentColor",
        borderRadius: "50%",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        ...style,
      }}
    >
      <span ref={iconRef} aria-hidden="true" style={{ display: "grid" }}>
        <CurrentIcon size={20} strokeWidth={1.8} />
      </span>
    </button>
  );
}

// Alias export for backwards compatibility
export { IconCycleButton as ThemeSwitcher };
