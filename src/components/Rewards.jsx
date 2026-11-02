import { useEffect, useState } from 'react';
import { REWARDS } from '../config/rewards.js';
import { minSpendText } from '../lib/rewards.js';
import { renderDoorImage, saveImage } from '../lib/exportImage.js';
import { sound } from '../lib/sound.js';
import { Modal } from './Modals.jsx';
import { pickCaption } from '../config/share.js';
import { doorStats, matchPersonas } from '../lib/personas.js';
import { PERSONAS } from '../config/personas.js';

// 折扣碼區塊：第一版不顯示假的折扣碼，也不顯示複製按鈕
function CodeBox({ tier }) {
  const [copied, setCopied] = useState(false);
  if (REWARDS.showCode && tier?.code) {
    return (
      <div className="rw-code">
        <b>{tier.code}</b>
        <button
          onClick={() =>
            navigator.clipboard
              ?.writeText(tier.code)
              .then(() => setCopied(true))
              .catch(() => {})
          }
        >
          {copied ? '已複製' : '複製'}
        </button>
      </div>
    );
  }
  return <div className="rw-pending">{REWARDS.pendingText}</div>;
}

function RewardTiers({ info }) {
  return (
    <ul className="rw-tiers">
      {info.tiers.map((t) => (
        <li key={t.id} className={t.done ? 'done' : ''}>
          <span className="rw-amt">NT${t.amount}</span>
          <span className="rw-cond">
            {t.condition}
            <i>
              <em style={{ width: (t.count / t.need) * 100 + '%' }} />
            </i>
          </span>
          <span className="rw-cnt">{t.done ? '✓' : `${t.count}/${t.need}`}</span>
        </li>
      ))}
    </ul>
  );
}

function RewardRules() {
  return (
    <p className="rw-rules">
      {REWARDS.startLabel}・{minSpendText()}
      <br />
      只取最高金額，不累加・{REWARDS.stackNote}
    </p>
  );
}

// 優惠進度
export function RewardModal({ info, onClose }) {
  return (
    <Modal onClose={onClose}>
      <h3>雙 11 優惠資格</h3>
      {info.best ? (
        <div className="rw-now">
          <small>目前最高</small>
          <b>NT${info.best.amount} 優惠</b>
          <CodeBox tier={info.best} />
        </div>
      ) : (
        <p className="sub">完成下面任一項，就能獲得 11/11 可使用的優惠資格。</p>
      )}
      <RewardTiers info={info} />
      <RewardRules />
      <button className="primary wide" onClick={onClose}>
        繼續佈置
      </button>
    </Modal>
  );
}

// 解鎖新的獎勵資格時的提示
export function RewardPop({ amount, info, onClose }) {
  useEffect(() => {
    sound.play('egg');
  }, [amount]);
  const tier = info.tiers.find((t) => t.amount === amount);
  return (
    <div className="egg-pop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="egg-card rw-pop">
        <div className="egg-tag">雙 11 優惠資格</div>
        <div className="rw-big">NT${amount}</div>
        <h3>恭喜解鎖 NT${amount} 優惠！</h3>
        <p>{REWARDS.startLabel}</p>
        <CodeBox tier={tier} />
        {info.next && (
          <small>
            再「{info.next.condition}」可升級到 NT${info.next.amount}
          </small>
        )}
        <p className="rw-rules">只取最高金額，不累加・{REWARDS.stackNote}</p>
        <button className="primary wide" onClick={onClose}>
          太好了
        </button>
      </div>
    </div>
  );
}

// 超稀有事件成功時頒發的稱號
export function PersonaPop({ id, onClose }) {
  const p = PERSONAS.find((x) => x.id === id);
  useEffect(() => {
    sound.play('egg');
  }, [id]);
  if (!p) return null;
  return (
    <div className="egg-pop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="egg-burst">
        {Array.from({ length: 12 }).map((_, i) => (
          <i key={i} style={{ transform: `rotate(${i * 30}deg)` }} />
        ))}
      </div>
      <div className="egg-card">
        <div className="egg-tag">獲得傳說稱號</div>
        <div style={{ margin: '10px 0 6px' }}>
          <RarityBadge rarity={p.rarity} />
        </div>
        <h3>{p.title}</h3>
        <p>{p.desc}</p>
        <small>已收進稱號圖鑑</small>
        <button className="primary wide" style={{ marginTop: 12 }} onClick={onClose}>
          太神了
        </button>
      </div>
    </div>
  );
}

