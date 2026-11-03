import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Scene from './components/Scene.jsx';
import EventLayer from './components/EventLayer.jsx';
import Tray from './components/Tray.jsx';
import DevPanel from './components/DevPanel.jsx';
import ProductImage, { Loupe, AimLine } from './components/ProductImage.jsx';
import { EggsModal, ConfirmModal, EggUnlock, TemplateModal } from './components/Modals.jsx';
import { FinishView, RewardModal, RewardPop, PersonaPop } from './components/Rewards.jsx';
import { computeRewards } from './lib/rewards.js';
import { LUCKY_CHANCE, PERSONAS } from './config/personas.js';
import { doorStats, matchPersonas } from './lib/personas.js';
import { EGGS } from './config/eggs.js';
import { evaluateEggs } from './lib/eggs.js';
import { APP, STORAGE_KEYS } from './config/app.js';
import {
  DEFAULT_CONFIG,
  clamp,
  inRect,
  loadConfig,
  loadJSON,
  removeKey,
  resolvePlacement,
  saveJSON,
  uid,
} from './lib/core.js';
import { layoutReducer, loadLayout, saveLayout, layoutFromTemplate } from './lib/layout.js';
import {
  ALL_ASSETS,
  computeSized,
  defById,
  findHookFor,
  findPaperForMagnet,
  findPocketFor,
  freeHooks,
  freePockets,
  fitsLabel,
  freeShelves,
  findShelfFor,
  hookMagnetPoint,
  shelfSpot,
  hangCenterOn,
  pocketSlot,
  sizeOfDef,
} from './lib/catalog.js';
import { ATTACH } from './config/objects.js';
import { useEvents } from './lib/useEvents.js';
import { useProductMeta } from './lib/useProductMeta.js';
import { useCamera } from './lib/useCamera.js';
import { sound } from './lib/sound.js';

const emptyProgress = () => ({ version: 1, firstFinishedAt: null, events: {}, eggs: {} });

