import { api } from "../core/api.js";
import { confirmAction, detailSection, detailStatus, detailSummaryItem, detailView, escapeHtml, notify, openDialog } from "../core/dialog.js";
import { providerLogoMark } from "../core/provider-logo.js";

export const PRESERVATION_NOTICE = "Claude-owned settings preserved.";
export const RESTART_NOTICE = "Restarting Claude Code may be required for startup-only values.";
export const ENV_REF_HELP = "Environment variable name, not the secret value.";
export const COMPAT_CONFIRM_TEXT = "I reviewed these compatibility settings and their tradeoffs.";

const routeRenderOptionsByWorkspace = new WeakMap();

function rerenderClaudeRoutes(workspace) {
  return renderClaudeRoutes(workspace, routeRenderOptionsByWorkspace.get(workspace));
}

export function recommendClaudeCompatibility({ hasModelsEndpoint, supportsBetaFields, contextWindow, suppressNonessentialTraffic }) {
  const values = {
    gatewayDiscovery: false,
    disableExperimentalBetas: false,
    autoCompactWindow: 190000,
    disableNonessentialTraffic: Boolean(suppressNonessentialTraffic),
  };
  const notes = [];
  const context = String(contextWindow || "").trim();

  if (hasModelsEndpoint === "yes" && !values.disableNonessentialTraffic) {
    values.gatewayDiscovery = true;
  } else if (hasModelsEndpoint === "yes" && values.disableNonessentialTraffic) {
    notes.push({ code: "DISCOVERY_BLOCKED_BY_NONESSENTIAL_TRAFFIC", tone: "warning", text: "Nonessential traffic is suppressed, so gateway model discovery would be disabled anyway. Discovery stays off." });
  }

  if (supportsBetaFields === "no") {
    values.disableExperimentalBetas = true;
  } else if (supportsBetaFields === "unknown") {
    notes.push({ code: "BETA_COMPATIBILITY_NOT_VERIFIED", tone: "warning", text: "Beta-header compatibility is not verified, so experimental betas stay enabled." });
  }

  if (context !== "") {
    const parsed = Number(context);
    if (Number.isInteger(parsed) && parsed > 0) {
      if (parsed < 100000) {
        values.autoCompactWindow = 100000;
        notes.push({ code: "CONTEXT_BELOW_SUPPORTED_MINIMUM", tone: "warning", text: "The context window is below the supported minimum; /compact may be required." });
      } else if (parsed > 1000000) {
        values.autoCompactWindow = 1000000;
        notes.push({ code: "CONTEXT_CAPPED_AT_SUPPORTED_MAXIMUM", tone: "info", text: "The context window exceeds the supported maximum and is capped at 1000000." });
      } else {
        values.autoCompactWindow = parsed;
      }
    }
  } else {
    notes.push({ code: "CONTEXT_NOT_VERIFIED", tone: "info", text: "The context window is not verified; 190000 is a starting value only." });
  }

  return { values, notes };
}

export function isApplied(route, store) {
  return Boolean(route.configSha256) && store.appliedRouteId === route.id && store.appliedRouteConfigSha256 === route.configSha256;
}

export function hasPendingChanges(route, store) {
  return Boolean(route.configSha256) && store.appliedRouteId === route.id && store.appliedRouteConfigSha256 !== route.configSha256;
}

export const circularRouteIndex = (index, delta, count) => count ? ((index + delta) % count + count) % count : 0;

function routeBrandMark(route) {
  return providerLogoMark(route.name, { id: route.id, size: "lg", className: "provider-brand-mark" });
}

function routeCard(route, store) {
  const applied = isApplied(route, store);
  const pending = hasPendingChanges(route, store);
  const health = applied ? '<p class="provider-health is-healthy"><span></span>Applied</p>'
    : pending ? '<p class="provider-health is-pending"><span></span>Changes not applied</p>'
    : '<p class="provider-health"><span></span>Saved</p>';
  const authLabel = route.authKind === "apiKey" ? "API key" : "Bearer token";
  const roles = route.modelRoles || {};
  const roleList = ["opus", "sonnet", "haiku", "fable"].filter(role => roles[role]);
  const rolesRow = roleList.length ? `<div><dt>Roles</dt><dd>${roleList.length} role ${roleList.length === 1 ? "model" : "models"}</dd></div>` : "";
  return `<article class="provider-deck-card claude-route-card ${applied ? "claude-route-card--applied" : "claude-route-card--saved"}" data-route-id="${escapeHtml(route.id)}" tabindex="0"><div class="provider-deck-card__head">${routeBrandMark(route)}<div><h3>${escapeHtml(route.name)}</h3>${health}</div></div><dl class="claude-route-card__meta"><div><dt>Endpoint</dt><dd class="mono">${escapeHtml(route.baseUrl)}</dd></div><div><dt>Model</dt><dd>${escapeHtml(route.effectiveModel || route.model)}${route.model ? "" : ' <span class="claude-type-chip claude-type-chip--roles"><span class="claude-type-chip__dot" aria-hidden="true"></span>from roles</span>'}</dd></div><div><dt>Auth</dt><dd>${authLabel} · <span class="mono">${escapeHtml(route.secretEnvRef)}</span></dd></div>${rolesRow}</dl><div class="claude-route-card__actions">${applied ? '<button class="button button--quiet button--small" type="button" disabled>Route applied</button>' : `<button class="button button--primary button--small" type="button" data-route-action="apply">Apply route</button>`}<button class="button button--quiet button--small" type="button" data-route-action="details">View details</button><button class="button button--quiet button--small" type="button" data-route-action="edit">Edit route</button><button class="button button--danger button--small" type="button" data-route-action="delete">Delete route</button></div></article>`;
}

