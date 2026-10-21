import { runQuery, runExecute, runTransaction } from './database.js';
import { SEED_SUPPLIERS, SEED_PRODUCTS, SEED_MANIFESTS, SEED_PURCHASE_ORDERS } from './seed.js';

import { calculatePriority } from '../utils/priorityRules.js';
import {
  validateOrderQtyInput,
  validateProductForm,
  validateSupplierForm,
  validateBulkEditParams,
} from '../utils/validation.js';
export { calculatePriority };

// ── Suppliers ──────────────────────────────────────────────────────────────
export async function fetchSuppliers() {
  const rows = await runQuery(`
    SELECT 
      id, name, category, initials, badge, badge_type as badgeType,
      target_moq as targetMoq, unit_threshold as unitThreshold,
      lead_time as leadTime, color, all_healthy as allHealthy,
      contact_rep as contactRep, contact_email as contactEmail,
      contact_phone as contactPhone, contact_address as contactAddress
    FROM suppliers
    ORDER BY id ASC;
  `);
  return rows.map(r => ({
    ...r,
    allHealthy: Boolean(r.allHealthy),
  }));
}

export async function fetchSupplierContact(supplierId) {
  const rows = await runQuery(`
    SELECT 
      id, name, contact_rep as contactRep, contact_email as contactEmail,
      contact_phone as contactPhone, contact_address as contactAddress,
      lead_time as leadTime, target_moq as targetMoq
    FROM suppliers
    WHERE id = ?;
  `, [supplierId]);
  return rows[0] || null;
}

// ── Inventory / Products ────────────────────────────────────────────────────
export async function fetchInventory(supplierId) {
  const sql = supplierId
    ? `SELECT id, sku, name, category, supplier_id as supplierId,
              current_stock as currentStock, safety_target as safetyTarget,
              order_qty as orderQty, unit_cost as unitCost, selected,
              COALESCE(order_status, 'none') as orderStatus
       FROM inventory_items
       WHERE supplier_id = ?
       ORDER BY id ASC;`
    : `SELECT id, sku, name, category, supplier_id as supplierId,
              current_stock as currentStock, safety_target as safetyTarget,
              order_qty as orderQty, unit_cost as unitCost, selected,
              COALESCE(order_status, 'none') as orderStatus
       FROM inventory_items
       ORDER BY id ASC;`;

  const rows = await runQuery(sql, supplierId ? [supplierId] : []);
  return rows.map((p) => {
    const priority = calculatePriority(p.currentStock, p.safetyTarget);
    const orderStatus = p.orderStatus || 'none';
    const status = orderStatus === 'ordered' ? 'ordered' : priority;
    return {
      ...p,
      orderStatus,
      selected: Boolean(p.selected),
      priority,
      status,
    };
  });
}

export async function updateItemOrderQty(sku, quantity) {
  const check = validateOrderQtyInput(quantity);
  if (!check.isValid) {
    throw new Error(check.error || 'Invalid order quantity.');
  }
  const validQty = check.value;
  await runExecute(`
    UPDATE inventory_items
    SET order_qty = ?, selected = CASE WHEN ? > 0 THEN 1 ELSE selected END
    WHERE sku = ?;
  `, [validQty, validQty, sku]);
  return validQty;
}

export async function toggleItemSelection(id, selected, orderQty) {
  const isSelected = selected ? 1 : 0;
  if (typeof orderQty === 'number') {
    await runExecute(`
      UPDATE inventory_items
      SET selected = ?, order_qty = ?
      WHERE id = ?;
    `, [isSelected, orderQty, id]);
  } else {
    await runExecute(`
      UPDATE inventory_items
      SET selected = ?
      WHERE id = ?;
    `, [isSelected, id]);
  }
}

export async function toggleAllSelection(supplierId, selected) {
  const isSelected = selected ? 1 : 0;
  await runExecute(`
    UPDATE inventory_items
    SET selected = ?
    WHERE supplier_id = ?;
  `, [isSelected, supplierId]);
}

export async function clearAllSelection() {
  await runExecute(`UPDATE inventory_items SET selected = 0;`);
}

