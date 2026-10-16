import React, { useState, useMemo, useEffect } from 'react';
import '../../styles/replenishment.css';

// ── Mock Initial Data ──────────────────────────────────────────────────────────
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
    status: 'critical',
    priority: 'critical',
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
    status: 'critical',
    priority: 'critical',
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
    orderQty: 46,
    unitCost: 30,
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
    status: 'critical',
    priority: 'critical',
    orderQty: 40,
    unitCost: 35,
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
    status: 'critical',
    priority: 'critical',
    orderQty: 28,
    unitCost: 50,
    selected: true,
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

// Helper formatter
const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

export default function ReplenishmentPage() {
  // Theme state: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState('light');
  // View State simulator: 'default' | 'loading' | 'empty' | 'error'
  const [appState, setAppState] = useState('default');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);

  // Active supplier
  const [selectedSupplierId, setSelectedSupplierId] = useState('hf');
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority');

  // Products Data State
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  // Edit quantity state for inline editing (e.g. Fresh Milk 1L)
  const [editingSku, setEditingSku] = useState('HF-001');
  const [editQtyValue, setEditQtyValue] = useState('50');
  const [isUnsaved, setIsUnsaved] = useState(true);

  // Toast feedback
  const [toast, setToast] = useState(null);

  // Synchronize theme with data-theme attribute on documentElement
  useEffect(() => {
    const root = document.documentElement;
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

  const currentSupplier = useMemo(() => {
    return INITIAL_SUPPLIERS.find((s) => s.id === selectedSupplierId) || INITIAL_SUPPLIERS[0];
  }, [selectedSupplierId]);

  // Filter products by selected supplier and search
  const supplierProducts = useMemo(() => {
    return products.filter((p) => p.supplierId === selectedSupplierId);
  }, [products, selectedSupplierId]);

  const filteredProducts = useMemo(() => {
    return supplierProducts.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [supplierProducts, searchTerm]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'priority') {
      const order = { critical: 1, low: 2, healthy: 3 };
      return list.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (sortBy === 'stock_low') {
      return list.sort((a, b) => a.currentStock - b.currentStock);
    } else if (sortBy === 'safety_target') {
      return list.sort((a, b) => b.safetyTarget - a.safetyTarget);
    } else if (sortBy === 'subtotal') {
      return list.sort((a, b) => b.orderQty * b.unitCost - a.orderQty * a.unitCost);
    }
    return list;
  }, [filteredProducts, sortBy]);

  // Group products by priority
  const criticalItems = sortedProducts.filter((p) => p.priority === 'critical');
  const lowItems = sortedProducts.filter((p) => p.priority === 'low');
  const healthyItems = sortedProducts.filter((p) => p.priority === 'healthy');

  // Selected items calculations
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

  // Handler: Select all toggle
  const handleToggleSelectAll = () => {
    const nextVal = !allSelected;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.supplierId === selectedSupplierId) {
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

  // Handler: Individual select toggle
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

  // Handler: Save inline quantity edit
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
    showToast(`Updated quantity for ${sku} to ${validQty} units.`);
  };

  const handleCancelInlineQty = () => {
    const original = products.find((p) => p.sku === editingSku);
    if (original) {
      setEditQtyValue(String(original.orderQty));
    }
    setIsUnsaved(false);
  };

  // Handler: Apply Supplier Minimums
  const handleApplySupplierMinimums = () => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.supplierId === selectedSupplierId) {
          const deficit = Math.max(0, p.safetyTarget - p.currentStock);
          return {
            ...p,
            selected: deficit > 0,
            orderQty: deficit,
          };
        }
        return p;
      })
    );
    showToast(`Applied safety thresholds for ${currentSupplier.name}`);
  };

  // Handler: Approve Batch
  const handleApproveBatch = () => {
    if (selectedItems.length === 0) {
      showToast('No items currently selected to approve.', 'warn');
      return;
    }
    showToast(`Batch approved! ${selectedItems.length} SKUs ready in PO Draft.`);
  };

  // Handler: Submit PO
  const handleSubmitPO = () => {
    if (selectedItems.length === 0) {
      showToast('Cannot submit empty PO. Select products first.', 'warn');
      return;
    }
    showToast(`PO #PO-2026-104 for ${currentSupplier.name} (${formatCurrency(totalSelectedAmount)}) submitted successfully!`);
  };

  // Handler: Save Draft
  const handleSaveDraft = () => {
    showToast(`Draft #PO-2026-104 saved.`);
  };

  // Handler: Discard Changes
  const handleDiscardChanges = () => {
    setProducts(INITIAL_PRODUCTS);
    setEditQtyValue('50');
    setIsUnsaved(true);
    setEditingSku('HF-001');
    showToast('Changes discarded. Restored original values.', 'info');
  };

  return (
    <div className="rp" data-theme={theme}>
      {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-logo" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search SKU, item name, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search items or supplier"
            />
            <kbd className="search-kbd">Ctrl+K</kbd>
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
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 50,
                  minWidth: 140,
                  overflow: 'hidden',
                }}
              >
                {['default', 'loading', 'empty', 'error'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setAppState(st);
                      setStateDropdownOpen(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: 12,
                      background: appState === st ? 'var(--brand-bg)' : 'transparent',
                      color: appState === st ? 'var(--brand)' : 'var(--text)',
                      fontWeight: appState === st ? 600 : 400,
                    }}
                  >
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User profile */}
          <button className="user-btn" aria-label="User profile">
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
            <button className="icon-nav-btn" title="Dashboard">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </button>
            <button className="icon-nav-btn" title="Inventory">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </button>
            <button className="icon-nav-btn active" title="Replenishment Desk">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
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
            <button className="icon-nav-btn" title="Settings">
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
            <button className="sq-collapse" title="Collapse queue">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m18 15-6-6-6 6"/>
              </svg>
            </button>
          </div>

          <div className="sq-cards">
            {INITIAL_SUPPLIERS.map((sup) => {
              const isActive = selectedSupplierId === sup.id;
              // Specific data matching the screenshot
              if (sup.id === 'hf') {
                return (
                  <div
                    key={sup.id}
                    className={`sc ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedSupplierId(sup.id)}
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
                    onClick={() => setSelectedSupplierId(sup.id)}
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

              // Nature's Farm
              return (
                <div
                  key={sup.id}
                  className={`sc ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedSupplierId(sup.id)}
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

          {/* Quick Actions */}
          <div className="sq-qa">
            <div className="sq-qa-title">Quick Actions</div>
            <button className="sq-qa-btn" onClick={() => showToast('Create Manual PO dialog opened.')}>
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
            <button className="sq-qa-btn" onClick={() => showToast('Navigating to pending manifests...')}>
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

        {/* Col 3: Replenishment Matrix (Center Table) */}
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

          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="filter-left">
              <span className="filter-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
              </span>
              <div className="filter-chip">
                <span>Supplier: {currentSupplier.name}</span>
                <button
                  className="chip-rm"
                  onClick={() => setSearchTerm('')}
                  title="Clear filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="filter-right">
              <label htmlFor="sort-select" className="sr-only">Sort matrix</label>
              <span style={{ fontSize: 12, color: 'var(--text3)', marginRight: 6 }}>Sort:</span>
              <select
                id="sort-select"
                className="sort-sel"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="priority">Priority (Critical First)</option>
                <option value="stock_low">Current Stock (Low to High)</option>
                <option value="safety_target">Safety Target</option>
                <option value="subtotal">Subtotal</option>
              </select>
            </div>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <button
              className="toolbar-sel"
              onClick={handleToggleSelectAll}
              title="Toggle all rows"
            >
              <input
                type="checkbox"
                className="cb"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={handleToggleSelectAll}
              />
              <span>{selectedItems.length} Items Selected</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

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
          </div>

          {/* Conditional Views: Loading, Empty, Error, or Table */}
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
            <div className="tbl-wrap">
              <table className="tbl" aria-label="Replenishment products table">
                <thead>
                  <tr>
                    <th className="col-chk">
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
                    <th className="col-sku">SKU</th>
                    <th className="col-name">Item Name</th>
                    <th className="col-stk num">Current<br />Stock</th>
                    <th className="col-tgt num">Safety<br />Target</th>
                    <th className="col-st">Status</th>
                    <th className="col-qty">Order Qty</th>
                    <th className="col-sub num">Subtotal (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* CRITICAL GROUP */}
                  {criticalItems.length > 0 && (
                    <>
                      <tr className="pg-row">
                        <td colSpan={8}>
                          <div className="pg-hdr" style={{ background: 'var(--c-critical-bg)' }}>
                            <span className="pg-dot dot-c">●</span>
                            <span className="lbl-c">CRITICAL</span>
                            <span className="pg-cnt">({criticalItems.length})</span>
                          </div>
                        </td>
                      </tr>
                      {criticalItems.map((prod) => {
                        const lineSubtotal = prod.orderQty * prod.unitCost;
                        const isEditingThis = editingSku === prod.sku;

                        return (
                          <tr
                            key={prod.id}
                            className={`pr ${prod.selected ? 'sel' : ''}`}
                          >
                            <td className="col-chk">
                              <input
                                type="checkbox"
                                className="cb"
                                checked={prod.selected}
                                onChange={() => handleToggleSelect(prod.id)}
                                aria-label={`Select ${prod.name}`}
                              />
                            </td>
                            <td className="col-sku">
                              <span className="sku-lbl">{prod.sku}</span>
                            </td>
                            <td className="col-name">
                              <div className="prod-name">{prod.name}</div>
                              <div className="prod-cat">{prod.category}</div>
                            </td>
                            <td className="col-stk">{prod.currentStock}</td>
                            <td className="col-tgt">{prod.safetyTarget}</td>
                            <td className="col-st">
                              <span className="st-badge critical">
                                <span className="st-dot"></span>
                                Critical
                              </span>
                            </td>
                            <td className="col-qty">
                              {/* Row 1 / Fresh Milk has active editing state per screenshot */}
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
                                      if (e.key === 'Escape') handleCancelInlineQty();
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
                            <td className="col-sub">
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
                      <tr className="pg-row">
                        <td colSpan={8}>
                          <div className="pg-hdr" style={{ background: 'var(--c-low-bg)' }}>
                            <span className="pg-dot dot-l">●</span>
                            <span className="lbl-l">LOW</span>
                            <span className="pg-cnt">({lowItems.length})</span>
                          </div>
                        </td>
                      </tr>
                      {lowItems.map((prod) => {
                        const lineSubtotal = prod.orderQty * prod.unitCost;
                        const isEditingThis = editingSku === prod.sku;

                        return (
                          <tr
                            key={prod.id}
                            className={`pr ${prod.selected ? 'sel' : ''}`}
                          >
                            <td className="col-chk">
                              <input
                                type="checkbox"
                                className="cb"
                                checked={prod.selected}
                                onChange={() => handleToggleSelect(prod.id)}
                                aria-label={`Select ${prod.name}`}
                              />
                            </td>
                            <td className="col-sku">
                              <span className="sku-lbl">{prod.sku}</span>
                            </td>
                            <td className="col-name">
                              <div className="prod-name">{prod.name}</div>
                              <div className="prod-cat">{prod.category}</div>
                            </td>
                            <td className="col-stk">{prod.currentStock}</td>
                            <td className="col-tgt">{prod.safetyTarget}</td>
                            <td className="col-st">
                              <span className="st-badge low">
                                <span className="st-dot"></span>
                                Low
                              </span>
                            </td>
                            <td className="col-qty">
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
                                      if (e.key === 'Escape') handleCancelInlineQty();
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
                            <td className="col-sub">
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
                      <tr className="pg-row">
                        <td colSpan={8}>
                          <div className="pg-hdr" style={{ background: 'var(--c-healthy-bg)' }}>
                            <span className="pg-dot dot-h">●</span>
                            <span className="lbl-h">HEALTHY</span>
                            <span className="pg-cnt">({healthyItems.length})</span>
                          </div>
                        </td>
                      </tr>
                      {healthyItems.map((prod) => {
                        const lineSubtotal = prod.orderQty * prod.unitCost;
                        const isEditingThis = editingSku === prod.sku;

                        return (
                          <tr
                            key={prod.id}
                            className={`pr ${prod.selected ? 'sel' : ''}`}
                          >
                            <td className="col-chk">
                              <input
                                type="checkbox"
                                className="cb"
                                checked={prod.selected}
                                onChange={() => handleToggleSelect(prod.id)}
                                aria-label={`Select ${prod.name}`}
                              />
                            </td>
                            <td className="col-sku">
                              <span className="sku-lbl">{prod.sku}</span>
                            </td>
                            <td className="col-name">
                              <div className="prod-name">{prod.name}</div>
                              <div className="prod-cat">{prod.category}</div>
                            </td>
                            <td className="col-stk">{prod.currentStock}</td>
                            <td className="col-tgt">{prod.safetyTarget}</td>
                            <td className="col-st">
                              <span className="st-badge healthy">
                                <span className="st-dot"></span>
                                Healthy
                              </span>
                            </td>
                            <td className="col-qty">
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
                                      if (e.key === 'Escape') handleCancelInlineQty();
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
                            <td className="col-sub">
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
              <button className="pager-btn" disabled title="Previous page">
                ‹
              </button>
              <button className="pager-btn cur">1</button>
              <button className="pager-btn" disabled title="Next page">
                ›
              </button>
            </div>
          </div>
        </main>

        {/* Col 4: Purchase Order Draft Panel */}
        <aside className="po" aria-label="Purchase Order Draft">
          <div className="po-head">
            <div className="po-head-l">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              <h2 className="po-title">PO Draft #PO-2026-104</h2>
            </div>
            <button className="po-more" title="More options">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
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

      {/* ─── Toast Feedback Notification ──────────────────────────────────── */}
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
