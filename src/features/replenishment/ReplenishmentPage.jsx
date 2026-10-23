import { useState, useMemo, useEffect, useRef, useDeferredValue, useCallback, memo } from 'react';
import '../../styles/replenishment.css';
import {
  fetchSuppliers,
  fetchInventory,
  fetchCategories,
  fetchSupplierContact,
  fetchPendingManifests,
  fetchPOHistory,
  batchUpdateOrderQuantities,
  fetchReorderAcknowledgements,
  saveReorderAcknowledgement,
  saveAppSetting,
  toggleItemSelection,
  clearAllSelection,
  applySupplierMinimums as applySupplierMinimumsDB,
  saveDraftPO,
  submitPurchaseOrder,
  deletePurchaseOrder,
} from '../../db/queries.js';
import {
  validateSupplierMoq,
  groupSelectedBySupplier,
} from '../../utils/supplierValidation.js';
import FilterModal from './FilterModal.jsx';
import { matchesFilters } from '../../utils/filterRules.js';
import AddProductModal from './AddProductModal.jsx';
import AddSupplierModal from './AddSupplierModal.jsx';
import mainLogo from '../../assets/logos/main-logo.png';
import { SUPPLIER_LOGOS } from '../../utils/supplierLogos.js';
import { validateOrderQtyInput, sanitizeIntegerInput } from '../../utils/validation.js';
import { ThemeSwitcher, StatusBadge, KeyboardShortcutsModal, Modal, Button } from '../../components/ui';
import {
  ReplenishmentTopbar,
  SupplierQueueRail,
  OrderDraftPanel,
  SupplierContactModal,
  PendingManifestsModal,
  POHistoryModal,
} from './components';

// Helper currency formatter
const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

// ── Memoized Table Row Component (React.memo - Group B Production Standard) ──
const MemoizedProductRow = memo(function ProductRow({
  prod,
  pageIdx,
  isRowFocused,
  isOrdered,
  hasPendingEdit,
  pendingVal,
  displayQty,
  numericQty,
  lineSubtotal,
  isEditingThis,
  supName,
  supLogo,
  badgeType,
  badgeLabel,
  editQtyValue,
  inlineQtyError,
  onToggleSelect,
  onRowHover,
  onRowFocus,
  onRowClick,
  onStartEdit,
  onInlineQtyChange,
  onCommitInlineQty,
  onCancelInlineQty,
  onNavigateNext,
  onNavigatePrev,
}) {
  return (
    <tr
      key={prod.id}
      data-row-index={pageIdx}
      className={`pr ${prod.selected ? 'sel' : ''} ${isRowFocused ? 'focused' : ''} ${isOrdered ? 'is-ordered' : ''} ${hasPendingEdit ? 'has-pending' : ''}`}
      tabIndex={0}
      onMouseEnter={() => onRowHover(pageIdx)}
      onFocus={() => onRowFocus(pageIdx)}
      onClick={() => onRowClick(pageIdx)}
    >
      <td className="col-chk">
        <input
          type="checkbox"
          className="cb"
          checked={!!prod.selected}
          onChange={() => onToggleSelect(prod.id)}
          aria-label={`Select ${prod.name}`}
          tabIndex={-1}
        />
      </td>
      <td className="col-id">
        <span className="prod-id-code">{prod.id}</span>
      </td>
      <td className="col-sku">
        <span className="sku-lbl">{prod.sku}</span>
      </td>
      <td className="col-name">
        <div className="prod-name">{prod.name}</div>
      </td>
      <td className="col-sup">
        <div className="sup-cell-content">
          {supLogo && (
            <img
              src={supLogo}
              alt=""
              className="sup-cell-logo"
            />
          )}
          <span className="sup-cell-name" title={supName}>
            {supName}
          </span>
        </div>
      </td>
      <td className="col-cat">
        <span className="cat-cell-tag">{prod.category}</span>
      </td>
      <td className="col-stk">{prod.currentStock}</td>
      <td className="col-tgt">{prod.safetyTarget}</td>
      <td className="col-st">
        <StatusBadge status={badgeType} label={badgeLabel} />
      </td>
      <td className="col-qty">
        {isEditingThis ? (
          <div className="qty-wrap">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`qty-inp ${inlineQtyError ? 'has-error' : ''}`}
              value={editQtyValue}
              onChange={(e) => onInlineQtyChange(e.target.value)}
              onBlur={() => onCommitInlineQty(prod.sku)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCommitInlineQty(prod.sku);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  onCancelInlineQty();
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  const success = onCommitInlineQty(prod.sku);
                  if (success) {
                    if (e.shiftKey) {
                      onNavigatePrev(pageIdx);
                    } else {
                      onNavigateNext(pageIdx);
                    }
                  }
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  const success = onCommitInlineQty(prod.sku);
                  if (success) {
                    onNavigateNext(pageIdx);
                  }
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  const success = onCommitInlineQty(prod.sku);
                  if (success) {
                    onNavigatePrev(pageIdx);
                  }
                }
              }}
              autoFocus
              aria-label="Order Quantity"
              aria-invalid={!!inlineQtyError}
              aria-describedby={inlineQtyError ? `inline-qty-err-${prod.sku}` : undefined}
            />
            {inlineQtyError && (
              <div
                id={`inline-qty-err-${prod.sku}`}
                className="field-error inline-qty-error"
                role="alert"
                style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px', whiteSpace: 'nowrap' }}
              >
                {inlineQtyError}
              </div>
            )}
          </div>
        ) : (
          <div className="qty-cell-content" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              tabIndex={-1}
              className={`qty-disp ${numericQty === 0 ? 'qty-zero' : ''} ${hasPendingEdit ? 'qty-pending' : ''}`}
              onClick={() => onStartEdit(pageIdx, prod.sku, hasPendingEdit ? pendingVal : String(prod.orderQty))}
              title="Click to edit quantity"
            >
              {displayQty}
            </button>
            {hasPendingEdit && (
              <span className="qty-unsaved-badge" title="Pending unsaved change (click Save All to commit)">
                Unsaved
              </span>
            )}
          </div>
        )}
      </td>
      <td className="col-prc">
        {formatCurrency(prod.unitCost)}
      </td>
      <td className="col-sub">
        {formatCurrency(lineSubtotal)}
      </td>
    </tr>
  );
});