export async function applySupplierMinimums(supplierId) {
  return runTransaction((db) => {
    const items = db.selectObjects(`
      SELECT id, current_stock as currentStock, safety_target as safetyTarget
      FROM inventory_items
      WHERE supplier_id = ?;
    `, [supplierId]);

    const updateStmt = db.prepare(`
      UPDATE inventory_items
      SET order_qty = ?, selected = ?
      WHERE id = ?;
    `);

    try {
      for (const item of items) {
        const deficit = Math.max(0, item.safetyTarget - item.currentStock);
        const selected = deficit > 0 ? 1 : 0;
        updateStmt.bind([deficit, selected, item.id]).stepReset();
      }
    } finally {
      updateStmt.finalize();
    }
  });
}

// ── Pending Manifests ───────────────────────────────────────────────────────
export async function fetchPendingManifests(supplierId) {
  const rows = await runQuery(`
    SELECT id, manifest_number as manifestNumber, supplier_id as supplierId,
           expected_date as expectedDate, items_count as itemsCount,
           total_units as totalUnits, carrier, status, created_at as createdAt
    FROM pending_manifests
    WHERE supplier_id = ?
    ORDER BY created_at DESC;
  `, [supplierId]);
  return rows;
}

// ── Purchase Orders & Line Items ───────────────────────────────────────────
export async function fetchPOHistory(supplierId) {
  const orders = await runQuery(`
    SELECT id, po_number as poNumber, supplier_id as supplierId,
           status, subtotal, tax, total_amount as totalAmount,
           notes, created_at as createdAt, updated_at as updatedAt
    FROM purchase_orders
    WHERE supplier_id = ?
    ORDER BY created_at DESC;
  `, [supplierId]);

  if (orders.length === 0) return [];

  // Populate line items
  for (const order of orders) {
    const items = await runQuery(`
      SELECT id, po_id as poId, product_id as productId,
             sku, name, quantity, unit_price as unitPrice, subtotal
      FROM purchase_order_items
      WHERE po_id = ?
      ORDER BY id ASC;
    `, [order.id]);
    order.items = items;
  }

  return orders;
}

export async function fetchDraftPO(supplierId) {
  const orders = await runQuery(`
    SELECT id, po_number as poNumber, supplier_id as supplierId,
           status, subtotal, tax, total_amount as totalAmount,
           notes, created_at as createdAt, updated_at as updatedAt
    FROM purchase_orders
    WHERE supplier_id = ? AND status = 'draft'
    ORDER BY updated_at DESC
    LIMIT 1;
  `, [supplierId]);

  if (orders.length === 0) return null;
  const draft = orders[0];
  const items = await runQuery(`
    SELECT id, po_id as poId, product_id as productId,
           sku, name, quantity, unit_price as unitPrice, subtotal
    FROM purchase_order_items
    WHERE po_id = ?;
  `, [draft.id]);
  draft.items = items;
  return draft;
}

