// scripts/test_validation_and_rules.mjs
import {
  FIELD_LIMITS,
  validateOrderQtyInput,
  validateProductForm,
  validateSupplierForm,
  validateBulkEditParams,
  validateSupplierMoq,
  handleAlphaOnlyKeyDown,
  sanitizeAlphaName,
} from '../src/utils/index.js';
import { matchesFilters } from '../src/utils/filterRules.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    failed++;
    console.error(`✗ ${message}`);
  }
}

console.log('--- 1. Testing Field Limits & Validation ---');

// 1. Order Qty validation
assert(validateOrderQtyInput('').isValid === false, 'Empty order qty is invalid');
assert(validateOrderQtyInput('-5').isValid === false, 'Negative order qty is invalid');
assert(validateOrderQtyInput('3.14').isValid === false, 'Fractional order qty is invalid');
assert(validateOrderQtyInput('100000').isValid === false, 'Out-of-range order qty (>99999) is invalid');
assert(validateOrderQtyInput('abc').isValid === false, 'Non-numeric order qty is invalid');
assert(validateOrderQtyInput('0').isValid === true && validateOrderQtyInput('0').value === 0, '0 order qty is valid');
assert(validateOrderQtyInput('42').isValid === true && validateOrderQtyInput('42').value === 42, '42 order qty is valid');
assert(validateOrderQtyInput('  50  ').isValid === true && validateOrderQtyInput('  50  ').value === 50, 'Whitespace-trimmed order qty is valid');
assert(validateOrderQtyInput('5', { currentStock: 10, safetyTarget: 30 }).isValid === false, 'Order qty below safety target deficit (20) is invalid');
assert(validateOrderQtyInput('20', { currentStock: 10, safetyTarget: 30 }).isValid === true, 'Order qty meeting safety target deficit (20) is valid');
assert(validateOrderQtyInput('25', { currentStock: 10, safetyTarget: 30 }).isValid === true, 'Order qty exceeding safety target deficit (20) is valid');

// 2. Product Form Validation
const existingProducts = [
  { sku: 'SKU-001' },
  { sku: 'SKU-002' }
];

const emptyProd = validateProductForm({ name: '', sku: '', currentStock: '', safetyTarget: '', unitCost: '' }, existingProducts);
assert(emptyProd.isValid === false, 'Empty product form is rejected');
assert(emptyProd.errors.name !== undefined, 'Product name required error present');
assert(emptyProd.errors.sku !== undefined, 'Product SKU required error present');

const dupSkuProd = validateProductForm({ name: 'Valid Name', sku: 'SKU-001', currentStock: '10', safetyTarget: '20', unitCost: '15' }, existingProducts);
assert(dupSkuProd.isValid === false && dupSkuProd.errors.sku.includes('already exists'), 'Duplicate SKU rejected');

const negProd = validateProductForm({ name: 'Valid Name', sku: 'SKU-NEW', currentStock: '-5', safetyTarget: '20', unitCost: '-10' }, existingProducts);
assert(negProd.isValid === false && negProd.errors.currentStock !== undefined, 'Negative stock rejected');
assert(negProd.isValid === false && negProd.errors.unitCost !== undefined, 'Negative cost rejected');

const overflowProd = validateProductForm({ name: 'Valid Name', sku: 'SKU-NEW', currentStock: '1000000', safetyTarget: '20', unitCost: '2000000' }, existingProducts);
assert(overflowProd.isValid === false && overflowProd.errors.currentStock !== undefined, 'Overflow stock rejected (>999,999)');
assert(overflowProd.isValid === false && overflowProd.errors.unitCost !== undefined, 'Overflow price rejected (>1,000,000)');

const validProd = validateProductForm({ name: 'Good Biscuit', sku: 'SKU-NEW', category: 'Bakery', currentStock: '100', safetyTarget: '200', unitCost: '12.50' }, existingProducts);
assert(validProd.isValid === true, 'Valid product form accepted');

// 3. Supplier Form Validation
const existingSuppliers = [{ id: 'sup1', name: 'Britannia' }];

const emptySup = validateSupplierForm({ name: '', targetMoq: '', unitThreshold: '' }, existingSuppliers);
assert(emptySup.isValid === false && emptySup.errors.name !== undefined, 'Empty supplier name rejected');

const dupIdSup = validateSupplierForm({ name: 'Britannia 2', supplierId: 'sup1', targetMoq: '1000', unitThreshold: '10' }, existingSuppliers);
assert(dupIdSup.isValid === false && dupIdSup.errors.supplierId.includes('already exists'), 'Duplicate supplier ID rejected');

const invalidEmailSup = validateSupplierForm({ name: 'Fresh Foods', targetMoq: '1000', unitThreshold: '10', contactEmail: 'not-an-email' }, existingSuppliers);
assert(invalidEmailSup.isValid === false && invalidEmailSup.errors.contactEmail !== undefined, 'Invalid email rejected');

