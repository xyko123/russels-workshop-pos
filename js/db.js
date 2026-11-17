/**
 * Russel's Glass, Wood and Metals - Database & LocalStorage Engine
 * Official Workshop Operations & Point of Sale System
 * Roxas Extension, Digos City, Davao del Sur
 */

const DB_KEYS = {
  PRODUCTS: 'russels_products_v2',
  CUSTOMERS: 'russels_customers_v1',
  QUOTATIONS: 'russels_quotations_v1',
  ORDERS: 'russels_orders_v1',
  PAYMENTS: 'russels_payments_v1',
  SETTINGS: 'russels_settings_v3',
  USERS: 'russels_users',
  SUPPLIERS: 'russels_suppliers_v1',
  PURCHASE_ORDERS: 'russels_purchase_orders_v1',
  WARRANTY: 'russels_warranty_v1',
  INVOICES: 'russels_invoices_v1',
  AUDIT: 'russels_audit_v1'
};

// Seed Supplier Purchase Orders (Stock replenishment from local vendors)
const INITIAL_PURCHASE_ORDERS = [
  {
    id: 'po-2026-001',
    poNo: 'PO-2026-0101',
    supplierId: 'sup-01',
    supplierName: 'Mindanao Glass Depot (Davao)',
    category: 'Glass Works',
    itemsSummary: '6mm Clear Float Glass (450 sq ft), 6mm Bronze Glass (200 sq ft)',
    orderDate: '2026-11-10',
    expectedDate: '2026-11-15',
    totalAmount: 42500,
    status: 'Received',
    notes: 'Standard replenishment for high-demand clear float glass'
  },
  {
    id: 'po-2026-002',
    poNo: 'PO-2026-0102',
    supplierId: 'sup-02',
    supplierName: 'Davao Lumber & Hardware Supply',
    category: 'Wood & Carpentry',
    itemsSummary: '3/4 Marine Plywood (30 sheets), 2x3 KD Mahogany (50 pcs)',
    orderDate: '2026-11-12',
    expectedDate: '2026-11-18',
    totalAmount: 58400,
    status: 'Submitted',
    notes: 'Cabinet carcass stock for ongoing kitchen contracts'
  },
  {
    id: 'po-2026-003',
    poNo: 'PO-2026-0103',
    supplierId: 'sup-03',
    supplierName: 'Apex Stainless Steel & Metal Depot',
    category: 'Metal Works',
    itemsSummary: '1.5" Stainless Round Pipe 304 (20 pcs), 304 Flat Bar (15 pcs)',
    orderDate: '2026-11-14',
    expectedDate: '2026-11-20',
    totalAmount: 34200,
    status: 'Draft',
    notes: 'Railing fabrication batch for upcoming commercial contract'
  },
  {
    id: 'po-2026-004',
    poNo: 'PO-2026-0104',
    supplierId: 'sup-05',
    supplierName: 'Digos Glass & Aluminum Center',
    category: 'Aluminum Works',
    itemsSummary: '798 Sliding Window Aluminum Profiles (Analok 18 sets)',
    orderDate: '2026-11-05',
    expectedDate: '2026-11-08',
    totalAmount: 26800,
    status: 'Paid',
    notes: 'Paid in full upon delivery at Roxas Ext. yard'
  }
];

// Seed Official Warranty & Installation Certificates
const INITIAL_WARRANTY_RECORDS = [
  {
    id: 'war-001',
    certNo: 'WC-2026-0081',
    jobOrderNo: 'JO-2026-0038',
    customerName: 'Engr. Mateo Alcantara',
    phone: '0917-889-1234',
    address: 'Brgy. San Jose, Digos City',
    projectScope: 'Commercial 12mm Tempered Glass Storefront & Patch Fittings',
    trade: 'Glass Works',
    installDate: '2026-08-15',
    expiryDate: '2027-08-15',
    warrantyTerm: '1 Year Full Structural & Weather Sealant',
    status: 'Active'
  },
  {
    id: 'war-002',
    certNo: 'WC-2026-0082',
    jobOrderNo: 'JO-2026-0039',
    customerName: 'Dra. Carmela Sison',
    phone: '0920-555-7890',
    address: 'Roxas Ext., Brgy. Zone III, Digos City',
    projectScope: 'Solid Narra Executive Dining Set & Modular Kitchen Cabinets',
    trade: 'Wood Works',
    installDate: '2026-09-01',
    expiryDate: '2028-09-01',
    warrantyTerm: '2 Years Wood Treatment & Soft-Close Hardware',
    status: 'Active'
  },
  {
    id: 'war-003',
    certNo: 'WC-2026-0083',
    jobOrderNo: 'JO-2026-0040',
    customerName: 'Arch. Dennis Tan',
    phone: '0918-333-4455',
    address: 'Brgy. Tres de Mayo, Digos City',
    projectScope: 'Stainless Steel 304 Main Gate & Balcony Railings',
    trade: 'Metal Works',
    installDate: '2025-11-20',
    expiryDate: '2026-11-20',
    warrantyTerm: '1 Year Anti-Rust & TIG Weld Structural Integrity',
    status: 'Expiring Soon'
  },
  {
    id: 'war-004',
    certNo: 'WC-2025-0045',
    jobOrderNo: 'JO-2025-0022',
    customerName: 'Barangay Zone II Local Council',
    phone: '0922-111-2233',
    address: 'Brgy. Zone II, Digos City',
    projectScope: 'Galvanized Steel Heavy-Duty Roll-Up Shutter Doors',
    trade: 'Shutters & Metal',
    installDate: '2025-05-10',
    expiryDate: '2026-05-10',
    warrantyTerm: '1 Year Spring & Motor Mechanical Warranty',
    status: 'Expired'
  }
];

// Seed Customer Invoices
const INITIAL_INVOICES = [
  {
    id: 'inv-001',
    invoiceNo: 'INV-2026-0201',
    orderId: 'ord-01',
    jobOrderNo: 'JO-2026-0038',
    customerName: 'Engr. Mateo Alcantara',
    phone: '0917-889-1234',
    issueDate: '2026-10-25',
    dueDate: '2026-11-25',
    totalAmount: 85000,
    amountPaid: 85000,
    balanceDue: 0,
    status: 'Paid',
    trade: 'Glass Works'
  },
  {
    id: 'inv-002',
    invoiceNo: 'INV-2026-0202',
    orderId: 'ord-02',
    jobOrderNo: 'JO-2026-0039',
    customerName: 'Dra. Carmela Sison',
    phone: '0920-555-7890',
    issueDate: '2026-11-02',
    dueDate: '2026-12-02',
    totalAmount: 68000,
    amountPaid: 35000,
    balanceDue: 33000,
    status: 'Partial',
    trade: 'Wood Works'
  },
  {
    id: 'inv-003',
    invoiceNo: 'INV-2026-0203',
    orderId: 'ord-03',
    jobOrderNo: 'JO-2026-0040',
    customerName: 'Arch. Dennis Tan',
    phone: '0918-333-4455',
    issueDate: '2026-11-08',
    dueDate: '2026-11-22',
    totalAmount: 45000,
    amountPaid: 20000,
    balanceDue: 25000,
    status: 'Overdue',
    trade: 'Metal Works'
  }
];

