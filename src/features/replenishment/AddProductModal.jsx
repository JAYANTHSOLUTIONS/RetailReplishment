import { useState, useEffect } from 'react';
import { createProduct, getNextProductIdentifiers } from '../../db/queries.js';
import { SUPPLIER_LOGOS } from '../../utils/supplierLogos.js';
import { Modal, Button } from '../../components/ui';
import {
  validateProductForm,
  FIELD_LIMITS,
  sanitizePriceInput,
  sanitizeIntegerInput,
  handleAlphaOnlyKeyDown,
  sanitizeAlphaName,
} from '../../utils/validation.js';

export default function AddProductModal({
  isOpen,
  onClose,
  suppliers = [],
  categories = [],
  onProductCreated,
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || 'hf');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Dairy');
  const [customCategory, setCustomCategory] = useState('');
  const [currentStock, setCurrentStock] = useState('15');
  const [safetyTarget, setSafetyTarget] = useState('50');
  const [unitCost, setUnitCost] = useState('120');
  const [orderQty, setOrderQty] = useState('0');

  // DB-Backed Auto Assigned Identifiers
  const [autoId, setAutoId] = useState('');
  const [autoSku, setAutoSku] = useState('');
  const [loadingId, setLoadingId] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate unique ID & SKU from SQLite DB whenever modal opens or supplier changes
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      try {
        const { nextId, nextSku } = await getNextProductIdentifiers(supplierId);
        if (active) {
          setAutoId(nextId);
          setAutoSku(nextSku);
          setLoadingId(false);
        }
      } catch (err) {
        console.warn('Failed to generate unique identifiers from SQLite:', err);
        if (active) setLoadingId(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isOpen, supplierId]);

  const clearFieldError = (field) => {
    if (errors[field] || errors.form) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        delete next.form;
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const chosenCategory = (category === '__custom__' ? customCategory : category).trim();

    const validation = validateProductForm({
      name,
      category: chosenCategory,
      currentStock,
      safetyTarget,
      unitCost,
      orderQty,
    });

    if (!supplierId) {
      validation.errors.supplierId = 'Supplier is required.';
      validation.isValid = false;
    }

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      const created = await createProduct({
        id: autoId,
        sku: autoSku,
        name: name.trim(),
        supplierId,
        category: chosenCategory,
        currentStock: parseInt(currentStock, 10),
        safetyTarget: parseInt(safetyTarget, 10),
        unitCost: parseFloat(unitCost),
        orderQty: parseInt(orderQty, 10) || 0,
      });

      setIsSubmitting(false);
      onProductCreated(created);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ form: err.message || 'Failed to save product to SQLite.' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Inventory Product"
      size="lg"
      contentClassName="add-product-card"
      formProps={{
        onSubmit: handleSubmit,
        noValidate: true,
      }}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || loadingId}>
            {isSubmitting ? 'Saving to SQLite...' : 'Save Product'}
          </Button>
        </>
      }
    >
      {errors.form && (
        <div className="form-error-banner" role="alert">
          {errors.form}
        </div>
      )}

            {/* Auto ID Notice */}
            {/* <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>
              Auto ID Assignment: Next available SKU is <strong>{autoSku || 'generating...'}</strong> ({autoId})
            </div> */}

            {/* Section 1: Product Classification */}
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" htmlFor="prod-name">
                Product Name * <span style={{ fontSize: 11, color: 'var(--text3)' }}>({FIELD_LIMITS.PRODUCT.NAME_MIN}–{FIELD_LIMITS.PRODUCT.NAME_MAX} chars)</span>
              </label>
              <input
                id="prod-name"
                type="text"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="e.g. Organic Cow Ghee"
                value={name}
                maxLength={FIELD_LIMITS.PRODUCT.NAME_MAX}
                onKeyDown={handleAlphaOnlyKeyDown}
                onChange={(e) => {
                  setName(sanitizeAlphaName(e.target.value));
                  clearFieldError('name');
                }}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'prod-name-err' : undefined}
                autoFocus
              />
              {errors.name && <span id="prod-name-err" className="field-error">{errors.name}</span>}
            </div>

            <div className="form-grid-2" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="prod-supplier">
                  Supplier *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {SUPPLIER_LOGOS && SUPPLIER_LOGOS[supplierId] && (
                    <img
                      src={SUPPLIER_LOGOS[supplierId]}
                      alt=""
                      style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--border)', background: '#fff', padding: 1, flexShrink: 0 }}
                    />
                  )}
                  <select
                    id="prod-supplier"
                    className="form-input"
                    style={{ flex: 1 }}
                    value={supplierId}
                    onChange={(e) => {
                      setSupplierId(e.target.value);
                      clearFieldError('supplierId');
                    }}
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.supplierId && <span className="field-error">{errors.supplierId}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-category">
                  Category *
                </label>
                <select
                  id="prod-category"
                  className="form-input"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value !== '__custom__') setCustomCategory('');
                    clearFieldError('category');
                  }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__custom__">+ Enter custom category...</option>
                </select>
                {category === '__custom__' && (
                  <input
                    type="text"
                    style={{ marginTop: 6 }}
                    className={`form-input ${errors.category ? 'input-error' : ''}`}
                    placeholder="Enter category name"
                    value={customCategory}
                    maxLength={FIELD_LIMITS.PRODUCT.CATEGORY_MAX}
                    onKeyDown={handleAlphaOnlyKeyDown}
                    onChange={(e) => {
                      setCustomCategory(sanitizeAlphaName(e.target.value));
                      clearFieldError('category');
                    }}
                  />
                )}
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>
            </div>

            {/* Section 2: Inventory & Threshold Parameters */}
            <div className="modal-form-section-title">Inventory &amp; Threshold Rules</div>
            <div className="form-grid-4">
              <div className="form-group">
                <label className="form-label" htmlFor="prod-stock">
                  Current Stock *
                </label>
                <input
                  id="prod-stock"
                  type="number"
                  min={FIELD_LIMITS.PRODUCT.STOCK_MIN}
                  max={FIELD_LIMITS.PRODUCT.STOCK_MAX}
                  className={`form-input ${errors.currentStock ? 'input-error' : ''}`}
                  value={currentStock}
                  onChange={(e) => {
                    setCurrentStock(sanitizeIntegerInput(e.target.value));
                    clearFieldError('currentStock');
                  }}
                  aria-invalid={Boolean(errors.currentStock)}
                />
                {errors.currentStock && <span className="field-error">{errors.currentStock}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-target">
                  Safety Target *
                </label>
                <input
                  id="prod-target"
                  type="text"
                  inputMode="numeric"
                  className={`form-input ${errors.safetyTarget ? 'input-error' : ''}`}
                  value={safetyTarget}
                  onChange={(e) => {
                    setSafetyTarget(sanitizeIntegerInput(e.target.value));
                    clearFieldError('safetyTarget');
                  }}
                  aria-invalid={Boolean(errors.safetyTarget)}
                />
                {errors.safetyTarget && <span className="field-error">{errors.safetyTarget}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-price">
                  Unit Price (₹) *
                </label>
                <input
                  id="prod-price"
                  type="text"
                  inputMode="decimal"
                  className={`form-input ${errors.unitCost ? 'input-error' : ''}`}
                  value={unitCost}
                  onChange={(e) => {
                    setUnitCost(sanitizePriceInput(e.target.value));
                    clearFieldError('unitCost');
                  }}
                  aria-invalid={Boolean(errors.unitCost)}
                />
                {errors.unitCost && <span className="field-error">{errors.unitCost}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-qty">
                  Initial Order Qty
                </label>
                <input
                  id="prod-qty"
                  type="text"
                  inputMode="numeric"
                  className={`form-input ${errors.orderQty ? 'input-error' : ''}`}
                  value={orderQty}
                  onChange={(e) => {
                    setOrderQty(sanitizeIntegerInput(e.target.value, 5));
                    clearFieldError('orderQty');
                  }}
                  aria-invalid={Boolean(errors.orderQty)}
                />
                {errors.orderQty && <span className="field-error">{errors.orderQty}</span>}
              </div>
            </div>

    </Modal>
  );
}
