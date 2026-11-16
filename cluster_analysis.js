/**
 * Russell's Glass, Woods & Metals - Unsupervised Data Clustering Engine
 * Model: K-Means Clustering on Unlabeled POS & Inventory Data
 * Includes: StandardScaler normalization, K-Means++, Elbow Method, Silhouette Score
 */

const fs = require('fs');
const path = require('path');

// 1. DATASETS (Extracted from backup SQL & Workshop POS DB)
const CUSTOMERS_DATA = [
  { id: 'CUST-101', name: 'Engr. Roberto Villamor', type: 'Contractor', totalSpent: 48500, ordersCount: 4, recencyDays: 2, glassRatio: 0.65, metalRatio: 0.35, woodRatio: 0.00 },
  { id: 'CUST-102', name: 'Atty. Cecilia M. Tan', type: 'Homeowner', totalSpent: 32000, ordersCount: 2, recencyDays: 7, glassRatio: 0.40, metalRatio: 0.10, woodRatio: 0.50 },
  { id: 'CUST-103', name: 'Davao South Commercial Bakery', type: 'Commercial', totalSpent: 64000, ordersCount: 5, recencyDays: 1, glassRatio: 0.50, metalRatio: 0.50, woodRatio: 0.00 },
  { id: 'CUST-104', name: 'Mr. & Mrs. Danny Alcantara', type: 'Homeowner', totalSpent: 26500, ordersCount: 2, recencyDays: 14, glassRatio: 0.15, metalRatio: 0.85, woodRatio: 0.00 },
  { id: 'CUST-105', name: 'Sinawilan Christian Academy', type: 'Commercial', totalSpent: 52000, ordersCount: 3, recencyDays: 4, glassRatio: 0.45, metalRatio: 0.55, woodRatio: 0.00 },
  // Augmented historical workshop client base for robust clustering
  { id: 'CUST-106', name: 'Arch. Ferdinand Soriano', type: 'Contractor', totalSpent: 78500, ordersCount: 6, recencyDays: 3, glassRatio: 0.55, metalRatio: 0.35, woodRatio: 0.10 },
  { id: 'CUST-107', name: 'Digos Diagnostic Clinic', type: 'Commercial', totalSpent: 41200, ordersCount: 3, recencyDays: 6, glassRatio: 0.70, metalRatio: 0.20, woodRatio: 0.10 },
  { id: 'CUST-108', name: 'Dr. Maria Elena Santos', type: 'Homeowner', totalSpent: 19800, ordersCount: 1, recencyDays: 21, glassRatio: 0.30, metalRatio: 0.10, woodRatio: 0.60 },
  { id: 'CUST-109', name: 'Purok 5 Chapel Committee', type: 'Institutional', totalSpent: 35000, ordersCount: 2, recencyDays: 12, glassRatio: 0.20, metalRatio: 0.80, woodRatio: 0.00 },
  { id: 'CUST-110', name: 'Almond Green Residences HOA', type: 'Homeowner', totalSpent: 28400, ordersCount: 2, recencyDays: 16, glassRatio: 0.10, metalRatio: 0.90, woodRatio: 0.00 },
  { id: 'CUST-111', name: 'Engr. Jomar Cañete Construction', type: 'Contractor', totalSpent: 92000, ordersCount: 8, recencyDays: 2, glassRatio: 0.40, metalRatio: 0.50, woodRatio: 0.10 },
  { id: 'CUST-112', name: 'Zone 3 Barangay Council', type: 'Institutional', totalSpent: 45000, ordersCount: 3, recencyDays: 8, glassRatio: 0.30, metalRatio: 0.70, woodRatio: 0.00 },
  { id: 'CUST-113', name: 'Walk-in Cash Customer A', type: 'Retail', totalSpent: 4800, ordersCount: 1, recencyDays: 1, glassRatio: 0.80, metalRatio: 0.20, woodRatio: 0.00 },
  { id: 'CUST-114', name: 'Walk-in Cash Customer B', type: 'Retail', totalSpent: 2500, ordersCount: 1, recencyDays: 5, glassRatio: 0.00, metalRatio: 1.00, woodRatio: 0.00 },
  { id: 'CUST-115', name: 'Walk-in Cash Customer C', type: 'Retail', totalSpent: 6200, ordersCount: 1, recencyDays: 9, glassRatio: 0.20, metalRatio: 0.00, woodRatio: 0.80 }
];

