import { api, optional } from "../core/api.js";
import { escapeHtml } from "../core/dialog.js";
import { isClaude } from "../core/capabilities.js";
import { renderActivityWorkspace } from "./activity-workspace.js";
import { readActivityRange, writeActivityRange } from "../core/activity-range.js";

export const activityView = (events, error) => error ? "unavailable" : events.length ? "ready" : "empty";

export async function renderActivity(workspace) {
  if (isClaude()) {
    await renderRouteActivity(workspace);
    return;
  }
  const load = async days => {
    const range = writeActivityRange(days);
    workspace.innerHTML = '<div class="card card--padded skeleton activity-loading"></div>';
    try {
      const [activityData, summary] = await Promise.all([
        api.activity(range, 1000),
        optional(() => api.activitySummary(range), null),
      ]);
      const events = Array.isArray(activityData) ? activityData : (activityData.events || []);
      renderActivityWorkspace(workspace, { events, summary, days: range, onDaysChange: load });
    } catch (error) {
      workspace.innerHTML = `<div class="empty-state"><span class="status">Activity unavailable</span><h3>Local activity could not load</h3><p>${escapeHtml(error.message)}</p><button class="button button--primary" type="button" data-retry>Try again</button></div>`;
      workspace.querySelector("[data-retry]")?.addEventListener("click", () => load(range));
    }
  };

  await load(readActivityRange());
}

