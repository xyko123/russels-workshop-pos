-- ============================================================================
-- RUSELL'S GLASS, WOODS & METALS - PRODUCTION DATABASE SEED SCRIPT
-- "You NAME it, we BUILD it" - Tabor Lumber Compound, Roxas Ext., Digos City
-- Run Once Seed Script for MySQL, MariaDB, and SQLite / Turso
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SEED USERS & ROLES
-- Standard roles with SHA-256 hashed passwords:
--   Owner / GM:    username: 'owner'    (Password: Admin123!)
--   Cashier / Fin: username: 'cashier'  (Password: Sales123!)
--   Fabricator:    username: 'workshop' (Password: Craft123!)
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO users (id, username, password_hash, full_name, role, phone, email) VALUES
('usr-001', 'owner', '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121', 'Russel Bajura', 'Owner & General Manager', '0921-371-0555', 'irisjunetaborbajura@gmail.com'),
('usr-002', 'cashier', '8e2f6790905d0f1f9452d303bceaedc687b927b2a9f30163706f0fbbd390077a', 'Iris June Tabor', 'Cashier & Finance Officer', '0929-590-2201', 'irisjunetaborbajura@gmail.com'),
('usr-003', 'workshop', 'f2c2c00dc0e3ac7376e5585f489e64bd9bf6a388708faa470320fbf7419cb5f9', 'Arnel Mendoza', 'Fabrication Lead Foreman', '09053602201', 'fabrication@russelsworkshop.ph');

-- ----------------------------------------------------------------------------
-- 2. SEED 7 SUPPLIERS
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO suppliers (id, code, name, contact_person, phone, email, address, category, lead_time, rating, items_supplied) VALUES
('sup-01', 'SUP-001', 'Mindanao Glass & Aluminum Depot', 'Mr. Dennis Go', '0917-701-4452', 'dennis.mindanaoglass@gmail.com', 'Monteverde Ave., Davao City', 'Glass & Aluminum Profile', '1 - 2 Days', '5.0 Preferred', 'Clear Float, Bronze Glass, 798/900 Aluminum Series, Mirror Backing'),
('sup-02', 'SUP-002', 'Tabor Lumber Compound & Hardwood Supply', 'Iris June Tabor', '0929-590-2201', 'irisjunetaborbajura@gmail.com', 'Roxas Ext., Brgy. Zone III, Digos City', 'Wood, Jambs & Moldings', 'Immediate (On-Site Yard)', '5.0 Direct Yard', 'Kiln-Dried Hardwood, 2x5 Jambs, Solid Panel Doors, Wooden Moldings'),
('sup-03', 'SUP-003', 'Digos Steel & Industrial Hardware Mart', 'Engr. Nelson Sy', '0922-814-9912', 'sales@digossteel.ph', 'Rizal Avenue cor. Lapu-Lapu St., Digos City', 'Metal & Welding Materials', 'Same Day', '4.8', 'Tubular Steel, Angle Bars, Welding Rods E6013, C-Purlins, Slats'),
('sup-04', 'SUP-004', 'Apex Tempered Glass Corp. Mindanao', 'Ms. Grace Tan', '0918-933-7721', 'orders@apextempered.com', 'Sasa Industrial Park, Davao City', 'Safety Tempered Glass', '3 - 5 Days', '4.9 Certified Safety', '10mm & 12mm Frameless Tempered Glass, Shower Enclosure Panels'),
('sup-05', 'SUP-005', '3M Philippines Architectural & Auto Films', 'Reggie Bautista', '0945-312-8809', 'reggie@3mautofilm.ph', 'Bajada, Davao City', 'Auto Glass Tint & UV Films', '2 Days', '5.0 Authentic 3M', '3M Charcoal Tint, Magic Tint, High-Heat Rejection UV Window Films'),
('sup-06', 'SUP-006', 'Davao Interior & Board Supply', 'Kelvin Lim', '0928-445-1234', 'info@davaointerior.com', 'Agdao, Davao City', 'PVC, Partitions & Blinds', '2 Days', '4.7', 'PVC Fluted Wall/Ceilings, Accordion Folding Doors, Combi Blinds'),
('sup-07', 'SUP-007', 'Mindanao Resin & Chemical Mart', 'Arthur Valencia', '0939-901-2388', 'arthur@mindanaoresin.ph', 'Toril, Davao City', 'Fiberglass Composites', '1 - 2 Days', '4.8', 'Chopped Strand Mat 300/450, Premix Resin, MEKP Hardener, Styrene');

