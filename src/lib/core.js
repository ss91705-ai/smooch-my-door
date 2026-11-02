import { SCENE } from '../config/scene.js';
import { SIZE_PRESETS } from '../config/products.js';
import { STORAGE_KEYS } from '../config/app.js';
import OVERRIDES from '../config/overrides.json';

// ── 靜態資源路徑（支援 GitHub Pages 子路徑） ──
export const assetUrl = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '');

// ── localStorage（包 try/catch，私密模式也不會壞） ──
export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
export function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ── 設定合併：預設 ← overrides.json ← 開發模式暫存 ──
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
export function deepMerge(base, extra) {
  if (!isObj(extra)) return base;
  const out = { ...base };
  for (const k of Object.keys(extra)) {
    out[k] = isObj(base[k]) && isObj(extra[k]) ? deepMerge(base[k], extra[k]) : extra[k];
  }
  return out;
}
export const DEFAULT_CONFIG = deepMerge({ scene: SCENE, sizes: SIZE_PRESETS }, OVERRIDES);
export const loadConfig = () => deepMerge(DEFAULT_CONFIG, loadJSON(STORAGE_KEYS.devConfig, {}));

// ── 幾何 ──
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const rectOf = (x, y, w, h) => ({ x: x - w / 2, y: y - h / 2, w, h });
export const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const inRect = (px, py, r, pad = 0) =>
  px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad;

function clampInto(x, y, w, h, z) {
  return {
    x: w >= z.w ? z.x + z.w / 2 : clamp(x, z.x + w / 2, z.x + z.w - w / 2),
    y: h >= z.h ? z.y + z.h / 2 : clamp(y, z.y + h / 2, z.y + z.h - h / 2),
  };
}
const fits = (p, w, h, z) =>
  p.x - w / 2 >= z.x - 0.01 && p.x + w / 2 <= z.x + z.w + 0.01 && p.y - h / 2 >= z.y - 0.01 && p.y + h / 2 <= z.y + z.h + 0.01;

/**
 * 找出最接近 (x,y) 的合法位置：完全在門板內、且不碰到禁放區。
 * 找不到時回傳 null。
 */
export function resolvePlacement(x, y, w, h, zone, forbidden) {
  const blocks = forbidden.filter((f) => f.enabled !== false);
  const start = clampInto(x, y, w, h, zone);
  const ok = (p) => fits(p, w, h, zone) && !blocks.some((f) => overlap(rectOf(p.x, p.y, w, h), f));
  if (ok(start)) return start;
  let frontier = [start];
  const valid = [];
  for (let depth = 0; depth < 3 && frontier.length; depth++) {
    const next = [];
    for (const p of frontier) {
      const r = rectOf(p.x, p.y, w, h);
      for (const f of blocks) {
        if (!overlap(r, f)) continue;
        const cands = [
          { x: f.x - w / 2 - 0.5, y: p.y },
          { x: f.x + f.w + w / 2 + 0.5, y: p.y },
          { x: p.x, y: f.y - h / 2 - 0.5 },
          { x: p.x, y: f.y + f.h + h / 2 + 0.5 },
        ];
        for (const c of cands) {
          if (!fits(c, w, h, zone)) continue;
          (ok(c) ? valid : next).push(c);
        }
      }
    }
    frontier = next;
  }
  if (!valid.length) return null;
  valid.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
  return valid[0];
}

// ── 真實尺寸 → 場景像素（寬高共用同一個縮放倍率） ──
export function pxPerCm(cfg) {
  return cfg.scene.doorLeaf.w / cfg.scene.doorRealWidthCm;
}
// preset = { widthCm, heightCm, fit, visualScale }
export function sizeFrom(preset, meta, cfg) {
  const aspect = meta?.aspect || 1; // 寬 / 高（已排除透明留白）
  const k = pxPerCm(cfg) * (preset.visualScale || 1);
  let wCm;
  let hCm;
  if (preset.fit === 'height') {
    hCm = preset.heightCm;
    wCm = hCm * aspect;
  } else if (preset.fit === 'width') {
    wCm = preset.widthCm;
    hCm = wCm / aspect;
  } else {
    wCm = preset.widthCm;
    hCm = wCm / aspect;
    if (hCm > preset.heightCm) {
      hCm = preset.heightCm;
      wCm = hCm * aspect;
    }
  }
  return { w: wCm * k, h: hCm * k, wCm, hCm };
}
export function productSize(product, meta, cfg) {
  return sizeFrom(cfg.sizes[product.sizeKey], meta, cfg);
}

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

