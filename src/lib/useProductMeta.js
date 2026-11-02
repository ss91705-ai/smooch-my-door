import { useEffect, useState } from 'react';
import { assetUrl } from './core.js';

// 載入商品圖片並偵測「不透明內容」的外框，
// 讓 PNG 四周的透明留白不會被算進商品實際尺寸。
function scan(img) {
  const natW = img.naturalWidth;
  const natH = img.naturalHeight;
  const full = { natW, natH, bbox: { x: 0, y: 0, w: natW, h: natH }, aspect: natW / natH };
  try {
    const s = Math.min(1, 400 / Math.max(natW, natH));
    const cw = Math.max(1, Math.round(natW * s));
    const ch = Math.max(1, Math.round(natH * s));
    const cv = document.createElement('canvas');
    cv.width = cw;
    cv.height = ch;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, cw, ch);
    const d = g.getImageData(0, 0, cw, ch).data;
    let x0 = cw, y0 = ch, x1 = -1, y1 = -1;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        if (d[(y * cw + x) * 4 + 3] > 12) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return full;
    const bx = Math.max(0, Math.floor(x0 / s));
    const by = Math.max(0, Math.floor(y0 / s));
    const bw = Math.min(natW, Math.ceil((x1 + 1) / s)) - bx;
    const bh = Math.min(natH, Math.ceil((y1 + 1) / s)) - by;
    return { natW, natH, bbox: { x: bx, y: by, w: bw, h: bh }, aspect: bw / bh };
  } catch {
    return full;
  }
}

export function useProductMeta(products) {
  const [meta, setMeta] = useState({});
  useEffect(() => {
    let alive = true;
    products.forEach((p) => {
      const img = new Image();
      img.onload = () => alive && setMeta((m) => ({ ...m, [p.id]: { ...scan(img), loaded: true } }));
      img.onerror = () => alive && setMeta((m) => ({ ...m, [p.id]: { error: true } }));
      img.src = assetUrl(p.img);
    });
    return () => {
      alive = false;
    };
  }, [products]);
  return meta;
}
