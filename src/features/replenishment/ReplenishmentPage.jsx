import { useState, useMemo, useEffect, useRef } from 'react';
import '../../styles/replenishment.css';
import {
  fetchSuppliers,
  fetchInventory,
  fetchCategories,
  fetchSupplierContact,
  fetchPendingManifests,
  fetchPOHistory,
  updateItemOrderQty,
  toggleItemSelection,
  clearAllSelection,
  applySupplierMinimums as applySupplierMinimumsDB,
  saveDraftPO,
  submitPurchaseOrder,
  deletePurchaseOrder,
  bulkUpdateInventory,
} from '../../db/queries.js';
import {
  validateSupplierMoq,
  groupSelectedBySupplier,
} from '../../utils/supplierValidation.js';
import FilterModal from './FilterModal.jsx';
import { matchesFilters } from '../../utils/filterRules.js';
import BulkEditModal from './BulkEditModal.jsx';
import AddProductModal from './AddProductModal.jsx';
import AddSupplierModal from './AddSupplierModal.jsx';
import mainLogo from '../../assets/logos/main-logo.png';
import draftLogo from '../../assets/logos/draft-logo.png';
import queueLogo from '../../assets/logos/queue-logo.png';
import matrixLogo from '../../assets/logos/matrix-logo.png';
import supplierHFSrc from '../../assets/suppliers/supplier-hf.jpg';
import supplierBISrc from '../../assets/suppliers/supplier-bi.jpg';
import supplierNFSrc from '../../assets/suppliers/supplier-nf.jpg';

export const SUPPLIER_LOGOS = {
  hf: supplierHFSrc,
  bi: supplierBISrc,
  nf: supplierNFSrc,
};

// ── Initial Seed / Fallback Data ──────────────────────────────────────────────
const INITIAL_SUPPLIERS = [
  {
    id: 'hf',
    name: 'Heritage Foods',
    category: 'Dairy & Bakery',
    initials: 'H',
    badge: 'Preferred',
    badgeType: 'preferred',
    targetMoq: 10000,
    unitThreshold: 50,
    leadTime: '2d',
    color: '#059669',
  },
  {
    id: 'bi',
    name: 'Britannia Industries',
    category: 'Snacks & Biscuits',
    initials: 'BI',
    badge: null,
    badgeType: null,
    targetMoq: 8000,
    unitThreshold: 40,
    leadTime: '4d',
    color: '#dc2626',
  },
  {
    id: 'nf',
    name: "Nature's Farm",
    category: 'Fruits & Vegetables',
    initials: 'NF',
    badge: 'Healthy',
    badgeType: 'healthy',
    targetMoq: 5000,
    unitThreshold: 30,
    leadTime: '1d',
    color: '#16a34a',
    allHealthy: true,
  },
];

const INITIAL_PRODUCTS = [
  // Heritage Foods
  {
    id: 'hf-001',
    sku: 'HF-001',
    name: 'Fresh Milk 1L',
    category: 'Dairy',
    supplierId: 'hf',
    currentStock: 12,
    safetyTarget: 50,
    status: 'critical',
    priority: 'critical',
    orderQty: 0,
    unitCost: 90,
    selected: false,
  },
  {
    id: 'hf-002',
    sku: 'HF-002',
    name: 'Whole Wheat Bread',
    category: 'Bakery',
    supplierId: 'hf',
    currentStock: 25,
    safetyTarget: 60,
    status: 'critical',
    priority: 'critical',
    orderQty: 0,
    unitCost: 90,
    selected: false,
  },
  {
    id: 'hf-003',
    sku: 'HF-003',
    name: 'Paneer 200g',
    category: 'Dairy',
    supplierId: 'hf',
    currentStock: 18,
    safetyTarget: 40,
    status: 'critical',
    priority: 'critical',
    orderQty: 0,
    unitCost: 108.75,
    selected: false,
  },
  {
    id: 'hf-020',
    sku: 'HF-020',
    name: 'Cheese Block 1kg',
    category: 'Dairy',
    supplierId: 'hf',
    currentStock: 8,
    safetyTarget: 20,
    status: 'critical',
    priority: 'critical',
    orderQty: 0,
    unitCost: 450,
    selected: false,
  },
  {
    id: 'hf-004',
    sku: 'HF-004',
    name: 'Curd 500g',
    category: 'Dairy',
    supplierId: 'hf',
    currentStock: 22,
    safetyTarget: 40,
    status: 'low',
    priority: 'low',
    orderQty: 0,
    unitCost: 40,
    selected: false,
  },
  {
    id: 'hf-005',
    sku: 'HF-005',
    name: 'Butter 500g',
    category: 'Dairy',
    supplierId: 'hf',
    currentStock: 15,
    safetyTarget: 30,
    status: 'low',
    priority: 'low',
    orderQty: 0,
    unitCost: 260,
    selected: false,
  },
  {
    id: 'hf-006',
    sku: 'HF-006',
    name: 'Eggs (10 pcs)',
    category: 'Dairy',
    supplierId: 'hf',
    currentStock: 35,
    safetyTarget: 60,
    status: 'low',
    priority: 'low',
    orderQty: 0,
    unitCost: 80,
    selected: false,
  },
  {
    id: 'hf-007',
    sku: 'HF-007',
    name: 'Tomato Ketchup 500g',
    category: 'Snacks',
    supplierId: 'hf',
    currentStock: 45,
    safetyTarget: 50,
    status: 'healthy',
    priority: 'healthy',
    orderQty: 0,
    unitCost: 110,
    selected: false,
  },
  {
    id: 'hf-008',
    sku: 'HF-008',
    name: 'Corn Flakes 500g',
    category: 'Breakfast',
    supplierId: 'hf',
    currentStock: 28,
    safetyTarget: 40,
    status: 'healthy',
    priority: 'healthy',
    orderQty: 0,
    unitCost: 180,
    selected: false,
  },
  {
    id: 'hf-009',
    sku: 'HF-009',
    name: 'Olive Oil 1L',
    category: 'Grocery',
    supplierId: 'hf',
    currentStock: 12,
    safetyTarget: 30,
    status: 'healthy',
    priority: 'healthy',
    orderQty: 0,
    unitCost: 750,
    selected: false,
  },
  // Britannia Items
  {
    id: 'bi-001',
    sku: 'BI-001',
    name: 'Good Day Butter 100g',
    category: 'Biscuits',
    supplierId: 'bi',
    currentStock: 14,
    safetyTarget: 60,
    status: 'critical',
    priority: 'critical',
    orderQty: 0,
    unitCost: 30,
    selected: false,
  },
  {
    id: 'bi-002',
    sku: 'BI-002',
    name: 'Bourbon Chocolate 150g',
    category: 'Biscuits',
    supplierId: 'bi',
    currentStock: 10,
    safetyTarget: 50,
    status: 'critical',
    priority: 'critical',
    orderQty: 0,
    unitCost: 35,
    selected: false,
  },
  {
    id: 'bi-003',
    sku: 'BI-003',
    name: 'NutriChoice Digestive 200g',
    category: 'Biscuits',
    supplierId: 'bi',
    currentStock: 12,
    safetyTarget: 40,
    status: 'critical',
    priority: 'critical',
    orderQty: 0,
    unitCost: 50,
    selected: false,
  },
  // Nature's Farm Items
  {
    id: 'nf-001',
    sku: 'NF-001',
    name: 'Organic Cavendish Bananas',
    category: 'Fruits',
    supplierId: 'nf',
    currentStock: 45,
    safetyTarget: 40,
    status: 'healthy',
    priority: 'healthy',
    orderQty: 0,
    unitCost: 60,
    selected: false,
  },
];

