import { useState, useEffect, useMemo, useRef, useDeferredValue } from 'react';
import '../../styles/replenishment.css';
import { fetchSuppliers, fetchProductCounts, updateSupplier } from '../../db/queries.js';
import ReplenishmentTopbar from '../replenishment/components/ReplenishmentTopbar.jsx';
import KeyboardShortcutsModal from '../../components/ui/KeyboardShortcutsModal.jsx';
import { SUPPLIER_LOGOS } from '../../utils/supplierLogos.js';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';

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
  const [toast, setToast] = useState(null);

  // Inline editing state
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);

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
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsModalOpen]);

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

  // Inline editing handlers
  const startEditing = (sup) => {
    setEditingSupplierId(sup.id);
    setEditForm({
      id: sup.id,
      name: sup.name || '',
      category: sup.category || '',
      contactRep: sup.contactRep || '',
      contactEmail: sup.contactEmail || '',
      contactPhone: sup.contactPhone || '',
      contactAddress: sup.contactAddress || 'Central Distribution Hub',
      targetMoq: sup.targetMoq || 5000,
      unitThreshold: sup.unitThreshold || 0,
      leadTime: sup.leadTime || '2-3 Days',
    });
  };

  const cancelEditing = () => {
    setEditingSupplierId(null);
    setEditForm({});
  };

  const handleSaveInlineEdit = async () => {
    if (!editForm.name || !editForm.name.trim()) {
      showToast('Supplier name cannot be empty', 'error');
      return;
    }
    try {
      setIsSaving(true);
      const updated = await updateSupplier(editForm);
      setSuppliers((prev) =>
        prev.map((s) => (s.id === editForm.id ? { ...s, ...updated } : s))
      );
      showToast(`Supplier "${updated.name}" saved to database successfully!`, 'success');
      setEditingSupplierId(null);
    } catch (err) {
      console.error('Error saving supplier:', err);
      showToast(err.message || 'Failed to save supplier to SQLite.', 'error');
    } finally {
      setIsSaving(false);
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
        onNavigateToHistory={() => {
          if (onNavigateTo) onNavigateTo('history');
        }}
        activePage="suppliers"
        suppliers={suppliers}
      />

      {/* ─── Body: Left Icon Rail + Main Content ────────────────────────────── */}
      <div className="redesign-page-body">
        {/* Left Icon Navigation Rail */}
        <nav className="icon-nav" aria-label="Main navigation rail" style={{ width: 52, flexShrink: 0, minHeight: 'calc(100vh - 56px)', position: 'sticky', top: 56, height: 'calc(100vh - 56px)', zIndex: 30 }}>
          <div className="icon-nav-list">
            <button className="icon-nav-btn" title="Dashboard" onClick={() => onNavigateTo && onNavigateTo('dashboard')} aria-label="Dashboard">
              <DashboardIcon style={{ fontSize: 20 }} />
            </button>
            <button className="icon-nav-btn" title="Inventory Products" onClick={onNavigateBack} aria-label="Inventory Products">
              <Inventory2Icon style={{ fontSize: 20 }} />
            </button>
            <button className="icon-nav-btn" title="Replenishment Desk" onClick={onNavigateBack} aria-label="Replenishment Desk">
              <AssignmentIcon style={{ fontSize: 20 }} />
            </button>
            <button
              className="icon-nav-btn"
              title="Inbound Delivery Manifests"
              onClick={() => onNavigateTo && onNavigateTo('manifests')}
              aria-label="Inbound Delivery Manifests"
            >
              <LocalShippingIcon style={{ fontSize: 20 }} />
            </button>
            <button
              className="icon-nav-btn active"
              title="Suppliers Directory"
              aria-current="page"
              aria-label="Suppliers Directory"
            >
              <StorefrontIcon style={{ fontSize: 20 }} />
            </button>
            <button
              className="icon-nav-btn"
              title="Purchase Order History"
              onClick={() => onNavigateTo && onNavigateTo('history')}
              aria-label="Purchase Order History"
            >
              <ReceiptLongIcon style={{ fontSize: 20 }} />
            </button>
            <button className="icon-nav-btn" title="Analytics" aria-label="Analytics">
              <BarChartIcon style={{ fontSize: 20 }} />
            </button>
          </div>
          <div className="icon-nav-bottom">
            <button className="icon-nav-btn" title="Settings" aria-label="Settings">
              <SettingsIcon style={{ fontSize: 20 }} />
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main id="main-content" className="redesign-main-content">
          {/* Subheader with Back Button, Title, and Subtitle */}
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
                  <SearchIcon style={{ fontSize: 16 }} />
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
                        const isEditing = editingSupplierId === sup.id;
                        const logoSrc = SUPPLIER_LOGOS[sup.id];
                        const catalogCount = productCounts[sup.id] || 50;

                        return (
                          <tr
                            key={sup.id}
                            className={`${isRowActive ? 'row-active' : ''} ${isEditing ? 'row-editing' : ''}`}
                            onClick={() => !isEditing && setSelectedSupplierId(sup.id)}
                            style={{ cursor: isEditing ? 'default' : 'pointer' }}
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
                                <div style={{ flex: 1 }}>
                                  {isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <input
                                        type="text"
                                        className="inline-edit-input"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="Supplier Name"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <input
                                        type="text"
                                        className="inline-edit-input sub"
                                        value={editForm.category}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                                        placeholder="Category"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                                        {sup.name}
                                      </div>
                                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                                        {sup.category} • #{sup.id}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Contact Person */}
                            <td>
                              {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <input
                                    type="text"
                                    className="inline-edit-input"
                                    value={editForm.contactRep}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, contactRep: e.target.value }))}
                                    placeholder="Representative Name"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <input
                                    type="email"
                                    className="inline-edit-input sub"
                                    value={editForm.contactEmail}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                                    placeholder="Email"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              ) : (
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                                    {sup.contactRep || 'Fulfillment Manager'}
                                  </div>
                                  {sup.contactEmail && (
                                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                                      {sup.contactEmail}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Target MOQ */}
                            <td>
                              {isEditing ? (
                                <input
                                  type="number"
                                  className="inline-edit-input num"
                                  style={{ width: 90 }}
                                  value={editForm.targetMoq}
                                  onChange={(e) => setEditForm((prev) => ({ ...prev, targetMoq: e.target.value }))}
                                  placeholder="5000"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                                  {formatCurrency(sup.targetMoq)}
                                </div>
                              )}
                            </td>

                            {/* Unit Threshold */}
                            <td>
                              {isEditing ? (
                                <input
                                  type="number"
                                  className="inline-edit-input num"
                                  style={{ width: 70 }}
                                  value={editForm.unitThreshold}
                                  onChange={(e) => setEditForm((prev) => ({ ...prev, unitThreshold: e.target.value }))}
                                  placeholder="0"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                                  {sup.unitThreshold ? `${sup.unitThreshold} units` : '0 units'}
                                </div>
                              )}
                            </td>

                            {/* Lead Time */}
                            <td>
                              {isEditing ? (
                                <input
                                  type="text"
                                  className="inline-edit-input"
                                  style={{ width: 85 }}
                                  value={editForm.leadTime}
                                  onChange={(e) => setEditForm((prev) => ({ ...prev, leadTime: e.target.value }))}
                                  placeholder="e.g. 3d"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className="pill-lead-time">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span>{sup.leadTime || '2-3 Days'}</span>
                                </span>
                              )}
                            </td>

                            {/* Warehouse Address */}
                            <td>
                              {isEditing ? (
                                <input
                                  type="text"
                                  className="inline-edit-input"
                                  style={{ minWidth: 150 }}
                                  value={editForm.contactAddress}
                                  onChange={(e) => setEditForm((prev) => ({ ...prev, contactAddress: e.target.value }))}
                                  placeholder="Warehouse Address"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                                  <LocationOnIcon style={{ fontSize: 15, color: '#ef4444', flexShrink: 0 }} />
                                  <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {sup.contactAddress || 'Central Distribution Hub'}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Catalog */}
                            <td>
                              <div style={{ fontSize: 13 }}>
                                <strong style={{ color: 'var(--text)' }}>{catalogCount}</strong>{' '}
                                <span style={{ color: 'var(--text3)', fontSize: 11 }}>SKUs</span>
                              </div>
                            </td>

                            {/* Action: Inline Edit / Save */}
                            <td style={{ textAlign: 'right' }}>
                              {isEditing ? (
                                <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    className="btn-inline-save"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveInlineEdit();
                                    }}
                                    disabled={isSaving}
                                    title="Save supplier updates to database"
                                  >
                                    <SaveIcon style={{ fontSize: 15 }} />
                                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-inline-cancel"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cancelEditing();
                                    }}
                                    disabled={isSaving}
                                    title="Cancel editing"
                                  >
                                    <CloseIcon style={{ fontSize: 15 }} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-inline-edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(sup);
                                  }}
                                  title={`Edit supplier ${sup.name}`}
                                  aria-label={`Edit ${sup.name}`}
                                >
                                  <EditIcon style={{ fontSize: 14 }} />
                                  <span>Edit</span>
                                </button>
                              )}
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
                  Total {filteredSuppliers.length} active suppliers
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

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        📍 {sup.contactAddress || 'Central Distribution Hub'}
                      </div>
                      <button
                        type="button"
                        className="btn-inline-edit"
                        onClick={() => startEditing(sup)}
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
