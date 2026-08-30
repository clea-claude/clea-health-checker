import type { DayRecord } from '../types';
import { calcPoints, getStreak } from '../utils';
import './PointsTrendChart.css';

interface Props {
  records: Record<string, DayRecord>;
  period: 'week' | 'month';
  dates: string[]; // 昇順（古い→今日）
}

const WEEKDAY = ['日', '月', '火', '水', '木', '金', '土'];

// ホームの「今週/今月」タップで開くポイント推移の棒グラフ（SVG自前描画）
export default function PointsTrendChart({ records, period, dates }: Props) {
  const series = dates.map(date => {
    const rec = records[date];
    return { date, pts: rec ? calcPoints(rec, getStreak(records, date)) : null };
  });

  const values = series.map(s => s.pts ?? 0);
  const maxV = Math.max(10, ...values);
  const minV = Math.min(0, ...values);

  const W = 320;
  const H = 150;
  const top = 16;
  const chartH = 100;
  const left = 10;
  const plotW = W - left * 2;
  const y = (v: number) => top + ((maxV - v) / (maxV - minV)) * chartH;
  const y0 = y(0);
  const slot = plotW / series.length;
  const barW = Math.min(26, slot * 0.62);

  const today = series[series.length - 1]?.date;
  const showValues = period === 'week';

  return (
    <div className="points-trend-card">
      <div className="points-trend-title">
        {period === 'week' ? '今週' : '今月'}のポイント推移
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="points-trend-svg" role="img" aria-label="ポイント推移グラフ">
        {/* 0ptの基準線 */}
        <line x1={left} y1={y0} x2={W - left} y2={y0} stroke="#e8d9c0" strokeWidth="1" />
        {series.map((s, i) => {
          const cx = left + slot * i + slot / 2;
          const day = Number(s.date.slice(8, 10));
          const showLabel = period === 'week' || day === 1 || day % 5 === 0;
          const label = period === 'week'
            ? WEEKDAY[new Date(s.date + 'T00:00:00').getDay()]
            : `${day}`;
          const v = s.pts;
          return (
            <g key={s.date}>
              {v !== null && v !== 0 && (
                <rect
                  x={cx - barW / 2}
                  y={v > 0 ? y(v) : y0}
                  width={barW}
                  height={Math.max(2, Math.abs(y(v) - y0))}
                  rx={Math.min(4, barW / 3)}
                  fill={v < 0 ? '#e8907a' : s.date === today ? '#a97c50' : '#d4b58c'}
                />
              )}
              {v === 0 && (
                <rect x={cx - barW / 2} y={y0 - 2} width={barW} height={2} rx={1} fill="#d4b58c" />
              )}
              {showValues && v !== null && (
                <text
                  x={cx}
                  y={v >= 0 ? y(v) - 4 : y(v) + 12}
                  textAnchor="middle"
                  className="points-trend-value"
                >{v}</text>
              )}
              {showLabel && (
                <text
                  x={cx}
                  y={top + chartH + 16}
                  textAnchor="middle"
                  className={`points-trend-label ${s.date === today ? 'today' : ''}`}
                >{label}</text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="points-trend-note">きろくがない日は棒が表示されません</div>
    </div>
  );
}
