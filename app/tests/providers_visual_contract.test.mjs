import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { switchProviderAgent } from "../assets/js/pages/providers.js";

const providersSource = await readFile(new URL("../assets/js/pages/providers.js", import.meta.url), "utf8");
const workspaceSource = await readFile(new URL("../assets/js/pages/provider-workspace.js", import.meta.url), "utf8");
const workspaceCssSource = await readFile(new URL("../assets/css/provider-workspace.css", import.meta.url), "utf8");
const shellCssSource = await readFile(new URL("../assets/css/workspace.css", import.meta.url), "utf8");
const overviewSource = await readFile(new URL("../assets/js/pages/overview.js", import.meta.url), "utf8");
const source = `${providersSource}\n${workspaceSource}`;

test("providers page uses the approved split workspace", () => {
  assert.match(source, /providers-workspace/);
  assert.match(source, /provider-setup-panel/);
  assert.match(source, /provider-agent-selector/);
  assert.match(source, /Manage agents/);
});

test("provider setup panel exposes the approved three-step flow", () => {
  assert.match(source, /Choose/);
  assert.match(source, /Configure/);
  assert.match(source, /Test/);
  assert.match(source, /Save provider/);
});

test("provider setup and agent tabs use the shared control-room surfaces", () => {
  assert.match(workspaceSource, /provider-setup-panel control-room-card control-room-card--settings/);
  assert.match(workspaceSource, /provider-agent-tabs control-room-card control-room-card--settings/);
  assert.match(workspaceCssSource, /\.provider-setup-panel\.control-room-card/);
  assert.match(workspaceCssSource, /\.provider-agent-tabs\.control-room-card/);
});

test("provider setup exposes its provider-level reasoning format chooser", () => {
  assert.match(workspaceSource, /Model reasoning format/);
  assert.match(workspaceSource, /embeddedFormatChoices/);
});

test("provider cards use branded marks and a circular deck", () => {
  assert.match(source, /provider-brand-mark/);
  assert.match(source, /provider-deck-card--front/);
  assert.match(source, /circularProviderIndex/);
});

test("provider card shells preserve generated mark palettes", () => {
  assert.match(workspaceCssSource, /\.provider-brand-mark\.gen-logo--generated\s*\{[^}]*background:\s*linear-gradient\(135deg,\s*var\(--logo-a\),\s*var\(--logo-b\)\)/);
  assert.match(workspaceCssSource, /\.provider-brand-mark\.gen-logo--generated\s*\{[^}]*color:\s*#fff/);
});

test("provider editor actions use a rounded theme-aware rail", () => {
  assert.match(shellCssSource, /\.provider-dialog \.dialog__actions\s*\{[^}]*border-radius:\s*16px/);
  assert.match(shellCssSource, /\.provider-dialog \.dialog__actions\s*\{[^}]*border:\s*1px solid var\(--border\)/);
});

test("overview surfaces share restrained control-room accent cards across agents", () => {
  for (const tone of ["relay", "metric", "chart", "usage"]) assert.match(overviewSource, new RegExp(`control-room-card--${tone}`));
  assert.match(overviewSource, /<article class="activity-panel activity-log-card control-room-card control-room-card--recent recent-card overview-recent-card">/);
  assert.match(shellCssSource, /\.control-room-card\s*\{/);
  assert.match(shellCssSource, /\.control-room-card::before/);
  assert.match(shellCssSource, /\.control-room-card--relay/);
});

test("provider agent tabs switch between the three supported agents", () => {
  assert.match(workspaceSource, /data-provider-agent="opencode"/);
  assert.match(workspaceSource, /data-provider-agent="kilo"/);
  assert.match(workspaceSource, /data-provider-agent="claude-code"/);
  assert.match(workspaceSource, /brands\/claudecode\.svg/);
  assert.doesNotMatch(workspaceSource, /ClaudeCode/);
  assert.doesNotMatch(workspaceSource, /data-add-agent/);
  assert.match(providersSource, /switchProviderAgent\(api,/);
  assert.match(providersSource, /renderProviders\(workspace\)/);
  assert.match(providersSource, /"claude-code": "Claude Code"/);
});

test("connected agent indicator is status text without a decorative dropdown arrow", () => {
  assert.match(workspaceSource, /provider-agent-selector/);
  assert.doesNotMatch(workspaceSource, /connected\s*<span>/);
});

test("provider cards separate deactivation from destructive removal", () => {
  assert.match(workspaceSource, /data-provider-action="deactivate">Deactivate provider/);
  assert.match(workspaceSource, /data-provider-action="remove">Remove provider/);
  assert.match(providersSource, /action === "remove"/);
  assert.match(providersSource, /api\.deleteProvider\(provider\.id\)/);
});

test("agent switching avoids redundant writes and calls the backend for a different agent", async () => {
  const calls = [];
  const apiClient = { switchAgent: async name => calls.push(name) };
  assert.equal(await switchProviderAgent(apiClient, "kilo", "kilo"), false);
  assert.equal(await switchProviderAgent(apiClient, "opencode", "kilo"), true);
  assert.deepEqual(calls, ["opencode"]);
});

test("switching to Claude Code goes through the lock-free connect registration", async () => {
  const calls = [];
  const apiClient = { switchAgent: async name => calls.push(["switch", name]), claudeConnect: async () => calls.push(["connect"]) };
  assert.equal(await switchProviderAgent(apiClient, "claude-code", "opencode"), true);
  assert.equal(await switchProviderAgent(apiClient, "opencode", "claude-code"), true);
  assert.deepEqual(calls, [["connect"], ["switch", "opencode"]]);
});

test("provider cards expose an edit entry point", () => {
  assert.match(workspaceSource, /data-provider-action="edit">Edit provider/);
});

test("edit action opens the pre-filled edit wizard", () => {
  assert.match(providersSource, /action === "edit"/);
  assert.match(providersSource, /openProviderDialog\(provider, trigger\)/);
});

test("details dialog is read-only without an edit button", () => {
  assert.doesNotMatch(providersSource, /data-edit-provider/);
  assert.match(providersSource, /data-dialog-close>Close<\/button>/);
});
