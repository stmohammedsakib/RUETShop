// ============================================================
// auth.js — Registration, Login, Logout, Session Management
// Roles: "user" (buyer) | "vendor" (seller) | "admin"
// ============================================================

const Auth = (() => {
  const USERS_KEY = "ruet_users";
  const SESSION_KEY = "ruet_session";
  const SESSION_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days
  const LOGIN_ATTEMPTS_KEY = "ruet_login_attempts";
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 1000 * 60 * 15; // 15 minutes

  // ── Helpers ──────────────────────────────────────────────

  function hashPassword(password) {
    // Improved hash: multi-round obfuscation (still not cryptographic — localStorage only).
    const salted = password + "_ruet_salt";
    let hash = btoa(salted);
    // Double-encode for slightly better obfuscation
    hash = btoa(hash + "_v2");
    return hash;
  }

  // Legacy hash for backward compatibility with seed data
  function legacyHash(password) {
    return btoa(password + "_ruet_salt");
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePassword(password) {
    return password && password.length >= 6;
  }

  // ── Rate Limiting ───────────────────────────────────────

  function _getLoginAttempts(email) {
    const data = DB.get(LOGIN_ATTEMPTS_KEY) || {};
    return data[email] || { count: 0, lastAttempt: 0, lockedUntil: 0 };
  }

  function _recordLoginAttempt(email, success) {
    const data = DB.get(LOGIN_ATTEMPTS_KEY) || {};
    if (success) {
      delete data[email];
    } else {
      const current = data[email] || { count: 0, lastAttempt: 0, lockedUntil: 0 };
      current.count++;
      current.lastAttempt = Date.now();
      if (current.count >= MAX_LOGIN_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCKOUT_DURATION;
      }
      data[email] = current;
    }
    DB.set(LOGIN_ATTEMPTS_KEY, data);
  }

  function _isLockedOut(email) {
    const attempts = _getLoginAttempts(email);
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const mins = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
      return { locked: true, minutes: mins };
    }
    // Reset if lockout expired
    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      const data = DB.get(LOGIN_ATTEMPTS_KEY) || {};
      delete data[email];
      DB.set(LOGIN_ATTEMPTS_KEY, data);
    }
    return { locked: false };
  }

  // ── Registration ─────────────────────────────────────────

  function register({ name, email, password, role = "user", phone = "", studentId = "" }) {
    if (!name || !name.trim()) return { ok: false, error: "Name is required." };
    if (name.trim().length < 3) return { ok: false, error: "Name must be at least 3 characters." };
    if (!validateEmail(email)) return { ok: false, error: "Invalid email address." };
    if (!validatePassword(password)) return { ok: false, error: "Password must be at least 6 characters." };
    // Bug #5: Prevent admin registration via public form
    if (!["user", "vendor"].includes(role)) return { ok: false, error: "Invalid role." };

    const exists = DB.exists(USERS_KEY, (u) => u.email === email.toLowerCase());
    if (exists) return { ok: false, error: "Email already registered." };

    const user = DB.insertOne(USERS_KEY, {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashPassword(password),
      role,
      avatar: "",
      phone: phone || "",
      address: "",
      studentId: studentId || "",
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

    // Bug #76: Rate limiting
    const lockStatus = _isLockedOut(email.toLowerCase());
    if (lockStatus.locked) {
      return { ok: false, error: `Too many login attempts. Try again in ${lockStatus.minutes} minute(s).` };
    }

    const user = DB.findOneWhere(USERS_KEY, (u) => u.email === email.toLowerCase());
    if (!user) {
      _recordLoginAttempt(email.toLowerCase(), false);
      return { ok: false, error: "No account found with this email." };
    }

    // Check both new and legacy hash for compatibility
    const newHash = hashPassword(password);
    const oldHash = legacyHash(password);
    if (user.password !== newHash && user.password !== oldHash) {
      _recordLoginAttempt(email.toLowerCase(), false);
      return { ok: false, error: "Incorrect password." };
    }

    // Upgrade legacy hash to new hash on successful login
    if (user.password === oldHash && user.password !== newHash) {
      DB.updateById(USERS_KEY, user.id, { password: newHash });
    }

    _recordLoginAttempt(email.toLowerCase(), true);
    const safeUser = _safe(user);
    _createSession(safeUser);
    return { ok: true, user: safeUser };
  }

  // ── Guest Login ─────────────────────────────────────────

  function loginAsGuest() {
    const guestUser = {
      id: "guest_" + Date.now(),
      name: "Guest User",
      email: "guest@ruet.ac.bd",
      role: "user",
      isGuest: true,
    };
    _createSession(guestUser);
    return { ok: true, user: guestUser };
  }

  // ── Logout ───────────────────────────────────────────────

  function logout() {
    DB.remove(SESSION_KEY);
    return { ok: true };
  }

  // ── Session ──────────────────────────────────────────────

  function _createSession(safeUser) {
    // Bug #6: Add session expiry
    DB.set(SESSION_KEY, {
      ...safeUser,
      loginAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION,
    });
  }

  function getSession() {
    const session = DB.get(SESSION_KEY);
    if (!session) return null;
    // Bug #6: Check session expiry
    if (session.expiresAt && Date.now() > session.expiresAt) {
      DB.remove(SESSION_KEY);
      return null;
    }
    return session;
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

  function isGuest() {
    const s = getSession();
    return s && s.isGuest === true;
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

    // Check both hash formats
    const oldNewHash = hashPassword(oldPassword);
    const oldLegacyHash = legacyHash(oldPassword);
    if (user.password !== oldNewHash && user.password !== oldLegacyHash) {
      return { ok: false, error: "Old password is incorrect." };
    }
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

  function requireAdmin(redirectTo = "index.html") {
    if (!isAdmin()) {
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

  return {
    register,
    login,
    loginAsGuest,
    logout,
    getSession,
    isLoggedIn,
    isVendor,
    isUser,
    isAdmin,
    isGuest,
    updateProfile,
    changePassword,
    findUserByEmail,
    resetPassword,
    requireLogin,
    requireVendor,
    requireAdmin,
    redirectIfLoggedIn,
    hashPassword,
    legacyHash,
  };
})();
