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
    document.querySelectorAll(".modal.modal-open").forEach((m) => {
      m.classList.remove("modal-open");
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
      <div class="modal-backdrop" onclick="Modal.close('${id}')"></div>
      <div class="modal-box modal-${size}">
        <div class="modal-header">
          <h3 id="${id}-title">${Utils.escapeHtml(title)}</h3>
          <button class="modal-close-btn" onclick="Modal.close('${id}')" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ""}
      </div>
    `;

    document.body.appendChild(modal);
    open(id);
    return modal;
  }

  function confirm({ title = "Confirm", message, onConfirm, onCancel }) {
    create({
      id: "confirm-modal",
      title,
      body: `<p>${Utils.escapeHtml(message)}</p>`,
      footer: `
        <button class="btn btn-outline" onclick="Modal.close('confirm-modal'); ${onCancel ? "(" + onCancel.toString() + ")()" : ""}">Cancel</button>
        <button class="btn btn-danger" onclick="Modal.close('confirm-modal'); (${onConfirm.toString()})()">Confirm</button>
      `,
      size: "sm",
    });
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeModal) closeAll();
  });

  return { open, close, closeAll, create, confirm };
})();