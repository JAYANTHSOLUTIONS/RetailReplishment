import { useState } from 'react';
import { createSupplier } from '../../db/queries.js';
import {
  validateSupplierForm,
  FIELD_LIMITS,
  sanitizeMobileInput,
  sanitizePriceInput,
  sanitizeIntegerInput,
  handleAlphaOnlyKeyDown,
  sanitizeAlphaName,
} from '../../utils/validation.js';

const DEFAULT_SUPPLIER_CATEGORIES = [
  'Dairy & Bakery',
  'Bakery',
  'Beverages',
  'Snacks & Confectionery',
  'Pantry & Staples',
  'Organic Goods',
  'Personal Care',
  'Household',
];

export default function AddSupplierModal({
  isOpen,
  onClose,
  categories = [],
  onSupplierCreated,
}) {
  const availableCategories = Array.from(new Set([...(categories || []), ...DEFAULT_SUPPLIER_CATEGORIES])).filter(Boolean);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(availableCategories[0] || 'Dairy & Bakery');
  const [contactRep, setContactRep] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [leadTime, setLeadTime] = useState('3d');
  const [targetMoq, setTargetMoq] = useState('5000');
  const [unitThreshold, setUnitThreshold] = useState('0');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const validation = validateSupplierForm({
      name,
      category,
      targetMoq,
      unitThreshold,
      contactRep,
      contactEmail,
      contactPhone,
      leadTime,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      const created = await createSupplier({
        name: name.trim(),
        category: category.trim(),
        contactRep: contactRep.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        leadTime: leadTime.trim() || '3d',
        targetMoq: parseFloat(targetMoq),
        unitThreshold: parseInt(unitThreshold, 10) || 0,
      });

      setIsSubmitting(false);
      onSupplierCreated(created);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ form: err.message || 'Failed to save supplier to SQLite.' });
    }
  };

  return (
    <div
      className={`modal-overlay fade-toggle ${isOpen ? 'open' : ''}`}
      role="dialog"
      aria-modal="true"
      inert={!isOpen ? true : undefined}
      aria-labelledby="add-supplier-modal-title"
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content add-supplier-card">
          <div className="modal-header info-modal-header">
            <div className="modal-title info-modal-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h2 id="add-supplier-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Add New Supplier Vendor
              </h2>
            </div>
            {/* <button className="modal-close-btn info-modal-close" onClick={onClose} aria-label="Close modal">
              ✕
            </button> */}
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="modal-body filter-modal-body modal-form-body">
              {errors.form && (
                <div className="form-error-banner" role="alert">
                  {errors.form}
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="sup-name">
                    Supplier Name * <span style={{ fontSize: 11, color: 'var(--text3)' }}>({FIELD_LIMITS.SUPPLIER.NAME_MIN}–{FIELD_LIMITS.SUPPLIER.NAME_MAX} chars)</span>
                  </label>
                  <input
                    id="sup-name"
                    type="text"
                    maxLength={FIELD_LIMITS.SUPPLIER.NAME_MAX}
                    className={`form-input ${errors.name ? 'input-error' : ''}`}
                    placeholder="e.g. Amul Dairy & Foods"
                    value={name}
                    onKeyDown={handleAlphaOnlyKeyDown}
                    onChange={(e) => {
                      setName(sanitizeAlphaName(e.target.value));
                      clearFieldError('name');
                    }}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'sup-name-err' : undefined}
                  />
                  {errors.name && <span id="sup-name-err" className="field-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sup-cat">
                    Primary Category *
                  </label>
                  <select
                    id="sup-cat"
                    className={`form-input ${errors.category ? 'input-error' : ''}`}
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      clearFieldError('category');
                    }}
                    aria-invalid={Boolean(errors.category)}
                    aria-describedby={errors.category ? 'sup-cat-err' : undefined}
                  >
                    <option value="" disabled>Select supplier category...</option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && <span id="sup-cat-err" className="field-error">{errors.category}</span>}
                </div>
              </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="sup-moq">
                  Minimum Order Value (₹ Target MOQ) *
                </label>
                <input
                  id="sup-moq"
                  type="text"
                  inputMode="decimal"
                  className={`form-input ${errors.targetMoq ? 'input-error' : ''}`}
                  placeholder="e.g. 10000"
                  value={targetMoq}
                  onChange={(e) => {
                    setTargetMoq(sanitizePriceInput(e.target.value));
                    clearFieldError('targetMoq');
                  }}
                  aria-invalid={Boolean(errors.targetMoq)}
                  aria-describedby={errors.targetMoq ? 'sup-moq-err' : undefined}
                />
                {errors.targetMoq && <span id="sup-moq-err" className="field-error">{errors.targetMoq}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sup-unit-thresh">
                  Unit / Freight Threshold (Units)
                </label>
                <input
                  id="sup-unit-thresh"
                  type="text"
                  inputMode="numeric"
                  className={`form-input ${errors.unitThreshold ? 'input-error' : ''}`}
                  placeholder="e.g. 40 (0 for no threshold)"
                  value={unitThreshold}
                  onChange={(e) => {
                    setUnitThreshold(sanitizeIntegerInput(e.target.value, 6));
                    clearFieldError('unitThreshold');
                  }}
                  aria-invalid={Boolean(errors.unitThreshold)}
                  aria-describedby={errors.unitThreshold ? 'sup-unit-err' : undefined}
                />
                {errors.unitThreshold && <span id="sup-unit-err" className="field-error">{errors.unitThreshold}</span>}
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="sup-rep">
                  Representative Name
                </label>
                <input
                  id="sup-rep"
                  type="text"
                  maxLength={FIELD_LIMITS.SUPPLIER.NAME_MAX}
                  className={`form-input ${errors.contactRep ? 'input-error' : ''}`}
                  placeholder="e.g. Rajesh Kumar"
                  value={contactRep}
                  onKeyDown={handleAlphaOnlyKeyDown}
                  onChange={(e) => {
                    setContactRep(sanitizeAlphaName(e.target.value));
                    clearFieldError('contactRep');
                  }}
                  aria-invalid={Boolean(errors.contactRep)}
                  aria-describedby={errors.contactRep ? 'sup-rep-err' : undefined}
                />
                {errors.contactRep && <span id="sup-rep-err" className="field-error">{errors.contactRep}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sup-email">
                  Contact Email
                </label>
                <input
                  id="sup-email"
                  type="email"
                  className={`form-input ${errors.contactEmail ? 'input-error' : ''}`}
                  placeholder="e.g. orders@amul.com"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    clearFieldError('contactEmail');
                  }}
                  aria-invalid={Boolean(errors.contactEmail)}
                  aria-describedby={errors.contactEmail ? 'sup-email-err' : undefined}
                />
                {errors.contactEmail && <span id="sup-email-err" className="field-error">{errors.contactEmail}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sup-phone">
                  Mobile Number
                </label>
                <input
                  id="sup-phone"
                  type="tel"
                  maxLength={15}
                  className={`form-input ${errors.contactPhone ? 'input-error' : ''}`}
                  placeholder="e.g. +919876543210"
                  value={contactPhone}
                  onChange={(e) => {
                    setContactPhone(sanitizeMobileInput(e.target.value));
                    clearFieldError('contactPhone');
                  }}
                  aria-invalid={Boolean(errors.contactPhone)}
                  aria-describedby={errors.contactPhone ? 'sup-phone-err' : undefined}
                />
                {errors.contactPhone && <span id="sup-phone-err" className="field-error">{errors.contactPhone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sup-lead">
                Expected Lead Time <span style={{ fontSize: 11, color: 'var(--text3)' }}>(max {FIELD_LIMITS.SUPPLIER.LEAD_TIME_MAX} chars)</span>
              </label>
              <input
                id="sup-lead"
                type="text"
                maxLength={FIELD_LIMITS.SUPPLIER.LEAD_TIME_MAX}
                className={`form-input ${errors.leadTime ? 'input-error' : ''}`}
                placeholder="e.g. 2d or 48 hours"
                value={leadTime}
                onChange={(e) => {
                  setLeadTime(e.target.value);
                  clearFieldError('leadTime');
                }}
                aria-invalid={Boolean(errors.leadTime)}
                aria-describedby={errors.leadTime ? 'sup-lead-err' : undefined}
              />
              {errors.leadTime && <span id="sup-lead-err" className="field-error">{errors.leadTime}</span>}
            </div>
          </div>

          <div className="modal-footer filter-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" disabled={isSubmitting}>
              {isSubmitting ? 'Saving to SQLite...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  );
}
