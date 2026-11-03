import { forwardRef } from 'react';
import ProductImage from './ProductImage.jsx';
import { CATEGORIES, COLORS, GROUPS } from '../config/products.js';
import { DECO_GROUPS } from '../config/objects.js';
import { TRAY_ITEMS } from '../lib/catalog.js';
import { Fragment } from 'react';

// 下方商品選單：分類 → 各款配色（可水平滑動）→ 拖曳到門上（或點一下直接放到門中央）
const Tray = forwardRef(function Tray(
  { category, setCategory, meta, onCardPointerDown, onFinish, onReset, onTemplates, armedId },
  ref,
) {
  const list = TRAY_ITEMS.filter((p) => p.category === category);
  const groups = category === 'deco' ? DECO_GROUPS : GROUPS;
  return (
    <div className="tray" ref={ref}>
      <div className="tabs" role="tablist">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={category === c.id}
            className={category === c.id ? 'on' : ''}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="cards" onPointerDown={(e) => !e.target.closest('.card') && onCardPointerDown(e, null)}>
        {list.map((p, idx) => {
          const m = meta[p.id];
          const a = m?.aspect || 1;
          const S = 48;
          const w = a >= 1 ? S : S * a;
          const h = a >= 1 ? S / a : S;
          const color = COLORS[p.colorId];
          const group = p.group && p.group !== list[idx - 1]?.group ? groups[p.group] : null;
          return (
            <Fragment key={p.id}>
            {group && (
              <div className="group-tag">
                <b>{group.label}</b>
                {group.note && <span>{group.note}</span>}
              </div>
            )}
            <div
              className={'card' + (armedId === p.id ? ' armed' : '')}
              onPointerDown={(e) => onCardPointerDown(e, p)}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="thumb">{m?.loaded && <ProductImage product={p} meta={m} w={w} h={h} />}</div>
              <div className="cname">{p.name}</div>
              <div className="ccolor">{color?.label || p.sub}</div>
              {p.fits && <div className="cfit">限 {p.fits.map((k) => (k === 'pocketL' ? 'L' : 'S')).join('／')} 盒</div>}
            </div>
            </Fragment>
          );
        })}
      </div>
      <div className="actions">
        <button className="btn-line" onClick={onTemplates}>
          範本
        </button>
        <button className="btn-line" onClick={onReset}>
          重置
        </button>
        <button className="primary" onClick={onFinish}>
          完成佈置
        </button>
      </div>
    </div>
  );
});

export default Tray;
