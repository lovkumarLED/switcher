import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { canSubmitProviderStep, nextProviderStep, providerReviewData, serializeProviderModels } from "../assets/js/pages/providers.js";
import { motionIsReduced, sidebarBrandBurstPlan, startupAtmospherePose, startupPointerPose } from "../assets/js/core/motion.js";
import { activityView } from "../assets/js/pages/activity.js";
import { createCloseSettlement } from "../assets/js/core/dialog.js";
import { activateStartup, shouldKeepStartupGhostId, startupCanvasWidth, startupHandoffPlan, startupLayoutScale, welcomeMagentaSignalGeometry, welcomePreviewRequested } from "../assets/js/pages/startup.js";
import { onboardingPreviewScreen, onboardingProgressState, onboardingScreenMarkup, onboardingSidebarState, onboardingTransitionDirection } from "../assets/js/pages/onboarding.js";
import { settingsWorkspaceMarkup } from "../assets/js/pages/settings-workspace.js";

test("startup branding describes agent and JSON configuration management", () => {
  const sources = [
    readFileSync(new URL("../gui.html", import.meta.url), "utf8"),
    readFileSync(new URL("../assets/js/pages/startup.js", import.meta.url), "utf8"),
  ];

  for (const source of sources) {
    assert.match(source, /Agent \+ JSON control/);
    assert.doesNotMatch(source, /Free AI, one click/i);
  }
});

test("welcome preview activation cannot enter onboarding", () => {
  const events = [];
  const outcome = activateStartup({
    previewOnly: true,
    onPreview: () => events.push("preview"),
    onProceed: () => events.push("onboarding"),
  });

  assert.equal(outcome, "preview");
  assert.deepEqual(events, ["preview"]);
});

test("welcome preview route is explicit", () => {
  assert.equal(welcomePreviewRequested("?preview=welcome"), true);
  assert.equal(welcomePreviewRequested("?preview=workspace"), false);
  assert.equal(welcomePreviewRequested(""), false);
});

test("onboarding preview routes select one approved screen", () => {
  assert.equal(onboardingPreviewScreen("?preview=onboarding&screen=agent"), "agent");
  assert.equal(onboardingPreviewScreen("?preview=onboarding&screen=review"), "review");
  assert.equal(onboardingPreviewScreen("?preview=onboarding&screen=provider"), "provider");
  assert.equal(onboardingPreviewScreen("?preview=onboarding&screen=ready"), "ready");
  assert.equal(onboardingPreviewScreen("?preview=welcome"), null);
  assert.equal(onboardingPreviewScreen("?preview=onboarding&screen=unknown"), "agent");
});

test("onboarding progress matches the approved four screen sequence", () => {
  assert.deepEqual(onboardingProgressState("agent"), { step: 2, completed: [1] });
  assert.deepEqual(onboardingProgressState("review"), { step: 2, completed: [1] });
  assert.deepEqual(onboardingProgressState("provider"), { step: 3, completed: [1, 2] });
  assert.deepEqual(onboardingProgressState("ready"), { step: 4, completed: [1, 2, 3] });
});

test("sidebar progress follows the same completion state as the top track", () => {
  assert.deepEqual(onboardingSidebarState("agent"), { step: 2, completed: [1] });
  assert.deepEqual(onboardingSidebarState("provider"), { step: 3, completed: [1, 2] });
  assert.deepEqual(onboardingSidebarState("ready"), { step: 4, completed: [1, 2, 3] });
});

test("onboarding page direction is forward or backward", () => {
  assert.equal(onboardingTransitionDirection("agent", "review"), "forward");
  assert.equal(onboardingTransitionDirection("review", "agent"), "backward");
  assert.equal(onboardingTransitionDirection("agent", "agent"), "still");
});

