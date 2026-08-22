import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { circularRelayIndex, relayDragStep, relayLayerProviders, relayStackMarkup, claudeRouteDeckMarkup } from "../assets/js/pages/overview.js";

test("relay index loops forward and backward", () => {
  assert.equal(circularRelayIndex(2, 1, 3), 0);
  assert.equal(circularRelayIndex(0, -1, 3), 2);
  assert.equal(circularRelayIndex(1, 1, 3), 2);
});

test("vertical relay drag chooses one step only after the threshold", () => {
  assert.equal(relayDragStep(18, 42), 0);
  assert.equal(relayDragStep(58, 42), 1);
  assert.equal(relayDragStep(-58, 42), -1);
});

test("the deepest relay layer is always a real provider", () => {
  const providers = [{ id: "one" }, { id: "two" }, { id: "three" }];
  assert.deepEqual(relayLayerProviders(providers, 0), {
    front: providers[0],
    middle: providers[1],
    back: providers[2],
  });
  assert.deepEqual(relayLayerProviders(providers, 2), {
    front: providers[2],
    middle: providers[0],
    back: providers[1],
  });
});

test("relay markup keeps every real provider reachable in the visible stack", () => {
  const providers = [
    { id: "one", name: "One", models: [] },
    { id: "two", name: "Two", models: [] },
    { id: "three", name: "Three", models: [] },
    { id: "four", name: "Four", models: [] },
  ];
  const markup = relayStackMarkup(providers, 0, null);
  assert.equal((markup.match(/data-relay-depth=/g) || []).length, providers.length);
  for (const provider of providers) assert.match(markup, new RegExp(`data-provider-logo="${provider.id}"`));
  assert.match(markup, /<strong>One<\/strong>/);
  assert.match(markup, /data-relay-depth="3"/);
});

test("background relay layers show identity marks without leaking provider names", () => {
  const providers = [
    { id: "one", name: "One", models: [] },
    { id: "two", name: "Two", models: [] },
    { id: "three", name: "Three", models: [] },
  ];
  const markup = relayStackMarkup(providers, 0, null);
  const background = markup.split('data-relay-depth="1"')[1].split('relay-incoming-detail')[0];
  assert.doesNotMatch(background, /<strong>/);
  assert.match(background, /relay-mini__mark/);
});

test("relay footprint follows the number of providers", () => {
  const one = [{ id: "one", name: "One", models: [] }];
  const four = [
    { id: "one", name: "One", models: [] },
    { id: "two", name: "Two", models: [] },
    { id: "three", name: "Three", models: [] },
    { id: "four", name: "Four", models: [] },
  ];
  const oneMarkup = relayStackMarkup(one, 0, null);
  const fourMarkup = relayStackMarkup(four, 0, null);
  const oneHeight = Number(oneMarkup.match(/--relay-stack-height:(\d+)px/)?.[1]);
  const fourHeight = Number(fourMarkup.match(/--relay-stack-height:(\d+)px/)?.[1]);
  assert.match(oneMarkup, /data-relay-count="1"/);
  assert.match(fourMarkup, /data-relay-count="4"/);
  assert.ok(Number.isFinite(oneHeight) && Number.isFinite(fourHeight));
  assert.ok(oneHeight < fourHeight, `expected one-provider stack (${oneHeight}px) to be shorter than four-provider stack (${fourHeight}px)`);
  assert.match(oneMarkup, /--relay-front-top:24px/);
  assert.match(fourMarkup, /--relay-front-top:66px/);
});

test("relay stack exposes a forward and backward motion contract", () => {
  const css = readFileSync(new URL("../assets/css/workspace.css", import.meta.url), "utf8");
  assert.match(css, /relay-stack-front-forward/);
  assert.match(css, /relay-stack-front-backward/);
  assert.match(css, /relay-stack-incoming-forward/);
  assert.match(css, /relay-stack-incoming-backward/);
  assert.match(css, /height: var\(--relay-stack-height, 272px\)/);
  assert.match(css, /\.relay-card \{ align-self: start;/);
  assert.match(css, /top: var\(--relay-front-top, 66px\)/);
});

test("Claude overview route cards expose a working details action", () => {
  const route = { id: "route-1", name: "Local relay", baseUrl: "http://localhost:8082", model: "sonnet", secretEnvRef: "CLAUDE_TOKEN" };
  const markup = claudeRouteDeckMarkup([route], { appliedRouteId: "route-1", appliedRouteConfigSha256: "hash" });
  assert.match(markup, /data-claude-overview-details="route-1"/);
  assert.match(markup, />View details<\/button>/);
  assert.doesNotMatch(markup, />View route<\/button>/);
});

test("Claude route relay renders every saved route with background identity marks", () => {
  const routes = [
    { id: "route-1", name: "OmniRoute", baseUrl: "http://localhost:20128/v1", model: "model-one", secretEnvRef: "OMNI_KEY" },
    { id: "route-2", name: "TokenRouter", baseUrl: "https://tokenrouter.example/v1", model: "model-two", secretEnvRef: "TOKEN_KEY" },
    { id: "route-3", name: "CLI Proxy", baseUrl: "http://localhost:8317/v1", model: "model-three", secretEnvRef: "CLI_KEY" },
    { id: "route-4", name: "OrcaRouter", baseUrl: "https://orca.example/v1", model: "model-four", secretEnvRef: "ORCA_KEY" },
  ];
  const markup = claudeRouteDeckMarkup(routes, { appliedRouteId: "route-1", appliedRouteConfigSha256: "hash" });
  assert.equal((markup.match(/data-claude-route-id=/g) || []).length, routes.length);
  assert.doesNotMatch(markup, /claude-route-deck__card--hidden/);
  assert.match(markup, /data-relay-depth="3"/);
  for (const route of routes) assert.match(markup, new RegExp(`data-provider-logo="${route.id}"`));
  const background = markup.split('data-relay-depth="1"')[1].split('data-relay-depth="2"')[0];
  assert.match(background, /claude-route-deck__background-mark/);
  assert.doesNotMatch(background, /<h3>|<p class="eyebrow">|relay-front__meta/);
});