-- ----------------------------------------------------------------------------
-- 3. SEED 10 CUSTOMERS (Digos City Barangays)
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO customers (id, code, name, phone, email, address, barangay, city, customer_type, notes, total_spent) VALUES
('cust-01', 'CUST-101', 'Engr. Roberto Villamor', '0917-823-4512', 'rvillamor.eng@gmail.com', 'Prk. Mahogany, Tres de Mayo', 'Tres de Mayo', 'Digos City', 'Contractor', 'General contractor for 2-storey residential villa project', 48500.00),
('cust-02', 'CUST-102', 'Atty. Cecilia M. Tan', '0928-554-1920', 'atty.tan.law@gmail.com', 'San Jose Highway, Zone 1', 'Zone I', 'Digos City', 'Homeowner', 'Custom dining set and french glass sliding balcony door', 32000.00),
('cust-03', 'CUST-103', 'Davao South Commercial Bakery', '0945-667-8891', 'davaosouthbakery@gmail.com', 'Rizal Avenue cor. Roxas Ext.', 'Zone III', 'Digos City', 'Commercial Business', 'Glass display showcase counters and stainless bread storage racks', 64000.00),
('cust-04', 'CUST-104', 'Mr. & Mrs. Danny Alcantara', '0939-112-9043', 'alcantara.family@yahoo.com', 'Purok Mangga, Cogon', 'Cogon', 'Digos City', 'Homeowner', 'Full house window security grills and front gate repair', 26500.00),
('cust-05', 'CUST-105', 'Sinawilan Christian Academy', '0918-990-2345', 'admin@sinawilanca.edu.ph', 'National Highway, Sinawilan', 'Sinawilan', 'Digos City', 'Commercial Business', 'Classroom aluminum awning windows and metal stair railings', 52000.00),
('cust-06', 'CUST-106', 'Dra. Carmela Sison', '0920-555-7890', 'dr.carmela.sison@gmail.com', 'Roxas Ext., Brgy. Zone III', 'Zone III', 'Digos City', 'Homeowner', 'Solid Narra executive dining set and modular kitchen cabinets', 68000.00),
('cust-07', 'CUST-107', 'Arch. Dennis Tan', '0918-333-4455', 'arch.dennistan@gmail.com', 'Purok Narra, Tres de Mayo', 'Tres de Mayo', 'Digos City', 'Contractor', 'Stainless steel 304 main gate & balcony railings contractor', 45000.00),
('cust-08', 'CUST-108', 'Brgy. Captain Roland Estrada', '0922-111-2233', 'brgy.zone2.digos@gmail.com', 'Barangay Hall, Zone II', 'Zone II', 'Digos City', 'Commercial Business', 'Barangay multi-purpose hall heavy-duty roll-up shutters', 38500.00),
('cust-09', 'CUST-109', 'Mrs. Elena G. Ramos', '0919-444-5566', 'elena.ramos77@gmail.com', 'Prk. Sampaguita, Colorado', 'Colorado', 'Digos City', 'Homeowner', 'Residential sliding window replacement with 6mm Bronze Glass', 18500.00),
('cust-10', 'CUST-110', 'Kapatagan Mountain Resort Admin', '0927-778-9900', 'stay@kapataganresort.ph', 'Sitio Mainit, Kapatagan', 'Kapatagan', 'Digos City', 'Commercial Business', 'Panoramic glass view deck railings and timber cabins', 95000.00);

