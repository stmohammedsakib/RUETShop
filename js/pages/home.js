// js/pages/home.js

const HomePage = (() => {
  const FEATURED_LIMIT = 8;
  const NEW_ARRIVALS_LIMIT = 8;
  let _usersCache = [];

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

  // ── Scroll Reveal ─────────────────────────────────────────
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach((el) => observer.observe(el));
  }

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

    _usersCache = DB.findAll("ruet_users");
    // Load first 4 eagerly (above the fold)
    grid.innerHTML = featured.map((p, idx) => renderProductCard(p, idx < 4)).join("");
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

    _usersCache = _usersCache.length ? _usersCache : DB.findAll("ruet_users");
    grid.innerHTML = newest.map((p, idx) => renderProductCard(p, idx < 4)).join("");
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

  function renderProductCard(p, eagerLoad = false) {
    return Components.ProductCard(p, {
      eagerLoad,
      onCartClick: `HomePage.addToCart('${p.id}')`,
      onWishlistClick: `HomePage.toggleWishlist('${p.id}')`,
      showSellerRating: (() => {
        const seller = _usersCache.find(u => u.id === p.vendorId);
        return !(seller && seller.role === "user");
      })()
    });
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

  // ── Newsletter ─────────────────────────────────────────────
  function initNewsletter() {
    const btn = document.getElementById('newsletterBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const input = document.querySelector('#newsletterForm input[type="email"]');
      if (!input) return;

      const email = input.value.trim();
      if (!email || !Utils.validateEmail(email)) {
        Toast.error('Please enter a valid email address.');
        return;
      }

      // Store using DB module for consistency
      const subs = DB.get('ruet_newsletter') || [];
      if (subs.includes(email)) {
        Toast.info('You are already subscribed!');
        return;
      }
      subs.push(email);
      DB.set('ruet_newsletter', subs);

      Toast.success('🎉 Subscribed successfully! Stay tuned.');
      input.value = '';
    });
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    renderCategories();
    renderFeatured();
    renderNewArrivals();
    renderStats();
    initScrollReveal();
    initNewsletter();
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    init,
    toggleWishlist,
    addToCart,
    renderProductCard,
  };
})();
