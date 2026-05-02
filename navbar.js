// js/ui/navbar.js — Non-destructive Navbar Updates
// Updates specific elements instead of replacing entire navbar HTML.

const Navbar = (() => {

  function init() {
    updateUserSection();
    updateCartBadge();
    updateWishlistBadge();
    bindThemeToggle();
    bindHamburger();
    bindSearch();
    highlightActiveLink();
  }

  // ── Update user login/menu section ────────────────────────
  function updateUserSection() {
    const navUser = document.getElementById("navUser");
    if (!navUser) return;

    const currentUser = Auth.getSession();
    if (!currentUser) return; // Static HTML already shows login button

    navUser.innerHTML = `
      <div class="nav-user-menu">
        <button class="user-avatar-btn" id="userMenuBtn">
          <span class="user-avatar-sm">${currentUser.name[0].toUpperCase()}</span>
          <span class="user-name-sm">${currentUser.name.split(" ")[0]}</span>
        </button>
        <div class="user-dropdown" id="userDropdown">
          ${currentUser.role === "admin" ? `<a href="admin.html"><i class="fas fa-shield-alt"></i> Admin Panel</a>` : ""}
          <a href="dashboard.html"><i class="fas fa-chart-pie"></i> Dashboard</a>
          ${currentUser.role === "vendor" ? `<a href="dashboard.html#products"><i class="fas fa-box"></i> My Products</a>` : ""}
          <a href="dashboard.html#orders"><i class="fas fa-shopping-bag"></i> Orders</a>
          <a href="dashboard.html#profile"><i class="fas fa-user-cog"></i> Profile</a>
          <hr/>
          <button id="navLogoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</button>
        </div>
      </div>
    `;

    document.getElementById("userMenuBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("userDropdown")?.classList.toggle("show");
    });

    document.getElementById("navLogoutBtn")?.addEventListener("click", () => {
      Auth.logout();
      window.location.href = "index.html";
    });

    // Update mobile menu login link
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenu) {
      const loginLink = mobileMenu.querySelector('a[href="auth.html"]');
      if (loginLink) {
        loginLink.textContent = "Dashboard";
        loginLink.href = "dashboard.html";
      }
      if (!mobileMenu.querySelector(".mobile-logout-btn")) {
        const logoutBtn = document.createElement("button");
        logoutBtn.className = "mobile-logout-btn";
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.addEventListener("click", () => {
          Auth.logout();
          window.location.href = "index.html";
        });
        mobileMenu.appendChild(logoutBtn);
      }
    }
  }

  // ── Badges ──────────────────────────────────────────────
  function updateCartBadge() {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;
    const count = typeof Cart !== "undefined" ? Cart.getCount() : 0;
    badge.textContent = count;
    badge.classList.toggle("hidden", count === 0);
  }

  function updateWishlistBadge() {
    const badge = document.getElementById("wishBadge");
    if (!badge) return;
    const count = typeof Wishlist !== "undefined" ? Wishlist.count() : 0;
    badge.textContent = count;
    badge.classList.toggle("hidden", count === 0);
  }

  // ── Theme toggle binding ──────────────────────────────────
  function bindThemeToggle() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.addEventListener("click", () => Theme.toggle());
  }

  // ── Hamburger binding ─────────────────────────────────────
  function bindHamburger() {
    const ham = document.getElementById("hamburger");
    const menu = document.getElementById("mobileMenu");
    if (!ham || !menu) return;
    ham.addEventListener("click", () => {
      menu.classList.toggle("open");
      ham.classList.toggle("active");
    });
  }

  // ── Search binding ────────────────────────────────────────
  function bindSearch() {
    const isProductsPage = location.pathname.includes("products");
    if (isProductsPage) return; // products-page.js handles its own search

    const searchInput = document.getElementById("nav-search-input") || document.getElementById("globalSearch");
    if (!searchInput) return;

    const doSearch = () => {
      const query = searchInput.value.trim();
      if (query) window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    };

    searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
    const searchBtn = searchInput.parentElement?.querySelector("button");
    if (searchBtn) searchBtn.addEventListener("click", doSearch);
  }

  // kept for backward compat with inline onclick in index.html
  function handleSearch() {
    const input = document.getElementById("nav-search-input") || document.getElementById("globalSearch");
    const query = input?.value.trim();
    if (query) window.location.href = `products.html?search=${encodeURIComponent(query)}`;
  }

  // ── Active link highlight ─────────────────────────────────
  function highlightActiveLink() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-container a, .mobile-menu a").forEach((link) => {
      const href = link.getAttribute("href")?.split("?")[0]?.split("#")[0];
      if (href === current) link.classList.add("active");
    });
  }

  // ── Close dropdowns on outside click ──────────────────────
  document.addEventListener("click", (e) => {
    const dd = document.getElementById("userDropdown");
    if (dd && !e.target.closest(".nav-user-menu")) dd.classList.remove("show");

    const mm = document.getElementById("mobileMenu");
    const ham = document.getElementById("hamburger");
    if (mm && mm.classList.contains("open") && !e.target.closest(".mobile-menu") && !e.target.closest(".hamburger")) {
      mm.classList.remove("open");
      ham?.classList.remove("active");
    }
  });

  return { init, updateCartBadge, updateWishlistBadge, updateUserSection, handleSearch };
})();

document.addEventListener("DOMContentLoaded", Navbar.init);