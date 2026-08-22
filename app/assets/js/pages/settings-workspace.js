import { escapeHtml } from "../core/dialog.js";

const icon = {
  cube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>`,
  plugin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 3H5a2 2 0 0 0-2 2v3.5a2.5 2.5 0 1 1 0 5V19a2 2 0 0 0 2 2h5.5a2.5 2.5 0 1 1 5 0H19a2 2 0 0 0 2-2v-5.5a2.5 2.5 0 1 1 0-5V5a2 2 0 0 0-2-2h-3.5a2.5 2.5 0 1 1-5 0Z"/></svg>`,
  server: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="5" rx="1.5"/><rect x="4" y="9.5" width="16" height="5" rx="1.5"/><rect x="4" y="16" width="16" height="5" rx="1.5"/><path d="M7 5.5h.1M7 12h.1M7 18.5h.1"/></svg>`,
  code: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m9 9-3 3 3 3M15 9l3 3-3 3M13 7l-2 10"/></svg>`,
  sliders: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3v18M12 3v18M19 3v18M2 8h6M9 16h6M16 10h6"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>`,
  more: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 4 12 8-12 8V4Z"/></svg>`,
};

function navItem(target, label, iconName, active = false) {
  return `<button class="settings-nav-item${active ? " is-active" : ""}" type="button" data-settings-target="${target}">${icon[iconName]}<span>${label}</span></button>`;
}

function modelOptions(provider) {
  const models = provider?.models || [];
  if (!models.length) return `<option value="">No models configured</option>`;
  return models.map(model => `<option value="${escapeHtml(model.model)}">${escapeHtml(model.name || model.model)}</option>`).join("");
}

function providerOptions(providers) {
  if (!providers.length) return `<option value="">No provider</option>`;
  return providers.map(provider => `<option value="${escapeHtml(provider.id)}">${escapeHtml(provider.name)}</option>`).join("");
}

export function modelManagerRows(provider) {
  const models = provider?.models || [];
  if (!models.length) return `<div class="settings-model-manager-empty"><strong>No models configured</strong><span>Add a model from the editor beside this card.</span></div>`;
  return models.map(model => `<label class="settings-model-manager-row"><input type="checkbox" value="${escapeHtml(model.model)}" data-manager-model><span class="settings-model-manager-check" aria-hidden="true"></span><span class="settings-model-manager-copy"><strong>${escapeHtml(model.name || model.model)}</strong><code>${escapeHtml(model.model)}</code></span></label>`).join("");
}

function pluginRows(plugins) {
  if (!plugins.length) return `<div class="settings-empty">No plugins configured.</div>`;
  return `<div class="settings-list">${plugins.map(plugin => `<div class="settings-list-row"><span class="settings-row-icon settings-row-icon--violet">${icon.plugin}</span><strong title="${escapeHtml(plugin)}">${escapeHtml(plugin)}</strong><button class="settings-switch is-on" type="button" role="switch" aria-checked="true" aria-label="Manage ${escapeHtml(plugin)}" data-route="integrations"><span></span></button><button class="settings-icon-button" type="button" data-route="integrations" aria-label="Open plugin settings">${icon.more}</button></div>`).join("")}</div>`;
}

function mcpRows(mcps) {
  const entries = Object.entries(mcps || {});
  if (!entries.length) return `<div class="settings-empty">No MCP servers configured.</div>`;
  return `<div class="settings-list settings-mcp-list">${entries.map(([name]) => `<div class="settings-list-row settings-mcp-row"><span class="settings-row-icon settings-row-icon--green">${icon.server}</span><strong>${escapeHtml(name)}</strong><span class="settings-configured"><i></i>Configured</span><button class="settings-icon-button" type="button" data-route="integrations" aria-label="Open ${escapeHtml(name)} settings">${icon.more}</button></div>`).join("")}</div>`;
}

