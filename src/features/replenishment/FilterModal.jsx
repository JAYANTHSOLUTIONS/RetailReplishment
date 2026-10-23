import { useState, useMemo, useEffect, useRef } from 'react';
import { matchesFilters } from '../../utils';
import { SUPPLIER_LOGOS } from '../../utils/supplierLogos.js';
import { Modal, Button } from '../../components/ui';

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  appliedFilters,
  currentFilters,
  products = [],
  allProducts = [],
  suppliers = [],
  categories = [],
}) {
  const modalRef = useRef(null);
  const activeFilters = appliedFilters || currentFilters || {};
  const productList = products && products.length > 0 ? products : allProducts;

  const [pending, setPending] = useState(() => ({
    statuses: activeFilters.statuses ? [...activeFilters.statuses] : [],
    suppliers: activeFilters.suppliers ? [...activeFilters.suppliers] : [],
    categories: activeFilters.categories ? [...activeFilters.categories] : [],
    search: activeFilters.search || '',
  }));

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setPending({
        statuses: activeFilters.statuses ? [...activeFilters.statuses] : [],
        suppliers: activeFilters.suppliers ? [...activeFilters.suppliers] : [],
        categories: activeFilters.categories ? [...activeFilters.categories] : [],
        search: activeFilters.search || '',
      });
    }
  }

  // Blur active element inside modal on close
  useEffect(() => {
    if (!isOpen && modalRef.current && modalRef.current.contains(document.activeElement)) {
      document.activeElement?.blur();
    }
  }, [isOpen]);

  // Dynamic live matching result count based on current pending selections (guarded against filtering when closed)
  const matchingCount = useMemo(() => {
    if (!isOpen || !productList || productList.length === 0) return 0;
    return productList.filter((p) => matchesFilters(p, pending)).length;
  }, [isOpen, productList, pending]);

  const toggleArrayItem = (key, val) => {
    setPending((prev) => {
      const exists = prev[key].includes(val);
      const nextList = exists ? prev[key].filter((x) => x !== val) : [...prev[key], val];
      return { ...prev, [key]: nextList };
    });
  };

  const handleClearAll = () => {
    setPending({
      statuses: [],
      suppliers: [],
      categories: [],
      search: '',
    });
  };

  const handleClose = () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    onClose();
  };

  const handleApply = () => {
    onApply(pending);
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Filter Replenishment Inventory"
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      }
      size="lg"
      contentClassName="filter-modal-card"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Button variant="ghost" onClick={handleClearAll}>
            Clear all
          </Button>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApply}
              disabled={matchingCount === 0}
            >
              Show results ({matchingCount})
            </Button>
          </div>
        </div>
      }
    >
          {/* Search Input */}
          <div className="filter-search-row">
            <label htmlFor="filter-modal-search" className="filter-section-title">
              Product Search
            </label>
            <div className="filter-search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="filter-modal-search"
                type="text"
                placeholder="Search by ID, SKU, or product name..."
                value={pending.search}
                onChange={(e) => setPending((prev) => ({ ...prev, search: e.target.value }))}
                className="filter-search-input"
              />
              {pending.search && (
                <button
                  type="button"
                  className="filter-search-clear"
                  onClick={() => setPending((prev) => ({ ...prev, search: '' }))}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="filter-grid">
            {/* Status Group */}
            <div className="filter-group">
              <div className="filter-section-title">Status</div>
              <div className="filter-options-list">
                {[
                  { key: 'critical', label: 'Critical Priority', dotColor: '#dc2626' },
                  { key: 'low', label: 'Low Stock', dotColor: '#d97706' },
                  { key: 'healthy', label: 'Healthy Stock', dotColor: '#16a34a' },
                  { key: 'ordered', label: 'Ordered', dotColor: '#64748b' },
                ].map((st) => (
                  <label key={st.key} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      className="cb"
                      checked={pending.statuses.includes(st.key)}
                      onChange={() => toggleArrayItem('statuses', st.key)}
                    />
                    <span className="filter-chip-dot" style={{ background: st.dotColor }}></span>
                    <span className="filter-chip-label">{st.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Supplier Group */}
            <div className="filter-group">
              <div className="filter-section-title">Suppliers ({suppliers.length})</div>
              <div className="filter-options-list filter-scroll-list">
                {suppliers.map((sup) => (
                  <label key={sup.id} className="filter-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <input
                      type="checkbox"
                      className="cb"
                      checked={pending.suppliers.includes(sup.id)}
                      onChange={() => toggleArrayItem('suppliers', sup.id)}
                    />
                    {SUPPLIER_LOGOS && SUPPLIER_LOGOS[sup.id] && (
                      <img
                        src={SUPPLIER_LOGOS[sup.id]}
                        alt=""
                        decoding="async"
                        style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 3, border: '1px solid #cbd5e1', background: '#fff', padding: 1, flexShrink: 0 }}
                      />
                    )}
                    <span className="filter-chip-label">{sup.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Group */}
            <div className="filter-group">
              <div className="filter-section-title">Categories ({categories.length})</div>
              <div className="filter-options-list filter-scroll-list">
                {categories.map((cat) => (
                  <label key={cat} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      className="cb"
                      checked={pending.categories.includes(cat)}
                      onChange={() => toggleArrayItem('categories', cat)}
                    />
                    <span className="filter-chip-label">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
    </Modal>
  );
}
