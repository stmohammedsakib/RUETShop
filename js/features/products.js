// ============================================================
// products.js — Product CRUD, Search, Filter, Sort
// ============================================================

const Products = (() => {
  const COL = "ruet_products";

  // ── Create ───────────────────────────────────────────────

  function create({ name, description, price, originalPrice, category, condition, stock, images = [], tags = [] }) {
    const session = Auth.getSession();
    if (!session) {
      return { ok: false, error: "You must be logged in to add products." };
    }
    // Only vendors and users can create products (not guests)
    if (session.isGuest) return { ok: false, error: "Guest users cannot add products. Please register." };
    if (!name || !name.trim()) return { ok: false, error: "Product name is required." };
    if (!price || isNaN(price) || price <= 0) return { ok: false, error: "Valid price is required." };
    if (!category) return { ok: false, error: "Category is required." };
    if (stock === undefined || isNaN(stock) || stock < 0) return { ok: false, error: "Valid stock quantity is required." };

    const safeName = name.trim();
    const safeDesc = (description || "").trim();

    const safeImages = Array.isArray(images)
      ? images.filter(url => Utils.isValidUrl(url) || url.startsWith('assets/'))
      : [];

    const product = DB.insertOne(COL, {
      vendorId: session.id,
      vendorName: session.name,
      name: safeName,
      description: safeDesc,
      price: parseFloat(price),
      originalPrice: (originalPrice && parseFloat(originalPrice) > 0) ? parseFloat(originalPrice) : parseFloat(price),
      category,
      condition: condition || "Used",
      stock: parseInt(stock),
      images: safeImages,
      tags: Array.isArray(tags) ? tags : [],
      rating: 0,
      reviewCount: 0,
      sold: 0,
    });

    return { ok: true, product };
  }

  // ── Read ─────────────────────────────────────────────────

  function getAll() {
    return DB.findAll(COL);
  }

  function getById(id) {
    return DB.findById(COL, id);
  }

  function getByVendor(vendorId) {
    return DB.findWhere(COL, (p) => p.vendorId === vendorId);
  }

  function getByCategory(category) {
    return DB.findWhere(COL, (p) => p.category === category);
  }

  function getCategories() {
    const all = getAll();
    const cats = [...new Set(all.map((p) => p.category))];
    return cats.sort();
  }

  function getFeatured(limit = 8) {
    return getAll()
      .sort((a, b) => b.sold - a.sold)
      .slice(0, limit);
  }

  function getNewArrivals(limit = 8) {
    return getAll()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  function getOnSale(limit = 8) {
    return getAll()
      .filter((p) => p.originalPrice > p.price)
      .sort((a, b) => _discountPercent(b) - _discountPercent(a))
      .slice(0, limit);
  }



  // ── Get max price across all products ────────────────────
  function getMaxPrice() {
    const all = getAll();
    if (!all.length) return 5000;
    return Math.max(...all.map(p => p.price));
  }

  // ── Update ───────────────────────────────────────────────

  function update(id, updates) {
    const session = Auth.getSession();
    if (!session) return { ok: false, error: "Not logged in." };

    const product = getById(id);
    if (!product) return { ok: false, error: "Product not found." };
    // Allow admin to edit any product
    if (product.vendorId !== session.id && session.role !== "admin") {
      return { ok: false, error: "You can only edit your own products." };
    }

    const allowed = ["name", "description", "price", "originalPrice", "category", "condition", "stock", "images", "tags"];
    const clean = {};
    allowed.forEach((k) => {
      if (updates[k] !== undefined) clean[k] = updates[k];
    });

    if (clean.price !== undefined) {
      const p = parseFloat(clean.price);
      if (isNaN(p) || p <= 0) return { ok: false, error: "Valid price is required." };
      clean.price = p;
    }
    if (clean.originalPrice !== undefined) {
      const op = parseFloat(clean.originalPrice);
      if (isNaN(op) || op <= 0) return { ok: false, error: "Valid original price is required." };
      clean.originalPrice = op;
    }
    if (clean.stock !== undefined) {
      const s = parseInt(clean.stock);
      if (isNaN(s) || s < 0) return { ok: false, error: "Valid stock quantity is required." };
      clean.stock = s;
    }

    if (clean.images && Array.isArray(clean.images)) {
      clean.images = clean.images.filter(url => Utils.isValidUrl(url) || url.startsWith('assets/'));
    }

    const updated = DB.updateById(COL, id, clean);
    return { ok: true, product: updated };
  }

  // ── Delete ───────────────────────────────────────────────

  function remove(id) {
    const session = Auth.getSession();
    if (!session) return { ok: false, error: "Not logged in." };

    const product = getById(id);
    if (!product) return { ok: false, error: "Product not found." };
    if (product.vendorId !== session.id && session.role !== "admin") {
      return { ok: false, error: "You can only delete your own products." };
    }

    DB.deleteById(COL, id);
    return { ok: true };
  }

  // ── Related ──────────────────────────────────────────────

  function getRelated(productId, limit = 4) {
    const p = getById(productId);
    if (!p) return [];
    const all = getAll();
    // Score by same category, then shared tags
    return all
      .filter(x => x.id !== productId)
      .map(x => {
        let score = 0;
        if (x.category === p.category) score += 3;
        const sharedTags = (x.tags || []).filter(t => (p.tags || []).includes(t));
        score += sharedTags.length;
        return { product: x, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(x => x.product);
  }

  // ── Search ───────────────────────────────────────────────

  function search(query, exactMatch = false) {
    if (!query || !query.trim()) return getAll();
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    
    const all = getAll();
    const scored = all.map(p => {
      let score = 0;
      const name = p.name.toLowerCase();
      const nameWords = name.split(/[\s,.\-()]+/).filter(Boolean);
      const tags = p.tags || [];
      const tagWords = tags.flatMap(t => t.toLowerCase().split(/[\s,.\-()]+/).filter(Boolean));
      
      const allTermsMatch = terms.every(term => {
        let termMatched = false;
        if (exactMatch) {
          if (nameWords.includes(term)) {
            score += 3;
            termMatched = true;
          }
          if (tags.some(t => t.toLowerCase() === term) || tagWords.includes(term)) {
            score += 2;
            termMatched = true;
          }
        } else {
          if (name.includes(term)) {
            if (nameWords.includes(term)) score += 3;
            else score += 2;
            termMatched = true;
          }
          if (tags.some(t => t.toLowerCase().includes(term))) {
            score += 1;
            termMatched = true;
          }
        }
        return termMatched;
      });
      
      if (!allTermsMatch) score = 0;
      
      return { product: p, score };
    }).filter(item => item.score > 0);
    
    // Sort by highest score first
    scored.sort((a, b) => b.score - a.score);
    return scored.map(item => item.product);
  }

  // ── Filter ───────────────────────────────────────────────

  function filter(products, { category, condition, minPrice, maxPrice, minRating, inStock } = {}) {
    let result = [...products];

    if (category && category !== "all") {
      result = result.filter((p) => p.category === category);
    }
    if (condition && condition !== "all") {
      result = result.filter((p) => (p.condition || 'Used') === condition);
    }
    if (minPrice !== undefined && minPrice !== "") {
      result = result.filter((p) => p.price >= parseFloat(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== "") {
      result = result.filter((p) => p.price <= parseFloat(maxPrice));
    }
    if (minRating !== undefined && minRating !== "") {
      result = result.filter((p) => p.rating >= parseFloat(minRating));
    }
    if (inStock) {
      result = result.filter((p) => p.stock > 0);
    }

    return result;
  }

  // ── Sort ─────────────────────────────────────────────────

  function sort(products, sortBy = "newest") {
    const arr = [...products];
    switch (sortBy) {
      case "newest":
        return arr.sort((a, b) => b.createdAt - a.createdAt);
      case "oldest":
        return arr.sort((a, b) => a.createdAt - b.createdAt);
      case "price-asc":
        return arr.sort((a, b) => a.price - b.price);
      case "price-desc":
        return arr.sort((a, b) => b.price - a.price);
      case "rating":
        return arr.sort((a, b) => b.rating - a.rating);
      case "popular":
        return arr.sort((a, b) => b.sold - a.sold);
      case "discount":
        return arr.sort((a, b) => _discountPercent(b) - _discountPercent(a));
      default:
        return arr;
    }
  }

  // ── Pagination ───────────────────────────────────────────

  function paginate(products, page = 1, perPage = 12) {
    const total = products.length;
    const totalPages = Math.ceil(total / perPage) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const start = (currentPage - 1) * perPage;
    const items = products.slice(start, start + perPage);
    return { items, currentPage, totalPages, total, perPage };
  }

  // ── Stock ────────────────────────────────────────────────

  function decrementStock(productId, qty = 1) {
    const product = getById(productId);
    if (!product) return false;
    const newStock = Math.max(0, product.stock - qty);
    DB.updateById(COL, productId, {
      stock: newStock,
      sold: (product.sold || 0) + qty,
    });
    return true;
  }

  function isInStock(productId) {
    const p = getById(productId);
    return p && p.stock > 0;
  }

  // ── Rating Update (called from ratings.js) ───────────────

  function updateRating(productId, newAvg, newCount) {
    DB.updateById(COL, productId, { rating: newAvg, reviewCount: newCount });
  }

  // ── Utilities ────────────────────────────────────────────

  function _discountPercent(p) {
    if (!p.originalPrice || p.originalPrice <= p.price) return 0;
    return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  }

  function discountPercent(product) {
    return _discountPercent(product);
  }

  function formatPrice(amount) {
    return Utils.formatPrice(amount);
  }

  function getImageUrl(product, index = 0) {
    if (product.images && product.images[index]) return product.images[index];
    return "assets/images/placeholder.svg";
  }

  // ── Public API ───────────────────────────────────────────

  return {
    create,
    getAll,
    getById,
    getByVendor,
    getByCategory,
    getCategories,
    getFeatured,
    getNewArrivals,
    getOnSale,
    getRelated,
    getMaxPrice,
    update,
    remove,
    search,
    filter,
    sort,
    paginate,
    decrementStock,
    isInStock,
    updateRating,
    discountPercent,
    formatPrice,
    getImageUrl,
  };
})();
