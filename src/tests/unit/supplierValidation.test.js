// src/tests/unit/supplierValidation.test.js
// Unit tests for supplier minimum-order validation.

import { describe, it, expect } from 'vitest';
import { validateSupplierMinimum, validateAllSuppliers } from '../../utils/supplierValidation';

const SUPPLIER = { id: 's1', name: 'Acme', minimumOrder: 50 };

describe('validateSupplierMinimum', () => {
  it('passes when quantity meets the minimum', () => {
    expect(validateSupplierMinimum(SUPPLIER, 50).valid).toBe(true);
    expect(validateSupplierMinimum(SUPPLIER, 100).valid).toBe(true);
  });

  it('fails when quantity is below the minimum', () => {
    const result = validateSupplierMinimum(SUPPLIER, 30);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/30/);
    expect(result.message).toMatch(/50/);
  });
});

describe('validateAllSuppliers', () => {
  it('returns validation per supplier', () => {
    const groups = [{ supplierId: 's1', totalQty: 20 }];
    const byId   = { s1: SUPPLIER };
    const result = validateAllSuppliers(groups, byId);
    expect(result.s1.valid).toBe(false);
  });
});
