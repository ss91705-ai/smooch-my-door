// ─────────────────────────────────────────────────────────────
// 事件用的互動物件（非 POINTITI 商品）
// 目前是 SVG 示意圖，可以直接換成你的去背 PNG（改 img 路徑即可）。
// ─────────────────────────────────────────────────────────────

// mount：怎麼固定在門上
//   'magnet' → 紙類，放到門上後要用小圓磁鐵吸住，不然會掉下來
//   'hang'   → 掛在掛鉤上（hangY = 掛點在圖片中的高度比例）
//   'pocket' → 放進收納盒
//   'shelf'  → 放在磁吸鏡子下方的置物槽（約 5 × 20 cm）
export const OBJECTS = [
  // 事件專用
  { id: 'obj-bag', name: '朋友的包包', img: 'assets/objects/bag.svg', widthCm: 22, heightCm: 27, mount: 'hang', hangY: 0.03 },
  { id: 'obj-note', name: '提醒便條紙', img: 'assets/objects/note.svg', widthCm: 10, heightCm: 10, mount: 'magnet' },
  // 超稀有事件
  { id: 'obj-cat', name: '鄰居的貓', img: 'assets/objects/cat.svg', widthCm: 30, heightCm: 26, mount: 'static', layer: 4 },
  { id: 'obj-delivery', name: '送錯的珍奶', img: 'assets/objects/deco/bubbletea.svg', widthCm: 9, heightCm: 19, mount: 'hang', hangY: 0.02 },
  // 事件＋生活小物都會用到
  { id: 'obj-remote', name: '冷氣遙控器', sub: '別再找不到', img: 'assets/objects/remote.svg', widthCm: 5, heightCm: 15.6, mount: 'pocket', tray: true },
];

// ─────────────────────────────────────────────────────────────
// 生活小物（非 POINTITI）：選單「生活小物」分頁
// ─────────────────────────────────────────────────────────────
const D = 'assets/objects/deco/';
export const DECO = [
  // 用磁鐵固定
  { id: 'deco-note', name: '便條紙', sub: '記得帶鑰匙', img: D + 'note-keys.svg', widthCm: 7.6, heightCm: 7.6, mount: 'magnet' },
  { id: 'deco-photocard', name: '明星小卡', sub: '本命小卡', img: D + 'photocard.svg', widthCm: 6.2, heightCm: 9, mount: 'magnet' },
  { id: 'deco-polaroid', name: '拍立得', sub: '旅行照片', img: D + 'polaroid.svg', widthCm: 8.6, heightCm: 10.8, mount: 'magnet' },
  { id: 'deco-fu', name: '春聯斗方', sub: '福', img: D + 'fu.svg', widthCm: 20, heightCm: 20, mount: 'magnet' },
  { id: 'deco-garbage', name: '垃圾車時間', sub: '社區公告', img: D + 'garbage.svg', widthCm: 10, heightCm: 14, mount: 'magnet' },
  { id: 'deco-ticket', name: '演唱會門票', sub: '搖滾區', img: D + 'ticket.svg', widthCm: 15, heightCm: 5.5, mount: 'magnet' },
  { id: 'deco-drinkmenu', name: '手搖飲菜單', sub: '微糖少冰', img: D + 'drinkmenu.svg', widthCm: 10, heightCm: 14, mount: 'magnet' },
  { id: 'deco-bill', name: '繳費通知單', sub: '水電費', img: D + 'bill.svg', widthCm: 10.5, heightCm: 14, mount: 'magnet' },
  { id: 'deco-drawing', name: '小孩的畫', sub: '我的家', img: D + 'drawing.svg', widthCm: 21, heightCm: 16, mount: 'magnet' },
  { id: 'deco-petphoto', name: '毛孩照片', sub: '我家主子', img: D + 'petphoto.svg', widthCm: 8.6, heightCm: 10.8, mount: 'magnet' },
  { id: 'deco-diet', name: '減肥宣言', sub: '從明天開始', img: D + 'diet.svg', widthCm: 7.6, heightCm: 7.6, mount: 'magnet' },
  // 掛在掛鉤
  { id: 'deco-keys', name: '鑰匙', sub: '家門鑰匙', img: D + 'keys.svg', widthCm: 5, heightCm: 10, mount: 'hang', hangY: 0.03 },
  { id: 'deco-amulet', name: '平安符', sub: '廟裡求的', img: D + 'amulet.svg', widthCm: 5, heightCm: 12.5, mount: 'hang', hangY: 0.02 },
  { id: 'deco-umbrella', name: '折疊傘', sub: '午後雷陣雨', img: D + 'umbrella.svg', widthCm: 6, heightCm: 28, mount: 'hang', hangY: 0.02 },
  { id: 'deco-ecobag', name: '環保袋', sub: '自備購物袋', img: D + 'ecobag.svg', widthCm: 30, heightCm: 40, mount: 'hang', hangY: 0.02 },
  { id: 'deco-helmet', name: '安全帽', sub: '騎車必備', img: D + 'helmet.svg', widthCm: 25, heightCm: 28, mount: 'hang', hangY: 0.02 },
  { id: 'deco-bubbletea', name: '珍奶提袋', sub: '全糖去冰', img: D + 'bubbletea.svg', widthCm: 9, heightCm: 19, mount: 'hang', hangY: 0.02 },
  { id: 'deco-mask', name: '口罩', sub: '感冒季必備', img: D + 'mask.svg', widthCm: 17, heightCm: 13, mount: 'hang', hangY: 0.03 },
  { id: 'deco-leash', name: '狗狗牽繩', sub: '散步時間', img: D + 'leash.svg', widthCm: 7, heightCm: 24, mount: 'hang', hangY: 0.02 },
  { id: 'deco-hat', name: '漁夫帽', sub: '出門防曬', img: D + 'hat.svg', widthCm: 26, heightCm: 19, mount: 'hang', hangY: 0.03 },
  // 放進收納盒
  { id: 'deco-receipts', name: '發票', sub: '等著對獎', img: D + 'receipts.svg', widthCm: 5.7, heightCm: 10, mount: 'pocket' },
  // fits：只能放進哪種尺寸的收納盒（不寫 = 都可以）
  { id: 'deco-letters', name: '大信件', sub: '帳單和信', img: D + 'letter-large.svg', widthCm: 14, heightCm: 9.8, mount: 'pocket', fits: ['pocketL'] },
  { id: 'deco-hongbao', name: '紅包', sub: '過年預備', img: D + 'hongbao.svg', widthCm: 9, heightCm: 15, mount: 'pocket' },
  { id: 'deco-letter-small', name: '小信件', sub: '生日卡片', img: D + 'letter-small.svg', widthCm: 7.4, heightCm: 9.9, mount: 'pocket', fits: ['pocketS'] },
  // 放在鏡子置物槽
  // 放在鏡子置物槽（橫放）
  { id: 'deco-pen', name: '簽字筆', sub: '簽收包裹', img: D + 'pen-lying.svg', widthCm: 14, heightCm: 1.4, mount: 'shelf' },
  { id: 'deco-spray', name: '酒精噴瓶', sub: '75% 酒精', img: D + 'spray-lying.svg', widthCm: 11, heightCm: 3.6, mount: 'shelf' },
  { id: 'deco-lipstick', name: '口紅', sub: '出門補妝', img: D + 'lipstick-lying.svg', widthCm: 8, heightCm: 2.1, mount: 'shelf' },
  { id: 'deco-balm', name: '護唇膏', sub: '冬天必備', img: D + 'balm-lying.svg', widthCm: 7, heightCm: 1.7, mount: 'shelf' },
  { id: 'deco-earbuds', name: '耳機盒', sub: '無線耳機', img: D + 'earbuds-lying.svg', widthCm: 5.4, heightCm: 2.5, mount: 'shelf' },
  { id: 'deco-perfume', name: '香水', sub: '出門噴一下', img: D + 'perfume-lying.svg', widthCm: 8, heightCm: 3.6, mount: 'shelf' },
  { id: 'deco-phone', name: '手機', sub: '差點忘記帶', img: D + 'phone-lying.svg', widthCm: 15, heightCm: 2, mount: 'shelf' },
].map((d) => ({ ...d, tray: true }));

