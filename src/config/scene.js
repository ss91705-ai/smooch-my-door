// ─────────────────────────────────────────────────────────────
// 玄關場景設定（座標單位 = 背景圖原始像素，941 × 1672）
// 所有數值都可以在開發測試模式中微調，調整後可「匯出設定」
// 貼到 src/config/overrides.json，就會成為正式預設值。
// ─────────────────────────────────────────────────────────────

export const SCENE = {
  background: 'assets/background/entrance.png',
  width: 941,
  height: 1672,

  // 大門實際寬度（cm）── 暫定值，非真實測量
  doorRealWidthCm: 90,

  // 門扇在圖中的範圍（比例換算基準：門扇寬度 = doorRealWidthCm）
  doorLeaf: { x: 182, y: 232, w: 572, h: 1215 },

  // 可吸附區域（商品外框必須完全落在這裡）
  doorZone: { x: 188, y: 238, w: 560, h: 1203 },

  // 禁止放置區域（商品外框不可與這些區域重疊）
  forbidden: [
    { id: 'closer', label: '閉門器', enabled: true, x: 226, y: 232, w: 152, h: 42 },
    { id: 'peephole', label: '貓眼', enabled: true, x: 458, y: 525, w: 26, h: 26 },
    { id: 'lock', label: '電子鎖', enabled: true, x: 684, y: 794, w: 60, h: 190 },
    { id: 'handle', label: '門把', enabled: true, x: 600, y: 900, w: 144, h: 46 },
  ],

  // 智慧門鈴螢幕（背景圖既有螢幕的玻璃顯示區）
  doorbellScreen: { x: 812, y: 636, w: 56, h: 49, radius: 2 },

  // 預設鏡頭取景範圍（包含整扇門與門鈴螢幕）
  focus: { x: 120, y: 175, w: 780, h: 1300 },

  // 開場取景：畫面寬度剛好放下約 width 場景像素（門扇寬 572），以 (cx, cy) 為中心，
  // 物品看起來比較大；倍數最多 maxZoom。按 ⤢ 或雙擊可以拉回整扇門
  startView: { width: 640, cx: 468, cy: 800, maxZoom: 1.8 },

  // 拖曳到畫面邊緣時自動捲動：邊緣感應寬度（px）、停留多久才開始（ms）、最快速度（px／每格）
  edgePan: { margin: 44, delay: 300, speed: 12 },

  // 鏡頭縮放範圍（1 = 看到整扇門）
  minZoom: 1,
  maxZoom: 5,
};
