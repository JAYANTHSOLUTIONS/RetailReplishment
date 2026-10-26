import { useState, useEffect, useMemo, useRef, useDeferredValue } from 'react';
import PropTypes from 'prop-types';
import '../../styles/replenishment.css';
import { fetchSuppliers, fetchProductCounts } from '../../db/queries.js';
import ReplenishmentTopbar from '../replenishment/components/ReplenishmentTopbar.jsx';
import KeyboardShortcutsModal from '../../components/ui/KeyboardShortcutsModal.jsx';
import AddSupplierModal from '../replenishment/AddSupplierModal.jsx';
import useGlobalNavigationShortcuts from '../../hooks/useGlobalNavigationShortcuts.js';
import { SUPPLIER_LOGOS } from '../../utils/supplierLogos.js';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AppNavigationRail from '../../components/layout/AppNavigationRail.jsx';

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function SuppliersPage({
  onNavigateBack,
  onNavigateTo,
  themePreference: propThemePreference,
  onThemeChange: propOnThemeChange,
}) {
  const [suppliers, setSuppliers] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState('hf');
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Supplier modal state (shared between Add and Edit)
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null);

  // Table row keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState(0);
  const searchInputRef = useRef(null);
  const tableRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  // Load authoritative suppliers and product counts from SQLite
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [sups, counts] = await Promise.all([
          fetchSuppliers(),
          fetchProductCounts(),
        ]);
        if (!active) return;
        if (sups && sups.length > 0) {
          setSuppliers(sups);
          setSelectedSupplierId(sups[0]?.id || 'hf');
        }

        const countMap = {};
        if (counts && Array.isArray(counts)) {
          counts.forEach((c) => {
            countMap[c.supplierId] = c.count;
          });
        }
        setProductCounts(countMap);
      } catch (err) {
        console.error('[SuppliersPage] Error loading suppliers:', err);
        showToast('Unable to load suppliers directory.', 'error');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set();
    suppliers.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set).sort();
  }, [suppliers]);

  // Filtered suppliers (responsive immediately on 1st character)
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (categoryFilter !== 'all' && s.category !== categoryFilter) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const q = searchTerm.trim().toLowerCase();
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchCat = (s.category || '').toLowerCase().includes(q);
      const matchRep = (s.contactRep || '').toLowerCase().includes(q);
      const matchId = (s.id || '').toLowerCase().includes(q);
      // Only match contact address if query is at least 3 chars long, avoiding false positive single-letter matches across boilerplate address strings
      const matchAddress = q.length >= 3 && (s.contactAddress || '').toLowerCase().includes(q);
      return matchName || matchCat || matchRep || matchId || matchAddress;
    });
  }, [suppliers, categoryFilter, searchTerm]);

  // Paginated suppliers
  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize));
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage, pageSize]);

  // Unified Supplier modal handlers (Add & Edit)
  const handleOpenAddSupplier = () => {
    setSupplierToEdit(null);
    setSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup) => {
    setSupplierToEdit(sup);
    setSupplierModalOpen(true);
  };

  const handleSupplierSaved = (savedSupplier, isEdit) => {
    if (isEdit) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === savedSupplier.id ? { ...s, ...savedSupplier } : s))
      );
      showToast(`Supplier "${savedSupplier.name}" updated successfully!`, 'success');
    } else {
      setSuppliers((prev) => [savedSupplier, ...prev]);
      showToast(`Supplier "${savedSupplier.name}" added to database!`, 'success');
    }
    setSupplierToEdit(null);
  };

  // Keyboard navigation & global shortcuts (Alt+1..5, Ctrl+K, ?, Esc, Arrow keys)
  useGlobalNavigationShortcuts({
    onNavigateTo,
    onNavigateBack,
    searchInputRef,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    isAnyModalOpen: supplierModalOpen,
    onEscape: () => {
      if (supplierModalOpen) {
        setSupplierModalOpen(false);
        setSupplierToEdit(null);
        return true;
      }
      if (onNavigateBack) {
        onNavigateBack();
        return true;
      }
      return false;
    },
    itemsCount: paginatedSuppliers.length,
    focusedIndex,
    setFocusedIndex,
    onEnter: (idx) => {
      const sup = paginatedSuppliers[idx];
      if (sup) handleOpenEditSupplier(sup);
    },
    tableRef,
  });

  return (
    <div className="redesign-page-shell">
      {/* ─── Topbar Using Unified Replenishment Desk Topbar Component ────────── */}
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
        onNavigateToManifests={() => onNavigateTo && onNavigateTo('manifests')}
        onNavigateToDashboard={() => onNavigateTo && onNavigateTo('dashboard')}
        onNavigateToSuppliers={() => {}}
        onNavigateToHistory={() => onNavigateTo && onNavigateTo('history')}
        activePage="suppliers"
        suppliers={suppliers}
      />

      {/* ─── Body: Left Icon Rail + Main Content ────────────────────────────── */}
      <div className="redesign-page-body">
        {/* Left Icon Navigation Rail */}
        <aside className="redesign-sidebar">
          <AppNavigationRail
            activePage="suppliers"
            onNavigateTo={onNavigateTo}
            onNavigateToReplenishment={onNavigateBack}
            onNavigateToDashboard={() => onNavigateTo && onNavigateTo('dashboard')}
            onNavigateToManifests={() => onNavigateTo && onNavigateTo('manifests')}
            onNavigateToHistory={() => onNavigateTo && onNavigateTo('history')}
          />
        </aside>

        {/* Main Content Area */}
        <main id="main-content" className="redesign-main-content">
          {/* Subheader with Back Button, Title, Subtitle, and Add Supplier Button */}
          <div className="redesign-subheader" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
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
                    <h1 className="redesign-title">
                      Supplier Directory
                    </h1>
                    <span className="redesign-count-pill">
                      {suppliers.length} Partners
                    </span>
                  </div>
                  <div className="redesign-subtitle">
                    Authoritative supplier directory, contact representatives, lead times, and MOQ thresholds
                  </div>
                </div>
              </div>
            </div>

            {/* Reusable Add Supplier Button */}
            <button
              type="button"
              className="header-action-btn"
              onClick={handleOpenAddSupplier}
              title="Add new supplier vendor to database"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 6,
                background: 'var(--brand, #2563eb)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <AddIcon style={{ fontSize: 16 }} />
              <span>Add Supplier</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="redesign-filter-bar" role="search" aria-label="Filter suppliers">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 300px' }}>
              <div className="redesign-search-box">
                <span className="redesign-search-icon" aria-hidden="true">
                  <SearchIcon style={{ fontSize: 16 }} />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="redesign-search-input"
                  placeholder="Search supplier, contact rep, category, address..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter supplier by name, category, or representative"
                />
              </div>

              <select
                className="redesign-select"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter by supplier category"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </div>
          </div>

          {/* Screen-reader announcement container */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {`Showing ${filteredSuppliers.length} of ${suppliers.length} suppliers`}
          </div>

          {/* Desktop Table View */}
          {!isMobile && (
            <div className="redesign-table-card">
              <div className="redesign-table-wrapper">
                <table ref={tableRef} className="redesign-table" aria-label="Supplier Directory Table">
                  <colgroup>
                    <col style={{ width: '24%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '5%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">Supplier</th>
                      <th scope="col">Contact Person</th>
                      <th scope="col">Target MOQ</th>
                      <th scope="col">Unit Threshold</th>
                      <th scope="col">Lead Time</th>
                      <th scope="col">Warehouse Address</th>
                      <th scope="col">Catalog</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text3)' }}>
                          Loading suppliers...
                        </td>
                      </tr>
                    ) : paginatedSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text3)' }}>
                          No suppliers found matching current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedSuppliers.map((sup, idx) => {
                        const isSelected = selectedSupplierId === sup.id;
                        const logoSrc = SUPPLIER_LOGOS[sup.id];
                        const catalogCount = productCounts[sup.id] || 0;

                        return (
                          <tr
                            key={sup.id}
                            className={`supplier-table-row ${isSelected ? 'selected' : ''}`}
                            style={{
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setSelectedSupplierId(sup.id);
                              setFocusedIndex(idx);
                            }}
                            onDoubleClick={() => handleOpenEditSupplier(sup)}
                            tabIndex={0}
                            aria-label={`Supplier ${sup.name}`}
                          >
                            {/* Supplier Identity */}
                            <td style={{ minWidth: 0, overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, width: '100%' }}>
                                {logoSrc ? (
                                  <img
                                    src={logoSrc}
                                    alt=""
                                    style={{
                                      width: 34,
                                      height: 34,
                                      objectFit: 'contain',
                                      borderRadius: 6,
                                      background: '#fff',
                                      border: '1px solid var(--border)',
                                      padding: 2,
                                      flexShrink: 0,
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: 34,
                                      height: 34,
                                      borderRadius: 6,
                                      background: sup.color || '#2563eb',
                                      color: '#fff',
                                      fontSize: 12,
                                      fontWeight: 800,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {sup.initials || sup.name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      fontSize: 13,
                                      color: 'var(--text)',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      wordBreak: 'break-word',
                                    }}
                                    title={sup.name}
                                  >
                                    {sup.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: 'var(--text3)',
                                      marginTop: 2,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={`${sup.category} • #${sup.id}`}
                                  >
                                    {sup.category} • #{sup.id}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Contact Person */}
                            <td style={{ minWidth: 0, overflow: 'hidden' }}>
                              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: 'var(--text)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    wordBreak: 'break-word',
                                  }}
                                  title={sup.contactRep || 'Fulfillment Manager'}
                                >
                                  {sup.contactRep || 'Fulfillment Manager'}
                                </div>
                                {sup.contactEmail && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: 'var(--text3)',
                                      marginTop: 2,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                    title={sup.contactEmail}
                                  >
                                    {sup.contactEmail}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Target MOQ */}
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                                {formatCurrency(sup.targetMoq)}
                              </div>
                            </td>

                            {/* Unit Threshold */}
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                                {sup.unitThreshold ? `${sup.unitThreshold} units` : '0 units'}
                              </div>
                            </td>

                            {/* Lead Time */}
                            <td>
                              <span className="pill-lead-time">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>{sup.leadTime || '2-3 Days'}</span>
                              </span>
                            </td>

                            {/* Warehouse Address */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                                <LocationOnIcon style={{ fontSize: 15, color: '#ef4444', flexShrink: 0 }} />
                                <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {sup.contactAddress || 'Central Distribution Hub'}
                                </span>
                              </div>
                            </td>

                            {/* Catalog */}
                            <td>
                              <div style={{ fontSize: 13 }}>
                                <strong style={{ color: 'var(--text)' }}>{catalogCount}</strong>{' '}
                                <span style={{ color: 'var(--text3)', fontSize: 11 }}>SKUs</span>
                              </div>
                            </td>

                            {/* Action: Open Reusable Supplier Modal */}
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn-inline-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditSupplier(sup);
                                }}
                                title={`Edit supplier ${sup.name}`}
                                aria-label={`Edit ${sup.name}`}
                              >
                                <EditIcon style={{ fontSize: 14 }} />
                                <span>Edit</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Pagination */}
              <div className="redesign-table-footer" style={{ justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  Showing {paginatedSuppliers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredSuppliers.length)} of {filteredSuppliers.length} suppliers
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Rows per page:</span>
                    <select
                      style={{
                        height: 28,
                        padding: '0 6px',
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: 12,
                      }}
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      aria-label="Rows per page"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: currentPage <= 1 ? 'var(--text3)' : 'var(--text)',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                      }}
                      aria-label="Previous page"
                    >
                      &lt;
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--text2)', padding: '0 4px' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: currentPage >= totalPages ? 'var(--text3)' : 'var(--text)',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                      }}
                      aria-label="Next page"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Card Layout (< 768px) */}
          {isMobile && (
            <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Loading suppliers...</div>
              ) : filteredSuppliers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>No suppliers found matching current search.</div>
              ) : (
                filteredSuppliers.map((sup) => {
                  const logoSrc = SUPPLIER_LOGOS[sup.id];
                  const catalogCount = productCounts[sup.id] || 0;

                  return (
                    <div
                      key={sup.id}
                      className="supplier-mobile-card"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt=""
                              style={{
                                width: 32,
                                height: 32,
                                objectFit: 'contain',
                                borderRadius: 4,
                                background: '#fff',
                                border: '1px solid var(--border)',
                                padding: 2,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 4,
                                background: sup.color || '#2563eb',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {sup.initials}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{sup.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sup.category} • #{sup.id}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, background: 'var(--bg)', padding: 10, borderRadius: 6, fontSize: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700 }}>Target MOQ</div>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{formatCurrency(sup.targetMoq)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700 }}>Lead Time</div>
                          <div style={{ fontWeight: 600, color: '#2563eb' }}>{sup.leadTime || '2-3 Days'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700 }}>Catalog</div>
                          <div><strong>{catalogCount}</strong> SKUs</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700 }}>Contact</div>
                          <div style={{ fontSize: 11 }}>{sup.contactRep || 'Fulfillment Manager'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          📍 {sup.contactAddress || 'Central Distribution Hub'}
                        </div>
                        <button
                          type="button"
                          className="btn-inline-edit"
                          onClick={() => handleOpenEditSupplier(sup)}
                          style={{ minHeight: 34, padding: '5px 12px' }}
                          aria-label={`Edit ${sup.name}`}
                        >
                          <EditIcon style={{ fontSize: 14, marginRight: 4 }} /> Edit
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </main>
      </div>

      {/* Reusable Supplier Modal: Shared for both Add and Edit with identical validation */}
      <AddSupplierModal
        isOpen={supplierModalOpen}
        onClose={() => {
          setSupplierModalOpen(false);
          setSupplierToEdit(null);
        }}
        supplierToEdit={supplierToEdit}
        categories={categories}
        onSupplierSaved={handleSupplierSaved}
      />

      {/* Accessible Keyboard Shortcuts Reference Modal */}
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
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 8,
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            fontSize: 13,
            fontWeight: 600,
            zIndex: 9999,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

SuppliersPage.propTypes = {
  onNavigateBack: PropTypes.func.isRequired,
  onNavigateTo: PropTypes.func.isRequired,
  themePreference: PropTypes.string,
  onThemeChange: PropTypes.func,
};
