// src/utils/supplierValidation.js
// Validates supplier minimum order value (MOQ) and unit thresholds

import { calculateOrderTotals, calculateMoqProgress, calculateUnitThresholdProgress, formatCurrency } from './orderCalculations.js';

/**
 * Validates whether an order meets the supplier's mandatory MOQ and unit threshold.
 *
 * @param {Object} supplier - Supplier configuration (targetMoq, unitThreshold, etc.)
 * @param {Array} items - Selected order items for this supplier
 * @returns {{
 *   valid: boolean,
 *   subtotal: number,
 *   totalUnits: number,
 *   isMoqMet: boolean,
 *   remainingAmount: number,
 *   isUnitsMet: boolean,
 *   remainingUnits: number,
 *   message: string | null
 * }}
 */
export function validateSupplierMoq(supplier, items = []) {
  if (!supplier) {
    return {
      valid: false,
      subtotal: 0,
      totalUnits: 0,
      isMoqMet: false,
      remainingAmount: 0,
      isUnitsMet: false,
      remainingUnits: 0,
      message: 'No supplier specified for validation.',
    };
  }

  const { subtotal, totalUnits } = calculateOrderTotals(items);
  const targetMoq = Number(supplier.targetMoq ?? supplier.target_moq) || 0;
  const unitThreshold = Number(supplier.unitThreshold ?? supplier.unit_threshold) || 0;

  const moqProgress = calculateMoqProgress(subtotal, targetMoq);
  const unitProgress = calculateUnitThresholdProgress(totalUnits, unitThreshold);

  if (items.length === 0) {
    return {
      valid: false,
      subtotal: 0,
      totalUnits: 0,
      isMoqMet: false,
      remainingAmount: targetMoq,
      isUnitsMet: false,
      remainingUnits: unitThreshold,
      message: 'No products selected for ordering.',
    };
  }

  if (!moqProgress.isMet) {
    return {
      valid: false,
      subtotal,
      totalUnits,
      isMoqMet: false,
      remainingAmount: moqProgress.remainingAmount,
      isUnitsMet: unitProgress.isMet,
      remainingUnits: unitProgress.remainingUnits,
      message: `${formatCurrency(moqProgress.remainingAmount)} more required to meet the supplier minimum`,
    };
  }

  if (!unitProgress.isMet) {
    return {
      valid: false,
      subtotal,
      totalUnits,
      isMoqMet: true,
      remainingAmount: 0,
      isUnitsMet: false,
      remainingUnits: unitProgress.remainingUnits,
      message: `${unitProgress.remainingUnits} more units required to meet the freight threshold (${unitThreshold} units)`,
    };
  }

  return {
    valid: true,
    subtotal,
    totalUnits,
    isMoqMet: true,
    remainingAmount: 0,
    isUnitsMet: true,
    remainingUnits: 0,
    message: null,
  };
}

/**
 * Groups an array of selected products by supplier and calculates review summary metrics.
 *
 * @param {Array} selectedItems
 * @param {Array} allSuppliers
 * @returns {Array<{
 *   supplier: Object,
 *   items: Array,
 *   subtotal: number,
 *   totalUnits: number,
 *   validation: Object
 * }>}
 */
export function groupSelectedBySupplier(selectedItems = [], allSuppliers = []) {
  const supplierMap = new Map();
  allSuppliers.forEach((s) => supplierMap.set(s.id, s));

  const groups = new Map();

  for (const item of selectedItems) {
    const supId = item.supplierId ?? item.supplier_id;
    if (!groups.has(supId)) {
      groups.set(supId, []);
    }
    groups.get(supId).push(item);
  }

  const results = [];
  for (const [supId, items] of groups.entries()) {
    const supplier = supplierMap.get(supId) || { id: supId, name: 'Unknown Supplier', targetMoq: 0 };
    const validation = validateSupplierMoq(supplier, items);
    results.push({
      supplier,
      items,
      subtotal: validation.subtotal,
      totalUnits: validation.totalUnits,
      validation,
    });
  }

  return results;
}

/**
 * Validates whether an order quantity meets the supplier's threshold (Unit test helper).
 */
export function validateSupplierMinimum(supplier, quantity) {
  const min = Number(supplier?.minimumOrder ?? supplier?.unitThreshold ?? 0);
  const valid = quantity >= min;
  return {
    valid,
    message: valid ? null : `Quantity ${quantity} is below minimum of ${min}`,
  };
}

/**
 * Validates all supplier groups against their minimum thresholds.
 */
export function validateAllSuppliers(groups = [], byId = {}) {
  const result = {};
  for (const g of groups) {
    const sup = byId[g.supplierId] || { minimumOrder: 0 };
    result[g.supplierId] = validateSupplierMinimum(sup, g.totalQty);
  }
  return result;
}
