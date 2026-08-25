import { escapeHtml } from "../core/dialog.js";

const FALLBACK_LEVELS = {
  opencode: ["default", "minimal", "high", "max"],
  openai: ["none", "low", "medium", "high", "xhigh"],
  claude: ["low", "high", "max"],
  gemini: ["minimal", "low", "medium", "high"],
  none: [],
};

const DEFAULT_FORMATS = [
  { id: "opencode", label: "OpenCode" },
  { id: "openai", label: "OpenAI / ChatGPT" },
  { id: "claude", label: "Claude" },
  { id: "gemini", label: "Gemini" },
  { id: "none", label: "No reasoning" },
];

export function reasoningFormats(formats = []) {
  const configured = new Map((formats || []).map(format => [String(format.id || "").toLowerCase(), format]));
  return DEFAULT_FORMATS.map(fallback => ({ ...fallback, ...(configured.get(fallback.id) || {}) }));
}

export function levelsForProvider(provider, formats = []) {
  const formatId = String(provider?.reasoningFormat || "opencode").toLowerCase();
  const configured = formats.find(format => String(format.id || format.name || "").toLowerCase() === formatId);
  const levels = configured?.levels || configured?.thinking || configured?.options;
  return [...new Set(Array.isArray(levels) && levels.length ? levels : (FALLBACK_LEVELS[formatId] || FALLBACK_LEVELS.opencode))];
}

export function thinkingLevelMarkup(formatId, formats = []) {
  const levels = levelsForProvider({ reasoningFormat: formatId }, formats);
  if (!levels.length) return `<span class="model-editor-no-levels">No reasoning choices for this format.</span>`;
  return levels.map(level => `<label><input type="checkbox" data-reasoning-level="${escapeHtml(level)}" value="${escapeHtml(level)}"><span>${escapeHtml(level)}</span></label>`).join("");
}

function cleanModel(model, allowedLevels) {
  const allowed = new Set(allowedLevels || []);
  const cleaned = {
    model: String(model?.model || "").trim(),
    name: String(model?.name || "").trim(),
    apiModelId: String(model?.apiModelId || "").trim(),
    thinking: [...new Set(model?.thinking || [])].filter(level => allowed.has(level)),
  };
  const reasoningFormat = String(model?.reasoningFormat || "").trim();
  if (reasoningFormat) cleaned.reasoningFormat = reasoningFormat;
  return cleaned;
}

export function normalizeModelBatch(existingModels, candidates, allowedLevels = FALLBACK_LEVELS.opencode) {
  const allowed = new Set(allowedLevels || []);
  const existing = (existingModels || []).map(model => ({
    model: String(model?.model || "").trim(),
    name: String(model?.name || "").trim(),
    apiModelId: String(model?.apiModelId || "").trim(),
    ...(String(model?.reasoningFormat || "").trim() ? { reasoningFormat: String(model.reasoningFormat).trim() } : {}),
    thinking: [...new Set(model?.thinking || [])],
  }));
  const map = new Map(existing.map(model => [model.model.toLowerCase(), model]));
  const changed = new Set();

  for (const candidate of candidates || []) {
    const model = cleanModel(candidate, allowedLevels);
    if (!model.model && !model.name) continue;
    if (!model.model) throw new Error("Each model needs an ID.");
    const key = model.model.toLowerCase();
    map.set(key, model);
    changed.add(key);
  }
  const models = [...map.values()];
  if (!models.length) throw new Error("Add at least one model ID.");
  return { added: models.filter(model => changed.has(model.model.toLowerCase())), models };
}

export function updateModelReasoning(models, modelId, thinking, reasoningFormat) {
  return (models || []).map(model => model.model === modelId
    ? { ...model, thinking: [...new Set(thinking || [])], reasoningFormat }
    : model);
}

export function modelEditorRowMarkup(index, formats = [], selectedFormat = "opencode") {
  const number = String(index + 1).padStart(2, "0");
  const formatOptions = reasoningFormats(formats);
  const reasoning = `<div class="model-editor-reasoning"><div><strong>Reasoning format</strong><small>Uses the provider format</small></div><div class="model-editor-levels model-editor-format-choices">${formatOptions.map(format => `<label><input type="radio" name="model-format-${index}" data-reasoning-format="${escapeHtml(format.id)}" value="${escapeHtml(format.id)}" ${format.id === selectedFormat ? "checked" : ""}><span>${escapeHtml(format.label)}</span></label>`).join("")}</div></div>
    <div class="model-editor-reasoning"><div><strong>Reasoning choices</strong><small>Select any this model supports</small></div><div class="model-editor-levels model-editor-thinking-choices">${thinkingLevelMarkup(selectedFormat, formats)}</div></div>`;
  return `<fieldset class="model-editor-row" data-model-row>
    <legend>Model ${number}</legend>
    <div class="model-editor-fields">
      <label><span>ID</span><input class="settings-model-id" placeholder="model-id" autocomplete="off"></label>
      <label><span>Name</span><input class="settings-model-name" placeholder="Display Name" autocomplete="off"></label>
      <label><span>API model ID <em>(optional)</em></span><input class="settings-model-api-id" placeholder="Exact ID sent to the gateway" autocomplete="off"></label>
      <button class="model-editor-remove" type="button" data-remove-model aria-label="Remove model ${index + 1}">×</button>
    </div>
    <div class="model-editor-row-tools">
      <button class="button settings-outline-button model-editor-test" type="button" data-test-model>Test model</button>
      <span class="model-editor-test-result" data-test-result role="status" aria-live="polite"></span>
    </div>
    ${reasoning}
  </fieldset>`;
}

export function modelEditorMarkup(provider, formats = []) {
  const selectedFormat = provider.reasoningFormat || "opencode";
  return `<form id="settingsModelForm" class="model-editor-form">
    <div class="model-editor-context">
      <span>Adding models to <strong>${escapeHtml(provider.name)}</strong></span>
      <code>${escapeHtml(provider.id)}-models.json</code>
    </div>
    <div id="modelEditorRows" data-next-index="1">${modelEditorRowMarkup(0, formats, selectedFormat)}</div>
    <button class="button settings-outline-button model-editor-add" type="button" data-add-model-row>＋ Add another model</button>
    <p id="newModelMessage" class="field-error" role="alert"></p>
  </form>`;
}