async function renderRouteActivity(workspace) {
  workspace.innerHTML = '<div class="card card--padded skeleton activity-loading"></div>';
  try {
    const [data, routeData] = await Promise.all([api.claudeActivity(200), optional(() => api.claudeRoutes(), { routes: [] })]);
    const events = Array.isArray(data.events) ? data.events : [];
    const routes = Array.isArray(routeData.routes) ? routeData.routes : [];
    const routeNames = new Map(routes.map(route => [route.id, route.name]));
    const ordered = [...events].sort((a, b) => new Date(a.ts).valueOf() - new Date(b.ts).valueOf());
    const typeCounts = ordered.reduce((counts, event) => { counts[event.type] = (counts[event.type] || 0) + 1; return counts; }, {});
    const failed = ordered.filter(event => event.type === "apply_failed").length;
    const successful = ordered.length - failed;
    const routeCount = new Set(ordered.map(event => event.routeId).filter(Boolean)).size;
    const latest = ordered.at(-1) || null;
    const eventLabels = { route_created: "Route created", route_edited: "Route edited", route_deleted: "Route deleted", route_applied: "Route applied", apply_failed: "Apply failed", restore_completed: "Backup restored" };
    const eventLabel = type => eventLabels[type] || String(type || "Routing event").replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
    const eventTone = type => type === "apply_failed" ? "error" : type === "route_applied" ? "active" : type === "route_deleted" ? "muted" : "neutral";
    const formatActivityTime = value => {
      const date = new Date(value);
      if (Number.isNaN(date.valueOf())) return "—";
      return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
    };
    const routeLabel = id => id ? (routeNames.get(id) || `Route ${String(id).replace(/^route-/, "").slice(0, 8)}`) : "Claude Code";
    const pulse = Array.from({ length: 24 }, (_, index) => ordered.slice(Math.floor(index * ordered.length / 24), Math.ceil((index + 1) * ordered.length / 24))).map(bucket => ({ total: bucket.length, failed: bucket.filter(event => event.type === "apply_failed").length }));
    const maxPulse = Math.max(1, ...pulse.map(bucket => bucket.total));
    const pulseBars = pulse.map((bucket, index) => `<span class="claude-activity-pulse__bar" data-tone="${bucket.failed ? "error" : bucket.total ? "active" : "muted"}" style="--pulse:${bucket.total / maxPulse * 100}%" title="Window ${index + 1}: ${bucket.total} event${bucket.total === 1 ? "" : "s"}${bucket.failed ? `, ${bucket.failed} failed` : ""}"></span>`).join("");
    const breakdown = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    const maxType = Math.max(1, ...breakdown.map(([, count]) => count));
    const breakdownRows = breakdown.map(([type, count]) => `<li><span><i data-tone="${eventTone(type)}"></i><strong>${escapeHtml(eventLabel(type))}</strong></span><b>${count}</b><em style="--breakdown:${count / maxType * 100}%"></em></li>`).join("");
    const rows = [...ordered].reverse().map(event => `<tr><td><span class="claude-activity-event"><i data-tone="${eventTone(event.type)}"></i><span><strong>${escapeHtml(eventLabel(event.type))}</strong><small>${event.type === "apply_failed" ? "Action needs attention" : "Switcher change recorded"}</small></span></span></td><td><span class="claude-activity-route">${escapeHtml(routeLabel(event.routeId))}</span><code>${escapeHtml(event.routeId || "—")}</code></td><td><time class="mono" datetime="${escapeHtml(event.ts || "")}">${escapeHtml(formatActivityTime(event.ts))}</time></td><td><span class="claude-activity-status" data-tone="${eventTone(event.type)}">${event.type === "apply_failed" ? "Failed" : "Recorded"}</span></td></tr>`).join("");
    const typeChips = breakdown.slice(0, 4).map(([type, count]) => `<span class="chip"><i data-tone="${eventTone(type)}"></i>${escapeHtml(eventLabel(type))} · ${count}</span>`).join("");
    const chipbar = `<div class="claude-chipbar" aria-label="Route activity summary"><span class="chip chip--strong">${ordered.length} events</span><span class="chip">${routeCount} routes touched</span>${typeChips}</div>`;
    const latestCopy = latest ? `${eventLabel(latest.type)} · ${formatActivityTime(latest.ts)}` : "No changes recorded";
    workspace.innerHTML = `<section class="claude-activity-workspace"><header class="claude-activity-page-head"><div><p class="eyebrow">Observability</p><h1 class="page-title">Route activity</h1></div><div class="claude-activity-head-status"><span class="status"><span class="status-dot status-dot--ok"></span>Claude Code</span><span class="chip chip--mono">last 200 events</span></div></header>${chipbar}<section class="claude-activity-hero control-room-card control-room-card--relay"><div class="claude-activity-hero__copy"><p class="eyebrow">Routing history</p><h2>Every change, easy to scan.</h2><div class="claude-info-strip claude-activity-hero__notice"><strong>Privacy boundary</strong><span>No request, token, or latency telemetry is claimed for Claude Code. Route lifecycle events are sanitized metadata only.</span></div><span class="claude-activity-hero__latest"><i data-tone="${latest ? eventTone(latest.type) : "muted"}"></i>${escapeHtml(latestCopy)}</span></div><dl class="claude-activity-hero__stats"><div><dt>Recorded events</dt><dd>${ordered.length}</dd><small>In this local audit log</small></div><div><dt>Successful changes</dt><dd>${successful}</dd><small>${ordered.length ? Math.round(successful / ordered.length * 100) : 0}% of events</small></div><div><dt>Needs attention</dt><dd>${failed}</dd><small>${failed ? "Review failed applies" : "No failed applies"}</small></div></dl></section><div class="claude-activity-analytics"><section class="claude-activity-panel claude-activity-pulse control-room-card control-room-card--chart"><header><div><p class="eyebrow">Event pulse</p><h2>Routing changes over time</h2></div><span class="claude-activity-panel__meta">${ordered.length ? "oldest → newest" : "awaiting first event"}</span></header><div class="claude-activity-pulse__chart" role="img" aria-label="Routing event pulse, ${ordered.length} events and ${failed} failures">${pulseBars}</div><footer><span>Older</span><span>Latest</span></footer></section><section class="claude-activity-panel claude-activity-breakdown control-room-card control-room-card--usage"><header><div><p class="eyebrow">Event mix</p><h2>What changed</h2></div><span class="claude-activity-panel__meta">${breakdown.length} types</span></header><ul>${breakdownRows || '<li class="claude-activity-breakdown__empty">No event types yet.</li>'}</ul></section></div><section class="claude-activity-panel claude-activity-log control-room-card control-room-card--recent"><header><div><p class="eyebrow">Audit trail</p><h2>Recent route events</h2></div><span class="claude-activity-panel__meta">Sanitized metadata only · ${ordered.length} total</span></header>${rows ? `<div class="claude-activity-log__table-wrap"><table><thead><tr><th>Change</th><th>Route</th><th>Time</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="claude-activity-empty"><span aria-hidden="true">↗</span><h3>No routing activity yet</h3><p>Apply a route or restore a backup to see events here.</p></div>'}</section></section>`;
  } catch (error) {
    workspace.innerHTML = `<section class="claude-activity-workspace"><div class="empty-state claude-activity-empty"><h3>Route activity unavailable</h3><p>${escapeHtml(error.message)}</p></div></section>`;
  }
}
