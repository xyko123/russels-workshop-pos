-- ============================================================================
-- RUSELL'S GLASS, WOODS & METALS - PRODUCTION DATABASE SCHEMA (MIGRATION 001)
-- "You NAME it, we BUILD it" - Tabor Lumber Compound, Roxas Ext., Digos City
-- Relational Schema for MySQL / MariaDB and SQLite / Turso
-- ============================================================================

-- Disable foreign key checks during migration initialization
-- (For SQLite: PRAGMA foreign_keys = OFF; For MySQL: SET FOREIGN_KEY_CHECKS = 0;)

-- ----------------------------------------------------------------------------
-- 1. USERS & ROLES
-- Stores owner, cashier/sales, and workshop fabricator staff accounts.
-- Passwords stored as SHA-256 cryptographic hashes.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(128) NOT NULL,
  full_name VARCHAR(128) NOT NULL,
  role VARCHAR(32) NOT NULL,
  phone VARCHAR(32),
  email VARCHAR(128),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ----------------------------------------------------------------------------
-- 2. CUSTOMERS (Digos City, Davao del Sur)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  phone VARCHAR(32),
  email VARCHAR(128),
  address TEXT NOT NULL,
  barangay VARCHAR(64),
  city VARCHAR(64) DEFAULT 'Digos City',
  customer_type VARCHAR(64) DEFAULT 'Homeowner',
  notes TEXT,
  total_spent DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_barangay ON customers(barangay);

-- ----------------------------------------------------------------------------
-- 3. SUPPLIERS (Supplying Glass, Wood, Metal & Hardware)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  contact_person VARCHAR(128),
  phone VARCHAR(64),
  email VARCHAR(128),
  address TEXT,
  category VARCHAR(64),
  lead_time VARCHAR(64),
  rating VARCHAR(32),
  items_supplied TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);

-- ----------------------------------------------------------------------------
-- 4. PRODUCTS & MATERIALS (Master Catalog)
-- Specifications, classification, unit of measure, and default pricing.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(32) NOT NULL,
  category_label VARCHAR(64),
  unit VARCHAR(32) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  description TEXT,
  is_active INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ----------------------------------------------------------------------------
-- 5. INVENTORY (Real-Time Stock & Reorder Levels)
-- Kept distinct from product master to cleanly handle stock allocations.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL UNIQUE,
  stock_quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  reserved_quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  unit VARCHAR(32) NOT NULL,
  reorder_level DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  last_restocked_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_reorder ON inventory(reorder_level);

-- ----------------------------------------------------------------------------
-- 6. QUOTATIONS & CUT LISTS
-- Estimates with dimensions, materials, and labor fees.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(64) PRIMARY KEY,
  quotation_no VARCHAR(32) NOT NULL UNIQUE,
  customer_id VARCHAR(64) NOT NULL,
  project_title VARCHAR(160) NOT NULL,
  trade_category VARCHAR(32),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  installation_fee DECIMAL(10,2) DEFAULT 0.00,
  delivery_fee DECIMAL(10,2) DEFAULT 0.00,
  discount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'Pending Approval',
  valid_until DATE,
  prepared_by VARCHAR(128),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX IF NOT EXISTS idx_quotations_no ON quotations(quotation_no);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);

