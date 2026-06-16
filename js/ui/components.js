// js/ui/components.js — Centralized HTML Components
// Extracts duplicated Navbar and Footer HTML across all 10 pages.

const Components = (() => {

  const navbarHTML = `
  <nav class="navbar" id="navbar">
    <div class="nav-container">
      <a href="index.html" class="nav-logo">
        <span class="logo-icon">🛒</span>
        <span class="logo-text">RUET<span class="accent">Shop</span></span>
      </a>
      <div class="nav-search">
        <input type="text" id="nav-search-input" placeholder="Search products..." />
        <button><i class="fas fa-search"></i></button>
      </div>
      <div class="nav-actions">
        <button class="icon-btn" id="themeToggle" title="Toggle Theme">
          <i class="fas fa-moon"></i>
        </button>
        <a href="cart.html" class="icon-btn cart-btn" title="Cart" aria-label="Cart">
          <i class="fas fa-shopping-cart"></i>
          <span class="badge" id="cartBadge">0</span>
        </a>
        <a href="dashboard.html#wishlist" class="icon-btn" title="Wishlist" aria-label="Wishlist">
          <i class="fas fa-heart"></i>
          <span class="badge wish-badge" id="wishBadge">0</span>
        </a>
        <a href="support.html" class="icon-btn" title="Help &amp; Support" aria-label="Help &amp; Support">
          <i class="fas fa-question-circle"></i>
        </a>
        <a href="about.html" class="btn btn-outline btn-sm desktop-about-btn">About Us</a>
        <div class="nav-user" id="navUser">
          <a href="auth.html" class="btn btn-primary btn-sm">Login</a>
        </div>
        <button class="hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false"><i class="fas fa-bars"></i></button>
      </div>
    </div>
    <div class="mobile-menu" id="mobileMenu">
      <a href="index.html">Home</a>
      <a href="products.html">Products</a>
      <a href="dashboard.html#wishlist">Wishlist</a>
      <a href="about.html">About Us</a>
      <a href="dashboard.html">Dashboard</a>
      <a href="cart.html">Cart</a>
      <a href="auth.html">Login</a>
      <a href="support.html">Help &amp; Support</a>
      <a href="#" id="mobileThemeToggle">Toggle Theme</a>
    </div>
  </nav>
  `;

  const footerHTML = `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="nav-logo"><span class="logo-icon">🛒</span><span class="logo-text">RUET<span class="accent">Shop</span></span></div>
          <p>Campus-based multi-vendor e-commerce platform for RUET students.</p>
        </div>
        <div class="footer-links">
          <h4>Quick Links</h4>
          <a href="index.html">Home</a>
          <a href="products.html">Products</a>
          <a href="about.html">About Us</a>
          <a href="auth.html">Login</a>
        </div>
        <div class="footer-links">
          <h4>Categories</h4>
          <a href="products.html?cat=Electronics">Electronics</a>
          <a href="products.html?cat=Books">Books</a>
          <a href="products.html?cat=Stationery">Stationery</a>
          <a href="products.html?cat=Food">Food</a>
        </div>
        <div class="footer-links">
          <h4>Contact</h4>
          <a href="support.html">Help &amp; Support</a>
          <span>📍 RUET, Rajshahi</span>
          <span>📧 support@ruetshop.com</span>
          <span>📞 +880 1843885547</span>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; <span class="footer-year" id="footerYear"></span> RUETShop. All rights reserved. Built with ❤️ for RUET students.</p>
      </div>
    </div>
  </footer>
  `;

  function init() {
    const navRoot = document.getElementById("app-navbar");
    if (navRoot) {
      navRoot.innerHTML = navbarHTML;
      // Unwrap the div to keep DOM identical to before
      const nav = navRoot.firstElementChild;
      navRoot.replaceWith(nav);
    }
    
    const footerRoot = document.getElementById("app-footer");
    if (footerRoot) {
      footerRoot.innerHTML = footerHTML;
      const footer = footerRoot.firstElementChild;
      footerRoot.replaceWith(footer);
    }
  }

  // Inject immediately (since script should be placed at the bottom, or listen for DOMContentLoaded)
  // We'll let navbar.js initialize event listeners, so this must run BEFORE Navbar.init()
  function ProductCard(p, options = {}) {
    const isVendor = Auth?.getSession()?.role === 'vendor';
    const inWishlist = typeof Wishlist !== 'undefined' ? Wishlist.has(p.id) : false;
    const discount = typeof Products !== 'undefined' ? Products.discountPercent(p) : 0;
    const imgSrc = typeof Products !== 'undefined' ? Products.getImageUrl(p) : p.images?.[0];
    const hasImage = p.images && p.images.length > 0;
    const showSellerRating = options.showSellerRating !== false;
    
    // Check eager loading
    const loadingAttr = options.eagerLoad ? 'loading="eager"' : 'loading="lazy"';
    const onclickAction = options.onCartClick || `HomePage.addToCart('${p.id}')`;
    const toggleWishlistAction = options.onWishlistClick || `HomePage.toggleWishlist('${p.id}')`;

    return `
      <div class="product-card" data-id="${p.id}">
        <a href="product-detail.html?id=${p.id}" class="product-card-img">
          ${hasImage
            ? `<img src="${Utils.sanitizeUrl(imgSrc)}" alt="${Utils.escapeHtml(p.name)}" onerror="this.src='assets/images/placeholder.svg'" ${loadingAttr} />`
            : `<span>${p.emoji || "📦"}</span>`}
          ${p.stock === 0 ? `<div class="out-of-stock-overlay">Out of Stock</div>` : ""}
          ${discount > 0 ? `<span class="card-badge">-${discount}%</span>` : ""}
          ${!isVendor ? `
          <button class="card-wishlist-btn ${inWishlist ? "active" : ""}"
            onclick="event.preventDefault(); event.stopPropagation(); ${toggleWishlistAction}"
            title="${inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}"
            aria-label="${inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}">
            <i class="fas fa-heart"></i>
          </button>
          ` : ''}
        </a>
        <div class="product-card-body">
          <div class="product-card-meta-row">
            <span class="product-card-category">${Utils.escapeHtml(p.category)}</span>
            <span class="condition-badge condition-${(p.condition || 'Used').toLowerCase().replace(/\s+/g, '-')}">${Utils.escapeHtml(p.condition || 'Used')}</span>
          </div>
          <a href="product-detail.html?id=${p.id}" class="product-card-name" title="${Utils.escapeHtml(p.name)}">${Utils.escapeHtml(Utils.truncate(p.name, 50))}</a>
          <div class="product-card-vendor">
            <i class="fas fa-store"></i> ${Utils.escapeHtml(p.vendorName || "Unknown Seller")}
          </div>
          ${showSellerRating ? `
            <div class="product-card-stars">
              ${typeof Ratings !== 'undefined' ? Ratings.renderStars(p.rating || 0) : ''}
              <span class="star-count">(${p.reviewCount || 0})</span>
            </div>` : ''}
          <div class="product-card-price">
            <span class="price-current">${typeof Products !== 'undefined' ? Products.formatPrice(p.price) : p.price}</span>
            ${p.originalPrice && p.originalPrice > p.price ? `<span class="price-original">${typeof Products !== 'undefined' ? Products.formatPrice(p.originalPrice) : p.originalPrice}</span>` : ""}
          </div>
        </div>
        ${!isVendor ? `
        <div class="product-card-actions">
          <button class="btn btn-primary btn-sm" onclick="${onclickAction}"
            ${p.stock === 0 ? "disabled" : ""}>
            <i class="fas fa-cart-plus"></i> ${p.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>` : ""}
      </div>
    `;
  }

  return { init, ProductCard };
})();

// Auto-run if DOM is ready, otherwise wait.
// We must ensure this runs before navbar.js
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Components.init);
} else {
  Components.init();
}