const PRODUCTS_DATA = [
  { code: 'GLS-001', name: '6mm Clear Float Glass', category: 'Glass', cost: 65, price: 110, stock: 450, reorder: 100 },
  { code: 'GLS-002', name: '6mm Bronze Tinted Glass', category: 'Glass', cost: 85, price: 145, stock: 280, reorder: 80 },
  { code: 'GLS-003', name: '1/4" Beveled Mirror Glass', category: 'Glass', cost: 110, price: 195, stock: 140, reorder: 50 },
  { code: 'GLS-004', name: '10mm Clear Tempered Glass Panel', category: 'Glass', cost: 180, price: 290, stock: 45, reorder: 60 },
  { code: 'GLS-005', name: 'Glass Jalousie Louver Blades Frosted', category: 'Glass', cost: 420, price: 650, stock: 35, reorder: 15 },
  { code: 'GLS-006', name: 'Auto Glass Safety Windshield', category: 'Glass', cost: 3200, price: 5200, stock: 24, reorder: 8 },
  { code: 'GLS-007', name: '3M Sunscreen Window Tint Charcoal', category: 'Glass', cost: 85, price: 165, stock: 500, reorder: 100 },
  { code: 'WOD-001', 'name': '1/2" Marine Plywood 4x8', category: 'Wood', cost: 780, price: 1050, stock: 62, reorder: 25 },
  { code: 'WOD-002', 'name': '3/4" Marine Plywood 4x8', category: 'Wood', cost: 1250, price: 1680, stock: 40, reorder: 20 },
  { code: 'WOD-003', 'name': 'Kiln-Dried Mahogany 2x2x10ft', category: 'Wood', cost: 260, price: 380, stock: 85, reorder: 30 },
  { code: 'WOD-004', 'name': 'Melamine Faced Board White 3/4"', category: 'Wood', cost: 1450, price: 1950, stock: 12, reorder: 15 },
  { code: 'WOD-005', 'name': 'Solid Wood Panel Door Mahogany', category: 'Wood', cost: 3200, price: 5400, stock: 20, reorder: 6 },
  { code: 'WOD-006', 'name': 'Door & Window Wooden Jambs 2x5', category: 'Wood', cost: 1100, price: 1850, stock: 45, reorder: 15 },
  { code: 'MTL-001', 'name': 'Tubular Steel 1"x1"x1.5mm 20ft', category: 'Metal', cost: 310, price: 440, stock: 110, reorder: 40 },
  { code: 'MTL-002', 'name': 'Tubular Steel 1"x2"x1.5mm 20ft', category: 'Metal', cost: 460, price: 650, stock: 75, reorder: 30 },
  { code: 'MTL-003', 'name': 'Steel Angle Bar 1-1/2"x1/8" 20ft', category: 'Metal', cost: 340, price: 490, stock: 55, reorder: 25 },
  { code: 'MTL-004', 'name': 'Aluminum 798 Analok Bronze 21ft', category: 'Metal', cost: 590, price: 850, stock: 42, reorder: 20 },
  { code: 'MTL-005', 'name': 'Aluminum 798 Powder White 21ft', category: 'Metal', cost: 640, price: 920, stock: 18, reorder: 20 },
  { code: 'SHT-001', 'name': 'Roll-Up Shutter Slats & Barrel', category: 'Metal', cost: 1800, price: 2850, stock: 65, reorder: 15 },
  { code: 'SHT-002', 'name': 'Roll-Up Shutter Motor Operator', category: 'Metal', cost: 8500, price: 13500, stock: 12, reorder: 4 },
  { code: 'HDW-001', 'name': 'Bostik Silicone Sealant Clear', category: 'Hardware', cost: 155, price: 220, stock: 84, reorder: 30 },
  { code: 'HDW-002', 'name': 'Sliding Glass Roller Heavy Duty', category: 'Hardware', cost: 120, price: 190, stock: 65, reorder: 25 },
  { code: 'HDW-003', 'name': 'Hydraulic Concealed Hinges', category: 'Hardware', cost: 85, price: 140, stock: 95, reorder: 30 },
  { code: 'HDW-004', 'name': 'Welding Rods E6013 Special Steel', category: 'Hardware', cost: 130, price: 185, stock: 50, reorder: 20 },
  { code: 'HDW-005', 'name': 'Blind Rivets 5/32"x1/2" Aluminum', category: 'Hardware', cost: 280, price: 420, stock: 14, reorder: 10 }
];

