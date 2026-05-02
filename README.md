# 🛒 RUET Online Shop

A full-featured campus e-commerce marketplace built for students and vendors of Rajshahi University of Engineering & Technology (RUET). Buy, sell, and connect — all within your campus community.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Pages](#pages)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Demo Credentials](#demo-credentials)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

RUET Online Shop is a **zero-backend, client-side** campus marketplace. All data is persisted in the browser via `localStorage` through a custom database abstraction layer (`DB`). The app supports three user roles — **Buyer**, **Vendor**, and **Admin** — each with dedicated dashboards and permissions. No build tools, no server, no npm — just open `index.html` in a browser and it works.

---

## Features

### 🛍️ Shopping
- Browse products in grid or list view
- Filter by category, price range, rating, and in-stock availability
- Sort by price (low/high), rating, or newest
- Full-text search across product name, description, category, and tags
- Paginated product listing (12 per page)
- Product detail page with emoji gallery, discount badge, stock indicator, and related products

### 🛒 Cart & Checkout
- Per-user cart persisted in `localStorage`; guest cart merges automatically on login
- Quantity controls with real-time stock validation
- Free delivery on orders ৳1,000+
- Coupon code input (hook ready for extension)
- Multi-step checkout modal: Delivery Info → Payment → Confirmation
- Payment options: bKash, Nagad, Cash on Delivery
- Stock is automatically decremented on order placement and restored on cancellation

### 👤 Authentication
- Register as Buyer or Vendor
- Login with email and password (passwords obfuscated via `btoa`)
- Guest login with automatic session creation
- 3-step forgot password flow: find account → verify identity → reset password
- Password visibility toggle on all password fields
- Role-based redirects after login/logout

### ❤️ Wishlist
- Add and remove products per user
- Move a single item or the entire wishlist to cart
- Live badge count in the navbar

### 📊 User Dashboard
- Overview with stats (orders placed, total spent, wishlist count, products listed)
- Full order history with status badges
- Wishlist management panel
- Profile editor (name, phone, student ID, bio, password change)
- **Vendor-only:** Product management — add, edit, and delete listings (name, category, price, original price, stock, emoji, image URL, tags)

### ⭐ Reviews & Ratings
- Interactive star picker (1–5) with hover preview
- One review per user per product (submitting again updates the existing review)
- Product average rating and review count auto-recalculate on each submission
- Reviews displayed with user avatar initial, date, and comment

### 🛡️ Admin Panel
- Platform-wide stats: total users, products, orders, and revenue
- User management: search users, filter by role (Buyer / Vendor / Admin), change roles via modal
- Product management: view all products across all vendors, delete any listing
- Order management: update any order's status through the full lifecycle
- System panel: one-click data reset to seed state, `localStorage` usage info, demo credentials display

### 🎨 UI/UX
- Light/Dark theme toggle — persisted in `localStorage`, respects OS `prefers-color-scheme` if no preference is saved
- Fully responsive layout (mobile, tablet, desktop)
- Sticky dashboard and admin sidebars
- Hamburger menu on mobile; floating filter FAB on the products page
- Toast notifications for all user actions (success, error, warning, info)
- Skeleton screen placeholders while content loads
- Animated hero counter (count-up on page load)
- Floating product category cards in the hero section
- CSS custom properties (design tokens) for consistent theming across all pages

---

## Pages

| File | URL | Description |
|---|---|---|
| `index.html` | `/` | Home — hero, categories, featured & new arrivals |
| `products.html` | `/products.html` | Full catalog with sidebar filters, sort, pagination |
| `product-detail.html` | `/product-detail.html?id=` | Single product — gallery, tabs (description / reviews / vendor), related products |
| `cart.html` | `/cart.html` | Cart items, order summary, multi-step checkout |
| `auth.html` | `/auth.html` | Login, register, forgot password |
| `dashboard.html` | `/dashboard.html` | Buyer/vendor dashboard — orders, wishlist, products, profile |
| `admin.html` | `/admin.html` | Admin-only management panel |

---

## Project Structure

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
│   ├── style.css             # Global reset, CSS variables (design tokens), base typography
│   ├── components.css        # Modals, toasts, data tables, status badges, pagination, FAB
│   ├── navbar.css            # Navbar, search bar, user dropdown, mobile menu
│   ├── home.css              # Hero, floating cards, category grid, promo banner
│   ├── products.css          # Product listing layout, filter sidebar, active filter tags
│   ├── product-detail.css    # Gallery, info panel, qty control, reviews, vendor card
│   ├── cart.css              # Cart items, order summary, checkout stepper, payment options
│   ├── dashboard.css         # Sidebar, stat cards, order cards, profile form, quick actions
│   ├── admin.css             # Admin overrides, stat cards, system panel, role badges
│   └── auth.css              # Split-panel login/register layout, role selector, forgot password
│
├── js/
│   ├── core/
│   │   ├── db.js             # localStorage abstraction — CRUD, collection helpers, ID generation
│   │   ├── seed.js           # One-time data seeder — users, products, and orders
│   │   ├── auth.js           # Register, login, logout, session, profile update, password reset
│   │   └── utils.js          # formatPrice, formatDate, debounce, escapeHtml, validators
│   │
│   ├── ui/
│   │   ├── theme.js          # Light/dark toggle, OS preference detection, persistence
│   │   ├── toast.js          # Toast notification system (success / error / warning / info)
│   │   ├── modal.js          # Modal open/close, focus trap, dynamic modal creation, confirm dialog
│   │   ├── navbar.js         # User section update, cart/wishlist badges, search binding, hamburger
│   │   └── loader.js         # Page overlay spinner, skeleton cards, button loading state
│   │
│   ├── features/
│   │   ├── products.js       # Product CRUD, search, filter, sort, paginate, stock management
│   │   ├── cart.js           # Cart read/write, add/update/remove, guest cart merge, summary calc
│   │   ├── wishlist.js       # Wishlist toggle/add/remove, move to cart, count
│   │   ├── orders.js         # Checkout, order history, status updates, cancellation, stock restore
│   │   └── ratings.js        # Review submit, per-product retrieval, rating recalculation, star HTML
│   │
│   └── pages/
│       ├── home.js           # Category grid, featured/new arrivals rendering, hero counter animation
│       ├── products-page.js  # Filter state machine, URL param sync, category/price/rating/sort/search
│       ├── product-detail.js # Product load, gallery, qty control, tab switching, review submission
│       ├── cart-page.js      # Cart rendering, qty updates, multi-step checkout flow
│       ├── auth-page.js      # Login/register forms, validation, 3-step forgot password flow
│       ├── dashboard-page.js # Buyer/vendor tabs, product CRUD modal, order list, profile save
│       └── admin-page.js     # Admin tabs, user/product/order tables, role modal, system panel
│
└── assets/
    ├── icons/
    │   └── logo.png
    └── images/
        └── placeholder.svg
```

---

## Architecture

### Data Layer — `DB`
A singleton IIFE that wraps `localStorage` with a MongoDB-like collection API. Every module reads and writes exclusively through `DB` — nothing touches `localStorage` directly.

```js
DB.insertOne("ruet_products", { name: "Notebook", price: 180 });
DB.findWhere("ruet_orders", o => o.userId === session.id);
DB.updateById("ruet_users", userId, { role: "vendor" });
DB.deleteById("ruet_products", productId);
```

Collections are stored as JSON arrays under named keys (`ruet_users`, `ruet_products`, `ruet_orders`, `ruet_reviews`). Each document receives an auto-generated `id` (`timestamp_randombase36`) and a `createdAt` timestamp on insert.

### Auth Layer — `Auth`
A singleton IIFE handling registration, login, session management, and role-based route guards. The active session is stored under `ruet_session` and stripped of the password field before storage.

```js
Auth.register({ name, email, password, role });   // "user" | "vendor" | "admin"
Auth.login({ email, password });
Auth.getSession();     // returns current safe user object or null
Auth.isAdmin();        // boolean role checks — isUser(), isVendor(), isAdmin()
Auth.requireLogin();   // redirects to auth.html if no session
Auth.requireAdmin();   // redirects to index.html if not admin
```

Passwords are obfuscated with `btoa(password + "_ruet_salt")` — appropriate for a `localStorage`-only demo environment.

### Feature Modules
Each feature (`Cart`, `Wishlist`, `Orders`, `Products`, `Ratings`) is a self-contained IIFE. Modules fire browser `CustomEvent`s for cross-module updates — for example, `cart:updated` and `wishlist:updated` — which the `Navbar` module listens to in order to keep badges in sync without tight coupling.

### Seeder — `Seeder`
Runs automatically on first page load, guarded by the `ruet_seeded_v2` key. Populates 3 admin accounts, 2 regular users/vendors, 12 products across 5 categories, and 3 seed orders. The Admin panel's **Reset All Data** button calls `Seeder.reset()` to wipe `localStorage` and re-run the seeder.

### Script Load Order
Every HTML page loads scripts in this exact dependency order:

```
db.js → seed.js → auth.js → utils.js
  → theme.js → toast.js → modal.js → navbar.js → loader.js
    → ratings.js → products.js → cart.js → wishlist.js → orders.js
      → [page-specific].js
```

---

## Getting Started

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

## Demo Credentials

The app ships with pre-seeded demo accounts. Use any of the following or register a new account from the auth page.

| Role | Email | Password |
|---|---|---|
| Admin | tanvir@ruet.ac.bd | admin123 |
| Admin | nusrat@ruet.ac.bd | admin123 |
| Admin | fahim@ruet.ac.bd | admin123 |
| Vendor | karim@ruet.ac.bd | 123456 |
| Buyer | rahim@ruet.ac.bd | 123456 |

These credentials are also shown in the Admin Panel under **System → Admin Credentials**.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic page structure |
| CSS3 | Styling, CSS custom properties (design tokens), keyframe animations |
| Vanilla JavaScript (ES6+) | All interactivity, state management, DOM rendering |
| `localStorage` | Client-side data persistence (zero backend) |
| Google Fonts | Syne (display headings) + DM Sans (body text) |
| Font Awesome 6 | Icons throughout the UI |

Zero npm packages. Zero build steps. Zero external APIs.

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes
   ```bash
   git commit -m "feat: describe your change"
   ```
4. Push and open a Pull Request
   ```bash
   git push origin feature/your-feature-name
   ```

Please keep PRs focused with a clear description of what changed and why. For larger changes, open an issue first to discuss the approach.

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  Made with ❤️ for the RUET campus community
</div>
