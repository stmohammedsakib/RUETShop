// js/pages/order-tracking.js

const OrderTracking = (() => {

  const PIPELINE_STEPS = [
    { key: 'pending',    label: 'Pending',    emoji: '🕐', icon: 'fa-clock' },
    { key: 'preparing',  label: 'Preparing',  emoji: '✅', icon: 'fa-check-circle' },
    { key: 'shipped',    label: 'Shipped',    emoji: '🚚', icon: 'fa-shipping-fast' },
    { key: 'delivered',  label: 'Delivered',  emoji: '🎉', icon: 'fa-box-open' },
  ];

  const STATUS_BANNERS = {
    pending:    { emoji: '🕐', text: 'Your order is being processed by the vendor.' },
    preparing:  { emoji: '✅', text: 'Order confirmed! It will be shipped soon.' },
    shipped:    { emoji: '🚚', text: 'Your order is on the way to campus!' },
    delivered:  { emoji: '🎉', text: 'Order delivered! Enjoy your purchase.' },
    cancelled:  { emoji: '❌', text: 'This order has been cancelled.' },
  };

  // ── Get pipeline progress width ───────────────────────────
  function getPipelineWidth(status) {
    if (status === 'cancelled') return '0%';
    const idx = PIPELINE_STEPS.findIndex(s => s.key === status);
    if (idx < 0) return '0%';
    // Maps 0→0%, 1→33%, 2→66%, 3→100%
    const pct = (idx / (PIPELINE_STEPS.length - 1)) * 100;
    return `${pct}%`;
  }

  // ── Get step state ────────────────────────────────────────
  function getStepState(stepKey, currentStatus) {
    if (currentStatus === 'cancelled') return 'pending';
    const currentIdx = PIPELINE_STEPS.findIndex(s => s.key === currentStatus);
    const stepIdx    = PIPELINE_STEPS.findIndex(s => s.key === stepKey);
    if (stepIdx < currentIdx)  return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  }

  // ── Render full order detail ───────────────────────────────
  function renderOrderDetail(order) {
    const searchCard = document.getElementById("trackingSearchCard");
    const detailView = document.getElementById("orderTrackDetail");
    const content    = document.getElementById("orderDetailContent");

    if (searchCard) searchCard.classList.add("hidden");
    if (detailView) detailView.classList.remove("hidden");

    const isCancelled = order.status === 'cancelled';
    const banner = STATUS_BANNERS[order.status] || STATUS_BANNERS.pending;

    // Pipeline HTML
    const pipelineHTML = isCancelled
      ? `<div class="order-status-banner cancelled">
           <span class="status-banner-emoji">❌</span>
           This order has been cancelled.
         </div>`
      : `<div class="pipeline" id="orderPipeline">
          <div class="pipeline-progress" id="pipelineProgress" style="width:0%"></div>
          ${PIPELINE_STEPS.map(step => {
            const state = getStepState(step.key, order.status);
            const iconHTML = state === 'done'
              ? '<i class="fas fa-check"></i>'
              : `<i class="fas ${step.icon}"></i>`;
            return `
              <div class="pipeline-step ${state}">
                <div class="pipeline-icon">${iconHTML}</div>
                <span class="pipeline-label">${step.label}</span>
                <span class="pipeline-timestamp">${state === 'done' || state === 'active'
                  ? Utils.formatDate(order.createdAt) : '—'}</span>
              </div>`;
          }).join('')}
        </div>
        <div class="order-status-banner ${order.status}">
          <span class="status-banner-emoji">${banner.emoji}</span>
          ${banner.text}
        </div>`;

    // Items HTML
    const itemsHTML = order.items.map(item => {
      const product = Products.getById(item.productId);
      const emoji = product?.emoji || '📦';
      const hasImage = item.image && !item.image.includes('placeholder');
      return `
        <div class="track-item-row">
          <div class="track-item-emoji">
            ${hasImage
              ? `<img src="${Utils.sanitizeUrl(item.image)}"
                      alt="${Utils.escapeHtml(item.name)}"
                      loading="lazy"
                      onerror="this.parentElement.textContent='${emoji}'">`
              : emoji}
          </div>
          <div class="track-item-info">
            <div class="track-item-name">${Utils.escapeHtml(item.name)}</div>
            <div class="track-item-qty">Qty: ${item.qty} × ${Products.formatPrice(item.price)}</div>
          </div>
          <div class="track-item-price">${Products.formatPrice(item.price * item.qty)}</div>
        </div>`;
    }).join('');

    // Payment method label
    const paymentLabel = {
      bkash: '📱 bKash',
      nagad: '💳 Nagad',
      cash:  '💵 Cash on Delivery',
    }[order.paymentMethod] || order.paymentMethod;

    content.innerHTML = `
      <!-- Header card -->
      <div class="order-header-card">
        <div class="order-header-left">
          <div class="order-track-id">#${order.id.slice(-8).toUpperCase()}</div>
          <div class="order-track-date">
            <i class="fas fa-calendar-alt" style="color:var(--primary)"></i>
            Placed on ${Utils.formatDate(order.createdAt)}
          </div>
        </div>
        <div style="text-align:right">
          <div class="order-track-total">${Products.formatPrice(order.total)}</div>
          <div class="order-track-payment">${paymentLabel}</div>
        </div>
      </div>

      <!-- Status pipeline -->
      <div class="status-pipeline-card">
        <h3><i class="fas fa-map-signs" style="color:var(--primary);margin-right:0.4rem"></i>Order Status</h3>
        ${pipelineHTML}
      </div>

      <!-- Delivery & contact info -->
      <div class="order-info-grid">
        <div class="order-info-block">
          <h4><i class="fas fa-map-marker-alt"></i> Delivery Location</h4>
          <p>${Utils.escapeHtml(order.shippingAddress || '—')}</p>
        </div>
        <div class="order-info-block">
          <h4><i class="fas fa-phone"></i> Contact Phone</h4>
          <strong>${Utils.escapeHtml(order.phone || '—')}</strong>
        </div>
        <div class="order-info-block">
          <h4><i class="fas fa-user"></i> Ordered By</h4>
          <strong>${Utils.escapeHtml(order.userName || '—')}</strong>
        </div>
        <div class="order-info-block">
          <h4><i class="fas fa-tag"></i> Status</h4>
          <span class="status-badge status-${order.status}">
            ${Orders.statusLabel(order.status)}
          </span>
        </div>
      </div>

      <!-- Items -->
      <div class="order-items-card">
        <h3><i class="fas fa-box" style="color:var(--primary);margin-right:0.4rem"></i>
            Order Items (${order.items.length})</h3>
        ${itemsHTML}
      </div>

      <!-- Price breakdown -->
      <div class="order-total-card">
        <div class="price-breakdown">
          <div class="price-row">
            <span>Subtotal</span>
            <span>${Products.formatPrice(order.subtotal || order.total)}</span>
          </div>
          <div class="price-row">
            <span>Delivery Fee</span>
            <span>${order.shipping ? Products.formatPrice(order.shipping) : 'Free'}</span>
          </div>
          ${order.discount > 0 ? `
          <div class="price-row" style="color:var(--success)">
            <span>Discount</span>
            <span>-${Products.formatPrice(order.discount)}</span>
          </div>` : ''}
          <div class="price-row total-row">
            <strong>Total Paid</strong>
            <strong>${Products.formatPrice(order.total)}</strong>
          </div>
        </div>
      </div>`;

    // Animate pipeline bar after render
    if (!isCancelled) {
      setTimeout(() => {
        const bar = document.getElementById("pipelineProgress");
        if (bar) bar.style.width = getPipelineWidth(order.status);
      }, 200);
    }
  }

  // ── Show search view ───────────────────────────────────────
  function showSearch() {
    document.getElementById("trackingSearchCard")?.classList.remove("hidden");
    document.getElementById("orderTrackDetail")?.classList.add("hidden");
  }

  // ── Track by ID ────────────────────────────────────────────
  function trackById(orderId) {
    if (!orderId) { Toast.warning("Please enter an Order ID."); return; }

    const normalized = orderId.trim().toUpperCase();

    // Try full ID first, then suffix match
    let order = DB.findOneWhere("ruet_orders", o =>
      o.id.toUpperCase() === normalized ||
      o.id.slice(-8).toUpperCase() === normalized ||
      o.id.slice(-6).toUpperCase() === normalized
    );

    if (!order) {
      Toast.error("Order not found. Please check the ID and try again.");
      return;
    }

    // Auth check — only own orders (unless admin)
    const session = Auth.getSession();
    if (session && session.role !== 'admin' && order.userId !== session.id) {
      Toast.error("You can only track your own orders.");
      return;
    }

    renderOrderDetail(order);
  }

  // ── Render quick orders list ───────────────────────────────
  function renderMyOrders() {
    const container = document.getElementById("myOrdersList");
    if (!container) return;

    const session = Auth.getSession();
    if (!session || session.isGuest) {
      container.innerHTML = `
        <div style="text-align:center;padding:1rem;color:var(--text-3);font-size:0.88rem;">
          <a href="auth.html" style="color:var(--primary);font-weight:600;">Log in</a>
          to see your recent orders here.
        </div>`;
      return;
    }

    const orders = Orders.getMyOrders().slice(0, 5);
    if (!orders.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:1rem;color:var(--text-3);font-size:0.88rem;">
          You haven't placed any orders yet.
          <a href="products.html" style="color:var(--primary);font-weight:600;">Shop now →</a>
        </div>`;
      return;
    }

    container.innerHTML = `
      <h4>Your Recent Orders</h4>
      ${orders.map(o => `
        <div class="quick-order-item" onclick="OrderTracking.trackOrder('${o.id}')">
          <div>
            <div class="quick-order-id">#${o.id.slice(-8).toUpperCase()}</div>
            <div class="quick-order-meta">${Utils.formatDate(o.createdAt)} · ${o.items.length} item${o.items.length !== 1 ? 's' : ''}</div>
          </div>
          <div style="flex:1;padding:0 0.5rem;">
            <span class="status-badge status-${o.status}">
              ${Orders.statusLabel(o.status)}
            </span>
          </div>
          <div class="quick-order-total">${Products.formatPrice(o.total)}</div>
          <i class="fas fa-chevron-right" style="color:var(--text-3);font-size:0.8rem;"></i>
        </div>`).join('')}`;
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    renderMyOrders();

    // Check URL param
    const params = new URLSearchParams(location.search);
    const urlOrderId = params.get("id");
    if (urlOrderId) {
      trackById(urlOrderId);
    }

    // Track button
    document.getElementById("trackOrderBtn")?.addEventListener("click", () => {
      const val = document.getElementById("orderIdInput")?.value;
      trackById(val);
    });

    // Enter key
    document.getElementById("orderIdInput")?.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const val = e.target.value;
        trackById(val);
      }
    });

    // Back button
    document.getElementById("backToSearch")?.addEventListener("click", showSearch);

    // Footer year
    const fy = document.getElementById("footerYear");
    if (fy) fy.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    trackOrder: trackById,
    showSearch,
  };
})();
