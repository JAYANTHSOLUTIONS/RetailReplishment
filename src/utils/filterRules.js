// src/utils/filterRules.js

/**
 * Authoritative predicate to evaluate if a product matches the applied advanced filter criteria:
 * - Status (critical, low, healthy, ordered): OR within group
 * - Supplier: OR within group
 * - Category: OR within group
 * - Stock Level (below, at, above target): OR within group
 * - Search term: SKU, Name, Category, ID
 * - Combined across groups with strict AND logic
 */
export function matchesFilters(prod, filters) {
  if (!filters) return true;

  // 1. Status Filter (OR within group, AND across groups)
  if (filters.statuses && filters.statuses.length > 0) {
    const isOrdered = prod.orderStatus === 'ordered';
    const effectiveStatus = isOrdered ? 'ordered' : prod.priority;
    if (!filters.statuses.includes(effectiveStatus)) {
      return false;
    }
  }

  // 2. Supplier Filter (OR within group, AND across groups)
  if (filters.suppliers && filters.suppliers.length > 0) {
    if (!filters.suppliers.includes(prod.supplierId)) {
      return false;
    }
  }

  // 3. Category Filter (OR within group, AND across groups)
  if (filters.categories && filters.categories.length > 0) {
    if (!filters.categories.includes(prod.category)) {
      return false;
    }
  }

  // 4. Product Search in filter modal
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    const matchesSearch =
      (prod.name && prod.name.toLowerCase().includes(q)) ||
      (prod.sku && prod.sku.toLowerCase().includes(q)) ||
      (prod.category && prod.category.toLowerCase().includes(q)) ||
      (prod.id && prod.id.toLowerCase().includes(q));
    if (!matchesSearch) {
      return false;
    }
  }

  return true;
}