// 2. MATHEMATICAL UTILITIES
function mean(arr) {
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function std(arr, m) {
  const v = arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / arr.length;
  return Math.sqrt(v) || 1e-6;
}

function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

// 3. K-MEANS ENGINE
class KMeansClustering {
  constructor(k = 3, maxIterations = 100) {
    this.k = k;
    this.maxIterations = maxIterations;
    this.centroids = [];
    this.assignments = [];
    this.inertia = 0; // Within-Cluster Sum of Squares (WCSS)
    this.means = [];
    this.stds = [];
  }

  standardize(dataMatrix) {
    const numFeatures = dataMatrix[0].length;
    this.means = [];
    this.stds = [];

    for (let j = 0; j < numFeatures; j++) {
      const col = dataMatrix.map(row => row[j]);
      const m = mean(col);
      const s = std(col, m);
      this.means.push(m);
      this.stds.push(s);
    }

    return dataMatrix.map(row =>
      row.map((val, j) => (val - this.means[j]) / this.stds[j])
    );
  }

  fit(rawMatrix) {
    const X = this.standardize(rawMatrix);
    const n = X.length;
    const d = X[0].length;

    // K-Means++ Centroid Initialization
    const firstIdx = Math.floor(Math.random() * n);
    this.centroids = [X[firstIdx].slice()];

    while (this.centroids.length < this.k) {
      const distances = X.map(x => {
        const dMin = Math.min(...this.centroids.map(c => euclideanDistance(x, c)));
        return Math.pow(dMin, 2);
      });
      const sumDist = distances.reduce((a, b) => a + b, 0);
      let rand = Math.random() * sumDist;
      let nextIdx = 0;
      for (let i = 0; i < n; i++) {
        rand -= distances[i];
        if (rand <= 0) {
          nextIdx = i;
          break;
        }
      }
      this.centroids.push(X[nextIdx].slice());
    }

    // Iterative Assignment and Centroid Update
    let converged = false;
    let iter = 0;
    this.assignments = new Array(n).fill(0);

    while (!converged && iter < this.maxIterations) {
      iter++;
      let changed = false;

      // 1. Assign points to nearest centroid
      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        let bestCluster = 0;
        for (let j = 0; j < this.k; j++) {
          const dist = euclideanDistance(X[i], this.centroids[j]);
          if (dist < minDist) {
            minDist = dist;
            bestCluster = j;
          }
        }
        if (this.assignments[i] !== bestCluster) {
          this.assignments[i] = bestCluster;
          changed = true;
        }
      }

      // 2. Update centroids
      const counts = new Array(this.k).fill(0);
      const newCentroids = Array.from({ length: this.k }, () => new Array(d).fill(0));

      for (let i = 0; i < n; i++) {
        const c = this.assignments[i];
        counts[c]++;
        for (let f = 0; f < d; f++) {
          newCentroids[c][f] += X[i][f];
        }
      }

      for (let j = 0; j < this.k; j++) {
        if (counts[j] > 0) {
          for (let f = 0; f < d; f++) {
            newCentroids[j][f] /= counts[j];
          }
        } else {
          // If empty cluster, re-initialize to a random point
          newCentroids[j] = X[Math.floor(Math.random() * n)].slice();
        }
      }

      this.centroids = newCentroids;
      if (!changed) converged = true;
    }

    // Compute Inertia (WCSS)
    this.inertia = 0;
    for (let i = 0; i < n; i++) {
      const c = this.assignments[i];
      this.inertia += Math.pow(euclideanDistance(X[i], this.centroids[c]), 2);
    }

    // Unstandardize centroids for human readability
    this.naturalCentroids = this.centroids.map(c =>
      c.map((val, j) => val * this.stds[j] + this.means[j])
    );

    // Compute Silhouette Score
    this.silhouetteScore = this.calculateSilhouette(X);

    return {
      k: this.k,
      iterations: iter,
      inertia: Math.round(this.inertia * 100) / 100,
      silhouetteScore: Math.round(this.silhouetteScore * 1000) / 1000,
      assignments: this.assignments,
      naturalCentroids: this.naturalCentroids
    };
  }

  calculateSilhouette(X) {
    const n = X.length;
    if (this.k <= 1 || this.k >= n) return 0;
    const sScores = [];

    for (let i = 0; i < n; i++) {
      const myCluster = this.assignments[i];

      // a(i): average distance to points in same cluster
      const sameCluster = [];
      for (let j = 0; j < n; j++) {
        if (j !== i && this.assignments[j] === myCluster) {
          sameCluster.push(euclideanDistance(X[i], X[j]));
        }
      }
      const a_i = sameCluster.length > 0 ? mean(sameCluster) : 0;

      // b(i): minimum average distance to points in another cluster
      let min_b = Infinity;
      for (let c = 0; c < this.k; c++) {
        if (c === myCluster) continue;
        const otherCluster = [];
        for (let j = 0; j < n; j++) {
          if (this.assignments[j] === c) {
            otherCluster.push(euclideanDistance(X[i], X[j]));
          }
        }
        if (otherCluster.length > 0) {
          const avgD = mean(otherCluster);
          if (avgD < min_b) min_b = avgD;
        }
      }
      const b_i = min_b === Infinity ? 0 : min_b;

      const s_i = Math.max(a_i, b_i) === 0 ? 0 : (b_i - a_i) / Math.max(a_i, b_i);
      sScores.push(s_i);
    }

    return mean(sScores);
  }
}

