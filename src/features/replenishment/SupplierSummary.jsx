// src/features/replenishment/SupplierSummary.jsx
// Aggregates selected products by supplier; shows totals and minimum-order warnings.

import React from 'react';

export default function SupplierSummary({ supplierGroups = [] }) {
  return (
    <aside className="replenishment-supplier-summary" aria-label="Supplier order summary">
      <h2 className="supplier-summary__title">Supplier Summary</h2>
      {supplierGroups.length === 0 && (
        <p className="supplier-summary__empty">No products selected.</p>
      )}
      {supplierGroups.map((group) => (
        <div key={group.supplierId} className="supplier-summary__group">
          <h3 className="supplier-summary__name">{group.supplierName}</h3>
          <ul className="supplier-summary__list">
            {group.items.map((item) => (
              <li key={item.productId}>
                {item.productName} — Qty: {item.qty}
              </li>
            ))}
          </ul>
          <p className="supplier-summary__total">
            Total: {group.totalQty} units
            {group.belowMinimum && (
              <span className="supplier-summary__warning" role="alert">
                {' '}⚠ Below minimum order ({group.minimumOrder})
              </span>
            )}
          </p>
        </div>
      ))}
    </aside>
  );
}
