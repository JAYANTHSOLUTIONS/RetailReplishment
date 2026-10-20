// src/utils/orderCalculations.js
// Financial totals, line items, MOQ progress, and unit thresholds

/**
 * Formats a monetary amount into INR currency (₹).
 * Handles null, undefined, NaN, and negative safely.
 *
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  return '₹' + Math.round(num).toLocaleString('en-IN');
}

/**
 * Calculates line subtotal safely.
 *
 * @param {number} qty
 * @param {number} unitCost
 * @returns {number}
 */
export function calculateLineSubtotal(qty, unitCost) {
  const q = Math.max(0, parseInt(qty, 10) || 0);
  const c = Math.max(0, parseFloat(unitCost) || 0);
  return q * c;
}

/**
 * Calculates order totals from an array of selected items.
 *
 * @param {Array} items
 * @returns {{ subtotal: number, tax: number, total: number, totalUnits: number, itemCount: number }}
 */
export function calculateOrderTotals(items = []) {
  let subtotal = 0;
  let totalUnits = 0;

  for (const item of items) {
    const qty = Math.max(0, parseInt(item.orderQty ?? item.quantity, 10) || 0);
    const cost = Math.max(0, parseFloat(item.unitCost ?? item.unitPrice) || 0);
    subtotal += qty * cost;
    totalUnits += qty;
  }

  const tax = 0; // standard tax or freight if zero-rated
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total,
    totalUnits,
    itemCount: items.length,
  };
}

/**
 * Calculates MOQ financial progress.
 *
 * @param {number} orderTotal
 * @param {number} targetMoq
 * @returns {{ progressPct: number, remainingAmount: number, isMet: boolean }}
 */
export function calculateMoqProgress(orderTotal, targetMoq) {
  const total = Math.max(0, Number(orderTotal) || 0);
  const moq = Math.max(0, Number(targetMoq) || 0);

  if (moq <= 0) {
    return { progressPct: 100, remainingAmount: 0, isMet: true };
  }

  const remainingAmount = Math.max(0, moq - total);
  const progressPct = Math.min(100, Math.round((total / moq) * 100));
  const isMet = total >= moq;

  return { progressPct, remainingAmount, isMet };
}

/**
 * Calculates unit threshold progress.
 *
 * @param {number} totalUnits
 * @param {number} unitThreshold
 * @returns {{ progressPct: number, remainingUnits: number, isMet: boolean }}
 */
export function calculateUnitThresholdProgress(totalUnits, unitThreshold) {
  const units = Math.max(0, Number(totalUnits) || 0);
  const threshold = Math.max(0, Number(unitThreshold) || 0);

  if (threshold <= 0) {
    return { progressPct: 100, remainingUnits: 0, isMet: true };
  }

  const remainingUnits = Math.max(0, threshold - units);
  const progressPct = Math.min(100, Math.round((units / threshold) * 100));
  const isMet = units >= threshold;

  return { progressPct, remainingUnits, isMet };
}