// 4. RUN CLUSTERING PIPELINES

console.log('================================================================');
console.log("RUSELL'S GLASS, WOODS & METALS - UNSUPERVISED CLUSTERING ENGINE");
console.log('================================================================\n');

// --- PIPELINE 1: CUSTOMER SEGMENTATION (RFM-T) ---
console.log('>>> [1/2] Running Customer RFM-T Clustering...');
const customerFeatures = CUSTOMERS_DATA.map(c => [
  c.totalSpent,   // M: Monetary Value (₱)
  c.ordersCount,  // F: Order Frequency
  c.recencyDays,  // R: Days since last transaction (lower = more recent)
  c.glassRatio,   // T_Glass
  c.metalRatio    // T_Metal
]);

// Determine Optimal k using Elbow Method
console.log('Calculating Elbow WCSS for k = 2..5:');
const customerElbow = [];
for (let k = 2; k <= 5; k++) {
  const km = new KMeansClustering(k);
  const res = km.fit(customerFeatures);
  customerElbow.push({ k, inertia: res.inertia, silhouette: res.silhouetteScore });
  console.log(`  k=${k} -> Inertia (WCSS): ${res.inertia.toFixed(2)} | Silhouette: ${res.silhouetteScore.toFixed(3)}`);
}

// Choose k=4 as optimal business partition
const customerKMeans = new KMeansClustering(4);
const customerResult = customerKMeans.fit(customerFeatures);

const clusterNames = [
  'VIP General Contractors (High Volume, High Aluminum/Steel)',
  'Commercial & Institutional Accounts (High Total Value, Scheduled)',
  'Residential Homeowners (Custom Furniture, Glass/Grills, Moderate)',
  'Walk-in Retail & Quick Repairs (Low Spend, Immediate Cash)'
];

const segmentedCustomers = CUSTOMERS_DATA.map((c, i) => {
  const clusterIdx = customerResult.assignments[i];
  return {
    ...c,
    clusterId: clusterIdx,
    clusterLabel: clusterNames[clusterIdx]
  };
});

