// ============================================================
// cart.js — Add / Remove / Update Cart, Persist to localStorage
// ============================================================

const Cart = (() => {
  const _key = () => {
    const s = Auth.getSession();
    return s ? `ruet_cart_${s.id}` : "ruet_cart_guest";
  };

  // ── Helpers ──────────────────────────────────────────────

  function _load() {
    return DB.get(_key()) || [];
  }

  function _save(items) {
    DB.set(_key(), items);
    _dispatchChange();
  }

  function _dispatchChange() {
    window.dispatchEvent(new CustomEvent("cart:updated"));
  }

  // ── Read ─────────────────────────────────────────────────

  function getItems() {
    return _load();
  }

  function getCount() {
    return _load().reduce((sum, item) => sum + item.qty, 0);
  }

  function getTotal() {
    return _load().reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function getSummary() {
    const items = _load();
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = subtotal > 0 ? (subtotal >= 1000 ? 0 : 60) : 0;
    const discount = 0;
    const total = subtotal + shipping - discount;
    return { items, subtotal, shipping, discount, total, count: getCount() };
  }

  function findItem(productId) {
    return _load().find((i) => i.productId === productId) || null;
  }

  function isEmpty() {
    return _load().length === 0;
  }

  // ── Add ──────────────────────────────────────────────────

  function add(productId, qty = 1) {
    const product = Products.getById(productId);
    if (!product) return { ok: false, error: "Product not found." };
    if (product.stock < 1) return { ok: false, error: "Product is out of stock." };

    const items = _load();
    const existing = items.find((i) => i.productId === productId);

    if (existing) {
      const newQty = existing.qty + qty;
      if (newQty > product.stock) return { ok: false, error: `Only ${product.stock} items in stock.` };
      existing.qty = newQty;
    } else {
      items.push({
        productId,
        name: product.name,
        price: product.price,
        image: Products.getImageUrl(product),
        stock: product.stock,
        qty,
        vendorId: product.vendorId,
      });
    }

    _save(items);
    return { ok: true };
  }

  // ── Update Quantity ──────────────────────────────────────

  function updateQty(productId, qty) {
    if (qty < 1) return remove(productId);

    const items = _load();
    const item = items.find((i) => i.productId === productId);
    if (!item) return { ok: false, error: "Item not in cart." };

    const product = Products.getById(productId);
    if (product && qty > product.stock) return { ok: false, error: `Only ${product.stock} in stock.` };

    item.qty = qty;
    _save(items);
    return { ok: true };
  }

  // ── Remove ───────────────────────────────────────────────

  function remove(productId) {
    const items = _load().filter((i) => i.productId !== productId);
    _save(items);
    return { ok: true };
  }

  function clear() {
    _save([]);
    return { ok: true };
  }

  // ── Merge Guest Cart (on login) ──────────────────────────

  function mergeGuestCart() {
    const guestItems = DB.get("ruet_cart_guest") || [];
    if (!guestItems.length) return;
    guestItems.forEach((gi) => add(gi.productId, gi.qty));
    DB.remove("ruet_cart_guest");
  }

  // ── Public API ───────────────────────────────────────────

  return {
    getItems,
    getCount,
    getTotal,
    getSummary,
    findItem,
    isEmpty,
    add,
    updateQty,
    remove,
    clear,
    mergeGuestCart,
  };
})();
