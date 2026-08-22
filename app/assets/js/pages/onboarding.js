import { api } from "../core/api.js";
import { escapeHtml } from "../core/dialog.js";

const approvedScreens = new Set(["agent", "review", "provider", "ready"]);
const screenOrder = ["agent", "review", "provider", "ready"];
const verifiedAgentNames = new Set(["opencode", "kilo"]);
const providerPresets = {
  litellm: { name: "LiteLLM", baseUrl: "http://localhost:4000/v1", npm: "@ai-sdk/openai-compatible", reasoningFormat: "opencode" },
  "cli-proxy": { name: "CLI Proxy", baseUrl: "http://localhost:PORT/v1", npm: "@ai-sdk/openai-compatible", reasoningFormat: "openai" },
  custom: { name: "Custom", baseUrl: "", npm: "@ai-sdk/openai-compatible", reasoningFormat: "opencode" },
};
const sdkOptions = [
  { value: "@ai-sdk/openai-compatible", label: "OpenAI-compatible (most servers)" },
  { value: "@ai-sdk/openai", label: "OpenAI" },
  { value: "@ai-sdk/anthropic", label: "Claude (Anthropic)" },
  { value: "@ai-sdk/google", label: "Gemini (Google)" },
  { value: "@ai-sdk/google-vertex", label: "Google Vertex AI" },
  { value: "@ai-sdk/azure", label: "Azure OpenAI" },
  { value: "@ai-sdk/amazon-bedrock", label: "Amazon Bedrock" },
  { value: "@ai-sdk/xai", label: "xAI (Grok)" },
  { value: "@ai-sdk/mistral", label: "Mistral" },
  { value: "@ai-sdk/groq", label: "Groq" },
  { value: "@ai-sdk/deepseek", label: "DeepSeek" },
  { value: "@ai-sdk/cohere", label: "Cohere" },
  { value: "@ai-sdk/fireworks", label: "Fireworks" },
  { value: "@ai-sdk/togetherai", label: "Together.ai" },
  { value: "@ai-sdk/deepinfra", label: "DeepInfra" },
  { value: "@ai-sdk/cerebras", label: "Cerebras" },
  { value: "@ai-sdk/perplexity", label: "Perplexity" },
  { value: "@openrouter/ai-sdk-provider", label: "OpenRouter" },
  { value: "__other__", label: "Other…" },
];
const formatOptions = [
  { value: "opencode", label: "OpenCode — default / minimal / high / max" },
  { value: "openai", label: "OpenAI — none / low / medium / high / xhigh" },
  { value: "claude", label: "Claude — low / high / max" },
  { value: "gemini", label: "Gemini — minimal / low / medium / high" },
  { value: "none", label: "No reasoning" },
];

let host;
let readyCallback;
let backToWelcome;
let currentScreen = "agent";
let chosenAgent = null;
let selectedKind = null;
let discoveredAgents = [];
let scanResult = null;
let scanResultSource = null;
let setupGuide = null;
let selectedProvider = "litellm";
let skippedProvider = false;
let transitionDirection = "still";

export function onboardingPreviewScreen(search = "") {
  const query = new URLSearchParams(search);
  if (query.get("preview") !== "onboarding") return null;
  const screen = query.get("screen") || "agent";
  return approvedScreens.has(screen) ? screen : "agent";
}

export function onboardingProgressState(screen = "agent") {
  if (screen === "provider") return { step: 3, completed: [1, 2] };
  if (screen === "ready") return { step: 4, completed: [1, 2, 3] };
  return { step: 2, completed: [1] };
}

export function onboardingSidebarState(screen = "agent") {
  return onboardingProgressState(screen);
}

export function onboardingTransitionDirection(from = "agent", to = "agent") {
  const fromIndex = screenOrder.indexOf(from);
  const toIndex = screenOrder.indexOf(to);
  if (fromIndex === toIndex) return "still";
  return toIndex > fromIndex ? "forward" : "backward";
}

