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

  function _refreshItems(items) {
    return items.map(item => {
      const product = Products.getById(item.productId);
      if (product) {
        return {
          ...item,
          stock: product.stock,
          name: product.name,
          image: Products.getImageUrl(product),
        };
      }
      return item;
    });
  }

  // ── Read ─────────────────────────────────────────────────

  function getItems() {
    return _refreshItems(_load());
  }

  function getCount() {
    return _load().length;
  }

  function getItemQuantityTotal() {
    return _load().reduce((sum, item) => sum + item.qty, 0);
  }

  function getTotal() {
    return getItems().reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function getSummary(discount = 0, freeShipping = false) {
    const items = getItems();
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const baseShipping = subtotal > 0 ? (subtotal >= 1000 ? 0 : 60) : 0;
    const shipping = freeShipping ? 0 : baseShipping;
    const total = subtotal + shipping - discount;
    return { items, subtotal, shipping, discount, total, count: getCount() };
  }

  function findItem(productId) {
    return getItems().find((i) => i.productId === productId) || null;
  }

  function isEmpty() {
    return _load().length === 0;
  }

  // ── Add ──────────────────────────────────────────────────

  function add(productId, qty = 1) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
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
      if (qty > product.stock) return { ok: false, error: `Only ${product.stock} items in stock.` };
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
    qty = parseInt(qty, 10) || 0;
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
    const results = [];
    const unmergedItems = [];
    guestItems.forEach((gi) => {
      const result = add(gi.productId, gi.qty);
      if (!result.ok) {
        results.push({ productId: gi.productId, error: result.error });
        unmergedItems.push(gi);
      }
    });
    
    if (unmergedItems.length === 0) {
      DB.remove("ruet_cart_guest");
    } else {
      DB.set("ruet_cart_guest", unmergedItems);
    }
    if (results.length > 0) {
      if (typeof Toast !== 'undefined') {
        Toast.warning(`${results.length} item(s) couldn't be added (out of stock).`);
      } else {
        console.warn(`${results.length} item(s) couldn't be added (out of stock).`);
      }
    }
  }

  // ── Public API ───────────────────────────────────────────

  return {
    getItems,
    getCount,
    getItemQuantityTotal,
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
