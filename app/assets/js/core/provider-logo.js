import { escapeHtml } from "./dialog.js";

const BRAND_ASSETS = Object.freeze({
  omniroute: "/assets/brands/omniroute.svg",
  litellm: "/assets/brands/litellm.png",
  "cli-proxy": "/assets/brands/cli-proxy.svg",
  "cli proxy": "/assets/brands/cli-proxy.svg",
  tokenrouter: "/assets/brands/tokenrouter.png",
  openrouter: "/assets/brands/openrouter.svg",
  openai: "/assets/brands/openai.svg",
});

const PALETTE = Object.freeze([
  ["#ff6d5d", "#f6574b"],
  ["#7b4bc1", "#6840bd"],
  ["#555acb", "#4449b5"],
  ["#45ad62", "#3c9a63"],
  ["#f0a53d", "#df922a"],
  ["#2e9e8f", "#26887b"],
  ["#e26a60", "#cf5a50"],
  ["#4a8fd3", "#3c7cba"],
]);

function hashSeed(value) {
  return [...String(value || "provider")].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function generatedGlyph(hash) {
  const motif = hash % 4;
  if (motif === 0) return '<circle cx="10" cy="10" r="4.1"/><circle cx="22" cy="22" r="4.1"/><path d="M12.9 12.9 19.1 19.1M22 6v6M16 6h6"/>';
  if (motif === 1) return '<path d="m16 3 4.8 2.8v5.5L16 14l-4.8-2.7V5.8zM16 14v7M11.2 11.3 6 14.3v5.4l4.8 2.8 4.8-2.8v-5.4z"/><path d="m20.8 11.3 4.2 2.4"/>';
  if (motif === 2) return '<path d="M16 3.8 19.6 10 26 13.5l-6.4 3.6-3.6 6.1-3.5-6.1-6.5-3.6 6.5-3.5z"/><circle cx="16" cy="13.5" r="2.3" fill="currentColor" stroke="none"/>';
  return '<path d="M5 16.5c0-6.2 4.8-11 11-11 3.3 0 6.1 1.2 8 3.5M27 15.5c0 6.2-4.8 11-11 11-3.3 0-6.1-1.2-8-3.5"/><circle cx="5" cy="16.5" r="2.2" fill="currentColor" stroke="none"/><circle cx="27" cy="15.5" r="2.2" fill="currentColor" stroke="none"/>';
}

export function providerLogoMark(name, { id = "", size = "md", className = "" } = {}) {
  const label = String(name || "Provider").trim() || "Provider";
  const seed = String(id || label).trim() || "provider";
  const classes = ["gen-logo", `gen-logo--${size}`, className].filter(Boolean).join(" ");
  const clean = `${label} ${seed}`.toLowerCase();
  const asset = Object.entries(BRAND_ASSETS).find(([key]) => clean.includes(key.toLowerCase()));
  if (asset) {
    return `<span class="${classes} gen-logo--img" data-provider-logo="${escapeHtml(seed)}" aria-hidden="true"><img src="${asset[1]}" alt=""></span>`;
  }
  const hash = hashSeed(seed);
  const [colorA, colorB] = PALETTE[hash % PALETTE.length];
  const rotation = ((hash >>> 8) % 4) * 90;
  return `<span class="${classes} gen-logo--generated" data-provider-logo="${escapeHtml(seed)}" style="--logo-a:${colorA};--logo-b:${colorB};--logo-rot:${rotation}deg" aria-hidden="true"><svg viewBox="0 0 32 32" role="presentation"><g transform="rotate(${rotation} 16 16)">${generatedGlyph(hash)}</g></svg></span>`;
}