export async function saveDraftPO({ supplierId, poNumber, items, subtotal, tax = 0, totalAmount, notes = '' }) {
  return runTransaction((db) => {
    const existing = db.selectObjects(
      `SELECT id FROM purchase_orders WHERE supplier_id = ? AND status = 'draft' LIMIT 1;`,
      [supplierId]
    );

    const now = new Date().toISOString();
    const poId = existing.length > 0 ? existing[0].id : `po-${supplierId}-${Date.now()}`;
    const generatedPoNum = poNumber || `PO-2026-${Math.floor(100 + Math.random() * 900)}`;

    if (existing.length > 0) {
      db.exec({
        sql: `UPDATE purchase_orders 
              SET po_number = ?, subtotal = ?, tax = ?, total_amount = ?, notes = ?, updated_at = ?
              WHERE id = ?;`,
        bind: [generatedPoNum, subtotal, tax, totalAmount, notes, now, poId]
      });
      db.exec({
        sql: `DELETE FROM purchase_order_items WHERE po_id = ?;`,
        bind: [poId]
      });
    } else {
      db.exec({
        sql: `INSERT INTO purchase_orders (id, po_number, supplier_id, status, subtotal, tax, total_amount, notes, created_at, updated_at)
              VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?);`,
        bind: [poId, generatedPoNum, supplierId, subtotal, tax, totalAmount, notes, now, now]
      });
    }

    const insertItem = db.prepare(`
      INSERT INTO purchase_order_items (id, po_id, product_id, sku, name, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);

    try {
      items.forEach((item, idx) => {
        const itemId = `${poId}-item-${idx + 1}`;
        insertItem.bind([
          itemId, poId, item.id || item.productId, item.sku,
          item.name, item.orderQty || item.quantity, item.unitCost || item.unitPrice,
          (item.orderQty || item.quantity) * (item.unitCost || item.unitPrice)
        ]).stepReset();
      });
    } finally {
      insertItem.finalize();
    }

    return { id: poId, poNumber: generatedPoNum, status: 'draft' };
  });
}

export async function submitPurchaseOrder({
  supplierId,
  poNumber,
  items,
  subtotal,
  tax = 0,
  totalAmount,
  notes = '',
  options = {},
}) {
  // Controlled delay for testing slow operation states
  if (options.simulateSlowMs && options.simulateSlowMs > 0) {
    await new Promise((r) => setTimeout(r, options.simulateSlowMs));
  }

  return runTransaction((db) => {
    // If testing error rollback, throw error before commit
    if (options.simulateError) {
      throw new Error('Simulated SQLite transaction failure for rollback testing');
    }

    const now = new Date().toISOString();
    const poId = `po-${supplierId}-${Date.now()}`;
    const generatedPoNum = poNumber || `PO-2026-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Delete previous draft for this supplier so draft editor is cleared
    db.exec({
      sql: `DELETE FROM purchase_orders WHERE supplier_id = ? AND status = 'draft';`,
      bind: [supplierId],
    });

    // 2. Insert new submitted PO record
    db.exec({
      sql: `INSERT INTO purchase_orders (id, po_number, supplier_id, status, subtotal, tax, total_amount, notes, created_at, updated_at)
            VALUES (?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?);`,
      bind: [poId, generatedPoNum, supplierId, subtotal, tax, totalAmount, notes, now, now],
    });

    // 3. Insert purchase order line items
    const insertItem = db.prepare(`
      INSERT INTO purchase_order_items (id, po_id, product_id, sku, name, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);

    // 4. Update ordered items in inventory: untick row, reset orderQty to 0, mark order_status = 'ordered'
    const updateInventory = db.prepare(`
      UPDATE inventory_items
      SET order_qty = 0, selected = 0, order_status = 'ordered'
      WHERE id = ? OR sku = ?;
    `);

    try {
      items.forEach((item, idx) => {
        const itemId = `${poId}-item-${idx + 1}`;
        const qty = item.orderQty || item.quantity || 0;
        const price = item.unitCost || item.unitPrice || 0;
        insertItem.bind([
          itemId, poId, item.id || item.productId, item.sku,
          item.name, qty, price, qty * price
        ]).stepReset();

        updateInventory.bind([item.id || item.productId || '', item.sku || '']).stepReset();
      });
    } finally {
      insertItem.finalize();
      updateInventory.finalize();
    }

    return { id: poId, poNumber: generatedPoNum, status: 'submitted', timestamp: now };
  });
}

export async function fetchProductCounts() {
  const rows = await runQuery(`
    SELECT supplier_id as supplierId, COUNT(*) as count
    FROM inventory_items
    GROUP BY supplier_id;
  `);
  return rows;
}

export async function deletePurchaseOrder(poId) {
  return runTransaction((db) => {
    db.exec({
      sql: `DELETE FROM purchase_orders WHERE id = ?;`,
      bind: [poId]
    });
  });
}

// Reset database to initial sample data
export async function resetDatabaseToDefaults() {
  return runTransaction((db) => {
    db.exec(`
      DELETE FROM purchase_order_items;
      DELETE FROM purchase_orders;
      DELETE FROM pending_manifests;
      DELETE FROM inventory_items;
      DELETE FROM suppliers;
    `);

    // Reseed
    const insertSupplier = db.prepare(`
      INSERT INTO suppliers (
        id, name, category, initials, badge, badge_type, target_moq, unit_threshold,
        lead_time, color, all_healthy, contact_rep, contact_email, contact_phone, contact_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    try {
      for (const s of SEED_SUPPLIERS) {
        insertSupplier.bind([
          s.id, s.name, s.category, s.initials, s.badge, s.badge_type,
          s.target_moq, s.unit_threshold, s.lead_time, s.color, s.all_healthy,
          s.contact_rep, s.contact_email, s.contact_phone, s.contact_address
        ]).stepReset();
      }
    } finally {
      insertSupplier.finalize();
    }

    const insertProduct = db.prepare(`
      INSERT INTO inventory_items (
        id, sku, name, category, supplier_id, current_stock, safety_target, order_qty, unit_cost, selected
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    try {
      for (const p of SEED_PRODUCTS) {
        insertProduct.bind([
          p.id, p.sku, p.name, p.category, p.supplier_id,
          p.current_stock, p.safety_target, p.order_qty, p.unit_cost, p.selected
        ]).stepReset();
      }
    } finally {
      insertProduct.finalize();
    }

    const insertManifest = db.prepare(`
      INSERT INTO pending_manifests (
        id, manifest_number, supplier_id, expected_date, items_count, total_units, carrier, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    try {
      for (const m of SEED_MANIFESTS) {
        insertManifest.bind([
          m.id, m.manifest_number, m.supplier_id, m.expected_date,
          m.items_count, m.total_units, m.carrier, m.status, m.created_at
        ]).stepReset();
      }
    } finally {
      insertManifest.finalize();
    }

    const insertPO = db.prepare(`
      INSERT INTO purchase_orders (
        id, po_number, supplier_id, status, subtotal, tax, total_amount, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    const insertPOItem = db.prepare(`
      INSERT INTO purchase_order_items (
        id, po_id, product_id, sku, name, quantity, unit_price, subtotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);
    try {
      for (const po of SEED_PURCHASE_ORDERS) {
        insertPO.bind([
          po.id, po.po_number, po.supplier_id, po.status,
          po.subtotal, po.tax, po.total_amount, po.notes, po.created_at, po.updated_at
        ]).stepReset();

        if (po.items) {
          for (const item of po.items) {
            insertPOItem.bind([
              item.id, po.id, item.product_id, item.sku,
              item.name, item.quantity, item.unit_price, item.subtotal
            ]).stepReset();
          }
        }
      }
    } finally {
      insertPO.finalize();
      insertPOItem.finalize();
    }
  });
}

// ── Categories ──────────────────────────────────────────────────────────────
export async function fetchCategories() {
  const rows = await runQuery(`
    SELECT DISTINCT category
    FROM inventory_items
    WHERE category IS NOT NULL AND TRIM(category) != ''
    ORDER BY category ASC;
  `);
  return rows.map((r) => r.category).filter(Boolean);
}

// ── Get Next Product Identifiers (Auto-assign Unique ID and SKU from DB) ───
export async function getNextProductIdentifiers(supplierId) {
  const supPrefix = (supplierId || 'prod').toLowerCase();

  // Find all existing IDs and SKUs for this supplier or matching the prefix pattern
  const rows = await runQuery(
    `SELECT id, sku FROM inventory_items WHERE supplier_id = ? OR id LIKE ? OR sku LIKE ?;`,
    [supplierId, `${supPrefix}-%`, `${supPrefix.toUpperCase()}-%`]
  );

  let maxNum = 0;
  rows.forEach((r) => {
    // Match ID pattern (e.g. hf-001, bi-042)
    const idMatch = (r.id || '').match(new RegExp(`^${supPrefix}-(\\d+)`, 'i'));
    if (idMatch) {
      const num = parseInt(idMatch[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
    // Match SKU pattern (e.g. HF-001, BI-042)
    const skuMatch = (r.sku || '').match(new RegExp(`^${supPrefix}-(\\d+)`, 'i'));
    if (skuMatch) {
      const num = parseInt(skuMatch[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });

  if (maxNum === 0 && rows.length > 0) {
    maxNum = rows.length;
  }

  let nextNum = maxNum + 1;
  let nextId = `${supPrefix}-${String(nextNum).padStart(3, '0')}`;
  let nextSku = `${supPrefix.toUpperCase()}-${String(nextNum).padStart(3, '0')}`;

  // Ensure collision-free against any existing records in SQLite
  while (true) {
    const check = await runQuery(
      `SELECT 1 FROM inventory_items WHERE LOWER(id) = ? OR UPPER(sku) = ? LIMIT 1;`,
      [nextId.toLowerCase(), nextSku.toUpperCase()]
    );
    if (check.length === 0) break;
    nextNum++;
    nextId = `${supPrefix}-${String(nextNum).padStart(3, '0')}`;
    nextSku = `${supPrefix.toUpperCase()}-${String(nextNum).padStart(3, '0')}`;
  }

  return { nextId, nextSku };
}

// ── Create Product ──────────────────────────────────────────────────────────
export async function createProduct(productData) {
  const validation = validateProductForm(productData);
  if (!validation.isValid) {
    throw new Error(Object.values(validation.errors).join(' '));
  }

  const {
    name,
    supplierId,
    category,
    currentStock = 0,
    safetyTarget = 0,
    unitCost = 0,
    orderQty = 0,
  } = productData;

  const parsedStock = parseInt(currentStock, 10);
  const parsedTarget = parseInt(safetyTarget, 10);
  const parsedCost = parseFloat(unitCost);
  const parsedQty = parseInt(orderQty, 10) || 0;

  // Automatically assign unique ID and SKU based on database if not provided
  let cleanId = productData.id?.trim();
  let cleanSku = productData.sku?.trim().toUpperCase();

  if (!cleanId || !cleanSku) {
    const autoIdents = await getNextProductIdentifiers(supplierId);
    if (!cleanId) cleanId = autoIdents.nextId;
    if (!cleanSku) cleanSku = autoIdents.nextSku;
  }

  // Ensure uniqueness in DB
  const existing = await runQuery(
    `SELECT 1 FROM inventory_items WHERE LOWER(id) = ? OR UPPER(sku) = ? LIMIT 1;`,
    [cleanId.toLowerCase(), cleanSku]
  );
  if (existing.length > 0) {
    const autoIdents = await getNextProductIdentifiers(supplierId);
    cleanId = autoIdents.nextId;
    cleanSku = autoIdents.nextSku;
  }

  await runExecute(`
    INSERT INTO inventory_items (
      id, sku, name, category, supplier_id, current_stock, safety_target, order_qty, unit_cost, selected, order_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'none');
  `, [
    cleanId,
    cleanSku,
    name.trim(),
    category.trim(),
    supplierId.trim(),
    parsedStock,
    parsedTarget,
    parsedQty,
    parsedCost,
  ]);

  const priority = calculatePriority(parsedStock, parsedTarget);
  return {
    id: cleanId,
    sku: cleanSku,
    name: name.trim(),
    category: category.trim(),
    supplierId: supplierId.trim(),
    currentStock: parsedStock,
    safetyTarget: parsedTarget,
    orderQty: parsedQty,
    unitCost: parsedCost,
    selected: false,
    orderStatus: 'none',
    priority,
    status: priority,
  };
}

// ── Create Supplier ─────────────────────────────────────────────────────────
export async function createSupplier(supplierData) {
  const validation = validateSupplierForm(supplierData);
  if (!validation.isValid) {
    throw new Error(Object.values(validation.errors).join(' '));
  }

  const {
    name,
    category,
    contactRep = '',
    contactEmail = '',
    contactPhone = '',
    leadTime = '3d',
    targetMoq = 5000,
    unitThreshold = 0,
  } = supplierData;

  const parsedMoq = parseFloat(targetMoq);
  const parsedUnits = parseInt(unitThreshold, 10) || 0;
  const cleanName = name.trim();

  // Enforce normalized unique supplier name
  const existing = await runQuery(`SELECT 1 FROM suppliers WHERE LOWER(name) = LOWER(?) LIMIT 1;`, [cleanName]);
  if (existing.length > 0) {
    throw new Error(`A supplier with name "${cleanName}" already exists.`);
  }

  const id = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 12) || `sup-${Date.now()}`;
  const initials = cleanName.charAt(0).toUpperCase();

  await runExecute(`
    INSERT INTO suppliers (
      id, name, category, initials, badge, badge_type, target_moq, unit_threshold,
      lead_time, color, all_healthy, contact_rep, contact_email, contact_phone, contact_address
    ) VALUES (?, ?, ?, ?, 'Standard', 'standard', ?, ?, ?, '#2563eb', 0, ?, ?, ?, '');
  `, [
    id,
    cleanName,
    category.trim(),
    initials,
    parsedMoq,
    parsedUnits,
    leadTime.trim() || '3d',
    contactRep.trim(),
    contactEmail.trim(),
    contactPhone.trim(),
  ]);

  return {
    id,
    name: cleanName,
    category: category.trim(),
    initials,
    badge: 'Standard',
    badgeType: 'standard',
    targetMoq: parsedMoq,
    unitThreshold: parsedUnits,
    leadTime: leadTime.trim() || '3d',
    color: '#2563eb',
    allHealthy: false,
    contactRep: contactRep.trim(),
    contactEmail: contactEmail.trim(),
    contactPhone: contactPhone.trim(),
    contactAddress: '',
  };
}

// ── Bulk Update Inventory ───────────────────────────────────────────────────
export async function bulkUpdateInventory(itemIds, updates) {
  if (!Array.isArray(itemIds) || itemIds.length === 0) return 0;
  const validation = validateBulkEditParams(updates);
  if (!validation.isValid) {
    throw new Error(Object.values(validation.errors).join(' '));
  }

  return runTransaction((db) => {
    // 1. If category update requested
    if (updates.category && updates.category.trim()) {
      const stmt = db.prepare(`UPDATE inventory_items SET category = ? WHERE id = ?;`);
      try {
        for (const id of itemIds) {
          stmt.bind([updates.category.trim(), id]).stepReset();
        }
      } finally {
        stmt.finalize();
      }
    }

    // 2. If safetyTarget update requested
    if (typeof updates.safetyTarget === 'number' && updates.safetyTarget >= 0) {
      const stmt = db.prepare(`UPDATE inventory_items SET safety_target = ? WHERE id = ?;`);
      try {
        for (const id of itemIds) {
          stmt.bind([updates.safetyTarget, id]).stepReset();
        }
      } finally {
        stmt.finalize();
      }
    }

    // 3. If orderQty update requested (ONLY applied to eligible non-ordered items)
    if (updates.orderQtyMode) {
      if (updates.orderQtyMode === 'set') {
        const qty = Math.max(0, parseInt(updates.orderQtyValue, 10) || 0);
        const stmt = db.prepare(`
          UPDATE inventory_items
          SET order_qty = ?, selected = CASE WHEN ? > 0 THEN 1 ELSE selected END
          WHERE id = ? AND (order_status IS NULL OR order_status != 'ordered');
        `);
        try {
          for (const id of itemIds) {
            stmt.bind([qty, qty, id]).stepReset();
          }
        } finally {
          stmt.finalize();
        }
      } else if (updates.orderQtyMode === 'increase') {
        const delta = parseInt(updates.orderQtyValue, 10) || 0;
        const stmt = db.prepare(`
          UPDATE inventory_items
          SET order_qty = MAX(0, order_qty + ?),
              selected = CASE WHEN (order_qty + ?) > 0 THEN 1 ELSE selected END
          WHERE id = ? AND (order_status IS NULL OR order_status != 'ordered');
        `);
        try {
          for (const id of itemIds) {
            stmt.bind([delta, delta, id]).stepReset();
          }
        } finally {
          stmt.finalize();
        }
      } else if (updates.orderQtyMode === 'deficit') {
        const stmt = db.prepare(`
          UPDATE inventory_items
          SET order_qty = MAX(0, safety_target - current_stock),
              selected = CASE WHEN (safety_target - current_stock) > 0 THEN 1 ELSE selected END
          WHERE id = ? AND (order_status IS NULL OR order_status != 'ordered');
        `);
        try {
          for (const id of itemIds) {
            stmt.bind([id]).stepReset();
          }
        } finally {
          stmt.finalize();
        }
      }
    }

    return itemIds.length;
  });
}

