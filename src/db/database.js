import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { CREATE_TABLES_SQL } from './schema.js';
import { SEED_SUPPLIERS, SEED_PRODUCTS, SEED_PURCHASE_ORDERS } from './seed.js';

let dbInstance = null;
let sqlite3Instance = null;
let isOpfsActive = false;
let initPromise = null;

// IndexedDB Helper for persistent fallback when OPFS is unavailable or in non-worker context
const IDB_NAME = 'RetailReplenishmentDB';
const IDB_STORE = 'sqlite_storage';
const IDB_KEY = 'db_binary_backup';

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadFromIndexedDB() {
  try {
    const idb = await openIndexedDB();
    if (!idb) return null;
    return new Promise((resolve) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[DB] Failed to read from IndexedDB fallback:', err);
    return null;
  }
}

async function saveToIndexedDB(binaryData) {
  try {
    const idb = await openIndexedDB();
    if (!idb) return;
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(binaryData, IDB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[DB] Failed to save to IndexedDB fallback:', err);
  }
}

let saveTimeout = null;
export function schedulePersistence() {
  if (isOpfsActive || !dbInstance || !sqlite3Instance) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      if (sqlite3Instance?.capi?.sqlite3_js_db_export) {
        const bytes = sqlite3Instance.capi.sqlite3_js_db_export(dbInstance);
        if (bytes) {
          await saveToIndexedDB(bytes);
        }
      }
    } catch (err) {
      console.warn('[DB] Error during debounced binary export:', err);
    }
  }, 100);
}

