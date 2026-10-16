// src/tests/unit/priority.test.js
// Unit tests for priority calculation logic.
// Run with: npx vitest

import { describe, it, expect } from 'vitest';
import { calcPriority, comparePriority } from '../../utils/priority';

describe('calcPriority', () => {
  it('returns "critical" when stock is zero', () => {
    expect(calcPriority({ currentStock: 0, reorderPoint: 10, dailySales: 5 })).toBe('critical');
  });

  it('returns "critical" when stock is negative', () => {
    expect(calcPriority({ currentStock: -1, reorderPoint: 10, dailySales: 5 })).toBe('critical');
  });

  it('returns "high" when stock is below reorder point', () => {
    expect(calcPriority({ currentStock: 5, reorderPoint: 10, dailySales: 2 })).toBe('high');
  });

  it('returns "medium" when days of stock < 14', () => {
    // 20 stock / 2 daily = 10 days, above reorder point (8)
    expect(calcPriority({ currentStock: 20, reorderPoint: 8, dailySales: 2 })).toBe('medium');
  });

  it('returns "low" when well stocked', () => {
    expect(calcPriority({ currentStock: 100, reorderPoint: 10, dailySales: 2 })).toBe('low');
  });

  it('returns "low" when dailySales is 0 (no depletion)', () => {
    expect(calcPriority({ currentStock: 5, reorderPoint: 3, dailySales: 0 })).toBe('low');
  });
});

describe('comparePriority', () => {
  it('sorts critical before high', () => {
    expect(comparePriority({ priority: 'critical' }, { priority: 'high' })).toBeLessThan(0);
  });

  it('treats equal priority as 0', () => {
    expect(comparePriority({ priority: 'medium' }, { priority: 'medium' })).toBe(0);
  });
});
