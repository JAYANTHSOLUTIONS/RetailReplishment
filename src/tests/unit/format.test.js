// src/tests/unit/format.test.js
// Unit tests for formatting utilities.

import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatDate, capitalise } from '../../utils/format';

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });
});

describe('formatPercent', () => {
  it('converts 0.85 to "85%"', () => {
    expect(formatPercent(0.85)).toBe('85%');
  });
});

describe('formatDate', () => {
  it('returns a non-empty string for a valid date', () => {
    const result = formatDate('2024-01-15');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('capitalise', () => {
  it('capitalises the first letter', () => {
    expect(capitalise('hello')).toBe('Hello');
  });
  it('handles empty string', () => {
    expect(capitalise('')).toBe('');
  });
});
