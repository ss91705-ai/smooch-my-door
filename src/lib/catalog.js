// 商品＋事件物件＋生活小物的統一查詢、尺寸與「掛／放／吸」的位置計算
import { PRODUCT_MAP, CATEGORY_LAYER, PRODUCTS } from '../config/products.js';
import { OBJECT_MAP, ALL_OBJECTS, ATTACH, TRAY_OBJECTS } from '../config/objects.js';
import { clamp, inRect, pxPerCm, sizeFrom } from './core.js';

export const ALL_ASSETS = [...PRODUCTS, ...ALL_OBJECTS];
export const TRAY_ITEMS = [...PRODUCTS, ...TRAY_OBJECTS];

// 依 id 取得定義（商品或物件）
export function defById(id) {
  const o = OBJECT_MAP[id];
  if (o) return { ...o, kind: 'object', category: 'object', layer: o.layer ?? 2 };
  const p = PRODUCT_MAP[id];
  return p && { ...p, kind: 'product', layer: CATEGORY_LAYER[p.category] ?? 1 };
}
export const defOf = (item) => defById(item.objectId || item.productId);

export function sizeOfDef(def, meta, cfg) {
  const preset =
    def.kind === 'object'
      ? { widthCm: def.widthCm, heightCm: def.heightCm, fit: 'contain', visualScale: 1 }
      : cfg.sizes[def.sizeKey];
  return sizeFrom(preset, meta[def.id], cfg);
}

// 門上所有物件加上尺寸、圖層，依繪製順序排序
// 依附在別的物件上時，圖層至少比依附對象高半層（例如掛鉤壓住便條紙時要在紙的前面）
export function computeSized(items, meta, cfg) {
  const list = items
    .map((it) => {
      const def = defOf(it);
      if (!def) return null;
      const s = sizeOfDef(def, meta, cfg);
      return { ...it, def, product: def, w: s.w, h: s.h, layer: def.layer };
    })
    .filter(Boolean);
  const byId = Object.fromEntries(list.map((i) => [i.id, i]));
  const eff = (i, depth = 0) => {
    const p = i.parentId && byId[i.parentId];
    if (!p || depth > 5) return i.def.layer;
    return Math.max(i.def.layer, eff(p, depth + 1) + 0.5);
  };
  for (const i of list) i.layer = eff(i) - (i.def.mount === 'shelf' ? (i.row || 0) * 0.1 : 0);
  return list.sort((a, b) => a.layer - b.layer || a.z - b.z);
}

// 掛鉤底座（磁鐵）在場景中的位置；x、y 為掛鉤中心
export function hookMagnetPoint(x, y, w, h) {
  return { x: x - w / 2 + w * ATTACH.hookMagnet.x, y: y - h / 2 + h * ATTACH.hookMagnet.y };
}

const top = (i) => i.y - i.h / 2;
const left = (i) => i.x - i.w / 2;
const childrenOf = (sized, id) => sized.filter((i) => i.parentId === id);

export function hangPoint(hook) {
  return { x: left(hook) + hook.w * ATTACH.hookHangPoint.x, y: top(hook) + hook.h * ATTACH.hookHangPoint.y };
}
// 掛在掛鉤上時的中心點（item 需要 def、h）
export function hangCenterOn(hook, item) {
  const p = hangPoint(hook);
  return { x: p.x, y: p.y - (item.def.hangY ?? 0.03) * item.h + item.h / 2 };
}
export function frontLineY(pocket) {
  return top(pocket) + pocket.h * (ATTACH.pocketFrontTop[pocket.def.sizeKey] ?? 0.3);
}
// 收納盒第 n 個位置的中心點
export function pocketSlot(pocket, item, n) {
  const cap = ATTACH.pocketCapacity;
  const span = Math.max(0, pocket.w - item.w - pocket.w * 0.16);
  const x = cap > 1 ? left(pocket) + pocket.w * 0.08 + item.w / 2 + (span * n) / (cap - 1) : pocket.x;
  const floor = top(pocket) + pocket.h * ATTACH.pocketFloor;
  return { x, y: floor - item.h / 2 };
}

// 物件（掛點）靠近哪個空的掛鉤？
export function findHookFor(sized, item, x, y, scale, cfg) {
  const ay = y - item.h / 2 + (item.def.hangY ?? 0.03) * item.h;
  const r = Math.max(5 * pxPerCm(cfg), 40 / scale);
  let best = null;
  let bd = Infinity;
  for (const h of sized) {
    if (h.def.category !== 'hook') continue;
    if (childrenOf(sized, h.id).some((c) => c.def.mount === 'hang' && c.id !== item.id)) continue;
    const p = hangPoint(h);
    const d = Math.hypot(p.x - x, p.y - ay);
    if (d < r && d < bd) {
      best = h;
      bd = d;
    }
  }
  return best;
}
export const freeHooks = (sized) =>
  sized.filter((h) => h.def.category === 'hook' && !childrenOf(sized, h.id).some((c) => c.def.mount === 'hang'));

