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
    const current = DB.get(STORAGE_KEY) || LIGHT;
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
  }

  function init() {
    const saved = DB.get(STORAGE_KEY);
    if (saved) {
      apply(saved);
    } else {
      // No user preference — respect system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      apply(prefersDark ? DARK : LIGHT);
    }
  }

  // Watch system preference changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!DB.get(STORAGE_KEY)) {
        apply(e.matches ? DARK : LIGHT);
      }
    });

  return { init, toggle, get, apply };
})();

document.addEventListener("DOMContentLoaded", Theme.init);