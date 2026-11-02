import { useCallback, useEffect, useRef, useState } from 'react';
import { EVENTS, EVENT_MAP, EVENT_SETTINGS } from '../config/events.js';
import { SPAWN } from '../config/objects.js';
import { clamp, inRect, uid } from './core.js';
import { sound } from './sound.js';

const rand = ([a, b]) => a + Math.random() * (b - a);

// 事件是否已經「真的完成」：全部依照門上物件的實際狀態判定
function isDone(ev, sized, cfg) {
  const byId = Object.fromEntries(sized.map((i) => [i.id, i]));
  const mine = (oid) => sized.filter((i) => i.objectId === oid && i.eventKey === ev.key);
  switch (ev.id) {
    case 'bag':
      return mine('obj-bag').some((b) => byId[b.parentId]?.def.category === 'hook');
    case 'friend':
      return !!ev.groomed && sized.some((i) => i.def.category === 'mirror');
    case 'note':
      return mine('obj-note').some(
        (n) =>
          n.state === 'placed' &&
          inRect(n.x, n.y, cfg.scene.doorZone) &&
          sized.some((m) => m.parentId === n.id && m.def.category === 'magnet'),
      );
    case 'remote':
      return mine('obj-remote').some((r) => byId[r.parentId]?.def.category === 'storage');
    case 'delivery':
      return mine('obj-delivery').some((r) => byId[r.parentId]?.def.category === 'hook');
    case 'cat':
      return (ev.taps || 0) >= (EVENT_MAP.cat.taps || 3);
    default:
      return false;
  }
}

