import { useState, useEffect, useMemo, useRef, useDeferredValue, Fragment } from 'react';
import PropTypes from 'prop-types';
import '../../styles/replenishment.css';
import { fetchPOHistory, deletePurchaseOrder, fetchSuppliers } from '../../db/queries.js';
import ReplenishmentTopbar from '../replenishment/components/ReplenishmentTopbar.jsx';
import KeyboardShortcutsModal from '../../components/ui/KeyboardShortcutsModal.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import { SUPPLIER_LOGOS } from '../../utils/supplierLogos.js';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import AppNavigationRail from '../../components/layout/AppNavigationRail.jsx';

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function POHistoryPage({
  onNavigateBack,
  onNavigateTo,
  onViewDraft,
  initialSupplierId = null,
  themePreference: propThemePreference,
  onThemeChange: propOnThemeChange,
}) {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'draft' | 'dispatched'
  const [supplierFilter, setSupplierFilter] = useState(() => initialSupplierId || 'all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState(null);
  const [toast, setToast] = useState(null);

  const searchInputRef = useRef(null);

  // Responsive layout state
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    let rId = null;
    const handleResize = () => {
      if (rId) cancelAnimationFrame(rId);
      rId = requestAnimationFrame(() => {
        setWindowWidth(window.innerWidth);
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rId) cancelAnimationFrame(rId);
    };
  }, []);

  const isMobile = windowWidth < 768;

  // Theme management shared with Replenishment desk
  const [localThemePreference, setLocalThemePreference] = useState(() => {
    return localStorage.getItem('stockdesk_theme') || 'system';
  });

  const effectiveTheme = propThemePreference || localThemePreference;

  const handleSelectTheme = (newTheme) => {
    if (propOnThemeChange) {
      propOnThemeChange(newTheme);
    } else {
      setLocalThemePreference(newTheme);
      localStorage.setItem('stockdesk_theme', newTheme);
      const root = document.documentElement;
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const resolved = newTheme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : newTheme;
      root.setAttribute('data-theme', resolved);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch PO history and suppliers from SQLite
  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const [historyData, suppliersData] = await Promise.all([
          fetchPOHistory(supplierFilter !== 'all' ? supplierFilter : null),
          fetchSuppliers(),
        ]);
        if (!isCancelled) {
          setOrders(historyData || []);
          setSuppliers(suppliersData || []);
          setIsLoading(false);
        }
      } catch {
        if (!isCancelled) {
          showToast('Failed to load purchase order history.', 'warn');
          setIsLoading(false);
        }
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [supplierFilter]);

  // Supplier lookup map
  const supplierMap = useMemo(() => {
    const map = {};
    suppliers.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [suppliers]);

  // Counts for tabs
  const counts = useMemo(() => {
    let drafts = 0;
    let dispatched = 0;
    orders.forEach((o) => {
      if (o.status === 'draft') drafts++;
      else dispatched++;
    });
    return { all: orders.length, draft: drafts, dispatched };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Status Filter
      if (statusFilter === 'draft' && o.status !== 'draft') return false;
      if (statusFilter === 'dispatched' && o.status === 'draft') return false;

      // 2. Search Query Filter
      if (deferredSearchTerm.trim()) {
        const q = deferredSearchTerm.toLowerCase();
        const sup = supplierMap[o.supplierId];
        const supName = sup?.name?.toLowerCase() || '';
        const poNum = (o.poNumber || '').toLowerCase();
        const notes = (o.notes || '').toLowerCase();
        const itemsMatch = o.items?.some(
          (it) => it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)
        );
        if (!poNum.includes(q) && !supName.includes(q) && !notes.includes(q) && !itemsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, deferredSearchTerm, supplierMap]);

  // Delete workflow
  const handleDeletePO = async (po) => {
    try {
      await deletePurchaseOrder(po.id);
      setOrders((prev) => prev.filter((o) => o.id !== po.id));
      setDeleteConfirmOrder(null);
      showToast(`${po.poNumber} removed from history.`);
    } catch (err) {
      showToast('Failed to delete purchase order: ' + err.message, 'warn');
    }
  };

  return (
    <div className="redesign-page-container">
      {/* ─── Unified Topbar ─────────────────────────────────────────────────── */}
      <ReplenishmentTopbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchInputRef={searchInputRef}
        windowWidth={windowWidth}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        setShortcutsModalOpen={setShortcutsModalOpen}
        themePreference={effectiveTheme}
        handleSelectTheme={handleSelectTheme}
        onNavigateToReplenishment={onNavigateBack}
        onNavigateToManifests={() => {
          if (onNavigateTo) onNavigateTo('manifests');
        }}
        onNavigateToSuppliers={() => {
          if (onNavigateTo) onNavigateTo('suppliers');
        }}
        onNavigateToHistory={() => {}}
        activePage="history"
        suppliers={suppliers}
      />

      {/* ─── Body: Left Icon Rail + Main Content ────────────────────────────── */}
      <div className="redesign-page-body">
        {/* Left Icon Navigation Rail */}
        <aside className="redesign-sidebar">
          <AppNavigationRail
            activePage="history"
            onNavigateTo={onNavigateTo}
            onNavigateToReplenishment={onNavigateBack}
            onNavigateToDashboard={() => onNavigateTo && onNavigateTo('dashboard')}
            onNavigateToManifests={() => onNavigateTo && onNavigateTo('manifests')}
            onNavigateToSuppliers={() => onNavigateTo && onNavigateTo('suppliers')}
          />
        </aside>

        {/* Main Content Area */}
        <main id="main-content" className="redesign-main-content">
          {/* Subheader */}
          <div className="redesign-subheader">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                type="button"
                onClick={onNavigateBack}
                className="redesign-icon-back-btn"
                title="Back to Replenishment Desk"
                aria-label="Back to Replenishment Desk"
              >
                <ArrowBackIcon style={{ fontSize: 20 }} />
              </button>

              <div className="redesign-title-wrapper" style={{ marginLeft: 0 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h1 className="redesign-title">Purchase Order History</h1>
                    <span className="redesign-count-pill">
                      {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                    </span>
                  </div>
                  <div className="redesign-subtitle">
                    View saved supplier drafts, track dispatched purchase orders, and resume order editing
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="redesign-filter-bar" role="search" aria-label="Filter purchase orders">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 300px' }}>
              <div className="redesign-search-box">
                <span className="redesign-search-icon" aria-hidden="true">
                  <SearchIcon style={{ fontSize: 16 }} />
                </span>
                <input
                  type="text"
                  className="redesign-search-input"
                  placeholder="Search PO #, supplier, SKU, product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Filter purchase orders by number, supplier, or product"
                />
              </div>

              <select
                className="redesign-select"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                aria-label="Filter by supplier"
              >
                <option value="all">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Segmented Status Tabs */}
            <div className="redesign-segmented-tabs" role="tablist" aria-label="PO status filter">
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'all'}
                className={`redesign-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All ({counts.all})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'draft'}
                className={`redesign-tab-btn ${statusFilter === 'draft' ? 'active' : ''}`}
                onClick={() => setStatusFilter('draft')}
              >
                Drafts ({counts.draft})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'dispatched'}
                className={`redesign-tab-btn ${statusFilter === 'dispatched' ? 'active' : ''}`}
                onClick={() => setStatusFilter('dispatched')}
              >
                Dispatched ({counts.dispatched})
              </button>
            </div>
          </div>

          {/* Screen-reader announcement container */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {`Showing ${filteredOrders.length} of ${orders.length} purchase orders`}
          </div>

          {/* Desktop Table View */}
          {!isMobile && (
            <div className="redesign-table-card">
              <div className="redesign-table-wrapper">
                <table className="redesign-table" aria-label="Purchase Order History Table">
                  <thead>
                    <tr>
                      <th scope="col">PO #</th>
                      <th scope="col">Supplier</th>
                      <th scope="col">Date Created</th>
                      <th scope="col">Items &amp; SKUs</th>
                      <th scope="col">Total Value</th>
                      <th scope="col">Status</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
                          Loading purchase order history...
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                            No Purchase Orders Found
                          </div>
                          <div style={{ fontSize: 12, marginTop: 4 }}>
                            {orders.length === 0
                              ? 'Build and save supplier drafts from the Replenishment Desk to track them here.'
                              : 'No purchase orders match your active search or status filters.'}
                          </div>
                          <button
                            type="button"
                            className="btn-replenish"
                            onClick={onNavigateBack}
                            style={{ marginTop: 14 }}
                          >
                            Go to Replenishment Desk →
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((po) => {
                        const isExpanded = expandedOrderId === po.id;
                        const sup = supplierMap[po.supplierId];
                        const logoSrc = SUPPLIER_LOGOS[po.supplierId];
                        const isDraft = po.status === 'draft';
                        const isDelivered = (po.status || '').toLowerCase() === 'delivered';
                        const itemsCount = po.items?.length || 0;
                        const totalUnits = po.items?.reduce((acc, it) => acc + (it.quantity || 0), 0) || 0;

                        return (
                          <Fragment key={po.id}>
                            <tr
                              className={`redesign-tr ${isExpanded ? 'expanded' : ''}`}
                              onClick={() => setExpandedOrderId(isExpanded ? null : po.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                                    {isExpanded ? '▼' : '▶'}
                                  </span>
                                  <span className="redesign-manifest-code" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                    {po.poNumber}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {logoSrc ? (
                                    <img
                                      src={logoSrc}
                                      alt=""
                                      style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 4,
                                        objectFit: 'contain',
                                        background: '#fff',
                                        border: '1px solid var(--border)',
                                        padding: 1,
                                      }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 4,
                                        background: sup?.color || 'var(--brand)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 10,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {sup?.initials || 'PO'}
                                    </div>
                                  )}
                                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                                    {sup?.name || po.supplierId}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                                  {new Date(po.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </td>

                              <td>
                                <div style={{ fontSize: 12 }}>
                                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                                    {itemsCount} {itemsCount === 1 ? 'SKU' : 'SKUs'}
                                  </span>
                                  <span style={{ color: 'var(--text3)', marginLeft: 6 }}>
                                    ({totalUnits} {totalUnits === 1 ? 'unit' : 'units'})
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span style={{ fontWeight: 700, color: 'var(--brand)', fontSize: 13 }}>
                                  {formatCurrency(po.totalAmount)}
                                </span>
                              </td>

                              <td>
                                {isDraft ? (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: '3px 8px',
                                      borderRadius: 12,
                                      background: 'rgba(217, 119, 6, 0.14)',
                                      color: '#d97706',
                                      border: '1px solid rgba(217, 119, 6, 0.3)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    📝 Draft
                                  </span>
                                ) : isDelivered ? (
                                  <span
                                    className="pill-status-manifest pill-status-delivered"
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: '3px 8px',
                                      borderRadius: 12,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    ✓ Delivered
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: '3px 8px',
                                      borderRadius: 12,
                                      background: 'rgba(16, 185, 129, 0.14)',
                                      color: '#059669',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    ✓ Dispatched
                                  </span>
                                )}
                              </td>

                              <td style={{ textAlign: 'right' }}>
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    justifyContent: 'flex-end',
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {isDraft ? (
                                    <button
                                      type="button"
                                      className="redesign-action-btn primary"
                                      onClick={() => onViewDraft && onViewDraft(po)}
                                      title={`Open draft ${po.poNumber} in draft queue`}
                                    >
                                      View Draft
                                    </button>
                                  ) : (
                                    <span style={{ color: 'var(--text3)', fontSize: 12, paddingRight: 4 }}>
                                      —
                                    </span>
                                  )}
                                  {!isDelivered && (
                                    <button
                                      type="button"
                                      className="redesign-action-btn secondary"
                                      onClick={() => setDeleteConfirmOrder(po)}
                                      title={`Delete ${po.poNumber}`}
                                      style={{ padding: '6px 8px', color: '#ef4444' }}
                                      aria-label={`Delete ${po.poNumber}`}
                                    >
                                      <DeleteIcon style={{ fontSize: 16 }} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Item Detail Row */}
                            {isExpanded && (
                              <tr className="redesign-expanded-row">
                                <td colSpan={7} style={{ padding: '16px 20px', background: 'var(--surface-hover, rgba(0,0,0,0.02))' }}>
                                  <div style={{ maxWidth: 800 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                      <strong style={{ fontSize: 13, color: 'var(--text)' }}>
                                        Order Breakdown — {po.poNumber}
                                      </strong>
                                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                                        {po.notes || 'Standard Purchase Order'}
                                      </span>
                                    </div>
                                    <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                          <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
                                            <th style={{ padding: '6px 10px' }}>SKU</th>
                                            <th style={{ padding: '6px 10px' }}>Item Name</th>
                                            <th style={{ padding: '6px 10px', textAlign: 'center' }}>Quantity</th>
                                            <th style={{ padding: '6px 10px', textAlign: 'right' }}>Unit Price</th>
                                            <th style={{ padding: '6px 10px', textAlign: 'right' }}>Total</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(po.items || []).map((it) => (
                                            <tr key={it.id || it.sku} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                              <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{it.sku}</td>
                                              <td style={{ padding: '6px 10px', fontWeight: 600 }}>{it.name}</td>
                                              <td style={{ padding: '6px 10px', textAlign: 'center' }}>{it.quantity}</td>
                                              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(it.unitPrice)}</td>
                                              <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: 'var(--brand)' }}>
                                                {formatCurrency(it.subtotal || it.quantity * it.unitPrice)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mobile Card List View */}
          {isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>
                  Loading purchase order history...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>
                  No purchase orders found matching your filters.
                </div>
              ) : (
                filteredOrders.map((po) => {
                  const sup = supplierMap[po.supplierId];
                  const logoSrc = SUPPLIER_LOGOS[po.supplierId];
                  const isDraft = po.status === 'draft';
                  const isDelivered = (po.status || '').toLowerCase() === 'delivered';
                  return (
                    <div
                      key={po.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {logoSrc ? (
                            <img src={logoSrc} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                          ) : null}
                          <strong style={{ fontSize: 13, color: 'var(--text)' }}>{po.poNumber}</strong>
                        </div>
                        {isDraft ? (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: 'rgba(217, 119, 6, 0.14)', color: '#d97706' }}>
                            Draft
                          </span>
                        ) : isDelivered ? (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.14)', color: '#059669' }}>
                            Delivered
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: 'rgba(59, 130, 246, 0.14)', color: '#2563eb' }}>
                            Dispatched
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                        Supplier: <strong>{sup?.name || po.supplierId}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>{po.items?.length || 0} items</span>
                        <strong style={{ color: 'var(--brand)' }}>{formatCurrency(po.totalAmount)}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        {isDraft && (
                          <button
                            type="button"
                            className="redesign-action-btn primary"
                            style={{ flex: 1 }}
                            onClick={() => onViewDraft && onViewDraft(po)}
                          >
                            View Draft
                          </button>
                        )}
                        {!isDelivered && (
                          <button
                            type="button"
                            className="redesign-action-btn secondary"
                            style={{ color: '#ef4444' }}
                            onClick={() => setDeleteConfirmOrder(po)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOrder && (
        <Modal
          isOpen={Boolean(deleteConfirmOrder)}
          onClose={() => setDeleteConfirmOrder(null)}
          title={`Delete ${deleteConfirmOrder.poNumber}?`}
          icon={<span style={{ fontSize: 18 }} aria-hidden="true">🗑</span>}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteConfirmOrder(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleDeletePO(deleteConfirmOrder)}>
                Delete Order
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>
            Are you sure you want to delete purchase order <strong>{deleteConfirmOrder.poNumber}</strong>? This record will be permanently removed.
          </p>
        </Modal>
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: toast.type === 'warn' ? '#dc2626' : '#10b981',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 8,
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            zIndex: 9999,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

POHistoryPage.propTypes = {
  onNavigateBack: PropTypes.func.isRequired,
  onNavigateTo: PropTypes.func,
  onViewDraft: PropTypes.func,
  initialSupplierId: PropTypes.string,
  themePreference: PropTypes.string,
  onThemeChange: PropTypes.func,
};