test("onboarding screens preserve the approved visible copy and controls", () => {
  const agent = onboardingScreenMarkup("agent");
  assert.match(agent, /Connect your agent/);
  assert.match(agent, /Looking for your agents…/);
  assert.match(agent, /Choose a folder manually/);
  assert.match(agent, /manualAgentPath/);
  assert.match(agent, /Use this folder/);
  assert.match(agent, /Continue/);

  const review = onboardingScreenMarkup("review");
  assert.match(review, /Review your workspace/);
  assert.match(review, /Nothing will be changed until you approve\./);

  const provider = onboardingScreenMarkup("provider");
  assert.match(provider, /Add your first provider/);
  assert.match(provider, /data-first-provider="litellm"/);
  assert.match(provider, /data-first-provider="cli-proxy"/);
  assert.match(provider, /data-first-provider="custom"/);
  assert.match(provider, /\/assets\/brands\/litellm\.png/);
  assert.match(provider, /\/assets\/brands\/cli-proxy\.svg/);
  assert.match(provider, /Test connection/);
  assert.match(provider, /Save and continue/);
  assert.match(provider, /Skip for now/);

  const ready = onboardingScreenMarkup("ready");
  assert.match(ready, /You’re ready/);
  assert.match(ready, /127\.0\.0\.1:9090/);
  assert.match(ready, /Open dashboard/);
});

test("onboarding rail presents privacy reassurance instead of a docs link", () => {
  const markup = onboardingScreenMarkup("agent");
  assert.match(markup, /onboarding-privacy/);
  assert.match(markup, /Private by default/);
  assert.match(markup, /Your keys stay on your computer/);
  assert.match(markup, /Prompts aren.t stored by Switcher/);
  assert.doesNotMatch(markup, /Need help/);
  assert.doesNotMatch(markup, /Open docs/);
});

test("provider setup has bounded keyboard-usable steps", () => {
  assert.equal(nextProviderStep(0, 1), 1);
  assert.equal(nextProviderStep(4, 1), 4);
  assert.equal(nextProviderStep(0, -1), 0);
});

test("provider submit is gated to the final step", () => {
  assert.equal(canSubmitProviderStep(3), false);
  assert.equal(canSubmitProviderStep(4), true);
});

test("provider review excludes the raw key", () => {
  const review = providerReviewData({ name: "Local", baseUrl: "https://example.test/v1", reasoningFormat: "openai", models: [{ model: "gpt" }], apiKey: "secret" });
  assert.deepEqual(review, { name: "Local", id: "local", baseUrl: "https://example.test/v1", sdk: "@ai-sdk/openai-compatible", format: "openai", models: ["gpt"], key: "Present" });
  assert.equal(JSON.stringify(review).includes("secret"), false);
});

