// src/utils/priority.js
// Derives a product's replenishment priority and sort order based on stock data.

/**
 * Calculates stock replenishment priority.
 * Supports both safetyTarget mode ('critical' | 'low' | 'healthy')
 * and reorderPoint mode ('critical' | 'high' | 'medium' | 'low').
 *
 * @param {{ currentStock: number, safetyTarget?: number, reorderPoint?: number, dailySales?: number }} product
 * @returns {'critical'|'high'|'low'|'medium'|'healthy'}
 */
export function calcPriority(product) {
  const stock = Number(product.currentStock) || 0;

  if (stock <= 0) {
    return 'critical';
  }

  // If safetyTarget is explicitly configured
  if (product.safetyTarget !== undefined) {
    const target = Number(product.safetyTarget) || 30;
    if (stock <= Math.round(target * 0.3)) return 'critical';
    if (stock < Math.round(target * 0.7)) return 'low';
    return 'healthy';
  }

  // Reorder point logic
  const rop = Number(product.reorderPoint) || 0;
  const sales = Number(product.dailySales) || 0;

  if (stock < rop) return 'high';
  if (sales > 0 && stock / sales < 14) return 'medium';
  return 'low';
}

/**
 * Priority rank comparator (critical first).
 */
export const PRIORITY_RANK = {
  critical: 0,
  high: 1,
  low: 2,
  medium: 2,
  healthy: 3,
};

export function comparePriority(a, b) {
  const rankA = PRIORITY_RANK[a.priority] ?? 9;
  const rankB = PRIORITY_RANK[b.priority] ?? 9;
  if (rankA !== rankB) return rankA - rankB;

  // Secondary sort by deficit
  const targetA = a.safetyTarget || a.reorderPoint || 0;
  const targetB = b.safetyTarget || b.reorderPoint || 0;
  const deficitA = Math.max(0, targetA - (a.currentStock || 0));
  const deficitB = Math.max(0, targetB - (b.currentStock || 0));
  return deficitB - deficitA;
}
