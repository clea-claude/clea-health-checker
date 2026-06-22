import type { SeiriRecord } from '../types';
import { todayStr } from '../utils';
import './SeiriView.css';

interface Props {
  records: SeiriRecord[];
  onSave: (records: SeiriRecord[]) => void;
  onBack: () => void;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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
  const nextDate = latest && avgCycle
    ? addDays(latest.startDate, avgCycle)
    : null;
  const daysUntilNext = nextDate ? daysBetween(today, nextDate) : null;

  const handleStart = () => {
    // すでに今日が開始日なら何もしない
    if (latest?.startDate === today) return;
    // 前の記録が終わってない場合は自動で終了
    const updated = records.map(r =>
      !r.endDate ? { ...r, endDate: today } : r
    );
    onSave([...updated, { startDate: today }]);
  };

  const handleEnd = () => {
    if (!isOngoing) return;
    onSave(records.map(r =>
      r.startDate === latest.startDate ? { ...r, endDate: today } : r
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

      {/* ボタン */}
      <div className="seiri-btn-row">
        <button
          className="seiri-btn start"
          onClick={handleStart}
          disabled={latest?.startDate === today}
        >
          🩸 開始をきろく
        </button>
        <button
          className="seiri-btn end"
          onClick={handleEnd}
          disabled={!isOngoing || latest?.endDate === today}
        >
          ⭕ 終了をきろく
        </button>
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
