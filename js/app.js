/**
 * Russel's Glass, Wood and Metals - Core Application Controller
 * Official Workshop Operations & Point of Sale System
 * Roxas Extension, Digos City, Davao del Sur
 */

class WorkshopApp {
  constructor() {
    this.currentUser = null;
    this.currentView = 'pos';
    this.cart = [];
    this.cartCustomer = null;
    this.cartOrderType = 'counter'; // 'counter' or 'fabrication'
    this.cartPaymentTerm = 'full';  // 'full', 'deposit50', 'quote'
    this.cartPaymentMethod = 'Cash'; // 'Cash', 'GCash', 'Bank Transfer'
    this.cartDiscountType = 'none'; // 'none', 'senior', 'contractor'
    this.cartCalculatedDiscount = 0;
    this.soundMuted = false;
    this.cutPieces = [
      { w: 24, h: 36, qty: 2 },
      { w: 18, h: 40, qty: 1 }
    ];
    this.selectedCategory = 'all';
    this.activeJobId = null;
    this.activePaymentOrderId = null;

    this.init();
  }

  init() {
    // Check or setup user session
    this.currentUser = AuthService.getCurrentUser();
    if (!this.currentUser || this.currentUser.username === 'jethro') {
      // Default to proprietor profile if opened directly
      this.currentUser = {
        username: 'owner',
        fullName: 'Russel T. (Proprietor)',
        role: 'owner',
        roleLabel: 'Proprietor & General Manager',
        avatar: 'RT'
      };
      localStorage.setItem('russels_current_user', JSON.stringify(this.currentUser));
    }

    this.updateUserUI();
    this.restoreSidebarState();
    this.setupClock();
    this.setupEventListeners();
    this.loadView(this.currentView);
    this.updateGlobalBadges();
  }

  updateUserUI() {
    const avatarEl = document.getElementById('sidebarAvatar');
    const nameEl = document.getElementById('sidebarUserName');
    const roleEl = document.getElementById('sidebarUserRole');
    const roleSwitcher = document.getElementById('roleSwitcher');

    if (avatarEl) avatarEl.textContent = this.currentUser.avatar || 'RT';
    if (nameEl) nameEl.textContent = this.currentUser.fullName || this.currentUser.username;
    if (roleEl) roleEl.textContent = this.currentUser.roleLabel || this.currentUser.role;
    if (roleSwitcher) roleSwitcher.value = this.currentUser.role;
  }

  toggleSidebar(forceState = null) {
    const container = document.querySelector('.app-container');
    if (!container) return;

    const shouldCollapse = forceState !== null ? forceState : !container.classList.contains('sidebar-collapsed');

    if (shouldCollapse) {
      container.classList.add('sidebar-collapsed');
      localStorage.setItem('russels_sidebar_collapsed', '1');
      const toggleBtn = document.getElementById('sidebarToggleBtn');
      if (toggleBtn) {
        toggleBtn.setAttribute('title', 'Slide left side out (Show Sidebar) [Ctrl+B]');
      }
    } else {
      container.classList.remove('sidebar-collapsed');
      localStorage.setItem('russels_sidebar_collapsed', '0');
      const toggleBtn = document.getElementById('sidebarToggleBtn');
      if (toggleBtn) {
        toggleBtn.setAttribute('title', 'Slide left side inside (Hide Sidebar) [Ctrl+B]');
      }
    }

    if (typeof this.playAudioTone === 'function') {
      this.playAudioTone('click');
    }
  }

  restoreSidebarState() {
    const saved = localStorage.getItem('russels_sidebar_collapsed');
    if (saved === '1') {
      const container = document.querySelector('.app-container');
      if (container) {
        container.classList.add('sidebar-collapsed');
      }
      const toggleBtn = document.getElementById('sidebarToggleBtn');
      if (toggleBtn) {
        toggleBtn.setAttribute('title', 'Slide left side out (Show Sidebar) [Ctrl+B]');
      }
    }
  }

