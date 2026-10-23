import PropTypes from 'prop-types';

export default function OrderDraftPanel({
  windowWidth,
  draftExpanded,
  setDraftExpanded,
  handleCollapseDraft,
  allSelectedItems = [],
  selectedSupplierGroups = [],
  expandedDraftSupplierIds = new Set(),
  toggleDraftAccordion,
  supplierLogos = {},
  formatCurrency,
  handleDraftQtyChange,
  handleRemoveItemFromDraft,
  handlePromptCancel,
  handlePromptSaveDraft,
  handlePromptSubmitPO,
  isDispatching = false,
}) {
  if (windowWidth < 768) return null;

  return (
    <aside
      id="collapse-po-draft"
      className={`po collapse-horizontal ${!draftExpanded ? 'is-collapsed' : ''}`}
      aria-label="Purchase Order Draft & Supplier Review Summary"
    >
      <div
        className="collapsed-rail"
        onClick={() => setDraftExpanded(true)}
        title="Click to expand Purchase Order Draft"
      >
        <button
          id="btn-expand-draft"
          className="collapsed-rail-btn"
          onClick={(e) => {
            e.stopPropagation();
            setDraftExpanded(true);
          }}
          aria-label="Expand Purchase Order Draft"
          aria-expanded={draftExpanded}
          aria-controls="collapse-po-draft"
        >
          «
        </button>
        <span className="collapsed-rail-txt">
          PO Draft Queue ({allSelectedItems.length})
        </span>
      </div>

      <div
        className="collapse-horizontal-inner"
        inert={!draftExpanded ? true : undefined}
      >
        <div className="po-head">
          <div className="po-head-l d-flex align-items-center gap-2">
            <span className="po-title">PO Draft Queue</span>
            <span
              style={{
                background: 'var(--brand-bg, rgba(56, 139, 253, 0.15))',
                color: 'var(--brand, #2563eb)',
                border: '1px solid var(--brand-border, rgba(56, 139, 253, 0.4))',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {selectedSupplierGroups.length} {selectedSupplierGroups.length === 1 ? 'Supplier' : 'Suppliers'} • {allSelectedItems.length} SKUs
            </span>
          </div>
          <button
            id="btn-collapse-draft"
            className="sec-toggle-btn"
            onClick={handleCollapseDraft}
            aria-label="Collapse Purchase Order Draft"
            title="Collapse Purchase Order Draft"
            aria-expanded={draftExpanded}
            aria-controls="collapse-po-draft"
          >
            »
          </button>
        </div>

        <div className="po-scroll-content">
          {selectedSupplierGroups.length === 0 ? (
            <div className="po-sec">
              <div className="po-empty text-center" style={{ padding: '48px 16px' }}>
                <div className="po-empty-icon mb-3" style={{ fontSize: 32 }}>📋</div>
                <div className="mb-2 fw-bold" style={{ fontSize: 14, color: 'var(--text)' }}>
                  No supplier drafts in queue
                </div>
                <div className="po-empty-txt">
                  Select product checkboxes from the matrix to build supplier purchase orders.
                </div>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3 p-3">
              {selectedSupplierGroups.map((group) => {
                const sup = group.supplier;
                const v = group.validation;
                const isAccordionOpen = expandedDraftSupplierIds.has(sup.id);
                const moqTarget = Number(sup.targetMoq ?? sup.target_moq) || 0;
                const unitThreshold = Number(sup.unitThreshold ?? sup.unit_threshold) || 0;
                const moqPercent = Math.min(100, Math.round((group.subtotal / (moqTarget || 1)) * 100));
                const unitsPercent = Math.min(100, Math.round((group.totalUnits / (unitThreshold || 1)) * 100));

                return (
                  <div key={sup.id} className="draft-accordion-card">
                    {/* Accordion Header */}
                    <div
                      className={`draft-accordion-header ${isAccordionOpen ? 'is-open' : ''}`}
                      onClick={() => toggleDraftAccordion(sup.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleDraftAccordion(sup.id);
                        }
                      }}
                    >
                      <div className="draft-header-brand">
                        {supplierLogos[sup.id] ? (
                          <img
                            src={supplierLogos[sup.id]}
                            alt=""
                            className="draft-supplier-logo"
                          />
                        ) : (
                          <div
                            className="draft-supplier-avatar"
                            style={{
                              background: sup.color || 'var(--brand)',
                            }}
                          >
                            {sup.initials || sup.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="draft-header-titles">
                          <div
                            className="draft-supplier-name"
                            title={sup.name}
                          >
                            {sup.name}
                          </div>
                          <div className="draft-supplier-meta">
                            {group.items.length} {group.items.length === 1 ? 'item' : 'items'} • {group.totalUnits} units • {formatCurrency(group.subtotal)}
                          </div>
                        </div>
                      </div>

                      <div className="draft-header-controls">
                        <span
                          className={`draft-moq-pill ${v.valid ? 'valid' : 'pending'}`}
                        >
                          {v.valid ? '✔ MOQ Met' : `⚠️ ${formatCurrency(v.remainingAmount)} left`}
                        </span>
                        <span
                          className={`draft-accordion-chevron ${isAccordionOpen ? 'rotated' : ''}`}
                          aria-hidden="true"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Accordion Body */}
                    {isAccordionOpen && (
                      <div className="draft-accordion-body">
                        {/* Minimum Threshold Checklist */}
                        <div className={`po-checklist ${group.items.length === 0 ? '' : v.valid ? 'pass' : 'fail'}`} style={{ padding: '8px 10px' }}>
                          <div className="po-check">
                            <span className={`po-check-ic ${v.isMoqMet ? 'pass' : 'fail'}`}>
                              {v.isMoqMet ? '✔' : '✖'}
                            </span>
                            <span style={{ fontSize: 11 }}>
                              Value: {formatCurrency(group.subtotal)} / {formatCurrency(moqTarget)} ({moqPercent}%)
                              {v.isMoqMet ? ' — Met' : ` (${formatCurrency(v.remainingAmount)} remaining)`}
                            </span>
                          </div>
                          <div className="po-check">
                            <span className={`po-check-ic ${v.isUnitsMet ? 'pass' : 'fail'}`}>
                              {v.isUnitsMet ? '✔' : '✖'}
                            </span>
                            <span style={{ fontSize: 11 }}>
                              Units: {group.totalUnits} / {unitThreshold} ({unitsPercent}%)
                              {v.isUnitsMet ? ' — Met' : ` (${v.remainingUnits} units needed)`}
                            </span>
                          </div>

                          {!v.valid && (
                            <div className="mt-1">
                              <span style={{ fontSize: 10, color: '#d97706', fontWeight: 600 }}>
                                ⚠️ {v.message}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Selected Items for this Supplier (Scrollable list with sticky header) */}
                        <div
                          className="draft-items-list-container"
                          style={{
                            maxHeight: 130,
                            overflowY: 'auto',
                            overflowX: 'auto',
                            border: '1px solid var(--border-light)',
                            borderRadius: 6,
                            background: 'var(--bg)',
                          }}
                        >
                          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                            <thead>
                              <tr
                                style={{
                                  position: 'sticky',
                                  top: 0,
                                  background: 'var(--surface)',
                                  borderBottom: '1px solid var(--border)',
                                  color: 'var(--text3)',
                                  textAlign: 'left',
                                  zIndex: 2,
                                }}
                              >
                                <th style={{ padding: '6px 4px', fontWeight: 600 }}>Item / SKU</th>
                                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                                <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>Total</th>
                                <th style={{ padding: '6px 4px', textAlign: 'center', width: 22 }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((item) => {
                                const effectiveQty = item.orderQty;
                                const lineSub = effectiveQty * item.unitCost;
                                return (
                                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <td style={{ padding: '5px 4px' }}>
                                      <div
                                        className="text-truncate fw-semibold"
                                        style={{ color: 'var(--text)', maxWidth: 110 }}
                                        title={item.name}
                                      >
                                        {item.name}
                                      </div>
                                      <div className="text-muted" style={{ fontSize: 10 }}>
                                        {item.sku} • {formatCurrency(item.unitCost)}
                                      </div>
                                    </td>
                                    <td className="text-center" style={{ padding: '5px 4px', whiteSpace: 'nowrap' }}>
                                      <div className="d-inline-flex align-items-center" style={{ gap: 3 }}>
                                        <button
                                          type="button"
                                          className="draft-qty-btn"
                                          onClick={() => handleDraftQtyChange(item, -1)}
                                          title="Decrease quantity"
                                          aria-label="Decrease quantity"
                                        >
                                          -
                                        </button>
                                        <span
                                          className="text-center fw-bold"
                                          style={{ minWidth: 20, color: 'var(--text)' }}
                                        >
                                          {effectiveQty}
                                        </span>
                                        <button
                                          type="button"
                                          className="draft-qty-btn"
                                          onClick={() => handleDraftQtyChange(item, 1)}
                                          title="Increase quantity"
                                          aria-label="Increase quantity"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </td>
                                    <td className="text-end fw-bold" style={{ padding: '5px 4px', color: 'var(--brand)', whiteSpace: 'nowrap' }}>
                                      {formatCurrency(lineSub)}
                                    </td>
                                    <td className="text-center" style={{ padding: '5px 2px' }}>
                                      <button
                                        type="button"
                                        className="draft-item-remove-btn"
                                        onClick={() => handleRemoveItemFromDraft(item)}
                                        title={`Remove ${item.name} from draft`}
                                        aria-label={`Remove ${item.name} from draft`}
                                      >
                                        ✕
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Supplier Financial Subtotal */}
                        <div style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 10px', fontSize: 11 }}>
                          <div className="d-flex justify-content-between mb-1" style={{ color: 'var(--text2)' }}>
                            <span>Subtotal ({group.items.length} SKUs):</span>
                            <span className="fw-bold" style={{ color: 'var(--text)' }}>{formatCurrency(group.subtotal)}</span>
                          </div>
                          <div className="d-flex justify-content-between text-muted" style={{ fontSize: 10 }}>
                            <span>Tax &amp; Freight:</span>
                            <span>Included</span>
                          </div>
                        </div>

                        {/* Supplier Individual Action Buttons matching image */}
                        <div className="draft-actions-container">
                          <button
                            type="button"
                            className="draft-btn-clear"
                            onClick={() => handlePromptCancel(sup.id)}
                            title={`Clear draft for ${sup.name}`}
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            className="draft-btn-save"
                            onClick={() => handlePromptSaveDraft(sup.id)}
                            disabled={isDispatching}
                            title={`Save ${sup.name} draft to database`}
                          >
                            Save Draft
                          </button>
                          <button
                            type="button"
                            className={`draft-btn-dispatch ${!v.valid || isDispatching ? 'disabled' : ''}`}
                            onClick={() => handlePromptSubmitPO(sup.id)}
                            disabled={!v.valid || isDispatching}
                            title={!v.valid ? v.message : `Dispatch PO for ${sup.name}`}
                          >
                            {isDispatching ? 'Dispatching...' : 'Dispatch PO →'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

OrderDraftPanel.propTypes = {
  windowWidth: PropTypes.number.isRequired,
  draftExpanded: PropTypes.bool.isRequired,
  setDraftExpanded: PropTypes.func.isRequired,
  handleCollapseDraft: PropTypes.func.isRequired,
  allSelectedItems: PropTypes.array.isRequired,
  selectedSupplierGroups: PropTypes.array.isRequired,
  expandedDraftSupplierIds: PropTypes.instanceOf(Set).isRequired,
  toggleDraftAccordion: PropTypes.func.isRequired,
  supplierLogos: PropTypes.object,
  formatCurrency: PropTypes.func.isRequired,
  handleDraftQtyChange: PropTypes.func.isRequired,
  handleRemoveItemFromDraft: PropTypes.func.isRequired,
  handlePromptCancel: PropTypes.func.isRequired,
  handlePromptSaveDraft: PropTypes.func.isRequired,
  handlePromptSubmitPO: PropTypes.func.isRequired,
  isDispatching: PropTypes.bool,
};
