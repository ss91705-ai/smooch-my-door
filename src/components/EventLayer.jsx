import { assetUrl } from '../lib/core.js';

// 突發事件的介面：開場說明 → 倒數橫幅 → 成功／失敗
export default function EventLayer({ events }) {
  const { ev, def, remaining, start, skip } = events;
  if (!ev) return null;

  if (ev.phase === 'intro') {
    return (
      <div className="ev-back" onPointerDown={(e) => e.stopPropagation()}>
        <div className={'ev-card' + (def.rare ? ' rare' : '')}>
          <div className="ev-body">
          <div className="ev-no">{def.rare ? '★ 超稀有事件 ★' : `突發事件 ${def.no}`}</div>
          <h3>{def.title}</h3>
          {def.doorbell && (
            <div className="ev-screen">
              <img src={assetUrl(def.doorbellImg || 'assets/objects/friend.svg')} alt="門外的訪客" />
              <span>叮咚！</span>
            </div>
          )}
          {def.banner && <div className="ev-memo">{def.banner}</div>}
          <p className="ev-story">{def.story}</p>
          <ol className="ev-steps">
            {def.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {def.shortcut && <p className="ev-short">{def.shortcut}</p>}
          </div>
          <div className="ev-foot">
          <div className="ev-time">限時 {def.seconds} 秒</div>
          <div className="row">
            <button className="btn-line" onClick={skip}>
              稍後再說
            </button>
            <button className="primary" onClick={start}>
              開始挑戰
            </button>
          </div>
          </div>
        </div>
      </div>
    );
  }

  if (ev.phase === 'running') {
    const sec = Math.ceil(remaining);
    const pct = (remaining / def.seconds) * 100;
    return (
      <div className={'ev-banner' + (sec <= 3 ? ' urgent' : '')}>
        <div className="ev-count" key={sec}>
          {sec}
        </div>
        <div className="ev-btext">
          <b>{def.title}</b>
          <span>
            {def.hint}
            {def.taps ? `（${Math.min(ev.taps || 0, def.taps)}/${def.taps}）` : ''}
          </span>
        </div>
        <div className="ev-bar" style={{ width: pct + '%' }} />
      </div>
    );
  }

  return (
    <div className={'ev-result ' + ev.result}>
      <div className="ev-rcard">
        <div className="ev-ricon">{ev.result === 'success' ? '✓' : '…'}</div>
        <b>{ev.result === 'success' ? def.success : def.fail}</b>
        {ev.result === 'success' && ev.id === 'friend' && <small>朋友進門囉，歡迎歡迎！</small>}
      </div>
    </div>
  );
}
