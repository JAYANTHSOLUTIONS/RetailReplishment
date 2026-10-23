export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  initials TEXT NOT NULL,
  badge TEXT,
  badge_type TEXT,
  target_moq REAL NOT NULL,
  unit_threshold INTEGER NOT NULL,
  lead_time TEXT NOT NULL,
  color TEXT NOT NULL,
  all_healthy INTEGER DEFAULT 0,
  contact_rep TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  safety_target INTEGER NOT NULL,
  order_qty INTEGER NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL,
  selected INTEGER NOT NULL DEFAULT 0,
  order_status TEXT NOT NULL DEFAULT 'none'
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('draft', 'submitted', 'cancelled', 'delivered')),
  subtotal REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_manifests (
  id TEXT PRIMARY KEY,
  manifest_number TEXT UNIQUE NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  po_id TEXT,
  expected_date TEXT NOT NULL,
  items_count INTEGER NOT NULL,
  total_units INTEGER NOT NULL,
  carrier TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('in_transit', 'pending', 'customs', 'delivered')),
  created_at TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reorder_acknowledgements (
  product_id TEXT PRIMARY KEY,
  acknowledged_at TEXT NOT NULL
);
`;
