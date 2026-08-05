import { useState } from 'react';
import type { MaintenanceRecord } from '../types';
import { todayStr } from '../utils';

interface Props {
  records: MaintenanceRecord[];
  onSave: (records: MaintenanceRecord[]) => void;
  onBack: () => void;
}

const CATEGORIES = [
  { key: '整体',     emoji: '🦴' },
  { key: 'マッサージ', emoji: '💆‍♀️' },
  { key: 'エステ',   emoji: '✨' },
  { key: '美容院',   emoji: '💇‍♀️' },
  { key: 'その他',   emoji: '🌿' },
];

function catEmoji(category: string): string {
  return CATEGORIES.find(c => c.key === category)?.emoji ?? '🌿';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

export default function MaintenanceView({ records, onSave, onBack }: Props) {
  const today = todayStr();
  const [dateInput, setDateInput] = useState(today);
  const [category, setCategory] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [saved, setSaved] = useState(false);

  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  const handleSave = () => {
    if (!dateInput || !category) return;
    onSave([...records, { date: dateInput, category, memo: memo.trim() || undefined }]);
    setCategory('');
    setMemo('');
    setDateInput(today);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = (idx: number) => {
    const target = sorted[idx];
    const rest = [...records];
    const i = rest.findIndex(r => r.date === target.date && r.category === target.category && r.memo === target.memo);
    if (i >= 0) rest.splice(i, 1);
    onSave(rest);
  };

  // 今月・今年の回数
  const thisMonth = today.slice(0, 7);
  const thisYear = today.slice(0, 4);
  const monthCount = records.filter(r => r.date.startsWith(thisMonth)).length;
  const yearCount = records.filter(r => r.date.startsWith(thisYear)).length;

  return (
    <div className="weight-view">
      <div className="today-header">
        <button className="back-btn" onClick={onBack}>← もどる</button>
        <h2 className="today-title">💆‍♀️ メンテナンスDay</h2>
      </div>

      {/* サマリーカード */}
      <div className="weight-main-card" style={{ textAlign: 'center' }}>
        <div className="weight-status-label">じぶんメンテナンス</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#c49a6c', lineHeight: 1 }}>{monthCount}<span style={{ fontSize: '0.8rem' }}>回</span></div>
            <div style={{ fontSize: '0.75rem', color: '#9c7b6a', marginTop: 4 }}>今月</div>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#c49a6c', lineHeight: 1 }}>{yearCount}<span style={{ fontSize: '0.8rem' }}>回</span></div>
            <div style={{ fontSize: '0.75rem', color: '#9c7b6a', marginTop: 4 }}>今年</div>
          </div>
        </div>
      </div>

      {/* 入力 */}
      <div className="weight-input-card">
        <div className="weight-input-label">メンテナンスをきろく</div>

        <div style={{ fontSize: '0.8rem', color: '#9c7b6a', margin: '10px 0 6px' }}>日付</div>
        <input
          type="date"
          value={dateInput}
          max={today}
          onChange={e => setDateInput(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 12px',
            border: '1.5px solid #f0e0c8', borderRadius: 12,
            fontSize: '0.95rem', fontFamily: 'inherit', color: '#5c4033', background: '#faf4ec',
          }}
        />

        <div style={{ fontSize: '0.8rem', color: '#9c7b6a', margin: '12px 0 6px' }}>内容</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: category === c.key ? '#c49a6c' : '#faf4ec',
                color: category === c.key ? 'white' : '#9c7b6a',
                border: `1.5px solid ${category === c.key ? '#c49a6c' : '#f0e0c8'}`,
                borderRadius: 20, padding: '7px 12px',
                fontSize: '0.82rem', fontWeight: category === c.key ? 700 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <span>{c.emoji}</span><span>{c.key}</span>
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.8rem', color: '#9c7b6a', margin: '12px 0 6px' }}>詳細メモ（任意）</div>
        <input
          type="text"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="例：カット＆カラー、肩集中コース"
          maxLength={50}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 12px',
            border: '1.5px solid #f0e0c8', borderRadius: 12,
            fontSize: '0.95rem', fontFamily: 'inherit', color: '#5c4033', background: 'white',
          }}
        />

        <button
          className="weight-save-btn"
          style={{ width: '100%', padding: '14px', marginTop: 14 }}
          onClick={handleSave}
          disabled={!category || !dateInput}
        >
          {saved ? '✓ きろくしたよ！' : 'きろくする'}
        </button>
      </div>

      {/* 履歴 */}
      {sorted.length > 0 && (
        <div className="weight-history">
          <h3 className="weight-history-title">きろく一覧</h3>
          {sorted.map((rec, i) => (
            <div key={`${rec.date}-${i}`} className="weight-history-row">
              <span style={{ fontSize: '1.3rem', marginRight: 10 }}>{catEmoji(rec.category)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#5c4033' }}>
                  {rec.category}
                  {rec.memo && <span style={{ fontWeight: 400, color: '#9c7b6a' }}>｜{rec.memo}</span>}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9c7b6a' }}>{formatDate(rec.date)}</div>
              </div>
              <button className="seiri-delete-btn" onClick={() => handleDelete(i)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