export function claudeRoutesMarkup(routes, store, inventory = null, credentials = null, activeAgentId = "claude-code") {
  const list = Array.isArray(routes) ? routes : [];
  const inv = inventory || { mcps: [], plugins: [] };
  const applied = list.find(route => route.id === store.appliedRouteId) || null;
  const mcpCount = Array.isArray(inv.mcps) ? inv.mcps.length : 0;
  const pluginCount = Array.isArray(inv.plugins) ? inv.plugins.length : 0;
  const chipbar = `<div class="claude-chipbar" aria-label="Claude Code summary"><span class="chip">${list.length} saved routes</span><span class="chip">Applied: ${applied ? escapeHtml(applied.name) : "none"}</span><span class="chip">${mcpCount} MCP servers</span><span class="chip">${pluginCount} plugins</span></div>`;
  const creds = Array.isArray(credentials) ? credentials : [];
  const credsCard = `<div class="card card--padded claude-side-panel control-room-card control-room-card--credentials"><p class="eyebrow">Credentials</p><div class="claude-info-strip"><strong>Encrypted</strong><span>Stored locally and protected by Windows DPAPI.</span></div>${creds.length ? `<div class="claude-cred-list">${creds.map(c => `<div class="claude-cred-row"><div class="claude-credential-badge"><span class="claude-credential-badge__name mono">${escapeHtml(c.name)}</span><span class="claude-type-chip claude-type-chip--${c.backend === "store" ? "store" : "env"}"><span class="claude-type-chip__dot" aria-hidden="true"></span>${c.backend === "store" ? "locked store" : "env var"}</span></div><p class="muted">${c.usedBy.length ? "Used by " + c.usedBy.map(escapeHtml).join(", ") : "Not used by any route"}</p>${c.usedBy.length ? "" : `<button class="button button--danger button--small" type="button" data-cred-delete="${escapeHtml(c.name)}">Delete</button>`}</div>`).join("")}</div>` : `<p class="muted">No app-managed credentials yet.</p>`}</div>`;
  const agentTabs = `<div class="provider-agent-tabs control-room-card control-room-card--settings" role="tablist" aria-label="Coding agents"><button role="tab" type="button" data-provider-agent="opencode" aria-selected="${activeAgentId === "opencode"}"><img src="/assets/brands/opencode.svg" alt="">OpenCode</button><button role="tab" type="button" data-provider-agent="kilo" aria-selected="${activeAgentId === "kilo"}"><img src="/assets/brands/kilocode.svg" alt="">KiloCode</button><button role="tab" type="button" data-provider-agent="claude-code" aria-selected="${activeAgentId === "claude-code"}"><img src="/assets/brands/claudecode.svg" alt="">Claude Code</button></div>`;
  return `<div class="claude-routes-workspace claude-routes-workspace--header-rail"><section class="claude-routes-main" aria-label="Saved Claude routes"><div class="page-head claude-routes-page-head"><div><p class="eyebrow">Routing</p><h1 class="page-title">Claude routes</h1></div></div>${agentTabs}${chipbar}${list.length ? `<div class="provider-deck-stage claude-routes-stage">${list.map(route => routeCard(route, store)).join("")}</div>${list.length > 1 ? `<div class="provider-deck-controls"><button class="icon-button" type="button" data-route-deck-prev aria-label="Previous route">←</button><span>Bring a route forward</span><button class="icon-button" type="button" data-route-deck-next aria-label="Next route">→</button></div>` : ""}` : `<div class="empty-state"><h3>No routes yet</h3><p>Save a routing profile, then apply it to Claude Code.</p><button id="emptyAddClaudeRoute" class="button button--primary" type="button">Add route</button></div>`}</section><aside class="claude-routes-sidebar claude-routes-sidebar--header claude-route-header-rail"><div class="page-actions claude-route-header-actions"><div class="provider-agent-selector"><span class="status-dot status-dot--ok"></span>Claude Code · connected</div><button id="addClaudeRoute" class="button button--primary" type="button">Add route</button></div><div class="card card--padded claude-side-panel control-room-card control-room-card--settings"><p class="eyebrow">Claude Code</p><div class="claude-info-strip"><strong>Settings preserved</strong><span>${PRESERVATION_NOTICE}</span></div><div class="claude-editor-status" data-claude-status></div></div>${credsCard}</aside></div>`;
}

