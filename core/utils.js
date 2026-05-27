// js/core/utils.js — Centralized Utility Functions

const Utils = {
  formatPrice(amount) {
    try {
      return `৳${Number(amount).toLocaleString('en-IN')}`;
    } catch {
      return `৳${Number(amount).toLocaleString()}`;
    }
  },

  formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // ── Time Ago ─────────────────────────────────────────────
  timeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 0) return 'just now'; // Handle future timestamps (clock skew)
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours   = Math.floor(minutes / 60);
    const days    = Math.floor(hours / 24);
    const weeks   = Math.floor(days / 7);
    const months  = Math.floor(days / 30);

    if (seconds < 60)  return 'just now';
    if (minutes < 60)  return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24)    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7)      return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (weeks < 5)     return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    if (months < 12)   return `${months} month${months !== 1 ? 's' : ''} ago`;
    return Utils.formatDate(timestamp);
  },

  debounce(fn, delay = 300) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validatePhone(phone) {
    // Accept both 01XXXXXXXXX and +88001XXXXXXXXX formats
    const cleaned = phone.replace(/[\s\-+]/g, '').replace(/^880/, '');
    return /^01[3-9]\d{8}$/.test(cleaned);
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return map[m];
    });
  },

  truncate(str, length = 100) {
    if (!str || str.length <= length) return str || '';
    return str.slice(0, length) + '...';
  },

  isValidUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  // Sanitize URL — block javascript: and data: (except images) protocols
  sanitizeUrl(url) {
    if (!url) return '';
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:')) return ''; // Prevent XSS
    if (Utils.isValidUrl(url)) return url;
    // Allow relative paths
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('assets/')) return url;
    // Allow base64 image data URIs
    if (url.startsWith('data:image/')) return url;
    return '';
  },

  // ── Format number with K/M suffix ───────────────────────
  formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
    return String(n);
  },

  // ── Clamp a value between min and max ───────────────────
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },
};

// ── Global Error Handling ─────────────────────────────
window.addEventListener('error', (event) => {
  console.error('[RUETShop Error]', event.error || event.message);
  if (typeof Toast !== 'undefined' && Toast.error) {
    Toast.error('An unexpected error occurred. Please try again.');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[RUETShop Async Error]', event.reason);
  if (typeof Toast !== 'undefined' && Toast.error) {
    Toast.error('An async operation failed. Check console for details.');
  }
});

window.Utils = Utils;
