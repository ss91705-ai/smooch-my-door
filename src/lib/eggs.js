import { EGG_SETTINGS } from '../config/eggs.js';

// 依門上的 POINTITI 商品判定五種彩蛋條件
export function evaluateEggs(sized) {
  const products = sized.filter((i) => i.def.kind === 'product');
  const byColor = {};
  for (const p of products) byColor[p.colorId] = (byColor[p.colorId] || 0) + 1;
  const cats = new Set(products.map((p) => p.def.category));
  const magnetColors = new Set(products.filter((p) => p.def.category === 'magnet').map((p) => p.colorId));
  const butter = byColor.butter || 0;
  return {
    mono: Object.values(byColor).some((n) => n >= EGG_SETTINGS.monoCount),
    rainbow: magnetColors.size >= EGG_SETTINGS.rainbowCount,
    organizer: cats.has('hook') && cats.has('mirror') && cats.has('storage'),
    butterDuck: butter >= EGG_SETTINGS.butterCount && butter === products.length,
    perfect: cats.has('hook') && cats.has('mirror') && cats.has('magnet') && cats.has('storage'),
  };
}
