import { useEffect, useRef } from 'react';

/**
 * Universal Global Keyboard Navigation & Page Navigation Hook
 *
 * Provides consistent keyboard controls across the entire StockDesk application:
 * - Alt + 1: Executive Dashboard
 * - Alt + 2: Replenishment Desk
 * - Alt + 3: Inbound Manifests
 * - Alt + 4: Supplier Directory
 * - Alt + 5: PO History
 * - Ctrl + K / Cmd + K: Focus global search
 * - ?: Toggle Keyboard Shortcuts reference dialog
 * - Esc: Close active modal or blur search
 * - Table row navigation (Up/Down, Tab, Home, End, Enter, Space)
 */
export default function useGlobalNavigationShortcuts({
  onNavigateTo,
  onNavigateBack,
  searchInputRef,
  shortcutsModalOpen,
  setShortcutsModalOpen,
  isAnyModalOpen = false,
  onEscape,
  // Table navigation props
  itemsCount = 0,
  focusedIndex,
  setFocusedIndex,
  onEnter,
  onSpace,
  tableRef,
}) {
  const handlerRef = useRef();

  useEffect(() => {
    handlerRef.current = (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

      // ── 1. Page Switching Keybindings: Alt + 1..5 ──────────────────────────
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          onNavigateTo?.('dashboard');
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          onNavigateTo?.('replenishment');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          onNavigateTo?.('manifests');
          return;
        }
        if (e.key === '4') {
          e.preventDefault();
          onNavigateTo?.('suppliers');
          return;
        }
        if (e.key === '5') {
          e.preventDefault();
          onNavigateTo?.('history');
          return;
        }
      }

      // ── 2. Global Search: Ctrl+K / Cmd+K ──────────────────────────────────
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInputRef?.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select?.();
        }
        return;
      }

      // ── 3. Toggle Shortcuts Modal: ? ──────────────────────────────────────
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShortcutsModalOpen?.((prev) => !prev);
        return;
      }

      // ── 4. Dismiss Key: Escape ────────────────────────────────────────────
      if (e.key === 'Escape') {
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
          return;
        }
        if (onEscape && onEscape()) {
          return;
        }
        if (searchInputRef?.current && document.activeElement === searchInputRef.current) {
          searchInputRef.current.blur();
          return;
        }
        if (onNavigateBack) {
          onNavigateBack();
          return;
        }
      }

      // ── 5. Table Navigation (Arrow Keys, Home, End, Enter, Space) ───────────
      // NOTE: Tab and Shift+Tab are NOT intercepted to preserve universal browser accessibility standards
      if (isInput || shortcutsModalOpen || isAnyModalOpen) {
        return;
      }

      if (itemsCount <= 0 || !setFocusedIndex) {
        return;
      }

      const isInteractive = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName);
      const isInsideTable = tableRef?.current?.contains(e.target);

      // If user is focused on a button or link with Tab, let native Enter/Space click that element
      if (isInteractive && (e.key === ' ' || e.key === 'Enter')) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          if (prev === null || prev === undefined || prev < 0 || prev >= itemsCount - 1) {
            return 0;
          }
          return prev + 1;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          if (prev === null || prev === undefined || prev <= 0 || prev >= itemsCount) {
            return itemsCount - 1;
          }
          return prev - 1;
        });
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setFocusedIndex(itemsCount - 1);
      } else if (e.key === 'Enter') {
        if (onEnter && isInsideTable) {
          e.preventDefault();
          const targetIndex = (focusedIndex >= 0 && focusedIndex < itemsCount) ? focusedIndex : 0;
          onEnter(targetIndex);
        }
      } else if (e.key === ' ') {
        if (onSpace && isInsideTable) {
          if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') return;
          e.preventDefault();
          const targetIndex = (focusedIndex >= 0 && focusedIndex < itemsCount) ? focusedIndex : 0;
          onSpace(targetIndex);
        }
      }
    };
  });

  useEffect(() => {
    const handleKeyDown = (e) => handlerRef.current?.(e);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
