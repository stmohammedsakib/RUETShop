// ============================================================
// orders.js — Checkout Simulation, Order History
// ============================================================

const Orders = (() => {
  const COL = "ruet_orders";

  // ── Checkout ─────────────────────────────────────────────

  function checkout({ shippingAddress, phone, paymentMethod = "cash" }) {
    const session = Auth.getSession();
    if (!session) return { ok: false, error: "Please login to place an order." };

    const summary = Cart.getSummary();
    if (!summary.items.length) return { ok: false, error: "Your cart is empty." };
    if (!shippingAddress || !shippingAddress.trim()) return { ok: false, error: "Shipping address is required." };
    if (!phone || !phone.trim()) return { ok: false, error: "Phone number is required." };

    // Stock check
    for (const item of summary.items) {
      if (!Products.isInStock(item.productId)) {
        return { ok: false, error: `"${item.name}" is out of stock.` };
      }
    }

    // Decrement stock
    summary.items.forEach((item) => {
      Products.decrementStock(item.productId, item.qty);
    });

    const order = DB.insertOne(COL, {
      userId: session.id,
      userName: session.name,
      items: summary.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        qty: i.qty,
        image: i.image,
      })),
      subtotal: summary.subtotal,
      shipping: summary.shipping,
      discount: summary.discount,
      total: summary.total,
      status: "processing",
      shippingAddress: shippingAddress.trim(),
      phone: phone.trim(),
      paymentMethod,
    });

    Cart.clear();
    return { ok: true, order };
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
    if (!session || session.role !== "vendor") return [];
    return DB.findWhere(COL, (o) =>
      o.items.some((i) => {
        const p = Products.getById(i.productId);
        return p && p.vendorId === session.id;
      })
    ).sort((a, b) => b.createdAt - a.createdAt);
  }

  // ── Update Status (vendor) ───────────────────────────────

  const STATUSES = ["processing", "confirmed", "shipped", "delivered", "cancelled"];

  function updateStatus(orderId, status) {
    const session = Auth.getSession();
    if (!session || session.role !== "vendor") return { ok: false, error: "Unauthorized." };
    if (!STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

    const updated = DB.updateById(COL, orderId, { status });
    if (!updated) return { ok: false, error: "Order not found." };
    return { ok: true, order: updated };
  }

  // ── Cancel (user) ────────────────────────────────────────

  function cancel(orderId) {
    const session = Auth.getSession();
    if (!session) return { ok: false, error: "Not logged in." };

    const order = getById(orderId);
    if (!order) return { ok: false, error: "Order not found." };
    if (order.userId !== session.id) return { ok: false, error: "Unauthorized." };
    if (!["processing", "confirmed"].includes(order.status)) {
      return { ok: false, error: "Order cannot be cancelled at this stage." };
    }

    // Restore stock
    order.items.forEach((item) => {
      const product = Products.getById(item.productId);
      if (product) {
        DB.updateById("ruet_products", item.productId, {
          stock: product.stock + item.qty,
          sold: Math.max(0, (product.sold || 0) - item.qty),
        });
      }
    });

    const updated = DB.updateById(COL, orderId, { status: "cancelled" });
    return { ok: true, order: updated };
  }

  // ── Utilities ────────────────────────────────────────────

  function statusLabel(status) {
    const labels = {
      processing: "Processing",
      confirmed: "Confirmed",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  }

  function statusColor(status) {
    const colors = {
      processing: "warning",
      confirmed: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "danger",
    };
    return colors[status] || "secondary";
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString("en-BD", {
      year: "numeric", month: "short", day: "numeric",
    });
  }

  // ── Public API ───────────────────────────────────────────

  return {
    checkout,
    getAll,
    getById,
    getByUser,
    getMyOrders,
    getVendorOrders,
    updateStatus,
    cancel,
    statusLabel,
    statusColor,
    formatDate,
    STATUSES,
  };
})();