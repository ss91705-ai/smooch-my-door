// ─────────────────────────────────────────────────────────────
// POINTITI 商品資料（集中管理）
// 圖片一律使用 public/assets/products/ 內的真實商品 PNG。
// 新增商品：把 PNG 放進對應資料夾，然後在 PRODUCTS 加一筆即可。
// 透明留白會在遊戲載入時自動偵測並排除，不計入商品尺寸。
// ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: 'hook', label: '掛鉤' },
  { id: 'mirror', label: '鏡子' },
  { id: 'magnet', label: '小圓磁鐵' },
  { id: 'storage', label: '收納盒' },
  { id: 'deco', label: '生活小物' },
];

// 實際尺寸（cm）
// fit：圖片如何對應實際尺寸（一律等比縮放，不會分別拉伸寬高）
//   'width'   → 以實際寬度換算，高度依圖片比例
//   'height'  → 以實際高度換算，寬度依圖片比例
//   'contain' → 放進「寬 × 高」框內，不超出任一邊
// visualScale：拍攝透視的視覺微調（1 = 不調整）
export const SIZE_PRESETS = {
  hook: {
    label: '磁吸掛鉤',
    widthCm: 5,
    heightCm: 11,
    fit: 'height',
    visualScale: 1,
    // 官網規格 W50 × D70 × H110 mm；照片是斜角拍攝，畫面寬度含深度 7 cm，所以用高度 11 cm 換算
  },
  mirror: { label: '磁吸鏡子', widthCm: 20, heightCm: 22, fit: 'contain', visualScale: 1 },
  magnet: { label: '小圓磁鐵 Ø13', widthCm: 1.3, heightCm: 1.3, fit: 'contain', visualScale: 1 },
  magnet18: { label: '小圓磁鐵 Ø18（SPRING）', widthCm: 1.8, heightCm: 1.8, fit: 'contain', visualScale: 1 },
  pocketS: { label: '磁吸收納盒 S', widthCm: 8.8, heightCm: 9.5, fit: 'width', visualScale: 1 },
  pocketL: { label: '磁吸收納盒 L', widthCm: 15.4, heightCm: 7.5, fit: 'width', visualScale: 1 },
};

// 配色（名稱依 POINTITI 官網 ColorDrop 系列；status 'pending' = 待確認）
export const COLORS = {
  butter: { label: 'Butter', zh: '奶油' },
  mint: { label: 'Mint', zh: '薄荷' },
  brown: { label: 'Brown', zh: '可可' },
  skyblue: { label: 'Sky Blue', zh: '天空藍' },
  yellow: { label: 'Yellow', zh: '黃' },
  green: { label: 'Green', zh: '綠' },
  red: { label: 'Red', zh: '紅' },
  blue: { label: 'Blue', zh: '藍' },
  lightgreen: { label: 'Light Green', zh: '淺綠' },
  lemonwhite: { label: 'Lemon White', zh: '檸檬白' },
  pink: { label: 'Pink', zh: '粉紅' },
  violet: { label: 'Violet', zh: '紫' },
  orange: { label: 'Orange', zh: '橘' },
};

// 小圓磁鐵是 4–5 色一組販售；遊戲中逐顆放置，選單依組別分段顯示
export const GROUPS = {
  latte: { label: 'LATTE', note: 'Ø13' },
  spring: { label: 'SPRING', note: 'Ø18' },
  mellow: { label: 'MELLOW', note: 'Ø13' },
  origin: { label: 'ORIGIN', note: 'Ø13' },
};

const P = 'assets/products/';

