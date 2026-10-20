import { useState, useEffect } from 'react';
import { createProduct, getNextProductIdentifiers } from '../../db/queries.js';
import { SUPPLIER_LOGOS } from './ReplenishmentPage.jsx';

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
    setLoadingId(true);
    getNextProductIdentifiers(supplierId)
      .then(({ nextId, nextSku }) => {
        if (!active) return;
        setAutoId(nextId);
        setAutoSku(nextSku);
      })
      .catch((err) => {
        console.warn('Failed to generate unique identifiers from SQLite:', err);
      })
      .finally(() => {
        if (active) setLoadingId(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, supplierId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) newErrors.name = 'Product name is required.';
    if (!supplierId) newErrors.supplierId = 'Supplier is required.';

    const chosenCategory = customCategory.trim() || category.trim();
    if (!chosenCategory) newErrors.category = 'Category is required.';

    const stock = parseInt(currentStock, 10);
    const target = parseInt(safetyTarget, 10);
    const price = parseFloat(unitCost);
    const qty = parseInt(orderQty, 10) || 0;

    if (isNaN(stock) || stock < 0) newErrors.currentStock = 'Must be non-negative.';
    if (isNaN(target) || target < 0) newErrors.safetyTarget = 'Must be non-negative.';
    if (isNaN(price) || price < 0) newErrors.unitCost = 'Must be non-negative.';
    if (isNaN(qty) || qty < 0) newErrors.orderQty = 'Must be non-negative.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
        currentStock: stock,
        safetyTarget: target,
        unitCost: price,
        orderQty: qty,
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
    <div
      className="confirm-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-modal-title"
      onClick={onClose}
    >
      <div className="filter-modal-card add-product-card" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-header">
          <div className="filter-modal-title-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <h2 id="add-product-modal-title" className="info-modal-title">
              Add New Inventory Product
            </h2>
          </div>
          <button className="info-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="filter-modal-body modal-form-body">
            {errors.form && (
              <div className="form-error-banner" role="alert">
                {errors.form}
              </div>
            )}


            {/* Section 1: Product Classification */}
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" htmlFor="prod-name">
                Product Name *
              </label>
              <input
                id="prod-name"
                type="text"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="e.g. Organic Cow Ghee 500ml"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
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
                    onChange={(e) => setSupplierId(e.target.value)}
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>
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
                    className="form-input"
                    placeholder="Enter category name"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
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
                  min="0"
                  className={`form-input ${errors.currentStock ? 'input-error' : ''}`}
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                />
                {errors.currentStock && <span className="field-error">{errors.currentStock}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-target">
                  Safety Target *
                </label>
                <input
                  id="prod-target"
                  type="number"
                  min="0"
                  className={`form-input ${errors.safetyTarget ? 'input-error' : ''}`}
                  value={safetyTarget}
                  onChange={(e) => setSafetyTarget(e.target.value)}
                />
                {errors.safetyTarget && <span className="field-error">{errors.safetyTarget}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-price">
                  Unit Price (₹) *
                </label>
                <input
                  id="prod-price"
                  type="number"
                  step="0.5"
                  min="0"
                  className={`form-input ${errors.unitCost ? 'input-error' : ''}`}
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                />
                {errors.unitCost && <span className="field-error">{errors.unitCost}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-qty">
                  Initial Order Qty
                </label>
                <input
                  id="prod-qty"
                  type="number"
                  min="0"
                  className="form-input"
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="filter-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" disabled={isSubmitting || loadingId}>
              {isSubmitting ? 'Saving to SQLite...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