-- ----------------------------------------------------------------------------
-- 4. SEED PRODUCTS & MATERIALS (Master Catalog)
-- Exact prices, units, and categories
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO products (id, code, name, category, category_label, unit, unit_cost, selling_price, description) VALUES
('prod-gls-01', 'GLS-001', '6mm Clear Float Glass (Cut to Size)', 'glass', 'Glass Works', 'sq ft', 65.00, 110.00, 'High-clarity annealed glass, standard for windows and display frames'),
('prod-gls-02', 'GLS-002', '6mm Bronze Tinted Glass', 'glass', 'Glass Works', 'sq ft', 85.00, 145.00, 'Sun-filtering bronze architectural glass for modern residential facades'),
('prod-gls-03', 'GLS-003', '1/4" (6mm) Beveled Mirror Glass', 'glass', 'Glass Works', 'sq ft', 110.00, 195.00, 'Polished beveled mirror with protective moisture-resistant backing'),
('prod-gls-04', 'GLS-004', '10mm Clear Tempered Glass Panel', 'glass', 'Glass Works', 'sq ft', 180.00, 290.00, 'Safety tempered glass for frameless shower enclosures and storefronts'),
('prod-wod-01', 'WOD-001', '1/2" Marine Plywood (4ft x 8ft)', 'wood', 'Wood & Cabinets', 'sheet', 780.00, 1050.00, 'Water-resistant marine board suitable for kitchen counter base and cabinets'),
('prod-wod-02', 'WOD-002', '3/4" Marine Plywood (4ft x 8ft)', 'wood', 'Wood & Cabinets', 'sheet', 1250.00, 1680.00, 'Heavy structural grade for premium wardrobe carcasses and hanging cabinets'),
('prod-wod-03', 'WOD-003', 'Kiln-Dried Mahogany 2" x 2" x 10ft', 'wood', 'Wood & Cabinets', 'length', 260.00, 380.00, 'Straight-grain hardwood for sturdy furniture framing and door jambs'),
('prod-wod-04', 'WOD-004', 'Melamine Faced Board White 4ft x 8ft (3/4")', 'wood', 'Wood & Cabinets', 'sheet', 1450.00, 1950.00, 'Scratch-resistant pre-finished board for clean interior pantry shelves'),
('prod-wod-05', 'WOD-005', 'Solid Wood Panel Door (Mahogany / Narra Grain)', 'wood', 'Wood & Cabinets', 'leaf', 3200.00, 5400.00, 'Kiln-dried solid hardwood panel door crafted at Tabor Lumber Compound'),
('prod-wod-06', 'WOD-006', 'Door & Window Wooden Jambs (2" x 5" Kiln-Dried)', 'wood', 'Wood & Cabinets', 'set', 1100.00, 1850.00, 'Precision rabbeted kiln-dried jambs ready for natural finish'),
('prod-mtl-01', 'MTL-001', '1.5" x 1.5" Stainless Square Tube 304 (1.5mm x 6m)', 'metal', 'Metal & Steel', 'length', 1350.00, 1850.00, 'Anti-corrosion SS304 mirror finish for residential railings'),
('prod-mtl-02', 'MTL-002', 'Tubular Steel 1" x 2" x 1.5mm (20ft)', 'metal', 'Metal & Steel', 'length', 460.00, 650.00, 'High tensile rectangular tube for gate framing and stair railings'),
('prod-mtl-04', 'MTL-004', 'Aluminum Section 798 Series (Analok Dark Bronze, 21ft)', 'metal', 'Metal & Steel', 'length', 590.00, 850.00, 'Heavy-duty architectural aluminum profile for 2-panel sliding windows'),
('prod-mtl-05', 'MTL-005', 'Aluminum Section 798 Series (Powder Coated White, 21ft)', 'metal', 'Metal & Steel', 'length', 640.00, 920.00, 'Glossy white powder coated aluminum track for modern residential windows'),
('prod-mtl-07', 'MTL-007', 'Stainless Steel Stair & Balcony Railings (SS304 Mirror)', 'metal', 'Metal & Steel', 'linear meter', 1800.00, 3100.00, '2" SS304 top tube with safety balusters and heavy-duty floor mounting flanges'),
('prod-sht-01', 'SHT-001', 'Roll-Up Shutter Door Galvanized Slats (Gauge 22)', 'metal', 'Metal & Steel', 'sq meter', 1800.00, 2850.00, 'Galvalume weather-resistant interlocking slats with endlocks'),
('prod-sht-02', 'SHT-002', 'Roll-Up Shutter Motor Operator with Manual Chain', 'hardware', 'Hardware & Supplies', 'set', 8500.00, 13500.00, 'Electric remote motor with override manual chain block for power outage safety'),
('prod-sht-03', 'SHT-003', 'Roll-Up Shutter Emergency Repair & Maintenance Service', 'hardware', 'Hardware & Supplies', 'service job', 1200.00, 2500.00, 'On-site slat realignment, spring rewinding, lubrication, and safety inspection in Digos');