// Seed Audit Trail Activity Logs
const INITIAL_AUDIT_LOGS = [
  {
    id: 'aud-001',
    timestamp: '2026-11-17 08:30:15',
    user: 'owner',
    role: 'Owner / Admin',
    action: 'LOGIN',
    module: 'Authentication',
    details: 'User authenticated from workshop terminal at Roxas Ext., Digos City',
    ip: '192.168.1.101'
  },
  {
    id: 'aud-002',
    timestamp: '2026-11-17 09:12:44',
    user: 'sales',
    role: 'Sales & Cashier',
    action: 'PAYMENT_COLLECT',
    module: 'Payments & Billing',
    details: 'Collected downpayment ₱15,000 for JO-2026-0041 (Receipt OR-2026-0089)',
    ip: '192.168.1.102'
  },
  {
    id: 'aud-003',
    timestamp: '2026-11-17 09:45:00',
    user: 'workshop',
    role: 'Lead Fabricator',
    action: 'STAGE_ADVANCE',
    module: 'Job Orders (Kanban)',
    details: 'Advanced JO-2026-0041 from Material Cut & Prep to Assembly',
    ip: '192.168.1.103'
  },
  {
    id: 'aud-004',
    timestamp: '2026-11-16 16:20:10',
    user: 'owner',
    role: 'Owner / Admin',
    action: 'STOCK_RESTOCK',
    module: 'Inventory',
    details: 'Stock update: GLS-001 (+50 sq ft) verified from Mindanao Glass Depot PO-2026-0101',
    ip: '192.168.1.101'
  },
  {
    id: 'aud-005',
    timestamp: '2026-11-16 14:10:05',
    user: 'sales',
    role: 'Sales & Cashier',
    action: 'QUOTATION_CREATE',
    module: 'Quotations & Cut List',
    details: 'Generated quote QT-2026-0012 (₱34,500) for Dra. Carmela Sison',
    ip: '192.168.1.102'
  }
];

