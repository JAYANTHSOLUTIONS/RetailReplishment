// src/services/productsService.js
// CRUD operations for the /products resource.

import { apiClient } from './apiClient';

export const productsService = {
  getAll:  ()           => apiClient.get('/products'),
  getById: (id)         => apiClient.get(`/products/${id}`),
  update:  (id, data)   => apiClient.patch(`/products/${id}`, data),
  create:  (data)       => apiClient.post('/products', data),
  remove:  (id)         => apiClient.delete(`/products/${id}`),
};
