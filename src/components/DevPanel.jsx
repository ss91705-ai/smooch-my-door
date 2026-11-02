import { useState } from 'react';
import { DEFAULT_CONFIG, pxPerCm, productSize } from '../lib/core.js';
import { DECO } from '../config/objects.js';
import { defById, sizeOfDef } from '../lib/catalog.js';
import { PRODUCTS, COLORS } from '../config/products.js';
import { REWARDS } from '../config/rewards.js';
import { EGGS } from '../config/eggs.js';
import { EVENTS } from '../config/events.js';

function Num({ label, value, onChange, step = 1, min, max }) {
  return (
    <label className="num">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : ''}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
    </label>
  );
}

function RectEditor({ title, rect, onChange, extra }) {
  return (
    <div className="rect">
      <div className="rect-title">
        {title}
        {extra}
      </div>
      <div className="grid4">
        {['x', 'y', 'w', 'h'].map((k) => (
          <Num key={k} label={k} value={rect[k]} onChange={(v) => onChange({ ...rect, [k]: v })} />
        ))}
      </div>
    </div>
  );
}

export default function DevPanel({ cfg, setCfg, overlays, setOverlays, doorbellOn, setDoorbellOn, onClearAll, meta, onClose, items, events, progress, eggState, onTestEgg, onResetEggs, rewardInfo, onTestReward, onResetRewards, personaPreview = [] }) {
  const [json, setJson] = useState(null);
  const [confirmClear, setConfirmClear] = useState(0);
  const s = cfg.scene;
  const setScene = (patch) => setCfg({ ...cfg, scene: { ...s, ...patch } });
  const setSize = (key, patch) => setCfg({ ...cfg, sizes: { ...cfg.sizes, [key]: { ...cfg.sizes[key], ...patch } } });

  const exportJSON = () => {
    const txt = JSON.stringify({ scene: cfg.scene, sizes: cfg.sizes }, null, 2);
    setJson(txt);
    navigator.clipboard?.writeText(txt).catch(() => {});
  };

  return (
    <div className="dev" onPointerDown={(e) => e.stopPropagation()}>
      <div className="dev-head">
        <b>開發測試模式</b>
        <button onClick={onClose}>關閉</button>
      </div>

      <section>
        <h4>顯示</h4>
        <label className="chk">
          <input type="checkbox" checked={overlays} onChange={(e) => setOverlays(e.target.checked)} />
          顯示門板／吸附區／禁放區／門鈴螢幕框線
        </label>
        <label className="chk">
          <input type="checkbox" checked={doorbellOn} onChange={(e) => setDoorbellOn(e.target.checked)} />
          測試門鈴螢幕亮起（對位用）
        </label>
      </section>

      <section>
        <h4>比例校準</h4>
        <Num
          label="大門實際寬度 (cm)"
          value={s.doorRealWidthCm}
          step={1}
          min={40}
          max={200}
          onChange={(v) => setScene({ doorRealWidthCm: v })}
        />
        <p className="mini">
          換算：1 cm = {pxPerCm(cfg).toFixed(2)} 場景 px ・ 門高約 {(s.doorLeaf.h / pxPerCm(cfg)).toFixed(0)} cm
        </p>
        <RectEditor title="門扇範圍（比例基準）" rect={s.doorLeaf} onChange={(r) => setScene({ doorLeaf: r })} />
        <RectEditor title="有效磁吸區域" rect={s.doorZone} onChange={(r) => setScene({ doorZone: r })} />
        {s.forbidden.map((f, i) => (
          <RectEditor
            key={f.id}
            title={'禁放區：' + f.label}
            rect={f}
            extra={
              <label className="chk inline">
                <input
                  type="checkbox"
                  checked={f.enabled !== false}
                  onChange={(e) => {
                    const list = s.forbidden.slice();
                    list[i] = { ...f, enabled: e.target.checked };
                    setScene({ forbidden: list });
                  }}
                />
                啟用
              </label>
            }
            onChange={(r) => {
              const list = s.forbidden.slice();
              list[i] = r;
              setScene({ forbidden: list });
            }}
          />
        ))}
        <RectEditor title="智慧門鈴螢幕位置" rect={s.doorbellScreen} onChange={(r) => setScene({ doorbellScreen: r })} />
      </section>

      <section>
        <h4>商品尺寸</h4>
        {Object.entries(cfg.sizes).map(([key, p]) => (
          <div key={key} className="rect">
            <div className="rect-title">{p.label}</div>
            <div className="grid4">
              <Num label="寬cm" step={0.1} value={p.widthCm} onChange={(v) => setSize(key, { widthCm: v })} />
              <Num label="高cm" step={0.1} value={p.heightCm} onChange={(v) => setSize(key, { heightCm: v })} />
              <Num label="視覺" step={0.01} value={p.visualScale} onChange={(v) => setSize(key, { visualScale: v })} />
              <label className="num">
                <span>換算</span>
                <select value={p.fit} onChange={(e) => setSize(key, { fit: e.target.value })}>
                  <option value="width">依寬</option>
                  <option value="height">依高</option>
                  <option value="contain">框內</option>
                </select>
              </label>
            </div>
          </div>
        ))}
        <table className="sizes">
          <thead>
            <tr>
              <th>商品</th>
              <th>圖片比例</th>
              <th>顯示 cm</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const m = meta[p.id];
              const z = productSize(p, m, cfg);
              const pending = p.pending || COLORS[p.colorId]?.pending;
              return (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{m?.aspect ? m.aspect.toFixed(3) : '…'}</td>
                  <td>
                    {z.wCm.toFixed(1)}×{z.hCm.toFixed(1)}
                  </td>
                  <td title={p.pending || ''}>{pending ? '待確認' : '✓'}</td>
                </tr>
              );
            })}
            {DECO.map((d) => {
              const z = sizeOfDef(defById(d.id), meta, cfg);
              return (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{meta[d.id]?.aspect ? meta[d.id].aspect.toFixed(3) : '…'}</td>
                  <td>
                    {z.wCm.toFixed(1)}×{z.hCm.toFixed(1)}
                  </td>
                  <td>小物</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mini">生活小物的尺寸在 src/config/objects.js 的 DECO 調整。</p>
      </section>

      <section>
        <h4>設定匯出</h4>
        <div className="row">
          <button onClick={exportJSON}>匯出設定 JSON</button>
          <button onClick={() => setCfg(DEFAULT_CONFIG, true)}>還原預設值</button>
        </div>
        {json && (
          <>
            <p className="mini">已複製。貼到 src/config/overrides.json 即成為正式預設值。</p>
            <textarea readOnly value={json} rows={8} onFocus={(e) => e.target.select()} />
          </>
        )}
      </section>

      <section>
        <h4>突發事件</h4>
        <div className="row">
          {EVENTS.map((e) => (
            <button key={e.id} disabled={!!events.ev} onClick={() => events.trigger(e.id)}>
              {e.no} {e.title}
            </button>
          ))}
        </div>
        <p className="mini">
          狀態：
          {events.ev
            ? `${events.def.title}｜${{ intro: '說明中', running: '倒數中', result: events.ev.result === 'success' ? '成功' : '失敗' }[events.ev.phase]}` +
              (events.remaining != null ? `｜剩 ${events.remaining.toFixed(1)} 秒` : '')
            : '自由裝飾中'}
        </p>
        <label className="chk">
          <input type="checkbox" checked={events.auto} onChange={(e) => events.setAuto(e.target.checked)} />
          自動觸發（約每 25～45 秒）{events.auto && !events.ev ? `・下次約 ${events.nextIn} 秒後` : ''}
        </label>
        <p className="mini">
          已完成：{EVENTS.filter((e) => progress.events?.[e.id]).map((e) => e.no).join('、') || '無'}（
          {Object.keys(progress.events || {}).length}/3 種可得 NT$80）
        </p>
      </section>

      <section>
        <h4>隱藏彩蛋</h4>
        <table className="sizes">
          <tbody>
            {EGGS.map((e) => (
              <tr key={e.id}>
                <td>
                  {e.no} {e.title}
                </td>
                <td>{eggState[e.id] ? '條件成立' : '—'}</td>
                <td>{progress.eggs?.[e.id] ? '已解鎖' : '未解鎖'}</td>
                <td>
                  <button onClick={() => onTestEgg(e.id)}>測試</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mini">「測試」只播放解鎖動畫，不會寫入紀錄。小鴨與神秘裝飾會在條件成立時出現在場景中。</p>
        <button onClick={onResetEggs}>重置彩蛋紀錄</button>
      </section>

      <section>
        <h4>玄關稱號（目前門上符合 {personaPreview.length} 個）</h4>
        <p className="mini">
          {personaPreview.map((p) => `${p.rarity} ${p.title}`).join('、') || '—'}
          <br />
          已收集 {Object.keys(progress.personas || {}).length} 個・稱號與條件在 src/config/personas.js
        </p>
      </section>

      <section>
        <h4>雙 11 優惠</h4>
        <table className="sizes">
          <tbody>
            {rewardInfo.tiers.map((t) => (
              <tr key={t.id}>
                <td>NT${t.amount}</td>
                <td>{t.condition}</td>
                <td>{t.done ? '已達成' : `${t.count}/${t.need}`}</td>
                <td>
                  <button onClick={() => onTestReward(t.amount)}>測試</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mini">
          目前最高：{rewardInfo.best ? 'NT$' + rewardInfo.best.amount : '無'}・顯示折扣碼：{REWARDS.showCode ? '是' : '否'}・開始日期
          {REWARDS.startDate}
          <br />
          金額、條件、日期、門檻、折扣碼都在 src/config/rewards.js。
        </p>
        <button onClick={onResetRewards}>重新顯示解鎖提示</button>
        <p className="mini">目前門上物件：{items.length} 件</p>
      </section>

      <section>
        <h4>清除全部紀錄</h4>
        {confirmClear === 0 && (
          <button className="danger" onClick={() => setConfirmClear(1)}>
            清除全部紀錄…
          </button>
        )}
        {confirmClear === 1 && (
          <div className="row">
            <span className="mini">會清掉佈置、進度與校準值，確定？</span>
            <button onClick={() => setConfirmClear(0)}>取消</button>
            <button
              className="danger"
              onClick={() => {
                onClearAll();
                setConfirmClear(0);
              }}
            >
              確定清除
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
