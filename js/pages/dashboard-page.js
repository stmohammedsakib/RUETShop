// js/pages/dashboard-page.js — Enhanced with vendor analytics, low-stock alerts, order tracking

const DashboardPage = (() => {
  let currentUser = null;
  let activeTab = "overview";
  let deleteTargetId = null;

  // ── Auth guard ─────────────────────────────────────────────
  function guardAuth() {
    currentUser = Auth.getSession();
    if (!currentUser) {
      window.location.href = "auth.html";
      return false;
    }
    return true;
  }

  // ── Tab switching ──────────────────────────────────────────
  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll(".dash-nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.tab === tab);
    });
    document.querySelectorAll(".dash-tab").forEach((panel) => {
      panel.classList.toggle("hidden", panel.id !== `tab-${tab}`);
      if (panel.id === `tab-${tab}`) panel.classList.add("active");
      else panel.classList.remove("active");
    });
    renderPanel(tab);
  }

  function renderPanel(tab) {
    switch (tab) {
      case "overview":  renderOverview();    break;
      case "orders":    renderOrders();      break;
      case "sales":     renderSales();       break;
      case "products":  renderMyProducts();  break;
      case "wishlist":  renderWishlist();    break;
      case "profile":   renderProfile();     break;
    }
  }

  // ── Sidebar setup ──────────────────────────────────────────
  function setupSidebar() {
    const avatar   = document.getElementById("dashAvatar");
    const userName = document.getElementById("dashUserName");
    const roleEl   = document.getElementById("dashRole");

    if (avatar) {
      if (currentUser.avatar) {
        avatar.innerHTML = `<img src="${Utils.sanitizeUrl(currentUser.avatar)}" alt="Avatar"
          onerror="this.onerror=null;this.parentElement.textContent='${currentUser.name[0].toUpperCase()}';"
          style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        avatar.style.background = 'transparent';
      } else {
        avatar.textContent = currentUser.name[0].toUpperCase();
        avatar.style.background = 'var(--primary)';
      }
    }
    if (userName) userName.textContent = currentUser.name;
    if (roleEl) {
      const roleLabel = currentUser.role === "vendor" ? "Vendor"
                      : currentUser.role === "admin"  ? "Admin"
                      : "Normal User";
      roleEl.textContent = roleLabel;
      if (currentUser.role === "vendor") roleEl.classList.add("vendor");
    }

    // Sidebar nav visibility — only show products tab for vendors/users who have products
    const vendorNav = document.getElementById("vendorOnlyNav");
    if (vendorNav) {
      // Show "My Products" tab only for vendors (or users who already have products)
      const myProducts = Products.getAll().filter(p => p.vendorId === currentUser.id);
      vendorNav.style.display = (currentUser.role === 'vendor' || myProducts.length > 0) ? 'flex' : 'none';
    }

    const ordersNav = document.querySelector('.dash-nav-item[data-tab="orders"]');
    const wishlistNav = document.querySelector('.dash-nav-item[data-tab="wishlist"]');
    const trackNav = document.querySelector('.dash-nav-item[data-tab="tracking"]');
    
    if (currentUser.role === "vendor") {
      if (ordersNav) ordersNav.style.display = "none";
      if (wishlistNav) wishlistNav.style.display = "none";
      if (trackNav) trackNav.style.display = "none";
    }

    // Sidebar nav clicks
    document.querySelectorAll(".dash-nav-item[data-tab]").forEach((item) => {
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
      newItem.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab(newItem.dataset.tab);
      });
    });

    // Quick action tab links
    document.querySelectorAll("[data-tab-link]").forEach((link) => {
      const newLink = link.cloneNode(true);
      link.parentNode.replaceChild(newLink, link);
      newLink.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab(newLink.dataset.tabLink);
      });
    });

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      const newLogout = logoutBtn.cloneNode(true);
      logoutBtn.parentNode.replaceChild(newLogout, logoutBtn);
      newLogout.addEventListener("click", () => {
        Modal.confirm({
          title: 'Logout',
          message: 'Are you sure you want to logout?',
          onConfirm: () => {
            Auth.logout();
            window.location.href = "index.html";
          }
        });
      });
    }
  }

  // ── Order Handlers ─────────────────────────────────────────
  function cancelOrder(orderId) {
    Modal.confirm({
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order?',
      onConfirm: () => {
        const res = Orders.cancel(orderId);
        if (res.ok) {
          Toast.success("Order cancelled successfully.");
          renderOrders();
          renderSales();
          renderOverview();
        } else {
          Toast.error(res.error || "Failed to cancel order.");
        }
      }
    });
  }

  function markOrderReceived(orderId) {
    Modal.confirm({
      title: 'Confirm Received',
      message: 'Mark this order as received?',
      onConfirm: () => {
        const res = Orders.markReceived(orderId);
        if (res.ok) {
          Toast.success("Order marked as received.");
          renderOrders();
          renderOverview();
        } else {
          Toast.error(res.error || "Failed to update.");
        }
      }
    });
  }

  function updateSalesStatus(orderId, status) {
    const res = Orders.updateStatus(orderId, status);
    if (res.ok) {
      Toast.success(`Order status updated to ${status}.`);
      renderSales();
      renderOverview();
    } else {
      Toast.error(res.error || "Failed to update status.");
    }
  }

  // ── Overview panel ─────────────────────────────────────────
  function renderOverview() {
    const statsCards   = document.getElementById("statsCards");
    if (!statsCards) return;

    const orders       = Orders.getMyOrders();
    const myProducts   = Products.getAll().filter(p => p.vendorId === currentUser.id);
    const totalSpent   = orders.reduce((sum, o) => sum + o.total, 0);
    const wishlistCount = Wishlist.count();
    const lowStockProducts = myProducts.filter(p => p.stock > 0 && p.stock < 5);
    const outOfStock       = myProducts.filter(p => p.stock === 0);

    // ── Stats ──
    let statsHtml = '';
    if (currentUser.role !== "vendor") {
      statsHtml += `
        <div class="stat-card">
          <div class="stat-card-icon">📦</div>
          <div class="stat-card-value">${orders.length}</div>
          <div class="stat-card-label">My Purchases</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">💳</div>
          <div class="stat-card-value">${Products.formatPrice(totalSpent)}</div>
          <div class="stat-card-label">Total Spent</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">❤️</div>
          <div class="stat-card-value">${wishlistCount}</div>
          <div class="stat-card-label">Wishlist Items</div>
        </div>`;
    }

    if (currentUser.role === "vendor" || currentUser.role === "admin" || myProducts.length > 0) {
      const vendorOrders = Orders.getVendorOrders();
      const totalRevenue = vendorOrders.reduce((s, o) => {
        if (o.status === "cancelled") return s;
        return s + (o.subtotal || o.total || 0);
      }, 0);
      const totalUnitsSold = myProducts.reduce((s, p) => s + (p.sold || 0), 0);

      statsHtml += `
        <div class="stat-card">
          <div class="stat-card-icon">🏪</div>
          <div class="stat-card-value">${myProducts.length}</div>
          <div class="stat-card-label">My Products</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">💰</div>
          <div class="stat-card-value">${Products.formatPrice(totalRevenue)}</div>
          <div class="stat-card-label">Total Revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">📋</div>
          <div class="stat-card-value">${vendorOrders.length}</div>
          <div class="stat-card-label">Sales Orders</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">🛍️</div>
          <div class="stat-card-value">${totalUnitsSold}</div>
          <div class="stat-card-label">Units Sold</div>
        </div>`;
    }

    statsCards.innerHTML = statsHtml;

    // ── Low stock alert banner for vendors ──
    const alertBanner = document.getElementById("stockAlertBanner");
    if (currentUser.role === "vendor" && alertBanner) {
      if (lowStockProducts.length || outOfStock.length) {
        alertBanner.innerHTML = `
          <div class="stock-alert-banner">
            ${outOfStock.length ? `
              <div class="stock-alert out-of-stock">
                <i class="fas fa-exclamation-circle"></i>
                <strong>${outOfStock.length} product${outOfStock.length > 1 ? 's' : ''} out of stock!</strong>
                <span>${outOfStock.map(p => Utils.escapeHtml(p.name)).join(', ')}</span>
                <button class="btn btn-outline btn-sm" onclick="DashboardPage.switchTab('products')">Manage →</button>
              </div>` : ''}
            ${lowStockProducts.length ? `
              <div class="stock-alert low-stock">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>${lowStockProducts.length} product${lowStockProducts.length > 1 ? 's' : ''} running low!</strong>
                <span>${lowStockProducts.map(p => `${Utils.escapeHtml(p.name)} (${p.stock} left)`).join(', ')}</span>
                <button class="btn btn-outline btn-sm" onclick="DashboardPage.switchTab('products')">Manage →</button>
              </div>` : ''}
          </div>`;
        alertBanner.classList.remove("hidden");
      } else {
        alertBanner.classList.add("hidden");
      }
    }

    // ── dashGrid2 ──
    const dashGrid2 = document.getElementById("dashGrid2");
    if (dashGrid2) {
      if (currentUser.role === "vendor") {
        dashGrid2.innerHTML = `
          <div class="dash-card">
            <h3><i class="fas fa-hand-holding-usd" style="color:var(--primary);margin-right:0.4rem"></i>Recent Sales</h3>
            <div id="recentOrders"></div>
            <a href="#" onclick="DashboardPage.switchTab('sales'); return false;"
               style="display:inline-flex;align-items:center;gap:0.4rem;margin-top:0.75rem;font-size:0.85rem;color:var(--primary);">
              <i class="fas fa-list"></i> View all sales
            </a>
          </div>
          <div class="dash-card">
            <h3><i class="fas fa-bolt" style="color:var(--primary);margin-right:0.4rem"></i>Quick Actions</h3>
            <div class="quick-actions">
              <a href="#" class="qa-btn" onclick="DashboardPage.switchTab('products'); return false;"><i class="fas fa-search"></i> Browse Products</a>
              <a href="#" class="qa-btn" onclick="DashboardPage.openAddProduct(); return false;"><i class="fas fa-plus"></i> Add Product</a>
              <a href="#" class="qa-btn" onclick="DashboardPage.switchTab('sales'); return false;"><i class="fas fa-list"></i> All Sales</a>
            </div>
          </div>
        `;
      } else {
        dashGrid2.innerHTML = `
          <div class="dash-card">
            <h3><i class="fas fa-shopping-bag" style="color:var(--primary);margin-right:0.4rem"></i>Recent Orders</h3>
            <div id="recentOrders"></div>
            <a href="#" onclick="DashboardPage.switchTab('tracking'); return false;"
               style="display:inline-flex;align-items:center;gap:0.4rem;margin-top:0.75rem;font-size:0.85rem;color:var(--primary);">
              <i class="fas fa-map-marker-alt"></i> Track an order
            </a>
          </div>
          <div class="dash-card">
            <h3><i class="fas fa-bolt" style="color:var(--primary);margin-right:0.4rem"></i>Quick Actions</h3>
            <div class="quick-actions">
              <a href="products.html" class="qa-btn"><i class="fas fa-search"></i> Browse Products</a>
              <a href="cart.html"     class="qa-btn"><i class="fas fa-shopping-cart"></i> View Cart</a>
              <a class="qa-btn" data-tab-link="orders"><i class="fas fa-list"></i> All Orders</a>
              <a class="qa-btn" data-tab-link="tracking">
                <i class="fas fa-map-marker-alt"></i> Track Order
              </a>
              <a class="qa-btn" data-tab-link="wishlist"><i class="fas fa-heart"></i> Wishlist</a>
            </div>
          </div>
        `;
      }

      dashGrid2.querySelectorAll("[data-tab-link]").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          switchTab(link.dataset.tabLink);
        });
      });
    }

    // ── Recent orders list filling ──
    const recentOrdersContainer = document.getElementById("recentOrders");
    if (recentOrdersContainer) {
      if (currentUser.role === "vendor") {
        const vendorOrders = Orders.getVendorOrders().slice(0, 5);
        if (!vendorOrders.length) {
          recentOrdersContainer.innerHTML = `<p style="color:var(--text-3);padding:1rem 0;">No sales yet.</p>`;
        } else {
          recentOrdersContainer.innerHTML = vendorOrders.map(o => `
            <div class="recent-order-row">
              <span class="order-id">#${o.id.slice(-6).toUpperCase()}</span>
              <span class="order-date" style="flex:1;color:var(--text-3);">${Utils.escapeHtml(o.userName || '—')}</span>
              <span style="font-weight:600;color:var(--primary)">${Products.formatPrice(o.total)}</span>
              <span class="status-badge status-${o.status}">
                ${Orders.statusLabel(o.status)}
              </span>
            </div>`).join('');
        }
      } else {
        if (!orders.length) {
          recentOrdersContainer.innerHTML = `<p style="color:var(--text-3);padding:1rem 0;">
            No orders yet. <a href="products.html" style="color:var(--primary)">Start shopping!</a>
          </p>`;
        } else {
          recentOrdersContainer.innerHTML = orders.slice(0, 5).map(o => `
            <div class="recent-order-row" onclick="window.OrderTracking.trackFromDashboard('${o.id}')" style="cursor:pointer"
                 title="Track order">
              <span class="order-id">#${o.id.slice(-6).toUpperCase()}</span>
              <span class="order-date">${Orders.formatDate(o.createdAt)}</span>
              <span class="order-total">${Products.formatPrice(o.total)}</span>
              <span class="status-badge status-${o.status}">
                ${Orders.statusLabel(o.status)}
              </span>
              <i class="fas fa-external-link-alt" style="color:var(--text-3);font-size:0.78rem;margin-left:auto;"></i>
            </div>`).join('');
        }
      }
    }
  }

  // ── Orders panel (Purchases) ──────────────────────────────
  function renderOrders() {
    const ordersList = document.getElementById("ordersList");
    if (!ordersList) return;

    const orders = Orders.getMyOrders();

    if (!orders.length) {
      ordersList.innerHTML = `
        <div class="no-orders-msg">
          <span>📦</span>
          <p>You haven't placed any orders yet.</p>
          <a href="products.html" class="btn btn-primary" style="margin-top:1rem">Shop Now</a>
        </div>`;
      return;
    }

    ordersList.innerHTML = orders.map(o => {
      let actionBtn = '';
      if (['pending', 'preparing'].includes(o.status)) {
        actionBtn = `<button onclick="DashboardPage.cancelOrder('${o.id}')" class="btn btn-outline btn-sm" style="color:var(--danger);border-color:var(--danger);margin-right:0.5rem;"><i class="fas fa-times"></i> Cancel</button>`;
      } else if (o.status === 'shipped') {
        actionBtn = `<button onclick="DashboardPage.markOrderReceived('${o.id}')" class="btn btn-primary btn-sm" style="margin-right:0.5rem;"><i class="fas fa-check-circle"></i> Mark Received</button>`;
      }

      return `
      <div class="order-card">
        <div class="order-card-header">
          <span class="order-id">#${o.id.slice(-6).toUpperCase()}</span>
          <span class="order-date">${Orders.formatDate(o.createdAt)}</span>
          <span class="status-badge status-${o.status}">
            ${Orders.statusLabel(o.status)}
          </span>
          <div style="margin-left:auto">
            ${actionBtn}
            <button onclick="window.OrderTracking.trackFromDashboard('${o.id}')"
               class="btn btn-outline btn-sm"
               title="Track order">
              <i class="fas fa-map-marker-alt"></i> Track
            </button>
          </div>
        </div>
        <div class="order-card-body">
          <div class="order-items-summary">
            ${o.items.map(i => `${Utils.escapeHtml(i.name)} × ${i.qty}`).join(", ")}
          </div>
          <div class="order-card-footer">
            <div>
              <span class="order-total-label">Total</span>
              <span class="order-total-val">${Products.formatPrice(o.total)}</span>
            </div>
            <div style="display:flex;gap:0.5rem;align-items:center;">
              <span style="font-size:0.82rem;color:var(--text-3);">
                <i class="fas fa-map-marker-alt"></i> ${Utils.escapeHtml(o.shippingAddress || '—')}
              </span>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // ── Sales panel (Orders Received) ─────────────────────────
  function renderSales() {
    const salesList = document.getElementById("salesList");
    if (!salesList) return;

    const orders = Orders.getVendorOrders();

    if (!orders.length) {
      salesList.innerHTML = `
        <div class="no-orders-msg">
          <span>🏪</span>
          <p>No orders received yet.</p>
        </div>`;
      return;
    }

    salesList.innerHTML = orders.map(o => {
      let actionsHTML = '';
      if (['pending', 'preparing'].includes(o.status)) {
        actionsHTML += `<button onclick="DashboardPage.cancelOrder('${o.id}')" class="btn btn-outline btn-sm" style="color:var(--danger);border-color:var(--danger);margin-right:0.5rem;"><i class="fas fa-times"></i> Cancel</button>`;
      }
      if (o.status === 'pending') {
        actionsHTML += `<button onclick="DashboardPage.updateSalesStatus('${o.id}', 'preparing')" class="btn btn-outline btn-sm" style="margin-right:0.5rem;">Mark Preparing</button>`;
      }
      if (['pending', 'preparing'].includes(o.status)) {
        actionsHTML += `<button onclick="DashboardPage.updateSalesStatus('${o.id}', 'shipped')" class="btn btn-primary btn-sm" style="margin-right:0.5rem;"><i class="fas fa-truck"></i> Mark Shipped</button>`;
      }

      return `
      <div class="order-card">
        <div class="order-card-header">
          <span class="order-id">#${o.id.slice(-6).toUpperCase()}</span>
          <span class="order-date">${Orders.formatDate(o.createdAt)}</span>
          <span class="status-badge status-${o.status}">
            ${Orders.statusLabel(o.status)}
          </span>
          <div style="margin-left:auto">
            ${actionsHTML}
          </div>
        </div>
        <div class="order-card-body">
          <div class="order-items-summary" style="margin-bottom:0.5rem;">
            <strong>Buyer:</strong> ${Utils.escapeHtml(o.userName)} <br/>
            <strong>Phone:</strong> ${Utils.escapeHtml(o.phone)}
          </div>
          <div class="order-items-summary">
            ${o.items.map(i => `${Utils.escapeHtml(i.name)} × ${i.qty}`).join(", ")}
          </div>
          <div class="order-card-footer">
            <div>
              <span class="order-total-label">Total</span>
              <span class="order-total-val">${Products.formatPrice(o.total)}</span>
            </div>
            <div style="display:flex;gap:0.5rem;align-items:center;">
              <span style="font-size:0.82rem;color:var(--text-3);">
                <i class="fas fa-map-marker-alt"></i> ${Utils.escapeHtml(o.shippingAddress || '—')}
              </span>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // ── Wishlist panel ─────────────────────────────────────────
  function renderWishlist() {
    const grid = document.getElementById("wishlistGrid");
    if (!grid) return;

    const products = Wishlist.getProducts();

    if (!products.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <span>❤️</span>
          <p>Your wishlist is empty.</p>
          <a href="products.html" class="btn btn-primary" style="margin-top:1rem">Browse Products</a>
        </div>`;
      return;
    }

    grid.innerHTML = products.map(p => {
      const discount = Products.discountPercent(p);
      const hasImage = p.images && p.images.length > 0;
      return `
        <div class="product-card" data-id="${p.id}">
          <a href="product-detail.html?id=${p.id}" class="product-card-img">
            ${hasImage
              ? `<img src="${Utils.sanitizeUrl(p.images[0])}" alt="${Utils.escapeHtml(p.name)}"
                       loading="lazy" onerror="this.src='assets/images/placeholder.svg'">`
              : `<span>${p.emoji || "📦"}</span>`}
            ${discount > 0 ? `<span class="card-badge">-${discount}%</span>` : ""}
          </a>
          <div class="product-card-body">
            <span class="product-card-category">${Utils.escapeHtml(p.category)}</span>
            <a href="product-detail.html?id=${p.id}" class="product-card-name">${Utils.escapeHtml(p.name)}</a>
            <div class="product-card-price">
              <span class="price-current">${Products.formatPrice(p.price)}</span>
              ${p.originalPrice > p.price ? `<span class="price-original">${Products.formatPrice(p.originalPrice)}</span>` : ""}
            </div>
          </div>
          <div class="product-card-actions">
            <button class="btn btn-primary btn-sm" onclick="DashboardPage.moveToCart('${p.id}')">
              <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
            <button class="btn btn-outline btn-sm" onclick="DashboardPage.removeFromWishlist('${p.id}')"
                    title="Remove from wishlist">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>`;
    }).join('');
  }

  function moveToCart(productId) {
    const result = Cart.add(productId);
    if (result.ok) {
      Wishlist.remove(productId);
      Toast.success("Moved to cart!");
      Navbar.updateCartBadge();
      Navbar.updateWishlistBadge();
      renderWishlist();
    } else {
      Toast.error(result.error || "Could not add to cart.");
    }
  }

  function removeFromWishlist(productId) {
    Wishlist.remove(productId);
    Toast.info("Removed from wishlist");
    Navbar.updateWishlistBadge();
    renderWishlist();
  }

  // ── Vendor: My Products panel ──────────────────────────────
  function renderMyProducts() {
    const tableBody = document.getElementById("productsTableBody");
    const noProducts = document.getElementById("noProducts");
    if (!tableBody) return;

    const myProducts = Products.getAll().filter(p => p.vendorId === currentUser.id);

    if (!myProducts.length) {
      tableBody.innerHTML = "";
      noProducts?.classList.remove("hidden");
      return;
    }

    noProducts?.classList.add("hidden");
    tableBody.innerHTML = myProducts.map(p => `
      <tr>
        <td><div class="table-emoji">${p.emoji || "📦"}</div></td>
        <td>
          <strong>${Utils.escapeHtml(p.name)}</strong>
          ${p.sold > 0 ? `<br><span style="font-size:0.75rem;color:var(--text-3);">${p.sold} sold</span>` : ''}
        </td>
        <td>${p.category}</td>
        <td>${Products.formatPrice(p.price)}</td>
        <td>
          <span style="color:${p.stock === 0 ? 'var(--danger)' : p.stock < 5 ? 'var(--warning)' : 'inherit'};font-weight:${p.stock < 5 ? '700' : '400'}">
            ${p.stock === 0 ? '⚠️ Out of Stock' : p.stock < 5 ? `⚡ ${p.stock} left` : p.stock}
          </span>
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="DashboardPage.openEditProduct('${p.id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="DashboardPage.confirmDeleteProduct('${p.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`).join('');
  }

  // ── Product Add/Edit Modal ─────────────────────────────────
  function openAddProduct() {
    document.getElementById("productModalTitle").textContent = "Add Product";
    document.getElementById("editProductId").value = "";
    ["pName","pDescription","pImage","pTags","pEmoji"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    ["pCategory"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    ["pPrice","pOriginalPrice","pStock"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    document.getElementById("productModal")?.classList.remove("hidden");
  }

  function openEditProduct(productId) {
    const p = Products.getById(productId);
    if (!p) return;

    document.getElementById("productModalTitle").textContent = "Edit Product";
    document.getElementById("editProductId").value = productId;
    document.getElementById("pName").value = p.name || "";
    document.getElementById("pCategory").value = p.category || "";
    document.getElementById("pDescription").value = p.description || "";
    document.getElementById("pPrice").value = p.price || "";
    document.getElementById("pOriginalPrice").value = p.originalPrice || "";
    document.getElementById("pStock").value = p.stock ?? "";
    document.getElementById("pEmoji").value = p.emoji || "";
    document.getElementById("pImage").value = (p.images && p.images[0]) || "";
    document.getElementById("pTags").value = (p.tags || []).join(", ");
    document.getElementById("productModal")?.classList.remove("hidden");
  }

  function closeProductModal() {
    document.getElementById("productModal")?.classList.add("hidden");
  }

  function saveProduct() {
    const editId       = document.getElementById("editProductId")?.value;
    const name         = document.getElementById("pName")?.value.trim();
    const category     = document.getElementById("pCategory")?.value;
    const description  = document.getElementById("pDescription")?.value.trim();
    const price        = parseFloat(document.getElementById("pPrice")?.value);
    const originalPrice = parseFloat(document.getElementById("pOriginalPrice")?.value) || price;
    const stock        = parseInt(document.getElementById("pStock")?.value);
    const emoji        = document.getElementById("pEmoji")?.value.trim();
    const image        = document.getElementById("pImage")?.value.trim();
    const tagsStr      = document.getElementById("pTags")?.value.trim();
    const tags         = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];

    if (!name)            { Toast.warning("Product name is required."); return; }
    if (!category)        { Toast.warning("Category is required."); return; }
    if (!price || price <= 0) { Toast.warning("Enter a valid price."); return; }
    if (isNaN(stock) || stock < 0) { Toast.warning("Enter a valid stock quantity."); return; }

    const data = { name, category, description, price, originalPrice, stock, emoji,
                   images: image ? [image] : [], tags };

    const result = editId ? Products.update(editId, data) : Products.create(data);
    if (result.ok) {
      Toast.success(editId ? "Product updated!" : "Product added!");
      closeProductModal();
      renderMyProducts();
    } else {
      Toast.error(result.error || "Operation failed");
    }
  }

  // ── Delete Product ─────────────────────────────────────────
  function confirmDeleteProduct(productId) {
    deleteTargetId = productId;
    document.getElementById("deleteModal")?.classList.remove("hidden");
  }

  function executeDelete() {
    if (deleteTargetId) {
      const result = Products.remove(deleteTargetId);
      if (result.ok) {
        Toast.success("Product deleted.");
        renderMyProducts();
      } else {
        Toast.error(result.error || "Delete failed");
      }
    }
    deleteTargetId = null;
    document.getElementById("deleteModal")?.classList.add("hidden");
  }

  function cancelDelete() {
    deleteTargetId = null;
    document.getElementById("deleteModal")?.classList.add("hidden");
  }

  // ── Profile panel ──────────────────────────────────────────
  function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { Toast.error("Please select a valid image file."); return; }
    if (file.size > 500 * 1024) { Toast.error("Image too large. Please select an image under 500KB."); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Str = e.target.result;
      document.getElementById("profileAvatarBase64").value = base64Str;
      const preview = document.getElementById("profileAvatarPreview");
      if (preview) {
        preview.style.display = "block";
        preview.querySelector("img").src = base64Str;
      }
    };
    reader.readAsDataURL(file);
  }

  function renderProfile() {
    const nameEl     = document.getElementById("profileName");
    const emailEl    = document.getElementById("profileEmail");
    const avatarEl   = document.getElementById("profileAvatar");
    const avatarB64  = document.getElementById("profileAvatarBase64");
    const preview    = document.getElementById("profileAvatarPreview");
    const phoneEl    = document.getElementById("profilePhone");
    const studentEl  = document.getElementById("profileStudentId");
    const bioEl      = document.getElementById("profileBio");

    if (nameEl)    nameEl.value    = currentUser.name || "";
    if (emailEl)   emailEl.value   = currentUser.email || "";
    if (avatarEl)  avatarEl.value  = "";
    if (avatarB64) avatarB64.value = currentUser.avatar || "";
    if (phoneEl)   phoneEl.value   = currentUser.phone || "";
    if (studentEl) studentEl.value = currentUser.studentId || "";
    if (bioEl)     bioEl.value     = currentUser.bio || "";

    if (preview) {
      if (currentUser.avatar) {
        preview.style.display = "block";
        preview.querySelector("img").src = currentUser.avatar;
      } else {
        preview.style.display = "none";
      }
    }
  }

  async function saveProfile() {
    const name      = document.getElementById("profileName")?.value.trim();
    const avatar    = document.getElementById("profileAvatarBase64")?.value.trim();
    const phone     = document.getElementById("profilePhone")?.value.trim();
    const studentId = document.getElementById("profileStudentId")?.value.trim();
    const bio       = document.getElementById("profileBio")?.value.trim();

    if (!name || name.length < 3) { Toast.warning("Name must be at least 3 characters."); return; }

    const updates = { name, avatar, phone, studentId, bio };

    const result = await Auth.updateProfile(updates);
    if (result.ok) {
      currentUser = Auth.getSession();

      // Sync admin avatar to dev photos
      if (currentUser.role === 'admin' && avatar) {
        const devPhotos = DB.get("ruet_dev_photos") || {};
        if (currentUser.id === "admin_001") devPhotos.dev1 = avatar;
        if (currentUser.id === "admin_002") devPhotos.dev2 = avatar;
        if (currentUser.id === "admin_003") devPhotos.dev3 = avatar;
        DB.set("ruet_dev_photos", devPhotos);
      }

      Toast.success("Profile updated successfully!");
      setupSidebar();
    } else {
      Toast.error(result.error || "Failed to update profile.");
    }
  }

  async function savePassword() {
    const oldPassword = document.getElementById("profileOldPassword")?.value;
    const password  = document.getElementById("profilePassword")?.value;

    if (!oldPassword) {
      Toast.warning("Old password is required.");
      return;
    }
    if (!password || password.length < 6) {
      Toast.warning("New password must be at least 6 characters.");
      return;
    }

    const updates = { oldPassword, password };
    const result = await Auth.updateProfile(updates);
    if (result.ok) {
      Toast.success("Password updated successfully!");
      document.getElementById("profileOldPassword").value = "";
      document.getElementById("profilePassword").value = "";
    } else {
      Toast.error(result.error || "Failed to update password.");
    }
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    if (!guardAuth()) return;
    setupSidebar();
    renderOverview();

    // Hash-based tab switching
    const hash = location.hash.replace("#", "");
    if (["orders","products","wishlist","profile","tracking","security"].includes(hash)) switchTab(hash);

    window.addEventListener("hashchange", () => {
      const newHash = location.hash.replace("#", "");
      if (["overview","orders","products","wishlist","profile","tracking","security"].includes(newHash)) {
        switchTab(newHash);
      }
    });

    // Cross-tab / reactive UI updates
    window.addEventListener("ruet_db_update", () => {
      // Re-render the current active tab dynamically
      renderPanel(activeTab);
      // Optional: re-render the user info if profile updated
      if (activeTab !== "profile") {
         currentUser = Auth.getSession();
         setupSidebar();
      }
    });

    // Modal buttons
    document.getElementById("addProductBtn")?.addEventListener("click", openAddProduct);
    document.getElementById("closeProductModal")?.addEventListener("click", closeProductModal);
    document.getElementById("cancelProductModal")?.addEventListener("click", closeProductModal);
    document.getElementById("saveProductBtn")?.addEventListener("click", saveProduct);
    document.getElementById("confirmDelete")?.addEventListener("click", executeDelete);
    document.getElementById("cancelDelete")?.addEventListener("click", cancelDelete);
    document.getElementById("closeDeleteModal")?.addEventListener("click", cancelDelete);
    document.getElementById("saveProfile")?.addEventListener("click", saveProfile);
    document.getElementById("savePassword")?.addEventListener("click", savePassword);
    document.getElementById("profileAvatar")?.addEventListener("change", handleAvatarUpload);
  }

  document.addEventListener("DOMContentLoaded", init);

  // Expose for order tracking cross-link
  window.OrderTracking = window.OrderTracking || {};
  window.OrderTracking.trackFromDashboard = (orderId) => {
    switchTab("tracking");
    if (window.OrderTracking.trackOrder) {
      window.OrderTracking.trackOrder(orderId);
    }
  };

  return {
    switchTab,
    openAddProduct,
    openEditProduct,
    closeProductModal,
    saveProduct,
    confirmDeleteProduct,
    saveProfile,
    savePassword,
    moveToCart,
    removeFromWishlist,
    cancelOrder,
    markOrderReceived,
    updateSalesStatus,
  };
})();