// Helper currency formatter
const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function ReplenishmentPage() {
  // Genuine application load & error states
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Active supplier & search
  const [selectedSupplierId, setSelectedSupplierId] = useState('hf');
  const [searchTerm, setSearchTerm] = useState('');

  // Advanced Filter Modal State
  const [appliedFilters, setAppliedFilters] = useState({
    statuses: [],
    suppliers: [],
    categories: [],
    stockLevels: [],
    search: '',
  });
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [addSupplierModalOpen, setAddSupplierModalOpen] = useState(false);

  // Categories list from SQLite
  const [categories, setCategories] = useState([]);

  // SQLite Backed State
  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

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

  // State-Changing Confirmation Modal
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Inline editing state
  const [editingSku, setEditingSku] = useState(null);
  const [editQtyValue, setEditQtyValue] = useState('0');
  const [isUnsaved, setIsUnsaved] = useState(false);

  // Unsaved quantity changes modal
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState(null);

  // Keyboard navigation focus and refs
  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const searchInputRef = useRef(null);
  const tableRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── 1. Initialize SQLite Database & Load Authoritative Data ───────────────────
  const loadSQLiteData = async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const [sups, prods, cats] = await Promise.all([
        fetchSuppliers(),
        fetchInventory(),
        fetchCategories(),
      ]);
      if (sups && sups.length > 0) setSuppliers(sups);
      if (prods && prods.length > 0) setProducts(prods);
      if (cats && cats.length > 0) setCategories(cats);
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
        const [sups, prods, cats] = await Promise.all([
          fetchSuppliers(),
          fetchInventory(),
          fetchCategories(),
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

  // Safe action check: prompt confirmation modal if inline changes are unsaved
  const requestActionWithUnsavedCheck = (action) => {
    if (isUnsaved) {
      setPendingAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  };

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
    return suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0] || INITIAL_SUPPLIERS[0];
  }, [suppliers, selectedSupplierId]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.statuses?.length) count += appliedFilters.statuses.length;
    if (appliedFilters.suppliers?.length) count += appliedFilters.suppliers.length;
    if (appliedFilters.categories?.length) count += appliedFilters.categories.length;
    if (appliedFilters.stockLevels?.length) count += appliedFilters.stockLevels.length;
    if (appliedFilters.search?.trim()) count += 1;
    return count;
  }, [appliedFilters]);

  const hasActiveFilters = activeFilterCount > 0;

  // Filter products using global search + advanced filter rules (AND across groups, OR within group)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return matchesFilters(p, appliedFilters);
    });
  }, [products, appliedFilters, searchTerm]);

  // Stable default ordering: ascending Product ID
  const displayProducts = useMemo(() => {
    const list = [...filteredProducts];
    return list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
  }, [filteredProducts]);

  // Total items and pagination calculations
  const totalItems = displayProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Auto-reset page 1 on filter/search change and clamp page when totalPages shrinks (during render)
  const [prevFilterKey, setPrevFilterKey] = useState('');
  const currentFilterKey = `${searchTerm}::${JSON.stringify(appliedFilters)}`;
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
  const selectedProducts = useMemo(() => {
    return products.filter((p) => p.selected && p.orderStatus !== 'ordered');
  }, [products]);

  // Derived selection-based panel visibility: True if >= 1 eligible product is ticked
  const hasEligibleSelection = useMemo(() => {
    return products.some((p) => p.selected && p.orderStatus !== 'ordered');
  }, [products]);

  // Contextual Supplier Queue:
  // Shows suppliers relevant to selected products and active filters
  const activeQueueSuppliers = useMemo(() => {
    const suppliersWithSelected = new Set(
      products.filter((p) => p.selected && p.orderStatus !== 'ordered').map((p) => p.supplierId)
    );

    let eligibleIds = new Set();
    suppliersWithSelected.forEach((id) => eligibleIds.add(id));
    if (hasActiveFilters) {
      filteredProducts.forEach((p) => eligibleIds.add(p.supplierId));
    }

    if (eligibleIds.size === 0) {
      return suppliers;
    }

    return suppliers.filter((s) => eligibleIds.has(s.id));
  }, [hasActiveFilters, filteredProducts, products, suppliers]);

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

  // Selected items calculations for active supplier draft
  const selectedItems = useMemo(() => {
    return products.filter((p) => p.supplierId === selectedSupplierId && p.selected && p.orderQty > 0 && p.orderStatus !== 'ordered');
  }, [products, selectedSupplierId]);

  // Authoritative supplier MOQ & threshold validation
  const supplierValidation = useMemo(() => {
    return validateSupplierMoq(currentSupplier, selectedItems);
  }, [currentSupplier, selectedItems]);

  const totalSelectedUnits = supplierValidation.totalUnits;
  const totalSelectedAmount = supplierValidation.subtotal;

  // Selected products grouped by supplier for Review Summary
  const selectedSupplierGroups = useMemo(() => {
    const allSelected = products.filter((p) => p.selected && p.orderQty > 0 && p.orderStatus !== 'ordered');
    return groupSelectedBySupplier(allSelected, suppliers);
  }, [products, suppliers]);

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

  // Horizontal grid column definition for 4-column side workspace layout
  const gridColumns = useMemo(() => {
    const col1 = '52px';
    const col2 = sqExpanded ? '260px' : '44px';
    const col3 = '1fr';
    const col4 = draftExpanded ? '320px' : '44px';
    return `${col1} ${col2} ${col3} ${col4}`;
  }, [sqExpanded, draftExpanded]);

  // ── Database Mutation Handlers (Selection Protected by Unsaved Checks) ──────

  // Toggle selection for current visible page
  const handleToggleSelectPage = () => {
    requestActionWithUnsavedCheck(async () => {
      const nextVal = !isPageAllSelected;
      const eligibleIds = eligiblePageProducts.map((p) => p.id);
      try {
        for (const id of eligibleIds) {
          const prod = products.find((x) => x.id === id);
          const nextQty = nextVal && prod.orderQty === 0 ? Math.max(0, prod.safetyTarget - prod.currentStock) : prod.orderQty;
          await toggleItemSelection(id, nextVal, nextQty);
        }
        setProducts((prev) =>
          prev.map((p) => {
            if (eligibleIds.includes(p.id)) {
              return {
                ...p,
                selected: nextVal,
                orderQty: nextVal && p.orderQty === 0 ? Math.max(0, p.safetyTarget - p.currentStock) : p.orderQty,
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
            setSqExpanded(false);
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
          const nextQty = nextVal && prod.orderQty === 0 ? Math.max(0, prod.safetyTarget - prod.currentStock) : prod.orderQty;
          await toggleItemSelection(id, nextVal, nextQty);
        }
        setProducts((prev) =>
          prev.map((p) => {
            if (eligibleIds.includes(p.id)) {
              return {
                ...p,
                selected: nextVal,
                orderQty: nextVal && p.orderQty === 0 ? Math.max(0, p.safetyTarget - p.currentStock) : p.orderQty,
              };
            }
            return p;
          })
        );
        if (eligibleIds.length > 0) {
          const firstSelected = products.find((x) => x.id === eligibleIds[0]);
          if (firstSelected) setSelectedSupplierId(firstSelected.supplierId);
          setSqExpanded(true);
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
        setSqExpanded(false);
        setDraftExpanded(false);
        showToast('Selection cleared.');
      } catch {
        showToast('Failed to clear selections in SQLite.', 'warn');
      }
    });
  };

  // Row selection toggle
  const handleToggleSelect = (id) => {
    requestActionWithUnsavedCheck(async () => {
      const target = products.find((p) => p.id === id);
      if (!target || target.orderStatus === 'ordered') return;
      const nextSelected = !target.selected;
      let nextQty = target.orderQty;
      if (nextSelected && target.orderQty === 0) {
        nextQty = Math.max(0, target.safetyTarget - target.currentStock);
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
          setSqExpanded(true);
          setDraftExpanded(true);
        } else {
          const remainingSelected = products.some((p) => p.id !== id && p.selected && p.orderStatus !== 'ordered');
          if (!remainingSelected) {
            setSqExpanded(false);
            setDraftExpanded(false);
          }
        }
      } catch {
        console.warn('Error updating item selection');
      }
    });
  };

  // Bulk edit handler
  const handleBulkEdit = async (targetIds, updates) => {
    await bulkUpdateInventory(targetIds, updates);
    const updated = await fetchInventory();
    setProducts(updated);
    const cats = await fetchCategories();
    setCategories(cats);
    showToast(`Bulk updated ${targetIds.length} items successfully.`);
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

  // Save inline quantity edit
  const handleSaveInlineQty = async (sku) => {
    const parsed = parseInt(editQtyValue, 10);
    const validQty = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    try {
      await updateItemOrderQty(sku, validQty);
      setProducts((prev) =>
        prev.map((p) => {
          if (p.sku === sku) {
            return {
              ...p,
              orderQty: validQty,
              selected: validQty > 0,
            };
          }
          return p;
        })
      );
      setEditingSku(null);
      setIsUnsaved(false);
      showToast(`Updated quantity for ${sku} to ${validQty} units.`);
    } catch {
      showToast('Failed to persist quantity update to SQLite.', 'warn');
    }
  };

  const handleCancelInlineQty = () => {
    const currentProd = products.find((p) => p.sku === editingSku);
    const originalVal = currentProd ? String(currentProd.orderQty) : '';
    if (!isUnsaved || editQtyValue === originalVal) {
      setEditingSku(null);
      setIsUnsaved(false);
      return;
    }
    requestActionWithUnsavedCheck(() => {
      confirmDiscardUnsaved();
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

  // Cancel selection workflow (replaces old Discard Changes button)
  const handlePromptCancel = () => {
    if (selectedItems.length === 0 && !isUnsaved) {
      showToast('No active selection to cancel.');
      return;
    }
    setConfirmModalConfig({
      title: 'Cancel Inventory Selection?',
      message: `Are you sure you want to cancel the current selection? All selected checkboxes (${selectedItems.length} items) will be cleared.`,
      confirmText: 'Confirm Cancel',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await clearAllSelection();
          setProducts((prev) => prev.map((p) => ({ ...p, selected: false })));
          setIsUnsaved(false);
          setSqExpanded(false);
          setDraftExpanded(false);
          setConfirmModalConfig(null);
          showToast('Selection cancelled successfully.');
        } catch {
          showToast('Failed to clear selection in database.', 'warn');
        }
      },
      onCancel: () => setConfirmModalConfig(null),
    });
  };

  // Save Draft workflow with SQLite persistence
  const handlePromptSaveDraft = () => {
    setConfirmModalConfig({
      title: 'Save Purchase Order Draft?',
      message: `Save current draft for ${currentSupplier.name} with ${selectedItems.length} items totaling ${formatCurrency(totalSelectedAmount)} to the SQLite database?`,
      confirmText: 'Save Draft',
      confirmClass: 'btn-primary-action',
      onConfirm: async () => {
        try {
          await saveDraftPO({
            supplierId: selectedSupplierId,
            items: selectedItems,
            subtotal: totalSelectedAmount,
            tax: 0,
            totalAmount: totalSelectedAmount,
            notes: `Draft updated on ${new Date().toLocaleDateString()}`,
          });
          setIsUnsaved(false);
          setConfirmModalConfig(null);
          showToast('Changes saved successfully.');
        } catch (err) {
          showToast('Failed to save draft to database: ' + err.message, 'warn');
        }
      },
      onCancel: () => setConfirmModalConfig(null),
    });
  };

  // Submit & Dispatch PO workflow with SQLite persistence, validation, and horizontal auto-collapse
  const handlePromptSubmitPO = () => {
    // 1. Guard against uncommitted inline quantity edits
    if (isUnsaved) {
      showToast('Please save or cancel inline quantity editing before dispatching.', 'warn');
      return;
    }

    // 2. Validate selection
    if (selectedItems.length === 0) {
      showToast('Cannot dispatch empty purchase order. Select products from the matrix first.', 'warn');
      return;
    }

    // 3. Enforce supplier MOQ and unit threshold requirements
    if (!supplierValidation.valid) {
      showToast(supplierValidation.message || 'Supplier minimum order requirement not satisfied.', 'warn');
      return;
    }

    setConfirmModalConfig({
      title: 'Dispatch Purchase Order?',
      message: `Confirm local dispatch of purchase order for ${currentSupplier.name}? (${selectedItems.length} SKUs, total ${formatCurrency(totalSelectedAmount)}). This will record the order in SQLite, clear active selections, and refresh inventory status.`,
      confirmText: isDispatching ? 'Dispatching...' : 'Confirm & Dispatch',
      confirmClass: 'btn-primary-action',
      onConfirm: async () => {
        setIsDispatching(true);
        try {
          const res = await submitPurchaseOrder({
            supplierId: selectedSupplierId,
            items: selectedItems,
            subtotal: totalSelectedAmount,
            tax: 0,
            totalAmount: totalSelectedAmount,
            notes: `Dispatched locally from Replenishment Desk`,
          });

          // 1. Untick every row included in the dispatched order & reset select states
          setProducts((prev) =>
            prev.map((p) => {
              if (selectedItems.some((sel) => sel.id === p.id || sel.sku === p.sku)) {
                return { ...p, selected: false, orderQty: 0 };
              }
              return p;
            })
          );
          setSqExpanded(false);
          setDraftExpanded(false);

          // 2. Reload authoritative inventory from SQLite & recalculate priorities
          const refreshedInventory = await fetchInventory();
          setProducts(refreshedInventory);

          // 3. Refresh purchase order history so completed order is immediately visible
          const updatedHistory = await fetchPOHistory(selectedSupplierId);
          setPoHistoryList(updatedHistory);

          // 4. Close confirmation dialog
          setConfirmModalConfig(null);

          // 5. Honest success feedback without fabricating external API transmission
          showToast(`PO #${res.poNumber} recorded locally and ready for dispatch! (${formatCurrency(totalSelectedAmount)})`);
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
        return;
      }

      // Windows Ctrl+S (or Mac Cmd+S) to save draft with SQLite confirmation
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handlePromptSaveDraft();
        return;
      }

      // Escape key handler: dismiss open modals or cancel edit
      if (e.key === 'Escape') {
        if (confirmModalConfig) {
          setConfirmModalConfig(null);
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
        if (bulkEditModalOpen) {
          setBulkEditModalOpen(false);
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
          handleCancelInlineQty();
          return;
        }
      }

      // If active inside an input, don't hijack table navigation keys
      if (isInput) return;

      // Table navigation: ArrowDown, ArrowUp, Space, Enter, F2, Home, End
      if (paginatedProducts.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIndex((prev) => (prev >= paginatedProducts.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRowIndex((prev) => (prev <= 0 ? paginatedProducts.length - 1 : prev - 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        const current = paginatedProducts[focusedRowIndex];
        if (current && current.orderStatus !== 'ordered') handleToggleSelect(current.id);
      } else if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        const current = paginatedProducts[focusedRowIndex];
        if (current && current.orderStatus !== 'ordered') {
          setEditingSku(current.sku);
          setEditQtyValue(String(current.orderQty));
          setIsUnsaved(false);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedRowIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setFocusedRowIndex(paginatedProducts.length - 1);
      }
    };
  });

  useEffect(() => {
    const handleKeyDown = (e) => handleGlobalKeyDownRef.current?.(e);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-scroll table into view when focused row changes via keyboard navigation
  useEffect(() => {
    if (focusedRowIndex === null || focusedRowIndex === undefined) return;
    const rowEl = tableRef.current?.querySelector(`.pr[data-row-index="${focusedRowIndex}"]`);
    if (rowEl) {
      rowEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        rowEl.focus({ preventScroll: true });
      }
    }
  }, [focusedRowIndex]);

  // Return focus to table row when exiting inline edit
  useEffect(() => {
    if (!editingSku && focusedRowIndex !== null && focusedRowIndex !== undefined) {
      const rowEl = tableRef.current?.querySelector(`.pr[data-row-index="${focusedRowIndex}"]`);
      if (rowEl && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        rowEl.focus({ preventScroll: true });
      }
    }
  }, [editingSku, focusedRowIndex]);

  // ── Quick Action Modal Openers ──────────────────────────────────────────────

  const handleOpenManifests = async () => {
    try {
      const data = await fetchPendingManifests(selectedSupplierId);
      setManifestsList(data || []);
      setManifestsModalOpen(true);
    } catch {
      showToast('Failed to load pending manifests.', 'warn');
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
      {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-logo" aria-hidden="true">
            <img src={mainLogo} alt="StockDesk" className="site-main-logo" />
          </span>
          <span className="brand-name">StockDesk</span>
          <span className="brand-sep">/</span>
          <span className="brand-page">Replenishment Desk</span>
        </div>

        {/* Global Search Bar */}
        <div className="topbar-search">
          <div className="search-box">
            <span className="search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="search-inp"
              placeholder="Search SKU, item name, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search replenishment catalog"
            />
            <span className="search-badge">Ctrl+K</span>
          </div>
        </div>

        <div className="topbar-right">
          {/* User profile */}
          <button className="user-btn">
            <div className="user-av">SM</div>
            <div className="user-info">
              <span className="user-name">Store Manager</span>
              <span className="user-store">Riverside Mart</span>
            </div>
          </button>
        </div>
      </header>

      {/* ─── Main Workspace: 4-Column Layout with Smooth Side Animation ─── */}
      <div className="rp-body" style={{ gridTemplateColumns: gridColumns }}>
        {/* Col 1: Icon Navigation Rail */}
        <nav className="icon-nav" aria-label="Main navigation rail">
          <div className="icon-nav-list">
            <button className="icon-nav-btn" title="Dashboard">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </button>
            <button className="icon-nav-btn" title="Inventory">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </button>
            <button className="icon-nav-btn active" title="Replenishment Desk">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </button>
            <button className="icon-nav-btn" title="Suppliers">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </button>
            <button className="icon-nav-btn" title="Analytics">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </button>
          </div>
          <div className="icon-nav-bottom">
            <button className="icon-nav-btn" title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </nav>

        {/* Col 2: Supplier Queue Sidebar (Left Side of Table) */}
        <aside
          id="collapse-supplier-queue"
          className={`sq collapse-horizontal ${!sqExpanded ? 'is-collapsed' : ''}`}
          aria-label="Supplier Queue"
        >
          <div
            className="collapsed-rail"
            onClick={() => setSqExpanded(true)}
            title="Click to expand Supplier Queue"
          >
            <button
              id="btn-expand-sq"
              className="collapsed-rail-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSqExpanded(true);
              }}
              aria-label="Expand Supplier Queue"
              aria-expanded={sqExpanded}
            >
              »
            </button>
            <img src={queueLogo} alt="" className="rail-queue-logo" />
            <span className="collapsed-rail-txt">
              Supplier Queue ({activeQueueSuppliers.length})
            </span>
          </div>

          <div className="collapse-horizontal-inner">
            <div className="sq-head">
              <div className="sq-head-l" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={queueLogo} alt="" className="section-queue-logo" />
                <span>Supplier Queue</span>
                <span className="sq-cnt">Relevant ({activeQueueSuppliers.length})</span>
              </div>
              <button
                id="btn-collapse-sq"
                className="sec-toggle-btn"
                onClick={() => setSqExpanded(false)}
                aria-label="Collapse Supplier Queue"
                title="Collapse Supplier Queue"
                aria-expanded={sqExpanded}
              >
                «
              </button>
            </div>

            <div className="sq-cards">
              {activeQueueSuppliers.map((sup) => {
                const isActive = sup.id === selectedSupplierId;
                const supSelectedItems = products.filter((p) => p.supplierId === sup.id && p.selected && p.orderQty > 0 && p.orderStatus !== 'ordered');
                const supValidation = validateSupplierMoq(sup, supSelectedItems);

                return (
                  <div
                    key={sup.id}
                    className={`sc ${isActive ? 'active' : ''}`}
                    onClick={() => requestActionWithUnsavedCheck(() => setSelectedSupplierId(sup.id))}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isActive}
                  >
                    <div className="sc-top">
                      <div className="sc-av" style={!SUPPLIER_LOGOS[sup.id] ? { background: sup.color } : undefined}>
                        {SUPPLIER_LOGOS[sup.id] ? (
                          <img src={SUPPLIER_LOGOS[sup.id]} alt={sup.name} />
                        ) : (
                          sup.initials
                        )}
                      </div>
                      <div className="sc-info">
                        <span className="sc-name">{sup.name}</span>
                        <span className="sc-cat">{sup.category}</span>
                      </div>
                      {sup.badge && (
                        <span className={`sc-badge ${sup.badgeType || 'preferred'}`}>{sup.badge}</span>
                      )}
                      <div className="sc-chev">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>

                    {supSelectedItems.length === 0 ? (
                      <div className="sc-meta" style={{ marginTop: 8 }}>
                        <span className="sc-meta-item">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          Lead Time: {sup.leadTime}
                        </span>
                        <span className="sc-meta-item">
                          MOQ: {formatCurrency(sup.targetMoq)}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="sc-bar">
                          <div
                            className={`sc-bar-fill ${supValidation.isMoqMet ? 'green' : 'amber'}`}
                            style={{ width: `${Math.min(100, Math.round((supValidation.subtotal / (sup.targetMoq || 1)) * 100))}%` }}
                          ></div>
                        </div>
                        <div className="sc-val">
                          <span className="sc-curr">{formatCurrency(supValidation.subtotal)}</span>
                          <span className="sc-target">
                            / {formatCurrency(sup.targetMoq)} {supValidation.isMoqMet ? '(MOQ Met)' : `(${formatCurrency(supValidation.remainingAmount)} remaining)`}
                          </span>
                        </div>
                        <div className="sc-meta">
                          <span className="sc-meta-item">
                            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: supValidation.isMoqMet ? '#10b981' : '#d97706' }}></span>
                            {supSelectedItems.length} items Selected
                          </span>
                          <span className="sc-meta-item">
                            Lead Time: {sup.leadTime}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Actions in Left Panel */}
            <div className="sq-qa">
              <div className="sq-qa-title">Quick Actions</div>
              <button className="sq-qa-btn" onClick={handleOpenManifests}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <span>View pending manifests</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              <button className="sq-qa-btn" onClick={handleOpenPOHistory}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span>PO history</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              <button className="sq-qa-btn" onClick={handleOpenContact}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>Contact supplier</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* Col 3: Center Replenishment Matrix */}
        <main
          className="matrix"
          aria-label="Replenishment Matrix"
        >
          <div className="matrix-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 className="matrix-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={matrixLogo} alt="" className="section-matrix-logo" />
                  <span>Replenishment Matrix</span>
                </h1>
                <span className="matrix-badge-count">{displayProducts.length} Products</span>
              </div>
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
            </div>

            {/* Filter Bar with Filter Modal Trigger */}
            <div className="filter-bar">
              <div className="filter-left">
                <button
                  className={`btn-filter-modal ${hasActiveFilters ? 'active' : ''}`}
                  onClick={() => setFilterModalOpen(true)}
                  aria-label="Open filter modal"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                  </svg>
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="filter-count-badge">{activeFilterCount}</span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    className="btn-clear-filters"
                    onClick={() => setAppliedFilters({ statuses: [], suppliers: [], categories: [], stockLevels: [], search: '' })}
                    title="Clear applied filters"
                  >
                    Clear filters
                  </button>
                )}
                <span className="filter-res-txt">
                  Showing {displayProducts.length} of {products.length} products
                </span>
              </div>
            </div>

            {/* Toolbar & Bulk Action Bar */}
            <div className="toolbar">
              <div className="toolbar-selection-group">
                <button
                  className="toolbar-sel"
                  onClick={handleToggleSelectPage}
                  title={`Toggle selection for current page (${eligiblePageProducts.length} items)`}
                >
                  <input
                    type="checkbox"
                    className="cb"
                    checked={isPageAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPageSomeSelected;
                    }}
                    onChange={handleToggleSelectPage}
                    aria-label="Select visible page products"
                  />
                  <span>Select Page ({eligiblePageProducts.filter((p) => p.selected).length}/{eligiblePageProducts.length})</span>
                </button>

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

              {selectedProducts.length > 0 ? (
                <div className="bulk-toolbar">
                  <span className="bulk-count">
                    {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                  </span>
                  <button
                    className="btn-bulk-edit"
                    onClick={() => setBulkEditModalOpen(true)}
                    title="Bulk edit selected products"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Bulk Edit</span>
                  </button>
                  <button
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
                    className="btn-secondary"
                    onClick={handleApplySupplierMinimums}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Apply Supplier Minimums</span>
                  </button>
                </div>
              )}
            </div>

            {/* Selection Scope Banner: when all on current page are selected and more exist across pages */}
            {isPageAllSelected && eligibleFilteredProducts.length > eligiblePageProducts.length && (
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
            )}

            {/* Genuine Application States */}
            {isLoading && (
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

            {!isLoading && dbError && (
              <div className="state-box">
                <div className="state-icon">⚠️</div>
                <h3 className="state-title">Unable to Load Replenishment Data</h3>
                <p className="state-body">
                  {dbError}. Failed to read data from SQLite storage.
                </p>
                <button
                  className="retry-btn"
                  onClick={loadSQLiteData}
                >
                  Retry Connection
                </button>
              </div>
            )}

            {!isLoading && !dbError && products.length === 0 && (
              <div className="state-box">
                <div className="state-icon">📦</div>
                <h3 className="state-title">No Replenishment Required</h3>
                <p className="state-body">
                  No products currently available in the replenishment catalog.
                </p>
                <button
                  className="retry-btn"
                  onClick={() => setAddProductModalOpen(true)}
                >
                  Add First Product
                </button>
              </div>
            )}

            {!isLoading && !dbError && products.length > 0 && displayProducts.length === 0 && (
              <div className="state-box">
                <div className="state-icon">🔍</div>
                <h3 className="state-title">No Matching Replenishment Items</h3>
                <p className="state-body">
                  No products match the applied search and filter criteria. Clear filters to see full catalog.
                </p>
                <button
                  className="retry-btn"
                  onClick={() => {
                    setSearchTerm('');
                    setAppliedFilters({ statuses: [], suppliers: [], categories: [], stockLevels: [], search: '' });
                  }}
                >
                  Clear Search &amp; Filters
                </button>
              </div>
            )}

            {!isLoading && !dbError && displayProducts.length > 0 && (
              <div className="tbl-wrap">
                <table className="tbl" ref={tableRef} aria-label="Replenishment products table">
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
                      <th className="col-sup">Supplier</th>
                      <th className="col-cat">Category</th>
                      <th className="col-stk num">Stock</th>
                      <th className="col-tgt num">Target</th>
                      <th className="col-st">Status</th>
                      <th className="col-qty">Order Qty</th>
                      <th className="col-prc num">Unit Price</th>
                      <th className="col-sub num">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((prod, pageIdx) => {
                      const isOrdered = prod.orderStatus === 'ordered';
                      const lineSubtotal = prod.orderQty * prod.unitCost;
                      const isEditingThis = editingSku === prod.sku;
                      const isRowFocused = focusedRowIndex === pageIdx;
                      const sup = suppliersMap[prod.supplierId];

                      const badgeType = isOrdered ? 'ordered' : prod.priority;
                      const badgeLabel = isOrdered
                        ? 'Ordered'
                        : prod.priority.charAt(0).toUpperCase() + prod.priority.slice(1);

                      return (
                        <tr
                          key={prod.id}
                          data-row-index={pageIdx}
                          className={`pr ${prod.selected && !isOrdered ? 'sel' : ''} ${isRowFocused ? 'focused' : ''} ${isOrdered ? 'is-ordered' : ''}`}
                          tabIndex={isOrdered ? -1 : 0}
                          onFocus={() => !isOrdered && setFocusedRowIndex(pageIdx)}
                          onClick={() => !isOrdered && setFocusedRowIndex(pageIdx)}
                        >
                          <td className="col-chk">
                            <input
                              type="checkbox"
                              className="cb"
                              checked={prod.selected && !isOrdered}
                              disabled={isOrdered}
                              onChange={() => handleToggleSelect(prod.id)}
                              aria-label={`Select ${prod.name}`}
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
                              {SUPPLIER_LOGOS[prod.supplierId] && (
                                <img
                                  src={SUPPLIER_LOGOS[prod.supplierId]}
                                  alt=""
                                  className="sup-cell-logo"
                                />
                              )}
                              <span className="sup-cell-name" title={sup?.name || prod.supplierId}>
                                {sup?.name || prod.supplierId}
                              </span>
                            </div>
                          </td>
                          <td className="col-cat">
                            <span className="cat-cell-tag">{prod.category}</span>
                          </td>
                          <td className="col-stk">{prod.currentStock}</td>
                          <td className="col-tgt">{prod.safetyTarget}</td>
                          <td className="col-st">
                            <span className={`st-badge ${badgeType}`}>
                              <span className="st-dot"></span>
                              {badgeLabel}
                            </span>
                          </td>
                          <td className="col-qty">
                            {isOrdered ? (
                              <span className="qty-disp qty-ordered" title="Product already ordered">
                                —
                              </span>
                            ) : isEditingThis ? (
                              <div className="qty-wrap">
                                <input
                                  type="number"
                                  className="qty-inp"
                                  value={editQtyValue}
                                  onChange={(e) => {
                                    setEditQtyValue(e.target.value);
                                    setIsUnsaved(true);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveInlineQty(prod.sku);
                                    if (e.key === 'Escape') {
                                      e.stopPropagation();
                                      handleCancelInlineQty();
                                    }
                                  }}
                                  autoFocus
                                  aria-label="Order Quantity"
                                />
                                <div className="qty-actions">
                                  {isUnsaved && <span className="qty-unsaved">Unsaved</span>}
                                  <button
                                    className="qty-save"
                                    onClick={() => handleSaveInlineQty(prod.sku)}
                                  >
                                    ↵ Save
                                  </button>
                                  <span className="qty-sep">|</span>
                                  <button
                                    className="qty-cancel"
                                    onClick={handleCancelInlineQty}
                                  >
                                    Esc Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                className={`qty-disp ${prod.orderQty === 0 ? 'qty-zero' : ''}`}
                                onClick={() => {
                                  setFocusedRowIndex(pageIdx);
                                  setEditingSku(prod.sku);
                                  setEditQtyValue(String(prod.orderQty));
                                  setIsUnsaved(false);
                                }}
                                title="Click to edit quantity"
                              >
                                {prod.orderQty}
                              </button>
                            )}
                          </td>
                          <td className="col-prc">
                            {formatCurrency(prod.unitCost)}
                          </td>
                          <td className="col-sub">
                            {isOrdered ? '—' : formatCurrency(lineSubtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {!isLoading && !dbError && displayProducts.length > 0 && (
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
        </main>

        {/* Col 4: Purchase Order Draft & Supplier Review Summary (Right Side of Table) */}
        <aside
          id="collapse-po-draft"
          className={`po collapse-horizontal ${!draftExpanded ? 'is-collapsed' : ''}`}
          aria-label="Purchase Order Draft & Supplier Review Summary"
        >
          <div
            className="collapsed-rail"
            onClick={() => setDraftExpanded(true)}
            title="Click to expand Purchase Order Draft"
          >
            <button
              id="btn-expand-draft"
              className="collapsed-rail-btn"
              onClick={(e) => {
                e.stopPropagation();
                setDraftExpanded(true);
              }}
              aria-label="Expand Purchase Order Draft"
              aria-expanded={draftExpanded}
            >
              «
            </button>
            <img src={draftLogo} alt="" className="rail-draft-logo" />
            <span className="collapsed-rail-txt">
              PO Draft ({selectedItems.length})
            </span>
          </div>

          <div className="collapse-horizontal-inner">
            <div className="po-head">
              <div className="po-head-l" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={draftLogo} alt="" className="section-draft-logo" />
                <span className="po-title">PO Draft #{currentSupplier.id.toUpperCase()}-2026-DRAFT</span>
              </div>
              <button
                id="btn-collapse-draft"
                className="sec-toggle-btn"
                onClick={() => setDraftExpanded(false)}
                aria-label="Collapse Purchase Order Draft"
                title="Collapse Purchase Order Draft"
                aria-expanded={draftExpanded}
              >
                »
              </button>
            </div>

            {/* Section: Supplier Information */}
            <div className="po-sec">
              <div className="po-sec-title">Supplier Information</div>
              <div className="po-sup-row">
                <div className="po-sup-av" style={!SUPPLIER_LOGOS[currentSupplier.id] ? { background: currentSupplier.color } : undefined}>
                  {SUPPLIER_LOGOS[currentSupplier.id] ? (
                    <img src={SUPPLIER_LOGOS[currentSupplier.id]} alt={currentSupplier.name} />
                  ) : (
                    currentSupplier.initials
                  )}
                </div>
                <div>
                  <div className="po-sup-name">{currentSupplier.name}</div>
                  <div className="po-sup-cat">{currentSupplier.category}</div>
                </div>
              </div>
            </div>

            {/* Section: Minimum Threshold Checklist & MOQ Progress */}
            <div className="po-sec">
              <div className="po-sec-title">Minimum Threshold Checklist</div>
              <div className="po-checklist">
                <div className="po-check">
                  <span className={`po-check-ic ${supplierValidation.isMoqMet ? 'pass' : 'fail'}`}>
                    {supplierValidation.isMoqMet ? '✔' : '✖'}
                  </span>
                  <span>
                    Order value {formatCurrency(totalSelectedAmount)} / {formatCurrency(currentSupplier.targetMoq)} ({Math.min(100, Math.round((totalSelectedAmount / (currentSupplier.targetMoq || 1)) * 100))}%) {supplierValidation.isMoqMet ? '— Minimum met' : `— ${formatCurrency(supplierValidation.remainingAmount)} remaining`}
                  </span>
                </div>
                <div className="po-check">
                  <span className={`po-check-ic ${supplierValidation.isUnitsMet ? 'pass' : 'fail'}`}>
                    {supplierValidation.isUnitsMet ? '✔' : '✖'}
                  </span>
                  <span>
                    Order units ({totalSelectedUnits} / {currentSupplier.unitThreshold} units) {supplierValidation.isUnitsMet ? '— Freight threshold met' : `— ${supplierValidation.remainingUnits} units needed`}
                  </span>
                </div>
              </div>

              {/* Dynamic MOQ Alert Banner */}
              {!supplierValidation.valid && selectedItems.length > 0 && (
                <div className="moq-alert-banner below" role="alert">
                  <span>⚠️</span>
                  <span>{supplierValidation.message}</span>
                </div>
              )}
              {supplierValidation.valid && selectedItems.length > 0 && (
                <div className="moq-alert-banner met" role="status">
                  <span>✔</span>
                  <span>Supplier minimums satisfied — eligible for dispatch</span>
                </div>
              )}
            </div>

            {/* Section: Multi-Supplier Review Notice if other suppliers have selections */}
            {selectedSupplierGroups.length > 1 && (
              <div className="po-sec" style={{ background: 'var(--surface)' }}>
                <div className="po-sec-title" style={{ fontSize: 12, color: 'var(--text2)' }}>
                  Other Pending Supplier Orders
                </div>
                {selectedSupplierGroups
                  .filter((g) => g.supplier.id !== currentSupplier.id)
                  .map((g) => (
                    <div
                      key={g.supplier.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        fontSize: 11,
                        color: 'var(--text2)',
                      }}
                    >
                      <span>{g.supplier.name}</span>
                      <span style={{ fontWeight: 600 }}>
                        {g.totalUnits} units • {formatCurrency(g.subtotal)}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* Section: Financial Summary */}
            <div className="po-sec">
              <div className="po-sec-title">Financial Summary</div>
              <div className="po-fin">
                <div className="po-fin-row">
                  <span className="lbl">Subtotal ({selectedItems.length} SKUs)</span>
                  <span className="val">{formatCurrency(totalSelectedAmount)}</span>
                </div>
                <div className="po-fin-row">
                  <span className="lbl">GST / Tax</span>
                  <span className="incl">Included</span>
                </div>
                <div className="po-fin-row po-fin-total">
                  <span className="lbl">Total PO Amount</span>
                  <span className="val">{formatCurrency(totalSelectedAmount)}</span>
                </div>
              </div>
            </div>

            {/* Section: Order Breakdown */}
            <div className="po-sec" style={{ flex: 1, overflowY: 'auto' }}>
              <div className="po-sec-title">Order Breakdown ({selectedItems.length} items)</div>
              {selectedItems.length === 0 ? (
                <div className="po-empty">
                  <div className="po-empty-icon">📋</div>
                  <div className="po-empty-txt">No items selected for this order draft. Select items from the matrix to build an order.</div>
                </div>
              ) : (
                <div className="po-bk-list">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="po-bk-item">
                      <span className="bk-name" title={item.name}>{item.name}</span>
                      <span className="bk-units">{item.orderQty} units</span>
                      <span className="bk-amt">{formatCurrency(item.orderQty * item.unitCost)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Actions (Functional Cancel, Save Draft, and Approve & Dispatch PO) */}
            <div className="po-actions">
              <button className="po-discard" onClick={handlePromptCancel}>
                Cancel
              </button>
              <button className="po-save" onClick={handlePromptSaveDraft} disabled={isDispatching}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                <span>Save Draft</span>
              </button>
              <button
                className={`po-approve ${!supplierValidation.valid || isDispatching || selectedItems.length === 0 ? 'btn-dispatch-disabled' : ''}`}
                onClick={handlePromptSubmitPO}
                disabled={!supplierValidation.valid || isDispatching || selectedItems.length === 0}
                title={!supplierValidation.valid ? supplierValidation.message : 'Approve and record purchase order locally'}
              >
                {isDispatching ? (
                  <span>Dispatching...</span>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m22 2-7 20-4-9-9-4Z"/>
                      <path d="M22 2 11 13"/>
                    </svg>
                    <span>Approve &amp; Dispatch PO →</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── Pending Manifests Modal ────────────────────────────────────────── */}
      {manifestsModalOpen && (
        <div className="confirm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="manifest-modal-title" onClick={() => setManifestsModalOpen(false)}>
          <div className="info-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="info-modal-header">
              <h2 id="manifest-modal-title" className="info-modal-title">
                <span>📦</span>
                <span>Pending Manifests — {currentSupplier.name}</span>
              </h2>
              <button className="info-modal-close" onClick={() => setManifestsModalOpen(false)} aria-label="Close modal">✕</button>
            </div>
            <div className="info-modal-body modal-body">
              {manifestsList.length === 0 ? (
                <div className="state-box" style={{ minHeight: 180 }}>
                  <div className="state-icon">🚚</div>
                  <h3 className="state-title">No Pending Manifests</h3>
                  <p className="state-body">There are currently no inbound delivery manifests pending for {currentSupplier.name}.</p>
                </div>
              ) : (
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Manifest #</th>
                      <th>Expected Arrival</th>
                      <th>Items</th>
                      <th>Units</th>
                      <th>Carrier</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manifestsList.map((m) => (
                      <tr key={m.id}>
                        <td><strong>{m.manifestNumber}</strong></td>
                        <td>{m.expectedDate}</td>
                        <td>{m.itemsCount} SKUs</td>
                        <td>{m.totalUnits}</td>
                        <td>{m.carrier}</td>
                        <td>
                          <span className={`modal-badge ${m.status}`}>
                            {m.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="confirm-modal-actions" style={{ marginTop: 18 }}>
              <button className="btn-cancel" onClick={() => setManifestsModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PO History Modal ──────────────────────────────────────────────── */}
      {poHistoryModalOpen && (
        <div className="confirm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="pohist-modal-title" onClick={() => setPoHistoryModalOpen(false)}>
          <div className="info-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="info-modal-header">
              <h2 id="pohist-modal-title" className="info-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {SUPPLIER_LOGOS[currentSupplier.id] ? (
                  <img src={SUPPLIER_LOGOS[currentSupplier.id]} alt="" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 4, background: '#fff', border: '1px solid var(--border)', padding: 1 }} />
                ) : (
                  <span>📑</span>
                )}
                <span>Purchase Order History — {currentSupplier.name}</span>
              </h2>
              <button className="info-modal-close" onClick={() => setPoHistoryModalOpen(false)} aria-label="Close modal">✕</button>
            </div>
            <div className="info-modal-body modal-body">
              {poHistoryList.length === 0 ? (
                <div className="state-box" style={{ minHeight: 180 }}>
                  <div className="state-icon">📋</div>
                  <h3 className="state-title">No Purchase Order History</h3>
                  <p className="state-body">No previous purchase orders have been submitted for {currentSupplier.name}.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {poHistoryList.map((po) => (
                    <div key={po.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: 13, color: 'var(--text)' }}>{po.poNumber}</strong>
                          <span className={`modal-badge ${po.status}`}>{po.status}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{formatCurrency(po.totalAmount)}</span>
                          <button
                            onClick={() => handlePromptDeletePO(po)}
                            title="Delete PO record"
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
                        Created: {new Date(po.createdAt).toLocaleDateString()} &bull; {po.notes || 'Standard Order'}
                      </div>
                      {po.items && po.items.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {po.items.map((it) => (
                            <span key={it.id} style={{ fontSize: 11, background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                              {it.name} ({it.quantity}x)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="confirm-modal-actions" style={{ marginTop: 18 }}>
              <button className="btn-cancel" onClick={() => setPoHistoryModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Supplier Contact Modal ────────────────────────────────────────── */}
      {contactModalOpen && (
        <div className="confirm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" onClick={() => setContactModalOpen(false)}>
          <div className="info-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="info-modal-header">
              <h2 id="contact-modal-title" className="info-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {SUPPLIER_LOGOS[currentSupplier.id] ? (
                  <img src={SUPPLIER_LOGOS[currentSupplier.id]} alt="" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 4, background: '#fff', border: '1px solid var(--border)', padding: 1 }} />
                ) : (
                  <span>📞</span>
                )}
                <span>Contact Supplier — {currentSupplier.name}</span>
              </h2>
              <button className="info-modal-close" onClick={() => setContactModalOpen(false)} aria-label="Close modal">✕</button>
            </div>
            <div className="info-modal-body modal-body">
              <div className="contact-grid">
                <div className="contact-item">
                  <div className="contact-label">Account Representative</div>
                  <div className="contact-val">{contactData?.contactRep || 'Information unavailable'}</div>
                </div>
                <div className="contact-item">
                  <div className="contact-label">Direct Email</div>
                  <div className="contact-val">
                    {contactData?.contactEmail ? (
                      <a href={`mailto:${contactData.contactEmail}`}>{contactData.contactEmail}</a>
                    ) : 'Information unavailable'}
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-label">Phone Support</div>
                  <div className="contact-val">
                    {contactData?.contactPhone ? (
                      <a href={`tel:${contactData.contactPhone}`}>{contactData.contactPhone}</a>
                    ) : 'Information unavailable'}
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-label">Standard Lead Time</div>
                  <div className="contact-val">{contactData?.leadTime || currentSupplier.leadTime || 'Information unavailable'}</div>
                </div>
                <div className="contact-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="contact-label">Warehouse &amp; Dispatch Address</div>
                  <div className="contact-val">{contactData?.contactAddress || 'Information unavailable'}</div>
                </div>
              </div>
            </div>
            <div className="confirm-modal-actions" style={{ marginTop: 18 }}>
              <button className="btn-cancel" onClick={() => setContactModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Unified State-Changing Confirmation Modal (Cancel, Save, Submit, Delete) ─── */}
      {confirmModalConfig && (
        <div className="confirm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-action-title">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <span className="confirm-modal-icon">⚠️</span>
              <h3 id="confirm-action-title" className="confirm-modal-title">{confirmModalConfig.title}</h3>
            </div>
            <p className="confirm-modal-body">{confirmModalConfig.message}</p>
            <div className="confirm-modal-actions">
              <button className="btn-cancel" onClick={confirmModalConfig.onCancel}>
                Keep Editing
              </button>
              <button className={confirmModalConfig.confirmClass || 'btn-primary-action'} onClick={confirmModalConfig.onConfirm}>
                {confirmModalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Unsaved Changes Confirmation Modal ──────────────────────────── */}
      {showUnsavedModal && (
        <div className="confirm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="unsaved-modal-title">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <span className="confirm-modal-icon">⚠️</span>
              <h3 id="unsaved-modal-title" className="confirm-modal-title">Discard Unsaved Changes?</h3>
            </div>
            <p className="confirm-modal-body">
              You have modified the order quantity for SKU <strong>{editingSku}</strong>. If you proceed without saving, your modifications will be discarded.
            </p>
            <div className="confirm-modal-actions">
              <button className="btn-cancel" onClick={cancelDiscardUnsaved}>
                Keep Editing
              </button>
              <button className="btn-danger" onClick={confirmDiscardUnsaved}>
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Filter Modal ─────────────────────────────────────────────────── */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        appliedFilters={appliedFilters}
        onApply={(newFilters) => setAppliedFilters(newFilters)}
        suppliers={suppliers}
        categories={categories}
        products={products}
      />

      {/* ─── Bulk Edit Modal ───────────────────────────────────────────────── */}
      <BulkEditModal
        isOpen={bulkEditModalOpen}
        onClose={() => setBulkEditModalOpen(false)}
        selectedProducts={selectedProducts}
        categories={categories}
        onSave={handleBulkEdit}
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
