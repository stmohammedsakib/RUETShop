// js/ui/theme.js

const Theme = (() => {
  const STORAGE_KEY = "ruet_theme";
  const DARK = "dark";
  const LIGHT = "light";

  function get() {
    return DB.get(STORAGE_KEY) || null;
  }

  function apply(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    DB.set(STORAGE_KEY, mode);
    updateIcon(mode);
  }

  function toggle() {
    const current = document.documentElement.getAttribute("data-theme") || LIGHT;
    apply(current === DARK ? LIGHT : DARK);
  }

  function updateIcon(mode) {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    const icon = btn.querySelector("i");
    if (icon) {
      icon.className = mode === DARK ? "fas fa-sun" : "fas fa-moon";
    }
    btn.title = mode === DARK ? "Switch to Light Mode" : "Switch to Dark Mode";
    btn.setAttribute("aria-label", btn.title);
  }

  function init() {
    const saved = DB.get(STORAGE_KEY);
    if (saved) {
      apply(saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? DARK : LIGHT);
      updateIcon(prefersDark ? DARK : LIGHT);
    }
  }

  // Watch system preference changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!DB.has(STORAGE_KEY)) {
        const mode = e.matches ? DARK : LIGHT;
        document.documentElement.setAttribute("data-theme", mode);
        updateIcon(mode);
      }
    });

  return { init, toggle, get, apply };
})();

document.addEventListener("DOMContentLoaded", Theme.init);