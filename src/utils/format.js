// src/utils/format.js
// Shared formatting helpers.

/**
 * Format a number as a compact currency string.
 * @param {number} value
 * @param {string} [currency='USD']
 */
export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

/**
 * Format a decimal as a percentage string (e.g. 0.85 → "85%").
 */
export function formatPercent(value, decimals = 0) {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a date-like value as a short locale date string.
 */
export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/**
 * Capitalise the first letter of a string.
 */
export function capitalise(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
