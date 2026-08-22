import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolveDestination, navigationFor, isClaude, isOpenCodeFamily, builderAvailable } from "../assets/js/core/capabilities.js";
import { store } from "../assets/js/core/store.js";
import { claudeOverviewMarkup, claudeRouteDeckMarkup, relayItems, relayStackMarkup } from "../assets/js/pages/overview.js";
import { providerLogoMark } from "../assets/js/core/provider-logo.js";

const claude = { providerMode: "scalar-route", savedRoutes: true, providerCreation: false, providerActivation: false, pluginsManaged: false, mcpManaged: false, integrationsVisible: false, reasoningFormats: false, sdkSelection: false, profilesMode: "routing-profiles", requestAnalytics: false, routingActivity: true, builderAvailable: false };
const opencode = { providerMode: "multi-provider", savedRoutes: false, providerCreation: true, providerActivation: true, pluginsManaged: true, mcpManaged: true, integrationsVisible: true, reasoningFormats: true, sdkSelection: true, profilesMode: "bdf-profiles", requestAnalytics: true, routingActivity: false, builderAvailable: true };

const overviewSource = await readFile(new URL("../assets/js/pages/overview.js", import.meta.url), "utf8");
const activitySource = await readFile(new URL("../assets/js/pages/activity.js", import.meta.url), "utf8");
const activityCssSource = await readFile(new URL("../assets/css/activity-workspace.css", import.meta.url), "utf8");
const settingsSource = await readFile(new URL("../assets/js/pages/settings.js", import.meta.url), "utf8");
const providerCssSource = await readFile(new URL("../assets/css/provider-workspace.css", import.meta.url), "utf8");
const routerSource = await readFile(new URL("../assets/js/core/router.js", import.meta.url), "utf8");
const sidebarSource = await readFile(new URL("../assets/js/core/sidebar.js", import.meta.url), "utf8");
const mainSource = await readFile(new URL("../assets/js/main.js", import.meta.url), "utf8");
const onboardingSource = await readFile(new URL("../assets/js/pages/onboarding.js", import.meta.url), "utf8");

test("capability helpers resolve from the central contract", () => {
  store.set({ capabilities: claude });
  assert.equal(isClaude(), true);
  assert.equal(isOpenCodeFamily(), false);
  assert.equal(builderAvailable(), false);
  store.set({ capabilities: opencode });
  assert.equal(isClaude(), false);
  assert.equal(isOpenCodeFamily(), true);
  assert.equal(builderAvailable(), true);
  store.set({ capabilities: null });
  assert.equal(isClaude(), false);
});

test("navigation labels and hidden destinations come from capabilities", () => {
  const navClaude = navigationFor(claude);
  assert.equal(navClaude.providersLabel, "Routes");
  assert.deepEqual([...navClaude.hiddenDestinations], ["integrations"]);
  const navOpen = navigationFor(opencode);
  assert.equal(navOpen.providersLabel, "Providers");
  assert.equal(navOpen.hiddenDestinations.size, 0);
});

test("hidden destinations redirect to overview", () => {
  assert.equal(resolveDestination("integrations", claude), "overview");
  assert.equal(resolveDestination("integrations", opencode), "integrations");
  assert.equal(resolveDestination("providers", claude), "providers");
});

test("router consults capabilities and sidebar adapts labels and visibility", () => {
  assert.match(routerSource, /resolveDestination/);
  assert.match(sidebarSource, /applyCapabilityNavigation/);
  assert.match(sidebarSource, /Routes/);
  assert.match(sidebarSource, /integrations/);
  assert.match(sidebarSource, /globalBuildButton/);
});

test("first render waits for capabilities; build blocked for Claude", () => {
  assert.match(mainSource, /async function showWorkspace/);
  assert.match(mainSource, /await safeRefreshAgentContext/);
  assert.match(mainSource, /api\.capabilities\(\)/);
  assert.match(mainSource, /applyCapabilityNavigation/);
  assert.match(mainSource, /builderAvailable/);
});

test("pages consume capabilities centrally, never agent checks", () => {
  for (const [name, source] of [["overview", overviewSource], ["activity", activitySource], ["settings", settingsSource]]) {
    assert.match(source, /isClaude\(\)/, `${name} must branch on the central capability`);
    assert.doesNotMatch(source, /agent === "claude"|agent === 'claude'|=== "claudecode"/, `${name} must not invent agent checks`);
  }
});

