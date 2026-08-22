import { api, optional } from "../core/api.js";
import { confirmAction, escapeHtml, notify, openDialog } from "../core/dialog.js";
import { integrationWorkspaceMarkup, lspCard } from "./integration-workspace.js";

function openPluginDialog(trigger, onSaved) {
  const { dialog, close } = openDialog({
    title: "Add plugin identifier", trigger,
    content: `<form id="pluginForm"><div class="field"><label for="pluginId">Plugin ID</label><input id="pluginId" required placeholder="package@git+https://github.com/owner/repo.git"><p class="field-note">Switcher stores this identifier. It does not install, run, or monitor the plugin.</p><p id="pluginMessage" class="field-error" role="alert"></p></div></form>`,
    actions: `<button class="button button--quiet" type="button" data-dialog-close>Cancel</button><button class="button button--primary" type="submit" form="pluginForm">Add identifier</button>`,
  });
  dialog.querySelector("#pluginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const value = dialog.querySelector("#pluginId").value.trim();
    if (!value) return;
    try { await api.addPlugin(value); close(); notify("Plugin identifier added.", "success"); onSaved(); }
    catch (error) { dialog.querySelector("#pluginMessage").textContent = error.message; }
  });
}

function openMcpDialog(trigger, onSaved) {
  const content = `<form id="mcpForm" class="stack"><div class="segment" aria-label="MCP configuration mode"><button type="button" data-mcp-mode="local" aria-pressed="true">Local</button><button type="button" data-mcp-mode="remote">Remote</button><button type="button" data-mcp-mode="expert">Expert JSON</button></div><div class="field"><label for="mcpName">Name</label><input id="mcpName" required placeholder="my-server"></div><div data-mcp-fields="guided" class="stack"><div class="field"><label for="mcpValue">Command</label><input id="mcpValue" placeholder="npx -y @example/mcp"><p class="field-note">For remote mode, enter the HTTPS URL instead.</p></div></div><div class="field" data-mcp-fields="expert" hidden><label for="mcpJson">Configuration JSON</label><textarea id="mcpJson">{"type":"local","command":["npx","-y","@example/mcp"]}</textarea></div><p id="mcpMessage" class="field-error" role="alert"></p></form>`;
  const { dialog, close } = openDialog({ title: "Configure MCP server", content, trigger, actions: `<button class="button button--quiet" type="button" data-dialog-close>Cancel</button><button class="button button--primary" type="submit" form="mcpForm">Save configuration</button>` });
  let mode = "local";
  const renderMode = next => {
    mode = next;
    dialog.querySelectorAll("[data-mcp-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mcpMode === mode)));
    dialog.querySelector("[data-mcp-fields='guided']").hidden = mode === "expert";
    dialog.querySelector("[data-mcp-fields='expert']").hidden = mode !== "expert";
    dialog.querySelector("label[for='mcpValue']").textContent = mode === "remote" ? "Remote URL" : "Command";
  };
  dialog.querySelectorAll("[data-mcp-mode]").forEach(button => button.addEventListener("click", () => renderMode(button.dataset.mcpMode)));
  dialog.querySelector("#mcpForm").addEventListener("submit", async event => {
    event.preventDefault();
    const name = dialog.querySelector("#mcpName").value.trim();
    const message = dialog.querySelector("#mcpMessage");
    if (!name) { message.textContent = "Give this MCP configuration a name."; return; }
    try {
      let config;
      if (mode === "expert") config = JSON.parse(dialog.querySelector("#mcpJson").value);
      else if (mode === "remote") {
        const url = dialog.querySelector("#mcpValue").value.trim();
        if (!/^https?:\/\//i.test(url)) throw new Error("Enter a complete HTTP or HTTPS URL.");
        config = { type: "remote", url };
      } else {
        const command = dialog.querySelector("#mcpValue").value.trim();
        if (!command) throw new Error("Enter the local command.");
        config = { type: "local", command: command.split(/\s+/) };
      }
      if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("Configuration must be a JSON object.");
      await api.addMcp(name, config); close(); notify("MCP configuration saved.", "success"); onSaved();
    } catch (error) { message.textContent = error.message; }
  });
}

function openLspJsonDialog(lsp, onSaved) {
  const content = `<form id="lspForm" class="stack"><div class="field"><label for="lspJson">LSP configuration</label><textarea id="lspJson">${escapeHtml(JSON.stringify(lsp.lsp, null, 2))}</textarea><p class="field-note">Use <code>true</code> for built-in servers or a JSON object mapping server names to configurations.</p></div><p id="lspMessage" class="field-error" role="alert"></p></form>`;
  const { dialog, close } = openDialog({ title: "Edit LSP configuration", content, actions: `<button class="button button--quiet" type="button" data-dialog-close>Cancel</button><button class="button button--primary" type="submit" form="lspForm">Save configuration</button>` });
  dialog.querySelector("#lspForm").addEventListener("submit", async event => {
    event.preventDefault();
    const message = dialog.querySelector("#lspMessage");
    let parsed;
    try { parsed = JSON.parse(dialog.querySelector("#lspJson").value); }
    catch (error) { message.textContent = "LSP configuration must be valid JSON."; return; }
    if (typeof parsed !== "boolean" && (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))) { message.textContent = "LSP value must be true, false, or a JSON object."; return; }
    try { await api.setLsp(parsed, lsp.enabled); lsp.lsp = parsed; close(); notify("LSP configuration saved.", "success"); onSaved(); }
    catch (error) { message.textContent = error.message; }
  });
}

export async function renderIntegrations(workspace) {
  workspace.innerHTML = `<section class="integration-workspace"><div class="card card--padded skeleton"></div><div class="card card--padded skeleton"></div></section>`;
  const [pluginData, mcpData, providerData, statusData, lspData] = await Promise.all([
    optional(() => api.plugins(), { plugins: [] }), optional(() => api.mcp(), { mcps: {} }),
    optional(() => api.providers(), { providers: [], activeProvider: null }), optional(() => api.status(), { agent: null }),
    optional(() => api.lsp(), { lsp: false, enabled: false }),
  ]);
  const plugins = pluginData.plugins || [];
  const mcps = mcpData.mcps || {};
  const providers = (providerData.providers || []).filter(provider => !provider.suggested);
  const names = { opencode: "OpenCode", kilo: "KiloCode", kilocode: "KiloCode", claude: "ClaudeCode", claudecode: "ClaudeCode" };
  const agentName = names[String(statusData.agent || "").toLowerCase()] || statusData.agent || "your agent";
  const configNames = { opencode: "opencode.json", kilo: "kilo.json", kilocode: "kilo.json", claude: "settings.json", claudecode: "settings.json" };
  const configName = configNames[String(statusData.agent || "").toLowerCase()] || "config.json";
  const currentLsp = lspData;
  workspace.innerHTML = integrationWorkspaceMarkup({ plugins, mcps, providers, agentName, lsp: currentLsp, configName });

  const refresh = () => renderIntegrations(workspace);
  const updateLspCard = () => {
    workspace.querySelector(".integration-lsp")?.replaceWith(
      document.createRange().createContextualFragment(lspCard(currentLsp, configName)).firstElementChild,
    );
    bindLspControls();
  };
  function bindLspControls() {
    workspace.querySelector("#lspToggle")?.addEventListener("change", async event => {
      try {
        await api.setLsp(currentLsp.lsp, event.target.checked);
        currentLsp.enabled = event.target.checked;
        notify(`LSP ${event.target.checked ? "enabled" : "disabled"} for the next build.`, "success");
        updateLspCard();
      } catch (error) {
        notify(error.message, "error");
        event.target.checked = !event.target.checked;
      }
    });
    workspace.querySelector("#editLspJson")?.addEventListener("click", event => openLspJsonDialog(currentLsp, updateLspCard));
  }
  workspace.querySelector("#addPlugin").addEventListener("click", event => openPluginDialog(event.currentTarget, refresh));
  workspace.querySelector("#addMcp").addEventListener("click", event => openMcpDialog(event.currentTarget, refresh));
  bindLspControls();
  workspace.querySelectorAll("[data-remove-plugin]").forEach(button => button.addEventListener("click", async () => {
    if (!await confirmAction({ title: "Remove plugin identifier?", message: "This removes the identifier from the active profile after keeping a backup.", confirmLabel: "Remove", danger: true, trigger: button })) return;
    try { await api.removePlugin(button.dataset.removePlugin); notify("Plugin identifier removed.", "success"); refresh(); } catch (error) { notify(error.message, "error"); }
  }));
  workspace.querySelectorAll("[data-remove-mcp]").forEach(button => button.addEventListener("click", async () => {
    if (!await confirmAction({ title: "Remove MCP configuration?", message: "This removes the stored server configuration after keeping a backup.", confirmLabel: "Remove", danger: true, trigger: button })) return;
    try { await api.removeMcp(button.dataset.removeMcp); notify("MCP configuration removed.", "success"); refresh(); } catch (error) { notify(error.message, "error"); }
  }));
  workspace.querySelectorAll("[data-test-provider]").forEach(button => button.addEventListener("click", async () => {
    const providerId = button.dataset.testProvider;
    const line = workspace.querySelector(`[data-test-message="${providerId}"]`);
    line.textContent = "Testing…";
    try { const result = await api.testProvider({ id: providerId }); line.textContent = result.message; }
    catch (error) { line.textContent = error.message; }
  }));
  workspace.querySelector("#copyEndpoint").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText("http://127.0.0.1:9090/v1"); notify("Local endpoint copied.", "success"); }
    catch { notify("Copy is unavailable. Select the endpoint text manually.", "error"); }
  });
  workspace.querySelector("#buildConfig").addEventListener("click", async event => {
    const button = event.currentTarget, line = workspace.querySelector("#buildMessage");
    button.disabled = true; line.textContent = "Building…";
    try { const result = await api.build(); line.textContent = result.message || "Configuration built."; notify("Configuration built.", "success"); }
    catch (error) { line.textContent = error.message; notify(error.message, "error"); }
    finally { button.disabled = false; }
  });
}