// Strict Name & Email Rules
const leadingNumProd = validateProductForm({ name: '123 Organic Bread', category: 'Bakery', currentStock: '10', safetyTarget: '20', unitCost: '15' }, existingProducts);
assert(leadingNumProd.isValid === false && Boolean(leadingNumProd.errors.name), 'Product name starting with number rejected');

const containsNumProd = validateProductForm({ name: 'Organic Bread 2', category: 'Bakery', currentStock: '10', safetyTarget: '20', unitCost: '15' }, existingProducts);
assert(containsNumProd.isValid === false && Boolean(containsNumProd.errors.name), 'Product name containing numbers rejected');

const leadingNumSup = validateSupplierForm({ name: '123 Heritage Dairy', targetMoq: '1000' }, existingSuppliers);
assert(leadingNumSup.isValid === false && Boolean(leadingNumSup.errors.name), 'Supplier name starting with number rejected');

const containsNumSup = validateSupplierForm({ name: 'Heritage Dairy 2', targetMoq: '1000' }, existingSuppliers);
assert(containsNumSup.isValid === false && Boolean(containsNumSup.errors.name), 'Supplier name containing numbers rejected');

const leadingNumRep = validateSupplierForm({ name: 'Heritage Dairy', targetMoq: '1000', contactRep: '1Rajesh' }, existingSuppliers);
assert(leadingNumRep.isValid === false && Boolean(leadingNumRep.errors.contactRep), 'Representative name starting with number rejected');

const containsNumRep = validateSupplierForm({ name: 'Heritage Dairy', targetMoq: '1000', contactRep: 'Rajesh 2' }, existingSuppliers);
assert(containsNumRep.isValid === false && Boolean(containsNumRep.errors.contactRep), 'Representative name containing numbers rejected');

const leadingNumEmail = validateSupplierForm({ name: 'Heritage Dairy', targetMoq: '1000', contactEmail: '123orders@heritage.com' }, existingSuppliers);
assert(leadingNumEmail.isValid === false && Boolean(leadingNumEmail.errors.contactEmail), 'Email starting with number rejected');

const shortAlphaEmail = validateSupplierForm({ name: 'Heritage Dairy', targetMoq: '1000', contactEmail: 'abc1@heritage.com' }, existingSuppliers);
assert(shortAlphaEmail.isValid === false && Boolean(shortAlphaEmail.errors.contactEmail), 'Email with fewer than 4 alpha before numbers rejected');

const validAlphaNumEmail = validateSupplierForm({ name: 'Heritage Dairy', category: 'Dairy', targetMoq: '1000', contactEmail: 'supp123@heritage.com' }, existingSuppliers);
assert(validAlphaNumEmail.isValid === true, 'Email with at least 4 alpha then numbers accepted');

const validSup = validateSupplierForm({
  name: 'Organic Mills',
  category: 'Organic Goods',
  targetMoq: '5000',
  unitThreshold: '50',
  contactRep: 'Ramesh',
  contactEmail: 'ramesh@organic.in',
  contactPhone: '+919876543210',
  leadTime: '3 business days'
}, existingSuppliers);
assert(validSup.isValid === true, 'Valid supplier form accepted');

// 3b. Phone & Sanitizer Validation
import { sanitizeMobileInput, sanitizePriceInput, sanitizeIntegerInput } from '../src/utils/validation.js';

assert(sanitizeMobileInput('abc+12345xyz') === '+12345', 'Sanitize mobile strips letters and keeps valid +');
assert(sanitizeMobileInput('+1234567890123456789') === '+12345678901234', 'Sanitize mobile enforces max 15 characters');
assert(sanitizeMobileInput('9876543210') === '9876543210', 'Sanitize mobile allows plain digits');

assert(sanitizePriceInput('12.345') === '12.34', 'Sanitize price limits to 2 decimal places');
assert(sanitizePriceInput('-45.99') === '45.99', 'Sanitize price strips negative sign');
assert(sanitizePriceInput('abc15.50') === '15.50', 'Sanitize price strips non-numeric characters');

assert(sanitizeIntegerInput('123abc456', 5) === '12345', 'Sanitize integer strips non-digits and truncates to max length');

// 4. Bulk Edit Validation
const invalidBulk = validateBulkEditParams({
  enableOrderQty: true,
  orderQtyMode: 'set',
  orderQtyValue: '-10',
  enableSafetyTarget: true,
  safetyTargetValue: '10000000'
});
assert(invalidBulk.isValid === false && invalidBulk.errors.orderQty !== undefined, 'Negative bulk order qty rejected');
assert(invalidBulk.isValid === false && invalidBulk.errors.safetyTarget !== undefined, 'Out-of-range bulk safety target rejected');

