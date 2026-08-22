export const ACTIVITY_RANGE_STORAGE_KEY = "ai-switcher-activity-range";
export const DEFAULT_ACTIVITY_RANGE = 7;
export const ACTIVITY_RANGE_OPTIONS = Object.freeze([
  { value: 1, label: "Last 24 hours" },
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 0, label: "All time" },
]);

const DAY_MS = 86400000;
const VALID_RANGES = new Set(ACTIVITY_RANGE_OPTIONS.map(option => option.value));

export function normalizeActivityRange(value, fallback = DEFAULT_ACTIVITY_RANGE) {
  const numeric = Number(value);
  return VALID_RANGES.has(numeric) ? numeric : fallback;
}

function storageTarget(storage) {
  if (storage !== undefined) return storage;
  try { return globalThis.localStorage; } catch { return null; }
}

export function readActivityRange(storage) {
  const target = storageTarget(storage);
  try { return normalizeActivityRange(target?.getItem(ACTIVITY_RANGE_STORAGE_KEY)); } catch { return DEFAULT_ACTIVITY_RANGE; }
}

export function writeActivityRange(value, storage) {
  const range = normalizeActivityRange(value);
  const target = storageTarget(storage);
  try { target?.setItem(ACTIVITY_RANGE_STORAGE_KEY, String(range)); } catch { /* private mode */ }
  return range;
}

export function activityRangeLabel(value) {
  return ACTIVITY_RANGE_OPTIONS.find(option => option.value === normalizeActivityRange(value))?.label || "Last 7 days";
}

export function activityRangeOptions(selected) {
  const value = normalizeActivityRange(selected);
  return ACTIVITY_RANGE_OPTIONS.map(option => `<option value="${option.value}" ${option.value === value ? "selected" : ""}>${option.label}</option>`).join("");
}

export function activityRangeWindow(events, value, now = Date.now()) {
  const end = Number.isFinite(now) ? now : Date.now();
  if (normalizeActivityRange(value) > 0) {
    return { start: end - normalizeActivityRange(value) * DAY_MS, end };
  }
  const timestamps = (Array.isArray(events) ? events : [])
    .map(event => new Date(event?.timestamp).getTime())
    .filter(Number.isFinite);
  let start = timestamps.length ? Math.min(...timestamps) : end - DAY_MS;
  if (!Number.isFinite(start) || start >= end) start = end - DAY_MS;
  return { start, end };
}