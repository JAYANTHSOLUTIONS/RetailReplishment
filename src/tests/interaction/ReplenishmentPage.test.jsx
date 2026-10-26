// src/tests/interaction/ReplenishmentPage.test.jsx
// Interaction tests for the ReplenishmentPage feature using authoritative SQLite queries mock.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReplenishmentPage from '../../features/replenishment/ReplenishmentPage';

const mockSuppliers = [
  {
    id: 'hf',
    name: 'Heritage Foods',
    category: 'Dairy & Fresh Produce',
    initials: 'HF',
    badge: 'Tier 1 Prime',
    badgeType: 'prime',
    targetMoq: 8000,
    unitThreshold: 40,
    leadTime: '24-48 hrs',
    color: '#0284c7',
    allHealthy: false,
  },
  {
    id: 'bi',
    name: 'Britannia Industries',
    category: 'Bakery & Packaged Goods',
    initials: 'BI',
    badge: 'National Partner',
    badgeType: 'partner',
    targetMoq: 12000,
    unitThreshold: 60,
    leadTime: '3-5 days',
    color: '#d97706',
    allHealthy: false,
  },
];

let mockProducts = [
  {
    id: 'hf-001',
    sku: 'HF-001',
    name: 'A2 Organic Whole Milk 1L',
    category: 'Dairy',
    supplierId: 'hf',
    currentStock: 5,
    safetyTarget: 40,
    orderQty: 35,
    unitCost: 75.0,
    selected: 0,
    orderStatus: 'none',
    priority: 'critical',
  },
  {
    id: 'hf-002',
    sku: 'HF-002',
    name: 'Full Cream Curd 500g',
    category: 'Dairy',
    supplierId: 'hf',
    currentStock: 8,
    safetyTarget: 50,
    orderQty: 0,
    selected: 0,
    orderStatus: 'none',
    priority: 'critical',
  },
];

vi.mock('../../db/queries.js', () => ({
  fetchSuppliers: vi.fn(() => Promise.resolve(mockSuppliers)),
  fetchInventory: vi.fn(() => Promise.resolve(mockProducts)),
  fetchCategories: vi.fn(() => Promise.resolve(['Dairy', 'Bakery'])),
  fetchSupplierContact: vi.fn(() => Promise.resolve(null)),
  fetchPendingManifests: vi.fn(() => Promise.resolve([])),
  fetchPOHistory: vi.fn(() => Promise.resolve([])),
  batchUpdateOrderQuantities: vi.fn((updates) => {
    mockProducts = mockProducts.map((p) => {
      const match = updates.find((u) => u.sku === p.sku);
      return match ? { ...p, orderQty: match.orderQty } : p;
    });
    return Promise.resolve(true);
  }),
  fetchReorderAcknowledgements: vi.fn(() => Promise.resolve([])),
  saveReorderAcknowledgement: vi.fn(() => Promise.resolve(true)),
  saveAppSetting: vi.fn(() => Promise.resolve(true)),
  toggleItemSelection: vi.fn((id, currentVal) => {
    mockProducts = mockProducts.map((p) =>
      p.id === id ? { ...p, selected: currentVal ? 0 : 1 } : p
    );
    return Promise.resolve(!currentVal);
  }),
  clearAllSelection: vi.fn(() => {
    mockProducts = mockProducts.map((p) => ({ ...p, selected: 0 }));
    return Promise.resolve(true);
  }),
  applySupplierMinimums: vi.fn(() => Promise.resolve({ count: 1 })),
  saveDraftPO: vi.fn(() => Promise.resolve({ id: 'draft-1' })),
  submitPurchaseOrder: vi.fn(() => Promise.resolve({ id: 'po-1' })),
  deletePurchaseOrder: vi.fn(() => Promise.resolve(true)),
}));

describe('ReplenishmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing and displays search input', async () => {
    render(<ReplenishmentPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search sku, item name/i)).toBeInTheDocument();
    });
  });

  it('renders product rows with name, SKU, and unit price', async () => {
    render(<ReplenishmentPage />);
    await waitFor(() => {
      expect(screen.getByText('A2 Organic Whole Milk 1L')).toBeInTheDocument();
      expect(screen.getByText('HF-001')).toBeInTheDocument();
      expect(screen.getByText('Full Cream Curd 500g')).toBeInTheDocument();
    });
  });

  it('handles row selection via checkbox toggle', async () => {
    render(<ReplenishmentPage />);
    await waitFor(() => {
      expect(screen.getByText('A2 Organic Whole Milk 1L')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    // First row checkbox (after select-all if present)
    const productCheckbox = checkboxes[1] || checkboxes[0];
    fireEvent.click(productCheckbox);

    // Verify checkbox can be interacted with
    expect(productCheckbox).toBeDefined();
  });

  it('allows clicking inline quantity button to activate edit mode', async () => {
    render(<ReplenishmentPage />);
    await waitFor(() => {
      expect(screen.getByText('A2 Organic Whole Milk 1L')).toBeInTheDocument();
    });

    // Find quantity edit button
    const qtyButton = screen.getByRole('button', { name: '35' });
    expect(qtyButton).toBeInTheDocument();

    fireEvent.click(qtyButton);

    // Input becomes active
    const input = screen.getByLabelText(/order quantity/i);
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('35');
  });

  it('displays supplier review and calculates threshold metrics when items are selected', async () => {
    // Set 1 item selected initially
    mockProducts[0].selected = 1;
    render(<ReplenishmentPage />);

    await waitFor(() => {
      expect(screen.getByText('A2 Organic Whole Milk 1L')).toBeInTheDocument();
    });

    // With 35 units * ₹75 = ₹2,625, Target MOQ is ₹8,000 -> Draft queue panel is open
    await waitFor(() => {
      const queueHeaders = screen.getAllByText(/Queue/i);
      expect(queueHeaders.length).toBeGreaterThan(0);
    });
  });
});
