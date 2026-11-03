// ─────────────────────────────────────────────────────────────
// 第四階段：雙 11 優惠獎勵（只取最高金額，不累加）
// 正式折扣限制請在 Shopify 後台設定；遊戲放在 GitHub Pages，
// 前端的折扣碼無法保密，也無法防止重複領取。
// ─────────────────────────────────────────────────────────────

export const REWARDS = {
  startDate: '2026-11-03', // 開始使用日期
  startLabel: '即日起可使用',
  minSpend: 1000, // 最低消費門檻（之後決定，例如 1000 → 顯示「滿 NT$1,000 可用」）
  showCode: true, // 第一版不顯示折扣碼；拿到正式 Shopify 折扣碼後改成 true
  pendingText: '折扣碼即將公布',
  stackNote: '不可與 Smooch Home 雙 11 其他折扣活動併用',
  tiers: [
    { id: 'finish', amount: 50, condition: '第一次完成大門佈置', need: 1, code: 'point50' },
    { id: 'events', amount: 80, condition: '成功完成三種不同突發事件', need: 3, code: 'point80' },
    { id: 'eggs', amount: 100, condition: '解鎖三種不同隱藏彩蛋', need: 3, code: 'point100' },
  ],
};