-- ----------------------------------------------------------------------------
-- 5. SEED INVENTORY (Real-Time Stock & Reorder Points)
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO inventory (id, product_id, stock_quantity, reserved_quantity, unit, reorder_level) VALUES
('inv-01', 'prod-gls-01', 450.00, 88.00, 'sq ft', 100.00),
('inv-02', 'prod-gls-02', 279.00, 40.00, 'sq ft', 80.00),
('inv-03', 'prod-gls-03', 140.00, 0.00, 'sq ft', 50.00),
('inv-04', 'prod-gls-04', 45.00, 0.00, 'sq ft', 60.00), -- Low stock alert
('inv-05', 'prod-wod-01', 62.00, 0.00, 'sheet', 25.00),
('inv-06', 'prod-wod-02', 40.00, 3.00, 'sheet', 20.00),
('inv-07', 'prod-wod-03', 85.00, 0.00, 'length', 30.00),
('inv-08', 'prod-wod-04', 12.00, 0.00, 'sheet', 15.00), -- Low stock alert
('inv-09', 'prod-wod-05', 20.00, 0.00, 'leaf', 6.00),
('inv-10', 'prod-wod-06', 45.00, 0.00, 'set', 15.00),
('inv-11', 'prod-mtl-01', 32.00, 0.00, 'length', 10.00),
('inv-12', 'prod-mtl-02', 75.00, 6.00, 'length', 30.00),
('inv-13', 'prod-mtl-04', 42.00, 8.00, 'length', 20.00),
('inv-14', 'prod-mtl-05', 18.00, 0.00, 'length', 20.00), -- Low stock alert
('inv-15', 'prod-mtl-07', 40.00, 0.00, 'linear meter', 10.00),
('inv-16', 'prod-sht-01', 65.00, 0.00, 'sq meter', 15.00),
('inv-17', 'prod-sht-02', 12.00, 0.00, 'set', 4.00),
('inv-18', 'prod-sht-03', 99.00, 0.00, 'service job', 5.00);

-- ----------------------------------------------------------------------------
-- 6. SEED 3 SAMPLE ORDERS & 3 WORKSHOP JOB ORDERS
-- ----------------------------------------------------------------------------
-- Order 1: JO-2026-0041 Glass (Engr. Roberto Villamor)
INSERT OR REPLACE INTO orders (id, order_no, customer_id, order_type, trade_category, order_date, target_date, subtotal, labor_installation_fee, delivery_fee, discount, total_amount, downpayment, balance_due, payment_status) VALUES
('ord-101', 'ORD-2026-0041', 'cust-01', 'Fabrication & Installation On-Site', 'glass', '2026-11-10 10:30:00', '2026-11-20 17:00:00', 25200.00, 3500.00, 800.00, 500.00, 29000.00, 15000.00, 14000.00, 'Partial / Downpayment Paid');

INSERT OR REPLACE INTO job_orders (id, job_order_no, order_id, customer_id, title, trade_category, stage, progress_percent, start_date, due_date, total_amount, downpayment, balance_due, assigned_staff, notes) VALUES
('jo-101', 'JO-2026-0041', 'ord-101', 'cust-01', '4 Sets Custom Sliding Windows (6mm Bronze Float & 798 Frame)', 'glass', 'Material Cut & Prep', 55, '2026-11-10 10:30:00', '2026-11-20 17:00:00', 29000.00, 15000.00, 14000.00, 'Arnel Mendoza & Glass Team', 'Glass sheets precision cut to size. Sashes framed; corner joints sealed.');

