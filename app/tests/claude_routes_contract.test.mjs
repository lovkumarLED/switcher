import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isApplied, hasPendingChanges, claudeRoutesMarkup, PRESERVATION_NOTICE, RESTART_NOTICE, ENV_REF_HELP, COMPAT_CONFIRM_TEXT, recommendClaudeCompatibility } from "../assets/js/pages/claude-routes.js";
import { renderProviderWorkspace } from "../assets/js/pages/provider-workspace.js";
import { store } from "../assets/js/core/store.js";

const routesSource = await readFile(new URL("../assets/js/pages/claude-routes.js", import.meta.url), "utf8");
const providersSource = await readFile(new URL("../assets/js/pages/providers.js", import.meta.url), "utf8");
const providerCssSource = await readFile(new URL("../assets/css/provider-workspace.css", import.meta.url), "utf8");
const workspaceSource = await readFile(new URL("../assets/js/pages/provider-workspace.js", import.meta.url), "utf8");

const route = {
  id: "route-1", name: "Main", baseUrl: "https://api.example.test/v1", authKind: "apiKey",
  secretEnvRef: "BDF_GATE4A_API_KEY_REF", model: "sonnet", gatewayDiscovery: true,
  disableExperimentalBetas: true, autoCompactWindow: 190000, disableNonessentialTraffic: false,
  configSha256: "a".repeat(64),
};

const storeData = { routes: [route], appliedRouteId: "route-1", appliedRouteConfigSha256: "a".repeat(64) };

