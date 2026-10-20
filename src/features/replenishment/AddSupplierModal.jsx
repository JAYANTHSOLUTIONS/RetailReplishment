import { useState } from 'react';
import { createSupplier } from '../../db/queries.js';

export default function AddSupplierModal({
  isOpen,
  onClose,
  onSupplierCreated,
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [contactRep, setContactRep] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [leadTime, setLeadTime] = useState('3d');
  const [targetMoq, setTargetMoq] = useState('5000');
  const [unitThreshold, setUnitThreshold] = useState('0');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) newErrors.name = 'Supplier name is required.';
    if (!category.trim()) newErrors.category = 'Primary category is required.';

    const moq = parseFloat(targetMoq);
    const units = parseInt(unitThreshold, 10) || 0;

    if (isNaN(moq) || moq < 0) newErrors.targetMoq = 'Must be a non-negative number.';
    if (isNaN(units) || units < 0) newErrors.unitThreshold = 'Must be a non-negative number.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
        targetMoq: moq,
        unitThreshold: units,
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
      className="confirm-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-supplier-modal-title"
      onClick={onClose}
    >
      <div className="filter-modal-card add-supplier-card" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-header">
          <div className="filter-modal-title-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h2 id="add-supplier-modal-title" className="info-modal-title">
              Add New Supplier Vendor
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

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="sup-name">
                  Supplier Name *
                </label>
                <input
                  id="sup-name"
                  type="text"
                  className={`form-input ${errors.name ? 'input-error' : ''}`}
                  placeholder="e.g. Amul Dairy & Foods"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sup-cat">
                  Primary Category *
                </label>
                <input
                  id="sup-cat"
                  type="text"
                  className={`form-input ${errors.category ? 'input-error' : ''}`}
                  placeholder="e.g. Dairy & Frozen"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="sup-moq">
                  Minimum Order Value (₹ Target MOQ) *
                </label>
                <input
                  id="sup-moq"
                  type="number"
                  min="0"
                  className={`form-input ${errors.targetMoq ? 'input-error' : ''}`}
                  placeholder="e.g. 10000"
                  value={targetMoq}
                  onChange={(e) => setTargetMoq(e.target.value)}
                />
                {errors.targetMoq && <span className="field-error">{errors.targetMoq}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sup-unit-thresh">
                  Unit / Freight Threshold (Units)
                </label>
                <input
                  id="sup-unit-thresh"
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 40 (0 for no threshold)"
                  value={unitThreshold}
                  onChange={(e) => setUnitThreshold(e.target.value)}
                />
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
                  className="form-input"
                  placeholder="e.g. Rajesh Kumar"
                  value={contactRep}
                  onChange={(e) => setContactRep(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sup-email">
                  Contact Email
                </label>
                <input
                  id="sup-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. orders@amul.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sup-phone">
                  Phone Number
                </label>
                <input
                  id="sup-phone"
                  type="text"
                  className="form-input"
                  placeholder="e.g. +91 98765 43210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sup-lead">
                Expected Lead Time
              </label>
              <input
                id="sup-lead"
                type="text"
                className="form-input"
                placeholder="e.g. 2d or 48 hours"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-modal-footer">
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
  );
}
