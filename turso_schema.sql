-- ============================================================================
-- RUSELL'S GLASS, WOODS & METALS - TURSO CLOUD DATABASE (SQLite / libSQL)
-- "You NAME it, we BUILD it" - Tabor Lumber Compound, Roxas Ext., Digos City
-- Enterprise Cloud Database Schema & Initial Records
-- ============================================================================

-- 1. USERS & ACCESS ROLES
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO users (id, username, password_hash, full_name, role, phone, email) VALUES
('usr-002', 'rusell.owner', 'rusell2026', 'Rusell Bajura', 'Owner & General Manager', '0921-371-0555', 'rusellbajura@gmail.com'),
('usr-003', 'iris.finance', 'iris2026', 'Iris Bajura', 'Cashier & Finance Officer', '0929-590-2201', 'irisjuntaborbajura@gmail.com'),
('usr-004', 'arnel.leadfab', 'fab2026', 'Arnel Mendoza', 'Fabrication Lead Foreman', '0938-112-4455', 'arnel.fab@gmail.com');

-- 2. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  customer_type TEXT,
  total_spent REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO customers (id, code, name, phone, address, customer_type, total_spent) VALUES
('cust-01', 'CUST-101', 'Engr. Roberto Villamor', '0917-823-4512', 'Prk. Mahogany, Tres de Mayo, Digos City', 'Contractor', 48500),
('cust-02', 'CUST-102', 'Atty. Cecilia M. Tan', '0928-554-1920', 'San Jose Highway, Zone 1, Digos City', 'Homeowner', 32000),
('cust-03', 'CUST-103', 'Davao South Commercial Bakery', '0945-667-8891', 'Rizal Avenue cor. Roxas Ext., Digos City', 'Commercial Business', 64000),
('cust-04', 'CUST-104', 'Mr. & Mrs. Danny Alcantara', '0939-112-9043', 'Purok Mangga, Cogon, Digos City', 'Homeowner', 26500),
('cust-05', 'CUST-105', 'Sinawilan Christian Academy', '0918-990-2345', 'Sinawilan, Digos City', 'Commercial Business', 52000);

-- 3. PRODUCTS & MATERIALS
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  category_label TEXT,
  unit TEXT NOT NULL,
  unit_cost REAL NOT NULL,
  selling_price REAL NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  supplier TEXT,
  description TEXT
);

INSERT OR IGNORE INTO products (id, code, name, category, category_label, unit, unit_cost, selling_price, stock_quantity, reorder_level, supplier, description) VALUES
('prod-gls-01', 'GLS-001', '6mm Clear Float Glass (4ft x 8ft)', 'glass', 'Glass Works', 'sheet', 1150, 1650, 48, 15, 'Mindanao Glass Depot', 'Standard commercial clear glass sheet for windows and partitions'),
('prod-gls-02', 'GLS-002', '6mm Bronze Tinted Glass (4ft x 8ft)', 'glass', 'Glass Works', 'sheet', 1380, 1950, 28, 12, 'Mindanao Glass Depot', 'Sun-control bronze tinted glass for sliding panels'),
('prod-gls-03', 'GLS-003', '10mm Clear Tempered Glass (custom cut)', 'glass', 'Glass Works', 'sq ft', 210, 320, 8, 15, 'Davao Safety Glass Corp', 'Heavy safety glass with polished beveled edges for storefronts'),
('prod-wod-01', 'WOD-001', '1/2" Marine Plywood (4ft x 8ft)', 'wood', 'Wood & Cabinets', 'sheet', 780, 1050, 62, 25, 'Digos Southern Lumber Supply', 'Water-resistant marine board for kitchen counter base'),
('prod-wod-02', 'WOD-002', '3/4" Marine Plywood (4ft x 8ft)', 'wood', 'Wood & Cabinets', 'sheet', 1250, 1680, 40, 20, 'Digos Southern Lumber Supply', 'Heavy structural grade for premium wardrobe carcasses'),
('prod-mtl-01', 'MTL-001', '1.5" x 1.5" Stainless Square Tube 304 (1.5mm x 6m)', 'metal', 'Metal & Steel', 'length', 1350, 1850, 32, 10, 'Southern Davao Steel Center', 'Anti-corrosion SS304 mirror finish for residential railings'),
('prod-sht-01', 'SHT-001', 'Roll-Up Shutter Slat Galvanized Steel (Gauge 22)', 'metal', 'Metal & Steel', 'sq m', 950, 1450, 4, 15, 'Rusell''s Direct Fab', 'Galvalume weather-resistant interlocking slats with endlocks');

-- 4. ORDERS & JOB ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  job_order_no TEXT,
  customer_id TEXT,
  customer_name TEXT,
  order_type TEXT,
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_amount REAL NOT NULL,
  downpayment REAL DEFAULT 0,
  balance_due REAL DEFAULT 0,
  payment_status TEXT,
  job_status TEXT,
  notes TEXT
);

INSERT OR IGNORE INTO orders (id, order_no, job_order_no, customer_id, customer_name, order_type, total_amount, downpayment, balance_due, payment_status, job_status, notes) VALUES
('ord-101', 'ORD-2026-0041', 'JO-2026-0041', 'cust-01', 'Engr. Roberto Villamor', 'Fabrication & Installation On-Site', 29000, 15000, 14000, 'Partial / Downpayment Paid', 'in_fabrication', 'Framing done. Glass cutting completed.'),
('ord-102', 'ORD-2026-0042', 'JO-2026-0042', 'cust-03', 'Davao South Commercial Bakery', 'Fabrication & Installation On-Site', 35500, 35500, 0, 'Full Payment Received', 'materials_prepared', 'Roll-up shutter shaft assembly scheduled.'),
('ord-103', 'ORD-2026-0043', 'JO-2026-0043', 'cust-02', 'Atty. Cecilia M. Tan', 'Over-the-Counter Sales', 14100, 14100, 0, 'Full Payment Received', 'installed_delivered', 'Delivered to San Jose Highway residence.');
