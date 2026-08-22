import { api } from "../core/api.js";
import { escapeHtml, notify } from "../core/dialog.js";
import { isClaude } from "../core/capabilities.js";
import { providerLogoMark } from "../core/provider-logo.js";
import { renderClaudeRoutes } from "./claude-routes.js";

const PRESETS = {
  OmniRoute: { name: "OmniRoute", baseUrl: "http://localhost:20128/v1" },
  "CLI Proxy": { name: "CLI Proxy", baseUrl: "http://localhost:PORT/v1" },
  LiteLLM: { name: "LiteLLM", baseUrl: "http://localhost:4000/v1" },
};

const SDK_CHOICES = [
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

const FORMAT_CHOICES = [
  { id: "opencode", label: "OpenCode" },
  { id: "openai", label: "OpenAI / ChatGPT" },
  { id: "claude", label: "Claude" },
  { id: "gemini", label: "Gemini" },
  { id: "none", label: "No reasoning" },
];

export const circularProviderIndex = (index, delta, count) => count ? ((index + delta) % count + count) % count : 0;

const slugify = name => String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function brandMark(name, id) {
  return providerLogoMark(name, { id, size: "lg", className: "provider-brand-mark" });
}

function card(provider, activeProvider) {
  const active = Boolean(provider.active);
  const modelCount = Array.isArray(provider.models) ? provider.models.length : 0;
  return `<article class="provider-deck-card" data-provider-card="${escapeHtml(provider.id)}" tabindex="0">
    <div class="provider-deck-card__head">${brandMark(provider.name, provider.id)}<div><h2>${escapeHtml(provider.name)}</h2><p class="provider-health ${active ? "is-healthy" : ""}"><span></span>${active ? "Active" : "Inactive"}</p></div></div>
    <dl class="provider-deck-card__meta">
      <div><dt>Models</dt><dd>${modelCount} ${modelCount === 1 ? "model" : "models"}</dd></div>
      <div><dt>Endpoint</dt><dd class="mono">${escapeHtml(provider.baseUrl || "—")}</dd></div>
      <div><dt>SDK</dt><dd>${escapeHtml(provider.npm || "OpenAI-compatible")}</dd></div>
      <div><dt>Auth</dt><dd>${provider.hasKey ? "API key stored" : "No key"}</dd></div>
    </dl>
    <div class="provider-deck-card__actions">
      ${active ? '<button class="button button--quiet button--small" type="button" data-provider-action="deactivate">Deactivate provider</button>' : '<button class="button button--primary button--small" type="button" data-provider-action="activate">Add provider</button>'}
      <button class="button button--quiet button--small" type="button" data-provider-action="details">Details</button>
      <button class="button button--quiet button--small" type="button" data-provider-action="test">Test connection</button>
      <button class="button button--quiet button--small" type="button" data-provider-action="edit">Edit provider</button>
      <button class="button button--danger button--small" type="button" data-provider-action="remove">Remove provider</button>
    </div>
  </article>`;
}

function modelRowMarkup(modelId = "", name = "") {
  return `<div class="provider-model-row">
      <input class="provider-model-id" aria-label="Model ID" placeholder="model-id" autocomplete="off" value="${escapeHtml(modelId)}">
      <input class="provider-model-name" aria-label="Model display name" placeholder="Display Name" autocomplete="off" value="${escapeHtml(name)}">
      <button type="button" class="provider-model-row__remove" aria-label="Remove model">×</button>
    </div>`;
}

function setupPanel() {
  const sdkButtons = SDK_CHOICES.map((choice, index) => `<button type="button" data-sdk="${escapeHtml(choice.npm)}" aria-pressed="${index === 0 ? "true" : "false"}">${escapeHtml(choice.label)}</button>`).join("");
  const formatButtons = FORMAT_CHOICES.map((choice, index) => `<button type="button" data-format="${escapeHtml(choice.id)}" aria-pressed="${index === 0 ? "true" : "false"}">${escapeHtml(choice.label)}</button>`).join("");
  const providerButtons = ["OmniRoute", "CLI Proxy", "LiteLLM", "Custom"].map(name => `<button type="button" data-provider-choice="${escapeHtml(name)}" aria-pressed="false">${escapeHtml(name)}</button>`).join("");
  return `<aside class="provider-setup-panel control-room-card control-room-card--settings" aria-labelledby="providerSetupTitle">
    <div class="provider-setup-panel__head"><h2 id="providerSetupTitle">Add a provider</h2><button class="provider-panel-close" type="button" aria-label="Close provider setup">×</button></div>
    <ol class="provider-setup-steps" aria-label="Provider setup progress"><li data-panel-step="0"><b>1</b><span>Choose</span></li><li data-panel-step="1" disabled><b>2</b><span>Configure</span></li><li data-panel-step="2" disabled><b>3</b><span>Test</span></li></ol>
    <form id="embeddedProviderForm" class="provider-setup-form">
      <section class="provider-step" data-step-panel="0">
        <div class="field"><label>SDK type</label><div class="provider-choice-row" id="embeddedSdkChoices">${sdkButtons}</div></div>
        <div class="field"><label>Model reasoning format</label><div class="provider-choice-row" id="embeddedFormatChoices">${formatButtons}</div></div>
        <div class="field"><label>Provider</label><div class="provider-choice-row" id="embeddedProviderChoices">${providerButtons}</div></div>
      </section>
      <section class="provider-step" data-step-panel="1" hidden>
        <div class="field"><label for="embeddedProviderId">Provider ID</label><input id="embeddedProviderId" autocomplete="off" placeholder="myprovider"><p class="field-note">Lowercase letters, numbers, hyphens, or underscores.</p></div>
        <div class="field"><label for="embeddedName">Display name</label><input id="embeddedName" required autocomplete="off" placeholder="My AI Provider"></div>
        <div class="field"><label for="embeddedUrl">Base URL</label><input id="embeddedUrl" required autocomplete="off" placeholder="https://api.myprovider.com/v1"></div>
        <div class="field"><label for="embeddedKey">API key</label><div class="provider-secret"><input id="embeddedKey" type="password" autocomplete="new-password" placeholder="API key"><button type="button" aria-label="Show API key">◉</button></div><p class="field-note">Optional. Leave empty if you manage auth via headers.</p></div>
        <div class="field"><label>Models</label><div class="provider-model-head"><span>ID</span><span>Name</span><span></span></div><div class="provider-model-rows">${modelRowMarkup()}</div><button type="button" class="provider-add-model" data-add-model>＋&nbsp; Add model</button></div>
        <input id="embeddedSdk" type="hidden" value="@ai-sdk/openai-compatible">
        <input id="embeddedFormat" type="hidden" value="opencode">
      </section>
      <section class="provider-step" data-step-panel="2" hidden>
        <p class="provider-step-test-note">Your connection details are set. Test the endpoint below, then save the provider.</p>
      </section>
      <p id="embeddedProviderMessage" class="field-error" role="alert"></p>
      <footer class="provider-setup-actions"><button class="button button--quiet" type="button" data-provider-back hidden>Back</button><button class="button button--secondary" type="button" data-provider-next>Next</button><button class="button button--secondary" type="button" data-provider-test hidden>⌁&nbsp; Test connection</button><button class="button button--secondary provider-save" type="submit" hidden>Save provider</button></footer>
    </form>
  </aside>`;
}

function bindPanel(workspace, rerender) {
  const panel = workspace.querySelector(".provider-setup-panel"), form = panel.querySelector("form"), find = selector => panel.querySelector(selector);
  const stepButtons = [...panel.querySelectorAll("[data-panel-step]")];
  const panels = [...panel.querySelectorAll("[data-step-panel]")];
  const back = find("[data-provider-back]"), next = find("[data-provider-next]"), testButton = find("[data-provider-test]"), saveButton = find(".provider-save"), footer = find(".provider-setup-actions");
  const choices = { sdk: "@ai-sdk/openai-compatible", format: "opencode", provider: "" };
  const pendingPreset = { name: "", baseUrl: "" };
  let step = 0, completed = 0;

  const setMessage = (message = "") => { find("#embeddedProviderMessage").textContent = message; };

  const fillConfigure = () => {
    find("#embeddedSdk").value = choices.sdk;
    find("#embeddedFormat").value = choices.format;
    const preset = PRESETS[choices.provider];
    if (preset) {
      find("#embeddedProviderId").value = pendingPreset.id || slugify(preset.name);
      find("#embeddedName").value = pendingPreset.name || preset.name;
      find("#embeddedUrl").value = pendingPreset.baseUrl || preset.baseUrl;
    } else {
      find("#embeddedProviderId").value = pendingPreset.id || find("#embeddedProviderId").value || "";
      find("#embeddedName").value = pendingPreset.name || find("#embeddedName").value || "";
      find("#embeddedUrl").value = pendingPreset.baseUrl || find("#embeddedUrl").value || "";
    }
  };

  const setStep = value => {
    step = Math.max(0, Math.min(2, value));
    stepButtons.forEach((item, index) => {
      item.classList.toggle("is-active", index === step);
      item.classList.toggle("is-done", index < completed);
      item.disabled = index > completed;
    });
    panels.forEach((item, index) => { item.hidden = index !== step; });
    back.hidden = step === 0;
    next.hidden = step >= 2;
    testButton.hidden = step !== 2;
    saveButton.hidden = step !== 2;
    footer.classList.toggle("provider-setup-actions--test", step === 2);
    if (step === 1) fillConfigure();
  };

  stepButtons.forEach((item, index) => item.addEventListener("click", () => { if (index <= completed) setStep(index); }));
  back.addEventListener("click", () => setStep(step - 1));
  next.addEventListener("click", () => {
    setMessage();
    if (step === 0) {
      if (!choices.provider) { setMessage("Choose a provider first."); return; }
      completed = Math.max(completed, 1);
      setStep(1);
    } else if (step === 1) {
      const value = values();
      if (value.id && !/^[a-z0-9_-]+$/.test(value.id)) { setMessage("Provider ID may only contain lowercase letters, numbers, hyphens, or underscores."); return; }
      if (!value.name || !value.baseUrl) { setMessage("Enter a display name and base URL."); return; }
      completed = Math.max(completed, 2);
      setStep(2);
    }
  });

  panel.querySelectorAll("[data-sdk]").forEach(button => button.addEventListener("click", () => {
    choices.sdk = button.dataset.sdk;
    panel.querySelectorAll("[data-sdk]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  }));
  panel.querySelectorAll("[data-format]").forEach(button => button.addEventListener("click", () => {
    choices.format = button.dataset.format;
    panel.querySelectorAll("[data-format]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  }));
  panel.querySelectorAll("[data-provider-choice]").forEach(button => button.addEventListener("click", () => {
    choices.provider = button.dataset.providerChoice;
    panel.querySelectorAll("[data-provider-choice]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    if (choices.provider === "Custom") { pendingPreset.name = ""; pendingPreset.baseUrl = ""; }
  }));

  const resetWizard = () => {
    completed = 0;
    choices.provider = "";
    pendingPreset.id = "";
    pendingPreset.name = "";
    pendingPreset.baseUrl = "";
    find("#embeddedProviderId").value = "";
    find("#embeddedName").value = "";
    find("#embeddedUrl").value = "";
    find("#embeddedKey").value = "";
    panel.querySelectorAll("[data-provider-choice]").forEach(item => item.setAttribute("aria-pressed", "false"));
    panel.querySelector(".provider-model-rows").innerHTML = modelRowMarkup();
    setMessage();
    setStep(0);
  };

  find(".provider-panel-close").addEventListener("click", () => { resetWizard(); panel.hidden = true; workspace.querySelector("#reopenProviderPanel").hidden = false; });
  workspace.querySelector("#reopenProviderPanel").addEventListener("click", event => { event.currentTarget.hidden = true; resetWizard(); panel.hidden = false; });
  find(".provider-secret button").addEventListener("click", event => { const input = find("#embeddedKey"), show = input.type === "password"; input.type = show ? "text" : "password"; event.currentTarget.setAttribute("aria-label", show ? "Hide API key" : "Show API key"); });
  const rows = panel.querySelector(".provider-model-rows");
  rows.addEventListener("click", event => { const remove = event.target.closest(".provider-model-row__remove"); if (remove) remove.closest(".provider-model-row").remove(); });
  find("[data-add-model]").addEventListener("click", () => rows.insertAdjacentHTML("beforeend", modelRowMarkup()));
  const values = () => ({ id: find("#embeddedProviderId").value.trim(), name: find("#embeddedName").value.trim(), baseUrl: find("#embeddedUrl").value.trim(), npm: find("#embeddedSdk").value, apiKey: find("#embeddedKey").value.trim(), reasoningFormat: find("#embeddedFormat").value, models: [...panel.querySelectorAll(".provider-model-row")].map(row => ({ model: row.querySelector(".provider-model-id").value.trim(), name: row.querySelector(".provider-model-name").value.trim(), thinking: [] })).filter(model => model.model) });
  find("[data-provider-test]").addEventListener("click", async () => { const value = values(), message = find("#embeddedProviderMessage"); if (!value.baseUrl) { message.textContent = "Enter a base URL first."; return; } message.textContent = "Testing connection…"; try { const result = await api.testProvider({ baseUrl: value.baseUrl, apiKey: value.apiKey }); message.textContent = result.message || (result.ok ? "Connection passed." : "Connection failed."); } catch (error) { message.textContent = error.message; } });
  form.addEventListener("submit", async event => { event.preventDefault(); const value = values(), message = find("#embeddedProviderMessage"); if (!value.name || !value.baseUrl) { message.textContent = "Enter a display name and base URL."; return; } message.textContent = "Saving…"; try { await api.createProvider({ ...value, activate: false }); notify("Provider added.", "success"); await rerender(); } catch (error) { message.textContent = error.message; } });

  setStep(0);
}

export function renderProviderWorkspace(workspace, { providers, activeProvider, activeAgent, activeAgentId, onAgentChange, onAction, rerender }) {
  if (isClaude()) {
    renderClaudeRoutes(workspace);
    return;
  }
  const items = providers;
  workspace.innerHTML = `<section class="providers-workspace">
    <header class="providers-page-head"><h1>Providers &amp; agents</h1><div class="providers-page-head__actions"><button id="reopenProviderPanel" class="button button--primary" type="button" hidden>Add provider</button><div class="provider-agent-selector" aria-label="Connected agent"><span class="status-dot status-dot--ok"></span>${escapeHtml(activeAgent)} · connected</div><button class="button button--quiet manage-agents" type="button">♙&nbsp; Manage agents</button></div></header>
    <div class="provider-agent-tabs control-room-card control-room-card--settings" role="tablist" aria-label="Coding agents"><button role="tab" type="button" data-provider-agent="opencode" aria-selected="${activeAgentId === "opencode"}"><img src="/assets/brands/opencode.svg" alt="">OpenCode</button><button role="tab" type="button" data-provider-agent="kilo" aria-selected="${activeAgentId === "kilo"}"><img src="/assets/brands/kilocode.svg" alt="">KiloCode</button><button role="tab" type="button" data-provider-agent="claude-code" aria-selected="${activeAgentId === "claude-code"}"><img src="/assets/brands/claudecode.svg" alt="">Claude Code</button></div>
    <div class="providers-content"><div class="provider-browser"><section class="provider-deck-stage" aria-label="Configured providers">${items.map(item => card(item, activeProvider)).join("")}</section><div class="provider-deck-controls"><button class="icon-button" type="button" aria-label="Previous provider">←</button><span>Bring a provider forward</span><button class="icon-button" type="button" aria-label="Next provider">→</button></div></div>${setupPanel()}</div>
  </section>`;
  let index = 0;
  const cards = [...workspace.querySelectorAll("[data-provider-card]")];
  const applyDeck = () => cards.forEach((item, itemIndex) => { const offset = circularProviderIndex(itemIndex, -index, cards.length); item.classList.toggle("provider-deck-card--front", offset === 0); item.classList.toggle("provider-deck-card--middle", offset === 1); item.classList.toggle("provider-deck-card--back", offset === 2); item.hidden = offset > 2; item.setAttribute("aria-hidden", String(offset > 2)); });
  const stepDeck = delta => { index = circularProviderIndex(index, delta, cards.length); applyDeck(); };
  applyDeck();
  workspace.querySelector('[aria-label="Previous provider"]').addEventListener("click", () => stepDeck(-1)); workspace.querySelector('[aria-label="Next provider"]').addEventListener("click", () => stepDeck(1));
  cards.forEach((item, itemIndex) => { const select = event => { if (event.target.closest("button")) return; index = itemIndex; applyDeck(); }; item.addEventListener("click", select); item.addEventListener("keydown", event => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); select(event); } }); });
  workspace.querySelector(".manage-agents")?.addEventListener("click", () => document.querySelector("[data-route='settings']")?.click());
  const agentTabs = [...workspace.querySelectorAll("[data-provider-agent]")];
  const agentTablist = workspace.querySelector(".provider-agent-tabs");
  agentTabs.forEach(button => button.addEventListener("click", async () => {
    const nextAgent = button.dataset.providerAgent;
    if (nextAgent === activeAgentId) return;
    agentTablist.setAttribute("aria-busy", "true");
    agentTabs.forEach(tab => { tab.disabled = true; });
    try { await onAgentChange(nextAgent); }
    catch (error) {
      notify(error.message, "error");
      agentTablist.removeAttribute("aria-busy");
      agentTabs.forEach(tab => { tab.disabled = false; });
    }
  }));
  workspace.querySelectorAll("[data-provider-action]").forEach(button => button.addEventListener("click", () => { const item = button.closest("[data-provider-card]"), provider = providers.find(entry => entry.id === item.dataset.providerCard); if (provider) onAction(provider, button.dataset.providerAction, button); }));
  bindPanel(workspace, rerender);
}
