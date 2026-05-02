// ============================================================
// auth.js — Registration, Login, Logout, Session Management
// Roles: "user" (buyer) | "vendor" (seller)
// ============================================================

const Auth = (() => {
  const USERS_KEY = "ruet_users";
  const SESSION_KEY = "ruet_session";

  // ── Helpers ──────────────────────────────────────────────

  function hashPassword(password) {
    // Simple reversible obfuscation (not cryptographic — localStorage only).
    return btoa(password + "_ruet_salt");
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePassword(password) {
    return password && password.length >= 6;
  }

  // ── Registration ─────────────────────────────────────────

  function register({ name, email, password, role = "user" }) {
    if (!name || !name.trim()) return { ok: false, error: "Name is required." };
    if (!validateEmail(email)) return { ok: false, error: "Invalid email address." };
    if (!validatePassword(password)) return { ok: false, error: "Password must be at least 6 characters." };
    if (!["user", "vendor", "admin"].includes(role)) return { ok: false, error: "Invalid role." };

    const exists = DB.exists(USERS_KEY, (u) => u.email === email.toLowerCase());
    if (exists) return { ok: false, error: "Email already registered." };

    const user = DB.insertOne(USERS_KEY, {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashPassword(password),
      role,
      avatar: "",
      phone: "",
      address: "",
    });

    const safeUser = _safe(user);
    _createSession(safeUser);
    return { ok: true, user: safeUser };
  }

  // ── Login ────────────────────────────────────────────────

  function login(credentials) {
    // Handle both object and direct params
    let email, password;
    if (typeof credentials === 'object') {
      email = credentials.email;
      password = credentials.password;
    } else {
      email = credentials;
      password = arguments[1];
    }

    if (!validateEmail(email)) return { ok: false, error: "Invalid email address." };
    if (!password) return { ok: false, error: "Password is required." };

    const user = DB.findOneWhere(USERS_KEY, (u) => u.email === email.toLowerCase());
    if (!user) return { ok: false, error: "No account found with this email." };
    if (user.password !== hashPassword(password)) return { ok: false, error: "Incorrect password." };

    const safeUser = _safe(user);
    _createSession(safeUser);
    return { ok: true, user: safeUser };
  }

  // ── Logout ───────────────────────────────────────────────

  function logout() {
    DB.remove(SESSION_KEY);
    return { ok: true };
  }
  // ── Session ──────────────────────────────────────────────

  function _createSession(safeUser) {
    DB.set(SESSION_KEY, { ...safeUser, loginAt: Date.now() });
  }

  function getSession() {
    return DB.get(SESSION_KEY);
  }

  function isLoggedIn() {
    return !!getSession();
  }

  function isVendor() {
    const s = getSession();
    return s && s.role === "vendor";
  }

  function isUser() {
    const s = getSession();
    return s && s.role === "user";
  }

  function isAdmin() {
    const s = getSession();
    return s && s.role === "admin";
  }

  // ── Profile Update ───────────────────────────────────────

  function updateProfile(updates) {
    const session = getSession();
    if (!session) return { ok: false, error: "Not logged in." };

    const allowed = ["name", "phone", "address", "avatar", "studentId", "bio"];
    const clean = {};
    allowed.forEach((k) => {
      if (updates[k] !== undefined) clean[k] = updates[k];
    });

    // Handle password update separately if provided
    if (updates.password && updates.password.length >= 6) {
      clean.password = hashPassword(updates.password);
    }

    const updated = DB.updateById(USERS_KEY, session.id, clean);
    if (!updated) return { ok: false, error: "User not found." };

    const safeUser = _safe(updated);
    _createSession(safeUser);
    return { ok: true, user: safeUser };
  }

  function changePassword({ oldPassword, newPassword }) {
    const session = getSession();
    if (!session) return { ok: false, error: "Not logged in." };

    const user = DB.findById(USERS_KEY, session.id);
    if (!user) return { ok: false, error: "User not found." };
    if (user.password !== hashPassword(oldPassword)) return { ok: false, error: "Old password is incorrect." };
    if (!validatePassword(newPassword)) return { ok: false, error: "New password must be at least 6 characters." };

    DB.updateById(USERS_KEY, session.id, { password: hashPassword(newPassword) });
    return { ok: true };
}

  // ── Reset Password (Forgot Flow) ─────────────────────────

  function findUserByEmail(email) {
    if (!validateEmail(email)) return null;
    const user = DB.findOneWhere(USERS_KEY, (u) => u.email === email.toLowerCase());
    return user ? _safe(user) : null;
  }

  function resetPassword(email, newPassword) {
    if (!validateEmail(email)) return { ok: false, error: "Invalid email address." };
    if (!validatePassword(newPassword)) return { ok: false, error: "New password must be at least 6 characters." };

    const user = DB.findOneWhere(USERS_KEY, (u) => u.email === email.toLowerCase());
    if (!user) return { ok: false, error: "No account found with this email." };

    DB.updateById(USERS_KEY, user.id, { password: hashPassword(newPassword) });
    return { ok: true };
  }

  // ── Guards ───────────────────────────────────────────────

  function requireLogin(redirectTo = "auth.html") {
    if (!isLoggedIn()) {
      window.location.href = redirectTo;
    }
  }

  function requireVendor(redirectTo = "index.html") {
    if (!isVendor()) {
      window.location.href = redirectTo;
    }
  }

  function redirectIfLoggedIn(redirectTo = "index.html") {
    if (isLoggedIn()) {
      window.location.href = redirectTo;
    }
  }

  // ── Internal ─────────────────────────────────────────────

  function _safe(user) {
    const { password, ...safe } = user;
    return safe;
  }

  // ── Public API ───────────────────────────────────────────

  function requireAdmin(redirectTo = "index.html") {
    if (!isAdmin()) {
      window.location.href = redirectTo;
    }
  }

  return {
    register,
    login,
    logout,
    getSession,
    isLoggedIn,
    isVendor,
    isUser,
    isAdmin,
    updateProfile,
    changePassword,
    findUserByEmail,
    resetPassword,
    requireLogin,
    requireVendor,
    requireAdmin,
    redirectIfLoggedIn,
  };
})();