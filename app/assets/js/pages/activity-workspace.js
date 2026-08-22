import { escapeHtml } from "../core/dialog.js";

const COLORS = ["#6841bd", "#f36556", "#9c88d3", "#4d75c9", "#dc9d43"];
const BRANDS = {
  openai: "/assets/brands/openai.svg",
  openrouter: "/assets/brands/openrouter.svg",
  omniroute: "/assets/brands/omniroute.svg",
  tokenrouter: "/assets/brands/tokenrouter.png",
  litellm: "/assets/brands/litellm.png",
};

const number = value => new Intl.NumberFormat().format(Number(value || 0));
const safe = value => value === null || value === undefined || value === "" ? "—" : escapeHtml(String(value));
const statusCode = event => Number(event.status || 0);
const success = event => statusCode(event) > 0 && statusCode(event) < 400;
const latency = event => Number(event.latencyMs);
const providerName = event => String(event.providerId || "Unknown");
const eventTime = event => { const time = new Date(event.timestamp); return Number.isNaN(time.valueOf()) ? null : time; };
const median = values => { const sorted = values.filter(Number.isFinite).sort((a, b) => a - b); if (!sorted.length) return 0; const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2); };

function icon(type) {
  const paths = {
    calls: '<path d="M4 17l5-6 4 3 7-9"/><path d="M17 5h3v3"/>',
    success: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 8"/>',
    latency: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    failed: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[type]}</svg>`;
}

function brand(name) {
  const key = Object.keys(BRANDS).find(item => name.toLowerCase().includes(item));
  if (key) return `<span class="activity-provider-mark"><img src="${BRANDS[key]}" alt=""></span>`;
  return `<span class="activity-provider-mark activity-provider-mark--text">${escapeHtml(name.slice(0, 1).toUpperCase())}</span>`;
}

function aggregateProviders(events) {
  const map = new Map();
  for (const event of events) {
    const name = providerName(event), item = map.get(name) || { name, count: 0, latencies: [] };
    item.count += 1;
    if (Number.isFinite(latency(event))) item.latencies.push(latency(event));
    map.set(name, item);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function trafficBuckets(events, days) {
  const count = 32, end = Date.now(), start = end - days * 86400000, size = Math.max(1, (end - start) / count);
  const buckets = Array.from({ length: count }, () => ({ successful: 0, failed: 0 }));
  for (const event of events) {
    const time = eventTime(event)?.valueOf() ?? end;
    const index = Math.max(0, Math.min(count - 1, Math.floor((time - start) / size)));
    buckets[index][success(event) ? "successful" : "failed"] += 1;
  }
  return buckets;
}

function trafficChart(events, days) {
  const buckets = trafficBuckets(events, days), max = Math.max(1, ...buckets.map(item => item.successful + item.failed));
  return `<div class="activity-traffic-chart" role="img" aria-label="Requests over time: ${events.length} calls in the selected period">
    <div class="activity-y-axis"><span>${max}</span><span>${Math.ceil(max * .66)}</span><span>${Math.ceil(max * .33)}</span><span>0</span></div>
    <div class="activity-bars">${buckets.map((item, index) => `<span class="activity-bar" title="Bucket ${index + 1}: ${item.successful} successful, ${item.failed} failed"><i class="activity-bar__success" style="--h:${item.successful / max * 100}%"></i><i class="activity-bar__failed" style="--h:${item.failed / max * 100}%"></i></span>`).join("")}</div>
    <div class="activity-x-axis"><span>${days === 1 ? "24 hours ago" : `${days} days ago`}</span><span>Now</span></div>
  </div>`;
}

function usageChart(providers, total) {
  if (!total) return '<div class="activity-empty-chart">No provider traffic yet</div>';
  let cursor = 0;
  const visible = providers.slice(0, 5);
  const stops = visible.map((item, index) => { const start = cursor, end = cursor + item.count / total * 100; cursor = end; return `${COLORS[index]} ${start}% ${end}%`; });
  if (cursor < 100) stops.push(`#e7e3eb ${cursor}% 100%`);
  const summary = visible.map(item => `${item.name} ${Math.round(item.count / total * 100)} percent, ${item.count} ${item.count === 1 ? "call" : "calls"}`).join(", ");
  return `<div class="activity-usage"><div class="activity-donut" role="img" aria-label="Provider usage: ${escapeHtml(summary)}" style="--donut:${stops.join(",")}"><strong>${number(total)}</strong><span>total ${total === 1 ? "call" : "calls"}</span></div><ul>${visible.map((item, index) => `<li><span class="activity-usage__identity"><i style="--swatch:${COLORS[index]}"></i><span title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span></span><span class="activity-usage__metric"><strong>${Math.round(item.count / total * 100)}%</strong><small>${number(item.count)} ${item.count === 1 ? "call" : "calls"}</small></span></li>`).join("")}</ul></div>`;
}

function latencyChart(providers) {
  const visible = providers.filter(item => item.latencies.length).slice(0, 4).map(item => ({ ...item, median: median(item.latencies) }));
  const max = Math.max(1, ...visible.map(item => item.median));
  if (!visible.length) return '<div class="activity-empty-chart">No latency samples yet</div>';
  return `<div class="activity-latency-bars">${visible.map(item => `<div><span>${number(item.median)} ms</span><i style="--h:${Math.max(8, item.median / max * 100)}%"></i><small>${escapeHtml(item.name)}</small></div>`).join("")}</div>`;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "—";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date);
}

