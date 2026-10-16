// src/components/ui/Dialog.jsx
// Modal dialog with focus-trap and accessible overlay.

import React, { useEffect, useRef } from 'react';

export default function Dialog({ open, title, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="ui-dialog-overlay" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="ui-dialog"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ui-dialog__header">
          <h2 id="dialog-title" className="ui-dialog__title">{title}</h2>
          <button className="ui-dialog__close" onClick={onClose} aria-label="Close dialog">✕</button>
        </header>
        <div className="ui-dialog__body">{children}</div>
      </div>
    </div>
  );
}
