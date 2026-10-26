import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Button from './Button.jsx';

/**
 * Accessible Keyboard Shortcuts Modal (WCAG 2.2 AA compliant)
 * Focus trap, Escape to dismiss, high contrast focus rings, aria-modal, role="dialog"
 */
export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  const closeBtnRef = useRef(null);
  const modalRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement;
      // Focus close button on open
      setTimeout(() => closeBtnRef.current?.focus(), 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
          return;
        }

        // Focus trap inside modal
        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
          previouslyFocusedElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 560, width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content info-modal-card">
          <div className="modal-header info-modal-header">
            <h2
              id="shortcuts-modal-title"
              className="info-modal-title"
              style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: 16 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
              </svg>
              <span>Keyboard Shortcuts &amp; Navigation</span>
            </h2>
            <button
              ref={closeBtnRef}
              type="button"
              className="info-modal-close modal-close-btn"
              onClick={onClose}
              aria-label="Close keyboard shortcuts dialog"
            >
              ✕
            </button>
          </div>

          <div className="modal-body info-modal-body" style={{ padding: '16px 20px', maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Section 1: Page Switching Navigation */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: 8 }}>
                Quick Page Switching (Available Everywhere)
              </div>
              <div className="kbd-shortcut-list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Executive Dashboard</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd className="kbd-key">Alt</kbd>
                    <span style={{ color: 'var(--text3)', fontSize: 11 }}>+</span>
                    <kbd className="kbd-key">1</kbd>
                  </div>
                </div>

                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Replenishment Matrix</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd className="kbd-key">Alt</kbd>
                    <span style={{ color: 'var(--text3)', fontSize: 11 }}>+</span>
                    <kbd className="kbd-key">2</kbd>
                  </div>
                </div>

                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Inbound Manifests</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd className="kbd-key">Alt</kbd>
                    <span style={{ color: 'var(--text3)', fontSize: 11 }}>+</span>
                    <kbd className="kbd-key">3</kbd>
                  </div>
                </div>

                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Supplier Directory</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd className="kbd-key">Alt</kbd>
                    <span style={{ color: 'var(--text3)', fontSize: 11 }}>+</span>
                    <kbd className="kbd-key">4</kbd>
                  </div>
                </div>

                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Purchase Order History</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd className="kbd-key">Alt</kbd>
                    <span style={{ color: 'var(--text3)', fontSize: 11 }}>+</span>
                    <kbd className="kbd-key">5</kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Table & Row Navigation */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: 8 }}>
                Table Navigation &amp; Selection (All Pages)
              </div>
              <div className="kbd-shortcut-list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Move row focus up / down</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd className="kbd-key">↑</kbd>
                    <kbd className="kbd-key">↓</kbd>
                    <span style={{ color: 'var(--text3)', fontSize: 11, margin: '0 2px' }}>or</span>
                    <kbd className="kbd-key">Tab</kbd>
                    <kbd className="kbd-key">⇧ Tab</kbd>
                  </div>
                </div>

                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Select row / Toggle checkbox / Expand</span>
                  <kbd className="kbd-key">Space</kbd>
                </div>

                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Edit item / View details / Confirm edit</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd className="kbd-key">Enter</kbd>
                    <span style={{ color: 'var(--text3)', fontSize: 11, margin: '0 2px' }}>or</span>
                    <kbd className="kbd-key">F2</kbd>
                  </div>
                </div>

                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Jump to first / last row</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd className="kbd-key">Home</kbd>
                    <kbd className="kbd-key">End</kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Global Commands */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: 8 }}>
                Global Commands &amp; Dialogs
              </div>
              <div className="kbd-shortcut-list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Focus global catalog search</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd className="kbd-key">Ctrl</kbd>
                    <span style={{ color: 'var(--text3)', fontSize: 11 }}>+</span>
                    <kbd className="kbd-key">K</kbd>
                  </div>
                </div>

                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Save inline quantity edit / Save draft</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd className="kbd-key">Ctrl</kbd>
                    <span style={{ color: 'var(--text3)', fontSize: 11 }}>+</span>
                    <kbd className="kbd-key">S</kbd>
                  </div>
                </div>

                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Toggle shortcuts navigation dialog</span>
                  <kbd className="kbd-key">?</kbd>
                </div>

                <div className="kbd-shortcut-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>Dismiss active modal / blur focus</span>
                  <kbd className="kbd-key">Esc</kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer info-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--border-light)' }}>
            <Button
              variant="primary"
              onClick={onClose}
              style={{ minWidth: 90 }}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

KeyboardShortcutsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