// Seed Products (Glass, Wood, Metal, Hardware, Ready-Made)
const INITIAL_PRODUCTS = [
  // GLASS PRODUCTS & MATERIALS
  {
    id: 'prod-gls-01',
    code: 'GLS-001',
    name: '6mm Clear Float Glass (Cut to Size)',
    category: 'glass',
    categoryLabel: 'Glass Works',
    unit: 'sq ft',
    unitCost: 65,
    sellingPrice: 110,
    stockQuantity: 450,
    reorderLevel: 100,
    supplier: 'Mindanao Glass Depot (Davao)',
    description: 'High-clarity annealed glass, standard for windows and display frames'
  },
  {
    id: 'prod-gls-02',
    code: 'GLS-002',
    name: '6mm Bronze Tinted Glass',
    category: 'glass',
    categoryLabel: 'Glass Works',
    unit: 'sq ft',
    unitCost: 85,
    sellingPrice: 145,
    stockQuantity: 280,
    reorderLevel: 80,
    supplier: 'Mindanao Glass Depot (Davao)',
    description: 'Sun-filtering bronze architectural glass for modern residential facades'
  },
  {
    id: 'prod-gls-03',
    code: 'GLS-003',
    name: '1/4" (6mm) Beveled Mirror Glass',
    category: 'glass',
    categoryLabel: 'Glass Works',
    unit: 'sq ft',
    unitCost: 110,
    sellingPrice: 195,
    stockQuantity: 140,
    reorderLevel: 50,
    supplier: 'Asahi Glass Center',
    description: 'Polished beveled mirror with protective moisture-resistant backing'
  },
  {
    id: 'prod-gls-04',
    code: 'GLS-004',
    name: '10mm Clear Tempered Glass Panel',
    category: 'glass',
    categoryLabel: 'Glass Works',
    unit: 'sq ft',
    unitCost: 180,
    sellingPrice: 290,
    stockQuantity: 45, // Low stock demo
    reorderLevel: 60,
    supplier: 'Apex Tempered Glass Corp.',
    description: 'Safety tempered glass for frameless shower enclosures and store fronts'
  },
  {
    id: 'prod-gls-05',
    code: 'GLS-005',
    name: 'Glass Jalousie / Louver Blades 4" x 24" (Frosted)',
    category: 'glass',
    categoryLabel: 'Glass Works',
    unit: 'box (20 pcs)',
    unitCost: 420,
    sellingPrice: 650,
    stockQuantity: 35,
    reorderLevel: 15,
    supplier: 'Mindanao Glass Depot',
    description: 'Standard frosted blades with ground edges for residential louvers'
  },

  // WOOD & CABINET MATERIALS
  {
    id: 'prod-wod-01',
    code: 'WOD-001',
    name: '1/2" Marine Plywood (4ft x 8ft)',
    category: 'wood',
    categoryLabel: 'Wood & Cabinets',
    unit: 'sheet',
    unitCost: 780,
    sellingPrice: 1050,
    stockQuantity: 62,
    reorderLevel: 25,
    supplier: 'Digos Southern Lumber Supply',
    description: 'Water-resistant marine board suitable for kitchen counter base and cabinets'
  },
  {
    id: 'prod-wod-02',
    code: 'WOD-002',
    name: '3/4" Marine Plywood (4ft x 8ft)',
    category: 'wood',
    categoryLabel: 'Wood & Cabinets',
    unit: 'sheet',
    unitCost: 1250,
    sellingPrice: 1680,
    stockQuantity: 40,
    reorderLevel: 20,
    supplier: 'Digos Southern Lumber Supply',
    description: 'Heavy structural grade for premium wardrobe carcasses and hanging cabinets'
  },
  {
    id: 'prod-wod-03',
    code: 'WOD-003',
    name: 'Kiln-Dried Mahogany 2" x 2" x 10ft',
    category: 'wood',
    categoryLabel: 'Wood & Cabinets',
    unit: 'length',
    unitCost: 260,
    sellingPrice: 380,
    stockQuantity: 85,
    reorderLevel: 30,
    supplier: 'Sta. Cruz Timber Yard',
    description: 'Straight-grain hardwood for sturdy furniture framing and door jambs'
  },
  {
    id: 'prod-wod-04',
    code: 'WOD-004',
    name: 'Melamine Faced Board White 4ft x 8ft (3/4")',
    category: 'wood',
    categoryLabel: 'Wood & Cabinets',
    unit: 'sheet',
    unitCost: 1450,
    sellingPrice: 1950,
    stockQuantity: 12, // Low stock demo
    reorderLevel: 15,
    supplier: 'Davao Modern Board Center',
    description: 'Scratch-resistant pre-finished board for clean interior pantry shelves'
  },

  // METALS, STEEL & ALUMINUM PROFILES
  {
    id: 'prod-mtl-01',
    code: 'MTL-001',
    name: 'Tubular Steel 1" x 1" x 1.5mm (20ft)',
    category: 'metal',
    categoryLabel: 'Metal & Steel',
    unit: 'length',
    unitCost: 310,
    sellingPrice: 440,
    stockQuantity: 110,
    reorderLevel: 40,
    supplier: 'Digos Steel & Hardware Mart',
    description: 'Standard steel tubing for window security grills and light frames'
  },
  {
    id: 'prod-mtl-02',
    code: 'MTL-002',
    name: 'Tubular Steel 1" x 2" x 1.5mm (20ft)',
    category: 'metal',
    categoryLabel: 'Metal & Steel',
    unit: 'length',
    unitCost: 460,
    sellingPrice: 650,
    stockQuantity: 75,
    reorderLevel: 30,
    supplier: 'Digos Steel & Hardware Mart',
    description: 'High tensile rectangular tube for gate framing and stair railings'
  },
  {
    id: 'prod-mtl-03',
    code: 'MTL-003',
    name: 'Steel Angle Bar 1-1/2" x 1/8" (20ft)',
    category: 'metal',
    categoryLabel: 'Metal & Steel',
    unit: 'length',
    unitCost: 340,
    sellingPrice: 490,
    stockQuantity: 55,
    reorderLevel: 25,
    supplier: 'Southern Steel Traders',
    description: 'Structural angle for window brackets, gate posts, and workshop benches'
  },
  {
    id: 'prod-mtl-04',
    code: 'MTL-004',
    name: 'Aluminum Section 798 Series (Analok Dark Bronze, 21ft)',
    category: 'metal',
    categoryLabel: 'Metal & Steel',
    unit: 'length',
    unitCost: 590,
    sellingPrice: 850,
    stockQuantity: 42,
    reorderLevel: 20,
    supplier: 'Mindanao Glass & Aluminum Depot',
    description: 'Heavy duty architectural aluminum profile for 2-panel sliding windows'
  },
  {
    id: 'prod-mtl-05',
    code: 'MTL-005',
    name: 'Aluminum Section 798 Series (Powder Coated White, 21ft)',
    category: 'metal',
    categoryLabel: 'Metal & Steel',
    unit: 'length',
    unitCost: 640,
    sellingPrice: 920,
    stockQuantity: 18, // Low stock demo
    reorderLevel: 20,
    supplier: 'Mindanao Glass & Aluminum Depot',
    description: 'Glossy white powder coated aluminum track for modern residential windows'
  },

  // HARDWARE, FASTENERS & CONSUMABLES
  {
    id: 'prod-hdw-01',
    code: 'HDW-001',
    name: 'Bostik Neutral Silicone Sealant Clear (300ml)',
    category: 'hardware',
    categoryLabel: 'Hardware & Supplies',
    unit: 'tube',
    unitCost: 155,
    sellingPrice: 220,
    stockQuantity: 84,
    reorderLevel: 30,
    supplier: 'Digos Central Hardware',
    description: 'Non-corrosive weatherproof sealant for glass-to-aluminum seals'
  },
  {
    id: 'prod-hdw-02',
    code: 'HDW-002',
    name: 'Heavy Duty Sliding Glass Roller (Bearing Type)',
    category: 'hardware',
    categoryLabel: 'Hardware & Supplies',
    unit: 'pair',
    unitCost: 120,
    sellingPrice: 190,
    stockQuantity: 65,
    reorderLevel: 25,
    supplier: 'Mindanao Glass Depot',
    description: 'Smooth nylon/brass bearing roller for sliding window and screen door panels'
  },
  {
    id: 'prod-hdw-03',
    code: 'HDW-003',
    name: 'Hydraulic Soft-Close Concealed Hinges (Full Overlay)',
    category: 'hardware',
    categoryLabel: 'Hardware & Supplies',
    unit: 'pair',
    unitCost: 85,
    sellingPrice: 140,
    stockQuantity: 95,
    reorderLevel: 30,
    supplier: 'Digos Central Hardware',
    description: 'Soft-closing cabinet door hinges with clip-on mounting plate'
  },
  {
    id: 'prod-hdw-04',
    code: 'HDW-004',
    name: 'Welding Rods E6013 1/8" (Special Steel)',
    category: 'hardware',
    categoryLabel: 'Hardware & Supplies',
    unit: 'kilo',
    unitCost: 130,
    sellingPrice: 185,
    stockQuantity: 50,
    reorderLevel: 20,
    supplier: 'Digos Steel & Hardware Mart',
    description: 'Smooth arc, easy slag removal for mild steel fabrication and grills'
  },
  {
    id: 'prod-hdw-05',
    code: 'HDW-005',
    name: 'Blind Rivets 5/32" x 1/2" Aluminum',
    category: 'hardware',
    categoryLabel: 'Hardware & Supplies',
    unit: 'box (1000s)',
    unitCost: 280,
    sellingPrice: 420,
    stockQuantity: 14,
    reorderLevel: 10,
    supplier: 'Southern Steel Traders',
    description: 'Fasteners for aluminum frame assembly and screen mesh locking'
  },

  // =========================================================================
  // AUTHENTIC PRODUCTS & SERVICES FROM BILLBOARD
  // =========================================================================
  // 1. ROLL-UP SHUTTER DOORS
  {
    id: 'prod-sht-01',
    code: 'SHT-001',
    name: 'Roll-Up Shutter Door Galvanized Slats & Spring Barrel (Custom Size)',
    category: 'metal',
    categoryLabel: 'Metal & Steel',
    unit: 'sq meter',
    unitCost: 1800,
    sellingPrice: 2850,
    stockQuantity: 65,
    reorderLevel: 15,
    supplier: 'Rusell\'s Workshop Fabrication',
    description: 'Heavy gauge galvanized steel interlocking slats with safety guide rails for commercial shop fronts'
  },
  {
    id: 'prod-sht-02',
    code: 'SHT-002',
    name: 'Roll-Up Shutter Motor Operator with Manual Chain Block',
    category: 'hardware',
    categoryLabel: 'Hardware & Supplies',
    unit: 'set',
    unitCost: 8500,
    sellingPrice: 13500,
    stockQuantity: 12,
    reorderLevel: 4,
    supplier: 'Mindanao Industrial Controls',
    description: 'Electric remote motor with override manual chain block for power outage safety'
  },
  {
    id: 'prod-sht-03',
    code: 'SHT-003',
    name: 'Roll-Up Shutter Emergency Repair & Maintenance Service',
    category: 'hardware',
    categoryLabel: 'Hardware & Supplies',
    unit: 'service job',
    unitCost: 1200,
    sellingPrice: 2500,
    stockQuantity: 99,
    reorderLevel: 5,
    supplier: 'In-House Technicians',
    description: 'On-site slat realignment, spring rewinding, lubrication, and safety inspection in Digos'
  },

  // 2. AUTO GLASS & 3M TINT
  {
    id: 'prod-gls-06',
    code: 'GLS-006',
    name: 'Auto Glass Replacement (Curved Laminated Safety Windshield)',
    category: 'glass',
    categoryLabel: 'Glass Works',
    unit: 'unit',
    unitCost: 3200,
    sellingPrice: 5200,
    stockQuantity: 24,
    reorderLevel: 8,
    supplier: 'Mindanao Auto Glass Direct',
    description: 'Laminated curved safety automotive glass for pickups, SUVs, and commercial vehicles'
  },
  {
    id: 'prod-gls-07',
    code: 'GLS-007',
    name: '3M Auto & Architectural Sunscreen Window Tint (Charcoal / Magic)',
    category: 'glass',
    categoryLabel: 'Glass Works',
    unit: 'sq ft',
    unitCost: 85,
    sellingPrice: 165,
    stockQuantity: 500,
    reorderLevel: 100,
    supplier: '3M Philippines Authorized Distributor',
    description: '99% UV rejection solar film for automotive and residential glass installations'
  },

  // 3. SPECIALIZED PARTITIONS
  {
    id: 'prod-prt-01',
    code: 'PRT-001',
    name: 'Modular Office Workstation Partition System (Fabric & Glass)',
    category: 'metal',
    categoryLabel: 'Metal & Steel',
    unit: 'linear meter',
    unitCost: 2400,
    sellingPrice: 3800,
    stockQuantity: 32,
    reorderLevel: 10,
    supplier: 'Rusell\'s Workshop Digos',
    description: 'Aluminum raceway partition with acoustic acoustic acoustic fabric and glass vision panel'
  },
  {
    id: 'prod-prt-02',
    code: 'PRT-002',
    name: 'Commercial Toilet Partition (12mm Compact Phenolic Board + SS304)',
    category: 'wood',
    categoryLabel: 'Wood & Cabinets',
    unit: 'cubicle',
    unitCost: 6500,
    sellingPrice: 10500,
    stockQuantity: 15,
    reorderLevel: 5,
    supplier: 'Davao Phenolic Boards',
    description: '100% waterproof phenolic compact board with stainless steel gravity hinges and indicator latch'
  },
  {
    id: 'prod-prt-03',
    code: 'PRT-003',
    name: 'Operable Sliding Acoustic Partition Wall (Suspended Track)',
    category: 'wood',
    categoryLabel: 'Wood & Cabinets',
    unit: 'panel',
    unitCost: 7500,
    sellingPrice: 12800,
    stockQuantity: 10,
    reorderLevel: 3,
    supplier: 'Rusell\'s Workshop Digos',
    description: 'Sound-dampening movable partition wall for conference halls and multi-purpose rooms'
  },

  // 4. SOLID DOORS, JAMBS & MOLDINGS
  {
    id: 'prod-wod-05',
    code: 'WOD-005',
    name: 'Solid Wood Panel Door (Mahogany / Narra Grain Pattern)',
    category: 'wood',
    categoryLabel: 'Wood & Cabinets',
    unit: 'leaf',
    unitCost: 3200,
    sellingPrice: 5400,
    stockQuantity: 20,
    reorderLevel: 6,
    supplier: 'Tabor Lumber Compound',
    description: 'Kiln-dried solid hardwood panel door crafted in Tabor Lumber Compound, Digos City'
  },
  {
    id: 'prod-wod-06',
    code: 'WOD-006',
    name: 'Door & Window Wooden Jambs (2" x 5" Kiln-Dried Hardwood)',
    category: 'wood',
    categoryLabel: 'Wood & Cabinets',
    unit: 'set',
    unitCost: 1100,
    sellingPrice: 1850,
    stockQuantity: 45,
    reorderLevel: 15,
    supplier: 'Tabor Lumber Compound',
    description: 'Precision rabbeted kiln dried jambs ready for natural polyurethane or paint finish'
  },
  {
    id: 'prod-wod-07',
    code: 'WOD-007',
    name: 'Decorative Wooden Moldings & Baseboard Cornices (8ft length)',
    category: 'wood',
    categoryLabel: 'Wood & Cabinets',
    unit: 'length',
    unitCost: 180,
    sellingPrice: 320,
    stockQuantity: 120,
    reorderLevel: 30,
    supplier: 'Tabor Lumber Compound',
    description: 'Crown cornices and floor baseboards manufactured from selected local hardwood'
  },

  // 5. FIBER MAT & CHEMICALS
  {
    id: 'prod-chm-01',
    code: 'CHM-001',
    name: 'Fiberglass Chopped Strand Mat (Chopped Mat 300 / 450)',
    category: 'hardware',
    categoryLabel: 'Hardware & Supplies',
    unit: 'kilo',
    unitCost: 140,
    sellingPrice: 240,
    stockQuantity: 150,
    reorderLevel: 40,
    supplier: 'Mindanao Resin & Chemical Mart',
    description: 'High-strength fiber mat reinforcement for composites, waterproof basins and auto repair'
  },
  {
    id: 'prod-chm-02',
    code: 'CHM-002',
    name: 'Fiberglass Resin Pack (Premix Resin, Hardener MEKP & Styrene)',
    category: 'hardware',
    categoryLabel: 'Hardware & Supplies',
    unit: 'gallon set',
    unitCost: 950,
    sellingPrice: 1450,
    stockQuantity: 60,
    reorderLevel: 20,
    supplier: 'Mindanao Resin & Chemical Mart',
    description: 'Unsaturated polyester casting & laminating resin with curing catalyst and thinner'
  },

  // 6. STAINLESS STEEL FABRICATION
  {
    id: 'prod-mtl-06',
    code: 'MTL-006',
    name: 'Stainless Steel Gate & Fence with Stone Works (Custom)',
    category: 'metal',
    categoryLabel: 'Metal & Steel',
    unit: 'sq meter',
    unitCost: 3500,
    sellingPrice: 5800,
    stockQuantity: 25,
    reorderLevel: 5,
    supplier: 'Rusell\'s Stainless Fabrication',
    description: 'Rust-proof 304 stainless steel security gate accented with decorative stone cladding'
  },
  {
    id: 'prod-mtl-07',
    code: 'MTL-007',
    name: 'Stainless Steel Stair & Balcony Railings (SS304 Mirror Finish)',
    category: 'metal',
    categoryLabel: 'Metal & Steel',
    unit: 'linear meter',
    unitCost: 1800,
    sellingPrice: 3100,
    stockQuantity: 40,
    reorderLevel: 10,
    supplier: 'Rusell\'s Stainless Fabrication',
    description: '2" SS304 top tube with safety balusters and heavy-duty floor mounting flanges'
  },
  {
    id: 'prod-mtl-08',
    code: 'MTL-008',
    name: 'Window Casements, Security Grills & Sliding Door Grills',
    category: 'metal',
    categoryLabel: 'Metal & Steel',
    unit: 'sq ft',
    unitCost: 160,
    sellingPrice: 280,
    stockQuantity: 200,
    reorderLevel: 50,
    supplier: 'Rusell\'s Stainless Fabrication',
    description: 'Burglar-deterrent window casements and decorative wrought steel grills'
  },
  {
    id: 'prod-mtl-09',
    code: 'MTL-009',
    name: 'Structural Steel Roof Truss & C-Purlin Framework',
    category: 'metal',
    categoryLabel: 'Metal & Steel',
    unit: 'linear ft',
    unitCost: 280,
    sellingPrice: 460,
    stockQuantity: 180,
    reorderLevel: 40,
    supplier: 'Rusell\'s Metal Shop',
    description: 'Engineered roof trusses welded from heavy structural angle bars with anti-rust epoxy primer'
  },

  // 7. PVC, WALL & CEILINGS, FLOORING
  {
    id: 'prod-pvc-01',
    code: 'PVC-001',
    name: 'PVC Accordion Folding Partition Door (Heavy Duty)',
    category: 'wood',
    categoryLabel: 'Wood & Cabinets',
    unit: 'set',
    unitCost: 1950,
    sellingPrice: 3200,
    stockQuantity: 22,
    reorderLevel: 8,
    supplier: 'Davao Interior Supply',
    description: 'Flexible accordion partition door with smooth ceiling rollers and magnetic lock'
  },
  {
    id: 'prod-pvc-02',
    code: 'PVC-002',
    name: 'PVC Wall & Ceiling Fluted Cladding Panels (Wood Finish, 9.5ft)',
    category: 'wood',
    categoryLabel: 'Wood & Cabinets',
    unit: 'panel',
    unitCost: 220,
    sellingPrice: 380,
    stockQuantity: 180,
    reorderLevel: 50,
    supplier: 'Davao Interior Supply',
    description: 'Waterproof, termite-resistant 3D fluted panels for modern TV backdrops and ceilings'
  },
  {
    id: 'prod-pvc-03',
    code: 'PVC-003',
    name: 'Laminated Wood Flooring & Luxury Vinyl Wood Planks',
    category: 'wood',
    categoryLabel: 'Wood & Cabinets',
    unit: 'box (24 sq ft)',
    unitCost: 780,
    sellingPrice: 1250,
    stockQuantity: 75,
    reorderLevel: 25,
    supplier: 'Davao Interior Supply',
    description: 'Scratch-resistant click-lock flooring planks with natural wood grain texture'
  },

  // 8. BLINDS, SHADES, CARPET & WALLPAPER
  {
    id: 'prod-bld-01',
    code: 'BLD-001',
    name: 'Korean Combi Blinds (Vertical & Horizontal Dual Shade)',
    category: 'hardware',
    categoryLabel: 'Hardware & Supplies',
    unit: 'sq ft',
    unitCost: 120,
    sellingPrice: 210,
    stockQuantity: 350,
    reorderLevel: 80,
    supplier: 'Korean Blinds Direct',
    description: 'Premium light-control zebra combi blinds with powder coated aluminum headrail'
  },
  {
    id: 'prod-bld-02',
    code: 'BLD-002',
    name: 'Heavy-Duty Commercial Carpet Tiles & Carpet Rolls',
    category: 'hardware',
    categoryLabel: 'Hardware & Supplies',
    unit: 'box (5 sq m)',
    unitCost: 1600,
    sellingPrice: 2600,
    stockQuantity: 30,
    reorderLevel: 10,
    supplier: 'Davao Interior Supply',
    description: 'Rubber-backed commercial carpet tiles suitable for high traffic corporate offices'
  },
  {
    id: 'prod-bld-03',
    code: 'BLD-003',
    name: 'Textured Architectural Wallpaper & 3D Wall Coverings',
    category: 'hardware',
    categoryLabel: 'Hardware & Supplies',
    unit: 'roll (10m x 0.53m)',
    unitCost: 450,
    sellingPrice: 780,
    stockQuantity: 55,
    reorderLevel: 15,
    supplier: 'Davao Interior Supply',
    description: 'Washable heavy vinyl embossed wallpaper in contemporary European textures'
  }
];

