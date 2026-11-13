# Russel's Glass, Wood and Metals
## Web-Based Order and Project Monitoring with Inventory Management System (POS & Workshop Management)

**University of Mindanao Digos College (UMDC)**  
**Bachelor of Science in Information Technology (BSIT)**  
**Location of Establishment:** Roxas Extension, Digos City, Davao del Sur  

---

### 📌 Overview & Capstone Alignment
This web application is a purpose-built Point of Sale (POS), Custom Fabrication Estimator, Project/Job Order Monitoring, Inventory Management, and Billing system tailored specifically to the operational workflow of **Russel's Glass, Wood and Metals** in Digos City.

It directly implements and fulfills all specific objectives stated in the BSIT Capstone Thesis proposal:
1. **Customer & Order Management:** Centralized recording of inquiries, walk-in counter sales, and custom made-to-order projects.
2. **Measurement & Quotation Estimator:** Calculates surface area (sq ft / sq m), frame perimeter (linear ft), raw materials, cutting labor, hardware, and on-site installation costs for custom glass, wood, and metal fabrications.
3. **Formal Quotation Generator:** Produces print-ready project quotations with 15-day validity and one-click conversion to active Job Orders upon downpayment.
4. **6-Stage Workshop Kanban Board:** Real-time tracking of fabrication stages:
   - `Stage 1: Queued / Staged`
   - `Stage 2: Material Cut & Prep`
   - `Stage 3: In Fabrication & Assembly`
   - `Stage 4: Quality & Finishing`
   - `Stage 5: Ready for Dispatch / Installation in Digos`
   - `Stage 6: Installed & Delivered`
5. **Inventory Monitoring for 4 Trade Lines:**
   - **Glass:** 6mm Clear, 6mm Bronze, 10mm Tempered, Mirrors, Jalousie blades.
   - **Wood & Board:** 1/2" and 3/4" Marine Plywood, Kiln-Dried Mahogany, Melamine boards.
   - **Metals & Steel:** 1"x1" and 1"x2" Tubular Steel, 798 Aluminum sliding tracks (Analok and Powder White), Angle bars.
   - **Hardware & Consumables:** Bostik Neutral Silicone, sliding rollers, hydraulic soft-close hinges, welding rods E6013, blind rivets.
   - Low-stock warnings when inventory drops below the designated reorder level.
6. **Billing, Downpayment & Accounts Receivable:** Tracks 50% initial fabrication deposits, milestone progress payments, remaining balance settlements upon site installation, and prints official receipts.
7. **Role-Based Access Control (RBAC):** Distinct dashboards and interfaces for Owner/Manager, Sales & Office Staff, and Fabrication/Installation Staff.
8. **Summary Reports & Audit Export:** Financial summary, trade distribution charts, and CSV audit report generation.

---

### 🔑 Demo Accounts & System Access

| Role | Username | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Owner / Manager** | `owner` | `Admin123!` | Full unrestricted access to POS, Job Orders, Inventory, Financials, Capstone Reports, and Settings. |
| **Sales & Office Staff** | `sales` | `Sales123!` | Customer directory, POS Counter Checkout, Custom Job Estimator, Quotation preparation, and Receipt printing. |
| **Fabrication Staff** | `workshop` | `Craft123!` | Shop floor Job Order Kanban board, Cutting specifications, Material pick lists, and Workshop Routing Slips. |

*(Note: The login page includes one-click quick login buttons for each role to facilitate capstone defense demonstrations.)*

---

### 🚀 How to Run the Application

Because this application is built with modern, zero-dependency, self-contained HTML5, CSS3, and JavaScript with localStorage persistence, it runs instantly in any modern web browser:

1. **Open the Login Page:**
   - Double-click or open `index.html` in Chrome, Edge, Brave, or Firefox.
2. **Login:**
   - Enter `owner` / `Admin123!` (or click the quick role chip) and click **"Login to Workshop"**.
3. **Explore Modules:**
   - **Point of Sale (POS):** Add ready-made materials to the cart or click **"+ Custom Fabrication"** to specify custom dimensions.
   - **Job Estimator:** Enter width and height in inches to compute square footage and live pricing.
   - **Job Orders (Kanban):** Click any job card to update progress %, change the shop stage, or print a **Workshop Routing Slip**.
   - **Inventory:** Review stock levels, view low stock alerts, or click **"+ Stock In"** to restock.
   - **Billing & Receivables:** Collect remaining balances upon installation completion and print **Official Receipts (OR)**.
   - **Reports:** Review trade revenue distribution and click **"Export CSV Data"** to download an audit file.

---

### 📁 Project File Structure

```
russels-workshop-pos/
├── index.html          # Authentication / Login page matching user's template
├── app.html            # Main unified Single-Page Workshop Management & POS System
├── README.md           # Documentation, thesis alignment, and defense guide
├── css/
│   ├── style.css       # Authentication layout, typography, and responsive styles
│   └── app.css         # POS terminal, Kanban board, inventory tables, modals & print styles
└── js/
    ├── auth.js         # User session, role verification, and login logic
    ├── db.js           # LocalStorage database engine preloaded with realistic Digos City data
    └── app.js          # Core controller for POS, Calculator, Kanban, Inventory, Billing & Reports
```

---

### 🎓 Defense Presentation Checklist for Panelists
When presenting to the capstone committee at UM Digos College:
- **Demonstrate Specific Objective 1 & 2:** Show how a walk-in client inquiry from Tres de Mayo is entered into the system, priced using the **Custom Job Estimator** (Width × Height), and saved as an Official Quotation.
- **Demonstrate Quotation Conversion:** Convert the quotation into an active Job Order with an initial 50% downpayment and generate the Official Receipt.
- **Demonstrate Specific Objective 3 & 4:** Switch to the **Job Orders & Projects** tab. Open the newly created job card, view the allocated materials (glass sheets, aluminum tracks), slide the progress to 50%, and print the **Workshop Routing Slip** for the craftsmen.
- **Demonstrate Inventory Tracking:** Show how materials are tracked in the **Material Inventory** table with low-stock warnings highlighted in red.
- **Demonstrate Balance Collection:** Go to **Billing & Receivables**, collect the remaining 50% balance upon installation, and print the finalized receipt.
- **Demonstrate Reporting & Export:** Show the trade distribution charts and download the CSV audit log.
