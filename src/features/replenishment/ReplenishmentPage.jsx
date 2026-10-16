import React, { useState, useMemo, useEffect, useRef } from 'react';
import '../../styles/replenishment.css';
import { calcPriority, comparePriority } from '../../utils/priority.js';

// ── Master Catalog Data ────────────────────────────────────────────────────────
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
    badge: 'National',
    badgeType: 'preferred',
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
    dailySales: 8,
    orderQty: 50,
    unitCost: 90,
    selected: true,
  },
  {
    id: 'hf-002',
    sku: 'HF-002',
    name: 'Whole Wheat Bread',
    category: 'Bakery',
    supplierId: 'hf',
    currentStock: 25,
    safetyTarget: 60,
    dailySales: 10,
    orderQty: 60,
    unitCost: 90,
    selected: true,
  },
  {
    id: 'hf-003',
    sku: 'HF-003',
    name: 'Paneer 200g',
    category: 'Dairy',
    supplierId: 'hf',
    currentStock: 18,
    safetyTarget: 40,
    dailySales: 5,
    orderQty: 40,
    unitCost: 108.75,
    selected: true,
  },
  {
    id: 'hf-020',
    sku: 'HF-020',
    name: 'Cheese Block 1kg',
    category: 'Dairy',
    supplierId: 'hf',
    currentStock: 8,
    safetyTarget: 20,
    dailySales: 3,
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
    dailySales: 6,
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
    dailySales: 4,
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
    dailySales: 7,
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
    dailySales: 2,
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
    dailySales: 3,
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
    dailySales: 1,
    orderQty: 0,
    unitCost: 750,
    selected: false,
  },

  // Britannia Industries
  {
    id: 'bi-001',
    sku: 'BI-001',
    name: 'Good Day Butter 100g',
    category: 'Biscuits',
    supplierId: 'bi',
    currentStock: 14,
    safetyTarget: 60,
    dailySales: 12,
    orderQty: 50,
    unitCost: 35,
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
    dailySales: 10,
    orderQty: 40,
    unitCost: 40,
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
    dailySales: 6,
    orderQty: 25,
    unitCost: 50,
    selected: false,
  },
  {
    id: 'bi-004',
    sku: 'BI-004',
    name: 'Little Hearts 75g',
    category: 'Snacks',
    supplierId: 'bi',
    currentStock: 18,
    safetyTarget: 40,
    dailySales: 5,
    orderQty: 0,
    unitCost: 20,
    selected: false,
  },
  {
    id: 'bi-005',
    sku: 'BI-005',
    name: 'Milk Bikis 120g',
    category: 'Biscuits',
    supplierId: 'bi',
    currentStock: 22,
    safetyTarget: 45,
    dailySales: 5,
    orderQty: 0,
    unitCost: 25,
    selected: false,
  },

  // Nature's Farm
  {
    id: 'nf-001',
    sku: 'NF-001',
    name: 'Fresh Organic Apples 1kg',
    category: 'Fruits',
    supplierId: 'nf',
    currentStock: 30,
    safetyTarget: 40,
    dailySales: 8,
    orderQty: 0,
    unitCost: 140,
    selected: false,
  },
  {
    id: 'nf-002',
    sku: 'NF-002',
    name: 'Baby Spinach 250g',
    category: 'Vegetables',
    supplierId: 'nf',
    currentStock: 24,
    safetyTarget: 30,
    dailySales: 6,
    orderQty: 0,
    unitCost: 60,
    selected: false,
  },
  {
    id: 'nf-003',
    sku: 'NF-003',
    name: 'Hass Avocado (2 pcs)',
    category: 'Fruits',
    supplierId: 'nf',
    currentStock: 20,
    safetyTarget: 25,
    dailySales: 4,
    orderQty: 0,
    unitCost: 180,
    selected: false,
  },
];

