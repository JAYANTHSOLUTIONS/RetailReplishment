// src/components/ui/Button.jsx
// Accessible, variant-aware button primitive.
/**
 * @param {'primary'|'secondary'|'ghost'|'danger'} variant
 * @param {'sm'|'md'|'lg'} size
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`ui-btn ui-btn--${variant} ui-btn--${size}`}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
