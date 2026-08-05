import { useState } from 'react';
import type { DayRecord, SeiriRecord, MaintenanceRecord } from '../types';
import { todayStr, calcPoints, getStreak, calcNextPeriodDate } from '../utils';
import './CalendarView.css';

interface Props {
  records: Record<string, DayRecord>;
  seiriRecords: SeiriRecord[];
  maintenanceRecords: MaintenanceRecord[];
  onSelectDate: (date: string) => void;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 生理予定日から排卵日・妊娠可能期間のマーカーを作る
// 排卵日 ≒ 生理予定日の14日前（一般的な目安）
// 直近データから将来の周期をずっと先まで繰り返し予測する
// （生理が実際に記録されると平均周期が更新され、予測も自動で修正される）
type CycleMarker = 'period' | 'ovu-high' | 'ovu-mid' | 'ovu-low';

function buildCycleMarkers(seiriRecords: SeiriRecord[]): Record<string, CycleMarker> {
  const next = calcNextPeriodDate(seiriRecords);
  if (!next) return {};

  // 平均周期を計算（calcNextPeriodDateと同じロジック）
  const starts = seiriRecords.map(r => r.startDate).sort();
  const diffs = starts.slice(1).map((s, i) =>
    Math.round((new Date(s).getTime() - new Date(starts[i]).getTime()) / 86400000));
  const avg = Math.max(10, Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length));

  const markers: Record<string, CycleMarker> = {};
  // 約2年先まで周期を繰り返し予測
  for (let k = 0; k < 26; k++) {
    const period = addDays(next, avg * k);
    const ovulation = addDays(period, -14);
    // 可能性 低め：排卵5〜4日前・排卵翌日
    markers[addDays(ovulation, -5)] = 'ovu-low';
    markers[addDays(ovulation, -4)] = 'ovu-low';
    markers[addDays(ovulation, 1)]  = 'ovu-low';
    // 中くらい：排卵3日前
    markers[addDays(ovulation, -3)] = 'ovu-mid';
    // 高い：排卵2日前〜排卵日
    markers[addDays(ovulation, -2)] = 'ovu-high';
    markers[addDays(ovulation, -1)] = 'ovu-high';
    markers[ovulation] = 'ovu-high';
    // 生理予定日（最優先で上書き）
    markers[period] = 'period';
  }
  return markers;
}

const MARKER_HEART: Record<CycleMarker, { char: string; color: string; opacity: number }> = {
  'period':   { char: '♥', color: '#e05a7a', opacity: 1 },
  'ovu-high': { char: '♥', color: '#4a7fd4', opacity: 1 },
  'ovu-mid':  { char: '♥', color: '#4a7fd4', opacity: 0.55 },
  'ovu-low':  { char: '♥', color: '#4a7fd4', opacity: 0.28 },
};

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
  // メンテナンスは別データ（maintenanceRecords）から判定する特別枠
  { key: 'maintenance', label: 'メンテナンス', emoji: '💆‍♀️', done: () => false },
];

export default function CalendarView({ records, seiriRecords, maintenanceRecords, onSelectDate }: Props) {
  const today = todayStr();
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [filterKey, setFilterKey] = useState<string | null>(null);

  const filter = FILTER_ITEMS.find(f => f.key === filterKey) ?? null;
  const cycleMarkers = buildCycleMarkers(seiriRecords);
  const maintenanceDates = new Set(maintenanceRecords.map(r => r.date));

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

  // その日がフィルター条件を達成しているか
  const isFilterDone = (key: string): boolean => {
    if (!filter) return false;
    if (filter.key === 'maintenance') return maintenanceDates.has(key);
    const rec = records[key];
    return rec ? filter.done(rec) : false;
  };

  // フィルター中の達成日数カウント
  const doneCount = filter
    ? Array.from({ length: daysInMonth }, (_, i) => dateKey(i + 1))
        .filter(k => isFilterDone(k))
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
            const isDone = isFilterDone(key);
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

          // 通常モード：ポイント色分け＋周期マーカー
          const pts = rec ? calcPoints(rec, getStreak(records, key)) : null;
          const colorClass = pts !== null ? pointsColorClass(pts) : '';
          const marker = cycleMarkers[key];
          const heart = marker ? MARKER_HEART[marker] : null;
          return (
            <button
              key={key}
              className={`cal-day ${colorClass} ${isToday ? 'is-today' : ''} ${isFuture ? 'future' : ''}`}
              onClick={() => !isFuture && onSelectDate(key)}
              disabled={isFuture}
              style={heart && isFuture ? { opacity: 0.85 } : undefined}
            >
              <span className="cal-day-num">{day}</span>
              {(heart || maintenanceDates.has(key)) && (
                <span className="cal-day-heart">
                  {heart && (
                    <span style={{ color: heart.color, opacity: heart.opacity }}>{heart.char}</span>
                  )}
                  {maintenanceDates.has(key) && <span>💆‍♀️</span>}
                </span>
              )}
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
