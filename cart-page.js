// js/pages/cart-page.js

const CartPage = (() => {
  let currentStep = 1;

  function render() {
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
      document.getElementById("cartItemCount").innerText = "0 items";
      return;
    }
    
    container.innerHTML = cartItems.map(item => `
      <div class="cart-item" data-id="${item.productId}">
        <div class="cart-item-img">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" onerror="this.src='assets/images/placeholder.svg'">` : `<span>${item.emoji || '📦'}</span>`}
        </div>
        <div class="cart-item-details">
          <h4 class="cart-item-name">${escapeHtml(item.name)}</h4>
          <div class="cart-item-price">৳${item.price.toLocaleString()}</div>
        </div>
        <div class="cart-item-controls">
          <div class="qty-control small">
            <button class="qty-btn" onclick="CartPage.updateQuantity('${item.productId}', ${item.qty - 1})">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="CartPage.updateQuantity('${item.productId}', ${item.qty + 1})">+</button>
          </div>
          <div class="cart-item-subtotal">৳${(item.price * item.qty).toLocaleString()}</div>
          <button class="cart-item-remove" onclick="CartPage.removeItem('${item.productId}')">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      </div>
    `).join("");
    
    document.getElementById("cartItemCount").innerText = `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`;
  }

  function renderSummary(cartItems) {
    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const delivery = subtotal > 0 ? (subtotal >= 1000 ? 0 : 60) : 0;
    const total = subtotal + delivery;
    
    document.getElementById("summarySubtotal").innerText = `৳${subtotal.toLocaleString()}`;
    document.getElementById("summaryDiscount").innerText = `-৳0`;
    document.getElementById("summaryDelivery").innerText = delivery === 0 ? "Free" : `৳${delivery}`;
    document.getElementById("summaryTotal").innerText = `৳${total.toLocaleString()}`;
    
    // Update checkout button
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
    Cart.updateQty(productId, newQty);
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
    if (confirm("Remove all items from cart?")) {
      Cart.clear();
      Navbar.updateCartBadge();
      render();
      Toast.info("Cart cleared");
    }
  }

  // Checkout functions
  function openCheckout() {
    const user = Auth.getSession();
    if (!user) {
      Toast.warning("Please login to checkout");
      setTimeout(() => window.location.href = "auth.html", 1000);
      return;
    }
    
    const cartItems = Cart.getItems();
    if (cartItems.length === 0) {
      Toast.warning("Your cart is empty");
      return;
    }
    
    currentStep = 1;
    document.getElementById("checkoutModal")?.classList.remove("hidden");
    renderCheckoutStep();
  }

  function renderCheckoutStep() {
    // Show/hide steps
    document.getElementById("checkoutStep1").classList.toggle("hidden", currentStep !== 1);
    document.getElementById("checkoutStep2").classList.toggle("hidden", currentStep !== 2);
    document.getElementById("checkoutStep3").classList.toggle("hidden", currentStep !== 3);
    
    // Update step indicators
    for (let i = 1; i <= 3; i++) {
      const step = document.getElementById(`step${i}`);
      if (step) {
        step.classList.toggle("active", currentStep === i);
        step.classList.toggle("done", currentStep > i);
      }
    }
    
    // Update payment amount if on step 2
    if (currentStep === 2) {
      const total = Cart.getSummary().total;
      document.getElementById("payAmount").innerText = `৳${total.toLocaleString()}`;
    }
    
    // Update footer buttons
    const prevBtn = document.getElementById("checkoutPrev");
    const nextBtn = document.getElementById("checkoutNext");
    
    if (prevBtn) prevBtn.style.display = currentStep === 1 ? "none" : "inline-flex";
    if (nextBtn) nextBtn.innerText = currentStep === 3 ? "Place Order" : "Continue";
  }

  function nextStep() {
    if (currentStep === 1) {
      // Validate delivery info
      const name = document.getElementById("deliveryName")?.value.trim();
      const phone = document.getElementById("deliveryPhone")?.value.trim();
      const location = document.getElementById("deliveryLocation")?.value;
      const customLocation = document.getElementById("customLocation")?.value;
      
      if (!name) { Toast.warning("Enter your name"); return; }
      if (!phone || !/^01[3-9]\d{8}$/.test(phone)) { Toast.warning("Enter valid BD phone number"); return; }
      if (!location) { Toast.warning("Select delivery location"); return; }
      
      currentStep = 2;
      renderCheckoutStep();
    } 
    else if (currentStep === 2) {
      currentStep = 3;
      renderCheckoutStep();
    } 
    else if (currentStep === 3) {
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
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || "cod";
    
    const result = Orders.checkout({
      shippingAddress: address,
      phone: phone,
      paymentMethod: paymentMethod === "cod" ? "cash" : paymentMethod
    });
    
    if (result.ok) {
      // Show confirmation step INSIDE the modal first
      currentStep = 3;
      renderCheckoutStep();
      document.getElementById("confirmOrderId").innerText = result.order.id.slice(-8).toUpperCase();
      // Hide footer buttons on confirmation
      document.getElementById("checkoutFooter")?.classList.add("hidden");
      Toast.success("Order placed successfully!");
      setTimeout(() => {
        document.getElementById("checkoutModal")?.classList.add("hidden");
        document.getElementById("checkoutFooter")?.classList.remove("hidden");
        window.location.href = "dashboard.html#orders";
      }, 3000);
    } else {
      Toast.error(result.error || "Order failed");
    }
  }

  function closeModal() {
    document.getElementById("checkoutModal")?.classList.add("hidden");
    currentStep = 1;
  }

  // Location select handler
  function handleLocationChange() {
    const select = document.getElementById("deliveryLocation");
    const customGroup = document.getElementById("customLocationGroup");
    if (select && customGroup) {
      customGroup.style.display = select.value === "Custom Location" ? "block" : "none";
    }
  }

  function init() {
    render();
    
    // Set up event listeners
    document.getElementById("clearCartBtn")?.addEventListener("click", clearCart);
    document.getElementById("checkoutBtn")?.addEventListener("click", openCheckout);
    document.getElementById("checkoutNext")?.addEventListener("click", nextStep);
    document.getElementById("checkoutPrev")?.addEventListener("click", prevStep);
    document.getElementById("closeCheckout")?.addEventListener("click", closeModal);
    document.getElementById("deliveryLocation")?.addEventListener("change", handleLocationChange);
    
    // Apply coupon (simple)
    document.getElementById("applyCoupon")?.addEventListener("click", () => {
      Toast.info("Coupon feature coming soon");
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
      if (m === "&") return "&amp;";
      if (m === "<") return "&lt;";
      if (m === ">") return "&gt;";
      return m;
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  return { updateQuantity, removeItem, clearCart, openCheckout, handleLocationChange };
})();

window.CartPage = CartPage;