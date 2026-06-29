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
  const [comment, setComment] = useState<{ diff: number | null; weight: number } | null>(null);

  const getComment = (diff: number | null, weight: number): string => {
    if (diff === null) return `${weight}kg、記録したよ！これからの変化を一緒に見ていこう🐾`;
    if (diff < -1.0) return `${Math.abs(diff).toFixed(1)}kgも減ってる！すごい調子いいね！🎉`;
    if (diff < -0.5) return `${Math.abs(diff).toFixed(1)}kg減ったよ！いい感じ、この調子！✨`;
    if (diff < 0) return `少し減ったね👏 コツコツ続けよう！`;
    if (diff === 0) return `先週と同じ体重だよ⚖️ 現状維持もすごいこと！`;
    if (diff <= 0.5) return `少し増えたけど気にしない！今週もがんばろ🌿`;
    if (diff <= 1.0) return `増えちゃったけど大丈夫！睡眠と食事を意識してみてね💪`;
    return `体重が増えたね。焦らず一歩ずつ！エマが応援してるよ🐾`;
  };

  const handleSave = () => {
    const val = parseFloat(inputWeight);
    if (isNaN(val) || val < 20 || val > 300) return;
    const prevSorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    const prev = prevSorted.find(r => r.date !== today);
    const diff = prev ? Math.round((val - prev.weight) * 10) / 10 : null;
    const updated = records.filter(r => r.date !== today);
    onSave([...updated, { date: today, weight: val }]);
    setInputWeight('');
    setComment({ diff, weight: val });
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
            きろく
          </button>
        </div>
      </div>

      {/* 保存後コメントポップアップ */}
      {comment && (
        <div className="points-overlay" onClick={() => setComment(null)}>
          <div className="points-popup" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚖️</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#5c4033', marginBottom: 12 }}>
              {comment.weight}kg きろくしたよ！
            </div>
            {comment.diff !== null && (
              <div style={{
                fontSize: '1rem', fontWeight: 700, marginBottom: 16,
                color: comment.diff < 0 ? '#7dbf8e' : comment.diff > 0 ? '#e8907a' : '#9c7b6a',
              }}>
                前回比 {comment.diff > 0 ? `+${comment.diff.toFixed(1)}` : comment.diff.toFixed(1)}kg
              </div>
            )}
            <div style={{
              background: '#faf4ec', borderRadius: 16, padding: '14px 18px',
              fontSize: '0.95rem', color: '#5c4033', lineHeight: 1.6, marginBottom: 20,
            }}>
              {getComment(comment.diff, comment.weight)}
            </div>
            <button className="points-confirm-btn" onClick={() => setComment(null)}>
              とじる
            </button>
          </div>
        </div>
      )}

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
