import { useEffect, useRef } from 'react';

/**
 * Custom hook managing global keyboard navigation and shortcut keybindings for the Replenishment Desk.
 */
export default function useReplenishmentShortcuts({
  searchInputRef,
  tableRef,
  paginatedProducts = [],
  focusedRowIndex,
  setFocusedRowIndex,
  setNavMode,
  handlePromptSaveDraft,
  shortcutsModalOpen,
  setShortcutsModalOpen,
  confirmModalConfig,
  setConfirmModalConfig,
  saveAllModalOpen,
  setSaveAllModalOpen,
  reorderConfirmProd,
  setReorderConfirmProd,
  manifestsModalOpen,
  setManifestsModalOpen,
  poHistoryModalOpen,
  setPoHistoryModalOpen,
  contactModalOpen,
  setContactModalOpen,
  filterModalOpen,
  setFilterModalOpen,
  addProductModalOpen,
  setAddProductModalOpen,
  addSupplierModalOpen,
  setAddSupplierModalOpen,
  showUnsavedModal,
  cancelDiscardUnsaved,
  editingSku,
  setEditingSku,
  handleCancelCurrentInlineQty,
  handleToggleSelect,
  pendingQtyEdits = {},
  setEditQtyValue,
  setInlineQtyError,
  setIsUnsaved,
}) {
  const handleGlobalKeyDownRef = useRef();

  useEffect(() => {
    handleGlobalKeyDownRef.current = (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

      // Windows Ctrl+K (or Mac Cmd+K) to focus global search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select?.();
        return;
      }

      // Windows Ctrl+S (or Mac Cmd+S) to save draft with SQLite confirmation
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handlePromptSaveDraft?.();
        return;
      }

      // Question mark (?) to toggle keyboard shortcuts modal when not in an input
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // Escape key handler: dismiss open modals, blur search, or cancel active inline edit
      if (e.key === 'Escape') {
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
          return;
        }
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
          return;
        }
        if (confirmModalConfig) {
          setConfirmModalConfig(null);
          return;
        }
        if (saveAllModalOpen) {
          setSaveAllModalOpen(false);
          return;
        }
        if (reorderConfirmProd) {
          setReorderConfirmProd(null);
          return;
        }
        if (manifestsModalOpen) {
          setManifestsModalOpen(false);
          return;
        }
        if (poHistoryModalOpen) {
          setPoHistoryModalOpen(false);
          return;
        }
        if (contactModalOpen) {
          setContactModalOpen(false);
          return;
        }
        if (filterModalOpen) {
          setFilterModalOpen(false);
          return;
        }
        if (addProductModalOpen) {
          setAddProductModalOpen(false);
          return;
        }
        if (addSupplierModalOpen) {
          setAddSupplierModalOpen(false);
          return;
        }
        if (showUnsavedModal) {
          cancelDiscardUnsaved?.();
          return;
        }
        if (editingSku) {
          handleCancelCurrentInlineQty?.();
          return;
        }
      }

      // Check if any modal is open - if so, don't hijack keys for table navigation
      const isAnyModalOpen =
        shortcutsModalOpen ||
        Boolean(confirmModalConfig) ||
        saveAllModalOpen ||
        Boolean(reorderConfirmProd) ||
        manifestsModalOpen ||
        poHistoryModalOpen ||
        contactModalOpen ||
        filterModalOpen ||
        addProductModalOpen ||
        addSupplierModalOpen ||
        showUnsavedModal;

      if (isAnyModalOpen) return;

      // If active inside an input (like search), don't hijack table navigation keys
      if (isInput) return;

      // If focused on an external button (e.g. Add Product, Filter, Theme), let Enter/Space activate that button
      const isButton = e.target.tagName === 'BUTTON';
      const isInsideTable = tableRef.current?.contains(e.target);
      if (isButton && !isInsideTable && (e.key === ' ' || e.key === 'Enter')) {
        return;
      }

      // Table navigation: Arrow Keys (↑ / ↓) or Tab, Space, Enter, Home, End
      if (paginatedProducts.length === 0) return;

      const isTabForward = e.key === 'Tab' && !e.shiftKey;
      const isTabBackward = e.key === 'Tab' && e.shiftKey;

      if (e.key === 'ArrowDown' || isTabForward) {
        e.preventDefault();
        setNavMode('keyboard');
        setFocusedRowIndex((prev) => {
          if (prev === null || prev === undefined || prev < 0 || prev >= paginatedProducts.length - 1) {
            return 0;
          }
          return prev + 1;
        });
      } else if (e.key === 'ArrowUp' || isTabBackward) {
        e.preventDefault();
        setNavMode('keyboard');
        setFocusedRowIndex((prev) => {
          if (prev === null || prev === undefined || prev <= 0 || prev >= paginatedProducts.length) {
            return paginatedProducts.length - 1;
          }
          return prev - 1;
        });
      } else if (e.key === ' ') {
        if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
          return;
        }
        e.preventDefault();
        const targetIndex = (focusedRowIndex >= 0 && focusedRowIndex < paginatedProducts.length) ? focusedRowIndex : 0;
        const current = paginatedProducts[targetIndex];
        if (current && current.orderStatus !== 'ordered') {
          handleToggleSelect(current.id);
        }
      } else if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        const targetIndex = (focusedRowIndex >= 0 && focusedRowIndex < paginatedProducts.length) ? focusedRowIndex : 0;
        const current = paginatedProducts[targetIndex];
        if (current && current.orderStatus !== 'ordered') {
          setEditingSku(current.sku);
          const hasPending = pendingQtyEdits[current.sku] !== undefined;
          const pendingVal = pendingQtyEdits[current.sku];
          setEditQtyValue(hasPending ? pendingVal : String(current.orderQty));
          setInlineQtyError(null);
          setIsUnsaved(false);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        setNavMode('keyboard');
        setFocusedRowIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setNavMode('keyboard');
        setFocusedRowIndex(paginatedProducts.length - 1);
      }
    };
  });

  useEffect(() => {
    const handleKeyDown = (e) => handleGlobalKeyDownRef.current?.(e);
    const handleMouseMove = () => {
      setNavMode((prev) => (prev === 'keyboard' ? 'mouse' : prev));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [setNavMode]);
}