function icon(name) {
  const icons = {
    check: '<svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-9"/></svg>',
    help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.55 2.55 0 1 1 3.7 2.28C12.4 11.76 12 12.3 12 13.2"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3 6h7l2 2h9v11H3z"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="12" rx="1"/><path d="M16 8V4H5v12h3"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.4-2.9 8.3-7 10-4.1-1.7-7-5.6-7-10V6z"/><path d="m9.2 12.1 2 2 3.8-4"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>',
    profile: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-5 3.5-7 8-7s7.2 2 8 7" fill="currentColor" stroke="none"/></svg>',
    plugin: '<svg viewBox="0 0 24 24"><path d="M20.5 11H19V7a2 2 0 0 0-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4a2 2 0 0 0-2 2v3.8h1.5a2.7 2.7 0 1 1 0 5.4H2V20a2 2 0 0 0 2 2h3.8v-1.5a2.7 2.7 0 1 1 5.4 0V22H17a2 2 0 0 0 2-2v-4h1.5a2.5 2.5 0 0 0 0-5Z" fill="currentColor"/></svg>',
    server: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="5" rx="1" fill="currentColor"/><rect x="3" y="10" width="18" height="5" rx="1" fill="currentColor"/><rect x="3" y="17" width="18" height="5" rx="1" fill="currentColor"/><path d="M17 5.5h1M17 12.5h1M17 19.5h1" stroke="white"/></svg>',
    cloud: '<svg viewBox="0 0 24 24"><path d="M7 19h11a4 4 0 0 0 .4-8A6.5 6.5 0 0 0 6 9.5 4.8 4.8 0 0 0 7 19Z" fill="currentColor"/></svg>',
  };
  return icons[name] || "";
}

function brandMarkup() {
  return '<div class="onboarding-brand"><img src="/assets/bdf-counterphase-logo.svg" alt=""><strong>Switcher</strong></div>';
}

function sidebarMarkup(screen) {
  const labels = ["Welcome", "Workspace", "Provider", "Complete"];
  const { step, completed } = onboardingSidebarState(screen);
  const steps = labels.map((label, index) => {
    const number = index + 1;
    const classes = completed.includes(number) ? "is-done" : number === step ? "is-current" : "";
    return `<li class="${classes}"><span>${completed.includes(number) ? icon("check") : String(number).padStart(2, "0")}</span><b>${label}</b></li>`;
  }).join("");
  return `<aside class="onboarding-rail">${brandMarkup()}<p class="onboarding-label">ONBOARDING</p><ol class="onboarding-rail-steps">${steps}</ol><div class="onboarding-privacy" role="note"><span>${icon("shield")}</span><p><strong>Private by default</strong><small>Your keys stay on your computer.<br>Prompts aren’t stored by Switcher.</small></p></div></aside>`;
}

function progressMarkup(screen) {
  const { step, completed } = onboardingProgressState(screen);
  return `<ol class="onboarding-top-progress" aria-label="Onboarding progress">${[1, 2, 3, 4].map(number => {
    const classes = completed.includes(number) ? "is-done" : number === step ? "is-current" : "";
    return `<li class="${classes}" aria-current="${number === step ? "step" : "false"}"><span>${completed.includes(number) ? icon("check") : String(number).padStart(2, "0")}</span></li>`;
  }).join("")}</ol>`;
}

function shellMarkup(screen, body, footer) {
  return `<div class="onboarding-frame"><div class="onboarding-window">${sidebarMarkup(screen)}<main class="onboarding-stage onboarding-slide--${transitionDirection}">${progressMarkup(screen)}<section class="onboarding-content" aria-labelledby="startupTitle">${body}</section><p id="onboardingMessage" class="onboarding-message" role="alert"></p><footer class="onboarding-footer">${footer}</footer></main></div></div>`;
}

function agentIcon(id) {
  if (id === "opencode") return '<span class="agent-tile agent-tile--brand" aria-hidden="true"><img src="/assets/brands/opencode.svg" alt=""></span>';
  if (id === "kilo") return '<span class="agent-tile agent-tile--brand" aria-hidden="true"><img src="/assets/brands/kilocode.svg" alt=""></span>';
  if (id === "claudecode" || id === "claude-code") return '<span class="agent-tile agent-tile--claude" aria-hidden="true"><img src="/assets/brands/claudecode.svg" alt=""></span>';
  return `<span class="agent-tile agent-tile--manual" aria-hidden="true">${icon("folder")}</span>`;
}

