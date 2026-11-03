import { assetUrl } from '../lib/core.js';

// 顯示真實商品 PNG：只裁掉透明留白，等比縮放，不改顏色、不變形
export default function ProductImage({ product, meta, w, h, className = '', style }) {
  const src = assetUrl(product.img);
  if (!meta?.bbox) {
    return (
      <img
        className={className}
        src={src}
        alt=""
        draggable={false}
        style={{ width: w, height: h, objectFit: 'contain', display: 'block', ...style }}
      />
    );
  }
  const { bbox, natW, natH } = meta;
  const k = w / bbox.w;
  return (
    <div className={'pimg ' + className} style={{ width: w, height: h, ...style }}>
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ left: -bbox.x * k, top: -bbox.y * k, width: natW * k, height: natH * k }}
      />
    </div>
  );
}

// 小物件的放大預覽泡泡（顯示在手指上方）
export function Loupe({ product, meta, x, y }) {
  if (!product || !meta?.aspect) return null;
  const size = 46;
  const w = meta.aspect >= 1 ? size : size * meta.aspect;
  const h = meta.aspect >= 1 ? size / meta.aspect : size;
  return (
    <div className="loupe" style={{ transform: `translate3d(${x - 32}px, ${y - 32}px, 0)` }}>
      <ProductImage product={product} meta={meta} w={w} h={h} />
    </div>
  );
}

// 小東西拖曳時：從手指拉一條細線到物品，外加瞄準圈（座標為所在容器內的 px）
export function AimLine({ fx, fy, x, y }) {
  return (
    <svg className="aim" width="100%" height="100%">
      <line x1={fx} y1={fy} x2={x} y2={y} />
      <circle className="aim-shade" cx={x} cy={y} r="13" />
      <circle cx={x} cy={y} r="13" />
    </svg>
  );
}
