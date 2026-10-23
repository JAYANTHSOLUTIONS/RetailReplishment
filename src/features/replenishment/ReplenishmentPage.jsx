import { useState, useMemo, useEffect, useRef, useDeferredValue, useCallback } from 'react';
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
import { KeyboardShortcutsModal, Modal, Button } from '../../components/ui';
import {
  ReplenishmentTopbar,
  SupplierQueueRail,
  OrderDraftPanel,
  SupplierContactModal,
  PendingManifestsModal,
  POHistoryModal,
  ProductRow,
  SaveAllModal,
  ReorderConfirmModal,
  MobileReplenishmentView,
  ColumnFilterDropdown,
} from './components';
import useReplenishmentShortcuts from './hooks/useReplenishmentShortcuts.js';

// Helper currency formatter
const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;



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

  // Column-level dropdown filters & sort (Supplier, Category, Status, Subtotal)
  const [colFilters, setColFilters] = useState({
    supplierIds: [],
    categories: [],
    statuses: [],
    subtotalSort: '',
    sortColumn: null,
    sortDirection: null,
  });

  const activeColFilterCount = useMemo(() => {
    let count = 0;
    if (colFilters.supplierIds && colFilters.supplierIds.length > 0) count++;
    if (colFilters.categories && colFilters.categories.length > 0) count++;
    if (colFilters.statuses && colFilters.statuses.length > 0) count++;
    if (colFilters.subtotalSort || colFilters.sortColumn) count++;
    return count;
  }, [colFilters]);

  const handleClearColFilters = () => {
    setColFilters({
      supplierIds: [],
      categories: [],
      statuses: [],
      subtotalSort: '',
      sortColumn: null,
      sortDirection: null,
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

      // 4. Desktop column-level filters (Supplier, Category, Status) - multi-value array checks
      if (colFilters.supplierIds && colFilters.supplierIds.length > 0) {
        if (!colFilters.supplierIds.includes(p.supplierId)) {
          return false;
        }
      }
      if (colFilters.categories && colFilters.categories.length > 0) {
        if (!colFilters.categories.includes(p.category)) {
          return false;
        }
      }
      if (colFilters.statuses && colFilters.statuses.length > 0) {
        const pStatus = p.priority || p.status;
        if (!colFilters.statuses.includes(pStatus)) {
          return false;
        }
      }

      return true;
    });
  }, [products, appliedFilters, deferredSearchTerm, activeQueueSupplierId, suppliersMap, colFilters]);

  // Display ordering: Column Sort (Supplier, Category, Status, Name) or Subtotal (high to low / low to high) or default ascending Product ID
  const displayProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (colFilters.sortColumn) {
      const dir = colFilters.sortDirection === 'desc' ? -1 : 1;
      if (colFilters.sortColumn === 'supplier') {
        return list.sort((a, b) => {
          const nameA = suppliersMap[a.supplierId]?.name || '';
          const nameB = suppliersMap[b.supplierId]?.name || '';
          return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' }) * dir;
        });
      }
      if (colFilters.sortColumn === 'category') {
        return list.sort((a, b) => {
          const catA = a.category || '';
          const catB = b.category || '';
          return catA.localeCompare(catB, undefined, { sensitivity: 'base' }) * dir;
        });
      }
      if (colFilters.sortColumn === 'status') {
        return list.sort((a, b) => {
          const stA = a.priority || a.status || '';
          const stB = b.priority || b.status || '';
          return stA.localeCompare(stB, undefined, { sensitivity: 'base' }) * dir;
        });
      }
      if (colFilters.sortColumn === 'name') {
        return list.sort((a, b) => {
          const nA = a.name || '';
          const nB = b.name || '';
          return nA.localeCompare(nB, undefined, { sensitivity: 'base' }) * dir;
        });
      }
    }
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
  }, [filteredProducts, colFilters.sortColumn, colFilters.sortDirection, colFilters.subtotalSort, pendingQtyEdits, suppliersMap]);

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

  // Group C - Pagination renders all active page items (10, 25, or 50) cleanly without 27-row cutoff
  const topSpacerHeight = 0;
  const bottomSpacerHeight = 0;
  const visibleProducts = paginatedProducts;

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
    const prod = products.find((p) => p.sku === sku);
    const check = validateOrderQtyInput(editQtyValue, prod ? {
      currentStock: prod.currentStock,
      safetyTarget: prod.safetyTarget,
    } : {});
    if (!check.isValid) {
      setInlineQtyError(check.error);
      return false;
    }
    setInlineQtyError(null);
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

  // Save All behavior: Transactional commit of all pending quantity edits directly to SQLite without confirmation modal
  const handleConfirmSaveAll = async () => {
    const pendingSkus = Object.keys(pendingQtyEdits);
    if (pendingSkus.length === 0) return;

    // Validate all pending edits first
    const editsToSave = [];
    for (const sku of pendingSkus) {
      const valStr = pendingQtyEdits[sku];
      const prod = products.find((p) => p.sku === sku);
      const check = validateOrderQtyInput(valStr, prod ? {
        currentStock: prod.currentStock,
        safetyTarget: prod.safetyTarget,
      } : {});
      if (!check.isValid) {
        setSaveAllError(`Invalid quantity for ${sku}: ${check.error}`);
        showToast(`Invalid quantity for ${sku}: ${check.error}`, 'warn');
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
      showToast(`Successfully saved all ${editsToSave.length} product quantity changes to SQLite.`, 'success');
    } catch (err) {
      console.error('Save All transaction failed:', err);
      setSaveAllError(err.message || 'SQLite transaction failed. Changes were not committed.');
      showToast('SQLite transaction failed. Changes were not committed.', 'warn');
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
  useReplenishmentShortcuts({
    searchInputRef,
    tableRef,
    paginatedProducts,
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
    handleCancelCurrentInlineQty,
    handleToggleSelect,
    pendingQtyEdits,
    setEditingSku,
    setEditQtyValue,
    setInlineQtyError,
    setIsUnsaved,
  });


  // Reset table scroll position when page or page size changes
  useEffect(() => {
    if (tblWrapRef.current) {
      tblWrapRef.current.scrollTop = 0;
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
            <MobileReplenishmentView
              mobileView={mobileView}
              setMobileView={setMobileView}
              selectedSupplierGroups={selectedSupplierGroups}
              expandedDraftSupplierIds={expandedDraftSupplierIds}
              toggleDraftAccordion={toggleDraftAccordion}
              overallTotalAmount={overallTotalAmount}
              handleApplyAllDraftMinimums={handleApplyAllDraftMinimums}
              allSelectedItems={allSelectedItems}
              handleDraftQtyChange={handleDraftQtyChange}
              handleRemoveItemFromDraft={handleRemoveItemFromDraft}
              handlePromptCancel={handlePromptCancel}
              handlePromptSaveDraft={handlePromptSaveDraft}
              handlePromptSubmitPO={handlePromptSubmitPO}
              isDispatching={isDispatching}
              setFilterModalOpen={setFilterModalOpen}
              hasActiveFilters={hasActiveFilters}
              activeFilterCount={activeFilterCount}
              mobileMatrixMenuRef={mobileMatrixMenuRef}
              mobileMatrixMenuOpen={mobileMatrixMenuOpen}
              setMobileMatrixMenuOpen={setMobileMatrixMenuOpen}
              setAddProductModalOpen={setAddProductModalOpen}
              setAddSupplierModalOpen={setAddSupplierModalOpen}
              setShortcutsModalOpen={setShortcutsModalOpen}
              themePreference={themePreference}
              handleSelectTheme={handleSelectTheme}
              isAllFilteredSelected={isAllFilteredSelected}
              handleClearAllSelections={handleClearAllSelections}
              handleSelectAllFiltered={handleSelectAllFiltered}
              handleApplySupplierMinimums={handleApplySupplierMinimums}
              isEffectiveLoading={isEffectiveLoading}
              effectiveDbError={effectiveDbError}
              isEffectiveEmpty={isEffectiveEmpty}
              setAppliedFilters={setAppliedFilters}
              setActiveQueueSupplierId={setActiveQueueSupplierId}
              setSearchTerm={setSearchTerm}
              paginatedProducts={paginatedProducts}
              displayProducts={displayProducts}
              totalProductsCount={products.length}
              suppliersMap={suppliersMap}
              pendingQtyEdits={pendingQtyEdits}
              handleToggleSelect={handleToggleSelect}
              editingSku={editingSku}
              setEditingSku={setEditingSku}
              editQtyValue={editQtyValue}
              setEditQtyValue={setEditQtyValue}
              handleMobileCardQtyChange={handleMobileCardQtyChange}
              formatCurrency={formatCurrency}
              supplierLogos={SUPPLIER_LOGOS}
              pageSize={pageSize}
              handlePageSizeChange={handlePageSizeChange}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              currentPage={currentPage}
              handlePageChange={handlePageChange}
              pageNumbers={pageNumbers}
              totalPages={totalPages}
            />
          ) : (
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

              {/* Filter & Action Bar: Showing text on left, Actions and Filter logo on right */}
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

                <div className="filter-right" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {/* Select All / Deselect All Button */}
                  {selectedProducts.length > 0 && (
                    <button
                      type="button"
                      className={`btn-toolbar-select-all ${isAllFilteredSelected ? 'active' : ''}`}
                      onClick={isAllFilteredSelected ? handleClearAllSelections : handleSelectAllFiltered}
                      title={isAllFilteredSelected ? 'Deselect all products' : 'Select all products'}
                    >
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        readOnly
                        style={{ pointerEvents: 'none' }}
                      />
                      <span>{isAllFilteredSelected ? 'Deselect All' : `Select All (${eligibleFilteredProducts.length})`}</span>
                    </button>
                  )}

                  {/* Cancel Selection Button */}
                  {selectedProducts.length > 0 && (
                    <button
                      type="button"
                      className="btn-bulk-cancel"
                      onClick={handleClearAllSelections}
                      title="Cancel selection"
                    >
                      Cancel Selection
                    </button>
                  )}

                  {/* Save All button when pending quantity edits exist */}
                  {Object.keys(pendingQtyEdits).length > 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        className="btn-save-all"
                        onClick={handleConfirmSaveAll}
                        disabled={isSavingAll}
                        title={`Save ${Object.keys(pendingQtyEdits).length} pending quantity changes`}
                        aria-label="Save All Pending Changes"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </svg>
                        <span>{isSavingAll ? 'Saving...' : `Save All (${Object.keys(pendingQtyEdits).length})`}</span>
                      </button>
                      <button
                        type="button"
                        className="btn-discard-all"
                        onClick={handleDiscardAllPending}
                        title="Discard all pending quantity edits"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {selectedProducts.length === 0 && Object.keys(pendingQtyEdits).length === 0 && (
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

                  {/* Filter logo button - no text filter, just the filter logo, count badge, and clear x */}
                  <button
                    type="button"
                    className={`btn-filter-modal ${hasActiveFilters ? 'active' : ''}`}
                    onClick={() => setFilterModalOpen(true)}
                    aria-label="Open filter modal"
                    title="Filter products"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
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
                        <th className="col-name">
                          <ColumnFilterDropdown
                            title="Product Name"
                            options={[]}
                            currentSort={colFilters.sortColumn === 'name' ? colFilters.sortDirection : null}
                            sortOptions={[
                              { key: 'asc', label: 'Sort A to Z' },
                              { key: 'desc', label: 'Sort Z to A' },
                            ]}
                            onApply={({ sort }) => {
                              setColFilters((prev) => ({
                                ...prev,
                                sortColumn: sort ? 'name' : (prev.sortColumn === 'name' ? null : prev.sortColumn),
                                sortDirection: sort || (prev.sortColumn === 'name' ? null : prev.sortDirection),
                                subtotalSort: sort ? '' : prev.subtotalSort,
                              }));
                            }}
                            onClear={() => setColFilters((prev) => ({
                              ...prev,
                              sortColumn: prev.sortColumn === 'name' ? null : prev.sortColumn,
                              sortDirection: prev.sortColumn === 'name' ? null : prev.sortDirection,
                            }))}
                          />
                        </th>
                        <th className="col-sup">
                          <ColumnFilterDropdown
                            title="Supplier"
                            options={suppliers.map((s) => ({
                              value: s.id,
                              label: s.name,
                              count: products.filter((p) => p.supplierId === s.id).length,
                            }))}
                            selectedValues={colFilters.supplierIds}
                            currentSort={colFilters.sortColumn === 'supplier' ? colFilters.sortDirection : null}
                            onApply={({ selectedValues, sort }) => {
                              setColFilters((prev) => ({
                                ...prev,
                                supplierIds: selectedValues,
                                sortColumn: sort ? 'supplier' : (prev.sortColumn === 'supplier' ? null : prev.sortColumn),
                                sortDirection: sort || (prev.sortColumn === 'supplier' ? null : prev.sortDirection),
                                subtotalSort: sort ? '' : prev.subtotalSort,
                              }));
                            }}
                            onClear={() => setColFilters((prev) => ({
                              ...prev,
                              supplierIds: [],
                              sortColumn: prev.sortColumn === 'supplier' ? null : prev.sortColumn,
                              sortDirection: prev.sortColumn === 'supplier' ? null : prev.sortDirection,
                            }))}
                          />
                        </th>
                        <th className="col-cat">
                          <ColumnFilterDropdown
                            title="Category"
                            options={categories.map((cat) => {
                              const catName = typeof cat === 'string' ? cat : (cat.name || cat.id);
                              return {
                                value: catName,
                                label: catName,
                                count: products.filter((p) => p.category === catName).length,
                              };
                            })}
                            selectedValues={colFilters.categories}
                            currentSort={colFilters.sortColumn === 'category' ? colFilters.sortDirection : null}
                            onApply={({ selectedValues, sort }) => {
                              setColFilters((prev) => ({
                                ...prev,
                                categories: selectedValues,
                                sortColumn: sort ? 'category' : (prev.sortColumn === 'category' ? null : prev.sortColumn),
                                sortDirection: sort || (prev.sortColumn === 'category' ? null : prev.sortDirection),
                                subtotalSort: sort ? '' : prev.subtotalSort,
                              }));
                            }}
                            onClear={() => setColFilters((prev) => ({
                              ...prev,
                              categories: [],
                              sortColumn: prev.sortColumn === 'category' ? null : prev.sortColumn,
                              sortDirection: prev.sortColumn === 'category' ? null : prev.sortDirection,
                            }))}
                          />
                        </th>
                        <th className="col-stk num">Stock</th>
                        <th className="col-tgt num">Target</th>
                        <th className="col-st">
                          <ColumnFilterDropdown
                            title="Status"
                            options={[
                              { value: 'critical', label: 'Critical', count: products.filter((p) => (p.priority || p.status) === 'critical').length },
                              { value: 'low', label: 'Low Stock', count: products.filter((p) => (p.priority || p.status) === 'low').length },
                              { value: 'healthy', label: 'Healthy', count: products.filter((p) => (p.priority || p.status) === 'healthy').length },
                              { value: 'excess', label: 'Excess', count: products.filter((p) => (p.priority || p.status) === 'excess').length },
                            ]}
                            selectedValues={colFilters.statuses}
                            currentSort={colFilters.sortColumn === 'status' ? colFilters.sortDirection : null}
                            onApply={({ selectedValues, sort }) => {
                              setColFilters((prev) => ({
                                ...prev,
                                statuses: selectedValues,
                                sortColumn: sort ? 'status' : (prev.sortColumn === 'status' ? null : prev.sortColumn),
                                sortDirection: sort || (prev.sortColumn === 'status' ? null : prev.sortDirection),
                                subtotalSort: sort ? '' : prev.subtotalSort,
                              }));
                            }}
                            onClear={() => setColFilters((prev) => ({
                              ...prev,
                              statuses: [],
                              sortColumn: prev.sortColumn === 'status' ? null : prev.sortColumn,
                              sortDirection: prev.sortColumn === 'status' ? null : prev.sortDirection,
                            }))}
                          />
                        </th>
                        <th className="col-qty">Order Qty</th>
                        <th className="col-prc num">Unit Price</th>
                        <th className="col-sub num">
                          <ColumnFilterDropdown
                            title="Subtotal"
                            options={[]}
                            align="right"
                            currentSort={colFilters.subtotalSort}
                            sortOptions={[
                              { key: 'high', label: 'Sort High → Low' },
                              { key: 'low', label: 'Sort Low → High' },
                            ]}
                            onApply={({ sort }) => {
                              setColFilters((prev) => ({
                                ...prev,
                                subtotalSort: sort || '',
                                sortColumn: sort ? null : prev.sortColumn,
                                sortDirection: sort ? null : prev.sortDirection,
                              }));
                            }}
                            onClear={() => setColFilters((prev) => ({ ...prev, subtotalSort: '' }))}
                          />
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
                        const pageIdx = index;
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
                          <ProductRow
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
                            formatCurrency={formatCurrency}
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
      <SaveAllModal
        isOpen={saveAllModalOpen}
        onClose={() => setSaveAllModalOpen(false)}
        isSavingAll={isSavingAll}
        onConfirm={handleConfirmSaveAll}
        pendingQtyEdits={pendingQtyEdits}
        products={products}
        saveAllError={saveAllError}
      />

      {/* ─── Reorder Warning Confirmation Modal ──────────────────────────── */}
      <ReorderConfirmModal
        reorderConfirmProd={reorderConfirmProd}
        onCancel={handleCancelReorder}
        onConfirm={handleConfirmReorder}
      />


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
