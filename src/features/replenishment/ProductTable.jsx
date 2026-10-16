// src/features/replenishment/ProductTable.jsx
// Displays the paginated/sorted list of products with selection checkboxes.

import React from 'react';

export default function ProductTable({ products = [], selectedIds = new Set(), onToggle }) {
  return (
    <div className="replenishment-table-wrapper" role="region" aria-label="Products">
      <table className="replenishment-table">
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">Select</span></th>
            <th scope="col">SKU</th>
            <th scope="col">Product</th>
            <th scope="col">Supplier</th>
            <th scope="col">Stock</th>
            <th scope="col">Status</th>
            <th scope="col">Order Qty</th>
            <th scope="col">Priority</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} aria-selected={selectedIds.has(p.id)}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.id)}
                  onChange={() => onToggle(p.id)}
                  aria-label={`Select ${p.name}`}
                />
              </td>
              <td>{p.sku}</td>
              <td>{p.name}</td>
              <td>{p.supplierName}</td>
              <td>{p.currentStock}</td>
              <td>{p.status}</td>
              <td>{/* QuantityEditor goes here */}</td>
              <td>{p.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
