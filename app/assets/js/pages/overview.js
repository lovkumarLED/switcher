import { api, optional } from "../core/api.js";
import { store } from "../core/store.js";
import { escapeHtml, notify } from "../core/dialog.js";
import { isClaude } from "../core/capabilities.js";
import { providerLogoMark } from "../core/provider-logo.js";
import { openRouteDetails } from "./claude-routes.js";

const RESTART_NOTICE = "Restarting Claude Code may be required for startup-only values.";

const icon = {
  calendar: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.8h17M8 3v4M16 3v4"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 9.5 5.5 5.5 5.5-5.5"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6.5 5.5 5.5-5.5 5.5"/></svg>`,
  terminal: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 7 5 5-5 5M12 17h7"/></svg>`,
  trendUp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 16.5 9 11l3.5 3.5 7.5-7.5"/><path d="M15 7h5.5v5.5"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 19 6v5.2c0 4.2-2.8 7.9-7 9.6-4.2-1.7-7-5.4-7-9.6V6z"/><path d="m9.2 12 2 2 3.8-4.2"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2.2"/></svg>`,
  users: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8.6" r="3.4"/><path d="M3.2 19.4c.7-3.2 3-4.9 5.8-4.9s5.1 1.7 5.8 4.9"/><circle cx="17" cy="9.4" r="2.6"/><path d="M15.4 14.7c2.6.2 4.6 1.7 5.2 4.3"/></svg>`,
  arrowUp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>`,
  arrowDown: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 9v8H9"/></svg>`
};

const AGENT_DISPLAY = { opencode: "OpenCode", kilo: "Kilo" };

export function circularRelayIndex(index, delta, count) {
  if (count < 1) return 0;
  return ((index + delta) % count + count) % count;
}

export function relayDragStep(deltaY, threshold = 42) {
  if (Math.abs(deltaY) < threshold) return 0;
  return deltaY > 0 ? 1 : -1;
}

export function relayItems(providers, activeId = null) {
  return (Array.isArray(providers) ? providers : [])
    .filter(Boolean)
    .sort((a, b) => (a.id === activeId ? -1 : b.id === activeId ? 1 : 0));
}

export function relayLayerProviders(providers, index) {
  const count = providers.length;
  if (!count) return { front: null, middle: null, back: null };
  return {
    front: providers[circularRelayIndex(index, 0, count)],
    middle: count > 1 ? providers[circularRelayIndex(index, 1, count)] : null,
    back: count > 2 ? providers[circularRelayIndex(index, -1, count)] : null,
  };
}

function header(agentName, days) {
  return `<div class="page-head overview-head"><h1 class="page-title">Workspace overview</h1><div class="page-controls">
    <label class="chip chip--select" for="overviewRange">${icon.calendar}<select id="overviewRange" aria-label="Overview date range">${activityRangeOptions(days)}</select>${icon.chevronDown}</label>
    <span class="chip"><span class="status-dot status-dot--ok" aria-hidden="true"></span>${escapeHtml(agentName)}</span>
    <span class="chip chip--mono">${icon.terminal}<span>127.0.0.1:9090</span></span>
  </div></div>`;
}

function relayProviderDetail(provider) {
  const modelCount = Array.isArray(provider.models) ? provider.models.length : 0;
  const active = Boolean(provider.active);
  return `<div class="relay-front__head">${providerLogoMark(provider.name, { id: provider.id })}<strong>${escapeHtml(provider.name)}</strong>${active ? '<span class="active-pill">Active</span>' : ""}</div>
      <dl class="relay-front__meta">
        <div><dt>Models</dt><dd>${modelCount} ${modelCount === 1 ? "model" : "models"}</dd></div>
        <div><dt>Endpoint</dt><dd class="mono">${escapeHtml(provider.baseUrl || "—")}</dd></div>
        <div><dt>SDK</dt><dd>${escapeHtml(provider.npm || "OpenAI-compatible")}</dd></div>
        <div><dt>Auth</dt><dd>${provider.hasKey ? "API key stored" : "No key"}</dd></div>
      </dl>
      <div class="relay-front__actions">${active ? '<button class="button button--danger" type="button" data-relay-action="deactivate">Deactivate provider</button>' : '<button class="button button--primary" type="button" data-relay-action="activate">Activate provider</button>'}<button class="button button--outline" type="button" data-route="providers">View details</button></div>`;
}

function relayProviderMini(provider) {
  return `<div class="relay-mini"><span class="relay-mini__mark">${providerLogoMark(provider.name, { id: provider.id, size: "sm" })}</span></div><div class="relay-incoming-detail" aria-hidden="true" inert>${relayProviderDetail(provider)}</div>`;
}

