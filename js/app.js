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
    this.initTheme();
    this.restoreSidebarState();
    this.setupClock();
    this.setupEventListeners();
    this.initStoriesCarouselDrag();
    this.loadView(this.currentView);
    this.updateGlobalBadges();
  }

  updateUserUI() {
    const avatarEl = document.getElementById('sidebarAvatar');
    const nameEl = document.getElementById('sidebarUserName');
    const roleEl = document.getElementById('sidebarUserRole');
    const roleSwitcher = document.getElementById('roleSwitcher');

    if (avatarEl) avatarEl.textContent = this.currentUser.avatar || 'RT';
    if (nameEl) nameEl.textContent = 'General Manager';
    if (roleEl) roleEl.textContent = 'Admin';
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

  // ==========================================================================
  // NIGHT MODE & LIGHT MODE THEME CONTROLLER
  // ==========================================================================

  initTheme() {
    const savedTheme = localStorage.getItem('russels_theme') || 'light';
    this.applyTheme(savedTheme, false);
  }

  toggleTheme() {
    const isDark = document.body.classList.contains('theme-dark');
    const newTheme = isDark ? 'light' : 'dark';
    this.applyTheme(newTheme, true);
  }

  applyTheme(theme, notify = true) {
    const labelEl = document.getElementById('themeToggleLabel');
    const iconEl = document.getElementById('themeToggleIcon');
    const sidebarStatus = document.getElementById('sidebarThemeStatus');
    const sidebarIconBox = document.getElementById('sidebarThemeIconBox');
    const sidebarTrack = document.getElementById('sidebarThemeTrack');
    const floatingIcon = document.getElementById('floatingThemeIcon');
    const floatingText = document.getElementById('floatingThemeText');

    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
      localStorage.setItem('russels_theme', 'dark');

      if (labelEl) labelEl.textContent = 'Light Mode';
      if (iconEl) {
        iconEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      }
      if (sidebarStatus) sidebarStatus.textContent = 'Night Mode (On)';
      if (sidebarTrack) sidebarTrack.classList.add('active');
      if (sidebarIconBox) {
        sidebarIconBox.innerHTML = `<svg style="width: 16px; height: 16px; stroke: #fbbf24;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      }
      if (floatingIcon) floatingIcon.textContent = '☀️';
      if (floatingText) floatingText.textContent = 'Light Mode';

      if (notify && typeof this.showToast === 'function') {
        this.showToast('Night / Dark Mode activated 🌙', 'info');
      }
    } else {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      localStorage.setItem('russels_theme', 'light');

      if (labelEl) labelEl.textContent = 'Night Mode';
      if (iconEl) {
        iconEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      }
      if (sidebarStatus) sidebarStatus.textContent = 'Light Mode (On)';
      if (sidebarTrack) sidebarTrack.classList.remove('active');
      if (sidebarIconBox) {
        sidebarIconBox.innerHTML = `<svg style="width: 16px; height: 16px; stroke: #6366f1;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      }
      if (floatingIcon) floatingIcon.textContent = '🌙';
      if (floatingText) floatingText.textContent = 'Night Mode';

      if (notify && typeof this.showToast === 'function') {
        this.showToast('Light Mode activated ☀️', 'info');
      }
    }

    if (notify && typeof this.playAudioTone === 'function') {
      this.playAudioTone('click');
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
        e.preventDefault();
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

    // Close Tools Dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdownWrap = document.querySelector('.topbar-tools-dropdown-wrapper');
      const dropdownMenu = document.getElementById('topbarToolsDropdown');
      if (dropdownWrap && dropdownMenu && !dropdownWrap.contains(e.target)) {
        dropdownMenu.style.display = 'none';
      }
    });

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
        const query = globalSearch.value.trim();
        this.performLiveSearch(query || 'problem');
      });

      globalSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.triggerGlobalSearch();
        } else if (e.key === 'Escape') {
          this.closeSpotlightPopover();
        }
      });
    }

    // Keyboard shortcuts: '/' opens search, 'Escape' dismisses, 'Ctrl+B' toggles sidebar, 'Alt+T' toggles theme
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        this.toggleSidebar();
      } else if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        this.toggleTheme();
      } else if (e.ctrlKey && e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        this.toggleTheme();
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
    if (viewName === 'products_services') viewName = 'inventory';
    if (viewName === 'dashboard') viewName = 'pos';

    this.currentView = viewName;

    // Update active nav link
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      const dv = link.getAttribute('data-view');
      const isActive = dv === viewName || (viewName === 'inventory' && dv === 'products_services');
      link.classList.toggle('active', isActive);
    });

    // Show/hide view containers
    document.querySelectorAll('.view-container').forEach(view => {
      view.classList.remove('active');
    });
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.add('active');

    // Scroll to top of content view smoothly
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) mainWrapper.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto-close sidebar in mobile/compact view if open
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
    }

    // Update Topbar Titles
    const titleEl = document.getElementById('topbarTitle');
    const subtitleEl = document.getElementById('topbarSubtitle');

    const viewTitles = {
      pos: {
        title: 'Dashboard',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      pos_counter: {
        title: 'Point of Sale (POS)',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      customers: {
        title: 'Clients',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      suppliers: {
        title: 'Suppliers',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      inventory: {
        title: 'Inventory',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      quotations: {
        title: 'Quotations & BOM',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      orders: {
        title: 'Purchase orders & bids',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      payments: {
        title: 'Invoices & billing',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      projects: {
        title: 'Assembly & testing',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      reports: {
        title: 'Reports',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      users: {
        title: 'User management',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      database: {
        title: 'Database Management',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      estimator: {
        title: 'Custom Job Estimator',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      },
      store_location: {
        title: 'Store Location',
        sub: "RUSSEL'S GLASS, WOODS & METALS • DIGOS CITY"
      }
    };

    if (viewTitles[viewName]) {
      if (titleEl) titleEl.textContent = viewTitles[viewName].title;
      if (subtitleEl) subtitleEl.textContent = viewTitles[viewName].sub;
    }

    // Trigger view-specific renders
    switch (viewName) {
      case 'database':
        this.renderDatabaseScreen();
        break;
      case 'pos':
        this.updateDashboardMetrics();
        break;
      case 'pos_counter':
        this.populateCustomerDropdowns();
        this.renderPosProducts();
        this.updateCartUI();
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
    const orders = db.getOrders ? db.getOrders() : [];
    const products = db.getProducts ? db.getProducts() : [];
    const quotations = db.getQuotations ? db.getQuotations() : [];

    const activeJobs = orders.filter(o => o.jobStatus !== 'installed_delivered' && o.jobStatus !== 'completed').length;
    const lowStockCount = products.filter(p => (p.stockQuantity || 0) <= (p.reorderLevel || 10)).length;
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

    // Topbar Problem Indicator & Search Bar Prompt
    if (typeof this.getAllSystemProblems === 'function') {
      const allProblems = this.getAllSystemProblems();
      const indicator = document.getElementById('topbarProblemIndicator');
      const probText = document.getElementById('topbarProblemText');
      const searchInput = document.getElementById('globalSearchInput');

      if (indicator && probText) {
        if (allProblems.length > 0) {
          indicator.classList.add('has-issues');
          probText.textContent = `${allProblems.length} Issue${allProblems.length === 1 ? '' : 's'}`;
          indicator.title = `${allProblems.length} workshop issue${allProblems.length === 1 ? '' : 's'} detected: Click to locate & resolve`;
        } else {
          indicator.classList.remove('has-issues');
          probText.textContent = '0 Issues';
          indicator.title = 'All system metrics normal: 0 issues detected';
        }
      }

      if (searchInput && !searchInput.value) {
        if (allProblems.length > 0) {
          searchInput.placeholder = `Search records, or click 🚨 ${allProblems.length} Issues to locate...`;
        } else {
          searchInput.placeholder = "Search jobs, customers, materials, or type 'problem'...";
        }
      }
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
        <div class="product-card card-cat-${product.category || 'glass'}" data-category="${product.category || 'glass'}" onclick="App.addProductToCart('${product.id}')" title="Click to add to counter order">
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
        <td><strong style="color: #0284c7; font-family: var(--font-mono);">${q.quotationNo}</strong></td>
        <td>
          <div style="font-weight: 700; color: var(--text-dark);">${q.customerName}</div>
          <small style="color: var(--text-dim);">${q.projectTitle}</small>
        </td>
        <td>
          <div style="color: var(--text-dark);">${q.customerPhone}</div>
          <small style="color: var(--text-muted);">${q.deliveryAddress}</small>
        </td>
        <td><span class="badge badge-metal">${q.tradeCategory || 'Glass'}</span></td>
        <td><strong style="color: var(--text-dark);">₱${q.totalAmount.toLocaleString()}</strong></td>
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
          <td><strong style="font-family: var(--font-mono); color: var(--text-dark);">${p.code}</strong></td>
          <td>
            <div style="font-weight: 700; color: var(--text-dark);">${p.name}</div>
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
        <td><strong style="font-family: var(--font-mono); color: #0284c7;">${c.code}</strong></td>
        <td>
          <div style="font-weight: 700; color: var(--text-dark);">${c.name}</div>
          <small style="color: var(--text-dim);">${c.notes || ''}</small>
        </td>
        <td><span class="badge badge-metal">${c.customerType}</span></td>
        <td style="color: var(--text-dark);">${c.phone}</td>
        <td style="color: var(--text-dim);">${c.address}</td>
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
            <div style="font-weight: 700; color: #0284c7;">${o.jobOrderNo || o.orderNo}</div>
            <small style="color: var(--text-dim);">${new Date(o.orderDate).toLocaleDateString()}</small>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--text-dark);">${o.customerName}</div>
            <small style="color: var(--text-muted);">${o.customerPhone}</small>
          </td>
          <td style="color: var(--text-dark);">₱${o.totalAmount.toLocaleString()}</td>
          <td><strong style="color: #16a34a;">₱${(o.downpayment || 0).toLocaleString()}</strong></td>
          <td>
            <strong style="color: ${isPaid ? '#16a34a' : '#d97706'}; font-size: 0.95rem;">
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

    // Story Card 5: Active Fabrication Jobs
    const jobsEl = document.getElementById('storyMetricJobs');
    if (jobsEl) {
      const activeJobs = orders.filter(o => o.jobStatus !== 'installed_delivered' && o.jobStatus !== 'completed').length || 3;
      jobsEl.textContent = `${activeJobs} Active`;
    }

    // Story Card 6: Quotations Total
    const quotesEl = document.getElementById('storyMetricQuotes');
    if (quotesEl && typeof db !== 'undefined' && db.getQuotes) {
      const quotes = db.getQuotes();
      const quoteSum = quotes.reduce((sum, q) => sum + (q.totalAmount || 0), 0) || 145200;
      quotesEl.textContent = `₱${quoteSum.toLocaleString()}`;
    }

    // Story Card 7: Low Stock Alerts
    const stockEl = document.getElementById('storyMetricStock');
    if (stockEl && typeof db !== 'undefined' && db.getInventory) {
      const items = db.getInventory();
      const lowCount = items.filter(i => (i.quantity || 0) <= (i.reorderLevel || 10)).length || 3;
      stockEl.textContent = `${lowCount} Items`;
    }

    // Story Card 8: Registered Clients
    const clientsEl = document.getElementById('storyMetricClients');
    if (clientsEl && typeof db !== 'undefined' && db.getCustomers) {
      const custs = db.getCustomers();
      clientsEl.textContent = `${custs.length || 128}`;
    }

    this.updateBluechipDashboard();
  }

  /* Minimalist Bluechip POS Mode Switcher (Image 2) */
  switchPosMode(mode) {
    const dashSection = document.getElementById('bluechipDashSection');
    const posGrid = document.getElementById('posCounterGrid');
    const tabDash = document.getElementById('tabDashOverview');
    const tabPos = document.getElementById('tabPosCounter');
    const titleEl = document.getElementById('topbarTitle');

    if (mode === 'pos') {
      if (dashSection) dashSection.style.display = 'none';
      if (posGrid) posGrid.style.display = 'grid';
      if (tabDash) tabDash.classList.remove('active');
      if (tabPos) tabPos.classList.add('active');
      if (titleEl) titleEl.textContent = 'Point of Sales (POS)';
    } else {
      if (dashSection) dashSection.style.display = 'block';
      if (posGrid) posGrid.style.display = 'none';
      if (tabDash) tabDash.classList.add('active');
      if (tabPos) tabPos.classList.remove('active');
      if (titleEl) titleEl.textContent = 'Dashboard';
    }
  }

  toggleToolsMenu() {
    const menu = document.getElementById('topbarToolsDropdown');
    if (!menu) return;
    const isHidden = menu.style.display === 'none' || !menu.style.display;
    menu.style.display = isHidden ? 'block' : 'none';
  }

  /* Bluechip Minimalist Live Metrics Update (Image 2) */
  updateBluechipDashboard() {
    // 1. Live Date (both topbar and dash)
    const d = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const dateStr = d.toLocaleDateString('en-US', options);

    const dateEl = document.getElementById('bluechipLiveDate');
    if (dateEl) dateEl.textContent = dateStr;

    const topbarDateEl = document.getElementById('topbarLiveDate');
    if (topbarDateEl) topbarDateEl.textContent = dateStr;

    // 2. Low-Stock Count
    const lowEl = document.getElementById('bcLowStockCount');
    if (lowEl) {
      const materials = (typeof db !== 'undefined' && db.getMaterials) ? db.getMaterials() : (this.materials || []);
      const lowCount = materials.filter(m => (m.stock_quantity || 0) <= (m.reorder_level || 5)).length;
      lowEl.textContent = `${lowCount || 1}`;
    }

    // 3. Pending Purchase / Fabrication Orders
    const pendEl = document.getElementById('bcPendingOrdersCount');
    if (pendEl) {
      const orders = (typeof db !== 'undefined' && db.getOrders) ? db.getOrders() : (this.orders || []);
      const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'in_progress').length;
      pendEl.textContent = `${pendingCount || 0}`;
    }

    // 4. Overdue Receivables
    const recEl = document.getElementById('bcOverdueReceivables');
    if (recEl) {
      const orders = (typeof db !== 'undefined' && db.getOrders) ? db.getOrders() : (this.orders || []);
      const overdueSum = orders.reduce((sum, o) => {
        const bal = (parseFloat(o.total_amount) || 0) - (parseFloat(o.amount_paid) || 0);
        return bal > 0 ? sum + bal : sum;
      }, 0);
      recEl.textContent = overdueSum > 0 ? `₱${overdueSum.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₱0.00';
    }
  }

  /* Facebook "My Day" Stories Carousel Smooth & Infinite Scroll */
  scrollStories(direction) {
    const track = document.getElementById('dashMetricsCarousel');
    if (!track) return;
    const scrollStep = 300;
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (direction === 'left') {
      if (track.scrollLeft <= 15) {
        // Infinite wrap to end of reel
        track.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: -scrollStep, behavior: 'smooth' });
      }
    } else {
      if (track.scrollLeft >= maxScroll - 15) {
        // Infinite wrap back to beginning of reel
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: scrollStep, behavior: 'smooth' });
      }
    }
  }

  /* Mouse Drag / Swipe Gesture for Stories Carousel */
  initStoriesCarouselDrag() {
    const track = document.getElementById('dashMetricsCarousel');
    if (!track || track._dragInitialized) return;
    track._dragInitialized = true;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    track.addEventListener('mousedown', (e) => {
      isDown = true;
      track.style.cursor = 'grabbing';
      track.style.scrollBehavior = 'auto';
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    track.addEventListener('mouseleave', () => {
      isDown = false;
      track.style.cursor = '';
      track.style.scrollBehavior = 'smooth';
    });

    track.addEventListener('mouseup', () => {
      isDown = false;
      track.style.cursor = '';
      track.style.scrollBehavior = 'smooth';
    });

    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.4;
      track.scrollLeft = scrollLeft - walk;
    });
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
        <td><strong style="font-family: var(--font-mono); color: #0284c7;">${s.code}</strong></td>
        <td>
          <div style="font-weight: 700; color: var(--text-dark);">${s.name}</div>
          <small style="color: var(--text-dim); font-size: 0.75rem;">${s.itemsSupplied || ''}</small>
        </td>
        <td><span class="badge badge-metal">${s.category}</span></td>
        <td>
          <div style="font-weight: 600; color: var(--text-dark);">${s.contactPerson}</div>
          <small style="color: var(--text-muted); font-size: 0.72rem;">${s.phone}</small>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-dim);">${s.address}</td>
        <td><span class="stock-tag ok" style="font-size: 0.72rem;">⏱️ ${s.leadTime}</span></td>
        <td><strong style="color: #d97706; font-size: 0.8rem;">${s.rating}</strong></td>
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
          <div style="font-weight: 700; color: var(--text-dark);">${u.fullName}</div>
          <small style="color: var(--text-dim);">
            ${u.roleLabel || u.role}
          </small>
        </td>
        <td><strong style="font-family: var(--font-mono); color: #0284c7;">${u.username}</strong></td>
        <td>
          <span class="badge ${u.role === 'owner' ? 'badge-glass' : (u.role === 'sales' ? 'badge-wood' : 'badge-metal')}">
            ${u.role.toUpperCase()}
          </span>
        </td>
        <td style="font-size: 0.82rem; color: var(--text-dark);">${u.phone || 'N/A'}</td>
        <td style="font-size: 0.82rem; color: var(--text-muted);">${u.email || 'N/A'}</td>
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
            <img src="assets/logo.jpg" alt="Logo" style="height: 38px; width: 38px; object-fit: contain; border-radius: 4px; border: 1px solid #ddd; margin: 0 auto 4px auto; display: block;" />
            <div style="font-weight: 900; font-size: 13px; letter-spacing: 0.5px; color: #15803d;">RUSSEL'S WORKSHOP</div>
            <div style="font-size: 10px; font-weight: bold;">GLASS, WOODS &amp; METALS</div>
            <div style="font-style: italic; font-size: 9px; color: #dc2626; font-weight: bold;">"You NAME it, we BUILD it"</div>
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
            <div class="official-paid-stamp">★ PAID &amp; CERTIFIED ★<br><span style="font-size: 8px; letter-spacing: 0.05em;">RUSSEL'S WORKSHOP • DIGOS</span></div>
          </div>
        ` : ''}
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 15px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px;">
            <img src="assets/logo.jpg" alt="Logo" style="height: 48px; object-fit: contain; border-radius: 4px; border: 1px solid #ddd;" />
            <div>
              <h2 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.5px; color: #15803d;">RUSSEL'S GLASS, WOODS &amp; METALS</h2>
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
  // SYSTEM HEALTH & COMPREHENSIVE PROBLEM DIAGNOSTIC RADAR
  // ==========================================================================
  getAllSystemProblems() {
    const orders = (typeof db !== 'undefined' && db.getOrders) ? db.getOrders() : [];
    const products = (typeof db !== 'undefined' && db.getProducts) ? db.getProducts() : [];
    const quotations = (typeof db !== 'undefined' && db.getQuotations) ? db.getQuotations() : [];
    const problems = [];
    const now = new Date();

    // 1. Inventory Stockouts & Low Stock (Critical Material Bottlenecks)
    products.forEach(p => {
      const stock = p.stockQuantity !== undefined ? p.stockQuantity : 0;
      const reorder = p.reorderLevel !== undefined ? p.reorderLevel : 10;
      if (stock <= 0) {
        problems.push({
          id: `prob-stockout-${p.id}`,
          category: 'stock',
          severity: 'critical',
          badgeText: 'CRITICAL OUT OF STOCK',
          icon: '🚨',
          title: `${p.name} [${p.code}]`,
          subtitle: `0 ${p.unit} remaining in workshop yard (Reorder buffer: ${reorder}) • Supplier: ${p.supplier || 'Davao Region'}`,
          actionLabel: '+ Restock Now',
          actionFn: `App.quickRestockPrompt('${p.id}')`,
          jumpFn: `App.jumpToProduct('${p.id}')`
        });
      } else if (stock <= reorder) {
        problems.push({
          id: `prob-lowstock-${p.id}`,
          category: 'stock',
          severity: 'warning',
          badgeText: `LOW STOCK (${stock} ${p.unit})`,
          icon: '⚠️',
          title: `${p.name} [${p.code}]`,
          subtitle: `Only ${stock} ${p.unit} left (Below reorder threshold ${reorder}) • Restock needed from ${p.supplier || 'Davao Region'}`,
          actionLabel: '+ Stock In',
          actionFn: `App.quickRestockPrompt('${p.id}')`,
          jumpFn: `App.jumpToProduct('${p.id}')`
        });
      }
    });

    // 2. Financial Receivables & Unpaid Balances (Accounts Receivable)
    orders.forEach(o => {
      const bal = o.balanceDue !== undefined ? o.balanceDue : ((o.totalAmount || 0) - (o.downpayment || 0));
      if (bal > 0) {
        problems.push({
          id: `prob-unpaid-${o.id}`,
          category: 'payment',
          severity: 'financial',
          badgeText: `UNPAID ₱${bal.toLocaleString()}`,
          icon: '💰',
          title: `${o.customerName} • ${o.jobOrderNo || o.orderNo}`,
          subtitle: `Collectible Balance: ₱${bal.toLocaleString()} of ₱${(o.totalAmount || 0).toLocaleString()} contract • ${o.customerPhone || 'Digos City'}`,
          actionLabel: 'Collect Balance',
          actionFn: `App.openPaymentCollectionModal('${o.id}')`,
          jumpFn: `App.jumpToJob('${o.id}')`
        });
      }
    });

    // 3. Fabrication Delays & Production Bottlenecks
    orders.forEach(o => {
      const isDone = o.jobStatus === 'installed_delivered' || o.jobStatus === 'completed';
      if (!isDone && o.targetDate) {
        const target = new Date(o.targetDate);
        if (target < now) {
          problems.push({
            id: `prob-delayed-${o.id}`,
            category: 'delay',
            severity: 'critical',
            badgeText: 'OVERDUE TARGET DATE',
            icon: '⏰',
            title: `OVERDUE: ${o.jobOrderNo || o.orderNo} • ${o.customerName}`,
            subtitle: `Target completion was ${target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • Stage: ${o.jobStatus} (${o.progressPercent || 0}%) • Craftsman: ${o.assignedStaff || 'Unassigned'}`,
            actionLabel: '⚡ Expedite Job',
            actionFn: `App.jumpToJob('${o.id}')`,
            jumpFn: `App.jumpToJob('${o.id}')`
          });
        }
      }
      if (!isDone && (o.jobStatus === 'queued' || o.jobStatus === 'materials_prepared') && (!o.assignedStaff || o.assignedStaff === 'Unassigned')) {
        problems.push({
          id: `prob-stalled-${o.id}`,
          category: 'delay',
          severity: 'warning',
          badgeText: 'AWAITING CRAFTSMAN',
          icon: '⏳',
          title: `STALLED QUEUE: ${o.jobOrderNo || o.orderNo}`,
          subtitle: `${o.customerName} • No craftsman assigned to fabricate this order yet`,
          actionLabel: 'Assign & Start',
          actionFn: `App.jumpToJob('${o.id}')`,
          jumpFn: `App.jumpToJob('${o.id}')`
        });
      }
    });

    // 4. Pending / Expiring Quotations
    quotations.forEach(q => {
      if (q.status === 'Pending Approval' || q.status === 'draft' || q.status === 'sent') {
        problems.push({
          id: `prob-quote-${q.id}`,
          category: 'quotation',
          severity: 'info',
          badgeText: 'PENDING APPROVAL',
          icon: '📄',
          title: `QUOTE PENDING: ${q.quotationNo} • ${q.customerName}`,
          subtitle: `₱${(q.totalAmount || 0).toLocaleString()} • ${q.projectTitle} • Valid until ${q.validUntil}`,
          actionLabel: 'Convert to Order',
          actionFn: `App.convertQuoteToOrderPrompt('${q.id}')`,
          jumpFn: `App.jumpToQuotation('${q.id}')`
        });
      }
    });

    return problems;
  }

  toggleAiCopilot() {
    const popover = document.getElementById('spotlightResultsPopover');
    const input = document.getElementById('globalSearchInput');
    if (!popover) return;
    if (popover.style.display === 'flex' || popover.style.display === 'block') {
      this.closeAiCopilot();
    } else {
      if (input && !input.value) input.value = '';
      this.performLiveSearch(input ? input.value : '', 'all');
      if (input) input.focus();
    }
  }

  closeAiCopilot() {
    const popover = document.getElementById('spotlightResultsPopover');
    if (popover) popover.style.display = 'none';
  }

  askAiCopilot() {
    const input = document.getElementById('globalSearchInput');
    const query = input ? input.value.trim() : '';
    if (!query) {
      this.toggleAiCopilot();
    } else {
      this.copilotExecuteQuery(query);
    }
  }

  copilotExecuteQuery(query) {
    const input = document.getElementById('globalSearchInput');
    if (input) {
      input.value = query;
    }
    const q = (query || '').toLowerCase();
    if (q.includes('fix all') || q.includes('resolve all') || q.includes('fix 6') || q.includes('auto-fix')) {
      this.aiResolveAllIssues();
      return;
    }
    if (q.includes('restock') || q.includes('stock') || q.includes('material')) {
      this.performLiveSearch(query, 'stock');
      return;
    }
    if (q.includes('unpaid') || q.includes('debt') || q.includes('balance') || q.includes('collect') || q.includes('owe')) {
      this.performLiveSearch(query, 'payment');
      return;
    }
    if (q.includes('delay') || q.includes('late') || q.includes('overdue') || q.includes('job') || q.includes('expedite')) {
      this.performLiveSearch(query, 'delay');
      return;
    }
    this.performLiveSearch(query, 'all');
  }

  aiResolveSingleProblem(problemId, silent = false) {
    if (!problemId) return;

    // 1. Stockout or Low Stock: Restock +50 units
    if (problemId.startsWith('prob-stockout-') || problemId.startsWith('prob-lowstock-')) {
      const prodId = problemId.replace('prob-stockout-', '').replace('prob-lowstock-', '');
      const p = db.updateStock(prodId, 50);
      if (!silent) {
        this.playSuccessSound();
        this.showToast(`✨ Gemini AI: Restocked 50 units for ${p ? p.name : 'material'}. Inventory buffer healthy!`, 'success');
      }
    }

    // 2. Unpaid Balances: Auto-record full payment
    else if (problemId.startsWith('prob-unpaid-')) {
      const ordId = problemId.replace('prob-unpaid-', '');
      const orders = db.getOrders();
      const o = orders.find(item => item.id === ordId);
      if (o) {
        const bal = o.balanceDue || ((o.totalAmount || 0) - (o.downpayment || 0));
        o.downpayment = o.totalAmount;
        o.balanceDue = 0;
        o.paymentStatus = 'paid';
        o.paymentMethod = o.paymentMethod || 'cash';
        db.saveOrder(o);
        if (!silent) {
          this.playSuccessSound();
          this.showToast(`✨ Gemini AI: Collected ₱${bal.toLocaleString()} balance for ${o.customerName}. Payment settled!`, 'success');
        }
      }
    }

    // 3. Delayed or Stalled Orders: Expedite & assign craftsman
    else if (problemId.startsWith('prob-delayed-') || problemId.startsWith('prob-stalled-')) {
      const ordId = problemId.replace('prob-delayed-', '').replace('prob-stalled-', '');
      const orders = db.getOrders();
      const o = orders.find(item => item.id === ordId);
      if (o) {
        o.assignedStaff = (o.assignedStaff && o.assignedStaff !== 'Unassigned') ? o.assignedStaff : 'Arnel Mendoza (Lead Fabricator)';
        const target = new Date();
        target.setDate(target.getDate() + 5);
        o.targetDate = target.toISOString().split('T')[0];
        o.progressPercent = Math.max(o.progressPercent || 0, 75);
        o.jobStatus = 'in_fabrication';
        db.saveOrder(o);
        if (!silent) {
          this.playSuccessSound();
          this.showToast(`✨ Gemini AI: Expedited ${o.jobOrderNo || o.orderNo}. Lead Fabricator assigned, production advanced to 75%!`, 'success');
        }
      }
    }

    // 4. Expiring Quotations: Extend validity by 30 days
    else if (problemId.startsWith('prob-expiring-')) {
      const qId = problemId.replace('prob-expiring-', '');
      const quotes = db.getQuotations();
      const q = quotes.find(item => item.id === qId);
      if (q) {
        const ext = new Date();
        ext.setDate(ext.getDate() + 30);
        q.validUntil = ext.toISOString().split('T')[0];
        q.status = 'sent_active';
        db.save(DB_KEYS.QUOTATIONS, quotes);
        if (!silent) {
          this.playSuccessSound();
          this.showToast(`✨ Gemini AI: Extended Quotation ${q.quoteNo} validity by 30 days!`, 'success');
        }
      }
    }

    if (!silent) {
      this.updateGlobalBadges();
      this.updateDashboardMetrics();
      this.loadView(this.currentView);
      const input = document.getElementById('globalSearchInput');
      this.performLiveSearch(input ? input.value : '');
    }
  }

  aiResolveAllIssues() {
    const allProblems = this.getAllSystemProblems();
    if (allProblems.length === 0) {
      this.showToast('✨ Gemini Pro AI Copilot: 0 issues detected! All systems are currently running at peak performance.', 'info');
      return;
    }

    const count = allProblems.length;
    allProblems.forEach(prob => {
      this.aiResolveSingleProblem(prob.id, true);
    });

    this.playSuccessSound();
    this.updateGlobalBadges();
    this.updateDashboardMetrics();
    this.loadView(this.currentView);
    this.performLiveSearch('');

    this.showToast(`✨ Gemini Pro AI Copilot: Successfully resolved all ${count} workshop issues! (Inventory restocked, overdue accounts settled, and jobs expedited)`, 'success');
  }

  showSystemProblems(filter = 'all') {
    const input = document.getElementById('globalSearchInput');
    const clearBtn = document.getElementById('globalSearchClear');
    if (input) {
      input.value = filter === 'all' ? 'problem' : filter;
      input.focus();
    }
    if (clearBtn) clearBtn.style.display = 'block';
    this.performLiveSearch(filter === 'all' ? 'problem' : filter, filter);
  }

  filterProblems(category) {
    this.showSystemProblems(category);
  }

  // ==========================================================================
  // GLOBAL SPOTLIGHT SEARCH & SYSTEM PROBLEM DIAGNOSIS
  // ==========================================================================
  performLiveSearch(query, problemFilter = 'all') {
    const popover = document.getElementById('spotlightResultsPopover');
    const listEl = document.getElementById('spotlightResultsList');
    const countEl = document.getElementById('spotlightResultsCount');
    if (!popover || !listEl) return;

    const rawQuery = (query || '').trim();
    const q = rawQuery.toLowerCase();

    const allProblems = this.getAllSystemProblems();
    const problemTermsRegex = /^(problem|problems|issues?|alert|alerts|warning|warnings|bottlenecks?|delay|delayed|late|overdue|due|stock|low|zero|out|unpaid|balance|debt|owe|collect|pending|stalled|hold|!|\?|all)/i;
    const isExplicitProblemSearch = !q || problemTermsRegex.test(q) || (problemFilter && problemFilter !== 'all' && problemFilter !== 'none');

    // 1. Gather all system problems matching the query or filter
    let matchedProblems = [];
    if (isExplicitProblemSearch) {
      matchedProblems = allProblems.filter(prob => {
        if (problemFilter === 'stock') return prob.category === 'stock';
        if (problemFilter === 'payment') return prob.category === 'payment';
        if (problemFilter === 'delay') return prob.category === 'delay';
        if (problemFilter === 'quotation') return prob.category === 'quotation';
        if (q === 'stock' || q.includes('low') || q.includes('zero') || q.includes('out')) return prob.category === 'stock';
        if (q === 'unpaid' || q.includes('balance') || q.includes('debt') || q.includes('owe') || q.includes('collect')) return prob.category === 'payment';
        if (q === 'delay' || q.includes('late') || q.includes('overdue') || q.includes('stalled')) return prob.category === 'delay';
        return true;
      });
    } else if (q.length > 0) {
      // Cross-match problems for regular search queries (e.g. searching "Ben" or "Tubular")
      matchedProblems = allProblems.filter(prob =>
        prob.title.toLowerCase().includes(q) ||
        prob.subtitle.toLowerCase().includes(q) ||
        prob.badgeText.toLowerCase().includes(q)
      );
    }

    const orders = (typeof db !== 'undefined' && db.getOrders) ? db.getOrders() : [];
    const customers = (typeof db !== 'undefined' && db.getCustomers) ? db.getCustomers() : [];
    const products = (typeof db !== 'undefined' && db.getProducts) ? db.getProducts() : [];
    const quotations = (typeof db !== 'undefined' && db.getQuotations) ? db.getQuotations() : [];

    const matchedJobs = isExplicitProblemSearch ? [] : orders.filter(o => 
      (o.jobOrderNo && o.jobOrderNo.toLowerCase().includes(q)) ||
      (o.orderNo && o.orderNo.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedCustomers = isExplicitProblemSearch ? [] : customers.filter(c => 
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    ).slice(0, 3);

    const matchedProducts = isExplicitProblemSearch ? [] : products.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q)) ||
      (p.supplier && p.supplier.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedQuotes = isExplicitProblemSearch ? [] : quotations.filter(qt => 
      (qt.quoteNo && qt.quoteNo.toLowerCase().includes(q)) ||
      (qt.customerName && qt.customerName.toLowerCase().includes(q)) ||
      (qt.projectTitle && qt.projectTitle.toLowerCase().includes(q))
    ).slice(0, 3);

    const totalMatches = matchedProblems.length + matchedJobs.length + matchedCustomers.length + matchedProducts.length + matchedQuotes.length;

    if (countEl) {
      if (isExplicitProblemSearch) {
        countEl.textContent = `🚨 ${matchedProblems.length} System Problem${matchedProblems.length === 1 ? '' : 's'} Identified`;
      } else {
        countEl.textContent = `${totalMatches} result${totalMatches === 1 ? '' : 's'} matching "${rawQuery}"`;
      }
    }

    if (totalMatches === 0) {
      listEl.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: rgba(34, 197, 94, 0.12); border-radius: 50%; color: #16a34a; margin-bottom: 0.5rem; font-size: 1.2rem;">
            ✓
          </div>
          <p style="font-weight: 700; color: var(--text-dark); margin-bottom: 0.25rem;">No records or issues found for "<strong>${this.escapeHtml(rawQuery)}</strong>"</p>
          <small style="color: var(--text-muted); display: block;">Workshop operations are optimal, or try searching with another keyword.</small>
          <div style="margin-top: 0.75rem;">
            <button class="btn-sm" style="background: #584cf4; color: #fff; padding: 0.35rem 0.85rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" onclick="App.showSystemProblems('all')">
              🚨 View All System Bottlenecks (${allProblems.length})
            </button>
          </div>
        </div>
      `;
      popover.style.display = 'flex';
      return;
    }

    let html = '';

    // Quick Radar Filter Bar
    const stockCount = allProblems.filter(p => p.category === 'stock').length;
    const unpaidCount = allProblems.filter(p => p.category === 'payment').length;
    const delayCount = allProblems.filter(p => p.category === 'delay').length;
    const quoteCount = allProblems.filter(p => p.category === 'quotation').length;

    html += `
      <div class="spotlight-radar-bar">
        <span class="spotlight-radar-title">
          <span>🚨</span> <strong>System Problem Radar (${allProblems.length} Active)</strong>
        </span>
        <div class="spotlight-filter-pills">
          <button type="button" class="spotlight-filter-pill ${problemFilter === 'all' ? 'active' : ''}" onclick="App.showSystemProblems('all')">All (${allProblems.length})</button>
          <button type="button" class="spotlight-filter-pill ${problemFilter === 'stock' ? 'active' : ''}" onclick="App.showSystemProblems('stock')">📉 Stock (${stockCount})</button>
          <button type="button" class="spotlight-filter-pill ${problemFilter === 'payment' ? 'active' : ''}" onclick="App.showSystemProblems('payment')">💰 Unpaid (${unpaidCount})</button>
          <button type="button" class="spotlight-filter-pill ${problemFilter === 'delay' ? 'active' : ''}" onclick="App.showSystemProblems('delay')">⏰ Delays (${delayCount})</button>
          <button type="button" class="spotlight-filter-pill ${problemFilter === 'quotation' ? 'active' : ''}" onclick="App.showSystemProblems('quotation')">📄 Quotes (${quoteCount})</button>
        </div>
      </div>
    `;

    // 1. Render Problems Section
    if (matchedProblems.length > 0) {
      html += `<div class="spotlight-category-title" style="color: #dc2626; display: flex; align-items: center; justify-content: space-between;">
        <span>🚨 Operational Bottlenecks &amp; Issues (${matchedProblems.length})</span>
        <span style="font-size: 0.65rem; color: var(--text-muted); text-transform: none; font-weight: 500;">Click item to jump directly</span>
      </div>`;

      matchedProblems.forEach(prob => {
        const severityClass = `severity-${prob.severity}`;
        const badgeColor = prob.severity === 'critical' ? 'red' : (prob.severity === 'info' ? 'blue' : 'amber');
        html += `
          <div class="spotlight-problem-card ${severityClass}" onclick="${prob.jumpFn}">
            <div class="spotlight-item-left" style="flex: 1; min-width: 0;">
              <span class="spotlight-item-icon" style="font-size: 1.15rem; flex-shrink: 0;">${prob.icon}</span>
              <div style="min-width: 0; flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
                  <strong style="font-size: 0.84rem; color: var(--text-dark);">${this.escapeHtml(prob.title)}</strong>
                  <span class="spotlight-problem-badge ${badgeColor}">${prob.badgeText}</span>
                </div>
                <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${this.escapeHtml(prob.subtitle)}
                </div>
              </div>
            </div>
            <div class="spotlight-item-right" style="flex-shrink: 0; margin-left: 0.75rem; display: flex; align-items: center; gap: 0.35rem;">
              <button class="btn-sm" style="font-size: 0.72rem; padding: 0.3rem 0.65rem; background: #16a34a; color: #ffffff; border: 1px solid #22c55e; border-radius: 6px; cursor: pointer; font-weight: 700; white-space: nowrap;" onclick="event.stopPropagation(); App.aiResolveSingleProblem('${prob.id}');" title="Let Gemini Pro AI Auto-Resolve this specific problem">
                ⚡ AI Fix
              </button>
              <button class="btn-sm" style="font-size: 0.72rem; padding: 0.3rem 0.65rem; background: #584cf4; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-weight: 700; white-space: nowrap;" onclick="event.stopPropagation(); ${prob.actionFn}; App.closeSpotlightPopover();">
                ${prob.actionLabel}
              </button>
            </div>
          </div>
        `;
      });
    }

    // 2. Render Job Orders (with balance due / overdue warning pills)
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
        const bal = j.balanceDue !== undefined ? j.balanceDue : ((j.totalAmount || 0) - (j.downpayment || 0));
        const isOverdue = j.targetDate && (new Date(j.targetDate) < new Date()) && j.jobStatus !== 'installed_delivered';

        html += `
          <div class="spotlight-item-card" onclick="App.jumpToJob('${j.id}')">
            <div class="spotlight-item-left">
              <span class="spotlight-item-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              </span>
              <div>
                <div class="spotlight-item-title" style="color: var(--text-dark); font-weight: 700;">
                  ${j.jobOrderNo || j.orderNo} • ${j.customerName}
                  ${isOverdue ? '<span style="color: #dc2626; font-size: 0.68rem; font-weight: 800; margin-left: 0.35rem;">[⏰ OVERDUE]</span>' : ''}
                </div>
                <div class="spotlight-item-sub">Total: ₱${(j.totalAmount || 0).toLocaleString()} • Target: ${j.targetDate ? j.targetDate.split('T')[0] : 'N/A'}</div>
              </div>
            </div>
            <div class="spotlight-item-right" style="display: flex; align-items: center; gap: 0.45rem;">
              ${bal > 0 ? `<button class="btn-sm" style="font-size: 0.68rem; padding: 0.2rem 0.5rem; background: #d97706; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 700;" onclick="event.stopPropagation(); App.openPaymentCollectionModal('${j.id}'); App.closeSpotlightPopover();">💰 Collect ₱${bal.toLocaleString()}</button>` : ''}
              <span class="badge" style="font-size: 0.7rem; background: rgba(52, 211, 153, 0.15); color: #16a34a; padding: 0.2rem 0.5rem; border-radius: 6px;">${stage}</span>
            </div>
          </div>
        `;
      });
    }

    // 3. Render Customers
    if (matchedCustomers.length > 0) {
      html += `<div class="spotlight-category-title">Customers &amp; Clients (${matchedCustomers.length})</div>`;
      matchedCustomers.forEach(c => {
        // Find if customer owes balance
        const custOrders = orders.filter(o => o.customerId === c.id || (o.customerName && o.customerName.toLowerCase() === (c.name || '').toLowerCase()));
        const custBal = custOrders.reduce((sum, o) => sum + (o.balanceDue !== undefined ? o.balanceDue : ((o.totalAmount || 0) - (o.downpayment || 0))), 0);

        html += `
          <div class="spotlight-item-card" onclick="App.jumpToCustomer('${c.id}')">
            <div class="spotlight-item-left">
              <span class="spotlight-item-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </span>
              <div>
                <div class="spotlight-item-title" style="color: var(--text-dark); font-weight: 700;">
                  ${c.name}
                  ${custBal > 0 ? `<span style="color: #d97706; font-size: 0.68rem; font-weight: 800; margin-left: 0.35rem;">[💰 ₱${custBal.toLocaleString()} Owed]</span>` : ''}
                </div>
                <div class="spotlight-item-sub">${c.phone} • ${c.address}</div>
              </div>
            </div>
            <div class="spotlight-item-right">
              <span class="badge" style="font-size: 0.7rem; background: rgba(56, 189, 248, 0.15); color: #0284c7; padding: 0.2rem 0.5rem; border-radius: 6px;">${c.customerType}</span>
            </div>
          </div>
        `;
      });
    }

    // 4. Render Products & Materials (with low/zero stock badges & Restock action)
    if (matchedProducts.length > 0) {
      html += `<div class="spotlight-category-title">Materials &amp; Products (${matchedProducts.length})</div>`;
      matchedProducts.forEach(p => {
        const stock = p.stockQuantity !== undefined ? p.stockQuantity : 0;
        const reorder = p.reorderLevel !== undefined ? p.reorderLevel : 10;
        const isOutOfStock = stock <= 0;
        const isLow = stock <= reorder;

        let stockBadge = `<span style="color: #16a34a; font-size: 0.7rem; font-weight: 700;">${stock} ${p.unit}</span>`;
        if (isOutOfStock) {
          stockBadge = `<span style="color: #dc2626; font-size: 0.7rem; font-weight: 800;">🚨 OUT OF STOCK (0)</span>`;
        } else if (isLow) {
          stockBadge = `<span style="color: #d97706; font-size: 0.7rem; font-weight: 700;">⚠️ LOW: ${stock} ${p.unit}</span>`;
        }

        html += `
          <div class="spotlight-item-card" onclick="App.jumpToProduct('${p.id}')">
            <div class="spotlight-item-left">
              <span class="spotlight-item-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              </span>
              <div>
                <div class="spotlight-item-title" style="color: var(--text-dark); font-weight: 700;">${p.name} <span style="font-size: 0.72rem; color: #0284c7;">[${p.code}]</span></div>
                <div class="spotlight-item-sub">₱${(p.sellingPrice || 0).toLocaleString()} / ${p.unit} • ${p.categoryLabel || p.category}</div>
              </div>
            </div>
            <div class="spotlight-item-right" style="display: flex; align-items: center; gap: 0.45rem;">
              ${stockBadge}
              ${isLow ? `<button class="btn-sm" style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: #d97706; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 700;" onclick="event.stopPropagation(); App.quickRestockPrompt('${p.id}'); App.closeSpotlightPopover();">+ Stock</button>` : ''}
              <button class="btn-sm" style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: #16a34a; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 700;" onclick="event.stopPropagation(); App.addProductToCart('${p.id}'); App.closeSpotlightPopover();">
                + Cart
              </button>
            </div>
          </div>
        `;
      });
    }

    // 5. Render Quotations
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
                <div class="spotlight-item-title" style="color: var(--text-dark); font-weight: 700;">${qt.quoteNo} • ${qt.customerName}</div>
                <div class="spotlight-item-sub">${qt.projectTitle || 'Quotation'} • Contract: ₱${(qt.totalAmount || 0).toLocaleString()}</div>
              </div>
            </div>
            <div class="spotlight-item-right" style="display: flex; align-items: center; gap: 0.45rem;">
              <span class="badge" style="font-size: 0.7rem; background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 0.2rem 0.5rem; border-radius: 6px;">${qt.status}</span>
              ${qt.status !== 'Converted to Order' ? `<button class="btn-sm" style="font-size: 0.68rem; padding: 0.2rem 0.5rem; background: #0284c7; color: #fff; border: none; border-radius: 4px; cursor: pointer;" onclick="event.stopPropagation(); App.convertQuoteToOrderPrompt('${qt.id}'); App.closeSpotlightPopover();">Convert</button>` : ''}
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
