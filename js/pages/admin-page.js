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
      case "about": renderAbout(); break;
      case "system": renderSystem(); break;
    }
  }

  // ── Setup Sidebar ───────────────────────────────────────
  function setupSidebar() {
    const avatar = document.getElementById("adminAvatar");
    const userName = document.getElementById("adminUserName");
    if (avatar) {
      if (currentUser.avatar) {
        avatar.innerHTML = `<img src="${Utils.sanitizeUrl(currentUser.avatar)}" alt="Admin Profile" onerror="this.onerror=null; this.parentElement.innerHTML='${currentUser.name[0].toUpperCase()}';" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        avatar.style.background = 'transparent';
      } else {
        avatar.textContent = currentUser.name[0].toUpperCase();
        avatar.style.background = 'var(--primary)';
      }
    }
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
            <span class="status-badge status-${o.status}">${Orders.statusLabel(o.status)}</span>
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
        <td>
          <strong>${esc(p.name)}</strong>
          <div style="margin-top: 0.3rem;">
            <span class="condition-badge condition-${(p.condition || 'Used').toLowerCase().replace(/\s+/g, '-')}">${Utils.escapeHtml(p.condition || 'Used')}</span>
          </div>
        </td>
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
          <span class="status-badge status-${o.status}" style="margin-left:auto">${Orders.statusLabel(o.status)}</span>
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
                <option value="pending" ${o.status === "pending" ? "selected" : ""}>Pending</option>
                <option value="preparing" ${o.status === "preparing" ? "selected" : ""}>Preparing</option>
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
  //  ABOUT PAGE TAB
  // ══════════════════════════════════════════════════════════
  function renderAbout() {
    const data = DB.get("ruet_about_content") || {};
    
    // Core About Info
    const heroInput = document.getElementById("aboutEditHero");
    const missionInput = document.getElementById("aboutEditMission");
    if (heroInput && !heroInput.dataset.loaded) { heroInput.value = data.hero || "RUETShop is a campus-exclusive multi-vendor e-commerce platform connecting students, vendors, and the RUET community — making campus commerce faster, safer, and smarter."; heroInput.dataset.loaded = "true"; }
    if (missionInput && !missionInput.dataset.loaded) { missionInput.value = data.mission || "RUETShop was born from a simple frustration — students at Rajshahi University of Engineering & Technology had no dedicated, trusted platform to buy or sell within their campus community.\n\nWe built a full-featured marketplace that is fast, secure, and tailored to the unique needs of campus life — from engineering supplies and textbooks to lab equipment and daily essentials."; missionInput.dataset.loaded = "true"; }

    // Contact Info
    const locInput = document.getElementById("aboutEditLoc");
    const emailInput = document.getElementById("aboutEditEmail");
    const phoneInput = document.getElementById("aboutEditPhone");
    const deptInput = document.getElementById("aboutEditDept");
    if (locInput && !locInput.dataset.loaded) { locInput.value = data.contactLoc || "Rajshahi University of Engineering & Technology\nRajshahi-6204, Bangladesh"; locInput.dataset.loaded = "true"; }
    if (emailInput && !emailInput.dataset.loaded) { emailInput.value = data.contactEmail || "support@ruetshop.com"; emailInput.dataset.loaded = "true"; }
    if (phoneInput && !phoneInput.dataset.loaded) { phoneInput.value = data.contactPhone || "+880 1843-885547"; phoneInput.dataset.loaded = "true"; }
    if (deptInput && !deptInput.dataset.loaded) { deptInput.value = data.contactDept || "Electrical & Computer Engineering (ECE)\nRUET, Rajshahi"; deptInput.dataset.loaded = "true"; }

    // Developers Info
    const devPhotos = DB.get("ruet_dev_photos") || {};
    for (let i = 1; i <= 3; i++) {
      const nameInput = document.getElementById(`dev${i}Name`);
      const roleInput = document.getElementById(`dev${i}Role`);
      const bioInput = document.getElementById(`dev${i}Bio`);
      const emailInput = document.getElementById(`dev${i}Email`);
      const phoneInput = document.getElementById(`dev${i}Phone`);
      const gitInput = document.getElementById(`dev${i}Git`);
      const inInput = document.getElementById(`dev${i}In`);
      const fbInput = document.getElementById(`dev${i}Fb`);
      
      const defaultName = i === 1 ? "Ashraful Anower Shakib" : (i === 2 ? "Al Saniat Samim" : "Mohammed Sakib");
      const defaultRole = i === 1 ? '<i class="fas fa-crown"></i> Founder, CEO & Lead Developer' : (i === 2 ? '<i class="fas fa-tools"></i> Co-Founder, CTO & Co-Developer' : '<i class="fas fa-tools"></i> Co-Founder, COO & Co-Developer');
      const defaultBio = i === 1 ? "Architected the full platform — from the LocalStorage DB layer, authentication system with rate limiting, to the multi-vendor order flow and admin panel. Passionate about clean, maintainable frontend code and great UX." : 
      (i === 2 ? "Contributed to the product system, cart mechanics, and the vendor dashboard. Focused on UI polish, responsive design, and ensuring a smooth, accessible shopping experience across all devices and screen sizes." : 
        "Worked on the order management system, review & rating engine, wishlist feature, and the seed data layer with 100+ realistic products. Shaped the data architecture, testing strategy, and product category structure.");
      const defaultEmail = i === 1 ? "ashrafulanower@ruetshop.com" : (i === 2 ? "saniatsamim@ruetshop.com" : "mohammedsakib@ruetshop.com");
      const defaultPhone = i === 1 ? "+880 1816-442249" : (i === 2 ? "+880 1745-233662" : "+880 1310-097126");

      if (nameInput && !nameInput.dataset.loaded) { nameInput.value = data[`dev${i}Name`] || defaultName; nameInput.dataset.loaded = "true"; }
      if (roleInput && !roleInput.dataset.loaded) { roleInput.value = data[`dev${i}Role`] || defaultRole; roleInput.dataset.loaded = "true"; }
      if (bioInput && !bioInput.dataset.loaded) { bioInput.value = data[`dev${i}Bio`] || defaultBio; bioInput.dataset.loaded = "true"; }
      if (emailInput && !emailInput.dataset.loaded) { emailInput.value = data[`dev${i}Email`] || defaultEmail; emailInput.dataset.loaded = "true"; }
      if (phoneInput && !phoneInput.dataset.loaded) { phoneInput.value = data[`dev${i}Phone`] || defaultPhone; phoneInput.dataset.loaded = "true"; }
      if (gitInput && !gitInput.dataset.loaded) { gitInput.value = data[`dev${i}Git`] || "https://github.com/"; gitInput.dataset.loaded = "true"; }
      if (inInput && !inInput.dataset.loaded) { inInput.value = data[`dev${i}In`] || "https://linkedin.com/"; inInput.dataset.loaded = "true"; }
      if (fbInput && !fbInput.dataset.loaded) { fbInput.value = data[`dev${i}Fb`] || "https://facebook.com/"; fbInput.dataset.loaded = "true"; }

      // Load existing photo preview
      const base64Input = document.getElementById(`dev${i}ImgBase64`);
      const previewDiv = document.getElementById(`dev${i}ImgPreview`);
      if (base64Input && devPhotos[`dev${i}`]) {
        base64Input.value = devPhotos[`dev${i}`];
        if (previewDiv) {
          previewDiv.style.display = "block";
          previewDiv.querySelector("img").src = devPhotos[`dev${i}`];
        }
      }

      // Wire up file input listener
      const fileInput = document.getElementById(`dev${i}ImgFile`);
      if (fileInput && !fileInput.dataset.bound) {
        fileInput.dataset.bound = "true";
        fileInput.addEventListener("change", (e) => handleDevImgUpload(e, i));
      }
    }
  }

  function handleDevImgUpload(event, devIndex) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 500 * 1024) {
      Toast.error("Image too large. Please select an image under 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Str = e.target.result;
      const base64Input = document.getElementById(`dev${devIndex}ImgBase64`);
      const previewDiv = document.getElementById(`dev${devIndex}ImgPreview`);
      if (base64Input) base64Input.value = base64Str;
      if (previewDiv) {
        previewDiv.style.display = "block";
        previewDiv.querySelector("img").src = base64Str;
      }
    };
    reader.readAsDataURL(file);
  }

  function saveAboutContent() {
    const data = {
      hero: document.getElementById("aboutEditHero")?.value.trim(),
      mission: document.getElementById("aboutEditMission")?.value.trim(),
      contactLoc: document.getElementById("aboutEditLoc")?.value.trim(),
      contactEmail: document.getElementById("aboutEditEmail")?.value.trim(),
      contactPhone: document.getElementById("aboutEditPhone")?.value.trim(),
      contactDept: document.getElementById("aboutEditDept")?.value.trim(),
    };

    for (let i = 1; i <= 3; i++) {
      data[`dev${i}Name`] = document.getElementById(`dev${i}Name`)?.value.trim();
      data[`dev${i}Role`] = document.getElementById(`dev${i}Role`)?.value.trim();
      data[`dev${i}Bio`] = document.getElementById(`dev${i}Bio`)?.value.trim();
      data[`dev${i}Email`] = document.getElementById(`dev${i}Email`)?.value.trim();
      data[`dev${i}Phone`] = document.getElementById(`dev${i}Phone`)?.value.trim();
      data[`dev${i}Git`] = document.getElementById(`dev${i}Git`)?.value.trim();
      data[`dev${i}In`] = document.getElementById(`dev${i}In`)?.value.trim();
      data[`dev${i}Fb`] = document.getElementById(`dev${i}Fb`)?.value.trim();
    }
    
    // Save developer photos separately to avoid bloating main config
    const devPhotos = DB.get("ruet_dev_photos") || {};
    for (let i = 1; i <= 3; i++) {
      const base64Val = document.getElementById(`dev${i}ImgBase64`)?.value;
      if (base64Val) {
        devPhotos[`dev${i}`] = base64Val;
        
        // Sync to admin profile avatar
        const adminId = `admin_00${i}`;
        const adminUser = DB.findById("ruet_users", adminId);
        if (adminUser) {
          DB.updateById("ruet_users", adminId, { avatar: base64Val });
          // Update current session if the admin updating is this admin
          if (currentUser && currentUser.id === adminId) {
             currentUser.avatar = base64Val;
             DB.set("ruet_session", currentUser);
             setupSidebar(); // Refresh sidebar UI
          }
        }
      } else {
        delete devPhotos[`dev${i}`];
      }
    }
    DB.set("ruet_dev_photos", devPhotos);

    DB.set("ruet_about_content", data);
    Toast.success("About page content updated!");
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

    // About content save
    document.getElementById("saveAboutBtn")?.addEventListener("click", saveAboutContent);

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
