// js/pages/product-detail.js
// Fixed: Ratings.getByProduct → Ratings.getProductReviews
//        Ratings.add → Ratings.addReview
//        Ratings.remove → Ratings.deleteReview
//        Utils.timeAgo added to utils.js
//        Tab switching wired up properly
//        Vendor info tab implemented
//        Description tab implemented
//        reviewsSection → tabReviews (matches HTML IDs)

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
    if (!id) { showError("No product specified."); return; }
    product = Products.getById(id);
    if (!product) { showError("Product not found."); return; }

    // Set page title
    document.title = `${product.name} — RUETShop`;

    // Breadcrumb
    const bcName = document.getElementById("breadcrumbName");
    if (bcName) bcName.textContent = Utils.truncate(product.name, 40);

    renderAll();
    initTabs();
  }

  function showError(msg) {
    const grid = document.getElementById("productDetailGrid");
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:5rem 2rem;">
          <div style="font-size:4rem;margin-bottom:1rem;">😕</div>
          <h2 style="margin-bottom:0.75rem;">${msg}</h2>
          <a href="products.html" class="btn btn-primary">Browse Products</a>
        </div>`;
    }
  }

  // ── Render all panels ─────────────────────────────────────
  function renderAll() {
    renderProduct();
    renderDescription();
    renderReviews();
    renderVendorInfo();
    renderRelated();
  }

  // ── Tab switching ──────────────────────────────────────────
  function initTabs() {
    const tabs = document.querySelectorAll('.tab[data-tab]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        const panel = document.getElementById(`tab${capitalize(target)}`);
        if (panel) panel.classList.remove('hidden');
      });
    });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Main product panel ─────────────────────────────────────
  function renderProduct() {
    const grid = document.getElementById("productDetailGrid");
    if (!grid) return;

    const discount = Products.discountPercent(product);
    const inWishlist = Wishlist.has(product.id);

    // Gallery
    let galleryHTML = '';
    if (product.images && product.images.length > 0) {
      galleryHTML = `
        <div class="pd-gallery">
          <div class="pd-main-img">
            <img src="${Utils.sanitizeUrl(product.images[0])}"
                 alt="${Utils.escapeHtml(product.name)}"
                 id="mainProductImg"
                 onerror="this.src='assets/images/placeholder.svg'" />
            ${discount > 0 ? `<span class="card-badge">-${discount}%</span>` : ""}
            ${product.stock === 0 ? `<div class="out-of-stock-overlay">Out of Stock</div>` : ""}
          </div>
          ${product.images.length > 1 ? `
          <div class="pd-thumbs">
            ${product.images.map((img, i) => `
              <div class="pd-thumb ${i === 0 ? 'active' : ''}"
                   onclick="ProductDetailPage.switchImage(${i})">
                <img src="${Utils.sanitizeUrl(img)}"
                     alt="Thumbnail ${i + 1}"
                     onerror="this.src='assets/images/placeholder.svg'" />
              </div>`).join('')}
          </div>` : ''}
        </div>`;
    } else {
      galleryHTML = `
        <div class="pd-gallery">
          <div class="pd-main-img pd-emoji-display">
            <span style="font-size:7rem;line-height:1;">${product.emoji || "📦"}</span>
            ${discount > 0 ? `<span class="card-badge">-${discount}%</span>` : ""}
            ${product.stock === 0 ? `<div class="out-of-stock-overlay">Out of Stock</div>` : ""}
          </div>
        </div>`;
    }

    // Stock status
    const stockClass = product.stock === 0 ? 'out' : product.stock < 5 ? 'low' : 'in';
    const stockIcon  = product.stock > 0 ? 'fa-check-circle' : 'fa-times-circle';
    const stockText  = product.stock > 0
      ? `In Stock <span class="pd-stock-count">(${product.stock} available)</span>`
      : 'Out of Stock';

    // Tags
    const tagsHTML = product.tags && product.tags.length > 0
      ? `<div class="pd-tags">${product.tags.map(t =>
          `<span class="pd-tag">${Utils.escapeHtml(t)}</span>`).join('')}</div>`
      : '';

    grid.innerHTML = `
      ${galleryHTML}
      <div class="pd-info">
        <div class="pd-meta-top">
          <a href="products.html?cat=${encodeURIComponent(product.category)}"
             class="pd-category"><i class="fas fa-tag"></i> ${Utils.escapeHtml(product.category)}</a>
          <span class="pd-vendor"><i class="fas fa-store"></i>
            ${Utils.escapeHtml(product.vendorName || "Unknown Vendor")}</span>
        </div>

        <h1 class="pd-title">${Utils.escapeHtml(product.name)}</h1>

        ${(() => {
          const seller = DB.findById("ruet_users", product.vendorId);
          if (seller && seller.role === "user") return "";
          return `
        <div class="pd-rating-row">
          <div class="pd-rating">
            ${Ratings.renderStars(product.rating || 0)}
            <span class="pd-review-count">(${product.reviewCount || 0} reviews)</span>
          </div>
          <span class="pd-sold-count"><i class="fas fa-shopping-bag"></i> ${product.sold || 0} sold</span>
        </div>`;
        })()}

        <div class="pd-price-block">
          <span class="pd-price">${Products.formatPrice(product.price)}</span>
          ${product.originalPrice && product.originalPrice > product.price
            ? `<span class="pd-original-price">${Products.formatPrice(product.originalPrice)}</span>
               <span class="pd-discount-tag">Save ${discount}%</span>`
            : ""}
        </div>

        <div class="pd-stock-status ${stockClass}">
          <i class="fas ${stockIcon}"></i>
          <span>${stockText}</span>
        </div>

        ${tagsHTML}

        <hr class="pd-divider"/>

        ${Auth.getSession()?.role !== 'vendor' ? `
        <div class="pd-purchase-row">
          <div class="pd-qty-wrap">
            <label class="pd-qty-label">Quantity</label>
            <div class="qty-control">
              <button class="qty-btn" onclick="ProductDetailPage.changeQty(-1)" ${qty <= 1 ? 'disabled' : ''}>−</button>
              <span class="qty-num" id="qtyValue">${qty}</span>
              <button class="qty-btn" onclick="ProductDetailPage.changeQty(1)" ${qty >= product.stock ? 'disabled' : ''}>+</button>
            </div>
          </div>

          <div class="pd-actions">
            <button class="btn btn-primary btn-lg pd-add-cart"
                    onclick="ProductDetailPage.addToCart()"
                    ${product.stock === 0 ? 'disabled' : ''}>
              <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
            <button class="pd-wishlist-btn ${inWishlist ? 'active' : ''}"
                    onclick="ProductDetailPage.toggleWishlist()"
                    title="${inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}">
              <i class="fas fa-heart"></i>
            </button>
          </div>
        </div>
        ` : `
        <div class="pd-purchase-row" style="justify-content:center;background:var(--surface-hover);padding:1rem;border-radius:var(--radius);color:var(--text-2);font-weight:500;">
          <i class="fas fa-info-circle"></i> Vendors cannot make purchases.
        </div>
        `}

        <div class="pd-info-cards">
          <div class="pd-info-card">
            <i class="fas fa-shield-alt"></i>
            <div>
              <strong>Secure Transaction</strong>
              <span>Protected by RUETShop</span>
            </div>
          </div>
          <div class="pd-info-card">
            <i class="fas fa-undo"></i>
            <div>
              <strong>Easy Returns</strong>
              <span>Contact vendor within 3 days</span>
            </div>
          </div>
          <div class="pd-info-card">
            <i class="fas fa-map-marker-alt"></i>
            <div>
              <strong>Campus Delivery</strong>
              <span>Within RUET campus</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  function switchImage(index) {
    const mainImg = document.getElementById("mainProductImg");
    if (mainImg && product.images && product.images[index]) {
      mainImg.src = product.images[index];
      document.querySelectorAll('.pd-thumb').forEach((t, i) => {
        t.classList.toggle('active', i === index);
      });
    }
  }

  // ── Quantity ───────────────────────────────────────────────
  function changeQty(delta) {
    qty = Math.max(1, Math.min(qty + delta, product.stock));
    const el = document.getElementById("qtyValue");
    if (el) el.textContent = qty;
    const qtyBtns = document.querySelectorAll('.pd-purchase-row .qty-btn');
    if (qtyBtns[0]) qtyBtns[0].disabled = qty <= 1;
    if (qtyBtns[1]) qtyBtns[1].disabled = qty >= product.stock;
  }

  // ── Cart ───────────────────────────────────────────────────
  function addToCart() {
    if (!product || product.stock === 0) return;
    const result = Cart.add(product.id, qty);
    if (result.ok) {
      Toast.success(`Added ${qty}× ${Utils.truncate(product.name, 25)} to cart!`);
      Navbar.updateCartBadge();
    } else {
      Toast.error(result.error || "Could not add to cart");
    }
  }

  // ── Wishlist ───────────────────────────────────────────────
  function toggleWishlist() {
    const result = Wishlist.toggle(product.id);
    if (result.ok) {
      Toast[result.added ? 'success' : 'info'](
        result.added ? 'Added to wishlist' : 'Removed from wishlist'
      );
      renderProduct();
      Navbar.updateWishlistBadge();
    } else {
      Toast.error(result.error);
    }
  }

  // ── Description tab ────────────────────────────────────────
  function renderDescription() {
    const el = document.getElementById("descriptionContent");
    if (!el) return;
    el.innerHTML = `
      <div class="pd-description-full">
        <p>${Utils.escapeHtml(product.description || "No description provided for this product.")}</p>
        ${product.tags && product.tags.length ? `
          <div class="pd-desc-tags">
            <strong>Tags:</strong>
            ${product.tags.map(t => `<span class="pd-tag">${Utils.escapeHtml(t)}</span>`).join('')}
          </div>` : ''}
        <div class="pd-spec-table">
          <div class="pd-spec-row"><span>Category</span><strong>${Utils.escapeHtml(product.category)}</strong></div>
          <div class="pd-spec-row"><span>Vendor</span><strong>${Utils.escapeHtml(product.vendorName || '—')}</strong></div>
          <div class="pd-spec-row"><span>Stock</span><strong>${product.stock} units</strong></div>
          ${(() => {
            const seller = DB.findById("ruet_users", product.vendorId);
            if (seller && seller.role === "user") return "";
            return `<div class="pd-spec-row"><span>Units Sold</span><strong>${product.sold || 0}</strong></div>`;
          })()}
          ${product.originalPrice && product.originalPrice > product.price
            ? `<div class="pd-spec-row"><span>You Save</span><strong class="save-amount">${Products.formatPrice(product.originalPrice - product.price)} (${Products.discountPercent(product)}%)</strong></div>`
            : ''}
        </div>
      </div>`;
  }

  // ── Reviews tab ────────────────────────────────────────────
  function renderReviews() {
    // Target the correct container from the HTML
    const container = document.getElementById("tabReviews");
    if (!container) return;
    
    const seller = DB.findById("ruet_users", product.vendorId);
    if (seller && seller.role === "user") {
      const reviewTabBtn = document.querySelector('.tab[data-tab="reviews"]');
      if (reviewTabBtn) reviewTabBtn.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    // Use correct API: Ratings.getProductReviews (not Ratings.getByProduct)
    const reviews = Ratings.getProductReviews(product.id);
    const session  = Auth.getSession();
    const hasReviewed = session
      ? reviews.some(r => r.userId === session.id)
      : false;

    // Rating summary bar
    const avgRating = product.rating || 0;
    const totalReviews = product.reviewCount || 0;
    const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: reviews.filter(r => r.rating === star).length,
    }));

    const summaryHTML = totalReviews > 0 ? `
      <div class="review-summary">
        <div class="review-summary-score">
          <span class="big-score">${avgRating.toFixed(1)}</span>
          <div>${Ratings.renderStars(avgRating, false)}</div>
          <span class="review-total-count">${totalReviews} review${totalReviews !== 1 ? 's' : ''}</span>
        </div>
        <div class="review-bars">
          ${ratingCounts.map(({ star, count }) => `
            <div class="review-bar-row">
              <span>${star}★</span>
              <div class="review-bar-track">
                <div class="review-bar-fill" style="width:${totalReviews ? Math.round(count / totalReviews * 100) : 0}%"></div>
              </div>
              <span>${count}</span>
            </div>`).join('')}
        </div>
      </div>` : '';

    // Review form
    let formHTML = '';
    if (!session) {
      formHTML = `
        <div class="review-login-prompt">
          <i class="fas fa-lock"></i>
          <p><a href="auth.html">Log in</a> to leave a review.</p>
        </div>`;
    } else if (session.isGuest) {
      formHTML = `
        <div class="review-login-prompt">
          <i class="fas fa-user"></i>
          <p><a href="auth.html">Create an account</a> to leave reviews.</p>
        </div>`;
    } else if (!hasReviewed) {
      formHTML = `
        <div class="review-form">
          <h3><i class="fas fa-pen"></i> Write a Review</h3>
          <div class="star-input" id="starInput">
            ${[1,2,3,4,5].map(i =>
              `<span data-val="${i}" onclick="ProductDetailPage.setRating(${i})"><i class="fas fa-star"></i></span>`
            ).join('')}
          </div>
          <p class="star-hint" id="starHint">Select a rating above</p>
          <textarea id="reviewComment" class="form-input" rows="3"
                    placeholder="Share your experience with this product..." maxlength="500"></textarea>
          <div class="review-form-footer">
            <span class="char-count" id="charCount">0 / 500</span>
            <button class="btn btn-primary" onclick="ProductDetailPage.submitReview()" id="submitReviewBtn">
              <i class="fas fa-paper-plane"></i> Submit Review
            </button>
          </div>
        </div>`;
    } else {
      formHTML = `
        <div class="review-already">
          <i class="fas fa-check-circle"></i>
          <p>You've already reviewed this product.</p>
        </div>`;
    }

    // Reviews list
    let listHTML = '';
    if (reviews.length === 0) {
      listHTML = `
        <div class="no-reviews">
          <span>💬</span>
          <p>No reviews yet. Be the first!</p>
        </div>`;
    } else {
      listHTML = reviews
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(r => `
          <div class="review-item">
            <div class="review-avatar">${(r.userName || "?")[0].toUpperCase()}</div>
            <div class="review-content">
              <div class="review-meta">
                <span class="review-name">${Utils.escapeHtml(r.userName || "Anonymous")}</span>
                <span class="review-date">${Utils.timeAgo(r.createdAt)}</span>
              </div>
              <div class="review-stars">${Ratings.renderStars(r.rating, false)}</div>
              ${r.comment ? `<p class="review-text">${Utils.escapeHtml(r.comment)}</p>` : ''}
              ${session && (session.id === r.userId || session.role === 'admin')
                ? `<button class="btn-text danger review-delete-btn"
                           onclick="ProductDetailPage.deleteReview('${r.id}')">
                     <i class="fas fa-trash"></i> Delete
                   </button>`
                : ''}
            </div>
          </div>`).join('');
    }

    container.innerHTML = `
      ${summaryHTML}
      ${formHTML}
      <div class="reviews-list" id="reviewsList">${listHTML}</div>`;

    // Wire char counter
    const textarea = document.getElementById("reviewComment");
    if (textarea) {
      textarea.addEventListener("input", () => {
        const cc = document.getElementById("charCount");
        if (cc) cc.textContent = `${textarea.value.length} / 500`;
      });
    }
  }

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  function setRating(val) {
    selectedRating = val;
    document.querySelectorAll('#starInput span').forEach((s, i) => {
      s.classList.toggle('active', i < val);
    });
    const hint = document.getElementById("starHint");
    if (hint) hint.textContent = starLabels[val] || '';
  }

  function submitReview() {
    if (!selectedRating) {
      Toast.warning("Please select a star rating.");
      return;
    }
    const comment = document.getElementById("reviewComment")?.value?.trim() || "";
    if (!comment) {
      Toast.warning("Please write a comment.");
      return;
    }

    const btn = document.getElementById("submitReviewBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px"></span> Submitting...'; }

    setTimeout(() => {
      // Correct API: Ratings.addReview (not Ratings.add)
      const result = Ratings.addReview({ productId: product.id, rating: selectedRating, comment });
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review'; }

      if (result.ok) {
        Toast.success("Review submitted! Thank you.");
        product = Products.getById(product.id);
        selectedRating = 0;
        renderProduct();
        renderReviews();
      } else {
        Toast.error(result.error || "Could not submit review.");
      }
    }, 400);
  }

  function deleteReview(reviewId) {
    Modal.confirm({
      title: 'Delete Review',
      message: 'Are you sure you want to delete this review?',
      onConfirm: () => {
        // Correct API: Ratings.deleteReview (not Ratings.remove)
        const result = Ratings.deleteReview(reviewId);
        if (result.ok) {
          Toast.info("Review deleted.");
          product = Products.getById(product.id);
          renderProduct();
          renderReviews();
        } else {
          Toast.error(result.error || "Could not delete review.");
        }
      }
    });
  }

  // ── Vendor info tab ────────────────────────────────────────
  function renderVendorInfo() {
    const el = document.getElementById("tabVendor");
    if (!el) return;

    const vendor = DB.findOneWhere("ruet_users", u => u.id === product.vendorId);
    const vendorProducts = Products.getByVendor(product.vendorId);
    const isRegularUser = vendor && vendor.role === "user";

    const totalSold = vendorProducts.reduce((s, p) => s + (p.sold || 0), 0);
    const avgRating = vendorProducts.length
      ? (vendorProducts.reduce((s, p) => s + (p.rating || 0), 0) / vendorProducts.length).toFixed(1)
      : '—';

    const avatarContent = vendor && vendor.avatar
      ? `<img src="${Utils.sanitizeUrl(vendor.avatar)}" alt="${Utils.escapeHtml(vendor?.name || '')}"
              style="width:100%;height:100%;border-radius:50%;object-fit:cover;"
              onerror="this.parentElement.textContent='${(vendor?.name || 'V')[0].toUpperCase()}'">`
      : (vendor?.name || 'V')[0].toUpperCase();

    let detailsHTML = '';
    if (isRegularUser) {
      const sId = vendor.studentId || "";
      let dept = "N/A", series = "N/A";
      if (sId.length >= 7) {
        const seriesCode = sId.substring(0, 2);
        const deptCode = sId.substring(2, 4);
        series = seriesCode;
        const depts = {
          "01": "Civil Engineering", 
          "02": "Electrical & Electronic Engineering", 
          "03": "Mechanical Engineering", 
          "04": "Computer Science & Engineering", 
          "05": "Glass & Ceramic Engineering", 
          "06": "Urban & Regional Planning", 
          "07": "Mechatronics Engineering", 
          "08": "Electronics & Telecommunication Engineering", 
          "09": "Building Engineering & Construction Management", 
          "10": "Materials Science & Engineering", 
          "11": "Industrial & Production Engineering", 
          "12": "Chemical & Food Process Engineering", 
          "14": "Architecture"
        };
        dept = depts[deptCode] || "Unknown Engineering";
      }
      detailsHTML = `
          <h3 style="margin-bottom: 0.25rem;">${Utils.escapeHtml(vendor.name || product.vendorName || 'Unknown Seller')}</h3>
          <div style="font-size: 0.95rem; color: var(--text-2); line-height: 1.5; margin-top: 0.5rem;">
            Department of ${dept}, ${series} Series<br>
            Rajshahi University of Engineering & Technology, Rajshahi<br>
            Roll: ${Utils.escapeHtml(sId)}<br>
            Mobile: <a href="tel:${Utils.escapeHtml(vendor.phone || '')}" style="color:var(--primary);text-decoration:none;">${Utils.escapeHtml(vendor.phone || 'N/A')}</a>
          </div>
      `;
    } else {
      detailsHTML = `
          <h3>${Utils.escapeHtml(vendor?.name || product.vendorName || 'Unknown Vendor')}</h3>
          <p class="vendor-bio">${Utils.escapeHtml(vendor?.bio || 'Campus vendor on RUETShop')}</p>
          <div style="font-size:0.9rem; color:var(--text-2); margin-top: 0.5rem; line-height: 1.5;">
            <i class="fas fa-map-marker-alt" style="width:16px;text-align:center;margin-right:4px;"></i> ${Utils.escapeHtml(vendor?.address || 'Rajshahi University of Engineering & Technology')}<br>
            <i class="fas fa-phone-alt" style="width:16px;text-align:center;margin-right:4px;"></i> <a href="tel:${Utils.escapeHtml(vendor?.phone || '')}" style="color:var(--primary);text-decoration:none;">${Utils.escapeHtml(vendor?.phone || 'N/A')}</a>
          </div>
          <div class="vendor-stats-row" style="margin-top: 1rem;">
            <div class="vendor-stat"><strong>${vendorProducts.length}</strong><span>Products</span></div>
            <div class="vendor-stat"><strong>${totalSold}</strong><span>Sold</span></div>
            <div class="vendor-stat"><strong>${avgRating}★</strong><span>Avg Rating</span></div>
          </div>
      `;
    }

    el.innerHTML = `
      <div class="vendor-card">
        <div class="vendor-avatar" style="${vendor?.avatar ? 'background:transparent;padding:0;overflow:hidden;' : ''}">${avatarContent}</div>
        <div class="vendor-details">
          ${detailsHTML}
        </div>
      </div>

      <h3 style="margin:2rem 0 1rem;">More from this ${isRegularUser ? 'Seller' : 'Vendor'}</h3>
      <div class="products-grid">
        ${vendorProducts
            .filter(p => p.id !== product.id)
            .slice(0, 4)
            .map(p => Components.ProductCard(p, {
              onCartClick: `ProductDetailPage.addRelatedToCart('${p.id}')`,
              onWishlistClick: `ProductDetailPage.toggleRelatedWishlist('${p.id}')`,
              showSellerRating: (() => {
                const seller = DB.findById("ruet_users", p.vendorId);
                return !(seller && seller.role === "user");
              })()
            })).join('') || '<p style="color:var(--text-3);padding:1rem 0;">No other products from this vendor.</p>'}
      </div>`;
  }

  // ── Related products ───────────────────────────────────────
  function renderRelated() {
    const grid = document.getElementById("relatedGrid");
    if (!grid) return;

    const related = Products.getRelated(product.id, 4);
    if (!related.length) {
      const section = grid.closest('.section');
      if (section) section.style.display = 'none';
      return;
    }

    grid.innerHTML = related.map(p => Components.ProductCard(p, {
      onCartClick: `ProductDetailPage.addRelatedToCart('${p.id}')`,
      onWishlistClick: `ProductDetailPage.toggleRelatedWishlist('${p.id}')`,
      showSellerRating: (() => {
        const seller = DB.findById("ruet_users", p.vendorId);
        return !(seller && seller.role === "user");
      })()
    })).join('');
  }

  function toggleRelatedWishlist(productId) {
    const result = Wishlist.toggle(productId);
    if (result.ok) {
      Toast[result.added ? 'success' : 'info'](
        result.added ? 'Added to wishlist' : 'Removed from wishlist'
      );
      renderRelated();
      Navbar.updateWishlistBadge();
    } else {
      Toast.error(result.error);
    }
  }

  function addRelatedToCart(productId) {
    const result = Cart.add(productId);
    if (result.ok) {
      Toast.success("Added to cart!");
      Navbar.updateCartBadge();
    } else {
      Toast.error(result.error || "Could not add to cart");
    }
  }

  // ── Init ───────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", load);

  return {
    load,
    switchImage,
    changeQty,
    addToCart,
    toggleWishlist,
    setRating,
    submitReview,
    deleteReview,
    toggleRelatedWishlist,
    addRelatedToCart,
  };
})();
