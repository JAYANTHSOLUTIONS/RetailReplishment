import { useState, useMemo } from 'react';
import { validateBulkEditParams, FIELD_LIMITS } from '../../utils/validation.js';

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

  const [fieldErrors, setFieldErrors] = useState({});
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

  const clearFieldError = (key) => {
    if (fieldErrors[key] || fieldErrors.form) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        delete next.form;
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateBulkEditParams({
      enableOrderQty,
      orderQtyMode,
      orderQtyValue,
      enableSafetyTarget,
      safetyTargetValue,
      enableCategory,
      categoryValue,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    const updates = {};
    if (enableOrderQty) {
      if (orderQtyMode !== 'deficit') {
        updates.orderQtyMode = orderQtyMode;
        updates.orderQtyValue = parseInt(orderQtyValue, 10);
      } else {
        updates.orderQtyMode = 'deficit';
      }
    }

    if (enableSafetyTarget) {
      updates.safetyTarget = parseInt(safetyTargetValue, 10);
    }

    if (enableCategory) {
      updates.category = categoryValue.trim();
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      const targetIds = selectedProducts.map((p) => p.id);
      await onApplyBulkEdit(targetIds, updates);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setFieldErrors({ form: err.message || 'Failed to apply bulk updates to SQLite.' });
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

        <form onSubmit={handleSubmit} noValidate>
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

            {fieldErrors.form && (
              <div className="form-error-banner" role="alert">
                {fieldErrors.form}
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
                    onChange={(e) => {
                      setEnableOrderQty(e.target.checked);
                      clearFieldError('orderQty');
                    }}
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
                          onChange={() => {
                            setOrderQtyMode('set');
                            clearFieldError('orderQty');
                          }}
                        />
                        <span>Set exact quantity to ({FIELD_LIMITS.BULK.QTY_SET_MIN}–{FIELD_LIMITS.BULK.QTY_SET_MAX.toLocaleString()}):</span>
                      </label>
                      <label className="bulk-radio-label">
                        <input
                          type="radio"
                          name="qtyMode"
                          value="increase"
                          checked={orderQtyMode === 'increase'}
                          onChange={() => {
                            setOrderQtyMode('increase');
                            clearFieldError('orderQty');
                          }}
                        />
                        <span>Increase current quantity by ({FIELD_LIMITS.BULK.QTY_INCREASE_MIN}–{FIELD_LIMITS.BULK.QTY_INCREASE_MAX.toLocaleString()}):</span>
                      </label>
                      <label className="bulk-radio-label">
                        <input
                          type="radio"
                          name="qtyMode"
                          value="deficit"
                          checked={orderQtyMode === 'deficit'}
                          onChange={() => {
                            setOrderQtyMode('deficit');
                            clearFieldError('orderQty');
                          }}
                        />
                        <span>Set to calculated replenishment deficit (Target − Stock)</span>
                      </label>
                    </div>

                    {orderQtyMode !== 'deficit' && (
                      <div className="bulk-input-row">
                        <input
                          type="number"
                          min={orderQtyMode === 'increase' ? FIELD_LIMITS.BULK.QTY_INCREASE_MIN : FIELD_LIMITS.BULK.QTY_SET_MIN}
                          max={orderQtyMode === 'increase' ? FIELD_LIMITS.BULK.QTY_INCREASE_MAX : FIELD_LIMITS.BULK.QTY_SET_MAX}
                          value={orderQtyValue}
                          onChange={(e) => {
                            setOrderQtyValue(e.target.value);
                            clearFieldError('orderQty');
                          }}
                          className={`form-input bulk-num-input ${fieldErrors.orderQty ? 'input-error' : ''}`}
                          placeholder="e.g. 50"
                          aria-invalid={Boolean(fieldErrors.orderQty)}
                        />
                        <span className="bulk-unit-label">units</span>
                      </div>
                    )}
                    {fieldErrors.orderQty && (
                      <span className="field-error" style={{ marginTop: 4, display: 'block' }}>
                        {fieldErrors.orderQty}
                      </span>
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
                    onChange={(e) => {
                      setEnableSafetyTarget(e.target.checked);
                      clearFieldError('safetyTarget');
                    }}
                  />
                  <span className="bulk-field-label">Update Safety Target</span>
                </label>

                {enableSafetyTarget && (
                  <div className="bulk-field-options">
                    <div className="bulk-input-row">
                      <input
                        type="number"
                        min={FIELD_LIMITS.BULK.TARGET_MIN}
                        max={FIELD_LIMITS.BULK.TARGET_MAX}
                        value={safetyTargetValue}
                        onChange={(e) => {
                          setSafetyTargetValue(e.target.value);
                          clearFieldError('safetyTarget');
                        }}
                        className={`form-input bulk-num-input ${fieldErrors.safetyTarget ? 'input-error' : ''}`}
                        placeholder="e.g. 60"
                        aria-invalid={Boolean(fieldErrors.safetyTarget)}
                      />
                      <span className="bulk-unit-label">units</span>
                    </div>
                    {fieldErrors.safetyTarget && (
                      <span className="field-error" style={{ marginTop: 4, display: 'block' }}>
                        {fieldErrors.safetyTarget}
                      </span>
                    )}
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
                    onChange={(e) => {
                      setEnableCategory(e.target.checked);
                      clearFieldError('category');
                    }}
                  />
                  <span className="bulk-field-label">Change Category</span>
                </label>

                {enableCategory && (
                  <div className="bulk-field-options">
                    <select
                      className={`form-input ${fieldErrors.category ? 'input-error' : ''}`}
                      value={categoryValue}
                      onChange={(e) => {
                        setCategoryValue(e.target.value);
                        clearFieldError('category');
                      }}
                      aria-invalid={Boolean(fieldErrors.category)}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.category && (
                      <span className="field-error" style={{ marginTop: 4, display: 'block' }}>
                        {fieldErrors.category}
                      </span>
                    )}
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
