// ============================================================
// orders.js — Checkout Simulation, Order History
// ============================================================

const Orders = (() => {
  const COL = "ruet_orders";

  // ── Mark Received (user) ─────────────────────────────────

  function markReceived(orderId) {
    const session = Auth.getSession();
    if (!session) return { ok: false, error: "Not logged in." };

    const order = getById(orderId);
    if (!order) return { ok: false, error: "Order not found." };
    if (order.userId !== session.id) {
      return { ok: false, error: "Unauthorized." };
    }
    if (order.status !== "shipped") {
      return { ok: false, error: "Order is not shipped yet." };
    }

    const updated = DB.updateById(COL, orderId, { status: "delivered" });
    return { ok: true, order: updated };
  }

  // ── Checkout ─────────────────────────────────────────────

  function checkout({ shippingAddress, phone, paymentMethod = "cash", discount = 0, freeShipping = false }) {
    const session = Auth.getSession();
    if (!session) return { ok: false, error: "Please login to place an order." };

    if (session.isGuest) return { ok: false, error: "Guest users cannot place orders. Please register." };

    const summary = Cart.getSummary(discount, freeShipping);
    if (!summary.items.length) return { ok: false, error: "Your cart is empty." };
    if (!shippingAddress || !shippingAddress.trim()) return { ok: false, error: "Shipping address is required." };
    if (!phone || !phone.trim()) return { ok: false, error: "Phone number is required." };
    const cleanPhone = phone.trim().replace(/[-\s]/g, '');
    if (!Utils.validatePhone(cleanPhone)) {
      return { ok: false, error: "Please enter a valid Bangladeshi phone number (e.g., 01711-333001)." };
    }

    // Validate payment method
    const allowedPayments = ['cash', 'bkash', 'nagad', 'cod'];
    if (!allowedPayments.includes(paymentMethod)) {
      return { ok: false, error: "Invalid payment method." };
    }

    // Stock check
    for (const item of summary.items) {
      const product = Products.getById(item.productId);
      if (!product || product.stock < item.qty) {
        return { ok: false, error: `Not enough stock for "${item.name}". Only ${product ? product.stock : 0} left.` };
      }
    }

    // Decrement stock
    summary.items.forEach((item) => {
      Products.decrementStock(item.productId, item.qty);
    });

    // Group items by vendorId
    const vendorGroups = {};
    summary.items.forEach((item) => {
      const p = Products.getById(item.productId);
      const vId = p ? p.vendorId : 'unknown';
      if (!vendorGroups[vId]) vendorGroups[vId] = [];
      vendorGroups[vId].push(item);
    });

    // Create an order for each vendor group
    const createdOrders = [];
    const vendorEntries = Object.entries(vendorGroups);
    const shippingSplit = Math.floor(summary.shipping / vendorEntries.length);
    const shippingRemainder = summary.shipping - (shippingSplit * vendorEntries.length);

    vendorEntries.forEach(([vendorId, items], idx) => {
      const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
      // Last vendor gets the rounding remainder
      const thisShipping = idx === vendorEntries.length - 1 ? shippingSplit + shippingRemainder : shippingSplit;
      // Distribute discount proportionally across vendor orders
      const orderDiscount = vendorEntries.length === 1 ? discount : Math.round(discount * (subtotal / summary.subtotal));
      const total = subtotal + thisShipping - orderDiscount;
      
      const order = DB.insertOne(COL, {
        userId: session.id,
        userName: session.name,
        vendorId: vendorId,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          image: i.image,
        })),
        subtotal: subtotal,
        shipping: thisShipping,
        discount: orderDiscount,
        total: total,
        status: "pending",
        shippingAddress: shippingAddress.trim(),
        phone: phone.trim(),
        paymentMethod,
      });
      createdOrders.push(order);
    });

    Cart.clear();
    // Return first order just for legacy compat if someone expects one object,
    // or ideally the array of orders.
    return { ok: true, order: createdOrders[0], orders: createdOrders };
  }

  // ── Read ─────────────────────────────────────────────────

  function getAll() {
    return DB.findAll(COL).sort((a, b) => b.createdAt - a.createdAt);
  }

  function getById(id) {
    return DB.findById(COL, id);
  }

  function getByUser(userId) {
    return DB.findWhere(COL, (o) => o.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  function getMyOrders() {
    const session = Auth.getSession();
    if (!session) return [];
    return getByUser(session.id);
  }

  function getVendorOrders() {
    const session = Auth.getSession();
    if (!session) return [];
    return DB.findWhere(COL, (o) => {
      if (o.vendorId) return o.vendorId === session.id;
      // Fallback for legacy orders before order-splitting was implemented
      return o.items && o.items.some((i) => {
        const p = Products.getById(i.productId);
        return p && p.vendorId === session.id;
      });
    }).sort((a, b) => b.createdAt - a.createdAt);
  }

  // ── Update Status (vendor OR admin) ───────────────────────

  const STATUSES = ["pending", "processing", "preparing", "shipped", "delivered", "cancelled"];

  function updateStatus(orderId, status) {
    const session = Auth.getSession();
    if (!session) {
      return { ok: false, error: "Unauthorized." };
    }
    if (!STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

    const order = getById(orderId);
    if (!order) return { ok: false, error: "Order not found." };

    if (session.role !== "admin") {
      if (order.vendorId) {
        if (order.vendorId !== session.id) {
          return { ok: false, error: "Unauthorized. You can only update your own sales." };
        }
      } else {
        const isSoleSeller = order.items && order.items.every((i) => {
          const p = Products.getById(i.productId);
          return p && p.vendorId === session.id;
        });
        if (!isSoleSeller) {
          return { ok: false, error: "Unauthorized. You can only update orders where you are the sole vendor." };
        }
      }
    }

    if (status === "cancelled" && order.status !== "cancelled") {
      order.items.forEach((item) => {
        const product = Products.getById(item.productId);
        if (product) {
          const restoredStock = product.stock + item.qty;
          const restoredSold = Math.max(0, (product.sold || 0) - item.qty);
          DB.updateById("ruet_products", item.productId, {
            stock: restoredStock,
            sold: restoredSold,
          });
        }
      });
    }

    const updated = DB.updateById(COL, orderId, { status });
    return { ok: true, order: updated };
  }

  // ── Cancel (user) ────────────────────────────────────────

  function cancel(orderId) {
    const session = Auth.getSession();
    if (!session) return { ok: false, error: "Not logged in." };

    const order = getById(orderId);
    if (!order) return { ok: false, error: "Order not found." };
    let isAuthorized = false;
    if (session.role === "admin") {
      isAuthorized = true;
    } else if (order.userId === session.id) {
      isAuthorized = true;
    } else if (order.vendorId && order.vendorId === session.id) {
      isAuthorized = true;
    } else if (!order.vendorId) {
      const isSoleSeller = order.items && order.items.every((i) => {
        const p = Products.getById(i.productId);
        return p && p.vendorId === session.id;
      });
      if (isSoleSeller) isAuthorized = true;
    }

    if (!isAuthorized) {
      return { ok: false, error: "Unauthorized. You do not have permission to cancel this order." };
    }
    if (!["pending", "preparing"].includes(order.status)) {
      return { ok: false, error: "Order cannot be cancelled at this stage." };
    }

    order.items.forEach((item) => {
      const product = Products.getById(item.productId);
      if (product) {
        const restoredStock = product.stock + item.qty;
        const restoredSold = Math.max(0, (product.sold || 0) - item.qty);
        DB.updateById("ruet_products", item.productId, {
          stock: restoredStock,
          sold: restoredSold,
        });
      }
    });

    const updated = DB.updateById(COL, orderId, { status: "cancelled" });
    return { ok: true, order: updated };
  }

  // ── Utilities ────────────────────────────────────────────

  function statusLabel(status) {
    const labels = {
      pending: "Pending",
      preparing: "Preparing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  }

  function statusColor(status) {
    const colors = {
      pending: "secondary",
      preparing: "warning",
      shipped: "primary",
      delivered: "success",
      cancelled: "danger",
    };
    return colors[status] || "secondary";
  }

  function formatDate(timestamp) {
    return Utils.formatDate(timestamp);
  }

  return {
    checkout,
    getAll,
    getById,
    getByUser,
    getMyOrders,
    getVendorOrders,
    updateStatus,
    cancel,
    markReceived,
    statusLabel,
    statusColor,
    formatDate,
    STATUSES,
  };
})();