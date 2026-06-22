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

export default function CalendarView({ records, onSelectDate }: Props) {
  const today = todayStr();
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

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

  return (
    <div className="calendar-view">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">
          {viewYear}年{viewMonth + 1}月
        </span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>

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

      {/* 凡例 */}
      <div className="cal-legend">
        <div className="cal-legend-item"><span className="cal-legend-dot pts-neg" />マイナス</div>
        <div className="cal-legend-item"><span className="cal-legend-dot pts-low" />〜14pt</div>
        <div className="cal-legend-item"><span className="cal-legend-dot pts-mid" />〜29pt</div>
        <div className="cal-legend-item"><span className="cal-legend-dot pts-high" />30pt〜</div>
      </div>
    </div>
  );
}