test("overview swaps provider content for route status when Claude is active", () => {
  assert.match(overviewSource, /renderClaudeOverview/);
  assert.match(overviewSource, /Your provider relay/);
  assert.match(overviewSource, /claudeActivity/);
});

test("claude overview renders a route deck, health grid, inventory blocks, and activity table", () => {
  const markup = claudeOverviewMarkup({
    routes: [{ id: "r1", name: "Local relay", baseUrl: "http://localhost:8082", model: "claude-sonnet", secretEnvRef: "ANTHROPIC_AUTH_TOKEN" }, { id: "r2", name: "Cloud relay", baseUrl: "https://relay.example/v1", model: "claude-opus", secretEnvRef: "ANTHROPIC_API_KEY" }],
    appliedRouteId: "r1",
    appliedRouteConfigSha256: "sha-1",
    status: { settingsPresent: true, lastBackupAvailable: true, realTargetLocked: false },
    activity: [{ ts: "2026-08-20T10:00:00Z", type: "route_applied", routeId: "r1" }],
    inventory: { statePresent: true, stateParseError: false, mcps: [{ name: "filesystem", type: "stdio" }, { name: "web", type: "http" }], plugins: ["design@official", "review@official"] },
  });
  assert.match(markup, /claude-route-deck/);
  assert.match(markup, /data-claude-route-next/);
  assert.match(markup, /claude-health-grid/);
  assert.match(markup, /claude-inventory-block/);
  assert.match(markup, /claude-inventory-block--mcp/);
  assert.match(markup, /claude-inventory-block--plugins/);
  assert.match(markup, /claude-activity-table/);
  assert.match(markup, /claude-activity-table__head/);
  for (const tone of ["relay", "health", "inventory", "activity"]) assert.match(markup, new RegExp(`control-room-card--${tone}`));
  assert.doesNotMatch(markup, /One active route, transparent health, and read-only Claude inventory\./);
  assert.doesNotMatch(markup, /Scanned from \.claude\.json - read-only/);
  assert.match(markup, /Local relay/);
  assert.match(markup, /Your provider relay/);
  assert.match(markup, /Choose the route Claude uses/);
  assert.match(markup, /data-claude-overview-details="r1"/);
  assert.match(markup, />View details<\/button>/);
});

test("Claude route activity is compact and scrollable without a visible scrollbar", () => {
  assert.match(providerCssSource, /\.claude-overview-card--activity[^}]*max-height/);
  assert.match(providerCssSource, /\.claude-activity-list[^}]*max-height:\s*250px/);
  assert.match(providerCssSource, /\.claude-activity-list::-webkit-scrollbar/);
  assert.match(providerCssSource, /scrollbar-width:\s*none/);
  assert.match(providerCssSource, /\.claude-activity-table__head\s*\{[^}]*background:\s*var\(--surface-soft\)/);
});

test("Claude inventory blocks use a distinct accent rail for each collection", () => {
  assert.match(providerCssSource, /\.claude-inventory-block::before/);
  assert.match(providerCssSource, /\.claude-inventory-block--mcp/);
  assert.match(providerCssSource, /\.claude-inventory-block--plugins/);
});

test("provider relay cycles only through real providers", () => {
  const providers = [
    { id: "one", name: "One", models: [], baseUrl: "http://one", active: true },
    { id: "two", name: "Two", models: [], baseUrl: "http://two", active: false },
  ];
  const items = relayItems(providers);
  assert.equal(items.length, providers.length);
  assert.equal(items.some(item => item.isAddSlot), false);
  const stack = relayStackMarkup([
    ...providers,
    { id: "three", name: "Three", models: [], baseUrl: "http://three", active: false },
  ], 0, "one");
  assert.match(stack, /Two/);
  assert.match(stack, /Three/);
  assert.doesNotMatch(relayStackMarkup(items, items.length - 1, "one"), /Add another provider/);
});

test("Claude route relay cycles only through saved routes", () => {
  const markup = claudeRouteDeckMarkup([
    { id: "r1", name: "Local relay", baseUrl: "http://localhost:8082", model: "claude-sonnet" },
  ], { appliedRouteId: "r1", appliedRouteConfigSha256: "sha" }, 1);
  assert.doesNotMatch(markup, /Add another route/);
  assert.match(markup, /claude-route-deck__card--front/);
});

