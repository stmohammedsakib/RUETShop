// js/core/utils.js

const Utils = {
  formatPrice(amount) {
    return `৳${Number(amount).toLocaleString('en-BD')}`;
  },
  
  formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
    return /^01[3-9]\d{8}$/.test(phone);
  },
  
  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return map[m];
    });
  },
  
  truncate(str, length = 100) {
    if (!str || str.length <= length) return str;
    return str.slice(0, length) + '...';
  }
};

window.Utils = Utils;