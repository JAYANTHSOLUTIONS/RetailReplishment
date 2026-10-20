import { useState, useMemo } from 'react';

export default function BulkEditModal({
  isOpen,
  onClose,
  selectedProducts = [],
  categories = [],
  onApplyBulkEdit,
}) {
  const [enableOrderQty, setEnableOrderQty] = useState(false);
  const [orderQtyMode, setOrderQtyMode] = useState('set'); // 'set' | 'increase' | 'deficit'
  const [orderQtyValue, setOrderQtyValue] = useState('50');

  const [enableSafetyTarget, setEnableSafetyTarget] = useState(false);
  const [safetyTargetValue, setSafetyTargetValue] = useState('60');

  const [enableCategory, setEnableCategory] = useState(false);
  const [categoryValue, setCategoryValue] = useState(categories[0] || '');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Separate eligible (non-ordered) from ineligible (already ordered) products
  const { eligibleProducts, orderedCount } = useMemo(() => {
    const eligible = selectedProducts.filter((p) => p.orderStatus !== 'ordered');
    const ordered = selectedProducts.filter((p) => p.orderStatus === 'ordered');
    return {
      eligibleProducts: eligible,
      orderedCount: ordered.length,
    };
  }, [selectedProducts]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!enableOrderQty && !enableSafetyTarget && !enableCategory) {
      setErrorMsg('Please select at least one field to update.');
      return;
    }

    const updates = {};

    if (enableOrderQty) {
      if (orderQtyMode !== 'deficit') {
        const val = parseInt(orderQtyValue, 10);
        if (isNaN(val) || (orderQtyMode === 'set' && val < 0)) {
          setErrorMsg('Please enter a valid non-negative order quantity.');
          return;
        }
        updates.orderQtyMode = orderQtyMode;
        updates.orderQtyValue = val;
      } else {
        updates.orderQtyMode = 'deficit';
      }
    }

    if (enableSafetyTarget) {
      const tgt = parseInt(safetyTargetValue, 10);
      if (isNaN(tgt) || tgt < 0) {
        setErrorMsg('Safety target must be a non-negative number.');
        return;
      }
      updates.safetyTarget = tgt;
    }

    if (enableCategory) {
      if (!categoryValue?.trim()) {
        setErrorMsg('Please select or specify a category.');
        return;
      }
      updates.category = categoryValue.trim();
    }

    try {
      setIsSubmitting(true);
      const targetIds = selectedProducts.map((p) => p.id);
      await onApplyBulkEdit(targetIds, updates);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to apply bulk updates to SQLite.');
    }
  };

  return (
    <div
      className="confirm-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-edit-modal-title"
      onClick={onClose}
    >
      <div className="filter-modal-card bulk-edit-card" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-header">
          <div className="filter-modal-title-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <h2 id="bulk-edit-modal-title" className="info-modal-title">
              Bulk Edit Selected Inventory ({selectedProducts.length} Items)
            </h2>
          </div>
          <button className="info-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="filter-modal-body bulk-edit-body">
            {/* Warning if any ordered items are in the selection */}
            {orderedCount > 0 && (
              <div className="bulk-ineligible-banner">
                <span className="bulk-alert-icon">ℹ️</span>
                <span>
                  <strong>{orderedCount}</strong> of <strong>{selectedProducts.length}</strong> selected products are already in <strong>Ordered</strong> status. Their order quantities cannot be altered, but category and safety target updates will still apply safely.
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="form-error-banner" role="alert">
                {errorMsg}
              </div>
            )}

            <p className="bulk-subtitle">
              Choose which fields to apply across the {selectedProducts.length} selected items. Unchecked fields will remain unchanged.
            </p>

            <div className="bulk-fields-container">
              {/* Field 1: Order Quantity */}
              <div className={`bulk-field-card ${enableOrderQty ? 'active' : ''}`}>
                <label className="bulk-field-toggle">
                  <input
                    type="checkbox"
                    className="cb"
                    checked={enableOrderQty}
                    onChange={(e) => setEnableOrderQty(e.target.checked)}
                  />
                  <span className="bulk-field-label">Update Order Quantity</span>
                  {orderedCount > 0 && (
                    <span className="bulk-field-badge">Applies to {eligibleProducts.length} eligible items</span>
                  )}
                </label>

                {enableOrderQty && (
                  <div className="bulk-field-options">
                    <div className="bulk-radio-group">
                      <label className="bulk-radio-label">
                        <input
                          type="radio"
                          name="qtyMode"
                          value="set"
                          checked={orderQtyMode === 'set'}
                          onChange={() => setOrderQtyMode('set')}
                        />
                        <span>Set exact quantity to:</span>
                      </label>
                      <label className="bulk-radio-label">
                        <input
                          type="radio"
                          name="qtyMode"
                          value="increase"
                          checked={orderQtyMode === 'increase'}
                          onChange={() => setOrderQtyMode('increase')}
                        />
                        <span>Increase current quantity by:</span>
                      </label>
                      <label className="bulk-radio-label">
                        <input
                          type="radio"
                          name="qtyMode"
                          value="deficit"
                          checked={orderQtyMode === 'deficit'}
                          onChange={() => setOrderQtyMode('deficit')}
                        />
                        <span>Set to calculated replenishment deficit (Target − Stock)</span>
                      </label>
                    </div>

                    {orderQtyMode !== 'deficit' && (
                      <div className="bulk-input-row">
                        <input
                          type="number"
                          min="0"
                          value={orderQtyValue}
                          onChange={(e) => setOrderQtyValue(e.target.value)}
                          className="form-input bulk-num-input"
                          placeholder="e.g. 50"
                        />
                        <span className="bulk-unit-label">units</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Field 2: Safety Target */}
              <div className={`bulk-field-card ${enableSafetyTarget ? 'active' : ''}`}>
                <label className="bulk-field-toggle">
                  <input
                    type="checkbox"
                    className="cb"
                    checked={enableSafetyTarget}
                    onChange={(e) => setEnableSafetyTarget(e.target.checked)}
                  />
                  <span className="bulk-field-label">Update Safety Target</span>
                </label>

                {enableSafetyTarget && (
                  <div className="bulk-field-options">
                    <div className="bulk-input-row">
                      <input
                        type="number"
                        min="0"
                        value={safetyTargetValue}
                        onChange={(e) => setSafetyTargetValue(e.target.value)}
                        className="form-input bulk-num-input"
                        placeholder="e.g. 60"
                      />
                      <span className="bulk-unit-label">units</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Category */}
              <div className={`bulk-field-card ${enableCategory ? 'active' : ''}`}>
                <label className="bulk-field-toggle">
                  <input
                    type="checkbox"
                    className="cb"
                    checked={enableCategory}
                    onChange={(e) => setEnableCategory(e.target.checked)}
                  />
                  <span className="bulk-field-label">Change Category</span>
                </label>

                {enableCategory && (
                  <div className="bulk-field-options">
                    <select
                      className="form-input"
                      value={categoryValue}
                      onChange={(e) => setCategoryValue(e.target.value)}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Summary preview */}
            {(enableOrderQty || enableSafetyTarget || enableCategory) && (
              <div className="bulk-summary-preview">
                <span className="bulk-preview-title">Summary of intended updates:</span>
                <ul>
                  {enableOrderQty && (
                    <li>
                      Order Quantity: {orderQtyMode === 'deficit' ? 'Replenishment Deficit' : `${orderQtyMode === 'set' ? 'Set to' : 'Increase by'} ${orderQtyValue} units`} (on {eligibleProducts.length} items)
                    </li>
                  )}
                  {enableSafetyTarget && <li>Safety Target: Set to {safetyTargetValue} units</li>}
                  {enableCategory && <li>Category: Set to "{categoryValue}"</li>}
                </ul>
              </div>
            )}
          </div>

          <div className="filter-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-action"
              disabled={isSubmitting || (!enableOrderQty && !enableSafetyTarget && !enableCategory)}
            >
              {isSubmitting ? 'Saving to SQLite...' : 'Apply Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