export default function App() {
  const [cfg, setCfgState] = useState(loadConfig);
  const meta = useProductMeta(ALL_ASSETS);
  const [layout, dispatch] = useReducer(layoutReducer, undefined, loadLayout);
  const [progress, setProgress] = useState(() => loadJSON(STORAGE_KEYS.progress, null) || emptyProgress());
  const [selectedId, setSelectedId] = useState(null);
  const [category, setCategory] = useState('hook');
  const [soundOn, setSoundOn] = useState(sound.enabled);
  const [modal, setModal] = useState(null);
  const [devOpen, setDevOpen] = useState(
    () => APP.devModeEnabled && new URLSearchParams(location.search).has('dev'),
  );
  const [overlays, setOverlays] = useState(false);
  const [doorbellOn, setDoorbellOn] = useState(false);
  const [snaps, setSnaps] = useState({});
  const [ghost, setGhost] = useState(null); // 從選單拖曳中的商品

  const viewportRef = useRef(null);
  const trayRef = useRef(null);
  const [cam, camApi] = useCamera(viewportRef, cfg.scene);
  const sized = useMemo(() => computeSized(layout.items, meta, cfg), [layout.items, meta, cfg]);
  const [sceneDragging, setSceneDragging] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const [eggQueue, setEggQueue] = useState([]);
  const [rewardPop, setRewardPop] = useState(null);
  const [lucky, setLucky] = useState(false);
  const [bookTab, setBookTab] = useState('personas');
  const [rainbow, setRainbow] = useState(0);

  // ── 突發事件 ──
  const [personaPop, setPersonaPop] = useState(null);
  const onEventSuccess = useCallback((id) => {
    // 超稀有事件成功 → 直接頒發專屬 SSS 稱號
    const award = PERSONAS.find((p) => p.award === id);
    setProgress((p) => ({
      ...p,
      events: { ...p.events, [id]: p.events?.[id] || Date.now() },
      personas: award ? { ...p.personas, [award.id]: p.personas?.[award.id] || Date.now() } : p.personas,
    }));
    if (award) setPersonaPop(award.id);
    setCelebrate(Date.now());
  }, []);
  const events = useEvents({
    sized,
    cfg,
    dispatch,
    camApi,
    setCategory,
    busy: sceneDragging || !!ghost || !!modal || eggQueue.length > 0 || !!rewardPop || !!personaPop,
    onSuccess: onEventSuccess,
  });
  useEffect(() => {
    if (events.ev?.phase === 'intro' || events.ev?.phase === 'result') setSelectedId(null);
  }, [events.ev?.phase]);

  // ── 隱藏彩蛋 ──
  const eggState = useMemo(() => evaluateEggs(sized), [sized]);
  const prevEggs = useRef(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  useEffect(() => {
    if (sceneDragging || ghost) return; // 放下後再判定
    const prev = prevEggs.current;
    prevEggs.current = eggState;
    if (prev && eggState.rainbow && !prev.rainbow) setRainbow(Date.now());
    const newly = EGGS.filter((e) => eggState[e.id] && !progressRef.current.eggs?.[e.id]).map((e) => e.id);
    if (!newly.length) return;
    const now = Date.now();
    setProgress((p) => ({ ...p, eggs: { ...p.eggs, ...Object.fromEntries(newly.map((id) => [id, now])) } }));
    setEggQueue((q) => [...q, ...newly.filter((id) => !q.includes(id))]);
    setSelectedId(null);
  }, [eggState, sceneDragging, ghost]);
  const closeEgg = useCallback(() => setEggQueue((q) => q.slice(1)), []);
  const showEgg = eggQueue.length > 0 && !events.ev && !modal ? eggQueue[0] : null;

  // ── 雙 11 優惠資格（只取最高金額） ──
  const rewardInfo = useMemo(() => computeRewards(progress), [progress]);
  useEffect(() => {
    const amt = rewardInfo.best?.amount || 0;
    if (amt > (progress.rewardShown || 0)) {
      setRewardPop(amt);
      setProgress((p) => ({ ...p, reward: amt, rewardShown: amt }));
    }
  }, [rewardInfo, progress.rewardShown]);
  const showReward = rewardPop && !events.ev && !showEgg ? rewardPop : null;
  const showPersonaPop = personaPop && !events.ev && !showEgg && !showReward ? personaPop : null;

  // ── 紙類沒有磁鐵固定會掉下來 ──
  // 剛放上去可撐 paperHoldMs；磁鐵被拿走後撐 paperGraceMs；事件進行中的便條紙不會掉
  const unpinnedSince = useRef({});
  const fallingRef = useRef([]);
  const [falling, setFalling] = useState([]);
  const [fallTick, setFallTick] = useState(0);
  useEffect(() => {
    const now = Date.now();
    const ev = events.ev;
    const since = unpinnedSince.current;
    const papers = sized.filter((n) => n.def.mount === 'magnet' && n.state === 'placed');
    const due = [];
    let next = Infinity;
    for (const n of papers) {
      if (sized.some((m) => m.parentId === n.id)) {
        delete since[n.id];
        continue;
      }
      if (ev && ev.key === n.eventKey && ev.phase !== 'result') continue;
      if (fallingRef.current.includes(n.id)) continue;
      if (!since[n.id]) since[n.id] = now;
      const at = Math.max(n.holdUntil || 0, since[n.id] + ATTACH.paperGraceMs);
      if (at <= now) due.push(n.id);
      else next = Math.min(next, at);
    }
    for (const id of Object.keys(since)) if (!papers.some((n) => n.id === id)) delete since[id];
    if (due.length) {
      fallingRef.current = [...fallingRef.current, ...due];
      setFalling(fallingRef.current);
      sound.play('cancel');
      setTimeout(() => {
        dispatch({ type: 'removeMany', ids: due });
        fallingRef.current = fallingRef.current.filter((id) => !due.includes(id));
        setFalling(fallingRef.current);
      }, 650);
    }
    if (next < Infinity) {
      const t = setTimeout(() => setFallTick((x) => x + 1), next - now + 30);
      return () => clearTimeout(t);
    }
  }, [sized, events.ev, fallTick]);

  // ── 提示訊息 ──
  const [toast, setToast] = useState(null);
  const showToast = useCallback((text, ms = 2200) => setToast({ text, key: Date.now(), ms }), []);
  // 已經有佈置的玩家第一次進來，提示可以縮放（空的門由門上的提示文字說明）
  const startedEmpty = useRef(layout.items.length === 0);
  useEffect(() => {
    if (startedEmpty.current || loadJSON(STORAGE_KEYS.settings, {})?.zoomHint) return;
    const t = setTimeout(() => {
      showToast('雙指或雙擊門上空白處，可以放大／看整扇門', 3800);
      saveJSON(STORAGE_KEYS.settings, { ...loadJSON(STORAGE_KEYS.settings, {}), zoomHint: 1 });
    }, 900);
    return () => clearTimeout(t);
  }, [showToast]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.ms || 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // ── 保存 ──
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  useEffect(() => {
    const t = setTimeout(() => saveLayout(layout), 200);
    return () => clearTimeout(t);
  }, [layout]);
  useEffect(() => {
    const flush = () => saveLayout(layoutRef.current);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);
  useEffect(() => saveJSON(STORAGE_KEYS.progress, progress), [progress]);

  const setCfg = (next, reset) => {
    setCfgState(next);
    if (reset) removeKey(STORAGE_KEYS.devConfig);
    else saveJSON(STORAGE_KEYS.devConfig, { scene: next.scene, sizes: next.sizes });
  };

  const bumpSnap = useCallback((id) => setSnaps((s) => ({ ...s, [id]: (s[id] || 0) + 1 })), []);

  // ── 新增商品／生活小物 ──
  // 計算放置結果：{ x, y, patch, hook?, pocket? }、{ error } 或 null（不在門上）
  const planPlacement = (def, s, wx, wy, mode) => {
    const k = camApi.current;
    const pseudo = { id: '__new', def, w: s.w, h: s.h };
    if (def.mount === 'hang') {
      const free = freeHooks(sized);
      const hook =
        mode === 'drop'
          ? findHookFor(sized, pseudo, wx, wy, k.scale, cfg)
          : free.sort((a, b) => Math.hypot(a.x - wx, a.y - wy) - Math.hypot(b.x - wx, b.y - wy))[0];
      if (!hook) {
        if (!sized.some((i) => i.def.category === 'hook')) return { error: '門上還沒有掛鉤，先吸一個掛鉤吧！' };
        if (!free.length) return { error: '掛鉤都掛滿了，再加一個掛鉤吧！' };
        return mode === 'drop' ? null : { error: '把它拖到掛鉤上' };
      }
      const c = hangCenterOn(hook, pseudo);
      return { x: c.x, y: c.y, patch: { parentId: hook.id, state: 'attached' }, hook };
    }
    if (def.mount === 'pocket') {
      const free = freePockets(sized, pseudo);
      const r =
        mode === 'drop'
          ? findPocketFor(sized, pseudo, wx, wy, k.scale)
          : free.sort((a, b) => Math.hypot(a.pocket.x - wx, a.pocket.y - wy) - Math.hypot(b.pocket.x - wx, b.pocket.y - wy))[0];
      const need = def.fits ? `收納盒 ${fitsLabel(def)}` : '收納盒';
      if (!r) {
        const any = sized.some((i) => i.def.category === 'storage' && (!def.fits || def.fits.includes(i.def.sizeKey)));
        if (!any) return { error: def.fits ? `${def.name}要放進${need}，門上還沒有喔！` : '門上還沒有收納盒，先吸一個收納盒吧！' };
        if (!free.length) return { error: `${need}都放滿了（每個最多 2 件）` };
        return null;
      }
      if (r.wrong) return { error: `${def.name}要放進${need}`, pocket: r };
      if (r.full) return { error: '這個收納盒滿了（最多 2 件）', pocket: r };
      const c = pocketSlot(r.pocket, pseudo, r.slot);
      return { x: c.x, y: c.y, patch: { parentId: r.pocket.id, state: 'attached', slot: r.slot }, pocket: r };
    }
    if (def.mount === 'shelf') {
      const free = freeShelves(sized, pseudo, cfg);
      const r =
        mode === 'drop'
          ? findShelfFor(sized, pseudo, wx, wy, k.scale, cfg)
          : free.sort((a, b) => Math.hypot(a.mirror.x - wx, a.mirror.y - wy) - Math.hypot(b.mirror.x - wx, b.mirror.y - wy))[0];
      if (!r) {
        if (!sized.some((i) => i.def.category === 'mirror')) return { error: '門上還沒有鏡子，鏡子下方有置物槽喔！' };
        if (!free.length) return { error: '鏡子置物槽放滿了，再加一面鏡子吧！' };
        return null;
      }
      if (r.full) return { error: '這個置物槽放滿了', shelf: r };
      const c = mode === 'drop' ? r.spot : shelfSpot(sized, r.mirror, pseudo, cfg);
      return { x: c.x, y: c.y, patch: { parentId: r.mirror.id, state: 'attached', row: c.row }, shelf: r };
    }
    if (mode === 'drop' && !inRect(wx, wy, cfg.scene.doorZone, 30 / k.scale)) return null;
    const p = resolvePlacement(wx, wy, s.w, s.h, cfg.scene.doorZone, cfg.scene.forbidden);
    if (!p) return null;
    if (def.mount === 'magnet') return { ...p, patch: { state: 'placed', parentId: null, holdUntil: Date.now() + ATTACH.paperHoldMs } };
    let patch = { parentId: null };
    if (def.category === 'magnet') {
      const note = findPaperForMagnet(sized, p.x, p.y, k.scale);
      if (note) {
        p.x = clamp(p.x, note.x - note.w / 2 + s.w / 2, note.x + note.w / 2 - s.w / 2);
        p.y = clamp(p.y, note.y - note.h / 2 + s.h / 2, note.y + note.h / 2 - s.h / 2);
        patch = { parentId: note.id };
      }
    }
    if (def.category === 'hook') {
      const mp = hookMagnetPoint(p.x, p.y, s.w, s.h);
      const paper = findPaperForMagnet(sized, mp.x, mp.y, k.scale);
      if (paper) patch = { parentId: paper.id };
    }
    return { ...p, patch };
  };

  const addItem = (entry, plan) => {
    const def = defById(entry.id);
    const s = sizeOfDef(def, meta, cfg);
    const id = uid();
    const base =
      def.kind === 'product'
        ? { productId: def.id, category: def.category, colorId: def.colorId }
        : { objectId: def.id, category: 'object' };
    dispatch({
      type: 'add',
      item: {
        id,
        ...base,
        x: plan.x,
        y: plan.y,
        sizeCm: { w: +s.wCm.toFixed(2), h: +s.hCm.toFixed(2) },
        parentId: null,
        ...plan.patch,
        createdAt: Date.now(),
      },
    });
    bumpSnap(id);
    setSelectedId(id);
    sound.play('snap');
    if (def.mount === 'magnet') showToast('記得用小圓磁鐵把它固定住！');
  };

  // 點一下選單卡片 → 放到目前畫面中央附近（掛鉤／收納盒類會找最近的空位）
  const placeAtCenter = (entry) => {
    const def = defById(entry.id);
    const s = sizeOfDef(def, meta, cfg);
    const k = camApi.current;
    const z = cfg.scene.doorZone;
    const jitter = () => (Math.random() - 0.5) * 60;
    const x = clamp(k.cx + jitter(), z.x, z.x + z.w);
    const y = clamp(k.cy + jitter(), z.y, z.y + z.h);
    const plan = planPlacement(def, s, x, y, 'auto');
    if (!plan) return;
    if (plan.error) {
      showToast(plan.error);
      sound.play('cancel');
      return;
    }
    addItem(entry, plan);
  };

  // ── 從選單拖曳 ──
  const pending = useRef(null);
  const ghostCalc = (entry, clientX, clientY, touch) => {
    const k = camApi.current;
    const def = defById(entry.id);
    const s = sizeOfDef(def, meta, cfg);
    const sw = s.w * k.scale;
    const sh = s.h * k.scale;
    const small = Math.min(sw, sh) < 30;
    // 手指操作時把商品顯示在手指上方，避免被手指擋住
    const lift = touch ? (small ? cfg.scene.smallLift ?? 60 : Math.max(sh / 2 + 16, 40)) : 0;
    const gx = clientX;
    const gy = clientY - lift;
    const w = camApi.worldFromClient(gx, gy);
    const tr = trayRef.current?.getBoundingClientRect();
    const overTray = !!tr && clientY > tr.top;
    const plan = overTray ? null : planPlacement(def, s, w.x, w.y, 'drop');
    const ok = !!plan && !plan.error;
    const isPlaced = !['hang', 'pocket', 'shelf'].includes(def.mount);
    // 磁鐵（或掛鉤底座）會固定到哪張紙
    const pid = ok && plan.patch?.parentId;
    return {
      product: def,
      entry,
      fx: clientX,
      fy: clientY,
      touch,
      paper: pid && sized.find((i) => i.id === pid && i.def.mount === 'magnet') ? pid : null,
      gx,
      gy,
      sw,
      sh,
      small,
      hot: ok,
      plan,
      glow: isPlaced,
      target: ok && isPlaced ? { x: plan.x, y: plan.y, w: s.w, h: s.h } : null,
      hook: plan?.hook || null,
      pocket: plan?.pocket || null,
      shelf: plan?.shelf || null,
    };
  };
  const calcRef = useRef(ghostCalc);
  calcRef.current = ghostCalc;
  const addRef = useRef(addItem);
  addRef.current = addItem;
  const centerRef = useRef(placeAtCenter);
  centerRef.current = placeAtCenter;
  const toastRef = useRef(showToast);
  toastRef.current = showToast;

  // 手機上選單的左右滑動與往上拖曳都由遊戲自己判斷（.cards 設為 touch-action: none），
  // 避免手指一開始稍微往旁邊偏，瀏覽器就把手勢當成捲動而取消拖曳。
  const onCardPointerDown = (e, product) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    sound.unlock();
    const cards = trayRef.current?.querySelector('.cards');
    stopInertia();
    pending.current = {
      product,
      sx: e.clientX,
      sy: e.clientY,
      id: e.pointerId,
      touch: e.pointerType !== 'mouse',
      started: false,
      mode: null, // null | 'scroll' | 'drag'
      cards,
      scroll0: cards?.scrollLeft || 0,
      hist: [{ x: e.clientX, t: performance.now() }],
    };
  };

  // 放開後的慣性滑動
  const inertia = useRef(0);
  const stopInertia = () => cancelAnimationFrame(inertia.current);
  const startInertia = (el, v) => {
    let vel = v; // px / ms
    let last = performance.now();
    const step = (t) => {
      const dt = t - last;
      last = t;
      el.scrollLeft -= vel * dt;
      vel *= Math.pow(0.95, dt / 16);
      if (Math.abs(vel) > 0.02) inertia.current = requestAnimationFrame(step);
    };
    inertia.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const move = (e) => {
      const P = pending.current;
      if (!P || e.pointerId !== P.id) return;
      const dx = e.clientX - P.sx;
      const dy = e.clientY - P.sy;
      if (!P.started) {
        let start = false;
        if (!P.touch) start = Math.hypot(dx, dy) > 6;
        else if (P.mode === 'scroll') {
          // 已經在左右滑，但手指明顯往上 → 改成拖曳
          start = !!P.product && -dy > 30;
        } else if (Math.hypot(dx, dy) > 8) {
          // 往上的角度大於約 25° 就算拖曳，其餘當成左右滑動
          if (P.product && dy < 0 && -dy >= Math.abs(dx) * 0.45) start = true;
          else P.mode = 'scroll';
        }
        if (start) {
          P.started = true;
          P.mode = 'drag';
          sound.play('pick');
          setSelectedId(null);
        } else {
          if (P.mode === 'scroll' && P.cards) {
            P.cards.scrollLeft = P.scroll0 - dx;
            P.hist.push({ x: e.clientX, t: performance.now() });
            if (P.hist.length > 6) P.hist.shift();
          }
          return;
        }
      }
      if (e.cancelable) e.preventDefault();
      const g = calcRef.current(P.product, e.clientX, e.clientY, P.touch);
      setGhost(g);
      // 商品（手指上方的位置）停在畫面邊緣 → 鏡頭自動捲動
      P.lx = e.clientX;
      P.ly = e.clientY;
      camApi.edgePan(g.gx, g.gy, () => pending.current === P && setGhost(calcRef.current(P.product, P.lx, P.ly, P.touch)));
    };
    const up = (e) => {
      const P = pending.current;
      if (!P || e.pointerId !== P.id) return;
      pending.current = null;
      camApi.stopEdgePan();
      if (e.type === 'pointercancel') {
        setGhost(null);
        return;
      }
      if (P.mode === 'scroll') {
        const h = P.hist;
        const a0 = h[0];
        const a1 = h[h.length - 1];
        const dt = a1.t - a0.t;
        if (P.cards && dt > 0 && performance.now() - a1.t < 80) startInertia(P.cards, (a1.x - a0.x) / dt);
        return;
      }
      if (!P.started) {
        if (P.product) centerRef.current(P.product);
        return;
      }
      const g = calcRef.current(P.product, e.clientX, e.clientY, P.touch);
      setGhost(null);
      if (g.hot) addRef.current(P.product, g.plan);
      else {
        sound.play('cancel');
        if (g.plan?.error) toastRef.current(g.plan.error);
        else if (g.product.mount === 'hang') toastRef.current('要拖到掛鉤上才掛得住喔');
        else if (g.product.mount === 'pocket') toastRef.current('要拖進收納盒裡喔');
        else if (g.product.mount === 'shelf') toastRef.current('要放到鏡子下方的置物槽喔');
      }
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  // ── 標題連點 5 下開啟開發模式 ──
  const taps = useRef([]);
  const onTitleTap = () => {
    if (!APP.devModeEnabled) return;
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2000), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      setDevOpen(true);
    }
  };

  const doFinish = () => {
    if (layout.items.length > 0 && !progress.firstFinishedAt) {
      setProgress((p) => ({ ...p, firstFinishedAt: Date.now() }));
    }
    if (layout.items.length > 0) sound.play('success');
    // 「被大門選中的人」：門上至少 3 件時，每次完成有小機率抽中
    setLucky(layout.items.length >= 3 && Math.random() < LUCKY_CHANCE);
    setSelectedId(null);
    setModal('finish');
  };

  // 套用預設範本（取代目前門上的佈置）
  const applyTemplate = (t) => {
    dispatch({ type: 'load', layout: layoutFromTemplate(t) });
    setSelectedId(null);
    setModal(null);
    camApi.reset(); // 套用範本後回到開場的放大畫面
    setCelebrate(Date.now() + 1); // 與提示訊息的 key 錯開
    sound.play('success');
    showToast('範本套用好了！可以自己再加、移動或拿掉配件');
  };

  const clearAll = () => {
    Object.values(STORAGE_KEYS).forEach(removeKey);
    dispatch({ type: 'reset' });
    setProgress(emptyProgress());
    setCfgState(DEFAULT_CONFIG);
    setSelectedId(null);
  };

  return (
    <div className="app">
      <header className="topbar">
        <button className="title" onClick={onTitleTap}>
          <span className="brand">{APP.brand} · 2026 雙 11</span>
          <span className="name">{APP.title}</span>
        </button>
        <div className="top-actions">
          <button className="icon" onClick={() => setModal('rewards')} aria-label="雙 11 優惠資格">
            🎁<span>{rewardInfo.best ? 'NT$' + rewardInfo.best.amount : '優惠'}</span>
          </button>
          <button
            className="icon"
            onClick={() => {
              setBookTab('personas');
              setModal('eggs');
            }}
            aria-label="稱號圖鑑與彩蛋"
          >
            ★<span>圖鑑</span>
          </button>
          <button
            className="icon"
            aria-label={soundOn ? '關閉音效' : '開啟音效'}
            onClick={() => {
              sound.unlock();
              sound.setEnabled(!soundOn);
              setSoundOn(!soundOn);
            }}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      <main className="stage">
        <Scene
          viewportRef={viewportRef}
          cfg={cfg}
          sized={sized}
          meta={meta}
          cam={cam}
          camApi={camApi}
          dispatch={dispatch}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          trayRef={trayRef}
          trayHint={ghost && { hot: ghost.hot, target: ghost.target, hook: ghost.hook, pocket: ghost.pocket, shelf: ghost.shelf, glow: ghost.glow, paper: ghost.paper }}
          overlays={overlays}
          doorbellOn={doorbellOn || !!events.def?.doorbell}
          doorbellImg={events.def?.doorbellImg}
          onObjectTap={events.tapObject}
          snaps={snaps}
          bumpSnap={bumpSnap}
          onDraggingChange={setSceneDragging}
          onMirrorGroom={events.markGroomed}
          celebrate={celebrate}
          eggFx={{ duck: eggState.butterDuck, garland: eggState.perfect, rainbow }}
          falling={falling}
          toast={toast}
        >
          <EventLayer events={events} />
        </Scene>
      </main>

      <Tray
        ref={trayRef}
        category={category}
        setCategory={setCategory}
        meta={meta}
        onCardPointerDown={onCardPointerDown}
        onFinish={doFinish}
        onReset={() => setModal('reset')}
        onTemplates={() => setModal('templates')}
        armedId={ghost?.product.id}
      />

      {ghost && (
        <div className="ghost-layer">
          {ghost.small && ghost.touch && <AimLine fx={ghost.fx} fy={ghost.fy} x={ghost.gx} y={ghost.gy} />}
          <div
            className={'ghost' + (ghost.hot ? ' hot' : '')}
            style={{
              transform: `translate3d(${ghost.gx - ghost.sw / 2}px, ${ghost.gy - ghost.sh / 2}px, 0)`,
              width: ghost.sw,
              height: ghost.sh,
            }}
          >
            <div className="ghost-inner">
              <ProductImage product={ghost.product} meta={meta[ghost.product.id]} w={ghost.sw} h={ghost.sh} />
            </div>
            {ghost.small && !ghost.touch && <div className="ghost-ring" />}
          </div>
          {ghost.small && <Loupe product={ghost.product} meta={meta[ghost.product.id]} x={ghost.gx} y={ghost.gy - 52} />}
        </div>
      )}

      {showEgg && (
        <EggUnlock id={showEgg} total={Object.keys(progress.eggs || {}).length} onClose={closeEgg} />
      )}
      {modal === 'eggs' && (
        <EggsModal unlocked={progress.eggs} personas={progress.personas || {}} initialTab={bookTab} onClose={() => setModal(null)} />
      )}
      {modal === 'finish' && (
        <FinishView
          cfg={cfg}
          sized={sized}
          meta={meta}
          eggState={eggState}
          info={rewardInfo}
          count={sized.filter((i) => i.state !== 'loose' && i.def.mount !== 'static').length}
          progress={progress}
          lucky={lucky}
          onCollect={(ids) =>
            setProgress((p) => ({
              ...p,
              personas: { ...p.personas, ...Object.fromEntries(ids.filter((id) => !p.personas?.[id]).map((id) => [id, Date.now()])) },
            }))
          }
          onClose={() => setModal(null)}
          onBook={() => {
            setBookTab('personas');
            setModal('eggs');
          }}
          onRewards={() => setModal('rewards')}
        />
      )}
      {modal === 'rewards' && <RewardModal info={rewardInfo} onClose={() => setModal(null)} />}
      {showPersonaPop && <PersonaPop id={showPersonaPop} onClose={() => setPersonaPop(null)} />}
      {showReward && <RewardPop amount={showReward} info={rewardInfo} onClose={() => setRewardPop(null)} />}
      {modal === 'templates' && (
        <TemplateModal hasItems={layout.items.length > 0} onPick={applyTemplate} onClose={() => setModal(null)} />
      )}
      {modal === 'reset' && (
        <ConfirmModal
          title="重置佈置？"
          text="會移除門上所有配件，彩蛋與優惠紀錄會保留。"
          okLabel="重置"
          onClose={() => setModal(null)}
          onOk={() => {
            dispatch({ type: 'reset' });
            setSelectedId(null);
            sound.play('remove');
            setModal(null);
          }}
        />
      )}

      {devOpen && (
        <DevPanel
          cfg={cfg}
          setCfg={setCfg}
          overlays={overlays}
          setOverlays={setOverlays}
          doorbellOn={doorbellOn}
          setDoorbellOn={setDoorbellOn}
          onClearAll={clearAll}
          meta={meta}
          items={layout.items}
          events={events}
          progress={progress}
          eggState={eggState}
          onTestEgg={(id) => {
            setEggQueue((q) => [...q, id]);
            if (id === 'rainbow') setRainbow(Date.now());
          }}
          onResetEggs={() => setProgress((p) => ({ ...p, eggs: {} }))}
          rewardInfo={rewardInfo}
          personaPreview={matchPersonas(doorStats(sized, progress, cfg, false))}
          onTestReward={(amt) => setRewardPop(amt)}
          onResetRewards={() => setProgress((p) => ({ ...p, rewardShown: 0, reward: 0 }))}
          onClose={() => setDevOpen(false)}
        />
      )}
    </div>
  );
}
