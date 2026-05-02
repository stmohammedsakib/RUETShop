// ============================================================
// wishlist.js — Add / Remove / Render Wishlist
// ============================================================

const Wishlist = (() => {
  const _key = () => {
    const s = Auth.getSession();
    return s ? `ruet_wishlist_${s.id}` : "ruet_wishlist_guest";
  };

  function _load() {
    return DB.get(_key()) || [];
  }

  function _save(ids) {
    DB.set(_key(), ids);
    window.dispatchEvent(new CustomEvent("wishlist:updated"));
  }

  // ── Read ─────────────────────────────────────────────────

  function getIds() {
    return _load();
  }

  function getProducts() {
    const ids = _load();
    return ids.map((id) => Products.getById(id)).filter(Boolean);
  }

  function has(productId) {
    return _load().includes(productId);
  }

  function count() {
    return _load().length;
  }

  // ── Toggle ───────────────────────────────────────────────

  function toggle(productId) {
    const ids = _load();
    if (ids.includes(productId)) {
      _save(ids.filter((id) => id !== productId));
      return { ok: true, action: "removed" };
    } else {
      ids.push(productId);
      _save(ids);
      return { ok: true, action: "added" };
    }
  }

  function add(productId) {
    const ids = _load();
    if (!ids.includes(productId)) {
      ids.push(productId);
      _save(ids);
    }
    return { ok: true };
  }

  function remove(productId) {
    _save(_load().filter((id) => id !== productId));
    return { ok: true };
  }

  function clear() {
    _save([]);
  }

  // ── Move to Cart ─────────────────────────────────────────

  function moveToCart(productId) {
    const result = Cart.add(productId, 1);
    if (result.ok) remove(productId);
    return result;
  }

  function moveAllToCart() {
    const ids = _load();
    const results = ids.map((id) => ({ id, result: Cart.add(id, 1) }));
    const successful = results.filter((r) => r.result.ok).map((r) => r.id);
    _save(ids.filter((id) => !successful.includes(id)));
    return results;
  }

  // ── Public API ───────────────────────────────────────────

  return {
    getIds,
    getProducts,
    has,
    count,
    toggle,
    add,
    remove,
    clear,
    moveToCart,
    moveAllToCart,
  };
})();