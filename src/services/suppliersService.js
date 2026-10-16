// src/services/suppliersService.js
// CRUD operations for the /suppliers resource.

import { apiClient } from './apiClient';

export const suppliersService = {
  getAll:  ()    => apiClient.get('/suppliers'),
  getById: (id)  => apiClient.get(`/suppliers/${id}`),
};