export const DECO_GROUPS = {
  magnet: { label: '用磁鐵固定', note: '紙類' },
  hang: { label: '掛在掛鉤', note: '' },
  pocket: { label: '放進收納盒', note: '' },
  shelf: { label: '鏡子置物槽', note: '' },
};

export const ALL_OBJECTS = [...OBJECTS, ...DECO];
export const OBJECT_MAP = Object.fromEntries(ALL_OBJECTS.map((o) => [o.id, o]));
// 選單中的生活小物（依固定方式排序）
export const TRAY_OBJECTS = ['magnet', 'hang', 'pocket', 'shelf'].flatMap((m) =>
  ALL_OBJECTS.filter((o) => o.tray && o.mount === m).map((o) => ({ ...o, category: 'deco', group: m })),
);

// 吸附／收納的位置設定（比例 = 相對於商品圖片外框）
export const ATTACH = {
  // 掛鉤掛東西的位置（球下方的直桿）
  hookHangPoint: { x: 0.775, y: 0.33 },
  // 掛鉤圓形底座（本身就是磁鐵）的中心：底座壓在紙類上就能固定它
  hookMagnet: { x: 0.24, y: 0.79 },
  // 磁吸鏡子下方置物槽（約 5 × 20 cm）：物品橫放
  // lip = 前緣（以下被擋住）、floor = 前排物品底部、inset = 左右內縮、innerCm = 內寬
  // rows = 深度方向可以放幾排；rowStepCm = 後排比前排看起來高多少
  mirrorShelf: { lip: 0.94, floor: 0.968, inset: 0.04, innerCm: 19, rows: 3, rowStepCm: 0.6 },
  // 包包提把最高點
  bagAnchorY: 0.03,
  // 收納盒前板上緣（遙控器在這條線以下會被前板擋住）
  pocketFrontTop: { pocketS: 0.31, pocketL: 0.34 },
  // 收納盒內底
  pocketFloor: 0.9,
  pocketCapacity: 2,
  // 紙類沒有被磁鐵固定時：剛放上去可撐 10 秒，磁鐵被拿走後撐 3 秒，然後掉下來
  paperHoldMs: 10000,
  paperGraceMs: 3000,
};

// 事件物件出現的位置（場景座標；會自動移到目前畫面看得到的地方）
export const SPAWN = {
  cat: { x: 470, y: 1360 }, // 門口地板
  delivery: { x: 330, y: 1250 },
  bag: { x: 330, y: 1290 },
  note: { x: 250, y: 470 },
  remote: { x: 48, y: 905 }, // 玄關櫃檯面上
};