// Seed Customers (Digos City, Davao del Sur)
const INITIAL_CUSTOMERS = [
  {
    id: 'cust-01',
    code: 'CUST-101',
    name: 'Engr. Roberto Villamor',
    phone: '0917-823-4512',
    address: 'Prk. Mahogany, Tres de Mayo, Digos City',
    customerType: 'Contractor',
    notes: 'General contractor for 2-storey residential villa project',
    totalSpent: 48500,
    createdAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 'cust-02',
    code: 'CUST-102',
    name: 'Atty. Cecilia M. Tan',
    phone: '0928-554-1920',
    address: 'San Jose Highway, Zone 1, Digos City',
    customerType: 'Homeowner',
    notes: 'Custom dining set and french glass sliding balcony door',
    totalSpent: 32000,
    createdAt: '2026-10-22T14:30:00Z'
  },
  {
    id: 'cust-03',
    code: 'CUST-103',
    name: 'Davao South Commercial Bakery',
    phone: '0945-667-8891',
    address: 'Rizal Avenue cor. Roxas Ext., Digos City',
    customerType: 'Commercial Business',
    notes: 'Glass display showcase counters and stainless bread storage racks',
    totalSpent: 64000,
    createdAt: '2026-11-01T10:15:00Z'
  },
  {
    id: 'cust-04',
    code: 'CUST-104',
    name: 'Mr. & Mrs. Danny Alcantara',
    phone: '0939-112-9043',
    address: 'Purok Mangga, Cogon, Digos City',
    customerType: 'Homeowner',
    notes: 'Full house window security grills and front gate repair',
    totalSpent: 26500,
    createdAt: '2026-11-05T11:00:00Z'
  },
  {
    id: 'cust-05',
    code: 'CUST-105',
    name: 'Sinawilan Christian Academy',
    phone: '0918-990-2345',
    address: 'Sinawilan, Digos City',
    customerType: 'Commercial Business',
    notes: 'Classroom aluminum awning windows and metal stair railings',
    totalSpent: 52000,
    createdAt: '2026-11-08T08:45:00Z'
  }
];

