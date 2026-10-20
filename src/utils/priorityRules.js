// src/utils/priorityRules.js
// Authoritative calculation of replenishment priorities and default matrix sorting

/**
 * Calculates priority based on stock level relative to safety target.
 * - Critical: currentStock <= safetyTarget * 0.5 (or stock is 0)
 * - Low: currentStock < safetyTarget (and > safetyTarget * 0.5)
 * - Healthy: currentStock >= safetyTarget
 *
 * @param {number} currentStock
 * @param {number} safetyTarget
 * @returns {'critical' | 'low' | 'healthy'}
 */
export function calculatePriority(currentStock, safetyTarget) {
  const stock = Number(currentStock) || 0;
  const target = Number(safetyTarget) || 0;

  if (target <= 0) return 'healthy';
  if (stock <= target * 0.5) return 'critical';
  if (stock < target) return 'low';
  return 'healthy';
}

/**
 * Calculates the replenishment deficit (units below safety target).
 *
 * @param {number} currentStock
 * @param {number} safetyTarget
 * @returns {number}
 */
export function calculateDeficit(currentStock, safetyTarget) {
  const stock = Number(currentStock) || 0;
  const target = Number(safetyTarget) || 0;
  return Math.max(0, target - stock);
}

/**
 * Default sorting for replenishment matrix:
 * 1. Critical items first
 * 2. Low priority items second
 * 3. Healthy items last
 * Within each priority group: secondary sort by largest replenishment deficit first.
 *
 * @param {Array} items
 * @returns {Array}
 */
export function sortByPriorityAndDeficit(items) {
  const priorityWeight = {
    critical: 0,
    low: 1,
    healthy: 2,
  };

  return [...items].sort((a, b) => {
    const pA = calculatePriority(a.currentStock, a.safetyTarget);
    const pB = calculatePriority(b.currentStock, b.safetyTarget);

    if (priorityWeight[pA] !== priorityWeight[pB]) {
      return priorityWeight[pA] - priorityWeight[pB];
    }

    // Secondary sort: largest replenishment deficit first
    const defA = calculateDeficit(a.currentStock, a.safetyTarget);
    const defB = calculateDeficit(b.currentStock, b.safetyTarget);

    if (defB !== defA) {
      return defB - defA;
    }

    // Tertiary sort: product name / SKU
    return (a.name || a.sku || '').localeCompare(b.name || b.sku || '');
  });
}

/**
 * Groups an array of products into critical, low, and healthy buckets.
 *
 * @param {Array} products
 * @returns {{ critical: Array, low: Array, healthy: Array }}
 */
export function groupProductsByPriority(products) {
  const critical = [];
  const low = [];
  const healthy = [];

  for (const p of products) {
    const priority = calculatePriority(p.currentStock, p.safetyTarget);
    if (priority === 'critical') critical.push(p);
    else if (priority === 'low') low.push(p);
    else healthy.push(p);
  }

  return { critical, low, healthy };
}