function agentScreenMarkup() {
  const cards = discoveredAgents.map(agent => `<button class="agent-choice" type="button" data-agent-id="${escapeHtml(agent.id)}" aria-pressed="${chosenAgent?.id === agent.id && selectedKind === "detected"}">${agentIcon(agent.id)}<span class="agent-copy"><strong>${escapeHtml(agent.name)} <em>· Detected</em></strong><small>${escapeHtml(agent.path)}</small></span><span class="choice-radio" aria-hidden="true"></span></button>`).join("");
  const continueDisabled = selectedKind ? "" : "disabled";
  const note = scanResult && scanResultSource && chosenAgent && scanResultSource.id === chosenAgent.id && scanResultSource.dir === chosenAgent.path
    ? `<p class="agent-scan-note">Scanned ${escapeHtml(chosenAgent.name)}: ${(scanResult.providers || []).length} providers · ${(scanResult.mcps || []).length} MCP servers · ${(scanResult.plugins || []).length} plugins</p>`
    : "";  return shellMarkup("agent", `<h1 id="startupTitle">Connect your agent</h1><p class="onboarding-step-count">02 of 04</p><p class="onboarding-intro">Choose an AI coding agent already installed on this computer.</p><div class="agent-choices">${cards || '<p class="agent-empty">Looking for your agents…</p>'}<button id="manualAgentChoice" class="agent-choice" type="button" aria-pressed="${selectedKind === "manual"}">${agentIcon("manual")}<span class="agent-copy"><strong>Choose a folder manually</strong><small>Select a different agent folder</small></span><span class="choice-radio" aria-hidden="true"></span><span class="choice-chevron" aria-hidden="true">›</span></button></div>${note}<div id="manualDialog" class="onboarding-dialog" hidden><div class="onboarding-dialog-card" role="dialog" aria-modal="true" aria-labelledby="manualDialogTitle"><h2 id="manualDialogTitle">Choose a folder manually</h2><p class="onboarding-dialog-copy">Point to the config folder of an AI coding agent on this computer.</p><label for="manualAgentPath">Agent folder</label><div class="onboarding-input"><input id="manualAgentPath" type="text" placeholder="C:\\Users\\you\\.config\\opencode" autocomplete="off"></div><p id="manualDialogError" class="onboarding-dialog-error" role="alert"></p><div class="onboarding-dialog-actions"><button id="manualCancel" class="onboarding-button onboarding-button--outline" type="button">Cancel</button><button id="manualConfirm" class="onboarding-button onboarding-button--primary" type="button">Use this folder</button></div></div></div>`, `<button id="onboardingBack" class="onboarding-button onboarding-button--outline" type="button">Back</button><button id="agentContinue" class="onboarding-button onboarding-button--primary" type="button" ${continueDisabled}>Continue</button>`);
}

function summaryCard(kind, label, count) {
  return `<article class="scan-card scan-card--${kind}"><span>${icon(kind)}</span><strong>${label}</strong><b>${count}</b><small>found</small></article>`;
}

function reviewScreenMarkup() {
  const profileCount = scanResult?.profiles?.length ?? 0;
  const pluginCount = scanResult?.plugins?.length ?? 0;
  const mcpCount = scanResult?.mcps?.length ?? 0;
  const providerCount = scanResult?.providers?.length ?? 0;
  return shellMarkup("review", `<h1 id="startupTitle">Review your workspace</h1><p class="onboarding-step-count">02 of 04</p><p class="onboarding-intro">We scanned your agent workspace. This is a read-only summary.</p><div class="scan-grid">${summaryCard("profile", "Profiles", profileCount)}${summaryCard("plugin", "Plugins", pluginCount)}${summaryCard("server", "MCP servers", mcpCount)}${summaryCard("cloud", "Providers", providerCount)}</div><div class="onboarding-notice">${icon("info")}<span>Nothing will be changed until you approve.</span></div>`, `<button id="reviewBack" class="onboarding-button onboarding-button--outline" type="button">Back</button><button id="useWorkspace" class="onboarding-button onboarding-button--primary" type="button">Use this workspace</button>`);
}

function providerLogo(id) {
  if (id === "litellm" || id === "cli-proxy") {
    const files = { litellm: "litellm.png", "cli-proxy": "cli-proxy.svg" };
    return `<span class="provider-glyph provider-glyph--img" aria-hidden="true"><img src="/assets/brands/${files[id]}" alt=""></span>`;
  }
  return `<span class="provider-glyph provider-glyph--${id}" aria-hidden="true">＋</span>`;
}

function existingProvidersMarkup() {
  const providers = scanResult?.providers || [];
  if (!providers.length) return "";
  const active = new Set(scanResult?.activeProviders || []);
  const chips = providers.map(id => `<span class="provider-chip"><b>${escapeHtml(id)}</b><em class="${active.has(id) ? "is-active" : ""}">${active.has(id) ? "active" : "not active"}</em></span>`).join("");
  return `<div class="existing-providers" aria-label="Providers found in your config">${chips}</div>`;
}

function modelRowsMarkup(count = 1) {
  let rows = "";
  for (let index = 0; index < count; index += 1) {
    rows += `<div class="model-row"><div class="onboarding-input"><input type="text" placeholder="model-id" aria-label="Model ID" autocomplete="off"></div><div class="onboarding-input"><input type="text" placeholder="Display name" aria-label="Model display name" autocomplete="off"></div><button type="button" class="model-row-remove" aria-label="Remove model">×</button></div>`;
  }
  return rows;
}

