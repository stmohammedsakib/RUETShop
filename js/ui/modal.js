// js/ui/modal.js

const Modal = (() => {
  let activeModal = null;

  function open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add("modal-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-active");
    document.body.style.overflow = "hidden";
    activeModal = modal;

    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  }

  function close(modalId) {
    const modal = modalId
      ? document.getElementById(modalId)
      : activeModal;
    if (!modal) return;

    modal.classList.remove("modal-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-active");
    document.body.style.overflow = "";
    activeModal = null;
  }

  function closeAll() {
    // Handle modals using the modal-open pattern
    document.querySelectorAll(".modal.modal-open").forEach((m) => {
      m.classList.remove("modal-open");
      m.setAttribute("aria-hidden", "true");
    });
    // Handle modals using the .hidden pattern (used by cart, dashboard, admin, auth pages)
    document.querySelectorAll(".modal:not(.hidden), .checkout-modal:not(.hidden), [id$='Modal']:not(.hidden)").forEach((m) => {
      m.classList.add("hidden");
      m.setAttribute("aria-hidden", "true");
    });
    document.body.classList.remove("modal-active");
    document.body.style.overflow = "";
    activeModal = null;
  }

  function create({ id, title, body, footer = "", size = "md" }) {
    document.getElementById(id)?.remove();

    const modal = document.createElement("div");
    modal.id = id;
    modal.className = "modal";
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", `${id}-title`);

    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-box modal-${size}">
        <div class="modal-header">
          <h3 id="${id}-title">${Utils.escapeHtml(title)}</h3>
          <button class="modal-close-btn" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ""}
      </div>
    `;

    // Fix Bug #33: Prevent closing on text highlight drag
    let isMouseDownOnBackdrop = false;
    const backdrop = modal.querySelector('.modal-backdrop');
    backdrop.addEventListener('mousedown', (e) => {
      if (e.target === backdrop) isMouseDownOnBackdrop = true;
    });
    backdrop.addEventListener('mouseup', (e) => {
      if (isMouseDownOnBackdrop && e.target === backdrop) close(id);
      isMouseDownOnBackdrop = false;
    });
    
    modal.querySelector('.modal-close-btn').addEventListener('click', () => close(id));

    document.body.appendChild(modal);
    open(id);
    return modal;
  }

  function confirm({ title = "Confirm", message, onConfirm, onCancel }) {
    const modal = create({
      id: "confirm-modal",
      title,
      body: `<p>${Utils.escapeHtml(message)}</p>`,
      footer: `
        <button class="btn btn-outline" id="confirm-modal-cancel">Cancel</button>
        <button class="btn btn-danger" id="confirm-modal-ok">Confirm</button>
      `,
      size: "sm",
    });

    modal.querySelector("#confirm-modal-cancel")?.addEventListener("click", () => {
      close("confirm-modal");
      if (typeof onCancel === "function") onCancel();
    });

    modal.querySelector("#confirm-modal-ok")?.addEventListener("click", () => {
      close("confirm-modal");
      if (typeof onConfirm === "function") onConfirm();
    });
  }

  // Close on Escape key — works for both modal patterns
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (activeModal) {
        closeAll();
      } else {
        // Check for any visible modal using the .hidden pattern
        const visibleModal = document.querySelector(".modal:not(.hidden), .checkout-modal:not(.hidden), [id$='Modal']:not(.hidden)");
        if (visibleModal) closeAll();
      }
    }
  });

  return { open, close, closeAll, create, confirm };
})();