export async function renderClaudeRoutes(workspace, { activeAgentId = "claude-code", onAgentChange = null } = {}) {
  routeRenderOptionsByWorkspace.set(workspace, { activeAgentId, onAgentChange });
  workspace.innerHTML = '<div class="card card--padded skeleton"></div>';
  let routes = [];
  try {
    const [data, status, inventory, credentials] = await Promise.all([
      api.claudeRoutes(),
      api.claudeStatus().catch(() => null),
      api.claudeScan().catch(() => null),
      api.claudeCredentials().catch(() => null),
    ]);
    routes = data.routes || [];
    workspace.innerHTML = claudeRoutesMarkup(data.routes || [], data, inventory, credentials && credentials.credentials, activeAgentId);
    if (status) {
      const block = workspace.querySelector("[data-claude-status]");
      block.innerHTML = `<dl class="claude-health-grid"><div class="claude-health-item ${status.settingsPresent === true ? "claude-health-item--ok" : "claude-health-item--warn"}"><span class="claude-health-item__dot" aria-hidden="true"></span><div><dt>Settings file</dt><dd>${status.settingsPresent === true ? "Present" : status.settingsPresent === null ? "Unknown (locked)" : "Missing"}</dd></div></div><div class="claude-health-item ${status.lastBackupAvailable ? "claude-health-item--ok" : ""}"><span class="claude-health-item__dot" aria-hidden="true"></span><div><dt>Last backup</dt><dd>${status.lastBackupAvailable ? "Available" : "None yet"}</dd></div></div><div class="claude-health-item ${status.realTargetLocked ? "claude-health-item--warn" : "claude-health-item--ok"}"><span class="claude-health-item__dot" aria-hidden="true"></span><div><dt>Target lock</dt><dd>${status.realTargetLocked ? "Locked until Gate 5 approval" : "Unlocked"}</dd></div></div></dl><button class="button button--outline button--small" type="button" data-claude-restore>Restore latest backup</button>`;
      block.querySelector("[data-claude-restore]").addEventListener("click", () => restoreLatest(workspace, data));
    }
  } catch (error) {
    workspace.innerHTML = `<div class="empty-state"><h3>Claude routes unavailable</h3><p>${escapeHtml(error.message)}</p></div>`;
    return;
  }
  const agentTabs = [...workspace.querySelectorAll("[data-provider-agent]")];
  const agentTablist = workspace.querySelector(".provider-agent-tabs");
  agentTabs.forEach(button => button.addEventListener("click", async () => {
    const nextAgent = button.dataset.providerAgent;
    if (nextAgent === activeAgentId || typeof onAgentChange !== "function") return;
    agentTablist.setAttribute("aria-busy", "true");
    agentTabs.forEach(tab => { tab.disabled = true; });
    try { await onAgentChange(nextAgent); }
    catch (error) {
      notify(error.message, "error");
      agentTablist.removeAttribute("aria-busy");
      agentTabs.forEach(tab => { tab.disabled = false; });
    }
  }));
  workspace.querySelector("#addClaudeRoute")?.addEventListener("click", event => openRouteEditor(workspace, null, event.currentTarget));
  workspace.querySelector("#emptyAddClaudeRoute")?.addEventListener("click", event => openRouteEditor(workspace, null, event.currentTarget));
  const deckCards = [...workspace.querySelectorAll("[data-route-id]")];
  let deckIndex = 0;
  const applyDeck = () => deckCards.forEach((item, itemIndex) => {
    const offset = circularRouteIndex(itemIndex, -deckIndex, deckCards.length);
    item.classList.toggle("provider-deck-card--front", offset === 0);
    item.classList.toggle("provider-deck-card--middle", offset === 1);
    item.classList.toggle("provider-deck-card--back", offset === 2);
    item.hidden = offset > 2;
    item.setAttribute("aria-hidden", String(offset > 2));
  });
  const stepDeck = delta => { deckIndex = circularRouteIndex(deckIndex, delta, deckCards.length); applyDeck(); };
  applyDeck();
  workspace.querySelector("[data-route-deck-prev]")?.addEventListener("click", () => stepDeck(-1));
  workspace.querySelector("[data-route-deck-next]")?.addEventListener("click", () => stepDeck(1));
  deckCards.forEach((item, itemIndex) => {
    const bringForward = event => { if (event.target.closest("button")) return; deckIndex = itemIndex; applyDeck(); };
    item.addEventListener("click", bringForward);
    item.addEventListener("keydown", event => { if (event.target === item && ["Enter", " "].includes(event.key)) { event.preventDefault(); deckIndex = itemIndex; applyDeck(); } });
  });
  workspace.querySelectorAll("[data-route-action='apply']").forEach(button => button.addEventListener("click", () => {
    const id = button.closest("[data-route-id]").dataset.routeId;
    applyRoute(workspace, id);
  }));
  workspace.querySelectorAll("[data-route-action='details']").forEach(button => button.addEventListener("click", () => {
    const id = button.closest("[data-route-id]").dataset.routeId;
    openRouteDetails(workspace, id);
  }));
  workspace.querySelectorAll("[data-route-action='edit']").forEach(button => button.addEventListener("click", () => {
    const id = button.closest("[data-route-id]").dataset.routeId;
    const route = routes.find(item => item.id === id);
    if (route) openRouteEditor(workspace, route, button);
  }));
  workspace.querySelectorAll("[data-route-action='delete']").forEach(button => button.addEventListener("click", async () => {
    const id = button.closest("[data-route-id]").dataset.routeId;
    const route = routes.find(item => item.id === id);
    if (!route) return;
    const confirmed = await confirmAction({ title: `Delete ${route.name}?`, message: "This removes the saved route after keeping a backup. The applied route cannot be deleted; apply another route first.", confirmLabel: "Delete route", danger: true, trigger: button });
    if (!confirmed) return;
    try {
      const current = await currentStore(workspace);
      if (current.appliedRouteId === route.id) throw new Error("Apply another route before deleting the applied route.");
      await api.deleteClaudeRoute(route.id, { expectedRoutesRevision: current.routesRevision });
      notify("Route deleted.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
    await rerenderClaudeRoutes(workspace);
  }));
  workspace.querySelectorAll("[data-cred-delete]").forEach(button => button.addEventListener("click", async () => {
    const name = button.dataset.credDelete;
    if (!confirm(`Delete the app-managed credential ${name}?`)) return;
    try {
      await api.deleteClaudeCredential(name);
      notify("Credential deleted.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
    await rerenderClaudeRoutes(workspace);
  }));
}

async function currentStore(workspace) {
  return api.claudeRoutes();
}

async function applyRoute(workspace, routeId) {
  try {
    const store = await currentStore(workspace);
    const revision = store.revision;
    const routesRevision = store.routesRevision;
    if (!revision || !routesRevision) throw new Error("The Claude target is locked.");
    const result = await api.applyClaudeRoute(routeId, { expectedRevision: revision, expectedRoutesRevision: routesRevision });
    notify("Route applied to Claude Code.", "success");
    await rerenderClaudeRoutes(workspace);
  } catch (error) {
    notify(error.message, "error");
    await rerenderClaudeRoutes(workspace);
  }
}

async function restoreLatest(workspace, store) {
  try {
    if (!store.revision || !store.routesRevision) throw new Error("The Claude target is locked.");
    const result = await api.restoreClaude({ expectedRevision: store.revision, expectedRoutesRevision: store.routesRevision });
    notify(result.message || "Backup restored.", "success");
  } catch (error) {
    notify(error.message, "error");
  }
  await rerenderClaudeRoutes(workspace);
}

function editorForm(route) {
  const r = route || {};
  const checked = (value, key) => value ? 'checked' : '';
  const numberControl = ({ id, label, value = "", min = 1, max = 1000000, step = 10000, start = min, placeholder = "", disabled = false }) => `<div class="claude-number-control" data-number-control><div class="claude-number-control__field"><input id="${id}" class="claude-route-number" type="number" min="${min}" max="${max}" step="${step}" data-number-start="${start}" value="${escapeHtml(String(value))}" ${placeholder ? `placeholder="${placeholder}"` : ""} ${disabled ? "disabled" : ""} autocomplete="off" aria-label="${label}"><span class="claude-number-control__unit" aria-hidden="true">tokens</span></div><span class="claude-number-control__stepper" aria-label="${label} controls"><button class="claude-number-control__button" type="button" data-number-step="up" aria-label="Increase ${label}">↑</button><button class="claude-number-control__button" type="button" data-number-step="down" aria-label="Decrease ${label}">↓</button></span></div>`;
  const roleCards = ["opus", "sonnet", "haiku", "fable"].map(role => `<label class="claude-role-card"><span class="claude-role-card__badge" aria-hidden="true">${role.slice(0, 2).toUpperCase()}</span><span class="claude-role-card__copy"><strong>${role[0].toUpperCase() + role.slice(1)}</strong><small>Model alias</small><input class="claude-role-model" data-role-model="${role}" placeholder="model-id" value="${escapeHtml(((r.modelRoles || {})[role] || ""))}" autocomplete="off"></span></label>`).join("");
  return `<form id="claudeRouteForm" class="stack claude-route-editor">
    <section class="claude-route-form-section claude-route-form-section--connection">
      <header class="claude-route-form-section__head"><div><p class="eyebrow">Connection</p><h3>Route destination</h3><p>Give Claude a clear, reusable path to the gateway.</p></div><span class="claude-route-form-index">01</span></header>
      <div class="claude-route-form-grid">
        <div class="field"><label for="claudeRouteName">Route name</label><input id="claudeRouteName" required maxlength="64" value="${escapeHtml(r.name || "")}" autocomplete="off"></div>
        <div class="field"><label for="claudeRouteUrl">Endpoint base URL</label><input id="claudeRouteUrl" required type="url" value="${escapeHtml(r.baseUrl || "")}" autocomplete="off"></div>
        <div class="field"><label for="claudeRouteAuthKind">Auth strategy</label><select id="claudeRouteAuthKind"><option value="apiKey" ${r.authKind === "authToken" ? "" : "selected"}>API key reference</option><option value="authToken" ${r.authKind === "authToken" ? "selected" : ""}>Bearer-token reference</option></select></div>
        <div class="field"><label for="claudeRouteSecretEnvRef">Environment variable name</label><input id="claudeRouteSecretEnvRef" required value="${escapeHtml(r.secretEnvRef || "")}" autocomplete="off"><p class="field-note">${ENV_REF_HELP}</p></div>
        <div class="field claude-route-form-grid__wide"><label for="claudeRouteSecret">API key value</label><div class="provider-secret"><input id="claudeRouteSecret" type="password" autocomplete="new-password" placeholder="Paste your key here"><button type="button" aria-label="Show API key">◉</button></div><p class="field-note">Switcher saves it as the environment variable above - no manual setup, no restart. Leave empty to keep an existing variable.</p></div>
      </div>
    </section>
    <section class="claude-route-form-section claude-route-form-section--policy">
      <header class="claude-route-form-section__head"><div><p class="eyebrow">Model &amp; policies</p><h3>Shape the request flow</h3><p>Choose the capabilities and traffic rules this route should use.</p></div><span class="claude-route-form-index">02</span></header>
      <div class="field"><label for="claudeRouteModel">Model ID</label><input id="claudeRouteModel" value="${escapeHtml(r.model || "")}" autocomplete="off"><p class="field-note">Optional when you assign a role model below — the main model is derived from your Sonnet role (or first role) when blank.</p></div>
      <div class="claude-route-toggle-grid">
        <label class="claude-route-toggle"><input id="claudeRouteGateway" type="checkbox" ${checked(r.gatewayDiscovery, "gatewayDiscovery")}><span class="claude-route-toggle__mark" aria-hidden="true"></span><span class="claude-route-toggle__copy"><strong>Gateway model discovery</strong><small>Allow the gateway to advertise models.</small></span></label>
        <label class="claude-route-toggle"><input id="claudeRouteBetas" type="checkbox" ${checked(r.disableExperimentalBetas, "disableExperimentalBetas")}><span class="claude-route-toggle__mark" aria-hidden="true"></span><span class="claude-route-toggle__copy"><strong>Disable experimental beta headers</strong><small>Keep requests on stable fields.</small></span></label>
        <div class="claude-route-toggle claude-route-toggle--with-control"><label class="claude-route-toggle__main"><input id="claudeRouteCompactOn" type="checkbox" ${r.autoCompactWindow ? "checked" : ""}><span class="claude-route-toggle__mark" aria-hidden="true"></span><span class="claude-route-toggle__copy"><strong>Auto-compact window</strong><small>Set a safe context threshold.</small></span></label>${numberControl({ id: "claudeRouteCompact", label: "Auto-compact token window", value: r.autoCompactWindow || 190000, min: 100000, max: 1000000, step: 10000, disabled: !r.autoCompactWindow })}</div>
        <label class="claude-route-toggle"><input id="claudeRouteTraffic" type="checkbox" ${checked(r.disableNonessentialTraffic, "disableNonessentialTraffic")}><span class="claude-route-toggle__mark" aria-hidden="true"></span><span class="claude-route-toggle__copy"><strong>Disable nonessential traffic</strong><small>Suppress optional gateway calls.</small></span></label>
      </div>
    </section>
    <fieldset class="claude-role-section claude-route-form-section claude-route-form-section--roles">
      <header class="claude-route-form-section__head"><div><p class="eyebrow">Claude model roles</p><legend>Assign role aliases</legend><p>Each role holds one model ID. Blank roles are left untouched.</p></div><span class="claude-route-form-index">03</span></header>
      <div class="claude-role-grid">${roleCards}</div>
      <label class="claude-route-toggle claude-route-toggle--wide"><input id="claudeRouteRestrict" type="checkbox" ${r.restrictModelPicker === false ? "" : "checked"}><span class="claude-route-toggle__mark" aria-hidden="true"></span><span class="claude-route-toggle__copy"><strong>Restrict the /model picker to this route's models</strong><small>Writes availableModels + enforceAvailableModels so /model shows only this route's models (enforcement needs Claude Code 2.1.175+).</small></span></label>
    </fieldset>
    <fieldset class="claude-compat-assistant claude-route-form-section claude-route-form-section--compat">
      <header class="claude-route-form-section__head"><div><p class="eyebrow">Gateway compatibility</p><legend>Compatibility assistant</legend><p>Recommendations are advisory; no gateway is contacted to generate them.</p></div><span class="claude-route-form-index">04</span></header>
      <div class="claude-compat-grid"><div class="field"><label for="claudeCompatModels">Does the gateway expose /v1/models?</label><select id="claudeCompatModels"><option value="unknown" selected>Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></div><div class="field"><label for="claudeCompatBetas">Does it accept Anthropic beta fields?</label><select id="claudeCompatBetas"><option value="unknown" selected>Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></div><div class="field"><label for="claudeCompatContext">Model context window (optional)</label>${numberControl({ id: "claudeCompatContext", label: "Model context window", min: 1, max: 1000000, step: 10000, start: 100000, placeholder: "e.g. 200000" })}</div></div>
      <label class="claude-route-toggle claude-route-toggle--wide"><input id="claudeCompatTraffic" type="checkbox"><span class="claude-route-toggle__mark" aria-hidden="true"></span><span class="claude-route-toggle__copy"><strong>Suppress nonessential traffic</strong><small>Use this when the gateway should receive only required calls.</small></span></label>
      <div class="claude-compat-actions"><button class="button button--outline button--small" type="button" data-compat-recommend>Show recommendations</button><button class="button button--secondary button--small" type="button" data-compat-apply disabled>Apply recommendations</button></div><div class="claude-compat-summary" data-compat-summary hidden></div>
      <label class="claude-route-toggle claude-route-toggle--wide"><input id="claudeRouteCompatConfirm" type="checkbox"><span class="claude-route-toggle__mark" aria-hidden="true"></span><span class="claude-route-toggle__copy"><strong>${COMPAT_CONFIRM_TEXT}</strong><small>Confirm before applying compatibility changes.</small></span></label>
    </fieldset>
    <p id="claudeRouteMessage" class="field-error" role="alert"></p>
  </form>`;
}

function valuesFrom(dialog) {
  const compactOn = dialog.querySelector("#claudeRouteCompactOn")?.checked ?? true;
  const roles = {};
  dialog.querySelectorAll("[data-role-model]").forEach(input => {
    const value = input.value.trim();
    if (value) roles[input.dataset.roleModel] = value;
  });
  return {
    name: dialog.querySelector("#claudeRouteName").value.trim(),
    baseUrl: dialog.querySelector("#claudeRouteUrl").value.trim(),
    authKind: dialog.querySelector("#claudeRouteAuthKind").value,
    secretEnvRef: dialog.querySelector("#claudeRouteSecretEnvRef").value.trim(),
    secretValue: dialog.querySelector("#claudeRouteSecret").value.trim(),
    model: dialog.querySelector("#claudeRouteModel").value.trim(),
    gatewayDiscovery: dialog.querySelector("#claudeRouteGateway").checked,
    disableExperimentalBetas: dialog.querySelector("#claudeRouteBetas").checked,
    autoCompactWindow: compactOn ? Number(dialog.querySelector("#claudeRouteCompact").value) : null,
    disableNonessentialTraffic: dialog.querySelector("#claudeRouteTraffic").checked,
    modelRoles: roles,
    restrictModelPicker: dialog.querySelector("#claudeRouteRestrict").checked,
  };
}

async function saveRoute(workspace, dialog, routeId, store) {
  const message = dialog.querySelector("#claudeRouteMessage");
  const body = valuesFrom(dialog);
  try {
    if (routeId) {
      const result = await api.updateClaudeRoute(routeId, { ...body, expectedRoutesRevision: store.routesRevision });
      notify("Route saved. Changes are not applied until you choose Apply.", "success");
    } else {
      await api.createClaudeRoute(body);
      notify("Route saved. Choose Apply route when ready.", "success");
    }
    dialog.querySelector("[data-dialog-close]").click();
    await rerenderClaudeRoutes(workspace);
  } catch (error) {
    message.textContent = error.message;
  }
}

export function openRouteEditor(workspace, route, trigger) {
  const { dialog, close } = openDialog({
    title: route ? `Edit ${route.name}` : "Add route",
    trigger,
    content: editorForm(route),
    actions: `<button class="button button--quiet" type="button" data-dialog-close>Cancel</button><button class="button button--primary" type="submit" form="claudeRouteForm">Save route</button>`,
    wide: true,
    onOpen(dialog) {
      dialog.classList.add("claude-route-dialog");
      const first = dialog.querySelector("#claudeRouteName");
      if (first) first.focus();
      const secretToggle = dialog.querySelector(".provider-secret button");
      secretToggle?.addEventListener("click", event => {
        const input = dialog.querySelector("#claudeRouteSecret");
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        event.currentTarget.setAttribute("aria-label", show ? "Hide API key" : "Show API key");
      });
      const compactOn = dialog.querySelector("#claudeRouteCompactOn");
      const compactInput = dialog.querySelector("#claudeRouteCompact");
      wireNumberControls(dialog);
      const syncCompact = () => {
        compactInput.disabled = !compactOn.checked;
        compactInput.closest("[data-number-control]")?.querySelectorAll("[data-number-step]").forEach(button => { button.disabled = compactInput.disabled; });
      };
      compactOn?.addEventListener("change", syncCompact);
      syncCompact();
      wireCompatibilityAssistant(dialog);
    },
  });
  dialog.querySelector("#claudeRouteForm").addEventListener("submit", async event => {
    event.preventDefault();
    const message = dialog.querySelector("#claudeRouteMessage");
    const store = await currentStore(workspace);
    if (route && !store.routesRevision) { message.textContent = "The saved routes could not be read."; return; }
    const confirmBox = dialog.querySelector("#claudeRouteCompatConfirm");
    if (!confirmBox || !confirmBox.checked) {
      message.textContent = "Review and confirm the compatibility settings before saving.";
      return;
    }
    await saveRoute(workspace, dialog, route?.id, store);
  });
}

function wireNumberControls(dialog) {
  dialog.querySelectorAll("[data-number-control]").forEach(control => {
    const input = control.querySelector("input[type=number]");
    if (!input) return;
    const stepValue = () => Number(input.step) || 1;
    const minValue = () => Number(input.min);
    const maxValue = () => Number(input.max);
    const adjust = direction => {
      if (input.disabled) return;
      const raw = input.value.trim();
      const current = Number(raw);
      if (raw === "" || !Number.isFinite(current)) {
        if (direction < 0) return;
        input.value = String(Number(input.dataset.numberStart) || minValue());
      } else {
        const next = current + direction * stepValue();
        input.value = String(Math.max(minValue(), Math.min(maxValue(), next)));
      }
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    control.querySelector('[data-number-step="up"]')?.addEventListener("click", () => adjust(1));
    control.querySelector('[data-number-step="down"]')?.addEventListener("click", () => adjust(-1));
    input.addEventListener("keydown", event => {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        adjust(event.key === "ArrowUp" ? 1 : -1);
      }
    });
  });
}

function wireCompatibilityAssistant(dialog) {
  const gateway = dialog.querySelector("#claudeRouteGateway");
  const betas = dialog.querySelector("#claudeRouteBetas");
  const compact = dialog.querySelector("#claudeRouteCompact");
  const traffic = dialog.querySelector("#claudeRouteTraffic");
  const models = dialog.querySelector("#claudeCompatModels");
  const betaFields = dialog.querySelector("#claudeCompatBetas");
  const context = dialog.querySelector("#claudeCompatContext");
  const suppress = dialog.querySelector("#claudeCompatTraffic");
  const summary = dialog.querySelector("[data-compat-summary]");
  const recommendBtn = dialog.querySelector("[data-compat-recommend]");
  const applyBtn = dialog.querySelector("[data-compat-apply]");

  const syncConflict = () => {
    if (traffic.checked && gateway.checked) {
      gateway.checked = false;
      gateway.disabled = true;
    } else if (traffic.checked) {
      gateway.disabled = true;
    } else {
      gateway.disabled = false;
    }
    if (gateway.checked && traffic.checked) {
      traffic.checked = false;
      traffic.disabled = true;
    } else if (gateway.checked) {
      traffic.disabled = true;
    } else {
      traffic.disabled = false;
    }
  };
  traffic.addEventListener("change", syncConflict);
  gateway.addEventListener("change", syncConflict);
  syncConflict();

  recommendBtn.addEventListener("click", () => {
    const recommendation = recommendClaudeCompatibility({
      hasModelsEndpoint: models.value,
      supportsBetaFields: betaFields.value,
      contextWindow: context.value,
      suppressNonessentialTraffic: suppress.checked,
    });
    const lines = recommendation.notes.map(note => `<p class="claude-compat-note claude-compat-note--${note.tone}">${escapeHtml(note.text)}</p>`).join("");
    summary.innerHTML = `<p class="claude-compat-benefit">Discovery: ${recommendation.values.gatewayDiscovery ? "on" : "off"} - Betas disabled: ${recommendation.values.disableExperimentalBetas ? "on" : "off"} - Compact: ${escapeHtml(String(recommendation.values.autoCompactWindow))} - Nonessential traffic: ${recommendation.values.disableNonessentialTraffic ? "suppressed" : "on"}</p>${lines}`;
    summary.hidden = false;
    applyBtn.disabled = false;
    applyBtn.dataset.values = JSON.stringify(recommendation.values);
  });

  applyBtn.addEventListener("click", () => {
    if (!applyBtn.dataset.values) return;
    const values = JSON.parse(applyBtn.dataset.values);
    gateway.checked = values.gatewayDiscovery;
    betas.checked = values.disableExperimentalBetas;
    compact.value = String(values.autoCompactWindow);
    traffic.checked = values.disableNonessentialTraffic;
    const compactOn = dialog.querySelector("#claudeRouteCompactOn");
    if (compactOn) {
      compactOn.checked = true;
      compactOn.dispatchEvent(new Event("change", { bubbles: true }));
    }
    syncConflict();
  });
}

export function openRouteDetails(workspace, routeId) {
  api.claudeRoutes().then(data => {
    const route = (data.routes || []).find(r => r.id === routeId);
    if (!route) { notify("That route doesn't exist anymore. Refresh the page.", "error"); return; }
    const applied = isApplied(route, data);
    const pending = hasPendingChanges(route, data);
    const statusLabel = applied ? "Applied" : pending ? "Changes not applied" : "Saved";
    const statusTone = applied ? "active" : pending ? "pending" : "neutral";
    const roleList = ["opus", "sonnet", "haiku", "fable"].filter(role => (route.modelRoles || {})[role]);
    const roleContent = roleList.length
      ? `<ul class="detail-chip-list">${roleList.map(role => `<li class="detail-chip"><span>${role[0].toUpperCase() + role.slice(1)}</span><span class="mono">${escapeHtml((route.modelRoles || {})[role])}</span></li>`).join("")}</ul>`
      : '<p class="detail-empty">No role-specific models assigned.</p>';
    const connection = detailSection("Connection", `<dl class="detail-grid"><div class="detail-field detail-field--wide"><dt>Endpoint</dt><dd class="mono">${escapeHtml(route.baseUrl || "—")}</dd></div><div class="detail-field"><dt>Auth strategy</dt><dd>${escapeHtml(route.authKind || "apiKey")}</dd></div><div class="detail-field"><dt>Environment reference</dt><dd class="mono">${escapeHtml(route.secretEnvRef || "—")}${route.envVarManaged ? ' <span class="claude-type-chip claude-type-chip--managed"><span class="claude-type-chip__dot" aria-hidden="true"></span>managed by Switcher</span>' : ""}</dd></div></dl>`);
    const models = detailSection("Models & roles", `<dl class="detail-grid"><div class="detail-field detail-field--wide"><dt>Main model</dt><dd class="mono">${escapeHtml(route.effectiveModel || route.model || "—")}${route.model ? "" : ' <span class="claude-type-chip claude-type-chip--roles"><span class="claude-type-chip__dot" aria-hidden="true"></span>from roles</span>'}</dd></div></dl>${roleContent}`, "detail-section--models");
    const policies = detailSection("Policies", `<dl class="detail-grid"><div class="detail-field"><dt>Gateway discovery</dt><dd>${route.gatewayDiscovery ? "On" : "Off"}</dd></div><div class="detail-field"><dt>Experimental betas</dt><dd>${route.disableExperimentalBetas ? "Disabled" : "Enabled"}</dd></div><div class="detail-field"><dt>Auto-compact window</dt><dd class="mono">${route.autoCompactWindow ? escapeHtml(String(route.autoCompactWindow)) : "Off"}</dd></div><div class="detail-field"><dt>Nonessential traffic</dt><dd>${route.disableNonessentialTraffic ? "Disabled" : "Enabled"}</dd></div><div class="detail-field detail-field--wide"><dt>Model picker</dt><dd>Picker ${route.restrictModelPicker === false ? "unrestricted" : "restricted to route models"}</dd></div></dl>`);
    openDialog({
      title: route.name,
      eyebrow: "Claude route details",
      variant: "details",
      headerMark: providerLogoMark(route.name, { id: route.id, size: "md" }),
      headerMeta: detailStatus(statusLabel, statusTone),
      trigger: document.activeElement,
      content: detailView({ summary: `${detailSummaryItem("Status", statusLabel, statusTone)}${detailSummaryItem("Model", route.effectiveModel || route.model || "Not assigned", route.effectiveModel || route.model ? "active" : "muted")}${detailSummaryItem("Roles", roleList.length ? `${roleList.length} assigned` : "None", roleList.length ? "active" : "muted")}`, sections: `${connection}${models}${policies}` }),
      actions: `<button class="button button--quiet" type="button" data-dialog-close>Close</button>`,
    });
  }).catch(error => notify(error.message, "error"));
}
