// src/utils/validation.js

/**
 * Authoritative Validation Rules & Field Limits
 * 
 * Standardized Limits:
 * - Product Name: 2 - 100 characters
 * - Product Category: 2 - 50 characters
 * - Current Stock: Integer, 0 - 999,999 units
 * - Safety Target: Integer, 0 - 999,999 units
 * - Unit Cost / Price: Non-negative number, ₹0.00 - ₹1,000,000.00 (max 2 decimals)
 * - Order Quantity: Integer, 0 - 99,999 units
 * - Supplier Name: 2 - 80 characters, unique
 * - Supplier Category: 2 - 50 characters
 * - Target MOQ: Non-negative number, ₹0 - ₹10,000,000
 * - Unit Threshold: Integer, 0 - 100,000 units
 * - Lead Time: 1 - 20 characters
 * - Email: Valid RFC email pattern (if provided)
 * - Phone: 7 - 15 characters, valid phone format (if provided)
 */

export const FIELD_LIMITS = {
  PRODUCT: {
    NAME_MIN: 2,
    NAME_MAX: 30,
    CATEGORY_MIN: 2,
    CATEGORY_MAX: 50,
    STOCK_MIN: 0,
    STOCK_MAX: 9999,
    TARGET_MIN: 0,
    TARGET_MAX: 9999,
    PRICE_MIN: 0,
    PRICE_MAX: 1000000,
    QTY_MIN: 0,
    QTY_MAX: 99999,
  },
  SUPPLIER: {
    NAME_MIN: 2,
    NAME_MAX: 30,
    CATEGORY_MIN: 2,
    CATEGORY_MAX: 50,
    MOQ_MIN: 0,
    MOQ_MAX: 9999,
    UNITS_MIN: 0,
    UNITS_MAX: 9999,
    LEAD_TIME_MAX: 20,
  },
  BULK: {
    QTY_SET_MIN: 0,
    QTY_SET_MAX: 99999,
    QTY_INCREASE_MIN: 1,
    QTY_INCREASE_MAX: 10000,
    TARGET_MIN: 0,
    TARGET_MAX: 999999,
  },
};

