<div align="center">

<img src="assets/icons/logo.png" alt="RUET Online Shop Logo" width="80" height="80" />

# 🛒 RUET Online Shop

**A full-featured campus e-commerce marketplace for students and vendors of Rajshahi University of Engineering & Technology.**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![No Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)]()
[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-blue?style=flat-square&logo=github)](https://your-username.github.io/ruet-online-shop/)

[📖 View Full Docs](https://your-username.github.io/ruet-online-shop/) · [🐛 Report Bug](https://github.com/your-username/ruet-online-shop/issues) · [✨ Request Feature](https://github.com/your-username/ruet-online-shop/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Pages](#-pages)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Demo Credentials](#-demo-credentials)
- [Tech Stack](#-tech-stack)
- [Creator](#-creator)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Overview

RUET Online Shop is a **zero-backend, client-side** campus marketplace. All data is persisted in the browser via `localStorage` through a custom MongoDB-style `DB` abstraction layer. The app supports **three user roles** — Buyer, Vendor, and Admin — each with dedicated dashboards and scoped permissions.

> **No build tools. No server. No npm.** Just open `index.html` in a browser and it works.

---

## ✨ Features

<details>
<summary><b>🛍️ Shopping Catalog</b></summary>

- Browse products in **grid or list view**
- Filter by category, price range, rating, and in-stock availability
- Sort by price (low/high), rating, or newest
- Full-text search across name, description, category, and tags
- Paginated product listing (12 per page)
- Product detail page with emoji gallery, discount badge, stock indicator, and related products

</details>

<details>
<summary><b>🛒 Cart & Checkout</b></summary>

- Per-user cart persisted in `localStorage`; guest cart merges automatically on login
- Quantity controls with real-time stock validation
- Free delivery on orders ৳1,000+
- Coupon code input (hook ready for extension)
- Multi-step checkout modal: **Delivery Info → Payment → Confirmation**
- Payment options: **bKash**, **Nagad**, **Cash on Delivery**
- Stock auto-decrements on order placement and restores on cancellation

</details>

<details>
<summary><b>👤 Authentication</b></summary>

- Register as Buyer or Vendor
- Login with email and password (passwords obfuscated via `btoa`)
- Guest login with automatic session creation
- 3-step forgot password flow: find account → verify identity → reset password
- Password visibility toggle on all password fields
- Role-based redirects after login/logout

</details>

<details>
<summary><b>❤️ Wishlist</b></summary>

- Add and remove products per user
- Move a single item or the entire wishlist to cart
- Live badge count synced in the navbar

</details>

<details>
<summary><b>📊 User Dashboard</b></summary>

- Overview with stats (orders placed, total spent, wishlist count, products listed)
- Full order history with status badges
- Wishlist management panel
- Profile editor (name, phone, student ID, bio, password change)
- **Vendor-only:** Product management — add, edit, and delete listings

</details>

<details>
<summary><b>⭐ Reviews & Ratings</b></summary>

- Interactive star picker (1–5) with hover preview
- One review per user per product (resubmitting updates the existing review)
- Product average rating and review count auto-recalculate on each submission
- Reviews displayed with user avatar initial, date, and comment

</details>

<details>
<summary><b>🛡️ Admin Panel</b></summary>

- Platform-wide stats: total users, products, orders, and revenue
- User management: search users, filter by role, change roles via modal
- Product management: view all products across vendors, delete any listing
- Order management: update any order's status through the full lifecycle
- System panel: one-click data reset, `localStorage` usage info, demo credentials display

</details>

<details>
<summary><b>🎨 UI / UX</b></summary>

- Light/Dark theme toggle — persisted in `localStorage`, respects OS `prefers-color-scheme`
- Fully responsive layout (mobile, tablet, desktop)
- Sticky sidebar for dashboard and admin panels
- Hamburger menu on mobile; floating filter FAB on the products page
- Toast notifications for all user actions (success, error, warning, info)
- Skeleton screen placeholders while content loads
- Animated hero counter (count-up on page load)
- CSS custom properties (design tokens) for consistent theming

</details>

---

## 📄 Pages

| File | URL | Description |
|------|-----|-------------|
| `index.html` | `/` | Home — hero, categories, featured & new arrivals |
| `products.html` | `/products.html` | Full catalog with sidebar filters, sort, pagination |
| `product-detail.html` | `/product-detail.html?id=` | Gallery, tabs (description / reviews / vendor), related products |
| `cart.html` | `/cart.html` | Cart items, order summary, multi-step checkout |
| `auth.html` | `/auth.html` | Login, register, forgot password |
| `dashboard.html` | `/dashboard.html` | Buyer/vendor dashboard — orders, wishlist, products, profile |
| `admin.html` | `/admin.html` | Admin-only management panel |

---

## 📁 Project Structure

```
ruet-online-shop/
│
├── index.html
├── products.html
├── product-detail.html
├── cart.html
├── auth.html
├── dashboard.html
├── admin.html
│
├── css/
│   ├── style.css             # Global reset, CSS variables, base typography
│   ├── components.css        # Modals, toasts, tables, badges, pagination, FAB
│   ├── navbar.css            # Navbar, search bar, dropdown, mobile menu
│   ├── home.css              # Hero, floating cards, category grid, promo banner
│   ├── products.css          # Product listing, filter sidebar, active filter tags
│   ├── product-detail.css    # Gallery, info panel, qty control, reviews, vendor card
│   ├── cart.css              # Cart items, order summary, checkout stepper
│   ├── dashboard.css         # Sidebar, stat cards, order cards, profile form
│   ├── admin.css             # Admin overrides, stat cards, system panel, role badges
│   └── auth.css              # Split-panel login/register, role selector, forgot password
│
├── js/
│   ├── core/
│   │   ├── db.js             # localStorage CRUD abstraction
│   │   ├── seed.js           # One-time data seeder
│   │   ├── auth.js           # Register, login, session, route guards
│   │   └── utils.js          # formatPrice, formatDate, debounce, validators
│   │
│   ├── ui/
│   │   ├── theme.js          # Light/dark toggle + persistence
│   │   ├── toast.js          # Toast notification system
│   │   ├── modal.js          # Modal open/close, focus trap
│   │   ├── navbar.js         # Badges, search binding, hamburger
│   │   └── loader.js         # Spinner, skeleton cards, button loading
│   │
│   ├── features/
│   │   ├── products.js       # CRUD, search, filter, sort, paginate, stock
│   │   ├── cart.js           # Cart ops, guest cart merge, summary calc
│   │   ├── wishlist.js       # Wishlist toggle, move to cart, count
│   │   ├── orders.js         # Checkout, history, cancellation, stock restore
│   │   └── ratings.js        # Review submit, recalculation, star HTML
│   │
│   └── pages/
│       ├── home.js
│       ├── products-page.js
│       ├── product-detail.js
│       ├── cart-page.js
│       ├── auth-page.js
│       ├── dashboard-page.js
│       └── admin-page.js
│
└── assets/
    ├── icons/
    │   └── logo.png
    └── images/
        └── placeholder.svg
```

---

## 🏗️ Architecture

### Data Layer — `DB`

A singleton IIFE wrapping `localStorage` with a MongoDB-style collection API. Every module reads and writes exclusively through `DB` — nothing touches `localStorage` directly.

```js
DB.insertOne("ruet_products", { name: "Notebook", price: 180 });
DB.findWhere("ruet_orders", o => o.userId === session.id);
DB.updateById("ruet_users", userId, { role: "vendor" });
DB.deleteById("ruet_products", productId);
```

Collections are stored as JSON arrays under named keys (`ruet_users`, `ruet_products`, `ruet_orders`, `ruet_reviews`). Each document receives an auto-generated `id` (`timestamp_randombase36`) and a `createdAt` timestamp on insert.

### Auth Layer — `Auth`

A singleton IIFE handling registration, login, session management, and role-based route guards. The active session is stored under `ruet_session`, stripped of the password field.

```js
Auth.register({ name, email, password, role });  // "user" | "vendor" | "admin"
Auth.login({ email, password });
Auth.getSession();     // returns current safe user object or null
Auth.isAdmin();        // boolean role checks — isUser(), isVendor(), isAdmin()
Auth.requireLogin();   // redirects to auth.html if no session
Auth.requireAdmin();   // redirects to index.html if not admin
```

### Feature Modules

Each feature (`Cart`, `Wishlist`, `Orders`, `Products`, `Ratings`) is a self-contained IIFE. Modules fire browser `CustomEvent`s for cross-module updates (e.g. `cart:updated`, `wishlist:updated`) which `Navbar` listens to — keeping badges in sync without tight coupling.

### Script Load Order

Every HTML page loads scripts in this exact dependency order:

```
db.js → seed.js → auth.js → utils.js
  → theme.js → toast.js → modal.js → navbar.js → loader.js
    → ratings.js → products.js → cart.js → wishlist.js → orders.js
      → [page-specific].js
```

---

## 🚀 Getting Started

No build tools or server required.

### Option 1 — Open directly

```bash
git clone https://github.com/your-username/ruet-online-shop.git
cd ruet-online-shop
open index.html        # macOS
# or double-click index.html on Windows/Linux
```

### Option 2 — Local server (recommended)

**VS Code Live Server:**
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → **Open with Live Server**

**Python:**
```bash
python -m http.server 8000
# Visit http://localhost:8000
```

**Node.js:**
```bash
npx serve .
# Visit http://localhost:3000
```

> **Note:** All data lives in your browser's `localStorage`. Clearing site data in DevTools will reset the app to its seeded state, as will clicking **Reset All Data** in the Admin Panel.

---

## 🔑 Demo Credentials

The app ships with pre-seeded demo accounts. Use any of the following or register a new account from the auth page.

| Role | Email | Password |
|------|-------|----------|
| 🔴 Admin | tanvir@ruet.ac.bd | `admin123` |
| 🔴 Admin | nusrat@ruet.ac.bd | `admin123` |
| 🔴 Admin | fahim@ruet.ac.bd | `admin123` |
| 🟢 Vendor | karim@ruet.ac.bd | `123456` |
| 🔵 Buyer | rahim@ruet.ac.bd | `123456` |

> These credentials are also shown in the Admin Panel under **System → Admin Credentials**.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic page structure |
| **CSS3** | Custom properties (design tokens), keyframe animations, responsive layout |
| **Vanilla JavaScript (ES6+)** | All interactivity, state management, DOM rendering |
| **localStorage** | Client-side data persistence (zero backend) |
| **Google Fonts** | Syne (display headings) + DM Sans (body text) |
| **Font Awesome 6** | Icons throughout the UI |

> ⚡ Zero npm packages · Zero build steps · Zero external APIs

---

## 👨‍💻 Creator

<div align="center">

<img src="https://avatars.githubusercontent.com/your-username" alt="Creator" width="100" height="100" style="border-radius: 50%;" />

### Your Name Here

**B.Sc. in Computer Science & Engineering · RUET**

*A passionate developer and RUET student building tools that make campus life easier.*

[![GitHub](https://img.shields.io/badge/GitHub-your--username-181717?style=flat-square&logo=github)](https://github.com/your-username)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-your--name-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/your-username)
[![Email](https://img.shields.io/badge/Email-your.email%40ruet.ac.bd-EA4335?style=flat-square&logo=gmail)](mailto:your.email@ruet.ac.bd)

</div>

---

## 🤝 Contributing

Contributions are welcome! For larger changes, please open an issue first to discuss the approach.

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes
   ```bash
   git commit -m "feat: describe your change"
   ```
4. **Push** and open a Pull Request
   ```bash
   git push origin feature/your-feature-name
   ```

Please keep PRs focused with a clear description of what changed and why.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ for the **RUET** campus community

[🔝 Back to top](#-ruet-online-shop)

</div>