export function relayStackMarkup(providers, index, activeId) {
  if (!Array.isArray(providers) || providers.length === 0) return `<div class="relay-stack" data-relay-count="0" style="--relay-stack-height:0px"></div>`;
  const count = providers.length;
  // Keep a single-provider relay compact, then reserve just enough depth for
  // the cards that are actually present. The stack still uses the same card
  // geometry; only its vertical footprint changes with provider count.
  const frontTop = count === 1 ? 24 : count === 2 ? 42 : count === 3 ? 56 : 66;
  const depthStep = count === 1 ? 0 : count === 2 ? 24 : 20;
  const frontHeight = 206;
  const visibleDepth = Math.min(Math.max(count - 1, 0), 4);
  const stackHeight = Math.min(340, frontTop + frontHeight + 18 + visibleDepth * 4);
  const cards = Array.from({ length: count }, (_, depth) => {
    const provider = providers[circularRelayIndex(index, depth, count)];
    const role = depth === 0 ? "front" : depth === 1 ? "middle" : depth === 2 ? "back" : "layer";
    const visualDepth = Math.min(depth, 4);
    const left = Math.max(0, 23 - visualDepth * 7);
    const top = Math.max(0, frontTop - visualDepth * depthStep);
    const width = Math.min(75, 71 + visualDepth);
    const height = Math.max(170, 206 - visualDepth * 9);
    const scale = Math.max(.92, 1 - visualDepth * .018).toFixed(3);
    const opacity = Math.max(.22, 1 - visualDepth * .13).toFixed(3);
    const body = depth === 0 ? relayProviderDetail(provider) : relayProviderMini(provider);
    return `<div class="relay-stack__card relay-stack__card--${role}" data-relay-depth="${depth}" style="--relay-left:${left}%;--relay-top:${top}px;--relay-width:${width}%;--relay-height:${height}px;--relay-depth:${depth};--relay-visual-depth:${visualDepth};--relay-scale:${scale};--relay-opacity:${opacity}"${depth === 0 ? "" : ' aria-hidden="true"'}>${body}</div>`;
  }).join("");
  return `<div class="relay-stack" data-relay-count="${count}" style="--relay-stack-height:${stackHeight}px;--relay-front-top:${frontTop}px;--relay-front-left:23%;--relay-front-width:71%;--relay-front-height:${frontHeight}px">${cards}</div>`;
}

