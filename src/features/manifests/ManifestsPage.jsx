import { useState, useEffect, useMemo, useRef, useDeferredValue, Fragment } from 'react';
import '../../styles/replenishment.css';
import { fetchAllManifests, updateManifestStatus } from '../../db/queries.js';
import ThemeSwitcher from '../../components/ui/ThemeSwitcher.jsx';
import KeyboardShortcutsModal from '../../components/ui/KeyboardShortcutsModal.jsx';
import { SUPPLIER_LOGOS } from '../../utils/supplierLogos.js';

export default function ManifestsPage({
  onNavigateBack,
  onNavigateTo,
  themePreference: propThemePreference,
  onThemeChange: propOnThemeChange,
}) {
  const [manifests, setManifests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [expandedManifestId, setExpandedManifestId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
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
        if (expandedManifestId) {
          setExpandedManifestId(null);
          return;
        }
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsModalOpen, expandedManifestId]);

  // Load genuine manifests from SQLite DB
  const loadManifests = async () => {
    try {
      setIsLoading(true);
      const list = await fetchAllManifests();
      setManifests(list || []);
    } catch (err) {
      console.error('[ManifestsPage] Error fetching manifests:', err);
      showToast('Failed to load manifests.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchAllManifests();
        if (active) setManifests(list || []);
      } catch (err) {
        if (active) {
          console.error('[ManifestsPage] Error fetching manifests:', err);
          showToast('Failed to load manifests.', 'error');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Update status with optimistic UI update (instant feedback with rollback on error)
  const handleStatusChange = async (manifestId, newStatus) => {
    const previousManifests = manifests;
    // Optimistic state update: switch status immediately so UI updates instantaneously
    setManifests((prev) =>
      prev.map((m) => (m.id === manifestId ? { ...m, status: newStatus } : m))
    );

    try {
      setUpdatingId(manifestId);
      await updateManifestStatus(manifestId, newStatus);
      showToast(
        newStatus === 'delivered'
          ? 'Shipment intake confirmed! Stock added to inventory and replenishment rules updated.'
          : `Manifest status changed to ${newStatus}.`,
        'success'
      );
      await loadManifests();
    } catch (err) {
      // Revert on failure
      setManifests(previousManifests);
      console.error('[ManifestsPage] Error updating status:', err);
      showToast('Failed to update status in database.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered manifests (using deferredSearchTerm for 120 FPS typing performance)
  const filteredManifests = useMemo(() => {
    return manifests.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) {
        return false;
      }
      if (supplierFilter !== 'all' && m.supplierId !== supplierFilter) {
        return false;
      }
      if (!deferredSearchTerm.trim()) return true;
      const q = deferredSearchTerm.toLowerCase();
      const matchManifestNo = (m.manifestNo || '').toLowerCase().includes(q);
      const matchSupplier = (m.supplierName || '').toLowerCase().includes(q);
      const matchCarrier = (m.carrier || '').toLowerCase().includes(q);
      const matchItems = (m.items || []).some((item) =>
        (item.name || '').toLowerCase().includes(q) || (item.sku || '').toLowerCase().includes(q)
      );
      return matchManifestNo || matchSupplier || matchCarrier || matchItems;
    });
  }, [manifests, statusFilter, supplierFilter, deferredSearchTerm]);

  return (
    <div className="redesign-page-shell">
      {/* ─── Topbar Matching Main Replenishment Desk ───────────────────────── */}
      <header className="topbar" role="banner">
        <div className="topbar-brand">
          <span className="brand-name" style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            StockDesk
          </span>
        </div>

        {/* Global Catalog Search Box with Ctrl+K shortcut badge */}
        <div className="topbar-search" style={{ flex: '1 1 320px', maxWidth: 440, marginLeft: 20 }}>
          <div className="search-box" style={{ position: 'relative', width: '100%' }}>
            <span className="search-icon" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="search-inp"
              placeholder="Search SKU, item name, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search SKU, item name, supplier"
              style={{
                width: '100%',
                height: 36,
                padding: '0 64px 0 32px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <span
              className="search-badge"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 10,
                color: 'var(--text3)',
                border: '1px solid var(--border)',
                padding: '2px 5px',
                borderRadius: 4,
                background: 'var(--surface)',
                fontWeight: 600,
                pointerEvents: 'none',
              }}
            >
              Ctrl+K
            </span>
          </div>
        </div>

        {/* Right Action Icons: Help, Theme Switcher, Profile */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="icon-nav-btn"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text2)',
              fontSize: 13,
              fontWeight: 700,
            }}
            onClick={() => setShortcutsModalOpen(true)}
            aria-label="View keyboard shortcuts"
            title="Keyboard Shortcuts (?)"
          >
            ?
          </button>

          <ThemeSwitcher
            value={effectiveTheme}
            onChange={handleSelectTheme}
            className="topbar-theme-switcher"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-light)' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 700,
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              SM
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Store Manager</span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>Riverside Mart</span>
            </div>
          </div>
        </div>
      </header>

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
              className="icon-nav-btn active"
              title="Inbound Delivery Manifests"
              aria-current="page"
              aria-label="Inbound Delivery Manifests"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </button>
            <button
              className="icon-nav-btn"
              title="Suppliers"
              onClick={() => onNavigateTo && onNavigateTo('suppliers')}
              aria-label="Suppliers"
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
          {/* Subheader */}
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
                  📦
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h1 className="redesign-title">
                      Inbound Delivery Manifests
                    </h1>
                    <span className="redesign-count-pill">
                      {manifests.length} Shipments
                    </span>
                  </div>
                  <div className="redesign-subtitle">
                    Live supplier shipment tracking, arrival schedules, and goods intake verification
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="redesign-filter-bar" role="search" aria-label="Filter delivery manifests">
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
                  placeholder="Search manifest #, supplier, carrier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Filter manifests by number, supplier, or carrier"
                />
              </div>

              <select
                className="redesign-select"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                aria-label="Filter by supplier"
              >
                <option value="all">All Suppliers</option>
                <option value="hf">Heritage Foods</option>
                <option value="bi">Britannia Industries</option>
                <option value="nf">Nature's Farm</option>
              </select>
            </div>

            {/* Segmented Status Tabs matching UI screenshot */}
            <div className="redesign-segmented-tabs" role="tablist" aria-label="Manifest status filter">
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'all'}
                className={`redesign-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'pending'}
                className={`redesign-tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'customs'}
                className={`redesign-tab-btn ${statusFilter === 'customs' ? 'active' : ''}`}
                onClick={() => setStatusFilter('customs')}
              >
                Customs
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'delivered'}
                className={`redesign-tab-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
                onClick={() => setStatusFilter('delivered')}
              >
                Delivered
              </button>
            </div>
          </div>

          {/* Screen-reader announcement container */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {`Showing ${filteredManifests.length} of ${manifests.length} manifests`}
          </div>

          {/* Desktop Table View */}
          {!isMobile && (
            <div className="redesign-table-card">
              <div className="redesign-table-wrapper">
                <table className="redesign-table" aria-label="Inbound Delivery Manifests Table">
                  <thead>
                    <tr>
                      <th scope="col">Manifest #</th>
                      <th scope="col">Supplier</th>
                      <th scope="col">Arrival Date</th>
                      <th scope="col">Items &amp; Products</th>
                      <th scope="col">Total Units</th>
                      <th scope="col">Carrier Logistics</th>
                      <th scope="col">Status</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
                          Loading inbound manifests...
                        </td>
                      </tr>
                    ) : filteredManifests.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>No Inbound Manifests Found</div>
                          <div style={{ fontSize: 12, marginTop: 4 }}>
                            {manifests.length === 0
                              ? 'Dispatch purchase orders from the Replenishment Desk to generate live tracking manifests.'
                              : 'No shipments match your active search or status filters.'}
                          </div>
                          {manifests.length === 0 && (
                            <button
                              type="button"
                              className="btn-replenish"
                              onClick={onNavigateBack}
                              style={{ marginTop: 14 }}
                            >
                              Go to Replenishment Desk →
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredManifests.map((m) => {
                        const isExpanded = expandedManifestId === m.id;
                        const isUpdating = updatingId === m.id;
                        const itemsCount = m.items?.length || 1;
                        const firstItemName = m.items?.[0]?.name || 'Assorted Replenishment Goods';
                        const logoSrc = SUPPLIER_LOGOS[m.supplierId];

                        // Status pill badge matching mockup
                        let statusBadge = (
                          <span className="pill-status-manifest pill-status-intransit">
                            🚚 In Transit
                          </span>
                        );
                        if (m.status === 'pending') {
                          statusBadge = (
                            <span className="pill-status-manifest pill-status-pending">
                              ⏳ Pending
                            </span>
                          );
                        } else if (m.status === 'customs') {
                          statusBadge = (
                            <span className="pill-status-manifest pill-status-customs">
                              🛃 Customs
                            </span>
                          );
                        } else if (m.status === 'delivered') {
                          statusBadge = (
                            <span className="pill-status-manifest pill-status-delivered">
                              ✓ Delivered
                            </span>
                          );
                        }

                        return (
                          <Fragment key={m.id}>
                            <tr>
                              {/* Manifest # */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontSize: 18 }} aria-hidden="true">📦</span>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                                      {m.manifestNo || `MNF-2026-${m.id.slice(-3)}`}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'monospace' }}>
                                      ID: {m.id}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Supplier */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {logoSrc ? (
                                    <img
                                      src={logoSrc}
                                      alt=""
                                      style={{
                                        width: 32,
                                        height: 32,
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
                                        width: 32,
                                        height: 32,
                                        borderRadius: 6,
                                        background: '#2563eb',
                                        color: '#fff',
                                        fontSize: 11,
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {m.supplierName ? m.supplierName.slice(0, 2).toUpperCase() : 'SP'}
                                    </div>
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                                      {m.supplierName}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                                      {m.supplierId === 'hf'
                                        ? 'Dairy & Bakery'
                                        : m.supplierId === 'bi'
                                        ? 'Snacks & Biscuits'
                                        : 'Fruits & Vegetables'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Arrival Date */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span>{m.eta || '23 Oct 2026, 10:00 AM'}</span>
                                </div>
                              </td>

                              {/* Items & Products */}
                              <td>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                                      {itemsCount} Product SKUs
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedManifestId(isExpanded ? null : m.id)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#2563eb',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        padding: 0,
                                        textDecoration: 'none',
                                      }}
                                      aria-expanded={isExpanded}
                                      aria-label={`Toggle line items for manifest ${m.manifestNo}`}
                                    >
                                      {isExpanded ? 'Hide items ▲' : 'View items ▼'}
                                    </button>
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {firstItemName}
                                  </div>
                                </div>
                              </td>

                              {/* Total Units */}
                              <td>
                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                                  {m.totalUnits} units
                                </div>
                              </td>

                              {/* Carrier Logistics */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                                  <span aria-hidden="true">🚚</span>
                                  <span>{m.carrier || "Nature's Express Logistics"}</span>
                                </div>
                              </td>

                              {/* Status */}
                              <td>
                                {statusBadge}
                              </td>

                              {/* Action */}
                              <td style={{ textAlign: 'right' }}>
                                {m.status !== 'delivered' ? (
                                  <button
                                    type="button"
                                    className="btn-delivered-action"
                                    onClick={() => handleStatusChange(m.id, 'delivered')}
                                    disabled={isUpdating}
                                    aria-label={`Mark manifest ${m.manifestNo} as delivered`}
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span>{isUpdating ? 'Updating...' : 'Delivered!'}</span>
                                  </button>
                                ) : (
                                  <span className="btn-delivered-done" title="Shipment marked as received and added to inventory">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span>Delivered</span>
                                  </span>
                                )}
                              </td>
                            </tr>

                            {/* Collapsible Line Items Drawer */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={8} style={{ background: 'var(--bg)', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                                    Line Items in Manifest ({m.items?.length || 0})
                                  </div>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                      <tr style={{ color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>SKU</th>
                                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Product Name</th>
                                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Quantity</th>
                                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Unit Cost</th>
                                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(m.items || []).map((it, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                          <td style={{ padding: '8px', fontFamily: 'monospace' }}>{it.sku || `#${idx + 1}`}</td>
                                          <td style={{ padding: '8px', fontWeight: 600 }}>{it.name || 'Replenishment Item'}</td>
                                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{it.quantity}</td>
                                          <td style={{ padding: '8px', textAlign: 'right' }}>₹{it.unitPrice || 0}</td>
                                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>₹{((it.quantity || 0) * (it.unitPrice || 0)).toLocaleString('en-IN')}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
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

          {/* Mobile Card View (< 768px) */}
          {isMobile && (
            <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Loading inbound manifests...</div>
              ) : filteredManifests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>No manifests found matching criteria.</div>
              ) : (
                filteredManifests.map((m) => {
                  const logoSrc = SUPPLIER_LOGOS[m.supplierId];
                  const isUpdating = updatingId === m.id;

                  return (
                    <div
                      key={m.id}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {logoSrc ? (
                            <img src={logoSrc} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                          ) : (
                            <span style={{ fontSize: 20 }}>📦</span>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{m.manifestNo || `MNF-${m.id.slice(-4)}`}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{m.supplierName}</div>
                          </div>
                        </div>
                      <span className="pill-status-manifest pill-status-intransit">
                        {m.status === 'delivered' ? '✓ Delivered' : '🚚 In Transit'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, background: 'var(--bg)', padding: 10, borderRadius: 6, fontSize: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700 }}>Total Units</div>
                        <div style={{ fontWeight: 700 }}>{m.totalUnits} units</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700 }}>Arrival ETA</div>
                        <div>{m.eta || 'Today, 10:00 AM'}</div>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700 }}>Carrier</div>
                        <div>{m.carrier || "Nature's Express Logistics"}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: 4 }}>
                      {m.status !== 'delivered' ? (
                        <button
                          type="button"
                          className="btn-delivered-action"
                          onClick={() => handleStatusChange(m.id, 'delivered')}
                          disabled={isUpdating}
                          style={{ minHeight: 40 }}
                        >
                          ✓ {isUpdating ? 'Updating...' : 'Delivered!'}
                        </button>
                      ) : (
                        <span className="btn-delivered-done" style={{ minHeight: 36 }}>
                          ✓ Delivered
                        </span>
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