function providerScreenMarkup() {
  const isCustom = selectedProvider === "custom";
  const existingIds = (scanResult?.providers || []).map(provider => String(provider).toLowerCase());
  const presets = Object.entries(providerPresets).filter(([id]) => id === "custom" || !existingIds.some(name => name.includes(id) || id.includes(name)));
  if (!presets.some(([id]) => id === selectedProvider)) selectedProvider = presets[0].id;
  const choices = presets.map(([id, provider]) => `<button class="first-provider-choice" type="button" data-first-provider="${id}" aria-pressed="${selectedProvider === id}">${providerLogo(id)}<strong>${provider.name}</strong><span class="choice-radio" aria-hidden="true"></span></button>`).join("");
  const preset = providerPresets[selectedProvider];
  const customRow = isCustom ? `<div class="fp-grid3"><div class="onboarding-input"><input id="firstProviderId" type="text" placeholder="Provider ID (my-provider)" aria-label="Provider ID" autocomplete="off"></div><div class="onboarding-input"><input id="firstProviderName" type="text" placeholder="Display name (My AI Provider)" aria-label="Display name" autocomplete="off"></div><div class="onboarding-input"><input id="firstProviderUrl" type="text" placeholder="https://api.example.com/v1" aria-label="Base URL" autocomplete="off"></div></div>` : "";
  const urlRow = isCustom ? "" : `<div class="fp-grid3"><div class="onboarding-input"><input id="firstProviderUrl" type="text" value="${escapeHtml(selectedProvider === "cli-proxy" ? "http://localhost:PORT/v1" : preset.baseUrl)}" aria-label="Base URL" autocomplete="off"></div><div class="onboarding-select"><select id="firstProviderSdk" aria-label="SDK type">${sdkOptions.map(option => `<option value="${option.value}" ${option.value === preset.npm ? "selected" : ""}>${option.label}</option>`).join("")}</select></div><div class="onboarding-select"><select id="firstProviderFormat" aria-label="Reasoning format">${formatOptions.map(option => `<option value="${option.value}" ${option.value === preset.reasoningFormat ? "selected" : ""}>${option.label}</option>`).join("")}</select></div></div>`;
  const customRow2 = isCustom ? `<div class="fp-grid3"><div class="onboarding-select"><select id="firstProviderSdk" aria-label="SDK type">${sdkOptions.map(option => `<option value="${option.value}" ${option.value === preset.npm ? "selected" : ""}>${option.label}</option>`).join("")}</select></div><div class="onboarding-select"><select id="firstProviderFormat" aria-label="Reasoning format">${formatOptions.map(option => `<option value="${option.value}" ${option.value === preset.reasoningFormat ? "selected" : ""}>${option.label}</option>`).join("")}</select></div><div class="onboarding-input"><input id="firstProviderKey" type="password" placeholder="API key" aria-label="API key" autocomplete="off"><button id="toggleFirstKey" type="button" aria-label="Show API key">${icon("eye")}</button></div></div>` : "";
  const keyRow = isCustom ? "" : `<div class="fp-grid3"><div class="onboarding-input"><input id="firstProviderKey" type="password" placeholder="API key" aria-label="API key" autocomplete="off"><button id="toggleFirstKey" type="button" aria-label="Show API key">${icon("eye")}</button></div></div>`;
  const modelsSection = `<div class="models-section"><label>Models</label><div id="modelRows">${modelRowsMarkup(1)}</div><button id="addModel" type="button" class="model-add">＋ Add model</button></div>`;
  return shellMarkup("provider", `<h1 id="startupTitle">Add your first provider</h1><p class="onboarding-step-count">03 of 04</p><p class="onboarding-intro">Add a provider to power your agent with models.</p>${isCustom ? "" : existingProvidersMarkup()}<div class="first-provider-grid" ${isCustom ? "hidden" : ""}>${choices}</div><form id="firstProviderForm" class="first-provider-form">${customRow}${urlRow}${customRow2}${keyRow}${modelsSection}<div class="provider-actions"><button id="testFirstProvider" class="onboarding-button onboarding-button--outline" type="button">Test connection</button><button class="onboarding-button onboarding-button--primary" type="submit">Save and continue</button></div></form>`, `<button id="providerBack" class="onboarding-button onboarding-button--outline" type="button">Back</button><button id="providerSkip" class="onboarding-button onboarding-button--quiet" type="button">Skip for now</button>`);
}

