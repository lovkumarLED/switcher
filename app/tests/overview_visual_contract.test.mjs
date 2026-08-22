import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const gui = await readFile(new URL("../gui.html", import.meta.url), "utf8");
const overview = await readFile(new URL("../assets/js/pages/overview.js", import.meta.url), "utf8");
const responsive = await readFile(new URL("../assets/css/responsive.css", import.meta.url), "utf8");
const workspace = await readFile(new URL("../assets/css/workspace.css", import.meta.url), "utf8");

test("workspace sidebar uses the approved navigation icon set", () => {
  for (const name of ["providers", "activity", "integrations", "settings"]) {
    assert.match(gui, new RegExp(`sidebar-icon--${name}`));
  }
});

test("overview header range control reloads overview data for every supported range", () => {
  assert.match(overview, /overviewRange/);
  assert.match(overview, /Last 24 hours/);
  assert.match(overview, /Last 7 days/);
  assert.match(overview, /Last 30 days/);
  assert.match(overview, /icon\.calendar/);
  assert.match(overview, /activitySummary\(days\)/);
  assert.match(overview, /activity\(days,/);
  assert.match(overview, /overviewRange[\s\S]*addEventListener\("change"/);
});

test("overview range selection persists and includes all time", () => {
  assert.match(overview, /readActivityRange/);
  assert.match(overview, /writeActivityRange/);
  assert.match(overview, /All time/);
  assert.match(overview, /renderOverview\(workspace, readActivityRange\(\)\)/);
});
test("overview relay action labels match their activation semantics", () => {
  assert.match(overview, /data-relay-action="deactivate">Deactivate provider/);
  assert.match(overview, /data-relay-action="activate">Activate provider/);
  assert.doesNotMatch(overview, /data-relay-action="deactivate">Remove provider/);
  assert.doesNotMatch(overview, /data-relay-action="activate">Add provider/);
});

test("browser pages do not render fake desktop window controls", () => {
  assert.doesNotMatch(gui, /class="title-bar"/);
  assert.doesNotMatch(gui, /title-bar__button/);
});

test("an empty selected range keeps the overview two-column layout", () => {
  assert.match(responsive, /overview-masonry \.kpi-grid-empty/);
});

test("overview analytics use a compact insights column instead of a fixed-height KPI block", () => {
  assert.match(overview, /overview-kpis/);
  assert.match(workspace, /\.overview-kpis\s*\{[^}]*min-width:\s*0/s);
  assert.match(workspace, /\.overview-kpis \.kpi-grid\s*\{[^}]*height:\s*auto/s);
  assert.match(workspace, /\.kpi\s*\{[^}]*min-height:\s*168px/s);
  assert.doesNotMatch(workspace, /\.kpi-grid\s*\{[^}]*height:\s*250px/s);
  assert.match(workspace, /\.overview-masonry \.usage-card\s*\{[^}]*align-self:\s*center/s);
  assert.doesNotMatch(workspace, /\.overview-masonry \.usage-card\s*\{[^}]*align-self:\s*stretch/s);
});

test("overview follows the compact dashboard sketch and reuses the activity log treatment", () => {
  assert.match(overview, /overview-kpis/);
  assert.match(overview, /activity-log-card[^"]*overview-recent-card/);
  assert.match(overview, /Sanitized metadata only/);
  assert.match(workspace, /\.overview-kpis\s*\{[^}]*grid-column:\s*10 \/ span 6[^}]*grid-row:\s*1/s);
  assert.match(workspace, /\.overview-masonry \.usage-card\s*\{[^}]*grid-column:\s*16 \/ span 9[^}]*grid-row:\s*1/s);
  assert.match(workspace, /\.overview-masonry \.chart-card\s*\{[^}]*grid-column:\s*1 \/ span 12[^}]*grid-row:\s*2/s);
  assert.match(workspace, /\.overview-masonry \.overview-recent-card\s*\{[^}]*grid-column:\s*13 \/ span 12[^}]*grid-row:\s*2/s);
  assert.match(workspace, /\.overview-recent-card \.activity-table-wrap\s*\{[^}]*scrollbar-width:\s*none/s);
});

test("relay card actions stay inside the front provider card", () => {
  assert.match(workspace, /\.relay-front__actions\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(workspace, /\.relay-front__actions \.button\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0/s);
  assert.match(workspace, /\.relay-front__meta div\s*\{[^}]*min-width:\s*0[^}]*overflow:\s*hidden/s);
  assert.match(workspace, /\.relay-front__meta dd\s*\{[^}]*min-width:\s*0[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis/s);
});
