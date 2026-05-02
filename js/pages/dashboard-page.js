// js/pages/dashboard-page.js

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

    // Update sidebar nav items
    document.querySelectorAll(".dash-nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.tab === tab);
    });

    // Update tab panels
    document.querySelectorAll(".dash-tab").forEach((panel) => {
      panel.classList.toggle("hidden", panel.id !== `tab-${tab}`);
      if (panel.id === `tab-${tab}`) panel.classList.add("active");
      else panel.classList.remove("active");
    });

    renderPanel(tab);
  }

  function renderPanel(tab) {
    switch (tab) {
      case "overview":
        renderOverview();
        break;
      case "orders":
        renderOrders();
        break;
      case "products":
        renderMyProducts();
        break;
      case "wishlist":
        renderWishlist();
        break;
      case "profile":
        renderProfile();
        break;
    }
  }

  // ── Sidebar setup ──────────────────────────────────────────
  function setupSidebar() {
    // Update user info in sidebar
    const avatar = document.getElementById("dashAvatar");
    const userName = document.getElementById("dashUserName");
    const roleEl = document.getElementById("dashRole");

    if (avatar) avatar.textContent = currentUser.name[0].toUpperCase();
    if (userName) userName.textContent = currentUser.name;
    if (roleEl) {
      roleEl.textContent = currentUser.role === "vendor" ? "Vendor" : "Buyer";
      if (currentUser.role === "vendor") roleEl.classList.add("vendor");
    }

    // Show/hide vendor-only nav item
    const vendorNav = document.getElementById("vendorOnlyNav");
    if (vendorNav) {
      vendorNav.style.display = currentUser.role === "vendor" ? "flex" : "none";
    }

    // Setup sidebar nav click handlers
    document.querySelectorAll(".dash-nav-item[data-tab]").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab(item.dataset.tab);
      });
    });

    // Setup quick action tab links
    document.querySelectorAll("[data-tab-link]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab(link.dataset.tabLink);
      });
    });

    // Logout button
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      if (confirm("Are you sure you want to logout?")) {
        Auth.logout();
        window.location.href = "index.html";
      }
    });
  }

  // ── Overview panel ─────────────────────────────────────────
  function renderOverview() {
    const statsCards = document.getElementById("statsCards");
    const recentOrders = document.getElementById("recentOrders");
    if (!statsCards) return;

    const orders = Orders.getMyOrders();
    const myProducts =
      currentUser.role === "vendor"
        ? Products.getByVendor(currentUser.id)
        : [];
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const wishlistCount = Wishlist.count();

    // Stats cards
    let statsHtml = `
      <div class="stat-card">
        <div class="stat-card-icon">📦</div>
        <div class="stat-card-value">${orders.length}</div>
        <div class="stat-card-label">Total Orders</div>
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
      </div>
    `;

    if (currentUser.role === "vendor") {
      const vendorOrders = Orders.getVendorOrders();
      statsHtml += `
        <div class="stat-card">
          <div class="stat-card-icon">🏪</div>
          <div class="stat-card-value">${myProducts.length}</div>
          <div class="stat-card-label">My Products</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">📋</div>
          <div class="stat-card-value">${vendorOrders.length}</div>
          <div class="stat-card-label">Customer Orders</div>
        </div>
      `;
    }

    statsCards.innerHTML = statsHtml;

    // Recent orders
    if (recentOrders) {
      if (orders.length === 0) {
        recentOrders.innerHTML = `<p style="color:var(--text-3); padding: 1rem 0;">No orders yet. <a href="products.html" style="color:var(--primary)">Start shopping!</a></p>`;
      } else {
        recentOrders.innerHTML = orders
          .slice(0, 5)
          .map(
            (o) => `
          <div class="recent-order-row">
            <span class="order-id">#${o.id.slice(-6).toUpperCase()}</span>
            <span class="order-date">${Orders.formatDate(o.createdAt)}</span>
            <span class="order-total">${Products.formatPrice(o.total)}</span>
            <span class="status-badge status-${o.status === "processing" ? "pending" : o.status}">${Orders.statusLabel(o.status)}</span>
          </div>
        `
          )
          .join("");
      }
    }
  }

  // ── Orders panel ───────────────────────────────────────────
  function renderOrders() {
    const ordersList = document.getElementById("ordersList");
    if (!ordersList) return;

    const orders = Orders.getMyOrders();

    if (orders.length === 0) {
      ordersList.innerHTML = `
        <div class="no-orders-msg">
          <span>📦</span>
          <p>You haven't placed any orders yet.</p>
          <a href="products.html" class="btn btn-primary" style="margin-top:1rem">Shop Now</a>
        </div>`;
      return;
    }

    ordersList.innerHTML = orders
      .map(
        (o) => `
      <div class="order-card">
        <div class="order-card-header">
          <span class="order-id">#${o.id.slice(-6).toUpperCase()}</span>
          <span class="order-date">${Orders.formatDate(o.createdAt)}</span>
          <span class="status-badge status-${o.status === "processing" ? "pending" : o.status}">${Orders.statusLabel(o.status)}</span>
        </div>
        <div class="order-card-body">
          <div class="order-items-summary">
            ${o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
          </div>
          <div class="order-card-footer">
            <span class="order-total-label">Total</span>
            <span class="order-total-val">${Products.formatPrice(o.total)}</span>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  // ── Wishlist panel ─────────────────────────────────────────
  function renderWishlist() {
    const grid = document.getElementById("wishlistGrid");
    if (!grid) return;

    const products = Wishlist.getProducts();

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <span>❤️</span>
          <p>Your wishlist is empty.</p>
          <a href="products.html" class="btn btn-primary" style="margin-top:1rem">Browse Products</a>
        </div>`;
      return;
    }

    grid.innerHTML = products
      .map((p) => {
        const discount = Products.discountPercent(p);
        return `
        <div class="product-card" data-id="${p.id}">
          <a href="product-detail.html?id=${p.id}" class="product-card-img">
            <span>${p.emoji || "📦"}</span>
            ${discount > 0 ? `<span class="card-badge">-${discount}%</span>` : ""}
          </a>
          <div class="product-card-body">
            <span class="product-card-category">${p.category}</span>
            <a href="product-detail.html?id=${p.id}" class="product-card-name">${p.name}</a>
            <div class="product-card-price">
              <span class="price-current">${Products.formatPrice(p.price)}</span>
              ${p.originalPrice > p.price ? `<span class="price-original">${Products.formatPrice(p.originalPrice)}</span>` : ""}
            </div>
          </div>
          <div class="product-card-actions">
            <button class="btn btn-primary btn-sm" onclick="DashboardPage.moveToCart('${p.id}')">
              <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
            <button class="btn btn-outline btn-sm" onclick="DashboardPage.removeFromWishlist('${p.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  }

  function moveToCart(productId) {
    const result = Wishlist.moveToCart(productId);
    if (result.ok) {
      Toast.success("Moved to cart!");
      Navbar.updateCartBadge();
      renderWishlist();
    } else {
      Toast.error(result.error);
    }
  }

  function removeFromWishlist(productId) {
    Wishlist.remove(productId);
    Toast.info("Removed from wishlist");
    renderWishlist();
  }

  // ── Vendor: My Products panel ──────────────────────────────
  function renderMyProducts() {
    const tableBody = document.getElementById("productsTableBody");
    const noProducts = document.getElementById("noProducts");
    if (!tableBody || currentUser.role !== "vendor") return;

    const myProducts = Products.getByVendor(currentUser.id);

    if (myProducts.length === 0) {
      tableBody.innerHTML = "";
      noProducts?.classList.remove("hidden");
      return;
    }

    noProducts?.classList.add("hidden");
    tableBody.innerHTML = myProducts
      .map(
        (p) => `
      <tr>
        <td><div class="table-emoji">${p.emoji || "📦"}</div></td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${Products.formatPrice(p.price)}</td>
        <td style="color: ${p.stock === 0 ? "var(--danger)" : p.stock < 5 ? "var(--warning)" : "inherit"}">${p.stock}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="DashboardPage.openEditProduct('${p.id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="DashboardPage.confirmDeleteProduct('${p.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join("");
  }

  // ── Product Add/Edit Modal ─────────────────────────────────
  function openAddProduct() {
    document.getElementById("productModalTitle").textContent = "Add Product";
    document.getElementById("editProductId").value = "";
    document.getElementById("pName").value = "";
    document.getElementById("pCategory").value = "";
    document.getElementById("pDescription").value = "";
    document.getElementById("pPrice").value = "";
    document.getElementById("pOriginalPrice").value = "";
    document.getElementById("pStock").value = "";
    document.getElementById("pEmoji").value = "";
    document.getElementById("pImage").value = "";
    document.getElementById("pTags").value = "";
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
    const editId = document.getElementById("editProductId")?.value;
    const name = document.getElementById("pName")?.value.trim();
    const category = document.getElementById("pCategory")?.value;
    const description = document.getElementById("pDescription")?.value.trim();
    const price = parseFloat(document.getElementById("pPrice")?.value);
    const originalPrice = parseFloat(document.getElementById("pOriginalPrice")?.value) || price;
    const stock = parseInt(document.getElementById("pStock")?.value);
    const emoji = document.getElementById("pEmoji")?.value.trim();
    const image = document.getElementById("pImage")?.value.trim();
    const tagsStr = document.getElementById("pTags")?.value.trim();
    const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : [];

    if (!name) { Toast.warning("Product name is required."); return; }
    if (!category) { Toast.warning("Category is required."); return; }
    if (!price || price <= 0) { Toast.warning("Enter a valid price."); return; }
    if (isNaN(stock) || stock < 0) { Toast.warning("Enter a valid stock quantity."); return; }

    const data = {
      name, category, description, price, originalPrice, stock, emoji,
      images: image ? [image] : [],
      tags,
    };

    if (editId) {
      const result = Products.update(editId, data);
      if (result.ok) {
        Toast.success("Product updated!");
      } else {
        Toast.error(result.error || "Update failed");
        return;
      }
    } else {
      const result = Products.create(data);
      if (result.ok) {
        Toast.success("Product added!");
      } else {
        Toast.error(result.error || "Failed to add product");
        return;
      }
    }

    closeProductModal();
    renderMyProducts();
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
  function renderProfile() {
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profilePhone = document.getElementById("profilePhone");
    const profileStudentId = document.getElementById("profileStudentId");
    const profileBio = document.getElementById("profileBio");

    if (profileName) profileName.value = currentUser.name || "";
    if (profileEmail) profileEmail.value = currentUser.email || "";
    if (profilePhone) profilePhone.value = currentUser.phone || "";
    if (profileStudentId) profileStudentId.value = currentUser.studentId || "";
    if (profileBio) profileBio.value = currentUser.bio || "";
  }

  function saveProfile() {
    const name = document.getElementById("profileName")?.value.trim();
    const phone = document.getElementById("profilePhone")?.value.trim();
    const studentId = document.getElementById("profileStudentId")?.value.trim();
    const bio = document.getElementById("profileBio")?.value.trim();
    const password = document.getElementById("profilePassword")?.value;

    if (!name || name.length < 3) { Toast.warning("Name must be at least 3 characters."); return; }

    const updates = { name, phone, studentId, bio };
    if (password && password.length >= 6) {
      updates.password = password;
    } else if (password && password.length > 0 && password.length < 6) {
      Toast.warning("Password must be at least 6 characters.");
      return;
    }

    const result = Auth.updateProfile(updates);
    if (result.ok) {
      currentUser = Auth.getSession();
      Toast.success("Profile updated successfully!");
      setupSidebar();
      // Clear password field
      const pwField = document.getElementById("profilePassword");
      if (pwField) pwField.value = "";
    } else {
      Toast.error(result.error || "Failed to update profile.");
    }
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    if (!guardAuth()) return;
    setupSidebar();
    renderOverview();

    // Handle hash-based tab switching
    const hash = location.hash.replace("#", "");
    if (["orders", "products", "wishlist", "profile"].includes(hash)) {
      switchTab(hash);
    }

    // Setup modal buttons
    document.getElementById("addProductBtn")?.addEventListener("click", openAddProduct);
    document.getElementById("closeProductModal")?.addEventListener("click", closeProductModal);
    document.getElementById("cancelProductModal")?.addEventListener("click", closeProductModal);
    document.getElementById("saveProductBtn")?.addEventListener("click", saveProduct);
    document.getElementById("confirmDelete")?.addEventListener("click", executeDelete);
    document.getElementById("cancelDelete")?.addEventListener("click", cancelDelete);
    document.getElementById("closeDeleteModal")?.addEventListener("click", cancelDelete);
    document.getElementById("saveProfile")?.addEventListener("click", saveProfile);
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    switchTab,
    openAddProduct,
    openEditProduct,
    closeProductModal,
    saveProduct,
    confirmDeleteProduct,
    saveProfile,
    moveToCart,
    removeFromWishlist,
  };
})();