function readyScreenMarkup() {
  // Only claim a provider is active if the user actually added one in this
  // onboarding session. A skipped wizard or an already-imported workspace
  // must never invent "LiteLLM active" (the default preset).
  const addedProvider = !skippedProvider && selectedKind === "provider-added";
  const providerLine = addedProvider
    ? `<p><span class="ready-check">${icon("check")}</span>${escapeHtml(providerPresets[selectedProvider].name)} active</p>`
    : `<p><span class="ready-check is-neutral">${icon("info")}</span>Your providers stay as configured - manage them from the dashboard</p>`;
  const guide = setupGuide ? setupGuideMarkup(setupGuide) : "";
  return shellMarkup("ready", `<h1 id="startupTitle">You’re ready</h1><p class="onboarding-step-count">04 of 04</p><p class="onboarding-intro">All set! Here's a quick summary.</p><div class="ready-summary"><p><span class="ready-check">${icon("check")}</span>${escapeHtml(chosenAgent?.name || "Agent")} connected</p>${providerLine}<p><span class="ready-check">${icon("check")}</span>Local proxy online</p></div><label class="endpoint-label" for="localEndpoint">Local proxy endpoint</label><div class="endpoint-field"><code id="localEndpoint">127.0.0.1:9090</code><button id="copyEndpoint" type="button" aria-label="Copy local proxy endpoint">${icon("copy")}</button></div>${guide}`, `<p class="ready-privacy">${icon("lock")}<span>Your keys stay on this computer.</span></p><button id="openDashboard" class="onboarding-button onboarding-button--primary" type="button">Open dashboard <span aria-hidden="true">→</span></button>`);
}

function setupGuideMarkup(verify) {
  const providerRows = (verify.providers || []).map(p => `<li class="setup-guide-row"><span class="setup-guide-state ${p.ok ? "is-ok" : "is-bad"}">${p.ok ? "✓" : "✗"}</span><strong>${escapeHtml(p.name || p.id)}</strong><span class="setup-guide-msg">${escapeHtml(p.message || (p.ok ? "Connected" : "Failed"))}</span></li>`).join("");
  const mainState = verify.mainJson?.ok ? "✓" : "✗";
  const mcpState = verify.mcp?.ok ? "✓" : "✗";
  const pluginState = verify.plugins?.ok ? "✓" : "✗";
  return `<div class="setup-guide">
    <h3>Everything checked - here's how to use it</h3>
    <p class="setup-guide-intro">We imported your providers, models, MCP servers and plugins, built your config, and tested the connections. Here's what passed:</p>
    <ul class="setup-guide-checks">
      <li><span class="setup-guide-state ${verify.mainJson?.ok ? "is-ok" : "is-bad"}">${mainState}</span> Main config generated (${escapeHtml(verify.mainJson?.path || "config")})</li>
      <li><span class="setup-guide-state ${verify.mcp?.ok ? "is-ok" : "is-bad"}">${mcpState}</span> MCP servers in the config</li>
      <li><span class="setup-guide-state ${verify.plugins?.ok ? "is-ok" : "is-bad"}">${pluginState}</span> Plugins in the config</li>
    </ul>
    <ul class="setup-guide-providers">${providerRows || '<li class="setup-guide-row"><span class="setup-guide-msg">No providers found yet - add one from the dashboard.</span></li>'}</ul>
    <ol class="setup-guide-steps">
      <li><strong>Open the dashboard</strong> - your providers and models are already there.</li>
      <li><strong>Test connections</strong> anytime from the Providers page (the Test button).</li>
      <li><strong>Add more providers</strong> from the dashboard - pick a preset, paste your key, done.</li>
      <li><strong>Add MCP servers or plugins</strong> from Integrations (local, remote, or expert JSON).</li>
      <li><strong>Rebuild anytime</strong> with the Build button - your config regenerates from the profiles.</li>
    </ol>
    <p class="setup-guide-note">If something ever looks broken, the app keeps automatic backups and can roll back for you - you never have to edit JSON by hand.</p>
  </div>`;
}

export function onboardingScreenMarkup(screen = "agent") {
  if (screen === "review") return reviewScreenMarkup();
  if (screen === "provider") return providerScreenMarkup();
  if (screen === "ready") return readyScreenMarkup();
  return agentScreenMarkup();
}

let messageTimer;
function setMessage(message = "", isError = false) {
  const element = host?.querySelector("#onboardingMessage");
  if (!element) return;
  clearTimeout(messageTimer);
  element.textContent = message;
  element.classList.toggle("is-error", isError);
  if (!message) { element.classList.remove("is-visible"); return; }
  element.classList.add("is-visible");
  messageTimer = setTimeout(() => element.classList.remove("is-visible"), 3500);
}

function render(screen) {
  const nextScreen = approvedScreens.has(screen) ? screen : "agent";
  transitionDirection = onboardingTransitionDirection(currentScreen, nextScreen);
  currentScreen = nextScreen;
  host.innerHTML = onboardingScreenMarkup(currentScreen);
  bindScreen();
}

