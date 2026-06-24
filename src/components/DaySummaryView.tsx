import type { DayRecord } from '../types';
import { calcPoints, getStreak } from '../utils';

interface Props {
  date: string;
  record: DayRecord | undefined;
  records: Record<string, DayRecord>;
  onEdit: () => void;
  onBack: () => void;
}

interface Item {
  label: string;
  emoji: string;
  done: boolean;
  sub?: string;
  pts?: number;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
}

function sleepLabel(minutes: number): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

export default function DaySummaryView({ date, record, records, onEdit, onBack }: Props) {
  const streak = getStreak(records, date);
  const points = record ? calcPoints(record, streak) : null;

  const items: Item[] = record ? [
    {
      label: 'お通じ',
      emoji: '☘️',
      done: record.haiBen,
      pts: 5,
    },
    {
      label: '朝ウォーキング',
      emoji: '🌅',
      done: record.asaWalking,
      pts: 5,
    },
    {
      label: '運動',
      emoji: '🏃',
      done: record.nichuUndou,
      pts: 10,
    },
    {
      label: 'おやつ',
      emoji: record.snack === 'none' ? '💪' : record.snack === 'little' ? '🌿' : record.snack === 'ate' ? '🍬' : '—',
      done: record.snack !== '' && record.snack !== undefined,
      sub: record.snack === 'none' ? '我慢できた！' : record.snack === 'little' ? 'すこしだけ' : record.snack === 'ate' ? '食べちゃった' : '未記録',
      pts: record.snack === 'none' ? 5 : record.snack === 'ate' ? -5 : 0,
    },
    {
      label: '睡眠',
      emoji: record.sleepMinutes >= 7 * 60 ? '😴' : record.sleepMinutes >= 6 * 60 ? '😐' : record.sleepMinutes > 0 ? '😵' : '—',
      done: record.sleepMinutes > 0,
      sub: sleepLabel(record.sleepMinutes),
      pts: record.sleepMinutes >= 7 * 60 ? 10 : record.sleepMinutes > 0 && record.sleepMinutes < 6 * 60 ? -10 : 0,
    },
  ] : [];

  return (
    <div className="weight-view">
      <div className="today-header">
        <button className="back-btn" onClick={onBack}>← もどる</button>
        <h2 className="today-title">{formatDateLabel(date)}</h2>
      </div>

      {/* ポイントカード */}
      <div className="weight-main-card" style={{ textAlign: 'center', marginBottom: 14 }}>
        {points !== null ? (
          <>
            <div className="weight-status-label">この日のポイント</div>
            <div className="weight-big-num" style={{ color: points < 0 ? '#e8907a' : '#5c4033' }}>
              {points >= 0 ? `+${points}` : points}
              <span className="weight-big-unit">pt</span>
            </div>
            <div className="weight-sub">{streak}日連続きろく中のボーナス +{Math.min(streak, 5)}pt含む</div>
          </>
        ) : (
          <>
            <div className="weight-status-label">記録なし</div>
            <div className="weight-sub">この日はきろくがありません</div>
          </>
        )}
      </div>

      {/* 項目一覧 */}
      {record && (
        <div className="weight-history" style={{ marginBottom: 14 }}>
          <h3 className="weight-history-title">やったこと</h3>
          {items.map((item, i) => (
            <div
              key={i}
              className="weight-history-row"
              style={{ opacity: item.done ? 1 : 0.35 }}
            >
              <span style={{ fontSize: '1.4rem', marginRight: 10 }}>{item.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#5c4033' }}>{item.label}</div>
                {item.sub && (
                  <div style={{ fontSize: '0.78rem', color: '#9c7b6a' }}>{item.sub}</div>
                )}
              </div>
              {item.pts !== undefined && item.pts !== 0 && item.done && (
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: item.pts > 0 ? '#3a8a4a' : '#c06060',
                  background: item.pts > 0 ? '#d4f0d8' : '#fde8e8',
                  borderRadius: 12,
                  padding: '2px 10px',
                }}>
                  {item.pts > 0 ? `+${item.pts}` : item.pts}pt
                </span>
              )}
              {!item.done && (
                <span style={{ fontSize: '0.78rem', color: '#c0a080' }}>なし</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 編集ボタン */}
      <button
        className="weight-save-btn"
        style={{ width: '100%', padding: '14px', background: '#d4b896' }}
        onClick={onEdit}
      >
        ✏️ この日の記録を編集する
      </button>
    </div>
  );
}
