// src/services/apiClient.js
// Unified Data Client adapter delegating to SQLite WASM queries

import { fetchInventory, fetchSuppliers } from '../db/queries.js';

export class ApiError extends Error {
  constructor(status, statusText, body) {
    super(`HTTP ${status} ${statusText}`);
    this.status     = status;
    this.statusText = statusText;
    this.body       = body;
  }
}

export const apiClient = {
  get: async (path) => {
    if (path.startsWith('/products')) {
      return fetchInventory();
    }
    if (path.startsWith('/suppliers')) {
      return fetchSuppliers();
    }
    return [];
  },
  post: async (_path, data) => data,
  put: async (_path, data) => data,
  patch: async (_path, data) => data,
  delete: async () => ({ success: true }),
};