async function loadDiscovery() {
  try {
    const discovery = await api.discover({});
    const verified = (discovery.agents || []).filter(agent => verifiedAgentNames.has(agent.name));
    discoveredAgents = verified.map(agent => ({ id: agent.name, name: agent.name === "opencode" ? "OpenCode" : "KiloCode", path: agent.dir, detected: true, raw: agent }));
    // Claude Code is a separate page, not a detected provider: the tile is
    // always offered and its scan reads only app-owned saved-route state.
    discoveredAgents = [...discoveredAgents, { id: "claude-code", name: "Claude Code", path: "", detected: true, raw: { name: "claude-code" } }];
  } catch {
    setMessage("Could not scan for agents. Use the manual folder option.", true);
  }
  if (currentScreen === "agent") render("agent");
}

async function scanChosenAgent(agent) {
  let resolved = agent;
  if (!resolved.detected) {
    const discovery = await api.discover({ path: resolved.path });
    const candidate = discovery.chosen || discovery.agents?.[0];
    if (!candidate) throw new Error("No supported local coding agent was found.");
    resolved = { id: "manual", name: candidate.name === "opencode" ? "OpenCode" : candidate.name, path: candidate.dir, detected: false, raw: candidate };
  }
  chosenAgent = resolved;
  if (resolved.id === "claude-code") {
    let probe = null;
    try { probe = await api.claudeScan(); } catch { probe = null; }
    scanResult = probe || { agent: "claude-code", split: false, mcps: [], plugins: [], providers: [], activeProviders: [], hasBuilder: false, savedRoutes: 0 };
    scanResultSource = { id: "claude-code", dir: "" };
    return resolved;
  }
  let result = await api.scan({ agent: resolved.id, dir: resolved.path });
  if (!result.split) {
    setMessage("Setting up your agent workspace (profiles, MCP, plugins)…");
    const setup = await api.scaffold({ agent: resolved.id, dir: resolved.path });
    if (!setup.ok) throw new Error(setup.message || "Workspace setup did not complete.");
    result = await api.scan({ agent: resolved.id, dir: resolved.path });
  }
  scanResult = result;
  scanResultSource = { id: resolved.id, dir: resolved.path };
  return resolved;
}

function bindAgentScreen() {
  host.querySelectorAll("[data-agent-id]").forEach(button => button.addEventListener("click", async () => {
    const agent = discoveredAgents.find(candidate => candidate.id === button.dataset.agentId);
    if (!agent) return;
    chosenAgent = agent;
    selectedKind = "detected";
    render("agent");
    setMessage("Scanning your agent workspace…");
    try {
      await scanChosenAgent(agent);
      if (currentScreen === "agent") render("agent");
    } catch (error) { setMessage(error.message, true); }
  }));
  host.querySelector("#manualAgentChoice").addEventListener("click", openManualDialog);
  host.querySelector("#manualDialog").addEventListener("click", event => { if (event.target.id === "manualDialog") closeManualDialog(); });
  host.querySelector("#manualCancel").addEventListener("click", closeManualDialog);
  host.querySelector("#manualConfirm").addEventListener("click", confirmManualFolder);
  host.querySelector("#onboardingBack").addEventListener("click", () => backToWelcome?.());
  host.querySelector("#agentContinue").addEventListener("click", continueFromAgent);
}

function openManualDialog() {
  const dialog = host.querySelector("#manualDialog");
  dialog.hidden = false;
  host.querySelector("#manualDialogError").textContent = "";
  host.querySelector("#manualAgentPath").focus();
  if (manualDialogKeyHandler) document.removeEventListener("keydown", manualDialogKeyHandler);
  manualDialogKeyHandler = event => {
    if (event.key !== "Escape") return;
    closeManualDialog();
  };
  document.addEventListener("keydown", manualDialogKeyHandler);
}

let manualDialogKeyHandler = null;

function closeManualDialog() {
  const dialog = host.querySelector("#manualDialog");
  if (dialog) dialog.hidden = true;
  if (manualDialogKeyHandler) {
    document.removeEventListener("keydown", manualDialogKeyHandler);
    manualDialogKeyHandler = null;
  }
}

async function confirmManualFolder() {
  const error = host.querySelector("#manualDialogError");
  const input = host.querySelector("#manualAgentPath");
  const path = input.value.trim();
  if (!path) { error.textContent = "Enter a folder path first."; return; }
  error.textContent = "";
  try {
    const discovery = await api.discover({ path });
    const candidate = discovery.chosen || discovery.agents?.[0];
    if (!candidate) throw new Error("No supported local coding agent was found.");
    const agent = { id: "manual", name: candidate.name === "opencode" ? "OpenCode" : candidate.name, path: candidate.dir, detected: false, raw: candidate };
    chosenAgent = agent;
    selectedKind = "manual";
    closeManualDialog();
    render("agent");
    setMessage("Scanning your agent workspace…");
    try { await scanChosenAgent(agent); if (currentScreen === "agent") render("agent"); }
    catch (problem) { setMessage(problem.message, true); }
  } catch (problem) { error.textContent = problem.message; }
}

