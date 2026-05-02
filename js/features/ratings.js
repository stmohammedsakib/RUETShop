// ============================================================
// ratings.js — Star Rating UI Logic, Review Storage
// ============================================================

const Ratings = (() => {
  const COL = "ruet_reviews";

  // ── Submit Review ────────────────────────────────────────

  function submit({ productId, rating, comment }) {
    const session = Auth.getSession();
    if (!session) return { ok: false, error: "Please login to leave a review." };

    if (!productId) return { ok: false, error: "Invalid product." };
    if (!rating || rating < 1 || rating > 5) return { ok: false, error: "Rating must be between 1 and 5." };

    const product = Products.getById(productId);
    if (!product) return { ok: false, error: "Product not found." };

    // One review per user per product
    const existing = DB.findOneWhere(COL, (r) => r.productId === productId && r.userId === session.id);
    if (existing) {
      DB.updateById(COL, existing.id, { rating, comment: (comment || "").trim(), updatedAt: Date.now() });
    } else {
      DB.insertOne(COL, {
        productId,
        userId: session.id,
        userName: session.name,
        rating: parseInt(rating),
        comment: (comment || "").trim(),
      });
    }

    _recalcProduct(productId);
    return { ok: true };
  }

  // ── Read ─────────────────────────────────────────────────

  function getByProduct(productId) {
    return DB.findWhere(COL, (r) => r.productId === productId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  function getUserReview(productId) {
    const session = Auth.getSession();
    if (!session) return null;
    return DB.findOneWhere(COL, (r) => r.productId === productId && r.userId === session.id);
  }

  function hasReviewed(productId) {
    return !!getUserReview(productId);
  }

  function getAverage(productId) {
  const reviews = getByProduct(productId);
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return parseFloat((sum / reviews.length).toFixed(1));
  }

  function getCount(productId) {
    return getByProduct(productId).length;
  }

  function renderStars(rating, max = 5) {
    let html = '<div class="stars-display">';
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    
    for (let i = 1; i <= max; i++) {
      if (i <= fullStars) {
        html += '<span class="star filled">★</span>';
      } else if (hasHalf && i === fullStars + 1) {
        html += '<span class="star half">★</span>';
      } else {
        html += '<span class="star">☆</span>';
      }
    }
    html += '</div>';
    return html;
  }

  function getReviews(productId) {
    return getByProduct(productId);
  }

  // ── Recalculate Product Rating ───────────────────────────

  function _recalcProduct(productId) {
    const reviews = getByProduct(productId);
    if (!reviews.length) return;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    Products.updateRating(productId, parseFloat(avg.toFixed(1)), reviews.length);
  }

  // ── Star HTML ────────────────────────────────────────────

  function starsHTML(rating, max = 5) {
    let html = '<span class="stars">';
    for (let i = 1; i <= max; i++) {
      if (i <= Math.floor(rating)) {
        html += '<span class="star filled">★</span>';
      } else if (i - rating < 1 && i - rating > 0) {
        html += '<span class="star half">★</span>';
      } else {
        html += '<span class="star empty">☆</span>';
      }
    }
    html += `</span>`;
    return html;
  }

  // ── Interactive Star Picker ──────────────────────────────

  function renderPicker(containerId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let selected = 0;
    container.innerHTML = "";
    container.classList.add("star-picker");

    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.className = "star-pick";
      star.textContent = "★";
      star.dataset.value = i;

      star.addEventListener("mouseover", () => _highlightPicker(container, i));
      star.addEventListener("mouseout", () => _highlightPicker(container, selected));
      star.addEventListener("click", () => {
        selected = i;
        _highlightPicker(container, selected);
        if (typeof onSelect === "function") onSelect(selected);
      });

      container.appendChild(star);
    }
  }

  function _highlightPicker(container, upTo) {
    container.querySelectorAll(".star-pick").forEach((s, idx) => {
      s.classList.toggle("active", idx < upTo);
    });
  }

  // ── Public API ───────────────────────────────────────────

  return {
  submit,
  getByProduct,
  getUserReview,
  hasReviewed,
  getAverage,
  getCount,
  renderStars,
  getReviews,
  renderPicker
  };
})();