// Seed the database idempotently
function seedDatabase(db) {
  db.transaction(() => {
    // 1. Suppliers
    const insertSupplier = db.prepare(`
      INSERT OR IGNORE INTO suppliers (
        id, name, category, initials, badge, badge_type, target_moq, unit_threshold,
        lead_time, color, all_healthy, contact_rep, contact_email, contact_phone, contact_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    // 2. Inventory Items
    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO inventory_items (
        id, sku, name, category, supplier_id, current_stock, safety_target, order_qty, unit_cost, selected
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    // 3. Pending Manifests (Generated dynamically on PO dispatch, no mock data)


    // 4. Purchase Orders and Line Items
    const insertPO = db.prepare(`
      INSERT OR IGNORE INTO purchase_orders (
        id, po_number, supplier_id, status, subtotal, tax, total_amount, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPOItem = db.prepare(`
      INSERT OR IGNORE INTO purchase_order_items (
        id, po_id, product_id, sku, name, quantity, unit_price, subtotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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

export async function getDatabase() {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const sqlite3 = await sqlite3InitModule({
        print: (...args) => console.log('[SQLite]', ...args),
        printErr: (...args) => console.error('[SQLite ERR]', ...args),
      });

      sqlite3Instance = sqlite3;
      let db = null;

      // 1. Try OPFS VFS if available in environment
      if ('opfs' in sqlite3 && typeof sqlite3.oo1.OpfsDb === 'function') {
        try {
          db = new sqlite3.oo1.OpfsDb('/retail_replenishment.sqlite3');
          isOpfsActive = true;
          console.info('[SQLite] Connected to persistent OPFS database at /retail_replenishment.sqlite3');
        } catch (opfsErr) {
          console.warn('[SQLite] OPFS initialization failed, switching to persistent fallback:', opfsErr);
        }
      }

      // 2. Persistent fallback with IndexedDB binary export if OPFS is not active
      if (!db) {
        const savedBytes = await loadFromIndexedDB();
        db = new sqlite3.oo1.DB('/retail_replenishment.sqlite3', 'c');
        isOpfsActive = false;

        if (savedBytes && savedBytes.byteLength > 0 && sqlite3.capi?.sqlite3_deserialize) {
          try {
            const p = sqlite3.wasm.alloc(savedBytes.byteLength);
            sqlite3.wasm.heap8().set(savedBytes, p);
            sqlite3.capi.sqlite3_deserialize(
              db,
              'main',
              p,
              savedBytes.byteLength,
              savedBytes.byteLength,
              sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
            );
            // if (rc === 0) {
            //   console.info('[SQLite] Successfully restored persistent database from IndexedDB.');
            // }
          } catch (err) {
            console.warn('[SQLite] Deserialization fallback error:', err);
          }
        }
        // console.info('[SQLite] Running browser-local SQLite with persistent storage.');
      }

      dbInstance = db;

      // Enable foreign keys
      db.exec('PRAGMA foreign_keys = ON;');

      // Execute schema table definitions
      db.exec(CREATE_TABLES_SQL);

      // Safe migration check for order_status column
      try {
        const cols = [];
        db.exec({
          sql: 'PRAGMA table_info(inventory_items);',
          rowMode: 'object',
          callback: (row) => { if (row && row.name) cols.push(row.name); }
        });
        if (!cols.includes('order_status')) {
          db.exec("ALTER TABLE inventory_items ADD COLUMN order_status TEXT DEFAULT 'none';");
          console.info('[SQLite] Migrated inventory_items: added order_status column.');
          schedulePersistence();
        }
      } catch (colErr) {
        console.warn('[SQLite] Column migration check error:', colErr);
      }

      // Safe migration check for pending_manifests check constraint to support delivered status
      try {
        const tableCheck = db.selectValue("SELECT sql FROM sqlite_master WHERE type='table' AND name='pending_manifests';");
        if (tableCheck && !tableCheck.includes('delivered')) {
          db.exec(`
            CREATE TABLE IF NOT EXISTS pending_manifests_v2 (
              id TEXT PRIMARY KEY,
              manifest_number TEXT UNIQUE NOT NULL,
              supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
              expected_date TEXT NOT NULL,
              items_count INTEGER NOT NULL,
              total_units INTEGER NOT NULL,
              carrier TEXT NOT NULL,
              status TEXT NOT NULL CHECK(status IN ('in_transit', 'pending', 'customs', 'delivered')),
              created_at TEXT NOT NULL
            );
            INSERT OR IGNORE INTO pending_manifests_v2 SELECT * FROM pending_manifests;
            DROP TABLE pending_manifests;
            ALTER TABLE pending_manifests_v2 RENAME TO pending_manifests;
          `);
          console.info('[SQLite] Migrated pending_manifests table to support delivered status.');
          schedulePersistence();
        }

        // Migration: create manifest_items table if missing and add po_id to pending_manifests
        db.exec(`
          CREATE TABLE IF NOT EXISTS manifest_items (
            id TEXT PRIMARY KEY,
            manifest_id TEXT NOT NULL REFERENCES pending_manifests(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL,
            sku TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT,
            quantity INTEGER NOT NULL,
            unit_cost REAL NOT NULL
          );
        `);

        try {
          db.exec(`ALTER TABLE pending_manifests ADD COLUMN po_id TEXT;`);
        } catch {
          // column already exists
        }

        // Clean up any initial mock seed manifests
        db.exec(`
          DELETE FROM pending_manifests
          WHERE id IN ('mnf-hf-1', 'mnf-hf-2', 'mnf-bi-1', 'mnf-bi-2', 'mnf-nf-1', 'mnf-nf-2')
             OR id LIKE 'seed-%';
        `);
      } catch (mErr) {
        console.warn('[SQLite] Manifest migration check error:', mErr);
      }

      // Verify if seeded or if products need migration to 150 records
      const supplierCount = Number(db.selectValue('SELECT COUNT(*) FROM suppliers;') || 0);
      const prodCount = Number(db.selectValue('SELECT COUNT(*) FROM inventory_items;') || 0);

      if (supplierCount === 0 || prodCount < 150) {
        console.info(`[SQLite] Seeding / migrating database (existing products: ${prodCount}, target: 150)...`);
        seedDatabase(db);
        schedulePersistence();
      }

      return db;
    } catch (err) {
      console.error('[SQLite] Critical initialization failure:', err);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

const DB_TIMEOUT_MS = 12000;

function checkNetworkStatus() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Network offline: Please check your internet connection and try again.');
  }
}

function withTimeout(promise, ms = DB_TIMEOUT_MS, operation = 'Database operation') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${ms / 1000}s. Please retry.`));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function isOPFSEnabled() {
  return isOpfsActive;
}

export async function runQuery(sql, bind = []) {
  checkNetworkStatus();
  return withTimeout((async () => {
    const db = await getDatabase();
    return db.selectObjects(sql, bind);
  })(), DB_TIMEOUT_MS, 'Database query');
}

export async function runExecute(sql, bind = []) {
  checkNetworkStatus();
  return withTimeout((async () => {
    const db = await getDatabase();
    db.exec({ sql, bind });
    schedulePersistence();
  })(), DB_TIMEOUT_MS, 'Database execution');
}

export async function runTransaction(callback) {
  checkNetworkStatus();
  return withTimeout((async () => {
    const db = await getDatabase();
    let result;
    db.transaction(() => {
      result = callback(db);
    });
    schedulePersistence();
    return result;
  })(), DB_TIMEOUT_MS, 'Database transaction');
}
