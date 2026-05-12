// ============================================================
// ratings.js — Review & Rating System
// ============================================================

const Ratings = (() => {
  const COL = "ruet_reviews";

  // ── Add Review ───────────────────────────────────────────
  function addReview({ productId, rating, comment }) {
    const session = Auth.getSession();
    if (!session) return { ok: false, error: "Login to review." };
    if (session.isGuest) return { ok: false, error: "Guests cannot submit reviews." };
    if (!productId) return { ok: false, error: "Product ID is required." };
    if (!rating || rating < 1 || rating > 5) return { ok: false, error: "Rating must be between 1 and 5." };
    const cleanComment = (comment || "").trim();
    if (!cleanComment) return { ok: false, error: "Please write a comment." };

    const product = Products.getById(productId);
    if (!product) return { ok: false, error: "Product not found." };

    // Prevent duplicate reviews
    const existing = DB.findOneWhere(COL, (r) => r.productId === productId && r.userId === session.id);
    if (existing) return { ok: false, error: "You have already reviewed this product." };

    const review = DB.insertOne(COL, {
      productId,
      userId: session.id,
      userName: session.name,
      rating: parseInt(rating),
      comment: cleanComment,
    });

    // Recalculate product rating
    _recalcProductRating(productId);

    return { ok: true, review };
  }

  // ── Read ─────────────────────────────────────────────────

  function getProductReviews(productId) {
    return DB.findWhere(COL, (r) => r.productId === productId).sort((a, b) => b.createdAt - a.createdAt);
  }

  function getUserReviews(userId) {
    return DB.findWhere(COL, (r) => r.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  }

  function getAverageRating(productId) {
    const reviews = getProductReviews(productId);
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return +(sum / reviews.length).toFixed(1);
  }

  // ── Render Stars ─────────────────────────────────────────

  function renderStars(rating, showNumber = true) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    let html = "";
    for (let i = 0; i < full; i++) html += '<i class="fas fa-star star-gold"></i>';
    if (half) html += '<i class="fas fa-star-half-alt star-gold"></i>';
    for (let i = 0; i < empty; i++) html += '<i class="far fa-star star-muted"></i>';
    if (showNumber) html += ` <span class="rating-num">${rating > 0 ? rating.toFixed(1) : "0.0"}</span>`;
    return html;
  }

  // ── Star Picker ──────────────────────────────────────────

  function renderStarPicker(containerId, initialRating = 0) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let selected = initialRating;

    function render() {
      container.innerHTML = "";
      container.setAttribute("role", "radiogroup");
      container.setAttribute("aria-label", "Rating");
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.className = `star-pick ${i <= selected ? "active" : ""}`;
        star.innerHTML = '<i class="fas fa-star"></i>';
        star.dataset.value = i;
        star.setAttribute("role", "radio");
        star.setAttribute("aria-checked", i <= selected ? "true" : "false");
        star.setAttribute("aria-label", `${i} star${i > 1 ? 's' : ''}`);
        star.setAttribute("tabindex", "0");

        star.addEventListener("click", () => {
          selected = i;
          container.dataset.rating = i;
          render();
        });

        star.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selected = i;
            container.dataset.rating = i;
            render();
          }
        });

        container.appendChild(star);
      }
    }

    render();
    return container;
  }

  // ── Delete ───────────────────────────────────────────────

  function deleteReview(reviewId) {
    const session = Auth.getSession();
    if (!session) return { ok: false, error: "Not logged in." };

    const review = DB.findById(COL, reviewId);
    if (!review) return { ok: false, error: "Review not found." };
    if (review.userId !== session.id && session.role !== "admin") {
      return { ok: false, error: "Unauthorized." };
    }

    const productId = review.productId;
    DB.deleteById(COL, reviewId);
    _recalcProductRating(productId);
    return { ok: true };
  }

  // ── Internal ─────────────────────────────────────────────

  function _recalcProductRating(productId) {
    const reviews = getProductReviews(productId);
    const avg = reviews.length
      ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : 0;
    Products.updateRating(productId, avg, reviews.length);
  }

  // ── Public API ───────────────────────────────────────────

  return {
    addReview,
    getProductReviews,
    getUserReviews,
    getAverageRating,
    renderStars,
    renderStarPicker,
    deleteReview,
  };
})();