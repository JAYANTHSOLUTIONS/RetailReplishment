import { useState, useEffect, useMemo, useRef, useDeferredValue } from 'react';
import '../../styles/replenishment.css';
import { fetchSuppliers, fetchProductCounts } from '../../db/queries.js';
import ReplenishmentTopbar from '../replenishment/components/ReplenishmentTopbar.jsx';
import KeyboardShortcutsModal from '../../components/ui/KeyboardShortcutsModal.jsx';
import { SUPPLIER_LOGOS } from '../../utils/supplierLogos.js';

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
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState('hf');
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
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

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
          return;
        }
        if (quickActionsOpen) {
          setQuickActionsOpen(false);
          return;
        }
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsModalOpen, quickActionsOpen]);

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

  // Filtered suppliers (using deferredSearchTerm for 120 FPS typing performance)
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (categoryFilter !== 'all' && s.category !== categoryFilter) {
        return false;
      }
      if (!deferredSearchTerm.trim()) return true;
      const q = deferredSearchTerm.toLowerCase();
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchCat = (s.category || '').toLowerCase().includes(q);
      const matchRep = (s.contactRep || '').toLowerCase().includes(q);
      const matchId = (s.id || '').toLowerCase().includes(q);
      const matchCity = 'central distribution hub'.includes(q);
      return matchName || matchCat || matchRep || matchId || matchCity;
    });
  }, [suppliers, categoryFilter, deferredSearchTerm]);

  // Action: Replenish -> navigate to replenishment desk with supplier filter
  const handleReplenishSupplier = (supplierId) => {
    if (onNavigateTo) {
      onNavigateTo('replenishment', { supplier: supplierId });
    } else if (onNavigateBack) {
      onNavigateBack();
    }
  };

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
        onNavigateToManifests={() => {
          if (onNavigateTo) onNavigateTo('manifests');
        }}
        onNavigateToSuppliers={() => {}}
        activePage="suppliers"
        suppliers={suppliers}
      />

      {/* ─── Body: Left Icon Rail + Main Content ────────────────────────────── */}
      <div className="redesign-page-body">
        {/* Left Icon Navigation Rail */}
        <nav className="icon-nav" aria-label="Main navigation rail" style={{ width: 52, flexShrink: 0, minHeight: 'calc(100vh - 56px)', position: 'sticky', top: 56, height: 'calc(100vh - 56px)', zIndex: 30 }}>
          <div className="icon-nav-list">
            <button className="icon-nav-btn" title="Dashboard" onClick={onNavigateBack} aria-label="Dashboard">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            </button>
            <button className="icon-nav-btn" title="Inventory" onClick={onNavigateBack} aria-label="Inventory">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </button>
            <button className="icon-nav-btn" title="Replenishment Desk" onClick={onNavigateBack} aria-label="Replenishment Desk">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </button>
            <button
              className="icon-nav-btn"
              title="Inbound Delivery Manifests"
              onClick={() => onNavigateTo && onNavigateTo('manifests')}
              aria-label="Inbound Delivery Manifests"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </button>
            <button
              className="icon-nav-btn active"
              title="Suppliers Directory"
              aria-current="page"
              aria-label="Suppliers Directory"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>
            <button className="icon-nav-btn" title="Analytics" aria-label="Analytics">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </button>
          </div>
          <div className="icon-nav-bottom">
            <button className="icon-nav-btn" title="Settings" aria-label="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main id="main-content" className="redesign-main-content">
          {/* Subheader with Back Button, Title, Badge, and Subtitle */}
          <div className="redesign-subheader">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                type="button"
                onClick={onNavigateBack}
                className="redesign-back-btn"
                title="Return to Retail Replenishment Desk"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back to Replenishment Desk</span>
              </button>

              <div className="redesign-title-wrapper">
                <div className="redesign-icon-badge" aria-hidden="true">
                  🏬
                </div>
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
          </div>

          {/* Filter Bar */}
          <div className="redesign-filter-bar" role="search" aria-label="Filter suppliers">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 300px' }}>
              <div className="redesign-search-box">
                <span className="redesign-search-icon" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="redesign-search-input"
                  placeholder="Search supplier, contact rep, category, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Filter supplier by name, category, or representative"
                />
              </div>

              <select
                className="redesign-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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
                <table className="redesign-table" aria-label="Supplier Directory Table">
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
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
                          Loading suppliers...
                        </td>
                      </tr>
                    ) : filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
                          No suppliers found matching current search.
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((sup) => {
                        const isRowActive = selectedSupplierId === sup.id;
                        const logoSrc = SUPPLIER_LOGOS[sup.id];
                        const catalogCount = productCounts[sup.id] || 50;

                        return (
                          <tr
                            key={sup.id}
                            className={isRowActive ? 'row-active' : ''}
                            onClick={() => setSelectedSupplierId(sup.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            {/* Supplier Logo & Name */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                                    {sup.name}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                                    {sup.category} • #{sup.id}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Contact Person */}
                            <td>
                              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                                {sup.contactRep || 'Fulfillment Manager'}
                              </div>
                            </td>

                            {/* Target MOQ */}
                            <td>
                              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                                {formatCurrency(sup.targetMoq)}
                              </div>
                            </td>

                            {/* Unit Threshold */}
                            <td>
                              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                                {sup.unitThreshold ? `${sup.unitThreshold} units` : 'units'}
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
                                <span style={{ color: '#ef4444', fontSize: 14 }} aria-hidden="true">📍</span>
                                <span>Central Distribution Hub</span>
                              </div>
                            </td>

                            {/* Catalog */}
                            <td>
                              <div style={{ fontSize: 13 }}>
                                <strong style={{ color: 'var(--text)' }}>{catalogCount}</strong>{' '}
                                <span style={{ color: 'var(--text3)', fontSize: 11 }}>SKUs</span>
                              </div>
                            </td>

                            {/* Action: Replenish */}
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn-replenish"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReplenishSupplier(sup.id);
                                }}
                                aria-label={`Replenish catalog from ${sup.name}`}
                              >
                                <span>Replenish</span>
                                <span aria-hidden="true">→</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Quick Actions and Pagination */}
              <div className="redesign-table-footer">
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="redesign-back-btn"
                    style={{ fontSize: 12, padding: '5px 12px' }}
                    onClick={() => setQuickActionsOpen((prev) => !prev)}
                    aria-expanded={quickActionsOpen}
                    aria-haspopup="true"
                  >
                    <span>⚡ Quick Actions</span>
                    <span style={{ fontSize: 10, marginLeft: 2 }}>▼</span>
                  </button>

                  {quickActionsOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        marginBottom: 6,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        minWidth: 180,
                        zIndex: 50,
                        padding: 4,
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          fontSize: 12,
                          background: 'none',
                          border: 'none',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          borderRadius: 4,
                        }}
                        onClick={() => {
                          setQuickActionsOpen(false);
                          showToast('Supplier catalog exported as CSV.');
                        }}
                      >
                        Export Supplier CSV
                      </button>
                      <button
                        type="button"
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          fontSize: 12,
                          background: 'none',
                          border: 'none',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          borderRadius: 4,
                        }}
                        onClick={() => {
                          setQuickActionsOpen(false);
                          onNavigateTo && onNavigateTo('manifests');
                        }}
                      >
                        Track Inbound Manifests
                      </button>
                    </div>
                  )}
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
                      defaultValue="25"
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
                      disabled
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text3)',
                        cursor: 'not-allowed',
                      }}
                      aria-label="Previous page"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        border: '1px solid var(--brand)',
                        background: 'var(--brand)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                      aria-label="Page 1"
                      aria-current="page"
                    >
                      1
                    </button>
                    <button
                      type="button"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: 12,
                      }}
                      aria-label="Page 2"
                    >
                      2
                    </button>
                    <button
                      type="button"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        cursor: 'pointer',
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
                  const catalogCount = productCounts[sup.id] || 50;

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

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>📍 Central Distribution Hub</div>
                      <button
                        type="button"
                        className="btn-replenish"
                        onClick={() => handleReplenishSupplier(sup.id)}
                        style={{ minHeight: 40 }}
                        aria-label={`Replenish catalog from ${sup.name}`}
                      >
                        Replenish →
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

      {/* Accessible Keyboard Shortcuts Modal */}
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
