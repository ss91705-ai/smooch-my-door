import { PERSONAS, RARITIES } from '../config/personas.js';
import { ATTACH } from '../config/objects.js';

// 整理門上的統計資料，給稱號條件判斷用
export function doorStats(sized, progress, cfg, lucky = false) {
  const placed = sized.filter((i) => i.state !== 'loose' && i.def.mount !== 'static');
  const prods = placed.filter((i) => i.def.kind === 'product');
  const deco = placed.filter((i) => i.def.kind === 'object');
  const ids = new Set(deco.map((i) => i.objectId));
  const cat = (c) => prods.filter((i) => i.def.category === c);
  const kids = (id) => placed.filter((c) => c.parentId === id);

  const colors = {};
  for (const p of prods) colors[p.colorId] = (colors[p.colorId] || 0) + 1;
  const magnetColors = new Set(cat('magnet').map((m) => m.colorId)).size;
  const hooks = cat('hook');
  const pockets = cat('storage');
  const z = cfg.scene.doorZone;
  const rel = (i) => (i.y - z.y) / z.h;

  return {
    lucky,
    total: placed.length,
    products: prods.length,
    decoCount: deco.length,
    hooks: hooks.length,
    mirrors: cat('mirror').length,
    magnets: cat('magnet').length,
    pockets: pockets.length,
    shelf: placed.filter((i) => i.def.mount === 'shelf').length,
    colorCount: Object.keys(colors).length,
    magnetColors,
    butter: colors.butter || 0,
    allButter: prods.length > 0 && Object.keys(colors).length === 1 && !!colors.butter,
    allCats: ['hook', 'mirror', 'magnet', 'storage'].every((c) => cat(c).length > 0),
    hooksAllUsed: hooks.length > 0 && hooks.every((h) => kids(h.id).some((c) => c.def.mount === 'hang')),
    pocketsAllFull:
      pockets.length > 0 && pockets.every((p) => kids(p.id).filter((c) => c.def.mount === 'pocket').length >= ATTACH.pocketCapacity),
    hookPinnedWithItem: hooks.some((h) => h.parentId && placed.find((p) => p.id === h.parentId)?.def.mount === 'magnet' && kids(h.id).length > 0),
    allLow: placed.length > 0 && placed.every((i) => rel(i) > 0.55),
    allHigh: placed.length > 0 && placed.every((i) => rel(i) < 0.3),
    has: (id) => ids.has(id),
    pinnedBy: (id) => {
      const paper = deco.find((d) => d.objectId === id);
      return paper ? kids(paper.id).filter((c) => c.def.category === 'magnet' || c.def.category === 'hook').length : 0;
    },
    event: (id) => !!progress?.events?.[id],
  };
}

// 所有符合的稱號，最稀有的排前面
export function matchPersonas(stats) {
  return PERSONAS.filter((p) => {
    try {
      return p.test(stats);
    } catch {
      return false;
    }
  }).sort((a, b) => RARITIES[b.rarity].rank - RARITIES[a.rarity].rank);
}
