import type { DayRecord, WeightRecord } from '../types';
import { calcPoints, getStreak } from '../utils';

interface Props {
  records: Record<string, DayRecord>;
  weightRecords: WeightRecord[];
  onBack: () => void;
}

interface MonthSummary {
  yearMonth: string; // "2026-06"
  label: string;     // "2026年6月"
  totalPoints: number;
  minWeight: number | null;
}

function buildMonthSummaries(
  records: Record<string, DayRecord>,
  weightRecords: WeightRecord[],
  currentYearMonth: string
): MonthSummary[] {
  const monthMap = new Map<string, { points: number; weights: number[] }>();

  Object.keys(records).forEach(date => {
    const ym = date.slice(0, 7);
    if (ym === currentYearMonth) return; // 今月は除く
    if (!monthMap.has(ym)) monthMap.set(ym, { points: 0, weights: [] });
    const rec = records[date];
    const streak = getStreak(records, date);
    monthMap.get(ym)!.points += calcPoints(rec, streak);
  });

  weightRecords.forEach(wr => {
    const ym = wr.date.slice(0, 7);
    if (ym === currentYearMonth) return;
    if (!monthMap.has(ym)) monthMap.set(ym, { points: 0, weights: [] });
    monthMap.get(ym)!.weights.push(wr.weight);
  });

  return Array.from(monthMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([ym, data]) => {
      const [y, m] = ym.split('-');
      return {
        yearMonth: ym,
        label: `${y}年${parseInt(m)}月`,
        totalPoints: data.points,
        minWeight: data.weights.length ? Math.min(...data.weights) : null,
      };
    });
}

export default function HistoryView({ records, weightRecords, onBack }: Props) {
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const summaries = buildMonthSummaries(records, weightRecords, currentYM);

  return (
    <div className="weight-view">
      <div className="today-header">
        <button className="back-btn" onClick={onBack}>← もどる</button>
        <h2 className="today-title">📊 月別履歴</h2>
      </div>

      {summaries.length === 0 ? (
        <div className="weight-main-card" style={{ textAlign: 'center' }}>
          <div className="weight-sub">まだ過去の記録がありません</div>
        </div>
      ) : (
        <div className="weight-history">
          <h3 className="weight-history-title">月ごとのまとめ</h3>
          {summaries.map(s => (
            <div key={s.yearMonth} className="weight-history-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#5c4033' }}>{s.label}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: '#9c7b6a' }}>
                  ポイント合計：
                  <span style={{ fontWeight: 700, color: s.totalPoints >= 0 ? '#c49a6c' : '#e8907a' }}>
                    {s.totalPoints >= 0 ? `+${s.totalPoints}` : s.totalPoints}pt
                  </span>
                </span>
                {s.minWeight !== null && (
                  <span style={{ fontSize: '0.85rem', color: '#9c7b6a' }}>
                    最軽体重：
                    <span style={{ fontWeight: 700, color: '#c49a6c' }}>{s.minWeight}kg</span>
                  </span>
                )}
                {s.minWeight === null && (
                  <span style={{ fontSize: '0.85rem', color: '#b0967e' }}>体重記録なし</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
