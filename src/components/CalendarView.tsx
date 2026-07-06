import { useState } from 'react';
import type { DayRecord } from '../types';
import { todayStr, calcPoints, getStreak } from '../utils';
import './CalendarView.css';

interface Props {
  records: Record<string, DayRecord>;
  onSelectDate: (date: string) => void;
}

function pointsColorClass(pts: number): string {
  if (pts < 0)  return 'pts-neg';
  if (pts < 15) return 'pts-low';
  if (pts < 30) return 'pts-mid';
  return 'pts-high';
}

// フィルター可能な項目
interface FilterItem {
  key: string;
  label: string;
  emoji: string;
  done: (rec: DayRecord) => boolean;
}

const FILTER_ITEMS: FilterItem[] = [
  { key: 'haiBen',     label: 'お通じ',        emoji: '☘️', done: r => r.haiBen },
  { key: 'asaWalking', label: '朝ウォーキング', emoji: '🌅', done: r => r.asaWalking },
  { key: 'nichuUndou', label: '運動',          emoji: '🏃', done: r => r.nichuUndou },
  { key: 'snackNone',  label: 'おやつ我慢',    emoji: '💪', done: r => r.snack === 'none' },
  { key: 'sleep',      label: '睡眠7h以上',    emoji: '😴', done: r => r.sleepMinutes >= 7 * 60 },
];

export default function CalendarView({ records, onSelectDate }: Props) {
  const today = todayStr();
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [filterKey, setFilterKey] = useState<string | null>(null);

  const filter = FILTER_ITEMS.find(f => f.key === filterKey) ?? null;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // 月曜始まり
  const firstDaySun = new Date(viewYear, viewMonth, 1).getDay();
  const firstDay = (firstDaySun + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dateKey = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // フィルター中の達成日数カウント
  const doneCount = filter
    ? Array.from({ length: daysInMonth }, (_, i) => dateKey(i + 1))
        .filter(k => records[k] && filter.done(records[k]))
        .length
    : 0;

  return (
    <div className="calendar-view">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">
          {viewYear}年{viewMonth + 1}月
        </span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>

      {/* フィルターチップ */}
      <div className="cal-filter-row">
        {FILTER_ITEMS.map(item => (
          <button
            key={item.key}
            className={`cal-filter-chip ${filterKey === item.key ? 'active' : ''}`}
            onClick={() => setFilterKey(k => k === item.key ? null : item.key)}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* フィルター中の達成カウント */}
      {filter && (
        <div className="cal-filter-count">
          {filter.emoji} {filter.label}：<strong>{doneCount}</strong> / {daysInMonth} 日
        </div>
      )}

      <div className="cal-grid">
        {['月','火','水','木','金','土','日'].map(d => (
          <div key={d} className={`cal-weekday ${d === '日' ? 'sun' : d === '土' ? 'sat' : ''}`}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const key = dateKey(day);
          const rec = records[key];
          const isToday = key === today;
          const isFuture = key > today;

          if (filter) {
            // フィルターモード：達成日だけアイコン表示
            const isDone = rec ? filter.done(rec) : false;
            return (
              <button
                key={key}
                className={`cal-day ${isDone ? 'filter-done' : ''} ${isToday ? 'is-today' : ''} ${isFuture ? 'future' : ''}`}
                onClick={() => !isFuture && onSelectDate(key)}
                disabled={isFuture}
              >
                <span className="cal-day-num">{day}</span>
                {isDone && <span className="cal-day-icon">{filter.emoji}</span>}
              </button>
            );
          }

          // 通常モード：ポイント色分け
          const pts = rec ? calcPoints(rec, getStreak(records, key)) : null;
          const colorClass = pts !== null ? pointsColorClass(pts) : '';
          return (
            <button
              key={key}
              className={`cal-day ${colorClass} ${isToday ? 'is-today' : ''} ${isFuture ? 'future' : ''}`}
              onClick={() => !isFuture && onSelectDate(key)}
              disabled={isFuture}
            >
              <span className="cal-day-num">{day}</span>
            </button>
          );
        })}
      </div>

      {/* 凡例（通常モードのみ） */}
      {!filter && (
        <div className="cal-legend">
          <div className="cal-legend-item"><span className="cal-legend-dot pts-neg" />マイナス</div>
          <div className="cal-legend-item"><span className="cal-legend-dot pts-low" />〜14pt</div>
          <div className="cal-legend-item"><span className="cal-legend-dot pts-mid" />〜29pt</div>
          <div className="cal-legend-item"><span className="cal-legend-dot pts-high" />30pt〜</div>
        </div>
      )}
    </div>
  );
}