export function settingsWorkspaceMarkup({ providers, plugins, mcps, preferences, profiles, activeProfile }) {
  const provider = providers[0] || null;
  const profileList = Array.isArray(profiles) ? profiles : [];
  const current = activeProfile || profileList[0] || "coding";
  return `<section class="settings-workspace">
    <h1 class="page-title">Workspace configuration</h1>
    <div class="settings-layout">
      <aside class="settings-rail">
        <nav class="settings-nav control-room-card control-room-card--settings" aria-label="Settings sections">
          ${navItem("modelsReasoning", "Models", "cube", true)}${navItem("settingsPlugins", "Plugins", "plugin", false)}${navItem("settingsMcps", "MCP servers", "server", false)}${navItem("buildOutput", "Build output", "code", false)}${navItem("developerSettings", "Developer settings", "sliders", false)}
        </nav>
        <section id="settingsProfile" class="settings-profile-compact control-room-card control-room-card--developer" aria-labelledby="activeProfileTitle">
          <span id="activeProfileTitle">Active profile</span>
          <div class="settings-profile-current"><strong>${escapeHtml(current)}</strong><button id="profileChange" type="button" ${profileList.length ? "" : "disabled"} aria-expanded="false" aria-controls="profileList">Change profile</button></div>
          <div id="profileList" class="settings-profile-list" hidden>${profileList.map(name => `<button type="button" class="settings-profile-item ${name === current ? "is-active" : ""}" data-profile="${escapeHtml(name)}" aria-pressed="${name === current ? "true" : "false"}">${escapeHtml(name)}${name === current ? '<span class="settings-profile-check">Current</span>' : ""}</button>`).join("") || '<p class="settings-empty">No profiles found.</p>'}</div>
          <p id="profileMessage" class="settings-message" role="status"></p>
        </section>
      </aside>
      <div class="settings-modules">
        <article id="modelsReasoning" class="card settings-module control-room-card control-room-card--models settings-models"><h2>Models & reasoning</h2>
          <div class="settings-model-grid"><label>Provider<select id="settingsProvider">${providerOptions(providers)}</select></label><label>Model<select id="settingsModel">${modelOptions(provider)}</select></label></div>
          <div id="settingsReasoningPanel" class="settings-reasoning-panel" hidden>
            <div class="settings-reasoning-head"><div class="settings-reasoning-title"><span>Selected model</span><strong id="settingsReasoningModel"></strong></div><span class="settings-reasoning-current" id="settingsReasoningCurrent"></span></div>
            <label class="settings-reasoning-control" for="settingsReasoningFormat"><span>Reasoning format</span><small>Choose the request format this model understands.</small><select id="settingsReasoningFormat"></select></label>
            <fieldset class="settings-reasoning-control settings-reasoning-levels"><legend>Reasoning choices</legend><small>Select every effort level this model supports.</small><div class="settings-reasoning-options" id="settingsReasoningLevels"></div></fieldset>
            <div class="settings-reasoning-actions"><button id="settingsReasoningSave" class="button button--primary button--small" type="button">Save reasoning</button><button id="settingsReasoningRemove" class="button button--danger button--small" type="button">Remove model</button><span class="settings-reasoning-saved" id="settingsReasoningSaved" role="status"></span></div>
          </div>
          <p class="settings-model-context" id="settingsModelContext"><strong>${provider?.models?.length || 0} ${(provider?.models?.length || 0) === 1 ? "model" : "models"}</strong><span>Models are saved to <code>${escapeHtml(provider?.id || "provider")}-models.json</code>.</span></p>
          <button id="addModel" class="button settings-outline-button" type="button" ${provider ? "" : "disabled"}>${icon.plus}Add model</button><p id="modelsMessage" class="settings-message" role="status"></p>
        </article>
        <div class="settings-side-stack">
          <article id="settingsPlugins" class="card settings-module control-room-card control-room-card--plugins settings-plugins-module"><h2>Plugins</h2>${pluginRows(plugins)}<button class="button settings-outline-button" type="button" data-route="integrations">${icon.plus}Add plugin</button></article>
          <article id="settingsModelManager" class="card settings-module control-room-card control-room-card--models settings-model-manager"><div class="settings-model-manager-head"><div><span>Provider library</span><h2>Manage models</h2></div><label>Provider<select id="modelManagerProvider">${providerOptions(providers)}</select></label></div><div id="modelManagerList" class="settings-model-manager-list">${modelManagerRows(provider)}</div><div class="settings-model-manager-foot"><span id="modelManagerSelection">0 selected</span><button id="modelManagerDelete" class="button settings-model-manager-delete" type="button" disabled>Delete selected</button></div><p id="modelManagerMessage" class="settings-message" role="status"></p></article>
        </div>
        <article id="settingsMcps" class="card settings-module control-room-card control-room-card--mcp settings-mcps-module"><h2>MCP servers</h2>${mcpRows(mcps)}<button class="button settings-outline-button" type="button" data-route="integrations">${icon.plus}Add server</button></article>
        <article id="buildOutput" class="card settings-module control-room-card control-room-card--build settings-build-module"><h2>Build output</h2><pre id="settingsBuildOutput" class="settings-terminal" aria-live="polite"><span class="terminal-ready">[ready]</span> Build has not run in this session.</pre><button id="settingsBuild" class="button button--primary" type="button">${icon.play}Build my config</button></article>
        <article id="developerSettings" class="card settings-module control-room-card control-room-card--developer settings-developer-module"><h2>Developer settings</h2>
          <form id="preferenceForm"><label class="settings-preference-row"><span>Log retention</span><select id="retentionDays">${[7, 14, 30, 60, 90, 180, 365].map(days => `<option value="${days}" ${Number(preferences.activityRetentionDays) === days ? "selected" : ""}>${days} days</option>`).join("")}</select></label><div class="settings-preference-row settings-preference-row--privacy"><span class="settings-preference-copy"><span>Redact request content</span><small>Request content is never stored.</small></span><span class="settings-locked-status" aria-label="Request-content redaction is always on"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Always on</span></div><label class="settings-preference-row"><span>Animation</span><select id="motionPreference"><option value="system" ${preferences.reducedMotion === "system" ? "selected" : ""}>Follow system</option><option value="reduce" ${preferences.reducedMotion === "reduce" ? "selected" : ""}>Reduce motion</option></select></label><p id="preferenceMessage" class="settings-message" role="status"></p></form>
        </article>
      </div>
    </div>
  </section>`;
}

export function modelsForProvider(providers, id) {
  return providers.find(provider => provider.id === id)?.models || [];
}
