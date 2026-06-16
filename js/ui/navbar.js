// js/ui/navbar.js — Non-destructive Navbar Updates

const Navbar = (() => {

  function init() {
    updateUserSection();
    updateCartBadge();
    updateWishlistBadge();
    bindThemeToggle();
    bindHamburger();
    bindSearch();
    highlightActiveLink();
    initFooterYear();
    handleLoggedOutCTAs();
    handleVendorRestrictions();
    handleSearchVisibility();
  }

  // ── Hide search on non-shopping pages ──────────────────────
  function handleSearchVisibility() {
    const hidePages = ['about.html', 'auth.html', 'dashboard.html', 'admin.html', 'support.html'];
    const currentPath = location.pathname.split("/").pop();
    
    if (hidePages.includes(currentPath)) {
      const searchContainer = document.querySelector('.nav-search');
      if (searchContainer) searchContainer.style.display = 'none';
      
      const mobileBtn = document.getElementById('mobileSearchBtn');
      if (mobileBtn) mobileBtn.style.display = 'none';
    }
  }

  // ── Footer year ─────────────────────────────────────────
  function initFooterYear() {
    const year = new Date().getFullYear();
    document.querySelectorAll('.footer-year').forEach(el => { el.textContent = year; });
    const footerYear = document.getElementById('footerYear');
    if (footerYear) footerYear.textContent = year;
  }

  // ── Hide CTAs for logged in users ───────────────────────
  function handleLoggedOutCTAs() {
    if (Auth && Auth.isLoggedIn()) {
      const promoBanner = document.getElementById("promoBanner");
      if (promoBanner) promoBanner.style.display = "none";

      document.querySelectorAll('a[href^="auth.html"]').forEach(link => {
        const text = link.textContent.trim();
        if (text.includes("Become a Vendor") || text.includes("Start Selling") || text.includes("Become a Campus Vendor")) {
          link.href = "dashboard.html#products";
          link.innerHTML = '<i class="fas fa-store"></i> Sell Products';
        }
      });
    }
  }

  // ── Hide buying features for vendors ──────────────────────
  function handleVendorRestrictions() {
    const currentUser = Auth?.getSession();
    if (currentUser && currentUser.role === "vendor") {
      const cartBtn = document.querySelector('a.cart-btn');
      if (cartBtn) cartBtn.style.display = "none";
      
      const wishBtn = document.querySelector('a[href*="#wishlist"]');
      if (wishBtn) wishBtn.style.display = "none";
    }
  }

  // ── Update user login/menu section ────────────────────────
  function updateUserSection() {
    const navUser = document.getElementById("navUser");
    if (!navUser) return;

    const currentUser = Auth.getSession();
    if (!currentUser) return;

    const avatarHtml = currentUser.avatar 
      ? `<img src="${Utils.sanitizeUrl(currentUser.avatar)}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.onerror=null; this.parentElement.innerHTML='${Utils.escapeHtml(currentUser.name[0].toUpperCase())}';">`
      : Utils.escapeHtml(currentUser.name[0].toUpperCase());
    
    const avatarStyle = currentUser.avatar ? "background: transparent; overflow: hidden; padding: 0;" : "";

    navUser.innerHTML = `
      <div class="nav-user-menu">
        <button class="user-avatar-btn" id="userMenuBtn" aria-label="User menu" aria-expanded="false">
          <span class="user-avatar-sm" style="${avatarStyle}">${avatarHtml}</span>
          <span class="user-name-sm">${Utils.escapeHtml(currentUser.name.split(" ")[0])}</span>
        </button>
        <div class="user-dropdown" id="userDropdown" role="menu">
          ${currentUser.role === "admin" ? `<a href="admin.html" role="menuitem"><i class="fas fa-shield-alt"></i> Admin Panel</a>` : ""}
          <a href="dashboard.html" role="menuitem"><i class="fas fa-chart-pie"></i> Dashboard</a>
          <a href="dashboard.html#products" role="menuitem"><i class="fas fa-store"></i> Sell Products</a>
          ${currentUser.role !== "vendor" ? `<a href="dashboard.html#orders" role="menuitem"><i class="fas fa-shopping-bag"></i> My Purchases</a>` : ""}
          <a href="dashboard.html#sales" role="menuitem"><i class="fas fa-hand-holding-usd"></i> My Sales</a>
          <a href="dashboard.html#profile" role="menuitem"><i class="fas fa-user-cog"></i> Profile</a>
          <hr/>
          <button id="navLogoutBtn" role="menuitem"><i class="fas fa-sign-out-alt"></i> Logout</button>
        </div>
      </div>
    `;

    document.getElementById("userMenuBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const dd = document.getElementById("userDropdown");
      const btn = document.getElementById("userMenuBtn");
      dd?.classList.toggle("show");
      btn?.setAttribute("aria-expanded", dd?.classList.contains("show") ? "true" : "false");
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
      // Add admin panel link for admin users
      if (currentUser.role === "admin" && !mobileMenu.querySelector('.mobile-admin-link')) {
        const adminLink = document.createElement("a");
        adminLink.href = "admin.html";
        adminLink.className = "mobile-admin-link";
        adminLink.innerHTML = '<i class="fas fa-shield-alt"></i> Admin Panel';
        mobileMenu.insertBefore(adminLink, mobileMenu.firstChild);
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

  // Ensure wishlist badge updates
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
    if (btn) btn.addEventListener("click", () => Theme.toggle());
    
    const mobileBtn = document.getElementById("mobileThemeToggle");
    if (mobileBtn) {
      mobileBtn.addEventListener("click", (e) => {
        e.preventDefault();
        Theme.toggle();
      });
    }
  }

  // ── Hamburger binding ─────────────────────────────────────
  function bindHamburger() {
    const ham = document.getElementById("hamburger");
    const menu = document.getElementById("mobileMenu");
    if (!ham || !menu) return;
    ham.addEventListener("click", () => {
      menu.classList.toggle("open");
      ham.classList.toggle("active");
      const isOpen = menu.classList.contains("open");
      ham.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    // Close mobile menu when a link is clicked
    menu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        menu.classList.remove("open");
        ham.classList.remove("active");
        ham.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  // ── Search binding ────────────────────────────────────────
  function bindSearch() {
    const isProductsPage = location.pathname.includes("products");

    // Mobile Search Toggle
    const mobileSearchBtn = document.getElementById("mobileSearchBtn");
    const navbarEl = document.getElementById("navbar");
    if (mobileSearchBtn && navbarEl) {
      mobileSearchBtn.addEventListener("click", () => {
        navbarEl.classList.toggle("show-mobile-search");
        if (navbarEl.classList.contains("show-mobile-search")) {
          setTimeout(() => document.getElementById("nav-search-input")?.focus(), 100);
        }
      });
    }

    const desktopInput = document.getElementById("nav-search-input");
    const mobileInput = document.getElementById("globalSearch");
    const searchInputs = [desktopInput, mobileInput].filter(Boolean);

    searchInputs.forEach(searchInput => {
      const searchContainer = searchInput.parentElement;
      let suggestionsBox = searchContainer.querySelector(".search-suggestions-dropdown");
      if (!suggestionsBox) {
        suggestionsBox = document.createElement("div");
        suggestionsBox.className = "search-suggestions-dropdown";
        searchContainer.style.position = "relative";
        searchContainer.appendChild(suggestionsBox);
      }

      const doSearch = () => {
        const query = searchInput.value.trim();
        if (query && !isProductsPage) {
          window.location.href = `products.html?search=${encodeURIComponent(query)}`;
        } else if (isProductsPage) {
          suggestionsBox.style.display = "none";
          searchInput.blur();
        }
      };

      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          doSearch();
        }
      });

      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
          suggestionsBox.style.display = "none";
          return;
        }
        
        if (typeof Products === "undefined") return;
        
        const results = Products.search(query).slice(0, 5);
        if (results.length === 0) {
          suggestionsBox.innerHTML = '<div class="suggestion-empty">No products found</div>';
        } else {
          const resultsHtml = results.map(p => {
            let displayedTags = [];
            if (p.tags && p.tags.length > 0) {
              const terms = query.trim().toLowerCase().split(/\\s+/).filter(Boolean);
              const matchedTags = p.tags.filter(t => terms.some(term => t.toLowerCase().includes(term)));
              const unmatchedTags = p.tags.filter(t => !terms.some(term => t.toLowerCase().includes(term)));
              displayedTags = [...matchedTags, ...unmatchedTags].slice(0, 3);
            }
            const tagsHtml = displayedTags.length > 0 
              ? `<div class="suggestion-tags">${displayedTags.map(t => `<span class="suggestion-tag ${query.trim().toLowerCase().split(/\\s+/).filter(Boolean).some(term => t.toLowerCase().includes(term)) ? 'matched' : ''}">${Utils.escapeHtml(t)}</span>`).join("")}</div>` 
              : "";
            return `
            <a href="product-detail.html?id=${p.id}" class="suggestion-item">
              <img src="${Products.getImageUrl(p)}" alt="${Utils.escapeHtml(p.name)}" class="suggestion-img">
              <div class="suggestion-info">
                <span class="suggestion-name">${Utils.escapeHtml(p.name)}</span>
                <span class="suggestion-price">${Products.formatPrice(p.price)}</span>
                ${tagsHtml}
              </div>
            </a>
            `;
          }).join("");
          
          const seeAllHtml = `
            <a href="products.html?search=${encodeURIComponent(query)}" class="suggestion-see-all">
              See all results for "${Utils.escapeHtml(query)}" <i class="fas fa-arrow-right"></i>
            </a>
          `;
          suggestionsBox.innerHTML = resultsHtml + seeAllHtml;
        }
        suggestionsBox.style.display = "block";
      });

      // Hide suggestions when clicking outside
      document.addEventListener("click", (e) => {
        if (!searchContainer.contains(e.target)) {
          suggestionsBox.style.display = "none";
        }
      });

      // Show suggestions on focus if there is enough text
      searchInput.addEventListener("focus", () => {
        if (searchInput.value.trim().length >= 2) {
          suggestionsBox.style.display = "block";
        }
      });

      const searchBtn = searchContainer.querySelector("button");
      if (searchBtn) searchBtn.addEventListener("click", doSearch);
    });
  }

  function handleSearch() {
    let input = document.getElementById("nav-search-input");
    if (input && input.offsetParent === null) {
      input = document.getElementById("globalSearch");
    }
    const query = input?.value?.trim();
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
    if (dd && !e.target.closest(".nav-user-menu")) {
      dd.classList.remove("show");
      document.getElementById("userMenuBtn")?.setAttribute("aria-expanded", "false");
    }

    const mm = document.getElementById("mobileMenu");
    const ham = document.getElementById("hamburger");
    if (mm && mm.classList.contains("open") && !e.target.closest(".mobile-menu") && !e.target.closest(".hamburger")) {
      mm.classList.remove("open");
      ham?.classList.remove("active");
      ham?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  });

  return { init, updateCartBadge, updateWishlistBadge, updateUserSection, handleSearch };
})();

document.addEventListener("DOMContentLoaded", Navbar.init);
