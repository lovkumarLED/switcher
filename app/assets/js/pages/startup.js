import { initStartupAtmosphere, initStartupMark, reducedMotion } from "../core/motion.js";
import { initOnboarding } from "./onboarding.js";

let host;
let readyCallback;

export function activateStartup({ previewOnly = false, onPreview = () => {}, onProceed = () => {} } = {}) {
  if (previewOnly) {
    onPreview();
    return "preview";
  }
  onProceed();
  return "onboarding";
}

export function welcomePreviewRequested(search = "") {
  return new URLSearchParams(search).get("preview") === "welcome";
}

export function startupLayoutScale(viewportWidth, viewportHeight) {
  return Math.min(viewportWidth / 1586, viewportHeight / 992);
}

export function startupCanvasWidth(viewportWidth, scale) {
  return viewportWidth / scale;
}

export function startupHandoffPlan(isReduced = false) {
  return {
    durationMs: isReduced ? 0 : 420,
    swapImmediately: true,
    preservesOutgoingFrame: !isReduced,
  };
}

export function shouldKeepStartupGhostId(namespaceURI = "") {
  return namespaceURI === "http://www.w3.org/2000/svg";
}

function runStartupHandoff(element, onComplete) {
  const plan = startupHandoffPlan(reducedMotion());
  const button = element.querySelector("#startupBegin");
  if (button) button.disabled = true;
  if (!plan.durationMs) {
    onComplete();
    return;
  }
  const outgoing = element.cloneNode(true);
  outgoing.removeAttribute("id");
  outgoing.className = "startup-view startup-handoff-ghost";
  outgoing.setAttribute("aria-hidden", "true");
  outgoing.setAttribute("inert", "");
  outgoing.querySelectorAll("[id]").forEach(node => {
    if (!shouldKeepStartupGhostId(node.namespaceURI)) node.removeAttribute("id");
  });
  outgoing.querySelectorAll("button, a, input, select, textarea").forEach(node => node.setAttribute("tabindex", "-1"));
  document.body.append(outgoing);
  onComplete();
  element.classList.add("is-transitioning-in");
  requestAnimationFrame(() => outgoing.classList.add("is-leaving"));
  window.setTimeout(() => {
    outgoing.remove();
    element.classList.remove("is-transitioning-in");
  }, plan.durationMs);
}

function interactiveMarkMarkup() {
  return `<svg viewBox="0 0 432 488" aria-hidden="true"><defs><linearGradient id="liveCoral" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF6D60"/><stop offset="1" stop-color="#FF5A4E"/></linearGradient><linearGradient id="livePlum" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#844871"/><stop offset="1" stop-color="#62324F"/></linearGradient></defs><path class="mark-path mark-path--coral" d="M270 0H164C71 0 0 73 0 171C0 279 62 327 148 362Q155 367 162 360L219 303Q229 294 218 287C155 262 112 239 112 174C112 119 145 105 191 105H270C282 105 288 98 288 87V18C288 7 281 0 270 0Z" fill="url(#liveCoral)"/><path class="mark-path mark-path--plum" d="M292 103C373 120 432 190 432 284C432 397 360 488 248 488H174C162 488 154 480 154 468V404C154 392 162 384 174 384H238C294 384 322 348 322 291C322 230 288 205 230 204H213C198 203 192 190 202 179L263 119C271 111 281 104 292 103Z" fill="url(#livePlum)"/></svg>`;
}

function welcomeMarkup() {
  return `<div class="startup-atmosphere" aria-hidden="true"></div><div class="startup-frame"><div class="startup-grid"><div class="startup-brand"><img src="/assets/bdf-counterphase-logo.svg" alt=""><div><strong>Switcher</strong><span>Agent + JSON control</span></div></div><ol class="welcome-steps" aria-label="Setup progress"><li class="is-active"><b>01</b><span>Welcome</span></li><li><b>02</b><span>Connect your agent</span></li><li><b>03</b><span>Add a provider</span></li><li><b>04</b><span>Ready</span></li></ol><div class="startup-copy"><h1 id="startupTitle" class="startup-title">Welcome to<br>Switcher</h1><p class="startup-lede">Set up a private local relay for the AI tools you already use.</p><div class="startup-actions"><button id="startupBegin" class="button button--primary" type="button">Set up your workspace<svg class="button-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h16M14 5.5 20.5 12 14 18.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div><p class="startup-proof"><svg class="shield-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.4-2.9 8.3-7 10-4.1-1.7-7-5.6-7-10V6z" fill="none"/><path d="M9.2 12.1l2 2 3.8-4" fill="none"/></svg>Your configuration stays on this computer.</p></div><div class="startup-art"><button id="startupMark" class="startup-mark" type="button" aria-label="Play the Switcher welcome animation"></button></div><svg class="startup-signal" viewBox="0 0 1400 876" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><linearGradient id="signalCoral" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF6D60"/><stop offset="1" stop-color="#FF5A4E"/></linearGradient><linearGradient id="signalMagenta" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7A3F68"/><stop offset="1" stop-color="#62324F"/></linearGradient></defs><path vector-effect="non-scaling-stroke" class="trace trace--coral" d="M706 400H780Q795 400 800 415C810 445 840 484 858 484C905 484 975 462 1041 460" fill="none"/><path vector-effect="non-scaling-stroke" class="trace trace--magenta" d="M1252 576H1290Q1300 576 1303 566C1308 550 1312 535 1316 528H1400" fill="none"/><circle class="signal-node signal-node--coral" cx="1041" cy="460" r="3"/><circle class="signal-node signal-node--magenta" cx="1252" cy="576" r="3.5"/></svg><p class="startup-status"><span class="status-dot" aria-hidden="true"></span>Ready when you are</p></div></div>`;
}

export function welcomeMagentaSignalGeometry() {
  return {
    path: "M1184 576H1250Q1260 576 1264 566C1271 548 1278 535 1286 528H1400",
    nodeX: "1184",
  };
}

export function initStartup(element, onReady, { previewOnly = false } = {}) {
  host = element;
  readyCallback = onReady;
  host.hidden = false;
  host.innerHTML = welcomeMarkup();
  const magentaSignal = welcomeMagentaSignalGeometry();
  host.querySelector(".trace--magenta")?.setAttribute("d", magentaSignal.path);
  host.querySelector(".signal-node--magenta")?.setAttribute("cx", magentaSignal.nodeX);
  initStartupAtmosphere(host, host.querySelector(".startup-atmosphere"));
  const mark = host.querySelector("#startupMark");
  mark.innerHTML = interactiveMarkMarkup();
  mark.classList.add("has-live-svg");
  initStartupMark(mark, host.querySelector(".startup-signal"));
  host.querySelector("#startupBegin").addEventListener("click", () => {
    const proceed = () => activateStartup({
      previewOnly,
      onProceed: () => initOnboarding(host, readyCallback, {
        onBack: () => initStartup(host, readyCallback),
      }),
    });
    if (previewOnly) proceed();
    else runStartupHandoff(host, proceed);
  });
}
