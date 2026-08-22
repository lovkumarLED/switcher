import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../assets/js/pages/activity.js", import.meta.url), "utf8") + readFileSync(new URL("../assets/js/pages/activity-workspace.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../assets/css/activity-workspace.css", import.meta.url), "utf8");

test("activity page contains the approved observability blocks", () => {
  assert.match(source, /Activity &amp; API logs/);
  assert.match(source, /activity-kpis/);
  assert.match(source, /Requests over time/);
  assert.match(source, /Provider usage/);
  assert.match(source, /Latency by provider/);
  assert.match(source, /Recent proxy calls/);
});

test("activity page keeps the header focused by omitting helper subtitle copy", () => {
  assert.doesNotMatch(source, /Understand how your private local relay is being used\./);
});

test("activity page exposes range, provider, and status filters", () => {
  assert.match(source, /activityRange/);
  assert.match(source, /activityProvider/);
  assert.match(source, /activityStatus/);
});

test("activity range shares persisted selection and supports all time", () => {
  assert.match(source, /readActivityRange/);
  assert.match(source, /writeActivityRange/);
  assert.match(source, /All time/);
  assert.match(source, /onDaysChange\(Number\(event.target.value\)\)/);
});
test("activity workspace has a dedicated responsive layout", () => {
  assert.match(css, /\.activity-dashboard/);
  assert.match(css, /\.activity-analytics-grid/);
  assert.match(css, /\.activity-log-card/);
  assert.match(css, /@media/);
});

test("activity analytics and API logs use the shared control-room surfaces", () => {
  for (const tone of ["metric", "health", "chart", "usage", "recent"]) assert.match(source, new RegExp(`control-room-card--${tone}`));
  assert.match(css, /\.activity-panel\.control-room-card/);
  assert.match(css, /\.activity-kpi\.control-room-card/);
  assert.match(css, /\.activity-filters\.control-room-card/);
});

test("provider usage keeps names and metrics readable in the narrow analytics card", () => {
  assert.match(source, /activity-usage__identity/);
  assert.match(source, /activity-usage__metric/);
  assert.match(source, /aria-label="Provider usage:/);
  assert.match(css, /grid-template-columns:\s*156px minmax\(0,\s*1fr\)/);
  assert.match(css, /minmax\(300px,\s*1\.05fr\)/);
  assert.match(css, /@media \(max-width:\s*1180px\)/);
  assert.match(css, /\.activity-usage__metric\s*\{[^}]*text-align:\s*right/s);
});

test("recent proxy calls stay within a ten-row invisible scroller", () => {
  assert.match(css, /\.activity-table-wrap\s*\{[^}]*max-height:\s*420px[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.activity-table-wrap\s*\{[^}]*scrollbar-width:\s*none/s);
  assert.match(css, /\.activity-table-wrap::-webkit-scrollbar\s*\{[^}]*display:\s*none/s);
  assert.match(css, /\.activity-log-card th\s*\{[^}]*position:\s*sticky/s);
});
