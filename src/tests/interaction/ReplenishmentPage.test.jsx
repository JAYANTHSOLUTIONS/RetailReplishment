// src/tests/interaction/ReplenishmentPage.test.jsx
// Interaction tests for the ReplenishmentPage feature.
// Uses @testing-library/react – install: npm i -D @testing-library/react @testing-library/user-event vitest jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen }         from '@testing-library/react';
import ReplenishmentPage                         from '../../features/replenishment/ReplenishmentPage';

// Mock the services so tests don't hit a real server
vi.mock('../../services', () => ({
  productsService: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'p1', sku: 'SKU-001', name: 'Widget A',
        supplierId: 's1', supplierName: 'Acme',
        currentStock: 2, reorderPoint: 10, dailySales: 2,
        status: 'critical', priority: 'critical',
      },
    ]),
  },
  suppliersService: { getAll: vi.fn().mockResolvedValue([]) },
}));

describe('ReplenishmentPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    render(<ReplenishmentPage />);
    expect(screen.getByRole('search', { name: /filter products/i })).toBeInTheDocument();
  });

  // TODO: add tests for product row rendering, checkbox selection,
  //       quantity editing, supplier summary update, and validation warnings.
});
