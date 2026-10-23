import PropTypes from 'prop-types';

export default function SupplierQueueRail({
  windowWidth,
  sqExpanded,
  setSqExpanded,
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

  return (
    <aside
      id="collapse-supplier-queue"
      className={`sq collapse-horizontal ${!sqExpanded ? 'is-collapsed' : ''}`}
      aria-label="Supplier Queue"
    >
      <div
        className="collapsed-rail"
        onClick={() => setSqExpanded(true)}
        title="Click to expand Supplier Queue"
      >
        <button
          id="btn-expand-sq"
          className="collapsed-rail-btn"
          onClick={(e) => {
            e.stopPropagation();
            setSqExpanded(true);
          }}
          aria-label="Expand Supplier Queue"
          aria-expanded={sqExpanded}
          aria-controls="collapse-supplier-queue"
        >
          »
        </button>
        <span className="collapsed-rail-txt">
          Supplier Queue ({activeQueueSuppliers.length})
        </span>
      </div>

      <div
        className="collapse-horizontal-inner"
        inert={!sqExpanded ? true : undefined}
      >
        <div className="sq-head">
          <div className="sq-head-l d-flex align-items-center gap-2">
            <span>Supplier Queue</span>
            <span className="sq-cnt">({activeQueueSuppliers.length})</span>
          </div>
          <button
            id="btn-collapse-sq"
            className="sec-toggle-btn"
            onClick={handleCollapseSq}
            aria-label="Collapse Supplier Queue"
            title="Collapse Supplier Queue"
            aria-expanded={sqExpanded}
            aria-controls="collapse-supplier-queue"
          >
            «
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
                    <span className="sc-name">{sup.name}</span>
                    <span className="sc-cat">{sup.category}</span>
                  </div>
                  <div className="sc-chev">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>

                {supSelectedItems.length === 0 ? (
                  <div className="sc-meta mt-2">
                    <span className="sc-meta-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Lead Time: {sup.leadTime}
                    </span>
                    <span className="sc-meta-item">
                      MOQ: {formatCurrency(sup.targetMoq)}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="sc-bar">
                      <div
                        className={`sc-bar-fill ${supValidation.isMoqMet ? 'green' : 'amber'}`}
                        style={{
                          width: `${Math.min(100, Math.round((supValidation.subtotal / (sup.targetMoq || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="sc-val">
                      <span className="sc-curr">{formatCurrency(supValidation.subtotal)}</span>
                      <span className="sc-target">
                        / {formatCurrency(sup.targetMoq)}{' '}
                        {supValidation.isMoqMet
                          ? '(MOQ Met)'
                          : `(${formatCurrency(supValidation.remainingAmount)} remaining)`}
                      </span>
                    </div>
                    <div className="sc-meta">
                      <span className="sc-meta-item">
                        <span
                          style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: supValidation.isMoqMet ? '#10b981' : '#d97706',
                          }}
                        />
                        {supSelectedItems.length} items Selected
                      </span>
                      <span className="sc-meta-item">
                        Lead Time: {sup.leadTime}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions in Left Panel */}
        <div className="sq-qa">
          <div className="sq-qa-title">Quick Actions</div>
          <button className="sq-qa-btn" onClick={handleOpenManifests}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span>View pending manifests</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button className="sq-qa-btn" onClick={handleOpenPOHistory}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>PO history</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button className="sq-qa-btn" onClick={handleOpenContact}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Contact supplier</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

SupplierQueueRail.propTypes = {
  windowWidth: PropTypes.number.isRequired,
  sqExpanded: PropTypes.bool.isRequired,
  setSqExpanded: PropTypes.func.isRequired,
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
