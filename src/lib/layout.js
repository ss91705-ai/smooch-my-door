// 門上佈置的資料結構與 reducer
// item = {
//   id, productId, category, colorId,
//   x, y,            // 中心點（場景像素座標，與背景共用）
//   z,               // 同圖層內的前後順序
//   sizeCm: {w,h},   // 放置時的實際顯示尺寸紀錄
//   parentId,        // 附屬於哪個商品（掛鉤上的包包、收納盒內的遙控器…第二階段使用）
//   createdAt,
// }
import { STORAGE_KEYS } from '../config/app.js';
import { loadJSON, saveJSON } from './core.js';
import { PRODUCT_MAP } from '../config/products.js';
import { OBJECT_MAP } from '../config/objects.js';

// 舊版商品 id → 新 id（第一版的兩顆磁鐵其實是 SPRING 組）
const RENAMED = { 'magnet-cream': 'magnet-spring-butter', 'magnet-lightblue': 'magnet-spring-skyblue' };

export const emptyLayout = () => ({ version: 1, z: 1, items: [] });

export function loadLayout() {
  const saved = loadJSON(STORAGE_KEYS.layout, null);
  if (!saved || saved.version !== 1 || !Array.isArray(saved.items)) return emptyLayout();
  // 移除已不存在的商品
  const items = saved.items
    .map((i) => (RENAMED[i.productId] ? { ...i, productId: RENAMED[i.productId], colorId: PRODUCT_MAP[RENAMED[i.productId]].colorId } : i))
    .filter((i) => PRODUCT_MAP[i.productId] || OBJECT_MAP[i.objectId])
    // 事件進行到一半就離開：還沒放好的事件物件不保留
    .filter((i) => !(i.objectId && i.state === 'loose'));
  return { ...saved, items: cleanup(items) };
}

// 移除失去依附對象的物件、沒有磁鐵固定的便條紙
export function cleanup(items) {
  let list = items;
  for (let pass = 0; pass < 3; pass++) {
    const ids = new Set(list.map((i) => i.id));
    list = list.filter((i) => !i.parentId || ids.has(i.parentId));
    list = list.filter(
      (i) =>
        !(
          OBJECT_MAP[i.objectId]?.mount === 'magnet' &&
          !list.some((m) => m.parentId === i.id && (m.category === 'magnet' || m.category === 'hook'))
        ),
    );
  }
  return list;
}
// 套用預設範本：換成新的 id，標記 tpl（範本配件不計入隱藏彩蛋）
export function layoutFromTemplate(t) {
  const stamp = Date.now().toString(36);
  const nid = (id) => `${id}-${stamp}`;
  const items = t.items.map((it, n) => ({
    ...it,
    id: nid(it.id),
    parentId: it.parentId ? nid(it.parentId) : null,
    z: n + 1,
    tpl: true,
    createdAt: Date.now(),
  }));
  return { version: 1, z: items.length + 1, items: cleanup(items) };
}
export const saveLayout = (layout) => saveJSON(STORAGE_KEYS.layout, layout);

// 某物件的所有子孫（掛鉤上的包包、壓在便條紙上的掛鉤上的包包…）
function descendants(items, id) {
  const out = new Set();
  let grew = true;
  while (grew) {
    grew = false;
    for (const i of items) if (i.parentId && (i.parentId === id || out.has(i.parentId)) && !out.has(i.id)) out.add(i.id), (grew = true);
  }
  return out;
}

export function layoutReducer(state, a) {
  switch (a.type) {
    case 'add': {
      const z = state.z + 1;
      return { ...state, z, items: [...state.items, { parentId: null, ...a.item, z }] };
    }
    case 'move': {
      const it = state.items.find((i) => i.id === a.id);
      if (!it) return state;
      const dx = a.x - it.x;
      const dy = a.y - it.y;
      const kids = descendants(state.items, a.id);
      // 附屬物件跟著一起移動
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === a.id ? { ...i, x: a.x, y: a.y } : kids.has(i.id) ? { ...i, x: i.x + dx, y: i.y + dy } : i,
        ),
      };
    }
    case 'place': {
      // 移動（附屬物件跟著移動）並更新欄位，例如 parentId、state、slot
      const it = state.items.find((i) => i.id === a.id);
      if (!it) return state;
      const dx = a.x - it.x;
      const dy = a.y - it.y;
      const kids = descendants(state.items, a.id);
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === a.id ? { ...i, ...a.patch, x: a.x, y: a.y } : kids.has(i.id) ? { ...i, x: i.x + dx, y: i.y + dy } : i,
        ),
      };
    }
    case 'removeMany': {
      const ids = new Set(a.ids);
      return { ...state, items: state.items.filter((i) => !ids.has(i.id) && !ids.has(i.parentId)) };
    }
    case 'front': {
      const z = state.z + 1;
      return { ...state, z, items: state.items.map((i) => (i.id === a.id ? { ...i, z } : i)) };
    }
    case 'remove': {
      const gone = new Set([a.id]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const i of state.items) if (i.parentId && gone.has(i.parentId) && !gone.has(i.id)) gone.add(i.id), (grew = true);
      }
      return { ...state, items: state.items.filter((i) => !gone.has(i.id)) };
    }
    case 'reset':
      return { ...state, items: [] };
    case 'load':
      return a.layout;
    default:
      return state;
  }
}
