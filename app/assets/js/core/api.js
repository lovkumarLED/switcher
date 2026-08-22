const jsonHeaders = { "Content-Type": "application/json" };

async function request(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { ...(options.body ? jsonHeaders : {}), ...(options.headers || {}) } });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) {
    const detail = data.detail || data.error || data.message || "The request could not be completed.";
    throw new Error(typeof detail === "string" ? detail : detail.message || "The request could not be completed.");
  }
  return data;
}

const send = (method, body) => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  status: () => request("/api/status"),
  capabilities: () => request("/api/capabilities"),
  claudeStatus: () => request("/api/claude/status"),
  claudeDiscover: () => request("/api/claude/discover"),
  claudeScan: () => request("/api/claude/scan"),
  claudeConnect: () => request("/api/claude/connect", send("POST", {})),
  claudeRoutes: () => request("/api/claude/routes"),
  createClaudeRoute: body => request("/api/claude/routes", send("POST", body)),
  updateClaudeRoute: (id, body) => request(`/api/claude/routes/${encodeURIComponent(id)}`, send("PUT", body)),
  deleteClaudeRoute: (id, body) => request(`/api/claude/routes/${encodeURIComponent(id)}`, send("DELETE", body)),
  applyClaudeRoute: (id, body) => request(`/api/claude/routes/${encodeURIComponent(id)}/apply`, send("POST", body)),
  restoreClaude: body => request("/api/claude/restore", send("POST", body)),
  claudeActivity: (limit = 100) => request(`/api/claude/activity?limit=${encodeURIComponent(limit)}`),
claudeCredentials: () => request("/api/claude/credentials"),
deleteClaudeCredential: name => request(`/api/claude/credentials/${encodeURIComponent(name)}`, send("DELETE", {})),
  discover: body => request("/api/discover", send("POST", body || {})),
  scan: body => request("/api/scan", send("POST", body)),
  scaffold: body => request("/api/scaffold", send("POST", body)),
  verifySetup: () => request("/api/setup/verify", send("POST", {})),
  revertSetup: () => request("/api/setup/revert", send("POST", {})),
  formats: () => request("/api/formats"),
  providers: () => request("/api/providers"),
  createProvider: body => request("/api/providers", send("POST", body)),
  updateProvider: (id, body) => request(`/api/providers/${encodeURIComponent(id)}`, send("PUT", body)),
  deleteProvider: id => request(`/api/providers/${encodeURIComponent(id)}`, { method: "DELETE" }),
  switchProvider: id => request("/api/switch", send("POST", { id })),
  activateProvider: id => request(`/api/providers/${encodeURIComponent(id)}/activate`, { method: "POST" }),
  deactivateProvider: id => request(`/api/providers/${encodeURIComponent(id)}/deactivate`, { method: "POST" }),
  deleteModel: (providerId, modelId) => request(`/api/providers/${encodeURIComponent(providerId)}/models/delete`, send("POST", { model: modelId })),
  testProvider: body => request("/api/test", send("POST", body)),
  testModel: (id, body) => request(`/api/providers/${encodeURIComponent(id)}/models/test`, send("POST", body)),
  build: (profile = null) => request("/api/build", send("POST", { profile })),
  plugins: () => request("/api/plugins"),
  addPlugin: plugin => request("/api/plugins", send("POST", { plugin })),
  removePlugin: plugin => request("/api/plugins", send("DELETE", { plugin })),
  mcp: () => request("/api/mcp"),
  addMcp: (name, config) => request("/api/mcp", send("POST", { name, config })),
  removeMcp: name => request("/api/mcp", send("DELETE", { name })),
  lsp: () => request("/api/lsp"),
  setLsp: (lsp, enabled) => request("/api/lsp", send("PUT", { lsp, enabled })),
  agents: () => request("/api/agents"),
  addAgent: body => request("/api/agents", send("POST", body)),
  removeAgent: name => request(`/api/agents/${encodeURIComponent(name)}`, { method: "DELETE" }),
  switchAgent: name => request("/api/agents/switch", send("POST", { name })),
  activity: (days = 30, limit = 100) => request(`/api/activity?days=${encodeURIComponent(days)}&limit=${encodeURIComponent(limit)}`),
  activitySummary: (days = 30) => request(`/api/activity/summary?days=${encodeURIComponent(days)}`),
  preferences: () => request("/api/preferences"),
  updatePreferences: body => request("/api/preferences", send("PUT", body)),
  rules: () => request("/api/rules"),
  profiles: () => request("/api/profiles"),
  switchProfile: profile => request("/api/profiles/switch", send("POST", { profile })),
};

export async function optional(call, fallback) {
  try { return await call(); } catch { return fallback; }
}