export function RarityBadge({ rarity }) {
  return <span className={'rar rar-' + rarity}>{rarity}</span>;
}

// 完成佈置畫面：玄關人格＋作品圖片＋優惠資格
export function FinishView({ cfg, sized, meta, eggState, info, count, progress, lucky, onCollect, onClose, onBook, onRewards }) {
  const [img, setImg] = useState(null);
  const [blob, setBlob] = useState(null);
  const [msg, setMsg] = useState('');
  const [pi, setPi] = useState(0);
  // 打開時判定一次稱號（最稀有的排第一）
  // 新拿到的稱號排最前面，其次依稀有度
  const [personas] = useState(() => {
    const list = count > 0 ? matchPersonas(doorStats(sized, progress, cfg, lucky)) : [];
    const isNew = (p) => (progress.personas?.[p.id] ? 1 : 0);
    return list.map((p, i) => ({ p, i })).sort((a, b) => isNew(a.p) - isNew(b.p) || a.i - b.i).map((x) => x.p);
  });
  const [fresh] = useState(() => new Set(personas.filter((p) => !progress.personas?.[p.id]).map((p) => p.id)));
  useEffect(() => {
    if (personas.length) onCollect(personas.map((p) => p.id));
  }, []);
  const persona = personas[pi % Math.max(1, personas.length)] || null;
  const caption = pickCaption(eggState, 0);

  useEffect(() => {
    let alive = true;
    let url;
    renderDoorImage({ cfg, sized, meta, eggState, caption, persona }).then((b) => {
      if (!alive || !b) return;
      url = URL.createObjectURL(b);
      setBlob(b);
      setImg(url);
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [persona?.id]);

  const onSave = async () => {
    if (!blob) return;
    const r = await saveImage(blob);
    setMsg(
      r === 'shared'
        ? '可以存到相簿，或直接分享到 IG 限動 ♡'
        : r === 'downloaded'
          ? '圖片存好了！沒反應的話，長按圖片也能儲存'
          : r === 'cancelled'
            ? ''
            : '長按圖片就能儲存喔',
    );
  };

  return (
    <div className="finish">
      <div className="finish-inner">
        <div className="finish-head">
          <h2>{count > 0 ? '我的玄關，完成 ✦' : '大門還空空的'}</h2>
          <small>{count > 0 ? '存起來分享到 IG 限動，記得標記 @smooch_home' : '先吸幾件配件上去，再來鑑定玄關人格吧！'}</small>
        </div>
        {persona && (
          <div key={persona.id} className={'persona persona-' + persona.rarity}>
            <RarityBadge rarity={persona.rarity} />
            <div className="persona-text">
              <b>
                {persona.title}
                {fresh.has(persona.id) && <em>NEW</em>}
              </b>
              <span>{persona.desc}</span>
            </div>
            {personas.length > 1 && (
              <button onClick={() => setPi((i) => i + 1)}>
                換稱號
                <small>
                  {(pi % personas.length) + 1}/{personas.length}
                </small>
              </button>
            )}
          </div>
        )}
        <div className="finish-img">
          {img ? <img src={img} alt="我佈置的大門" /> : <div className="finish-loading">正在鑑定你的玄關人格…</div>}
        </div>
        {msg && <p className="finish-hint">{msg}</p>}
        <div className="finish-reward" onClick={onRewards}>
          {info.best ? (
            <>
              <b>已獲得 NT${info.best.amount} 優惠</b>
              <span>
                {REWARDS.startLabel}・{REWARDS.showCode && info.best.code ? '查看折扣碼' : REWARDS.pendingText}
              </span>
            </>
          ) : (
            <>
              <b>還沒有優惠資格</b>
              <span>放上配件後按「完成佈置」，就能拿到 NT$50 優惠</span>
            </>
          )}
          <i>›</i>
        </div>
        <div className="finish-actions">
          <button className="btn-line" onClick={onBook}>
            稱號圖鑑
          </button>
          <button className="btn-line" onClick={onSave} disabled={!blob || count === 0}>
            存圖分享
          </button>
        </div>
        <button className="primary wide" onClick={onClose}>
          繼續佈置
        </button>
      </div>
    </div>
  );
}