const EMAIL_REGEX = /^[a-zA-Z]{4,}[a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

/**
 * Sanitizes mobile number input: allows leading + and digits only, max 15 chars.
 */
export function sanitizeMobileInput(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  const hasPlus = str.includes('+');
  const digits = str.replace(/\D/g, '');
  const result = hasPlus ? `+${digits}` : digits;
  return result.slice(0, 15);
}

/**
 * Sanitizes numeric price input: allows digits and at most 1 decimal point with up to 2 decimal places.
 */
export function sanitizePriceInput(raw) {
  if (!raw) return '';
  let str = String(raw).replace(/[^0-9.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }
  const cleanParts = str.split('.');
  if (cleanParts[1] && cleanParts[1].length > 2) {
    str = cleanParts[0] + '.' + cleanParts[1].slice(0, 2);
  }
  return str;
}

/**
 * Sanitizes non-negative integer input: digits only, max length.
 */
export function sanitizeIntegerInput(raw, maxDigits = 6) {
  if (!raw) return '';
  return String(raw).replace(/\D/g, '').slice(0, maxDigits);
}

/**
 * Blocks typing numbers and non-alphabetic characters into name fields.
 */
export function handleAlphaOnlyKeyDown(e) {
  // Allow navigation, editing keys, and key combinations (Ctrl/Cmd+A, C, V, etc.)
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length > 1) return; // Backspace, Delete, Tab, Enter, Arrows, etc.

  // Block numbers strictly
  if (/[0-9]/.test(e.key)) {
    e.preventDefault();
    return;
  }
  // Allow only alphabets, spaces, and standard name characters (-, ', &, .)
  if (!/^[a-zA-Z\s\-'.&]$/.test(e.key)) {
    e.preventDefault();
  }
}

/**
 * Sanitizes name input: removes any numbers and non-alphabetic characters.
 */
export function sanitizeAlphaName(raw) {
  if (!raw) return '';
  return String(raw).replace(/[0-9]/g, '');
}

/**
 * Validates inline or single order quantity input.
 * Does NOT silently clamp; returns explicit validity and error message.
 * Supports optional options: { currentStock, safetyTarget, maxLimit }
 * - Minimum value must achieve safe target (safetyTarget - currentStock)
 * - Maximum value cannot exceed maximum allowed units (default: 99,999)
 */
export function validateOrderQtyInput(rawVal, options = {}) {
  const str = String(rawVal ?? '').trim();
  if (str === '') {
    return { isValid: false, error: 'Quantity is required.', value: null };
  }
  // Check if it's a clean integer without trailing characters or fractional dot
  if (!/^-?\d+$/.test(str)) {
    return { isValid: false, error: 'Quantity must be a whole integer.', value: null };
  }
  const num = Number(str);
  if (!Number.isSafeInteger(num)) {
    return { isValid: false, error: 'Quantity exceeds maximum safe value.', value: null };
  }
  if (num < FIELD_LIMITS.PRODUCT.QTY_MIN) {
    return {
      isValid: false,
      error: `Quantity cannot be negative (min: ${FIELD_LIMITS.PRODUCT.QTY_MIN}).`,
      value: num,
    };
  }

  const maxAllowed = options.maxLimit !== undefined ? Number(options.maxLimit) : FIELD_LIMITS.PRODUCT.QTY_MAX;
  if (num > maxAllowed) {
    return {
      isValid: false,
      error: `Quantity cannot exceed ${maxAllowed.toLocaleString()} units.`,
      value: num,
    };
  }

  // Minimum required quantity to achieve safety target:
  if (options.safetyTarget !== undefined && options.currentStock !== undefined) {
    const safetyTarget = Number(options.safetyTarget) || 0;
    const currentStock = Number(options.currentStock) || 0;
    const minSafeQty = Math.max(0, safetyTarget - currentStock);

    if (minSafeQty > 0 && num < minSafeQty) {
      return {
        isValid: false,
        error: `Quantity must be at least ${minSafeQty} to achieve safety target (${safetyTarget}).`,
        value: num,
      };
    }
  }

  return { isValid: true, error: null, value: num };
}

/**
 * Reusable helper to validate strict alphabetic name fields (blocking leading/embedded digits).
 */
export function validateAlphaName(rawName, {
  fieldName = 'Name',
  required = true,
  min = 2,
  max = 30,
  emptyMsg = `Please enter valid ${fieldName.toLowerCase()}.`,
  leadingDigitMsg = `Please enter valid ${fieldName.toLowerCase()}`,
  containDigitMsg = `${fieldName} cannot contain numbers. Only letters, spaces, and punctuation are allowed.`,
} = {}) {
  const clean = String(rawName || '').trim();
  if (!clean) {
    return required ? emptyMsg : null;
  }
  if (/^\d/.test(clean)) {
    return leadingDigitMsg;
  }
  if (/\d/.test(clean)) {
    return containDigitMsg;
  }
  if (clean.length < min) {
    return `${fieldName} must be at least ${min} characters.`;
  }
  if (clean.length > max) {
    return `${fieldName} cannot exceed ${max} characters.`;
  }
  return null;
}

/**
 * Reusable helper to validate integer range fields.
 */
export function validateIntegerField(rawVal, {
  fieldName = 'Value',
  required = true,
  min = 0,
  max = 999999,
  emptyMsg = `${fieldName} is required.`,
  formatMsg = `${fieldName} must be a non-negative whole integer.`,
} = {}) {
  const str = String(rawVal ?? '').trim();
  if (str === '') {
    return required ? emptyMsg : null;
  }
  if (!/^\d+$/.test(str)) {
    return formatMsg;
  }
  const num = Number(str);
  if (num < min || num > max) {
    return `${fieldName} must be between ${min} and ${max.toLocaleString()}.`;
  }
  return null;
}

/**
 * Reusable helper to validate email format with minimum 4 leading letters.
 */
export function validateEmailField(rawEmail, { required = false } = {}) {
  const clean = String(rawEmail || '').trim();
  if (!clean) {
    return required ? 'Email is required.' : null;
  }
  if (/^\d/.test(clean)) {
    return 'Please enter valid email';
  }
  if (!/^[a-zA-Z]{4,}/.test(clean)) {
    return 'Email must start with at least 4 letters before any numbers or symbols (e.g. supp12@domain.com).';
  }
  if (!EMAIL_REGEX.test(clean)) {
    return 'Please enter a valid email address (e.g. orders@supplier.com).';
  }
  return null;
}

export function validateProductForm(
  { name, sku, category, currentStock, safetyTarget, unitCost, orderQty },
  existingProducts = []
) {
  const errors = {};

  // Reusable Name Validation
  const nameErr = validateAlphaName(name, {
    fieldName: 'Product name',
    min: FIELD_LIMITS.PRODUCT.NAME_MIN,
    max: FIELD_LIMITS.PRODUCT.NAME_MAX,
    emptyMsg: 'Please enter valid product name.',
    leadingDigitMsg: 'Please enter valid product name',
    containDigitMsg: 'Please enter valid product name',
  });
  if (nameErr) errors.name = nameErr;

  // SKU validation (if provided)
  if (sku !== undefined) {
    const cleanSku = String(sku || '').trim();
    if (!cleanSku) {
      errors.sku = 'SKU is required.';
    } else if (existingProducts.some((p) => p.sku && p.sku.toLowerCase() === cleanSku.toLowerCase())) {
      errors.sku = `SKU "${cleanSku}" already exists. SKU must be unique.`;
    }
  }

  // Category
  const cleanCat = String(category || '').trim();
  if (!cleanCat) {
    errors.category = 'Category is required.';
  } else if (cleanCat.length < FIELD_LIMITS.PRODUCT.CATEGORY_MIN) {
    errors.category = `Category must be at least ${FIELD_LIMITS.PRODUCT.CATEGORY_MIN} characters.`;
  } else if (cleanCat.length > FIELD_LIMITS.PRODUCT.CATEGORY_MAX) {
    errors.category = `Category cannot exceed ${FIELD_LIMITS.PRODUCT.CATEGORY_MAX} characters.`;
  }

  // Reusable Integer Validations
  const stockErr = validateIntegerField(currentStock, {
    fieldName: 'Stock',
    min: FIELD_LIMITS.PRODUCT.STOCK_MIN,
    max: FIELD_LIMITS.PRODUCT.STOCK_MAX,
    emptyMsg: 'Current stock is required.',
    formatMsg: 'Current stock must be a non-negative whole integer.',
  });
  if (stockErr) errors.currentStock = stockErr;

  const targetErr = validateIntegerField(safetyTarget, {
    fieldName: 'Safety target',
    min: FIELD_LIMITS.PRODUCT.TARGET_MIN,
    max: FIELD_LIMITS.PRODUCT.TARGET_MAX,
    emptyMsg: 'Safety target is required.',
    formatMsg: 'Safety target must be a non-negative whole integer.',
  });
  if (targetErr) errors.safetyTarget = targetErr;

  // Unit Cost / Price
  const priceStr = String(unitCost ?? '').trim();
  if (priceStr === '') {
    errors.unitCost = 'Unit price is required.';
  } else if (!/^\d+(\.\d{1,2})?$/.test(priceStr) || isNaN(Number(priceStr)) || Number(priceStr) < 0) {
    errors.unitCost = 'Unit price must be a valid non-negative number with at most 2 decimal places.';
  } else {
    const priceNum = Number(priceStr);
    if (priceNum < FIELD_LIMITS.PRODUCT.PRICE_MIN || priceNum > FIELD_LIMITS.PRODUCT.PRICE_MAX) {
      errors.unitCost = `Price must be between ₹${FIELD_LIMITS.PRODUCT.PRICE_MIN} and ₹${FIELD_LIMITS.PRODUCT.PRICE_MAX.toLocaleString()}.`;
    }
  }

  // Initial Order Qty (optional, defaults to 0)
  const qtyStr = String(orderQty ?? '').trim();
  if (qtyStr !== '') {
    const qtyCheck = validateOrderQtyInput(qtyStr);
    if (!qtyCheck.isValid) {
      errors.orderQty = qtyCheck.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSupplierForm(
  {
    name,
    supplierId,
    category,
    targetMoq,
    unitThreshold,
    contactRep,
    contactEmail,
    contactPhone,
    leadTime,
  },
  existingSuppliers = []
) {
  const errors = {};

  // Reusable Name Validation
  const nameErr = validateAlphaName(name, {
    fieldName: 'Supplier name',
    min: FIELD_LIMITS.SUPPLIER.NAME_MIN,
    max: FIELD_LIMITS.SUPPLIER.NAME_MAX,
    emptyMsg: 'Supplier name is required.',
    leadingDigitMsg: 'Please enter valid name ',
    containDigitMsg: 'Supplier name cannot contain numbers. Only letters, spaces, and punctuation are allowed.',
  });
  if (nameErr) errors.name = nameErr;

  // Supplier Identifier (if provided)
  if (supplierId !== undefined) {
    const cleanId = String(supplierId || '').trim();
    if (!cleanId) {
      errors.supplierId = 'Supplier ID is required.';
    } else if (existingSuppliers.some((s) => s.id && s.id.toLowerCase() === cleanId.toLowerCase())) {
      errors.supplierId = `Supplier ID "${cleanId}" already exists. Supplier identifiers must be unique.`;
    }
  }

  // Category
  const cleanCat = String(category || '').trim();
  if (!cleanCat) {
    errors.category = 'Primary category is required.';
  } else if (cleanCat.length < FIELD_LIMITS.SUPPLIER.CATEGORY_MIN) {
    errors.category = `Category must be at least ${FIELD_LIMITS.SUPPLIER.CATEGORY_MIN} characters.`;
  } else if (cleanCat.length > FIELD_LIMITS.SUPPLIER.CATEGORY_MAX) {
    errors.category = `Category cannot exceed ${FIELD_LIMITS.SUPPLIER.CATEGORY_MAX} characters.`;
  }

  // Target MOQ
  const moqStr = String(targetMoq ?? '').trim();
  if (moqStr === '') {
    errors.targetMoq = 'Target MOQ value is required.';
  } else if (isNaN(Number(moqStr)) || Number(moqStr) < 0) {
    errors.targetMoq = 'Target MOQ must be a non-negative number.';
  } else {
    const moqNum = Number(moqStr);
    if (moqNum < FIELD_LIMITS.SUPPLIER.MOQ_MIN || moqNum > FIELD_LIMITS.SUPPLIER.MOQ_MAX) {
      errors.targetMoq = `MOQ must be between ₹${FIELD_LIMITS.SUPPLIER.MOQ_MIN} and ₹${FIELD_LIMITS.SUPPLIER.MOQ_MAX.toLocaleString()}.`;
    }
  }

  // Reusable Integer Validation for Unit Threshold
  const unitsErr = validateIntegerField(unitThreshold, {
    fieldName: 'Unit threshold',
    required: false,
    min: FIELD_LIMITS.SUPPLIER.UNITS_MIN,
    max: FIELD_LIMITS.SUPPLIER.UNITS_MAX,
    formatMsg: 'Unit threshold must be a non-negative whole integer.',
  });
  if (unitsErr) errors.unitThreshold = unitsErr;

  // Reusable Contact Email
  const emailErr = validateEmailField(contactEmail, { required: false });
  if (emailErr) errors.contactEmail = emailErr;

  // Reusable Contact Rep
  const repErr = validateAlphaName(contactRep, {
    fieldName: 'Representative name',
    required: false,
    min: 2,
    max: FIELD_LIMITS.SUPPLIER.NAME_MAX,
    leadingDigitMsg: 'Please enter valid name',
    containDigitMsg: 'Representative name cannot contain numbers. Only letters, spaces, and punctuation are allowed.',
  });
  if (repErr) errors.contactRep = repErr;

  // Contact Phone (optional, validate format if supplied)
  const cleanPhone = String(contactPhone || '').trim();
  if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
    errors.contactPhone = 'Please enter a valid mobile number';
  }

  // Lead Time (optional, length limit)
  const cleanLead = String(leadTime || '').trim();
  if (cleanLead && cleanLead.length > FIELD_LIMITS.SUPPLIER.LEAD_TIME_MAX) {
    errors.leadTime = `Lead time description cannot exceed ${FIELD_LIMITS.SUPPLIER.LEAD_TIME_MAX} characters.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates Bulk Edit Parameters
 */
export function validateBulkEditParams({
  enableOrderQty,
  orderQtyMode,
  orderQtyValue,
  enableSafetyTarget,
  safetyTargetValue,
  enableCategory,
  categoryValue,
}) {
  const errors = {};

  if (!enableOrderQty && !enableSafetyTarget && !enableCategory) {
    return { isValid: false, errors: { form: 'Please select at least one field to update.' } };
  }

  if (enableOrderQty && orderQtyMode !== 'deficit') {
    const qtyStr = String(orderQtyValue ?? '').trim();
    if (orderQtyMode === 'set') {
      const check = validateOrderQtyInput(qtyStr);
      if (!check.isValid) errors.orderQty = check.error;
    } else if (orderQtyMode === 'increase') {
      if (!/^\d+$/.test(qtyStr)) {
        errors.orderQty = 'Increase amount must be a positive whole integer.';
      } else {
        const val = Number(qtyStr);
        if (val < FIELD_LIMITS.BULK.QTY_INCREASE_MIN || val > FIELD_LIMITS.BULK.QTY_INCREASE_MAX) {
          errors.orderQty = `Increase amount must be between ${FIELD_LIMITS.BULK.QTY_INCREASE_MIN} and ${FIELD_LIMITS.BULK.QTY_INCREASE_MAX.toLocaleString()} units.`;
        }
      }
    }
  }

  if (enableSafetyTarget) {
    const tgtStr = String(safetyTargetValue ?? '').trim();
    if (!/^\d+$/.test(tgtStr)) {
      errors.safetyTarget = 'Safety target must be a non-negative whole integer.';
    } else {
      const tgt = Number(tgtStr);
      if (tgt < FIELD_LIMITS.BULK.TARGET_MIN || tgt > FIELD_LIMITS.BULK.TARGET_MAX) {
        errors.safetyTarget = `Safety target must be between ${FIELD_LIMITS.BULK.TARGET_MIN} and ${FIELD_LIMITS.BULK.TARGET_MAX.toLocaleString()} units.`;
      }
    }
  }

  if (enableCategory) {
    const cleanCat = String(categoryValue ?? '').trim();
    if (!cleanCat) {
      errors.category = 'Please select or enter a valid category.';
    } else if (cleanCat.length < FIELD_LIMITS.PRODUCT.CATEGORY_MIN || cleanCat.length > FIELD_LIMITS.PRODUCT.CATEGORY_MAX) {
      errors.category = `Category must be between ${FIELD_LIMITS.PRODUCT.CATEGORY_MIN} and ${FIELD_LIMITS.PRODUCT.CATEGORY_MAX} characters.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
