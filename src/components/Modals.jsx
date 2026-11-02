import { useEffect, useState } from 'react';
import { PERSONAS, RARITIES } from '../config/personas.js';
import { EGGS, EGG_MAP } from '../config/eggs.js';
import { sound } from '../lib/sound.js';

export function Modal({ children, onClose }) {
  return (
    <div className="modal-back" onPointerDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal">{children}</div>
    </div>
  );
}

export function EggsModal({ unlocked = {}, personas = {}, initialTab = 'personas', onClose }) {
  const [tab, setTab] = useState(initialTab);
  const got = PERSONAS.filter((p) => personas[p.id]).length;
  const eggCount = EGGS.filter((e) => unlocked[e.id]).length;
  return (
    <Modal onClose={onClose}>
      <div className="book-tabs">
        <button className={tab === 'personas' ? 'on' : ''} onClick={() => setTab('personas')}>
          玄關稱號 {got}/{PERSONAS.length}
        </button>
        <button className={tab === 'eggs' ? 'on' : ''} onClick={() => setTab('eggs')}>
          隱藏彩蛋 {eggCount}/{EGGS.length}
        </button>
      </div>
      {tab === 'personas' ? (
        <>
          <p className="sub">按「完成佈置」鑑定玄關人格。換換配件、生活小物、擺法，說不定會抽到 SSS！</p>
          <div className="book">
            {Object.keys(RARITIES).map((r) => (
              <div key={r} className="book-group">
                <div className="book-head">
                  <span className={'rar rar-' + r}>{r}</span>
                  <small>
                    {RARITIES[r].name}・{PERSONAS.filter((p) => p.rarity === r && personas[p.id]).length}/
                    {PERSONAS.filter((p) => p.rarity === r).length}
                  </small>
                </div>
                {PERSONAS.filter((p) => p.rarity === r).map((p) => (
                  <div key={p.id} className={'book-item' + (personas[p.id] ? ' on' : '')}>
                    <b>{personas[p.id] ? p.title : '？？？'}</b>
                    {personas[p.id] && <span>{p.desc}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button className="primary wide" onClick={onClose}>
            繼續佈置
          </button>
        </>
      ) : (
        <EggTab unlocked={unlocked} onClose={onClose} />
      )}
    </Modal>
  );
}

function EggTab({ unlocked, onClose }) {
  return (
    <>
      <p className="sub">
        已解鎖 {EGGS.filter((e) => unlocked[e.id]).length} / {EGGS.length}
        <br />
        試試不同的配色與組合，說不定會有小驚喜。
      </p>
      <div className="eggs">
        {EGGS.map((e) => (
          <div key={e.id} className={'egg' + (unlocked[e.id] ? ' on' : '')}>
            <span>{unlocked[e.id] ? e.icon : '?'}</span>
            <small>{unlocked[e.id] ? e.title : '尚未解鎖'}</small>
          </div>
        ))}
      </div>
      {EGGS.some((e) => unlocked[e.id]) && (
        <ul className="egg-list">
          {EGGS.filter((e) => unlocked[e.id]).map((e) => (
            <li key={e.id}>
              <b>
                {e.icon} {e.title}
              </b>
              <span>{e.desc}</span>
            </li>
          ))}
        </ul>
      )}
      <button className="primary wide" onClick={onClose}>
        繼續佈置
      </button>
    </>
  );
}

// 首次解鎖的驚喜動畫
export function EggUnlock({ id, total, onClose }) {
  const egg = EGG_MAP[id];
  useEffect(() => {
    sound.play('egg');
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [id, onClose]);
  if (!egg) return null;
  return (
    <div className="egg-pop" onPointerDown={onClose}>
      <div className="egg-burst">
        {Array.from({ length: 12 }).map((_, i) => (
          <i key={i} style={{ transform: `rotate(${i * 30}deg)` }} />
        ))}
      </div>
      <div className="egg-card">
        <div className="egg-tag">隱藏彩蛋解鎖 {egg.no}</div>
        <div className="egg-icon">{egg.icon}</div>
        <h3>{egg.title}</h3>
        <p>{egg.desc}</p>
        <small>已收藏 {total} / {EGGS.length}・點一下繼續</small>
      </div>
    </div>
  );
}

export function ConfirmModal({ title, text, okLabel = '確定', onOk, onClose }) {
  return (
    <Modal onClose={onClose}>
      <h3>{title}</h3>
      {text && <p className="sub">{text}</p>}
      <div className="row">
        <button className="btn-line" onClick={onClose}>
          取消
        </button>
        <button className="primary" onClick={onOk}>
          {okLabel}
        </button>
      </div>
    </Modal>
  );
}