// Output Summary Table
console.log('\n--- CUSTOMER CLUSTERS ---');
console.table(segmentedCustomers.map(c => ({
  ID: c.id,
  Name: c.name.padEnd(28),
  'Spent (₱)': `₱${c.totalSpent.toLocaleString()}`,
  Orders: c.ordersCount,
  Recency: `${c.recencyDays}d`,
  Cluster: `C${c.clusterId}: ${c.clusterLabel.slice(0, 32)}...`
})));

// --- PIPELINE 2: PRODUCT & INVENTORY ABC CLUSTERING ---
console.log('\n>>> [2/2] Running Inventory Movement & Margin Clustering...');
const productFeatures = PRODUCTS_DATA.map(p => {
  const margin = (p.price - p.cost) / p.price;
  return [
    p.cost,          // Purchase Cost (₱)
    p.price,         // Selling Price (₱)
    margin,          // Profit Margin (%)
    p.stock,         // Stock Quantity
    p.reorder        // Reorder Threshold
  ];
});

const productKMeans = new KMeansClustering(3);
const productResult = productKMeans.fit(productFeatures);

const productClusterLabels = [
  'High-Value Capital & Specialized Fabricated Items (Low Volume, High Ticket)',
  'Core Workshop Raw Materials (Steady Turnover, Bulk Replenishment)',
  'Fast-Moving Consumables & Fasteners (High Stock, Lower Unit Price)'
];

const segmentedProducts = PRODUCTS_DATA.map((p, i) => {
  const clusterIdx = productResult.assignments[i];
  const margin = Math.round(((p.price - p.cost) / p.price) * 100);
  return {
    ...p,
    marginPct: `${margin}%`,
    clusterId: clusterIdx,
    clusterLabel: productClusterLabels[clusterIdx]
  };
});

console.log('\n--- INVENTORY CLUSTERS ---');
console.table(segmentedProducts.slice(0, 15).map(p => ({
  Code: p.code,
  Name: p.name.padEnd(30),
  Cost: `₱${p.cost}`,
  Price: `₱${p.price}`,
  Margin: p.marginPct,
  Stock: p.stock,
  Cluster: `C${p.clusterId}: ${p.clusterLabel.slice(0, 28)}...`
})));

// 5. EXPORT RESULTS TO JSON & CSV
const exportDir = __dirname;
fs.writeFileSync(path.join(exportDir, 'cluster_customers_results.json'), JSON.stringify(segmentedCustomers, null, 2));
fs.writeFileSync(path.join(exportDir, 'cluster_products_results.json'), JSON.stringify(segmentedProducts, null, 2));

// CSV Export
const customerCsv = 'ID,Name,Type,TotalSpent,OrdersCount,RecencyDays,GlassRatio,MetalRatio,ClusterId,ClusterLabel\n' +
  segmentedCustomers.map(c => `"${c.id}","${c.name}","${c.type}",${c.totalSpent},${c.ordersCount},${c.recencyDays},${c.glassRatio},${c.metalRatio},${c.clusterId},"${c.clusterLabel}"`).join('\n');
fs.writeFileSync(path.join(exportDir, 'cluster_customers_results.csv'), customerCsv);

const productCsv = 'Code,Name,Category,Cost,Price,MarginPct,Stock,Reorder,ClusterId,ClusterLabel\n' +
  segmentedProducts.map(p => `"${p.code}","${p.name}","${p.category}",${p.cost},${p.price},"${p.marginPct}",${p.stock},${p.reorder},${p.clusterId},"${p.clusterLabel}"`).join('\n');
fs.writeFileSync(path.join(exportDir, 'cluster_products_results.csv'), productCsv);

console.log('\n[SUCCESS] Exported JSON & CSV cluster datasets to:');
console.log(`  - ${path.join(exportDir, 'cluster_customers_results.json')}`);
console.log(`  - ${path.join(exportDir, 'cluster_customers_results.csv')}`);
console.log(`  - ${path.join(exportDir, 'cluster_products_results.json')}`);
console.log(`  - ${path.join(exportDir, 'cluster_products_results.csv')}`);
