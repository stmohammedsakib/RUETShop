// js/pages/auth-page.js

const AuthPage = (() => {
  let activeTab = "login";

  function switchTab(tab) {
    activeTab = tab;
    
    // Update tab buttons
    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");
    
    if (tab === "login") {
      loginTab?.classList.add("active");
      registerTab?.classList.remove("active");
      document.getElementById("loginForm")?.classList.remove("hidden");
      document.getElementById("registerForm")?.classList.add("hidden");
    } else {
      registerTab?.classList.add("active");
      loginTab?.classList.remove("active");
      document.getElementById("registerForm")?.classList.remove("hidden");
      document.getElementById("loginForm")?.classList.add("hidden");
    }
  }

  function validateLogin() {
    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;
    
    if (!email) { Toast.warning("Email is required"); return false; }
    if (!email.includes("@")) { Toast.warning("Enter valid email"); return false; }
    if (!password) { Toast.warning("Password required"); return false; }
    return true;
  }

  function validateRegister() {
    const name = document.getElementById("regName")?.value.trim();
    const email = document.getElementById("regEmail")?.value.trim();
    const password = document.getElementById("regPassword")?.value;
    const confirm = document.getElementById("regConfirm")?.value;
    const agreeTerms = document.getElementById("agreeTerms")?.checked;
    
    if (!name || name.length < 3) { Toast.warning("Name must be at least 3 characters"); return false; }
    if (!email || !email.includes("@")) { Toast.warning("Valid email required"); return false; }
    if (!password || password.length < 6) { Toast.warning("Password must be 6+ characters"); return false; }
    if (password !== confirm) { Toast.warning("Passwords don't match"); return false; }
    if (!agreeTerms) { Toast.warning("Please agree to Terms & Conditions"); return false; }
    return true;
  }

  function handleLogin() {
    if (!validateLogin()) return;
    
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const btn = document.getElementById("loginBtn");
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in...';
    
    // Simulate async
    setTimeout(() => {
      const result = Auth.login({ email, password });
      btn.disabled = false;
      btn.innerHTML = '<span>Sign In</span> <i class="fas fa-arrow-right"></i>';
      
      if (result.ok) {
        Toast.success(`Welcome ${result.user.name}!`);
        // Merge guest cart
        Cart.mergeGuestCart();
        setTimeout(() => {
          window.location.href = result.user.role === "vendor" ? "dashboard.html" : "index.html";
        }, 800);
      } else {
        Toast.error(result.error || "Login failed");
      }
    }, 500);
  }

  function handleRegister() {
    if (!validateRegister()) return;
    
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const roleRadio = document.querySelector('input[name="role"]:checked');
    const role = roleRadio.value === "vendor" ? "vendor" : "user";
    const btn = document.getElementById("registerBtn");
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating account...';
    
    setTimeout(() => {
      const result = Auth.register({ name, email, password, role });
      btn.disabled = false;
      btn.innerHTML = '<span>Create Account</span> <i class="fas fa-arrow-right"></i>';
      
      if (result.ok) {
        Toast.success(`Welcome ${result.user.name}!`);
        Cart.mergeGuestCart();
        setTimeout(() => {
          window.location.href = result.user.role === "vendor" ? "dashboard.html" : "index.html";
        }, 800);
      } else {
        Toast.error(result.error || "Registration failed");
      }
    }, 500);
  }

  function handleGuestLogin() {
    // Create guest session
    const guestUser = {
      id: "guest_" + Date.now(),
      name: "Guest User",
      email: "guest@ruet.ac.bd",
      role: "user",
      isGuest: true
    };
    // Store in session
    localStorage.setItem("ruet_session", JSON.stringify(guestUser));
    Toast.success("Continuing as guest");
    setTimeout(() => window.location.href = "index.html", 500);
  }

  function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input?.parentElement?.querySelector(".eye-btn i");
    if (input && icon) {
      const type = input.type === "password" ? "text" : "password";
      input.type = type;
      icon.classList.toggle("fa-eye");
      icon.classList.toggle("fa-eye-slash");
    }
  }

  // ── Forgot Password Flow ──────────────────────────────────

  let forgotEmail = "";

  function showForgotPassword() {
    forgotEmail = "";
    const modal = document.getElementById("forgotModal");
    // Reset to step 1
    document.getElementById("forgotStep1")?.classList.remove("hidden");
    document.getElementById("forgotStep2")?.classList.add("hidden");
    document.getElementById("forgotStep3")?.classList.add("hidden");
    document.getElementById("forgotModalTitle").textContent = "🔑 Forgot Password";
    // Clear inputs
    const emailInput = document.getElementById("forgotEmail");
    if (emailInput) emailInput.value = "";
    const newPass = document.getElementById("forgotNewPass");
    if (newPass) newPass.value = "";
    const confirmPass = document.getElementById("forgotConfirmPass");
    if (confirmPass) confirmPass.value = "";
    // Show modal
    modal?.classList.remove("hidden");
  }

  function closeForgotPassword() {
    document.getElementById("forgotModal")?.classList.add("hidden");
  }

  function handleForgotFind() {
    const email = document.getElementById("forgotEmail")?.value.trim();
    if (!email) { Toast.warning("Please enter your email address"); return; }
    if (!email.includes("@")) { Toast.warning("Enter a valid email address"); return; }

    const btn = document.getElementById("forgotFindBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span> Searching...';

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<span>Find Account</span> <i class="fas fa-search"></i>';

      const user = Auth.findUserByEmail(email);
      if (!user) {
        Toast.error("No account found with this email");
        return;
      }

      forgotEmail = email;

      // Populate step 2
      document.getElementById("forgotUserName").textContent = user.name;
      document.getElementById("forgotUserEmail").textContent = user.email;

      // Move to step 2
      document.getElementById("forgotStep1")?.classList.add("hidden");
      document.getElementById("forgotStep2")?.classList.remove("hidden");
      document.getElementById("forgotModalTitle").textContent = "🔍 Verify Account";
    }, 600);
  }

  function forgotGoBack() {
    document.getElementById("forgotStep2")?.classList.add("hidden");
    document.getElementById("forgotStep3")?.classList.add("hidden");
    document.getElementById("forgotStep1")?.classList.remove("hidden");
    document.getElementById("forgotModalTitle").textContent = "🔑 Forgot Password";
  }

  function forgotConfirmIdentity() {
    // Move to step 3
    document.getElementById("forgotStep2")?.classList.add("hidden");
    document.getElementById("forgotStep3")?.classList.remove("hidden");
    document.getElementById("forgotModalTitle").textContent = "🔒 Reset Password";
  }

  function handleForgotReset() {
    const newPass = document.getElementById("forgotNewPass")?.value;
    const confirmPass = document.getElementById("forgotConfirmPass")?.value;

    if (!newPass || newPass.length < 6) {
      Toast.warning("Password must be at least 6 characters");
      return;
    }
    if (newPass !== confirmPass) {
      Toast.warning("Passwords don't match");
      return;
    }

    const btn = document.getElementById("forgotResetBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span> Resetting...';

    setTimeout(() => {
      const result = Auth.resetPassword(forgotEmail, newPass);
      btn.disabled = false;
      btn.innerHTML = '<span>Reset Password</span> <i class="fas fa-check"></i>';

      if (result.ok) {
        Toast.success("Password reset successfully! You can now log in.");
        closeForgotPassword();
        // Pre-fill the login email for convenience
        const loginEmail = document.getElementById("loginEmail");
        if (loginEmail) loginEmail.value = forgotEmail;
        switchTab("login");
      } else {
        Toast.error(result.error || "Reset failed");
      }
    }, 600);
  }

  // ── Init ───────────────────────────────────────────────────

  function redirectIfLoggedIn() {
    const session = Auth.getSession();
    if (session && !session.isGuest) {
      window.location.href = session.role === "vendor" ? "dashboard.html" : "index.html";
    }
  }

  function init() {
    redirectIfLoggedIn();
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    switchTab, handleLogin, handleRegister, togglePassword, handleGuestLogin,
    showForgotPassword, closeForgotPassword, handleForgotFind,
    forgotGoBack, forgotConfirmIdentity, handleForgotReset
  };
})();

// Make functions available globally for inline onclick handlers in HTML
window.switchTab = AuthPage.switchTab;
window.handleLogin = AuthPage.handleLogin;
window.handleRegister = AuthPage.handleRegister;
window.togglePassword = AuthPage.togglePassword;
window.handleGuestLogin = AuthPage.handleGuestLogin;
window.showForgotPassword = AuthPage.showForgotPassword;
window.closeForgotPassword = AuthPage.closeForgotPassword;
window.handleForgotFind = AuthPage.handleForgotFind;
window.forgotGoBack = AuthPage.forgotGoBack;
window.forgotConfirmIdentity = AuthPage.forgotConfirmIdentity;
window.handleForgotReset = AuthPage.handleForgotReset;