-- Order 2: JO-2026-0042 Wood (Atty. Cecilia M. Tan)
INSERT OR REPLACE INTO orders (id, order_no, customer_id, order_type, trade_category, order_date, target_date, subtotal, labor_installation_fee, delivery_fee, discount, total_amount, downpayment, balance_due, payment_status) VALUES
('ord-102', 'ORD-2026-0042', 'cust-02', 'Fabrication & Installation On-Site', 'wood', '2026-11-08 14:00:00', '2026-11-22 15:00:00', 22000.00, 4000.00, 600.00, 0.00, 26600.00, 13300.00, 13300.00, 'Partial / Downpayment Paid');

INSERT OR REPLACE INTO job_orders (id, job_order_no, order_id, customer_id, title, trade_category, stage, progress_percent, start_date, due_date, total_amount, downpayment, balance_due, assigned_staff, notes) VALUES
('jo-102', 'JO-2026-0042', 'ord-102', 'cust-02', 'Custom Modular Kitchen Overhead Cabinets (3/4" Marine Plywood)', 'wood', 'Quality Control', 90, '2026-11-08 14:00:00', '2026-11-22 15:00:00', 26600.00, 13300.00, 13300.00, 'Boyet Woodcraft', 'Duco paint topcoat cured. Hydraulic soft-close hinges aligned. Ready for delivery.');

-- Order 3: JO-2026-0043 Metal (Mr. & Mrs. Danny Alcantara)
INSERT OR REPLACE INTO orders (id, order_no, customer_id, order_type, trade_category, order_date, target_date, subtotal, labor_installation_fee, delivery_fee, discount, total_amount, downpayment, balance_due, payment_status) VALUES
('ord-103', 'ORD-2026-0043', 'cust-04', 'Fabrication & Installation On-Site', 'metal', '2026-11-12 09:15:00', '2026-11-25 16:00:00', 16800.00, 3200.00, 500.00, 0.00, 20500.00, 10000.00, 10500.00, 'Partial / Downpayment Paid');

INSERT OR REPLACE INTO job_orders (id, job_order_no, order_id, customer_id, title, trade_category, stage, progress_percent, start_date, due_date, total_amount, downpayment, balance_due, assigned_staff, notes) VALUES
('jo-103', 'JO-2026-0043', 'ord-103', 'cust-04', 'Modern Geometric Security Window Grills & Gate Reinforcement', 'metal', 'Queued', 15, '2026-11-12 09:15:00', '2026-11-25 16:00:00', 20500.00, 10000.00, 10500.00, 'Kiko Welder & Fabrication Team', 'Materials staged at welding table. Angle bars and tubular cut list ready.');

-- ----------------------------------------------------------------------------
-- 7. SEED INVOICES & PAYMENTS ACROSS THE LAST 6 MONTHS
-- Powers the monthly Sales Overview chart and Overdue Receivables card
-- ----------------------------------------------------------------------------
-- June 2026
INSERT OR REPLACE INTO invoices (id, invoice_no, customer_id, issue_date, due_date, total_amount, amount_paid, balance_due, status, trade) VALUES
('inv-2026-06', 'INV-2026-0112', 'cust-08', '2026-06-15', '2026-07-15', 38500.00, 38500.00, 0.00, 'Paid', 'Shutters & Metal');
INSERT OR REPLACE INTO payments (id, receipt_no, invoice_id, customer_id, amount, payment_method, reference_no, payment_date, received_by, notes) VALUES
('pay-2026-06', 'OR-2026-0112', 'inv-2026-06', 'cust-08', 38500.00, 'Cash', 'POS-REC-0112', '2026-06-15 11:00:00', 'Iris June Tabor', 'Full payment for Brgy. Hall roll-up shutter installation');

-- July 2026
INSERT OR REPLACE INTO invoices (id, invoice_no, customer_id, issue_date, due_date, total_amount, amount_paid, balance_due, status, trade) VALUES
('inv-2026-07', 'INV-2026-0134', 'cust-05', '2026-07-20', '2026-08-20', 45200.00, 45200.00, 0.00, 'Paid', 'Metal Works');
INSERT OR REPLACE INTO payments (id, receipt_no, invoice_id, customer_id, amount, payment_method, reference_no, payment_date, received_by, notes) VALUES
('pay-2026-07', 'OR-2026-0134', 'inv-2026-07', 'cust-05', 45200.00, 'Check', 'CHK-BDO-49102', '2026-07-20 14:30:00', 'Iris June Tabor', 'School stair railing installation full payment');

