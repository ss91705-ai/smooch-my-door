import { useEffect, useRef, useState } from 'react';
import ProductImage, { Loupe, AimLine } from './ProductImage.jsx';
import { assetUrl, clamp, inRect, pxPerCm, resolvePlacement } from '../lib/core.js';
import { EGG_SETTINGS } from '../config/eggs.js';
import {
  hangCenterOn,
  findHookFor,
  findPaperForMagnet,
  findPocketFor,
  findShelfFor,
  hookMagnetPoint,
  shelfRange,
  frontLineY,
  hangPoint,
  pocketSlot,
} from '../lib/catalog.js';
import { sound } from '../lib/sound.js';

const TOUCH = 44; // 最小觸控範圍（CSS px）
const SMALL = 30; // 畫面上小於這個尺寸就顯示放大預覽

export default function Scene({
  viewportRef,
  cfg,
  sized,
  meta,
  cam,
  camApi,
  dispatch,
  selectedId,
  setSelectedId,
  trayRef,
  trayHint, // 從選單拖曳新商品時的提示 { hot, target }
  overlays,
  doorbellOn,
  snaps,
  bumpSnap,
  onDraggingChange,
  onMirrorGroom,
  onObjectTap,
  doorbellImg,
  celebrate,
  eggFx = {},
  falling,
  toast,
  children,
}) {
  const scene = cfg.scene;
  const gesture = useRef(null);
  const lastTap = useRef(null); // 雙擊判斷
  const pointers = useRef(new Map());
  const [drag, setDrag] = useState(null);
  const [groom, setGroom] = useState(null);

  const latest = useRef({});
  latest.current = { sized, cam };

  // ── 選取判定（小物件優先、其次最上層、最後放大觸控範圍） ──
  function hitTest(wx, wy) {
    const { sized: list, cam: k } = latest.current;
    const half = TOUCH / 2 / k.scale;
    let best = null;
    let bd = Infinity;
    for (const it of list) {
      if (Math.min(it.w, it.h) * k.scale >= TOUCH) continue;
      const d = Math.hypot(wx - it.x, wy - it.y);
      if (d <= half && d < bd) {
        best = it;
        bd = d;
      }
    }
    if (best) return best;
    for (let i = list.length - 1; i >= 0; i--) {
      const it = list[i];
      if (inRect(wx, wy, { x: it.x - it.w / 2, y: it.y - it.h / 2, w: it.w, h: it.h })) return it;
    }
    for (const it of list) {
      const ew = Math.max(it.w, TOUCH / k.scale);
      const eh = Math.max(it.h, TOUCH / k.scale);
      if (inRect(wx, wy, { x: it.x - ew / 2, y: it.y - eh / 2, w: ew, h: eh })) {
        const d = Math.hypot(wx - it.x, wy - it.y);
        if (d < bd) {
          best = it;
          bd = d;
        }
      }
    }
    return best;
  }

  const overTray = (clientY) => {
    const r = trayRef.current?.getBoundingClientRect();
    return !!r && clientY > r.top;
  };

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    sound.unlock();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      // 第二指放下 → 改成捏合縮放；若正在拖東西，先放回原位
      const g = gesture.current;
      if (g?.type === 'item' && g.moved) dispatch({ type: 'move', id: g.id, x: g.origX, y: g.origY });
      camApi.stopEdgePan();
      setDrag(null);
      onDraggingChange?.(false);
      const [a, b] = [...pointers.current.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      gesture.current = {
        type: 'pinch',
        startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        startZoom: latest.current.cam.zoom,
        worldMid: camApi.worldFromClient(mid.x, mid.y),
      };
      return;
    }
    if (pointers.current.size > 2) return;

    const w = camApi.worldFromClient(e.clientX, e.clientY);
    const hit = hitTest(w.x, w.y);
    if (hit) {
      gesture.current = {
        type: 'item',
        id: hit.id,
        sx: e.clientX,
        sy: e.clientY,
        offX: hit.x - w.x,
        offY: hit.y - w.y,
        origX: hit.x,
        origY: hit.y,
        moved: false,
        touch: e.pointerType !== 'mouse',
      };
    } else {
      const k = latest.current.cam;
      gesture.current = { type: 'pan', sx: e.clientX, sy: e.clientY, cx: k.cx, cy: k.cy, moved: false };
    }
  }

  function dragItemTo(g, clientX, clientY) {
    g.lx = clientX;
    g.ly = clientY;
    const lift = g.lift || 0;
    const w = camApi.worldFromClient(clientX, clientY - lift);
    const x = w.x + g.offX;
    const y = w.y + g.offY;
    dispatch({ type: 'move', id: g.id, x, y });
    const { sized: list, cam: k } = latest.current;
    const it = list.find((i) => i.id === g.id);
    // 磁鐵（或掛鉤底座）放開後會固定到哪張紙
    let paper = null;
    if (it?.def.category === 'magnet') paper = findPaperForMagnet(list, x, y, k.scale);
    else if (it?.def.category === 'hook') {
      const mp = hookMagnetPoint(x, y, it.w, it.h);
      paper = findPaperForMagnet(list, mp.x, mp.y, k.scale);
    }
    setDrag({
      id: g.id,
      removing: overTray(clientY),
      hot: inRect(x, y, scene.doorZone, 30 / k.scale),
      clientX,
      clientY,
      lift,
      paper: paper?.id || null,
      small: it && Math.min(it.w, it.h) * k.scale < SMALL,
    });
  }

  function onPointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;

    if (g.type === 'pinch') {
      if (pointers.current.size < 2) return;
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      camApi.zoomTo((g.startZoom * d) / g.startDist, mid, g.worldMid);
      return;
    }

    const dx = e.clientX - g.sx;
    const dy = e.clientY - g.sy;
    // 靜態物件（貓咪）不能拖，只能點
    if (g.type === 'item' && latest.current.sized.find((i) => i.id === g.id)?.def.mount === 'static') return;
    if (!g.moved && Math.hypot(dx, dy) > 5) {
      g.moved = true;
      if (g.type === 'item') {
        const it = latest.current.sized.find((i) => i.id === g.id);
        const k = latest.current.cam;
        if (g.touch && it && Math.min(it.w, it.h) * k.scale < SMALL) {
          // 小東西：物品改成跟著「手指上方」移動，不會被手指擋住
          g.lift = scene.smallLift ?? 60;
          g.offX = 0;
          g.offY = 0;
        }
        dispatch({ type: 'front', id: g.id });
        setSelectedId(g.id);
        sound.play('pick');
        onDraggingChange?.(true);
      }
    }
    if (!g.moved) return;

    if (g.type === 'item') {
      dragItemTo(g, e.clientX, e.clientY);
      // 停在畫面邊緣 → 鏡頭自動往那邊移，物件跟著手指
      camApi.edgePan(e.clientX, e.clientY - (g.lift || 0), () => gesture.current === g && dragItemTo(g, g.lx, g.ly));
    } else if (g.type === 'pan') {
      const k = latest.current.cam;
      camApi.setCenter(g.cx - dx / k.scale, g.cy - dy / k.scale);
    }
  }

  function onPointerUp(e) {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g) return;
    if (g.type === 'pinch') {
      if (pointers.current.size === 0) gesture.current = null;
      return;
    }
    gesture.current = null;
    camApi.stopEdgePan();
    setDrag(null);
    onDraggingChange?.(false);
    const cancelled = e.type === 'pointercancel';

    if (g.type === 'item') {
      const { sized: list, cam: k } = latest.current;
      const it = list.find((i) => i.id === g.id);
      if (!it) return;
      if (it.def.mount === 'static') {
        if (onObjectTap?.(it)) bumpSnap(it.id);
        return;
      }
      if (!g.moved) {
        setSelectedId(g.id);
        if (it.def.category === 'mirror') {
          setGroom({ id: it.id, key: Date.now() });
          sound.play('shine');
          onMirrorGroom?.(it.id);
        }
        return;
      }
      const back = () => {
        dispatch({ type: 'move', id: g.id, x: g.origX, y: g.origY });
        sound.play('cancel');
      };
      const snapTo = (x, y, patch) => {
        dispatch({ type: 'place', id: g.id, x, y, patch });
        bumpSnap(g.id);
        sound.play('snap');
      };

      // 拖回下方選單 → 移除（事件中還沒放好的物件不能丟掉）
      if (!cancelled && overTray(e.clientY) && it.state !== 'loose') {
        dispatch({ type: 'remove', id: g.id });
        setSelectedId(null);
        sound.play('remove');
        return;
      }
      if (cancelled) return back();

      const mount = it.def.mount;
      if (mount === 'hang') {
        const hook = findHookFor(list, it, it.x, it.y, k.scale, cfg);
        if (!hook) return back();
        const c = hangCenterOn(hook, it);
        return snapTo(c.x, c.y, { parentId: hook.id, state: 'attached' });
      }
      if (mount === 'pocket') {
        const r = findPocketFor(list, it, it.x, it.y, k.scale);
        if (!r || r.full) return back();
        const c = pocketSlot(r.pocket, it, r.slot);
        return snapTo(c.x, c.y, { parentId: r.pocket.id, state: 'attached', slot: r.slot });
      }
      if (mount === 'shelf') {
        const r = findShelfFor(list, it, it.x, it.y, k.scale, cfg);
        if (!r || r.full) return back();
        const c = r.spot;
        return snapTo(c.x, c.y, { parentId: r.mirror.id, state: 'attached', row: c.row });
      }
      if (mount === 'magnet') {
        if (!inRect(it.x, it.y, scene.doorZone, 30 / k.scale)) return back();
        const p = resolvePlacement(it.x, it.y, it.w, it.h, scene.doorZone, scene.forbidden);
        if (!p) return back();
        // 紙類被移動時，上面的磁鐵跟著移動，維持固定
        return snapTo(p.x, p.y, { state: 'placed', parentId: null });
      }

      // POINTITI 商品
      const p = resolvePlacement(it.x, it.y, it.w, it.h, scene.doorZone, scene.forbidden) || { x: g.origX, y: g.origY };
      let patch = {};
      if (it.def.category === 'magnet') {
        const note = findPaperForMagnet(list, p.x, p.y, k.scale);
        if (note) {
          p.x = clamp(p.x, note.x - note.w / 2 + it.w / 2, note.x + note.w / 2 - it.w / 2);
          p.y = clamp(p.y, note.y - note.h / 2 + it.h / 2, note.y + note.h / 2 - it.h / 2);
          patch = { parentId: note.id };
        } else patch = { parentId: null };
      } else if (it.def.category === 'hook') {
        // 掛鉤底座也是磁鐵：底座壓在紙類上就能固定它
        const mp = hookMagnetPoint(p.x, p.y, it.w, it.h);
        const paper = findPaperForMagnet(list, mp.x, mp.y, k.scale);
        patch = { parentId: paper ? paper.id : null };
      }
      snapTo(p.x, p.y, patch);
    } else if (g.type === 'pan' && !g.moved) {
      setSelectedId(null);
      const now = Date.now();
      const t = lastTap.current;
      if (t && now - t.t < 320 && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 30) {
        lastTap.current = null;
        const k = latest.current.cam;
        if (k.zoom > 1.05) camApi.overview();
        else camApi.zoomTo(2.2, { x: e.clientX, y: e.clientY });
        sound.play('pick');
      } else lastTap.current = { t: now, x: e.clientX, y: e.clientY };
    }
  }

  // 桌機滾輪縮放
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const k = latest.current.cam;
      camApi.zoomTo(k.zoom * Math.exp(-e.deltaY * 0.0015), { x: e.clientX, y: e.clientY });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewportRef, camApi]);

  const bg = assetUrl(scene.background);
  const byId = Object.fromEntries(sized.map((i) => [i.id, i]));
  const dragItem = drag && byId[drag.id];
  const isProductDrag = dragItem && dragItem.def.kind === 'product';
  const isNoteDrag = dragItem?.def.mount === 'magnet';
  const showGlow = isProductDrag || isNoteDrag || !!trayHint?.glow;
  const hot = drag ? drag.hot && !drag.removing : trayHint?.hot;
  const selected = byId[selectedId];
  const lw = 2 / cam.scale;

  // 拖曳中的放置預覽
  let target = trayHint?.target || null;
  let hookTarget = trayHint?.hook || null;
  let pocketTarget = trayHint?.pocket || null;
  let shelfTarget = trayHint?.shelf || null;
  if (dragItem && !drag.removing) {
    if (dragItem.def.mount === 'hang') {
      hookTarget = findHookFor(sized, dragItem, dragItem.x, dragItem.y, cam.scale, cfg);
    } else if (dragItem.def.mount === 'pocket') {
      pocketTarget = findPocketFor(sized, dragItem, dragItem.x, dragItem.y, cam.scale);
    } else if (dragItem.def.mount === 'shelf') {
      shelfTarget = findShelfFor(sized, dragItem, dragItem.x, dragItem.y, cam.scale, cfg);
    } else if (drag.hot) {
      const p = resolvePlacement(dragItem.x, dragItem.y, dragItem.w, dragItem.h, scene.doorZone, scene.forbidden);
      if (p) target = { ...p, w: dragItem.w, h: dragItem.h };
    }
  }

  // 選取工具列
  let toolbar = null;
  if (selected && !drag && selected.state !== 'loose') {
    const sx = cam.tx + selected.x * cam.scale;
    const t = cam.ty + (selected.y - selected.h / 2) * cam.scale;
    const b = cam.ty + (selected.y + selected.h / 2) * cam.scale;
    const below = t <= 52;
    toolbar = {
      left: clamp(sx, 70, cam.size.w - 70),
      top: clamp(below ? b + 10 : t - 10, 8, cam.size.h - 8),
      below,
      removeLabel:
        selected.def.mount === 'hang' || selected.def.mount === 'shelf' ? '取下' : selected.def.mount === 'pocket' ? '取出' : '移除',
      canFront: selected.def.kind === 'product',
    };
  }

  // 事件物件的提示標籤（畫面座標）
  const looseTags = sized
    .filter(
      (i) =>
        drag?.id !== i.id &&
        (i.state === 'loose' ||
          (i.def.mount === 'magnet' &&
            i.state === 'placed' &&
            i.id !== selectedId &&
            !falling?.includes(i.id) &&
            !sized.some((m) => m.parentId === i.id))),
    )
    .map((i) => ({
      id: i.id,
      name: i.state === 'loose' ? i.def.name : '用磁鐵固定！',
      warn: i.state !== 'loose',
      x: cam.tx + i.x * cam.scale,
      y: cam.ty + (i.y - i.h / 2) * cam.scale,
    }));

  return (
    <div
      ref={viewportRef}
      className="viewport"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="world"
        style={{
          width: scene.width,
          height: scene.height,
          transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.scale})`,
        }}
      >
        <img className="bg" src={bg} alt="玄關大門" draggable={false} width={scene.width} height={scene.height} />

        {showGlow && (
          <div
            className={'doorglow' + (hot ? ' hot' : '')}
            style={{ ...box(scene.doorZone), borderWidth: lw * 1.5, borderRadius: 4 / cam.scale }}
          />
        )}
        {target && hot && (
          <div
            className="snapspot"
            style={{ left: target.x - target.w / 2, top: target.y - target.h / 2, width: target.w, height: target.h, borderWidth: lw }}
          />
        )}
        {hookTarget && (
          <div
            className="hangspot"
            style={{ left: hangPoint(hookTarget).x, top: hangPoint(hookTarget).y, width: 30 / cam.scale, height: 30 / cam.scale, borderWidth: lw }}
          />
        )}
        {pocketTarget && (
          <div
            className={'snapspot' + (pocketTarget.full ? ' full' : '')}
            style={{
              left: pocketTarget.pocket.x - pocketTarget.pocket.w / 2,
              top: pocketTarget.pocket.y - pocketTarget.pocket.h / 2,
              width: pocketTarget.pocket.w,
              height: pocketTarget.pocket.h,
              borderWidth: lw,
            }}
          />
        )}

        {shelfTarget &&
          (() => {
            const r = shelfRange(shelfTarget.mirror, cfg);
            return (
              <div
                className={'snapspot' + (shelfTarget.full ? ' full' : '')}
                style={{ left: r.l, top: r.lip - (r.floor - r.lip) * 3, width: r.r - r.l, height: (r.floor - r.lip) * 5, borderWidth: lw }}
              />
            );
          })()}
        {sized.map((it) => {
          let clipPath;
          const parent = it.parentId && byId[it.parentId];
          if (it.def.mount === 'pocket' && parent?.def.category === 'storage' && drag?.id !== it.id) {
            const hide = it.y + it.h / 2 - frontLineY(parent);
            if (hide > 0) clipPath = `inset(-20px -20px ${hide}px -20px)`;
          }
          if (it.def.mount === 'shelf' && parent?.def.category === 'mirror' && drag?.id !== it.id) {
            const hide = it.y + it.h / 2 - shelfRange(parent, cfg).lip;
            if (hide > 0) clipPath = `inset(-20px -20px ${hide}px -20px)`;
          }
          return (
            <div
              key={it.id}
              className={
                'item cat-' +
                it.def.category +
                (drag?.id === it.id ? ' dragging' : '') +
                (it.state === 'loose' ? ' loose' : '') +
                (it.def.mount === 'magnet' && !sized.some((m) => m.parentId === it.id) ? ' unpinned' : '') +
                (falling?.includes(it.id) ? ' falling' : '')
              }
              style={{
                transform: `translate3d(${it.x - it.w / 2}px, ${it.y - it.h / 2}px, 0)`,
                width: it.w,
                height: it.h,
                zIndex: Math.round(it.layer * 100000) + it.z,
                clipPath,
              }}
            >
              <div key={snaps[it.id] || 0} className={'item-inner' + (snaps[it.id] ? ' snap' : '')}>
                <ProductImage product={it.def} meta={meta[it.def.id]} w={it.w} h={it.h} />
                {groom?.id === it.id && (
                  <div key={groom.key} className="groom" onAnimationEnd={(e) => e.target === e.currentTarget && setGroom(null)}>
                    <span className="sweep" />
                    <i style={{ left: '22%', top: '18%' }}>✦</i>
                    <i style={{ left: '70%', top: '34%', animationDelay: '.15s' }}>✦</i>
                    <i style={{ left: '40%', top: '66%', animationDelay: '.3s' }}>✦</i>
                  </div>
                )}
              </div>
              {it.state === 'loose' && <div className="loose-ring" style={{ borderWidth: lw * 1.2 }} />}
              {(drag?.paper || trayHint?.paper) === it.id && <div className="pin-target" style={{ borderWidth: lw * 1.5 }} />}
              {selectedId === it.id && (
                <div
                  className="sel"
                  style={{
                    inset: -3 / cam.scale,
                    borderWidth: lw,
                    borderRadius: Math.min(it.w, it.h) < 12 ? '50%' : 4 / cam.scale,
                  }}
                />
              )}
            </div>
          );
        })}

        {eggFx.garland && <Garland g={EGG_SETTINGS.garland} />}
        {eggFx.duck && (
          <img
            className="duck"
            src={assetUrl('assets/effects/duck.svg')}
            alt="奶油色小鴨"
            draggable={false}
            style={(() => {
              const w = EGG_SETTINGS.duck.widthCm * pxPerCm(cfg);
              const h = (w * 170) / 200;
              return { left: EGG_SETTINGS.duck.x - w / 2, top: EGG_SETTINGS.duck.y - h, width: w, height: h };
            })()}
          />
        )}

        <div
          className={'doorbell' + (doorbellOn ? ' on' : '')}
          style={{ ...box(scene.doorbellScreen), borderRadius: scene.doorbellScreen.radius }}
        >
          {doorbellOn && (
            <img className="doorbell-friend" src={assetUrl(doorbellImg || 'assets/objects/friend.svg')} alt="門外的訪客" draggable={false} />
          )}
        </div>

        {overlays && (
          <>
            <div className="ov ov-leaf" style={box(scene.doorLeaf)} />
            <div className="ov ov-zone" style={box(scene.doorZone)} />
            {scene.forbidden.map(
              (f) =>
                f.enabled !== false && (
                  <div key={f.id} className="ov ov-block" style={box(f)}>
                    <span style={{ fontSize: 12 / cam.scale }}>{f.label}</span>
                  </div>
                ),
            )}
            <div className="ov ov-bell" style={box(scene.doorbellScreen)} />
          </>
        )}
      </div>

      {sized.length === 0 && !trayHint && (
        <div className="hint">
          從下方拖曳配件，吸到門上 ✦
          <small>雙指或雙擊空白處可以放大／看整扇門</small>
        </div>
      )}

      {looseTags.map((t) => (
        <div key={t.id} className={'obj-tag' + (t.warn ? ' warn' : '')} style={{ left: clamp(t.x, 50, cam.size.w - 50), top: clamp(t.y - 6, 22, cam.size.h - 10) }}>
          {t.name}
        </div>
      ))}

      {toolbar && (
        <div
          className={'toolbar' + (toolbar.below ? ' below' : '')}
          style={{ left: toolbar.left, top: toolbar.top }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {toolbar.canFront && <button onClick={() => dispatch({ type: 'front', id: selected.id })}>移到最前</button>}
          <button
            className="danger"
            onClick={() => {
              dispatch({ type: 'remove', id: selected.id });
              setSelectedId(null);
              sound.play('remove');
            }}
          >
            {toolbar.removeLabel}
          </button>
        </div>
      )}

      {drag?.small && dragItem && (
        <LoupeAt viewportRef={viewportRef} drag={drag} item={dragItem} meta={meta} />
      )}
      {drag?.lift > 0 && !drag.removing && <AimAt viewportRef={viewportRef} drag={drag} />}

      <div className="zoomctl" onPointerDown={(e) => e.stopPropagation()}>
        <button aria-label="放大" onClick={() => camApi.zoomTo(cam.zoom * 1.6)}>
          ＋
        </button>
        <button aria-label="縮小" onClick={() => camApi.zoomTo(cam.zoom / 1.6)}>
          －
        </button>
        {cam.zoom > 1.01 && (
          <button aria-label="看整扇門" className="fit" onClick={() => camApi.overview()}>
            ⤢
          </button>
        )}
      </div>
      {drag?.removing && dragItem?.state !== 'loose' && <div className="trash-hint">放開即可移除</div>}
      {toast && (
        <div key={toast.key} className="toast">
          {toast.text}
        </div>
      )}

      {!!eggFx.rainbow && (
        <div key={eggFx.rainbow} className="rainbow">
          <div className="arc" />
        </div>
      )}
      {!!celebrate && (
        <div key={celebrate} className="celebrate">
          {['✦', '♥', '✦', '♥', '✦', '♥', '✦'].map((c, i) => (
            <i key={i} style={{ left: 12 + i * 12 + '%', animationDelay: i * 0.08 + 's' }}>
              {c}
            </i>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

// 完美玄關的神秘裝飾：門框上方的暖色串燈
function Garland({ g }) {
  const n = 15;
  const pts = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return { x: g.x + g.w * t, y: g.y + g.sag * 4 * t * (1 - t) };
  });
  const d = `M${g.x} ${g.y} Q${g.x + g.w / 2} ${g.y + g.sag * 2} ${g.x + g.w} ${g.y}`;
  const colors = ['#ffd98a', '#ffb3a0', '#fff1c2', '#bfe3c9', '#ffd98a'];
  return (
    <svg className="garland" style={{ left: 0, top: 0 }} width="941" height="400" viewBox="0 0 941 400">
      <path d={d} fill="none" stroke="#6b5444" strokeWidth="2" opacity=".7" />
      {pts.map((p, i) => (
        <g key={i} style={{ animationDelay: (i % 3) * 0.4 + 's' }} className="bulb">
          <circle cx={p.x} cy={p.y + 6} r="10" fill={colors[i % colors.length]} opacity=".35" />
          <circle cx={p.x} cy={p.y + 6} r="4.5" fill={colors[i % colors.length]} />
        </g>
      ))}
    </svg>
  );
}

function LoupeAt({ viewportRef, drag, item, meta }) {
  const r = viewportRef.current?.getBoundingClientRect();
  if (!r) return null;
  // 物品浮在手指上方時，放大鏡再往上放，避免蓋住物品
  return <Loupe product={item.def} meta={meta[item.def.id]} x={drag.clientX - r.left} y={drag.clientY - r.top - (drag.lift || 12) - 52} />;
}

function AimAt({ viewportRef, drag }) {
  const r = viewportRef.current?.getBoundingClientRect();
  if (!r) return null;
  const fx = drag.clientX - r.left;
  const fy = drag.clientY - r.top;
  return <AimLine fx={fx} fy={fy} x={fx} y={fy - drag.lift} />;
}

const box = (r) => ({ left: r.x, top: r.y, width: r.w, height: r.h });