async function continueFromAgent() {
  if (!chosenAgent) return;
  try {
    let agent = chosenAgent;
    if (!agent.detected) {
      const discovery = await api.discover({ path: agent.path });
      const candidate = discovery.chosen || discovery.agents?.[0];
      if (!candidate) throw new Error("No supported local coding agent was found.");
      agent = { id: "manual", name: candidate.name === "opencode" ? "OpenCode" : candidate.name, path: candidate.dir, detected: false, raw: candidate };
    }
    const source = { id: agent.id, dir: agent.path };
    if (agent.id === "claude-code") {
      if (!scanResult || !scanResultSource || scanResultSource.id !== source.id) await scanChosenAgent(agent);
      render("review");
      return;
    }
    if (!scanResult || !scanResultSource || scanResultSource.id !== source.id || scanResultSource.dir !== source.dir) {
      setMessage("Scanning your local agent workspace…");
      scanResult = await api.scan({ agent: source.id, dir: source.dir });
      scanResultSource = source;
    }
    render("review");
  } catch (error) { setMessage(error.message, true); }
}

function bindReviewScreen() {
  host.querySelector("#reviewBack").addEventListener("click", () => render("agent"));
  host.querySelector("#useWorkspace").addEventListener("click", useWorkspace);
}

async function useWorkspace() {
  const button = host.querySelector("#useWorkspace");
  const freshSetup = !scanResult?.hasBuilder;   // true only for first-time setup
  button.disabled = true;
  setMessage(freshSetup ? "Generating the local builder…" : "Connecting this workspace…");
  setupGuide = null;                            // never leak a previous guide
  try {
    const agent = chosenAgent?.raw || { name: "opencode", dir: chosenAgent?.path || "" };
    if (agent.name === "claude-code" || chosenAgent?.id === "claude-code") {
      setMessage("Connecting Claude Code…");
      const connect = await api.claudeConnect();
      if (!connect.ok) throw new Error(connect.message || "Claude Code could not be connected.");
      render("ready");
      return;
    }
    if (freshSetup) {
      const result = await api.scaffold({ agent: agent.name, dir: agent.dir });
      if (!result.ok) throw new Error(result.message || "Builder generation did not complete.");
    }
    try {
      const registry = await api.agents();
      const known = (registry.agents || []).some(entry => entry.name === agent.name);
      if (known) await api.switchAgent(agent.name);
      else await api.addAgent({ name: agent.name, dir: agent.dir });
    } catch { /* registry unreachable — continue without registering */ }

    // The verify + auto-revert + guide are for FIRST-TIME setup only.
    // Returning users already have a working config - just continue.
    if (!freshSetup) { render("provider"); return; }

    // Post-setup health check: test every provider + confirm the generated
    // main config carries providers, MCPs and plugins.
    setMessage("Checking everything works…");
    let verify = null;
    try { verify = await api.verifySetup(); } catch { /* backend too old — skip check */ }
    if (verify && !verify.ok) {
      // Something failed - put the config back automatically so the user is
      // never left with a half-broken setup (no manual backup digging).
      let reverted = null;
      try { reverted = await api.revertSetup(); } catch { /* revert unavailable */ }
      button.disabled = false;
      setMessage(
        reverted?.ok
          ? `Setup was rolled back automatically: ${reverted.message} The imported files stay in profiles/ and providers/ so you can fix them.`
          : "Some checks failed. Your config was left in place - check the providers and try again.",
        true,
      );
      return;
    }
    if (verify) {
      setupGuide = verify;
      render("ready");
      return;
    }
    render("provider");
  } catch (error) { button.disabled = false; setMessage(error.message, true); }
}

function bindModelRowRemove(row) {
  row.querySelector(".model-row-remove").addEventListener("click", () => row.remove());
}

