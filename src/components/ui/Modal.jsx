// src/components/ui/Modal.jsx
// Standardized, accessible, reusable modal dialog component.
// Replaces boilerplate overlays, dialog wrappers, headers, footers, and focus management across all feature modals.

import { useEffect, useRef } from 'react';

/**
 * @param {boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Callback invoked on backdrop click, close button, or ESC key
 * @param {React.ReactNode} title - Modal heading text or element
 * @param {React.ReactNode} [icon] - Leading icon for the header
 * @param {string} [subtitle] - Optional subtitle text below title
 * @param {'sm'|'md'|'lg'|'xl'} [size='md'] - Dialog width breakpoint
 * @param {React.ReactNode} [footer] - Action buttons rendered in modal-footer
 * @param {object} [formProps] - If provided, wraps dialog content in a <form> with these props
 * @param {string} [className] - Extra class for modal-dialog
 * @param {string} [contentClassName] - Extra class for modal-content
 * @param {string} [bodyClassName] - Extra class for modal-body
 */
export default function Modal({
  isOpen,
  open,
  onClose,
  title,
  icon,
  subtitle,
  size = 'md',
  footer,
  formProps,
  children,
  className = '',
  contentClassName = '',
  bodyClassName = '',
}) {
  const isVisible = isOpen ?? open ?? false;
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const sizeClass = {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
    xl: 'modal-xl',
  }[size] || 'modal-md';

  const modalBody = (
    <div className={`modal-body filter-modal-body modal-form-body ${bodyClassName}`.trim()}>
      {children}
    </div>
  );

  const modalFooter = footer ? (
    <div className="modal-footer filter-modal-footer">
      {footer}
    </div>
  ) : null;

  const modalInner = (
    <div className={`modal-content ${contentClassName}`.trim()}>
      <div className="modal-header info-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="modal-title info-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && <span className="modal-title-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
          <div>
            <h2 id="modal-dialog-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text3)' }}>{subtitle}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          className="modal-close-btn info-modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>
      </div>

      {modalBody}
      {modalFooter}
    </div>
  );

  return (
    <div
      className="modal-overlay fade-toggle open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-dialog-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${sizeClass} ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {formProps ? (
          <form
            {...formProps}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, ...(formProps.style || {}) }}
          >
            {modalInner}
          </form>
        ) : (
          modalInner
        )}
      </div>
    </div>
  );
}