function tableRows(events) {
  if (!events.length) return '<tr><td colspan="7" class="activity-table-empty">No calls match these filters.</td></tr>';
  return events.slice(0, 12).map(event => {
    const ok = success(event), name = providerName(event);
    return `<tr><td>${safe(formatTime(event.timestamp))}</td><td><span class="activity-provider-cell">${brand(name)}${escapeHtml(name)}</span></td><td class="activity-model">${safe(event.model)}</td><td><span class="activity-status ${ok ? "is-success" : "is-failed"}">${ok ? "✓" : "!"} ${safe(event.status)}</span></td><td class="${ok ? "" : "is-error-value"}">${Number.isFinite(latency(event)) ? `${number(latency(event))} ms` : "—"}</td><td>${safe(event.totalTokens)}</td><td class="mono">${safe(event.traceId)}</td></tr>`;
  }).join("");
}

export function renderActivityWorkspace(workspace, { events, summary, days, onDaysChange }) {
  const state = { provider: "all", status: "all" };
  const providers = aggregateProviders(events);

  const draw = () => {
    const filtered = events.filter(event => (state.provider === "all" || providerName(event) === state.provider) && (state.status === "all" || (state.status === "success" ? success(event) : !success(event))));
    const failed = filtered.filter(event => !success(event)).length;
    const successful = filtered.length - failed;
    const successRate = filtered.length ? successful / filtered.length * 100 : 0;
    const medianLatency = median(filtered.map(latency));
    const filteredProviders = aggregateProviders(filtered);

    workspace.innerHTML = `<section class="activity-dashboard">
      <header class="activity-page-head"><div><h1>Activity &amp; API logs</h1></div><div class="activity-filters control-room-card control-room-card--settings">
        <label><span class="sr-only">Date range</span><select id="activityRange"><option value="1" ${days === 1 ? "selected" : ""}>Last 24 hours</option><option value="7" ${days === 7 ? "selected" : ""}>Last 7 days</option><option value="30" ${days === 30 ? "selected" : ""}>Last 30 days</option></select></label>
        <label><span class="sr-only">Provider</span><select id="activityProvider"><option value="all">All providers</option>${providers.map(item => `<option value="${escapeHtml(item.name)}" ${state.provider === item.name ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label>
        <label><span class="sr-only">Status</span><select id="activityStatus"><option value="all">All statuses</option><option value="success" ${state.status === "success" ? "selected" : ""}>Successful</option><option value="failed" ${state.status === "failed" ? "selected" : ""}>Failed</option></select></label>
      </div></header>
      <section class="activity-kpis" aria-label="Activity summary">
        <article class="activity-kpi control-room-card control-room-card--metric"><span class="activity-kpi__icon is-purple">${icon("calls")}</span><div><strong>${number(filtered.length)}</strong><b>API calls</b><small>Total in selected period</small></div></article>
        <article class="activity-kpi control-room-card control-room-card--health"><span class="activity-kpi__icon is-green">${icon("success")}</span><div><strong>${successRate.toFixed(1)}%</strong><b>success</b><small>${number(successful)} successful</small></div></article>
        <article class="activity-kpi control-room-card control-room-card--metric"><span class="activity-kpi__icon is-purple">${icon("latency")}</span><div><strong>${number(medianLatency)} <em>ms</em></strong><b>median latency</b><small>P50 response time</small></div></article>
        <article class="activity-kpi control-room-card control-room-card--recent"><span class="activity-kpi__icon is-coral">${icon("failed")}</span><div><strong>${number(failed)}</strong><b>failed requests</b><small>${filtered.length ? (failed / filtered.length * 100).toFixed(1) : "0.0"}% of total</small></div></article>
      </section>
      <section class="activity-analytics-grid">
        <article class="activity-panel activity-traffic control-room-card control-room-card--chart"><header><h2>Requests over time</h2><div class="activity-legend"><span class="is-successful">Successful</span><span class="is-failed">Failed</span></div></header>${trafficChart(filtered, days)}</article>
        <article class="activity-panel control-room-card control-room-card--usage"><h2>Provider usage</h2>${usageChart(filteredProviders, filtered.length)}</article>
        <article class="activity-panel control-room-card control-room-card--metric"><h2>Latency by provider</h2>${latencyChart(filteredProviders)}</article>
      </section>
      <section class="activity-panel activity-log-card control-room-card control-room-card--recent"><header><h2>Recent proxy calls</h2><span>Sanitized metadata only</span></header><div class="activity-table-wrap"><table><thead><tr><th>Time</th><th>Provider</th><th>Model</th><th>Status</th><th>Latency</th><th>Tokens</th><th>Trace ID</th></tr></thead><tbody>${tableRows(filtered)}</tbody></table></div></section>
    </section>`;

    workspace.querySelector("#activityRange").addEventListener("change", event => onDaysChange(Number(event.target.value)));
    workspace.querySelector("#activityProvider").addEventListener("change", event => { state.provider = event.target.value; draw(); });
    workspace.querySelector("#activityStatus").addEventListener("change", event => { state.status = event.target.value; draw(); });
  };

  draw();
}