const pocketFits = (p, item) => !item.def.fits || item.def.fits.includes(p.def.sizeKey);
const SIZE_NAME = { pocketS: 'S', pocketL: 'L' };
export const fitsLabel = (def) => (def.fits || []).map((k) => SIZE_NAME[k] || k).join('／');

function pocketInfo(sized, p, item) {
  if (!pocketFits(p, item)) return { pocket: p, full: true, wrong: true };
  const used = childrenOf(sized, p.id).filter((c) => c.def.mount === 'pocket' && c.id !== item.id);
  if (used.length >= ATTACH.pocketCapacity) return { pocket: p, full: true };
  return { pocket: p, slot: [0, 1].find((n) => !used.some((u) => u.slot === n)) ?? used.length };
}
export function findPocketFor(sized, item, x, y, scale) {
  const pad = 22 / scale;
  for (let i = sized.length - 1; i >= 0; i--) {
    const p = sized[i];
    if (p.def.category !== 'storage') continue;
    if (!inRect(x, y, { x: left(p), y: top(p) - item.h * 0.4, w: p.w, h: p.h + item.h * 0.4 }, pad)) continue;
    return pocketInfo(sized, p, item);
  }
  return null;
}
export const freePockets = (sized, item) =>
  sized
    .filter((p) => p.def.category === 'storage' && pocketFits(p, item))
    .map((p) => pocketInfo(sized, p, item))
    .filter((r) => !r.full);

// 小圓磁鐵放下的位置是否在紙類物件上
export function findPaperForMagnet(sized, x, y, scale) {
  const pad = 14 / scale;
  for (let i = sized.length - 1; i >= 0; i--) {
    const n = sized[i];
    if (n.def.mount !== 'magnet' || n.state !== 'placed') continue;
    if (inRect(x, y, { x: left(n), y: top(n), w: n.w, h: n.h }, pad)) return n;
  }
  return null;
}
// 舊名稱（事件判定沿用）
export const findNoteForMagnet = findPaperForMagnet;

// ── 磁吸鏡子下方的置物槽（物品橫放，可前後放兩排） ──
export function shelfRange(m, cfg) {
  const sh = ATTACH.mirrorShelf;
  const inner = Math.min(m.w * (1 - sh.inset * 2), sh.innerCm * pxPerCm(cfg));
  return { l: m.x - inner / 2, r: m.x + inner / 2, lip: top(m) + m.h * sh.lip, floor: top(m) + m.h * sh.floor };
}
const shelfItems = (sized, m, item) => childrenOf(sized, m.id).filter((c) => c.def.mount === 'shelf' && c.id !== item.id);

// 在某一排找最接近 x 的空位（不和同排物品重疊）
function freeX(intervals, l, r, w, x) {
  const fits = (cx) => cx - w / 2 >= l - 0.01 && cx + w / 2 <= r + 0.01 && intervals.every(([a, b]) => cx + w / 2 <= a + 0.01 || cx - w / 2 >= b - 0.01);
  const cands = [Math.min(Math.max(x, l + w / 2), r - w / 2), l + w / 2, r - w / 2];
  for (const [a, b] of intervals) cands.push(a - w / 2, b + w / 2);
  const ok = cands.filter(fits).sort((p, q) => Math.abs(p - x) - Math.abs(q - x));
  return ok.length ? ok[0] : null;
}
// 放在置物槽的位置；回傳 { x, y, row } 或 null（放滿了）。x 未指定時排在最左邊的空位
export function shelfSpot(sized, m, item, cfg, x) {
  const { l, r, floor } = shelfRange(m, cfg);
  const step = ATTACH.mirrorShelf.rowStepCm * pxPerCm(cfg);
  const used = shelfItems(sized, m, item);
  const want = x ?? l;
  for (let row = 0; row < ATTACH.mirrorShelf.rows; row++) {
    const iv = used.filter((c) => (c.row || 0) === row).map((c) => [c.x - c.w / 2, c.x + c.w / 2]);
    const cx = freeX(iv, l, r, item.w, want);
    if (cx != null) return { x: cx, y: floor - row * step - item.h / 2, row };
  }
  return null;
}
function shelfInfo(sized, m, item, cfg) {
  return { mirror: m, full: !shelfSpot(sized, m, item, cfg) };
}
export function findShelfFor(sized, item, x, y, scale, cfg) {
  const pad = 20 / scale;
  for (let i = sized.length - 1; i >= 0; i--) {
    const m = sized[i];
    if (m.def.category !== 'mirror') continue;
    const zone = { x: left(m), y: top(m) + m.h * 0.6, w: m.w, h: m.h * 0.4 + item.h };
    if (!inRect(x, y, zone, pad)) continue;
    const info = shelfInfo(sized, m, item, cfg);
    if (!info.full) info.spot = shelfSpot(sized, m, item, cfg, x);
    return info;
  }
  return null;
}
export const freeShelves = (sized, item, cfg) =>
  sized.filter((m) => m.def.category === 'mirror').map((m) => shelfInfo(sized, m, item, cfg)).filter((r) => !r.full);
