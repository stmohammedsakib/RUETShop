// js/pages/admin-page.js — Admin Panel Controller

const AdminPage = (() => {
  let currentUser = null;
  let activeTab = "overview";

  // ── Auth Guard ──────────────────────────────────────────
  function guardAuth() {
    currentUser = Auth.getSession();
    if (!currentUser || currentUser.role !== "admin") {
      Toast.error("Access denied. Admins only.");
      setTimeout(() => window.location.href = "index.html", 500);
      return false;
    }
    return true;
  }

  // ── Tab Switching ───────────────────────────────────────
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
      case "overview": renderOverview(); break;
      case "users": renderUsers(); break;
      case "products": renderProducts(); break;
      case "orders": renderOrders(); break;
      case "system": renderSystem(); break;
    }
  }

  // ── Setup Sidebar ───────────────────────────────────────
  function setupSidebar() {
    const avatar = document.getElementById("adminAvatar");
    const userName = document.getElementById("adminUserName");
    if (avatar) avatar.textContent = currentUser.name[0].toUpperCase();
    if (userName) userName.textContent = currentUser.name;

    document.querySelectorAll(".dash-nav-item[data-tab]").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab(item.dataset.tab);
      });
    });

    document.getElementById("adminLogoutBtn")?.addEventListener("click", () => {
      if (confirm("Logout from admin panel?")) {
        Auth.logout();
        window.location.href = "index.html";
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  //  OVERVIEW TAB
  // ══════════════════════════════════════════════════════════
  function renderOverview() {
    const allUsers = DB.findAll("ruet_users");
    const allProducts = Products.getAll();
    const allOrders = DB.findAll("ruet_orders");
    const totalRevenue = allOrders.reduce((s, o) => s + (o.total || 0), 0);

    const statsCards = document.getElementById("adminStatsCards");
    if (statsCards) {
      statsCards.innerHTML = `
        <div class="stat-card"><div class="stat-card-icon">👥</div>
          <div class="stat-card-value">${allUsers.length}</div>
          <div class="stat-card-label">Total Users</div></div>
        <div class="stat-card"><div class="stat-card-icon">📦</div>
          <div class="stat-card-value">${allProducts.length}</div>
          <div class="stat-card-label">Total Products</div></div>
        <div class="stat-card"><div class="stat-card-icon">🛒</div>
          <div class="stat-card-value">${allOrders.length}</div>
          <div class="stat-card-label">Total Orders</div></div>
        <div class="stat-card"><div class="stat-card-icon">💰</div>
          <div class="stat-card-value">${Products.formatPrice(totalRevenue)}</div>
          <div class="stat-card-label">Total Revenue</div></div>
        <div class="stat-card"><div class="stat-card-icon">🏪</div>
          <div class="stat-card-value">${allUsers.filter(u => u.role === "vendor").length}</div>
          <div class="stat-card-label">Vendors</div></div>
        <div class="stat-card"><div class="stat-card-icon">🛡️</div>
          <div class="stat-card-value">${allUsers.filter(u => u.role === "admin").length}</div>
          <div class="stat-card-label">Admins</div></div>
      `;
    }

    // Recent orders
    const recentOrders = document.getElementById("adminRecentOrders");
    if (recentOrders) {
      const sorted = [...allOrders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
      if (!sorted.length) {
        recentOrders.innerHTML = `<p style="color:var(--text-3); padding:0.5rem 0">No orders yet.</p>`;
      } else {
        recentOrders.innerHTML = sorted.map(o => `
          <div class="recent-order-row">
            <span class="order-id">#${o.id.slice(-6).toUpperCase()}</span>
            <span class="order-date">${Utils.formatDate(o.createdAt)}</span>
            <span style="margin-left:auto">${Products.formatPrice(o.total)}</span>
            <span class="status-badge status-${o.status === "processing" ? "pending" : o.status}">${o.status}</span>
          </div>
        `).join("");
      }
    }

    // Recent users
    const recentUsers = document.getElementById("adminRecentUsers");
    if (recentUsers) {
      const sorted = [...allUsers].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
      recentUsers.innerHTML = sorted.map(u => `
        <div class="recent-user-row">
          <span style="font-weight:500">${esc(u.name)}</span>
          <span style="color:var(--text-3);font-size:0.82rem">${u.email}</span>
          <span class="user-role-tag ${u.role}" style="margin-left:auto">${u.role}</span>
        </div>
      `).join("");
    }
  }

  // ══════════════════════════════════════════════════════════
  //  USERS TAB
  // ══════════════════════════════════════════════════════════
  function renderUsers() {
    const allUsers = DB.findAll("ruet_users");
    const roleFilter = document.getElementById("userRoleFilter")?.value || "all";
    const searchQ = (document.getElementById("userSearchInput")?.value || "").toLowerCase();

    let filtered = allUsers;
    if (roleFilter !== "all") filtered = filtered.filter(u => u.role === roleFilter);
    if (searchQ) filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(searchQ) || u.email.toLowerCase().includes(searchQ)
    );

    document.getElementById("totalUserCount").textContent = `${filtered.length} user${filtered.length !== 1 ? 's' : ''}`;

    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:2rem">No users found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(u => `
      <tr>
        <td><strong>${esc(u.name)}</strong></td>
        <td style="color:var(--text-3)">${u.email}</td>
        <td>
          <span class="user-role-tag ${u.role}">${u.role}</span>
        </td>
        <td style="font-size:0.82rem;color:var(--text-3)">${Utils.formatDate(u.createdAt)}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="AdminPage.openRoleModal('${u.id}')">
            <i class="fas fa-user-shield"></i> Role
          </button>
          ${u.id !== currentUser.id ? `
            <button class="btn btn-danger btn-sm" onclick="AdminPage.deleteUser('${u.id}')">
              <i class="fas fa-trash"></i>
            </button>
          ` : ''}
        </td>
      </tr>
    `).join("");
  }

  function openRoleModal(userId) {
    const user = DB.findById("ruet_users", userId);
    if (!user) return;
    document.getElementById("roleModalUserId").value = userId;
    document.getElementById("roleModalUserName").textContent = `Change role for: ${user.name} (${user.email})`;
    document.getElementById("roleModalSelect").value = user.role;
    document.getElementById("roleModal").classList.remove("hidden");
  }

  function confirmRoleChange() {
    const userId = document.getElementById("roleModalUserId").value;
    const newRole = document.getElementById("roleModalSelect").value;
    if (!userId) return;

    const updated = DB.updateById("ruet_users", userId, { role: newRole });
    if (updated) {
      Toast.success(`Role changed to "${newRole}"`);
      document.getElementById("roleModal").classList.add("hidden");
      renderUsers();
    } else {
      Toast.error("Failed to update role.");
    }
  }

  function deleteUser(userId) {
    if (userId === currentUser.id) { Toast.error("Cannot delete yourself."); return; }
    if (!confirm("Are you sure you want to delete this user? This will also remove their products.")) return;

    // Cascade — remove user's products
    const userProducts = Products.getByVendor(userId);
    userProducts.forEach(p => DB.deleteById("ruet_products", p.id));

    DB.deleteById("ruet_users", userId);
    Toast.success("User and associated data deleted.");
    renderUsers();
  }

  // ══════════════════════════════════════════════════════════
  //  PRODUCTS TAB
  // ══════════════════════════════════════════════════════════
  function renderProducts() {
    const allProducts = Products.getAll();
    const catFilter = document.getElementById("productCatFilter")?.value || "all";
    const searchQ = (document.getElementById("productSearchInput")?.value || "").toLowerCase();

    // Rebuild category filter to avoid duplicates
    const catSelect = document.getElementById("productCatFilter");
    if (catSelect) {
      const currentVal = catSelect.value;
      catSelect.innerHTML = '<option value="all">All Categories</option>';
      const cats = Products.getCategories();
      cats.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
      });
      catSelect.value = currentVal;
    }

    let filtered = allProducts;
    if (catFilter !== "all") filtered = filtered.filter(p => p.category === catFilter);
    if (searchQ) filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchQ) || (p.vendorName || "").toLowerCase().includes(searchQ)
    );

    document.getElementById("totalProductCount").textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

    const tbody = document.getElementById("adminProductsBody");
    if (!tbody) return;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-3);padding:2rem">No products found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td><div class="table-emoji">${p.emoji || "📦"}</div></td>
        <td><strong>${esc(p.name)}</strong></td>
        <td>${p.category}</td>
        <td>${Products.formatPrice(p.price)}</td>
        <td style="color:${p.stock === 0 ? 'var(--danger)' : p.stock < 5 ? 'var(--warning)' : 'inherit'}">${p.stock}</td>
        <td style="font-size:0.82rem;color:var(--text-3)">${p.vendorName || "—"}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="AdminPage.deleteProduct('${p.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }

  function deleteProduct(productId) {
    if (!confirm("Delete this product permanently?")) return;
    const result = Products.remove(productId);
    if (result.ok) {
      Toast.success("Product deleted.");
      renderProducts();
    } else {
      Toast.error(result.error || "Delete failed.");
    }
  }

  // ══════════════════════════════════════════════════════════
  //  ORDERS TAB
  // ══════════════════════════════════════════════════════════
  function renderOrders() {
    const allOrders = DB.findAll("ruet_orders");
    const statusFilter = document.getElementById("orderStatusFilter")?.value || "all";

    let filtered = allOrders;
    if (statusFilter !== "all") filtered = filtered.filter(o => o.status === statusFilter);

    // Sort newest first
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    document.getElementById("totalOrderCount").textContent = `${filtered.length} order${filtered.length !== 1 ? 's' : ''}`;

    const container = document.getElementById("adminOrdersList");
    if (!container) return;

    if (!filtered.length) {
      container.innerHTML = `<div class="empty-state"><span>📦</span><p>No orders found.</p></div>`;
      return;
    }

    container.innerHTML = filtered.map(o => `
      <div class="order-card">
        <div class="order-card-header">
          <span class="order-id">#${o.id.slice(-6).toUpperCase()}</span>
          <span class="order-date">${Utils.formatDate(o.createdAt)}</span>
          <span style="color:var(--text-3);font-size:0.82rem">by ${esc(o.userName || "Unknown")}</span>
          <span class="status-badge status-${o.status === "processing" ? "pending" : o.status}" style="margin-left:auto">${o.status}</span>
        </div>
        <div class="order-card-body">
          <div class="order-items-summary">
            ${o.items.map(i => `${esc(i.name)} × ${i.qty}`).join(", ")}
          </div>
          <div class="order-card-footer">
            <div>
              <span class="order-total-label">Total: </span>
              <span class="order-total-val">${Products.formatPrice(o.total)}</span>
            </div>
            <div style="display:flex;gap:0.5rem;align-items:center">
              <label style="font-size:0.82rem;color:var(--text-3)">Status:</label>
              <select class="order-status-select" onchange="AdminPage.updateOrderStatus('${o.id}', this.value)">
                <option value="processing" ${o.status === "processing" ? "selected" : ""}>Processing</option>
                <option value="confirmed" ${o.status === "confirmed" ? "selected" : ""}>Confirmed</option>
                <option value="shipped" ${o.status === "shipped" ? "selected" : ""}>Shipped</option>
                <option value="delivered" ${o.status === "delivered" ? "selected" : ""}>Delivered</option>
                <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `).join("");
  }

  function updateOrderStatus(orderId, newStatus) {
    // Confirm before dangerous status changes
    if (newStatus === 'cancelled' && !confirm('Cancel this order? Stock will be restored.')) {
      renderOrders();
      return;
    }
    // Use Orders module for proper validation
    const result = Orders.updateStatus(orderId, newStatus);
    if (result.ok) {
      Toast.success(`Order #${orderId.slice(-6).toUpperCase()} → ${newStatus}`);
    } else {
      Toast.error(result.error || "Failed to update order.");
      renderOrders();
    }
  }

  // ══════════════════════════════════════════════════════════
  //  SYSTEM TAB
  // ══════════════════════════════════════════════════════════
  function renderSystem() {
    const infoEl = document.getElementById("storageInfo");
    if (!infoEl) return;

    const keys = ["ruet_users", "ruet_products", "ruet_orders", "ruet_reviews", "ruet_session", "ruet_theme"];
    let totalBytes = 0;

    const rows = keys.map(key => {
      const raw = localStorage.getItem(key);
      const size = raw ? new Blob([raw]).size : 0;
      totalBytes += size;
      const count = raw ? (function() { try { const d = JSON.parse(raw); return Array.isArray(d) ? d.length : 1; } catch(e) { return "—"; } })() : 0;
      return `<div class="storage-row"><span>${key}</span><span>${count} items · ${formatBytes(size)}</span></div>`;
    });

    infoEl.innerHTML = rows.join("") +
      `<div class="storage-row" style="font-weight:700;margin-top:0.5rem;border-top:2px solid var(--border);padding-top:0.5rem">
        <span>Total</span><span>${formatBytes(totalBytes)}</span>
      </div>`;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    return (bytes / 1024).toFixed(1) + " KB";
  }

  // ── Helpers ─────────────────────────────────────────────
  function esc(str) {
    return Utils.escapeHtml(str);
  }

  // ── Init ────────────────────────────────────────────────
  function init() {
    if (!guardAuth()) return;
    setupSidebar();
    renderOverview();

    // Filters
    document.getElementById("userRoleFilter")?.addEventListener("change", renderUsers);
    document.getElementById("userSearchInput")?.addEventListener("input", renderUsers);
    document.getElementById("productCatFilter")?.addEventListener("change", renderProducts);
    document.getElementById("productSearchInput")?.addEventListener("input", renderProducts);
    document.getElementById("orderStatusFilter")?.addEventListener("change", renderOrders);

    // Role modal
    document.getElementById("closeRoleModal")?.addEventListener("click", () => {
      document.getElementById("roleModal").classList.add("hidden");
    });
    document.getElementById("cancelRoleModal")?.addEventListener("click", () => {
      document.getElementById("roleModal").classList.add("hidden");
    });
    document.getElementById("confirmRoleChange")?.addEventListener("click", confirmRoleChange);

    // Reset seed
    document.getElementById("resetSeedBtn")?.addEventListener("click", () => {
      if (confirm("⚠️ This will delete ALL data and reload defaults. Continue?")) {
        Seeder.reset();
        Toast.success("Data has been reset to defaults.");
        setTimeout(() => location.reload(), 800);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    switchTab,
    openRoleModal,
    confirmRoleChange,
    deleteUser,
    deleteProduct,
    updateOrderStatus,
  };
})();
