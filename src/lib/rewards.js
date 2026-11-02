import { REWARDS } from '../config/rewards.js';

// 依進度計算三種獎勵的達成狀況與目前最高資格
export function computeRewards(progress) {
  const counts = {
    finish: progress.firstFinishedAt ? 1 : 0,
    events: Object.keys(progress.events || {}).length,
    eggs: Object.keys(progress.eggs || {}).length,
  };
  const tiers = REWARDS.tiers.map((t) => {
    const count = Math.min(counts[t.id] || 0, t.need);
    return { ...t, count, done: count >= t.need };
  });
  const best = tiers.filter((t) => t.done).sort((a, b) => b.amount - a.amount)[0] || null;
  const next = tiers.filter((t) => !t.done && (!best || t.amount > best.amount)).sort((a, b) => a.amount - b.amount)[0] || null;
  return { tiers, best, next };
}

export const minSpendText = () =>
  REWARDS.minSpend ? `滿 NT$${REWARDS.minSpend.toLocaleString()} 可使用` : '最低消費門檻將於活動公告';