const validBulk = validateBulkEditParams({
  enableOrderQty: true,
  orderQtyMode: 'increase',
  orderQtyValue: '50',
  enableSafetyTarget: true,
  safetyTargetValue: '500'
});
assert(validBulk.isValid === true, 'Valid bulk edit parameters accepted');

// 9. Testing Alpha Name Key Down & Sanitizer
let prevented = false;
handleAlphaOnlyKeyDown({ key: '5', ctrlKey: false, metaKey: false, altKey: false, preventDefault: () => { prevented = true; } });
assert(prevented === true, 'handleAlphaOnlyKeyDown prevents typing digit 5');

let letterPrevented = false;
handleAlphaOnlyKeyDown({ key: 'a', ctrlKey: false, metaKey: false, altKey: false, preventDefault: () => { letterPrevented = true; } });
assert(letterPrevented === false, 'handleAlphaOnlyKeyDown allows letter a');

let spacePrevented = false;
handleAlphaOnlyKeyDown({ key: ' ', ctrlKey: false, metaKey: false, altKey: false, preventDefault: () => { spacePrevented = true; } });
assert(spacePrevented === false, 'handleAlphaOnlyKeyDown allows space');

let backspacePrevented = false;
handleAlphaOnlyKeyDown({ key: 'Backspace', ctrlKey: false, metaKey: false, altKey: false, preventDefault: () => { backspacePrevented = true; } });
assert(backspacePrevented === false, 'handleAlphaOnlyKeyDown allows Backspace navigation key');

assert(sanitizeAlphaName('Organic 123 Cow Ghee 45') === 'Organic  Cow Ghee ', 'sanitizeAlphaName strips numbers');
assert(sanitizeAlphaName('Amul Dairy') === 'Amul Dairy', 'sanitizeAlphaName preserves alphabet and space');

console.log('\n--- 2. Testing Filter Rules (Stock Level Removed) ---');

const sampleProducts = [
  { id: '1', sku: 'SKU-1', name: 'Almond Milk', supplierId: 'hf', category: 'Dairy & Bakery', priority: 'critical', orderStatus: 'none', currentStock: 2, safetyTarget: 50 },
  { id: '2', sku: 'SKU-2', name: 'Whole Wheat Bread', supplierId: 'bi', category: 'Bakery', priority: 'low', orderStatus: 'none', currentStock: 15, safetyTarget: 30 },
  { id: '3', sku: 'SKU-3', name: 'Green Tea', supplierId: 'gt', category: 'Beverages', priority: 'ok', orderStatus: 'none', currentStock: 40, safetyTarget: 20 },
];

// Check filter without stockLevels
const filteredByStatus = sampleProducts.filter(p => matchesFilters(p, { statuses: ['critical'], suppliers: [], categories: [], search: '' }));
assert(filteredByStatus.length === 1 && filteredByStatus[0].id === '1', 'Filter by status critical works');

const filteredBySupplier = sampleProducts.filter(p => matchesFilters(p, { statuses: [], suppliers: ['bi'], categories: [], search: '' }));
assert(filteredBySupplier.length === 1 && filteredBySupplier[0].id === '2', 'Filter by supplier bi works');

const filteredBySearch = sampleProducts.filter(p => matchesFilters(p, { statuses: [], suppliers: [], categories: [], search: 'almond' }));
assert(filteredBySearch.length === 1 && filteredBySearch[0].id === '1', 'Search by name works');

// Ensure that even if old saved preferences include stockLevels, filter doesn't crash or behave improperly
const oldFilters = { statuses: [], suppliers: [], categories: [], stockLevels: ['low-stock'], search: '' };
const filteredWithOldStock = sampleProducts.filter(p => matchesFilters(p, oldFilters));
assert(filteredWithOldStock.length === 3, 'Old stockLevels preferences do not filter out records or crash');

console.log('\n--- 3. Testing Supplier Queue Filtering & MOQ Progress ---');

const supBi = { id: 'bi', name: 'Britannia', targetMoq: 5000, unitThreshold: 20 };
const itemsSupBi = [
  { id: '10', supplierId: 'bi', orderQty: 10, unitCost: 100, selected: true },
  { id: '11', supplierId: 'bi', orderQty: 15, unitCost: 200, selected: true },
];
const valMoq = validateSupplierMoq(supBi, itemsSupBi);
assert(valMoq.totalUnits === 25, 'Total units 25 calculated correctly');
assert(valMoq.subtotal === 4000, 'Subtotal 4000 calculated correctly');
assert(valMoq.isMoqMet === false, 'MOQ 5000 not met when subtotal is 4000');
assert(valMoq.remainingAmount === 1000, 'Remaining MOQ is 1000');
assert(valMoq.isUnitsMet === true, 'Threshold 20 met with 25 units');

console.log(`\n========================================`);
console.log(`Summary: Passed: ${passed}, Failed: ${failed}`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
