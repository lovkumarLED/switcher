let lastTrigger = null;
let closeCallback = null;
export function createCloseSettlement(resolve) { let settled = false; return value => { if (!settled) { settled = true; resolve(value); } }; }

function focusable(dialog) {
  return [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
}

function closeCurrent(reason = "dismiss") {
  const layer = document.querySelector("#dialogLayer");
  if (!layer.firstElementChild) return;
  layer.replaceChildren();
  document.body.classList.remove("dialog-open");
  document.querySelector("#appShell")?.removeAttribute("inert");
  document.querySelector("#startupView")?.removeAttribute("inert");
  lastTrigger?.focus?.();
  lastTrigger = null;
  const callback = closeCallback; closeCallback = null; callback?.(reason);
}

export function openDialog({ title, content, actions = "", wide = false, variant = "", eyebrow = "Switcher", headerMark = "", headerMeta = "", trigger = document.activeElement, onOpen, onClose } = {}) {
  lastTrigger = trigger;
  closeCallback = onClose || null;
  const layer = document.querySelector("#dialogLayer");
  const safeVariant = String(variant || "").replace(/[^a-z0-9_-]/gi, "");
  const dialogClass = ["dialog", wide ? "dialog--wide" : "", safeVariant ? `dialog--${safeVariant}` : ""].filter(Boolean).join(" ");
  const mark = headerMark ? `<div class="dialog__head-mark">${headerMark}</div>` : "";
  const meta = headerMeta ? `<div class="dialog__head-meta">${headerMeta}</div>` : "";
  layer.innerHTML = `<div class="dialog-backdrop"><section class="${dialogClass}" role="dialog" aria-modal="true" aria-labelledby="dialogTitle"><header class="dialog__head"><div class="dialog__head-main">${mark}<div><p class="eyebrow" id="dialogEyebrow"></p><h2 id="dialogTitle"></h2></div></div><div class="dialog__head-actions">${meta}<button class="icon-button dialog__close" type="button" data-dialog-close aria-label="Close dialog">×</button></div></header><div class="dialog__body"></div>${actions ? `<footer class="dialog__actions">${actions}</footer>` : ""}</section></div>`;
  const dialog = layer.querySelector(".dialog");
  dialog.querySelector("#dialogEyebrow").textContent = eyebrow || "Switcher";
  dialog.querySelector("#dialogTitle").textContent = title || "Dialog";
  const body = dialog.querySelector(".dialog__body");
  if (typeof content === "string") body.innerHTML = content;
  else if (content) body.append(content);
  document.body.classList.add("dialog-open");
  const outside = document.querySelector("#appShell:not([hidden])") || document.querySelector("#startupView:not([hidden])");
  outside?.setAttribute("inert", "");
  layer.querySelectorAll("[data-dialog-close]").forEach(button => button.addEventListener("click", closeCurrent));
  layer.querySelector(".dialog-backdrop").addEventListener("mousedown", event => { if (event.target.classList.contains("dialog-backdrop")) closeCurrent(); });
  dialog.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); closeCurrent(); return; }
    if (event.key !== "Tab") return;
    const items = focusable(dialog);
    if (!items.length) return;
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  requestAnimationFrame(() => (focusable(dialog)[0] || dialog).focus());
  onOpen?.(dialog);
  return { dialog, close: closeCurrent };
}

export function detailStatus(label, tone = "neutral") {
  return `<span class="detail-status detail-status--${escapeHtml(tone)}">${escapeHtml(label)}</span>`;
}

export function detailSummaryItem(label, value, tone = "") {
  const toneClass = tone ? ` detail-summary__value--${escapeHtml(tone)}` : "";
  return `<div class="detail-summary__item" role="listitem"><span>${escapeHtml(label)}</span><strong class="detail-summary__value${toneClass}">${escapeHtml(value)}</strong></div>`;
}

export function detailSection(label, content, className = "") {
  const extraClass = className ? ` ${escapeHtml(className)}` : "";
  return `<section class="detail-section${extraClass}"><div class="detail-section__head"><p class="eyebrow">${escapeHtml(label)}</p><span class="detail-section__rule" aria-hidden="true"></span></div>${content}</section>`;
}

export function detailView({ summary = "", sections = "" } = {}) {
  return `<div class="detail-view">${summary ? `<div class="detail-summary" role="list">${summary}</div>` : ""}${sections}</div>`;
}

export function confirmAction({ title, message, confirmLabel = "Continue", danger = false, trigger } = {}) {
  return new Promise(resolve => {
    const controls = `<button class="button button--quiet" type="button" data-dialog-close>Cancel</button><button class="button ${danger ? "button--danger" : "button--primary"}" type="button" data-confirm>${confirmLabel}</button>`;
    const settle = createCloseSettlement(resolve);
    const { dialog, close } = openDialog({ title, content: `<p>${escapeHtml(message)}</p>`, actions: controls, trigger, onClose: reason => settle(reason === "confirm") });
    dialog.querySelector("[data-confirm]").addEventListener("click", () => close("confirm"));
  });
}

export function toastPresentation(type = "info") {
  if (type === "success") return { title: "Change saved", symbol: "check" };
  if (type === "error") return { title: "Action needed", symbol: "alert" };
  return { title: "Switcher", symbol: "info" };
}

const toastSymbols = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.8 12.3 3.2 3.2 7.2-7.4"/></svg>',
  alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.5v5.3"/><circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none"/><path d="M12 3.8 21 19H3z"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 10.5v6"/><circle cx="12" cy="7.4" r=".8" fill="currentColor" stroke="none"/></svg>',
};

export function notify(message, type = "info") {
  const region = document.querySelector("#toastRegion");
  if (!region) return;
  while (region.children.length >= 4) region.firstElementChild?.remove();
  const presentation = toastPresentation(type);
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.innerHTML = `<span class="toast__icon">${toastSymbols[presentation.symbol]}</span><span class="toast__copy"><strong class="toast__title"></strong><span class="toast__message"></span></span><button class="toast__close" type="button" aria-label="Dismiss notification">×</button><span class="toast__progress" aria-hidden="true"></span>`;
  toast.querySelector(".toast__title").textContent = presentation.title;
  toast.querySelector(".toast__message").textContent = String(message ?? "");
  region.append(toast);
  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 180);
  };
  toast.querySelector(".toast__close").addEventListener("click", dismiss);
  window.setTimeout(dismiss, 4200);
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}