-- August 2026
INSERT OR REPLACE INTO invoices (id, invoice_no, customer_id, issue_date, due_date, total_amount, amount_paid, balance_due, status, trade) VALUES
('inv-2026-08', 'INV-2026-0158', 'cust-01', '2026-08-18', '2026-09-18', 58000.00, 58000.00, 0.00, 'Paid', 'Glass Works');
INSERT OR REPLACE INTO payments (id, receipt_no, invoice_id, customer_id, amount, payment_method, reference_no, payment_date, received_by, notes) VALUES
('pay-2026-08', 'OR-2026-0158', 'inv-2026-08', 'cust-01', 58000.00, 'GCash', 'GCASH-881920391', '2026-08-18 10:15:00', 'Iris June Tabor', 'Commercial storefront tempered glass project');

-- September 2026
INSERT OR REPLACE INTO invoices (id, invoice_no, customer_id, issue_date, due_date, total_amount, amount_paid, balance_due, status, trade) VALUES
('inv-2026-09', 'INV-2026-0180', 'cust-03', '2026-09-22', '2026-10-22', 62400.00, 62400.00, 0.00, 'Paid', 'Glass & Metal');
INSERT OR REPLACE INTO payments (id, receipt_no, invoice_id, customer_id, amount, payment_method, reference_no, payment_date, received_by, notes) VALUES
('pay-2026-09', 'OR-2026-0180', 'inv-2026-09', 'cust-03', 62400.00, 'Bank Transfer', 'BPI-TRF-091244', '2026-09-22 16:45:00', 'Iris June Tabor', 'Bakery display cases and stainless work surfaces');

-- October 2026
INSERT OR REPLACE INTO invoices (id, invoice_no, customer_id, issue_date, due_date, total_amount, amount_paid, balance_due, status, trade) VALUES
('inv-2026-10', 'INV-2026-0195', 'cust-10', '2026-10-15', '2026-11-15', 54800.00, 54800.00, 0.00, 'Paid', 'Glass Works');
INSERT OR REPLACE INTO payments (id, receipt_no, invoice_id, customer_id, amount, payment_method, reference_no, payment_date, received_by, notes) VALUES
('pay-2026-10', 'OR-2026-0195', 'inv-2026-10', 'cust-10', 54800.00, 'GCash', 'GCASH-991204851', '2026-10-15 13:00:00', 'Iris June Tabor', 'Resort glass deck balustrades');

-- November 2026 (Current Month)
INSERT OR REPLACE INTO invoices (id, invoice_no, customer_id, issue_date, due_date, total_amount, amount_paid, balance_due, status, trade) VALUES
('inv-001', 'INV-2026-0201', 'cust-01', '2026-11-01', '2026-12-01', 85000.00, 85000.00, 0.00, 'Paid', 'Glass Works'),
('inv-002', 'INV-2026-0202', 'cust-06', '2026-11-05', '2026-12-05', 68000.00, 35000.00, 33000.00, 'Partial', 'Wood Works'),
('inv-003', 'INV-2026-0203', 'cust-07', '2026-11-02', '2026-11-15', 45000.00, 20000.00, 25000.00, 'Overdue', 'Metal Works'); -- Overdue demonstration

INSERT OR REPLACE INTO payments (id, receipt_no, invoice_id, customer_id, amount, payment_method, reference_no, payment_date, received_by, notes) VALUES
('pay-101', 'OR-2026-0201', 'inv-001', 'cust-01', 85000.00, 'Bank Transfer', 'BDO-TRF-881923', '2026-11-01 10:00:00', 'Iris June Tabor', 'Full payment for storefront glass'),
('pay-102', 'OR-2026-0202', 'inv-002', 'cust-06', 35000.00, 'Cash', 'CASH-REC-0202', '2026-11-05 14:00:00', 'Iris June Tabor', 'Initial 50% deposit for dining set'),
('pay-103', 'OR-2026-0203', 'inv-003', 'cust-07', 20000.00, 'GCash', 'GCASH-771829104', '2026-11-02 11:30:00', 'Iris June Tabor', 'Partial deposit for SS gate');

