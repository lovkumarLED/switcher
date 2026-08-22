import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { integrationWorkspaceMarkup } from "../assets/js/pages/integration-workspace.js";

const page = fs.readFileSync(new URL("../assets/js/pages/integrations.js", import.meta.url), "utf8");
const view = fs.readFileSync(new URL("../assets/js/pages/integration-workspace.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/css/integration-workspace.css", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../gui.html", import.meta.url), "utf8");

test("integrations uses the approved reference composition", () => {
  assert.match(page, /integration-workspace\.js/);
  for (const text of [
    "Managing:", "Changes are backed up", "Plugins", "Add plugin",
    "MCP servers", "Add MCP server", "AI provider connection",
    "Use Switcher with another tool", "Build required", "Build my config",
  ]) assert.match(view, new RegExp(text));
  assert.match(view, /integration-workspace/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1\.58fr\)\s+minmax\(300px,\s*\.9fr\)/);
  assert.match(css, /@media\s*\(max-width:\s*980px\)/);
  assert.match(shell, /integration-workspace\.css/);
});

test("integration plugin and MCP blocks use shared control-room accents", () => {
  assert.match(view, /integration-plugins[^\"]*control-room-card--plugins/);
  assert.match(view, /integration-mcp[^\"]*control-room-card--mcp/);
  assert.match(css, /\.control-room-card--plugins/);
  assert.match(css, /\.control-room-card--mcp/);
});

test("integration page framing uses the shared control-room surfaces", () => {
  assert.match(view, /integration-notice control-room-card control-room-card--settings/);
  assert.match(view, /integration-build-card control-room-card control-room-card--build/);
  assert.match(css, /\.integration-notice\.control-room-card/);
  assert.match(css, /\.integration-build-card\.control-room-card/);
});

test("integrations keeps the page focused by omitting helper subtitles", () => {
  assert.doesNotMatch(view, /Add tools and extensions to/);
  assert.doesNotMatch(view, /class="integration-label">Active providers</);
});

test("integrations keeps real actions wired", () => {
  for (const action of ["addPlugin", "addMcp", "testPrimary", "copyEndpoint", "buildConfig"])
    assert.match(view, new RegExp(`id=["']${action}["']`));
  assert.match(page, /api\.testProvider/);
  assert.match(page, /api\.build/);
  assert.match(page, /navigator\.clipboard\.writeText/);
});

test("active provider connections scroll without visible scrollbar chrome", () => {
  assert.match(css, /\.integration-provider-list\s*\{[^}]*overflow-y:\s*auto[^}]*scrollbar-width:\s*none/is);
  assert.match(css, /\.integration-provider-list::-webkit-scrollbar\s*\{[^}]*display:\s*none/is);
});

test("integrations carries an LSP block with a build toggle between plugins and mcp", () => {
  assert.match(view, /integration-lsp/);
  assert.match(view, /LSP servers/);
  assert.match(view, /lspToggle/);
  assert.match(view, /editLspJson/);
  const rendered = integrationWorkspaceMarkup({ plugins: [], mcps: {}, providers: [], agentName: "OpenCode", lsp: { lsp: true, enabled: true }, configName: "opencode.json" });
  const plugins = rendered.indexOf("integration-plugins");
  const lsp = rendered.indexOf("integration-lsp");
  const mcp = rendered.indexOf("integration-mcp");
  assert.ok(plugins < lsp && lsp < mcp, "LSP card must sit between Plugins and MCP");
  assert.ok(rendered.includes('id="lspToggle"'), "LSP toggle must be rendered");
  assert.ok(rendered.includes('id="editLspJson"'), "LSP edit button must be rendered");
  assert.ok(rendered.includes("opencode.json will carry \"lsp\": true"), "enabled copy must name the agent's config file");
  const kiloRendered = integrationWorkspaceMarkup({ plugins: [], mcps: {}, providers: [], agentName: "KiloCode", lsp: { lsp: true, enabled: true }, configName: "kilo.json" });
  assert.ok(kiloRendered.includes("kilo.json will carry \"lsp\": true"), "copy must name kilo.json for KiloCode");
  const offRendered = integrationWorkspaceMarkup({ plugins: [], mcps: {}, providers: [], agentName: "KiloCode", lsp: { lsp: true, enabled: false }, configName: "kilo.json" });
  assert.ok(offRendered.includes("LSP is off"), "disabled copy must not claim built-ins are enabled");
  assert.ok(offRendered.includes("kilo.json will carry \"lsp\": false"), "disabled copy must say lsp false");
  assert.match(page, /api\.setLsp/);
});

test("lsp expert json dialog is wired", () => {
  assert.match(page, /openLspJsonDialog/);
  assert.match(page, /JSON\.parse/);
});

test("LSP changes update only the LSP card", () => {
  assert.match(page, /lspCard/);
  assert.match(page, /\.integration-lsp"\)\?\.replaceWith/);
  assert.match(page, /lspCard\(currentLsp/);
  assert.doesNotMatch(page, /api\.setLsp\(currentLsp\.lsp, event\.target\.checked\)[\s\S]{0,220}refresh\(\)/);
});