test("provider model serialization keeps only the models still present in the editor", () => {
  const existing = [
    { model: "deepseek-v4-flash-0731", name: "DeepSeek V4 Flash", apiModelId: "deepseek-v4-flash-0731", reasoningFormat: "openai", thinking: ["high"] },
    { model: "deepseek-v4-flash-free", name: "DeepSeek V4 Flash Free", thinking: ["default"] },
    { model: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", apiModelId: "", reasoningFormat: "", thinking: [] },
  ];
  const serialized = serializeProviderModels(["deepseek-v4-flash-0731", "gemini-3.5-flash-lite"], existing);
  assert.deepEqual(serialized, [
    { model: "deepseek-v4-flash-0731", name: "DeepSeek V4 Flash", apiModelId: "deepseek-v4-flash-0731", reasoningFormat: "openai", thinking: ["high"] },
    { model: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", apiModelId: "", reasoningFormat: "", thinking: [] },
  ]);
  assert.equal(serialized.some(item => item.model === "deepseek-v4-flash-free"), false);
});

test("provider edit review uses the detail-style summary and visible test state", () => {
  const source = readFileSync(new URL("../assets/js/pages/providers.js", import.meta.url), "utf8");
  assert.match(source, /provider-review-card/);
  assert.match(source, /provider-review-grid/);
  assert.match(source, /provider-review-field/);
  assert.match(source, /provider-test-status/);
  assert.match(source, /data-state/);
});

test("editing a saved provider replaces the preset chooser with an overview", () => {
  const source = readFileSync(new URL("../assets/js/pages/providers.js", import.meta.url), "utf8");
  assert.match(source, /provider-edit-intro/);
  assert.match(source, /models: serializeProviderModels/);
  assert.match(source, /provider \? "Overview" : "Choose"/);
  assert.match(source, /const presetField = provider \? "" :/);
  assert.match(source, /preset\?\.addEventListener/);
});
test("saved reduce preference overrides operating system motion", () => {
  assert.equal(motionIsReduced("reduce", false), true);
  assert.equal(motionIsReduced("system", true), true);
  assert.equal(motionIsReduced("system", false), false);
});

test("startup pointer pose is centered and bounded", () => {
  const rect = { left: 100, top: 50, width: 400, height: 500 };
  assert.deepEqual(startupPointerPose(300, 300, rect), { x: 0, y: 0 });
  assert.deepEqual(startupPointerPose(900, -400, rect), { x: 1, y: -1 });
  assert.deepEqual(startupPointerPose(-200, 900, rect), { x: -1, y: 1 });
});

test("required request redaction is presented as a locked privacy status, not a fake switch", () => {
  const markup = settingsWorkspaceMarkup({ providers: [], plugins: [], mcps: {}, preferences: { activityRetentionDays: 30, requestContentRedaction: true, reducedMotion: "system" } });
  assert.match(markup, /Request content is never stored/);
  assert.match(markup, /Always on/);
  assert.doesNotMatch(markup, /class="settings-switch is-on is-locked" role="switch"/);
});

test("settings keeps model reasoning inside the multi-model editor", () => {
  const markup = settingsWorkspaceMarkup({ providers: [{ id: "one", name: "One", models: [] }], plugins: [], mcps: {}, preferences: { activityRetentionDays: 30, requestContentRedaction: true, reducedMotion: "system" } });
  assert.doesNotMatch(markup, /Thinking level/);
  assert.match(markup, /Models are saved to/);
});

test("desktop welcome layout fills the available width", () => {
  const scale = startupLayoutScale(1298, 706);
  assert.ok(Math.abs((992 * scale) - 706) < .01);
  assert.ok(Math.abs((startupCanvasWidth(1298, scale) * scale) - 1298) < .01);
});

test("startup atmosphere follows the pointer and strengthens while dragging", () => {
  const rect = { left: 0, top: 0, width: 1000, height: 700 };
  assert.deepEqual(startupAtmospherePose(500, 350, rect, false), { x: 0, y: 0, force: .42, cursorX: 50, cursorY: 50 });
  assert.deepEqual(startupAtmospherePose(1000, 0, rect, true), { x: 1, y: -1, force: 1, cursorX: 100, cursorY: 0 });
});

test("welcome magenta signal stays close to the logo", () => {
  assert.deepEqual(welcomeMagentaSignalGeometry(), {
    path: "M1184 576H1250Q1260 576 1264 566C1271 548 1278 535 1286 528H1400",
    nodeX: "1184",
  });
});

test("welcome handoff uses a deliberate zoom fade unless motion is reduced", () => {
  assert.deepEqual(startupHandoffPlan(false), { durationMs: 420, swapImmediately: true, preservesOutgoingFrame: true });
  assert.deepEqual(startupHandoffPlan(true), { durationMs: 0, swapImmediately: true, preservesOutgoingFrame: false });
});

test("welcome transition preserves SVG paint IDs but removes HTML IDs", () => {
  assert.equal(shouldKeepStartupGhostId("http://www.w3.org/2000/svg"), true);
  assert.equal(shouldKeepStartupGhostId("http://www.w3.org/1999/xhtml"), false);
});

test("sidebar brand burst stays compact and bounded", () => {
  const particles = sidebarBrandBurstPlan(8, () => .5);
  assert.equal(particles.length, 8);
  assert.ok(particles.every(particle => particle.distance >= 18 && particle.distance <= 44));
  assert.ok(particles.every(particle => particle.size >= 3 && particle.size <= 7));
});

test("activity errors remain unavailable instead of becoming empty", () => {
  assert.equal(activityView([], new Error("offline")), "unavailable");
  assert.equal(activityView([], null), "empty");
});

test("dialog settlement resolves false once on non-confirm close", () => {
  const values = [];
  const settle = createCloseSettlement(value => values.push(value));
  settle(false); settle(false);
  assert.deepEqual(values, [false]);
});

test("onboarding preset fallback reads the entry key, not the entries array", () => {
  const source = readFileSync(new URL("../assets/js/pages/onboarding.js", import.meta.url), "utf8");
  assert.match(source, /selectedProvider = presets\[0\]\[0\]/, "presets[0] is a [key, value] entry; the fallback key is presets[0][0]");
  assert.doesNotMatch(source, /presets\[0\]\.id/, "presets[0].id is always undefined and broke onboarding when litellm/cli-proxy presets were filtered out");
});
