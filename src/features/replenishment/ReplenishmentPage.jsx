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
    badge: null,
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
  // ── Heritage Foods (10 items matching the enterprise screenshot)
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

  // ── Britannia Industries
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
    selected: true,
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
    selected: true,
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
    selected: true,
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
  {
    id: 'bi-006',
    sku: 'BI-006',
    name: 'Treat Jim Jam 100g',
    category: 'Biscuits',
    supplierId: 'bi',
    currentStock: 30,
    safetyTarget: 35,
    dailySales: 3,
    orderQty: 0,
    unitCost: 30,
    selected: false,
  },

  // ── Nature's Farm
  {
    id: 'nf-001',
    sku: 'NF-001',
    name: 'Organic Cavendish Bananas (1kg)',
    category: 'Fruits',
    supplierId: 'nf',
    currentStock: 45,
    safetyTarget: 40,
    dailySales: 15,
    orderQty: 0,
    unitCost: 60,
    selected: false,
  },
  {
    id: 'nf-002',
    sku: 'NF-002',
    name: 'Alphonso Mangoes (1kg crate)',
    category: 'Fruits',
    supplierId: 'nf',
    currentStock: 35,
    safetyTarget: 30,
    dailySales: 8,
    orderQty: 0,
    unitCost: 350,
    selected: false,
  },
  {
    id: 'nf-003',
    sku: 'NF-003',
    name: 'Hass Avocados (500g)',
    category: 'Fruits',
    supplierId: 'nf',
    currentStock: 25,
    safetyTarget: 20,
    dailySales: 4,
    orderQty: 0,
    unitCost: 220,
    selected: false,
  },
  {
    id: 'nf-004',
    sku: 'NF-004',
    name: 'Hydroponic Baby Spinach (250g)',
    category: 'Vegetables',
    supplierId: 'nf',
    currentStock: 30,
    safetyTarget: 25,
    dailySales: 5,
    orderQty: 0,
    unitCost: 80,
    selected: false,
  },
];

const INITIAL_MANIFESTS = [
  { id: 'MNF-8491', supplier: 'Heritage Foods', truck: 'KA-04-E-2918', items: 340, eta: 'Today, 4:30 PM', status: 'In Transit' },
  { id: 'MNF-8488', supplier: 'Britannia Industries', truck: 'DL-01-A-7741', items: 180, eta: 'Tomorrow, 9:00 AM', status: 'Dock Scheduled' },
  { id: 'MNF-8472', supplier: "Nature's Farm", truck: 'MH-12-Q-3392', items: 210, eta: 'Delivered', status: 'Awaiting Verification' },
];

const formatCurrency = (val) => `₹${Math.round(Number(val)).toLocaleString('en-IN')}`;

