import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { detailSummaryItem } from "../assets/js/core/dialog.js";

const css = readFileSync(new URL("../assets/css/components.css", import.meta.url), "utf8");
const dialog = readFileSync(new URL("../assets/js/core/dialog.js", import.meta.url), "utf8");

test("shared dialogs use a polished layered shell", () => {
  assert.match(css, /\.dialog-backdrop[\s\S]*backdrop-filter:\s*blur\(/);
  assert.match(css, /\.dialog[\s\S]*grid-template-rows:\s*auto minmax\(0, 1fr\) auto/);
  assert.match(css, /\.dialog[\s\S]*linear-gradient/);
  assert.match(css, /\.dialog__body[\s\S]*overflow:\s*auto/);
  assert.match(css, /\.dialog__actions[\s\S]*border-top/);
});

test("shared dialogs animate without ignoring reduced motion", () => {
  assert.match(css, /@keyframes dialog-enter/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.dialog/);
});

test("dialog action footers follow the active theme surface", () => {
  const actions = css.match(/\.dialog__actions\s*\{([\s\S]*?)\}/)?.[1] || "";
  assert.match(actions, /background:\s*linear-gradient\([^;]*var\(--surface\)/);
  assert.doesNotMatch(actions, /rgb\(255 255 255/);
});

test("dialog close control has a stable hook and real multiplication sign", () => {
  assert.match(dialog, /dialog__close/);
  assert.match(dialog, />×<\/button>/);
});

test("detail dialogs expose the shared control-room information contract", () => {
  assert.match(dialog, /variant = ""/);
  assert.match(dialog, /dialog--\$\{safeVariant\}/);
  assert.match(dialog, /detail-summary/);
  assert.match(dialog, /detail-section/);
  assert.match(css, /\.dialog--details[\s\S]*\.detail-summary/);
  assert.match(css, /\.detail-view[\s\S]*\.detail-grid/);
  assert.match(css, /\.detail-model-list/);
});

test("detail model lists keep scrolling available without showing a scrollbar", () => {
  assert.match(css, /\.detail-model-list\s*\{[^}]*scrollbar-width:\s*none/);
  assert.match(css, /\.detail-model-list\s*\{[^}]*-ms-overflow-style:\s*none/);
  assert.match(css, /\.detail-model-list::-webkit-scrollbar\s*\{[^}]*display:\s*none/);
});

test("detail summary values stay text-safe when populated from API data", () => {
  const markup = detailSummaryItem("Model", "<img src=x onerror=alert(1)>");
  assert.doesNotMatch(markup, /<img src=x/);
  assert.match(markup, /&lt;img/);
});