export const PRODUCTS = [
  // A. 磁吸掛鉤（ColorDrop MagnetHook）
  { id: 'hook-butter', category: 'hook', sizeKey: 'hook', colorId: 'butter', name: '掛鉤', img: P + 'hooks/hook-butter.png' },
  { id: 'hook-mint', category: 'hook', sizeKey: 'hook', colorId: 'mint', name: '掛鉤', img: P + 'hooks/hook-mint.png' },
  { id: 'hook-brown', category: 'hook', sizeKey: 'hook', colorId: 'brown', name: '掛鉤', img: P + 'hooks/hook-brown.png' },
  { id: 'hook-skyblue', category: 'hook', sizeKey: 'hook', colorId: 'skyblue', name: '掛鉤', img: P + 'hooks/hook-skyblue.png' },
  { id: 'hook-yellow', category: 'hook', sizeKey: 'hook', colorId: 'yellow', name: '掛鉤', img: P + 'hooks/hook-yellow.png' },
  { id: 'hook-green', category: 'hook', sizeKey: 'hook', colorId: 'green', name: '掛鉤', img: P + 'hooks/hook-green.png' },
  { id: 'hook-blue', category: 'hook', sizeKey: 'hook', colorId: 'blue', name: '掛鉤', img: P + 'hooks/hook-blue.png' },

  // B. 磁吸鏡子（A = 拱形、B = U 形；所有款式實際尺寸相同）
  { id: 'mirror-a-butter', category: 'mirror', sizeKey: 'mirror', colorId: 'butter', name: '鏡子 A', img: P + 'mirrors/mirror-a-butter.png' },
  { id: 'mirror-a-mint', category: 'mirror', sizeKey: 'mirror', colorId: 'mint', name: '鏡子 A', img: P + 'mirrors/mirror-a-mint.png' },
  { id: 'mirror-b-brown', category: 'mirror', sizeKey: 'mirror', colorId: 'brown', name: '鏡子 B', img: P + 'mirrors/mirror-b-brown.png' },
  { id: 'mirror-b-red', category: 'mirror', sizeKey: 'mirror', colorId: 'red', name: '鏡子 B', img: P + 'mirrors/mirror-b-red.png' },

  // C. 小圓磁鐵（ORIGIN／LATTE／MELLOW Ø13 × 5 色、SPRING Ø18 × 4 色）
  { id: 'magnet-origin-orange', category: 'magnet', group: 'origin', sizeKey: 'magnet', colorId: 'orange', name: 'ORIGIN', img: P + 'magnets/magnet-origin-orange.png' },
  { id: 'magnet-origin-pink', category: 'magnet', group: 'origin', sizeKey: 'magnet', colorId: 'pink', name: 'ORIGIN', img: P + 'magnets/magnet-origin-pink.png' },
  { id: 'magnet-origin-yellow', category: 'magnet', group: 'origin', sizeKey: 'magnet', colorId: 'yellow', name: 'ORIGIN', img: P + 'magnets/magnet-origin-yellow.png' },
  { id: 'magnet-origin-green', category: 'magnet', group: 'origin', sizeKey: 'magnet', colorId: 'green', name: 'ORIGIN', img: P + 'magnets/magnet-origin-green.png' },
  { id: 'magnet-origin-blue', category: 'magnet', group: 'origin', sizeKey: 'magnet', colorId: 'blue', name: 'ORIGIN', img: P + 'magnets/magnet-origin-blue.png' },
  { id: 'magnet-latte-butter', category: 'magnet', group: 'latte', sizeKey: 'magnet', colorId: 'butter', name: 'LATTE', img: P + 'magnets/magnet-latte-butter.png' },
  { id: 'magnet-latte-mint', category: 'magnet', group: 'latte', sizeKey: 'magnet', colorId: 'mint', name: 'LATTE', img: P + 'magnets/magnet-latte-mint.png' },
  { id: 'magnet-latte-blue', category: 'magnet', group: 'latte', sizeKey: 'magnet', colorId: 'blue', name: 'LATTE', img: P + 'magnets/magnet-latte-blue.png' },
  { id: 'magnet-latte-red', category: 'magnet', group: 'latte', sizeKey: 'magnet', colorId: 'red', name: 'LATTE', img: P + 'magnets/magnet-latte-red.png' },
  { id: 'magnet-latte-brown', category: 'magnet', group: 'latte', sizeKey: 'magnet', colorId: 'brown', name: 'LATTE', img: P + 'magnets/magnet-latte-brown.png' },
  { id: 'magnet-mellow-lemonwhite', category: 'magnet', group: 'mellow', sizeKey: 'magnet', colorId: 'lemonwhite', name: 'MELLOW', img: P + 'magnets/magnet-mellow-lemonwhite.png' },
  { id: 'magnet-mellow-mint', category: 'magnet', group: 'mellow', sizeKey: 'magnet', colorId: 'mint', name: 'MELLOW', img: P + 'magnets/magnet-mellow-mint.png' },
  { id: 'magnet-mellow-skyblue', category: 'magnet', group: 'mellow', sizeKey: 'magnet', colorId: 'skyblue', name: 'MELLOW', img: P + 'magnets/magnet-mellow-skyblue.png' },
  { id: 'magnet-mellow-pink', category: 'magnet', group: 'mellow', sizeKey: 'magnet', colorId: 'pink', name: 'MELLOW', img: P + 'magnets/magnet-mellow-pink.png' },
  { id: 'magnet-mellow-violet', category: 'magnet', group: 'mellow', sizeKey: 'magnet', colorId: 'violet', name: 'MELLOW', img: P + 'magnets/magnet-mellow-violet.png' },
  { id: 'magnet-spring-butter', category: 'magnet', group: 'spring', sizeKey: 'magnet18', colorId: 'butter', name: 'SPRING', img: P + 'magnets/magnet-spring-butter.png' },
  { id: 'magnet-spring-lightgreen', category: 'magnet', group: 'spring', sizeKey: 'magnet18', colorId: 'lightgreen', name: 'SPRING', img: P + 'magnets/magnet-spring-lightgreen.png' },
  { id: 'magnet-spring-skyblue', category: 'magnet', group: 'spring', sizeKey: 'magnet18', colorId: 'skyblue', name: 'SPRING', img: P + 'magnets/magnet-spring-skyblue.png' },
  { id: 'magnet-spring-brown', category: 'magnet', group: 'spring', sizeKey: 'magnet18', colorId: 'brown', name: 'SPRING', img: P + 'magnets/magnet-spring-brown.png' },

  // D. 磁吸收納盒（ColorDrop Magnet Pocket）
  { id: 'pocket-s-mint', category: 'storage', sizeKey: 'pocketS', colorId: 'mint', name: '收納盒 S', img: P + 'storage/pocket-s-mint.png' },
  { id: 'pocket-s-brown', category: 'storage', sizeKey: 'pocketS', colorId: 'brown', name: '收納盒 S', img: P + 'storage/pocket-s-brown.png' },
  { id: 'pocket-l-butter', category: 'storage', sizeKey: 'pocketL', colorId: 'butter', name: '收納盒 L', img: P + 'storage/pocket-l-butter.png' },
  { id: 'pocket-l-skyblue', category: 'storage', sizeKey: 'pocketL', colorId: 'skyblue', name: '收納盒 L', img: P + 'storage/pocket-l-skyblue.png' },
];

export const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

// 圖層：小圓磁鐵永遠在最前面（之後的便條紙位於 1 和 3 之間）
export const CATEGORY_LAYER = { hook: 1, mirror: 1, storage: 1, magnet: 3 };