function relayCard(providers, activeId) {
  const ordered = relayItems(providers, activeId);
  const card = document.createElement("article");
  card.className = "card control-room-card control-room-card--relay relay-card";
  card.dataset.relayCount = String(ordered.length);
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", "Provider relay — scroll to browse");
  if (!Array.isArray(providers) || providers.length === 0) {
    card.innerHTML = `<h2 class="card-title">Your provider relay</h2>
      <div class="empty-state"><h3>No providers configured yet</h3><p>Add a provider (OmniRoute, LiteLLM, CLI Proxy, TokenRouter, OpenRouter, or any custom endpoint) and traffic through the local proxy will route through it.</p><button class="button button--primary" type="button" data-route="providers">Add a provider</button></div>`;
    return card;
  }
  const stack = document.createElement("div");
  stack.innerHTML = relayStackMarkup(ordered, 0, activeId);
  card.innerHTML = `<h2 class="card-title">Your provider relay</h2>`;
  card.append(stack.firstElementChild);
  const stackEl = card.querySelector(".relay-stack");
  let index = 0;
  let busy = false;
  let wheelDelta = 0;
  let wheelReset = 0;
  let drag = null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clearDragPreview = () => {
    card.classList.remove("is-dragging");
    stackEl.querySelectorAll(".relay-stack__card").forEach(element => { element.style.transform = ""; });
  };

  const previewDrag = deltaY => {
    const amount = Math.min(1, Math.abs(deltaY) / 110);
    const direction = deltaY >= 0 ? 1 : -1;
    const front = stackEl.querySelector(".relay-stack__card--front");
    const incomingDepth = direction > 0 ? 1 : Math.max(1, ordered.length - 1);
    const incoming = stackEl.querySelector(`[data-relay-depth="${incomingDepth}"]`);
    if (front) {
      const scale = direction > 0 ? 1 + amount * 0.055 : 1 - amount * 0.035;
      front.style.transform = `translate3d(${direction * amount * 9}px, ${deltaY * 0.22}px, 0) scale(${scale})`;
    }
    if (incoming) {
      const x = direction > 0 ? amount * 14 : amount * 7;
      const y = direction > 0 ? amount * 22 : amount * 17;
      incoming.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${1 + amount * 0.035})`;
    }
  };

  const step = delta => {
    if (busy || ordered.length < 2) return;
    const dir = delta > 0 ? 1 : -1;
    if (reduceMotion) {
      index = circularRelayIndex(index, dir, ordered.length);
      stackEl.innerHTML = relayStackMarkup(ordered, index, activeId);
      return;
    }
    busy = true;
    const motionClass = dir > 0 ? "is-stepping-forward" : "is-stepping-backward";
    const incomingDepth = dir > 0 ? 1 : ordered.length - 1;
    const incoming = stackEl.querySelector(`[data-relay-depth="${incomingDepth}"]`);
    incoming?.classList.add("is-relay-incoming");
    card.classList.add(motionClass);
    stackEl.classList.add(motionClass);
    window.setTimeout(() => {
      index = circularRelayIndex(index, dir, ordered.length);
      stackEl.innerHTML = relayStackMarkup(ordered, index, activeId);
      card.classList.remove(motionClass);
      stackEl.classList.remove(motionClass);
      busy = false;
    }, 420);
  };

  card.addEventListener("wheel", event => {
    if (ordered.length < 2) return;
    event.preventDefault();
    if (busy) return;
    wheelDelta += event.deltaY;
    window.clearTimeout(wheelReset);
    wheelReset = window.setTimeout(() => { wheelDelta = 0; }, 140);
    if (Math.abs(wheelDelta) < 28) return;
    const direction = wheelDelta > 0 ? 1 : -1;
    wheelDelta = 0;
    step(direction);
  }, { passive: false });

  stackEl.addEventListener("pointerdown", event => {
    if (event.button !== 0 || busy || ordered.length < 2 || event.target.closest("button, a, input, select, textarea, [role='button']")) return;
    drag = { id: event.pointerId, startY: event.clientY, lastY: event.clientY };
    stackEl.setPointerCapture?.(event.pointerId);
    card.classList.add("is-dragging");
  });
  stackEl.addEventListener("pointermove", event => {
    if (!drag || event.pointerId !== drag.id) return;
    drag.lastY = event.clientY;
    const deltaY = drag.lastY - drag.startY;
    previewDrag(deltaY);
    if (Math.abs(deltaY) > 4) event.preventDefault();
  });
  const finishDrag = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const deltaY = drag.lastY - drag.startY;
    const direction = relayDragStep(deltaY, 42);
    drag = null;
    if (direction) step(direction);
    clearDragPreview();
  };
  stackEl.addEventListener("pointerup", finishDrag);
  stackEl.addEventListener("pointercancel", event => {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null;
    clearDragPreview();
  });

  card.addEventListener("keydown", event => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") { event.preventDefault(); step(1); }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
  });

  stackEl.addEventListener("click", async event => {
    const button = event.target.closest("[data-relay-action]");
    if (!button || busy || !ordered.length) return;
    const provider = ordered[index];
    if (!provider) return;
    button.disabled = true;
    try {
      if (button.dataset.relayAction === "deactivate") {
        await api.deactivateProvider(provider.id);
        notify(`Removed ${provider.name} from the build.`, "success");
      } else {
        await api.activateProvider(provider.id);
        notify(`Added ${provider.name} to the build.`, "success");
      }
      document.dispatchEvent(new CustomEvent("ai-switcher:refresh", { detail: "overview" }));
    } catch (error) {
      notify(error.message, "error");
      button.disabled = false;
    }
  });
  return card;
}

function kpiCard(kpi, days) {
  return `<article class="card control-room-card control-room-card--metric kpi"><span class="kpi__icon kpi__icon--${kpi.tone}">${icon[kpi.icon]}</span>
    <div class="kpi__value">${kpi.value}${kpi.unit ? `<small>${kpi.unit}</small>` : ""}</div>
    <div class="kpi__label">${kpi.label}</div>
    <div class="kpi__delta"><span class="kpi__note">${activityRangeLabel(days).toLowerCase()}</span></div>
  </article>`;
}

function kpiGrid(summary, days) {
  const latency = summary.medianLatencyMs != null ? String(summary.medianLatencyMs) : "—";
  const kpis = [
    { icon: "trendUp", tone: "coral", value: String(summary.requestCount || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ","), unit: "", label: "API calls" },
    { icon: "shield", tone: "violet", value: `${summary.successRate ?? 0}%`, unit: "", label: "success rate" },
    { icon: "clock", tone: "violet", value: latency, unit: latency === "—" ? "" : "ms", label: "median latency" },
    { icon: "users", tone: "violet", value: String(summary.failedRequestCount ?? 0), unit: "", label: "failed requests" },
  ];
  return `<section class="kpi-grid" aria-label="Proxy activity summary">${kpis.map(kpi => kpiCard(kpi, days)).join("")}</section>`;
}

function emptyAnalytics() {
  return `<article class="card kpi-grid-empty"><div class="empty-state"><h3>No proxy traffic yet</h3><p>Requests made through the local proxy (127.0.0.1:9090) appear here with their metadata — request count, success rate, latency, and per-provider usage. Nothing is tracked until your tools actually talk to the proxy.</p></div></article>`;
}

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function lineChart(events, days) {
  const W = 660, H = 168, L = 34, R = 6, T = 6, B = 24;
  const pw = W - L - R, ph = H - T - B;
  const pointCount = days === 1 ? 7 : 10;
  const { start, end } = activityRangeWindow(events, days);
  const bucketSize = (end - start) / pointCount;
  const buckets = Array.from({ length: pointCount }, (_, index) => new Date(start + bucketSize * index));
  const counts = buckets.map(() => ({ success: 0, failed: 0 }));
  for (const event of events) {
    const date = new Date(event.timestamp);
    if (Number.isNaN(date.getTime())) continue;
    const index = Math.max(0, Math.min(pointCount - 1, Math.floor((date.getTime() - start) / bucketSize)));
    if (typeof event.status === "number" && event.status >= 400) counts[index].failed += 1;
    else counts[index].success += 1;
  }
  const peak = Math.max(1, ...counts.flatMap(c => [c.success, c.failed]));
  const y = v => T + ph - (v / peak) * ph;
  const x = i => L + (i / (pointCount - 1)) * pw;
  const toPath = arr => arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const grid = [0, 0.25, 0.5, 0.75, 1].map(frac => {
    const value = Math.round(peak * frac);
    return `<line class="lc-grid" x1="${L}" x2="${W - R}" y1="${y(value).toFixed(1)}" y2="${y(value).toFixed(1)}"/><text class="lc-ylabel" x="${L - 8}" y="${(y(value) + 3.5).toFixed(1)}" text-anchor="end">${value}</text>`;
  }).join("");
  const formatXLabel = date => days === 1 ? date.toLocaleTimeString("en-US", { hour: "numeric" }) : days === 0 ? date.toLocaleString("en-US", { month: "short", day: "numeric" }) : `${date.toLocaleString("en-US", { weekday: "short" })} ${date.getDate()}`;
  const xlabels = buckets.map((date, i) => `<text class="lc-xlabel" x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${formatXLabel(date)}</text>`).join("");
  return `<article class="card control-room-card control-room-card--chart chart-card">
    <div class="card-head"><h2 class="card-title">Requests over time</h2><div class="chart-legend"><span class="chart-legend__item"><i class="lc-swatch lc-swatch--success"></i>Successful</span><span class="chart-legend__item"><i class="lc-swatch lc-swatch--failed"></i>Failed</span></div></div>
    <svg class="line-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart of successful and failed requests over the selected range">
      ${grid}${xlabels}
      <path class="lc-line lc-line--failed" d="${toPath(counts.map(c => c.failed))}"/>
      <path class="lc-line lc-line--success" d="${toPath(counts.map(c => c.success))}"/>
    </svg>
  </article>`;
}

function usageCard(events) {
  const size = 204, c = size / 2, r = 76.5, C = 2 * Math.PI * r, gap = 2.5;
  const tally = {};
  for (const event of events) {
    const key = String(event.providerId || "unknown");
    tally[key] = (tally[key] || 0) + 1;
  }
  const rows = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const total = rows.reduce((sum, [, count]) => sum + count, 0);
  let acc = 0;
  const segments = rows.map(([name, count], index) => {
    const frac = count / total;
    const len = Math.max(0, frac * C - gap);
    const start = acc * 360 - 90;
    const mid = (acc + frac / 2) * 360 - 90;
    acc += frac;
    const rad = mid * Math.PI / 180;
    const lx = c + r * Math.cos(rad), ly = c + r * Math.sin(rad);
    return `<circle class="donut-seg donut-seg--${index}" cx="${c}" cy="${c}" r="${r}" stroke-dasharray="${len.toFixed(1)} ${(C - len).toFixed(1)}" transform="rotate(${start.toFixed(1)} ${c} ${c})"/><text class="donut-pct" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="central">${Math.round(frac * 100)}%</text>`;
  }).join("");
  const legend = rows.map(([name, count], index) => `<li class="usage-row"><span class="usage-row__name"><i class="usage-chip usage-chip--${index}"></i>${escapeHtml(name)}</span><span class="usage-row__pct">${Math.round((count / total) * 100)}%</span><span class="usage-row__count">${count.toLocaleString("en-US")}</span></li>`).join("");
  return `<article class="card control-room-card control-room-card--usage usage-card"><h2 class="card-title">Provider usage</h2>
    <div class="usage-body">
      <svg class="usage-donut" viewBox="0 0 ${size} ${size}" role="img" aria-label="Provider usage donut by request count">${segments}</svg>
      <ul class="usage-legend">${legend}<li class="usage-row usage-row--total"><span class="usage-row__name">Total</span><span class="usage-row__pct"></span><span class="usage-row__count">${total.toLocaleString("en-US")}</span></li></ul>
    </div>
  </article>`;
}

function formatTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

function recentCard(events) {
  const rows = events.slice(0, 5).map(call => {
    const ok = typeof call.status !== "number" || call.status < 400;
    const latency = typeof call.latencyMs === "number" ? `${call.latencyMs} ms` : "—";
    return `<tr>
      <td class="col-time">${escapeHtml(formatTime(call.timestamp))}</td>
      <td><span class="provider-cell">${providerLogoMark(call.providerId || "unknown", { id: call.providerId, size: "sm" })}${escapeHtml(call.providerId || "unknown")}</span></td>
      <td class="col-model">${escapeHtml(call.model || "—")}</td>
      <td><span class="activity-status ${ok ? "is-success" : "is-failed"}">${ok ? "✓" : "!"} ${ok ? "Success" : `Failed (${call.status})`}</span></td>
      <td class="col-latency">${escapeHtml(latency)}</td>
    </tr>`;
  }).join("");
  return `<article class="activity-panel activity-log-card control-room-card control-room-card--recent recent-card overview-recent-card"><header><h2>Recent proxy calls</h2><span>Sanitized metadata only</span></header>
    <div class="activity-table-wrap"><table class="recent-table"><thead><tr><th>Time</th><th>Provider</th><th>Model</th><th>Status</th><th class="col-latency">Latency</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="table-foot"><span class="table-foot__count">Showing 1\u2013${Math.min(5, events.length)} of ${events.length}</span><button class="view-all" type="button" data-route="activity">View all${icon.chevronRight}</button></div>
  </article>`;
}

export async function renderOverview(workspace, days = readActivityRange()) {
  if (isClaude()) {
    await renderClaudeOverview(workspace);
    return;
  }
  const [providerData, summaryData, events, statusData] = await Promise.all([
    optional(() => api.providers(), { providers: [], activeProvider: null }),
    optional(() => api.activitySummary(days), { requestCount: 0, failedRequestCount: 0, successRate: 0, medianLatencyMs: null }),
    optional(() => api.activity(days, 100), []),
    optional(() => api.status(), { agent: null }),
  ]);
  const providers = Array.isArray(providerData.providers) ? providerData.providers : [];
  const hasActivity = (summaryData.requestCount || 0) > 0 && Array.isArray(events) && events.length > 0;
  const agentName = AGENT_DISPLAY[statusData.agent] || statusData.agent || "Local agent";
  store.set({ providers, activeProvider: providerData.activeProvider });
  const overviewBody = hasActivity
    ? `<div class="overview-kpis">${kpiGrid(summaryData, days)}</div>${usageCard(events)}${lineChart(events, days)}${recentCard(events)}`
    : emptyAnalytics();
  workspace.innerHTML = `${header(agentName, days)}<div class="overview-masonry"><div id="relayMount"></div>${overviewBody}</div>`;
  const mount = workspace.querySelector("#relayMount");
  if (mount) mount.replaceWith(relayCard(providers, providerData.activeProvider));
  workspace.querySelector("#overviewRange")?.addEventListener("change", event => { const range = writeActivityRange(Number(event.target.value)); renderOverview(workspace, range); });
}

function claudeStateLabel(value, fallback = "Unknown") {
  return value === true ? "Ready" : value === false ? "Needs setup" : fallback;
}

function claudeHealthItem(label, value, tone = "neutral") {
  return `<div class="claude-health-item claude-health-item--${tone}"><span class="claude-health-item__dot" aria-hidden="true"></span><div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div></div>`;
}

function claudeRelayGeometry(count) {
  const total = Math.max(1, Number(count) || 1);
  const frontTop = total === 1 ? 24 : total === 2 ? 42 : total === 3 ? 56 : 66;
  const depthStep = total === 1 ? 0 : total === 2 ? 24 : 20;
  const frontHeight = 206;
  const visibleDepth = Math.min(Math.max(total - 1, 0), 4);
  const stackHeight = Math.min(340, frontTop + frontHeight + 18 + visibleDepth * 4);
  return { frontTop, depthStep, frontHeight, stackHeight };
}

function claudeRouteCard(route, store, layer, depthOverride = null, geometry = null) {
  const applied = route.id === store.appliedRouteId && Boolean(route.configSha256) && route.configSha256 === store.appliedRouteConfigSha256;
  const pending = route.id === store.appliedRouteId && !applied;
  const model = route.effectiveModel || route.model || "Role-based model";
  const status = applied ? "Applied" : pending ? "Needs apply" : "Saved";
  const statusClass = applied ? "applied" : pending ? "pending" : "saved";
  const depth = Number.isInteger(depthOverride) ? depthOverride : layer === "front" ? 0 : layer === "middle" ? 1 : layer === "back" ? 2 : 3;
  const visualDepth = Math.min(depth, 4);
  const relayGeometry = geometry || claudeRelayGeometry(4);
  const left = Math.max(0, 23 - visualDepth * 7);
  const top = Math.max(0, relayGeometry.frontTop - visualDepth * relayGeometry.depthStep);
  const width = Math.min(75, 71 + visualDepth);
  const height = Math.max(170, relayGeometry.frontHeight - visualDepth * 9);
  const scale = Math.max(.92, 1 - visualDepth * .018).toFixed(3);
  const background = depth > 0;
  if (background) {
    return `<article class="claude-route-deck__card claude-route-deck__card--${layer} relay-stack__card relay-stack__card--${layer}" data-claude-route-id="${escapeHtml(route.id)}" data-provider-logo-id="${escapeHtml(route.id)}" data-relay-depth="${depth}" style="--relay-left:${left}%;--relay-top:${top}px;--relay-width:${width}%;--relay-height:${height}px;--relay-visual-depth:${visualDepth};--relay-scale:${scale};--relay-opacity:1" aria-hidden="true" inert><div class="claude-route-deck__background-mark">${providerLogoMark(route.name, { id: route.id, size: "md", className: "claude-route-mark" })}</div></article>`;
  }
  const action = applied
    ? `<button class="button button--outline button--small" type="button" data-claude-overview-details="${escapeHtml(route.id)}">View details</button>`
    : `<button class="button button--primary button--small" type="button" data-claude-overview-apply="${escapeHtml(route.id)}">Apply route</button><button class="button button--outline button--small" type="button" data-claude-overview-details="${escapeHtml(route.id)}">View details</button>`;
  return `<article class="claude-route-deck__card claude-route-deck__card--${layer} relay-stack__card relay-stack__card--${layer}" data-claude-route-id="${escapeHtml(route.id)}" data-relay-depth="${depth}" style="--relay-left:${left}%;--relay-top:${top}px;--relay-width:${width}%;--relay-height:${height}px;--relay-visual-depth:${visualDepth};--relay-scale:${scale};--relay-opacity:1" aria-label="${escapeHtml(route.name)} route"><div class="claude-route-deck__card-head"><div class="claude-route-deck__identity">${providerLogoMark(route.name, { id: route.id, size: "md", className: "claude-route-mark" })}<div><p class="eyebrow">${applied ? "Active route" : "Saved route"}</p><h3>${escapeHtml(route.name)}</h3></div></div><span class="claude-route-pill claude-route-pill--${statusClass}">${status}</span></div><p class="claude-route-deck__endpoint mono">${escapeHtml(route.baseUrl)}</p><dl class="claude-route-deck__meta"><div><dt>Model</dt><dd>${escapeHtml(model)}</dd></div><div><dt>Auth</dt><dd>${escapeHtml(route.secretEnvRef || "Environment reference")}</dd></div></dl><div class="claude-route-deck__actions">${action}</div></article>`;
}

export function claudeRouteDeckMarkup(routes, store, deckIndex = 0) {
  const list = Array.isArray(routes) ? routes : [];
  if (!list.length) {
    return `<div class="claude-route-deck claude-route-deck--empty"><div class="claude-route-empty"><span class="claude-route-empty__icon">${icon.arrowUp}</span><h3>No Claude route applied</h3><p>Save a route to switch Claude Code between local and hosted gateways.</p><button class="button button--primary button--small" type="button" data-route="providers">Open routes</button></div></div>`;
  }
  const items = list;
  const index = ((deckIndex % items.length) + items.length) % items.length;
  const geometry = claudeRelayGeometry(items.length);
  const cards = items.map((route, offset) => {
    const relative = (offset - index + items.length) % items.length;
    return claudeRouteCard(route, store, relative === 0 ? "front" : relative === 1 ? "middle" : relative === 2 ? "back" : "layer", relative, geometry);
  }).join("");
  return `<div class="claude-route-deck relay-card" tabindex="0" aria-label="Claude saved route deck"><div class="claude-route-deck__cards relay-stack" data-relay-count="${list.length}" style="--relay-stack-height:${geometry.stackHeight}px;--relay-front-top:${geometry.frontTop}px;--relay-front-left:23%;--relay-front-width:71%;--relay-front-height:${geometry.frontHeight}px">${cards}</div><div class="claude-route-deck__footer"><button class="button button--icon" type="button" data-claude-route-prev aria-label="Show previous route">${icon.chevronRight}</button><span class="claude-route-deck__hint">Scroll or use the arrows to browse ${list.length} saved route${list.length === 1 ? "" : "s"}</span><button class="button button--icon" type="button" data-claude-route-next aria-label="Show next route">${icon.chevronRight}</button></div></div>`;
}

function claudeInventoryBlock(title, count, items, typeCounts = null, tone = "mcp") {
  const types = typeCounts ? Object.entries(typeCounts).map(([type, value]) => `<span class="claude-inventory-stat"><strong>${value}</strong><span>${escapeHtml(type)}</span></span>`).join("") : "";
  const rows = items.length ? items.slice(0, 6).map(item => `<li><span class="claude-inventory-row__dot" aria-hidden="true"></span><span>${escapeHtml(item)}</span></li>`).join("") : '<li class="muted">Nothing detected yet.</li>';
  return `<section class="claude-inventory-block claude-inventory-block--${escapeHtml(tone)}"><div class="claude-inventory-block__head"><div><p class="eyebrow">${escapeHtml(title)}</p><h3>${count}</h3></div><span class="claude-inventory-block__label">read-only</span></div>${types ? `<div class="claude-inventory-stats">${types}</div>` : ""}<ul class="claude-inventory-list">${rows}</ul></section>`;
}

function claudeEventLabel(type) {
  return String(type || "event").replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export function claudeOverviewMarkup({ routes = [], appliedRouteId = null, appliedRouteConfigSha256 = null, status = null, activity = [], inventory = {} } = {}, { deckIndex = 0 } = {}) {
  const list = Array.isArray(routes) ? routes : [];
  const applied = list.find(route => route.id === appliedRouteId) || null;
  const locked = Boolean(status?.realTargetLocked);
  const mcps = Array.isArray(inventory.mcps) ? inventory.mcps : [];
  const plugins = Array.isArray(inventory.plugins) ? inventory.plugins : [];
  const typeCounts = mcps.reduce((counts, mcp) => { const type = String(mcp?.type || "other"); counts[type] = (counts[type] || 0) + 1; return counts; }, {});
  const mcpNames = mcps.map(mcp => mcp?.name || "Unnamed server");
  const pluginNames = plugins.map(plugin => typeof plugin === "string" ? plugin : plugin?.name || "Unnamed plugin");
  const events = Array.isArray(activity) ? activity : [];
  const successCount = events.filter(event => !/fail|error/i.test(String(event.type || ""))).length;
  const health = [
    claudeHealthItem("Settings file", claudeStateLabel(status?.settingsPresent, "Locked"), status?.settingsPresent === true ? "ok" : "warn"),
    claudeHealthItem("Active route", applied ? "Configured" : "Not configured", applied ? "ok" : "warn"),
    claudeHealthItem("Auth reference", applied ? "Configured" : "Not configured", applied ? "ok" : "warn"),
    claudeHealthItem("Saved routes", String(list.length), list.length ? "ok" : "neutral"),
    claudeHealthItem("Latest backup", status?.lastBackupAvailable ? "Available" : "None", status?.lastBackupAvailable ? "ok" : "neutral"),
    claudeHealthItem("Target lock", locked ? "Locked" : "Unlocked", locked ? "warn" : "ok"),
  ].join("");
  const eventRows = events.slice(0, 50).map(event => {
    const failed = /fail|error/i.test(String(event.type || ""));
    const timestamp = String(event.ts || "").slice(0, 19).replace("T", " ");
    const statusLabel = failed ? "Failed" : "Completed";
    return `<li class="claude-activity-list__item claude-activity-list__item--${failed ? "error" : "ok"}" role="row"><span class="claude-activity-list__marker" aria-hidden="true">${failed ? "!" : "✓"}</span><div class="claude-activity-list__route" role="cell"><strong>${escapeHtml(event.routeId || "Claude Code")}</strong><span class="muted">${escapeHtml(claudeEventLabel(event.type))}</span></div><time class="claude-activity-list__time muted mono" role="cell">${escapeHtml(timestamp || "—")}</time><span class="claude-activity-list__result" role="cell">${statusLabel}</span></li>`;
  }).join("");
  const activityTable = eventRows ? `<div class="claude-activity-table" role="table" aria-label="Recent route activity"><div class="claude-activity-table__head" role="row"><span aria-hidden="true"></span><span role="columnheader">Route / event</span><span role="columnheader">Time</span><span role="columnheader">Status</span></div><ul class="claude-activity-list">${eventRows}</ul></div>` : '<div class="claude-activity-empty"><span aria-hidden="true">↗</span><p>No route activity yet.</p><button class="button button--outline button--small" type="button" data-route="providers">Manage routes</button></div>';
  return `<div class="page-head overview-head"><div><p class="eyebrow">Claude Code routing</p><h1 class="page-title">Workspace overview</h1></div><div class="page-controls"><span class="chip"><span class="status-dot status-dot--ok" aria-hidden="true"></span>Claude Code</span><span class="chip chip--mono">${icon.terminal}<span>127.0.0.1:9090</span></span></div></div><div class="overview-masonry claude-overview-masonry"><section class="card card--padded control-room-card control-room-card--relay claude-overview-card claude-overview-card--route"><div class="claude-card-heading"><div><p class="eyebrow">Your provider relay</p><h2>Choose the route Claude uses</h2></div><span class="claude-route-count">${list.length} saved</span></div><div id="claudeRouteDeckMount" class="claude-route-deck-shell">${claudeRouteDeckMarkup(list, { appliedRouteId, appliedRouteConfigSha256 }, deckIndex)}</div></section><section class="card card--padded control-room-card control-room-card--health claude-overview-card claude-overview-card--status"><div class="claude-card-heading"><div><p class="eyebrow">System health</p><h2>Claude Code status</h2></div><span class="claude-health-badge claude-health-badge--${locked ? "warn" : "ok"}">${locked ? "Locked" : "Ready"}</span></div><dl class="claude-health-grid">${health}</dl><div class="claude-info-strip"><strong>Startup values</strong><span>${RESTART_NOTICE}</span></div></section><section class="card card--padded control-room-card control-room-card--inventory claude-overview-card claude-overview-card--inventory"><div class="claude-card-heading"><div><p class="eyebrow">Read-only inventory</p><h2>What Claude already has</h2></div></div><div class="claude-inventory-grid">${claudeInventoryBlock("MCP servers", mcps.length, mcpNames, typeCounts, "mcp")}${claudeInventoryBlock("Plugins", plugins.length, pluginNames, null, "plugins")}</div></section><section class="card card--padded control-room-card control-room-card--activity claude-overview-card claude-overview-card--activity"><div class="claude-card-heading"><div><p class="eyebrow">Routing history</p><h2>Recent route activity</h2></div><span class="claude-activity-summary"><strong>${events.length}</strong> events · <strong>${successCount}</strong> completed</span></div>${activityTable}</section></div>`;
}

async function applyClaudeOverviewRoute(workspace, routeId) {
  try {
    const current = await api.claudeRoutes();
    if (!current.revision || !current.routesRevision) throw new Error("The Claude target is locked.");
    await api.applyClaudeRoute(routeId, { expectedRevision: current.revision, expectedRoutesRevision: current.routesRevision });
    notify("Route applied to Claude Code.", "success");
    await renderClaudeOverview(workspace);
  } catch (error) {
    notify(error.message, "error");
  }
}

function wireClaudeRouteDeck(workspace, data) {
  const mount = workspace.querySelector("#claudeRouteDeckMount");
  if (!mount) return;
  const routes = Array.isArray(data.routes) ? data.routes : [];
  let deckIndex = 0;
  let busy = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderDeck = () => {
    mount.innerHTML = claudeRouteDeckMarkup(routes, data, deckIndex);
    const deck = mount.querySelector(".claude-route-deck");
    if (!deck) return;
    const step = delta => {
      const itemCount = routes.length;
      if (busy || itemCount < 2) return;
      const direction = delta > 0 ? 1 : -1;
      if (reduceMotion) {
        deckIndex = circularRelayIndex(deckIndex, direction, itemCount);
        renderDeck();
        return;
      }
      busy = true;
      const rearEntry = direction < 0 && itemCount > 2 && deckIndex === 0;
      if (rearEntry) {
        const previousIndex = circularRelayIndex(deckIndex, -1, itemCount);
        const previous = routes[previousIndex];
        const backCard = deck.querySelector(".claude-route-deck__card--back");
        if (backCard) {
          const wrapper = document.createElement("div");
          wrapper.innerHTML = claudeRouteCard(previous, data, "layer", itemCount - 1, claudeRelayGeometry(itemCount));
          backCard.replaceWith(wrapper.firstElementChild);
          deck.classList.add("is-rear-entry");
        }
      }
      deck.classList.add(direction > 0 ? "is-stepping-forward" : "is-stepping-backward");
      window.setTimeout(() => {
        deckIndex = circularRelayIndex(deckIndex, direction, itemCount);
        renderDeck();
        busy = false;
      }, 340);
    };
    deck.querySelector("[data-claude-route-prev]")?.addEventListener("click", () => step(-1));
    deck.querySelector("[data-claude-route-next]")?.addEventListener("click", () => step(1));
    deck.addEventListener("keydown", event => { if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); } if (event.key === "ArrowRight") { event.preventDefault(); step(1); } });
    deck.addEventListener("wheel", event => { if (Math.abs(event.deltaY) > 8) { event.preventDefault(); step(event.deltaY > 0 ? 1 : -1); } }, { passive: false });
    let startX = null;
    deck.addEventListener("pointerdown", event => { if (event.target.closest("button, a, input, select, textarea, [role='button']")) return; startX = event.clientX; deck.setPointerCapture?.(event.pointerId); });
    deck.addEventListener("pointerup", event => { if (startX === null) return; const delta = event.clientX - startX; startX = null; if (Math.abs(delta) > 32) step(delta < 0 ? 1 : -1); });
    deck.querySelectorAll("[data-claude-overview-apply]").forEach(button => button.addEventListener("click", () => applyClaudeOverviewRoute(workspace, button.dataset.claudeOverviewApply)));
    deck.querySelectorAll("[data-claude-overview-details]").forEach(button => button.addEventListener("click", () => openRouteDetails(workspace, button.dataset.claudeOverviewDetails)));
  };
  renderDeck();
}

async function renderClaudeOverview(workspace) {
  const [routes, status, activity, inventory] = await Promise.all([
    optional(() => api.claudeRoutes(), { routes: [], appliedRouteId: null, appliedRouteConfigSha256: null }),
    optional(() => api.claudeStatus(), null),
    optional(() => api.claudeActivity(10), { events: [] }),
    optional(() => api.claudeScan(), { mcps: [], plugins: [], statePresent: false, stateParseError: false, projectCount: 0 }),
  ]);
  workspace.innerHTML = claudeOverviewMarkup({ routes: routes.routes || [], appliedRouteId: routes.appliedRouteId, appliedRouteConfigSha256: routes.appliedRouteConfigSha256, status, activity: activity.events || [], inventory });
  wireClaudeRouteDeck(workspace, { ...routes, status, inventory });
}