// Seed Job Orders & Sales
const INITIAL_ORDERS = [
  {
    id: 'ord-101',
    orderNo: 'ORD-2026-0041',
    jobOrderNo: 'JO-2026-0041',
    customerId: 'cust-01',
    customerName: 'Engr. Roberto Villamor',
    customerPhone: '0917-823-4512',
    deliveryAddress: 'Prk. Mahogany, Tres de Mayo, Digos City',
    orderType: 'Fabrication & Installation On-Site',
    tradeCategory: 'glass',
    orderDate: '2026-11-10T10:30:00',
    targetDate: '2026-11-18T17:00:00',
    assignedStaff: 'Arnel Mendoza & Team',
    items: [
      {
        id: 'item-1',
        title: 'Custom 2-Panel Sliding Glass Window (Analok)',
        specs: 'Width: 60" x Height: 48" (20 sq ft) | 6mm Bronze Glass | 798 Analok Frame',
        quantity: 4,
        unitPrice: 5200,
        subtotal: 20800
      },
      {
        id: 'item-2',
        title: 'Awning Top-Hung Toilet Window',
        specs: 'Width: 24" x Height: 24" (4 sq ft) | Frosted Glass with screen',
        quantity: 2,
        unitPrice: 2200,
        subtotal: 4400
      }
    ],
    materialsAllocated: [
      { name: '6mm Bronze Tinted Glass', qty: '88 sq ft' },
      { name: '798 Series Analok Frame', qty: '8 lengths' },
      { name: 'Bostik Neutral Silicone', qty: '4 tubes' },
      { name: 'Sliding Rollers', qty: '8 pairs' }
    ],
    subtotal: 25200,
    laborInstallationFee: 3500,
    deliveryFee: 800,
    discount: 500,
    totalAmount: 29000,
    downpayment: 15000,
    balanceDue: 14000,
    paymentStatus: 'Partial / Downpayment Paid',
    jobStatus: 'in_fabrication', // queued, in_fabrication, quality_check, ready_dispatch, installed_delivered, completed
    progressPercent: 55,
    notes: 'Framing done. Glass cutting completed. Assembly of sliding sashes ongoing.',
    payments: [
      {
        id: 'pay-001',
        receiptNo: 'OR-2026-0198',
        amount: 15000,
        method: 'Cash',
        referenceNo: 'CASH-REC-198',
        date: '2026-11-10T11:00:00',
        receivedBy: 'Maria Santos (Sales)',
        notes: '50% initial downpayment prior to fabrication'
      }
    ]
  },
  {
    id: 'ord-102',
    orderNo: 'ORD-2026-0042',
    jobOrderNo: 'JO-2026-0042',
    customerId: 'cust-02',
    customerName: 'Atty. Cecilia M. Tan',
    customerPhone: '0928-554-1920',
    deliveryAddress: 'San Jose Highway, Zone 1, Digos City',
    orderType: 'Fabrication & Installation On-Site',
    tradeCategory: 'wood',
    orderDate: '2026-11-08T14:00:00',
    targetDate: '2026-11-16T15:00:00',
    assignedStaff: 'Boyet Woodcraft',
    items: [
      {
        id: 'item-3',
        title: 'Custom Modular Kitchen Overhead Cabinets',
        specs: 'Length: 10ft x Height: 30" | 3/4" Marine Plywood with Duco Finish & Hydraulic Hinges',
        quantity: 1,
        unitPrice: 22000,
        subtotal: 22000
      }
    ],
    materialsAllocated: [
      { name: '3/4" Marine Plywood', qty: '3 sheets' },
      { name: 'Concealed Soft-Close Hinges', qty: '12 pairs' },
      { name: 'Marine Epoxy & Putty', qty: '1 set' }
    ],
    subtotal: 22000,
    laborInstallationFee: 4000,
    deliveryFee: 600,
    discount: 0,
    totalAmount: 26600,
    downpayment: 13300,
    balanceDue: 0,
    paymentStatus: 'Fully Paid',
    jobStatus: 'installed_delivered',
    progressPercent: 95,
    notes: 'Cabinets installed. Client inspected. Final balance received. Touch-up coat drying.',
    payments: [
      {
        id: 'pay-002',
        receiptNo: 'OR-2026-0185',
        amount: 13300,
        method: 'GCash',
        referenceNo: 'GCASH-9823149021',
        date: '2026-11-08T14:30:00',
        receivedBy: 'Maria Santos (Sales)',
        notes: 'Downpayment 50%'
      },
      {
        id: 'pay-003',
        receiptNo: 'OR-2026-0205',
        amount: 13300,
        method: 'GCash',
        referenceNo: 'GCASH-9912048572',
        date: '2026-11-13T11:20:00',
        receivedBy: 'Russel T. (Owner)',
        notes: 'Final balance upon installation completion'
      }
    ]
  },
  {
    id: 'ord-103',
    orderNo: 'ORD-2026-0043',
    jobOrderNo: 'JO-2026-0043',
    customerId: 'cust-04',
    customerName: 'Mr. & Mrs. Danny Alcantara',
    customerPhone: '0939-112-9043',
    deliveryAddress: 'Purok Mangga, Cogon, Digos City',
    orderType: 'Fabrication & Installation On-Site',
    tradeCategory: 'metal',
    orderDate: '2026-11-12T09:15:00',
    targetDate: '2026-11-20T16:00:00',
    assignedStaff: 'Kiko Welder & Fabrication Team',
    items: [
      {
        id: 'item-4',
        title: 'Modern Geometric Window Security Grills',
        specs: '1"x1" Tubular Steel Outer Frame with 12mm Square Bars | Epoxy Primer & Matte Black Finish',
        quantity: 6,
        unitPrice: 2800,
        subtotal: 16800
      }
    ],
    materialsAllocated: [
      { name: 'Tubular Steel 1x1x1.5mm', qty: '6 lengths' },
      { name: 'Welding Rods E6013', qty: '4 kilos' },
      { name: 'Angle Bar 1-1/2"', qty: '2 lengths' }
    ],
    subtotal: 16800,
    laborInstallationFee: 3200,
    deliveryFee: 500,
    discount: 0,
    totalAmount: 20500,
    downpayment: 10000,
    balanceDue: 10500,
    paymentStatus: 'Partial / Downpayment Paid',
    jobStatus: 'queued',
    progressPercent: 15,
    notes: 'Material cut list prepared. Steel bars staged at welding bench.',
    payments: [
      {
        id: 'pay-004',
        receiptNo: 'OR-2026-0210',
        amount: 10000,
        method: 'Cash',
        referenceNo: 'CASH-REC-210',
        date: '2026-11-12T09:40:00',
        receivedBy: 'Maria Santos (Sales)',
        notes: 'Initial fabrication deposit'
      }
    ]
  },
  {
    id: 'ord-104',
    orderNo: 'ORD-2026-0044',
    jobOrderNo: 'JO-2026-0044',
    customerId: 'cust-03',
    customerName: 'Davao South Commercial Bakery',
    customerPhone: '0945-667-8891',
    deliveryAddress: 'Rizal Avenue cor. Roxas Ext., Digos City',
    orderType: 'Over-The-Counter Sale',
    tradeCategory: 'hardware',
    orderDate: '2026-11-13T09:00:00',
    targetDate: '2026-11-13T10:00:00',
    assignedStaff: 'Direct Counter Pick-up',
    items: [
      {
        id: 'item-5',
        title: 'Bostik Neutral Silicone Sealant Clear',
        specs: 'Tube 300ml',
        quantity: 6,
        unitPrice: 220,
        subtotal: 1320
      },
      {
        id: 'item-6',
        title: 'Glass Jalousie / Louver Blades 4" x 24"',
        specs: 'Box of 20 Frosted Blades',
        quantity: 2,
        unitPrice: 650,
        subtotal: 1300
      }
    ],
    materialsAllocated: [],
    subtotal: 2620,
    laborInstallationFee: 0,
    deliveryFee: 0,
    discount: 120,
    totalAmount: 2500,
    downpayment: 2500,
    balanceDue: 0,
    paymentStatus: 'Fully Paid',
    jobStatus: 'completed',
    progressPercent: 100,
    notes: 'Over-the-counter supply purchase. Paid and taken immediately.',
    payments: [
      {
        id: 'pay-005',
        receiptNo: 'OR-2026-0218',
        amount: 2500,
        method: 'Cash',
        referenceNo: 'POS-CASH-0218',
        date: '2026-11-13T09:05:00',
        receivedBy: 'Maria Santos (Sales)',
        notes: 'Walk-in cash counter sale'
      }
    ]
  }
];

