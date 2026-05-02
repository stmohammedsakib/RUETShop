// ============================================================
// seed.js — Dummy Data Seeder
// Runs once on first load. Populates products, users, orders.
// ============================================================

const Seeder = (() => {
  const SEEDED_KEY = "ruet_seeded_v2";

  // ── Seed Entry Point ─────────────────────────────────────

  function run() {
    if (DB.has(SEEDED_KEY)) return;
    _seedUsers();
    _seedProducts();
    _seedOrders();
    DB.set(SEEDED_KEY, true);
    console.info("[Seeder] Dummy data loaded.");
  }

  function reset() {
    DB.remove(SEEDED_KEY);
    DB.remove("ruet_users");
    DB.remove("ruet_products");
    DB.remove("ruet_orders");
    DB.remove("ruet_reviews");
    DB.remove("ruet_session");
    run();
  }

  // ── Users ────────────────────────────────────────────────

  function _seedUsers() {
    const users = [
      // ── Admins ──
      {
        id: "admin_001",
        name: "Tanvir Ahmed",
        email: "tanvir@ruet.ac.bd",
        password: btoa("admin123_ruet_salt"),
        role: "admin",
        phone: "01700000001",
        address: "Admin Office, RUET",
        avatar: "",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
      },
      {
        id: "admin_002",
        name: "Nusrat Jahan",
        email: "nusrat@ruet.ac.bd",
        password: btoa("admin123_ruet_salt"),
        role: "admin",
        phone: "01700000002",
        address: "Admin Office, RUET",
        avatar: "",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 55,
      },
      {
        id: "admin_003",
        name: "Fahim Rahman",
        email: "fahim@ruet.ac.bd",
        password: btoa("admin123_ruet_salt"),
        role: "admin",
        phone: "01700000003",
        address: "Admin Office, RUET",
        avatar: "",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50,
      },
      // ── Regular Users ──
      {
        id: "user_001",
        name: "Rahim Hossain",
        email: "rahim@ruet.ac.bd",
        password: btoa("123456_ruet_salt"),
        role: "user",
        phone: "01711000001",
        address: "Hall-1, RUET, Rajshahi",
        avatar: "",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
      },
      {
        id: "user_002",
        name: "Karim Vendor",
        email: "karim@ruet.ac.bd",
        password: btoa("123456_ruet_salt"),
        role: "vendor",
        phone: "01711000002",
        address: "Shop 12, RUET Campus",
        avatar: "",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
      },
      {
        id: "user_003",
        name: "Sumaiya Begum",
        email: "sumaiya@ruet.ac.bd",
        password: btoa("123456_ruet_salt"),
        role: "user",
        phone: "01811000003",
        address: "Girls Hall, RUET, Rajshahi",
        avatar: "",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
      },
    ];
    DB.setCollection("ruet_users", users);
  }

  // ── Products ─────────────────────────────────────────────

  function _seedProducts() {
    const products = [
      // Electronics
      {
        id: "prod_001", vendorId: "user_002", vendorName: "Karim Vendor",
        name: "Wireless Earbuds", emoji: "🎧",
        description: "Bluetooth 5.0 earbuds with 24hr battery, noise cancellation, and IPX5 water resistance. Perfect for students.",
        price: 1200, originalPrice: 1800, category: "Electronics", stock: 15,
        images: [], tags: ["earbuds", "bluetooth", "wireless"],
        rating: 4.2, reviewCount: 18, sold: 34,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
      },
      {
        id: "prod_002", vendorId: "user_002", vendorName: "Karim Vendor",
        name: "USB-C Hub 7-in-1", emoji: "🔌",
        description: "Expand your laptop ports with HDMI 4K, 3x USB 3.0, SD card reader, PD charging, and Ethernet.",
        price: 2200, originalPrice: 2800, category: "Electronics", stock: 8,
        images: [], tags: ["usb hub", "laptop", "accessories"],
        rating: 4.5, reviewCount: 12, sold: 21,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
      },
      {
        id: "prod_003", vendorId: "user_002", vendorName: "Karim Vendor",
        name: "Mechanical Keyboard", emoji: "⌨️",
        description: "TKL mechanical keyboard with blue switches, RGB backlight, and aluminum frame. Great for coding.",
        price: 3500, originalPrice: 4200, category: "Electronics", stock: 5,
        images: [], tags: ["keyboard", "mechanical", "rgb"],
        rating: 4.7, reviewCount: 9, sold: 14,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
      },
      // Stationery
      {
        id: "prod_004", vendorId: "user_002", vendorName: "Karim Vendor",
        name: "Scientific Calculator", emoji: "🧮",
        description: "Casio FX-991EX with 552 functions, spreadsheet mode, and QR code feature. Allowed in RUET exams.",
        price: 950, originalPrice: 1100, category: "Stationery", stock: 30,
        images: [], tags: ["calculator", "casio", "exam"],
        rating: 4.8, reviewCount: 45, sold: 120,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
      },
      {
        id: "prod_005", vendorId: "user_002", vendorName: "Karim Vendor",
        name: "Drawing Kit (12pcs)", emoji: "✏️",
        description: "Complete drawing set with pencils HB–4B, eraser, sharpener, scale, compass, and set squares.",
        price: 350, originalPrice: 450, category: "Stationery", stock: 50,
        images: [], tags: ["drawing", "pencil", "geometry"],
        rating: 4.3, reviewCount: 27, sold: 88,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
      },
      {
        id: "prod_006", vendorId: "user_002", vendorName: "Karim Vendor",
        name: "A4 Notebook (200 pages)", emoji: "📓",
        description: "Hard cover spiral notebook, ruled pages, 80gsm paper. Ideal for lecture notes.",
        price: 180, originalPrice: 220, category: "Stationery", stock: 100,
        images: [], tags: ["notebook", "writing", "study"],
        rating: 4.0, reviewCount: 33, sold: 200,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
      },
      // Food
      {
        id: "prod_007", vendorId: "user_002", vendorName: "Karim Vendor",
        name: "Energy Drink Pack (6)", emoji: "⚡",
        description: "Six cans of Tiger Energy Drink 250ml. Keep yourself awake during exam season.",
        price: 420, originalPrice: 480, category: "Food", stock: 40,
        images: [], tags: ["energy drink", "food", "caffeine"],
        rating: 3.9, reviewCount: 14, sold: 55,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
      },
      {
        id: "prod_008", vendorId: "user_002", vendorName: "Karim Vendor",
        name: "Instant Noodles (12 pack)", emoji: "🍜",
        description: "Maggi 2-minute noodles variety pack. Hall room essential for late night study sessions.",
        price: 240, originalPrice: 288, category: "Food", stock: 80,
        images: [], tags: ["noodles", "food", "instant"],
        rating: 4.1, reviewCount: 61, sold: 310,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
      // Clothing
      {
        id: "prod_009", vendorId: "user_002", vendorName: "Karim Vendor",
        name: "RUET Printed T-Shirt", emoji: "👕",
        description: "100% cotton round-neck t-shirt with RUET logo. Available in S, M, L, XL. Show your RUET pride!",
        price: 380, originalPrice: 500, category: "Clothing", stock: 60,
        images: [], tags: ["tshirt", "ruet", "clothing"],
        rating: 4.6, reviewCount: 52, sold: 175,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
      },
      // Lab Supplies
      {
        id: "prod_010", vendorId: "user_002", vendorName: "Karim Vendor",
        name: "Lab Safety Goggles", emoji: "🥽",
        description: "ANSI-rated clear polycarbonate goggles with anti-fog coating. Required for chemistry and physics labs.",
        price: 250, originalPrice: 320, category: "Lab Supplies", stock: 25,
        images: [], tags: ["goggles", "lab", "safety"],
        rating: 4.4, reviewCount: 19, sold: 67,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
      },
      {
        id: "prod_011", vendorId: "user_002", vendorName: "Karim Vendor",
        name: "Soldering Iron Kit", emoji: "🔧",
        description: "60W adjustable temperature soldering iron with stand, solder wire, and tips. For ECE and EEE students.",
        price: 780, originalPrice: 950, category: "Lab Supplies", stock: 12,
        images: [], tags: ["soldering", "electronics", "lab"],
        rating: 4.5, reviewCount: 23, sold: 41,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 11,
      },
      {
        id: "prod_012", vendorId: "user_002", vendorName: "Karim Vendor",
        name: "Graph Paper Pad (50 sheets)", emoji: "📐",
        description: "A3 graph paper with 1mm and 5mm grid. Required for engineering drawing and data plotting.",
        price: 120, originalPrice: 150, category: "Stationery", stock: 75,
        images: [], tags: ["graph paper", "drawing", "engineering"],
        rating: 4.2, reviewCount: 38, sold: 145,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 22,
      },
    ];
    DB.setCollection("ruet_products", products);
  }

  // ── Orders ───────────────────────────────────────────────

  function _seedOrders() {
    const orders = [
      {
        id: "order_001", userId: "user_001", userName: "Rahim Hossain",
        items: [
          { productId: "prod_004", name: "Scientific Calculator", price: 950, qty: 1 },
          { productId: "prod_006", name: "A4 Notebook (200 pages)", price: 180, qty: 2 },
        ],
        total: 1310, status: "delivered",
        shippingAddress: "Hall-1, RUET, Rajshahi", phone: "01711000001",
        paymentMethod: "cash",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
      },
      {
        id: "order_002", userId: "user_001", userName: "Rahim Hossain",
        items: [
          { productId: "prod_009", name: "RUET Printed T-Shirt", price: 380, qty: 2 },
        ],
        total: 760, status: "processing",
        shippingAddress: "Hall-1, RUET, Rajshahi", phone: "01711000001",
        paymentMethod: "cash",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        id: "order_003", userId: "user_003", userName: "Sumaiya Begum",
        items: [
          { productId: "prod_001", name: "Wireless Earbuds", price: 1200, qty: 1 },
          { productId: "prod_005", name: "Drawing Kit (12pcs)", price: 350, qty: 1 },
        ],
        total: 1550, status: "shipped",
        shippingAddress: "Girls Hall, RUET, Rajshahi", phone: "01811000003",
        paymentMethod: "cash",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
      },
    ];
    DB.setCollection("ruet_orders", orders);
  }

  // ── Public API ───────────────────────────────────────────

  return { run, reset };
})();

// Auto-run on script load
Seeder.run();