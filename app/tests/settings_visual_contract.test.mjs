import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(new URL("../assets/js/pages/settings.js", import.meta.url), "utf8");
const view = fs.readFileSync(new URL("../assets/js/pages/settings-workspace.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/css/settings-workspace.css", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../gui.html", import.meta.url), "utf8");

test("settings matches the approved workspace configuration composition", () => {
  assert.match(page, /settings-workspace\.js/);
  for (const text of ["Workspace configuration", "Models & reasoning", "Plugins", "MCP servers", "Build output", "Developer settings", "Build my config", "Log retention", "Redact request content"])
    assert.match(view, new RegExp(text));
  assert.match(view, /settings-workspace/);
  assert.match(css, /grid-template-columns:\s*220px\s+minmax\(0,\s*1fr\)/);
  assert.match(css, /settings-modules/);
  assert.match(css, /@media\s*\(max-width:\s*980px\)/);
  assert.match(shell, /settings-workspace\.css/);
});

test("settings plugin and MCP modules use the shared control-room cards", () => {
  assert.match(view, /control-room-card--plugins/);
  assert.match(view, /control-room-card--mcp/);
  assert.match(css, /\.control-room-card--plugins/);
  assert.match(css, /\.control-room-card--mcp/);
});

test("settings navigation and active profile use the shared control-room surfaces", () => {
  assert.match(view, /<nav class="settings-nav control-room-card control-room-card--settings"/);
  assert.match(view, /settings-profile-compact control-room-card control-room-card--developer/);
  assert.match(css, /\.settings-nav\.control-room-card/);
  assert.match(css, /\.settings-profile-compact\.control-room-card/);
});

test("settings retains real save and build behavior", () => {
  for (const action of ["settingsProvider", "settingsModel", "addModel", "settingsBuild", "retentionDays", "motionPreference"])
    assert.match(view, new RegExp(`id=["']${action}["']`));
  assert.match(page, /api\.updateProvider/);
  assert.match(page, /api\.build/);
  assert.match(page, /api\.updatePreferences/);
});

test("the model editor keeps scrolling but hides native scrollbar chrome", () => {
  assert.match(css, /#modelEditorRows\s*\{[^}]*overflow:\s*auto[^}]*scrollbar-width:\s*none/is);
  assert.match(css, /#modelEditorRows::-webkit-scrollbar\s*\{[^}]*display:\s*none/is);
});

test("active profile is a compact control beneath the settings navigation", () => {
  assert.match(view, /<aside class="settings-rail">[\s\S]*<nav class="settings-nav(?: [^"]+)?"[\s\S]*<section id="settingsProfile" class="settings-profile-compact(?: [^"]+)?"/);
  assert.doesNotMatch(view, /navItem\("settingsProfile",\s*"Profile"/);
  assert.match(view, /navItem\("modelsReasoning",\s*"Models",\s*"cube",\s*true\)/);
  assert.match(css, /\.settings-profile-compact\s*\{[^}]*padding:\s*14px/is);
  assert.match(css, /\.settings-profile-current\s*\{[^}]*display:\s*flex/is);
});

test("active profile menu is not clipped by its control-room card", () => {
  assert.match(css, /\.settings-profile-compact\.control-room-card\s*\{[^}]*overflow:\s*visible/is);
});

test("active profile accent rail stays inside its rounded card border", () => {
  assert.match(css, /\.settings-profile-compact\.control-room-card::before\s*\{[^}]*inset:\s*1px auto 1px 1px[^}]*border-radius:\s*15px 0 0 15px[^}]*clip-path:\s*inset\(0 round 15px 0 0 15px\)/is);
});

test("model reasoning editor uses a polished card hierarchy and pill controls", () => {
  assert.match(view, /settings-reasoning-title[\s\S]*settings-reasoning-current/);
  assert.match(view, /settings-reasoning-control[\s\S]*settings-reasoning-options/);
  assert.match(css, /\.settings-reasoning-panel\s*\{[^}]*background:\s*linear-gradient/is);
  assert.match(css, /\.settings-reasoning-options button\s*\{[^}]*border-radius:\s*999px/is);
  assert.match(css, /\.settings-reasoning-options button\[aria-pressed="true"\]/);
});

test("plugins share their column with a compact multi-delete model manager", () => {
  assert.match(view, /settings-side-stack[\s\S]*id="settingsPlugins"[\s\S]*id="settingsModelManager"/);
  assert.match(view, /id="modelManagerProvider"/);
  assert.match(view, /id="modelManagerList"/);
  assert.match(view, /id="modelManagerDelete"/);
  assert.match(page, /api\.deleteModel/);
  assert.match(page, /for\s*\(const modelId of selectedIds\)/);
  assert.match(css, /\.settings-side-stack\s*\{[^}]*grid-template-rows:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/is);
  assert.match(css, /\.settings-model-manager-list\s*\{[^}]*overflow-y:\s*auto[^}]*scrollbar-width:\s*none/is);
});

test("the compact plugin card scrolls through every plugin without visible chrome", () => {
  assert.doesNotMatch(view, /plugins\.slice\(0,\s*5\)/);
  assert.match(css, /\.settings-plugins-module \.settings-list\s*\{[^}]*overflow-y:\s*auto[^}]*scrollbar-width:\s*none/is);
  assert.match(css, /\.settings-plugins-module \.settings-list::-webkit-scrollbar\s*\{[^}]*display:\s*none/is);
});

test("the compact MCP card keeps every server in an invisible bounded scroller", () => {
  assert.match(view, /settings-list settings-mcp-list/);
  assert.doesNotMatch(view, /entries\.slice\(0,\s*5\)/);
  assert.match(css, /\.settings-mcps-module \.settings-mcp-list\s*\{[^}]*max-height:\s*330px[^}]*overflow-y:\s*auto[^}]*scrollbar-width:\s*none/is);
  assert.match(css, /\.settings-mcps-module \.settings-mcp-list::-webkit-scrollbar\s*\{[^}]*display:\s*none/is);
});

test("Claude settings uses a protected configuration dashboard", () => {
  for (const token of ["claude-settings-workspace", "claude-settings-hero", "claude-settings-summary", "claude-settings-route-card", "claude-settings-inventory-panel", "Ownership boundary"]) {
    assert.match(page, new RegExp(token));
  }
  assert.match(css, /\.claude-settings-workspace/);
  assert.match(css, /\.claude-settings-hero/);
  assert.match(css, /\.claude-settings-inventory-panel/);
});

test("Claude inventory keeps future MCP and plugin rows in invisible scrollers", () => {
  assert.match(page, /claude-settings-inventory-list/);
  assert.doesNotMatch(page, /plugins\.slice\(0/);
  assert.match(css, /\.claude-settings-inventory-list\s*\{[^}]*max-height:\s*292px[^}]*overflow-y:\s*auto[^}]*scrollbar-width:\s*none/is);
  assert.match(css, /\.claude-settings-inventory-list::-webkit-scrollbar\s*\{[^}]*display:\s*none/is);
});

test("Claude settings and activity keep explanatory copy inside reference callouts", () => {
  assert.match(page, /claude-settings-hero__notice/);
  assert.doesNotMatch(page, /A calm view of the route Switcher manages/);
  assert.doesNotMatch(page, /claude-settings-route-card__note/);
  assert.doesNotMatch(page, /claude-inventory-note/);
});