// Seed Quotations
const INITIAL_QUOTATIONS = [
  {
    id: 'quot-01',
    quotationNo: 'QT-2026-018',
    customerId: 'cust-05',
    customerName: 'Sinawilan Christian Academy',
    customerPhone: '0918-990-2345',
    deliveryAddress: 'Sinawilan, Digos City',
    date: '2026-11-11',
    validUntil: '2026-11-26',
    status: 'Pending Approval',
    projectTitle: 'Senior High Building Stair Railing & 6 Awning Windows',
    tradeCategory: 'metal',
    items: [
      {
        title: 'Tubular Steel Stair Handrail with Decorative Balusters',
        specs: 'Length: 45 linear feet | 2"x2" Top Rail, 1"x1" Vertical Balusters with Primer and Silver Finish',
        quantity: 1,
        unitPrice: 31500,
        subtotal: 31500
      },
      {
        title: 'Aluminum Casement / Awning Windows 798 White',
        specs: 'Width: 36" x Height: 48" | 6mm Clear Glass | Stainless Heavy Friction Hinges',
        quantity: 6,
        unitPrice: 4800,
        subtotal: 28800
      }
    ],
    subtotal: 60300,
    installationFee: 7500,
    deliveryFee: 1200,
    totalAmount: 69000,
    notes: 'Quotation includes on-site welding, safety anchoring, and 6-month fabrication warranty.',
    preparedBy: 'Russel T. (Proprietor)'
  }
];

// Seed Settings & Workshop Configuration
const INITIAL_SETTINGS = {
  shopName: "RUSELL'S GLASS, WOODS & METALS",
  tagline: '"You NAME it, we BUILD it"',
  address: "Tabor Lumber Compound, Roxas Ext., Barangay Zone III, Digos City",
  phone: "CP # 0921-371-0555 (RUSELL) • 0929-590-2201 (IRIS) • 09053602201 (OFFICE)",
  email: "irisjunetaborbajura@gmail.com",
  facebook: "rusell's glass woods metals",
  owner: "Russel T. (Proprietor)",
  systemTitle: "Workshop Point of Sale & Fabrication Management",
  taxRate: 0,
  currency: 'PHP',
  currencySymbol: '₱',
  fabricationRates: {
    glassSqFtLabor: 45,
    woodLinearFtLabor: 180,
    metalGrillSqFtLabor: 65,
    rollupShutterLabor: 350,
    standardDigosDelivery: 500
  }
};

