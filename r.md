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

> ⚠️ **Note:** All data lives in your browser's `localStorage`. Clearing site data in DevTools will reset the app to its seeded state, as will clicking **Reset All Data** in the Admin Panel.

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

<img src="https://avatars.githubusercontent.com/your-username" alt="Creator" width="100" style="border-radius:50%;" />

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
