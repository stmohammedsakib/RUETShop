// js/ui/loader.js

const Loader = (() => {
  // ── Full page overlay spinner ──────────────────────────────
  function show(message = "Loading...") {
    let overlay = document.getElementById("page-loader");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "page-loader";
      overlay.innerHTML = `
        <div class="loader-spinner"></div>
        <p class="loader-message">${message}</p>
      `;
      document.body.appendChild(overlay);
    } else {
      overlay.querySelector(".loader-message").textContent = message;
    }
    overlay.classList.remove("hidden");
    document.body.classList.add("loading");
  }

  function hide() {
    const overlay = document.getElementById("page-loader");
    if (overlay) {
      overlay.classList.add("hidden");
      document.body.classList.remove("loading");
    }
  }

  // ── Skeleton screens ───────────────────────────────────────
  function skeletonCard() {
    return `
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>
    `;
  }

  function showSkeletons(containerId, count = 8) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = Array(count).fill(skeletonCard()).join("");
  }

  function clearSkeletons(containerId) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = "";
  }

  // ── Inline button spinner ──────────────────────────────────
  function buttonLoading(btn, loading = true) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.innerHTML;
      btn.innerHTML = `<span class="btn-spinner"></span> Loading...`;
      btn.disabled = true;
    } else {
      btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
      btn.disabled = false;
    }
  }

  // ── Section-level spinner ──────────────────────────────────
  function sectionLoading(containerId, message = "Fetching data...") {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
      <div class="section-loader">
        <div class="loader-spinner small"></div>
        <p>${message}</p>
      </div>
    `;
  }

  return {
    show,
    hide,
    showSkeletons,
    clearSkeletons,
    buttonLoading,
    sectionLoading,
    skeletonCard,
  };
})();