// Seed Authorized Suppliers (Supplying Glass, Wood, Metals & Hardware)
const INITIAL_SUPPLIERS = [
  {
    id: 'sup-01',
    code: 'SUP-001',
    name: 'Mindanao Glass & Aluminum Depot',
    contactPerson: 'Mr. Dennis Go',
    phone: '0917-701-4452 / (082) 221-8900',
    address: 'Monteverde Ave., Davao City (Delivery to Digos)',
    category: 'Glass & Aluminum Profile',
    leadTime: '1 - 2 Days',
    rating: '5.0 ⭐ Preferred',
    itemsSupplied: 'Clear Float, Bronze Glass, 798/900 Aluminum Series, Mirror Backing'
  },
  {
    id: 'sup-02',
    code: 'SUP-002',
    name: 'Tabor Lumber Compound & Hardwood Supply',
    contactPerson: 'Iris June Tabor',
    phone: '0929-590-2201 / 09053602201',
    address: 'Roxas Ext., Brgy. Zone III, Digos City',
    category: 'Wood, Jambs & Moldings',
    leadTime: 'Immediate (On-Site Yard)',
    rating: '5.0 ⭐ Direct Yard',
    itemsSupplied: 'Kiln-Dried Hardwood, 2x5 Jambs, Solid Panel Doors, Wooden Moldings'
  },
  {
    id: 'sup-03',
    code: 'SUP-003',
    name: 'Digos Steel & Industrial Hardware Mart',
    contactPerson: 'Engr. Nelson Sy',
    phone: '0922-814-9912 / (082) 553-2011',
    address: 'Rizal Avenue cor. Lapu-Lapu St., Digos City',
    category: 'Metal & Welding Materials',
    leadTime: 'Same Day',
    rating: '4.8 ⭐',
    itemsSupplied: 'Tubular Steel, Angle Bars, Welding Rods E6013, C-Purlins, Slats'
  },
  {
    id: 'sup-04',
    code: 'SUP-004',
    name: 'Apex Tempered Glass Corp. Mindanao',
    contactPerson: 'Ms. Grace Tan',
    phone: '0918-933-7721',
    address: 'Sasa Industrial Park, Davao City',
    category: 'Safety Tempered Glass',
    leadTime: '3 - 5 Days',
    rating: '4.9 ⭐ Certified Safety',
    itemsSupplied: '10mm & 12mm Frameless Tempered Glass, Shower Enclosure Panels'
  },
  {
    id: 'sup-05',
    code: 'SUP-005',
    name: '3M Philippines Architectural & Auto Films',
    contactPerson: 'Reggie Bautista',
    phone: '0945-312-8809',
    address: 'Bajada, Davao City',
    category: 'Auto Glass Tint & UV Films',
    leadTime: '2 Days',
    rating: '5.0 ⭐ Authentic 3M',
    itemsSupplied: '3M Charcoal Tint, Magic Tint, High-Heat Rejection UV Window Films'
  },
  {
    id: 'sup-06',
    code: 'SUP-006',
    name: 'Davao Interior & Board Supply',
    contactPerson: 'Kelvin Lim',
    phone: '0928-445-1234',
    address: 'Agdao, Davao City',
    category: 'PVC, Partitions & Blinds',
    leadTime: '2 Days',
    rating: '4.7 ⭐',
    itemsSupplied: 'PVC Fluted Wall/Ceilings, Accordion Folding Doors, Combi Blinds'
  },
  {
    id: 'sup-07',
    code: 'SUP-007',
    name: 'Mindanao Resin & Chemical Mart',
    contactPerson: 'Arthur Valencia',
    phone: '0939-901-2388',
    address: 'Toril, Davao City',
    category: 'Fiberglass Composites',
    leadTime: '1 - 2 Days',
    rating: '4.8 ⭐',
    itemsSupplied: 'Chopped Strand Mat 300/450, Premix Resin, MEKP Hardener, Styrene'
  }
];

// Database Management Class
class WorkshopDB {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(DB_KEYS.PRODUCTS)) {
      this.save(DB_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (!localStorage.getItem(DB_KEYS.CUSTOMERS)) {
      this.save(DB_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    }
    if (!localStorage.getItem(DB_KEYS.ORDERS)) {
      this.save(DB_KEYS.ORDERS, INITIAL_ORDERS);
    }
    if (!localStorage.getItem(DB_KEYS.QUOTATIONS)) {
      this.save(DB_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
    }
    if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
      this.save(DB_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(DB_KEYS.SUPPLIERS)) {
      this.save(DB_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    }
    if (!localStorage.getItem(DB_KEYS.PURCHASE_ORDERS)) {
      this.save(DB_KEYS.PURCHASE_ORDERS, INITIAL_PURCHASE_ORDERS);
    }
    if (!localStorage.getItem(DB_KEYS.WARRANTY)) {
      this.save(DB_KEYS.WARRANTY, INITIAL_WARRANTY_RECORDS);
    }
    if (!localStorage.getItem(DB_KEYS.INVOICES)) {
      this.save(DB_KEYS.INVOICES, INITIAL_INVOICES);
    }
    if (!localStorage.getItem(DB_KEYS.AUDIT)) {
      this.save(DB_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
    }
  }

  getSuppliers() {
    const sup = this.get(DB_KEYS.SUPPLIERS);
    return (sup && sup.length > 0) ? sup : INITIAL_SUPPLIERS;
  }

  saveSupplier(supplier) {
    const list = this.getSuppliers();
    if (supplier.id) {
      const idx = list.findIndex(s => s.id === supplier.id);
      if (idx !== -1) list[idx] = supplier;
      else list.push(supplier);
    } else {
      supplier.id = 'sup-' + Date.now();
      supplier.code = 'SUP-00' + (list.length + 1);
      list.push(supplier);
    }
    this.save(DB_KEYS.SUPPLIERS, list);
    return supplier;
  }

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading key:', key, e);
      return [];
    }
  }

  save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // PRODUCTS & INVENTORY
  getProducts() {
    return this.get(DB_KEYS.PRODUCTS);
  }

  saveProduct(product) {
    const products = this.getProducts();
    if (product.id) {
      const index = products.findIndex(p => p.id === product.id);
      if (index !== -1) {
        products[index] = { ...products[index], ...product };
      } else {
        products.push(product);
      }
    } else {
      product.id = 'prod-' + Date.now();
      products.push(product);
    }
    this.save(DB_KEYS.PRODUCTS, products);
    return product;
  }

  updateStock(productId, delta) {
    const products = this.getProducts();
    const item = products.find(p => p.id === productId);
    if (item) {
      item.stockQuantity = Math.max(0, (item.stockQuantity || 0) + delta);
      this.save(DB_KEYS.PRODUCTS, products);
      return item;
    }
    return null;
  }

  // CUSTOMERS
  getCustomers() {
    return this.get(DB_KEYS.CUSTOMERS);
  }

  saveCustomer(cust) {
    const customers = this.getCustomers();
    if (cust.id) {
      const idx = customers.findIndex(c => c.id === cust.id);
      if (idx !== -1) {
        customers[idx] = { ...customers[idx], ...cust };
      } else {
        customers.push(cust);
      }
    } else {
      cust.id = 'cust-' + Date.now();
      cust.code = 'CUST-' + (customers.length + 101);
      cust.totalSpent = cust.totalSpent || 0;
      cust.createdAt = new Date().toISOString();
      customers.push(cust);
    }
    this.save(DB_KEYS.CUSTOMERS, customers);
    return cust;
  }

  // ORDERS & JOB ORDERS
  getOrders() {
    return this.get(DB_KEYS.ORDERS);
  }

  getOrder(id) {
    return this.getOrders().find(o => o.id === id || o.orderNo === id || o.jobOrderNo === id);
  }

  saveOrder(order) {
    const orders = this.getOrders();
    if (order.id) {
      const idx = orders.findIndex(o => o.id === order.id);
      if (idx !== -1) {
        orders[idx] = { ...orders[idx], ...order, updatedAt: new Date().toISOString() };
      } else {
        orders.push(order);
      }
    } else {
      order.id = 'ord-' + Date.now();
      const count = orders.length + 45;
      order.orderNo = order.orderNo || `ORD-2026-00${count}`;
      order.jobOrderNo = order.jobOrderNo || `JO-2026-00${count}`;
      order.createdAt = new Date().toISOString();
      orders.unshift(order);
    }
    this.save(DB_KEYS.ORDERS, orders);
    return order;
  }

  updateOrder(id, order) {
    if (id && !order.id) order.id = id;
    return this.saveOrder(order);
  }

  updateJobStatus(orderId, newStatus, newPercent, note) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.jobStatus = newStatus;
      if (newPercent !== undefined) order.progressPercent = newPercent;
      if (note) order.notes = note;
      order.updatedAt = new Date().toISOString();
      this.save(DB_KEYS.ORDERS, orders);
      return order;
    }
    return null;
  }