const formatCurrency = (amt) => {
  return '₹' + Number(amt || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
};

export default function ReplenishmentPage() {
  // Theme & State
  const [theme, setTheme] = useState('light');
  const [appState, setAppState] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('state');
      if (p) {
        const s = p.toLowerCase();
        if (s === 'no_results') return 'empty';
        if (['loading', 'empty', 'error', 'default'].includes(s)) return s;
      }
    }
    return 'default';
  });
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);

  // Filters & Sorting
  const [supplierFilter, setSupplierFilter] = useState('all'); // 'all' or supplierId
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'critical', 'low', 'healthy'
  const [sortBy, setSortBy] = useState('priority');
  const [searchTerm, setSearchTerm] = useState('');

  // Products State
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  // Summary Drawer (Panel) State
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);
  const [activeSummarySupplierId, setActiveSummarySupplierId] = useState('all');

  // Keyboard Navigation Focus State
  const [focusedRowIndex, setFocusedRowIndex] = useState(null);

  // Inline Editing State
  const [editingSku, setEditingSku] = useState(null);
  const [editQtyValue, setEditQtyValue] = useState('');
  const [isUnsaved, setIsUnsaved] = useState(false);

  // Unsaved Changes Confirmation Dialog
  const [unsavedDialog, setUnsavedDialog] = useState({
    open: false,
    pendingAction: null,
    sku: null,
    name: '',
    originalQty: 0,
    draftQty: 0,
  });

  // Collapsed Priority Groups
  const [collapsedGroups, setCollapsedGroups] = useState({
    critical: false,
    low: false,
    healthy: false,
  });

  // Modals & Popovers
  const [batchMenuOpen, setBatchMenuOpen] = useState(false);
  const [poSuccessModalOpen, setPoSuccessModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const searchInputRef = useRef(null);
  const tableWrapRef = useRef(null);

  // Toast feedback helper
  const showToast = (message, type = 'normal') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Sync Theme
  useEffect(() => {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Guard action against unsaved inline edits
  const withUnsavedGuard = (action) => {
    if (editingSku && isUnsaved) {
      const item = products.find((p) => p.sku === editingSku);
      setUnsavedDialog({
        open: true,
        pendingAction: () => action(),
        sku: editingSku,
        name: item ? item.name : editingSku,
        originalQty: item ? item.orderQty : 0,
        draftQty: Number(editQtyValue) || 0,
      });
      return;
    }
    action();
  };

  const handleResolveSaveProceed = () => {
    if (unsavedDialog.sku) {
      const num = Math.max(0, parseInt(unsavedDialog.draftQty, 10) || 0);
      setProducts((prev) =>
        prev.map((p) => (p.sku === unsavedDialog.sku ? { ...p, orderQty: num, selected: num > 0 } : p))
      );
    }
    const nextAction = unsavedDialog.pendingAction;
    setEditingSku(null);
    setIsUnsaved(false);
    setUnsavedDialog({ open: false, pendingAction: null, sku: null, name: '', originalQty: 0, draftQty: 0 });
    if (nextAction) nextAction();
    showToast(`Saved ${unsavedDialog.sku} and proceeded.`);
  };

  const handleResolveDiscardProceed = () => {
    const nextAction = unsavedDialog.pendingAction;
    setEditingSku(null);
    setIsUnsaved(false);
    setUnsavedDialog({ open: false, pendingAction: null, sku: null, name: '', originalQty: 0, draftQty: 0 });
    if (nextAction) nextAction();
    showToast(`Discarded unsaved changes.`);
  };

  const handleResolveKeepEditing = () => {
    setUnsavedDialog({ open: false, pendingAction: null, sku: null, name: '', originalQty: 0, draftQty: 0 });
  };

  // Global Keyboard Shortcuts (Windows adapted: Ctrl+K, Ctrl+S, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
      if (e.key === 'Escape') {
        if (unsavedDialog.open) {
          handleResolveKeepEditing();
        } else if (summaryDrawerOpen) {
          setSummaryDrawerOpen(false);
        } else if (batchMenuOpen) {
          setBatchMenuOpen(false);
        } else if (editingSku) {
          handleCancelInlineQty();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [unsavedDialog.open, summaryDrawerOpen, batchMenuOpen, editingSku, isUnsaved]);

  // Dynamically calculate priorities using calculated priority rules
  const enrichedProducts = useMemo(() => {
    return products.map((p) => {
      const derivedPriority = calcPriority(p);
      return {
        ...p,
        priority: derivedPriority,
      };
    });
  }, [products]);

  // Filter products by Supplier, Status, and Search query
  const filteredProducts = useMemo(() => {
    return enrichedProducts.filter((p) => {
      if (supplierFilter !== 'all' && p.supplierId !== supplierFilter) return false;
      if (statusFilter !== 'all' && p.priority !== statusFilter) return false;

      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [enrichedProducts, supplierFilter, statusFilter, searchTerm]);

  // Sort products with default priority sorting
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'priority') {
      return list.sort(comparePriority);
    } else if (sortBy === 'stock_low') {
      return list.sort((a, b) => a.currentStock - b.currentStock);
    } else if (sortBy === 'safety_target') {
      return list.sort((a, b) => b.safetyTarget - a.safetyTarget);
    } else if (sortBy === 'order_qty') {
      return list.sort((a, b) => b.orderQty - a.orderQty);
    } else if (sortBy === 'subtotal') {
      return list.sort((a, b) => b.orderQty * b.unitCost - a.orderQty * a.unitCost);
    } else if (sortBy === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [filteredProducts, sortBy]);

  // Priority groups
  const criticalItems = sortedProducts.filter((p) => p.priority === 'critical');
  const lowItems = sortedProducts.filter((p) => p.priority === 'low');
  const healthyItems = sortedProducts.filter((p) => p.priority === 'healthy');

  // Selected items calculations
  const selectedItems = useMemo(() => {
    return products.filter((p) => p.selected && p.orderQty > 0);
  }, [products]);

  const totalSelectedUnits = useMemo(() => {
    return selectedItems.reduce((acc, p) => acc + p.orderQty, 0);
  }, [selectedItems]);

  const totalSelectedAmount = useMemo(() => {
    return selectedItems.reduce((acc, p) => acc + p.orderQty * p.unitCost, 0);
  }, [selectedItems]);

  // In-table selection indicators
  const tableSelectedItems = useMemo(() => {
    return sortedProducts.filter((p) => p.selected);
  }, [sortedProducts]);

  const allSelected = useMemo(() => {
    return sortedProducts.length > 0 && sortedProducts.every((p) => p.selected);
  }, [sortedProducts]);

  const someSelected = useMemo(() => {
    return sortedProducts.some((p) => p.selected) && !allSelected;
  }, [sortedProducts, allSelected]);

  // Grouped Supplier Drafts for the Review Summary Panel
  const draftsBySupplier = useMemo(() => {
    const supplierMap = new Map();

    products.forEach((prod) => {
      if (!prod.selected) return;

      if (!supplierMap.has(prod.supplierId)) {
        const supInfo = INITIAL_SUPPLIERS.find((s) => s.id === prod.supplierId) || {
          id: prod.supplierId,
          name: prod.supplierId,
          category: 'General',
          initials: prod.supplierId.slice(0, 2).toUpperCase(),
          targetMoq: 5000,
          unitThreshold: 30,
          leadTime: '3d',
          color: '#2563eb',
        };
        supplierMap.set(prod.supplierId, {
          supplier: supInfo,
          items: [],
          totalUnits: 0,
          totalAmount: 0,
        });
      }

      const entry = supplierMap.get(prod.supplierId);
      entry.items.push(prod);
      entry.totalUnits += prod.orderQty;
      entry.totalAmount += prod.orderQty * prod.unitCost;
    });

    return Array.from(supplierMap.values()).map((entry) => {
      const moqMet = entry.totalAmount >= entry.supplier.targetMoq;
      const unitsMet = entry.totalUnits >= entry.supplier.unitThreshold;
      return {
        ...entry,
        moqMet,
        unitsMet,
      };
    });
  }, [products]);

  // Focused supplier in the summary drawer
  const activeSummaryGroup = useMemo(() => {
    if (activeSummarySupplierId === 'all' || !activeSummarySupplierId) {
      return draftsBySupplier[0] || null;
    }
    return draftsBySupplier.find((g) => g.supplier.id === activeSummarySupplierId) || draftsBySupplier[0] || null;
  }, [draftsBySupplier, activeSummarySupplierId]);

  // Keyboard navigation on dense table (Windows: Up/Down, Space, Enter, F2, Home, End, PageUp/Down, Ctrl+A)
  const handleTableKeyDown = (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (sortedProducts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedRowIndex((prev) => (prev === null || prev >= sortedProducts.length - 1 ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedRowIndex((prev) => (prev === null || prev <= 0 ? sortedProducts.length - 1 : prev - 1));
    } else if (e.key === ' ' && focusedRowIndex !== null) {
      e.preventDefault();
      const current = sortedProducts[focusedRowIndex];
      if (current) handleToggleSelect(current.id);
    } else if ((e.key === 'Enter' || e.key === 'F2') && focusedRowIndex !== null) {
      e.preventDefault();
      const current = sortedProducts[focusedRowIndex];
      if (current && editingSku !== current.sku) {
        withUnsavedGuard(() => handleStartEdit(current));
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedRowIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusedRowIndex(sortedProducts.length - 1);
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      setFocusedRowIndex((prev) => {
        const next = (prev === null ? 0 : prev) + 5;
        return next >= sortedProducts.length ? sortedProducts.length - 1 : next;
      });
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      setFocusedRowIndex((prev) => {
        const next = (prev === null ? 0 : prev) - 5;
        return next < 0 ? 0 : next;
      });
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      handleToggleSelectAll();
    }
  };

  const toggleGroupCollapse = (grp) => {
    setCollapsedGroups((prev) => ({ ...prev, [grp]: !prev[grp] }));
  };

  // Toggle selection
  const handleToggleSelect = (id) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextSelected = !p.selected;
          let nextQty = p.orderQty;
          if (nextSelected && p.orderQty === 0) {
            nextQty = Math.max(10, p.safetyTarget - p.currentStock);
          }
          return { ...p, selected: nextSelected, orderQty: nextQty };
        }
        return p;
      })
    );
  };

  const handleToggleSelectAll = () => {
    const nextVal = !allSelected;
    setProducts((prev) =>
      prev.map((p) => {
        const isInView = sortedProducts.some((sp) => sp.id === p.id);
        if (isInView) {
          return {
            ...p,
            selected: nextVal,
            orderQty: nextVal && p.orderQty === 0 ? Math.max(10, p.safetyTarget - p.currentStock) : p.orderQty,
          };
        }
        return p;
      })
    );
  };

  const handleSelectPreset = (preset) => {
    setBatchMenuOpen(false);
    setProducts((prev) =>
      prev.map((p) => {
        const isInView = sortedProducts.some((sp) => sp.id === p.id);
        if (!isInView) return p;

        let selected = p.selected;
        let orderQty = p.orderQty;

        if (preset === 'all') {
          selected = true;
          if (orderQty === 0) orderQty = Math.max(10, p.safetyTarget - p.currentStock);
        } else if (preset === 'none') {
          selected = false;
        } else if (preset === 'critical') {
          selected = p.priority === 'critical';
          if (selected && orderQty === 0) orderQty = Math.max(10, p.safetyTarget - p.currentStock);
        } else if (preset === 'low') {
          selected = p.priority === 'low';
          if (selected && orderQty === 0) orderQty = Math.max(10, p.safetyTarget - p.currentStock);
        } else if (preset === 'below_safety') {
          selected = p.currentStock < p.safetyTarget;
          if (selected && orderQty === 0) orderQty = Math.max(10, p.safetyTarget - p.currentStock);
        } else if (preset === 'invert') {
          selected = !selected;
        }

        return { ...p, selected, orderQty };
      })
    );
    showToast(`Updated selection: ${preset}`);
  };

  // Inline editing actions
  const handleStartEdit = (prod) => {
    setEditingSku(prod.sku);
    setEditQtyValue(String(prod.orderQty));
    setIsUnsaved(false);
  };

  const handleSaveInlineQty = (sku) => {
    const val = parseInt(editQtyValue, 10);
    const sanitized = isNaN(val) || val < 0 ? 0 : val;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === sku) {
          return {
            ...p,
            orderQty: sanitized,
            selected: sanitized > 0 ? true : p.selected,
          };
        }
        return p;
      })
    );
    setEditingSku(null);
    setIsUnsaved(false);
    showToast(`Updated ${sku} quantity to ${sanitized} units.`);
  };

  const handleCancelInlineQty = () => {
    const original = products.find((p) => p.sku === editingSku);
    if (original) {
      setEditQtyValue(String(original.orderQty));
    }
    setEditingSku(null);
    setIsUnsaved(false);
  };

  // Apply supplier minimums
  const handleApplySupplierMinimums = () => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.selected) {
          const sup = INITIAL_SUPPLIERS.find((s) => s.id === p.supplierId);
          const minQty = sup ? Math.max(15, Math.ceil(sup.unitThreshold / 3)) : 20;
          return { ...p, orderQty: Math.max(p.orderQty, minQty) };
        }
        return p;
      })
    );
    showToast('Applied supplier minimums across active selections.');
  };

  // Save Draft
  const handleSaveDraft = () => {
    try {
      localStorage.setItem('stockdesk_replenishment_draft', JSON.stringify(products));
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      showToast(`Replenishment draft saved at ${now}`);
    } catch {
      showToast('Replenishment draft saved.');
    }
  };

  // Discard all changes
  const handleDiscardAll = () => {
    withUnsavedGuard(() => {
      setProducts(INITIAL_PRODUCTS);
      setEditingSku(null);
      setIsUnsaved(false);
      showToast('Restored original replenishment baseline.', 'info');
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Supplier', 'SKU', 'Item Name', 'Category', 'Units', 'Unit Cost', 'Subtotal'];
    const rows = selectedItems.map((item) => {
      const sup = INITIAL_SUPPLIERS.find((s) => s.id === item.supplierId);
      return [
        `"${sup ? sup.name : item.supplierId}"`,
        item.sku,
        `"${item.name}"`,
        item.category,
        item.orderQty,
        item.unitCost,
        item.orderQty * item.unitCost,
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PO_Draft_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported PO summary CSV.');
  };

  const handlePrintManifest = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `Replenishment Summary\nSelected Items: ${selectedItems.length} SKUs (${totalSelectedUnits} units)\nTotal Value: ${formatCurrency(totalSelectedAmount)}`;
    navigator.clipboard.writeText(text);
    showToast('Copied PO summary to clipboard.');
  };

  const handleSubmitPO = () => {
    if (selectedItems.length === 0) {
      showToast('No items selected for purchase order.', 'warn');
      return;
    }
    setPoSuccessModalOpen(true);
  };

  return (
    <div className="rp-shell">
      {/* ─── Top Bar Header ───────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-logo" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"/>
              <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4"/>
              <circle cx="8" cy="19" r="2"/>
              <circle cx="18" cy="19" r="2"/>
            </svg>
          </div>
          <span className="brand-name">StockDesk</span>
          <span className="brand-sep">/</span>
          <span className="brand-page">Retail Replenishment Desk</span>
        </div>

        {/* Global Search Bar */}
        <div className="topbar-search">
          <div className="search-wrap" role="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search SKU, item name, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search replenishment items"
            />
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                style={{ fontSize: 13, color: 'var(--text3)', padding: '0 4px' }}
                title="Clear search"
              >
                ✕
              </button>
            ) : (
              <kbd className="search-kbd" onClick={() => searchInputRef.current?.focus()} title="Search items (Ctrl+K)">
                Ctrl+K
              </kbd>
            )}
          </div>
        </div>

        {/* Topbar Controls */}
        <div className="topbar-right">
          <div className="theme-toggle" role="group" aria-label="Color theme switcher">
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              Light
            </button>
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              Dark
            </button>
            <button
              className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
              onClick={() => setTheme('system')}
            >
              System
            </button>
          </div>

          {/* State Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="state-btn"
              onClick={() => setStateDropdownOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={stateDropdownOpen}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 2v7.31L4.69 16A4 4 0 0 0 7.8 22h8.4a4 4 0 0 0 3.11-6L14 9.31V2"></path>
                <line x1="8" y1="2" x2="16" y2="2"></line>
              </svg>
              <span>State: {appState.charAt(0).toUpperCase() + appState.slice(1)}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {stateDropdownOpen && (
              <div className="dropdown-menu right">
                {['default', 'loading', 'empty', 'error'].map((st) => (
                  <button
                    key={st}
                    className="dropdown-item"
                    onClick={() => {
                      setAppState(st);
                      setStateDropdownOpen(false);
                      showToast(`Switched view to state: ${st}`);
                    }}
                    style={{ fontWeight: appState === st ? 600 : 400 }}
                  >
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="user-btn">
            <div className="user-av">SM</div>
            <div className="user-info">
              <span className="user-name">Store Operations</span>
              <span className="user-store">Main Depot #104</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Full Width Table Page ───────────────────────────────────── */}
      <main className="rp-main-full" aria-label="Replenishment Matrix Table">
        {/* Matrix Header */}
        <div className="matrix-head">
          <h1 className="matrix-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="15" y1="3" x2="15" y2="21"/>
            </svg>
            Replenishment Matrix
          </h1>

          <div className="matrix-head-stats">
            <span className="head-stat-pill">
              Total SKUs: <strong>{products.length}</strong>
            </span>
            <span className="head-stat-pill">
              Critical Deficits: <strong>{products.filter((p) => p.priority === 'critical').length}</strong>
            </span>
            <button
              className={`btn-summary-toggle ${selectedItems.length > 0 ? 'has-selection' : ''}`}
              onClick={() => setSummaryDrawerOpen(true)}
              title="Open Supplier Review Summary Panel"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>
                Supplier Review Summary ({selectedItems.length}) • {formatCurrency(totalSelectedAmount)}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-left">
            {/* Supplier Filter */}
            <div className="filter-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <span>Supplier:</span>
              <select
                className="filter-select"
                value={supplierFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  withUnsavedGuard(() => {
                    setSupplierFilter(val);
                    showToast(val === 'all' ? 'Showing all suppliers' : `Filtered to ${INITIAL_SUPPLIERS.find(s => s.id === val)?.name}`);
                  });
                }}
                aria-label="Filter by supplier"
              >
                <option value="all">All Suppliers ({INITIAL_SUPPLIERS.length})</option>
                {INITIAL_SUPPLIERS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="status-pills" role="radiogroup" aria-label="Status filter">
              {[
                { id: 'all', label: 'All', count: enrichedProducts.length },
                { id: 'critical', label: 'Critical', count: enrichedProducts.filter((p) => p.priority === 'critical').length },
                { id: 'low', label: 'Low', count: enrichedProducts.filter((p) => p.priority === 'low').length },
                { id: 'healthy', label: 'Healthy', count: enrichedProducts.filter((p) => p.priority === 'healthy').length },
              ].map((st) => (
                <button
                  key={st.id}
                  className={`status-pill-btn ${statusFilter === st.id ? 'active' : ''}`}
                  onClick={() => {
                    withUnsavedGuard(() => {
                      setStatusFilter(st.id);
                      showToast(`Filter: ${st.label}`);
                    });
                  }}
                  role="radio"
                  aria-checked={statusFilter === st.id}
                >
                  <span>{st.label}</span>
                  <span style={{ opacity: 0.7, fontSize: 10 }}>({st.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort Selector */}
          <div className="filter-right">
            <label htmlFor="sort-select" style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
              Sort:
            </label>
            <select
              id="sort-select"
              className="sort-sel"
              value={sortBy}
              onChange={(e) => {
                const val = e.target.value;
                withUnsavedGuard(() => {
                  setSortBy(val);
                  showToast(`Sorted table by ${val}`);
                });
              }}
            >
              <option value="priority">Priority (Critical First)</option>
              <option value="stock_low">Current Stock (Low to High)</option>
              <option value="safety_target">Safety Target (High to Low)</option>
              <option value="order_qty">Order Quantity (High to Low)</option>
              <option value="subtotal">Subtotal (High to Low)</option>
              <option value="name">Item Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div style={{ position: 'relative' }}>
            <button
              className="toolbar-sel"
              onClick={() => setBatchMenuOpen((prev) => !prev)}
              title="Selection options (Space to toggle, Enter/F2 to edit)"
              aria-haspopup="true"
              aria-expanded={batchMenuOpen}
            >
              <input
                type="checkbox"
                className="cb"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={(e) => {
                  e.stopPropagation();
                  handleToggleSelectAll();
                }}
                aria-label="Select all items in view"
              />
              <span>{tableSelectedItems.length} Items Selected</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {batchMenuOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => handleSelectPreset('all')}>
                  Select All ({sortedProducts.length})
                </button>
                <button className="dropdown-item" onClick={() => handleSelectPreset('critical')}>
                  Select Critical ({criticalItems.length})
                </button>
                <button className="dropdown-item" onClick={() => handleSelectPreset('low')}>
                  Select Low Stock ({lowItems.length})
                </button>
                <button className="dropdown-item" onClick={() => handleSelectPreset('below_safety')}>
                  Select Below Safety Target
                </button>
                <button className="dropdown-item" onClick={() => handleSelectPreset('invert')}>
                  Invert Selection
                </button>
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <button className="dropdown-item" onClick={() => handleSelectPreset('none')}>
                  Deselect All
                </button>
              </div>
            )}
          </div>

          <button
            className="btn-secondary"
            onClick={handleApplySupplierMinimums}
            title="Automatically adjust order quantities to meet supplier thresholds"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Apply Supplier Minimums</span>
          </button>

          <button
            className="btn-secondary"
            onClick={handleSaveDraft}
            title="Save replenishment draft (Ctrl+S)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Save Draft</span>
          </button>

          {/* Windows Keyboard Shortcuts Affordance */}
          <div className="toolbar-kbd-hint">
            <span>Keyboard:</span>
            <kbd>Ctrl+K</kbd> Search • <kbd>↑↓</kbd> Rows • <kbd>Space</kbd> Select • <kbd>F2/Enter</kbd> Edit • <kbd>Esc</kbd> Cancel • <kbd>Ctrl+S</kbd> Save
          </div>
        </div>

        {/* ─── Dense Data Table Views ────────────────────────────────────── */}
        {appState === 'loading' && (
          <div className="tbl-wrap">
            <div className="skel-rows">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                <div key={idx} className="skel-row">
                  <div className="skel-cell skel-sm"></div>
                  <div className="skel-cell skel-md"></div>
                  <div className="skel-cell skel-lg"></div>
                  <div className="skel-cell skel-md"></div>
                  <div className="skel-cell skel-sm"></div>
                  <div className="skel-cell skel-sm"></div>
                  <div className="skel-cell skel-md"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {appState === 'empty' && (
          <div className="state-box">
            <div className="state-icon">📦</div>
            <div className="state-title">No Replenishment Items Found</div>
            <div className="state-body">
              All categories and SKUs are currently at optimal inventory levels or no products match the current filters.
            </div>
            <button
              className="retry-btn"
              onClick={() => {
                setSupplierFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
                setAppState('default');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {appState === 'error' && (
          <div className="state-box">
            <div className="state-icon" style={{ color: 'var(--c-critical)' }}>⚠️</div>
            <div className="state-title">Failed to Synchronize Inventory Feed</div>
            <div className="state-body">
              Could not retrieve live inventory levels from store master ERP gateway. Check connection and retry.
            </div>
            <button
              className="retry-btn"
              onClick={() => {
                setAppState('loading');
                setTimeout(() => setAppState('default'), 700);
              }}
            >
              Retry Synchronization
            </button>
          </div>
        )}

        {appState === 'default' && (
          <div
            ref={tableWrapRef}
            className="tbl-wrap"
            tabIndex={0}
            onKeyDown={handleTableKeyDown}
            role="region"
            aria-label="Dense Replenishment Matrix"
          >
            <table className="tbl" role="grid" aria-label="Replenishment Matrix Table">
              <thead>
                <tr role="row">
                  <th className="col-chk" role="columnheader">
                    <input
                      type="checkbox"
                      className="cb"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      aria-label="Select all items"
                    />
                  </th>
                  <th className="col-sku" role="columnheader">SKU</th>
                  <th className="col-name" role="columnheader">Item Name &amp; Category</th>
                  <th className="col-sup" role="columnheader">Supplier</th>
                  <th className="col-stk" role="columnheader">Current Stock</th>
                  <th className="col-tgt" role="columnheader">Safety Target</th>
                  <th className="col-st" role="columnheader">Status</th>
                  <th className="col-qty" role="columnheader">Order Qty</th>
                  <th className="col-cost" role="columnheader">Unit Cost</th>
                  <th className="col-sub" role="columnheader">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
                      No items match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* CRITICAL PRIORITY GROUP */}
                    {criticalItems.length > 0 && (
                      <>
                        <tr className="pg-hdr" role="row">
                          <td
                            colSpan={10}
                            style={{ background: 'var(--c-critical-bg)' }}
                            onClick={() => toggleGroupCollapse('critical')}
                          >
                            <div className="pg-wrap">
                              <span className="pg-dot dot-c">●</span>
                              <span className="lbl-c">CRITICAL REORDER REQUIREMENT</span>
                              <span className="pg-cnt">({criticalItems.length} items)</span>
                              <span className={`pg-chev ${collapsedGroups.critical ? 'collapsed' : ''}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="6 9 12 15 18 9"/>
                                </svg>
                              </span>
                            </div>
                          </td>
                        </tr>
                        {!collapsedGroups.critical &&
                          criticalItems.map((prod) => renderProductRow(prod))}
                      </>
                    )}

                    {/* LOW STOCK PRIORITY GROUP */}
                    {lowItems.length > 0 && (
                      <>
                        <tr className="pg-hdr" role="row">
                          <td
                            colSpan={10}
                            style={{ background: 'var(--c-low-bg)' }}
                            onClick={() => toggleGroupCollapse('low')}
                          >
                            <div className="pg-wrap">
                              <span className="pg-dot dot-l">●</span>
                              <span className="lbl-l">LOW STOCK WARNING</span>
                              <span className="pg-cnt">({lowItems.length} items)</span>
                              <span className={`pg-chev ${collapsedGroups.low ? 'collapsed' : ''}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="6 9 12 15 18 9"/>
                                </svg>
                              </span>
                            </div>
                          </td>
                        </tr>
                        {!collapsedGroups.low &&
                          lowItems.map((prod) => renderProductRow(prod))}
                      </>
                    )}

                    {/* HEALTHY PRIORITY GROUP */}
                    {healthyItems.length > 0 && (
                      <>
                        <tr className="pg-hdr" role="row">
                          <td
                            colSpan={10}
                            style={{ background: 'var(--c-healthy-bg)' }}
                            onClick={() => toggleGroupCollapse('healthy')}
                          >
                            <div className="pg-wrap">
                              <span className="pg-dot dot-h">●</span>
                              <span className="lbl-h">HEALTHY INVENTORY</span>
                              <span className="pg-cnt">({healthyItems.length} items)</span>
                              <span className={`pg-chev ${collapsedGroups.healthy ? 'collapsed' : ''}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="6 9 12 15 18 9"/>
                                </svg>
                              </span>
                            </div>
                          </td>
                        </tr>
                        {!collapsedGroups.healthy &&
                          healthyItems.map((prod) => renderProductRow(prod))}
                      </>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="pager">
          <span className="pager-info">
            Showing 1–{filteredProducts.length} of {filteredProducts.length} items ({selectedItems.length} selected)
          </span>
          <div className="pager-ctrl">
            <button className="pager-btn" disabled title="Previous page">‹</button>
            <button className="pager-btn cur">1</button>
            <button className="pager-btn" disabled title="Next page">›</button>
          </div>
        </div>
      </main>

      {/* ─── Supplier Review Summary Panel (Slide-over Drawer) ─────────────── */}
      {summaryDrawerOpen && (
        <div className="drawer-backdrop" onClick={() => setSummaryDrawerOpen(false)}>
          <aside
            className="summary-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Supplier Review Summary &amp; PO Draft"
          >
            {/* Drawer Header */}
            <div className="drawer-head">
              <div className="drawer-title-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <h2 className="drawer-title">Supplier Review Summary</h2>
              </div>
              <div className="drawer-actions">
                <button className="drawer-icon-btn" onClick={handleExportCSV} title="Export CSV">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                <button className="drawer-icon-btn" onClick={handlePrintManifest} title="Print Manifest">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                </button>
                <button className="drawer-icon-btn" onClick={handleCopySummary} title="Copy Summary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
                <button
                  className="drawer-icon-btn"
                  onClick={() => setSummaryDrawerOpen(false)}
                  title="Close summary panel"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Supplier Tabs if multiple suppliers in draft */}
            {draftsBySupplier.length > 1 && (
              <div className="drawer-sup-tabs">
                {draftsBySupplier.map((g) => (
                  <button
                    key={g.supplier.id}
                    className={`drawer-sup-tab ${activeSummarySupplierId === g.supplier.id ? 'active' : ''}`}
                    onClick={() => setActiveSummarySupplierId(g.supplier.id)}
                  >
                    {g.supplier.name} ({g.items.length})
                  </button>
                ))}
              </div>
            )}

            {/* Drawer Body */}
            <div className="drawer-content">
              {draftsBySupplier.length === 0 ? (
                <div className="state-box">
                  <div className="state-icon">📋</div>
                  <div className="state-title">No Items In Draft</div>
                  <div className="state-body">
                    Check row checkboxes in the full width table to build purchase order drafts.
                  </div>
                </div>
              ) : (
                <>
                  {activeSummaryGroup && (
                    <>
                      {/* Supplier Information Section */}
                      <div className="drawer-sec">
                        <div className="drawer-sec-title">Supplier Information</div>
                        <div className="sup-card">
                          <div className="sup-card-av" style={{ background: activeSummaryGroup.supplier.color }}>
                            {activeSummaryGroup.supplier.initials}
                          </div>
                          <div>
                            <div className="sup-card-name">{activeSummaryGroup.supplier.name}</div>
                            <div className="sup-card-meta">
                              {activeSummaryGroup.supplier.category} • Lead Time: {activeSummaryGroup.supplier.leadTime}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Minimum Threshold Checklist */}
                      <div className="drawer-sec">
                        <div className="drawer-sec-title">Minimum Threshold Checklist</div>
                        <div className="checklist">
                          <div className="check-item">
                            <span className={`check-icon ${activeSummaryGroup.moqMet ? 'pass' : 'fail'}`}>
                              {activeSummaryGroup.moqMet ? '✔' : '✖'}
                            </span>
                            <span>
                              Order value {formatCurrency(activeSummaryGroup.totalAmount)}{' '}
                              {activeSummaryGroup.moqMet ? 'exceeds' : 'below'}{' '}
                              {formatCurrency(activeSummaryGroup.supplier.targetMoq)} MOQ threshold
                            </span>
                          </div>
                          <div className="check-item">
                            <span className={`check-icon ${activeSummaryGroup.unitsMet ? 'pass' : 'fail'}`}>
                              {activeSummaryGroup.unitsMet ? '✔' : '✖'}
                            </span>
                            <span>
                              Order units ({activeSummaryGroup.totalUnits} units){' '}
                              {activeSummaryGroup.unitsMet ? 'exceeds' : 'below'}{' '}
                              {activeSummaryGroup.supplier.unitThreshold} unit freight threshold
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="drawer-sec">
                        <div className="drawer-sec-title">Financial Summary ({activeSummaryGroup.supplier.name})</div>
                        <div className="fin-summary">
                          <div className="fin-row">
                            <span className="lbl">Subtotal ({activeSummaryGroup.items.length} SKUs)</span>
                            <span className="val">{formatCurrency(activeSummaryGroup.totalAmount)}</span>
                          </div>
                          <div className="fin-row">
                            <span className="lbl">Total Units</span>
                            <span className="val">{activeSummaryGroup.totalUnits} units</span>
                          </div>
                          <div className="fin-row">
                            <span className="lbl">GST / Taxes</span>
                            <span className="val" style={{ color: 'var(--text3)', fontWeight: 400 }}>Included</span>
                          </div>
                          <div className="fin-row total">
                            <span className="lbl">Total PO Amount</span>
                            <span className="val">{formatCurrency(activeSummaryGroup.totalAmount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Order Breakdown */}
                      <div className="drawer-sec" style={{ flex: 1 }}>
                        <div className="drawer-sec-title">Order Breakdown ({activeSummaryGroup.items.length} Items)</div>
                        <div className="bk-list">
                          {activeSummaryGroup.items.map((item) => (
                            <div key={item.id} className="bk-row">
                              <div className="bk-left">
                                <span className="bk-item-name" title={item.name}>{item.name}</span>
                                <span className="bk-item-sku">{item.sku} • @ {formatCurrency(item.unitCost)}</span>
                              </div>
                              <div className="bk-right">
                                <span className="bk-item-units">{item.orderQty} units</span>
                                <span className="bk-item-subtotal">{formatCurrency(item.orderQty * item.unitCost)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Drawer Actions */}
            {draftsBySupplier.length > 0 && (
              <div className="drawer-footer">
                <button
                  className="btn-drawer-approve"
                  onClick={handleSubmitPO}
                  disabled={selectedItems.length === 0}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m22 2-7 20-4-9-9-4Z"/>
                    <path d="M22 2 11 13"/>
                  </svg>
                  <span>Approve &amp; Transmit PO ({formatCurrency(totalSelectedAmount)}) →</span>
                </button>
                <button className="btn-drawer-save" onClick={handleSaveDraft}>
                  Save Draft (Ctrl+S)
                </button>
                <button className="btn-drawer-discard" onClick={handleDiscardAll}>
                  Discard All Selections &amp; Baseline
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ─── Modal: Unsaved Changes Confirmation ───────────────────────────── */}
      {unsavedDialog.open && (
        <div className="modal-backdrop" onClick={handleResolveKeepEditing}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-labelledby="unsaved-modal-title"
          >
            <div className="modal-head">
              <h3 id="unsaved-modal-title" className="modal-title" style={{ color: 'var(--c-low)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Unsaved Quantity Changes
              </h3>
              <button className="modal-close" onClick={handleResolveKeepEditing}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text)' }}>
                You have unsaved changes to Order Quantity for <strong>{unsavedDialog.name}</strong> ({unsavedDialog.sku}).
              </p>
              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text3)' }}>Original: </span>
                  <span style={{ fontWeight: 600 }}>{unsavedDialog.originalQty} units</span>
                </div>
                <div>→</div>
                <div>
                  <span style={{ color: 'var(--brand)' }}>New Draft: </span>
                  <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{unsavedDialog.draftQty} units</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text2)' }}>
                Would you like to save this quantity draft before proceeding, discard it, or keep editing?
              </p>
            </div>
            <div className="modal-foot">
              <button
                className="btn-secondary"
                onClick={handleResolveKeepEditing}
              >
                Keep Editing
              </button>
              <button
                className="btn-secondary"
                style={{ color: 'var(--c-critical)' }}
                onClick={handleResolveDiscardProceed}
              >
                Discard Changes
              </button>
              <button
                className="btn-primary"
                onClick={handleResolveSaveProceed}
              >
                Save &amp; Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: PO Submitted Confirmation ─────────────────────────────── */}
      {poSuccessModalOpen && (
        <div className="modal-backdrop" onClick={() => setPoSuccessModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title" style={{ color: '#16a34a' }}>
                ✔ Purchase Order Transmitted
              </h3>
              <button className="modal-close" onClick={() => setPoSuccessModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text)' }}>
                Purchase Order for <strong>{selectedItems.length} SKUs</strong> has been successfully transmitted to the EDI Gateway.
              </p>
              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text2)' }}>Total Order Value:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{formatCurrency(totalSelectedAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text2)' }}>Units Ordered:</span>
                  <span style={{ fontWeight: 600 }}>{totalSelectedUnits} units across {selectedItems.length} SKUs</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text2)' }}>Suppliers Involved:</span>
                  <span style={{ fontWeight: 600 }}>{draftsBySupplier.length} Supplier(s)</span>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button
                className="btn-primary"
                onClick={() => {
                  setPoSuccessModalOpen(false);
                  setSummaryDrawerOpen(false);
                  showToast('PO confirmed. Inventory awaiting vendor delivery.');
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast Feedback Notification ──────────────────────────────────── */}
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );

  // Helper to render product row
  function renderProductRow(prod) {
    const isEditingThis = editingSku === prod.sku;
    const isKbFocused = focusedRowIndex !== null && sortedProducts[focusedRowIndex]?.id === prod.id;
    const lineSubtotal = prod.orderQty * prod.unitCost;
    const sup = INITIAL_SUPPLIERS.find((s) => s.id === prod.supplierId);

    return (
      <tr
        key={prod.id}
        className={`pr ${prod.selected ? 'sel' : ''} ${isKbFocused ? 'kb-focused' : ''}`}
        role="row"
        aria-selected={prod.selected}
        tabIndex={-1}
        onClick={() => setFocusedRowIndex(sortedProducts.findIndex((p) => p.id === prod.id))}
      >
        <td className="col-chk" role="gridcell">
          <input
            type="checkbox"
            className="cb"
            checked={prod.selected}
            onChange={() => handleToggleSelect(prod.id)}
            aria-label={`Select ${prod.name}`}
          />
        </td>
        <td className="col-sku" role="gridcell">
          <span className="sku-lbl">{prod.sku}</span>
        </td>
        <td className="col-name" role="gridcell">
          <div className="prod-name">{prod.name}</div>
          <div className="prod-cat">{prod.category}</div>
        </td>
        <td className="col-sup" role="gridcell">
          <div className="sup-pill">
            <span className="sup-dot" style={{ background: sup?.color || '#2563eb' }}></span>
            <span>{sup?.name || prod.supplierId}</span>
          </div>
        </td>
        <td className="col-stk" role="gridcell">{prod.currentStock}</td>
        <td className="col-tgt" role="gridcell">{prod.safetyTarget}</td>
        <td className="col-st" role="gridcell">
          <span className={`st-badge ${prod.priority}`}>
            <span className="st-dot"></span>
            {prod.priority.charAt(0).toUpperCase() + prod.priority.slice(1)}
          </span>
        </td>
        <td className="col-qty" role="gridcell">
          {isEditingThis ? (
            <div className="qty-edit-box">
              <div className="qty-input-row">
                <input
                  type="number"
                  className="qty-input"
                  value={editQtyValue}
                  onChange={(e) => {
                    setEditQtyValue(e.target.value);
                    setIsUnsaved(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveInlineQty(prod.sku);
                    if (e.key === 'Escape') {
                      if (isUnsaved) {
                        withUnsavedGuard(() => handleCancelInlineQty());
                      } else {
                        handleCancelInlineQty();
                      }
                    }
                  }}
                  autoFocus
                  aria-label={`Order quantity for ${prod.name}`}
                />
                <button
                  className="qty-btn-save"
                  onClick={() => handleSaveInlineQty(prod.sku)}
                  title="Save quantity (Enter)"
                >
                  ↵
                </button>
                <button
                  className="qty-btn-cancel"
                  onClick={() => {
                    if (isUnsaved) {
                      withUnsavedGuard(() => handleCancelInlineQty());
                    } else {
                      handleCancelInlineQty();
                    }
                  }}
                  title="Cancel edit (Esc)"
                >
                  ✕
                </button>
              </div>
              {isUnsaved && <span className="qty-unsaved-pill">Unsaved draft</span>}
            </div>
          ) : (
            <button
              className="qty-cell-btn"
              onClick={() => withUnsavedGuard(() => handleStartEdit(prod))}
              title="Click or press F2/Enter to edit order quantity"
            >
              <span>{prod.orderQty} units</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
        </td>
        <td className="col-cost" role="gridcell">{formatCurrency(prod.unitCost)}</td>
        <td className="col-sub" role="gridcell">{formatCurrency(lineSubtotal)}</td>
      </tr>
    );
  }
}
