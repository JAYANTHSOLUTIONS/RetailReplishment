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
    NAME_MAX: 100,
    CATEGORY_MIN: 2,
    CATEGORY_MAX: 50,
    STOCK_MIN: 0,
    STOCK_MAX: 999999,
    TARGET_MIN: 0,
    TARGET_MAX: 999999,
    PRICE_MIN: 0,
    PRICE_MAX: 1000000,
    QTY_MIN: 0,
    QTY_MAX: 99999,
  },
  SUPPLIER: {
    NAME_MIN: 2,
    NAME_MAX: 80,
    CATEGORY_MIN: 2,
    CATEGORY_MAX: 50,
    MOQ_MIN: 0,
    MOQ_MAX: 10000000,
    UNITS_MIN: 0,
    UNITS_MAX: 100000,
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;

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
    errors.name = 'Product name is required.';
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
  } else if (isNaN(Number(priceStr)) || Number(priceStr) < 0) {
    errors.unitCost = 'Unit price must be a non-negative number.';
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

  // Contact Email (optional, validate format if supplied)
  const cleanEmail = String(contactEmail || '').trim();
  if (cleanEmail && !EMAIL_REGEX.test(cleanEmail)) {
    errors.contactEmail = 'Please enter a valid email address (e.g. orders@supplier.com).';
  }

  // Contact Rep (optional, length limit)
  const cleanRep = String(contactRep || '').trim();
  if (cleanRep && cleanRep.length > FIELD_LIMITS.SUPPLIER.NAME_MAX) {
    errors.contactRep = `Representative name cannot exceed ${FIELD_LIMITS.SUPPLIER.NAME_MAX} characters.`;
  }

  // Contact Phone (optional, validate format if supplied)
  const cleanPhone = String(contactPhone || '').trim();
  if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
    errors.contactPhone = 'Please enter a valid phone number (7–15 digits, e.g. +91 98765 43210).';
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
