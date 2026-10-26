import PropTypes from 'prop-types';

export default function SupplierQueueRail({
  windowWidth,
  sqExpanded,
  handleCollapseSq,
  activeQueueSuppliers = [],
  selectedSupplierId,
  activeQueueSupplierId,
  products = [],
  validateSupplierMoq,
  formatCurrency,
  handleSelectQueueSupplier,
  supplierLogos = {},
  handleOpenManifests,
  handleOpenPOHistory,
  handleOpenContact,
}) {
  if (windowWidth < 768) return null;
  const isSqActive = Boolean(sqExpanded);

  return (
    <aside
      id="collapse-supplier-queue"
      className={`sq ${isSqActive ? 'is-active' : 'is-collapsed'}`}
      aria-label="Supplier Queue"
      aria-hidden={!isSqActive}
      inert={!isSqActive ? true : undefined}
    >
      <div className="sq-inner">
        <div className="sq-head">
        <div className="sq-head-l d-flex align-items-center gap-2">
          <span>Supplier Queue</span>
          <span className="sq-cnt">({activeQueueSuppliers.length})</span>
        </div>
        <button
          id="btn-collapse-sq"
          className="sec-toggle-btn sq-collapse"
          onClick={handleCollapseSq}
          aria-label="Hide Supplier Queue"
          title="Hide Supplier Queue"
        >
          ✕
        </button>
      </div>

      <div className="sq-cards">
        {activeQueueSuppliers.map((sup) => {
          const isActive = sup.id === selectedSupplierId;
          const isFilterActive = activeQueueSupplierId === sup.id;
          const supSelectedItems = products.filter(
            (p) => p.supplierId === sup.id && p.selected && p.orderQty > 0 && p.orderStatus !== 'ordered'
          );
          const supValidation = validateSupplierMoq(sup, supSelectedItems);

          return (
            <div
              key={sup.id}
              className={`sc ${isActive ? 'active' : ''} ${isFilterActive ? 'sc-filter-active' : ''}`}
              onClick={() => handleSelectQueueSupplier(sup.id)}
              tabIndex={0}
              role="button"
              aria-pressed={isActive}
              title={`Select ${sup.name} to view details and filter matrix products`}
            >
              <div className="sc-top">
                <div className="sc-av" style={!supplierLogos[sup.id] ? { background: sup.color } : undefined}>
                  {supplierLogos[sup.id] ? (
                    <img src={supplierLogos[sup.id]} alt={sup.name} />
                  ) : (
                    sup.initials
                  )}
                </div>
                <div className="sc-info">
                  <div className="sc-name">{sup.name}</div>
                  <div className="sc-cat">{sup.category}</div>
                </div>
              </div>

              {/* MOQ threshold progress indicator */}
              <div className="sc-moq-bar">
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: 10, marginBottom: 3 }}>
                  <span>MOQ: {formatCurrency(sup.targetMoq)}</span>
                  <span>{supValidation.isMoqMet ? 'Met' : formatCurrency(supValidation.subtotal)}</span>
                </div>
                <div className="progress-track" style={{ height: 4, background: 'var(--border, #e2e8f0)', borderRadius: 2 }}>
                  <div
                    className="progress-fill"
                    style={{
                      height: '100%',
                      borderRadius: 2,
                      width: `${Math.min(100, (supValidation.subtotal / (sup.targetMoq || 1)) * 100)}%`,
                      background: supValidation.isMoqMet ? '#10b981' : '#f59e0b',
                    }}
                  />
                </div>
              </div>

              <div className="sc-meta">
                <span>Lead time: {sup.leadTime}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sq-qa">
        <div className="sq-qa-title">Quick Actions</div>
        <div className="sq-qa-list">
          <button
            type="button"
            className="sq-qa-btn"
            onClick={handleOpenManifests}
            title="View active inbound manifests"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span>Pending manifests</span>
            <svg className="sq-qa-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            type="button"
            className="sq-qa-btn"
            onClick={handleOpenPOHistory}
            title="View purchase order history"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>PO History</span>
            <svg className="sq-qa-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button
            type="button"
            className="sq-qa-btn"
            onClick={handleOpenContact}
            title="Contact supplier representative"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Contact supplier</span>
            <svg className="sq-qa-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
      </div>
    </aside>
  );
}

SupplierQueueRail.propTypes = {
  windowWidth: PropTypes.number.isRequired,
  sqExpanded: PropTypes.bool.isRequired,
  handleCollapseSq: PropTypes.func.isRequired,
  activeQueueSuppliers: PropTypes.array.isRequired,
  selectedSupplierId: PropTypes.string,
  activeQueueSupplierId: PropTypes.string,
  products: PropTypes.array.isRequired,
  validateSupplierMoq: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  handleSelectQueueSupplier: PropTypes.func.isRequired,
  supplierLogos: PropTypes.object,
  handleOpenManifests: PropTypes.func.isRequired,
  handleOpenPOHistory: PropTypes.func.isRequired,
  handleOpenContact: PropTypes.func.isRequired,
};
