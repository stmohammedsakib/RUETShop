// js/pages/cart-page.js

const CartPage = (() => {
  let currentStep = 1;
  let appliedCoupon = null;

  function render() {
    if (Auth?.getSession()?.role === "vendor") {
      window.location.href = "dashboard.html";
      return;
    }

    const cartItems = Cart.getItems();
    renderCartItems(cartItems);
    renderSummary(cartItems);
    
    if (cartItems.length === 0) {
      document.getElementById("emptyCart")?.classList.remove("hidden");
      document.getElementById("cartSummary")?.classList.add("hidden");
    } else {
      document.getElementById("emptyCart")?.classList.add("hidden");
      document.getElementById("cartSummary")?.classList.remove("hidden");
    }
  }

  function renderCartItems(cartItems) {
    const container = document.getElementById("cartItemsList");
    if (!container) return;
    
    if (cartItems.length === 0) {
      container.innerHTML = "";
      const countEl = document.getElementById("cartItemCount");
      if (countEl) countEl.innerText = "0 items";
      return;
    }
    
    container.innerHTML = cartItems.map(item => `
      <div class="cart-item" data-id="${item.productId}">
        <div class="cart-item-img">
          ${item.image && item.image !== 'assets/images/placeholder.svg'
            ? `<img src="${Utils.sanitizeUrl(item.image)}" alt="${Utils.escapeHtml(item.name)}" onerror="this.src='assets/images/placeholder.svg'" loading="lazy">`
            : `<span>${(() => { const p = Products.getById(item.productId); return p?.emoji || '📦'; })()}</span>`}
        </div>
        <div class="cart-item-details">
          <h4 class="cart-item-name">${Utils.escapeHtml(item.name)}</h4>
          <div class="cart-item-price">${Products.formatPrice(item.price)}</div>
        </div>
        <div class="cart-item-controls">
          <div class="qty-control small">
            <button class="qty-btn" onclick="CartPage.updateQuantity('${item.productId}', ${item.qty - 1})">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="CartPage.updateQuantity('${item.productId}', ${item.qty + 1})">+</button>
          </div>
          <div class="cart-item-subtotal">${Products.formatPrice(item.price * item.qty)}</div>
          <button class="cart-item-remove" onclick="CartPage.removeItem('${item.productId}')" aria-label="Remove item">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      </div>
    `).join("");
    
    const countEl = document.getElementById("cartItemCount");
    if (countEl) countEl.innerText = `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`;
  }

  function renderSummary(cartItems) {
    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const delivery = subtotal > 0 ? (subtotal >= 1000 ? 0 : 60) : 0;
    
    const subtotalEl = document.getElementById("summarySubtotal");
    const discountEl = document.getElementById("summaryDiscount");
    const deliveryEl = document.getElementById("summaryDelivery");
    const totalEl = document.getElementById("summaryTotal");
    
    if (subtotalEl) subtotalEl.innerText = Products.formatPrice(subtotal);

    // Apply coupon discount
    let discount = 0;
    let freeShip = false;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
        discount = Math.round(subtotal * (appliedCoupon.value / 100));
      } else if (appliedCoupon.type === 'freeship') {
        freeShip = true;
      }
    }
    const actualDelivery = freeShip ? 0 : delivery;
    const total = subtotal - discount + actualDelivery;

    if (discountEl) discountEl.innerText = discount > 0 ? `-${Products.formatPrice(discount)}` : `-${Products.formatPrice(0)}`;
    if (deliveryEl) deliveryEl.innerText = actualDelivery === 0 ? "Free" : Products.formatPrice(actualDelivery);
    if (totalEl) totalEl.innerText = Products.formatPrice(total);

    // Show/hide coupon applied badge
    const couponBadge = document.getElementById('couponAppliedBadge');
    if (couponBadge) {
      couponBadge.style.display = appliedCoupon ? 'flex' : 'none';
      const label = couponBadge.querySelector('.coupon-label');
      if (label && appliedCoupon) label.textContent = appliedCoupon.label;
    }
    
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
      checkoutBtn.disabled = cartItems.length === 0;
    }
  }

  function updateQuantity(productId, newQty) {
    if (newQty < 1) {
      removeItem(productId);
      return;
    }
    const result = Cart.updateQty(productId, newQty);
    if (!result.ok) {
      Toast.error(result.error);
      return;
    }
    Navbar.updateCartBadge();
    render();
  }

  function removeItem(productId) {
    Cart.remove(productId);
    Navbar.updateCartBadge();
    render();
    Toast.info("Item removed from cart");
  }

  function clearCart() {
    Modal.confirm({
      title: 'Clear Cart',
      message: 'Remove all items from cart?',
      onConfirm: () => {
        Cart.clear();
        Navbar.updateCartBadge();
        render();
        Toast.info("Cart cleared");
      }
    });
  }

  // ── Checkout ───────────────────────────────────────────────
  function openCheckout() {
    const user = Auth.getSession();
    if (!user) {
      Toast.warning("Please login to checkout");
      setTimeout(() => window.location.href = "auth.html", 1000);
      return;
    }
    
    if (user.isGuest) {
      Toast.warning("Guest users cannot checkout. Please register for an account.");
      setTimeout(() => window.location.href = "auth.html", 1500);
      return;
    }
    
    const cartItems = Cart.getItems();
    if (cartItems.length === 0) {
      Toast.warning("Your cart is empty");
      return;
    }
    
    currentStep = 1;
    const modal = document.getElementById("checkoutModal");
    if (modal) {
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }
    renderCheckoutStep();
  }

  function renderCheckoutStep() {
    document.getElementById("checkoutStep1")?.classList.toggle("hidden", currentStep !== 1);
    document.getElementById("checkoutStep2")?.classList.toggle("hidden", currentStep !== 2);
    document.getElementById("checkoutStep3")?.classList.toggle("hidden", currentStep !== 3);
    
    for (let i = 1; i <= 3; i++) {
      const step = document.getElementById(`step${i}`);
      if (step) {
        step.classList.toggle("active", currentStep === i);
        step.classList.toggle("done", currentStep > i);
      }
    }
    
    if (currentStep === 2) {
      const total = Cart.getSummary().total;
      const payEl = document.getElementById("payAmount");
      if (payEl) payEl.innerText = Products.formatPrice(total);
    }
    
    const prevBtn = document.getElementById("checkoutPrev");
    const nextBtn = document.getElementById("checkoutNext");
    
    if (prevBtn) prevBtn.style.display = currentStep === 1 ? "none" : "inline-flex";
    if (nextBtn) nextBtn.innerText = currentStep === 2 ? "Place Order" : "Continue";
    // Hide next button on confirmation step
    if (nextBtn) nextBtn.style.display = currentStep === 3 ? "none" : "inline-flex";
  }

  function nextStep() {
    if (currentStep === 1) {
      const name = document.getElementById("deliveryName")?.value.trim();
      const phone = document.getElementById("deliveryPhone")?.value.trim();
      const location = document.getElementById("deliveryLocation")?.value;
      const customLocation = document.getElementById("customLocation")?.value;
      
      if (!name) { Toast.warning("Enter your name"); return; }
      if (!phone || !/^01[3-9]\d{8}$/.test(phone.replace(/[-\s]/g, ''))) {
        Toast.warning("Enter valid BD phone number (01X-XXXXXXXX)");
        return;
      }
      if (!location) { Toast.warning("Select delivery location"); return; }
      if (location === "Custom Location") {
        const custom = document.getElementById("customLocation")?.value.trim();
        if (!custom) { Toast.warning("Please enter a custom delivery location"); return; }
      }
      
      currentStep = 2;
      renderCheckoutStep();
    } 
    else if (currentStep === 2) {
      placeOrder();
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      renderCheckoutStep();
    }
  }

  function placeOrder() {
    const name = document.getElementById("deliveryName")?.value.trim();
    const phone = document.getElementById("deliveryPhone")?.value.trim();
    const locationSelect = document.getElementById("deliveryLocation")?.value;
    const customLocation = document.getElementById("customLocation")?.value;
    const address = customLocation || locationSelect;
    const paymentMethodNode = document.querySelector('input[name="payment"]:checked');
    if (!paymentMethodNode) {
      Toast.warning("Please select a payment method");
      return;
    }
    const paymentMethod = paymentMethodNode.value;
    
    // Calculate coupon discount to pass to order
    const cartSummary = Cart.getSummary();
    let checkoutDiscount = 0;
    let freeShip = false;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
        checkoutDiscount = Math.round(cartSummary.subtotal * (appliedCoupon.value / 100));
      } else if (appliedCoupon.type === 'freeship') {
        freeShip = true;
      }
    }

    const btn = document.getElementById("checkoutNext");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Placing order...';
    }

    setTimeout(() => {
      const result = Orders.checkout({
        shippingAddress: address,
        phone: phone,
        paymentMethod: paymentMethod === "cod" ? "cash" : paymentMethod,
        discount: checkoutDiscount,
        freeShipping: freeShip
      });
      
      if (result.ok) {
        currentStep = 3;
        renderCheckoutStep();
        const confirmEl = document.getElementById("confirmOrderId");
        if (confirmEl) {
          if (result.orders && result.orders.length > 1) {
            confirmEl.innerText = result.orders.map(o => o.id.slice(-8).toUpperCase()).join(', ');
          } else {
            confirmEl.innerText = result.order.id.slice(-8).toUpperCase();
          }
        }
        document.getElementById("checkoutFooter")?.classList.add("hidden");
        Toast.success("Order placed successfully!");
        Navbar.updateCartBadge();
        setTimeout(() => {
          closeModal();
          window.location.href = "dashboard.html#orders";
        }, 3000);
      } else {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = "Place Order";
        }
        Toast.error(result.error || "Order failed");
      }
    }, 600);
  }

  function closeModal() {
    const modal = document.getElementById("checkoutModal");
    if (modal) modal.classList.add("hidden");
    document.getElementById("checkoutFooter")?.classList.remove("hidden");
    document.body.style.overflow = "";
    currentStep = 1;
  }

  function handleLocationChange() {
    const select = document.getElementById("deliveryLocation");
    const customGroup = document.getElementById("customLocationGroup");
    if (select && customGroup) {
      customGroup.style.display = select.value === "Custom Location" ? "block" : "none";
    }
  }

  function init() {
    render();
    
    document.getElementById("clearCartBtn")?.addEventListener("click", clearCart);
    document.getElementById("checkoutBtn")?.addEventListener("click", openCheckout);
    document.getElementById("checkoutNext")?.addEventListener("click", nextStep);
    document.getElementById("checkoutPrev")?.addEventListener("click", prevStep);
    document.getElementById("closeCheckout")?.addEventListener("click", closeModal);
    document.getElementById("deliveryLocation")?.addEventListener("change", handleLocationChange);
    
    // Payment method toggle for bKash details
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const bkashDetails = document.getElementById('bkashDetails');
        if (bkashDetails) {
          bkashDetails.style.display = e.target.value === 'bkash' ? 'block' : 'none';
        }
      });
    });

    document.getElementById("applyCoupon")?.addEventListener("click", () => {
      const input = document.getElementById("couponInput");
      const code = (input?.value || "").trim().toUpperCase();
      if (!code) { Toast.warning("Please enter a coupon code."); return; }

      const COUPONS = {
        RUET10:    { type: "percent", value: 10, label: "10% off" },
        WELCOME20: { type: "percent", value: 20, label: "20% off" },
        FREESHIP:  { type: "freeship", value: 0, label: "Free shipping" },
        CAMPUS15:  { type: "percent", value: 15, label: "15% off" },
      };

      const coupon = COUPONS[code];
      if (!coupon) {
        Toast.error("Invalid coupon code.");
        return;
      }

      appliedCoupon = coupon;
      Toast.success(`Coupon "${code}" applied — ${coupon.label}!`);
      render();
    });

    document.getElementById("removeCoupon")?.addEventListener("click", () => {
      appliedCoupon = null;
      const input = document.getElementById("couponInput");
      if (input) input.value = "";
      Toast.info("Coupon removed.");
      render();
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  return { updateQuantity, removeItem, clearCart, openCheckout, handleLocationChange };
})();

window.CartPage = CartPage;