test("provider logos are stable generated marks for unknown providers", () => {
  const first = providerLogoMark("OrcaRouter", { id: "orca-router", size: "md" });
  const second = providerLogoMark("OrcaRouter", { id: "orca-router", size: "md" });
  const other = providerLogoMark("Another Router", { id: "another-router", size: "md" });
  assert.equal(first, second);
  assert.notEqual(first, other);
  assert.match(first, /gen-logo--generated/);
  assert.match(first, /data-provider-logo="orca-router"/);
  assert.match(first, /<svg/);
  assert.match(providerLogoMark("OpenRouter", { id: "openrouter" }), /assets\/brands\/openrouter\.svg/);
  assert.match(providerLogoMark("CLI Proxy", { id: "cli-proxy" }), /assets\/brands\/cli-proxy\.svg/);
});

test("generated provider marks use browser-valid SVG transforms", () => {
  const markup = providerLogoMark("Unknown gateway", { id: "unknown-gateway" });
  assert.doesNotMatch(markup, /transform="rotate\(var\(--logo-rot\)/);
  assert.match(markup, /transform="rotate\(\d+ 16 16\)"/);
});

test("claude settings shows the read-only inventory grid", () => {
  assert.match(settingsSource, /renderClaudeSettings/);
  assert.match(settingsSource, /unsupported in this release/);
  assert.match(settingsSource, /claudeScan/);
  assert.match(settingsSource, /claude-settings-grid/);
  assert.match(settingsSource, /claude-inventory-list/);
  assert.match(settingsSource, /control-room-card--inventory/);
  assert.match(settingsSource, /control-room-card--settings/);
});

test("activity swaps request charts for redacted route activity", () => {
  assert.match(activitySource, /renderRouteActivity/);
  assert.match(activitySource, /Route activity/);
  assert.match(activitySource, /No request, token, or latency telemetry/);
});

test("route activity gets a summary chip bar", () => {
  assert.match(activitySource, /claude-chipbar/);
  assert.match(activitySource, /events/);
  assert.match(activitySource, /typeCounts/);
});

test("Claude route activity uses an observability dashboard and audit ledger", () => {
  for (const token of ["claude-activity-workspace", "claude-activity-hero", "claude-activity-pulse", "claude-activity-breakdown", "claude-activity-log", "Audit trail", "Event pulse"]) {
    assert.match(activitySource, new RegExp(token));
  }
  assert.match(activitySource, /api\.claudeRoutes\(\)/);
  assert.match(activityCssSource, /\.claude-activity-workspace/);
  assert.match(activityCssSource, /\.claude-activity-pulse/);
  assert.match(activityCssSource, /\.claude-activity-log__table-wrap[^}]*scrollbar-width:\s*none/s);
});

test("Claude activity keeps privacy copy inside a reference callout", () => {
  assert.match(activitySource, /claude-activity-hero__notice/);
  assert.doesNotMatch(activitySource, /A clear audit trail of the changes Switcher has made/);
  assert.doesNotMatch(activitySource, /Keep the route lifecycle visible without exposing/);
  assert.match(activitySource, /No request, token, or latency telemetry/);
});

test("settings hides plugin, MCP, SDK, reasoning, and profile controls for Claude", () => {
  assert.match(settingsSource, /renderClaudeSettings/);
  assert.match(settingsSource, /unsupported in this release/);
});

test("onboarding offers the Claude Code tile unconditionally with a lock-free scan", () => {
  assert.match(onboardingSource, /claude-code/);
  assert.match(onboardingSource, /claudeScan/);
  assert.doesNotMatch(onboardingSource, /claudeDiscover/);
  assert.match(onboardingSource, /discoveredAgents = \[\.\.\.discoveredAgents, \{ id: "claude-code"/);
  assert.match(onboardingSource, /claudeConnect/);
});

test("onboarding shows the same scanned summary line for Claude Code", () => {
  assert.match(onboardingSource, /Scanned \$\{escapeHtml\(chosenAgent\.name\)\}: \$\{\(scanResult\.providers \|\| \[\]\)\.length\} providers/);
  assert.match(onboardingSource, /\.length\} MCP servers · \$\{\(scanResult\.plugins/);
});