-- ----------------------------------------------------------------------------
-- 8. SEED PURCHASE ORDERS (Supplier Orders)
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO purchase_orders (id, po_no, supplier_id, category, items_summary, order_date, expected_date, total_amount, status, notes) VALUES
('po-2026-001', 'PO-2026-0101', 'sup-01', 'Glass Works', '6mm Clear Float Glass (450 sq ft), 6mm Bronze Glass (200 sq ft)', '2026-11-10', '2026-11-15', 42500.00, 'Received', 'Standard replenishment for high-demand clear float glass'),
('po-2026-002', 'PO-2026-0102', 'sup-02', 'Wood & Carpentry', '3/4 Marine Plywood (30 sheets), 2x3 KD Mahogany (50 pcs)', '2026-11-12', '2026-11-18', 58400.00, 'Submitted', 'Cabinet carcass stock for ongoing kitchen contracts'),
('po-2026-003', 'PO-2026-0103', 'sup-03', 'Metal Works', '1.5" Stainless Round Pipe 304 (20 pcs), 304 Flat Bar (15 pcs)', '2026-11-14', '2026-11-20', 34200.00, 'Draft', 'Railing fabrication batch for upcoming commercial contract'),
('po-2026-004', 'PO-2026-0104', 'sup-04', 'Safety Tempered Glass', '10mm Clear Frameless Tempered Glass Panels (6 sets)', '2026-11-05', '2026-11-08', 26800.00, 'Paid', 'Paid in full upon delivery at Roxas Ext. yard');

-- ----------------------------------------------------------------------------
-- 9. SEED WARRANTIES & AUDIT LOGS
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO warranties (id, cert_no, customer_id, project_scope, trade, install_date, expiry_date, warranty_term, status) VALUES
('war-001', 'WC-2026-0081', 'cust-01', 'Commercial 12mm Tempered Glass Storefront & Patch Fittings', 'Glass Works', '2026-08-15', '2027-08-15', '1 Year Full Structural & Sealant', 'Active'),
('war-002', 'WC-2026-0082', 'cust-06', 'Solid Narra Executive Dining Set & Modular Kitchen Cabinets', 'Wood Works', '2026-09-01', '2028-09-01', '2 Years Wood Treatment & Hardware', 'Active'),
('war-003', 'WC-2026-0083', 'cust-07', 'Stainless Steel 304 Main Gate & Balcony Railings', 'Metal Works', '2025-11-25', '2026-11-25', '1 Year Anti-Rust & TIG Weld', 'Expiring Soon'),
('war-004', 'WC-2025-0045', 'cust-08', 'Galvanized Steel Heavy-Duty Roll-Up Shutter Doors', 'Shutters & Metal', '2025-05-10', '2026-05-10', '1 Year Spring & Motor Warranty', 'Expired');

INSERT OR REPLACE INTO audit_log (id, timestamp, username, role, action, module, details, ip_address) VALUES
('aud-001', '2026-11-17 08:30:15', 'owner', 'Owner & General Manager', 'LOGIN', 'Authentication', 'User authenticated from workshop terminal at Roxas Ext., Digos City', '192.168.1.101'),
('aud-002', '2026-11-17 09:12:44', 'cashier', 'Cashier & Finance Officer', 'PAYMENT_COLLECT', 'Payments & Billing', 'Collected downpayment ₱15,000.00 for JO-2026-0041 (Receipt OR-2026-0198)', '192.168.1.102'),
('aud-003', '2026-11-17 09:45:00', 'workshop', 'Fabrication Lead Foreman', 'STAGE_ADVANCE', 'Job Orders (Kanban)', 'Advanced JO-2026-0041 from Material Cut & Prep to Assembly', '192.168.1.103'),
('aud-004', '2026-11-16 16:20:10', 'owner', 'Owner & General Manager', 'STOCK_RESTOCK', 'Inventory', 'Stock update: GLS-001 (+50 sq ft) verified from Mindanao Glass Depot PO-2026-0101', '192.168.1.101'),
('aud-005', '2026-11-16 14:10:05', 'cashier', 'Cashier & Finance Officer', 'QUOTATION_CREATE', 'Quotations & Cut List', 'Generated quote QT-2026-0018 (₱69,000.00) for Sinawilan Christian Academy', '192.168.1.102');
