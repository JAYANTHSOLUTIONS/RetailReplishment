import PropTypes from 'prop-types';
import EditIcon from '@mui/icons-material/Edit';
import { ThemeSwitcher } from '../../../components/ui';
import { sanitizeIntegerInput } from '../../../utils/validation';

export default function MobileReplenishmentView({
  mobileView,
  setMobileView,
  selectedSupplierGroups = [],
  expandedDraftSupplierIds = new Set(),
  toggleDraftAccordion,
  overallTotalAmount = 0,
  handleApplyAllDraftMinimums,
  allSelectedItems = [],
  handleDraftQtyChange,
  handleRemoveItemFromDraft,
  handlePromptCancel,
  handlePromptSaveDraft,
  handlePromptSubmitPO,
  isDispatching = false,
  setFilterModalOpen,
  hasActiveFilters = false,
  activeFilterCount = 0,
  mobileMatrixMenuRef,
  mobileMatrixMenuOpen,
  setMobileMatrixMenuOpen,
  setAddProductModalOpen,
  setAddSupplierModalOpen,
  setShortcutsModalOpen,
  themePreference,
  handleSelectTheme,
  isAllFilteredSelected = false,
  handleClearAllSelections,
  handleSelectAllFiltered,
  handleApplySupplierMinimums,
  isEffectiveLoading = false,
  effectiveDbError,
  isEffectiveEmpty = false,
  setAppliedFilters,
  setActiveQueueSupplierId,
  setSearchTerm,
  paginatedProducts = [],
  displayProducts = [],
  totalProductsCount = 0,
  suppliersMap = {},
  pendingQtyEdits = {},
  handleToggleSelect,
  editingSku,
  setEditingSku,
  editQtyValue,
  setEditQtyValue,
  handleMobileCardQtyChange,
  onEditProduct = () => {},
  formatCurrency,
  supplierLogos = {},
  pageSize,
  handlePageSizeChange,
  totalItems,
  startIndex,
  endIndex,
  currentPage,
  handlePageChange,
  pageNumbers = [],
  totalPages,
}) {
  if (mobileView === 'draft') {
    return (
      <div className="mobile-draft-page">
        {/* Header with Back button */}
        <div className="mobile-draft-header">
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="mobile-draft-back-btn"
              onClick={() => {
                setMobileView('matrix');
                window.scrollTo(0, 0);
              }}
              aria-label="Return to Catalog Matrix"
              title="Return to Replenishment Matrix"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="mobile-draft-title">PO Draft Queue</h1>
          </div>
          <span className="mobile-draft-badge-pill">
            {selectedSupplierGroups.length} {selectedSupplierGroups.length === 1 ? 'Supplier' : 'Suppliers'} • {allSelectedItems.length} SKUs
          </span>
        </div>

        {/* Body Content */}
        <div className="mobile-draft-body">
          {selectedSupplierGroups.length === 0 ? (
            <div className="mobile-draft-empty">
              <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
              <h3>No supplier drafts in queue</h3>
              <p>Select products from the matrix catalog to generate purchase orders.</p>
              <button
                type="button"
                className="btn-mobile-return"
                onClick={() => {
                  setMobileView('matrix');
                  window.scrollTo(0, 0);
                }}
              >
                ← Back to Replenishment Matrix
              </button>
            </div>
          ) : (
            <div className="mobile-draft-list">
              {selectedSupplierGroups.map((group) => {
                const sup = group.supplier;
                const v = group.validation;
                const isAccordionOpen = expandedDraftSupplierIds.has(sup.id);
                const moqTarget = Number(sup.targetMoq ?? sup.target_moq) || 0;
                const unitThreshold = Number(sup.unitThreshold ?? sup.unit_threshold) || 0;
                const moqPercent = Math.min(100, Math.round((group.subtotal / (moqTarget || 1)) * 100));
                const unitsPercent = Math.min(100, Math.round((group.totalUnits / (unitThreshold || 1)) * 100));

                return (
                  <div key={sup.id} className="mobile-draft-supplier-card">
                    {/* Accordion Header */}
                    <div
                      className={`mds-header ${isAccordionOpen ? 'open' : ''}`}
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
                      <div className="mds-header-left">
                        {supplierLogos[sup.id] ? (
                          <img src={supplierLogos[sup.id]} alt="" className="mds-sup-logo" />
                        ) : (
                          <div className="mds-sup-avatar" style={{ background: sup.color || 'var(--brand)' }}>
                            {sup.initials || sup.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="mds-sup-info">
                          <div className="mds-sup-name">{sup.name}</div>
                          <div className="mds-sup-sub">
                            {group.items.length} {group.items.length === 1 ? 'item' : 'items'} • {group.totalUnits} units • {formatCurrency(group.subtotal)}
                          </div>
                        </div>
                      </div>

                      <div className="mds-header-right">
                        <span className={`mds-status-pill ${v.valid ? 'valid' : 'warning'}`}>
                          {v.valid ? '✔ MOQ Met' : `⚠️ ${formatCurrency(v.remainingAmount)} left`}
                        </span>
                        <span className={`mds-chevron ${isAccordionOpen ? 'rotated' : ''}`} aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Accordion Content */}
                    {isAccordionOpen && (
                      <div className="mds-body">
                        {/* MOQ Threshold Checklist */}
                        <div className={`mds-checklist ${v.valid ? 'pass' : 'fail'}`}>
                          <div className="mds-check-row">
                            <span className={`mds-check-icon ${v.isMoqMet ? 'pass' : 'fail'}`}>
                              {v.isMoqMet ? '✔' : '✖'}
                            </span>
                            <span className="mds-check-text">
                              <strong>Value:</strong> {formatCurrency(group.subtotal)} / {formatCurrency(moqTarget)} ({moqPercent}%)
                              {v.isMoqMet ? ' — Met' : ` (${formatCurrency(v.remainingAmount)} remaining)`}
                            </span>
                          </div>
                          <div className="mds-check-row">
                            <span className={`mds-check-icon ${v.isUnitsMet ? 'pass' : 'fail'}`}>
                              {v.isUnitsMet ? '✔' : '✖'}
                            </span>
                            <span className="mds-check-text">
                              <strong>Units:</strong> {group.totalUnits} / {unitThreshold} ({unitsPercent}%)
                              {v.isUnitsMet ? ' — Met' : ` (${v.remainingUnits} units needed)`}
                            </span>
                          </div>
                          {!v.valid && (
                            <div className="mds-alert-msg">
                              ⚠️ {formatCurrency(v.remainingAmount)} more required to meet the supplier minimum
                            </div>
                          )}
                        </div>

                        {/* Items List */}
                        <div className="mds-items-box">
                          <div className="mds-items-header">
                            <span>ITEM / SKU</span>
                            <span style={{ textAlign: 'center' }}>QTY</span>
                            <span style={{ textAlign: 'right' }}>TOTAL</span>
                            <span style={{ width: 20 }}></span>
                          </div>
                          {group.items.map((item) => {
                            const lineTotal = item.orderQty * item.unitCost;
                            return (
                              <div key={item.id} className="mds-item-row">
                                <div className="mds-item-info">
                                  <div className="mds-item-name" title={item.name}>{item.name}</div>
                                  <div className="mds-item-sku">{item.sku} • {formatCurrency(item.unitCost)}</div>
                                </div>
                                <div className="mds-item-stepper">
                                  <button
                                    type="button"
                                    className="mds-step-btn"
                                    onClick={() => handleDraftQtyChange(item, -1)}
                                    aria-label="Decrease quantity"
                                  >
                                    -
                                  </button>
                                  <span className="mds-step-val">{item.orderQty}</span>
                                  <button
                                    type="button"
                                    className="mds-step-btn"
                                    onClick={() => handleDraftQtyChange(item, 1)}
                                    aria-label="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="mds-item-total">{formatCurrency(lineTotal)}</div>
                                <button
                                  type="button"
                                  className="mds-item-remove"
                                  onClick={() => handleRemoveItemFromDraft(item)}
                                  title={`Remove ${item.name}`}
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Financial Subtotal */}
                        <div className="mds-subtotal-panel">
                          <div className="mds-subtotal-row">
                            <span>Subtotal ({group.items.length} SKUs):</span>
                            <strong>{formatCurrency(group.subtotal)}</strong>
                          </div>
                          <div className="mds-tax-row">
                            <span>Tax &amp; Freight:</span>
                            <span>Included</span>
                          </div>
                        </div>

                        {/* Supplier Actions */}
                        <div className="mds-actions-row">
                          <button
                            type="button"
                            className="mds-btn-clear"
                            onClick={() => handlePromptCancel(sup.id)}
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            className="mds-btn-save"
                            onClick={() => handlePromptSaveDraft(sup.id)}
                            disabled={isDispatching}
                          >
                            Save Draft
                          </button>
                          <button
                            type="button"
                            className={`mds-btn-dispatch ${!v.valid || isDispatching ? 'disabled' : ''}`}
                            onClick={() => handlePromptSubmitPO(sup.id)}
                            disabled={!v.valid || isDispatching}
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

        {/* Sticky Bottom Bar on Mobile Draft Page */}
        <div className="mobile-sticky-footer">
          <div className="msf-content">
            <div className="msf-left">
              <div className="msf-title-row">
                <span className="msf-dot">●</span>
                <span>Total Queue ({selectedSupplierGroups.length} Suppliers)</span>
              </div>
              <div className="msf-total-row">
                <strong style={{ fontSize: 18 }}>{formatCurrency(overallTotalAmount)}</strong>
              </div>
            </div>
            <button
              type="button"
              className="msf-apply-btn"
              onClick={handleApplyAllDraftMinimums}
            >
              <span>Apply Minimums</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── MOBILE REPLENISHMENT MATRIX CARD VIEW ─── */
  return (
    <div className="mobile-matrix-page">
      {/* Header: Title + Filter Button + 3-Dot Actions & Theme Menu */}
      <div className="mobile-matrix-header">
        <div className="mobile-matrix-titles">
          <h1 className="mobile-matrix-h1">Replenishment Matrix</h1>
          <span className="mobile-matrix-sub">
            Showing {displayProducts.length} of {totalProductsCount} products
          </span>
        </div>
        <div className="mobile-matrix-header-actions d-flex align-items-center gap-2">
          <button
            type="button"
            className={`mobile-filter-btn ${hasActiveFilters ? 'active' : ''}`}
            onClick={() => setFilterModalOpen(true)}
            aria-label="Open filter modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="mobile-filter-badge">{activeFilterCount}</span>
            )}
          </button>

          {/* 3-Dot Dropdown Menu next to Filter icon */}
          <div className="mobile-matrix-menu-wrap position-relative" ref={mobileMatrixMenuRef}>
            <button
              type="button"
              className={`mobile-matrix-three-dots ${mobileMatrixMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMatrixMenuOpen((prev) => !prev)}
              aria-label="More actions and settings"
              aria-haspopup="true"
              aria-expanded={mobileMatrixMenuOpen}
              title="Actions & Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="19" r="1.5" fill="currentColor" />
              </svg>
            </button>

            {mobileMatrixMenuOpen && (
              <div className="mobile-actions-dropdown" role="menu">
                <button
                  type="button"
                  className="mobile-action-item"
                  onClick={() => {
                    setMobileMatrixMenuOpen(false);
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
                    setMobileMatrixMenuOpen(false);
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

                <button
                  type="button"
                  className="mobile-action-item"
                  onClick={() => {
                    setMobileMatrixMenuOpen(false);
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

                <div className="mobile-action-sep" />

                {/* Theme Switcher inside 3-dot dropdown */}
                <div className="mobile-dropdown-theme-section">
                  <span className="mobile-dropdown-theme-title">Theme</span>
                  <ThemeSwitcher
                    value={themePreference}
                    onChange={handleSelectTheme}
                    className="dropdown-theme-switcher"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selection & Minimums Toolbar */}
      <div className="mobile-selection-bar">
        <label className="mobile-select-all-label">
          <input
            type="checkbox"
            checked={isAllFilteredSelected}
            onChange={isAllFilteredSelected ? handleClearAllSelections : handleSelectAllFiltered}
            className="mobile-chk-input"
            aria-label="Select all products"
          />
          <span>Select All ({displayProducts.length})</span>
        </label>
        <button
          type="button"
          className="mobile-btn-apply-minimums"
          onClick={handleApplySupplierMinimums}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Apply Minimums</span>
        </button>
      </div>

      {/* Content: Loading, Error, Empty, or Cards */}
      {isEffectiveLoading ? (
        <div className="state-box" role="status" aria-live="polite">
          <div className="loading-spinner" />
          <h3 className="state-title">Loading inventory catalog...</h3>
        </div>
      ) : effectiveDbError ? (
        <div className="state-box error-box" role="alert">
          <div className="state-icon">⚠️</div>
          <h3 className="state-title">Database Error</h3>
          <p className="state-body">{effectiveDbError}</p>
        </div>
      ) : isEffectiveEmpty ? (
        <div className="state-box" role="status">
          <div className="state-icon">🔍</div>
          <h3 className="state-title">No Matching Products</h3>
          <p className="state-body">No products found matching your active filter criteria.</p>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn-retry"
              onClick={() => {
                setAppliedFilters({ statuses: [], suppliers: [], categories: [], search: '' });
                setActiveQueueSupplierId(null);
                setSearchTerm('');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Product Cards List */}
          <div className="mobile-product-cards-list">
            {paginatedProducts.map((prod) => {
              const sup = suppliersMap[prod.supplierId];
              const numericQty = Number(pendingQtyEdits[prod.sku] !== undefined ? pendingQtyEdits[prod.sku] : prod.orderQty) || 0;
              const lineSubtotal = numericQty * prod.unitCost;
              const isCritical = prod.priority === 'critical' || prod.status === 'critical';
              const isLow = prod.priority === 'low' || prod.status === 'low';
              const isHealthy = prod.priority === 'healthy' || prod.status === 'healthy';

              return (
                <div
                  key={prod.id}
                  className={`mobile-product-card ${prod.selected ? 'selected' : ''}`}
                >
                  {/* Top: Checkbox, SKU pill, and Status */}
                  <div className="mpc-top">
                    <div className="mpc-chk-sku">
                      <input
                        type="checkbox"
                        checked={!!prod.selected}
                        onChange={() => handleToggleSelect(prod.id)}
                        className="mobile-chk-input"
                        aria-label={`Select ${prod.name}`}
                      />
                      <span className="mpc-sku-badge">{prod.sku}</span>
                    </div>
                    <span className={`mpc-status-badge ${isCritical ? 'critical' : isLow ? 'low' : isHealthy ? 'healthy' : 'excess'}`}>
                      ● {isCritical ? 'Critical' : isLow ? 'Low' : isHealthy ? 'Healthy' : 'Excess'}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="mpc-title">{prod.name}</div>

                  {/* Supplier & Category */}
                  <div className="mpc-supplier-row">
                    {supplierLogos[prod.supplierId] ? (
                      <img src={supplierLogos[prod.supplierId]} alt="" className="mpc-sup-logo" />
                    ) : (
                      <span className="mpc-sup-dot" style={{ background: sup?.color || 'var(--brand)' }}>
                        {sup?.initials || prod.supplierId.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="mpc-sup-name">{sup?.name || prod.supplierId}</span>
                    <span className="mpc-sep">•</span>
                    <span className="mpc-cat-name">{prod.category}</span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="mpc-metrics-grid">
                    <div className="mpc-metric">
                      <span className="mpc-metric-lbl">Stock:</span>
                      <strong className="mpc-metric-val">{prod.currentStock}</strong>
                    </div>
                    <div className="mpc-metric">
                      <span className="mpc-metric-lbl">Safety Target:</span>
                      <strong className="mpc-metric-val">{prod.safetyTarget}</strong>
                    </div>
                  </div>

                  {/* Bottom: Qty Stepper and Line Total */}
                  <div className="mpc-bottom-row">
                    <div className="mpc-qty-control">
                      <span className="mpc-qty-lbl">Order Qty:</span>
                      <div className="mpc-stepper">
                        <button
                          type="button"
                          className="mpc-stepper-btn"
                          onClick={() => handleMobileCardQtyChange(prod, -1)}
                          disabled={numericQty <= 0}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="mpc-stepper-input"
                          value={editingSku === prod.sku ? editQtyValue : numericQty}
                          onFocus={() => {
                            setEditingSku(prod.sku);
                            setEditQtyValue(String(numericQty));
                          }}
                          onChange={(e) => {
                            const sanitized = sanitizeIntegerInput(e.target.value, 5);
                            setEditQtyValue(sanitized);
                          }}
                          onBlur={() => {
                            if (editingSku === prod.sku) {
                              const val = parseInt(editQtyValue, 10);
                              const finalVal = isNaN(val) ? 0 : Math.max(0, val);
                              handleMobileCardQtyChange(prod, finalVal - numericQty);
                              setEditingSku(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.target.blur();
                          }}
                          aria-label={`Order quantity for ${prod.name}`}
                        />
                        <button
                          type="button"
                          className="mpc-stepper-btn"
                          onClick={() => handleMobileCardQtyChange(prod, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="mpc-price-wrapper">
                      <span className="mpc-unit-price">Unit: {formatCurrency(prod.unitCost)}</span>
                      <span className="mpc-line-total">{formatCurrency(lineSubtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                      <button
                        type="button"
                        className="btn-inline-edit"
                        onClick={() => onEditProduct && onEditProduct(prod)}
                        style={{ minHeight: 28, padding: '3px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center' }}
                      >
                        <EditIcon style={{ fontSize: 13, marginRight: 3 }} /> Edit Product
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mobile-pager">
            <div className="mobile-pager-info-row">
              <div className="mobile-pager-size">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  className="mobile-pager-select"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <span className="mobile-pager-count">
                Showing {totalItems === 0 ? 0 : startIndex + 1}–{endIndex} of {totalItems}
              </span>
            </div>
            <div className="mobile-pager-buttons">
              <button
                type="button"
                className="mobile-pager-btn"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                aria-label="Previous page"
              >
                ‹
              </button>
              {pageNumbers.map((pNum, idx) => (
                pNum === '...' ? (
                  <span key={`el-${idx}`} className="mobile-pager-ellipsis">…</span>
                ) : (
                  <button
                    type="button"
                    key={pNum}
                    className={`mobile-pager-btn ${currentPage === pNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pNum)}
                  >
                    {pNum}
                  </button>
                )
              ))}
              <button
                type="button"
                className="mobile-pager-btn"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sticky Bottom Bar on Matrix */}
      <div className="mobile-sticky-footer">
        <div className="msf-content">
          <div className="msf-left">
            <div className="msf-title-row">
              <span className="msf-dot">●</span>
              <span>PO Draft Queue ({allSelectedItems.length} items)</span>
            </div>
            <div className="msf-total-row">
              <span>Total:</span>
              <strong>{formatCurrency(overallTotalAmount)}</strong>
            </div>
          </div>
          <button
            type="button"
            className="msf-review-btn"
            onClick={() => {
              setMobileView('draft');
              window.scrollTo(0, 0);
            }}
          >
            <span>Review PO</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

MobileReplenishmentView.propTypes = {
  mobileView: PropTypes.string.isRequired,
  setMobileView: PropTypes.func.isRequired,
  selectedSupplierGroups: PropTypes.array,
  expandedDraftSupplierIds: PropTypes.instanceOf(Set),
  toggleDraftAccordion: PropTypes.func.isRequired,
  overallTotalAmount: PropTypes.number,
  handleApplyAllDraftMinimums: PropTypes.func.isRequired,
  allSelectedItems: PropTypes.array,
  handleDraftQtyChange: PropTypes.func.isRequired,
  handleRemoveItemFromDraft: PropTypes.func.isRequired,
  handlePromptCancel: PropTypes.func.isRequired,
  handlePromptSaveDraft: PropTypes.func.isRequired,
  handlePromptSubmitPO: PropTypes.func.isRequired,
  isDispatching: PropTypes.bool,
  setFilterModalOpen: PropTypes.func.isRequired,
  hasActiveFilters: PropTypes.bool,
  activeFilterCount: PropTypes.number,
  mobileMatrixMenuRef: PropTypes.object,
  mobileMatrixMenuOpen: PropTypes.bool,
  setMobileMatrixMenuOpen: PropTypes.func.isRequired,
  setAddProductModalOpen: PropTypes.func.isRequired,
  setAddSupplierModalOpen: PropTypes.func.isRequired,
  setShortcutsModalOpen: PropTypes.func.isRequired,
  themePreference: PropTypes.string.isRequired,
  handleSelectTheme: PropTypes.func.isRequired,
  isAllFilteredSelected: PropTypes.bool,
  handleClearAllSelections: PropTypes.func.isRequired,
  handleSelectAllFiltered: PropTypes.func.isRequired,
  handleApplySupplierMinimums: PropTypes.func.isRequired,
  isEffectiveLoading: PropTypes.bool,
  effectiveDbError: PropTypes.string,
  isEffectiveEmpty: PropTypes.bool,
  setAppliedFilters: PropTypes.func.isRequired,
  setActiveQueueSupplierId: PropTypes.func.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  paginatedProducts: PropTypes.array,
  displayProducts: PropTypes.array,
  totalProductsCount: PropTypes.number,
  suppliersMap: PropTypes.object,
  pendingQtyEdits: PropTypes.object,
  handleToggleSelect: PropTypes.func.isRequired,
  editingSku: PropTypes.string,
  setEditingSku: PropTypes.func.isRequired,
  editQtyValue: PropTypes.string,
  setEditQtyValue: PropTypes.func.isRequired,
  handleMobileCardQtyChange: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  supplierLogos: PropTypes.object,
  pageSize: PropTypes.number.isRequired,
  handlePageSizeChange: PropTypes.func.isRequired,
  totalItems: PropTypes.number.isRequired,
  startIndex: PropTypes.number.isRequired,
  endIndex: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  handlePageChange: PropTypes.func.isRequired,
  pageNumbers: PropTypes.array.isRequired,
  totalPages: PropTypes.number.isRequired,
};
