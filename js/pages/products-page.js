// js/pages/products-page.js

const ProductsPage = (() => {
  const PAGE_SIZE = 40;
  let state = {
    all: [],
    filtered: [],
    page: 1,
    view: "grid",
    search: "",
    category: [],
    condition: [],
    minPrice: 0,
    maxPrice: 0,
    minRating: 0,
    inStock: false,
    sort: "default",
  };
  let _usersCache = [];

  // ── Read URL params ────────────────────────────────────────
  function readParams() {
    const params = new URLSearchParams(location.search);
    state.search = params.get("search") || "";
    const catParam = params.get("cat") || params.get("category") || "";
    if (catParam) {
      state.category = catParam.split(",").map(c => c.trim()).filter(Boolean);
    }
  }

  // ── Apply Filters ──────────────────────────────────────────
  function applyFilters() {
    let result = state.search
      ? Products.search(state.search)
      : Products.getAll();

    // Category filter (multi-select)
    if (state.category.length > 0) {
      result = result.filter(p => state.category.includes(p.category));
    }

    // Condition filter
    if (state.condition.length > 0) {
      result = result.filter(p => state.condition.includes(p.condition || 'Used'));
    }

    // Price filter
    if (state.minPrice > 0) {
      result = result.filter(p => p.price >= state.minPrice);
    }
    if (state.maxPrice > 0) {
      result = result.filter(p => p.price <= state.maxPrice);
    }

    // Rating filter
    if (state.minRating > 0) {
      result = result.filter(p => (p.rating || 0) >= state.minRating);
    }

    // In stock filter
    if (state.inStock) {
      result = result.filter(p => p.stock > 0);
    }

    // Sort
    result = Products.sort(result, state.sort);

    state.filtered = result;
    state.page = 1;

    renderProducts();
    renderActiveFilters();
    renderPagination();
  }

  // ── Category Filter ────────────────────────────────────────
  function renderCategoryFilters() {
    const container = document.getElementById("categoryFilters");
    if (!container) return;

    const categories = Products.getCategories();

    container.innerHTML = categories.map(cat => `
      <label class="filter-checkbox">
        <input type="checkbox" value="${Utils.escapeHtml(cat)}"
          ${state.category.includes(cat) ? 'checked' : ''}
          onchange="ProductsPage.onCategoryChange(this)"/>
        <span>${Utils.escapeHtml(cat)}</span>
      </label>
    `).join('');
  }

  function onCategoryChange(checkbox) {
    const cat = checkbox.value;
    if (checkbox.checked) {
      if (!state.category.includes(cat)) state.category.push(cat);
    } else {
      state.category = state.category.filter(c => c !== cat);
    }
    applyFilters();
  }

  // ── Render Products ────────────────────────────────────────
  function renderProducts() {
    const grid = document.getElementById("productsGrid");
    const countEl = document.getElementById("productCount");
    const emptyEl = document.getElementById("emptyState");
    if (!grid) return;

    if (countEl) countEl.textContent = `${state.filtered.length} product${state.filtered.length !== 1 ? 's' : ''}`;

    if (state.filtered.length === 0) {
      grid.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    // Paginate
    const paged = Products.paginate(state.filtered, state.page, PAGE_SIZE);

    _usersCache = DB.findAll("ruet_users");
    grid.className = `products-grid ${state.view}`;
    grid.innerHTML = paged.items.map((p, idx) => renderCard(p, idx < 8)).join('');
  }

  function renderCard(p, eagerLoad = false) {
    return Components.ProductCard(p, {
      eagerLoad,
      onCartClick: `ProductsPage.addToCart('${p.id}')`,
      onWishlistClick: `ProductsPage.toggleWishlist('${p.id}')`,
      showSellerRating: (() => {
        const seller = _usersCache.find(u => u.id === p.vendorId);
        return !(seller && seller.role === "user");
      })()
    });
  }

  // ── Pagination ─────────────────────────────────────────────
  function renderPagination() {
    const container = document.getElementById("pagination");
    if (!container) return;

    const totalPages = Math.ceil(state.filtered.length / PAGE_SIZE) || 1;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';

    // Previous
    html += `<button class="page-btn" onclick="ProductsPage.goToPage(${state.page - 1})" ${state.page <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages > 7) {
        if (i === 1 || i === totalPages || (i >= state.page - 1 && i <= state.page + 1)) {
          html += `<button class="page-btn ${i === state.page ? 'active' : ''}" onclick="ProductsPage.goToPage(${i})">${i}</button>`;
        } else if (i === state.page - 2 || i === state.page + 2) {
          html += `<span class="page-dots">...</span>`;
        }
      } else {
        html += `<button class="page-btn ${i === state.page ? 'active' : ''}" onclick="ProductsPage.goToPage(${i})">${i}</button>`;
      }
    }

    // Next
    html += `<button class="page-btn" onclick="ProductsPage.goToPage(${state.page + 1})" ${state.page >= totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = html;
  }

  function goToPage(page) {
    const totalPages = Math.ceil(state.filtered.length / PAGE_SIZE) || 1;
    state.page = Math.max(1, Math.min(page, totalPages));
    renderProducts();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Active Filters Display ─────────────────────────────────
  function renderActiveFilters() {
    const container = document.getElementById("activeFilters");
    if (!container) return;

    let tags = [];

    if (state.search) {
      tags.push(`<span class="active-filter-tag">Search: "${Utils.escapeHtml(state.search)}" <button onclick="ProductsPage.clearSearch()">×</button></span>`);
    }

    state.category.forEach(cat => {
      tags.push(`<span class="active-filter-tag">${Utils.escapeHtml(cat)} <button onclick="ProductsPage.removeCategory('${Utils.escapeHtml(cat)}')">×</button></span>`);
    });

    state.condition.forEach(cond => {
      tags.push(`<span class="active-filter-tag">${Utils.escapeHtml(cond)} <button onclick="ProductsPage.removeCondition('${Utils.escapeHtml(cond)}')">×</button></span>`);
    });

    if (state.minPrice > 0 || state.maxPrice > 0) {
      let priceStr = "";
      if (state.minPrice > 0 && state.maxPrice > 0) priceStr = `${Products.formatPrice(state.minPrice)} - ${Products.formatPrice(state.maxPrice)}`;
      else if (state.minPrice > 0) priceStr = `Min: ${Products.formatPrice(state.minPrice)}`;
      else priceStr = `Max: ${Products.formatPrice(state.maxPrice)}`;
      tags.push(`<span class="active-filter-tag">${priceStr} <button onclick="ProductsPage.clearPrice()">×</button></span>`);
    }

    if (state.minRating > 0) {
      tags.push(`<span class="active-filter-tag">★${state.minRating}+ <button onclick="ProductsPage.clearRating()">×</button></span>`);
    }

    if (state.inStock) {
      tags.push(`<span class="active-filter-tag">In Stock Only <button onclick="ProductsPage.clearInStock()">×</button></span>`);
    }

    if (tags.length > 0) {
      tags.push(`<button class="filter-clear-all" onclick="ProductsPage.clearFilters()">Clear All</button>`);
    }

    container.innerHTML = tags.join('');
  }

  // ── Filter Actions ─────────────────────────────────────────
  function clearSearch() {
    state.search = "";
    const searchInput = document.getElementById("nav-search-input");
    if (searchInput) searchInput.value = "";
    applyFilters();
  }

  function removeCategory(cat) {
    state.category = state.category.filter(c => c !== cat);
    renderCategoryFilters();
    applyFilters();
  }

  function clearPrice() {
    state.minPrice = 0;
    state.maxPrice = 0;
    const minInput = document.getElementById("minPriceInput");
    const maxInput = document.getElementById("maxPriceInput");
    const minRange = document.getElementById("minPriceRange");
    const maxRange = document.getElementById("maxPriceRange");
    const minDisplay = document.getElementById("priceValMin");
    const maxDisplay = document.getElementById("priceValMax");
    const sliderTrack = document.getElementById("sliderTrack");

    if (minInput) minInput.value = "";
    if (maxInput) maxInput.value = "";
    if (minRange) minRange.value = 0;
    if (maxRange) maxRange.value = 500000;
    if (minDisplay) minDisplay.textContent = "৳0";
    if (maxDisplay) maxDisplay.textContent = "৳500,000";
    if (sliderTrack) {
      sliderTrack.style.left = "0%";
      sliderTrack.style.right = "0%";
    }

    applyFilters();
  }

  function clearRating() {
    state.minRating = 0;
    document.querySelectorAll('input[name="rating"]').forEach(r => r.checked = false);
    applyFilters();
  }

  function clearInStock() {
    state.inStock = false;
    const cb = document.getElementById("inStockOnly");
    if (cb) cb.checked = false;
    applyFilters();
  }

  function clearFilters() {
    state.search = "";
    state.category = [];
    state.condition = [];
    state.minPrice = 0;
    state.maxPrice = 0;
    state.minRating = 0;
    state.inStock = false;
    state.sort = "default";

    const searchInput = document.getElementById("nav-search-input");
    if (searchInput) searchInput.value = "";
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) sortSelect.value = "default";
    const minInput = document.getElementById("minPriceInput");
    const maxInput = document.getElementById("maxPriceInput");
    const minRange = document.getElementById("minPriceRange");
    const maxRange = document.getElementById("maxPriceRange");
    const minDisplay = document.getElementById("priceValMin");
    const maxDisplay = document.getElementById("priceValMax");
    const sliderTrack = document.getElementById("sliderTrack");

    if (minInput) minInput.value = "";
    if (maxInput) maxInput.value = "";
    if (minRange) minRange.value = 0;
    if (maxRange) maxRange.value = 500000;
    if (minDisplay) minDisplay.textContent = "৳0";
    if (maxDisplay) maxDisplay.textContent = "৳500,000";
    if (sliderTrack) {
      sliderTrack.style.left = "0%";
      sliderTrack.style.right = "0%";
    }

    renderCategoryFilters();
    applyFilters();
  }

  // ── Wishlist / Cart ────────────────────────────────────────
  function toggleWishlist(productId) {
    const result = Wishlist.toggle(productId);
    if (result.ok) {
      Toast[result.added ? 'success' : 'info'](result.added ? 'Added to wishlist' : 'Removed from wishlist');
      renderProducts();
      Navbar.updateWishlistBadge();
    } else {
      Toast.error(result.error);
    }
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

  // ── Condition Filter ──────────────────────────────────────
  function onConditionChange(checkbox) {
    const cond = checkbox.value;
    if (checkbox.checked) {
      if (!state.condition.includes(cond)) state.condition.push(cond);
    } else {
      state.condition = state.condition.filter(c => c !== cond);
    }
    applyFilters();
  }

  function removeCondition(cond) {
    state.condition = state.condition.filter(c => c !== cond);
    // Uncheck the checkbox
    const checkboxes = document.querySelectorAll('#conditionFilters input[type="checkbox"]');
    checkboxes.forEach(cb => { if (cb.value === cond) cb.checked = false; });
    applyFilters();
  }

  // ── View Toggle ────────────────────────────────────────────
  function setView(view) {
    state.view = view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.view-btn[data-view="${view}"]`)?.classList.add('active');
    renderProducts();
  }

  // ── Mobile Filter Toggle ───────────────────────────────────
  function toggleMobileFilters() {
    const sidebar = document.querySelector('.filter-sidebar');
    if (sidebar) sidebar.classList.toggle('open');
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    readParams();

    state.all = Products.getAll();

    renderCategoryFilters();

    // Search input
    const searchInput = document.getElementById("nav-search-input");
    if (searchInput) {
      searchInput.value = state.search;
      searchInput.addEventListener("input", Utils.debounce((e) => {
        state.search = e.target.value.trim();
        applyFilters();
      }, 300));
    }

    // Sort select
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        state.sort = e.target.value;
        applyFilters();
      });
    }

    // Price inputs and sliders
    const minInput = document.getElementById("minPriceInput");
    const maxInput = document.getElementById("maxPriceInput");
    const minRange = document.getElementById("minPriceRange");
    const maxRange = document.getElementById("maxPriceRange");
    const sliderTrack = document.getElementById("sliderTrack");
    const minDisplay = document.getElementById("priceValMin");
    const maxDisplay = document.getElementById("priceValMax");
    const MAX_LIMIT = 500000;

    const updatePriceUI = (minVal, maxVal) => {
      // Constrain values
      if (minVal > maxVal - 100) minVal = maxVal - 100;
      if (minVal < 0) minVal = 0;
      if (maxVal > MAX_LIMIT) maxVal = MAX_LIMIT;

      // Update state
      state.minPrice = minVal;
      state.maxPrice = maxVal >= MAX_LIMIT ? 0 : maxVal; // 0 means "Any" max

      // Update inputs
      if (minInput && minInput.value != minVal) minInput.value = minVal || "";
      if (maxInput && maxInput.value != maxVal) maxInput.value = maxVal >= MAX_LIMIT ? "" : maxVal;
      if (minRange && minRange.value != minVal) minRange.value = minVal;
      if (maxRange && maxRange.value != maxVal) maxRange.value = maxVal;

      // Update displays
      if (minDisplay) minDisplay.textContent = Products.formatPrice(minVal);
      if (maxDisplay) maxDisplay.textContent = Products.formatPrice(maxVal);

      // Update track
      if (sliderTrack) {
        const minPercent = (minVal / MAX_LIMIT) * 100;
        const maxPercent = (maxVal / MAX_LIMIT) * 100;
        sliderTrack.style.left = minPercent + "%";
        sliderTrack.style.right = (100 - maxPercent) + "%";
      }

      applyFilters();
    };

    if (minRange && maxRange) {
      minRange.addEventListener("input", (e) => {
        let maxVal = parseInt(maxRange.value) || MAX_LIMIT;
        let minVal = parseInt(e.target.value) || 0;
        if (minVal > maxVal - 100) {
          minRange.value = maxVal - 100;
          minVal = maxVal - 100;
        }
        updatePriceUI(minVal, maxVal);
      });
      maxRange.addEventListener("input", (e) => {
        let minVal = parseInt(minRange.value) || 0;
        let maxVal = parseInt(e.target.value) || MAX_LIMIT;
        if (maxVal < minVal + 100) {
          maxRange.value = minVal + 100;
          maxVal = minVal + 100;
        }
        updatePriceUI(minVal, maxVal);
      });
    }

    if (minInput) {
      minInput.addEventListener("input", Utils.debounce((e) => {
        let maxVal = parseInt(maxInput.value) || MAX_LIMIT;
        let minVal = e.target.value === "" ? 0 : (parseInt(e.target.value) || 0);
        updatePriceUI(minVal, maxVal);
      }, 300));
    }
    if (maxInput) {
      maxInput.addEventListener("input", Utils.debounce((e) => {
        let minVal = parseInt(minInput.value) || 0;
        let maxVal = e.target.value === "" ? MAX_LIMIT : (parseInt(e.target.value) || MAX_LIMIT);
        updatePriceUI(minVal, maxVal);
      }, 300));
    }

    // Rating filter
    document.querySelectorAll('input[name="rating"]').forEach(radio => {
      radio.addEventListener("change", (e) => {
        state.minRating = parseFloat(e.target.value) || 0;
        applyFilters();
      });
    });

    // In stock checkbox
    const inStockCb = document.getElementById("inStockOnly");
    if (inStockCb) {
      inStockCb.addEventListener("change", (e) => {
        state.inStock = e.target.checked;
        applyFilters();
      });
    }

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => setView(btn.dataset.view));
    });

    // Mobile filter button
    const fabFilter = document.querySelector('.fab-filter');
    if (fabFilter) {
      fabFilter.addEventListener('click', toggleMobileFilters);
    }

    // Close mobile filter on overlay click
    const sidebar = document.querySelector('.filter-sidebar');
    if (sidebar) {
      sidebar.addEventListener('click', (e) => {
        if (e.target === sidebar) sidebar.classList.remove('open');
      });
    }

    applyFilters();
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    init,
    onCategoryChange,
    onConditionChange,
    removeCondition,
    toggleWishlist,
    addToCart,
    goToPage,
    setView,
    clearSearch,
    removeCategory,
    clearPrice,
    clearRating,
    clearInStock,
    clearFilters,
    toggleMobileFilters,
  };
})();
