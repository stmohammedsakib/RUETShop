// js/ui/toast.js

const Toast = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      // Try to find existing container from HTML first
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

    toast.innerHTML = `
      <span class="toast-icon">${iconMap[type] || "ℹ️"}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    c.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add("show"));

    // Auto remove
    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hide");
      toast.addEventListener("transitionend", () => toast.remove());
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