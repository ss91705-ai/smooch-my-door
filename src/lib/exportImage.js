// 把玄關背景＋門上的物件畫成一張 9:16 圖片（1080 × 1920，適合 IG 限時動態）
// 不含下方選單、選取框等介面，商品位置與比例和遊戲畫面一致。
import { assetUrl } from './core.js';
import { frontLineY, shelfRange } from './catalog.js';
import { pxPerCm } from './core.js';
import { EGG_SETTINGS } from '../config/eggs.js';
import { SHARE } from '../config/share.js';

const cache = new Map();
function loadImg(src) {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = src;
      }),
    );
  }
  return cache.get(src);
}

export async function renderDoorImage({ cfg, sized, meta, eggState, caption, persona }) {
  const W = 1080;
  const H = 1920;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  const sc = cfg.scene;
  const bg = await loadImg(assetUrl(sc.background));
  const s = Math.max(W / sc.width, H / sc.height);
  const ox = (W - sc.width * s) / 2;
  const oy = (H - sc.height * s) / 2;
  g.drawImage(bg, ox, oy, sc.width * s, sc.height * s);
  const X = (x) => ox + x * s;
  const Y = (y) => oy + y * s;

  const byId = Object.fromEntries(sized.map((i) => [i.id, i]));
  for (const it of sized) {
    if (it.state === 'loose') continue;
    const m = meta[it.def.id];
    let img;
    try {
      img = await loadImg(assetUrl(it.def.img));
    } catch {
      continue;
    }
    g.save();
    // 收納盒、置物槽裡的東西：前緣以下被擋住
    const parent = it.parentId && byId[it.parentId];
    let cut = null;
    if (it.def.mount === 'pocket' && parent?.def.category === 'storage') cut = frontLineY(parent);
    if (it.def.mount === 'shelf' && parent?.def.category === 'mirror') cut = shelfRange(parent, cfg).lip;
    if (cut != null) {
      g.beginPath();
      g.rect(0, 0, W, Y(cut));
      g.clip();
    }
    const unpinned = it.def.mount === 'magnet' && !sized.some((c) => c.parentId === it.id);
    if (unpinned) {
      g.translate(X(it.x), Y(it.y));
      g.rotate((-4 * Math.PI) / 180);
      g.translate(-X(it.x), -Y(it.y));
    }
    g.shadowColor = 'rgba(30,20,12,0.35)';
    g.shadowBlur = (it.def.category === 'magnet' ? 0.8 : 2.4) * s;
    g.shadowOffsetY = (it.def.category === 'magnet' ? 0.5 : 1.5) * s;
    const b = m?.bbox || { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    g.drawImage(img, b.x, b.y, b.w, b.h, X(it.x - it.w / 2), Y(it.y - it.h / 2), it.w * s, it.h * s);
    g.restore();
  }

  // 彩蛋裝飾
  if (eggState?.butterDuck) {
    try {
      const duck = await loadImg(assetUrl('assets/effects/duck.svg'));
      const dw = EGG_SETTINGS.duck.widthCm * pxPerCm(cfg);
      const dh = (dw * 170) / 200;
      g.drawImage(duck, X(EGG_SETTINGS.duck.x - dw / 2), Y(EGG_SETTINGS.duck.y - dh), dw * s, dh * s);
    } catch {
      /* ignore */
    }
  }
  if (eggState?.perfect) {
    const gl = EGG_SETTINGS.garland;
    g.strokeStyle = 'rgba(107,84,68,0.7)';
    g.lineWidth = 2 * s;
    g.beginPath();
    g.moveTo(X(gl.x), Y(gl.y));
    g.quadraticCurveTo(X(gl.x + gl.w / 2), Y(gl.y + gl.sag * 2), X(gl.x + gl.w), Y(gl.y));
    g.stroke();
    const colors = ['#ffd98a', '#ffb3a0', '#fff1c2', '#bfe3c9', '#ffd98a'];
    for (let i = 0; i < 15; i++) {
      const t = i / 14;
      const px = X(gl.x + gl.w * t);
      const py = Y(gl.y + gl.sag * 4 * t * (1 - t) + 6);
      g.fillStyle = colors[i % 5];
      g.globalAlpha = 0.35;
      g.beginPath();
      g.arc(px, py, 10 * s, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      g.beginPath();
      g.arc(px, py, 4.5 * s, 0, Math.PI * 2);
      g.fill();
    }
  }

  // 標題與文案
  const font = (w, px, fam = '') =>
    `${w} ${px}px ${fam}-apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`;
  let grd = g.createLinearGradient(0, 0, 0, 240);
  grd.addColorStop(0, 'rgba(244,237,228,0.95)');
  grd.addColorStop(1, 'rgba(244,237,228,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, 240);
  g.textAlign = 'center';
  g.fillStyle = '#7a6a5d';
  g.font = `italic 400 32px Georgia, "Times New Roman", serif`;
  g.fillText(SHARE.kicker, W / 2, 80);
  g.fillStyle = '#3a2e26';
  g.font = font(800, 76);
  g.fillText(SHARE.title, W / 2, 162);

  const fit = (text, weight, start, min, maxW) => {
    let size = start;
    g.font = font(weight, size);
    while (g.measureText(text).width > maxW && size > min) {
      size -= 2;
      g.font = font(weight, size);
    }
  };
  if (persona) {
    // 玄關人格結果卡
    grd = g.createLinearGradient(0, H - 420, 0, H);
    grd.addColorStop(0, 'rgba(244,237,228,0)');
    grd.addColorStop(0.35, 'rgba(244,237,228,0.9)');
    grd.addColorStop(1, 'rgba(244,237,228,0.98)');
    g.fillStyle = grd;
    g.fillRect(0, H - 420, W, 420);
    g.fillStyle = '#7a6a5d';
    g.font = font(500, 28);
    g.fillText('我的玄關人格是⋯⋯', W / 2, H - 270);
    // 稀有度標籤
    const pw = 150;
    const ph = 50;
    const px = W / 2 - pw / 2;
    const py = H - 248;
    const rg = g.createLinearGradient(px, 0, px + pw, 0);
    const RC = {
      N: ['#a39a90', '#a39a90'],
      R: ['#5b8fd6', '#79a8e6'],
      SR: ['#8a5ad0', '#b48cf0'],
      SSR: ['#d39a2c', '#f6d27a'],
      SSS: ['#ff6b8a', '#ffb347', '#6fd3a8', '#6aa8ff', '#b38cff'],
    }[persona.rarity];
    RC.forEach((c, i) => rg.addColorStop(i / Math.max(1, RC.length - 1), c));
    g.fillStyle = rg;
    g.beginPath();
    g.roundRect ? g.roundRect(px, py, pw, ph, 25) : g.rect(px, py, pw, ph);
    g.fill();
    g.fillStyle = '#fff';
    g.font = font(900, 32);
    g.fillText(persona.rarity, W / 2, py + 36);
    g.fillStyle = '#3a2e26';
    fit(persona.title, 800, 60, 34, W - 100);
    g.fillText(persona.title, W / 2, H - 132);
    g.fillStyle = '#5a4a3e';
    fit(persona.desc, 500, 30, 20, W - 110);
    g.fillText(persona.desc, W / 2, H - 82);
    g.font = font(500, 24);
    g.fillStyle = '#9a8a7d';
    g.fillText(SHARE.handle, W / 2, H - 36);
  } else {
    grd = g.createLinearGradient(0, H - 260, 0, H);
    grd.addColorStop(0, 'rgba(244,237,228,0)');
    grd.addColorStop(0.45, 'rgba(244,237,228,0.88)');
    grd.addColorStop(1, 'rgba(244,237,228,0.97)');
    g.fillStyle = grd;
    g.fillRect(0, H - 260, W, 260);
    g.fillStyle = '#3a2e26';
    fit(caption || '', 700, 52, 30, W - 120);
    g.fillText(caption || '', W / 2, H - 104);
    g.font = font(500, 28);
    g.fillStyle = '#7a6a5d';
    g.fillText(SHARE.handle, W / 2, H - 50);
  }

  return new Promise((res) => cv.toBlob((blob) => res(blob), 'image/png'));
}

// 保存：手機優先用系統分享（可存到相簿／分享到 IG），其他用下載
export async function saveImage(blob) {
  const file = new File([blob], 'smooch-my-door.png', { type: 'image/png' });
  const touch = matchMedia('(pointer: coarse)').matches;
  try {
    if (touch && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'SMOOCH MY DOOR' });
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smooch-my-door.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
