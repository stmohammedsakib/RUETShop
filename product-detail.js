// js/pages/product-detail.js

const ProductDetailPage = (() => {
  let product = null;
  let qty = 1;
  let selectedRating = 0;

  // ── Load product ───────────────────────────────────────────
  function getProductId() {
    return new URLSearchParams(location.search).get("id");
  }

  function load() {
    const id = getProductId();
    if (!id) {
      showError("No product specified.");
      return;
    }
    product = Products.getById(id);
    if (!product) {
      showError("Product not found.");
      return;
    }
    renderAll();
  }

  function showError(msg) {
    const grid = document.getElementById("productDetailGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; padding: 4rem 2rem;">
          <span style="font-size:3rem; display:block; margin-bottom:1rem;">😕</span>
          <h3>${msg}</h3>
          <a href="products.html" class="btn btn-primary" style="margin-top:1rem">Back to Products</a>
        </div>
      `;
    }
  }

  // ── Render all sections ────────────────────────────────────
  function renderAll() {
    renderProductDetail();
    renderDescription();
    renderReviews();
    renderVendorInfo();
    renderRelated();
    setupTabs();

    // Update page title and breadcrumb
    document.title = `${product.name} — RUET Online Shop`;
    const breadcrumb = document.getElementById("breadcrumbName");
    if (breadcrumb) breadcrumb.textContent = product.name;
  }

  // ── Main product detail ────────────────────────────────────
  function renderProductDetail() {
    const grid = document.getElementById("productDetailGrid");
    if (!grid) return;

    const discount = Products.discountPercent(product);
    const inWishlist = Wishlist.has(product.id);

    grid.innerHTML = `
      <!-- Gallery -->
      <div class="pd-gallery">
        <div class="pd-main-img">
          <span style="font-size:8rem">${product.emoji || "📦"}</span>
        </div>
      </div>

      <!-- Info -->
      <div class="pd-info">
        <span class="pd-category"><i class="fas fa-tag"></i> ${product.category}</span>
        <h1 class="pd-title">${escapeHtml(product.name)}</h1>
        <p class="pd-vendor">Sold by <a href="#">${product.vendorName || "Unknown Vendor"}</a></p>

        <div class="pd-rating">
          ${Ratings.renderStars(product.rating || 0)}
          <span class="pd-rating-score">${(product.rating || 0).toFixed(1)}</span>
          <span class="pd-review-count">(${product.reviewCount || 0} review${(product.reviewCount || 0) !== 1 ? "s" : ""})</span>
        </div>

        <div class="pd-price-block">
          <span class="pd-price">${Products.formatPrice(product.price)}</span>
          ${product.originalPrice && product.originalPrice > product.price
            ? `<span class="pd-original">${Products.formatPrice(product.originalPrice)}</span>
               <span class="pd-discount">-${discount}%</span>`
            : ""}
        </div>

        <div class="pd-stock ${product.stock > 0 ? "in" : "out"}">
          <i class="fas ${product.stock > 0 ? "fa-check-circle" : "fa-times-circle"}"></i>
          ${product.stock === 0 ? "Out of Stock" : product.stock < 5 ? `Only ${product.stock} left!` : `In Stock (${product.stock} available)`}
        </div>

        <hr class="pd-divider" />

        <div class="pd-qty">
          <label>Quantity</label>
          <div class="qty-control">
            <button class="qty-btn" onclick="ProductDetailPage.changeQty(-1)">−</button>
            <span class="qty-num" id="qtyDisplay">1</span>
            <button class="qty-btn" onclick="ProductDetailPage.changeQty(1)">+</button>
          </div>
        </div>

        <div class="pd-actions">
          <button class="btn btn-primary btn-lg" onclick="ProductDetailPage.addToCart()"
            ${product.stock === 0 ? "disabled" : ""}>
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
          <button class="pd-wishlist-btn ${inWishlist ? "active" : ""}" id="pdWishlistBtn"
            onclick="ProductDetailPage.toggleWishlist()">
            <i class="fas fa-heart"></i>
          </button>
        </div>

        <div class="pd-meta">
          <span><strong>Category:</strong> ${product.category}</span>
          <span><strong>Sold:</strong> ${product.sold || 0} units</span>
          ${product.tags && product.tags.length ? `<span><strong>Tags:</strong> ${product.tags.join(", ")}</span>` : ""}
        </div>
      </div>
    `;
  }

  // ── Description tab ────────────────────────────────────────
  function renderDescription() {
    const container = document.getElementById("descriptionContent");
    if (!container) return;
    container.innerHTML = `<p>${product.description || "No description available for this product."}</p>`;
  }

  // ── Reviews tab ────────────────────────────────────────────
  function renderReviews() {
    const reviewsList = document.getElementById("reviewsList");
    const reviewForm = document.getElementById("reviewForm");
    if (!reviewsList) return;

    const reviews = Ratings.getByProduct(product.id);
    const currentUser = Auth.getSession();

    // Review form visibility
    if (reviewForm) {
      if (!currentUser) {
        reviewForm.innerHTML = `<p style="color:var(--text-3)"><a href="auth.html" style="color:var(--primary)">Login</a> to leave a review.</p>`;
      } else {
        // Setup star picker
        setupStarInput();
      }
    }

    // Reviews list
    if (reviews.length === 0) {
      reviewsList.innerHTML = `<p style="color:var(--text-3); padding: 1rem 0;">No reviews yet. Be the first to review this product!</p>`;
      return;
    }

    reviewsList.innerHTML = reviews
      .map(
        (r) => `
      <div class="review-item">
        <div class="review-avatar">${(r.userName || "U")[0].toUpperCase()}</div>
        <div class="review-content">
          <div class="review-meta">
            <span class="review-name">${r.userName || "Anonymous"}</span>
            ${Ratings.renderStars(r.rating)}
            <span class="review-date">${new Date(r.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}</span>
          </div>
          <p class="review-text">${escapeHtml(r.comment) || "<em>No comment</em>"}</p>
        </div>
      </div>
    `
      )
      .join("");
  }

  function setupStarInput() {
    const starInput = document.getElementById("starInput");
    if (!starInput) return;

    const stars = starInput.querySelectorAll("span");
    stars.forEach((star) => {
      star.addEventListener("click", () => {
        selectedRating = parseInt(star.dataset.val);
        updateStarDisplay();
      });
      star.addEventListener("mouseover", () => {
        highlightStars(parseInt(star.dataset.val));
      });
      star.addEventListener("mouseout", () => {
        updateStarDisplay();
      });
    });

    // Submit review button
    document.getElementById("submitReview")?.addEventListener("click", submitReview);
  }

  function highlightStars(upTo) {
    const stars = document.querySelectorAll("#starInput span");
    stars.forEach((s, i) => {
      s.classList.toggle("active", i < upTo);
    });
  }

  function updateStarDisplay() {
    highlightStars(selectedRating);
  }

  function submitReview() {
    const comment = document.getElementById("reviewText")?.value.trim();

    if (!selectedRating) {
      Toast.warning("Please select a star rating.");
      return;
    }

    const result = Ratings.submit({
      productId: product.id,
      rating: selectedRating,
      comment: comment,
    });

    if (result.ok) {
      Toast.success("Review submitted!");
      // Refresh product data to get updated rating
      product = Products.getById(product.id);
      selectedRating = 0;
      document.getElementById("reviewText").value = "";
      renderReviews();
      renderProductDetail();
    } else {
      Toast.error(result.error || "Failed to submit review.");
    }
  }

  // ── Vendor info tab ────────────────────────────────────────
  function renderVendorInfo() {
    const container = document.getElementById("vendorInfo");
    if (!container) return;

    const vendor = DB.findById("ruet_users", product.vendorId);
    if (!vendor) {
      container.innerHTML = `<p style="color:var(--text-3)">Vendor information not available.</p>`;
      return;
    }

    const vendorProducts = Products.getByVendor(vendor.id);

    container.innerHTML = `
      <div class="vendor-card">
        <div class="vendor-avatar">${vendor.name[0].toUpperCase()}</div>
        <div class="vendor-details">
          <h3>${vendor.name}</h3>
          <p>${vendorProducts.length} products listed</p>
          <p>Member since ${new Date(vendor.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "long" })}</p>
        </div>
      </div>
    `;
  }

  // ── Tabs ───────────────────────────────────────────────────
  function setupTabs() {
    document.querySelectorAll(".tab[data-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        // Update tab buttons
        document.querySelectorAll(".tab[data-tab]").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        // Update tab content
        const target = tab.dataset.tab;
        document.getElementById("tabDescription")?.classList.toggle("hidden", target !== "description");
        document.getElementById("tabReviews")?.classList.toggle("hidden", target !== "reviews");
        document.getElementById("tabVendor")?.classList.toggle("hidden", target !== "vendor");
      });
    });
  }

  // ── Related products ───────────────────────────────────────
  function renderRelated() {
    const grid = document.getElementById("relatedGrid");
    if (!grid) return;

    const related = Products.getRelated(product.id, 4);

    if (!related.length) {
      grid.parentElement.style.display = "none";
      return;
    }

    grid.innerHTML = related
      .map((p) => {
        const discount = Products.discountPercent(p);
        return `
        <div class="product-card" data-id="${p.id}">
          <a href="product-detail.html?id=${p.id}" class="product-card-img">
            <span>${p.emoji || "📦"}</span>
            ${discount > 0 ? `<span class="card-badge">-${discount}%</span>` : ""}
          </a>
          <div class="product-card-body">
            <span class="product-card-category">${p.category}</span>
            <a href="product-detail.html?id=${p.id}" class="product-card-name">${p.name}</a>
            <div class="product-card-stars">
              ${Ratings.renderStars(p.rating || 0)}
              <span class="star-count">(${p.reviewCount || 0})</span>
            </div>
            <div class="product-card-price">
              <span class="price-current">${Products.formatPrice(p.price)}</span>
              ${p.originalPrice && p.originalPrice > p.price ? `<span class="price-original">${Products.formatPrice(p.originalPrice)}</span>` : ""}
            </div>
          </div>
          <div class="product-card-actions">
            <button class="btn btn-primary btn-sm" onclick="ProductDetailPage.quickAddToCart('${p.id}')">
              <i class="fas fa-shopping-cart"></i> Add
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // ── Actions ────────────────────────────────────────────────
  function changeQty(delta) {
    qty = Math.max(1, Math.min(qty + delta, product.stock));
    const display = document.getElementById("qtyDisplay");
    if (display) display.textContent = qty;
  }

  function addToCart() {
    const result = Cart.add(product.id, qty);
    if (result.ok) {
      Toast.success(`Added ${qty} item${qty > 1 ? "s" : ""} to cart!`);
      Navbar.updateCartBadge();
    } else {
      Toast.error(result.error || "Could not add to cart");
    }
  }

  function quickAddToCart(productId) {
    const result = Cart.add(productId, 1);
    if (result.ok) {
      Toast.success("Added to cart!");
      Navbar.updateCartBadge();
    } else {
      Toast.error(result.error);
    }
  }

  function toggleWishlist() {
    const result = Wishlist.toggle(product.id);
    const btn = document.getElementById("pdWishlistBtn");
    if (btn) btn.classList.toggle("active", Wishlist.has(product.id));
    if (result.action === "added") {
      Toast.success("Added to wishlist");
    } else {
      Toast.info("Removed from wishlist");
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => {
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return map[m];
    });
  }

  // ── Init ───────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", load);

  return {
    changeQty,
    addToCart,
    quickAddToCart,
    toggleWishlist,
  };
})();