// src/utils/supplierValidation.js
// Validates that an order meets a supplier's minimum order requirements.

/**
 * @param {{ minimumOrder: number }} supplier
 * @param {number} totalQty  Total quantity being ordered from this supplier.
 * @returns {{ valid: boolean, message: string|null }}
 */
export function validateSupplierMinimum(supplier, totalQty) {
  if (totalQty < supplier.minimumOrder) {
    return {
      valid: false,
      message: `Order total (${totalQty}) is below the supplier minimum of ${supplier.minimumOrder} units.`,
    };
  }
  return { valid: true, message: null };
}

/**
 * Returns a map of supplierId → validation result for all selected supplier groups.
 */
export function validateAllSuppliers(supplierGroups, suppliersById) {
  return Object.fromEntries(
    supplierGroups.map((group) => [
      group.supplierId,
      validateSupplierMinimum(suppliersById[group.supplierId], group.totalQty),
    ])
  );
}
