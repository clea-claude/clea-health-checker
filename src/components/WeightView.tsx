import { useState } from 'react';
import type { WeightRecord } from '../types';
import { todayStr } from '../utils';
import './WeightView.css';

interface Props {
  records: WeightRecord[];
  onSave: (records: WeightRecord[]) => void;
  onBack: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
}

export default function WeightView({ records, onSave, onBack }: Props) {
  const today = todayStr();
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const todayRec = records.find(r => r.date === today);

  const [inputWeight, setInputWeight] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const val = parseFloat(inputWeight);
    if (isNaN(val) || val < 20 || val > 300) return;
    const updated = records.filter(r => r.date !== today);
    onSave([...updated, { date: today, weight: val }]);
    setInputWeight('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = (date: string) => {
    onSave(records.filter(r => r.date !== date));
  };

  // 最小・最大・差分
  const weights = sorted.map(r => r.weight);
  const minW = weights.length ? Math.min(...weights) : null;
  const maxW = weights.length ? Math.max(...weights) : null;
  const diff = sorted.length >= 2 ? sorted[0].weight - sorted[1].weight : null;

  return (
    <div className="weight-view">
      <div className="today-header">
        <button className="back-btn" onClick={onBack}>← もどる</button>
        <h2 className="today-title">⚖️ 体重きろく</h2>
      </div>

      {/* 最新体重カード */}
      <div className="weight-main-card">
        {latest ? (
          <>
            <div className="weight-status-label">最新</div>
            <div className="weight-big-num">
              {latest.weight}<span className="weight-big-unit">kg</span>
            </div>
            <div className="weight-sub">{formatDate(latest.date)}</div>
            {diff !== null && (
              <div className={`weight-diff ${diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'}`}>
                前回比 {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}kg
              </div>
            )}
          </>
        ) : (
          <>
            <div className="weight-status-label">記録なし</div>
            <div className="weight-sub">体重をきろくしてね</div>
          </>
        )}
        {minW !== null && maxW !== null && sorted.length >= 2 && (
          <div className="weight-stats-row">
            <div className="weight-stat">
              <span className="weight-stat-label">最低</span>
              <span className="weight-stat-val">{minW}kg</span>
            </div>
            <div className="weight-stat">
              <span className="weight-stat-label">最高</span>
              <span className="weight-stat-val">{maxW}kg</span>
            </div>
          </div>
        )}
      </div>

      {/* 入力 */}
      <div className="weight-input-card">
        <div className="weight-input-label">
          {todayRec ? `今日の記録（${todayRec.weight}kg）を更新` : '今日の体重をきろく'}
        </div>
        <div className="weight-input-row">
          <input
            className="weight-input"
            type="number"
            step="0.1"
            min="20"
            max="300"
            placeholder="00.0"
            value={inputWeight}
            onChange={e => setInputWeight(e.target.value)}
          />
          <span className="weight-input-unit">kg</span>
          <button
            className="weight-save-btn"
            onClick={handleSave}
            disabled={!inputWeight}
          >
            {saved ? '✓ 保存！' : 'きろく'}
          </button>
        </div>
      </div>

      {/* 履歴 */}
      {sorted.length > 0 && (
        <div className="weight-history">
          <h3 className="weight-history-title">きろく一覧</h3>
          {sorted.map((rec, i) => {
            const prevRec = sorted[i + 1];
            const d = prevRec ? rec.weight - prevRec.weight : null;
            return (
              <div key={rec.date} className="weight-history-row">
                <div className="weight-history-date">{formatDate(rec.date)}</div>
                <div className="weight-history-right">
                  <span className="weight-history-val">{rec.weight}kg</span>
                  {d !== null && (
                    <span className={`weight-history-diff ${d > 0 ? 'up' : d < 0 ? 'down' : 'same'}`}>
                      {d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1)}
                    </span>
                  )}
                  <button className="seiri-delete-btn" onClick={() => handleDelete(rec.date)}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
