import { escapeHtml } from "../core/dialog.js";

const icon = {
  info: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10.5v6M12 7.2v.2"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>`,
  more: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 3h6l1 4H8l1-4ZM7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"/></svg>`,
  wrench: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.3 6.1a5 5 0 0 0-6.4 6.4L3 17.4 6.6 21l4.9-4.9a5 5 0 0 0 6.4-6.4l-3 3-3.2-.8-.8-3.2 3.4-2.5Z"/></svg>`,
};

function pluginRows(plugins) {
  if (!plugins.length) return `<div class="integration-empty"><strong>No plugins configured</strong><span>Add a plugin identifier to the active coding profile.</span></div>`;
  return `<div class="integration-rows">${plugins.map(plugin => `<div class="integration-row integration-plugin-row"><code title="${escapeHtml(plugin)}">${escapeHtml(plugin)}</code><span class="integration-row-actions"><button class="integration-icon-button" type="button" aria-label="More options for ${escapeHtml(plugin)}">${icon.more}</button><button class="integration-icon-button" type="button" data-remove-plugin="${escapeHtml(plugin)}" aria-label="Remove ${escapeHtml(plugin)}">${icon.trash}</button></span></div>`).join("")}</div>`;
}

function mcpRows(mcps) {
  const entries = Object.entries(mcps || {});
  if (!entries.length) return `<div class="integration-empty"><strong>No MCP servers configured</strong><span>Add a local or remote Model Context Protocol server.</span></div>`;
  return `<div class="integration-table" role="table" aria-label="MCP servers"><div class="integration-table-head" role="row"><span>Name</span><span>Status</span><span>Type</span><span></span></div>${entries.map(([name, config]) => `<div class="integration-table-row" role="row"><strong>${escapeHtml(name)}</strong><span>Configured</span><span>${escapeHtml(config?.type === "remote" ? "Remote" : "Local")}</span><span class="integration-row-actions"><button class="integration-icon-button" type="button" aria-label="More options for ${escapeHtml(name)}">${icon.more}</button><button class="integration-icon-button" type="button" data-remove-mcp="${escapeHtml(name)}" aria-label="Remove ${escapeHtml(name)}">${icon.trash}</button></span></div>`).join("")}</div>`;
}

function lspRows(lsp, configName) {
  if (!lsp.enabled) return `<div class="integration-empty"><strong>LSP is off</strong><span>${escapeHtml(configName)} will carry "lsp": false. Turn the toggle on to include language servers.</span></div>`;
  if (typeof lsp.lsp === "object" && lsp.lsp !== null) {
    const names = Object.keys(lsp.lsp);
    if (!names.length) return `<div class="integration-empty"><strong>No LSP servers configured</strong><span>Add a server with the expert JSON editor or set LSP to true for built-ins.</span></div>`;
    return `<div class="integration-chips">${names.map(name => `<span class="integration-chip">${escapeHtml(name)}</span>`).join("")}</div>`;
  }
  if (lsp.lsp === false) return `<div class="integration-empty"><strong>LSP disabled</strong><span>${escapeHtml(configName)} will carry "lsp": false. Set the value to true (built-ins) or an object (custom servers).</span></div>`;
  return `<div class="integration-empty"><strong>Built-in servers enabled</strong><span>${escapeHtml(configName)} will carry "lsp": true.</span></div>`;
}

export function lspCard(lsp, configName) {
  return `<article class="card integration-card integration-lsp control-room-card control-room-card--settings"><div class="integration-card-head"><div><h2>LSP servers</h2></div><button id="editLspJson" class="button integration-outline-button" type="button">Edit JSON</button></div><div class="integration-lsp-toggle"><span class="integration-toggle-label">Include LSP when building</span><label class="integration-toggle"><input id="lspToggle" type="checkbox" ${lsp.enabled ? "checked" : ""}><span class="integration-toggle-track"></span></label></div>${lspRows(lsp, configName)}</article>`;
}

function providerRows(providers) {
  if (!providers.length) return `<p class="integration-connection" role="status">Provider required</p>`;
  return `<div class="integration-provider-list">${providers.map((provider, index) => `
    <div class="integration-provider-row">
      <div class="integration-provider-row__head"><span class="integration-provider-dot ${provider.active ? "is-active" : ""}"></span><strong>${escapeHtml(provider.name)}</strong><span class="integration-status-pill ${provider.active ? "is-active" : ""}">${provider.active ? "Active" : "Inactive"}</span></div>
      <p class="integration-connection" data-test-message="${escapeHtml(provider.id)}" role="status">${provider.active ? "Configured as active" : "Not in the build"}</p>
      <button class="button button--secondary button--small" type="button" ${index === 0 ? 'id="testPrimary" ' : ""}data-test-provider="${escapeHtml(provider.id)}">Test connection</button>
    </div>`).join("")}</div>`;
}

export function integrationWorkspaceMarkup({ plugins, mcps, lsp, providers, agentName, configName }) {
  const providerList = providers || [];
  return `<section class="integration-workspace">
    <header class="integration-header"><div><h1 class="page-title">Integrations</h1></div><span class="integration-managing">Managing: <strong>${escapeHtml(agentName)}</strong></span></header>
    <div class="integration-notice control-room-card control-room-card--settings">${icon.info}<span>Changes are backed up before they are saved. Build your config to apply them to your agent.</span></div>
    <div class="integration-columns">
      <div class="integration-column integration-column--main">
        <article class="card integration-card integration-plugins control-room-card control-room-card--plugins"><div class="integration-card-head"><div><h2>Plugins</h2></div><button id="addPlugin" class="button integration-outline-button" type="button">${icon.plus}Add plugin</button></div>${pluginRows(plugins)}</article>
        ${lspCard(lsp, configName)}
        <article class="card integration-card integration-mcp control-room-card control-room-card--mcp"><div class="integration-card-head"><div><h2>MCP servers</h2></div><button id="addMcp" class="button integration-outline-button" type="button">${icon.plus}Add MCP server</button></div>${mcpRows(mcps)}</article>
      </div>
      <div class="integration-column integration-column--side">
        <article class="card integration-card integration-provider control-room-card control-room-card--health"><h2>AI provider connection</h2>${providerRows(providerList)}<div class="integration-actions"><button class="button integration-outline-button" type="button" data-route="providers">Manage providers</button></div></article>
        <article class="card integration-card integration-endpoint control-room-card control-room-card--settings"><h2>Use Switcher with another tool</h2><div class="integration-copy-field"><code>http://127.0.0.1:9090/v1</code><button id="copyEndpoint" class="integration-icon-button" type="button" aria-label="Copy local endpoint">${icon.copy}</button></div><span class="integration-local-pill">Local only</span></article>
        <article class="integration-build-card control-room-card control-room-card--build"><span class="integration-build-icon">${icon.wrench}</span><div><strong>Build required</strong><p>Rebuild your configuration to apply changes to your agent.</p></div><button id="buildConfig" class="button button--primary" type="button">Build my config</button><p id="buildMessage" class="integration-build-message" role="status"></p></article>
      </div>
    </div>
  </section>`;
}
