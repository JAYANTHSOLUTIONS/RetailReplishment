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
 */
export function validateOrderQtyInput(rawVal) {
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
  if (num > FIELD_LIMITS.PRODUCT.QTY_MAX) {
    return {
      isValid: false,
      error: `Quantity cannot exceed ${FIELD_LIMITS.PRODUCT.QTY_MAX.toLocaleString()} units.`,
      value: num,
    };
  }
  return { isValid: true, error: null, value: num };
}

export function validateProductForm(
  { name, sku, category, currentStock, safetyTarget, unitCost, orderQty },
  existingProducts = []
) {
  const errors = {};

  // Name
  const cleanName = String(name || '').trim();
  if (!cleanName) {
    errors.name = 'Please enter valid product name.';
  } else if (/^\d/.test(cleanName)) {
    errors.name = 'Please enter valid product name';
  } else if (/\d/.test(cleanName)) {
    errors.name = 'Please enter valid product name';
  } else if (cleanName.length < FIELD_LIMITS.PRODUCT.NAME_MIN) {
    errors.name = `Product name must be at least ${FIELD_LIMITS.PRODUCT.NAME_MIN} characters.`;
  } else if (cleanName.length > FIELD_LIMITS.PRODUCT.NAME_MAX) {
    errors.name = `Product name cannot exceed ${FIELD_LIMITS.PRODUCT.NAME_MAX} characters.`;
  }

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

  // Current Stock
  const stockStr = String(currentStock ?? '').trim();
  if (stockStr === '') {
    errors.currentStock = 'Current stock is required.';
  } else if (!/^\d+$/.test(stockStr)) {
    errors.currentStock = 'Current stock must be a non-negative whole integer.';
  } else {
    const stockNum = Number(stockStr);
    if (stockNum < FIELD_LIMITS.PRODUCT.STOCK_MIN || stockNum > FIELD_LIMITS.PRODUCT.STOCK_MAX) {
      errors.currentStock = `Stock must be between ${FIELD_LIMITS.PRODUCT.STOCK_MIN} and ${FIELD_LIMITS.PRODUCT.STOCK_MAX.toLocaleString()}.`;
    }
  }

  // Safety Target
  const targetStr = String(safetyTarget ?? '').trim();
  if (targetStr === '') {
    errors.safetyTarget = 'Safety target is required.';
  } else if (!/^\d+$/.test(targetStr)) {
    errors.safetyTarget = 'Safety target must be a non-negative whole integer.';
  } else {
    const targetNum = Number(targetStr);
    if (targetNum < FIELD_LIMITS.PRODUCT.TARGET_MIN || targetNum > FIELD_LIMITS.PRODUCT.TARGET_MAX) {
      errors.safetyTarget = `Safety target must be between ${FIELD_LIMITS.PRODUCT.TARGET_MIN} and ${FIELD_LIMITS.PRODUCT.TARGET_MAX.toLocaleString()}.`;
    }
  }

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

  // Name
  const cleanName = String(name || '').trim();
  if (!cleanName) {
    errors.name = 'Supplier name is required.';
  } else if (/^\d/.test(cleanName)) {
    errors.name = 'Please enter valid name ';
  } else if (/\d/.test(cleanName)) {
    errors.name = 'Supplier name cannot contain numbers. Only letters, spaces, and punctuation are allowed.';
  } else if (cleanName.length < FIELD_LIMITS.SUPPLIER.NAME_MIN) {
    errors.name = `Supplier name must be at least ${FIELD_LIMITS.SUPPLIER.NAME_MIN} characters.`;
  } else if (cleanName.length > FIELD_LIMITS.SUPPLIER.NAME_MAX) {
    errors.name = `Supplier name cannot exceed ${FIELD_LIMITS.SUPPLIER.NAME_MAX} characters.`;
  }

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

  // Unit / Freight Threshold
  const unitsStr = String(unitThreshold ?? '').trim();
  if (unitsStr !== '') {
    if (!/^\d+$/.test(unitsStr)) {
      errors.unitThreshold = 'Unit threshold must be a non-negative whole integer.';
    } else {
      const unitsNum = Number(unitsStr);
      if (unitsNum < FIELD_LIMITS.SUPPLIER.UNITS_MIN || unitsNum > FIELD_LIMITS.SUPPLIER.UNITS_MAX) {
        errors.unitThreshold = `Unit threshold must be between ${FIELD_LIMITS.SUPPLIER.UNITS_MIN} and ${FIELD_LIMITS.SUPPLIER.UNITS_MAX.toLocaleString()}.`;
      }
    }
  }

  // Contact Email (optional, strict email validation: no leading numbers, minimum 4 alpha letters before numbers)
  const cleanEmail = String(contactEmail || '').trim();
  if (cleanEmail) {
    if (/^\d/.test(cleanEmail)) {
      errors.contactEmail = 'Please enter valid email';
    } else if (!/^[a-zA-Z]{4,}/.test(cleanEmail)) {
      errors.contactEmail = 'Email must start with at least 4 letters before any numbers or symbols (e.g. supp12@domain.com).';
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      errors.contactEmail = 'Please enter a valid email address (e.g. orders@supplier.com).';
    }
  }

  // Contact Rep (optional, strict name validation: no numbers, cannot start with a number)
  const cleanRep = String(contactRep || '').trim();
  if (cleanRep) {
    if (/^\d/.test(cleanRep)) {
      errors.contactRep = 'Please enter valid name';
    } else if (/\d/.test(cleanRep)) {
      errors.contactRep = 'Representative name cannot contain numbers. Only letters, spaces, and punctuation are allowed.';
    } else if (cleanRep.length < 2) {
      errors.contactRep = 'Representative name must be at least 2 characters.';
    } else if (cleanRep.length > FIELD_LIMITS.SUPPLIER.NAME_MAX) {
      errors.contactRep = `Representative name cannot exceed ${FIELD_LIMITS.SUPPLIER.NAME_MAX} characters.`;
    }
  }

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
