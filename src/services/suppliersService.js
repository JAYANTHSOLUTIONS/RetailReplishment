// src/services/suppliersService.js
// Authoritative Service layer wrapping SQLite WASM queries

import {
  fetchSuppliers,
  fetchSupplierContact,
} from '../db/queries.js';

export const suppliersService = {
  getAll: () => fetchSuppliers(),
  getById: (id) => fetchSupplierContact(id),
};
