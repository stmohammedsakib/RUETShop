// ============================================================
// db.js — LocalStorage Database Layer
// All read/write/delete/query operations go through here.
// ============================================================

const DB = (() => {
  // ── Constants ────────────────────────────────────────────
  const MAX_STORAGE_BYTES = 4.5 * 1024 * 1024; // 4.5MB warning threshold
  const MAX_CACHE_SIZE = 50; // Limit cache size to prevent memory leaks

  let cache = new Map();

  function _updateCache(key, value) {
    if (cache.has(key)) {
      cache.delete(key);
    }
    cache.set(key, value);
    if (cache.size > MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
  }

  // Listen for changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('ruet_')) {
      cache.delete(e.key);
      window.dispatchEvent(new CustomEvent('ruet_db_update', { detail: { key: e.key } }));
    }
    if (e.key === null) {
      cache.clear(); // localStorage.clear() was called in another tab
      window.dispatchEvent(new CustomEvent('ruet_db_update', { detail: { key: 'all' } }));
    }
  });

  // ── Primitives ──────────────────────────────────────────

  function get(key) {
    if (cache.has(key)) return cache.get(key);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const val = JSON.parse(raw);
      _updateCache(key, val);
      return val;
    } catch (e) {
      console.error(`[DB] Error parsing data for key ${key}:`, e);
      localStorage.removeItem(key); // Clear corrupted data
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      _updateCache(key, value);
      window.dispatchEvent(new CustomEvent('ruet_db_update', { detail: { key } }));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.error('[DB] Storage quota exceeded! Consider clearing old data.');
        if (typeof Toast !== 'undefined') {
          Toast.error('Storage is full. Please clear some data.');
        }
      }
      return false;
    }
  }

  function remove(key) {
    localStorage.removeItem(key);
    cache.delete(key);
    window.dispatchEvent(new CustomEvent('ruet_db_update', { detail: { key } }));
  }

  function _clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('ruet_'))
      .forEach(k => {
        localStorage.removeItem(k);
        cache.delete(k);
      });
    window.dispatchEvent(new CustomEvent('ruet_db_update', { detail: { key: 'all' } }));
  }

  // ── Storage Info ────────────────────────────────────────

  function getStorageUsage() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key);
      total += (key.length + (val ? val.length : 0)) * 2; // UTF-16
    }
    return total;
  }

  function isStorageNearFull() {
    return getStorageUsage() > MAX_STORAGE_BYTES;
  }

  // ── Collection Helpers ───────────────────────────────────

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
    const saved = setCollection(collectionKey, col);
    if (!saved) {
      console.error('[DB] Failed to save item — storage may be full.');
      col.pop(); // Rollback
      return null;
    }
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

  let _idCounter = 0;
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    _idCounter++;
    return `${Date.now()}_${_idCounter}_${Math.random().toString(36).slice(2, 11)}`;
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
    has,
    clear: _clear,
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
    // storage info
    getStorageUsage,
    isStorageNearFull,
  };
})();
