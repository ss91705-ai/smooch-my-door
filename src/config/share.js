// ─────────────────────────────────────────────────────────────
// 完成佈置：作品圖片與畫面上的文案（客人分享到 IG 用）
// 每次完成會隨機挑一句，客人也可以按「換一句」。直接改這裡就好。
// ─────────────────────────────────────────────────────────────

export const SHARE = {
  // 圖片上方
  kicker: 'my door, my mood',
  title: 'SMOOCH MY DOOR',
  // 圖片下方標記帳號
  handle: '@smooch_home',
  // 隨機文案
  captions: [
    '出門前的最後一眼，也要很可愛 ✦',
    '今日玄關穿搭，完成 ✓',
    '回家第一眼，心情就好了',
    '把喜歡的顏色，吸在每天都會看到的地方',
    '鑰匙、包包、好心情，都掛在門上了',
    '沒有很會收納，但很會可愛 ♡',
    '門一關，就是我的小宇宙',
    '我家大門，今天也好看',
  ],
  // 特別組合時優先出現的文案（對應隱藏彩蛋）
  special: {
    butterDuck: '奶油色控，正式報到 🐤',
    perfect: '完美玄關，達成 ✦',
    rainbow: '一扇門，收集一道彩虹',
  },
};

// 依目前門上的狀態挑一句（idx 用來「換一句」）
export function pickCaption(eggState, idx) {
  const special = Object.entries(SHARE.special)
    .filter(([k]) => eggState?.[k])
    .map(([, v]) => v);
  const pool = [...special, ...SHARE.captions];
  return pool[((idx % pool.length) + pool.length) % pool.length];
}
