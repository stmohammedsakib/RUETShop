// ============================================================
// wishlist.js — Wishlist Persistence
// ============================================================

const Wishlist = (() => {
  const _key = () => {
    const s = Auth.getSession();
    return s ? `ruet_wishlist_${s.id}` : null;
  };

  function _load() {
    const key = _key();
    if (!key) return [];
    return DB.get(key) || [];
  }

  function _save(items) {
    const key = _key();
    if (!key) return;
    DB.set(key, items);
    _dispatchChange();
  }

  function _dispatchChange() {
    window.dispatchEvent(new CustomEvent("wishlist:updated"));
    if (typeof Navbar !== "undefined") Navbar.updateWishlistBadge();
  }

  // ── Read ─────────────────────────────────────────────────

  function getItems() {
    return _load().filter(id => Products.getById(id) !== null);
  }

  // Separate cleanup function — not called during reads
  function _cleanup() {
    const ids = _load();
    const valid = ids.filter(id => Products.getById(id) !== null);
    if (valid.length !== ids.length) {
      _save(valid);
    }
  }

  function getProducts() {
    return getItems().map(id => Products.getById(id)).filter(Boolean);
  }

  function has(productId) {
    return _load().includes(productId);
  }

  function count() {
    return getItems().length;
  }

  // ── Toggle ───────────────────────────────────────────────

  function toggle(productId) {
    const session = Auth.getSession();
    if (!session) return { ok: false, error: "Please login to use wishlist." };

    const items = _load();
    const idx = items.indexOf(productId);

    if (idx >= 0) {
      items.splice(idx, 1);
      _save(items);
      return { ok: true, added: false };
    } else {
      // Validate product exists
      if (!Products.getById(productId)) return { ok: false, error: "Product not found." };
      items.push(productId);
      _save(items);
      return { ok: true, added: true };
    }
  }

  function remove(productId) {
    const items = _load().filter(id => id !== productId);
    _save(items);
    return { ok: true };
  }

  function clear() {
    _save([]);
    return { ok: true };
  }

  // ── Public API ───────────────────────────────────────────

  return {
    getItems,
    getProducts,
    has,
    count,
    toggle,
    remove,
    clear,
  };
})();