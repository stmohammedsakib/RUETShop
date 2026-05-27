// js/ui/toast.js

const Toast = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.getElementById("toastContainer");
      if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
      }
    }
    return container;
  }

  function show(message, type = "info", duration = 3000) {
    const c = getContainer();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const iconMap = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    const iconSpan = document.createElement("span");
    iconSpan.className = "toast-icon";
    iconSpan.textContent = iconMap[type] || "ℹ️";

    const msgSpan = document.createElement("span");
    msgSpan.className = "toast-message";
    msgSpan.textContent = message; // Safe: no HTML injection

    const closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => toast.remove());

    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    toast.appendChild(closeBtn);

    c.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add("show"));

    // Auto remove
    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hide");
      toast.addEventListener("transitionend", () => toast.remove(), { once: true });
      // Fallback if no CSS transition fires
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
    }, duration);
  }

  function success(msg, duration) {
    show(msg, "success", duration);
  }

  function error(msg, duration) {
    show(msg, "error", duration);
  }

  function warning(msg, duration) {
    show(msg, "warning", duration);
  }

  function info(msg, duration) {
    show(msg, "info", duration);
  }

  function clear() {
    getContainer().innerHTML = "";
  }

  return { show, success, error, warning, info, clear };
})();
