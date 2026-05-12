// js/pages/home.js

const HomePage = (() => {
  const FEATURED_LIMIT = 8;
  const NEW_ARRIVALS_LIMIT = 8;

  const categoryEmojis = {
    Electronics: "📱",
    Books: "📚",
    Clothing: "👕",
    Stationery: "✏️",
    Food: "🍔",
    Sports: "⚽",
    Beauty: "💄",
    "Lab Supplies": "🔬",
    Services: "🛠️",
    Other: "📦",
  };

  // ── Categories ─────────────────────────────────────────────
  function renderCategories() {
    const grid = document.getElementById("categoriesGrid");
    if (!grid) return;

    const allProducts = Products.getAll();
    const categoryMap = {};

    allProducts.forEach((p) => {
      if (!categoryMap[p.category]) {
        categoryMap[p.category] = { name: p.category, count: 0 };
      }
      categoryMap[p.category].count++;
    });

    const categories = Object.values(categoryMap);

    grid.innerHTML = categories
      .map(
        (cat) => `
      <a href="products.html?cat=${encodeURIComponent(cat.name)}" class="category-card">
        <span class="category-icon">${categoryEmojis[cat.name] || "📦"}</span>
        <span class="category-name">${Utils.escapeHtml(cat.name)}</span>
        <span class="category-count">${cat.count} items</span>
      </a>
    `
      )
      .join("");
  }

  // ── Featured Products ──────────────────────────────────────
  function renderFeatured() {
    const grid = document.getElementById("featuredGrid");
    if (!grid) return;

    const featured = Products.getFeatured(FEATURED_LIMIT);

    if (!featured.length) {
      grid.innerHTML = `<p class="empty-state">No featured products yet.</p>`;
      return;
    }

    grid.innerHTML = featured.map((p) => renderProductCard(p)).join("");
  }

  // ── New Arrivals ────────────────────────────────────────────
  function renderNewArrivals() {
    const grid = document.getElementById("newArrivalsGrid");
    if (!grid) return;

    const newest = Products.getNewArrivals(NEW_ARRIVALS_LIMIT);

    if (!newest.length) {
      grid.innerHTML = `<p class="empty-state">No new arrivals yet.</p>`;
      return;
    }

    grid.innerHTML = newest.map((p) => renderProductCard(p)).join("");
  }

  // ── Hero Stats (animated count-up) ────────────────────────
  function renderStats() {
    const allProducts = Products.getAll();
    const allUsers = DB.findAll("ruet_users");
    const allOrders = DB.findAll("ruet_orders");

    animateCounter("statProducts", allProducts.length);
    animateCounter("statVendors", allUsers.filter((u) => u.role === "vendor").length);
    animateCounter("statOrders", allOrders.length);
  }

  function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current + "+";
    }, 30);
  }

  // ── Product Card ───────────────────────────────────────────
  function renderProductCard(p) {
    const inWishlist = Wishlist.has(p.id);
    const discount = Products.discountPercent(p);
    const imgSrc = Products.getImageUrl(p);
    const hasImage = p.images && p.images.length > 0;

    return `
      <div class="product-card" data-id="${p.id}">
        <a href="product-detail.html?id=${p.id}" class="product-card-img">
          ${hasImage
            ? `<img src="${Utils.sanitizeUrl(imgSrc)}" alt="${Utils.escapeHtml(p.name)}" onerror="this.src='assets/images/placeholder.svg'" loading="lazy" />`
            : `<span>${p.emoji || "📦"}</span>`}
          ${p.stock === 0 ? `<div class="out-of-stock-overlay">Out of Stock</div>` : ""}
          ${discount > 0 ? `<span class="card-badge">-${discount}%</span>` : ""}
          <button class="card-wishlist-btn ${inWishlist ? "active" : ""}"
            onclick="event.preventDefault(); event.stopPropagation(); HomePage.toggleWishlist('${p.id}')"
            title="${inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}"
            aria-label="${inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}">
            <i class="fas fa-heart"></i>
          </button>
        </a>
        <div class="product-card-body">
          <span class="product-card-category">${Utils.escapeHtml(p.category)}</span>
          <a href="product-detail.html?id=${p.id}" class="product-card-name" title="${Utils.escapeHtml(p.name)}">${Utils.escapeHtml(Utils.truncate(p.name, 50))}</a>
          <div class="product-card-stars">
            ${Ratings.renderStars(p.rating || 0)}
            <span class="star-count">(${p.reviewCount || 0})</span>
          </div>
          <div class="product-card-price">
            <span class="price-current">${Products.formatPrice(p.price)}</span>
            ${p.originalPrice && p.originalPrice > p.price ? `<span class="price-original">${Products.formatPrice(p.originalPrice)}</span>` : ""}
          </div>
        </div>
        <div class="product-card-actions">
          <button class="btn btn-primary btn-sm" onclick="HomePage.addToCart('${p.id}')"
            ${p.stock === 0 ? "disabled" : ""}>
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
  }

  function toggleWishlist(productId) {
    const result = Wishlist.toggle(productId);
    if (result.ok) {
      if (result.added) {
        Toast.success("Added to wishlist");
      } else {
        Toast.info("Removed from wishlist");
      }
    } else {
      Toast.error(result.error);
    }
    renderFeatured();
    renderNewArrivals();
    Navbar.updateWishlistBadge();
  }

  function addToCart(productId) {
    const result = Cart.add(productId);
    if (result.ok) {
      Toast.success("Added to cart!");
      Navbar.updateCartBadge();
    } else {
      Toast.error(result.error || "Could not add to cart");
    }
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    renderCategories();
    renderFeatured();
    renderNewArrivals();
    renderStats();
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    init,
    toggleWishlist,
    addToCart,
    renderProductCard,
  };
})();