-- ----------------------------------------------------------------------------
-- 7. QUOTATION ITEMS (Line Items & Cut Dimensions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotation_items (
  id VARCHAR(64) PRIMARY KEY,
  quotation_id VARCHAR(64) NOT NULL,
  title VARCHAR(160) NOT NULL,
  specs TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  unit VARCHAR(32) DEFAULT 'unit',
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_qitems_quotation ON quotation_items(quotation_id);

-- ----------------------------------------------------------------------------
-- 8. ORDERS (Commercial Point of Sale & Contracts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_no VARCHAR(32) NOT NULL UNIQUE,
  customer_id VARCHAR(64) NOT NULL,
  order_type VARCHAR(64) NOT NULL,
  trade_category VARCHAR(32),
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  target_date TIMESTAMP,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  labor_installation_fee DECIMAL(10,2) DEFAULT 0.00,
  delivery_fee DECIMAL(10,2) DEFAULT 0.00,
  discount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  downpayment DECIMAL(12,2) DEFAULT 0.00,
  balance_due DECIMAL(12,2) DEFAULT 0.00,
  payment_status VARCHAR(64) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);

-- ----------------------------------------------------------------------------
-- 9. ORDER ITEMS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64),
  title VARCHAR(160) NOT NULL,
  specs TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  unit VARCHAR(32) DEFAULT 'unit',
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ----------------------------------------------------------------------------
-- 10. JOB ORDERS (Workshop Fabrication Kanban Board)
-- 6 Workshop Stages:
--   1. Queued
--   2. Material Cut & Prep
--   3. Assembly
--   4. Quality Control
--   5. Ready
--   6. Installed
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_orders (
  id VARCHAR(64) PRIMARY KEY,
  job_order_no VARCHAR(32) NOT NULL UNIQUE,
  order_id VARCHAR(64) NOT NULL,
  customer_id VARCHAR(64) NOT NULL,
  title VARCHAR(160) NOT NULL,
  trade_category VARCHAR(32),
  stage VARCHAR(32) NOT NULL DEFAULT 'Queued',
  progress_percent INT DEFAULT 0,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  downpayment DECIMAL(12,2) DEFAULT 0.00,
  balance_due DECIMAL(12,2) DEFAULT 0.00,
  assigned_staff VARCHAR(128),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX IF NOT EXISTS idx_jo_no ON job_orders(job_order_no);
CREATE INDEX IF NOT EXISTS idx_jo_stage ON job_orders(stage);
CREATE INDEX IF NOT EXISTS idx_jo_due_date ON job_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_jo_customer ON job_orders(customer_id);

-- ----------------------------------------------------------------------------
-- 11. PURCHASE ORDERS (Stock Replenishment from Vendors)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(64) PRIMARY KEY,
  po_no VARCHAR(32) NOT NULL UNIQUE,
  supplier_id VARCHAR(64) NOT NULL,
  category VARCHAR(64),
  items_summary TEXT,
  order_date DATE NOT NULL,
  expected_date DATE,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'Draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE INDEX IF NOT EXISTS idx_po_no ON purchase_orders(po_no);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);

-- ----------------------------------------------------------------------------
-- 12. INVOICES & BILLING (Receivables & Statements)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(64) PRIMARY KEY,
  invoice_no VARCHAR(32) NOT NULL UNIQUE,
  order_id VARCHAR(64),
  job_order_id VARCHAR(64),
  customer_id VARCHAR(64) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  balance_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'Pending',
  trade VARCHAR(64),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_no ON invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);

-- ----------------------------------------------------------------------------
-- 13. PAYMENTS & OFFICIAL RECEIPTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  receipt_no VARCHAR(32) NOT NULL UNIQUE,
  invoice_id VARCHAR(64),
  order_id VARCHAR(64),
  customer_id VARCHAR(64) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(32) NOT NULL,
  reference_no VARCHAR(64),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received_by VARCHAR(128) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_no);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);

-- ----------------------------------------------------------------------------
-- 14. WARRANTIES & INSTALLATION RECORDS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warranties (
  id VARCHAR(64) PRIMARY KEY,
  cert_no VARCHAR(32) NOT NULL UNIQUE,
  job_order_id VARCHAR(64),
  customer_id VARCHAR(64) NOT NULL,
  project_scope TEXT NOT NULL,
  trade VARCHAR(64),
  install_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  warranty_term VARCHAR(128) NOT NULL,
  status VARCHAR(32) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_warranties_cert ON warranties(cert_no);
CREATE INDEX IF NOT EXISTS idx_warranties_expiry ON warranties(expiry_date);
CREATE INDEX IF NOT EXISTS idx_warranties_status ON warranties(status);

-- ----------------------------------------------------------------------------
-- 15. AUDIT TRAIL & ACTIVITY LOGS
-- Immutable activity log for compliance, traceability, and panel review.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(64),
  username VARCHAR(64) NOT NULL,
  role VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  module VARCHAR(64) NOT NULL,
  details TEXT NOT NULL,
  ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(username);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_log(module);
