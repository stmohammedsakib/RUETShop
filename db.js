// ============================================================
// db.js — LocalStorage Database Layer
// All read/write/delete/query operations go through here.
// ============================================================

const DB = (() => {
  // ── Primitives ──────────────────────────────────────────

  function get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  function clear() {
    localStorage.clear();
  }

  // ── Collection Helpers ───────────────────────────────────
  // Collections are arrays stored under a single key.

  function getCollection(key) {
    return get(key) || [];
  }

  function setCollection(key, array) {
    return set(key, array);
  }

  function insertOne(collectionKey, doc) {
    const col = getCollection(collectionKey);
    doc.id = doc.id || generateId();
    doc.createdAt = doc.createdAt || Date.now();
    col.push(doc);
    setCollection(collectionKey, col);
    return doc;
  }

  function findAll(collectionKey) {
    return getCollection(collectionKey);
  }

  function findById(collectionKey, id) {
    const col = getCollection(collectionKey);
    return col.find((doc) => doc.id === id) || null;
  }

  function findWhere(collectionKey, predicateFn) {
    const col = getCollection(collectionKey);
    return col.filter(predicateFn);
  }

  function findOneWhere(collectionKey, predicateFn) {
    const col = getCollection(collectionKey);
    return col.find(predicateFn) || null;
  }

  function updateById(collectionKey, id, updates) {
    const col = getCollection(collectionKey);
    const idx = col.findIndex((doc) => doc.id === id);
    if (idx === -1) return null;
    col[idx] = { ...col[idx], ...updates, updatedAt: Date.now() };
    setCollection(collectionKey, col);
    return col[idx];
  }

  function deleteById(collectionKey, id) {
    const col = getCollection(collectionKey);
    const filtered = col.filter((doc) => doc.id !== id);
    setCollection(collectionKey, filtered);
    return filtered.length !== col.length;
  }

  function deleteWhere(collectionKey, predicateFn) {
    const col = getCollection(collectionKey);
    const filtered = col.filter((doc) => !predicateFn(doc));
    setCollection(collectionKey, filtered);
    return col.length - filtered.length;
  }

  function count(collectionKey) {
    return getCollection(collectionKey).length;
  }

  function exists(collectionKey, predicateFn) {
    return getCollection(collectionKey).some(predicateFn);
  }

  // ── Utility ──────────────────────────────────────────────

  function generateId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function has(key) {
    return localStorage.getItem(key) !== null;
  }

  // ── Public API ───────────────────────────────────────────

  return {
    // raw
    get,
    set,
    remove,
    clear,
    has,
    // collection
    getCollection,
    setCollection,
    insertOne,
    findAll,
    findById,
    findWhere,
    findOneWhere,
    updateById,
    deleteById,
    deleteWhere,
    count,
    exists,
    generateId,
  };
})();