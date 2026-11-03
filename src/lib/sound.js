// 以 Web Audio 即時合成的小音效（不需要音檔，也遵守手機自動播放限制：
// 只有在使用者第一次觸碰畫面後才會建立 AudioContext）
import { STORAGE_KEYS } from '../config/app.js';
import { loadJSON, saveJSON } from './core.js';

let ctx = null;
let enabled = loadJSON(STORAGE_KEYS.settings, {}).sound !== false;

export const sound = {
  get enabled() {
    return enabled;
  },
  setEnabled(v) {
    enabled = v;
    saveJSON(STORAGE_KEYS.settings, { ...loadJSON(STORAGE_KEYS.settings, {}), sound: v });
  },
    unlock,
  play(name) {
    if (!enabled) return;
    unlock();
    if (!ctx) return;
    const run = () => {
      try {
        SOUNDS[name]?.(ctx);
      } catch {
        /* ignore */
      }
    };
    // 音效還在啟用中（iPhone 第一次操作時）→ 啟用完成後再播，不會漏掉
    if (ctx.state === 'running') run();
    else ctx.resume?.().then(run, () => {});
  },
};

// 建立並喚醒 AudioContext。iPhone Safari 只在「手指放開／點擊」這類操作中允許喚醒，
// 所以除了按下，也在放開、點擊、按鍵時都試一次，並播放一段無聲音訊完成解鎖。
function unlock() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state !== 'running') {
      ctx.resume?.();
      const b = ctx.createBuffer(1, 1, 22050);
      const s = ctx.createBufferSource();
      s.buffer = b;
      s.connect(ctx.destination);
      s.start(0);
    }
  } catch {
    ctx = null;
  }
}

if (typeof window !== 'undefined') {
  const events = ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click', 'keydown'];
  const handler = () => {
    unlock();
    if (ctx?.state === 'running') events.forEach((ev) => window.removeEventListener(ev, handler, true));
  };
  events.forEach((ev) => window.addEventListener(ev, handler, { capture: true, passive: true }));
  // 從背景回到網頁時（例如切換 App 回來），iPhone 會暫停音效，再喚醒一次
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running') {
      events.forEach((ev) => window.addEventListener(ev, handler, { capture: true, passive: true }));
    }
  });
}

function tone(c, { f0, f1, dur, type = 'sine', vol = 0.3, delay = 0 }) {
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function click(c, { vol = 0.25, dur = 0.03, hp = 1800 } = {}) {
  const t = c.currentTime;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = c.createGain();
  g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination);
  s.start(t);
}

const SOUNDS = {
  // 磁吸「啪！」
  snap(c) {
    click(c, { vol: 0.5, dur: 0.035, hp: 1200 });
    tone(c, { f0: 220, f1: 70, dur: 0.12, vol: 0.45 });
  },
  pick(c) {
    tone(c, { f0: 520, f1: 700, dur: 0.06, vol: 0.08 });
  },
  remove(c) {
    tone(c, { f0: 500, f1: 180, dur: 0.16, vol: 0.12, type: 'triangle' });
  },
  cancel(c) {
    tone(c, { f0: 300, f1: 220, dur: 0.1, vol: 0.06, type: 'triangle' });
  },
  shine(c) {
    tone(c, { f0: 1320, dur: 0.18, vol: 0.06, type: 'triangle' });
    tone(c, { f0: 1760, dur: 0.22, vol: 0.05, type: 'triangle', delay: 0.07 });
  },
  dingdong(c) {
    tone(c, { f0: 659, dur: 0.9, vol: 0.18, type: 'triangle' });
    tone(c, { f0: 523, dur: 1.2, vol: 0.18, type: 'triangle', delay: 0.45 });
  },
  tick(c) {
    tone(c, { f0: 880, dur: 0.07, vol: 0.12, type: 'square' });
  },
  alert(c) {
    tone(c, { f0: 740, dur: 0.12, vol: 0.08, type: 'triangle' });
    tone(c, { f0: 988, dur: 0.16, vol: 0.08, type: 'triangle', delay: 0.1 });
  },
  fail(c) {
    tone(c, { f0: 392, f1: 330, dur: 0.22, vol: 0.1, type: 'triangle' });
    tone(c, { f0: 330, f1: 262, dur: 0.3, vol: 0.1, type: 'triangle', delay: 0.2 });
  },
  egg(c) {
    [784, 988, 1175, 1568].forEach((f, i) => tone(c, { f0: f, dur: 0.3, vol: 0.08, type: 'triangle', delay: i * 0.09 }));
    tone(c, { f0: 2093, dur: 0.5, vol: 0.04, type: 'sine', delay: 0.4 });
  },
  success(c) {
    [523, 659, 784].forEach((f, i) => tone(c, { f0: f, dur: 0.22, vol: 0.1, type: 'triangle', delay: i * 0.08 }));
  },
};
