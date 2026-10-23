import PropTypes from 'prop-types';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

/**
 * AppNavigationRail
 * Universal, unified icon sidebar rail used across all application pages:
 * Dashboard, Replenishment, Manifests, Suppliers, and PO History.
 * Stripped of unused icons (Analytics, Settings, duplicate Inventory).
 */
export default function AppNavigationRail({
  activePage = 'dashboard',
  onNavigateTo = () => {},
  onNavigateToDashboard = () => {},
  onNavigateToReplenishment = () => {},
  onNavigateToManifests = () => {},
  onNavigateToSuppliers = () => {},
  onNavigateToHistory = () => {},
}) {
  const handleNav = (page) => {
    if (page === 'dashboard') {
      if (onNavigateToDashboard) onNavigateToDashboard();
      else onNavigateTo('dashboard');
    } else if (page === 'replenishment') {
      if (onNavigateToReplenishment) onNavigateToReplenishment();
      else onNavigateTo('replenishment');
    } else if (page === 'manifests') {
      if (onNavigateToManifests) onNavigateToManifests();
      else onNavigateTo('manifests');
    } else if (page === 'suppliers') {
      if (onNavigateToSuppliers) onNavigateToSuppliers();
      else onNavigateTo('suppliers');
    } else if (page === 'history') {
      if (onNavigateToHistory) onNavigateToHistory();
      else onNavigateTo('history');
    }
  };

  return (
    <nav className="icon-nav" aria-label="Main navigation rail">
      <div className="icon-nav-list">
        <button
          type="button"
          className={`icon-nav-btn ${activePage === 'dashboard' ? 'active' : ''}`}
          title="Executive Dashboard"
          aria-label="Executive Dashboard"
          aria-current={activePage === 'dashboard' ? 'page' : undefined}
          onClick={() => handleNav('dashboard')}
        >
          <DashboardIcon style={{ fontSize: 20 }} />
        </button>

        <button
          type="button"
          className={`icon-nav-btn ${activePage === 'replenishment' ? 'active' : ''}`}
          title="Replenishment Desk"
          aria-label="Replenishment Desk"
          aria-current={activePage === 'replenishment' ? 'page' : undefined}
          onClick={() => handleNav('replenishment')}
        >
          <AssignmentIcon style={{ fontSize: 20 }} />
        </button>

        <button
          type="button"
          className={`icon-nav-btn ${activePage === 'manifests' ? 'active' : ''}`}
          title="Inbound Manifests"
          aria-label="Inbound Manifests"
          aria-current={activePage === 'manifests' ? 'page' : undefined}
          onClick={() => handleNav('manifests')}
        >
          <LocalShippingIcon style={{ fontSize: 20 }} />
        </button>

        <button
          type="button"
          className={`icon-nav-btn ${activePage === 'suppliers' ? 'active' : ''}`}
          title="Suppliers Directory"
          aria-label="Suppliers Directory"
          aria-current={activePage === 'suppliers' ? 'page' : undefined}
          onClick={() => handleNav('suppliers')}
        >
          <StorefrontIcon style={{ fontSize: 20 }} />
        </button>

        <button
          type="button"
          className={`icon-nav-btn ${activePage === 'history' ? 'active' : ''}`}
          title="Purchase Order History"
          aria-label="Purchase Order History"
          aria-current={activePage === 'history' ? 'page' : undefined}
          onClick={() => handleNav('history')}
        >
          <ReceiptLongIcon style={{ fontSize: 20 }} />
        </button>
      </div>

      <div className="icon-nav-bottom">
        <div className="icon-user-av" title="Store Operations">
          OP
        </div>
      </div>
    </nav>
  );
}

AppNavigationRail.propTypes = {
  activePage: PropTypes.string,
  onNavigateTo: PropTypes.func,
  onNavigateToDashboard: PropTypes.func,
  onNavigateToReplenishment: PropTypes.func,
  onNavigateToManifests: PropTypes.func,
  onNavigateToSuppliers: PropTypes.func,
  onNavigateToHistory: PropTypes.func,
};
