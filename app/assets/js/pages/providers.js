import { api, optional } from "../core/api.js";
import { store } from "../core/store.js";
import { confirmAction, detailSection, detailStatus, detailSummaryItem, detailView, escapeHtml, notify, openDialog } from "../core/dialog.js";
import { isClaude } from "../core/capabilities.js";
import { providerLogoMark } from "../core/provider-logo.js";
import { renderProviderWorkspace } from "./provider-workspace.js";
import { renderClaudeRoutes } from "./claude-routes.js";

const presets = {
  "OmniRoute": { baseUrl: "http://localhost:20128/v1", npm: "@ai-sdk/openai-compatible", reasoningFormat: "opencode" },
  "LiteLLM": { baseUrl: "http://localhost:4000/v1", npm: "@ai-sdk/openai-compatible", reasoningFormat: "opencode" },
  "CLI Proxy": { baseUrl: "http://localhost:PORT/v1", npm: "@ai-sdk/openai-compatible", reasoningFormat: "openai" },
  "TokenRouter": { baseUrl: "https://api.tokenrouter.com/v1", npm: "@ai-sdk/openai-compatible", reasoningFormat: "opencode" },
  "OpenAI": { baseUrl: "https://api.openai.com/v1", npm: "@ai-sdk/openai", reasoningFormat: "openai" },
  "Google (Gemini)": { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", npm: "@ai-sdk/openai-compatible", reasoningFormat: "gemini" },
  "OpenRouter": { baseUrl: "https://openrouter.ai/api/v1", npm: "@openrouter/ai-sdk-provider", reasoningFormat: "opencode" },
  "NVIDIA NIM": { baseUrl: "https://integrate.api.nvidia.com/v1", npm: "@ai-sdk/openai-compatible", reasoningFormat: "opencode" },
  "Custom": { baseUrl: "", npm: "@ai-sdk/openai-compatible", reasoningFormat: "opencode" }
};

const SDK_OPTIONS = [
  { npm: "@ai-sdk/openai-compatible", label: "OpenAI compatible" },
  { npm: "@ai-sdk/openai", label: "OpenAI" },
  { npm: "@ai-sdk/anthropic", label: "Anthropic (Claude)" },
  { npm: "@ai-sdk/google", label: "Google (Gemini)" },
  { npm: "@ai-sdk/google-vertex", label: "Google Vertex AI" },
  { npm: "@ai-sdk/azure", label: "Azure OpenAI" },
  { npm: "@ai-sdk/amazon-bedrock", label: "Amazon Bedrock" },
  { npm: "@ai-sdk/xai", label: "xAI (Grok)" },
  { npm: "@ai-sdk/mistral", label: "Mistral" },
  { npm: "@ai-sdk/groq", label: "Groq" },
  { npm: "@ai-sdk/deepseek", label: "DeepSeek" },
  { npm: "@ai-sdk/cohere", label: "Cohere" },
  { npm: "@ai-sdk/fireworks", label: "Fireworks" },
  { npm: "@ai-sdk/togetherai", label: "Together.ai" },
  { npm: "@ai-sdk/deepinfra", label: "DeepInfra" },
  { npm: "@ai-sdk/cerebras", label: "Cerebras" },
  { npm: "@ai-sdk/perplexity", label: "Perplexity" },
  { npm: "@openrouter/ai-sdk-provider", label: "OpenRouter" },
];

export function providerState(provider, activeProvider) {
  if (provider.id === activeProvider) return "primary";
  return provider.active ? "included" : "available";
}

export const nextProviderStep = (step, delta) => Math.max(0, Math.min(4, step + delta));
export const canSubmitProviderStep = step => step === 4;
export const providerReviewData = value => ({ name: value.name, baseUrl: value.baseUrl, format: value.reasoningFormat || "opencode", models: (value.models || []).map(model => model.model).join(", ") || "None", key: value.apiKey ? "Present" : "Not provided" });
export async function switchProviderAgent(apiClient, nextAgent, currentAgent) {
  if (nextAgent === currentAgent) return false;
  if (nextAgent === "claude-code") await apiClient.claudeConnect();
  else await apiClient.switchAgent(nextAgent);
  return true;
}

async function loadProviders() {
  const [providerData, formatData] = await Promise.all([api.providers(), optional(() => api.formats(), { formats: [] })]);
  store.set({ providers: providerData.providers || [], activeProvider: providerData.activeProvider || null, formats: formatData.formats || [] });
  return store.get().providers;
}

function card(provider) {
  const test = store.get().providerTests[provider.id];
  const state = providerState(provider, store.get().activeProvider);
  const label = state === "primary" ? "Primary route" : state === "included" ? "Included in build" : test === "ok" ? "Last test passed" : test === "fail" ? "Last test failed" : "Available";
  return `<article class="card provider-card card--interactive ${state === "primary" ? "is-active" : state === "included" ? "is-included" : ""}" data-provider="${escapeHtml(provider.id)}"><span class="status"><span class="status-dot ${test === "ok" || state === "primary" ? "status-dot--ok" : test === "fail" ? "status-dot--error" : ""}"></span>${label}</span><h2>${escapeHtml(provider.name)}</h2><p class="provider-card__url">${escapeHtml(provider.baseUrl)}</p><p class="muted">${escapeHtml(provider.reasoningFormat || "opencode")} reasoning · ${provider.models?.length || 0} models · ${provider.hasKey ? "key stored" : "no key"}</p><div class="provider-card__actions">${state === "primary" ? '<button class="button button--quiet button--small" type="button" disabled>Primary provider</button>' : '<button class="button button--primary button--small" type="button" data-provider-action="switch">Switch provider</button>'}<button class="button button--quiet button--small" type="button" data-provider-action="test">Test</button><button class="button button--quiet button--small" type="button" data-provider-action="details">Details</button><button class="icon-button" type="button" data-provider-action="delete" aria-label="Delete ${escapeHtml(provider.name)}">×</button></div></article>`;
}

function details(provider, trigger) {
  const state = providerState(provider, store.get().activeProvider);
  const test = store.get().providerTests[provider.id];
  const statusLabel = state === "primary" ? "Active" : state === "included" ? "Included" : test === "ok" ? "Test passed" : test === "fail" ? "Test failed" : "Available";
  const statusTone = state === "primary" || test === "ok" ? "active" : test === "fail" ? "error" : state === "included" ? "ok" : "neutral";
  const modelCount = provider.models?.length || 0;
  const modelRows = modelCount
    ? `<ul class="detail-model-list">${provider.models.map(model => `<li class="detail-model-row"><span class="mono">${escapeHtml(model.model)}</span>${model.name ? `<span class="detail-model-row__name">${escapeHtml(model.name)}</span>` : ""}</li>`).join("")}</ul>`
    : '<p class="detail-empty">No models configured yet.</p>';
  const connection = detailSection("Connection", `<dl class="detail-grid"><div class="detail-field detail-field--wide"><dt>Endpoint</dt><dd class="mono">${escapeHtml(provider.baseUrl || "—")}</dd></div><div class="detail-field"><dt>SDK package</dt><dd class="mono">${escapeHtml(provider.npm || "@ai-sdk/openai-compatible")}</dd></div><div class="detail-field"><dt>Reasoning format</dt><dd>${escapeHtml(provider.reasoningFormat || "opencode")}</dd></div><div class="detail-field"><dt>API key</dt><dd>${provider.hasKey ? "Stored locally (hidden)" : "Not configured"}</dd></div></dl>`);
  const models = detailSection("Models", modelRows, "detail-section--models");
  openDialog({ title: provider.name, eyebrow: "Provider details", variant: "details", headerMark: providerLogoMark(provider.name, { id: provider.id, size: "md" }), headerMeta: detailStatus(statusLabel, statusTone), trigger, content: detailView({ summary: `${detailSummaryItem("Status", statusLabel, statusTone)}${detailSummaryItem("Models", modelCount ? `${modelCount} configured` : "None", modelCount ? "active" : "muted")}${detailSummaryItem("Auth", provider.hasKey ? "Key stored" : "Not configured", provider.hasKey ? "active" : "muted")}`, sections: `${connection}${models}` }), actions: `<button class="button button--quiet" type="button" data-dialog-close>Close</button>` });
}

function providerForm(provider) {
  const models = (provider?.models || []).map(model => model.model).join("\n");
  const formatOptions = (store.get().formats.length ? store.get().formats : [{ id: "opencode", label: "OpenCode" }, { id: "openai", label: "OpenAI" }, { id: "claude", label: "Claude-style" }, { id: "gemini", label: "Gemini-style" }, { id: "none", label: "No reasoning" }]).map(format => `<option value="${escapeHtml(format.id)}" ${format.id === (provider?.reasoningFormat || "opencode") ? "selected" : ""}>${escapeHtml(format.label)}</option>`).join("");
  return `<div class="segment" aria-label="Provider setup steps"><button type="button" aria-pressed="true">Choose</button><button type="button">Configure</button><button type="button">Models</button><button type="button">Test</button><button type="button">Save</button></div><form id="providerForm" class="stack" style="margin-top:20px"><div class="field"><label for="providerPreset">Provider preset</label><select id="providerPreset">${Object.keys(presets).map(name => `<option ${provider ? "" : name === "Custom" ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></div><div class="field"><label for="providerName">Name</label><input id="providerName" required value="${escapeHtml(provider?.name || "")}" autocomplete="off"></div><div class="field"><label for="providerUrl">Base URL</label><input id="providerUrl" required value="${escapeHtml(provider?.baseUrl || "")}" placeholder="https://api.example.com/v1"></div><div class="field"><label for="providerSdk">SDK package</label><input id="providerSdk" list="providerSdkOptions" value="${escapeHtml(provider?.npm || "@ai-sdk/openai-compatible")}" placeholder="@ai-sdk/openai-compatible" autocomplete="off"><datalist id="providerSdkOptions">${SDK_OPTIONS.map(option => `<option value="${escapeHtml(option.npm)}">${escapeHtml(option.label)}</option>`).join("")}</datalist></div><div class="field"><label for="providerKey">API key ${provider?.hasKey ? '<span class="muted">(leave empty to keep existing)</span>' : ""}</label><input id="providerKey" type="password" autocomplete="new-password"><p class="field-note">Keys are never returned or displayed after saving.</p></div><div class="field"><label for="providerFormat">Reasoning format</label><select id="providerFormat">${formatOptions}</select></div><div class="field"><label for="providerModels">Models <span class="muted">(one ID per line)</span></label><textarea id="providerModels" placeholder="provider/model-id">${escapeHtml(models)}</textarea></div><p id="providerFormMessage" class="field-error" role="alert"></p></form>`;
}

export function openProviderDialog(provider = null, trigger = document.activeElement) {
  document.body.classList.add("provider-panel-active");
  const actions = `<button class="button button--quiet" type="button" data-dialog-close>Cancel</button><button class="button button--secondary" type="button" data-test-form>Test connection</button><button class="button button--primary" type="submit" form="providerForm">Save provider</button>`;
  const { dialog, close } = openDialog({ title: provider ? `Edit ${provider.name}` : "Add a provider", content: providerForm(provider), actions, wide: true, trigger, onClose: () => document.body.classList.remove("provider-panel-active") });
  dialog.classList.add("provider-dialog");
  dialog.closest(".dialog-backdrop")?.classList.add("provider-panel-backdrop");
  const form = dialog.querySelector("#providerForm"), fields = [...form.querySelectorAll(":scope > .field")];
  const groups = [[fields[0]], fields.slice(1, 6), [fields[6]], [], []];
  const panelNames = ["Choose a preset", "Configure connection", "Choose models", "Test connection", "Review and save"];
  const panels = groups.map((items, index) => { const panel = document.createElement("section"); panel.className = "provider-step"; panel.dataset.providerPanel = index; panel.setAttribute("aria-label", panelNames[index]); items.forEach(item => panel.append(item)); if (index === 3) panel.innerHTML = '<p>Use Test connection below. A successful test is recommended, not required.</p>'; if (index === 4) panel.innerHTML = '<p>Review the provider details, then save it. Saving does not activate it.</p>'; form.insertBefore(panel, form.querySelector("#providerFormMessage")); return panel; });
  const footer = dialog.querySelector(".dialog__actions");
  footer.insertAdjacentHTML("afterbegin", '<button class="button button--quiet" type="button" data-step-back>Back</button><button class="button button--primary" type="button" data-step-next>Next</button>');
  const preset = dialog.querySelector("#providerPreset");
  preset.addEventListener("change", () => { const value = presets[preset.value]; if (!value) return; dialog.querySelector("#providerUrl").value = value.baseUrl; dialog.querySelector("#providerSdk").value = value.npm; dialog.querySelector("#providerFormat").value = value.reasoningFormat; if (!dialog.querySelector("#providerName").value && preset.value !== "Custom") dialog.querySelector("#providerName").value = preset.value; });
  const existingModels = provider?.models || [];
  const values = () => ({ name: dialog.querySelector("#providerName").value.trim(), baseUrl: dialog.querySelector("#providerUrl").value.trim(), npm: dialog.querySelector("#providerSdk").value.trim(), apiKey: dialog.querySelector("#providerKey").value.trim(), reasoningFormat: dialog.querySelector("#providerFormat").value, models: dialog.querySelector("#providerModels").value.split(/\r?\n/).map(model => model.trim()).filter(Boolean).map(model => { const existing = existingModels.find(item => item.model === model); return { model, name: existing?.name || "", thinking: existing?.thinking || [] }; }) });
  dialog.querySelector("[data-test-form]").addEventListener("click", async () => { const value = values(); const message = dialog.querySelector("#providerFormMessage"); if (!value.baseUrl) { message.textContent = "Enter the base URL before testing."; return; } message.textContent = "Testing the endpoint…"; try { const result = await api.testProvider(provider && !value.apiKey ? { id: provider.id } : { baseUrl: value.baseUrl, apiKey: value.apiKey }); message.textContent = result.message || (result.ok ? "Connection passed." : "Connection failed."); } catch (error) { message.textContent = error.message; } });
  let step = 0, completed = 0;
  const stepButtons = [...dialog.querySelectorAll(".segment button")];
  const back = dialog.querySelector("[data-step-back]"), next = dialog.querySelector("[data-step-next]"), testButton = dialog.querySelector("[data-test-form]"), saveButton = dialog.querySelector("button[form='providerForm']");
  const stepTargets = ["#providerPreset", "#providerName", "#providerModels", "[data-test-form]", "button[form='providerForm']"];
  const renderReview = () => { const review = providerReviewData(values()); const panel = panels[4]; panel.replaceChildren(); const list = document.createElement("dl"); [["Name / ID", `${review.name} / ${review.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`], ["Base URL", review.baseUrl], ["Models", review.models], ["Reasoning format", review.format], ["API key", review.key]].forEach(([label, content]) => { const group = document.createElement("div"), term = document.createElement("dt"), detail = document.createElement("dd"); term.textContent = label; detail.textContent = content; group.append(term, detail); list.append(group); }); panel.append(list); };
  const setStep = (value, focusTarget = true) => { step = Math.max(0, Math.min(4, value)); if (step === 4) renderReview(); panels.forEach((panel, index) => { panel.hidden = index !== step; panel.querySelectorAll("input,select,textarea,button").forEach(control => control.disabled = index !== step); }); stepButtons.forEach((button, index) => { button.setAttribute("aria-pressed", String(index === step)); button.disabled = index > completed; }); back.hidden = step === 0; next.hidden = step === 4; testButton.hidden = step !== 3; saveButton.hidden = step !== 4; saveButton.disabled = !canSubmitProviderStep(step); if (focusTarget) dialog.querySelector(stepTargets[step])?.focus(); };
  const valid = () => { const value = values(); if (step === 1 && (!value.name || !value.baseUrl)) { dialog.querySelector("#providerFormMessage").textContent = "Enter a provider name and base URL."; return false; } return true; };
  stepButtons.forEach((button, index) => button.addEventListener("click", () => { if (index <= completed) setStep(index); }));
  back.addEventListener("click", () => setStep(nextProviderStep(step, -1)));
  next.addEventListener("click", () => { if (!valid()) return; completed = Math.max(completed, step + 1); setStep(nextProviderStep(step, 1)); });
  dialog.querySelector("#providerForm").addEventListener("keydown", event => { if (event.altKey && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); if (event.key === "ArrowRight") { if (!valid()) return; completed = Math.max(completed, step + 1); } setStep(nextProviderStep(step, event.key === "ArrowRight" ? 1 : -1)); } });
  dialog.querySelector("#providerForm").addEventListener("submit", async event => { event.preventDefault(); const value = values(), message = dialog.querySelector("#providerFormMessage"); if (!canSubmitProviderStep(step)) { message.textContent = "Complete the guided steps before saving."; return; } if (!value.name || !value.baseUrl) { message.textContent = "Enter a provider name and base URL."; return; } message.textContent = "Saving…"; try { if (provider) await api.updateProvider(provider.id, value); else await api.createProvider({ ...value, activate: false }); close(); notify(provider ? "Provider saved." : "Provider added. Choose Switch provider when ready.", "success"); document.dispatchEvent(new CustomEvent("ai-switcher:refresh", { detail: "providers" })); } catch (error) { message.textContent = error.message; } });
  setStep(0, false);
}

async function handleAction(workspace, provider, action, trigger) {
  if (action === "edit") { openProviderDialog(provider, trigger); return; }
  if (action === "details") { details(provider, trigger); return; }
  if (action === "test") {
    store.set({ providerTests: { ...store.get().providerTests, [provider.id]: "testing" } });
    try { const result = await api.testProvider({ id: provider.id }); store.set({ providerTests: { ...store.get().providerTests, [provider.id]: result.ok ? "ok" : "fail" } }); notify(result.message, result.ok ? "success" : "error"); } catch (error) { store.set({ providerTests: { ...store.get().providerTests, [provider.id]: "fail" } }); notify(error.message, "error"); }
    renderProviders(workspace); return;
  }
  if (action === "switch") { try { await api.switchProvider(provider.id); notify(`Switched to ${provider.name}.`, "success"); renderProviders(workspace); } catch (error) { notify(error.message, "error"); } return; }
  if (action === "activate") { try { await api.activateProvider(provider.id); notify(`Added ${provider.name} to the build.`, "success"); renderProviders(workspace); } catch (error) { notify(error.message, "error"); } return; }
  if (action === "deactivate") { try { await api.deactivateProvider(provider.id); notify(`${provider.name} deactivated.`, "success"); renderProviders(workspace); } catch (error) { notify(error.message, "error"); } return; }
  if (action === "remove" || action === "delete") {
    const confirmed = await confirmAction({ title: `Remove ${provider.name} permanently?`, message: "This deletes the provider source and its profile model file after making a backup. It also removes the provider from the active build.", confirmLabel: "Remove provider", danger: true, trigger });
    if (!confirmed) return;
    try { await api.deleteProvider(provider.id); notify(`${provider.name} removed.`, "success"); renderProviders(workspace); } catch (error) { notify(error.message, "error"); }
  }
}

async function renderProvidersLegacy(workspace) {
  workspace.innerHTML = `<div class="page-head"><div><p class="eyebrow">Routing</p><h1 class="page-title">Providers</h1><p class="page-intro">Select a card to inspect it. Activation happens only when you choose “Switch provider.”</p></div><div class="page-actions"><button id="addProviderButton" class="button button--primary" type="button">Add provider</button></div></div><div class="provider-deck"><div class="card skeleton"></div><div class="card skeleton"></div></div>`;
  let providers = [];
  try { providers = await loadProviders(); } catch (error) { workspace.innerHTML += `<p class="field-error">${escapeHtml(error.message)}</p>`; }
  workspace.innerHTML = `<div class="page-head"><div><p class="eyebrow">Routing</p><h1 class="page-title">Providers</h1><p class="page-intro">Select a card to inspect it. Activation happens only when you choose “Switch provider.”</p></div><div class="page-actions"><button id="addProviderButton" class="button button--primary" type="button">Add provider</button></div></div>${providers.length ? `<section class="provider-deck" aria-label="Configured providers">${providers.map(card).join("")}</section>` : `<div class="empty-state"><h3>Add your first provider</h3><p>Choose a preset or connect any OpenAI-compatible endpoint. API keys stay in the agent's own provider files.</p><button id="emptyAddProvider" class="button button--primary" type="button">Add provider</button></div>`}`;
  workspace.querySelector(".page-title").textContent = "Providers & agents";
  const tabs = document.createElement("div"); tabs.className = "agent-tabs"; ["OpenCode", "Kilo"].forEach((name, index) => { const button = document.createElement("button"); button.type = "button"; button.className = "button button--quiet"; button.textContent = name; button.setAttribute("aria-pressed", String(index === 0)); tabs.append(button); }); const add = document.createElement("button"); add.type = "button"; add.className = "button button--quiet"; add.textContent = "+ Add agent"; add.addEventListener("click", () => document.querySelector("[data-route='settings']")?.click()); tabs.append(add); workspace.querySelector(".page-head")?.after(tabs);
  const deck = workspace.querySelector(".provider-deck"); if (deck) { const controls = document.createElement("div"); controls.className = "provider-deck-controls"; controls.innerHTML = '<button class="icon-button" type="button" aria-label="Previous provider">←</button><span>Bring a provider forward</span><button class="icon-button" type="button" aria-label="Next provider">→</button>'; deck.after(controls); }
  workspace.querySelector("#addProviderButton")?.addEventListener("click", event => openProviderDialog(null, event.currentTarget));
  workspace.querySelector("#emptyAddProvider")?.addEventListener("click", event => openProviderDialog(null, event.currentTarget));
  workspace.querySelectorAll("[data-provider]").forEach(card => {
    const title = card.querySelector("h2")?.textContent || "provider";
    const selector = document.createElement("button");
    selector.type = "button"; selector.className = "provider-card__selector"; selector.setAttribute("aria-pressed", "false"); selector.setAttribute("aria-label", `Select ${title}`); selector.textContent = "Select card"; card.prepend(selector);
    selector.addEventListener("click", () => { workspace.querySelectorAll("[data-provider]").forEach(item => { const selected = item === card; item.classList.toggle("is-selected", selected); item.querySelector(".provider-card__selector")?.setAttribute("aria-pressed", String(selected)); }); });
  });
  workspace.querySelectorAll("[data-provider-action]").forEach(button => button.addEventListener("click", () => { const provider = providers.find(item => item.id === button.closest("[data-provider]").dataset.provider); if (provider) handleAction(workspace, provider, button.dataset.providerAction, button); }));
}

export async function renderProviders(workspace) {
  if (isClaude()) {
    await renderClaudeRoutes(workspace, {
      activeAgentId: "claude-code",
      onAgentChange: async nextAgent => {
        const changed = await switchProviderAgent(api, nextAgent, "claude-code");
        if (!changed) return;
        const displayNames = { opencode: "OpenCode", kilo: "KiloCode", "claude-code": "Claude Code" };
        notify(`Switched workspace to ${displayNames[nextAgent] || nextAgent}.`, "success");
        document.dispatchEvent(new CustomEvent("ai-switcher:agent-changed"));
      },
    });
    return;
  }
  let providers = [], status = { agent: "opencode" };
  try { [providers, status] = await Promise.all([loadProviders(), optional(() => api.status(), status)]); } catch (error) { notify(error.message, "error"); }
  const agent = status.agent || "opencode";
  const displayNames = { opencode: "OpenCode", kilo: "KiloCode", kilocode: "KiloCode", "claude-code": "Claude Code" };
  const activeAgentId = ["opencode", "kilo", "claude-code"].includes(agent) ? agent : "opencode";
  const activeAgent = displayNames[agent] || agent;
  renderProviderWorkspace(workspace, {
    providers,
    activeProvider: store.get().activeProvider,
    activeAgent,
    activeAgentId,
    onAgentChange: async nextAgent => {
      const changed = await switchProviderAgent(api, nextAgent, activeAgentId);
      if (!changed) return;
      notify(`Switched workspace to ${displayNames[nextAgent] || nextAgent}.`, "success");
      if (nextAgent === "claude-code" || activeAgentId === "claude-code") {
        document.dispatchEvent(new CustomEvent("ai-switcher:agent-changed"));
        return;
      }
      await renderProviders(workspace);
    },
    onAction: (provider, action, trigger) => handleAction(workspace, provider, action, trigger),
    rerender: () => renderProviders(workspace),
  });
}
