// ============================================================
// products.js — Product CRUD, Search, Filter, Sort
// ============================================================

const Products = (() => {
  const COL = "ruet_products";

  // ── Create ───────────────────────────────────────────────

  function create({ name, description, price, originalPrice, category, stock, images = [], tags = [] }) {
    const session = Auth.getSession();
    if (!session || (session.role !== "vendor" && session.role !== "admin")) {
      return { ok: false, error: "Only vendors can add products." };
    }
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
      originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
      category,
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

  function getRelated(productId, limit = 4) {
    const product = getById(productId);
    if (!product) return [];
    return DB.findWhere(COL, (p) => p.category === product.category && p.id !== productId)
      .sort((a, b) => b.rating - a.rating)
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

    const allowed = ["name", "description", "price", "originalPrice", "category", "stock", "images", "tags"];
    const clean = {};
    allowed.forEach((k) => {
      if (updates[k] !== undefined) clean[k] = updates[k];
    });

    if (clean.price !== undefined) clean.price = parseFloat(clean.price);
    if (clean.originalPrice !== undefined) clean.originalPrice = parseFloat(clean.originalPrice);
    if (clean.stock !== undefined) clean.stock = parseInt(clean.stock);

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

  // ── Search ───────────────────────────────────────────────

  function search(query) {
    if (!query || !query.trim()) return getAll();
    const q = query.trim().toLowerCase();
    return DB.findWhere(COL, (p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }

  // ── Filter ───────────────────────────────────────────────

  function filter(products, { category, minPrice, maxPrice, minRating, inStock } = {}) {
    let result = [...products];

    if (category && category !== "all") {
      result = result.filter((p) => p.category === category);
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