function bindProviderScreen() {
  host.querySelectorAll("[data-first-provider]").forEach(button => button.addEventListener("click", () => {
    selectedProvider = button.dataset.firstProvider;
    render("provider");
  }));
  host.querySelector("#toggleFirstKey").addEventListener("click", event => {
    const input = host.querySelector("#firstProviderKey");
    input.type = input.type === "password" ? "text" : "password";
    event.currentTarget.setAttribute("aria-label", input.type === "password" ? "Show API key" : "Hide API key");
  });
  host.querySelector("#firstProviderSdk")?.addEventListener("change", event => {
    if (event.target.value !== "__other__") return;
    const cell = event.target.closest(".onboarding-select");
    const input = document.createElement("input");
    input.id = "firstProviderSdk";
    input.type = "text";
    input.placeholder = "@ai-sdk/openai-compatible";
    input.autocomplete = "off";
    input.className = "onboarding-sdk-other";
    input.value = "@ai-sdk/";
    cell.replaceWith(input);
    input.focus();
  });
  host.querySelectorAll("#modelRows .model-row").forEach(bindModelRowRemove);
  host.querySelector("#addModel").addEventListener("click", () => {
    const rows = host.querySelector("#modelRows");
    rows.insertAdjacentHTML("beforeend", modelRowsMarkup(1));
    const row = rows.lastElementChild;
    bindModelRowRemove(row);
    row.querySelector("input").focus();
  });
  host.querySelector("#providerBack").addEventListener("click", () => render("review"));
  host.querySelector("#providerSkip").addEventListener("click", () => { skippedProvider = true; render("ready"); });
  host.querySelector("#testFirstProvider").addEventListener("click", testFirstProvider);
  host.querySelector("#firstProviderForm").addEventListener("submit", saveFirstProvider);
}

function selectedSdk() {
  const preset = providerPresets[selectedProvider];
  const element = host?.querySelector("#firstProviderSdk");
  if (!element) return preset.npm;
  const value = element.value || element.dataset?.npm || "";
  return value === "__other__" ? preset.npm : value;
}

function customBaseUrl() {
  if (selectedProvider !== "custom") return providerPresets[selectedProvider].baseUrl;
  return host?.querySelector("#firstProviderUrl")?.value.trim() || "";
}

async function testFirstProvider() {
  const baseUrl = customBaseUrl();
  if (!baseUrl) { setMessage("The base URL can't be empty.", true); return; }
  setMessage("Testing connection…");
  try {
    const result = await api.testProvider({ baseUrl, apiKey: host.querySelector("#firstProviderKey").value.trim() });
    setMessage(result.message || "Connection successful.");
  } catch (error) { setMessage(error.message, true); }
}

async function saveFirstProvider(event) {
  event.preventDefault();
  const preset = providerPresets[selectedProvider];
  const isCustom = selectedProvider === "custom";
  const baseUrl = customBaseUrl();
  if (!baseUrl) { setMessage("The base URL can't be empty.", true); return; }
  let id = "";
  let name = preset.name;
  if (isCustom) {
    id = (host.querySelector("#firstProviderId")?.value || "").trim();
    name = (host.querySelector("#firstProviderName")?.value || "").trim() || id;
    if (!id) { setMessage("Give your provider an ID first.", true); return; }
    if (!/^[a-z0-9_-]+$/.test(id)) { setMessage("Provider ID: lowercase letters, numbers, hyphens, or underscores only.", true); return; }
    if (!name) { setMessage("Give your provider a display name.", true); return; }
  }
  const key = host.querySelector("#firstProviderKey").value.trim();
  const format = host.querySelector("#firstProviderFormat")?.value || preset.reasoningFormat;
  const models = [...host.querySelectorAll("#modelRows .model-row")].map(row => {
    const inputs = row.querySelectorAll("input");
    const model = inputs[0].value.trim();
    const display = inputs[1].value.trim();
    return model ? { model, name: display || model } : null;
  }).filter(Boolean);
  setMessage("Saving provider…");
  try {
    const created = await api.createProvider({ ...preset, id, name, baseUrl, npm: selectedSdk(), apiKey: key, reasoningFormat: format, models, activate: false });
    await api.switchProvider(created.id);
    selectedKind = "provider-added";
    render("ready");
  } catch (error) { setMessage(error.message, true); }
}

function bindReadyScreen() {
  host.querySelector("#copyEndpoint").addEventListener("click", async () => {
    await navigator.clipboard?.writeText("127.0.0.1:9090");
    setMessage("Endpoint copied.");
  });
  host.querySelector("#openDashboard").addEventListener("click", () => readyCallback?.());
}

function bindScreen() {
  if (currentScreen === "agent") bindAgentScreen();
  else if (currentScreen === "review") bindReviewScreen();
  else if (currentScreen === "provider") bindProviderScreen();
  else bindReadyScreen();
}

export function initOnboarding(element, onReady, { screen = "agent", preview = false, onBack = null } = {}) {
  host = element;
  readyCallback = onReady;
  backToWelcome = onBack;
  host.hidden = false;
  render(screen);
  if (currentScreen === "agent") loadDiscovery();
}
