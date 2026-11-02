// ─────────────────────────────────────────────────────────────
// 第三階段：隱藏彩蛋（解鎖前條件不公開，收藏頁只顯示問號）
// 判定只計算門上的 POINTITI 商品，不含包包、遙控器、便條紙。
// ─────────────────────────────────────────────────────────────

export const EGG_SETTINGS = {
  monoCount: 3, // 單色控：同色商品至少幾件
  rainbowCount: 3, // 彩虹收藏家：不同顏色小圓磁鐵至少幾顆
  butterCount: 3, // 奶油色小鴨：Butter 商品至少幾件（且門上沒有其他顏色）
  duck: { x: 50, y: 962, widthCm: 13 }, // 小鴨坐在玄關櫃上（場景座標）
  garland: { x: 168, y: 196, w: 606, sag: 34 }, // 神秘裝飾：門框上方的串燈
};

export const EGGS = [
  { id: 'mono', no: '01', title: '單色控！', icon: '🎨', desc: '門上有 3 件同色的 POINTITI 配件' },
  { id: 'rainbow', no: '02', title: '彩虹收藏家', icon: '🌈', desc: '門上有 3 顆不同顏色的小圓磁鐵' },
  { id: 'organizer', no: '03', title: '玄關整理大師！', icon: '🧺', desc: '掛鉤、鏡子、收納盒同時在門上' },
  { id: 'butterDuck', no: '04', title: '奶油色小鴨', icon: '🐤', desc: '門上全是 Butter 配色，而且至少 3 件' },
  { id: 'perfect', no: '05', title: '完美玄關！', icon: '✨', desc: '掛鉤、鏡子、小圓磁鐵、收納盒全部到齊' },
];
export const EGG_MAP = Object.fromEntries(EGGS.map((e) => [e.id, e]));