export function useEvents({ sized, cfg, dispatch, camApi, setCategory, busy, onSuccess }) {
  const [ev, setEv] = useState(null); // { id, key, phase: intro|running|result, endsAt, result, groomed }
  const [now, setNow] = useState(Date.now());
  const [auto, setAuto] = useState(EVENT_SETTINGS.autoTrigger);
  const last = useRef(null);
  const elapsed = useRef(0);
  const nextAt = useRef(rand(EVENT_SETTINGS.firstDelaySec));
  const lastInput = useRef(0);
  const [nextIn, setNextIn] = useState(Math.round(nextAt.current));
  const lastTick = useRef(null);

  const evRef = useRef(ev);
  evRef.current = ev;
  const sizedRef = useRef(sized);
  sizedRef.current = sized;

  const resetSchedule = (range = EVENT_SETTINGS.intervalSec) => {
    elapsed.current = 0;
    nextAt.current = rand(range);
  };

  // 記錄最後一次觸控／點擊，玩家正在操作時不跳出事件
  useEffect(() => {
    const mark = () => (lastInput.current = Date.now());
    window.addEventListener('pointerdown', mark, true);
    window.addEventListener('pointermove', mark, true);
    window.addEventListener('wheel', mark, true);
    return () => {
      window.removeEventListener('pointerdown', mark, true);
      window.removeEventListener('pointermove', mark, true);
      window.removeEventListener('wheel', mark, true);
    };
  }, []);

  const trigger = useCallback((id) => {
    if (evRef.current) return;
    // 一般事件隨機挑；有小機率改成超稀有事件
    const rare = EVENTS.filter((e) => e.rare && e.id !== last.current);
    const normal = EVENTS.filter((e) => !e.rare && e.id !== last.current);
    const pool = rare.length && Math.random() < EVENT_SETTINGS.rareChance ? rare : normal;
    const def = id ? EVENT_MAP[id] : pool[Math.floor(Math.random() * pool.length)];
    last.current = def.id;
    setEv({ id: def.id, key: uid(), phase: 'intro' });
    sound.play(def.doorbell ? 'dingdong' : def.rare ? 'egg' : 'alert');
  }, []);

  const skip = () => {
    setEv(null);
    resetSchedule(EVENT_SETTINGS.afterSkipSec);
  };

  const start = () => {
    const e = evRef.current;
    if (!e || e.phase !== 'intro') return;
    const def = EVENT_MAP[e.id];
    setCategory(def.tab);
    const z = cfg.scene.doorZone;
    if (def.zoom) camApi.zoomTo(def.zoom, null, { x: z.x + z.w / 2, y: z.y + z.h * 0.3 });
    else camApi.reset();
    setEv({ ...e, phase: 'running', endsAt: Date.now() + def.seconds * 1000 });
    lastTick.current = null;
    if (def.spawn) {
      // 等鏡頭更新後，把物件放在畫面看得到的地方
      setTimeout(() => {
        const k = camApi.current;
        const sp = SPAWN[def.spawn];
        const m = 70 / k.scale;
        const x0 = -k.tx / k.scale;
        const y0 = -k.ty / k.scale;
        const x1 = (k.size.w - k.tx) / k.scale;
        const y1 = (k.size.h - k.ty) / k.scale;
        dispatch({
          type: 'add',
          item: {
            id: uid(),
            objectId: 'obj-' + def.spawn,
            category: 'object',
            x: clamp(sp.x, x0 + m, x1 - m),
            y: clamp(sp.y, y0 + m, y1 - m),
            state: 'loose',
            parentId: null,
            eventKey: e.key,
            createdAt: Date.now(),
          },
        });
      }, 60);
    }
  };

  // 點到事件中的靜態物件（例如貓咪）
  const tapObject = (item) => {
    const e = evRef.current;
    if (e?.phase !== 'running' || item.eventKey !== e.key) return false;
    if (item.objectId === 'obj-cat') {
      setEv({ ...e, taps: (e.taps || 0) + 1 });
      sound.play('pick');
      return true;
    }
    return false;
  };

  const markGroomed = () => {
    const e = evRef.current;
    if (e?.phase === 'running' && e.id === 'friend') setEv({ ...e, groomed: true });
  };

  const finish = useCallback(
    (result) => {
      const e = evRef.current;
      if (!e || e.phase !== 'running') return;
      setEv({ ...e, phase: 'result', result });
      sound.play(result === 'success' ? 'success' : 'fail');
      if (result === 'success') onSuccess?.(e.id);
    },
    [onSuccess],
  );

  // 成功判定
  useEffect(() => {
    if (ev?.phase === 'running' && isDone(ev, sized, cfg)) finish('success');
  }, [ev, sized, cfg, finish]);

  // 倒數
  useEffect(() => {
    if (ev?.phase !== 'running') return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const left = Math.ceil((evRef.current.endsAt - n) / 1000);
      if (left <= 3 && left > 0 && lastTick.current !== left) {
        lastTick.current = left;
        sound.play('tick');
      }
      if (n >= evRef.current.endsAt) finish('fail');
    }, 100);
    return () => clearInterval(t);
  }, [ev?.phase, finish]);

  // 結果顯示後：清掉沒有放好的事件物件，回到自由裝飾
  useEffect(() => {
    if (ev?.phase !== 'result') return;
    const t = setTimeout(() => {
      const list = sizedRef.current;
      const byId = Object.fromEntries(list.map((i) => [i.id, i]));
      const junk = list
        .filter((i) => i.eventKey === ev.key)
        .filter((i) => {
          if (i.state === 'loose') return true;
          const m = i.def.mount;
          if (m === 'hang') return byId[i.parentId]?.def.category !== 'hook';
          if (m === 'pocket') return byId[i.parentId]?.def.category !== 'storage';
          if (m === 'magnet') return !list.some((c) => c.parentId === i.id);
          if (m === 'static') return true;
          return false;
        })
        .map((i) => i.id);
      if (junk.length) dispatch({ type: 'removeMany', ids: junk });
      setEv(null);
      resetSchedule();
    }, EVENT_SETTINGS.resultMs);
    return () => clearTimeout(t);
  }, [ev?.phase, ev?.key, dispatch]);

  // 自動觸發：約每 45～90 秒；拖曳中、開著視窗時不打斷
  const busyRef = useRef(busy);
  busyRef.current = busy;
  useEffect(() => {
    const t = setInterval(() => {
      if (!auto || evRef.current || busyRef.current || document.visibilityState !== 'visible') return;
      elapsed.current += 1;
      setNextIn(Math.max(0, Math.round(nextAt.current - elapsed.current)));
      if (elapsed.current >= nextAt.current && Date.now() - lastInput.current >= EVENT_SETTINGS.quietMs) trigger();
    }, 1000);
    return () => clearInterval(t);
  }, [auto, trigger]);

  const remaining = ev?.phase === 'running' ? Math.max(0, (ev.endsAt - now) / 1000) : null;
  return { ev, def: ev && EVENT_MAP[ev.id], remaining, trigger, start, skip, markGroomed, tapObject, auto, setAuto, nextIn };
}
