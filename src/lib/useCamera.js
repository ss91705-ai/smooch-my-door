import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { clamp } from './core.js';

// 鏡頭：背景與商品共用同一個「場景座標」，只做等比縮放 + 平移，
// 所以不同手機尺寸下，商品與門板永遠對齊，背景也不會被拉伸。
export function useCamera(viewportRef, scene) {
  const [size, setSize] = useState({ w: 360, h: 520 });
  const [view, setView] = useState({ zoom: 1, cx: null, cy: null });

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
  const zoom = clamp(view.zoom, scene.minZoom, scene.maxZoom);
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

  const c = clampCenter(view.cx ?? f.x + f.w / 2, view.cy ?? f.y + f.h / 2, scale);
  const tx = size.w / 2 - c.cx * scale;
  const ty = size.h / 2 - c.cy * scale;

  const cam = useMemo(
    () => ({ size, zoom, scale, tx, ty, cx: c.cx, cy: c.cy, fit }),
    [size, zoom, scale, tx, ty, c.cx, c.cy, fit],
  );
  const camRef = useRef(cam);
  camRef.current = cam;

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
      reset() {
        setView({ zoom: 1, cx: null, cy: null });
      },
      get current() {
        return camRef.current;
      },
    };
  }, [viewportRef, scene.minZoom, scene.maxZoom]);

  return [cam, api];
}
