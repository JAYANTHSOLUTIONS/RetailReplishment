import { useState } from 'react';
import { createSupplier } from '../../db/queries.js';
import { Modal, Button } from '../../components/ui';
import {
  validateSupplierForm,
  FIELD_LIMITS,
  sanitizeMobileInput,
  sanitizePriceInput,
  sanitizeIntegerInput,
  handleAlphaOnlyKeyDown,
  sanitizeAlphaName,
} from '../../utils/validation.js';

import BusinessIcon from '@mui/icons-material/Business';

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
  const [contactAddress, setContactAddress] = useState('');

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
        contactAddress: contactAddress.trim(),
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Supplier Vendor"
      icon={<BusinessIcon style={{ fontSize: 20, color: 'var(--brand)' }} />}
      size="lg"
      contentClassName="add-supplier-card"
      formProps={{
        onSubmit: handleSubmit,
        noValidate: true,
      }}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving to SQLite...' : 'Save Supplier'}
          </Button>
        </>
      }
    >
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

            <div className="form-group">
              <label className="form-label" htmlFor="sup-address">
                Warehouse / Office Address
              </label>
              <input
                id="sup-address"
                type="text"
                maxLength={200}
                className="form-input"
                placeholder="e.g. Plot 42, Sector 18, Industrial Area, Gurgaon"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
              />
            </div>

    </Modal>
  );
}