export default function ReplenishmentPage() {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('stockdesk_theme') || 'light');
  // State simulator
  const [appState, setAppState] = useState('default');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);

  // Active navigation icon
  const [activeNav, setActiveNav] = useState('replenishment');

  // Supplier state
  const [selectedSupplierId, setSelectedSupplierId] = useState('hf');
  const [queueCollapsed, setQueueCollapsed] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'critical' | 'low' | 'healthy'
  const [sortBy, setSortBy] = useState('priority');
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);

  // Products state
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  // Keyboard navigation row focus index
  const [focusedRowIndex, setFocusedRowIndex] = useState(null);

  // Inline editing state
  const [editingSku, setEditingSku] = useState('HF-001');
  const [editQtyValue, setEditQtyValue] = useState('50');
  const [isUnsaved, setIsUnsaved] = useState(true);

  // Unsaved changes confirmation dialog state
  const [unsavedDialog, setUnsavedDialog] = useState({
    open: false,
    pendingAction: null,
    sku: null,
    name: '',
    originalQty: 0,
    draftQty: 0,
  });

  // Collapsed priority groups
  const [collapsedGroups, setCollapsedGroups] = useState({
    critical: false,
    low: false,
    healthy: false,
  });

  // Dropdown menus
  const [batchMenuOpen, setBatchMenuOpen] = useState(false);
  const [poMoreMenuOpen, setPoMoreMenuOpen] = useState(false);

  // Modals
  const [createPoModalOpen, setCreatePoModalOpen] = useState(false);
  const [manifestsModalOpen, setManifestsModalOpen] = useState(false);
  const [poSuccessModalOpen, setPoSuccessModalOpen] = useState(false);

  // Form states for manual PO creation
  const [newPoSupplier, setNewPoSupplier] = useState('hf');
  const [newPoDock, setNewPoDock] = useState('Dock B - Cold Storage');
  const [newPoNotes, setNewPoNotes] = useState('');

  // Toast feedback
  const [toast, setToast] = useState(null);
  const searchInputRef = useRef(null);
  const tableRef = useRef(null);

  // Synchronize theme with data-theme attribute on documentElement
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('stockdesk_theme', theme);
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Guard function to intercept navigation or context changes when unsaved edits exist
  const withUnsavedGuard = (action) => {
    if (editingSku && isUnsaved) {
      const item = products.find((p) => p.sku === editingSku);
      setUnsavedDialog({
        open: true,
        pendingAction: action,
        sku: editingSku,
        name: item ? item.name : editingSku,
        originalQty: item ? item.orderQty : 0,
        draftQty: parseInt(editQtyValue, 10) || 0,
      });
      return false;
    }
    action();
    return true;
  };

  // Resolve unsaved dialog: save & proceed
  const handleResolveSaveAndProceed = () => {
    if (unsavedDialog.sku) {
      handleSaveInlineQty(unsavedDialog.sku);
    }
    const act = unsavedDialog.pendingAction;
    setUnsavedDialog({ open: false, pendingAction: null, sku: null, name: '', originalQty: 0, draftQty: 0 });
    if (act) act();
  };

  // Resolve unsaved dialog: discard & proceed
  const handleResolveDiscardAndProceed = () => {
    handleCancelInlineQty();
    const act = unsavedDialog.pendingAction;
    setUnsavedDialog({ open: false, pendingAction: null, sku: null, name: '', originalQty: 0, draftQty: 0 });
    if (act) act();
  };

  // Resolve unsaved dialog: keep editing
  const handleResolveKeepEditing = () => {
    setUnsavedDialog({ open: false, pendingAction: null, sku: null, name: '', originalQty: 0, draftQty: 0 });
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
      if (e.key === 'Escape') {
        setBatchMenuOpen(false);
        setPoMoreMenuOpen(false);
        setStateDropdownOpen(false);
        setCreatePoModalOpen(false);
        setManifestsModalOpen(false);
        if (unsavedDialog.open) handleResolveKeepEditing();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [unsavedDialog.open]);

  const currentSupplier = useMemo(() => {
    return INITIAL_SUPPLIERS.find((s) => s.id === selectedSupplierId) || INITIAL_SUPPLIERS[0];
  }, [selectedSupplierId]);

  // Dynamically calculate priorities using calculated priority rules
  const enrichedProducts = useMemo(() => {
    return products.map((p) => {
      const derivedPriority = calcPriority(p);
      return {
        ...p,
        priority: derivedPriority,
        status: derivedPriority,
      };
    });
  }, [products]);

  // Filter products by supplier, status, and search query
  const supplierProducts = useMemo(() => {
    if (showAllSuppliers) return enrichedProducts;
    return enrichedProducts.filter((p) => p.supplierId === selectedSupplierId);
  }, [enrichedProducts, selectedSupplierId, showAllSuppliers]);

  const filteredProducts = useMemo(() => {
    return supplierProducts.filter((p) => {
      // Status filter
      if (statusFilter !== 'all' && p.priority !== statusFilter) return false;

      // Text search
      const q = searchTerm.toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [supplierProducts, statusFilter, searchTerm]);

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

  // Group products by priority
  const criticalItems = sortedProducts.filter((p) => p.priority === 'critical');
  const lowItems = sortedProducts.filter((p) => p.priority === 'low');
  const healthyItems = sortedProducts.filter((p) => p.priority === 'healthy');

  // Selected items calculations for Supplier Review Summary
  const selectedItems = useMemo(() => {
    return supplierProducts.filter((p) => p.selected && p.orderQty > 0);
  }, [supplierProducts]);

  const totalSelectedUnits = useMemo(() => {
    return selectedItems.reduce((acc, p) => acc + p.orderQty, 0);
  }, [selectedItems]);

  const totalSelectedAmount = useMemo(() => {
    return selectedItems.reduce((acc, p) => acc + p.orderQty * p.unitCost, 0);
  }, [selectedItems]);

  const allSelected = useMemo(() => {
    return supplierProducts.length > 0 && supplierProducts.every((p) => p.selected);
  }, [supplierProducts]);

  const someSelected = useMemo(() => {
    return supplierProducts.some((p) => p.selected) && !allSelected;
  }, [supplierProducts, allSelected]);

  // Table Keyboard Navigation handler (ArrowUp, ArrowDown, Space, Enter)
  const handleTableKeyDown = (e) => {
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
    } else if (e.key === 'Enter' && focusedRowIndex !== null) {
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
    }
  };

  // Toggle group collapse
  const toggleGroupCollapse = (grp) => {
    setCollapsedGroups((prev) => ({ ...prev, [grp]: !prev[grp] }));
  };

  // Select all toggle
  const handleToggleSelectAll = () => {
    const nextVal = !allSelected;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.supplierId === selectedSupplierId || showAllSuppliers) {
          return {
            ...p,
            selected: nextVal,
            orderQty: nextVal && p.orderQty === 0 ? Math.max(0, p.safetyTarget - p.currentStock) : p.orderQty,
          };
        }
        return p;
      })
    );
  };

  // Specific selection presets
  const handleSelectPreset = (preset) => {
    setBatchMenuOpen(false);
    setProducts((prev) =>
      prev.map((p) => {
        if (!showAllSuppliers && p.supplierId !== selectedSupplierId) return p;
        let selected = p.selected;
        let orderQty = p.orderQty;

        if (preset === 'all') {
          selected = true;
          if (orderQty === 0) orderQty = Math.max(0, p.safetyTarget - p.currentStock);
        } else if (preset === 'none') {
          selected = false;
        } else if (preset === 'critical') {
          selected = p.priority === 'critical';
          if (selected && orderQty === 0) orderQty = Math.max(0, p.safetyTarget - p.currentStock);
        } else if (preset === 'low') {
          selected = p.priority === 'low';
          if (selected && orderQty === 0) orderQty = Math.max(0, p.safetyTarget - p.currentStock);
        } else if (preset === 'below_safety') {
          selected = p.currentStock < p.safetyTarget;
          if (selected && orderQty === 0) orderQty = Math.max(0, p.safetyTarget - p.currentStock);
        } else if (preset === 'invert') {
          selected = !selected;
        }

        return { ...p, selected, orderQty };
      })
    );
    showToast(`Updated selection preset: ${preset}`);
  };

  // Individual select toggle
  const handleToggleSelect = (id) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextSelected = !p.selected;
          let nextQty = p.orderQty;
          if (nextSelected && p.orderQty === 0) {
            nextQty = Math.max(0, p.safetyTarget - p.currentStock);
          }
          return { ...p, selected: nextSelected, orderQty: nextQty };
        }
        return p;
      })
    );
  };

  // Start inline editing for ANY row
  const handleStartEdit = (prod) => {
    setEditingSku(prod.sku);
    setEditQtyValue(String(prod.orderQty));
    setIsUnsaved(false);
  };

  // Save inline quantity edit
  const handleSaveInlineQty = (sku) => {
    const parsed = parseInt(editQtyValue, 10);
    const validQty = isNaN(parsed) || parsed < 0 ? 0 : parsed;
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
    setIsUnsaved(false);
    showToast(`Updated ${sku} quantity to ${validQty} units.`);
  };

  // Cancel inline quantity edit
  const handleCancelInlineQty = () => {
    const original = products.find((p) => p.sku === editingSku);
    if (original) {
      setEditQtyValue(String(original.orderQty));
    }
    setIsUnsaved(false);
  };

  // Apply Supplier Minimums
  const handleApplySupplierMinimums = () => {
    setProducts((prev) => {
      let updated = prev.map((p) => {
        if (p.supplierId === selectedSupplierId) {
          const deficit = Math.max(0, p.safetyTarget - p.currentStock);
          return {
            ...p,
            selected: deficit > 0,
            orderQty: deficit,
          };
        }
        return p;
      });

      const currentSum = updated
        .filter((p) => p.supplierId === selectedSupplierId && p.selected)
        .reduce((sum, p) => sum + p.orderQty * p.unitCost, 0);

      if (currentSum < currentSupplier.targetMoq) {
        const target = currentSupplier.targetMoq;
        const diff = target - currentSum;
        const boostItem = updated.find((p) => p.supplierId === selectedSupplierId && p.priority === 'critical');
        if (boostItem) {
          const extraUnits = Math.ceil(diff / boostItem.unitCost);
          updated = updated.map((p) =>
            p.id === boostItem.id
              ? { ...p, orderQty: p.orderQty + extraUnits, selected: true }
              : p
          );
        }
      }

      return updated;
    });

    showToast(`Applied safety thresholds & MOQ minimums for ${currentSupplier.name}`);
  };

  // Approve Batch
  const handleApproveBatch = () => {
    if (selectedItems.length === 0) {
      showToast('No items currently selected to approve.', 'warn');
      return;
    }
    showToast(`Batch approved: ${selectedItems.length} SKUs (${totalSelectedUnits} units) ready in PO Draft.`);
  };

  // Save Draft
  const handleSaveDraft = () => {
    try {
      localStorage.setItem('stockdesk_draft_products', JSON.stringify(products));
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      showToast(`Draft #PO-2026-104 saved at ${now}`);
    } catch {
      showToast('Draft #PO-2026-104 saved.');
    }
  };

  // Discard Changes
  const handleDiscardChanges = () => {
    withUnsavedGuard(() => {
      setProducts(INITIAL_PRODUCTS);
      setEditQtyValue('50');
      setIsUnsaved(true);
      setEditingSku('HF-001');
      showToast('Changes discarded. Restored original baseline.', 'info');
    });
  };

  // Submit PO
  const handleSubmitPO = () => {
    if (selectedItems.length === 0) {
      showToast('Cannot submit empty PO. Select products first.', 'warn');
      return;
    }
    setPoSuccessModalOpen(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    setPoMoreMenuOpen(false);
    const headers = ['SKU', 'Item Name', 'Category', 'Units', 'Unit Cost', 'Subtotal'];
    const rows = selectedItems.map((item) => [
      item.sku,
      `"${item.name}"`,
      item.category,
      item.orderQty,
      item.unitCost,
      item.orderQty * item.unitCost,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PO-2026-104_${currentSupplier.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported PO-2026-104.csv successfully.');
  };

  // Print Manifest
  const handlePrintManifest = () => {
    setPoMoreMenuOpen(false);
    window.print();
  };

  // Copy PO Summary
  const handleCopySummary = () => {
    setPoMoreMenuOpen(false);
    const text = `PO Draft #PO-2026-104\nSupplier: ${currentSupplier.name}\nTotal Value: ${formatCurrency(totalSelectedAmount)}\nUnits: ${totalSelectedUnits} units across ${selectedItems.length} SKUs.`;
    navigator.clipboard.writeText(text);
    showToast('Copied PO summary to clipboard.');
  };

  // Create manual PO submit
  const handleCreatePoSubmit = (e) => {
    e.preventDefault();
    setCreatePoModalOpen(false);
    setSelectedSupplierId(newPoSupplier);
    showToast(`Created new PO for ${INITIAL_SUPPLIERS.find((s) => s.id === newPoSupplier)?.name}`);
  };

  return (
    <div className="rp" data-theme={theme}>
      {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-logo" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#0f172a" />
              <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="#2563eb" fillOpacity="0.85" />
            </svg>
          </div>
          <span className="brand-name">StockDesk</span>
          <span className="brand-sep">/</span>
          <span className="brand-page">Replenishment Desk</span>
        </div>

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
              placeholder="Search SKU, item name, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search items or supplier"
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
              <kbd className="search-kbd" onClick={() => searchInputRef.current?.focus()}>
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        <div className="topbar-right">
          {/* Theme switcher */}
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

          {/* State switcher dropdown */}
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

          {/* User profile */}
          <button
            className="user-btn"
            aria-label="User profile"
            onClick={() => showToast('Store Manager: Jane Doe (Riverside Mart #104)')}
          >
            <div className="user-av">SM</div>
            <div className="user-info">
              <span className="user-name">Store Manager</span>
              <span className="user-store">Riverside Mart</span>
            </div>
          </button>
        </div>
      </header>

      {/* ─── Main 4-Column Layout ─────────────────────────────────────────── */}
      <div className="rp-body">
        {/* Col 1: Icon Navigation Bar */}
        <nav className="icon-nav" aria-label="Main Navigation">
          <div className="icon-nav-list">
            <button
              className={`icon-nav-btn ${activeNav === 'dashboard' ? 'active' : ''}`}
              title="Dashboard"
              onClick={() => {
                setActiveNav('dashboard');
                showToast('Navigating to Executive Dashboard...');
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </button>
            <button
              className={`icon-nav-btn ${activeNav === 'inventory' ? 'active' : ''}`}
              title="Inventory"
              onClick={() => {
                setActiveNav('inventory');
                showToast('Navigating to Inventory Catalog...');
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </button>
            <button
              className={`icon-nav-btn ${activeNav === 'replenishment' ? 'active' : ''}`}
              title="Replenishment Desk"
              onClick={() => {
                setActiveNav('replenishment');
                showToast('Replenishment Desk active.');
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
            </button>
            <button
              className={`icon-nav-btn ${activeNav === 'suppliers' ? 'active' : ''}`}
              title="Suppliers"
              onClick={() => {
                setActiveNav('suppliers');
                showToast('Viewing Supplier Directory...');
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </button>
            <button
              className={`icon-nav-btn ${activeNav === 'analytics' ? 'active' : ''}`}
              title="Analytics"
              onClick={() => {
                setActiveNav('analytics');
                showToast('Viewing Stock Analytics...');
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </button>
            <button
              className={`icon-nav-btn ${activeNav === 'settings' ? 'active' : ''}`}
              title="Settings"
              onClick={() => {
                setActiveNav('settings');
                showToast('Opening Store Settings...');
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
          <div className="icon-nav-bottom">
            <div className="nav-av-sm">SM</div>
          </div>
        </nav>

        {/* Col 2: Supplier Queue Manifests */}
        <aside className="sq" aria-label="Supplier Queue Manifests">
          <div className="sq-head">
            <div className="sq-head-l">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <h2 className="sq-title">
                Supplier Queue Manifests <span className="sq-badge-count">(4)</span>
              </h2>
            </div>
            <button
              className="sq-collapse"
              title={queueCollapsed ? 'Expand queue' : 'Collapse queue'}
              onClick={() => setQueueCollapsed((prev) => !prev)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: queueCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
              >
                <path d="m18 15-6-6-6 6"/>
              </svg>
            </button>
          </div>

          {!queueCollapsed && (
            <div className="sq-cards">
              {INITIAL_SUPPLIERS.map((sup) => {
                const isActive = selectedSupplierId === sup.id && !showAllSuppliers;

                if (sup.id === 'hf') {
                  return (
                    <div
                      key={sup.id}
                      className={`sc ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        withUnsavedGuard(() => {
                          setSelectedSupplierId(sup.id);
                          setShowAllSuppliers(false);
                          showToast(`Switched matrix to ${sup.name}`);
                        });
                      }}
                      tabIndex={0}
                      role="button"
                      aria-pressed={isActive}
                    >
                      <div className="sc-top">
                        <div className="sc-av" style={{ background: sup.color }}>
                          {sup.initials}
                        </div>
                        <div className="sc-info">
                          <span className="sc-name">{sup.name}</span>
                          <span className="sc-cat">{sup.category}</span>
                        </div>
                        {sup.badge && (
                          <span className="sc-badge preferred">{sup.badge}</span>
                        )}
                        <div className="sc-chev">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </div>
                      </div>

                      <div className="sc-bar">
                        <div className="sc-bar-fill green" style={{ width: '100%' }}></div>
                      </div>

                      <div className="sc-amount ok">
                        ₹14,250 <span className="sc-min">/ ₹10,000 (MOQ Met)</span>
                      </div>

                      <div className="sc-meta">
                        <span className="sc-meta-item">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                          </svg>
                          3 items Pending
                        </span>
                        <span className="sc-meta-item">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          Lead Time: 2d
                        </span>
                      </div>
                    </div>
                  );
                }

                if (sup.id === 'bi') {
                  return (
                    <div
                      key={sup.id}
                      className={`sc ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        withUnsavedGuard(() => {
                          setSelectedSupplierId(sup.id);
                          setShowAllSuppliers(false);
                          showToast(`Switched matrix to ${sup.name}`);
                        });
                      }}
                      tabIndex={0}
                      role="button"
                      aria-pressed={isActive}
                    >
                      <div className="sc-top">
                        <div className="sc-av" style={{ background: '#dc2626' }}>
                          BI
                        </div>
                        <div className="sc-info">
                          <span className="sc-name">{sup.name}</span>
                          <span className="sc-cat">{sup.category}</span>
                        </div>
                        <div className="sc-chev">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </div>
                      </div>

                      <div className="sc-bar">
                        <div className="sc-bar-fill orange" style={{ width: '52.5%' }}></div>
                      </div>

                      <div className="sc-amount warn">
                        ₹4,200 <span className="sc-min">/ ₹8,000 (Below MOQ)</span>
                      </div>

                      <div className="sc-meta">
                        <span className="sc-meta-item" style={{ color: '#d97706' }}>
                          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#d97706' }}></span>
                          5 Items Pending
                        </span>
                        <span className="sc-meta-item">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          </svg>
                          Lead Time: 4d
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={sup.id}
                    className={`sc ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      withUnsavedGuard(() => {
                        setSelectedSupplierId(sup.id);
                        setShowAllSuppliers(false);
                        showToast(`Switched matrix to ${sup.name}`);
                      });
                    }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isActive}
                  >
                    <div className="sc-top">
                      <div className="sc-av" style={{ background: '#16a34a' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                        </svg>
                      </div>
                      <div className="sc-info">
                        <span className="sc-name">{sup.name}</span>
                        <span className="sc-cat">{sup.category}</span>
                      </div>
                      <span className="sc-badge healthy">Healthy</span>
                      <div className="sc-chev">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>

                    <div className="sc-bar">
                      <div className="sc-bar-fill green" style={{ width: '100%' }}></div>
                    </div>

                    <div className="sc-healthy-msg">
                      All <strong>Healthy</strong> (0 reorders)
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="sq-qa">
            <div className="sq-qa-title">Quick Actions</div>
            <button className="sq-qa-btn" onClick={() => withUnsavedGuard(() => setCreatePoModalOpen(true))}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <span>Create PO</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            <button className="sq-qa-btn" onClick={() => withUnsavedGuard(() => setManifestsModalOpen(true))}>
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
          </div>
        </aside>

        {/* Col 3: Replenishment Matrix (Dense Data Table) */}
        <main className="matrix" aria-label="Replenishment Matrix">
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
          </div>

          {/* Filter Bar with Supplier & Status Filters */}
          <div className="filter-bar">
            <div className="filter-left">
              <span className="filter-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
              </span>
              <div className="filter-chip">
                <span>{showAllSuppliers ? 'All Suppliers' : `Supplier: ${currentSupplier.name}`}</span>
                <button
                  className="chip-rm"
                  onClick={() => {
                    withUnsavedGuard(() => {
                      setShowAllSuppliers((prev) => !prev);
                      showToast(showAllSuppliers ? `Filtered to ${currentSupplier.name}` : 'Showing items across all suppliers.');
                    });
                  }}
                  title={showAllSuppliers ? 'Filter to single supplier' : 'View all suppliers'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Status Filter Pills */}
              <div className="status-pills" role="radiogroup" aria-label="Status filter">
                {['all', 'critical', 'low', 'healthy'].map((st) => (
                  <button
                    key={st}
                    className={`status-pill-btn ${statusFilter === st ? 'active' : ''}`}
                    onClick={() => {
                      withUnsavedGuard(() => {
                        setStatusFilter(st);
                        showToast(`Filtered status: ${st.toUpperCase()}`);
                      });
                    }}
                    role="radio"
                    aria-checked={statusFilter === st}
                  >
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-right">
              <label htmlFor="sort-select" className="sr-only">Sort matrix</label>
              <span style={{ fontSize: 12, color: 'var(--text3)', marginRight: 6 }}>Sort:</span>
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
                title="Selection options (Space to toggle, Enter to edit)"
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
                />
                <span>{selectedItems.length} Items Selected</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {batchMenuOpen && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => handleSelectPreset('all')}>
                    Select All ({supplierProducts.length})
                  </button>
                  <button className="dropdown-item" onClick={() => handleSelectPreset('critical')}>
                    Select Critical Only ({supplierProducts.filter((p) => p.priority === 'critical').length})
                  </button>
                  <button className="dropdown-item" onClick={() => handleSelectPreset('low')}>
                    Select Low Stock ({supplierProducts.filter((p) => p.priority === 'low').length})
                  </button>
                  <button className="dropdown-item" onClick={() => handleSelectPreset('below_safety')}>
                    Select Below Safety Target
                  </button>
                  <button className="dropdown-item" onClick={() => handleSelectPreset('invert')}>
                    Invert Selection
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item danger" onClick={() => handleSelectPreset('none')}>
                    Deselect All
                  </button>
                </div>
              )}
            </div>

            <button
              className="btn-primary"
              onClick={handleApproveBatch}
              disabled={selectedItems.length === 0}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m22 2-7 20-4-9-9-4Z"/>
                <path d="M22 2 11 13"/>
              </svg>
              <span>Approve Batch</span>
            </button>

            <button
              className="btn-secondary"
              onClick={handleApplySupplierMinimums}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Apply Supplier Minimums</span>
            </button>

            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>
              Keyboard: <kbd style={{ padding: '1px 4px', border: '1px solid var(--border)', borderRadius: 3 }}>↑↓</kbd> Rows • <kbd style={{ padding: '1px 4px', border: '1px solid var(--border)', borderRadius: 3 }}>Space</kbd> Select • <kbd style={{ padding: '1px 4px', border: '1px solid var(--border)', borderRadius: 3 }}>Enter</kbd> Edit
            </span>
          </div>

          {/* Conditional Views: Loading, Empty, Error, or Dense Data Table */}
          {appState === 'loading' && (
            <div className="tbl-wrap">
              <div className="skel-rows">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="skel-row">
                    <div className="skel-cell skel-sm"></div>
                    <div className="skel-cell skel-md"></div>
                    <div className="skel-cell skel-lg"></div>
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
              <h3 className="state-title">No Replenishment Required</h3>
              <p className="state-body">
                All inventory across {currentSupplier.name} categories is at or above safety targets.
              </p>
              <button
                className="retry-btn"
                onClick={() => setAppState('default')}
              >
                Reset to Default View
              </button>
            </div>
          )}

          {appState === 'error' && (
            <div className="state-box">
              <div className="state-icon" style={{ color: 'var(--c-critical)' }}>⚠️</div>
              <h3 className="state-title">Unable to Load Replenishment Data</h3>
              <p className="state-body">
                Connection to JSON data store timed out. Check network or server configuration.
              </p>
              <button
                className="retry-btn"
                onClick={() => {
                  setAppState('loading');
                  setTimeout(() => setAppState('default'), 600);
                }}
              >
                Retry Connection
              </button>
            </div>
          )}

          {appState === 'default' && (
            <div
              className="tbl-wrap"
              ref={tableRef}
              tabIndex={0}
              onKeyDown={handleTableKeyDown}
              role="region"
              aria-label="Product Replenishment Grid with Keyboard Navigation"
            >
              <table className="tbl" role="grid" aria-label="Replenishment products table">
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
                        aria-label="Select all products"
                      />
                    </th>
                    <th className="col-sku" role="columnheader">SKU</th>
                    <th className="col-name" role="columnheader">Item Name</th>
                    <th className="col-stk num" role="columnheader">Current<br />Stock</th>
                    <th className="col-tgt num" role="columnheader">Safety<br />Target</th>
                    <th className="col-st" role="columnheader">Status</th>
                    <th className="col-qty" role="columnheader">Order Qty</th>
                    <th className="col-sub num" role="columnheader">Subtotal (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* CRITICAL GROUP */}
                  {criticalItems.length > 0 && (
                    <>
                      <tr className="pg-row" role="row">
                        <td colSpan={8} role="gridcell">
                          <div
                            className="pg-hdr"
                            style={{ background: 'var(--c-critical-bg)' }}
                            onClick={() => toggleGroupCollapse('critical')}
                          >
                            <span className="pg-dot dot-c">●</span>
                            <span className="lbl-c">CRITICAL</span>
                            <span className="pg-cnt">({criticalItems.length})</span>
                            <span className={`pg-chev ${collapsedGroups.critical ? 'collapsed' : ''}`}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            </span>
                          </div>
                        </td>
                      </tr>
                      {!collapsedGroups.critical && criticalItems.map((prod) => {
                        const lineSubtotal = prod.orderQty * prod.unitCost;
                        const isEditingThis = editingSku === prod.sku;
                        const isKbFocused = focusedRowIndex !== null && sortedProducts[focusedRowIndex]?.id === prod.id;

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
                            <td className="col-stk" role="gridcell">{prod.currentStock}</td>
                            <td className="col-tgt" role="gridcell">{prod.safetyTarget}</td>
                            <td className="col-st" role="gridcell">
                              <span className="st-badge critical">
                                <span className="st-dot"></span>
                                Critical
                              </span>
                            </td>
                            <td className="col-qty" role="gridcell">
                              {isEditingThis ? (
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
                                        if (isUnsaved) {
                                          withUnsavedGuard(() => handleCancelInlineQty());
                                        } else {
                                          handleCancelInlineQty();
                                        }
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
                                      onClick={() => {
                                        if (isUnsaved) {
                                          withUnsavedGuard(() => handleCancelInlineQty());
                                        } else {
                                          handleCancelInlineQty();
                                        }
                                      }}
                                    >
                                      Esc Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  className={`qty-disp ${prod.orderQty === 0 ? 'qty-zero' : ''}`}
                                  onClick={() => withUnsavedGuard(() => handleStartEdit(prod))}
                                  title="Click to edit quantity (or press Enter)"
                                >
                                  {prod.orderQty}
                                </button>
                              )}
                            </td>
                            <td className="col-sub" role="gridcell">
                              {formatCurrency(lineSubtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}

                  {/* LOW GROUP */}
                  {lowItems.length > 0 && (
                    <>
                      <tr className="pg-row" role="row">
                        <td colSpan={8} role="gridcell">
                          <div
                            className="pg-hdr"
                            style={{ background: 'var(--c-low-bg)' }}
                            onClick={() => toggleGroupCollapse('low')}
                          >
                            <span className="pg-dot dot-l">●</span>
                            <span className="lbl-l">LOW</span>
                            <span className="pg-cnt">({lowItems.length})</span>
                            <span className={`pg-chev ${collapsedGroups.low ? 'collapsed' : ''}`}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            </span>
                          </div>
                        </td>
                      </tr>
                      {!collapsedGroups.low && lowItems.map((prod) => {
                        const lineSubtotal = prod.orderQty * prod.unitCost;
                        const isEditingThis = editingSku === prod.sku;
                        const isKbFocused = focusedRowIndex !== null && sortedProducts[focusedRowIndex]?.id === prod.id;

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
                            <td className="col-stk" role="gridcell">{prod.currentStock}</td>
                            <td className="col-tgt" role="gridcell">{prod.safetyTarget}</td>
                            <td className="col-st" role="gridcell">
                              <span className="st-badge low">
                                <span className="st-dot"></span>
                                Low
                              </span>
                            </td>
                            <td className="col-qty" role="gridcell">
                              {isEditingThis ? (
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
                                        if (isUnsaved) {
                                          withUnsavedGuard(() => handleCancelInlineQty());
                                        } else {
                                          handleCancelInlineQty();
                                        }
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
                                      onClick={() => {
                                        if (isUnsaved) {
                                          withUnsavedGuard(() => handleCancelInlineQty());
                                        } else {
                                          handleCancelInlineQty();
                                        }
                                      }}
                                    >
                                      Esc Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  className={`qty-disp ${prod.orderQty === 0 ? 'qty-zero' : ''}`}
                                  onClick={() => withUnsavedGuard(() => handleStartEdit(prod))}
                                  title="Click to edit quantity (or press Enter)"
                                >
                                  {prod.orderQty}
                                </button>
                              )}
                            </td>
                            <td className="col-sub" role="gridcell">
                              {formatCurrency(lineSubtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}

                  {/* HEALTHY GROUP */}
                  {healthyItems.length > 0 && (
                    <>
                      <tr className="pg-row" role="row">
                        <td colSpan={8} role="gridcell">
                          <div
                            className="pg-hdr"
                            style={{ background: 'var(--c-healthy-bg)' }}
                            onClick={() => toggleGroupCollapse('healthy')}
                          >
                            <span className="pg-dot dot-h">●</span>
                            <span className="lbl-h">HEALTHY</span>
                            <span className="pg-cnt">({healthyItems.length})</span>
                            <span className={`pg-chev ${collapsedGroups.healthy ? 'collapsed' : ''}`}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            </span>
                          </div>
                        </td>
                      </tr>
                      {!collapsedGroups.healthy && healthyItems.map((prod) => {
                        const lineSubtotal = prod.orderQty * prod.unitCost;
                        const isEditingThis = editingSku === prod.sku;
                        const isKbFocused = focusedRowIndex !== null && sortedProducts[focusedRowIndex]?.id === prod.id;

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
                            <td className="col-stk" role="gridcell">{prod.currentStock}</td>
                            <td className="col-tgt" role="gridcell">{prod.safetyTarget}</td>
                            <td className="col-st" role="gridcell">
                              <span className="st-badge healthy">
                                <span className="st-dot"></span>
                                Healthy
                              </span>
                            </td>
                            <td className="col-qty" role="gridcell">
                              {isEditingThis ? (
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
                                        if (isUnsaved) {
                                          withUnsavedGuard(() => handleCancelInlineQty());
                                        } else {
                                          handleCancelInlineQty();
                                        }
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
                                      onClick={() => {
                                        if (isUnsaved) {
                                          withUnsavedGuard(() => handleCancelInlineQty());
                                        } else {
                                          handleCancelInlineQty();
                                        }
                                      }}
                                    >
                                      Esc Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  className={`qty-disp ${prod.orderQty === 0 ? 'qty-zero' : ''}`}
                                  onClick={() => withUnsavedGuard(() => handleStartEdit(prod))}
                                  title="Click to edit quantity (or press Enter)"
                                >
                                  {prod.orderQty}
                                </button>
                              )}
                            </td>
                            <td className="col-sub" role="gridcell">
                              {formatCurrency(lineSubtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="pager">
            <span className="pager-info">
              Showing 1–{filteredProducts.length} of {filteredProducts.length} items
            </span>
            <div className="pager-ctrl">
              <button
                className="pager-btn"
                disabled
                title="Previous page"
                onClick={() => showToast('Already on first page.')}
              >
                ‹
              </button>
              <button className="pager-btn cur">1</button>
              <button
                className="pager-btn"
                disabled
                title="Next page"
                onClick={() => showToast('All items are displayed on page 1.')}
              >
                ›
              </button>
            </div>
          </div>
        </main>

        {/* Col 4: Supplier Review Summary & Purchase Order Draft Panel */}
        <aside className="po" aria-label="Supplier Review Summary and PO Draft">
          <div className="po-head">
            <div className="po-head-l">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              <h2 className="po-title">PO Draft #PO-2026-104</h2>
            </div>
            <div style={{ position: 'relative' }}>
              <button
                className="po-more"
                title="More options"
                onClick={() => setPoMoreMenuOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={poMoreMenuOpen}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
              {poMoreMenuOpen && (
                <div className="dropdown-menu right">
                  <button className="dropdown-item" onClick={handleExportCSV}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Export as CSV
                  </button>
                  <button className="dropdown-item" onClick={handlePrintManifest}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    Print PO Manifest
                  </button>
                  <button className="dropdown-item" onClick={handleCopySummary}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy Summary
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section: Supplier Information */}
          <div className="po-sec">
            <div className="po-sec-title">Supplier Information</div>
            <div className="po-sup-row">
              <div className="po-sup-av" style={{ background: currentSupplier.color }}>
                {currentSupplier.initials}
              </div>
              <div>
                <div className="po-sup-name">{currentSupplier.name}</div>
                <div className="po-sup-cat">{currentSupplier.category}</div>
              </div>
            </div>
          </div>

          {/* Section: Minimum Threshold Checklist */}
          <div className="po-sec">
            <div className="po-sec-title">Minimum Threshold Checklist</div>
            <div className="po-checklist">
              <div className="po-check">
                <span className={`po-check-ic ${totalSelectedAmount >= currentSupplier.targetMoq ? 'pass' : 'fail'}`}>
                  {totalSelectedAmount >= currentSupplier.targetMoq ? '✔' : '✖'}
                </span>
                <span>
                  Order value {formatCurrency(totalSelectedAmount)} {totalSelectedAmount >= currentSupplier.targetMoq ? 'exceeds' : 'below'} {formatCurrency(currentSupplier.targetMoq)} minimum
                </span>
              </div>
              <div className="po-check">
                <span className={`po-check-ic ${totalSelectedUnits >= currentSupplier.unitThreshold ? 'pass' : 'fail'}`}>
                  {totalSelectedUnits >= currentSupplier.unitThreshold ? '✔' : '✖'}
                </span>
                <span>
                  Order units ({totalSelectedUnits} units) {totalSelectedUnits >= currentSupplier.unitThreshold ? 'exceeds' : 'below'} {currentSupplier.unitThreshold} unit freight threshold
                </span>
              </div>
            </div>
          </div>

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
          <div className="po-sec" style={{ flex: 1 }}>
            <div className="po-sec-title">Order Breakdown</div>
            {selectedItems.length === 0 ? (
              <div className="po-empty">
                <div className="po-empty-icon">📋</div>
                <div className="po-empty-txt">No items selected for this order draft.</div>
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

          {/* Section: Actions */}
          <div className="po-actions">
            <button className="po-discard" onClick={handleDiscardChanges}>
              Discard Changes
            </button>
            <button className="po-save" onClick={handleSaveDraft}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>Save Draft</span>
            </button>
            <button
              className="po-approve"
              onClick={handleSubmitPO}
              disabled={selectedItems.length === 0}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m22 2-7 20-4-9-9-4Z"/>
                <path d="M22 2 11 13"/>
              </svg>
              <span>Approve &amp; Send PO →</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ─── Modal: Unsaved Changes Confirmation ───────────────────────────── */}
      {unsavedDialog.open && (
        <div className="modal-backdrop" onClick={handleResolveKeepEditing}>
          <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title" style={{ color: 'var(--c-low)' }}>
                ⚠️ Unsaved Quantity Changes
              </h3>
              <button className="modal-close" onClick={handleResolveKeepEditing}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                You have unsaved changes to Order Quantity for <strong>{unsavedDialog.name}</strong> ({unsavedDialog.sku}).
              </p>
              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'var(--text2)' }}>Original Qty: <strong>{unsavedDialog.originalQty}</strong></span>
                <span style={{ color: 'var(--brand)', fontWeight: 600 }}>→</span>
                <span style={{ color: 'var(--brand)', fontWeight: 700 }}>New Draft Qty: <strong>{unsavedDialog.draftQty}</strong></span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                Do you want to save these changes before proceeding, discard them, or keep editing?
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={handleResolveKeepEditing}>
                Keep Editing
              </button>
              <button
                className="btn-secondary"
                style={{ color: 'var(--c-critical)', borderColor: 'var(--c-critical-bd)' }}
                onClick={handleResolveDiscardAndProceed}
              >
                Discard Changes
              </button>
              <button className="btn-primary" onClick={handleResolveSaveAndProceed}>
                Save &amp; Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Create Manual PO ───────────────────────────────────────── */}
      {createPoModalOpen && (
        <div className="modal-backdrop" onClick={() => setCreatePoModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                Create Manual Purchase Order
              </h3>
              <button className="modal-close" onClick={() => setCreatePoModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePoSubmit}>
              <div className="modal-body">
                <div className="modal-field">
                  <label className="modal-label">Select Vendor / Supplier</label>
                  <select
                    className="modal-select"
                    value={newPoSupplier}
                    onChange={(e) => setNewPoSupplier(e.target.value)}
                  >
                    {INITIAL_SUPPLIERS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category}) — MOQ {formatCurrency(s.targetMoq)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Receiving Dock &amp; Storage</label>
                  <select
                    className="modal-select"
                    value={newPoDock}
                    onChange={(e) => setNewPoDock(e.target.value)}
                  >
                    <option value="Dock B - Cold Storage">Dock B - Cold Storage (Refrigerated)</option>
                    <option value="Dock A - Dry Goods">Dock A - Dry Goods &amp; Bakery</option>
                    <option value="Dock C - Fresh Produce">Dock C - Fresh Produce Inspection</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Purchase Order Notes &amp; Special Instructions</label>
                  <textarea
                    className="modal-textarea"
                    rows="3"
                    placeholder="e.g. Schedule delivery before 10 AM, priority dock assignment..."
                    value={newPoNotes}
                    onChange={(e) => setNewPoNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-foot">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCreatePoModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create PO Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: View Pending Manifests ─────────────────────────────────── */}
      {manifestsModalOpen && (
        <div className="modal-backdrop" onClick={() => setManifestsModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                </svg>
                Pending Receiving Manifests
              </h3>
              <button className="modal-close" onClick={() => setManifestsModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: 380, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {INITIAL_MANIFESTS.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
                        {m.id} — {m.supplier}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                        Truck: {m.truck} • {m.items} units • ETA: {m.eta}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 12,
                        background: m.status === 'In Transit' ? '#eff6ff' : m.status === 'Dock Scheduled' ? '#fffbeb' : '#f0fdf4',
                        color: m.status === 'In Transit' ? '#1d4ed8' : m.status === 'Dock Scheduled' ? '#b45309' : '#15803d',
                      }}
                    >
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-foot">
              <button
                className="btn-secondary"
                onClick={() => setManifestsModalOpen(false)}
              >
                Close
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
                Purchase Order <strong>#PO-2026-104</strong> for <strong>{currentSupplier.name}</strong> has been submitted to EDI Gateway.
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
                  <span style={{ fontWeight: 600 }}>{totalSelectedUnits} units</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text2)' }}>Expected Delivery:</span>
                  <span style={{ fontWeight: 600 }}>Within {currentSupplier.leadTime}</span>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button
                className="btn-primary"
                onClick={() => {
                  setPoSuccessModalOpen(false);
                  showToast('PO-2026-104 confirmed. Inventory awaiting vendor delivery.');
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
}
