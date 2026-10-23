import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ThemeSwitcher } from '../../../components/ui';

export default function ReplenishmentTopbar({
  searchTerm,
  setSearchTerm,
  searchInputRef,
  windowWidth,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  setShortcutsModalOpen,
  setAddProductModalOpen,
  setAddSupplierModalOpen,
  themePreference,
  handleSelectTheme,
  mainLogo,
  onNavigateToManifests,
  onNavigateToSuppliers,
  suppliers = [],
  activeQueueSupplierId,
  setActiveQueueSupplierId,
  handleSelectQueueSupplier,
  supplierLogos = {},
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const mobileSearchInputRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Auto-focus mobile search input when expanded
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 60);
    }
  }, [mobileSearchOpen]);

  // Click-outside listener to close 3-dot mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
      <header className={`topbar ${mobileSearchOpen ? 'topbar--search-open' : ''}`}>
        {mobileSearchOpen ? (
          <div className="topbar-search-expanded" role="search">
            <span className="search-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              ref={mobileSearchInputRef}
              type="text"
              className="topbar-search-expanded-inp"
              placeholder="Search SKU, item name, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setMobileSearchOpen(false);
              }}
              aria-label="Search replenishment catalog"
            />
            {searchTerm && (
              <button
                type="button"
                className="topbar-search-clear-btn"
                onClick={() => {
                  setSearchTerm('');
                  mobileSearchInputRef.current?.focus();
                }}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              className="topbar-search-close-btn"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Close search bar"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="topbar-brand">
              {windowWidth < 768 && (
                <button
                  type="button"
                  className="btn-hamburger"
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Open navigation sidebar"
                  title="Open sidebar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              )}
              <span className="brand-name">StockDesk</span>
            </div>

            {/* Desktop Global Search Bar (>= 992px) */}
            {windowWidth >= 992 && (
              <div className="topbar-search">
                <div className="search-box">
                  <span className="search-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    aria-label="Search replenishment catalog"
                  />
                  <span
                    className="search-badge"
                    onClick={() => searchInputRef.current?.focus()}
                    style={{ cursor: 'pointer' }}
                    title="Focus global search (Ctrl+K)"
                  >
                    Ctrl+K
                  </span>
                </div>
              </div>
            )}

            <div className="topbar-right position-relative">
              {/* Search Icon Toggle (< 992px) - placed BEFORE profile view */}
              {windowWidth < 992 && (
                <button
                  type="button"
                  className="btn-search-toggle"
                  onClick={() => setMobileSearchOpen(true)}
                  aria-label="Open search bar"
                  title="Search catalog"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  {searchTerm && <span className="search-active-dot" />}
                </button>
              )}

              {/* Desktop Keyboard Shortcuts Button: Single '?' button */}
              {windowWidth >= 768 && (
                <button
                  type="button"
                  className="btn-kbd-shortcuts-compact"
                  onClick={() => setShortcutsModalOpen(true)}
                  title="Keyboard Shortcuts (Press ?)"
                  aria-label="Keyboard Shortcuts"
                >
                  ?
                </button>
              )}

              {/* Tablet 3-Dot Actions Dropdown (768px <= width < 992px) */}
              {windowWidth >= 768 && windowWidth < 992 && (
                <div className="mobile-header-menu-wrap position-relative" ref={mobileMenuRef}>
                  <button
                    type="button"
                    className={`btn-three-dots ${mobileMenuOpen ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                    aria-label="Actions Menu"
                    aria-haspopup="true"
                    aria-expanded={mobileMenuOpen}
                    title="Actions Menu"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                    </svg>
                  </button>

                  {mobileMenuOpen && (
                    <div className="mobile-actions-dropdown" role="menu">
                      <button
                        type="button"
                        className="mobile-action-item"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAddProductModalOpen(true);
                        }}
                        role="menuitem"
                      >
                        <span className="mobile-action-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </span>
                        <span className="mobile-action-text">Add Product</span>
                      </button>

                      <button
                        type="button"
                        className="mobile-action-item"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setAddSupplierModalOpen(true);
                        }}
                        role="menuitem"
                      >
                        <span className="mobile-action-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" y1="8" x2="19" y2="14" />
                            <line x1="22" y1="11" x2="16" y2="11" />
                          </svg>
                        </span>
                        <span className="mobile-action-text">Add Supplier</span>
                      </button>

                      <div className="mobile-action-sep" />

                      <button
                        type="button"
                        className="mobile-action-item"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setShortcutsModalOpen(true);
                        }}
                        role="menuitem"
                      >
                        <span className="mobile-action-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
                          </svg>
                        </span>
                        <span className="mobile-action-text">Keyboard Shortcuts</span>
                        <kbd className="mobile-action-kbd">?</kbd>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Topbar Theme Switcher (>= 768px only; mobile has it inside the 3-dot menu) */}
              {windowWidth >= 768 && (
                <ThemeSwitcher
                  value={themePreference}
                  onChange={handleSelectTheme}
                  className="topbar-theme-switcher"
                />
              )}

              {/* User profile button */}
              <div className="position-relative">
                <button
                  className={`user-btn ${profileOpen ? 'active' : ''}`}
                  onClick={() => setProfileOpen((prev) => !prev)}
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  aria-label="User Profile and Theme Settings"
                >
                  <div className="user-av">SM</div>
                  <div className="user-info">
                    <span className="user-name">Store Manager</span>
                    <span className="user-store">Riverside Mart</span>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* ─── Mobile Sidebar Navigation Drawer (opened by hamburger) ──────── */}
      {windowWidth < 768 && mobileSidebarOpen && (
        <div className="mobile-sidebar-container" role="dialog" aria-modal="true" aria-label="Navigation drawer">
          <div
            className="mobile-sidebar-overlay"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close navigation sidebar"
          />
          <aside className="mobile-sidebar-drawer">
            <div className="mobile-sidebar-header">
              <div className="d-flex align-items-center gap-2">
                <img src={mainLogo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>StockDesk</span>
              </div>
              <button
                type="button"
                className="mobile-sidebar-close-btn"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                ✕
              </button>
            </div>

            <div className="mobile-sidebar-user-card">
              <div className="user-av" style={{ width: 34, height: 34, fontSize: 13 }}>SM</div>
              <div className="d-flex flex-column">
                <span className="fw-semibold" style={{ fontSize: 13, color: 'var(--text)' }}>Store Manager</span>
                <span className="text-muted" style={{ fontSize: 11 }}>Riverside Mart</span>
              </div>
            </div>

            <div className="mobile-sidebar-nav-list">
              <div className="mobile-sidebar-section-title">Navigation</div>
              <button type="button" className="mobile-sidebar-nav-item" onClick={() => setMobileSidebarOpen(false)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                <span>Dashboard</span>
              </button>
              <button type="button" className="mobile-sidebar-nav-item" onClick={() => setMobileSidebarOpen(false)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <span>Inventory</span>
              </button>
              <button type="button" className="mobile-sidebar-nav-item active" onClick={() => setMobileSidebarOpen(false)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span>Replenishment Desk</span>
              </button>
              <button
                type="button"
                className="mobile-sidebar-nav-item"
                onClick={() => {
                  setMobileSidebarOpen(false);
                  onNavigateToManifests();
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span>Inbound Manifests</span>
              </button>
              <button
                type="button"
                className="mobile-sidebar-nav-item"
                onClick={() => {
                  setMobileSidebarOpen(false);
                  if (onNavigateToSuppliers) onNavigateToSuppliers();
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Suppliers</span>
              </button>
              <button type="button" className="mobile-sidebar-nav-item" onClick={() => setMobileSidebarOpen(false)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                <span>Analytics</span>
              </button>
            </div>

            <div className="mobile-sidebar-sq-section">
              <div className="mobile-sidebar-section-title">Filter by Supplier</div>
              <div className="mobile-sidebar-sq-list">
                {suppliers.map((sup) => {
                  const isFilterActive = activeQueueSupplierId === sup.id;
                  return (
                    <button
                      key={sup.id}
                      type="button"
                      className={`mobile-sidebar-sup-item ${isFilterActive ? 'active' : ''}`}
                      onClick={() => {
                        if (activeQueueSupplierId === sup.id) {
                          setActiveQueueSupplierId(null);
                        } else {
                          handleSelectQueueSupplier(sup.id);
                        }
                        setMobileSidebarOpen(false);
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        {supplierLogos[sup.id] ? (
                          <img src={supplierLogos[sup.id]} alt="" style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 4, background: '#fff', border: '1px solid #e2e8f0' }} />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center fw-bold"
                            style={{ width: 22, height: 22, borderRadius: 4, background: sup.color, color: '#fff', fontSize: 10 }}
                          >
                            {sup.initials}
                          </div>
                        )}
                        <span className="fw-medium" style={{ fontSize: 13 }}>{sup.name}</span>
                      </div>
                      {isFilterActive && <span className="fw-bold" style={{ fontSize: 11, color: 'var(--brand)' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

ReplenishmentTopbar.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  searchInputRef: PropTypes.object,
  windowWidth: PropTypes.number.isRequired,
  mobileSidebarOpen: PropTypes.bool.isRequired,
  setMobileSidebarOpen: PropTypes.func.isRequired,
  setShortcutsModalOpen: PropTypes.func.isRequired,
  setAddProductModalOpen: PropTypes.func.isRequired,
  setAddSupplierModalOpen: PropTypes.func.isRequired,
  themePreference: PropTypes.string.isRequired,
  handleSelectTheme: PropTypes.func.isRequired,
  mainLogo: PropTypes.string,
  onNavigateToManifests: PropTypes.func.isRequired,
  onNavigateToSuppliers: PropTypes.func,
  suppliers: PropTypes.array.isRequired,
  activeQueueSupplierId: PropTypes.string,
  setActiveQueueSupplierId: PropTypes.func.isRequired,
  handleSelectQueueSupplier: PropTypes.func.isRequired,
  supplierLogos: PropTypes.object,
};
