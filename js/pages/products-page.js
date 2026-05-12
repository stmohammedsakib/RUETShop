// js/pages/products-page.js

const ProductsPage = (() => {
  const PAGE_SIZE = 40;
  let state = {
    all: [],
    filtered: [],
    page: 1,
    view: "grid",
    search: "",
    category: "",
    maxPrice: 0,
    minRating: 0,
    inStock: false,
    sort: "default",
  };

  // ── Read URL params ────────────────────────────────────────
  function readParams() {
    const params = new URLSearchParams(location.search);
    state.search = params.get("search") || "";
    state.category = params.get("cat") || params.get("category") || "";
    state.sort = params.get("sort") || "default";

    const searchInput = document.getElementById("globalSearch");
    if (searchInput && state.search) {
      searchInput.value = state.search;
    }
  }

  // ── Apply filters + sort ───────────────────────────────────
  function applyFilters() {
    let result = [...state.all];

    // Search
    if (state.search) {
      const q = state.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Category
    if (state.category) {
      result = result.filter((p) => p.category === state.category);
    }

    // Price range (only apply if maxPrice > 0 and not at its maximum)
    if (state.maxPrice > 0) {
      result = result.filter((p) => p.price <= state.maxPrice);
    }

    // Rating
    if (state.minRating > 0) {
      result = result.filter((p) => (p.rating || 0) >= state.minRating);
    }

    // In stock
    if (state.inStock) {
      result = result.filter((p) => p.stock > 0);
    }

    // Sort
    switch (state.sort) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      default:
        result.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    }

    state.filtered = result;
    state.page = 1;
  }

  // ── Render category filter checkboxes ──────────────────────
  function renderCategoryFilters() {
    const container = document.getElementById("categoryFilters");
    if (!container) return;

    const categories = Products.getCategories();
    container.innerHTML = categories
      .map(
        (cat) => `
      <label class="filter-check">
        <input type="checkbox" name="category" value="${Utils.escapeHtml(cat)}" 
          ${state.category === cat ? "checked" : ""}
          onchange="ProductsPage.onCategoryChange('${cat}', this.checked)" />
        ${Utils.escapeHtml(cat)}
      </label>
    `
      )
      .join("");
  }

  // ── Render products grid ───────────────────────────────────
  function renderProducts() {
    const container = document.getElementById("productsGrid");
    const countEl = document.getElementById("productCount");
    if (!container) return;

    const start = (state.page - 1) * PAGE_SIZE;
    const paginated = state.filtered.slice(start, start + PAGE_SIZE);

    if (countEl) {
      countEl.textContent = `${state.filtered.length} product${state.filtered.length !== 1 ? "s" : ""} found`;
    }

    if (!paginated.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <span>🔍</span>
          <p>${state.search ? `No results for "${Utils.escapeHtml(state.search)}".` : "No products found."} Try adjusting your filters.</p>
          <button class="btn btn-primary" onclick="ProductsPage.clearFilters()" style="margin-top:1rem">Clear Filters</button>
        </div>
      `;
      return;
    }

    container.classList.toggle("list-view", state.view === "list");
    container.innerHTML = paginated.map((p) => renderCard(p)).join("");
  }

  function renderCard(p) {
    const inWishlist = Wishlist.has(p.id);
    const discount = Products.discountPercent(p);
    const imgUrl = Products.getImageUrl(p);
    const hasImage = p.images && p.images.length > 0;

    return `
      <div class="product-card" data-id="${p.id}">
        <a href="product-detail.html?id=${p.id}" class="product-card-img">
          ${hasImage
            ? `<img src="${Utils.sanitizeUrl(imgUrl)}" alt="${Utils.escapeHtml(p.name)}" loading="lazy" onerror="this.src='assets/images/placeholder.svg'" />`
            : `<span>${p.emoji || "📦"}</span>`}
          ${p.stock === 0 ? `<div class="out-of-stock-overlay">Out of Stock</div>` : ""}
          ${discount > 0 ? `<span class="card-badge">-${discount}%</span>` : ""}
          <button class="card-wishlist-btn ${inWishlist ? "active" : ""}"
            onclick="event.preventDefault(); event.stopPropagation(); ProductsPage.toggleWishlist('${p.id}')"
            title="${inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}"
            aria-label="${inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}">
            <i class="fas fa-heart"></i>
          </button>
        </a>
        <div class="product-card-body">
          <span class="product-card-category">${Utils.escapeHtml(p.category)}</span>
          <a href="product-detail.html?id=${p.id}" class="product-card-name" title="${Utils.escapeHtml(p.name)}">${Utils.escapeHtml(Utils.truncate(p.name, 60))}</a>
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
          <button class="btn btn-primary btn-sm" onclick="ProductsPage.addToCart('${p.id}')"
            ${p.stock === 0 ? "disabled" : ""}>
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
  }

  // ── Pagination with ellipsis ───────────────────────────────
  function renderPagination() {
    const container = document.getElementById("pagination");
    if (!container) return;

    const total = Math.ceil(state.filtered.length / PAGE_SIZE);
    if (total <= 1) {
      container.innerHTML = "";
      return;
    }

    let pages = "";
    pages += `<button class="page-btn" onclick="ProductsPage.goToPage(${state.page - 1})"
      ${state.page === 1 ? "disabled" : ""}><i class="fas fa-chevron-left"></i></button>`;

    // Ellipsis pagination for large page counts
    const maxVisible = 5;
    let startPage = Math.max(1, state.page - Math.floor(maxVisible / 2));
    let endPage = Math.min(total, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages += `<button class="page-btn" onclick="ProductsPage.goToPage(1)">1</button>`;
      if (startPage > 2) pages += `<span class="page-ellipsis">…</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      pages += `<button class="page-btn ${i === state.page ? "active" : ""}"
        onclick="ProductsPage.goToPage(${i})">${i}</button>`;
    }

    if (endPage < total) {
      if (endPage < total - 1) pages += `<span class="page-ellipsis">…</span>`;
      pages += `<button class="page-btn" onclick="ProductsPage.goToPage(${total})">${total}</button>`;
    }

    pages += `<button class="page-btn" onclick="ProductsPage.goToPage(${state.page + 1})"
      ${state.page === total ? "disabled" : ""}><i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = pages;
  }

  // ── Active filters display ─────────────────────────────────
  function renderActiveFilters() {
    const container = document.getElementById("activeFilters");
    if (!container) return;

    let tags = [];

    if (state.search) {
      tags.push(`<span class="active-filter-tag">Search: "${Utils.escapeHtml(state.search)}" <button onclick="ProductsPage.clearSearch()">✕</button></span>`);
    }
    if (state.category) {
      tags.push(`<span class="active-filter-tag">${Utils.escapeHtml(state.category)} <button onclick="ProductsPage.clearCategory()">✕</button></span>`);
    }
    if (state.inStock) {
      tags.push(`<span class="active-filter-tag">In Stock <button onclick="ProductsPage.toggleStock()">✕</button></span>`);
    }

    container.innerHTML = tags.join("");
  }

  // ── Event handlers ─────────────────────────────────────────
  function onCategoryChange(cat, checked) {
    state.category = checked ? cat : "";
    document.querySelectorAll('#categoryFilters input[name="category"]').forEach((cb) => {
      if (cb.value !== cat) cb.checked = false;
    });
    applyAndRender();
  }

  function onSortChange(val) {
    state.sort = val;
    applyAndRender();
  }

  function onPriceChange(val) {
    state.maxPrice = parseFloat(val) || 0;
    const display = document.getElementById("priceVal");
    if (display) display.textContent = Products.formatPrice(state.maxPrice);
    // Apply filter immediately with debounce
    applyAndRender();
  }

  function onRatingChange(val) {
    state.minRating = parseInt(val) || 0;
    applyAndRender();
  }

  function toggleStock() {
    state.inStock = !state.inStock;
    const checkbox = document.getElementById("inStockOnly");
    if (checkbox) checkbox.checked = state.inStock;
    applyAndRender();
  }

  function setView(v) {
    state.view = v;
    document.getElementById("gridView")?.classList.toggle("active", v === "grid");
    document.getElementById("listView")?.classList.toggle("active", v === "list");
    renderProducts();
  }

  function goToPage(p) {
    const total = Math.ceil(state.filtered.length / PAGE_SIZE);
    if (p < 1 || p > total) return;
    state.page = p;
    renderProducts();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearSearch() {
    state.search = "";
    const searchInput = document.getElementById("globalSearch");
    if (searchInput) searchInput.value = "";
    applyAndRender();
  }

  function clearCategory() {
    state.category = "";
    document.querySelectorAll('#categoryFilters input[name="category"]').forEach((cb) => {
      cb.checked = false;
    });
    applyAndRender();
  }

  function clearFilters() {
    // Use dynamic max price
    const dynamicMax = Products.getMaxPrice();
    state.search = "";
    state.category = "";
    state.maxPrice = dynamicMax;
    state.minRating = 0;
    state.inStock = false;
    state.sort = "default";
    state.page = 1;

    const searchInput = document.getElementById("globalSearch");
    if (searchInput) searchInput.value = "";
    const priceRange = document.getElementById("priceRange");
    if (priceRange) { priceRange.max = dynamicMax; priceRange.value = dynamicMax; }
    const priceVal = document.getElementById("priceVal");
    if (priceVal) priceVal.textContent = Products.formatPrice(dynamicMax);
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) sortSelect.value = "default";
    const inStockCb = document.getElementById("inStockOnly");
    if (inStockCb) inStockCb.checked = false;
    document.querySelectorAll('#categoryFilters input').forEach((cb) => cb.checked = false);
    document.querySelectorAll('input[name="rating"]').forEach((r) => {
      r.checked = r.value === "0";
    });

    history.replaceState(null, "", "products.html");
    applyAndRender();
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
    renderProducts();
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

  function applyAndRender() {
    applyFilters();
    renderProducts();
    renderPagination();
    renderActiveFilters();
  }

  // ── Mobile filter toggle ───────────────────────────────────
  function toggleMobileFilter() {
    const sidebar = document.getElementById("filterSidebar");
    sidebar?.classList.toggle("mobile-open");
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    state.all = Products.getAll();

    // Set dynamic max price
    const dynamicMax = Products.getMaxPrice();
    state.maxPrice = dynamicMax;

    // Set price range slider max
    const priceRange = document.getElementById("priceRange");
    if (priceRange) {
      priceRange.max = dynamicMax;
      priceRange.value = dynamicMax;
    }
    const priceVal = document.getElementById("priceVal");
    if (priceVal) priceVal.textContent = Products.formatPrice(dynamicMax);

    readParams();
    renderCategoryFilters();
    applyAndRender();

    // Sort select
    document.getElementById("sortSelect")?.addEventListener("change", (e) => onSortChange(e.target.value));

    // Price range — apply immediately on change
    document.getElementById("priceRange")?.addEventListener("input", (e) => onPriceChange(e.target.value));

    // Rating radio buttons — apply immediately
    document.querySelectorAll('input[name="rating"]').forEach((r) => {
      r.addEventListener("change", (e) => { onRatingChange(e.target.value); });
    });

    // In stock checkbox — apply immediately
    document.getElementById("inStockOnly")?.addEventListener("change", (e) => {
      state.inStock = e.target.checked;
      applyAndRender();
    });

    // Apply filters button
    document.getElementById("applyFilters")?.addEventListener("click", applyAndRender);

    // Clear filters button
    document.getElementById("clearFilters")?.addEventListener("click", clearFilters);

    // View buttons
    document.getElementById("gridView")?.addEventListener("click", () => setView("grid"));
    document.getElementById("listView")?.addEventListener("click", () => setView("list"));

    // Mobile filter FAB
    document.getElementById("fabFilter")?.addEventListener("click", toggleMobileFilter);

    // Search functionality with debounce
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("globalSearch");
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        state.search = searchInput?.value.trim() || "";
        applyAndRender();
      });
    }
    if (searchInput) {
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          state.search = searchInput.value.trim();
          applyAndRender();
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    applyAndRender,
    clearFilters,
    onCategoryChange,
    onSortChange,
    setView,
    goToPage,
    toggleWishlist,
    addToCart,
    clearSearch,
    clearCategory,
    toggleStock,
  };
})();