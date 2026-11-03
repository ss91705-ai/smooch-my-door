import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { clamp } from './core.js';

// 鏡頭：背景與商品共用同一個「場景座標」，只做等比縮放 + 平移，
// 所以不同手機尺寸下，商品與門板永遠對齊，背景也不會被拉伸。
export function useCamera(viewportRef, scene) {
  const [size, setSize] = useState({ w: 360, h: 520 });
  // zoom 為 null = 開場取景（依螢幕寬度計算）
  const [view, setView] = useState({ zoom: null, cx: null, cy: null });

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewportRef]);

  const f = scene.focus;
  const fit = Math.min(size.w / f.w, size.h / f.h);
  const sv = scene.startView;
  const startZoom = sv ? clamp(size.w / sv.width / fit, 1, sv.maxZoom || scene.maxZoom) : 1;
  const zoom = clamp(view.zoom ?? startZoom, scene.minZoom, scene.maxZoom);
  const scale = fit * zoom;

  const clampCenter = useCallback(
    (cx, cy, s) => {
      const hw = size.w / 2 / s;
      const hh = size.h / 2 / s;
      return {
        cx: scene.width > hw * 2 ? clamp(cx, hw, scene.width - hw) : scene.width / 2,
        cy: scene.height > hh * 2 ? clamp(cy, hh, scene.height - hh) : scene.height / 2,
      };
    },
    [size, scene.width, scene.height],
  );

  const atStart = view.zoom == null && sv;
  const c = clampCenter(view.cx ?? (atStart ? sv.cx : f.x + f.w / 2), view.cy ?? (atStart ? sv.cy : f.y + f.h / 2), scale);
  const tx = size.w / 2 - c.cx * scale;
  const ty = size.h / 2 - c.cy * scale;

  const cam = useMemo(
    () => ({ size, zoom, scale, tx, ty, cx: c.cx, cy: c.cy, fit }),
    [size, zoom, scale, tx, ty, c.cx, c.cy, fit],
  );
  const camRef = useRef(cam);
  camRef.current = cam;

  const edge = useRef({ raf: 0, since: 0 });
  const edgeCfg = useRef(scene.edgePan);
  edgeCfg.current = scene.edgePan;
  const edgeStep = useCallback(() => {
    const E = edge.current;
    E.raf = 0;
    const el = viewportRef.current;
    const ec = edgeCfg.current;
    if (!el || !ec || E.x == null) return;
    const r = el.getBoundingClientRect();
    const inside = E.x >= r.left && E.x <= r.right && E.y >= r.top && E.y <= r.bottom;
    // 越靠近邊緣越快（0～1）
    const push = (d) => (d < ec.margin ? 1 - Math.max(d, 0) / ec.margin : 0);
    const vx = inside ? push(E.x - r.left) * -1 + push(r.right - E.x) : 0;
    const vy = inside ? push(E.y - r.top) * -1 + push(r.bottom - E.y) : 0;
    if (!vx && !vy) {
      E.since = 0;
      E.raf = requestAnimationFrame(edgeStep);
      return;
    }
    const now = performance.now();
    if (!E.since) E.since = now;
    if (now - E.since >= ec.delay) {
      const k = camRef.current;
      setView((v) => ({
        zoom: v.zoom,
        cx: k.cx + (vx * ec.speed) / k.scale,
        cy: k.cy + (vy * ec.speed) / k.scale,
      }));
      // 鏡頭更新後（下一格）再讓拖曳中的物件跟上手指
      requestAnimationFrame(() => E.onTick?.());
    }
    E.raf = requestAnimationFrame(edgeStep);
  }, [viewportRef]);

  const api = useMemo(() => {
    const rect = () => viewportRef.current.getBoundingClientRect();
    return {
      worldFromClient(x, y) {
        const r = rect();
        const k = camRef.current;
        return { x: (x - r.left - k.tx) / k.scale, y: (y - r.top - k.ty) / k.scale };
      },
      clientFromWorld(x, y) {
        const r = rect();
        const k = camRef.current;
        return { x: r.left + k.tx + x * k.scale, y: r.top + k.ty + y * k.scale };
      },
      setCenter(cx, cy) {
        setView((v) => ({ ...v, cx, cy }));
      },
      // 以某個畫面點為錨點縮放（捏合 / 滾輪 / 按鈕）
      zoomTo(nextZoom, anchorClient, anchorWorld) {
        const k = camRef.current;
        const z = clamp(nextZoom, scene.minZoom, scene.maxZoom);
        const s = k.fit * z;
        const r = rect();
        const ax = anchorClient ? anchorClient.x - r.left : k.size.w / 2;
        const ay = anchorClient ? anchorClient.y - r.top : k.size.h / 2;
        const w = anchorWorld || { x: (ax - k.tx) / k.scale, y: (ay - k.ty) / k.scale };
        const cx = w.x - (ax - k.size.w / 2) / s;
        const cy = w.y - (ay - k.size.h / 2) / s;
        setView({ zoom: z, cx, cy });
      },
      // 回到開場取景
      reset() {
        setView({ zoom: null, cx: null, cy: null });
      },
      // 看整扇門
      overview() {
        setView({ zoom: 1, cx: null, cy: null });
      },
      // 拖曳時手指停在畫面邊緣 → 自動捲動；onTick 在每次捲動後重新計算拖曳中物件的位置
      edgePan(clientX, clientY, onTick) {
        const E = edge.current;
        E.x = clientX;
        E.y = clientY;
        E.onTick = onTick;
        if (!E.raf) E.raf = requestAnimationFrame(edgeStep);
      },
      stopEdgePan() {
        const E = edge.current;
        cancelAnimationFrame(E.raf);
        edge.current = { raf: 0, since: 0 };
      },
      get current() {
        return camRef.current;
      },
    };
  }, [viewportRef, scene.minZoom, scene.maxZoom, edgeStep]);

  return [cam, api];
}