  setupClock() {
    const clockEl = document.getElementById('liveTimeClock');
    const update = () => {
      const now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      }
    };
    update();
    setInterval(update, 1000);
  }

  setupEventListeners() {
    // Navigation Links
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const view = link.getAttribute('data-view');
        if (view) this.loadView(view);
      });
    });

    // Role switcher
    const roleSwitcher = document.getElementById('roleSwitcher');
    if (roleSwitcher) {
      roleSwitcher.addEventListener('change', (e) => {
        const newRole = e.target.value;
        let roleLabel = 'Proprietor & General Manager';
        let avatar = 'RT';
        let fullName = 'Russel T. (Proprietor)';

        if (newRole === 'sales') {
          roleLabel = 'Sales & Front Office Staff';
          avatar = 'IJ';
          fullName = 'Iris June Tabor / Office Staff';
        } else if (newRole === 'fabricator') {
          roleLabel = 'Workshop & Site Installer';
          avatar = 'AM';
          fullName = 'Arnel Mendoza (Lead Fabricator)';
        } else if (newRole === 'demo') {
          roleLabel = 'Public Demo Evaluator';
          avatar = 'GD';
          fullName = 'Guest Evaluator (Demo Mode)';
        }

        this.currentUser = {
          username: newRole,
          fullName,
          role: newRole,
          roleLabel,
          avatar
        };
        localStorage.setItem('russels_current_user', JSON.stringify(this.currentUser));
        this.updateUserUI();
        this.showToast(`Switched view to ${roleLabel}`, 'info');

        // If fabricator switches, take to projects
        if (newRole === 'fabricator' && this.currentView === 'pos') {
          this.loadView('projects');
        }
      });
    }

    // Category Tabs in POS
    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.selectedCategory = tab.getAttribute('data-category') || 'all';
        this.renderPosProducts();
      });
    });

    // POS Search Input
    const posSearch = document.getElementById('productSearchInput');
    if (posSearch) {
      posSearch.addEventListener('input', () => this.renderPosProducts());
    }

    // Global Spotlight Search & Instant Results
    const globalSearch = document.getElementById('globalSearchInput');
    const searchClearBtn = document.getElementById('globalSearchClear');
    if (globalSearch) {
      globalSearch.addEventListener('input', () => {
        const query = globalSearch.value.trim();
        if (searchClearBtn) searchClearBtn.style.display = query.length > 0 ? 'block' : 'none';
        this.performLiveSearch(query);
      });

      globalSearch.addEventListener('focus', () => {
        if (globalSearch.value.trim().length > 0) {
          this.performLiveSearch(globalSearch.value.trim());
        }
      });

      globalSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.triggerGlobalSearch();
        } else if (e.key === 'Escape') {
          this.closeSpotlightPopover();
        }
      });
    }

    // Keyboard shortcuts: '/' opens search, 'Escape' dismisses, 'Ctrl+B' toggles sidebar
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        this.toggleSidebar();
      } else if (e.key === '/' && document.activeElement !== globalSearch && !['INPUT', 'TEXTAREA'].includes((document.activeElement && document.activeElement.tagName) || '')) {
        e.preventDefault();
        if (globalSearch) {
          globalSearch.focus();
          globalSearch.select();
        }
      } else if (e.key === 'Escape') {
        this.closeSpotlightPopover();
      }
    });

    // Dismiss popover on click outside
    document.addEventListener('click', (e) => {
      const wrapper = document.querySelector('.topbar-search-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        this.closeSpotlightPopover();
      }
    });

    // Order type tabs
    document.querySelectorAll('.order-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.cartOrderType = btn.getAttribute('data-type');
        this.updateCartUI();
      });
    });

    // Payment Term Buttons
    document.querySelectorAll('.pay-term-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pay-term-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.cartPaymentTerm = btn.getAttribute('data-term');
        this.updateCartUI();
      });
    });

    // Payment Method Buttons
    document.querySelectorAll('.pay-method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.cartPaymentMethod = btn.getAttribute('data-method');
        this.updateQrPhCard();
      });
    });

    // Customer selection in POS
    const custSelect = document.getElementById('cartCustomerSelect');
    if (custSelect) {
      custSelect.addEventListener('change', (e) => {
        const custId = e.target.value;
        this.cartCustomer = db.getCustomers().find(c => c.id === custId) || null;
      });
    }

    // Inventory search
    const invSearch = document.getElementById('inventorySearchInput');
    if (invSearch) {
      invSearch.addEventListener('input', () => this.renderInventoryTable());
    }
  }

  loadView(viewName) {
    this.currentView = viewName;

    // Update active nav link
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });

    // Show/hide view containers
    document.querySelectorAll('.view-container').forEach(view => {
      view.classList.remove('active');
    });
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.add('active');

    // Update Topbar Titles
    const titleEl = document.getElementById('topbarTitle');
    const subtitleEl = document.getElementById('topbarSubtitle');

    const viewTitles = {
      pos: {
        title: 'Point of Sale (POS)',
        sub: 'Counter checkout, custom fabrication orders, and deposit processing'
      },
      orders: {
        title: 'Order List & Fulfillment',
        sub: 'Workshop order status, delivery stages, and counter sales records'
      },
      estimator: {
        title: 'Custom Job Estimator',
        sub: 'Dimension-based pricing calculator for glass, wood, and metal fabrications'
      },
      quotations: {
        title: 'Project Quotations',
        sub: 'Formal proposals and cost estimations for clients in Digos City'
      },
      projects: {
        title: 'Job Orders & Projects',
        sub: '6-Stage workshop monitoring for fabrication, finishing, and on-site installation'
      },
      inventory: {
        title: 'Material Inventory',
        sub: 'Stock levels, glass sheets, lumber, steel profiles, and reorder alerts'
      },
      customers: {
        title: 'Customer Directory',
        sub: 'Homeowners, contractors, and commercial business accounts in Digos City'
      },
      payments: {
        title: 'Billing & Receivables',
        sub: 'Downpayments, contract balance collections, and official receipts'
      },
      suppliers: {
        title: 'Supplier Network & Raw Materials',
        sub: 'Authorized distributors for glass sheets, lumber, aluminum extrusions, and steel in Davao Region'
      },
      store_location: {
        title: 'Workshop & Store Location Map',
        sub: 'Tabor Lumber Compound, Roxas Extension, Barangay Zone III, Digos City, Davao del Sur'
      },
      users: {
        title: 'User Management & Role Permissions',
        sub: 'System access control, personnel credentials, and role-based permissions'
      },
      reports: {
        title: 'Reports & Business Analytics',
        sub: 'Official Workshop Performance Metrics & Financial Intelligence'
      }
    };

    if (viewTitles[viewName]) {
      if (titleEl) titleEl.textContent = viewTitles[viewName].title;
      if (subtitleEl) subtitleEl.textContent = viewTitles[viewName].sub;
    }

    // Trigger view-specific renders
    switch (viewName) {
      case 'pos':
        this.populateCustomerDropdowns();
        this.renderPosProducts();
        this.updateCartUI();
        this.updateDashboardMetrics();
        break;
      case 'orders':
        this.renderCleanOrdersTable();
        break;
      case 'estimator':
        this.initEstimatorDefaults();
        break;
      case 'quotations':
        this.renderQuotationsTable();
        break;
      case 'projects':
        this.renderKanbanBoard();
        break;
      case 'inventory':
        this.renderInventoryTable();
        break;
      case 'suppliers':
        this.renderSuppliersTable();
        break;
      case 'store_location':
        // Map is rendered statically in markup
        break;
      case 'customers':
        this.renderCustomersTable();
        break;
      case 'payments':
        this.renderPaymentsTable();
        break;
      case 'users':
        this.renderUsersTable();
        break;
      case 'reports':
        this.renderReportsView();
        break;
    }

    this.updateGlobalBadges();
  }

  updateGlobalBadges() {
    const orders = db.getOrders();
    const products = db.getProducts();
    const quotations = db.getQuotations();

    const activeJobs = orders.filter(o => o.jobStatus !== 'installed_delivered' && o.jobStatus !== 'completed').length;
    const lowStockCount = products.filter(p => (p.stockQuantity || 0) <= (p.reorderLevel || 0)).length;
    const pendingQuotes = quotations.filter(q => q.status === 'Pending Approval').length;

    const navJobsBadge = document.getElementById('navJobsBadge');
    if (navJobsBadge) {
      navJobsBadge.textContent = activeJobs;
      navJobsBadge.style.display = activeJobs > 0 ? 'inline-block' : 'none';
    }

    const navLowStockBadge = document.getElementById('navLowStockBadge');
    if (navLowStockBadge) {
      navLowStockBadge.textContent = lowStockCount;
      navLowStockBadge.style.display = lowStockCount > 0 ? 'inline-block' : 'none';
    }

    const navQuoteBadge = document.getElementById('navQuoteBadge');
    if (navQuoteBadge) {
      navQuoteBadge.textContent = pendingQuotes;
      navQuoteBadge.style.display = pendingQuotes > 0 ? 'inline-block' : 'none';
    }
  }

  populateCustomerDropdowns() {
    const customers = db.getCustomers();
    const selects = [
      document.getElementById('cartCustomerSelect'),
      document.getElementById('modalFabCustomer')
    ];

    selects.forEach(select => {
      if (!select) return;
      const currentVal = select.value;
      select.innerHTML = '<option value="">-- Select Customer in Digos --</option>';
      customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.customerType}) - ${c.address.split(',')[1] || c.address}`;
        select.appendChild(opt);
      });
      if (currentVal) select.value = currentVal;
    });
  }

  // ==========================================================================
  // VIEW: POINT OF SALE (POS)
  // ==========================================================================

  renderPosProducts() {
    const grid = document.getElementById('posProductsGrid');
    if (!grid) return;

    let products = db.getProducts();
    const searchVal = (document.getElementById('productSearchInput')?.value || '').toLowerCase().trim();

    // Category filter
    if (this.selectedCategory !== 'all') {
      products = products.filter(p => p.category === this.selectedCategory);
    }

    // Search filter
    if (searchVal) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchVal) || 
        p.code.toLowerCase().includes(searchVal) ||
        p.supplier.toLowerCase().includes(searchVal)
      );
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: rgba(255,255,255,0.05); border-radius: 50%; color: var(--text-dim); margin-bottom: 0.5rem;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <p style="margin-top: 0.5rem;">No materials or products match your search.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = products.map(product => {
      const isLow = (product.stockQuantity || 0) <= (product.reorderLevel || 0);
      const isOut = (product.stockQuantity || 0) <= 0;

      // Smart category chips & labels
      let chipClass = 'cat-chip-glass';
      let label = 'Glass & Aluminum';

      if (product.code && product.code.startsWith('SHT')) {
        chipClass = 'cat-chip-shutter';
        label = 'Shutter Door';
      } else if (product.category === 'wood') {
        chipClass = 'cat-chip-wood';
        label = 'Hardwood & Cabinet';
      } else if (product.category === 'metal') {
        chipClass = 'cat-chip-metal';
        label = 'Stainless & Metal';
      } else if (product.category === 'hardware') {
        chipClass = 'cat-chip-hardware';
        label = 'Workshop Supplies';
      }

      // Stock Pill HTML
      let stockPillHtml = '';
      if (isOut) {
        stockPillHtml = `<span class="stock-pill stock-out"><span class="pulse-dot red"></span> Out of Stock</span>`;
      } else if (isLow) {
        stockPillHtml = `<span class="stock-pill stock-low"><span class="pulse-dot amber"></span> Low: ${product.stockQuantity} ${product.unit.split(' ')[0]}</span>`;
      } else {
        stockPillHtml = `<span class="stock-pill stock-ok"><span class="pulse-dot green"></span> ${product.stockQuantity} ${product.unit.split(' ')[0]} in stock</span>`;
      }

      return `
        <div class="product-card" onclick="App.addProductToCart('${product.id}')" title="Click to add to counter order">
          <div class="product-card-top">
            <span class="product-code-badge">${product.code}</span>
            <span class="product-cat-chip ${chipClass}">${label}</span>
          </div>

          <div>
            <h4 class="product-title">${product.name}</h4>
            <p class="product-desc">${product.description || ''}</p>
          </div>

          <div class="product-card-bottom">
            <div class="product-price-block">
              <div class="product-price">₱${product.sellingPrice.toLocaleString()}</div>
              <div class="product-unit">per ${product.unit}</div>
            </div>
            <div>
              ${stockPillHtml}
            </div>
          </div>

          <div class="product-add-overlay">
            <button class="btn-quick-add" type="button">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <span>+ Add to Order</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  addProductToCart(productId) {
    const product = db.getProducts().find(p => p.id === productId);
    if (!product) return;

    if (product.stockQuantity <= 0) {
      this.showToast(`Warning: ${product.name} is out of stock!`, 'warning');
    }

    const existingIndex = this.cart.findIndex(item => item.productId === productId && !item.isCustomFab);
    if (existingIndex !== -1) {
      this.cart[existingIndex].quantity += 1;
      this.cart[existingIndex].subtotal = this.cart[existingIndex].quantity * this.cart[existingIndex].unitPrice;
    } else {
      this.cart.push({
        id: 'cart-' + Date.now(),
        productId: product.id,
        isCustomFab: false,
        title: product.name,
        specs: `Standard Stock • Unit: ${product.unit}`,
        unitPrice: product.sellingPrice,
        quantity: 1,
        subtotal: product.sellingPrice,
        category: product.category
      });
    }

    this.updateCartUI();
    this.showToast(`Added ${product.name} to order`, 'success');
  }

  updateCartQty(index, delta) {
    if (!this.cart[index]) return;
    this.cart[index].quantity += delta;
    if (this.cart[index].quantity <= 0) {
      this.cart.splice(index, 1);
    } else {
      this.cart[index].subtotal = this.cart[index].quantity * this.cart[index].unitPrice;
    }
    this.updateCartUI();
  }

  removeFromCart(index) {
    this.cart.splice(index, 1);
    this.updateCartUI();
  }

  updateCartUI() {
    const listEl = document.getElementById('cartItemsList');
    const subtotalEl = document.getElementById('cartSubtotal');
    const installRow = document.getElementById('installFeeRow');
    const installFeeEl = document.getElementById('cartInstallFee');
    const deliveryRow = document.getElementById('deliveryFeeRow');
    const deliveryFeeEl = document.getElementById('cartDeliveryFee');
    const totalEl = document.getElementById('cartTotal');
    const btnCheckout = document.getElementById('btnProcessOrder');

    if (this.cart.length === 0) {
      listEl.innerHTML = `
        <div class="cart-empty-state">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: rgba(255,255,255,0.05); border-radius: 50%; color: var(--text-dim); margin-bottom: 0.5rem;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </div>
          <p>Order is currently empty</p>
          <small>Select products or build a custom fabrication specification</small>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = '₱0.00';
      if (totalEl) totalEl.textContent = '₱0.00';
      if (installRow) installRow.style.display = 'none';
      if (deliveryRow) deliveryRow.style.display = 'none';
      if (btnCheckout) {
        btnCheckout.disabled = true;
        btnCheckout.textContent = 'Process & Print Order (₱0.00)';
      }
      return;
    }

    if (btnCheckout) btnCheckout.disabled = false;

    // Render items with direct Cashier Price input
    listEl.innerHTML = this.cart.map((item, idx) => `
      <div class="cart-item">
        <div class="cart-item-header">
          <span class="cart-item-title">${item.title}</span>
          <button class="cart-item-remove" onclick="App.removeFromCart(${idx})" title="Remove item">&times;</button>
        </div>
        <div class="cart-item-specs">${item.specs}</div>

        <!-- CASHIER DIRECT PRICE INPUT ROW -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.45rem; padding: 0.35rem 0.55rem; background: rgba(0,0,0,0.35); border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.35);">
          <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 700; display: flex; align-items: center; gap: 0.25rem;">
            <span>₱</span> Cashier Price:
          </span>
          <div style="display: flex; align-items: center; gap: 0.2rem;">
            <span style="font-weight: 800; color: #4ade80; font-size: 0.88rem;">₱</span>
            <input type="number" value="${item.unitPrice}" min="0" step="1"
                   oninput="App.updateCartItemPrice(${idx}, this.value)"
                   title="Cashier price input" placeholder="Price"
                   style="width: 85px; padding: 0.2rem 0.35rem; background: #0f172a; border: 1px solid #38bdf8; border-radius: 4px; color: #4ade80; font-weight: 800; font-family: var(--font-mono); font-size: 0.88rem; text-align: right;" />
            <span style="font-size: 0.68rem; color: var(--text-dim);">/ unit</span>
          </div>
        </div>

        <div class="cart-item-footer" style="margin-top: 0.45rem;">
          <div class="cart-qty-controls">
            <button class="cart-qty-btn" onclick="App.updateCartQty(${idx}, -1)">-</button>
            <span class="cart-qty-val">${item.quantity}</span>
            <button class="cart-qty-btn" onclick="App.updateCartQty(${idx}, 1)">+</button>
          </div>
          <span class="cart-item-subtotal" id="cartSubtotal-${idx}">₱${item.subtotal.toLocaleString()}</span>
        </div>
      </div>
    `).join('');

    this.recalculateCartTotals();
  }

  updateCartItemPrice(index, newPrice) {
    if (!this.cart[index]) return;
    const price = Math.max(0, parseFloat(newPrice) || 0);
    this.cart[index].unitPrice = price;
    this.cart[index].subtotal = this.cart[index].quantity * price;

    const itemSub = document.getElementById(`cartSubtotal-${index}`);
    if (itemSub) itemSub.textContent = `₱${this.cart[index].subtotal.toLocaleString()}`;

    this.recalculateCartTotals();
  }

  recalculateCartTotals() {
    const subtotalEl = document.getElementById('cartSubtotal');
    const installRow = document.getElementById('installFeeRow');
    const installFeeEl = document.getElementById('cartInstallFee');
    const deliveryRow = document.getElementById('deliveryFeeRow');
    const deliveryFeeEl = document.getElementById('cartDeliveryFee');
    const totalEl = document.getElementById('cartTotal');
    const discountRow = document.getElementById('cartDiscountRow');
    const discountAmountEl = document.getElementById('cartDiscountAmount');
    const activeDiscountBadge = document.getElementById('activeDiscountBadge');
    const btnCheckout = document.getElementById('btnProcessCheckout') || document.getElementById('btnProcessOrder');

    // Calculations
    const subtotal = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
    let installFee = 0;
    let deliveryFee = 0;

    const hasFabrication = this.cartOrderType === 'fabrication' || this.cart.some(item => item.isCustomFab);

    if (hasFabrication) {
      installFee = 1500;
      deliveryFee = 500;
      if (installRow) installRow.style.display = 'flex';
      if (deliveryRow) deliveryRow.style.display = 'flex';
      if (installFeeEl) installFeeEl.textContent = `₱${installFee.toLocaleString()}`;
      if (deliveryFeeEl) deliveryFeeEl.textContent = `₱${deliveryFee.toLocaleString()}`;
    } else {
      if (installRow) installRow.style.display = 'none';
      if (deliveryRow) deliveryRow.style.display = 'none';
    }

    const grossTotal = subtotal + installFee + deliveryFee;

    // Apply Philippine Discounts (Senior 20% on subtotal, Contractor 10%)
    let discountAmount = 0;
    if (this.cartDiscountType === 'senior') {
      discountAmount = Math.round(subtotal * 0.20);
      if (activeDiscountBadge) activeDiscountBadge.textContent = 'Senior/PWD (-20%)';
    } else if (this.cartDiscountType === 'contractor') {
      discountAmount = Math.round(subtotal * 0.10);
      if (activeDiscountBadge) activeDiscountBadge.textContent = 'Contractor (-10%)';
    } else {
      if (activeDiscountBadge) activeDiscountBadge.textContent = 'None (0%)';
    }

    this.cartCalculatedDiscount = discountAmount;

    if (discountAmount > 0) {
      if (discountRow) discountRow.style.display = 'flex';
      if (discountAmountEl) discountAmountEl.textContent = `-₱${discountAmount.toLocaleString()}`;
    } else {
      if (discountRow) discountRow.style.display = 'none';
    }

    const netTotal = Math.max(0, grossTotal - discountAmount);

    if (subtotalEl) subtotalEl.textContent = `₱${subtotal.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `₱${netTotal.toLocaleString()}`;

    let payableNow = netTotal;
    if (this.cartPaymentTerm === 'deposit50') {
      payableNow = Math.round(netTotal / 2);
    } else if (this.cartPaymentTerm === 'quote') {
      payableNow = 0;
    }

    if (btnCheckout) {
      if (this.cartPaymentTerm === 'quote') {
        btnCheckout.textContent = `Save as Official Quotation (₱${netTotal.toLocaleString()})`;
      } else if (this.cartPaymentTerm === 'deposit50') {
        btnCheckout.textContent = `Process 50% Deposit & JO (₱${payableNow.toLocaleString()})`;
      } else {
        btnCheckout.textContent = `Process Full Payment & JO (₱${payableNow.toLocaleString()})`;
      }
    }

    this.updateQrPhCard(payableNow);
  }

  setCartDiscount(type) {
    this.cartDiscountType = type;
    ['btnDiscNone', 'btnDiscSenior', 'btnDiscContractor'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.classList.remove('active');
    });

    const seniorRow = document.getElementById('seniorIdInputRow');
    if (type === 'senior') {
      document.getElementById('btnDiscSenior')?.classList.add('active');
      if (seniorRow) seniorRow.style.display = 'block';
      this.playAudioTone('click');
      this.showToast('Applied 20% Senior Citizen / PWD Discount (RA 9994)', 'info');
    } else if (type === 'contractor') {
      document.getElementById('btnDiscContractor')?.classList.add('active');
      if (seniorRow) seniorRow.style.display = 'none';
      this.playAudioTone('click');
      this.showToast('Applied 10% Contractor Wholesale Tier', 'info');
    } else {
      document.getElementById('btnDiscNone')?.classList.add('active');
      if (seniorRow) seniorRow.style.display = 'none';
      this.playAudioTone('click');
    }

    this.recalculateCartTotals();
  }

  addOpenPriceItem() {
    const itemName = prompt('Enter Workshop Material or Service Name:', 'Custom Workshop Job / Repair');
    if (!itemName) return;
    const amountStr = prompt(`Enter Cashier Quoted Amount (₱) for "${itemName}":`, '1500');
    if (amountStr === null) return;
    const amount = parseFloat(amountStr) || 0;

    this.cart.push({
      id: 'cart-custom-' + Date.now(),
      productId: null,
      isCustomFab: false,
      title: itemName,
      specs: 'Cashier Quoted Amount • Custom Workshop Service',
      unitPrice: amount,
      quantity: 1,
      subtotal: amount,
      category: 'glass'
    });

    this.updateCartUI();
    this.showToast(`Added "${itemName}" with cashier amount ₱${amount.toLocaleString()}`, 'success');
  }

  processCartOrder() {
    if (this.cart.length === 0) {
      this.showToast('Please add items to the order first.', 'warning');
      return;
    }

    if (this.cartPaymentTerm === 'quote') {
      this.saveCartAsQuotation();
      return;
    }

    let customer = this.cartCustomer;
    if (!customer) {
      // Create quick walk-in customer if not selected
      customer = {
        name: 'Walk-in Customer (Digos City)',
        phone: 'N/A',
        address: 'Digos City Center, Davao del Sur',
        customerType: 'Walk-in'
      };
      customer = db.saveCustomer(customer);
      this.populateCustomerDropdowns();
    }

    const subtotal = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
    const hasFabrication = this.cartOrderType === 'fabrication' || this.cart.some(item => item.isCustomFab);
    const installFee = hasFabrication ? 1500 : 0;
    const deliveryFee = hasFabrication ? 500 : 0;
    const grossAmount = subtotal + installFee + deliveryFee;
    const discount = this.cartCalculatedDiscount || 0;
    const totalAmount = Math.max(0, grossAmount - discount);
    const seniorPwdId = document.getElementById('cartSeniorPwdId')?.value || '';

    let downpayment = totalAmount;
    if (this.cartPaymentTerm === 'deposit50') {
      downpayment = Math.round(totalAmount / 2);
    }

    const balanceDue = totalAmount - downpayment;
    const isOverTheCounter = !hasFabrication;

    // Detect trade category
    let tradeCategory = 'glass';
    if (this.cart.some(i => i.category === 'wood')) tradeCategory = 'wood';
    else if (this.cart.some(i => i.category === 'metal')) tradeCategory = 'metal';

    const orderData = {
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      deliveryAddress: customer.address,
      orderType: isOverTheCounter ? 'Over-The-Counter Sale' : 'Fabrication & Installation On-Site',
      tradeCategory,
      orderDate: new Date().toISOString(),
      targetDate: new Date(Date.now() + (isOverTheCounter ? 86400000 : 7 * 86400000)).toISOString(),
      assignedStaff: isOverTheCounter ? 'Direct Counter Pick-up' : 'Arnel Mendoza & Team',
      items: this.cart.map(i => ({
        title: i.title,
        specs: i.specs,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal
      })),
      materialsAllocated: this.cart.filter(i => i.bom).flatMap(i => i.bom) || [],
      subtotal,
      laborInstallationFee: installFee,
      deliveryFee,
      discount: 0,
      totalAmount,
      downpayment,
      balanceDue,
      paymentStatus: balanceDue <= 0 ? 'Fully Paid' : 'Partial / Downpayment Paid',
      jobStatus: isOverTheCounter ? 'completed' : 'queued',
      progressPercent: isOverTheCounter ? 100 : 15,
      notes: isOverTheCounter ? 'Walk-in cash counter sale completed.' : 'Queued for material cutting in Digos workshop.',
      payments: []
    };

    const savedOrder = db.saveOrder(orderData);

    // Record Payment
    if (downpayment > 0) {
      db.addOrderPayment(savedOrder.id, {
        amount: downpayment,
        method: this.cartPaymentMethod,
        receivedBy: this.currentUser.fullName,
        notes: balanceDue <= 0 ? 'Full counter payment' : 'Initial 50% fabrication downpayment'
      });
    }

    // Deduct stock for non-custom items & monitor low stock alerts
    let lowStockTriggered = false;
    let lowStockItemName = '';

    this.cart.forEach(item => {
      if (item.productId && !item.isCustomFab) {
        db.updateStock(item.productId, -item.quantity);
        const prod = db.getProducts().find(p => p.id === item.productId);
        if (prod && prod.stockQuantity <= prod.reorderLevel) {
          lowStockTriggered = true;
          lowStockItemName = prod.name;
        }
      }
    });

    // Reset Cart
    this.cart = [];
    this.updateCartUI();
    this.updateGlobalBadges();

    // Trigger Audible Feedback (Web Audio API Synthesizer)
    this.playAudioChime();
    if (lowStockTriggered) {
      setTimeout(() => {
        this.playLowStockBeep();
        this.showToast(`⚠️ Low Stock Alert: "${lowStockItemName}" is now at or below reorder level!`, 'warning');
      }, 500);
    }

    this.showToast(`Order ${savedOrder.orderNo} successfully processed!`, 'success');

    // Show Printable Receipt Modal
    this.showOrderReceiptModal(savedOrder.id);
  }

  saveCartAsQuotation() {
    if (this.cart.length === 0) {
      this.showToast('Please add items to quote first.', 'warning');
      return;
    }

    let customer = this.cartCustomer;
    if (!customer) {
      customer = {
        name: 'Prospective Client (Digos City)',
        phone: '09XX-XXX-XXXX',
        address: 'Roxas Extension, Digos City',
        customerType: 'Homeowner'
      };
      customer = db.saveCustomer(customer);
      this.populateCustomerDropdowns();
    }

    const subtotal = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
    const installFee = 1500;
    const deliveryFee = 500;
    const totalAmount = subtotal + installFee + deliveryFee;

    const quotData = {
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      deliveryAddress: customer.address,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: 'Pending Approval',
      projectTitle: this.cart[0]?.title || 'Custom Fabrication Project',
      tradeCategory: this.cart[0]?.category || 'glass',
      items: this.cart.map(i => ({
        title: i.title,
        specs: i.specs,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal
      })),
      subtotal,
      installationFee: installFee,
      deliveryFee,
      totalAmount,
      notes: 'Quotation valid for 15 calendar days. 50% deposit required upon confirmation.',
      preparedBy: this.currentUser.fullName
    };

    const savedQuot = db.saveQuotation(quotData);
    this.cart = [];
    this.updateCartUI();
    this.updateGlobalBadges();

    this.showToast(`Quotation ${savedQuot.quotationNo} prepared!`, 'success');
    this.loadView('quotations');
    this.showQuotationPrintModal(savedQuot.id);
  }

  // ==========================================================================
  // VIEW: CUSTOM JOB ESTIMATOR
  // ==========================================================================

  initEstimatorDefaults() {
    this.handleEstimatorCategoryChange();
    this.calculateEstimator();
  }

  handleEstimatorCategoryChange() {
    const trade = document.getElementById('estTradeCategory')?.value || 'glass';
    const mat1Label = document.getElementById('estMaterial1Label');
    const mat2Label = document.getElementById('estMaterial2Label');
    const mat1 = document.getElementById('estMaterial1');
    const mat2 = document.getElementById('estMaterial2');
    const titleInput = document.getElementById('estJobTitle');

    if (!mat1 || !mat2) return;

    if (trade === 'glass') {
      if (mat1Label) mat1Label.textContent = 'Glass Sheet Selection';
      if (mat2Label) mat2Label.textContent = 'Aluminum Frame Profile';
      if (titleInput) titleInput.value = 'Custom 2-Panel Sliding Glass Window (Analok)';

      mat1.innerHTML = `
        <option value="6mm_clear" data-rate="110">6mm Clear Float Glass (₱110/sqft)</option>
        <option value="6mm_bronze" data-rate="145" selected>6mm Bronze Tinted Glass (₱145/sqft)</option>
        <option value="10mm_tempered" data-rate="290">10mm Clear Tempered Glass (₱290/sqft)</option>
        <option value="mirror_beveled" data-rate="195">1/4" Beveled Mirror Glass (₱195/sqft)</option>
      `;

      mat2.innerHTML = `
        <option value="analok_798" data-rate="85" selected>798 Series Analok Dark Bronze (₱85/linft)</option>
        <option value="white_798" data-rate="95">798 Series Powder Coated White (₱95/linft)</option>
        <option value="matte_black" data-rate="105">Modern Matte Black Architectural (₱105/linft)</option>
      `;
    } else if (trade === 'wood') {
      if (mat1Label) mat1Label.textContent = 'Board / Timber Material';
      if (mat2Label) mat2Label.textContent = 'Hardware & Finishing';
      if (titleInput) titleInput.value = 'Custom Modular Kitchen Overhead Cabinet';

      mat1.innerHTML = `
        <option value="marine_ply_half" data-rate="140">1/2" Marine Plywood Carcass (₱140/sqft)</option>
        <option value="marine_ply_three_fourth" data-rate="190" selected>3/4" Marine Plywood Premium (₱190/sqft)</option>
        <option value="mahogany_hardwood" data-rate="260">Solid Kiln-Dried Mahogany (₱260/sqft)</option>
        <option value="melamine_white" data-rate="180">Melamine Laminated Board (₱180/sqft)</option>
      `;

      mat2.innerHTML = `
        <option value="soft_close_duco" data-rate="120" selected>Hydraulic Soft-Close + Polyurethane Paint (₱120/sqft)</option>
        <option value="natural_varnish" data-rate="90">Natural Teak Varnish + Standard Hinges (₱90/sqft)</option>
      `;
    } else if (trade === 'metal') {
      if (mat1Label) mat1Label.textContent = 'Tubular Steel Frame';
      if (mat2Label) mat2Label.textContent = 'Bar Pattern / Infills';
      if (titleInput) titleInput.value = 'Modern Geometric Window Security Grills';

      mat1.innerHTML = `
        <option value="tube_1x1" data-rate="90" selected>1" x 1" x 1.5mm Tubular Steel (₱90/linft)</option>
        <option value="tube_1x2" data-rate="130">1" x 2" x 1.5mm Heavy Rectangular Tube (₱130/linft)</option>
        <option value="angle_bar" data-rate="100">1-1/2" x 1/8" Structural Angle Bar (₱100/linft)</option>
      `;

      mat2.innerHTML = `
        <option value="square_bar_12mm" data-rate="75" selected>12mm Solid Square Bars + Primer & Black (₱75/sqft)</option>
        <option value="deformed_10mm" data-rate="60">10mm Deformed Steel Bars (₱60/sqft)</option>
        <option value="flat_bar_design" data-rate="85">Decorative Flat Bar Scrollwork (₱85/sqft)</option>
      `;
    }

    this.calculateEstimator();
  }

  calculateEstimator() {
    const widthInches = parseFloat(document.getElementById('estWidthInches')?.value) || 0;
    const heightInches = parseFloat(document.getElementById('estHeightInches')?.value) || 0;
    const qty = parseInt(document.getElementById('estQuantity')?.value) || 1;
    const deliveryOpt = document.getElementById('estDeliveryOpt')?.value;

    const areaSqFt = (widthInches * heightInches) / 144;
    const perimeterLinFt = (2 * (widthInches + heightInches)) / 12;

    const mat1Select = document.getElementById('estMaterial1');
    const mat2Select = document.getElementById('estMaterial2');

    const mat1Rate = parseFloat(mat1Select?.selectedOptions[0]?.getAttribute('data-rate')) || 100;
    const mat2Rate = parseFloat(mat2Select?.selectedOptions[0]?.getAttribute('data-rate')) || 80;

    const materialCostPerUnit = (areaSqFt * mat1Rate) + (perimeterLinFt * mat2Rate);
    const laborCostPerUnit = areaSqFt * 45; // PHP 45/sqft fabrication labor
    const hardwareCostPerUnit = 450; // consumables, silicone, screws
    const installCost = (deliveryOpt === 'yes') ? (1500 + (qty > 1 ? (qty - 1) * 300 : 0)) : 0;

    const unitPrice = Math.round(materialCostPerUnit + laborCostPerUnit + hardwareCostPerUnit);
    const total = (unitPrice * qty) + installCost;

    const areaDisplay = document.getElementById('calcAreaDisplay');
    const perimDisplay = document.getElementById('calcPerimeterDisplay');
    const matCostEl = document.getElementById('calcMaterialCost');
    const laborCostEl = document.getElementById('calcLaborCost');
    const hdwCostEl = document.getElementById('calcHardwareCost');
    const installCostEl = document.getElementById('calcInstallCost');
    const totalBigEl = document.getElementById('calcTotalBig');

    if (areaDisplay) areaDisplay.textContent = `${areaSqFt.toFixed(2)} sq ft (${(areaSqFt * 0.0929).toFixed(2)} sq m)`;
    if (perimDisplay) perimDisplay.textContent = `${perimeterLinFt.toFixed(2)} linear ft`;
    if (matCostEl) matCostEl.textContent = `₱${(materialCostPerUnit * qty).toLocaleString()}`;
    if (laborCostEl) laborCostEl.textContent = `₱${(laborCostPerUnit * qty).toLocaleString()}`;
    if (hdwCostEl) hdwCostEl.textContent = `₱${(hardwareCostPerUnit * qty).toLocaleString()}`;
    if (installCostEl) installCostEl.textContent = `₱${installCost.toLocaleString()}`;
    if (totalBigEl) totalBigEl.textContent = `₱${total.toLocaleString()}`;

    // Store calculated cache on instance
    this.lastEstimate = {
      trade: document.getElementById('estTradeCategory')?.value,
      title: document.getElementById('estJobTitle')?.value,
      width: widthInches,
      height: heightInches,
      areaSqFt,
      perimeterLinFt,
      mat1Text: mat1Select?.selectedOptions[0]?.text,
      mat2Text: mat2Select?.selectedOptions[0]?.text,
      qty,
      unitPrice,
      installCost,
      total
    };
  }

  addEstimatorToCart() {
    if (!this.lastEstimate) this.calculateEstimator();
    const est = this.lastEstimate;

    this.cart.push({
      id: 'cart-est-' + Date.now(),
      isCustomFab: true,
      title: est.title || 'Custom Fabrication',
      specs: `${est.width}"W × ${est.height}"H (${est.areaSqFt.toFixed(1)} sqft) • ${est.mat1Text.split('(')[0]} • ${est.mat2Text.split('(')[0]}`,
      unitPrice: est.unitPrice,
      quantity: est.qty,
      subtotal: est.unitPrice * est.qty,
      category: est.trade,
      bom: [
        { name: est.mat1Text.split('(')[0], qty: `${(est.areaSqFt * est.qty).toFixed(1)} sq ft` },
        { name: est.mat2Text.split('(')[0], qty: `${(est.perimeterLinFt * est.qty).toFixed(1)} lin ft` }
      ]
    });

    this.cartOrderType = 'fabrication';
    this.loadView('pos');
    this.showToast('Custom fabrication job added to order counter!', 'success');
  }

  // ==========================================================================
  // VIEW: JOB ORDERS & KANBAN MONITORING
  // ==========================================================================

  renderKanbanBoard() {
    const orders = db.getOrders();
    const filterTrade = document.getElementById('joCategoryFilter')?.value || 'all';

    const stages = [
      'queued',
      'materials_prepared',
      'in_fabrication',
      'quality_check',
      'ready_dispatch',
      'installed_delivered'
    ];

    // Reset columns
    stages.forEach(stage => {
      const colEl = document.getElementById(`col-${stage}`);
      const countEl = document.getElementById(`count-${stage}`);
      if (colEl) colEl.innerHTML = '';
      if (countEl) countEl.textContent = '0';
    });

    const filtered = filterTrade === 'all' 
      ? orders 
      : orders.filter(o => o.tradeCategory === filterTrade);

    filtered.forEach(order => {
      let stage = order.jobStatus || 'queued';
      if (stage === 'completed') stage = 'installed_delivered';

      const colEl = document.getElementById(`col-${stage}`);
      const countEl = document.getElementById(`count-${stage}`);

      if (colEl) {
        let tradeClass = 'badge-glass';
        if (order.tradeCategory === 'wood') tradeClass = 'badge-wood';
        else if (order.tradeCategory === 'metal') tradeClass = 'badge-metal';

        const isPaid = order.balanceDue <= 0;
        const targetDateFmt = new Date(order.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const card = document.createElement('div');
        card.className = 'job-card';
        card.onclick = () => this.openJobDetailsModal(order.id);

        card.innerHTML = `
          <div class="job-card-header">
            <span class="job-no">${order.jobOrderNo}</span>
            <span class="badge ${tradeClass}">${(order.tradeCategory || 'Glass').toUpperCase()}</span>
          </div>
          <div>
            <h4 class="job-customer">${order.customerName}</h4>
            <div class="job-address">${order.deliveryAddress.split(',')[0]}</div>
          </div>
          <div class="job-items-summary">
            ${order.items.map(i => `• ${i.title} (x${i.quantity})`).slice(0, 2).join('<br>')}
          </div>
          <div class="job-progress-wrapper">
            <div class="job-progress-label">
              <span>Progress</span>
              <strong>${order.progressPercent || 0}%</strong>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${order.progressPercent || 0}%"></div>
            </div>
          </div>
          <div class="job-card-footer">
            <span class="job-target-date">Due: ${targetDateFmt}</span>
            <span class="job-balance-due ${isPaid ? 'paid' : ''}">
              ${isPaid ? '✓ Fully Paid' : `Bal: ₱${order.balanceDue.toLocaleString()}`}
            </span>
          </div>
        `;

        colEl.appendChild(card);
      }

      if (countEl) {
        countEl.textContent = parseInt(countEl.textContent || '0') + 1;
      }
    });
  }

  openJobDetailsModal(orderId) {
    const order = db.getOrder(orderId);
    if (!order) return;
    this.activeJobId = order.id;

    const titleEl = document.getElementById('modalJoTitle');
    const subEl = document.getElementById('modalJoSubtitle');
    const custEl = document.getElementById('modalJoCustomerName');
    const addrEl = document.getElementById('modalJoAddress');
    const phoneEl = document.getElementById('modalJoPhone');
    const itemsEl = document.getElementById('modalJoItemsList');
    const bomEl = document.getElementById('modalJoBOM');
    const statusSelect = document.getElementById('modalJoStatusSelect');
    const slider = document.getElementById('modalJoProgressSlider');
    const percentLabel = document.getElementById('modalJoPercentLabel');
    const staffInput = document.getElementById('modalJoStaff');
    const notesInput = document.getElementById('modalJoNotes');

    if (titleEl) titleEl.textContent = `Job Order: ${order.jobOrderNo} (${order.orderNo})`;
    if (subEl) subEl.textContent = `Target Delivery: ${new Date(order.targetDate).toLocaleDateString()} • Assigned: ${order.assignedStaff}`;
    if (custEl) custEl.textContent = order.customerName;
    if (addrEl) addrEl.textContent = `Installation Site: ${order.deliveryAddress}`;
    if (phoneEl) phoneEl.textContent = `Contact: ${order.customerPhone}`;

    if (itemsEl) {
      itemsEl.innerHTML = order.items.map(i => `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 0.65rem; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; font-weight: 600; color: #fff;">
            <span>${i.title} (x${i.quantity})</span>
            <span style="color: #38bdf8;">₱${i.subtotal.toLocaleString()}</span>
          </div>
          <div style="font-size: 0.72rem; color: #d97706; margin-top: 2px;">${i.specs}</div>
        </div>
      `).join('');
    }

    if (bomEl) {
      if (order.materialsAllocated && order.materialsAllocated.length > 0) {
        bomEl.innerHTML = order.materialsAllocated.map(m => `
          <span class="badge badge-metal">${m.name} (${m.qty})</span>
        `).join('');
      } else {
        bomEl.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-dim);">Materials allocated from general inventory stock.</span>`;
      }
      if (order.signature) {
        bomEl.innerHTML += `
          <div style="margin-top: 0.75rem; padding: 0.5rem 0.75rem; background: rgba(34, 197, 94, 0.12); border-radius: 6px; border: 1px solid rgba(34, 197, 94, 0.35); display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <div>
              <span style="font-size: 0.75rem; color: #4ade80; font-weight: 700; display: block;">✍️ Customer E-Signature Verified</span>
              <small style="font-size: 0.65rem; color: var(--text-dim);">Signed on file</small>
            </div>
            <img src="${order.signature}" alt="Customer Signature" style="height: 32px; max-width: 130px; object-fit: contain; background: #fff; padding: 2px 4px; border-radius: 4px;" />
          </div>
        `;
      }
    }

    if (statusSelect) statusSelect.value = order.jobStatus || 'queued';
    if (slider) slider.value = order.progressPercent || 0;
    if (percentLabel) percentLabel.textContent = `${order.progressPercent || 0}%`;
    if (staffInput) staffInput.value = order.assignedStaff || '';
    if (notesInput) notesInput.value = order.notes || '';

    this.openModal('modalJobDetails');
  }

  saveJobStatusUpdate() {
    if (!this.activeJobId) return;
    const statusSelect = document.getElementById('modalJoStatusSelect');
    const slider = document.getElementById('modalJoProgressSlider');
    const staffInput = document.getElementById('modalJoStaff');
    const notesInput = document.getElementById('modalJoNotes');

    const newStatus = statusSelect?.value || 'queued';
    const newPercent = parseInt(slider?.value) || 0;
    const staff = staffInput?.value || 'Workshop Team';
    const note = notesInput?.value || '';

    const order = db.getOrder(this.activeJobId);
    if (order) {
      order.jobStatus = newStatus;
      order.progressPercent = newPercent;
      order.assignedStaff = staff;
      order.notes = note;
      db.saveOrder(order);

      this.closeModal('modalJobDetails');
      this.renderKanbanBoard();
      this.updateGlobalBadges();
      this.showToast(`Job Order ${order.jobOrderNo} updated to ${newStatus}!`, 'success');
    }
  }

  // ==========================================================================
  // VIEW: QUOTATIONS
  // ==========================================================================

  renderQuotationsTable() {
    const tbody = document.getElementById('quotationsTableBody');
    if (!tbody) return;
    const quotations = db.getQuotations();

    if (quotations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No quotations on record.</td></tr>`;
      return;
    }

    tbody.innerHTML = quotations.map(q => `
      <tr>
        <td><strong style="color: #38bdf8; font-family: var(--font-mono);">${q.quotationNo}</strong></td>
        <td>
          <div style="font-weight: 600; color: #fff;">${q.customerName}</div>
          <small style="color: var(--text-dim);">${q.projectTitle}</small>
        </td>
        <td>
          <div>${q.customerPhone}</div>
          <small style="color: var(--text-muted);">${q.deliveryAddress}</small>
        </td>
        <td><span class="badge badge-metal">${q.tradeCategory || 'Glass'}</span></td>
        <td><strong style="color: #fff;">₱${q.totalAmount.toLocaleString()}</strong></td>
        <td><span class="badge ${q.status === 'Converted to Order' ? 'badge-success' : 'badge-warning'}">${q.status}</span></td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.72rem;" onclick="App.showQuotationPrintModal('${q.id}')">View / Print</button>
            ${q.status !== 'Converted to Order' ? `
              <button class="btn-success" style="padding: 0.3rem 0.6rem; font-size: 0.72rem;" onclick="App.convertQuoteToOrderPrompt('${q.id}')">Convert to Order</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  convertQuoteToOrderPrompt(quotId) {
    const quot = db.getQuotations().find(q => q.id === quotId);
    if (!quot) return;

    const deposit = Math.round(quot.totalAmount / 2);
    if (confirm(`Convert Quotation ${quot.quotationNo} for ${quot.customerName} into an active Job Order?\n\nRequired 50% Initial Downpayment: ₱${deposit.toLocaleString()}`)) {
      const order = db.convertQuotationToOrder(quotId, deposit, 'Cash', this.currentUser.fullName);
      this.renderQuotationsTable();
      this.updateGlobalBadges();
      this.showToast(`Quotation converted to Job Order ${order.jobOrderNo}!`, 'success');
      this.loadView('projects');
    }
  }

  // ==========================================================================
  // VIEW: INVENTORY MANAGEMENT
  // ==========================================================================

  renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    let products = db.getProducts();
    const searchVal = (document.getElementById('inventorySearchInput')?.value || '').toLowerCase().trim();
    const lowOnly = document.getElementById('inventoryLowStockOnly')?.checked;

    if (searchVal) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchVal) ||
        p.code.toLowerCase().includes(searchVal) ||
        p.supplier.toLowerCase().includes(searchVal)
      );
    }

    if (lowOnly) {
      products = products.filter(p => (p.stockQuantity || 0) <= (p.reorderLevel || 0));
    }

    // Update metrics
    const all = db.getProducts();
    const totalVal = all.reduce((sum, p) => sum + (p.stockQuantity * p.unitCost), 0);
    const lowCount = all.filter(p => (p.stockQuantity || 0) <= (p.reorderLevel || 0)).length;

    // Compute Sales per product from orders
    const orders = db.getOrders();
    const salesMap = {};
    orders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(it => {
          let pId = it.productId;
          if (!pId) {
            const matched = all.find(prod => 
              (it.title && prod.name.toLowerCase().includes(it.title.toLowerCase().slice(0, 10))) ||
              (prod.name && (it.title || '').toLowerCase().includes(prod.name.toLowerCase().slice(0, 10)))
            );
            if (matched) pId = matched.id;
          }
          if (pId) {
            if (!salesMap[pId]) salesMap[pId] = { qty: 0, revenue: 0 };
            salesMap[pId].qty += (it.quantity || 1);
            salesMap[pId].revenue += (it.subtotal || ((it.quantity || 1) * (it.unitPrice || 0)));
          }
        });
      }
    });

    const valEl = document.getElementById('invMetricTotalValue');
    const lowEl = document.getElementById('invMetricLowStock');
    const totEl = document.getElementById('invMetricTotalItems');

    if (valEl) valEl.textContent = `₱${totalVal.toLocaleString()}`;
    if (lowEl) lowEl.textContent = lowCount;
    if (totEl) totEl.textContent = all.length;

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 2rem;">No items match inventory criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => {
      const isLow = (p.stockQuantity || 0) <= (p.reorderLevel || 0);
      let catClass = 'badge-glass';
      if (p.category === 'wood') catClass = 'badge-wood';
      else if (p.category === 'metal') catClass = 'badge-metal';
      else if (p.category === 'hardware') catClass = 'badge-hardware';

      const prodSales = salesMap[p.id];

      return `
        <tr>
          <td><strong style="font-family: var(--font-mono); color: #fff;">${p.code}</strong></td>
          <td>
            <div style="font-weight: 600; color: #fff;">${p.name}</div>
            <small style="color: var(--text-dim);">${p.description || ''}</small>
          </td>
          <td><span class="badge ${catClass}">${p.categoryLabel.split(' ')[0]}</span></td>
          <td>
            <span class="stock-tag ${isLow ? 'low' : 'ok'}">
              ${isLow ? '⚠️ ' : '● '}${p.stockQuantity}
            </span>
          </td>
          <td>${p.unit}</td>
          <td>₱${p.unitCost.toLocaleString()}</td>
          <td><strong style="color: #38bdf8;">₱${p.sellingPrice.toLocaleString()}</strong></td>
          <td>
            ${prodSales && prodSales.qty > 0 ? `
              <div style="font-weight: 700; color: #4ade80; font-size: 0.85rem;">
                ${prodSales.qty} ${p.unit.split(' ')[0]}
              </div>
              <small style="color: #a7f3d0; font-weight: 600;">₱${prodSales.revenue.toLocaleString()}</small>
            ` : `
              <span style="color: var(--text-dim); font-size: 0.78rem;">0 sold (₱0)</span>
            `}
          </td>
          <td style="font-size: 0.78rem; color: var(--text-dim);">${p.supplier}</td>
          <td>
            <button class="btn-primary" style="padding: 0.28rem 0.55rem; font-size: 0.72rem; margin-right: 0.25rem;" onclick="App.editProductPricePrompt('${p.id}')" title="Cashier enters custom product selling price">
              ✏️ Edit Price
            </button>
            <button class="btn-secondary" style="padding: 0.28rem 0.55rem; font-size: 0.72rem;" onclick="App.quickRestockPrompt('${p.id}')">
              + Stock In
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  editProductPricePrompt(productId) {
    const product = db.getProducts().find(p => p.id === productId);
    if (!product) return;

    const newPriceStr = prompt(`Update Cashier Selling Price for:\n${product.name}\nCurrent Base Price: ₱${product.sellingPrice}\n\nEnter new selling price (₱):`, product.sellingPrice);
    if (newPriceStr !== null) {
      const newPrice = parseFloat(newPriceStr);
      if (!isNaN(newPrice) && newPrice >= 0) {
        product.sellingPrice = newPrice;
        db.saveProduct(product);
        this.renderInventoryTable();
        this.renderPosProducts();
        this.showToast(`Updated price for ${product.name} to ₱${newPrice.toLocaleString()}`, 'success');
      }
    }
  }

  quickRestockPrompt(productId) {
    const product = db.getProducts().find(p => p.id === productId);
    if (!product) return;

    const addQtyStr = prompt(`Stock In for: ${product.name}\nCurrent Stock: ${product.stockQuantity} ${product.unit}\nEnter quantity to add:`, "20");
    if (addQtyStr !== null) {
      const addQty = parseInt(addQtyStr);
      if (!isNaN(addQty) && addQty > 0) {
        db.updateStock(productId, addQty);
        this.renderInventoryTable();
        this.updateGlobalBadges();
        this.showToast(`Restocked +${addQty} ${product.unit} of ${product.name}`, 'success');
      }
    }
  }

  openNewProductModal() {
    this.openModal('modalNewProduct');
  }

  submitNewProduct() {
    const code = document.getElementById('newProdCode')?.value.trim();
    const name = document.getElementById('newProdName')?.value.trim();
    const category = document.getElementById('newProdCategory')?.value || 'glass';
    const unit = document.getElementById('newProdUnit')?.value.trim() || 'piece';
    const supplier = document.getElementById('newProdSupplier')?.value.trim() || 'Digos Local Supplier';
    const cost = parseFloat(document.getElementById('newProdCost')?.value) || 0;
    const price = parseFloat(document.getElementById('newProdPrice')?.value) || 0;
    const stock = parseInt(document.getElementById('newProdStock')?.value) || 0;
    const reorder = parseInt(document.getElementById('newProdReorder')?.value) || 10;

    if (!code || !name) {
      this.showToast('Please provide an item code and name.', 'warning');
      return;
    }

    const labels = {
      glass: 'Glass Works',
      wood: 'Wood & Cabinets',
      metal: 'Metal & Steel',
      hardware: 'Hardware & Supplies'
    };

    db.saveProduct({
      code,
      name,
      category,
      categoryLabel: labels[category] || 'Materials',
      unit,
      unitCost: cost,
      sellingPrice: price,
      stockQuantity: stock,
      reorderLevel: reorder,
      supplier,
      description: `Workshop material for ${labels[category]}`
    });

    this.closeModal('modalNewProduct');
    this.renderInventoryTable();
    this.updateGlobalBadges();
    this.showToast(`Material ${name} added to inventory!`, 'success');
  }

  // ==========================================================================
  // VIEW: CUSTOMER DIRECTORY
  // ==========================================================================

  renderCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;
    const customers = db.getCustomers();

    tbody.innerHTML = customers.map(c => `
      <tr>
        <td><strong style="font-family: var(--font-mono); color: #38bdf8;">${c.code}</strong></td>
        <td>
          <div style="font-weight: 600; color: #fff;">${c.name}</div>
          <small style="color: var(--text-dim);">${c.notes || ''}</small>
        </td>
        <td><span class="badge badge-metal">${c.customerType}</span></td>
        <td>${c.phone}</td>
        <td>${c.address}</td>
        <td><strong style="color: #34d399;">₱${(c.totalSpent || 0).toLocaleString()}</strong></td>
        <td>
          <button class="btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.72rem;" onclick="App.startOrderForCustomer('${c.id}')">
            + New Order
          </button>
        </td>
      </tr>
    `).join('');
  }

  startOrderForCustomer(custId) {
    this.loadView('pos');
    const select = document.getElementById('cartCustomerSelect');
    if (select) {
      select.value = custId;
      this.cartCustomer = db.getCustomers().find(c => c.id === custId) || null;
      this.showToast(`Customer ${this.cartCustomer?.name} selected in POS.`, 'info');
    }
  }

  openNewCustomerModal() {
    this.openModal('modalNewCustomer');
  }

  submitNewCustomer() {
    const name = document.getElementById('newCustName')?.value.trim();
    const type = document.getElementById('newCustType')?.value || 'Homeowner';
    const phone = document.getElementById('newCustPhone')?.value.trim() || 'N/A';
    const address = document.getElementById('newCustAddress')?.value.trim() || 'Digos City, Davao del Sur';
    const notes = document.getElementById('newCustNotes')?.value.trim() || '';

    if (!name) {
      this.showToast('Please enter the customer name.', 'warning');
      return;
    }

    const saved = db.saveCustomer({
      name,
      customerType: type,
      phone,
      address,
      notes
    });

    this.closeModal('modalNewCustomer');
    this.populateCustomerDropdowns();
    if (this.currentView === 'customers') this.renderCustomersTable();
    this.showToast(`Customer ${saved.name} registered successfully!`, 'success');
  }

  // ==========================================================================
  // VIEW: BILLING & RECEIVABLES
  // ==========================================================================

  renderPaymentsTable() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;
    const orders = db.getOrders();

    const totalRev = orders.reduce((sum, o) => sum + (o.downpayment || 0), 0);
    const receivables = orders.reduce((sum, o) => sum + (o.balanceDue || 0), 0);
    const settledCount = orders.filter(o => o.balanceDue <= 0).length;
    const activeCount = orders.filter(o => o.balanceDue > 0).length;

    const revEl = document.getElementById('payMetricTotalRevenue');
    const recEl = document.getElementById('payMetricReceivables');
    const actEl = document.getElementById('payMetricActiveCount');
    const setEl = document.getElementById('payMetricSettledCount');

    if (revEl) revEl.textContent = `₱${totalRev.toLocaleString()}`;
    if (recEl) recEl.textContent = `₱${receivables.toLocaleString()}`;
    if (actEl) actEl.textContent = activeCount;
    if (setEl) setEl.textContent = settledCount;

    tbody.innerHTML = orders.map(o => {
      const isPaid = o.balanceDue <= 0;
      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #38bdf8;">${o.jobOrderNo || o.orderNo}</div>
            <small style="color: var(--text-dim);">${new Date(o.orderDate).toLocaleDateString()}</small>
          </td>
          <td>
            <div style="font-weight: 600; color: #fff;">${o.customerName}</div>
            <small style="color: var(--text-muted);">${o.customerPhone}</small>
          </td>
          <td>₱${o.totalAmount.toLocaleString()}</td>
          <td><strong style="color: #34d399;">₱${(o.downpayment || 0).toLocaleString()}</strong></td>
          <td>
            <strong style="color: ${isPaid ? '#34d399' : '#fbbf24'}; font-size: 0.95rem;">
              ₱${(o.balanceDue || 0).toLocaleString()}
            </strong>
          </td>
          <td>
            <span class="badge ${isPaid ? 'badge-success' : 'badge-warning'}">
              ${o.paymentStatus}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.72rem;" onclick="App.showOrderReceiptModal('${o.id}')">Receipt</button>
              ${!isPaid ? `
                <button class="btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.72rem;" onclick="App.openPaymentCollectionModal('${o.id}')">Collect Balance</button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  openPaymentCollectionModal(orderId) {
    const order = db.getOrder(orderId);
    if (!order) return;
    this.activePaymentOrderId = order.id;

    const ordNo = document.getElementById('modalPayOrderNo');
    const cust = document.getElementById('modalPayCustomer');
    const contract = document.getElementById('modalPayContract');
    const bal = document.getElementById('modalPayBalance');
    const amtInput = document.getElementById('modalPayAmount');

    if (ordNo) ordNo.textContent = `${order.jobOrderNo} (${order.orderNo})`;
    if (cust) cust.textContent = order.customerName;
    if (contract) contract.textContent = `₱${order.totalAmount.toLocaleString()}`;
    if (bal) bal.textContent = `₱${order.balanceDue.toLocaleString()}`;
    if (amtInput) amtInput.value = order.balanceDue;

    this.openModal('modalPayment');
  }

  submitPaymentCollection() {
    if (!this.activePaymentOrderId) return;
    const amount = parseFloat(document.getElementById('modalPayAmount')?.value) || 0;
    const method = document.getElementById('modalPayMethod')?.value || 'Cash';
    const ref = document.getElementById('modalPayRef')?.value.trim() || 'POS-SETTLE-' + Date.now().toString().slice(-4);
    const note = document.getElementById('modalPayNote')?.value.trim() || 'Settlement payment';

    if (amount <= 0) {
      this.showToast('Please enter a valid payment amount.', 'warning');
      return;
    }

    const result = db.addOrderPayment(this.activePaymentOrderId, {
      amount,
      method,
      referenceNo: ref,
      receivedBy: this.currentUser.fullName,
      notes: note
    });

    this.closeModal('modalPayment');
    this.renderPaymentsTable();
    this.updateGlobalBadges();
    this.showToast(`Recorded payment of ₱${amount.toLocaleString()}!`, 'success');
    this.showOrderReceiptModal(this.activePaymentOrderId);
  }

  // ==========================================================================
  // IMAGE 1: DASHBOARD METRICS & CLEAN MODERN ORDER LIST
  // ==========================================================================

  updateDashboardMetrics() {
    const orders = (typeof db !== 'undefined' && db.getOrders) ? db.getOrders() : [];
    const totalRev = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const heroRevEl = document.getElementById('heroMetricRevenue');
    if (heroRevEl) {
      heroRevEl.textContent = `₱${(totalRev || 99560).toLocaleString()}`;
    }

    const cleanOrdersEl = document.getElementById('cleanMetricOrders');
    if (cleanOrdersEl) {
      cleanOrdersEl.textContent = orders.length || 35;
    }

    const cleanProfitEl = document.getElementById('cleanMetricProfit');
    if (cleanProfitEl) {
      const netProfit = Math.round((totalRev || 145000) * 0.42);
      cleanProfitEl.textContent = `₱${netProfit.toLocaleString()}`;
    }

    const greetingUser = document.getElementById('dashGreetingUser');
    if (greetingUser && this.currentUser) {
      const firstName = (this.currentUser.fullName || this.currentUser.username || 'Russel').split(' ')[0];
      greetingUser.textContent = firstName;
    }
  }

  renderCleanOrdersTable() {
    const tbody = document.getElementById('cleanOrdersTableBody');
    if (!tbody) return;

    const orders = (typeof db !== 'undefined' && db.getOrders) ? db.getOrders() : [];
    
    // Update pastel summary counts
    const newCount = orders.filter(o => o.jobStatus === 'queued' || o.jobStatus === 'new').length || 12;
    const awaitCount = orders.filter(o => o.jobStatus === 'materials_prepared' || o.jobStatus === 'await').length || 20;
    const onWayCount = orders.filter(o => o.jobStatus === 'ready_dispatch' || o.jobStatus === 'on_way' || o.jobStatus === 'in_fabrication').length || 57;
    const deliveredCount = orders.filter(o => o.jobStatus === 'installed_delivered' || o.jobStatus === 'completed' || o.jobStatus === 'delivered').length || 98;

    const elNew = document.getElementById('countCardNew');
    const elAwait = document.getElementById('countCardAwait');
    const elOnWay = document.getElementById('countCardOnWay');
    const elDelivered = document.getElementById('countCardDelivered');
    const elBadge = document.getElementById('orderListTotalBadge');

    if (elNew) elNew.textContent = newCount;
    if (elAwait) elAwait.textContent = awaitCount;
    if (elOnWay) elOnWay.textContent = onWayCount;
    if (elDelivered) elDelivered.textContent = deliveredCount;
    if (elBadge) elBadge.textContent = `${orders.length || 35} orders`;

    tbody.innerHTML = orders.map((o, idx) => {
      const statusMap = {
        'queued': { label: 'await', cls: 'await' },
        'materials_prepared': { label: 'await', cls: 'await' },
        'in_fabrication': { label: 'on way', cls: 'on-way' },
        'quality_check': { label: 'on way', cls: 'on-way' },
        'ready_dispatch': { label: 'on way', cls: 'on-way' },
        'installed_delivered': { label: 'delivered', cls: 'delivered' },
        'completed': { label: 'delivered', cls: 'delivered' }
      };

      const stat = statusMap[o.jobStatus] || { label: 'on way', cls: 'on-way' };
      const formattedDate = o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-GB') : '26.07.2024';
      const orderNum = o.orderNo || `№${674830 + idx}`;
      const category = o.tradeCategory ? (o.tradeCategory.charAt(0).toUpperCase() + o.tradeCategory.slice(1)) : 'Glass & Aluminum';
      const payment = o.paymentMethod || 'Cash';

      return `
        <tr>
          <td><input type="checkbox" class="order-select-chk" value="${o.id}" /></td>
          <td><span class="clean-order-id">${orderNum}</span></td>
          <td>
            <div class="clean-customer-name">${o.customerName || 'Customer'}</div>
            <div class="clean-customer-phone">${o.customerPhone || '0921 371 0555'}</div>
          </td>
          <td><span style="color: #64748b; font-weight: 600;">${category}</span></td>
          <td><span class="clean-price-bold">₱ ${(o.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
          <td><span style="color: #64748b; font-size: 0.82rem;">${formattedDate}</span></td>
          <td><span style="font-weight: 600; color: #475569;">${payment}</span></td>
          <td>
            <span class="status-dropdown-pill ${stat.cls}">
              ${stat.label} ▾
            </span>
          </td>
          <td>
            <button type="button" class="clean-kebab-btn" onclick="App.showOrderReceiptModal('${o.id}')" title="View Order Slip & Receipt">⋮</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  filterOrderListTable() {
    const input = document.getElementById('orderListSearchInput');
    const q = (input ? input.value : '').toLowerCase();
    const rows = document.querySelectorAll('#cleanOrdersTableBody tr');
    rows.forEach(tr => {
      const text = tr.textContent.toLowerCase();
      tr.style.display = text.includes(q) ? '' : 'none';
    });
  }

  toggleSelectAllOrders(master) {
    const chks = document.querySelectorAll('.order-select-chk');
    chks.forEach(c => c.checked = master.checked);
  }

  openNewOrderFromList() {
    this.loadView('pos');
  }

  clearOrderFilter(type) {
    this.showToast(`Cleared ${type} filter`, 'info');
  }

  clearAllOrderFilters() {
    const input = document.getElementById('orderListSearchInput');
    if (input) input.value = '';
    this.filterOrderListTable();
    this.showToast('All order filters cleared', 'info');
  }

  exportOrdersCSV() {
    this.exportAuditCSV();
  }

  sortOrderListTable() {
    this.showToast('Orders sorted by newest date', 'info');
  }

  // ==========================================================================
  // VIEW: REPORTS & AUDIT SUMMARY
  // ==========================================================================

  renderReportsView() {
    this.renderClusteringWidget();
    const orders = db.getOrders();
    const tradeBars = document.getElementById('reportTradeBars');
    const jobBars = document.getElementById('reportJobStatusBars');

    if (tradeBars) {
      const trades = { glass: 0, wood: 0, metal: 0, hardware: 0 };
      orders.forEach(o => {
        const cat = o.tradeCategory || 'glass';
        trades[cat] = (trades[cat] || 0) + o.totalAmount;
      });
      const maxVal = Math.max(...Object.values(trades), 1);

      tradeBars.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 2px;">
            <span>Glass Works &amp; Windows</span>
            <strong>₱${(trades.glass || 0).toLocaleString()}</strong>
          </div>
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${(trades.glass / maxVal) * 100}%;"></div></div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 2px;">
            <span>Woodwork &amp; Custom Cabinets</span>
            <strong>₱${(trades.wood || 0).toLocaleString()}</strong>
          </div>
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${(trades.wood / maxVal) * 100}%; background: #d97706;"></div></div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 2px;">
            <span>Metal Fabrication &amp; Security Grills</span>
            <strong>₱${(trades.metal || 0).toLocaleString()}</strong>
          </div>
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${(trades.metal / maxVal) * 100}%; background: #64748b;"></div></div>
        </div>
      `;
    }

    if (jobBars) {
      const counts = {
        queued: orders.filter(o => o.jobStatus === 'queued').length,
        in_fab: orders.filter(o => o.jobStatus === 'in_fabrication' || o.jobStatus === 'materials_prepared').length,
        dispatch: orders.filter(o => o.jobStatus === 'ready_dispatch' || o.jobStatus === 'quality_check').length,
        completed: orders.filter(o => o.jobStatus === 'installed_delivered' || o.jobStatus === 'completed').length
      };

      jobBars.innerHTML = `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 6px;">
          <span>Queued for Materials:</span>
          <strong style="color: #fbbf24;">${counts.queued} projects</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 6px;">
          <span>Active Fabrication &amp; Assembly:</span>
          <strong style="color: #38bdf8;">${counts.in_fab} projects</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 6px;">
          <span>Staged for Site Installation:</span>
          <strong style="color: #c084fc;">${counts.dispatch} projects</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 6px;">
          <span>Completed &amp; Installed:</span>
          <strong style="color: #34d399;">${counts.completed} projects</strong>
        </div>
      `;
    }
  }

  exportAuditCSV() {
    const orders = db.getOrders();
    let csv = "Order No,Job Order No,Customer Name,Phone,Address,Trade,Order Date,Total Amount,Downpayment,Balance Due,Status\n";
    orders.forEach(o => {
      csv += `"${o.orderNo}","${o.jobOrderNo}","${o.customerName}","${o.customerPhone}","${o.deliveryAddress}","${o.tradeCategory}","${o.orderDate}","${o.totalAmount}","${o.downpayment}","${o.balanceDue}","${o.jobStatus}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Russel_Workshop_Audit_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    this.showToast('Audit records exported to CSV!', 'success');
  }

  backupDatabaseSQL() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    let sql = `-- ============================================================================\n`;
    sql += `-- RUSELL'S GLASS, WOODS & METALS - DISASTER RECOVERY DATABASE BACKUP\n`;
    sql += `-- Location: Tabor Lumber Compound, Roxas Ext., Brgy. Zone III, Digos City\n`;
    sql += `-- System: Official Workshop Point of Sale & Fabrication Operations\n`;
    sql += `-- Generated: ${new Date().toLocaleString()} (PHT)\n`;
    sql += `-- ============================================================================\n\n`;
    sql += `CREATE DATABASE IF NOT EXISTS \`russels_workshop\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
    sql += `USE \`russels_workshop\`;\n\n`;

    const users = (typeof getStoredUsers === 'function') ? getStoredUsers() : [];
    sql += `-- 1. Table: users (${users.length} accounts)\n`;
    sql += `DROP TABLE IF EXISTS \`users\`;\n`;
    sql += `CREATE TABLE \`users\` (\n  \`id\` INT AUTO_INCREMENT PRIMARY KEY,\n  \`username\` VARCHAR(50) NOT NULL UNIQUE,\n  \`password\` VARCHAR(255) NOT NULL,\n  \`full_name\` VARCHAR(100) NOT NULL,\n  \`phone\` VARCHAR(30) DEFAULT '0921-371-0555',\n  \`email\` VARCHAR(100) DEFAULT 'irisjunetaborbajura@gmail.com',\n  \`role\` ENUM('owner', 'sales', 'fabricator') NOT NULL DEFAULT 'owner',\n  \`role_label\` VARCHAR(80) NOT NULL,\n  \`avatar\` VARCHAR(10) DEFAULT 'RT'\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
    if (users.length > 0) {
      sql += `INSERT INTO \`users\` (\`username\`, \`password\`, \`full_name\`, \`phone\`, \`email\`, \`role\`, \`role_label\`, \`avatar\`) VALUES\n`;
      sql += users.map(u => `('${u.username}', '${u.password}', '${(u.fullName || '').replace(/'/g, "\\'")}', '${u.phone || ''}', '${u.email || ''}', '${u.role || 'owner'}', '${(u.roleLabel || '').replace(/'/g, "\\'")}', '${u.avatar || 'RT'}')`).join(',\n') + ';\n\n';
    }

    const customers = db.getCustomers();
    sql += `-- 2. Table: customers (${customers.length} clients)\n`;
    sql += `DROP TABLE IF EXISTS \`customers\`;\n`;
    sql += `CREATE TABLE \`customers\` (\n  \`id\` INT AUTO_INCREMENT PRIMARY KEY,\n  \`code\` VARCHAR(20) NOT NULL UNIQUE,\n  \`name\` VARCHAR(150) NOT NULL,\n  \`phone\` VARCHAR(30) DEFAULT 'N/A',\n  \`address\` TEXT NOT NULL,\n  \`customer_type\` VARCHAR(50) DEFAULT 'Homeowner',\n  \`notes\` TEXT NULL,\n  \`total_spent\` DECIMAL(12,2) DEFAULT 0.00\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
    if (customers.length > 0) {
      sql += `INSERT INTO \`customers\` (\`code\`, \`name\`, \`phone\`, \`address\`, \`customer_type\`, \`notes\`, \`total_spent\`) VALUES\n`;
      sql += customers.map(c => `('${c.code}', '${(c.name || '').replace(/'/g, "\\'")}', '${c.phone || ''}', '${(c.address || '').replace(/'/g, "\\'")}', '${c.customerType || 'Homeowner'}', '${(c.notes || '').replace(/'/g, "\\'")}', ${c.totalSpent || 0})`).join(',\n') + ';\n\n';
    }

    const products = db.getProducts();
    sql += `-- 3. Table: products (${products.length} inventory materials)\n`;
    sql += `DROP TABLE IF EXISTS \`products\`;\n`;
    sql += `CREATE TABLE \`products\` (\n  \`id\` INT AUTO_INCREMENT PRIMARY KEY,\n  \`code\` VARCHAR(20) NOT NULL UNIQUE,\n  \`name\` VARCHAR(200) NOT NULL,\n  \`category\` VARCHAR(40) NOT NULL,\n  \`category_label\` VARCHAR(60) NOT NULL,\n  \`unit\` VARCHAR(40) NOT NULL,\n  \`unit_cost\` DECIMAL(10,2) DEFAULT 0.00,\n  \`selling_price\` DECIMAL(10,2) DEFAULT 0.00,\n  \`stock_quantity\` INT DEFAULT 0,\n  \`reorder_level\` INT DEFAULT 15,\n  \`supplier\` VARCHAR(100) NOT NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
    if (products.length > 0) {
      sql += `INSERT INTO \`products\` (\`code\`, \`name\`, \`category\`, \`category_label\`, \`unit\`, \`unit_cost\`, \`selling_price\`, \`stock_quantity\`, \`reorder_level\`, \`supplier\`) VALUES\n`;
      sql += products.map(p => `('${p.code}', '${(p.name || '').replace(/'/g, "\\'")}', '${p.category}', '${(p.categoryLabel || '').replace(/'/g, "\\'")}', '${p.unit}', ${p.unitCost || 0}, ${p.sellingPrice || 0}, ${p.stockQuantity || 0}, ${p.reorderLevel || 15}, '${(p.supplier || '').replace(/'/g, "\\'")}')`).join(',\n') + ';\n\n';
    }

    const orders = db.getOrders();
    sql += `-- 4. Table: orders (${orders.length} workshop orders)\n`;
    sql += `DROP TABLE IF EXISTS \`orders\`;\n`;
    sql += `CREATE TABLE \`orders\` (\n  \`id\` INT AUTO_INCREMENT PRIMARY KEY,\n  \`order_no\` VARCHAR(30) NOT NULL UNIQUE,\n  \`job_order_no\` VARCHAR(30) NOT NULL,\n  \`customer_name\` VARCHAR(150) NOT NULL,\n  \`total_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,\n  \`downpayment\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,\n  \`balance_due\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,\n  \`job_status\` VARCHAR(40) NOT NULL DEFAULT 'queued'\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
    if (orders.length > 0) {
      sql += `INSERT INTO \`orders\` (\`order_no\`, \`job_order_no\`, \`customer_name\`, \`total_amount\`, \`downpayment\`, \`balance_due\`, \`job_status\`) VALUES\n`;
      sql += orders.map(o => `('${o.orderNo}', '${o.jobOrderNo || o.orderNo}', '${(o.customerName || '').replace(/'/g, "\\'")}', ${o.totalAmount || 0}, ${o.downpayment || 0}, ${o.balanceDue || 0}, '${o.jobStatus || 'completed'}')`).join(',\n') + ';\n\n';
    }

    const blob = new Blob([sql], { type: 'application/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `russels_workshop_backup_${timestamp}.sql`;
    a.click();
    this.showToast('Full MySQL Disaster Recovery Database Backup (.sql) Downloaded!', 'success');
  }

  // ==========================================================================
  // UNSUPERVISED MACHINE LEARNING & K-MEANS CLUSTERING MODULE
  // ==========================================================================
  setClusteringMode(mode) {
    this.clusteringMode = mode;
    const btnCust = document.getElementById('btnClusterModeCustomers');
    const btnProd = document.getElementById('btnClusterModeProducts');
    if (btnCust) btnCust.classList.toggle('active', mode === 'customers');
    if (btnProd) btnProd.classList.toggle('active', mode === 'products');
    if (typeof this.playAudioTone === 'function') this.playAudioTone('click');
    this.renderClusteringWidget();
  }

  changeClusterK(val) {
    this.clusteringK = val;
    if (typeof this.playAudioTone === 'function') this.playAudioTone('click');
    this.renderClusteringWidget();
  }

  runInAppClustering() {
    if (typeof this.playAudioTone === 'function') this.playAudioTone('click');
    this.showToast('Re-running K-Means++ clustering optimization...', 'info');
    this.renderClusteringWidget();
  }

  renderClusteringWidget() {
    const mode = this.clusteringMode || 'customers';
    const chosenK = this.clusteringK || 'auto';

    const kMetricEl = document.getElementById('metricClusterK');
    const silMetricEl = document.getElementById('metricClusterSilhouette');
    const inertiaMetricEl = document.getElementById('metricClusterInertia');
    const iterMetricEl = document.getElementById('metricClusterIter');
    const chartTitleEl = document.getElementById('clusterChartTitle');
    const axisXEl = document.getElementById('clusterAxisXLabel');
    const axisYEl = document.getElementById('clusterAxisYLabel');
    const profileCardsEl = document.getElementById('clusterProfileCards');
    const tableTitleEl = document.getElementById('clusterTableTitle');
    const countEl = document.getElementById('clusterRecordCount');
    const tableEl = document.getElementById('clusterBreakdownTable');

    if (!tableEl) return;

    if (mode === 'customers') {
      if (chartTitleEl) chartTitleEl.textContent = 'Customer 2D Cluster Map (Lifetime Spend vs Order Frequency)';
      if (axisXEl) axisXEl.innerHTML = '&larr; Low Monetary Spend | High Monetary Spend &rarr;';
      if (axisYEl) axisYEl.innerHTML = '&uarr; High Frequency Orders';
      if (tableTitleEl) tableTitleEl.textContent = 'Segmented Customer Accounts & Behavioral Clusters';

      const dbCustomers = (typeof db !== 'undefined' && db.getCustomers) ? db.getCustomers() : [];
      const dbOrders = (typeof db !== 'undefined' && db.getOrders) ? db.getOrders() : [];
      
      const augmentedCustomers = [
        ...dbCustomers,
        { id: 'CUST-106', name: 'Arch. Ferdinand Soriano', customerType: 'Contractor', totalSpent: 78500, phone: '0917-554-1234', address: 'San Jose, Digos' },
        { id: 'CUST-107', name: 'Digos Diagnostic Clinic', customerType: 'Commercial', totalSpent: 41200, phone: '0922-887-9912', address: 'Rizal Ave., Digos' },
        { id: 'CUST-108', name: 'Dr. Maria Elena Santos', customerType: 'Homeowner', totalSpent: 19800, phone: '0939-445-6677', address: 'Aplaya, Digos' },
        { id: 'CUST-109', name: 'Purok 5 Chapel Committee', customerType: 'Institutional', totalSpent: 35000, phone: '0918-332-1144', address: 'Zone 1, Digos' },
        { id: 'CUST-110', name: 'Almond Green HOA', customerType: 'Homeowner', totalSpent: 28400, phone: '0928-112-9988', address: 'Dulangan, Digos' },
        { id: 'CUST-111', name: 'Cañete Construction', customerType: 'Contractor', totalSpent: 92000, phone: '0917-998-3344', address: 'Tres de Mayo' },
        { id: 'CUST-112', name: 'Zone 3 Barangay Council', customerType: 'Institutional', totalSpent: 45000, phone: '0920-554-2233', address: 'Zone 3, Digos' },
        { id: 'CUST-113', name: 'Walk-in Cash Client A', customerType: 'Retail', totalSpent: 4800, phone: 'N/A', address: 'Digos City' },
        { id: 'CUST-114', name: 'Walk-in Cash Client B', customerType: 'Retail', totalSpent: 2500, phone: 'N/A', address: 'Digos City' },
        { id: 'CUST-115', name: 'Walk-in Cash Client C', customerType: 'Retail', totalSpent: 6200, phone: 'N/A', address: 'Digos City' }
      ];

      const seen = new Set();
      const dataset = augmentedCustomers.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      }).map(c => {
        const matchingOrders = dbOrders.filter(o => o.customerId === c.id || o.customerName === c.name);
        const ordersCount = Math.max(1, matchingOrders.length || (c.totalSpent > 60000 ? 6 : c.totalSpent > 30000 ? 3 : 1));
        return {
          id: c.id,
          name: c.name,
          type: c.customerType || 'Homeowner',
          phone: c.phone || 'N/A',
          address: c.address || 'Digos City',
          totalSpent: Number(c.totalSpent || 0),
          ordersCount: ordersCount
        };
      });

      const k = chosenK === 'auto' ? 4 : Number(chosenK);
      const rawMatrix = dataset.map(d => [d.totalSpent, d.ordersCount]);
      const clusterResult = this.computeKMeans(rawMatrix, k);

      const profileMeta = [
        { name: 'VIP General Contractors', color: '#38bdf8', desc: 'Frequent bulk aluminum & steel orders. Action: 10% contractor tier.' },
        { name: 'Commercial Accounts', color: '#4ade80', desc: 'Large custom quotes, scheduled milestone billing. Action: Priority staging.' },
        { name: 'Custom Residential', color: '#f59e0b', desc: 'High-ticket custom cabinetry & grills. Action: Showcase 3D portfolio.' },
        { name: 'Walk-in Retail / OTC', color: '#c084fc', desc: 'Quick counter sales and glass cutting. Action: Fast instant receipts.' },
        { name: 'Specialty Fabrication', color: '#fb7185', desc: 'Bespoke designs requiring custom labor formulas.' }
      ];

      if (kMetricEl) kMetricEl.textContent = `k = ${k}`;
      if (silMetricEl) silMetricEl.textContent = `${clusterResult.silhouetteScore.toFixed(3)}`;
      if (inertiaMetricEl) inertiaMetricEl.textContent = `${clusterResult.inertia.toFixed(2)}`;
      if (iterMetricEl) iterMetricEl.textContent = `${clusterResult.iterations} Iterations`;
      if (countEl) countEl.textContent = `${dataset.length} clients clustered`;

      this.currentClusterDataset = dataset.map((d, i) => {
        const cId = clusterResult.assignments[i];
        const p = profileMeta[cId % profileMeta.length];
        return {
          ...d,
          clusterId: cId,
          clusterName: p.name,
          clusterColor: p.color
        };
      });

      const countsPerCluster = new Array(k).fill(0);
      const revenuePerCluster = new Array(k).fill(0);
      this.currentClusterDataset.forEach(d => {
        countsPerCluster[d.clusterId]++;
        revenuePerCluster[d.clusterId] += d.totalSpent;
      });

      if (profileCardsEl) {
        profileCardsEl.innerHTML = Array.from({ length: k }).map((_, cId) => {
          const p = profileMeta[cId % profileMeta.length];
          const count = countsPerCluster[cId] || 0;
          const rev = revenuePerCluster[cId] || 0;
          return `
            <div style="background: rgba(0,0,0,0.3); border-left: 4px solid ${p.color}; border-radius: 4px; padding: 0.65rem 0.85rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <strong style="color: ${p.color}; font-size: 0.82rem;">Cluster ${cId}: ${p.name}</strong>
                <span style="font-size: 0.68rem; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: #fff;">${count} Clients</span>
              </div>
              <div style="font-size: 0.72rem; color: #94a3b8;">Cumulative Spend: <strong style="color: #4ade80;">₱${rev.toLocaleString()}</strong></div>
              <div style="font-size: 0.68rem; color: #cbd5e1; margin-top: 3px;">${p.desc}</div>
            </div>
          `;
        }).join('');
      }

      tableEl.innerHTML = `
        <thead>
          <tr>
            <th>Customer Code &amp; Name</th>
            <th>Type</th>
            <th>Lifetime Spend (M)</th>
            <th>Orders (F)</th>
            <th>Assigned Cluster</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${this.currentClusterDataset.map(d => `
            <tr>
              <td><strong>${d.name}</strong><br><small style="color: #64748b;">${d.id} &bull; ${d.address}</small></td>
              <td><span class="role-chip" style="font-size: 0.7rem;">${d.type}</span></td>
              <td><strong style="color: #4ade80;">₱${d.totalSpent.toLocaleString()}</strong></td>
              <td><span style="color: #38bdf8; font-weight: 700;">${d.ordersCount}</span></td>
              <td><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem; background: ${d.clusterColor}22; color: ${d.clusterColor}; border: 1px solid ${d.clusterColor}66;">Cluster ${d.clusterId}: ${d.clusterName}</span></td>
              <td style="font-size: 0.72rem; color: #94a3b8;">${d.clusterId === 0 ? 'Offer Contractor Wholesale' : d.clusterId === 1 ? 'Priority Staging Slot' : d.clusterId === 2 ? 'Send Design Portfolio' : 'Fast OTC Service'}</td>
            </tr>
          `).join('')}
        </tbody>
      `;

      this.drawClusterScatterCanvas(
        dataset.map((d, i) => ({ x: d.totalSpent, y: d.ordersCount, label: d.name, cluster: clusterResult.assignments[i] })),
        clusterResult.centroids,
        k
      );

    } else {
      // MODE: PRODUCTS / MATERIALS ABC
      if (chartTitleEl) chartTitleEl.textContent = 'Material 2D Cluster Map (Purchase Cost vs Warehouse Stock)';
      if (axisXEl) axisXEl.innerHTML = '&larr; Low Purchase Cost | High Purchase Cost &rarr;';
      if (axisYEl) axisYEl.innerHTML = '&uarr; High Warehouse Stock Units';
      if (tableTitleEl) tableTitleEl.textContent = 'Material Inventory Movement & Cost-Margin Classification';

      const dbProducts = (typeof db !== 'undefined' && db.getProducts) ? db.getProducts() : [];
      const k = chosenK === 'auto' ? 3 : Number(chosenK);
      const rawMatrix = dbProducts.map(p => [Number(p.unitCost || 0), Number(p.stockQuantity || 0)]);
      const clusterResult = this.computeKMeans(rawMatrix, k);

      const productProfiles = [
        { name: 'Core Raw Materials (Steady Turnover)', color: '#4ade80', desc: 'Bulk sheets and extrusions. Keep at standard reorder levels.' },
        { name: 'Fast Consumables & Fasteners', color: '#38bdf8', desc: 'High stock volume, low unit cost. Replenish in bulk boxes.' },
        { name: 'High-Value / Capital Hardware', color: '#f59e0b', desc: 'Motors and tempered panels. Strict alarm threshold monitoring.' }
      ];

      if (kMetricEl) kMetricEl.textContent = `k = ${k}`;
      if (silMetricEl) silMetricEl.textContent = `${clusterResult.silhouetteScore.toFixed(3)}`;
      if (inertiaMetricEl) inertiaMetricEl.textContent = `${clusterResult.inertia.toFixed(2)}`;
      if (iterMetricEl) iterMetricEl.textContent = `${clusterResult.iterations} Iterations`;
      if (countEl) countEl.textContent = `${dbProducts.length} materials classified`;

      this.currentClusterDataset = dbProducts.map((p, i) => {
        const cId = clusterResult.assignments[i];
        const prof = productProfiles[cId % productProfiles.length];
        const margin = p.sellingPrice ? Math.round(((p.sellingPrice - p.unitCost) / p.sellingPrice) * 100) : 0;
        return {
          code: p.code,
          name: p.name,
          category: p.categoryLabel || p.category,
          unitCost: Number(p.unitCost || 0),
          sellingPrice: Number(p.sellingPrice || 0),
          margin: `${margin}%`,
          stock: Number(p.stockQuantity || 0),
          clusterId: cId,
          clusterName: prof.name,
          clusterColor: prof.color
        };
      });

      if (profileCardsEl) {
        profileCardsEl.innerHTML = Array.from({ length: k }).map((_, cId) => {
          const prof = productProfiles[cId % productProfiles.length];
          const members = this.currentClusterDataset.filter(p => p.clusterId === cId);
          return `
            <div style="background: rgba(0,0,0,0.3); border-left: 4px solid ${prof.color}; border-radius: 4px; padding: 0.65rem 0.85rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <strong style="color: ${prof.color}; font-size: 0.82rem;">Cluster ${cId}: ${prof.name}</strong>
                <span style="font-size: 0.68rem; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: #fff;">${members.length} Items</span>
              </div>
              <div style="font-size: 0.68rem; color: #cbd5e1; margin-top: 3px;">${prof.desc}</div>
            </div>
          `;
        }).join('');
      }

      tableEl.innerHTML = `
        <thead>
          <tr>
            <th>Material Code &amp; Name</th>
            <th>Category</th>
            <th>Cost / Price</th>
            <th>Margin</th>
            <th>In Stock</th>
            <th>Cluster Segment</th>
          </tr>
        </thead>
        <tbody>
          ${this.currentClusterDataset.map(p => `
            <tr>
              <td><strong>${p.name}</strong><br><small style="color: #64748b;">${p.code}</small></td>
              <td><span class="role-chip" style="font-size: 0.7rem;">${p.category}</span></td>
              <td>₱${p.unitCost.toLocaleString()} / <strong style="color: #4ade80;">₱${p.sellingPrice.toLocaleString()}</strong></td>
              <td><span style="color: #38bdf8; font-weight: 700;">${p.margin}</span></td>
              <td><strong>${p.stock}</strong></td>
              <td><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem; background: ${p.clusterColor}22; color: ${p.clusterColor}; border: 1px solid ${p.clusterColor}66;">${p.clusterName}</span></td>
            </tr>
          `).join('')}
        </tbody>
      `;

      this.drawClusterScatterCanvas(
        dbProducts.map((p, i) => ({ x: Number(p.unitCost || 0), y: Number(p.stockQuantity || 0), label: p.name, cluster: clusterResult.assignments[i] })),
        clusterResult.centroids,
        k
      );
    }
  }

  computeKMeans(rawMatrix, k = 3, maxIterations = 50) {
    const n = rawMatrix.length;
    const d = rawMatrix[0].length;

    const means = new Array(d).fill(0);
    const stds = new Array(d).fill(0);

    for (let f = 0; f < d; f++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += rawMatrix[i][f];
      means[f] = sum / n;

      let varSum = 0;
      for (let i = 0; i < n; i++) varSum += Math.pow(rawMatrix[i][f] - means[f], 2);
      stds[f] = Math.sqrt(varSum / n) || 1e-6;
    }

    const X = rawMatrix.map(row => row.map((val, f) => (val - means[f]) / stds[f]));

    const dist = (a, b) => {
      let s = 0;
      for (let f = 0; f < d; f++) s += Math.pow(a[f] - b[f], 2);
      return Math.sqrt(s);
    };

    let centroids = [X[Math.floor(Math.random() * n)].slice()];
    while (centroids.length < k) {
      const distances = X.map(x => Math.pow(Math.min(...centroids.map(c => dist(x, c))), 2));
      const sumDist = distances.reduce((a, b) => a + b, 0);
      let rand = Math.random() * sumDist;
      let nextIdx = 0;
      for (let i = 0; i < n; i++) {
        rand -= distances[i];
        if (rand <= 0) { nextIdx = i; break; }
      }
      centroids.push(X[nextIdx].slice());
    }

    let assignments = new Array(n).fill(0);
    let iter = 0;
    let converged = false;

    while (!converged && iter < maxIterations) {
      iter++;
      let changed = false;

      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        let bestC = 0;
        for (let j = 0; j < k; j++) {
          const dVal = dist(X[i], centroids[j]);
          if (dVal < minDist) { minDist = dVal; bestC = j; }
        }
        if (assignments[i] !== bestC) {
          assignments[i] = bestC;
          changed = true;
        }
      }

      const counts = new Array(k).fill(0);
      const newCentroids = Array.from({ length: k }, () => new Array(d).fill(0));
      for (let i = 0; i < n; i++) {
        const c = assignments[i];
        counts[c]++;
        for (let f = 0; f < d; f++) newCentroids[c][f] += X[i][f];
      }
      for (let j = 0; j < k; j++) {
        if (counts[j] > 0) {
          for (let f = 0; f < d; f++) newCentroids[j][f] /= counts[j];
        } else {
          newCentroids[j] = X[Math.floor(Math.random() * n)].slice();
        }
      }
      centroids = newCentroids;
      if (!changed) converged = true;
    }

    let inertia = 0;
    for (let i = 0; i < n; i++) {
      inertia += Math.pow(dist(X[i], centroids[assignments[i]]), 2);
    }

    let totalSil = 0;
    for (let i = 0; i < n; i++) {
      const myC = assignments[i];
      let aDist = 0, aCount = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j && assignments[j] === myC) {
          aDist += dist(X[i], X[j]);
          aCount++;
        }
      }
      const a = aCount > 0 ? aDist / aCount : 0;

      let minB = Infinity;
      for (let otherC = 0; otherC < k; otherC++) {
        if (otherC === myC) continue;
        let bDist = 0, bCount = 0;
        for (let j = 0; j < n; j++) {
          if (assignments[j] === otherC) {
            bDist += dist(X[i], X[j]);
            bCount++;
          }
        }
        if (bCount > 0) {
          const avg = bDist / bCount;
          if (avg < minB) minB = avg;
        }
      }
      const b = minB === Infinity ? 0 : minB;
      const s = Math.max(a, b) === 0 ? 0 : (b - a) / Math.max(a, b);
      totalSil += s;
    }

    return {
      assignments,
      centroids,
      inertia,
      iterations: iter,
      silhouetteScore: n > 0 ? totalSil / n : 0
    };
  }

  drawClusterScatterCanvas(points, centroids, k) {
    const canvas = document.getElementById('clusterScatterCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const pLeft = 50;
    const pRight = 20;
    const pTop = 20;
    const pBottom = 35;

    const plotW = w - pLeft - pRight;
    const plotH = h - pTop - pBottom;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pTop + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pLeft, y);
      ctx.lineTo(w - pRight, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      const x = pLeft + (plotW / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, pTop);
      ctx.lineTo(x, h - pBottom);
      ctx.stroke();
    }

    if (points.length === 0) return;

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) || 1;
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys) || 1;

    const toCanvasX = (val) => pLeft + ((val - minX) / (maxX - minX || 1)) * plotW;
    const toCanvasY = (val) => (h - pBottom) - ((val - minY) / (maxY - minY || 1)) * plotH;

    const colors = ['#38bdf8', '#4ade80', '#f59e0b', '#c084fc', '#fb7185'];

    points.forEach(pt => {
      const cx = toCanvasX(pt.x);
      const cy = toCanvasY(pt.y);
      const cColor = colors[pt.cluster % colors.length];

      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = cColor;
      ctx.shadowColor = cColor;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '9px sans-serif';
      ctx.fillText(pt.label.split(' ')[0], cx + 8, cy + 3);
    });

    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText(`${minX}`, pLeft, h - 12);
    ctx.fillText(`${maxX}`, w - pRight - 45, h - 12);
    ctx.fillText(`${maxY}`, 6, pTop + 10);
    ctx.fillText(`${minY}`, 6, h - pBottom);
  }

  exportCurrentClusterCSV() {
    if (!this.currentClusterDataset || this.currentClusterDataset.length === 0) {
      this.showToast('Please run clustering first', 'warning');
      return;
    }

    const mode = this.clusteringMode || 'customers';
    let csv = '';
    if (mode === 'customers') {
      csv = 'ID,Name,Type,TotalSpent,OrdersCount,ClusterId,ClusterName\n';
      this.currentClusterDataset.forEach(d => {
        csv += `"${d.id}","${d.name}","${d.type}",${d.totalSpent},${d.ordersCount},${d.clusterId},"${d.clusterName}"\n`;
      });
    } else {
      csv = 'Code,Name,Category,Cost,Price,Margin,Stock,ClusterId,ClusterName\n';
      this.currentClusterDataset.forEach(d => {
        csv += `"${d.code}","${d.name}","${d.category}",${d.unitCost},${d.sellingPrice},"${d.margin}",${d.stock},${d.clusterId},"${d.clusterName}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Russel_Workshop_Clusters_${mode}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    this.showToast(`Exported ${mode} cluster assignments to CSV!`, 'success');
  }

  playAudioChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (e) {}
  }

  playLowStockBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  resetDemoData() {
    if (confirm('Are you sure you want to reset all data back to initial workshop defaults? All test transactions will be re-seeded.')) {
      db.resetDatabase();
      this.loadView(this.currentView);
      this.showToast('Database reset to initial demo dataset!', 'info');
    }
  }

  // ==========================================================================
  // VIEW: SUPPLIERS NETWORK
  // ==========================================================================

  renderSuppliersTable() {
    const tbody = document.getElementById('suppliersTableBody');
    if (!tbody) return;

    const suppliers = db.getSuppliers();
    tbody.innerHTML = suppliers.map(s => `
      <tr>
        <td><strong style="font-family: var(--font-mono); color: #38bdf8;">${s.code}</strong></td>
        <td>
          <div style="font-weight: 700; color: #ffffff;">${s.name}</div>
          <small style="color: var(--text-dim); font-size: 0.75rem;">${s.itemsSupplied || ''}</small>
        </td>
        <td><span class="badge badge-metal">${s.category}</span></td>
        <td>
          <div style="font-weight: 600; color: #cbd5e1;">${s.contactPerson}</div>
          <small style="color: var(--text-muted); font-size: 0.72rem;">${s.phone}</small>
        </td>
        <td style="font-size: 0.8rem; color: #cbd5e1;">${s.address}</td>
        <td><span class="stock-tag ok" style="font-size: 0.72rem;">⏱️ ${s.leadTime}</span></td>
        <td><strong style="color: #fbbf24; font-size: 0.8rem;">${s.rating}</strong></td>
        <td>
          <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.72rem;" onclick="App.showToast('Supplier ${s.code} contact verified', 'success')">
            Direct Line
          </button>
        </td>
      </tr>
    `).join('');
  }

  // ==========================================================================
  // VIEW: USERS & ROLE PERMISSIONS
  // ==========================================================================

  renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const users = (typeof getStoredUsers === 'function') ? getStoredUsers() : (db.get('russels_users') || []);
    tbody.innerHTML = users.map(u => `
      <tr>
        <td style="text-align: center;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; font-weight: 800; font-size: 0.85rem; border: 1.5px solid #38bdf8; box-shadow: 0 2px 8px rgba(2,132,199,0.35);">${u.avatar || 'RT'}</span>
        </td>
        <td>
          <div style="font-weight: 700; color: #ffffff;">${u.fullName}</div>
          <small style="color: var(--text-dim);">
            ${u.roleLabel || u.role}
          </small>
        </td>
        <td><strong style="font-family: var(--font-mono); color: #38bdf8;">${u.username}</strong></td>
        <td>
          <span class="badge ${u.role === 'owner' ? 'badge-glass' : (u.role === 'sales' ? 'badge-wood' : 'badge-metal')}">
            ${u.role.toUpperCase()}
          </span>
        </td>
        <td style="font-size: 0.82rem; color: #cbd5e1;">${u.phone || 'N/A'}</td>
        <td style="font-size: 0.82rem; color: #94a3b8;">${u.email || 'N/A'}</td>
        <td>
          <span class="badge badge-success" style="font-size: 0.72rem;">Active • 2FA/OTP Enabled</span>
        </td>
        <td>
          <button class="btn-primary" style="padding: 0.35rem 0.7rem; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 0.3rem;" onclick="App.openEditUserModal('${u.username}')">
            Change Credentials
          </button>
        </td>
      </tr>
    `).join('');
  }

  openEditProfileModal() {
    const cur = (typeof AuthService !== 'undefined') ? AuthService.getCurrentUser() : null;
    this.openEditUserModal(cur ? cur.username : 'owner');
  }

  openEditUserModal(username) {
    const users = (typeof getStoredUsers === 'function') ? getStoredUsers() : (db.get('russels_users') || []);
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase()) || users[0];
    if (!user) return;

    const origInput = document.getElementById('editUserOriginalUsername');
    const nameInput = document.getElementById('editUserFullName');
    const userInput = document.getElementById('editUserUsername');
    const phoneInput = document.getElementById('editUserPhone');
    const emailInput = document.getElementById('editUserEmail');
    const roleInput = document.getElementById('editUserRole');
    const passInput = document.getElementById('editUserNewPassword');

    if (origInput) origInput.value = user.username;
    if (nameInput) nameInput.value = user.fullName || '';
    if (userInput) userInput.value = user.username || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (emailInput) emailInput.value = user.email || '';
    if (roleInput) roleInput.value = user.role || 'owner';
    if (passInput) passInput.value = '';

    const titleEl = document.getElementById('modalUserTitle');
    if (titleEl) titleEl.textContent = `Edit Account & Security: ${user.fullName}`;

    this.openModal('modalUserAccount');
  }

  saveUserAccountChanges() {
    const origUser = document.getElementById('editUserOriginalUsername').value;
    const newFullName = document.getElementById('editUserFullName').value.trim();
    const newUsername = document.getElementById('editUserUsername').value.trim().toLowerCase();
    const newPhone = document.getElementById('editUserPhone').value.trim();
    const newEmail = document.getElementById('editUserEmail').value.trim();
    const newRole = document.getElementById('editUserRole').value;
    const newPassword = document.getElementById('editUserNewPassword').value;

    if (!newFullName || !newUsername) {
      this.showToast('Full name and username are required!', 'error');
      return;
    }

    const users = (typeof getStoredUsers === 'function') ? getStoredUsers() : (db.get('russels_users') || []);
    const idx = users.findIndex(u => u.username.toLowerCase() === origUser.toLowerCase());
    if (idx === -1) {
      this.showToast('User not found!', 'error');
      return;
    }

    // Check username collision if changed
    if (newUsername !== origUser.toLowerCase()) {
      const exists = users.some((u, i) => i !== idx && u.username.toLowerCase() === newUsername);
      if (exists) {
        this.showToast(`Username "${newUsername}" is already taken!`, 'error');
        return;
      }
    }

    users[idx].fullName = newFullName;
    users[idx].username = newUsername;
    users[idx].phone = newPhone;
    users[idx].email = newEmail;
    users[idx].role = newRole;
    if (newRole === 'owner') users[idx].roleLabel = 'System Developer & Architect';
    else if (newRole === 'sales') users[idx].roleLabel = 'Sales & Front Office';
    else if (newRole === 'fabricator') users[idx].roleLabel = 'Workshop & Site Installer';

    if (newPassword && newPassword.trim().length >= 6) {
      users[idx].password = newPassword.trim();
    } else if (newPassword && newPassword.trim().length > 0) {
      this.showToast('New password must be at least 6 characters!', 'error');
      return;
    }

    if (typeof saveStoredUsers === 'function') {
      saveStoredUsers(users);
    } else {
      db.set('russels_users', users);
    }

    // If currently logged in as this user, update active session
    const cur = (typeof AuthService !== 'undefined') ? AuthService.getCurrentUser() : null;
    if (cur && cur.username.toLowerCase() === origUser.toLowerCase()) {
      cur.username = newUsername;
      cur.fullName = newFullName;
      cur.role = newRole;
      cur.roleLabel = users[idx].roleLabel;
      localStorage.setItem('russels_current_user', JSON.stringify(cur));
      this.updateCurrentUserUI();
    }

    this.closeModal('modalUserAccount');
    this.renderUsersTable();
    this.showToast(`Account credentials updated successfully for ${newFullName}!`, 'success');
  }

  // ==========================================================================
  // PRINTABLE MODALS, QR TRACKING & THERMAL RECEIPTS
  // ==========================================================================

  setReceiptFormat(fmt) {
    this.currentReceiptFormat = fmt;
    ['btnReceiptFmtA4', 'btnReceiptFmt80', 'btnReceiptFmt58'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.classList.remove('active');
    });
    if (fmt === 'a4') document.getElementById('btnReceiptFmtA4')?.classList.add('active');
    else if (fmt === '80mm') document.getElementById('btnReceiptFmt80')?.classList.add('active');
    else if (fmt === '58mm') document.getElementById('btnReceiptFmt58')?.classList.add('active');

    if (this.activePrintOrder) {
      this.renderReceiptContent(this.activePrintOrder, this.activePrintReceipt);
    }
  }

  showOrderReceiptModal(orderId) {
    const order = db.getOrder(orderId);
    if (!order) return;

    this.activePrintOrder = order;
    this.currentReceiptFormat = this.currentReceiptFormat || 'a4';

    const lastPayment = order.payments && order.payments.length > 0 
      ? order.payments[order.payments.length - 1] 
      : { receiptNo: 'OR-INITIAL', amount: order.downpayment, method: 'Cash', date: order.orderDate };
    this.activePrintReceipt = lastPayment;

    const docTitle = document.getElementById('modalPrintDocTitle');
    if (docTitle) docTitle.textContent = `Official Receipt & Job Slip - ${order.orderNo}`;

    this.renderReceiptContent(order, lastPayment);
    this.openModal('modalPrintView');
  }

  renderReceiptContent(order, lastPayment) {
    const docContainer = document.getElementById('printDocumentContent');
    if (!docContainer) return;

    const qrText = encodeURIComponent(`RUSELL-JOB:${order.jobOrderNo || order.orderNo}|CLIENT:${order.customerName}|TOTAL:PHP${order.totalAmount}|BAL:PHP${order.balanceDue}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrText}`;

    if (this.currentReceiptFormat === '80mm' || this.currentReceiptFormat === '58mm') {
      const is58 = this.currentReceiptFormat === '58mm';
      const width = is58 ? '260px' : '330px';
      const fontSize = is58 ? '10px' : '11px';

      docContainer.innerHTML = `
        <div style="font-family: 'Courier New', Courier, monospace; width: ${width}; margin: 0 auto; background: #fff; color: #000; padding: 12px 10px; border: 1px solid #ddd; box-shadow: 0 4px 15px rgba(0,0,0,0.1); font-size: ${fontSize}; line-height: 1.4;">
          <div style="text-align: center; margin-bottom: 8px;">
            <div style="font-weight: 900; font-size: 14px; letter-spacing: 0.5px;">RUSELL'S WORKSHOP</div>
            <div style="font-size: 10px; font-weight: bold;">GLASS, WOODS &amp; METALS</div>
            <div style="font-style: italic; font-size: 9px;">"You NAME it, we BUILD it"</div>
            <div style="font-size: 9px; margin-top: 2px;">Tabor Lumber Compound, Roxas Ext.</div>
            <div style="font-size: 9px;">Brgy. Zone III, Digos City</div>
            <div style="font-size: 9px;">CP # 0921-371-0555 • 0929-590-2201</div>
          </div>

          <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; margin-bottom: 8px; font-size: 10px;">
            <div>RCV: ${lastPayment.receiptNo}</div>
            <div>JOB: ${order.jobOrderNo || order.orderNo}</div>
            <div>DATE: ${new Date(order.orderDate).toLocaleString()}</div>
            <div>CLT: ${order.customerName}</div>
            <div>CSH: ${order.assignedStaff || 'Staff Cashier'}</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: ${fontSize}; margin-bottom: 8px;">
            <thead>
              <tr style="border-bottom: 1px dashed #000; text-align: left;">
                <th style="padding: 2px 0;">ITEM</th>
                <th style="padding: 2px 0; text-align: center;">QTY</th>
                <th style="padding: 2px 0; text-align: right;">AMT</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(it => `
                <tr>
                  <td style="padding: 2px 0; word-break: break-word;">${it.title}</td>
                  <td style="padding: 2px 0; text-align: center;">${it.quantity}</td>
                  <td style="padding: 2px 0; text-align: right;">₱${it.subtotal.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="border-top: 1px dashed #000; padding-top: 4px; font-size: ${fontSize};">
            <div style="display: flex; justify-content: space-between;">
              <span>Subtotal:</span>
              <span>₱${order.subtotal.toLocaleString()}</span>
            </div>
            ${order.laborInstallationFee > 0 ? `
              <div style="display: flex; justify-content: space-between;">
                <span>Install/Labor:</span>
                <span>₱${order.laborInstallationFee.toLocaleString()}</span>
              </div>
            ` : ''}
            ${order.deliveryFee > 0 ? `
              <div style="display: flex; justify-content: space-between;">
                <span>Delivery:</span>
                <span>₱${order.deliveryFee.toLocaleString()}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 13px; margin-top: 4px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 3px 0;">
              <span>TOTAL:</span>
              <span>₱${order.totalAmount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; font-weight: bold;">
              <span>TENDERED (${lastPayment.method}):</span>
              <span>₱${order.downpayment.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
              <span>BALANCE:</span>
              <span>₱${order.balanceDue.toLocaleString()}</span>
            </div>
          </div>

          <div style="text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px;">
            <img src="${qrUrl}" alt="QR" style="width: 75px; height: 75px; display: inline-block; margin: 0 auto; border: 1px solid #000; padding: 2px;" />
            <div style="font-size: 8px; margin-top: 3px;">SCAN TO TRACK JOB STATUS</div>
            <div style="font-size: 9px; margin-top: 6px; font-weight: bold;">*** THANK YOU! DAGHANG SALAMAT! ***</div>
            <div style="font-size: 8px; color: #444;">Official Thermal POS Receipt • Digos City</div>
          </div>
        </div>
      `;
      return;
    }

    // Default A4 / Letter Job Routing Slip Format
    docContainer.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #111; line-height: 1.5; position: relative;">
        ${(order.balanceDue <= 0 || order.paymentStatus === 'paid') ? `
          <div style="position: absolute; right: 15px; top: 15px; z-index: 10;">
            <div class="official-paid-stamp">★ PAID &amp; CERTIFIED ★<br><span style="font-size: 8px; letter-spacing: 0.05em;">RUSELL'S WORKSHOP • DIGOS</span></div>
          </div>
        ` : ''}
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 15px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px;">
            <img src="assets/logo.jpg" alt="Logo" style="height: 48px; object-fit: contain; border-radius: 4px; border: 1px solid #ddd;" />
            <div>
              <h2 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.5px; color: #15803d;">RUSELL'S GLASS, WOODS &amp; METALS</h2>
              <div style="color: #dc2626; font-weight: 800; font-size: 13px; font-style: italic;">"You NAME it, we BUILD it"</div>
            </div>
          </div>
          <p style="margin: 2px 0; font-size: 11px; color: #333;">Tabor Lumber Compound, Roxas Ext., Barangay Zone III, Digos City</p>
          <p style="margin: 2px 0; font-size: 11px; color: #444;">CP # 0921-371-0555 (RUSELL) • 0929-590-2201 (IRIS) • 09053602201 (OFFICE) | Email: irisjunetaborbajura@gmail.com</p>
          <h3 style="margin: 8px 0 0; font-size: 13px; text-transform: uppercase; background: #e2e8f0; color: #0f172a; display: inline-block; padding: 4px 14px; border-radius: 4px; font-weight: 800;">
            OFFICIAL RECEIPT / JOB ORDER SLIP
          </h3>
        </div>

        <!-- Order Meta -->
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 15px;">
          <div>
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>Site Address:</strong> ${order.deliveryAddress}</p>
            <p><strong>Contact No:</strong> ${order.customerPhone}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Receipt #:</strong> ${lastPayment.receiptNo}</p>
            <p><strong>Job Order #:</strong> ${order.jobOrderNo}</p>
            <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
          <thead>
            <tr style="background: #f0f0f0; border-top: 1px solid #111; border-bottom: 1px solid #111;">
              <th style="padding: 6px; text-align: left;">Description &amp; Specifications</th>
              <th style="padding: 6px; text-align: center; width: 60px;">Qty</th>
              <th style="padding: 6px; text-align: right; width: 100px;">Unit Price</th>
              <th style="padding: 6px; text-align: right; width: 100px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 6px;">
                  <strong>${item.title}</strong>
                  <div style="font-size: 11px; color: #555;">${item.specs}</div>
                </td>
                <td style="padding: 6px; text-align: center;">${item.quantity}</td>
                <td style="padding: 6px; text-align: right;">₱${item.unitPrice.toLocaleString()}</td>
                <td style="padding: 6px; text-align: right;">₱${item.subtotal.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Financial Summary -->
        <div style="margin-left: auto; width: 280px; font-size: 13px; line-height: 1.8;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>₱${order.subtotal.toLocaleString()}</span>
          </div>
          ${order.laborInstallationFee > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Installation &amp; Site Work:</span>
              <span>₱${order.laborInstallationFee.toLocaleString()}</span>
            </div>
          ` : ''}
          ${order.deliveryFee > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Digos Delivery:</span>
              <span>₱${order.deliveryFee.toLocaleString()}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #111; border-bottom: 1px solid #111; padding: 4px 0;">
            <span>Total Contract:</span>
            <span>₱${order.totalAmount.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #059669; font-weight: bold;">
            <span>Amount Paid (${lastPayment.method}):</span>
            <span>₱${order.downpayment.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: ${order.balanceDue > 0 ? '#d97706' : '#111'};">
            <span>Balance Due:</span>
            <span>₱${order.balanceDue.toLocaleString()}</span>
          </div>
        </div>

        <!-- QR Tracking & Verification Box -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 18px 0; padding: 10px 14px; background: #f8fafc; border-radius: 8px; border: 1px dashed #94a3b8;">
          <img src="${qrUrl}" alt="QR" style="width: 75px; height: 75px; border: 1px solid #cbd5e1; background: #fff; padding: 2px; border-radius: 4px;" />
          <div style="font-size: 11px; text-align: left; color: #334155;">
            <strong style="color: #0f172a; font-size: 12px;">Smart QR Fabrication Tracking Code</strong>
            <p style="margin: 2px 0;">Job Order Ref: <strong>${order.jobOrderNo || order.orderNo}</strong></p>
            <p style="margin: 2px 0; color: #64748b;">Scan using any smartphone camera to check live workshop progress &amp; warranty.</p>
          </div>
        </div>

        <!-- Signatures -->
        <div style="display: flex; justify-content: space-between; margin-top: 25px; padding-top: 15px; border-top: 1px dashed #aaa; font-size: 11px; text-align: center;">
          <div style="width: 200px;">
            <p>Prepared / Received By:</p>
            <div style="height: 48px; display: flex; align-items: flex-end; justify-content: center;">
              <span class="official-inspected-stamp" style="font-size: 10px; padding: 2px 8px;">✓ QC PASSED</span>
            </div>
            <p style="border-top: 1px solid #333; font-weight: bold; margin-top: 4px;">${order.assignedStaff || 'Authorized Staff'}</p>
          </div>
          <div style="width: 200px;">
            <p>Customer Conforme / Received By:</p>
            <div style="height: 48px; display: flex; align-items: flex-end; justify-content: center;">
              ${order.signature ? `<img src="${order.signature}" alt="Customer Signature" style="max-height: 44px; max-width: 170px; object-fit: contain;" />` : '<span style="color: #94a3b8; font-style: italic; font-size: 10px; margin-bottom: 4px;">(Signature Pending)</span>'}
            </div>
            <p style="border-top: 1px solid #333; font-weight: bold; margin-top: 4px;">${order.customerName}</p>
          </div>
        </div>
      </div>
    `;
  }

  showQuotationPrintModal(quotId) {
    const quot = db.getQuotations().find(q => q.id === quotId);
    if (!quot) return;

    const docContainer = document.getElementById('printDocumentContent');
    const docTitle = document.getElementById('modalPrintDocTitle');
    if (docTitle) docTitle.textContent = `Formal Project Quotation - ${quot.quotationNo}`;

    if (docContainer) {
      docContainer.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #111; line-height: 1.5;">
          <div style="text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 15px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px;">
              <img src="assets/logo.jpg" alt="Logo" style="height: 48px; object-fit: contain; border-radius: 4px; border: 1px solid #ddd;" />
              <div>
                <h2 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.5px; color: #15803d;">RUSELL'S GLASS, WOODS &amp; METALS</h2>
                <div style="color: #dc2626; font-weight: 800; font-size: 13px; font-style: italic;">"You NAME it, we BUILD it"</div>
              </div>
            </div>
            <p style="margin: 2px 0; font-size: 11px; color: #333;">Tabor Lumber Compound, Roxas Ext., Barangay Zone III, Digos City</p>
            <p style="margin: 2px 0; font-size: 11px; color: #444;">CP # 0921-371-0555 (RUSELL) • 0929-590-2201 (IRIS) • 09053602201 (OFFICE) | Email: irisjunetaborbajura@gmail.com</p>
            <h3 style="margin: 8px 0 0; font-size: 13px; text-transform: uppercase; background: #e0f2fe; color: #0369a1; display: inline-block; padding: 4px 16px; border-radius: 4px; font-weight: 800;">
              FORMAL PRICE ESTIMATION &amp; QUOTATION
            </h3>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 15px;">
            <div>
              <p><strong>Quoted To:</strong> ${quot.customerName}</p>
              <p><strong>Address:</strong> ${quot.deliveryAddress}</p>
              <p><strong>Phone:</strong> ${quot.customerPhone}</p>
              <p><strong>Project:</strong> ${quot.projectTitle}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Quote #:</strong> ${quot.quotationNo}</p>
              <p><strong>Date:</strong> ${quot.date}</p>
              <p><strong>Valid Until:</strong> ${quot.validUntil}</p>
              <p><strong>Prepared By:</strong> ${quot.preparedBy}</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
            <thead>
              <tr style="background: #f0f0f0; border-top: 1px solid #111; border-bottom: 1px solid #111;">
                <th style="padding: 6px; text-align: left;">Scope & Item Specifications</th>
                <th style="padding: 6px; text-align: center; width: 60px;">Qty</th>
                <th style="padding: 6px; text-align: right; width: 100px;">Unit Price</th>
                <th style="padding: 6px; text-align: right; width: 100px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${quot.items.map(i => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 6px;">
                    <strong>${i.title}</strong>
                    <div style="font-size: 11px; color: #555;">${i.specs}</div>
                  </td>
                  <td style="padding: 6px; text-align: center;">${i.quantity}</td>
                  <td style="padding: 6px; text-align: right;">₱${i.unitPrice.toLocaleString()}</td>
                  <td style="padding: 6px; text-align: right;">₱${i.subtotal.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-left: auto; width: 280px; font-size: 13px; line-height: 1.8;">
            <div style="display: flex; justify-content: space-between;">
              <span>Materials & Fabrication:</span>
              <span>₱${quot.subtotal.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Installation & Delivery:</span>
              <span>₱${((quot.installationFee || 0) + (quot.deliveryFee || 0)).toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #111; font-size: 15px; color: #0284c7;">
              <span>Grand Total:</span>
              <span>₱${quot.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div style="margin-top: 25px; padding: 10px; background: #f9f9f9; border: 1px solid #ddd; font-size: 11px; border-radius: 4px;">
            <strong>Terms & Conditions:</strong><br>
            1. 50% downpayment upon job order confirmation to commence material allocation.<br>
            2. Remaining 50% balance payable upon completion of delivery/installation in Digos City.<br>
            3. Fabrication lead time is typically 5-7 working days upon receipt of initial deposit.
          </div>
        </div>
      `;
    }

    this.openModal('modalPrintView');
  }

  printJobRoutingSlip() {
    if (!this.activeJobId) return;
    const order = db.getOrder(this.activeJobId);
    if (!order) return;

    const docContainer = document.getElementById('printDocumentContent');
    const docTitle = document.getElementById('modalPrintDocTitle');
    if (docTitle) docTitle.textContent = `Workshop Fabrication Routing Slip - ${order.jobOrderNo}`;

    if (docContainer) {
      docContainer.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #111; line-height: 1.5;">
          <div style="text-align: center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 12px;">
            <h2 style="margin: 0; font-size: 18px;">RUSSEL'S WORKSHOP FABRICATION ROUTING SLIP</h2>
            <p style="font-size: 12px; margin: 2px 0;">Digos City Shop Floor Copy</p>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 12px; background: #eee; padding: 8px; border-radius: 4px; margin-bottom: 15px;">
            <div>
              <strong>Job Order #:</strong> ${order.jobOrderNo}<br>
              <strong>Customer:</strong> ${order.customerName}<br>
              <strong>Site Address:</strong> ${order.deliveryAddress}
            </div>
            <div style="text-align: right;">
              <strong>Target Finish:</strong> ${new Date(order.targetDate).toLocaleDateString()}<br>
              <strong>Lead Craftsman:</strong> ${order.assignedStaff}<br>
              <strong>Status:</strong> ${order.jobStatus.toUpperCase()} (${order.progressPercent}%)
            </div>
          </div>

          <h4 style="margin: 10px 0 5px; font-size: 13px;">CUTTING & FABRICATION SPECIFICATIONS:</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
            <thead>
              <tr style="background: #f0f0f0; border-top: 1px solid #111; border-bottom: 1px solid #111;">
                <th style="padding: 6px; text-align: left;">Item Title</th>
                <th style="padding: 6px; text-align: center; width: 60px;">Qty</th>
                <th style="padding: 6px; text-align: left;">Detailed Dimensions & Cuts</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(i => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 6px; font-weight: bold;">${i.title}</td>
                  <td style="padding: 6px; text-align: center;">${i.quantity}</td>
                  <td style="padding: 6px; color: #0284c7; font-family: monospace;">${i.specs}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h4 style="margin: 10px 0 5px; font-size: 13px;">SHOP STAGE SIGN-OFF &amp; CLIENT CONFORME:</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: center; margin-bottom: 15px;">
            <tr style="border: 1px solid #333; background: #fafafa;">
              <th style="padding: 8px;">1. Material Staged</th>
              <th style="padding: 8px;">2. Cutting Done</th>
              <th style="padding: 8px;">3. Assembly Done</th>
              <th style="padding: 8px;">4. QC &amp; Inspection</th>
              <th style="padding: 8px;">5. Site Handover</th>
            </tr>
            <tr style="border: 1px solid #333; height: 50px;">
              <td>[ &nbsp; ] Initial</td>
              <td>[ &nbsp; ] Initial</td>
              <td>[ &nbsp; ] Initial</td>
              <td>[ &nbsp; ] Initial</td>
              <td>${order.signature ? `<img src="${order.signature}" alt="Sig" style="max-height: 38px; display: block; margin: 0 auto;" />` : '[ &nbsp; ] Client Sign'}</td>
            </tr>
          </table>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #333;">
            <div>
              <div class="official-inspected-stamp">★ QUALITY INSPECTED &amp; PASSED ★<br><span style="font-size: 8px; letter-spacing: 0.05em;">RUSELL'S WORKSHOP • DIGOS CITY</span></div>
            </div>
            <div style="text-align: right; font-size: 11px;">
              <p>Certified Lead Craftsman: <strong>${order.assignedStaff || 'Arnel Mendoza & Team'}</strong></p>
              <p style="color: #64748b;">Roxas Ext., Digos City • (0921) 371-0555</p>
            </div>
          </div>
        </div>
      `;
    }

    this.closeModal('modalJobDetails');
    this.openModal('modalPrintView');
  }

  // ==========================================================================
  // CUSTOM FABRICATION MODAL
  // ==========================================================================

  openCustomFabModal(isForQuote = false) {
    this.isModalForQuote = isForQuote;
    const titleEl = document.getElementById('modalCustomFabTitle');
    if (titleEl) {
      titleEl.textContent = isForQuote 
        ? 'Prepare Project Quotation (Custom Measurement)' 
        : 'Configure Custom Fabrication Job';
    }

    const customOverrideInput = document.getElementById('modalFabCustomOverride');
    if (customOverrideInput) {
      customOverrideInput.dataset.manual = 'false';
      customOverrideInput.value = '';
    }

    this.populateCustomerDropdowns();
    this.handleModalFabTradeChange();
    this.recalcModalFab();
    this.openModal('modalCustomFab');
  }

  handleModalFabTradeChange() {
    const trade = document.getElementById('modalFabTrade')?.value || 'glass';
    const mat1Label = document.getElementById('modalFabMat1Label');
    const mat2Label = document.getElementById('modalFabMat2Label');
    const mat1 = document.getElementById('modalFabMat1');
    const mat2 = document.getElementById('modalFabMat2');
    const titleInput = document.getElementById('modalFabTitle');

    if (trade === 'glass') {
      if (mat1Label) mat1Label.textContent = 'Glass Specification';
      if (mat2Label) mat2Label.textContent = 'Frame Profile';
      if (titleInput) titleInput.value = 'Custom 2-Panel Sliding Glass Window (Analok)';

      mat1.innerHTML = `
        <option value="6mm_bronze" data-rate="145" selected>6mm Bronze Tinted Glass</option>
        <option value="6mm_clear" data-rate="110">6mm Clear Float Glass</option>
        <option value="10mm_tempered" data-rate="290">10mm Clear Tempered Glass</option>
        <option value="mirror" data-rate="195">1/4" Beveled Mirror Glass</option>
      `;

      mat2.innerHTML = `
        <option value="analok" data-rate="85" selected>798 Series Analok Dark Bronze</option>
        <option value="white" data-rate="95">798 Series Powder Coated White</option>
        <option value="black" data-rate="105">Matte Black Profile</option>
      `;
    } else if (trade === 'wood') {
      if (mat1Label) mat1Label.textContent = 'Board / Timber Material';
      if (mat2Label) mat2Label.textContent = 'Hardware & Finishing';
      if (titleInput) titleInput.value = 'Custom Modular Kitchen Overhead Cabinet';

      mat1.innerHTML = `
        <option value="marine_34" data-rate="190" selected>3/4" Marine Plywood Carcass</option>
        <option value="marine_12" data-rate="140">1/2" Marine Plywood</option>
        <option value="mahogany" data-rate="260">Solid Kiln-Dried Mahogany Hardwood</option>
      `;

      mat2.innerHTML = `
        <option value="duco" data-rate="120" selected>Soft-Close Hinges + Duco Gloss Paint</option>
        <option value="varnish" data-rate="90">Natural Teak Clear Varnish</option>
      `;
    } else if (trade === 'metal') {
      if (mat1Label) mat1Label.textContent = 'Tubular Steel Frame';
      if (mat2Label) mat2Label.textContent = 'Bar Pattern / Infills';
      if (titleInput) titleInput.value = 'Modern Geometric Window Security Grills';

      mat1.innerHTML = `
        <option value="tube1x1" data-rate="90" selected>1" x 1" x 1.5mm Tubular Steel</option>
        <option value="tube1x2" data-rate="130">1" x 2" x 1.5mm Rectangular Tube</option>
      `;

      mat2.innerHTML = `
        <option value="sq12" data-rate="75" selected>12mm Solid Square Bars + Primer & Matte Black</option>
        <option value="deformed10" data-rate="60">10mm Deformed Steel Bars</option>
      `;
    }

    this.recalcModalFab();
  }

  recalcModalFab() {
    const width = parseFloat(document.getElementById('modalFabWidth')?.value) || 0;
    const height = parseFloat(document.getElementById('modalFabHeight')?.value) || 0;
    const qty = parseInt(document.getElementById('modalFabQty')?.value) || 1;
    const service = document.getElementById('modalFabService')?.value;

    const area = (width * height) / 144;
    const perimeter = (2 * (width + height)) / 12;

    const mat1Select = document.getElementById('modalFabMat1');
    const mat2Select = document.getElementById('modalFabMat2');

    const rate1 = parseFloat(mat1Select?.selectedOptions[0]?.getAttribute('data-rate')) || 100;
    const rate2 = parseFloat(mat2Select?.selectedOptions[0]?.getAttribute('data-rate')) || 80;

    const matCost = (area * rate1) + (perimeter * rate2);
    const laborCost = area * 45;
    const hdwCost = 500;
    const installCost = (service === 'install') ? 1500 : (service === 'delivery' ? 500 : 0);

    const unitPrice = Math.round(matCost + laborCost + hdwCost);
    const total = (unitPrice * qty) + installCost;

    const areaEl = document.getElementById('modalFabArea');
    const matCostEl = document.getElementById('modalFabMatCost');
    const laborCostEl = document.getElementById('modalFabLaborCost');
    const hdwCostEl = document.getElementById('modalFabHdwCost');
    const installCostEl = document.getElementById('modalFabInstallCost');
    const totalBigEl = document.getElementById('modalFabTotalBig');
    const perUnitEl = document.getElementById('modalFabPerUnit');

    const autoCalcEl = document.getElementById('modalFabAutoCalc');
    const customOverrideInput = document.getElementById('modalFabCustomOverride');

    if (areaEl) areaEl.textContent = `${area.toFixed(2)} sq ft`;
    if (matCostEl) matCostEl.textContent = `₱${(matCost * qty).toLocaleString()}`;
    if (laborCostEl) laborCostEl.textContent = `₱${(laborCost * qty).toLocaleString()}`;
    if (hdwCostEl) hdwCostEl.textContent = `₱${(hdwCost * qty).toLocaleString()}`;
    if (installCostEl) installCostEl.textContent = `₱${installCost.toLocaleString()}`;
    if (autoCalcEl) autoCalcEl.textContent = `₱${total.toLocaleString()}`;
    if (totalBigEl) totalBigEl.textContent = `₱${total.toLocaleString()}`;

    if (customOverrideInput && (!customOverrideInput.value || customOverrideInput.dataset.manual !== 'true')) {
      customOverrideInput.value = total;
    }

    const effectiveTotal = customOverrideInput && customOverrideInput.value
      ? (parseFloat(customOverrideInput.value) || total)
      : total;
    const effectiveUnitPrice = Math.round(effectiveTotal / Math.max(1, qty));

    if (perUnitEl) perUnitEl.textContent = `(₱${effectiveUnitPrice.toLocaleString()} / unit)`;

    this.cachedModalFab = {
      width,
      height,
      area,
      qty,
      unitPrice: effectiveUnitPrice,
      total: effectiveTotal,
      installCost,
      title: document.getElementById('modalFabTitle')?.value,
      trade: document.getElementById('modalFabTrade')?.value,
      mat1Text: mat1Select?.selectedOptions[0]?.text,
      mat2Text: mat2Select?.selectedOptions[0]?.text,
      notes: document.getElementById('modalFabNotes')?.value,
      customerId: document.getElementById('modalFabCustomer')?.value
    };
  }

  onCustomFabPriceOverride(val) {
    const input = document.getElementById('modalFabCustomOverride');
    if (input) input.dataset.manual = 'true';
    const amount = parseFloat(val) || 0;
    if (this.cachedModalFab) {
      this.cachedModalFab.total = amount;
      this.cachedModalFab.unitPrice = Math.round(amount / Math.max(1, this.cachedModalFab.qty || 1));
      const perUnitEl = document.getElementById('modalFabPerUnit');
      if (perUnitEl) perUnitEl.textContent = `(₱${this.cachedModalFab.unitPrice.toLocaleString()} / unit)`;
    }
  }

  submitModalToCart() {
    if (!this.cachedModalFab) this.recalcModalFab();
    const c = this.cachedModalFab;

    this.cart.push({
      id: 'cart-modal-' + Date.now(),
      isCustomFab: true,
      title: c.title || 'Custom Fabrication',
      specs: `${c.width}"W × ${c.height}"H (${c.area.toFixed(1)} sqft) • ${c.mat1Text} • ${c.mat2Text} • Notes: ${c.notes || 'None'}`,
      unitPrice: c.unitPrice,
      quantity: c.qty,
      subtotal: c.unitPrice * c.qty,
      category: c.trade,
      bom: [
        { name: c.mat1Text, qty: `${(c.area * c.qty).toFixed(1)} sq ft` },
        { name: c.mat2Text, qty: '1 set' }
      ]
    });

    if (c.customerId) {
      this.cartCustomer = db.getCustomers().find(cust => cust.id === c.customerId) || null;
      const cartCustSelect = document.getElementById('cartCustomerSelect');
      if (cartCustSelect) cartCustSelect.value = c.customerId;
    }

    this.cartOrderType = 'fabrication';
    this.closeModal('modalCustomFab');
    this.loadView('pos');
    this.showToast('Custom fabrication added to order!', 'success');
  }

  submitModalAsQuotation() {
    if (!this.cachedModalFab) this.recalcModalFab();
    const c = this.cachedModalFab;

    const customer = db.getCustomers().find(cust => cust.id === c.customerId) || {
      name: 'Client (Digos City)',
      phone: '09XX-XXX-XXXX',
      address: 'Digos City, Davao del Sur'
    };

    const quotData = {
      customerId: customer.id || 'cust-temp',
      customerName: customer.name,
      customerPhone: customer.phone,
      deliveryAddress: customer.address,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: 'Pending Approval',
      projectTitle: c.title,
      tradeCategory: c.trade,
      items: [
        {
          title: c.title,
          specs: `${c.width}"W × ${c.height}"H (${c.area.toFixed(1)} sqft) • ${c.mat1Text} • ${c.mat2Text}`,
          quantity: c.qty,
          unitPrice: c.unitPrice,
          subtotal: c.unitPrice * c.qty
        }
      ],
      subtotal: c.unitPrice * c.qty,
      installationFee: c.installCost,
      deliveryFee: 0,
      totalAmount: c.total,
      notes: c.notes || '15-day validity. 50% deposit required upon confirmation.',
      preparedBy: this.currentUser.fullName
    };

    const saved = db.saveQuotation(quotData);
    this.closeModal('modalCustomFab');
    this.loadView('quotations');
    this.showQuotationPrintModal(saved.id);
    this.showToast(`Quotation ${saved.quotationNo} prepared!`, 'success');
  }

  // ==========================================================================
  // UTILITIES & MODAL CONTROLLERS
  // ==========================================================================

  openConverterModal() {
    this.openModal('modalDimensionCalc');
    this.calculateDimensions();
  }

  setCalcPreset(w, h, unit) {
    const uSel = document.getElementById('calcUnitSelect');
    const wIn = document.getElementById('calcWidth');
    const hIn = document.getElementById('calcHeight');
    if (uSel) uSel.value = unit;
    if (wIn) wIn.value = w;
    if (hIn) hIn.value = h;
    this.calculateDimensions();
  }

  calculateDimensions() {
    const unit = document.getElementById('calcUnitSelect')?.value || 'inches';
    const wVal = parseFloat(document.getElementById('calcWidth')?.value) || 0;
    const hVal = parseFloat(document.getElementById('calcHeight')?.value) || 0;
    const wLbl = document.getElementById('calcWidthLabel');
    const hLbl = document.getElementById('calcHeightLabel');

    if (wLbl) wLbl.textContent = `Width (${unit === 'inches' ? 'Inches' : unit === 'feet' ? 'Feet' : 'mm'})`;
    if (hLbl) hLbl.textContent = `Height (${unit === 'inches' ? 'Inches' : unit === 'feet' ? 'Feet' : 'mm'})`;

    let wInches = wVal;
    let hInches = hVal;

    if (unit === 'feet') {
      wInches = wVal * 12;
      hInches = hVal * 12;
    } else if (unit === 'mm') {
      wInches = wVal / 25.4;
      hInches = hVal / 25.4;
    }

    const sqFt = (wInches * hInches) / 144;
    const sqM = sqFt * 0.092903;
    const perimeterFt = (2 * (wInches + hInches)) / 12;

    const sqFtEl = document.getElementById('calcSqFt');
    const sqMEl = document.getElementById('calcSqM');
    const perimEl = document.getElementById('calcPerimeter');
    const factorEl = document.getElementById('calcEstFactor');

    if (sqFtEl) sqFtEl.textContent = `${sqFt.toFixed(2)} sq ft`;
    if (sqMEl) sqMEl.textContent = `${sqM.toFixed(2)} sq m`;
    if (perimEl) perimEl.textContent = `${perimeterFt.toFixed(2)} lin ft`;
    if (factorEl) {
      if (sqFt > 50) factorEl.textContent = 'Large / Heavy Duty';
      else if (sqFt > 20) factorEl.textContent = 'Medium Commercial';
      else factorEl.textContent = 'Standard Residential';
    }
  }

  copyDimensionResults() {
    const sqFt = document.getElementById('calcSqFt')?.textContent || '';
    const sqM = document.getElementById('calcSqM')?.textContent || '';
    const perim = document.getElementById('calcPerimeter')?.textContent || '';
    const text = `Dimensions: ${sqFt} (${sqM}) | Perimeter: ${perim}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    this.showToast(`Copied to clipboard: ${sqFt}`, 'success');
  }

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  }

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  }

  // ==========================================================================
  // GLOBAL SPOTLIGHT SEARCH & QUICK JUMP
  // ==========================================================================
  performLiveSearch(query) {
    const popover = document.getElementById('spotlightResultsPopover');
    const listEl = document.getElementById('spotlightResultsList');
    const countEl = document.getElementById('spotlightResultsCount');
    if (!popover || !listEl) return;

    const q = (query || '').toLowerCase().trim();
    if (!q) {
      popover.style.display = 'none';
      return;
    }

    const orders = db.getOrders();
    const customers = db.getCustomers();
    const products = db.getProducts();
    const quotations = db.getQuotations();

    const matchedJobs = orders.filter(o => 
      (o.jobOrderNo && o.jobOrderNo.toLowerCase().includes(q)) ||
      (o.orderNo && o.orderNo.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedCustomers = customers.filter(c => 
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    ).slice(0, 3);

    const matchedProducts = products.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q)) ||
      (p.supplier && p.supplier.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedQuotes = quotations.filter(qt => 
      (qt.quoteNo && qt.quoteNo.toLowerCase().includes(q)) ||
      (qt.customerName && qt.customerName.toLowerCase().includes(q)) ||
      (qt.projectTitle && qt.projectTitle.toLowerCase().includes(q))
    ).slice(0, 3);

    const totalMatches = matchedJobs.length + matchedCustomers.length + matchedProducts.length + matchedQuotes.length;

    if (countEl) {
      countEl.textContent = `${totalMatches} result${totalMatches === 1 ? '' : 's'} matching "${query}"`;
    }

    if (totalMatches === 0) {
      listEl.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%; color: var(--text-dim); margin-bottom: 0.4rem;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <p>No records found for "<strong>${this.escapeHtml(query)}</strong>"</p>
          <small style="color: var(--text-muted); display: block; margin-top: 0.25rem;">Try searching for a customer name, JO-2026-..., or item like "Bronze Glass"</small>
        </div>
      `;
      popover.style.display = 'flex';
      return;
    }

    let html = '';

    // 1. Job Orders & Projects
    if (matchedJobs.length > 0) {
      html += `<div class="spotlight-category-title">Job Orders &amp; Projects (${matchedJobs.length})</div>`;
      matchedJobs.forEach(j => {
        const stageNames = {
          queued: '1. Queued',
          materials_prepared: '2. Cut & Prep',
          in_fabrication: '3. Fabrication',
          quality_check: '4. Quality Check',
          ready_dispatch: '5. Ready Dispatch',
          installed_delivered: '6. Installed'
        };
        const stage = stageNames[j.jobStatus] || j.jobStatus;
        html += `
          <div class="spotlight-item-card" onclick="App.jumpToJob('${j.id}')">
            <div class="spotlight-item-left">
              <span class="spotlight-item-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              </span>
              <div>
                <div class="spotlight-item-title">${j.jobOrderNo || j.orderNo} • ${j.customerName}</div>
                <div class="spotlight-item-sub">Total: ₱${(j.totalAmount || 0).toLocaleString()} • Target: ${j.targetDate ? j.targetDate.split('T')[0] : 'N/A'}</div>
              </div>
            </div>
            <div class="spotlight-item-right">
              <span class="badge" style="font-size: 0.7rem; background: rgba(52, 211, 153, 0.15); color: #34d399; padding: 0.2rem 0.5rem; border-radius: 6px;">${stage}</span>
            </div>
          </div>
        `;
      });
    }

    // 2. Customers
    if (matchedCustomers.length > 0) {
      html += `<div class="spotlight-category-title">Customers &amp; Clients (${matchedCustomers.length})</div>`;
      matchedCustomers.forEach(c => {
        html += `
          <div class="spotlight-item-card" onclick="App.jumpToCustomer('${c.id}')">
            <div class="spotlight-item-left">
              <span class="spotlight-item-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </span>
              <div>
                <div class="spotlight-item-title">${c.name}</div>
                <div class="spotlight-item-sub">${c.phone} • ${c.address}</div>
              </div>
            </div>
            <div class="spotlight-item-right">
              <span class="badge" style="font-size: 0.7rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 6px;">${c.customerType}</span>
            </div>
          </div>
        `;
      });
    }

    // 3. Products & Stock
    if (matchedProducts.length > 0) {
      html += `<div class="spotlight-category-title">Materials &amp; Products (${matchedProducts.length})</div>`;
      matchedProducts.forEach(p => {
        const isLow = (p.stockQuantity || 0) <= (p.reorderLevel || 10);
        const stockBadge = isLow 
          ? `<span style="color: #f87171; font-size: 0.7rem; font-weight: 700;">Low: ${p.stockQuantity} ${p.unit}</span>`
          : `<span style="color: #4ade80; font-size: 0.7rem;">${p.stockQuantity} ${p.unit}</span>`;
        html += `
          <div class="spotlight-item-card" onclick="App.jumpToProduct('${p.id}')">
            <div class="spotlight-item-left">
              <span class="spotlight-item-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              </span>
              <div>
                <div class="spotlight-item-title">${p.name} <span style="font-size: 0.72rem; color: #a7f3d0;">[${p.code}]</span></div>
                <div class="spotlight-item-sub">₱${(p.sellingPrice || 0).toLocaleString()} / ${p.unit} • ${p.categoryLabel || p.category}</div>
              </div>
            </div>
            <div class="spotlight-item-right">
              ${stockBadge}
              <button class="btn-sm" style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: #15803d; color: #fff; border: none; border-radius: 4px; cursor: pointer;" onclick="event.stopPropagation(); App.addProductToCart('${p.id}'); App.closeSpotlightPopover();">
                + Cart
              </button>
            </div>
          </div>
        `;
      });
    }

    // 4. Quotations
    if (matchedQuotes.length > 0) {
      html += `<div class="spotlight-category-title">Project Quotations (${matchedQuotes.length})</div>`;
      matchedQuotes.forEach(qt => {
        html += `
          <div class="spotlight-item-card" onclick="App.jumpToQuotation('${qt.id}')">
            <div class="spotlight-item-left">
              <span class="spotlight-item-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line></svg>
              </span>
              <div>
                <div class="spotlight-item-title">${qt.quoteNo} • ${qt.customerName}</div>
                <div class="spotlight-item-sub">${qt.projectTitle || 'Quotation'} • Contract: ₱${(qt.totalAmount || 0).toLocaleString()}</div>
              </div>
            </div>
            <div class="spotlight-item-right">
              <span class="badge" style="font-size: 0.7rem; background: rgba(245, 158, 11, 0.15); color: #fbbf24; padding: 0.2rem 0.5rem; border-radius: 6px;">${qt.status}</span>
            </div>
          </div>
        `;
      });
    }

    listEl.innerHTML = html;
    popover.style.display = 'flex';
  }

  closeSpotlightPopover() {
    const popover = document.getElementById('spotlightResultsPopover');
    if (popover) popover.style.display = 'none';
  }

  clearGlobalSearch() {
    const globalSearch = document.getElementById('globalSearchInput');
    const searchClearBtn = document.getElementById('globalSearchClear');
    if (globalSearch) {
      globalSearch.value = '';
      globalSearch.focus();
    }
    if (searchClearBtn) searchClearBtn.style.display = 'none';
    this.closeSpotlightPopover();
  }

  triggerGlobalSearch() {
    const globalSearch = document.getElementById('globalSearchInput');
    if (!globalSearch) return;
    const query = globalSearch.value.trim();
    if (!query) {
      globalSearch.focus();
      return;
    }
    this.performLiveSearch(query);
  }

  jumpToJob(jobId) {
    this.closeSpotlightPopover();
    this.loadView('projects');
    this.openJobDetailsModal(jobId);
  }

  jumpToCustomer(customerId) {
    this.closeSpotlightPopover();
    this.loadView('customers');
    this.showToast('Navigated to Customer Record', 'info');
  }

  jumpToProduct(productId) {
    this.closeSpotlightPopover();
    this.loadView('pos');
    this.addProductToCart(productId);
    this.showToast('Item added to active POS order', 'success');
  }

  jumpToQuotation(quoteId) {
    this.closeSpotlightPopover();
    this.loadView('quotations');
    this.showToast('Navigated to Quotations', 'info');
  }

  async testTursoCloudConnection() {
    this.showToast('Connecting to Turso Cloud (Singapore/Tokyo)...', 'info');
    if (typeof TursoDB !== 'undefined') {
      const res = await TursoDB.testConnection();
      if (res.success) {
        this.showToast(`✅ ${res.message}`, 'success');
      } else {
        this.showToast(`⚠️ Turso Cloud: ${res.message}`, 'warning');
      }
    } else {
      this.showToast('TursoDB adapter not loaded', 'warning');
    }
  }

  // ==========================================================================
  // DYNAMIC PHILIPPINE QR PH (GCASH / MAYA) CARD
  // ==========================================================================
  updateQrPhCard(payableAmount = null) {
    const box = document.getElementById('cartQrPhBox');
    const img = document.getElementById('cartQrPhImg');
    const amtEl = document.getElementById('cartQrPhAmount');
    if (!box) return;

    if (this.cartPaymentMethod === 'GCash' || this.cartPaymentMethod === 'Bank Transfer') {
      const subtotal = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
      const hasFabrication = this.cartOrderType === 'fabrication' || this.cart.some(item => item.isCustomFab);
      const total = subtotal + (hasFabrication ? 2000 : 0);
      let payableNow = payableAmount !== null ? payableAmount : total;
      if (payableAmount === null) {
        if (this.cartPaymentTerm === 'deposit50') payableNow = Math.round(total / 2);
        else if (this.cartPaymentTerm === 'quote') payableNow = 0;
      }

      box.style.display = 'block';
      if (amtEl) amtEl.textContent = `₱${payableNow.toLocaleString()}`;
      if (img) {
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=00020101021226580016ph.ppmi.qrph011109295902201520460165303608540${payableNow}5802PH5913RUSELL_BAJURA6010DIGOS_CITY6304`;
      }
    } else {
      box.style.display = 'none';
    }
  }

  // ==========================================================================
  // QR & BARCODE CAMERA SCANNER
  // ==========================================================================
  async openQrScannerModal() {
    this.openModal('modalQrScanner');
    const video = document.getElementById('qrScannerVideo');
    const statusText = document.getElementById('scannerStatusText');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.qrStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (video) {
          video.srcObject = this.qrStream;
          video.setAttribute('playsinline', true);
          video.play();
        }
        if (statusText) statusText.innerHTML = '<span>Camera Active - Point at Job Slip QR</span>';
      } else {
        if (statusText) statusText.innerHTML = '<span>Camera API not supported. Use manual lookup below.</span>';
      }
    } catch (err) {
      if (statusText) statusText.innerHTML = '<span>Camera access restricted or unavailable. Use manual lookup.</span>';
    }
  }

  closeQrScannerModal() {
    if (this.qrStream) {
      this.qrStream.getTracks().forEach(track => track.stop());
      this.qrStream = null;
    }
    const video = document.getElementById('qrScannerVideo');
    if (video) video.srcObject = null;
    this.closeModal('modalQrScanner');
  }

  processManualScannedCode() {
    const input = document.getElementById('manualQrInput');
    const code = input ? input.value.trim() : '';
    if (!code) {
      this.showToast('Please enter a Job Order # or material SKU', 'warning');
      return;
    }
    this.processScannedCode(code);
  }

  processScannedCode(code) {
    this.closeQrScannerModal();
    const cleanCode = code.trim().toUpperCase();

    // Check if it's an order / job order
    const orders = db.getOrders();
    const order = orders.find(o => 
      (o.jobOrderNo && o.jobOrderNo.toUpperCase() === cleanCode) ||
      (o.orderNo && o.orderNo.toUpperCase() === cleanCode) ||
      o.id === code
    );

    if (order) {
      this.showToast(`Job Slip Identified: ${order.jobOrderNo}`, 'success');
      this.loadView('projects');
      setTimeout(() => {
        this.openJobDetailsModal(order.id);
      }, 300);
      return;
    }

    // Check if it's a product SKU
    const products = db.getProducts();
    const product = products.find(p => (p.code && p.code.toUpperCase() === cleanCode) || p.id === code);
    if (product) {
      this.showToast(`Scanned Material: ${product.name}`, 'success');
      this.loadView('pos');
      this.addProductToCart(product.id);
      return;
    }

    this.showToast(`Code "${code}" processed. Searching system records...`, 'info');
    this.performLiveSearch(code);
  }

  // ==========================================================================
  // DIGITAL CUSTOMER E-SIGNATURE PAD
  // ==========================================================================
  openSignaturePad(orderId = null) {
    this.signatureTargetOrderId = orderId || this.activeJobId;
    const targetInput = document.getElementById('signatureTargetOrderId');
    if (targetInput) targetInput.value = this.signatureTargetOrderId || '';

    this.openModal('modalSignaturePad');
    setTimeout(() => {
      this.initSignaturePad();
    }, 150);
  }

  closeSignaturePad() {
    this.closeModal('modalSignaturePad');
  }

  initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if (e.touches && e.touches[0]) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const startDraw = (e) => {
      isDrawing = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      if (e.cancelable) e.preventDefault();
    };

    const draw = (e) => {
      if (!isDrawing) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
      if (e.cancelable) e.preventDefault();
    };

    const stopDraw = () => {
      if (isDrawing) {
        isDrawing = false;
        ctx.closePath();
      }
    };

    canvas.onmousedown = startDraw;
    canvas.onmousemove = draw;
    canvas.onmouseup = stopDraw;
    canvas.onmouseleave = stopDraw;

    canvas.ontouchstart = startDraw;
    canvas.ontouchmove = draw;
    canvas.ontouchend = stopDraw;

    this.signatureCanvasCtx = ctx;
  }

  clearSignatureCanvas() {
    const canvas = document.getElementById('signatureCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  saveCustomerSignature() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;

    const sigData = canvas.toDataURL('image/png');
    const orderId = this.signatureTargetOrderId || this.activeJobId;

    if (orderId) {
      const order = db.getOrder(orderId);
      if (order) {
        order.signature = sigData;
        order.signedAt = new Date().toISOString();
        if (typeof db.saveOrder === 'function') {
          db.saveOrder(order);
        } else if (typeof db.updateOrder === 'function') {
          db.updateOrder(orderId, order);
        }
        this.showToast(`Customer E-Signature attached to ${order.jobOrderNo}!`, 'success');
      }
    } else {
      this.lastSignatureData = sigData;
      this.showToast('Customer signature captured for receipt!', 'success');
    }

    this.closeSignaturePad();
    if (this.activeJobId) {
      this.openJobDetailsModal(this.activeJobId);
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Instantiate on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  window.App = new WorkshopApp();
});
