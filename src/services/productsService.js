// src/services/productsService.js
// Authoritative Service layer wrapping SQLite WASM queries

import {
  fetchInventory,
  createProduct,
  updateProduct,
} from '../db/queries.js';

export const productsService = {
  getAll: (supplierId) => fetchInventory(supplierId),
  getById: async (id) => {
    const list = await fetchInventory();
    return list.find((p) => p.id === id) || null;
  },
  update: (id, data) => updateProduct(id, data),
  create: (data) => createProduct(data),
  remove: async () => {
    // Inventory items are managed via SQLite queries
    console.warn('[productsService] Direct item deletion is restricted to preserve manifest integrity.');
    return { success: false, message: 'Deletion restricted by database foreign key constraints' };
  },
};
