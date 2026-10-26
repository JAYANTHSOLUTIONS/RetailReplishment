import { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import '../../styles/replenishment.css';
import { fetchInventory, fetchSuppliers, fetchAllManifests, fetchPOHistory } from '../../db/queries.js';
import ReplenishmentTopbar from '../replenishment/components/ReplenishmentTopbar.jsx';
import KeyboardShortcutsModal from '../../components/ui/KeyboardShortcutsModal.jsx';
import useGlobalNavigationShortcuts from '../../hooks/useGlobalNavigationShortcuts.js';

import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AppNavigationRail from '../../components/layout/AppNavigationRail.jsx';

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function DashboardPage({
  user,
  onLogout,
  onNavigateTo,
  themePreference,
  onThemeChange,
}) {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  // Global Keyboard Navigation (Alt+1..5, Ctrl+K, ?, Esc)
  useGlobalNavigationShortcuts({
    onNavigateTo,
    searchInputRef,
    shortcutsModalOpen,
    setShortcutsModalOpen,
  });

  // Responsive width
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

  // Load authoritative data from SQLite
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [inv, sups, mnfs, pos] = await Promise.all([
          fetchInventory(),
          fetchSuppliers(),
          fetchAllManifests(),
          fetchPOHistory(),
        ]);
        if (!active) return;
        setProducts(inv || []);
        setSuppliers(sups || []);
        setManifests(mnfs || []);
        setOrders(pos || []);
      } catch (err) {
        console.error('[Dashboard] Error loading dashboard data:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Compute live KPIs
  const kpis = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock || 0) * (p.unitCost || 0), 0);
    const criticalItems = products.filter((p) => (p.priority || p.status) === 'critical');
    const lowItems = products.filter((p) => (p.priority || p.status) === 'low');
    const healthyItems = products.filter((p) => (p.priority || p.status) === 'healthy');
    const orderedItems = products.filter((p) => p.orderStatus === 'ordered');
    const activeManifests = manifests.filter((m) => m.status !== 'delivered');
    const draftOrders = orders.filter((o) => o.status === 'draft');

    return {
      totalValue,
      criticalCount: criticalItems.length,
      lowCount: lowItems.length,
      healthyCount: healthyItems.length,
      orderedCount: orderedItems.length,
      criticalList: criticalItems.slice(0, 6),
      activeManifestsCount: activeManifests.length,
      recentManifests: manifests.slice(0, 4),
      draftCount: draftOrders.length,
    };
  }, [products, manifests, orders]);

  return (
    <div className="redesign-page-shell">
      {/* Topbar */}
      <ReplenishmentTopbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchInputRef={searchInputRef}
        windowWidth={windowWidth}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        setShortcutsModalOpen={setShortcutsModalOpen}
        themePreference={themePreference}
        handleSelectTheme={onThemeChange}
        onNavigateToReplenishment={() => onNavigateTo('replenishment')}
        onNavigateToManifests={() => onNavigateTo('manifests')}
        onNavigateToSuppliers={() => onNavigateTo('suppliers')}
        onNavigateToHistory={() => onNavigateTo('history')}
        activePage="dashboard"
        suppliers={suppliers}
      />

      <div className="redesign-page-body">
        {/* Left Icon Navigation Rail */}
        <aside className="redesign-sidebar">
          <AppNavigationRail
            activePage="dashboard"
            onNavigateTo={onNavigateTo}
            onNavigateToDashboard={() => {}}
            onNavigateToReplenishment={() => onNavigateTo('replenishment')}
            onNavigateToManifests={() => onNavigateTo('manifests')}
            onNavigateToSuppliers={() => onNavigateTo('suppliers')}
            onNavigateToHistory={() => onNavigateTo('history')}
          />
        </aside>

        {/* Main Content */}
        <main
          id="main-content"
          className="redesign-main-content"
          style={{ padding: '24px 32px', overflowY: 'auto' }}
        >
          {/* Welcome Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <h1
                style={{
                  margin: '0 0 4px 0',
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--text)',
                  letterSpacing: '-0.02em',
                }}
              >
                Executive Replenishment Dashboard
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text3)' }}>
                Welcome back, <strong>{user?.name || 'Store Inventory Admin'}</strong> • Operations Portal
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="redesign-action-btn primary"
                onClick={() => onNavigateTo('replenishment')}
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                <span>Open Replenishment Desk</span>
                <ArrowForwardIcon style={{ fontSize: 16, marginLeft: 6 }} />
              </button>
              {onLogout && (
                <button
                  type="button"
                  className="redesign-action-btn secondary"
                  onClick={onLogout}
                  style={{ padding: '8px 14px', fontSize: 13, color: '#ef4444' }}
                  title="Sign out of operations"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: 16,
              marginBottom: 28,
            }}
          >
            {/* KPI 1: Inventory Value */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>
                  Total Stock Value
                </span>
                <TrendingUpIcon style={{ fontSize: 20, color: 'var(--brand)' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                {isLoading ? '...' : formatCurrency(kpis.totalValue)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                Across {products.length} catalog products
              </div>
            </div>

            {/* KPI 2: Critical Reorder Warnings */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>
                  Critical SKUs
                </span>
                <WarningAmberIcon style={{ fontSize: 20, color: '#ef4444' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>
                {isLoading ? '...' : kpis.criticalCount} SKUs
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                Stock below 50% safety target
              </div>
            </div>

            {/* KPI 3: Inbound Shipments */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>
                  Inbound Shipments
                </span>
                <LocalShippingIcon style={{ fontSize: 20, color: '#2563eb' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                {isLoading ? '...' : `${kpis.activeManifestsCount} En Route`}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                Live arrival manifests in transit
              </div>
            </div>

            {/* KPI 4: Active Suppliers */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>
                  Active Suppliers
                </span>
                <StorefrontIcon style={{ fontSize: 20, color: '#16a34a' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                {isLoading ? '...' : `${suppliers.length} Vendors`}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                {kpis.draftCount} open drafts saved
              </div>
            </div>
          </div>

          {/* Quick Hub Launch Cards */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text)' }}>
              Operations Desks &amp; Workspaces
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: 16,
              }}
            >
              {/* Card 1: Replenishment */}
              <div
                onClick={() => onNavigateTo('replenishment')}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 18,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                className="hover-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AssignmentIcon style={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 14, color: 'var(--text)' }}>Replenishment Desk</strong>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Execute PO drafts &amp; reorders</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text2)', margin: '8px 0 0 0' }}>
                  Review inventory stock levels against safety targets and dispatch vendor purchase orders.
                </p>
              </div>

              {/* Card 2: Manifests */}
              <div
                onClick={() => onNavigateTo('manifests')}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 18,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                className="hover-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LocalShippingIcon style={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 14, color: 'var(--text)' }}>Inbound Manifests</strong>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Goods intake &amp; logistics</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text2)', margin: '8px 0 0 0' }}>
                  Track incoming shipments, view line items, and confirm deliveries straight into inventory.
                </p>
              </div>

              {/* Card 3: Suppliers */}
              <div
                onClick={() => onNavigateTo('suppliers')}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 18,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                className="hover-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(129, 140, 248, 0.1)',
                      color: '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <StorefrontIcon style={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 14, color: 'var(--text)' }}>Supplier Directory</strong>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Vendors, MOQ &amp; lead times</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text2)', margin: '8px 0 0 0' }}>
                  Manage supplier profiles, contact reps, warehouse addresses, and minimum order values.
                </p>
              </div>
            </div>
          </div>

          {/* Two-column Section: Urgent SKUs & Live Shipments */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
              gap: 20,
            }}
          >
            {/* Urgent Critical SKUs Table */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  ⚠️ Critical Stock Alerts ({kpis.criticalCount})
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateTo('replenishment')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View All in Desk →
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px' }}>SKU</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px' }}>Product</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px' }}>Stock</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px' }}>Target</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.criticalList.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 600 }}>{item.sku}</td>
                        <td style={{ padding: '8px', fontWeight: 500 }}>{item.name}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>
                          {item.currentStock}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text3)' }}>{item.safetyTarget}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="redesign-action-btn primary"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() => onNavigateTo('replenishment', { supplier: item.supplierId, reorderProduct: item })}
                          >
                            Reorder
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inbound Live Manifests Tracker */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  🚚 Inbound Logistics
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateTo('manifests')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Track All →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {kpis.recentManifests.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                        {m.manifestNo || `MNF-${m.id.slice(-4)}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                        {m.supplierName} • {m.totalUnits} units
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 12,
                        background: m.status === 'delivered' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                        color: m.status === 'delivered' ? '#059669' : '#2563eb',
                      }}
                    >
                      {m.status === 'delivered' ? '✓ Delivered' : '🚚 In Transit'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <KeyboardShortcutsModal isOpen={shortcutsModalOpen} onClose={() => setShortcutsModalOpen(false)} />
    </div>
  );
}

DashboardPage.propTypes = {
  user: PropTypes.object,
  onLogout: PropTypes.func.isRequired,
  onNavigateTo: PropTypes.func.isRequired,
  themePreference: PropTypes.string,
  onThemeChange: PropTypes.func,
};