test("applied state compares the backend configSha256 field, never a client array", () => {
  assert.equal(isApplied(route, storeData), true);
  assert.equal(hasPendingChanges(route, storeData), false);
  const edited = { ...route, model: "other-model", configSha256: "b".repeat(64) };
  assert.equal(isApplied(edited, storeData), false);
  assert.equal(hasPendingChanges(edited, storeData), true);
  assert.doesNotMatch(routesSource, /JSON\.stringify\(\[/);
});

test("claude routes workspace renders title, add action, and cards", () => {
  const markup = claudeRoutesMarkup([route], storeData);
  assert.match(markup, /Claude routes/);
  assert.doesNotMatch(markup, /one route can be applied at a time/);
  assert.match(markup, /Add route/);
  assert.match(markup, /claude-route-card/);
});

test("routes page uses the two-column workspace and a summary chip bar", () => {
  const markup = claudeRoutesMarkup([route], storeData, { mcps: [{ name: "fs", type: "stdio" }], plugins: ["skills@market"] });
  assert.match(markup, /claude-routes-workspace/);
  assert.match(markup, /claude-routes-main/);
  assert.match(markup, /claude-routes-sidebar/);
  assert.match(markup, /claude-chipbar/);
  assert.match(markup, /1 saved routes/);
  assert.match(markup, /Applied: Main/);
  assert.match(markup, /1 MCP servers/);
  assert.match(markup, /1 plugins/);
});

test("routes page places the Claude status rail in the header beneath its actions", () => {
  const markup = claudeRoutesMarkup([route], storeData);
  assert.match(markup, /claude-routes-page-head/);
  assert.match(markup, /claude-route-header-rail/);
  assert.match(markup, /claude-routes-sidebar claude-routes-sidebar--header/);
  assert.match(markup, /claude-route-header-actions/);
  const actionsIndex = markup.indexOf("claude-route-header-actions");
  const settingsIndex = markup.indexOf("control-room-card--settings", actionsIndex);
  const credentialsIndex = markup.indexOf("control-room-card--credentials", settingsIndex);
  assert.ok(actionsIndex < settingsIndex && settingsIndex < credentialsIndex);
  assert.match(providerCssSource, /\.claude-route-header-rail\s*\{/);
  assert.match(providerCssSource, /\.claude-routes-workspace--header-rail\s*\{[^}]*align-items:\s*start/s);
  assert.match(providerCssSource, /\.claude-routes-workspace--header-rail\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
});

test("Claude route side panels use compact control-room surfaces", () => {
  assert.match(routesSource, /control-room-card--settings/);
  assert.match(routesSource, /control-room-card--credentials/);
  assert.match(providerCssSource, /\.control-room-card--credentials/);
});

test("routes page keeps the shared coding-agent switcher available", () => {
  const markup = claudeRoutesMarkup([route], storeData);
  assert.match(markup, /class="provider-agent-tabs(?: [^"]+)?" role="tablist" aria-label="Coding agents"/);
  assert.match(markup, /data-provider-agent="opencode"/);
  assert.match(markup, /data-provider-agent="kilo"/);
  assert.match(markup, /data-provider-agent="claude-code"/);
  assert.match(markup, /aria-selected="true"/);
});

test("routes page routes agent-tab clicks through the shared change callback", () => {
  assert.match(routesSource, /renderClaudeRoutes\(workspace, \{ activeAgentId = "claude-code", onAgentChange = null \} = \{\}\)/);
  assert.match(routesSource, /agentTablist.setAttribute\("aria-busy", "true"\)/);
  assert.match(routesSource, /onAgentChange\(nextAgent\)/);
  assert.match(providersSource, /renderClaudeRoutes\(workspace, \{[\s\S]*onAgentChange:/);
  assert.match(providersSource, /ai-switcher:agent-changed/);
});

test("routes page removes redundant helper copy from the main surface", () => {
  const markup = claudeRoutesMarkup([route], storeData);
  assert.doesNotMatch(markup, /Multiple saved routes; one route can be applied at a time\./);
  assert.doesNotMatch(markup, /Startup values/);
});

test("route details stay read-only because card actions already own mutations", () => {
  assert.doesNotMatch(routesSource, /data-edit-route/);
  assert.doesNotMatch(routesSource, /data-delete-route/);
});

test("route metadata and credential states use distinct visual badges", () => {
  const roleRoute = { ...route, model: "", modelRoles: { sonnet: "gateway/sonnet" } };
  const markup = claudeRoutesMarkup([roleRoute], { ...storeData, appliedRouteId: null, appliedRouteConfigSha256: null }, null, [{ name: "ORCA_API_KEY", backend: "store", usedBy: ["orcarouter"] }]);
  assert.match(markup, /claude-type-chip--roles/);
  assert.match(markup, /claude-type-chip--store/);
  assert.match(markup, /claude-credential-badge/);
});

test("route action grid gives Edit route its own full row", () => {
  assert.match(providerCssSource, /\.claude-route-card\.provider-deck-card \[data-route-action="edit"\]\s*\{[^}]*grid-column:\s*1 \/ -1/);
});

test("route mutations preserve the agent switcher callback on rerender", () => {
  assert.match(routesSource, /WeakMap\(\)/);
  assert.match(routesSource, /function rerenderClaudeRoutes\(workspace\)/);
  assert.doesNotMatch(routesSource, /await renderClaudeRoutes\(workspace\);/);
});

test("route card shows endpoint, model, and auth reference clearly", () => {
  const markup = claudeRoutesMarkup([route], storeData);
  assert.match(markup, /Endpoint/);
  assert.match(markup, /https:\/\/api\.example\.test\/v1/);
  assert.match(markup, /Model/);
  assert.match(markup, /sonnet/);
  assert.match(markup, /API key/);
  assert.match(markup, /BDF_GATE4A_API_KEY_REF/);
  assert.match(markup, /claude-route-card__meta/);
});

test("card actions are limited to Apply route and View details", () => {
  const appliedMarkup = claudeRoutesMarkup([route], storeData);
  assert.doesNotMatch(appliedMarkup, /Deactivate provider/);
  assert.doesNotMatch(appliedMarkup, /Test connection/);
  assert.doesNotMatch(appliedMarkup, /Remove provider/);
  const savedStore = { ...storeData, appliedRouteId: null, appliedRouteConfigSha256: null };
  const savedMarkup = claudeRoutesMarkup([route], savedStore);
  assert.match(savedMarkup, /Apply route/);
  assert.match(savedMarkup, /View details/);
});

test("editor never renders SDK, package, reasoning, or activation controls", () => {
  assert.doesNotMatch(routesSource, /SDK type/);
  assert.doesNotMatch(routesSource, /provider package/);
  assert.doesNotMatch(routesSource, /reasoning-format selector/);
  assert.doesNotMatch(routesSource, /data-provider-action="activate"/);
  assert.match(routesSource, /claudeRouteAuthKind/);
  assert.match(routesSource, /claudeRouteSecretEnvRef/);
});

test("editor takes the API key value and never echoes it back", () => {
  assert.match(routesSource, /claudeRouteSecret/);
  assert.match(routesSource, /Paste your key here/);
  assert.match(routesSource, /no manual setup, no restart/);
  assert.match(routesSource, /secretValue:/);
  assert.doesNotMatch(routesSource, /claudeRouteSecret"[^>]*value=/);
});

test("route details marks app-managed environment variables", () => {
  assert.match(routesSource, /managed by Switcher/);
  assert.match(routesSource, /envVarManaged/);
});

test("preservation, restart, and env-reference notices are exact", () => {
  assert.equal(PRESERVATION_NOTICE, "Claude-owned settings preserved.");
  assert.equal(RESTART_NOTICE, "Restarting Claude Code may be required for startup-only values.");
  assert.equal(ENV_REF_HELP, "Environment variable name, not the secret value.");
});

test("unsupported surface is read-only, never controls, and the adapter-scope essay stays off the page", () => {
  const markup = claudeRoutesMarkup([route], storeData);
  assert.doesNotMatch(markup, /Not managed by this adapter/);
  assert.doesNotMatch(markup, /data-mcp/);
  assert.doesNotMatch(markup, /data-plugin/);
});

test("delete applied route is guarded in the details flow", () => {
  assert.match(routesSource, /Apply another route before deleting the applied route/);
  const appliedDetails = claudeRoutesMarkup([route], storeData);
  assert.doesNotMatch(appliedDetails, /data-delete-route/);
});

test("API values are escaped before innerHTML insertion", () => {
  assert.match(routesSource, /escapeHtml\(/);
  const malicious = { ...route, name: "<img src=x onerror=alert(1)>" };
  const markup = claudeRoutesMarkup([malicious], { routes: [malicious], appliedRouteId: null, appliedRouteConfigSha256: null });
  assert.doesNotMatch(markup, /<img src=x/);
});

test("revision tokens are submitted with mutations", () => {
  assert.match(routesSource, /expectedRevision/);
  assert.match(routesSource, /expectedRoutesRevision/);
});

test("provider workspace delegates to routes when Claude is active", () => {
  store.set({ capabilities: { providerMode: "scalar-route" } });
  assert.match(workspaceSource, /renderClaudeRoutes/);
  assert.match(workspaceSource, /isClaude\(\)/);
});

test("agent switcher offers Claude Code as a separate page, never a provider tile", () => {
  assert.match(workspaceSource, /data-provider-agent="claude-code"/);
  assert.match(workspaceSource, /aria-selected="\$\{activeAgentId === "claude-code"\}"/);
  assert.match(workspaceSource, /Claude Code/);
  assert.doesNotMatch(workspaceSource, /data-provider-action="claude/);
});

test("routes page fetches the read-only inventory and credentials for the chip bar", () => {
  assert.match(routesSource, /api\.claudeScan\(\)/);
  assert.match(routesSource, /api\.claudeCredentials\(\)\.catch\(\(\) => null\)/);
  assert.match(routesSource, /claudeRoutesMarkup\(data\.routes \|\| \[\], data, inventory, credentials && credentials\.credentials, activeAgentId\)/);
});

test("inventory chips degrade gracefully when the scan is absent", () => {
  const markup = claudeRoutesMarkup([route], storeData);
  assert.match(markup, /0 MCP servers/);
  assert.match(markup, /0 plugins/);
});

test("restore button wired to restore client with stored revisions", () => {
  assert.match(routesSource, /restoreClaude\(/);
  assert.match(routesSource, /data-claude-restore/);
});

test("recommendation: discovery on only for yes models and traffic not suppressed", () => {
  const r = recommendClaudeCompatibility({ hasModelsEndpoint: "yes", supportsBetaFields: "yes", contextWindow: "200000", suppressNonessentialTraffic: false });
  assert.equal(r.values.gatewayDiscovery, true);
  assert.equal(r.values.autoCompactWindow, 200000);
  assert.deepEqual(r.notes, []);
});

test("recommendation: discovery blocked by suppressed traffic", () => {
  const r = recommendClaudeCompatibility({ hasModelsEndpoint: "yes", supportsBetaFields: "yes", contextWindow: "", suppressNonessentialTraffic: true });
  assert.equal(r.values.gatewayDiscovery, false);
  assert.equal(r.values.disableNonessentialTraffic, true);
  assert.ok(r.notes.some(n => n.code === "DISCOVERY_BLOCKED_BY_NONESSENTIAL_TRAFFIC" && n.tone === "warning"));
});

test("recommendation: betas disabled only when beta fields unsupported", () => {
  const no = recommendClaudeCompatibility({ hasModelsEndpoint: "no", supportsBetaFields: "no", contextWindow: "", suppressNonessentialTraffic: false });
  assert.equal(no.values.disableExperimentalBetas, true);
  const yes = recommendClaudeCompatibility({ hasModelsEndpoint: "no", supportsBetaFields: "yes", contextWindow: "", suppressNonessentialTraffic: false });
  assert.equal(yes.values.disableExperimentalBetas, false);
});

test("recommendation: unknown beta support warns without enabling", () => {
  const r = recommendClaudeCompatibility({ hasModelsEndpoint: "no", supportsBetaFields: "unknown", contextWindow: "", suppressNonessentialTraffic: false });
  assert.equal(r.values.disableExperimentalBetas, false);
  assert.ok(r.notes.some(n => n.code === "BETA_COMPATIBILITY_NOT_VERIFIED" && n.tone === "warning"));
});

test("recommendation: context below minimum clamps and warns", () => {
  const r = recommendClaudeCompatibility({ hasModelsEndpoint: "no", supportsBetaFields: "yes", contextWindow: "50000", suppressNonessentialTraffic: false });
  assert.equal(r.values.autoCompactWindow, 100000);
  assert.ok(r.notes.some(n => n.code === "CONTEXT_BELOW_SUPPORTED_MINIMUM" && n.tone === "warning"));
});

test("recommendation: context above maximum caps with info", () => {
  const r = recommendClaudeCompatibility({ hasModelsEndpoint: "no", supportsBetaFields: "yes", contextWindow: "2000000", suppressNonessentialTraffic: false });
  assert.equal(r.values.autoCompactWindow, 1000000);
  assert.ok(r.notes.some(n => n.code === "CONTEXT_CAPPED_AT_SUPPORTED_MAXIMUM" && n.tone === "info"));
});

test("recommendation: unknown context keeps 190000 starting value", () => {
  const r = recommendClaudeCompatibility({ hasModelsEndpoint: "no", supportsBetaFields: "yes", contextWindow: "", suppressNonessentialTraffic: false });
  assert.equal(r.values.autoCompactWindow, 190000);
  assert.ok(r.notes.some(n => n.code === "CONTEXT_NOT_VERIFIED" && n.tone === "info"));
});

test("recommendation: suppressed traffic mirrors input", () => {
  const on = recommendClaudeCompatibility({ hasModelsEndpoint: "no", supportsBetaFields: "yes", contextWindow: "", suppressNonessentialTraffic: true });
  const off = recommendClaudeCompatibility({ hasModelsEndpoint: "no", supportsBetaFields: "yes", contextWindow: "", suppressNonessentialTraffic: false });
  assert.equal(on.values.disableNonessentialTraffic, true);
  assert.equal(off.values.disableNonessentialTraffic, false);
});

test("assistant: four curated controls only, no raw env editor", () => {
  assert.match(routesSource, /claudeRouteGateway/);
  assert.match(routesSource, /claudeRouteBetas/);
  assert.match(routesSource, /claudeRouteCompact/);
  assert.match(routesSource, /claudeRouteTraffic/);
  assert.doesNotMatch(routesSource, /claudeRouteEnvEditor/);
  assert.doesNotMatch(routesSource, /<textarea[^>]*env/);
});

test("assistant: confirmation required before save, never pre-checked", () => {
  assert.equal(COMPAT_CONFIRM_TEXT, "I reviewed these compatibility settings and their tradeoffs.");
  assert.match(routesSource, /claudeRouteCompatConfirm/);
  assert.match(routesSource, /Review and confirm the compatibility settings before saving/);
  assert.doesNotMatch(routesSource, /id="claudeRouteCompatConfirm"[^>]*checked/);
});

test("assistant: apply button gated behind Show recommendations", () => {
  assert.match(routesSource, /data-compat-recommend/);
  assert.match(routesSource, /data-compat-apply disabled/);
  assert.match(routesSource, /Show recommendations/);
  assert.match(routesSource, /Apply recommendations/);
});

test("assistant: no gateway contact copy is present", () => {
  assert.match(routesSource, /no gateway is contacted to generate them/);
});

test("assistant: conflict UI unchecks and disables the conflicting option", () => {
  assert.match(routesSource, /syncConflict/);
  assert.match(routesSource, /traffic\.checked && gateway\.checked/);
  assert.match(routesSource, /gateway\.checked = false/);
  assert.match(routesSource, /gateway\.disabled = true/);
});

test("assistant: mobile-scoped classes exist in CSS", async () => {
  const cssSource = await readFile(new URL("../assets/css/provider-workspace.css", import.meta.url), "utf8");
  assert.match(cssSource, /\.claude-compat-assistant/);
  assert.match(cssSource, /@media \(max-width: 560px\)/);
  assert.match(cssSource, /\.claude-compat-actions/);
});

test("route editor exposes Claude model roles for the four aliases", () => {
  assert.match(routesSource, /Claude model roles/);
  assert.match(routesSource, /data-role-model="\$\{role\}"/);
  assert.match(routesSource, /\["opus",\s*"sonnet",\s*"haiku",\s*"fable"\]/);
  assert.match(routesSource, /Each role holds one model ID/);
});

test("route editor exposes the picker restrict toggle", () => {
  assert.match(routesSource, /claudeRouteRestrict/);
  assert.match(routesSource, /Restrict the \/model picker to this route's models/);
  assert.match(routesSource, /availableModels/);
  assert.match(routesSource, /enforceAvailableModels/);
});

test("route editor uses the shared control-room form hierarchy and expressive choice controls", () => {
  for (const className of ["claude-route-editor", "claude-route-form-section", "claude-route-toggle", "claude-role-grid", "claude-role-card"])
    assert.match(routesSource, new RegExp(className));
  assert.match(providerCssSource, /\.claude-route-editor\s*\{/);
  assert.match(providerCssSource, /\.claude-route-form-section\s*\{/);
  assert.match(providerCssSource, /\.claude-route-toggle\s+input\[type="checkbox"\]\s*\{[^}]*appearance:\s*none/is);
  assert.match(providerCssSource, /\.claude-role-card\s*\{[^}]*border-radius:\s*14px/is);
  assert.match(providerCssSource, /\.claude-route-dialog \.dialog__actions\s*\{[^}]*border-radius:\s*16px/is);
});

test("route editor uses branded stepper controls for context values", () => {
  assert.match(routesSource, /claude-number-control/);
  assert.match(routesSource, /data-number-step="down"/);
  assert.match(routesSource, /data-number-step="up"/);
  assert.match(routesSource, /numberControl\(\{ id: "claudeCompatContext"[^}]*step: 10000/s);
  assert.match(routesSource, /numberControl\(\{ id: "claudeCompatContext"[^}]*start: 100000/s);
  assert.match(routesSource, /numberControl\(\{ id: "claudeRouteCompact"[^}]*step: 10000/s);
  assert.match(routesSource, /data-number-control/);
  assert.match(routesSource, /const raw = input\.value\.trim\(\)/);
  assert.match(routesSource, /raw === ""/);
  assert.match(providerCssSource, /\.claude-number-control\s*\{/);
  assert.match(providerCssSource, /::-webkit-inner-spin-button/);
  assert.match(providerCssSource, /\.claude-number-control__field input\.claude-route-number\s*\{[^}]*-moz-appearance:\s*textfield/s);
  assert.match(providerCssSource, /\.claude-number-control__field input\.claude-route-number::-webkit-inner-spin-button[^}]*-webkit-appearance:\s*none/s);
});

test("auto-compact window is optional via an enable checkbox", () => {
  assert.match(routesSource, /claudeRouteCompactOn/);
  assert.match(routesSource, /autoCompactWindow: compactOn \? Number\(dialog\.querySelector\("#claudeRouteCompact"\)\.value\) : null/);
  assert.match(routesSource, /compactInput\.disabled = !compactOn\.checked/);
});

test("main model ID is optional when role models are assigned", () => {
  assert.doesNotMatch(routesSource, /id="claudeRouteModel"[^>]*required/);
  assert.match(routesSource, /derived from your Sonnet role/);
  assert.match(routesSource, /route\.effectiveModel \|\| route\.model/);
  assert.match(routesSource, /from roles/);
});

test("values reader collects non-empty model roles into the payload", () => {
  assert.match(routesSource, /roles\[input\.dataset\.roleModel\] = value/);
  assert.match(routesSource, /modelRoles: roles/);
  assert.match(routesSource, /restrictModelPicker: dialog\.querySelector\("#claudeRouteRestrict"\)\.checked/);
});

test("details view renders assigned roles and picker state", () => {
  const withRoles = { ...route, modelRoles: { opus: "gateway/role-opus", haiku: "gateway/role-haiku" }, restrictModelPicker: true };
  const source = routesSource;
  assert.match(source, /role\[0\]\.toUpperCase\(\) \+ role\.slice\(1\)/);
  assert.match(source, /Picker \$\{route\.restrictModelPicker === false \? "unrestricted" : "restricted to route models"\}/);
});

test("credentials card lists app-managed credentials with backend and usage", () => {
  const creds = [{ name: "ORCA_API_KEY", backend: "store", usedBy: ["orcarouter"] }];
  const markup = claudeRoutesMarkup([route], storeData, null, creds);
  assert.match(markup, /Credentials/);
  assert.match(markup, /ORCA_API_KEY/);
  assert.match(markup, /locked store/);
  assert.match(markup, /Used by orcarouter/);
  assert.doesNotMatch(markup, /data-cred-delete="ORCA_API_KEY"/);
});

test("credentials card offers delete only for unreferenced orphans", () => {
  const creds = [{ name: "ORPHAN_KEY", backend: "store", usedBy: [] }];
  const markup = claudeRoutesMarkup([route], storeData, null, creds);
  assert.match(markup, /data-cred-delete="ORPHAN_KEY"/);
  assert.match(markup, /Not used by any route/);
});

test("credentials card hides when the fetch is absent", () => {
  const markup = claudeRoutesMarkup([route], storeData, null, null);
  assert.doesNotMatch(markup, /claude-cred-list/);
});

test("credentials endpoints are wired in the client", () => {
  assert.match(routesSource, /api\.claudeCredentials\(\)/);
  assert.match(routesSource, /api\.deleteClaudeCredential\(/);
});