  addOrderPayment(orderId, paymentData) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    if (!order.payments) order.payments = [];
    
    const payment = {
      id: 'pay-' + Date.now(),
      receiptNo: paymentData.receiptNo || 'OR-' + Math.floor(100000 + Math.random() * 900000),
      amount: parseFloat(paymentData.amount) || 0,
      method: paymentData.method || 'Cash',
      referenceNo: paymentData.referenceNo || 'REF-' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      receivedBy: paymentData.receivedBy || 'Staff',
      notes: paymentData.notes || ''
    };

    order.payments.push(payment);

    // Recalculate totals
    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    order.downpayment = totalPaid;
    order.balanceDue = Math.max(0, order.totalAmount - totalPaid);

    if (order.balanceDue <= 0) {
      order.paymentStatus = 'Fully Paid';
    } else if (totalPaid > 0) {
      order.paymentStatus = 'Partial / Downpayment Paid';
    } else {
      order.paymentStatus = 'Pending Payment';
    }

    this.save(DB_KEYS.ORDERS, orders);
    return { order, payment };
  }

  // QUOTATIONS
  getQuotations() {
    return this.get(DB_KEYS.QUOTATIONS);
  }

  saveQuotation(quot) {
    const quots = this.getQuotations();
    if (quot.id) {
      const idx = quots.findIndex(q => q.id === quot.id);
      if (idx !== -1) {
        quots[idx] = { ...quots[idx], ...quot };
      } else {
        quots.push(quot);
      }
    } else {
      quot.id = 'quot-' + Date.now();
      quot.quotationNo = quot.quotationNo || `QT-2026-0${quots.length + 20}`;
      quot.createdAt = new Date().toISOString();
      quots.unshift(quot);
    }
    this.save(DB_KEYS.QUOTATIONS, quots);
    return quot;
  }

  convertQuotationToOrder(quotId, downpaymentAmount, paymentMethod, receivedBy) {
    const quots = this.getQuotations();
    const quot = quots.find(q => q.id === quotId);
    if (!quot) return null;

    quot.status = 'Converted to Order';
    this.save(DB_KEYS.QUOTATIONS, quots);

    const newOrder = {
      customerId: quot.customerId,
      customerName: quot.customerName,
      customerPhone: quot.customerPhone,
      deliveryAddress: quot.deliveryAddress,
      orderType: 'Fabrication & Installation On-Site',
      tradeCategory: quot.tradeCategory || 'glass',
      orderDate: new Date().toISOString(),
      targetDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      assignedStaff: 'Unassigned (Queued)',
      items: quot.items || [],
      materialsAllocated: [],
      subtotal: quot.subtotal,
      laborInstallationFee: quot.installationFee || 0,
      deliveryFee: quot.deliveryFee || 0,
      discount: 0,
      totalAmount: quot.totalAmount,
      downpayment: 0,
      balanceDue: quot.totalAmount,
      paymentStatus: 'Pending Payment',
      jobStatus: 'queued',
      progressPercent: 10,
      notes: `Converted from Quotation ${quot.quotationNo}. ${quot.notes || ''}`,
      payments: []
    };

    const savedOrder = this.saveOrder(newOrder);

    if (downpaymentAmount && downpaymentAmount > 0) {
      this.addOrderPayment(savedOrder.id, {
        amount: downpaymentAmount,
        method: paymentMethod || 'Cash',
        receivedBy: receivedBy || 'Staff',
        notes: `Initial downpayment upon converting Quotation ${quot.quotationNo}`
      });
    }

    return savedOrder;
  }

  // SETTINGS
  getSettings() {
    return this.get(DB_KEYS.SETTINGS) || INITIAL_SETTINGS;
  }

  saveSettings(settings) {
    this.save(DB_KEYS.SETTINGS, settings);
  }

  // PURCHASE ORDERS (Supplier Orders)
  getPurchaseOrders() {
    const list = this.get(DB_KEYS.PURCHASE_ORDERS);
    return (list && list.length > 0) ? list : INITIAL_PURCHASE_ORDERS;
  }

  savePurchaseOrder(po) {
    const list = this.getPurchaseOrders();
    if (po.id) {
      const idx = list.findIndex(p => p.id === po.id);
      if (idx !== -1) list[idx] = po;
      else list.push(po);
    } else {
      po.id = 'po-' + Date.now();
      po.poNo = 'PO-2026-0' + (100 + list.length + 1);
      list.unshift(po);
    }
    this.save(DB_KEYS.PURCHASE_ORDERS, list);
    return po;
  }

  // WARRANTY & INSTALLATION CERTIFICATES
  getWarrantyRecords() {
    const list = this.get(DB_KEYS.WARRANTY);
    return (list && list.length > 0) ? list : INITIAL_WARRANTY_RECORDS;
  }

  saveWarrantyRecord(rec) {
    const list = this.getWarrantyRecords();
    if (rec.id) {
      const idx = list.findIndex(w => w.id === rec.id);
      if (idx !== -1) list[idx] = rec;
      else list.push(rec);
    } else {
      rec.id = 'war-' + Date.now();
      rec.certNo = 'WC-2026-00' + (80 + list.length + 1);
      list.unshift(rec);
    }
    this.save(DB_KEYS.WARRANTY, list);
    return rec;
  }

  // INVOICES & BILLING
  getInvoices() {
    const list = this.get(DB_KEYS.INVOICES);
    return (list && list.length > 0) ? list : INITIAL_INVOICES;
  }

  saveInvoice(inv) {
    const list = this.getInvoices();
    if (inv.id) {
      const idx = list.findIndex(i => i.id === inv.id);
      if (idx !== -1) list[idx] = inv;
      else list.push(inv);
    } else {
      inv.id = 'inv-' + Date.now();
      inv.invoiceNo = 'INV-2026-0' + (200 + list.length + 1);
      list.unshift(inv);
    }
    this.save(DB_KEYS.INVOICES, list);
    return inv;
  }

  // AUDIT TRAIL LOGS
  getAuditLogs() {
    const list = this.get(DB_KEYS.AUDIT);
    return (list && list.length > 0) ? list : INITIAL_AUDIT_LOGS;
  }

  addAuditLog(entry) {
    const list = this.getAuditLogs();
    const logItem = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toLocaleString(),
      user: entry.user || 'system',
      role: entry.role || 'Staff',
      action: entry.action || 'TRANSACTION',
      module: entry.module || 'General',
      details: entry.details || '',
      ip: entry.ip || '127.0.0.1'
    };
    list.unshift(logItem);
    this.save(DB_KEYS.AUDIT, list);
    return logItem;
  }

  // Reset to initial demo database
  resetDatabase() {
    this.save(DB_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.save(DB_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    this.save(DB_KEYS.ORDERS, INITIAL_ORDERS);
    this.save(DB_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
    this.save(DB_KEYS.SETTINGS, INITIAL_SETTINGS);
    this.save(DB_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    this.save(DB_KEYS.PURCHASE_ORDERS, INITIAL_PURCHASE_ORDERS);
    this.save(DB_KEYS.WARRANTY, INITIAL_WARRANTY_RECORDS);
    this.save(DB_KEYS.INVOICES, INITIAL_INVOICES);
    this.save(DB_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
    return true;
  }
}

// Global instance
window.db = new WorkshopDB();
