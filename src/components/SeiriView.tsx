import { useState } from 'react';
import type { SeiriRecord } from '../types';
import { todayStr, calcNextPeriodDate } from '../utils';
import './SeiriView.css';

interface Props {
  records: SeiriRecord[];
  onSave: (records: SeiriRecord[]) => void;
  onBack: () => void;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
}

function calcAvgCycle(records: SeiriRecord[]): number | null {
  const starts = records.map(r => r.startDate).sort();
  if (starts.length < 2) return null;
  const diffs = starts.slice(1).map((s, i) => daysBetween(starts[i], s));
  return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
}

export default function SeiriView({ records, onSave, onBack }: Props) {
  const today = todayStr();
  const sorted = [...records].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const latest = sorted[0];
  const avgCycle = calcAvgCycle(records);

  const isOngoing = latest && !latest.endDate;
  const currentDay = isOngoing ? daysBetween(latest.startDate, today) + 1 : null;
  const nextDate = calcNextPeriodDate(records);
  const daysUntilNext = nextDate ? daysBetween(today, nextDate) : null;

  const [startInput, setStartInput] = useState(today);
  const [endInput, setEndInput] = useState(today);

  const handleStart = () => {
    if (!startInput) return;
    const updated = records.map(r =>
      !r.endDate ? { ...r, endDate: startInput } : r
    );
    onSave([...updated, { startDate: startInput }]);
  };

  const handleEnd = () => {
    if (!isOngoing || !endInput) return;
    onSave(records.map(r =>
      r.startDate === latest.startDate ? { ...r, endDate: endInput } : r
    ));
  };

  const handleDeleteLatest = () => {
    if (!latest) return;
    onSave(records.filter(r => r.startDate !== latest.startDate));
  };

  return (
    <div className="seiri-view">
      <div className="today-header">
        <button className="back-btn" onClick={onBack}>← もどる</button>
        <h2 className="today-title">🩸 生理きろく</h2>
      </div>

      {/* メインカード */}
      <div className="seiri-main-card">
        {isOngoing ? (
          <>
            <div className="seiri-status-label ongoing">生理中</div>
            <div className="seiri-big-num">{currentDay}<span className="seiri-big-unit">日目</span></div>
            <div className="seiri-sub">{formatDate(latest.startDate)} 開始</div>
          </>
        ) : nextDate ? (
          <>
            <div className="seiri-status-label">次回予想</div>
            <div className="seiri-big-num">
              {daysUntilNext !== null && daysUntilNext >= 0
                ? <>{daysUntilNext}<span className="seiri-big-unit">日後</span></>
                : <span className="seiri-big-unit">もうすぐ</span>}
            </div>
            <div className="seiri-sub">{formatDate(nextDate)} ごろ</div>
          </>
        ) : (
          <>
            <div className="seiri-status-label">記録なし</div>
            <div className="seiri-sub">開始日をきろくしてね</div>
          </>
        )}
        {avgCycle && (
          <div className="seiri-cycle-badge">平均周期 {avgCycle}日</div>
        )}
      </div>

      {/* 生理予定日（常に表示） */}
      <div style={{
        background: 'white', border: '1.5px solid #f0e0c8', borderRadius: 16,
        padding: '14px 20px', marginBottom: 12, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '0.9rem', color: '#9c7b6a' }}>🩸 生理予定日</span>
        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#c06080' }}>
          {nextDate ? `${formatDate(nextDate)} ごろ` : '—'}
        </span>
      </div>

      {/* 開始をきろく */}
      <div style={{
        background: 'white', border: '1.5px solid #f0e0c8', borderRadius: 16,
        padding: '16px', marginBottom: 10,
      }}>
        <div style={{ fontSize: '0.85rem', color: '#9c7b6a', marginBottom: 10 }}>🩸 開始日をきろく</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="date"
            value={startInput}
            max={today}
            onChange={e => setStartInput(e.target.value)}
            style={{
              flex: 1, padding: '10px 12px', border: '1.5px solid #f0e0c8',
              borderRadius: 12, fontSize: '0.95rem', fontFamily: 'inherit',
              color: '#5c4033', background: '#faf4ec',
            }}
          />
          <button className="seiri-btn start" style={{ margin: 0, flex: 'none' }} onClick={handleStart}>
            きろく
          </button>
        </div>
      </div>

      {/* 終了をきろく */}
      <div style={{
        background: 'white', border: '1.5px solid #f0e0c8', borderRadius: 16,
        padding: '16px', marginBottom: 12,
      }}>
        <div style={{ fontSize: '0.85rem', color: '#9c7b6a', marginBottom: 10 }}>⭕ 終了日をきろく</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="date"
            value={endInput}
            max={today}
            onChange={e => setEndInput(e.target.value)}
            style={{
              flex: 1, padding: '10px 12px', border: '1.5px solid #f0e0c8',
              borderRadius: 12, fontSize: '0.95rem', fontFamily: 'inherit',
              color: isOngoing ? '#5c4033' : '#c0a898', background: '#faf4ec',
            }}
            disabled={!isOngoing}
          />
          <button
            className="seiri-btn end"
            style={{ margin: 0, flex: 'none' }}
            onClick={handleEnd}
            disabled={!isOngoing}
          >
            きろく
          </button>
        </div>
      </div>

      {/* 周期リスト */}
      {sorted.length > 0 && (
        <div className="seiri-history">
          <h3 className="seiri-history-title">きろく一覧</h3>
          {sorted.map((rec, i) => {
            const duration = rec.endDate
              ? daysBetween(rec.startDate, rec.endDate) + 1
              : null;
            const cycle = i < sorted.length - 1
              ? daysBetween(sorted[i + 1].startDate, rec.startDate)
              : null;
            return (
              <div key={rec.startDate} className="seiri-history-row">
                <div className="seiri-history-dates">
                  <span className="seiri-history-start">{formatDate(rec.startDate)}</span>
                  {rec.endDate
                    ? <span className="seiri-history-end">〜 {formatDate(rec.endDate)}（{duration}日間）</span>
                    : <span className="seiri-history-ongoing">〜 きろく中</span>}
                </div>
                {cycle && <div className="seiri-history-cycle">周期 {cycle}日</div>}
                {i === 0 && (
                  <button className="seiri-delete-btn" onClick={handleDeleteLatest}>✕</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