export default function ReplenishmentPage({
  onNavigateToManifests,
  onNavigateToSuppliers,
  initialSupplierFilter,
  themePreference: propThemePreference,
  onThemeChange: propOnThemeChange,
}) {
  // Genuine application load & error states
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // URL Query State Management (?state=empty | ?state=loading | ?state=error)
  const [urlStateParam, setUrlStateParam] = useState(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('state');
  });

  // Responsive screen width tracking for cross-device support (optimized with rAF to eliminate lag during drag)
  const [windowWidth, setWindowWidth] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1280;
  });

  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      setUrlStateParam(sp.get('state'));
    };

    let rAF = null;
    let lastWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;

    const handleResize = () => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        const cur = window.innerWidth;
        const crossed768 = (lastWidth < 768 && cur >= 768) || (lastWidth >= 768 && cur < 768);
        const crossed992 = (lastWidth < 992 && cur >= 992) || (lastWidth >= 992 && cur < 992);
        if (crossed768 || crossed992 || Math.abs(cur - lastWidth) >= 8) {
          lastWidth = cur;
          setWindowWidth(cur);
        }
      });
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      if (rAF) cancelAnimationFrame(rAF);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Active supplier & search
  const [selectedSupplierId, setSelectedSupplierId] = useState(() => initialSupplierFilter || 'hf');
  const [activeQueueSupplierId, setActiveQueueSupplierId] = useState(() => initialSupplierFilter || null);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Advanced Filter Modal State
  const [appliedFilters, setAppliedFilters] = useState({
    statuses: [],
    suppliers: [],
    categories: [],
    search: '',
  });
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [addSupplierModalOpen, setAddSupplierModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Pending inline quantity edits: { [sku]: string }
  const [pendingQtyEdits, setPendingQtyEdits] = useState({});
  const [saveAllModalOpen, setSaveAllModalOpen] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveAllError, setSaveAllError] = useState(null);

  // Column-level dropdown filters (Supplier, Category, Status, Subtotal)
  const [colFilters, setColFilters] = useState({
    supplierId: '',
    category: '',
    status: '',
    subtotalSort: '',
  });

  const activeColFilterCount = useMemo(() => {
    return Object.values(colFilters).filter((v) => Boolean(v && String(v).trim())).length;
  }, [colFilters]);

  const handleClearColFilters = () => {
    setColFilters({
      supplierId: '',
      category: '',
      status: '',
      subtotalSort: '',
    });
  };

  // Reorder confirmation state for ordered products
  const [reorderConfirmProd, setReorderConfirmProd] = useState(null);
  const [acknowledgedReorders, setAcknowledgedReorders] = useState(new Set());

  // Profile and Theme Preference State
  const [localThemePreference, setLocalThemePreference] = useState(() => {
    return localStorage.getItem('stockdesk_theme') || 'system';
  });
  const themePreference = propThemePreference || localThemePreference;

  // Mobile View Mode ('matrix' | 'draft')
  const [mobileView, setMobileView] = useState('matrix');

  // Mobile matrix 3-dots actions menu state
  const [mobileMatrixMenuOpen, setMobileMatrixMenuOpen] = useState(false);
  const mobileMatrixMenuRef = useRef(null);

  useEffect(() => {
    if (!mobileMatrixMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (mobileMatrixMenuRef.current && !mobileMatrixMenuRef.current.contains(e.target)) {
        setMobileMatrixMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [mobileMatrixMenuOpen]);


  // Multi-Supplier PO Draft Queue Accordions State
  const [expandedDraftSupplierIds, setExpandedDraftSupplierIds] = useState(() => new Set());

  const toggleDraftAccordion = (supplierId) => {
    setExpandedDraftSupplierIds((prev) => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  };

  // Categories list from SQLite
  const [categories, setCategories] = useState([]);

  // SQLite Backed State
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  // Expandable & Collapsible Side Panels State (Horizontal side positions)
  const [sqExpanded, setSqExpanded] = useState(false);
  const [draftExpanded, setDraftExpanded] = useState(false);

  // Supplier Quick-Action Modals State
  const [manifestsModalOpen, setManifestsModalOpen] = useState(false);
  const [manifestsList, setManifestsList] = useState([]);
  const [poHistoryModalOpen, setPoHistoryModalOpen] = useState(false);
  const [poHistoryList, setPoHistoryList] = useState([]);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactData, setContactData] = useState(null);

  // Keyboard Shortcuts Navigation Reference Modal
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // State-Changing Confirmation Modal
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Inline editing state
  const [editingSku, setEditingSku] = useState(null);
  const [editQtyValue, setEditQtyValue] = useState('0');
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [inlineQtyError, setInlineQtyError] = useState(null);

  // Unsaved quantity changes modal
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState(null);

  // Keyboard navigation vs mouse hover interaction mode
  const [navMode, setNavMode] = useState('mouse'); // 'mouse' | 'keyboard'
  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const searchInputRef = useRef(null);
  const tableRef = useRef(null);
  const tblWrapRef = useRef(null);
  const [tableScrollTop, setTableScrollTop] = useState(0);
  const [tableViewportHeight, setTableViewportHeight] = useState(600);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── 1. Initialize SQLite Database & Load Authoritative Data ───────────────────
  const loadSQLiteData = async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const [sups, prods, cats, acks] = await Promise.all([
        fetchSuppliers(),
        fetchInventory(),
        fetchCategories(),
        fetchReorderAcknowledgements(),
      ]);
      if (sups && sups.length > 0) setSuppliers(sups);
      if (prods && prods.length > 0) setProducts(prods);
      if (cats && cats.length > 0) setCategories(cats);
      if (acks && acks.length > 0) setAcknowledgedReorders(new Set(acks));
    } catch (err) {
      console.error('[App] SQLite Data Loading Error:', err);
      setDbError(err?.message || 'Unable to load replenishment data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [sups, prods, cats, acks] = await Promise.all([
          fetchSuppliers(),
          fetchInventory(),
          fetchCategories(),
          fetchReorderAcknowledgements(),
        ]);
        if (!active) return;
        if (sups && sups.length > 0) setSuppliers(sups);
        if (prods && prods.length > 0) {
          setProducts(prods);
          if (prods.some((p) => p.selected && p.orderStatus !== 'ordered')) {
            setSqExpanded(true);
            setDraftExpanded(true);
          }
        }
        if (cats && cats.length > 0) setCategories(cats);
        if (acks && acks.length > 0) setAcknowledgedReorders(new Set(acks));
      } catch (err) {
        if (!active) return;
        console.error('[App] SQLite Data Loading Error:', err);
        setDbError(err?.message || 'Unable to load replenishment data');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Refresh inventory on window focus (e.g. after marking delivered in manifests tab/window)
  useEffect(() => {
    const handleWindowFocus = async () => {
      try {
        const refreshed = await fetchInventory();
        if (refreshed && refreshed.length > 0) setProducts(refreshed);
      } catch {
        // Ignore background refresh errors
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  // Theme application and synchronization with system preference
  useEffect(() => {
    const applyTheme = (theme) => {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      }
    };

    applyTheme(themePreference);

    if (themePreference === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themePreference]);

  const handleSelectTheme = async (newTheme) => {
    if (propOnThemeChange) {
      await propOnThemeChange(newTheme);
    } else {
      setLocalThemePreference(newTheme);
      localStorage.setItem('stockdesk_theme', newTheme);
      const root = document.documentElement;
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const resolved = newTheme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : newTheme;
      root.setAttribute('data-theme', resolved);
      try {
        await saveAppSetting('theme_preference', newTheme);
      } catch (e) {
        console.warn('Failed to save theme setting to SQLite:', e);
      }
    }
  };

  // Safe action check: prompt confirmation modal if inline changes are unsaved
  const requestActionWithUnsavedCheck = useCallback((action) => {
    if (isUnsaved && editingSku) {
      setPendingAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  }, [isUnsaved, editingSku]);

  const confirmDiscardUnsaved = () => {
    const original = products.find((p) => p.sku === editingSku);
    if (original) {
      setEditQtyValue(String(original.orderQty));
    }
    setEditingSku(null);
    setIsUnsaved(false);
    setShowUnsavedModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    showToast('Unsaved changes discarded.');
  };

  const cancelDiscardUnsaved = () => {
    setShowUnsavedModal(false);
    setPendingAction(null);
  };

  // Suppliers map for fast O(1) lookups
  const suppliersMap = useMemo(() => {
    const map = {};
    suppliers.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [suppliers]);

  // Active supplier object
  const currentSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0] || null;
  }, [suppliers, selectedSupplierId]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.statuses?.length) count += appliedFilters.statuses.length;
    if (appliedFilters.suppliers?.length) {
      count += appliedFilters.suppliers.length;
    } else if (activeQueueSupplierId) {
      count += 1;
    }
    if (appliedFilters.categories?.length) count += appliedFilters.categories.length;
    if (appliedFilters.search?.trim()) count += 1;
    count += activeColFilterCount;
    return count;
  }, [appliedFilters, activeQueueSupplierId, activeColFilterCount]);

  const hasActiveFilters = activeFilterCount > 0;

  // Filter products using queue supplier filter + global search + advanced filter rules + column-level filters (AND across groups, OR within group)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Supplier filter from Supplier Queue selection (only if modal filter has no explicit supplier filter)
      if (activeQueueSupplierId && (!appliedFilters.suppliers || appliedFilters.suppliers.length === 0)) {
        if (p.supplierId !== activeQueueSupplierId) {
          return false;
        }
      }
      // 2. Global search across SKU, product name, supplier name, category, and ID (deferred for 120 FPS typing)
      if (deferredSearchTerm.trim()) {
        const q = deferredSearchTerm.trim().toLowerCase();
        const supName = suppliersMap[p.supplierId]?.name?.toLowerCase() || '';
        const match =
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.id && p.id.toLowerCase().includes(q)) ||
          supName.includes(q);
        if (!match) return false;
      }
      // 3. Applied modal filters
      if (!matchesFilters(p, appliedFilters)) {
        return false;
      }

      // 4. Desktop column-level filters (Supplier, Category, Status)
      if (colFilters.supplierId && p.supplierId !== colFilters.supplierId) {
        return false;
      }
      if (colFilters.category && p.category !== colFilters.category) {
        return false;
      }
      if (colFilters.status) {
        const pStatus = p.priority || p.status;
        if (pStatus !== colFilters.status) {
          return false;
        }
      }

      return true;
    });
  }, [products, appliedFilters, deferredSearchTerm, activeQueueSupplierId, suppliersMap, colFilters]);

  // Display ordering: Subtotal (high to low / low to high) or default ascending Product ID
  const displayProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (colFilters.subtotalSort === 'high') {
      return list.sort((a, b) => {
        const qtyA = Number(pendingQtyEdits[a.sku] !== undefined ? pendingQtyEdits[a.sku] : a.orderQty) || 0;
        const qtyB = Number(pendingQtyEdits[b.sku] !== undefined ? pendingQtyEdits[b.sku] : b.orderQty) || 0;
        return (qtyB * b.unitCost) - (qtyA * a.unitCost);
      });
    }
    if (colFilters.subtotalSort === 'low') {
      return list.sort((a, b) => {
        const qtyA = Number(pendingQtyEdits[a.sku] !== undefined ? pendingQtyEdits[a.sku] : a.orderQty) || 0;
        const qtyB = Number(pendingQtyEdits[b.sku] !== undefined ? pendingQtyEdits[b.sku] : b.orderQty) || 0;
        return (qtyA * a.unitCost) - (qtyB * b.unitCost);
      });
    }
    return list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
  }, [filteredProducts, colFilters.subtotalSort, pendingQtyEdits]);

  // Derived effective application states (supporting ?state=loading | ?state=empty | ?state=error)
  const isEffectiveLoading = urlStateParam === 'loading' || isLoading;
  const effectiveDbError = urlStateParam === 'error' ? (dbError || 'Simulated Database Error (active via ?state=error)') : dbError;
  const isEffectiveEmpty = !isEffectiveLoading && !effectiveDbError && (urlStateParam === 'empty' || displayProducts.length === 0);
  const isEffectiveHasResults = !isEffectiveLoading && !effectiveDbError && !isEffectiveEmpty && displayProducts.length > 0;

  // Synchronize URL query parameter (?state=loading | ?state=error | ?state=empty)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let targetState = null;

    if (isEffectiveLoading) {
      targetState = 'loading';
    } else if (effectiveDbError) {
      targetState = 'error';
    } else if (isEffectiveEmpty) {
      targetState = 'empty';
    }

    const currentParam = url.searchParams.get('state');
    if (targetState) {
      if (currentParam !== targetState) {
        url.searchParams.set('state', targetState);
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
      }
    } else {
      if (currentParam) {
        url.searchParams.delete('state');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
      }
    }
  }, [isEffectiveLoading, effectiveDbError, isEffectiveEmpty]);

  // Total items and pagination calculations
  const totalItems = displayProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Auto-reset page 1 on filter/search change and clamp page when totalPages shrinks (during render)
  const [prevFilterKey, setPrevFilterKey] = useState('');
  const currentFilterKey = `${searchTerm}::${activeQueueSupplierId}::${JSON.stringify(appliedFilters)}::${JSON.stringify(colFilters)}`;
  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setCurrentPage(1);
  } else if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Sliced data for current page view
  const paginatedProducts = useMemo(() => {
    return displayProducts.slice(startIndex, endIndex);
  }, [displayProducts, startIndex, endIndex]);

  // ── Virtualization Calculation (Group C - Windowing) ────────────────────────
  const ROW_HEIGHT = 42; // px per desktop table row
  const OVERSCAN = 6;    // buffer rows above and below visible viewport

  const isVirtualized = paginatedProducts.length > 15;
  const totalPageRows = paginatedProducts.length;

  const { virtualStartIndex, virtualEndIndex, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    if (!isVirtualized) {
      return {
        virtualStartIndex: 0,
        virtualEndIndex: totalPageRows,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };
    }
    const start = Math.max(0, Math.floor(tableScrollTop / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(tableViewportHeight / ROW_HEIGHT);
    const end = Math.min(totalPageRows, start + visibleCount + OVERSCAN * 2);

    return {
      virtualStartIndex: start,
      virtualEndIndex: end,
      topSpacerHeight: start * ROW_HEIGHT,
      bottomSpacerHeight: Math.max(0, (totalPageRows - end) * ROW_HEIGHT),
    };
  }, [isVirtualized, totalPageRows, tableScrollTop, tableViewportHeight]);

  const visibleProducts = useMemo(() => {
    if (!isVirtualized) return paginatedProducts;
    return paginatedProducts.slice(virtualStartIndex, virtualEndIndex);
  }, [isVirtualized, paginatedProducts, virtualStartIndex, virtualEndIndex]);

  // Stable row interaction callbacks for MemoizedProductRow
  const handleRowHover = useCallback((pageIdx) => {
    if (navMode === 'keyboard') setNavMode('mouse');
    setFocusedRowIndex(pageIdx);
  }, [navMode]);

  const handleRowFocus = useCallback((pageIdx) => {
    setFocusedRowIndex(pageIdx);
  }, []);

  const handleRowClick = useCallback((pageIdx) => {
    if (navMode === 'keyboard') setNavMode('mouse');
    setFocusedRowIndex(pageIdx);
  }, [navMode]);

  const handleStartEdit = useCallback((pageIdx, sku, initialVal) => {
    setFocusedRowIndex(pageIdx);
    setEditingSku(sku);
    setEditQtyValue(initialVal);
    setInlineQtyError(null);
  }, []);

  const handleNavigateNextRow = useCallback(() => {
    setFocusedRowIndex((prev) => {
      const total = paginatedProducts.length;
      if (total <= 0) return 0;
      return prev >= total - 1 ? 0 : prev + 1;
    });
  }, [paginatedProducts.length]);

  const handleNavigatePrevRow = useCallback(() => {
    setFocusedRowIndex((prev) => {
      const total = paginatedProducts.length;
      if (total <= 0) return 0;
      return prev <= 0 ? total - 1 : prev - 1;
    });
  }, [paginatedProducts.length]);

  // Safe page navigation with unsaved changes confirmation
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    requestActionWithUnsavedCheck(() => {
      setCurrentPage(newPage);
      setFocusedRowIndex(0);
    });
  };

  const handlePageSizeChange = (newSize) => {
    const size = Number(newSize);
    requestActionWithUnsavedCheck(() => {
      setPageSize(size);
      setCurrentPage(1);
      setFocusedRowIndex(0);
    });
  };

  // Page numbers list with ellipsis for responsive pagination
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  // Selected products across all suppliers (preserved across pages)
  // Selected products across all suppliers (preserved across pages, including reordered items)
  const selectedProducts = useMemo(() => {
    return products.filter((p) => p.selected);
  }, [products]);

  // Supplier Queue: shows suppliers so user can inspect and filter by any supplier at any time
  const activeQueueSuppliers = useMemo(() => {
    return suppliers;
  }, [suppliers]);

  // Ensure selectedSupplierId points to an active supplier in queue if available
  useEffect(() => {
    if (activeQueueSuppliers.length > 0) {
      if (!activeQueueSuppliers.some((s) => s.id === selectedSupplierId)) {
        const timer = setTimeout(() => {
          setSelectedSupplierId(activeQueueSuppliers[0].id);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [activeQueueSuppliers, selectedSupplierId]);

  // All selected products with quantity > 0 across all suppliers
  const allSelectedItems = useMemo(() => {
    return products.filter((p) => p.selected && p.orderQty > 0);
  }, [products]);

  const overallTotalAmount = useMemo(() => {
    return allSelectedItems.reduce((acc, p) => acc + p.orderQty * p.unitCost, 0);
  }, [allSelectedItems]);

  // Selected products grouped by supplier for Review Summary
  const selectedSupplierGroups = useMemo(() => {
    return groupSelectedBySupplier(allSelectedItems, suppliers);
  }, [allSelectedItems, suppliers]);

  // Eligible products on current page vs whole filtered set
  const eligiblePageProducts = useMemo(() => {
    return paginatedProducts.filter((p) => p.orderStatus !== 'ordered');
  }, [paginatedProducts]);

  const eligibleFilteredProducts = useMemo(() => {
    return displayProducts.filter((p) => p.orderStatus !== 'ordered');
  }, [displayProducts]);

  const isPageAllSelected = eligiblePageProducts.length > 0 && eligiblePageProducts.every((p) => p.selected);
  const isPageSomeSelected = eligiblePageProducts.some((p) => p.selected) && !isPageAllSelected;

  const isAllFilteredSelected = eligibleFilteredProducts.length > 0 && eligibleFilteredProducts.every((p) => p.selected);

  // Accessible Collapse Handlers: Safely transfer focus to expand buttons before collapsing to prevent aria-hidden descendant focus conflicts
  const handleCollapseSq = () => {
    document.getElementById('btn-collapse-sq')?.blur();
    document.getElementById('btn-expand-sq')?.focus();
    setSqExpanded(false);
  };

  const handleCollapseDraft = () => {
    document.getElementById('btn-collapse-draft')?.blur();
    document.getElementById('btn-expand-draft')?.focus();
    setDraftExpanded(false);
  };

  // Horizontal grid column definition aligned with standard Bootstrap 5 Breakpoints:
  // xs (<576px) & sm (576px-767px): Mobile single column flow with overlay drawers
  // md (768px-991px): Tablet adaptive layout
  // lg (992px-1199px): Compact desktop & laptop layout
  // xl (1200px-1399px) & xxl (>=1400px): Full desktop layout
  const gridColumns = useMemo(() => {
    const isMobile = windowWidth < 768; // Bootstrap xs & sm (<768px)
    const isTablet = windowWidth >= 768 && windowWidth < 992; // Bootstrap md (768px - 991px)
    const isLaptop = windowWidth >= 992 && windowWidth < 1200; // Bootstrap lg (992px - 1199px)

    if (isMobile) {
      // Mobile viewports: table gets 100% full width; sidebars open as slide-over drawers
      return undefined;
    }
    if (isTablet) {
      // Tablet (md): Compact rails with 1fr table
      const col1 = '44px';
      const col2 = sqExpanded ? '190px' : '40px';
      const col3 = '1fr';
      const col4 = draftExpanded ? '240px' : '40px';
      return `${col1} ${col2} ${col3} ${col4}`;
    }
    if (isLaptop) {
      // Laptop / Small Desktop (lg): Moderate panel widths
      const col1 = '48px';
      const col2 = sqExpanded ? '230px' : '44px';
      const col3 = '1fr';
      const col4 = draftExpanded ? '280px' : '44px';
      return `${col1} ${col2} ${col3} ${col4}`;
    }
    // Standard and Wide Desktops (xl >= 1200px & xxl >= 1400px)
    const col1 = '52px';
    const col2 = sqExpanded ? '260px' : '44px';
    const col3 = '1fr';
    const col4 = draftExpanded ? '320px' : '44px';
    return `${col1} ${col2} ${col3} ${col4}`;
  }, [sqExpanded, draftExpanded, windowWidth]);

  // ── Database Mutation Handlers (Selection Protected by Unsaved Checks) ──────

  // Toggle selection for current visible page
  const handleToggleSelectPage = () => {
    requestActionWithUnsavedCheck(async () => {
      const nextVal = !isPageAllSelected;
      const eligibleIds = eligiblePageProducts.map((p) => p.id);
      try {
        for (const id of eligibleIds) {
          const prod = products.find((x) => x.id === id);
          const diff = prod ? prod.safetyTarget - prod.currentStock : 0;
          const nextQty = nextVal && (!prod.orderQty || prod.orderQty === 0) ? (diff > 0 ? diff : 1) : prod.orderQty;
          await toggleItemSelection(id, nextVal, nextQty);
        }
        setProducts((prev) =>
          prev.map((p) => {
            if (eligibleIds.includes(p.id)) {
              const diff = p.safetyTarget - p.currentStock;
              return {
                ...p,
                selected: nextVal,
                orderQty: nextVal && (!p.orderQty || p.orderQty === 0) ? (diff > 0 ? diff : 1) : p.orderQty,
              };
            }
            return p;
          })
        );
        if (nextVal && eligibleIds.length > 0) {
          const firstSelected = products.find((x) => x.id === eligibleIds[0]);
          if (firstSelected) setSelectedSupplierId(firstSelected.supplierId);
          setSqExpanded(true);
          setDraftExpanded(true);
        } else {
          const remainingSelected = products.some((p) => !eligibleIds.includes(p.id) && p.selected && p.orderStatus !== 'ordered');
          if (!remainingSelected) {
            setDraftExpanded(false);
          }
        }
      } catch {
        console.warn('Error updating page selection');
      }
    });
  };

  // Explicitly select all filtered products across all pages
  const handleSelectAllFiltered = () => {
    requestActionWithUnsavedCheck(async () => {
      const nextVal = true;
      const eligibleIds = eligibleFilteredProducts.map((p) => p.id);
      try {
        for (const id of eligibleIds) {
          const prod = products.find((x) => x.id === id);
          const diff = prod ? prod.safetyTarget - prod.currentStock : 0;
          const nextQty = nextVal && (!prod.orderQty || prod.orderQty === 0) ? (diff > 0 ? diff : 1) : prod.orderQty;
          await toggleItemSelection(id, nextVal, nextQty);
        }
        setProducts((prev) =>
          prev.map((p) => {
            if (eligibleIds.includes(p.id)) {
              const diff = p.safetyTarget - p.currentStock;
              return {
                ...p,
                selected: nextVal,
                orderQty: nextVal && (!p.orderQty || p.orderQty === 0) ? (diff > 0 ? diff : 1) : p.orderQty,
              };
            }
            return p;
          })
        );
        if (eligibleIds.length > 0) {
          const firstSelected = products.find((x) => x.id === eligibleIds[0]);
          if (firstSelected) setSelectedSupplierId(firstSelected.supplierId);
          setDraftExpanded(true);
        }
        showToast(`Selected all ${eligibleIds.length} filtered products.`);
      } catch {
        console.warn('Error selecting all filtered products');
      }
    });
  };

  // Clear all selections
  const handleClearAllSelections = () => {
    requestActionWithUnsavedCheck(async () => {
      try {
        await clearAllSelection();
        setProducts((prev) => prev.map((p) => ({ ...p, selected: false })));
        setDraftExpanded(false);
        showToast('Selection cleared.');
      } catch {
        showToast('Failed to clear selections in SQLite.', 'warn');
      }
    });
  };

  // Row selection toggle with Reorder Confirmation for Ordered items
  const handleToggleSelect = useCallback((id) => {
    requestActionWithUnsavedCheck(async () => {
      const target = products.find((p) => p.id === id);
      if (!target) return;

      const isOrdered = target.orderStatus === 'ordered';
      // If product has been ordered before, first selection requires confirmation
      if (isOrdered && !target.selected && !acknowledgedReorders.has(target.id)) {
        setReorderConfirmProd(target);
        return;
      }

      const nextSelected = !target.selected;
      let nextQty = target.orderQty;
      if (nextSelected && (!target.orderQty || target.orderQty === 0)) {
        const diff = target.safetyTarget - target.currentStock;
        nextQty = diff > 0 ? diff : 1;
      }
      try {
        await toggleItemSelection(id, nextSelected, nextQty);
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === id) {
              return { ...p, selected: nextSelected, orderQty: nextQty };
            }
            return p;
          })
        );
        if (nextSelected) {
          setSelectedSupplierId(target.supplierId);
          setExpandedDraftSupplierIds((prev) => new Set([...prev, target.supplierId]));
          setDraftExpanded(true);
        } else {
          const remainingSelected = products.some((p) => p.id !== id && p.selected && p.orderStatus !== 'ordered');
          if (!remainingSelected) {
            setDraftExpanded(false);
          }
        }
      } catch {
        console.warn('Error updating item selection');
      }
    });
  }, [products, acknowledgedReorders, requestActionWithUnsavedCheck]);

  // Reorder Confirmation Modal Handlers
  const handleConfirmReorder = async () => {
    if (!reorderConfirmProd) return;
    const target = reorderConfirmProd;
    try {
      await saveReorderAcknowledgement(target.id);
      setAcknowledgedReorders((prev) => new Set([...prev, target.id]));

      const nextQty = target.orderQty > 0 ? target.orderQty : Math.max(1, target.safetyTarget - target.currentStock);
      await toggleItemSelection(target.id, true, nextQty);
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === target.id) {
            return { ...p, selected: true, orderQty: nextQty };
          }
          return p;
        })
      );
      setSelectedSupplierId(target.supplierId);
      setDraftExpanded(true);
      showToast(`Selected "${target.name}" for a new replenishment order.`);
    } catch (err) {
      console.error('Failed to acknowledge reorder:', err);
      showToast('Failed to record reorder acknowledgement in SQLite.', 'warn');
    } finally {
      setReorderConfirmProd(null);
    }
  };

  const handleCancelReorder = () => {
    setReorderConfirmProd(null);
  };

  // Product created handler
  const handleProductCreated = async (newProduct) => {
    const updated = await fetchInventory();
    setProducts(updated);
    const cats = await fetchCategories();
    setCategories(cats);
    showToast(`Product "${newProduct.name}" (${newProduct.sku}) created successfully.`);
  };

  // Supplier created handler
  const handleSupplierCreated = async (newSupplier) => {
    const updated = await fetchSuppliers();
    setSuppliers(updated);
    showToast(`Supplier "${newSupplier.name}" created successfully.`);
  };

  // Mobile Card Quantity Adjustments
  const handleMobileCardQtyChange = async (prod, delta) => {
    const currentVal = Number(pendingQtyEdits[prod.sku] !== undefined ? pendingQtyEdits[prod.sku] : prod.orderQty) || 0;
    const nextVal = Math.max(0, currentVal + delta);
    const nextSelected = nextVal > 0 ? true : prod.selected;

    try {
      await toggleItemSelection(prod.id, nextSelected, nextVal);
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === prod.id) {
            return { ...p, selected: nextSelected, orderQty: nextVal };
          }
          return p;
        })
      );
      if (nextSelected) {
        setSelectedSupplierId(prod.supplierId);
        setExpandedDraftSupplierIds((prev) => new Set([...prev, prod.supplierId]));
      }
    } catch (err) {
      console.warn('Failed to update product quantity:', err);
    }
  };

  const handleApplyAllDraftMinimums = async () => {
    try {
      for (const group of selectedSupplierGroups) {
        if (!group.validation.valid) {
          await handleMeetSupplierMoq(group);
        }
      }
      showToast('Supplier draft minimums satisfied!');
    } catch {
      showToast('Failed to apply minimums.', 'warn');
    }
  };

  // Pending Inline Quantity Editing: Record edit without immediate SQLite commit
  const handleInlineQtyChange = useCallback((val) => {
    const sanitized = sanitizeIntegerInput(val, 5);
    setEditQtyValue(sanitized);
    setIsUnsaved(true);
    setInlineQtyError(null);
  }, []);

  const handleCommitInlineQtyToPending = useCallback((sku) => {
    const check = validateOrderQtyInput(editQtyValue);
    if (!check.isValid) {
      setInlineQtyError(check.error);
      return false;
    }
    setInlineQtyError(null);
    const prod = products.find((p) => p.sku === sku);
    const originalVal = prod ? String(prod.orderQty) : '0';

    if (editQtyValue !== originalVal) {
      setPendingQtyEdits((prev) => ({
        ...prev,
        [sku]: editQtyValue,
      }));
    } else {
      // Reverted to original quantity: remove from pending
      setPendingQtyEdits((prev) => {
        const next = { ...prev };
        delete next[sku];
        return next;
      });
    }

    setEditingSku(null);
    setIsUnsaved(false);
    return true;
  }, [editQtyValue, products]);

  // Cancel current row edit without erasing other rows' pending edits
  const handleCancelCurrentInlineQty = useCallback(() => {
    setInlineQtyError(null);
    setEditingSku(null);
    setIsUnsaved(false);
  }, []);

  // Save All behavior: Transactional commit of all pending quantity edits
  const handleConfirmSaveAll = async () => {
    const pendingSkus = Object.keys(pendingQtyEdits);
    if (pendingSkus.length === 0) {
      setSaveAllModalOpen(false);
      return;
    }

    // Validate all pending edits first
    const editsToSave = [];
    for (const sku of pendingSkus) {
      const valStr = pendingQtyEdits[sku];
      const check = validateOrderQtyInput(valStr);
      if (!check.isValid) {
        setSaveAllError(`Invalid quantity for ${sku}: ${check.error}`);
        return;
      }
      editsToSave.push({ sku, orderQty: check.value });
    }

    setIsSavingAll(true);
    setSaveAllError(null);
    try {
      await batchUpdateOrderQuantities(editsToSave);
      const updated = await fetchInventory();
      setProducts(updated);
      setPendingQtyEdits({});
      setSaveAllModalOpen(false);
      showToast(`Successfully saved all ${editsToSave.length} product quantity changes to SQLite.`);
    } catch (err) {
      console.error('Save All transaction failed:', err);
      setSaveAllError(err.message || 'SQLite transaction failed. Changes were not committed.');
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleDiscardAllPending = () => {
    setPendingQtyEdits({});
    setEditingSku(null);
    setIsUnsaved(false);
    showToast('All pending quantity edits have been discarded.');
  };

  // Supplier Queue selection: filters table to this supplier and enables/expands queue
  const handleSelectQueueSupplier = (supId) => {
    requestActionWithUnsavedCheck(() => {
      setSelectedSupplierId(supId);
      if (activeQueueSupplierId === supId) {
        setActiveQueueSupplierId(null);
      } else {
        setActiveQueueSupplierId(supId);
        // Clear any previous conflicting modal supplier filter
        setAppliedFilters((prev) => ({ ...prev, suppliers: [] }));
      }
      setSqExpanded(true);
    });
  };

  const handleClearQueueSupplierFilter = () => {
    requestActionWithUnsavedCheck(() => {
      setActiveQueueSupplierId(null);
      setAppliedFilters((prev) => ({ ...prev, suppliers: [] }));
    });
  };

  // Apply Supplier Minimums with SQLite persistence
  const handleApplySupplierMinimums = async () => {
    try {
      await applySupplierMinimumsDB(selectedSupplierId);
      const updatedProds = await fetchInventory(selectedSupplierId);
      setProducts((prev) =>
        prev.map((p) => {
          if (p.supplierId === selectedSupplierId) {
            const found = updatedProds.find((u) => u.id === p.id);
            return found || p;
          }
          return p;
        })
      );
      showToast(`Applied safety thresholds for ${currentSupplier.name}`);
    } catch {
      showToast('Failed to apply supplier minimums in SQLite.', 'warn');
    }
  };

  // ── Confirmation Workflows: Cancel, Save Draft, Submit PO, Delete PO ─────────

  // Remove an item directly from a supplier's draft
  const handleRemoveItemFromDraft = async (item) => {
    try {
      await toggleItemSelection(item.id, false, item.orderQty);
      setProducts((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, selected: false } : p))
      );
      showToast(`Removed ${item.name} from draft.`);
    } catch {
      showToast('Failed to remove item.', 'warn');
    }
  };

  // Adjust item quantity directly in the draft accordion
  const handleDraftQtyChange = async (item, delta) => {
    const newQty = Math.max(1, (item.orderQty || 0) + delta);
    try {
      await toggleItemSelection(item.id, true, newQty);
      setProducts((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, orderQty: newQty } : p))
      );
    } catch {
      showToast('Failed to update quantity.', 'warn');
    }
  };

  // Auto-fill order quantity to satisfy supplier's target MOQ
  const handleMeetSupplierMoq = async (group) => {
    const { supplier, items, validation } = group;
    if (validation.valid || items.length === 0) return;

    const remainingAmt = validation.remainingAmount;
    let addedAmount = 0;
    const updatedItems = items.map((item, idx) => {
      if (addedAmount >= remainingAmt) return item;
      const neededForThis = Math.ceil((remainingAmt - addedAmount) / (item.unitCost || 1));
      const extraQty = idx === items.length - 1 ? neededForThis : Math.min(neededForThis, 5);
      addedAmount += extraQty * item.unitCost;
      return { ...item, orderQty: item.orderQty + extraQty };
    });

    try {
      for (const item of updatedItems) {
        if (item.orderQty !== items.find((i) => i.id === item.id)?.orderQty) {
          await toggleItemSelection(item.id, true, item.orderQty);
        }
      }
      setProducts((prev) =>
        prev.map((p) => {
          const match = updatedItems.find((u) => u.id === p.id);
          return match ? { ...p, orderQty: match.orderQty } : p;
        })
      );
      showToast(`Adjusted quantities for ${supplier.name} to satisfy MOQ!`);
    } catch {
      showToast('Failed to update quantities.', 'warn');
    }
  };

  // Cancel draft workflow (targeted supplier or all selections)
  const handlePromptCancel = (targetSupId = null) => {
    const targetGroup = targetSupId ? selectedSupplierGroups.find((g) => g.supplier.id === targetSupId) : null;
    const targetItems = targetGroup ? targetGroup.items : allSelectedItems;
    const targetName = targetGroup ? targetGroup.supplier.name : 'all suppliers';

    if (targetItems.length === 0 && !isUnsaved) {
      showToast('No active selection to cancel.');
      return;
    }
    setConfirmModalConfig({
      title: targetGroup ? `Cancel ${targetName} Draft?` : 'Cancel All Inventory Selections?',
      message: `Are you sure you want to cancel the draft for ${targetName}? ${targetItems.length} selected items will be cleared.`,
      confirmText: 'Confirm Cancel',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          for (const item of targetItems) {
            await toggleItemSelection(item.id, false, item.orderQty);
          }
          setProducts((prev) =>
            prev.map((p) => {
              if (targetItems.some((ti) => ti.id === p.id)) {
                return { ...p, selected: false };
              }
              return p;
            })
          );
          setIsUnsaved(false);
          const remaining = products.filter(
            (p) => !targetItems.some((ti) => ti.id === p.id) && p.selected && p.orderQty > 0
          );
          if (remaining.length === 0) {
            setDraftExpanded(false);
          }
          setConfirmModalConfig(null);
          showToast(`Selection for ${targetName} cancelled successfully.`);
        } catch {
          showToast('Failed to clear selection in database.', 'warn');
        }
      },
      onCancel: () => setConfirmModalConfig(null),
    });
  };

  // Save Draft workflow with SQLite persistence
  const handlePromptSaveDraft = (targetSupId = null) => {
    const targetGroup = targetSupId ? selectedSupplierGroups.find((g) => g.supplier.id === targetSupId) : selectedSupplierGroups[0];
    if (!targetGroup) return;

    setConfirmModalConfig({
      title: `Save ${targetGroup.supplier.name} Draft?`,
      message: `Save draft for ${targetGroup.supplier.name} with ${targetGroup.items.length} items totaling ${formatCurrency(targetGroup.subtotal)} to the SQLite database?`,
      confirmText: 'Save Draft',
      confirmClass: 'btn-primary-action',
      onConfirm: async () => {
        try {
          await saveDraftPO({
            supplierId: targetGroup.supplier.id,
            items: targetGroup.items,
            subtotal: targetGroup.subtotal,
            tax: 0,
            totalAmount: targetGroup.subtotal,
            notes: `Draft updated on ${new Date().toLocaleDateString()}`,
          });
          setIsUnsaved(false);
          setConfirmModalConfig(null);
          showToast(`Draft for ${targetGroup.supplier.name} saved successfully.`);
        } catch (err) {
          showToast('Failed to save draft to database: ' + err.message, 'warn');
        }
      },
      onCancel: () => setConfirmModalConfig(null),
    });
  };

  // Submit & Dispatch PO workflow with SQLite persistence, validation, and multi-supplier queue preservation
  const handlePromptSubmitPO = (targetSupId = null) => {
    if (isUnsaved) {
      showToast('Please save or cancel inline quantity editing before dispatching.', 'warn');
      return;
    }

    const targetGroup = targetSupId ? selectedSupplierGroups.find((g) => g.supplier.id === targetSupId) : selectedSupplierGroups[0];
    if (!targetGroup || targetGroup.items.length === 0) {
      showToast('Cannot dispatch empty purchase order.', 'warn');
      return;
    }

    if (!targetGroup.validation.valid) {
      showToast(targetGroup.validation.message || 'Supplier minimum order requirement not satisfied.', 'warn');
      return;
    }

    setConfirmModalConfig({
      title: `Dispatch Purchase Order for ${targetGroup.supplier.name}?`,
      message: `Confirm local dispatch of purchase order for ${targetGroup.supplier.name} with ${targetGroup.items.length} items totaling ${formatCurrency(targetGroup.subtotal)}?`,
      confirmText: isDispatching ? 'Dispatching...' : 'Confirm & Dispatch',
      confirmClass: 'btn-primary-action',
      onConfirm: async () => {
        setIsDispatching(true);
        try {
          const res = await submitPurchaseOrder({
            supplierId: targetGroup.supplier.id,
            items: targetGroup.items,
            subtotal: targetGroup.subtotal,
            tax: 0,
            totalAmount: targetGroup.subtotal,
            notes: `Dispatched locally from Replenishment Desk`,
          });

          // 1. Untick every row included in the dispatched order & reset select states
          setProducts((prev) =>
            prev.map((p) => {
              if (targetGroup.items.some((sel) => sel.id === p.id || sel.sku === p.sku)) {
                return { ...p, selected: false, orderQty: 0, orderStatus: 'ordered' };
              }
              return p;
            })
          );

          const remainingGroups = selectedSupplierGroups.filter((g) => g.supplier.id !== targetGroup.supplier.id);
          if (remainingGroups.length === 0) {
            setDraftExpanded(false);
          }

          // 2. Reload authoritative inventory from SQLite
          const refreshedInventory = await fetchInventory();
          setProducts(refreshedInventory);

          // 3. Refresh purchase order history for this supplier
          const updatedHistory = await fetchPOHistory(targetGroup.supplier.id);
          setPoHistoryList(updatedHistory);

          setConfirmModalConfig(null);
          showToast(
            `PO #${res.poNumber} for ${targetGroup.supplier.name} dispatched! Created Delivery Manifest #${res.manifestNumber || 'MNF'}.${remainingGroups.length > 0 ? ` — ${remainingGroups.length} draft(s) remain in queue.` : ''}`
          );
        } catch (err) {
          showToast('Dispatch failed: ' + err.message + '. Selection and draft preserved.', 'warn');
        } finally {
          setIsDispatching(false);
        }
      },
      onCancel: () => setConfirmModalConfig(null),
    });
  };

  // Delete/Cancel PO from history workflow
  const handlePromptDeletePO = (po) => {
    setConfirmModalConfig({
      title: 'Remove Purchase Order?',
      message: `Are you sure you want to remove ${po.poNumber}? This record will be deleted from SQLite.`,
      confirmText: 'Delete PO',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await deletePurchaseOrder(po.id);
          setPoHistoryList((prev) => prev.filter((p) => p.id !== po.id));
          setConfirmModalConfig(null);
          showToast(`${po.poNumber} removed successfully.`);
        } catch {
          showToast('Failed to delete purchase order.', 'warn');
        }
      },
      onCancel: () => setConfirmModalConfig(null),
    });
  };

  // ── Global Keyboard Shortcuts ───────────────────────────────────────────────
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
        handlePromptSaveDraft();
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
          cancelDiscardUnsaved();
          return;
        }
        if (editingSku) {
          handleCancelCurrentInlineQty();
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
  }, []);

  // ── Virtualization scroll listener on .tbl-wrap (Group C - Windowing) ──────
  useEffect(() => {
    const el = tblWrapRef.current;
    if (!el) return;

    let rAF = null;
    const handleScroll = () => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        setTableScrollTop(el.scrollTop);
      });
    };

    const updateHeight = () => {
      if (el.clientHeight > 0) {
        setTableViewportHeight(el.clientHeight);
      }
    };

    updateHeight();
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateHeight, { passive: true });
    return () => {
      if (rAF) cancelAnimationFrame(rAF);
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Reset table scroll position when page or page size changes
  useEffect(() => {
    if (tblWrapRef.current) {
      tblWrapRef.current.scrollTop = 0;
      setTableScrollTop(0);
    }
  }, [currentPage, pageSize]);

  // Auto-scroll table into view when focused row changes via keyboard navigation
  useEffect(() => {
    if (focusedRowIndex === null || focusedRowIndex === undefined) return;
    if (navMode !== 'keyboard') return;
    const wrap = tblWrapRef.current;
    if (wrap) {
      const rowTop = focusedRowIndex * 42;
      const rowBottom = rowTop + 42;
      if (rowTop < wrap.scrollTop) {
        wrap.scrollTop = rowTop;
      } else if (rowBottom > wrap.scrollTop + wrap.clientHeight) {
        wrap.scrollTop = rowBottom - wrap.clientHeight;
      }
    }
    const rowEl = tableRef.current?.querySelector(`.pr[data-row-index="${focusedRowIndex}"]`);
    if (rowEl) {
      rowEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        rowEl.focus({ preventScroll: true });
      }
    }
  }, [focusedRowIndex, navMode]);

  // Return focus to table row when exiting inline edit
  useEffect(() => {
    if (!editingSku && focusedRowIndex !== null && focusedRowIndex !== undefined) {
      const timer = setTimeout(() => {
        const rowEl = tableRef.current?.querySelector(`.pr[data-row-index="${focusedRowIndex}"]`);
        if (rowEl && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          rowEl.focus({ preventScroll: true });
        }
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [editingSku, focusedRowIndex]);

  // ── Quick Action Modal Openers ──────────────────────────────────────────────

  const handleOpenManifests = async () => {
    if (onNavigateToManifests) {
      onNavigateToManifests();
      return;
    }
    try {
      const data = await fetchPendingManifests(selectedSupplierId);
      setManifestsList(data || []);
      setManifestsModalOpen(true);
    } catch {
      showToast('Failed to load pending manifests.', 'error');
    }
  };

  const handleOpenPOHistory = async () => {
    try {
      const data = await fetchPOHistory(selectedSupplierId);
      setPoHistoryList(data || []);
      setPoHistoryModalOpen(true);
    } catch {
      showToast('Failed to load purchase order history.', 'warn');
    }
  };

  const handleOpenContact = async () => {
    try {
      const data = await fetchSupplierContact(selectedSupplierId);
      setContactData(data);
      setContactModalOpen(true);
    } catch {
      showToast('Failed to load supplier contact details.', 'warn');
    }
  };

  return (
    <div className="rp">
      {/* ─── Top Bar & Mobile Navigation Drawer ─── */}
      <ReplenishmentTopbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchInputRef={searchInputRef}
        windowWidth={windowWidth}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        setShortcutsModalOpen={setShortcutsModalOpen}
        setAddProductModalOpen={setAddProductModalOpen}
        setAddSupplierModalOpen={setAddSupplierModalOpen}
        themePreference={themePreference}
        handleSelectTheme={handleSelectTheme}
        mainLogo={mainLogo}
        onNavigateToManifests={onNavigateToManifests}
        onNavigateToSuppliers={onNavigateToSuppliers}
        suppliers={suppliers}
        activeQueueSupplierId={activeQueueSupplierId}
        setActiveQueueSupplierId={setActiveQueueSupplierId}
        handleSelectQueueSupplier={handleSelectQueueSupplier}
        supplierLogos={SUPPLIER_LOGOS}
      />


      {/* ─── Main Workspace: 4-Column Layout with Smooth Side Animation ─── */}
      <div className="rp-body" style={gridColumns ? { gridTemplateColumns: gridColumns } : undefined}>
        {/* Col 1: Icon Navigation Rail */}
        <nav className="icon-nav" aria-label="Main navigation rail">
          <div className="icon-nav-list">
            <button className="icon-nav-btn" title="Dashboard">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            </button>
            <button className="icon-nav-btn" title="Inventory">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </button>
            <button className="icon-nav-btn active" title="Replenishment Desk">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </button>
            <button
              className="icon-nav-btn"
              title="Inbound Delivery Manifests"
              onClick={onNavigateToManifests}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </button>
            <button
              className="icon-nav-btn"
              title="Suppliers"
              onClick={onNavigateToSuppliers}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>
            <button className="icon-nav-btn" title="Analytics">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </button>
          </div>
          <div className="icon-nav-bottom">
            <button className="icon-nav-btn" title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Col 2: Supplier Queue Sidebar (Left Side of Table) - Desktop & Tablet only */}
        <SupplierQueueRail
          windowWidth={windowWidth}
          sqExpanded={sqExpanded}
          setSqExpanded={setSqExpanded}
          handleCollapseSq={handleCollapseSq}
          activeQueueSuppliers={activeQueueSuppliers}
          selectedSupplierId={selectedSupplierId}
          activeQueueSupplierId={activeQueueSupplierId}
          products={products}
          validateSupplierMoq={validateSupplierMoq}
          formatCurrency={formatCurrency}
          handleSelectQueueSupplier={handleSelectQueueSupplier}
          supplierLogos={SUPPLIER_LOGOS}
          handleOpenManifests={handleOpenManifests}
          handleOpenPOHistory={handleOpenPOHistory}
          handleOpenContact={handleOpenContact}
        />


        {/* Col 3: Center Replenishment Matrix */}
        <main
          className="matrix"
          aria-label="Replenishment Matrix"
        >
          {windowWidth < 768 ? (
            mobileView === 'draft' ? (
              /* ─── DEDICATED MOBILE PO DRAFT QUEUE PAGE (Concept Adapted) ─── */
              <div className="mobile-draft-page">
                {/* Header with Back button */}
                <div className="mobile-draft-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      className="mobile-draft-back-btn"
                      onClick={() => {
                        setMobileView('matrix');
                        window.scrollTo(0, 0);
                      }}
                      aria-label="Return to Catalog Matrix"
                      title="Return to Replenishment Matrix"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <h1 className="mobile-draft-title">PO Draft Queue</h1>
                  </div>
                  <span className="mobile-draft-badge-pill">
                    {selectedSupplierGroups.length} {selectedSupplierGroups.length === 1 ? 'Supplier' : 'Suppliers'} • {allSelectedItems.length} SKUs
                  </span>
                </div>

                {/* Body Content */}
                <div className="mobile-draft-body">
                  {selectedSupplierGroups.length === 0 ? (
                    <div className="mobile-draft-empty">
                      <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                      <h3>No supplier drafts in queue</h3>
                      <p>Select products from the matrix catalog to generate purchase orders.</p>
                      <button
                        type="button"
                        className="btn-mobile-return"
                        onClick={() => {
                          setMobileView('matrix');
                          window.scrollTo(0, 0);
                        }}
                      >
                        ← Back to Replenishment Matrix
                      </button>
                    </div>
                  ) : (
                    <div className="mobile-draft-list">
                      {selectedSupplierGroups.map((group) => {
                        const sup = group.supplier;
                        const v = group.validation;
                        const isAccordionOpen = expandedDraftSupplierIds.has(sup.id);
                        const moqTarget = Number(sup.targetMoq ?? sup.target_moq) || 0;
                        const unitThreshold = Number(sup.unitThreshold ?? sup.unit_threshold) || 0;
                        const moqPercent = Math.min(100, Math.round((group.subtotal / (moqTarget || 1)) * 100));
                        const unitsPercent = Math.min(100, Math.round((group.totalUnits / (unitThreshold || 1)) * 100));

                        return (
                          <div key={sup.id} className="mobile-draft-supplier-card">
                            {/* Accordion Header */}
                            <div
                              className={`mds-header ${isAccordionOpen ? 'open' : ''}`}
                              onClick={() => toggleDraftAccordion(sup.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleDraftAccordion(sup.id);
                                }
                              }}
                            >
                              <div className="mds-header-left">
                                {SUPPLIER_LOGOS[sup.id] ? (
                                  <img src={SUPPLIER_LOGOS[sup.id]} alt="" className="mds-sup-logo" />
                                ) : (
                                  <div className="mds-sup-avatar" style={{ background: sup.color || 'var(--brand)' }}>
                                    {sup.initials || sup.name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="mds-sup-info">
                                  <div className="mds-sup-name">{sup.name}</div>
                                  <div className="mds-sup-sub">
                                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'} • {group.totalUnits} units • {formatCurrency(group.subtotal)}
                                  </div>
                                </div>
                              </div>

                              <div className="mds-header-right">
                                <span className={`mds-status-pill ${v.valid ? 'valid' : 'warning'}`}>
                                  {v.valid ? '✔ MOQ Met' : `⚠️ ${formatCurrency(v.remainingAmount)} left`}
                                </span>
                                <span className={`mds-chevron ${isAccordionOpen ? 'rotated' : ''}`} aria-hidden="true">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </span>
                              </div>
                            </div>

                            {/* Accordion Content */}
                            {isAccordionOpen && (
                              <div className="mds-body">
                                {/* MOQ Threshold Checklist */}
                                <div className={`mds-checklist ${v.valid ? 'pass' : 'fail'}`}>
                                  <div className="mds-check-row">
                                    <span className={`mds-check-icon ${v.isMoqMet ? 'pass' : 'fail'}`}>
                                      {v.isMoqMet ? '✔' : '✖'}
                                    </span>
                                    <span className="mds-check-text">
                                      <strong>Value:</strong> {formatCurrency(group.subtotal)} / {formatCurrency(moqTarget)} ({moqPercent}%)
                                      {v.isMoqMet ? ' — Met' : ` (${formatCurrency(v.remainingAmount)} remaining)`}
                                    </span>
                                  </div>
                                  <div className="mds-check-row">
                                    <span className={`mds-check-icon ${v.isUnitsMet ? 'pass' : 'fail'}`}>
                                      {v.isUnitsMet ? '✔' : '✖'}
                                    </span>
                                    <span className="mds-check-text">
                                      <strong>Units:</strong> {group.totalUnits} / {unitThreshold} ({unitsPercent}%)
                                      {v.isUnitsMet ? ' — Met' : ` (${v.remainingUnits} units needed)`}
                                    </span>
                                  </div>
                                  {!v.valid && (
                                    <div className="mds-alert-msg">
                                      ⚠️ {formatCurrency(v.remainingAmount)} more required to meet the supplier minimum
                                    </div>
                                  )}
                                </div>

                                {/* Items List */}
                                <div className="mds-items-box">
                                  <div className="mds-items-header">
                                    <span>ITEM / SKU</span>
                                    <span style={{ textAlign: 'center' }}>QTY</span>
                                    <span style={{ textAlign: 'right' }}>TOTAL</span>
                                    <span style={{ width: 20 }}></span>
                                  </div>
                                  {group.items.map((item) => {
                                    const lineTotal = item.orderQty * item.unitCost;
                                    return (
                                      <div key={item.id} className="mds-item-row">
                                        <div className="mds-item-info">
                                          <div className="mds-item-name" title={item.name}>{item.name}</div>
                                          <div className="mds-item-sku">{item.sku} • {formatCurrency(item.unitCost)}</div>
                                        </div>
                                        <div className="mds-item-stepper">
                                          <button
                                            type="button"
                                            className="mds-step-btn"
                                            onClick={() => handleDraftQtyChange(item, -1)}
                                            aria-label="Decrease quantity"
                                          >
                                            -
                                          </button>
                                          <span className="mds-step-val">{item.orderQty}</span>
                                          <button
                                            type="button"
                                            className="mds-step-btn"
                                            onClick={() => handleDraftQtyChange(item, 1)}
                                            aria-label="Increase quantity"
                                          >
                                            +
                                          </button>
                                        </div>
                                        <div className="mds-item-total">{formatCurrency(lineTotal)}</div>
                                        <button
                                          type="button"
                                          className="mds-item-remove"
                                          onClick={() => handleRemoveItemFromDraft(item)}
                                          title={`Remove ${item.name}`}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Financial Subtotal */}
                                <div className="mds-subtotal-panel">
                                  <div className="mds-subtotal-row">
                                    <span>Subtotal ({group.items.length} SKUs):</span>
                                    <strong>{formatCurrency(group.subtotal)}</strong>
                                  </div>
                                  <div className="mds-tax-row">
                                    <span>Tax &amp; Freight:</span>
                                    <span>Included</span>
                                  </div>
                                </div>

                                {/* Supplier Actions */}
                                <div className="mds-actions-row">
                                  <button
                                    type="button"
                                    className="mds-btn-clear"
                                    onClick={() => handlePromptCancel(sup.id)}
                                  >
                                    Clear
                                  </button>
                                  <button
                                    type="button"
                                    className="mds-btn-save"
                                    onClick={() => handlePromptSaveDraft(sup.id)}
                                    disabled={isDispatching}
                                  >
                                    Save Draft
                                  </button>
                                  <button
                                    type="button"
                                    className={`mds-btn-dispatch ${!v.valid || isDispatching ? 'disabled' : ''}`}
                                    onClick={() => handlePromptSubmitPO(sup.id)}
                                    disabled={!v.valid || isDispatching}
                                  >
                                    {isDispatching ? 'Dispatching...' : 'Dispatch PO →'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sticky Bottom Bar on Mobile Draft Page */}
                <div className="mobile-sticky-footer">
                  <div className="msf-content">
                    <div className="msf-left">
                      <div className="msf-title-row">
                        <span className="msf-dot">●</span>
                        <span>Total Queue ({selectedSupplierGroups.length} Suppliers)</span>
                      </div>
                      <div className="msf-total-row">
                        <strong style={{ fontSize: 18 }}>{formatCurrency(overallTotalAmount)}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="msf-apply-btn"
                      onClick={handleApplyAllDraftMinimums}
                    >
                      <span>Apply Minimums</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ─── MOBILE REPLENISHMENT MATRIX CARD VIEW (Concept Adapted) ─── */
              <div className="mobile-matrix-page">
                {/* Search Bar */}
                {/* <div className="mobile-search-container">
                  <div className="mobile-search-box">
                    <svg className="mobile-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      type="text"
                      className="mobile-search-input"
                      placeholder="Search SKU, item name, supplier..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search catalog"
                    />
                    {searchTerm ? (
                      <button
                        type="button"
                        className="mobile-search-clear"
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    ) : (
                      <kbd className="mobile-search-kbd"></kbd>
                    )}
                  </div>
                </div> */}

                {/* Header: Title + Filter Button + 3-Dot Actions & Theme Menu */}
                <div className="mobile-matrix-header">
                  <div className="mobile-matrix-titles">
                    <h1 className="mobile-matrix-h1">Replenishment Matrix</h1>
                    <span className="mobile-matrix-sub">
                      Showing {displayProducts.length} of {products.length} products
                    </span>
                  </div>
                  <div className="mobile-matrix-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      className={`mobile-filter-btn ${hasActiveFilters ? 'active' : ''}`}
                      onClick={() => setFilterModalOpen(true)}
                      aria-label="Open filter modal"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                      <span>Filter</span>
                      {activeFilterCount > 0 && (
                        <span className="mobile-filter-badge">{activeFilterCount}</span>
                      )}
                    </button>

                    {/* 3-Dot Dropdown Menu next to Filter icon */}
                    <div className="mobile-matrix-menu-wrap" ref={mobileMatrixMenuRef} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className={`mobile-matrix-three-dots ${mobileMatrixMenuOpen ? 'active' : ''}`}
                        onClick={() => setMobileMatrixMenuOpen((prev) => !prev)}
                        aria-label="More actions and settings"
                        aria-haspopup="true"
                        aria-expanded={mobileMatrixMenuOpen}
                        title="Actions & Settings"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                          <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                        </svg>
                      </button>

                      {mobileMatrixMenuOpen && (
                        <div className="mobile-actions-dropdown" role="menu">
                          <button
                            type="button"
                            className="mobile-action-item"
                            onClick={() => {
                              setMobileMatrixMenuOpen(false);
                              setAddProductModalOpen(true);
                            }}
                            role="menuitem"
                          >
                            <span className="mobile-action-icon">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </span>
                            <span className="mobile-action-text">Add Product</span>
                          </button>

                          <button
                            type="button"
                            className="mobile-action-item"
                            onClick={() => {
                              setMobileMatrixMenuOpen(false);
                              setAddSupplierModalOpen(true);
                            }}
                            role="menuitem"
                          >
                            <span className="mobile-action-icon">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                              </svg>
                            </span>
                            <span className="mobile-action-text">Add Supplier</span>
                          </button>

                          <button
                            type="button"
                            className="mobile-action-item"
                            onClick={() => {
                              setMobileMatrixMenuOpen(false);
                              setShortcutsModalOpen(true);
                            }}
                            role="menuitem"
                          >
                            <span className="mobile-action-icon">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
                              </svg>
                            </span>
                            <span className="mobile-action-text">Keyboard Shortcuts</span>
                            <kbd className="mobile-action-kbd">?</kbd>
                          </button>

                          <div className="mobile-action-sep" />

                          {/* Theme Switcher inside 3-dot dropdown */}
                          <div className="mobile-dropdown-theme-section">
                            <span className="mobile-dropdown-theme-title">Theme</span>
                            <ThemeSwitcher
                              value={themePreference}
                              onChange={handleSelectTheme}
                              className="dropdown-theme-switcher"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Action Buttons: Add Product & Add Supplier */}
                {/* <div className="mobile-action-buttons-row">
                  <button
                    type="button"
                    className="mobile-btn-add"
                    onClick={() => setAddProductModalOpen(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Product</span>
                  </button>
                  <button
                    type="button"
                    className="mobile-btn-add"
                    onClick={() => setAddSupplierModalOpen(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    <span>Add Supplier</span>
                  </button>
                </div> */}

                {/* Selection & Minimums Toolbar */}
                <div className="mobile-selection-bar">
                  <label className="mobile-select-all-label">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={isAllFilteredSelected ? handleClearAllSelections : handleSelectAllFiltered}
                      className="mobile-chk-input"
                      aria-label="Select all products"
                    />
                    <span>Select All ({displayProducts.length})</span>
                  </label>
                  <button
                    type="button"
                    className="mobile-btn-apply-minimums"
                    onClick={handleApplySupplierMinimums}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Apply Minimums</span>
                  </button>
                </div>

                {/* Content: Loading, Error, Empty, or Cards */}
                {isEffectiveLoading ? (
                  <div className="state-box" role="status" aria-live="polite">
                    <div className="loading-spinner" />
                    <h3 className="state-title">Loading inventory catalog...</h3>
                  </div>
                ) : effectiveDbError ? (
                  <div className="state-box error-box" role="alert">
                    <div className="state-icon">⚠️</div>
                    <h3 className="state-title">Database Error</h3>
                    <p className="state-body">{effectiveDbError}</p>
                  </div>
                ) : isEffectiveEmpty ? (
                  <div className="state-box" role="status">
                    <div className="state-icon">🔍</div>
                    <h3 className="state-title">No Matching Products</h3>
                    <p className="state-body">No products found matching your active filter criteria.</p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="btn-retry"
                        onClick={() => {
                          setAppliedFilters({ statuses: [], suppliers: [], categories: [], search: '' });
                          setActiveQueueSupplierId(null);
                          setSearchTerm('');
                        }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Product Cards List */}
                    <div className="mobile-product-cards-list">
                      {paginatedProducts.map((prod) => {
                        const sup = suppliersMap[prod.supplierId];
                        const numericQty = Number(pendingQtyEdits[prod.sku] !== undefined ? pendingQtyEdits[prod.sku] : prod.orderQty) || 0;
                        const lineSubtotal = numericQty * prod.unitCost;
                        const isCritical = prod.priority === 'critical' || prod.status === 'critical';
                        const isLow = prod.priority === 'low' || prod.status === 'low';
                        const isHealthy = prod.priority === 'healthy' || prod.status === 'healthy';

                        return (
                          <div
                            key={prod.id}
                            className={`mobile-product-card ${prod.selected ? 'selected' : ''}`}
                          >
                            {/* Top: Checkbox, SKU pill, and Status */}
                            <div className="mpc-top">
                              <div className="mpc-chk-sku">
                                <input
                                  type="checkbox"
                                  checked={prod.selected}
                                  onChange={() => handleToggleSelect(prod.id)}
                                  className="mobile-chk-input"
                                  aria-label={`Select ${prod.name}`}
                                />
                                <span className="mpc-sku-badge">{prod.sku}</span>
                              </div>
                              <span className={`mpc-status-badge ${isCritical ? 'critical' : isLow ? 'low' : isHealthy ? 'healthy' : 'excess'}`}>
                                ● {isCritical ? 'Critical' : isLow ? 'Low' : isHealthy ? 'Healthy' : 'Excess'}
                              </span>
                            </div>

                            {/* Title */}
                            <div className="mpc-title">{prod.name}</div>

                            {/* Supplier & Category */}
                            <div className="mpc-supplier-row">
                              {SUPPLIER_LOGOS[prod.supplierId] ? (
                                <img src={SUPPLIER_LOGOS[prod.supplierId]} alt="" className="mpc-sup-logo" />
                              ) : (
                                <span className="mpc-sup-dot" style={{ background: sup?.color || 'var(--brand)' }}>
                                  {sup?.initials || prod.supplierId.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                              <span className="mpc-sup-name">{sup?.name || prod.supplierId}</span>
                              <span className="mpc-sep">•</span>
                              <span className="mpc-cat-name">{prod.category}</span>
                            </div>

                            {/* Stats: Current Stock vs Target Stock */}
                            <div className="mpc-stats-container">
                              <div className="mpc-stat-box">
                                <span className="mpc-stat-lbl">CURRENT STOCK</span>
                                <div className="mpc-stat-val">
                                  <span className={`mpc-stock-num ${isCritical ? 'critical' : isLow ? 'low' : 'healthy'}`}>
                                    {prod.currentStock}
                                  </span>
                                  <span className="mpc-stock-unit">units</span>
                                </div>
                              </div>
                              <div className="mpc-stat-divider" />
                              <div className="mpc-stat-box">
                                <span className="mpc-stat-lbl">TARGET STOCK</span>
                                <div className="mpc-stat-val">
                                  <span className="mpc-stock-num target">{prod.safetyTarget}</span>
                                  <span className="mpc-stock-unit">units</span>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer: Stepper and Price */}
                            <div className="mpc-footer">
                              <div className="mpc-qty-wrapper">
                                <span className="mpc-qty-label">Order Qty</span>
                                <div className="mpc-stepper">
                                  <button
                                    type="button"
                                    className="mpc-stepper-btn"
                                    onClick={() => handleMobileCardQtyChange(prod, -1)}
                                    disabled={numericQty <= 0}
                                    aria-label="Decrease quantity"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="text"
                                    className="mpc-stepper-input"
                                    value={editingSku === prod.sku ? editQtyValue : numericQty}
                                    onFocus={() => {
                                      setEditingSku(prod.sku);
                                      setEditQtyValue(String(numericQty));
                                    }}
                                    onChange={(e) => {
                                      const sanitized = sanitizeIntegerInput(e.target.value, 5);
                                      setEditQtyValue(sanitized);
                                    }}
                                    onBlur={() => {
                                      if (editingSku === prod.sku) {
                                        const val = parseInt(editQtyValue, 10);
                                        const finalVal = isNaN(val) ? 0 : Math.max(0, val);
                                        handleMobileCardQtyChange(prod, finalVal - numericQty);
                                        setEditingSku(null);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') e.target.blur();
                                    }}
                                    aria-label={`Order quantity for ${prod.name}`}
                                  />
                                  <button
                                    type="button"
                                    className="mpc-stepper-btn"
                                    onClick={() => handleMobileCardQtyChange(prod, 1)}
                                    aria-label="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="mpc-price-wrapper">
                                <span className="mpc-unit-price">Unit: {formatCurrency(prod.unitCost)}</span>
                                <span className="mpc-line-total">{formatCurrency(lineSubtotal)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    <div className="mobile-pager">
                      <div className="mobile-pager-info-row">
                        <div className="mobile-pager-size">
                          <span>Rows:</span>
                          <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(e.target.value)}
                            className="mobile-pager-select"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                        <span className="mobile-pager-count">
                          Showing {totalItems === 0 ? 0 : startIndex + 1}–{endIndex} of {totalItems}
                        </span>
                      </div>
                      <div className="mobile-pager-buttons">
                        <button
                          type="button"
                          className="mobile-pager-btn"
                          disabled={currentPage <= 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          aria-label="Previous page"
                        >
                          ‹
                        </button>
                        {pageNumbers.map((pNum, idx) => (
                          pNum === '...' ? (
                            <span key={`el-${idx}`} className="mobile-pager-ellipsis">…</span>
                          ) : (
                            <button
                              type="button"
                              key={pNum}
                              className={`mobile-pager-btn ${currentPage === pNum ? 'active' : ''}`}
                              onClick={() => handlePageChange(pNum)}
                            >
                              {pNum}
                            </button>
                          )
                        ))}
                        <button
                          type="button"
                          className="mobile-pager-btn"
                          disabled={currentPage >= totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          aria-label="Next page"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Sticky Bottom Bar on Matrix */}
                <div className="mobile-sticky-footer">
                  <div className="msf-content">
                    <div className="msf-left">
                      <div className="msf-title-row">
                        <span className="msf-dot">●</span>
                        <span>PO Draft Queue ({allSelectedItems.length} items)</span>
                      </div>
                      <div className="msf-total-row">
                        <span>Total:</span>
                        <strong>{formatCurrency(overallTotalAmount)}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="msf-review-btn"
                      onClick={() => {
                        setMobileView('draft');
                        window.scrollTo(0, 0);
                      }}
                    >
                      <span>Review PO</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )) : (
            <>
              <div className="matrix-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 className="matrix-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* <img src={matrixLogo} alt="" className="section-matrix-logo" /> */}
                    <span>Replenishment Matrix</span>
                  </h1>
                  {/* <span className="matrix-badge-count">{displayProducts.length} Products</span> */}
                </div>
                {windowWidth >= 992 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      className="header-action-btn"
                      onClick={() => setAddProductModalOpen(true)}
                      title="Add new product to catalog"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Add Product</span>
                    </button>
                    <button
                      className="header-action-btn"
                      onClick={() => setAddSupplierModalOpen(true)}
                      title="Add new supplier to database"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                      <span>Add Supplier</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Filter Bar with Filter Button Aligned to Right & Integrated X Clear Button */}
              <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div className="filter-left" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {activeQueueSupplierId && (
                    <span
                      className="active-supplier-pill"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'var(--brand-bg, #eff6ff)',
                        border: '1px solid var(--brand, #2563eb)',
                        color: 'var(--brand, #2563eb)',
                        padding: '2px 8px',
                        borderRadius: 14,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <span>Supplier: {suppliers.find((s) => s.id === activeQueueSupplierId)?.name || activeQueueSupplierId}</span>
                      <button
                        type="button"
                        onClick={handleClearQueueSupplierFilter}
                        aria-label="Clear active supplier filter"
                        style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1 }}
                        title="Clear supplier filter"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  <span className="filter-res-txt">
                    Showing {displayProducts.length} of {products.length} products
                  </span>
                </div>

                <div className="filter-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn-filter-modal ${hasActiveFilters ? 'active' : ''}`}
                    onClick={() => setFilterModalOpen(true)}
                    aria-label="Open filter modal"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    <span>Filter</span>
                    {activeFilterCount > 0 && (
                      <span className="filter-count-badge">{activeFilterCount}</span>
                    )}
                    {hasActiveFilters && (
                      <span
                        role="button"
                        tabIndex={0}
                        className="filter-btn-clear-x"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAppliedFilters({ statuses: [], suppliers: [], categories: [], search: '' });
                          setActiveQueueSupplierId(null);
                          handleClearColFilters();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            setAppliedFilters({ statuses: [], suppliers: [], categories: [], search: '' });
                            setActiveQueueSupplierId(null);
                            handleClearColFilters();
                          }
                        }}
                        title="Clear all active filters"
                        aria-label="Clear all active filters"
                      >
                        ✕
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Toolbar & Bulk Action Bar */}
              {isEffectiveHasResults && (
                <>
                  <div className="toolbar">
                    <div className="toolbar-selection-group">
                      

                      {eligibleFilteredProducts.length > eligiblePageProducts.length && (
                        <button
                          className={`btn-toolbar-scope ${isAllFilteredSelected ? 'active' : ''}`}
                          onClick={isAllFilteredSelected ? handleClearAllSelections : handleSelectAllFiltered}
                          title="Select all filtered results across all pages"
                        >
                          {isAllFilteredSelected ? 'Deselect All Filtered' : `Select All Results (${eligibleFilteredProducts.length})`}
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {/* Save All button when pending quantity edits exist */}
                      {Object.keys(pendingQtyEdits).length > 0 && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className="btn-save-all"
                            onClick={() => {
                              setSaveAllError(null);
                              setSaveAllModalOpen(true);
                            }}
                            title={`Save ${Object.keys(pendingQtyEdits).length} pending quantity changes`}
                            aria-label="Save All Pending Changes"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                              <polyline points="17 21 17 13 7 13 7 21" />
                              <polyline points="7 3 7 8 15 8" />
                            </svg>
                            <span>Save All ({Object.keys(pendingQtyEdits).length})</span>
                          </button>
                          <button
                            type="button"
                            className="btn-discard-all"
                            onClick={handleDiscardAllPending}
                            title="Discard all pending quantity edits"
                          >
                            Discard
                          </button>
                        </div>
                      )}

                      {selectedProducts.length > 0 ? (
                        <div className="bulk-toolbar">
                          <span className="bulk-count">
                            {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                          </span>
                          <button
                            type="button"
                            className="btn-bulk-cancel"
                            onClick={handleClearAllSelections}
                            title="Cancel selection"
                          >
                            Cancel Selection
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleApplySupplierMinimums}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span>Apply Supplier Minimums</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selection Scope Banner: when all on current page are selected and more exist across pages */}
                  {/* {isPageAllSelected && eligibleFilteredProducts.length > eligiblePageProducts.length && (
                    <div className="selection-scope-banner">
                      {!isAllFilteredSelected ? (
                        <>
                          <span>All <strong>{eligiblePageProducts.length}</strong> products on page {currentPage} are selected.</span>
                          <button
                            className="btn-link-action"
                            onClick={handleSelectAllFiltered}
                          >
                            Select all {eligibleFilteredProducts.length} filtered products
                          </button>
                        </>
                      ) : (
                        <>
                          <span>All <strong>{eligibleFilteredProducts.length}</strong> filtered products across all pages are selected.</span>
                          <button
                            className="btn-link-action"
                            onClick={handleClearAllSelections}
                          >
                            Clear selection
                          </button>
                        </>
                      )}
                    </div>
                  )} */}
                </>
              )}

              {/* Genuine Application States */}
              {isEffectiveLoading && (
                <div className="tbl-wrap">
                  <div className="skel-wrap">
                    {[1, 2, 3, 4, 5, 6, 7].map((idx) => (
                      <div key={idx} className="skel-row">
                        <div className="skel-cell skel-xs"></div>
                        <div className="skel-cell skel-sm"></div>
                        <div className="skel-cell skel-lg"></div>
                        <div className="skel-cell skel-sm"></div>
                        <div className="skel-cell skel-sm"></div>
                        <div className="skel-cell skel-md"></div>
                        <div className="skel-cell skel-sm"></div>
                        <div className="skel-cell skel-md"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isEffectiveLoading && effectiveDbError && (
                <div className="state-box">
                  <div className="state-icon">⚠️</div>
                  <h3 className="state-title">Unable to Load Replenishment Data</h3>
                  <p className="state-body">
                    {effectiveDbError}. Failed to read data from SQLite storage.
                  </p>
                  <button
                    className="retry-btn"
                    onClick={() => {
                      if (urlStateParam === 'error') {
                        const url = new URL(window.location.href);
                        url.searchParams.delete('state');
                        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
                        setUrlStateParam(null);
                      }
                      loadSQLiteData();
                    }}
                  >
                    Retry Connection
                  </button>
                </div>
              )}

              {!isEffectiveLoading && !effectiveDbError && isEffectiveEmpty && (
                <div className="state-box">
                  <div className="state-icon">{products.length === 0 ? '📦' : '🔍'}</div>
                  <h3 className="state-title">
                    {products.length === 0 ? 'No Replenishment Required' : 'No Matching Replenishment Items'}
                  </h3>
                  <p className="state-body">
                    {products.length === 0
                      ? 'No products currently available in the replenishment catalog.'
                      : 'No products match the applied search and filter criteria. Clear filters to see full catalog.'}
                  </p>
                  <button
                    className="retry-btn"
                    onClick={() => {
                      if (products.length === 0) {
                        if (urlStateParam === 'empty') {
                          const url = new URL(window.location.href);
                          url.searchParams.delete('state');
                          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
                          setUrlStateParam(null);
                        }
                        setAddProductModalOpen(true);
                      } else {
                        setSearchTerm('');
                        setAppliedFilters({ statuses: [], suppliers: [], categories: [], search: '' });
                        setActiveQueueSupplierId(null);
                        handleClearColFilters();
                        if (urlStateParam === 'empty') {
                          const url = new URL(window.location.href);
                          url.searchParams.delete('state');
                          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
                          setUrlStateParam(null);
                        }
                      }
                    }}
                  >
                    {products.length === 0 ? 'Add First Product' : 'Clear Search & Filters'}
                  </button>
                </div>
              )}

              {isEffectiveHasResults && (
                <div
                  ref={tblWrapRef}
                  className="tbl-wrap"
                  onMouseMove={() => {
                    if (navMode === 'keyboard') setNavMode('mouse');
                  }}
                >
                  <table
                    className={`tbl ${navMode === 'keyboard' ? 'is-nav-keyboard' : 'is-nav-mouse'}`}
                    ref={tableRef}
                    aria-label="Replenishment products table"
                  >
                    <thead>
                      <tr>
                        <th className="col-chk">
                          <input
                            type="checkbox"
                            className="cb"
                            checked={isPageAllSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isPageSomeSelected;
                            }}
                            onChange={handleToggleSelectPage}
                            aria-label={`Select all eligible products on page ${currentPage}`}
                            title={`Select all on page ${currentPage}`}
                          />
                        </th>
                        <th className="col-id">Product ID</th>
                        <th className="col-sku">SKU</th>
                        <th className="col-name">Product Name</th>
                        <th className="col-sup">
                          <select
                            className={`th-header-select ${colFilters.supplierId ? 'active' : ''}`}
                            value={colFilters.supplierId}
                            onChange={(e) => setColFilters((prev) => ({ ...prev, supplierId: e.target.value }))}
                            aria-label="Filter by Supplier"
                            title="Filter Supplier"
                          >
                            <option value="">Supplier (All)</option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </th>
                        <th className="col-cat">
                          <select
                            className={`th-header-select ${colFilters.category ? 'active' : ''}`}
                            value={colFilters.category}
                            onChange={(e) => setColFilters((prev) => ({ ...prev, category: e.target.value }))}
                            aria-label="Filter by Category"
                            title="Filter Category"
                          >
                            <option value="">Category (All)</option>
                            {categories.map((cat) => {
                              const catName = typeof cat === 'string' ? cat : (cat.name || cat.id);
                              return (
                                <option key={cat.id || catName} value={catName}>
                                  {catName}
                                </option>
                              );
                            })}
                          </select>
                        </th>
                        <th className="col-stk num">Stock</th>
                        <th className="col-tgt num">Target</th>
                        <th className="col-st">
                          <select
                            className={`th-header-select ${colFilters.status ? 'active' : ''}`}
                            value={colFilters.status}
                            onChange={(e) => setColFilters((prev) => ({ ...prev, status: e.target.value }))}
                            aria-label="Filter by Status"
                            title="Filter Status"
                          >
                            <option value="">Status (All)</option>
                            <option value="critical">Critical</option>
                            <option value="low">Low Stock</option>
                            <option value="healthy">Healthy</option>
                            <option value="excess">Excess</option>
                          </select>
                        </th>
                        <th className="col-qty">Order Qty</th>
                        <th className="col-prc num">Unit Price</th>
                        <th className="col-sub num">
                          <select
                            className={`th-header-select th-subtotal-select ${colFilters.subtotalSort ? 'active' : ''}`}
                            value={colFilters.subtotalSort}
                            onChange={(e) => setColFilters((prev) => ({ ...prev, subtotalSort: e.target.value }))}
                            aria-label="Subtotal sort high or low"
                            title="Sort Subtotal"
                          >
                            <option value="">Subtotal</option>
                            <option value="high">High → Low</option>
                            <option value="low">Low → High</option>
                          </select>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSpacerHeight > 0 && (
                        <tr
                          aria-hidden="true"
                          className="virtual-spacer-row"
                          style={{ height: `${topSpacerHeight}px`, border: 'none', background: 'transparent' }}
                        >
                          <td colSpan={12} style={{ padding: 0, border: 'none', height: `${topSpacerHeight}px`, background: 'transparent' }} />
                        </tr>
                      )}
                      {visibleProducts.map((prod, index) => {
                        const pageIdx = isVirtualized ? virtualStartIndex + index : index;
                        const isOrdered = prod.orderStatus === 'ordered';
                        const hasPendingEdit = pendingQtyEdits[prod.sku] !== undefined;
                        const pendingVal = pendingQtyEdits[prod.sku];
                        const displayQty = hasPendingEdit ? pendingVal : prod.orderQty;
                        const numericQty = parseInt(displayQty, 10) || 0;
                        const lineSubtotal = numericQty * prod.unitCost;
                        const isEditingThis = editingSku === prod.sku;
                        const isRowFocused = focusedRowIndex === pageIdx;
                        const sup = suppliersMap[prod.supplierId];

                        const badgeType = isOrdered ? 'ordered' : prod.priority;
                        const badgeLabel = isOrdered
                          ? 'Ordered'
                          : prod.priority.charAt(0).toUpperCase() + prod.priority.slice(1);

                        return (
                          <MemoizedProductRow
                            key={prod.id}
                            prod={prod}
                            pageIdx={pageIdx}
                            isRowFocused={isRowFocused}
                            isOrdered={isOrdered}
                            hasPendingEdit={hasPendingEdit}
                            pendingVal={pendingVal}
                            displayQty={displayQty}
                            numericQty={numericQty}
                            lineSubtotal={lineSubtotal}
                            isEditingThis={isEditingThis}
                            supName={sup?.name || prod.supplierId}
                            supLogo={SUPPLIER_LOGOS[prod.supplierId]}
                            badgeType={badgeType}
                            badgeLabel={badgeLabel}
                            editQtyValue={isEditingThis ? editQtyValue : ''}
                            inlineQtyError={isEditingThis ? inlineQtyError : null}
                            onToggleSelect={handleToggleSelect}
                            onRowHover={handleRowHover}
                            onRowFocus={handleRowFocus}
                            onRowClick={handleRowClick}
                            onStartEdit={handleStartEdit}
                            onInlineQtyChange={handleInlineQtyChange}
                            onCommitInlineQty={handleCommitInlineQtyToPending}
                            onCancelInlineQty={handleCancelCurrentInlineQty}
                            onNavigateNext={handleNavigateNextRow}
                            onNavigatePrev={handleNavigatePrevRow}
                          />
                        );
                      })}
                      {bottomSpacerHeight > 0 && (
                        <tr
                          aria-hidden="true"
                          className="virtual-spacer-row"
                          style={{ height: `${bottomSpacerHeight}px`, border: 'none', background: 'transparent' }}
                        >
                          <td colSpan={12} style={{ padding: 0, border: 'none', height: `${bottomSpacerHeight}px`, background: 'transparent' }} />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Footer */}
              {isEffectiveHasResults && (
                <div className="pager" role="navigation" aria-label="Table pagination">
                  <div className="pager-left">
                    <span className="pager-info">
                      Showing {totalItems === 0 ? 0 : startIndex + 1}–{endIndex} of {totalItems} products
                    </span>
                  </div>
                  <div className="pager-right">
                    <div className="pager-size-wrap">
                      <label htmlFor="pager-page-size" className="pager-size-lbl">Rows per page:</label>
                      <select
                        id="pager-page-size"
                        className="pager-size-select"
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(e.target.value)}
                        aria-label="Products per page"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <div className="pager-nav">
                      <button
                        className="pager-btn pager-prev"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        aria-label="Previous page"
                        title="Previous page"
                      >
                        &lt;
                      </button>
                      {pageNumbers.map((pNum, idx) => {
                        if (pNum === '...') {
                          return (
                            <span key={`ellipsis-${idx}`} className="pager-ellipsis" aria-hidden="true">
                              …
                            </span>
                          );
                        }
                        return (
                          <button
                            key={pNum}
                            className={`pager-btn ${currentPage === pNum ? 'cur' : ''}`}
                            onClick={() => handlePageChange(pNum)}
                            aria-label={`Page ${pNum}`}
                            aria-current={currentPage === pNum ? 'page' : undefined}
                          >
                            {pNum}
                          </button>
                        );
                      })}
                      <button
                        className="pager-btn pager-next"
                        disabled={currentPage >= totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        aria-label="Next page"
                        title="Next page"
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Col 4: Purchase Order Draft & Supplier Review Summary (Right Side of Table) - Desktop & Tablet only */}
        <OrderDraftPanel
          windowWidth={windowWidth}
          draftExpanded={draftExpanded}
          setDraftExpanded={setDraftExpanded}
          handleCollapseDraft={handleCollapseDraft}
          allSelectedItems={allSelectedItems}
          selectedSupplierGroups={selectedSupplierGroups}
          expandedDraftSupplierIds={expandedDraftSupplierIds}
          toggleDraftAccordion={toggleDraftAccordion}
          supplierLogos={SUPPLIER_LOGOS}
          formatCurrency={formatCurrency}
          handleDraftQtyChange={handleDraftQtyChange}
          handleRemoveItemFromDraft={handleRemoveItemFromDraft}
          handlePromptCancel={handlePromptCancel}
          handlePromptSaveDraft={handlePromptSaveDraft}
          handlePromptSubmitPO={handlePromptSubmitPO}
          isDispatching={isDispatching}
        />

      </div>

      {/* ─── Pending Manifests Modal ────────────────────────────────────────── */}
      <PendingManifestsModal
        isOpen={manifestsModalOpen}
        onClose={() => setManifestsModalOpen(false)}
        supplierName={currentSupplier?.name}
        manifestsList={manifestsList}
      />

      {/* ─── PO History Modal ──────────────────────────────────────────────── */}
      <POHistoryModal
        isOpen={poHistoryModalOpen}
        onClose={() => setPoHistoryModalOpen(false)}
        supplier={currentSupplier}
        poHistoryList={poHistoryList}
        onDeletePO={handlePromptDeletePO}
        formatCurrency={formatCurrency}
        logoSrc={SUPPLIER_LOGOS[currentSupplier?.id]}
      />

      {/* ─── Supplier Contact Modal ────────────────────────────────────────── */}
      <SupplierContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        supplier={currentSupplier}
        contactData={contactData}
        logoSrc={SUPPLIER_LOGOS[currentSupplier?.id]}
      />


      {/* ─── Unified State-Changing Confirmation Modal (Cancel, Save, Submit, Delete) ─── */}
      <Modal
        isOpen={Boolean(confirmModalConfig)}
        onClose={confirmModalConfig?.onCancel}
        title={confirmModalConfig?.title || 'Confirmation'}
        icon={<span style={{ fontSize: 18 }} aria-hidden="true">⚠️</span>}
        size="md"
        contentClassName="confirm-modal"
        footer={
          <>
            <Button variant="secondary" onClick={confirmModalConfig?.onCancel}>
              Keep Editing
            </Button>
            <Button
              variant={confirmModalConfig?.confirmClass?.includes('danger') ? 'danger' : 'primary'}
              onClick={confirmModalConfig?.onConfirm}
            >
              {confirmModalConfig?.confirmText}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>{confirmModalConfig?.message}</p>
      </Modal>

      {/* ─── Unsaved Changes Confirmation Modal ──────────────────────────── */}
      <Modal
        isOpen={showUnsavedModal}
        onClose={cancelDiscardUnsaved}
        title="Discard Unsaved Changes?"
        icon={<span style={{ fontSize: 18 }} aria-hidden="true">⚠️</span>}
        size="sm"
        contentClassName="confirm-modal"
        footer={
          <>
            <Button variant="secondary" onClick={cancelDiscardUnsaved}>
              Keep Editing
            </Button>
            <Button variant="danger" onClick={confirmDiscardUnsaved}>
              Discard Changes
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          You have modified the order quantity for SKU <strong>{editingSku}</strong>. If you proceed without saving, your modifications will be discarded.
        </p>
      </Modal>

      {/* ─── Save All Pending Changes Confirmation Modal ─────────────────── */}
      <Modal
        isOpen={saveAllModalOpen}
        onClose={() => !isSavingAll && setSaveAllModalOpen(false)}
        title="Confirm Save All Quantity Changes"
        icon={<span style={{ fontSize: 18 }} aria-hidden="true">💾</span>}
        size="md"
        contentClassName="confirm-modal"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setSaveAllModalOpen(false)}
              disabled={isSavingAll}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSaveAll}
              disabled={isSavingAll}
            >
              {isSavingAll ? 'Saving to Database...' : `Confirm & Save (${Object.keys(pendingQtyEdits).length})`}
            </Button>
          </>
        }
      >
        <p style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--text)' }}>
          You are about to save changes for <strong>{Object.keys(pendingQtyEdits).length}</strong> product{Object.keys(pendingQtyEdits).length > 1 ? 's' : ''} to SQLite:
        </p>
        {saveAllError && (
          <div className="field-error" style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 6, color: '#ef4444', fontSize: 12, marginBottom: 12 }}>
            {saveAllError}
          </div>
        )}
        <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', color: 'var(--text2)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '6px 10px' }}>SKU</th>
                <th style={{ padding: '6px 10px' }}>Product</th>
                <th style={{ padding: '6px 10px', textAlign: 'right' }}>Current</th>
                <th style={{ padding: '6px 10px', textAlign: 'right' }}>New Qty</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(pendingQtyEdits).map(([sku, newQty]) => {
                const p = products.find((prod) => prod.sku === sku);
                return (
                  <tr key={sku} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{sku}</td>
                    <td style={{ padding: '6px 10px', color: 'var(--text2)' }}>{p?.name || 'Item'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text3)' }}>{p?.orderQty ?? 0}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--brand)' }}>{newQty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ─── Reorder Warning Confirmation Modal ──────────────────────────── */}
      <Modal
        isOpen={Boolean(reorderConfirmProd)}
        onClose={handleCancelReorder}
        title="Reorder Previously Dispatched Product?"
        icon={<span style={{ fontSize: 18 }} aria-hidden="true">🔄</span>}
        size="md"
        contentClassName="confirm-modal"
        footer={
          <>
            <Button variant="secondary" onClick={handleCancelReorder}>
              Cancel (Leave Unselected)
            </Button>
            <Button variant="primary" onClick={handleConfirmReorder}>
              Confirm Reorder
            </Button>
          </>
        }
      >
        {reorderConfirmProd && (
          <>
            <p style={{ margin: '0 0 10px 0', fontSize: 13, color: 'var(--text)' }}>
              <strong>{reorderConfirmProd.name}</strong> (SKU: <code>{reorderConfirmProd.sku}</code>) has already been ordered and dispatched.
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
              Would you like to select this product again for a new replenishment order? Your acknowledgement will be remembered in SQLite so you won't be prompted again for this product.
            </p>
          </>
        )}
      </Modal>

      {/* ─── Keyboard Shortcuts Reference Modal ───────────────────────────────── */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* ─── Filter Modal ─────────────────────────────────────────────────── */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        appliedFilters={
          activeQueueSupplierId && (!appliedFilters.suppliers || appliedFilters.suppliers.length === 0)
            ? { ...appliedFilters, suppliers: [activeQueueSupplierId] }
            : appliedFilters
        }
        onApply={(newFilters) => {
          setAppliedFilters(newFilters);
          if (newFilters.suppliers && newFilters.suppliers.length === 1) {
            setActiveQueueSupplierId(newFilters.suppliers[0]);
            setSelectedSupplierId(newFilters.suppliers[0]);
          } else {
            setActiveQueueSupplierId(null);
          }
          setFilterModalOpen(false);
        }}
        suppliers={suppliers}
        categories={categories}
        products={products}
      />

      {/* ─── Add Product Modal ─────────────────────────────────────────────── */}
      <AddProductModal
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        suppliers={suppliers}
        categories={categories}
        onProductCreated={handleProductCreated}
      />

      {/* ─── Add Supplier Modal ────────────────────────────────────────────── */}
      <AddSupplierModal
        isOpen={addSupplierModalOpen}
        onClose={() => setAddSupplierModalOpen(false)}
        onSupplierCreated={handleSupplierCreated}
      />

      {/* ─── Toast Feedback Notification ──────────────────────────────────── */}
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
